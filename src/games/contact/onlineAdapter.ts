import { contactWords } from '../../data/wordBank';
import type { OnlineGameAction, OnlineGameApplyResult, RoomPlayer } from '../../online/types';
import type { OnlineGameAdapter } from '../online/types';
import { duplicateAction, rememberAction } from '../online/types';

type ContactPublicState = {
  stage: 'selectMaster' | 'control' | 'finished';
  players: Array<{ uid: string; name: string }>;
  masterUid?: string;
  wordLength?: number;
  revealedLetters: number;
  maskedWord: string;
  answer?: string;
};

type ContactPrivateState = { secretWord?: string };

type ContactAction = OnlineGameAction<'CHOOSE_MASTER' | 'REVEAL_NEXT' | 'SHOW_ANSWER' | 'NEW_WORD', { masterUid?: string }>;

function activePlayers(players: RoomPlayer[]) {
  return players.filter((player) => player.status !== 'left');
}

function mask(word: string, revealed: number) {
  return Array.from(word).map((letter, index) => (index < revealed ? letter.toUpperCase() : '_')).join(' ');
}

function randomWord() {
  return String(contactWords[Math.floor(Math.random() * contactWords.length)]);
}

function privateForMaster(players: Array<{ uid: string }>, masterUid: string, secretWord: string) {
  return Object.fromEntries(players.map((player) => [player.uid, player.uid === masterUid ? { secretWord } : null]));
}

export const onlineContactAdapter: OnlineGameAdapter<ContactPublicState, ContactPrivateState, ContactAction> = {
  gameId: 'contato',
  protocolVersion: 1,
  minPlayers: 3,
  validateStart(players) {
    return activePlayers(players).length >= 3 ? { ok: true } : { ok: false, code: 'invalid-state', message: 'Contato online precisa de pelo menos 3 jogadores.' };
  },
  createInitialState(_, players) {
    return {
      publicState: {
        stage: 'selectMaster',
        players: activePlayers(players).map((player) => ({ uid: player.uid, name: player.name })),
        revealedLetters: 0,
        maskedWord: '',
      },
    };
  },
  applyAction(state, action, actor, context): OnlineGameApplyResult<ContactPublicState, ContactPrivateState> {
    const current = state.publicState;
    if (duplicateAction(state, action.id) || current.stage === 'finished') return { ok: false, code: 'invalid-action', message: 'Ação duplicada ou jogo encerrado.' };
    const isHost = actor.uid === context.hostUid;
    const isMaster = actor.uid === current.masterUid;
    if (action.type === 'CHOOSE_MASTER') {
      const masterUid = String(action.payload?.masterUid ?? '');
      if (!isHost || current.stage !== 'selectMaster' || !current.players.some((player) => player.uid === masterUid)) {
        return { ok: false, code: 'not-host', message: 'Somente o anfitrião escolhe o mestre.' };
      }
      const secretWord = randomWord();
      const publicState = { ...current, stage: 'control' as const, masterUid, wordLength: secretWord.length, revealedLetters: 0, maskedWord: mask(secretWord, 0), answer: undefined };
      return { ok: true, nextState: rememberAction(state, action.id, publicState, 'playing'), privateStateByPlayer: privateForMaster(current.players, masterUid, secretWord) };
    }
    const masterPrivate = context.privateStateByPlayer?.[current.masterUid ?? ''] as ContactPrivateState | undefined;
    const secretWord = masterPrivate?.secretWord ?? '';
    if ((action.type === 'REVEAL_NEXT' || action.type === 'SHOW_ANSWER' || action.type === 'NEW_WORD') && !isMaster && !isHost) {
      return { ok: false, code: 'invalid-action', message: 'Somente o mestre ou anfitrião controla a palavra.' };
    }
    if (action.type === 'REVEAL_NEXT') {
      const revealedLetters = Math.min((current.revealedLetters ?? 0) + 1, secretWord.length);
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, revealedLetters, maskedWord: mask(secretWord, revealedLetters) }, 'playing') };
    }
    if (action.type === 'SHOW_ANSWER') {
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, revealedLetters: secretWord.length, maskedWord: mask(secretWord, secretWord.length), answer: secretWord, stage: 'finished' }, 'finished') };
    }
    if (action.type === 'NEW_WORD') {
      const nextWord = randomWord();
      const publicState = { ...current, revealedLetters: 0, wordLength: nextWord.length, maskedWord: mask(nextWord, 0), answer: undefined, stage: 'control' as const };
      return { ok: true, nextState: rememberAction(state, action.id, publicState, 'playing'), privateStateByPlayer: privateForMaster(current.players, current.masterUid ?? actor.uid, nextWord) };
    }
    return { ok: false, code: 'invalid-action', message: 'Ação não reconhecida.' };
  },
  getStateForPlayer(state, privateState) {
    return { ...state.publicState, privateState };
  },
  isGameFinished(state) {
    return state.phase === 'finished' || state.publicState.stage === 'finished';
  },
};
