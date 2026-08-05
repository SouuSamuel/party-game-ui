import { phraseCutBank } from '../../data/wordBank';
import { getRandomPhraseCutWord } from '../../utils/gameUtils';
import type { OnlineGameAction, OnlineGameApplyResult, RoomPlayer } from '../../online/types';
import type { OnlineGameAdapter } from '../online/types';
import { duplicateAction, rememberAction } from '../online/types';

type PhraseWord = { category: string; word: string };

type PhraseCutPublicState = {
  stage: 'setup' | 'playing' | 'finished';
  players: Array<{ uid: string; name: string }>;
  guesserUid?: string;
  clockOwnerUid?: string;
  timeLimit: number;
  timeLeft: number;
  score: number;
  correctWords: string[];
};

type PhraseCutPrivateState = { currentWord?: PhraseWord };

type PhraseCutAction = OnlineGameAction<'SET_GUESSER' | 'SET_TIME' | 'START' | 'TICK' | 'CORRECT' | 'FINISH', { guesserUid?: string; timeLimit?: number }>;

function activePlayers(players: RoomPlayer[]) {
  return players.filter((player) => player.status !== 'left');
}

function nextWord() {
  return getRandomPhraseCutWord(phraseCutBank) as PhraseWord;
}

function privateForClueGivers(players: Array<{ uid: string }>, guesserUid: string | undefined, word: PhraseWord | undefined) {
  return Object.fromEntries(players.map((player) => [player.uid, player.uid !== guesserUid ? { currentWord: word } : null]));
}

export const onlinePhraseCutAdapter: OnlineGameAdapter<PhraseCutPublicState, PhraseCutPrivateState, PhraseCutAction> = {
  gameId: 'frase',
  protocolVersion: 1,
  minPlayers: 3,
  validateStart(players) {
    return activePlayers(players).length >= 3 ? { ok: true } : { ok: false, code: 'invalid-state', message: 'Frase Cortada online precisa de pelo menos 3 jogadores.' };
  },
  createInitialState(_, players) {
    return {
      publicState: {
        stage: 'setup',
        players: activePlayers(players).map((player) => ({ uid: player.uid, name: player.name })),
        timeLimit: 60,
        timeLeft: 60,
        score: 0,
        correctWords: [],
      },
    };
  },
  applyAction(state, action, actor, context): OnlineGameApplyResult<PhraseCutPublicState, PhraseCutPrivateState> {
    const current = state.publicState;
    const isHost = actor.uid === context.hostUid;
    const isClueGiver = actor.uid !== current.guesserUid;
    if (duplicateAction(state, action.id) || current.stage === 'finished') return { ok: false, code: 'invalid-action', message: 'Ação duplicada ou jogo encerrado.' };
    if (action.type === 'SET_GUESSER') {
      const guesserUid = String(action.payload?.guesserUid ?? '');
      if (!isHost || current.stage !== 'setup' || !current.players.some((player) => player.uid === guesserUid)) return { ok: false, code: 'not-host', message: 'Somente o anfitrião escolhe quem adivinha.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, guesserUid }, 'playing') };
    }
    if (action.type === 'SET_TIME') {
      if (!isHost || current.stage !== 'setup') return { ok: false, code: 'not-host', message: 'Somente o anfitrião altera o tempo.' };
      const timeLimit = Math.max(30, Math.min(180, Number(action.payload?.timeLimit ?? 60)));
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, timeLimit, timeLeft: timeLimit }, 'playing') };
    }
    if (action.type === 'START') {
      if (!isHost || current.stage !== 'setup' || !current.guesserUid) return { ok: false, code: 'invalid-state', message: 'Escolha quem vai adivinhar antes de começar.' };
      const word = nextWord();
      const publicState = { ...current, stage: 'playing' as const, clockOwnerUid: current.players.find((player) => player.uid !== current.guesserUid)?.uid, timeLeft: current.timeLimit, score: 0, correctWords: [] };
      return { ok: true, nextState: rememberAction(state, action.id, publicState, 'playing'), privateStateByPlayer: privateForClueGivers(current.players, current.guesserUid, word) };
    }
    if (action.type === 'TICK') {
      if (current.stage !== 'playing' || actor.uid !== current.clockOwnerUid) return { ok: false, code: 'invalid-action', message: 'Cronômetro fora de jogo.' };
      const timeLeft = Math.max(0, current.timeLeft - 1);
      const publicState = timeLeft === 0 ? { ...current, timeLeft, stage: 'finished' as const } : { ...current, timeLeft };
      return { ok: true, nextState: rememberAction(state, action.id, publicState, timeLeft === 0 ? 'finished' : 'playing') };
    }
    if (action.type === 'CORRECT') {
      const actorPrivate = context.privateStateByPlayer?.[actor.uid] as PhraseCutPrivateState | undefined;
      if (current.stage !== 'playing' || !isClueGiver || !actorPrivate?.currentWord) return { ok: false, code: 'invalid-action', message: 'Somente quem dá dicas pode marcar acerto.' };
      const word = actorPrivate.currentWord;
      const next = nextWord();
      const publicState = { ...current, score: current.score + 1, correctWords: [...current.correctWords, word.word] };
      return { ok: true, nextState: rememberAction(state, action.id, publicState, 'playing'), privateStateByPlayer: privateForClueGivers(current.players, current.guesserUid, next) };
    }
    if (action.type === 'FINISH') {
      if (!isHost && !isClueGiver) return { ok: false, code: 'invalid-action', message: 'Ação não permitida.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, stage: 'finished' }, 'finished') };
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
