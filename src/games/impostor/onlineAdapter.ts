import { impostorWords } from '../../data/wordBank';
import type { OnlineGameAction, OnlineGameApplyResult, OnlineGameEnvelope, RoomPlayer } from '../../online/types';
import type { OnlineGameAdapter } from '../online/types';
import { duplicateAction, rememberAction } from '../online/types';

type ImpostorWord = { word: string; hint: string };

type ImpostorPublicState = {
  stage: 'settings' | 'reveal' | 'discussion' | 'vote' | 'result';
  players: Array<{ uid: string; name: string }>;
  hintEnabled: boolean;
  currentRevealIndex: number;
  revealedUids: string[];
  votesByVoter: Record<string, string>;
  result?: { impostorName: string; word: string; voteLeaders: string[]; crowdFoundImpostor: boolean };
};

type ImpostorPrivateState = {
  role: 'impostor' | 'civilian';
  word?: string;
  hint?: string;
};

type ImpostorAction = OnlineGameAction<'SET_HINT' | 'START_REVEAL' | 'MARK_REVEALED' | 'START_VOTE' | 'CAST_VOTE' | 'REVEAL_RESULT', { enabled?: boolean; targetUid?: string }>;

function activePlayers(players: RoomPlayer[]) {
  return players.filter((player) => player.status !== 'left');
}

function voteLeaders(votesByVoter: Record<string, string>) {
  const counts = Object.values(votesByVoter).reduce<Record<string, number>>((acc, uid) => ({ ...acc, [uid]: (acc[uid] ?? 0) + 1 }), {});
  const max = Math.max(0, ...Object.values(counts));
  return Object.entries(counts)
    .filter(([, count]) => count === max && max > 0)
    .map(([uid]) => uid);
}

export const onlineImpostorAdapter: OnlineGameAdapter<ImpostorPublicState, ImpostorPrivateState, ImpostorAction> = {
  gameId: 'impostor',
  protocolVersion: 1,
  minPlayers: 4,
  validateStart(players) {
    return activePlayers(players).length >= 4 ? { ok: true } : { ok: false, code: 'invalid-state', message: 'Impostor online precisa de pelo menos 4 jogadores.' };
  },
  createInitialState(_, players) {
    const active = activePlayers(players);
    const secret = impostorWords[Math.floor(Math.random() * impostorWords.length)] as ImpostorWord;
    const impostor = active[Math.floor(Math.random() * active.length)];
    const publicState: ImpostorPublicState = {
      stage: 'settings',
      players: active.map((player) => ({ uid: player.uid, name: player.name })),
      hintEnabled: false,
      currentRevealIndex: 0,
      revealedUids: [],
      votesByVoter: {},
    };
    const privateStateByPlayer = Object.fromEntries(
      active.map((player) => [
        player.uid,
        player.uid === impostor.uid
          ? { role: 'impostor' as const, hint: secret.hint }
          : { role: 'civilian' as const, word: secret.word },
      ])
    );
    return { publicState, privateStateByPlayer };
  },
  applyAction(state, action, actor, context): OnlineGameApplyResult<ImpostorPublicState, ImpostorPrivateState> {
    const current = state.publicState;
    const isHost = actor.uid === context.hostUid;
    if (duplicateAction(state, action.id) || current.stage === 'result') return { ok: false, code: 'invalid-action', message: 'Ação duplicada ou jogo encerrado.' };
    if (action.type === 'SET_HINT') {
      if (!isHost || current.stage !== 'settings') return { ok: false, code: 'not-host', message: 'Somente o anfitrião altera a dica.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, hintEnabled: Boolean(action.payload?.enabled) }, 'playing') };
    }
    if (action.type === 'START_REVEAL') {
      if (!isHost || current.stage !== 'settings') return { ok: false, code: 'not-host', message: 'Somente o anfitrião inicia a revelação.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, stage: 'reveal' }, 'playing') };
    }
    if (action.type === 'MARK_REVEALED') {
      const expectedUid = current.players[current.currentRevealIndex]?.uid;
      if (current.stage !== 'reveal' || actor.uid !== expectedUid) return { ok: false, code: 'invalid-action', message: 'Aguarde sua vez de revelar.' };
      const nextIndex = current.currentRevealIndex + 1;
      const next = {
        ...current,
        revealedUids: [...current.revealedUids, actor.uid],
        currentRevealIndex: nextIndex,
        stage: nextIndex >= current.players.length ? 'discussion' as const : 'reveal' as const,
      };
      return { ok: true, nextState: rememberAction(state, action.id, next, 'playing') };
    }
    if (action.type === 'START_VOTE') {
      if (!isHost || current.stage !== 'discussion') return { ok: false, code: 'not-host', message: 'Somente o anfitrião inicia a votação.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, stage: 'vote' }, 'playing') };
    }
    if (action.type === 'CAST_VOTE') {
      const targetUid = String(action.payload?.targetUid ?? '');
      if (current.stage !== 'vote' || !current.players.some((player) => player.uid === targetUid) || current.votesByVoter[actor.uid]) {
        return { ok: false, code: 'invalid-action', message: 'Voto inválido ou já registrado.' };
      }
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, votesByVoter: { ...current.votesByVoter, [actor.uid]: targetUid } }, 'playing') };
    }
    if (action.type === 'REVEAL_RESULT') {
      if (!isHost || current.stage !== 'vote') return { ok: false, code: 'not-host', message: 'Somente o anfitrião revela o resultado.' };
      const privateEntries = Object.entries(context.privateStateByPlayer ?? {}) as Array<[string, ImpostorPrivateState]>;
      const impostorUid = privateEntries.find(([, value]) => value.role === 'impostor')?.[0] ?? '';
      const word = privateEntries.find(([, value]) => value.word)?.[1].word ?? '';
      const leaders = voteLeaders(current.votesByVoter);
      const result = {
        impostorName: current.players.find((player) => player.uid === impostorUid)?.name ?? 'Impostor',
        word,
        voteLeaders: leaders.map((uid) => current.players.find((player) => player.uid === uid)?.name ?? uid),
        crowdFoundImpostor: leaders.includes(impostorUid),
      };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, stage: 'result', result }, 'finished') };
    }
    return { ok: false, code: 'invalid-action', message: 'Ação não reconhecida.' };
  },
  getStateForPlayer(state, privateState) {
    return { ...state.publicState, privateState };
  },
  isGameFinished(state) {
    return state.phase === 'finished' || state.publicState.stage === 'result';
  },
};
