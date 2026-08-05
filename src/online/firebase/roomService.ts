import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { getAnonymousIdentity } from '../../config/firebase';
import { normalizeGameId } from '../../games/registry';
import { getOnlineGameAdapter } from '../../games/online/registry';
import { createCompositeUnsubscribe } from '../listeners';
import { clearLastOnlineSession, saveLastOnlineSession } from '../localSession';
import { canJoinRoom, canStartGame, chooseNextHost, cleanPlayerName, DEFAULT_MAX_ONLINE_PARTICIPANTS, generateRoomCode, normalizeRoomCode } from '../model/roomRules';
import type { OnlineCommandResult, OnlineGameAction, OnlineGameEnvelope, OnlineGameId, OnlineParticipant, OnlineRoom, OnlineRoomSnapshot } from '../types';

type FirestoreRoom = Omit<OnlineRoom, 'createdAt' | 'updatedAt' | 'endedAt'> & {
  createdAt?: { toMillis: () => number };
  updatedAt?: { toMillis: () => number };
  endedAt?: { toMillis: () => number };
};

type FirestoreParticipant = Omit<OnlineParticipant, 'joinedAt' | 'lastSeenAt'> & {
  joinedAt?: { toMillis: () => number };
  lastSeenAt?: { toMillis: () => number };
};

export type OnlineRoomService = {
  createRoom: (playerName: string) => Promise<{ roomId: string; code: string; uid: string }>;
  joinRoom: (code: string, playerName: string) => Promise<{ roomId: string; code: string; uid: string } | OnlineCommandResult>;
  reconnect: (roomId: string, playerName: string) => Promise<OnlineCommandResult>;
  leaveRoom: (roomId: string) => Promise<void>;
  endRoom: (roomId: string) => Promise<OnlineCommandResult>;
  selectGame: (roomId: string, gameId: OnlineGameId) => Promise<OnlineCommandResult>;
  startGame: (roomId: string, gameId: OnlineGameId, config?: unknown) => Promise<OnlineCommandResult>;
  sendGameAction: (roomId: string, action: OnlineGameAction) => Promise<OnlineCommandResult>;
  watchRoom: (roomId: string, callback: (snapshot?: OnlineRoomSnapshot) => void) => Unsubscribe;
  watchPrivateState: (roomId: string, uid: string, callback: (state?: unknown) => void) => Unsubscribe;
  heartbeat: (roomId: string) => Promise<void>;
};

function toMillis(value: { toMillis: () => number } | undefined) {
  return value?.toMillis() ?? Date.now();
}

function mapRoom(id: string, data: FirestoreRoom): OnlineRoom {
  return {
    id,
    code: data.code,
    hostUid: data.hostUid,
    status: data.status,
    selectedGameId: data.selectedGameId,
    maxParticipants: data.maxParticipants,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    endedAt: data.endedAt ? toMillis(data.endedAt) : undefined,
    gameState: data.gameState,
    gameConfig: data.gameConfig,
  };
}

function mapParticipant(uid: string, data: FirestoreParticipant): OnlineParticipant {
  return {
    uid,
    name: data.name,
    isHost: data.isHost,
    status: data.status,
    joinedAt: toMillis(data.joinedAt),
    lastSeenAt: toMillis(data.lastSeenAt),
  };
}

async function getRoomParticipants(db: Firestore, roomId: string) {
  const snapshot = await getDocs(collection(db, 'rooms', roomId, 'participants'));
  return snapshot.docs.map((participantDoc) => mapParticipant(participantDoc.id, participantDoc.data() as FirestoreParticipant));
}

async function getPrivateStateByPlayer(db: Firestore, roomId: string) {
  const snapshot = await getDocs(collection(db, 'rooms', roomId, 'privateStates'));
  return Object.fromEntries(snapshot.docs.map((privateDoc) => [privateDoc.id, privateDoc.data().state as unknown]));
}

async function createUniqueCode(db: Firestore) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateRoomCode();
    const codeSnapshot = await getDoc(doc(db, 'roomCodes', code));
    if (!codeSnapshot.exists()) return code;
  }
  throw new Error('Nao foi possivel gerar um codigo de sala.');
}

export function createFirestoreRoomService(db: Firestore): OnlineRoomService {
  async function createRoom(playerName: string) {
    const identity = await getAnonymousIdentity();
    const cleanName = cleanPlayerName(playerName);
    if (!cleanName) throw new Error('Informe seu nome para criar uma sala.');
    const roomRef = doc(collection(db, 'rooms'));
    const code = await createUniqueCode(db);

    await runTransaction(db, async (transaction) => {
      const codeRef = doc(db, 'roomCodes', code);
      const codeSnapshot = await transaction.get(codeRef);
      if (codeSnapshot.exists()) throw new Error('Codigo em uso. Tente novamente.');
      transaction.set(roomRef, {
        code,
        hostUid: identity.uid,
        status: 'waiting',
        selectedGameId: 'nota',
        maxParticipants: DEFAULT_MAX_ONLINE_PARTICIPANTS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.set(codeRef, {
        roomId: roomRef.id,
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
      transaction.set(doc(db, 'rooms', roomRef.id, 'participants', identity.uid), {
        name: cleanName,
        isHost: true,
        status: 'online',
        joinedAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
    });

    await saveLastOnlineSession({ roomId: roomRef.id, code, uid: identity.uid, playerName: cleanName });
    return { roomId: roomRef.id, code, uid: identity.uid };
  }

  async function joinRoom(codeInput: string, playerName: string) {
    const identity = await getAnonymousIdentity();
    const cleanName = cleanPlayerName(playerName);
    const code = normalizeRoomCode(codeInput);
    if (!cleanName) return { ok: false as const, code: 'invalid-action' as const, message: 'Informe seu nome para entrar.' };

    const codeSnapshot = await getDoc(doc(db, 'roomCodes', code));
    if (!codeSnapshot.exists()) return { ok: false as const, code: 'not-found' as const, message: 'Sala nao encontrada. Confira o codigo.' };
    const roomId = codeSnapshot.data().roomId as string;

    const result = await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await transaction.get(roomRef);
      const room = roomSnapshot.exists() ? mapRoom(roomSnapshot.id, roomSnapshot.data() as FirestoreRoom) : undefined;
      const participants = await getRoomParticipants(db, roomId);
      const permission = canJoinRoom(room, participants, identity.uid, cleanName);
      if (!permission.ok) return permission;

      const existingParticipant = participants.find((participant) => participant.uid === identity.uid);
      transaction.set(
        doc(db, 'rooms', roomId, 'participants', identity.uid),
        {
          name: cleanName,
          isHost: existingParticipant?.isHost ?? false,
          status: 'online',
          joinedAt: existingParticipant ? existingParticipant.joinedAt : serverTimestamp(),
          lastSeenAt: serverTimestamp(),
        },
        { merge: true }
      );
      transaction.update(roomRef, { updatedAt: serverTimestamp() });
      return { ok: true as const };
    });

    if (!result.ok) return result;
    await saveLastOnlineSession({ roomId, code, uid: identity.uid, playerName: cleanName });
    return { roomId, code, uid: identity.uid };
  }

  async function reconnect(roomId: string, playerName: string) {
    const identity = await getAnonymousIdentity();
    const roomSnapshot = await getDoc(doc(db, 'rooms', roomId));
    if (!roomSnapshot.exists()) return { ok: false as const, code: 'not-found' as const, message: 'Sala nao encontrada.' };
    await setDoc(
      doc(db, 'rooms', roomId, 'participants', identity.uid),
      {
        name: cleanPlayerName(playerName),
        status: 'online',
        lastSeenAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true as const };
  }

  async function leaveRoom(roomId: string) {
    const identity = await getAnonymousIdentity();
    await runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await transaction.get(roomRef);
      if (!roomSnapshot.exists()) return;
      const room = mapRoom(roomSnapshot.id, roomSnapshot.data() as FirestoreRoom);
      const participants = await getRoomParticipants(db, roomId);
      const nextHostUid = room.hostUid === identity.uid ? chooseNextHost(participants, identity.uid) : room.hostUid;
      transaction.set(doc(db, 'rooms', roomId, 'participants', identity.uid), { status: 'left', isHost: false, lastSeenAt: serverTimestamp() }, { merge: true });
      if (!nextHostUid) {
        transaction.update(roomRef, { status: 'ended', endedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else if (nextHostUid !== room.hostUid) {
        transaction.update(roomRef, { hostUid: nextHostUid, updatedAt: serverTimestamp() });
        transaction.set(doc(db, 'rooms', roomId, 'participants', nextHostUid), { isHost: true, lastSeenAt: serverTimestamp() }, { merge: true });
      }
    });
    await clearLastOnlineSession();
  }

  async function endRoom(roomId: string) {
    const identity = await getAnonymousIdentity();
    return runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await transaction.get(roomRef);
      if (!roomSnapshot.exists()) return { ok: false as const, code: 'not-found' as const, message: 'Sala nao encontrada.' };
      const room = mapRoom(roomSnapshot.id, roomSnapshot.data() as FirestoreRoom);
      if (room.hostUid !== identity.uid) return { ok: false as const, code: 'not-host' as const, message: 'Somente o anfitriao pode encerrar.' };
      transaction.update(roomRef, { status: 'ended', endedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      transaction.set(doc(db, 'roomCodes', room.code), { status: 'ended', updatedAt: serverTimestamp() }, { merge: true });
      return { ok: true as const };
    });
  }

  async function selectGame(roomId: string, gameId: OnlineGameId) {
    const identity = await getAnonymousIdentity();
    return runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await transaction.get(roomRef);
      if (!roomSnapshot.exists()) return { ok: false as const, code: 'not-found' as const, message: 'Sala nao encontrada.' };
      const room = mapRoom(roomSnapshot.id, roomSnapshot.data() as FirestoreRoom);
      if (room.hostUid !== identity.uid) return { ok: false as const, code: 'not-host' as const, message: 'Somente o anfitriao escolhe o jogo.' };
      if (room.status !== 'waiting' && room.status !== 'lobby' && room.status !== 'configuring') return { ok: false as const, code: 'already-started' as const, message: 'A partida ja comecou.' };
      transaction.update(roomRef, { selectedGameId: normalizeGameId(gameId), status: 'configuring', updatedAt: serverTimestamp() });
      return { ok: true as const };
    });
  }

  async function startGame(roomId: string, gameId: OnlineGameId, config?: unknown) {
    const identity = await getAnonymousIdentity();
    return runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await transaction.get(roomRef);
      if (!roomSnapshot.exists()) return { ok: false as const, code: 'not-found' as const, message: 'Sala nao encontrada.' };
      const room = mapRoom(roomSnapshot.id, roomSnapshot.data() as FirestoreRoom);
      const participants = await getRoomParticipants(db, roomId);
      const normalizedGameId = normalizeGameId(gameId);
      const permission = canStartGame(room, participants, identity.uid, normalizedGameId);
      if (!permission.ok) return permission;

      const adapter = getOnlineGameAdapter(normalizedGameId);
      const adapterPermission = adapter.validateStart(participants, config);
      if (!adapterPermission.ok) return adapterPermission;
      const initial = adapter.createInitialState(config, participants, identity.uid);
      const gameState: OnlineGameEnvelope = {
        gameId: normalizedGameId,
        protocolVersion: adapter.protocolVersion,
        phase: 'playing',
        sequence: 0,
        processedActionIds: [],
        publicState: initial.publicState,
      };

      transaction.update(roomRef, {
        status: 'playing',
        selectedGameId: normalizedGameId,
        gameState,
        gameConfig: config ?? null,
        updatedAt: serverTimestamp(),
      });
      Object.entries(initial.privateStateByPlayer ?? {}).forEach(([uid, state]) => {
        transaction.set(doc(db, 'rooms', roomId, 'privateStates', uid), { state, updatedAt: serverTimestamp() });
      });
      return { ok: true as const };
    });
  }

  async function sendGameAction(roomId: string, action: OnlineGameAction) {
    const identity = await getAnonymousIdentity();
    if (identity.uid !== action.uid) return { ok: false as const, code: 'invalid-action' as const, message: 'Comando invalido para este jogador.' };

    return runTransaction(db, async (transaction) => {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnapshot = await transaction.get(roomRef);
      if (!roomSnapshot.exists()) return { ok: false as const, code: 'not-found' as const, message: 'Sala nao encontrada.' };
      const room = mapRoom(roomSnapshot.id, roomSnapshot.data() as FirestoreRoom);
      if (room.status !== 'playing' || !room.gameState) return { ok: false as const, code: 'invalid-state' as const, message: 'A partida online nao esta ativa.' };
      if (action.expectedSequence !== undefined && action.expectedSequence !== room.gameState.sequence) {
        return { ok: false as const, code: 'invalid-state' as const, message: 'O estado mudou. Atualize a tela e tente novamente.' };
      }

      const actionRef = doc(db, 'rooms', roomId, 'actions', action.id);
      const actionSnapshot = await transaction.get(actionRef);
      if (actionSnapshot.exists()) return { ok: true as const };

      const participants = await getRoomParticipants(db, roomId);
      const actor = participants.find((participant) => participant.uid === identity.uid && participant.status !== 'left');
      if (!actor) return { ok: false as const, code: 'not-participant' as const, message: 'Voce nao esta nesta sala.' };
      const adapter = getOnlineGameAdapter(normalizeGameId(room.gameState.gameId));
      if (adapter.protocolVersion !== room.gameState.protocolVersion) {
        return { ok: false as const, code: 'incompatible-version' as const, message: 'Atualize o aplicativo para continuar esta partida.' };
      }

      const privateStateByPlayer = await getPrivateStateByPlayer(db, roomId);
      const result = adapter.applyAction(room.gameState, action, actor, { hostUid: room.hostUid, players: participants, privateStateByPlayer });
      if (!result.ok) return result;
      const finished = adapter.isGameFinished(result.nextState);
      transaction.update(roomRef, {
        gameState: result.nextState,
        status: finished ? 'finished' : 'playing',
        updatedAt: serverTimestamp(),
      });
      Object.entries(result.privateStateByPlayer ?? {}).forEach(([uid, state]) => {
        transaction.set(doc(db, 'rooms', roomId, 'privateStates', uid), { state, updatedAt: serverTimestamp() });
      });
      transaction.set(actionRef, { uid: action.uid, type: action.type, sequence: result.nextState.sequence, createdAt: serverTimestamp() });
      return { ok: true as const };
    });
  }

  function watchRoom(roomId: string, callback: (snapshot?: OnlineRoomSnapshot) => void) {
    let latestRoom: OnlineRoom | undefined;
    let latestParticipants: OnlineParticipant[] = [];
    const emit = () => {
      if (latestRoom) callback({ room: latestRoom, participants: latestParticipants });
    };

    const roomUnsubscribe = onSnapshot(doc(db, 'rooms', roomId), (roomSnapshot) => {
      if (!roomSnapshot.exists()) {
        callback(undefined);
        return;
      }
      latestRoom = mapRoom(roomSnapshot.id, roomSnapshot.data() as FirestoreRoom);
      emit();
    });

    const participantsQuery = query(collection(db, 'rooms', roomId, 'participants'), where('status', '!=', 'left'));
    const participantsUnsubscribe = onSnapshot(participantsQuery, (participantsSnapshot) => {
      latestParticipants = participantsSnapshot.docs.map((participantDoc) => mapParticipant(participantDoc.id, participantDoc.data() as FirestoreParticipant));
      emit();
    });

    return createCompositeUnsubscribe([roomUnsubscribe, participantsUnsubscribe]);
  }

  function watchPrivateState(roomId: string, uid: string, callback: (state?: unknown) => void) {
    return onSnapshot(doc(db, 'rooms', roomId, 'privateStates', uid), (privateSnapshot) => {
      callback(privateSnapshot.exists() ? privateSnapshot.data().state : undefined);
    });
  }

  async function heartbeat(roomId: string) {
    const identity = await getAnonymousIdentity();
    await updateDoc(doc(db, 'rooms', roomId, 'participants', identity.uid), {
      status: 'online',
      lastSeenAt: serverTimestamp(),
    });
  }

  return {
    createRoom,
    joinRoom,
    reconnect,
    leaveRoom,
    endRoom,
    selectGame,
    startGame,
    sendGameAction,
    watchRoom,
    watchPrivateState,
    heartbeat,
  };
}
