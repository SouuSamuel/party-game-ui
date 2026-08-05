import type { OnlineGameAction, OnlineGameApplyResult, OnlineGameEnvelope, OnlineParticipant } from '../../online/types';
import type { OnlineGameAdapter, OnlineGameContext } from '../online/types';
import { duplicateAction, rememberAction } from '../online/types';

type Pair = [string, string];

export type OnlineNotePublicState = {
  round: number;
  roundsCount: number;
  pairs: Pair[];
  revealedByPair: Record<number, boolean>;
  guesses: Record<number, number>;
  results: Array<{
    round: number;
    pairs: Array<{ pairIndex: number; ownerUid: string; guesserUid: string; note: number; guess: number; correct: boolean }>;
  }>;
  scores: Record<string, number>;
  winnerUids: string[];
  stage: 'reveal' | 'guess' | 'roundResult' | 'gameOver';
};

export type OnlineNotePrivateState = {
  notesByPair: Record<number, number>;
};

type OnlineNoteAction = OnlineGameAction<
  'REVEAL_NOTE' | 'HIDE_NOTE' | 'GO_TO_GUESSES' | 'SUBMIT_GUESS' | 'FINISH_ROUND' | 'NEXT_ROUND' | 'END_GAME',
  { pairIndex?: number; guess?: number }
>;

function activePlayers(players: OnlineParticipant[]) {
  return players.filter((player) => player.status !== 'left');
}

function createPairs(players: OnlineParticipant[]): Pair[] {
  const active = activePlayers(players);
  const pairs: Pair[] = [];
  for (let index = 0; index < active.length; index += 2) {
    if (active[index] && active[index + 1]) pairs.push([active[index].uid, active[index + 1].uid]);
  }
  return pairs;
}

function createRoundNotes(pairCount: number, random = Math.random) {
  const notes = Array.from({ length: 11 }, (_, index) => index);
  for (let index = notes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [notes[index], notes[swapIndex]] = [notes[swapIndex], notes[index]];
  }
  return notes.slice(0, pairCount);
}

function roles(pair: Pair, roundIndex: number) {
  return {
    ownerUid: pair[roundIndex % 2],
    guesserUid: pair[(roundIndex + 1) % 2],
  };
}

function privateNotesForPlayers(state: OnlineNotePublicState, notes: number[]) {
  const privateStateByPlayer: Record<string, OnlineNotePrivateState> = {};
  state.pairs.forEach((pair, pairIndex) => {
    const { ownerUid } = roles(pair, state.round - 1);
    privateStateByPlayer[ownerUid] = {
      notesByPair: {
        ...(privateStateByPlayer[ownerUid]?.notesByPair ?? {}),
        [pairIndex]: notes[pairIndex],
      },
    };
  });
  return privateStateByPlayer;
}

function finishGame(publicState: OnlineNotePublicState) {
  const best = Math.max(...Object.values(publicState.scores));
  return {
    ...publicState,
    stage: 'gameOver' as const,
    winnerUids: Object.entries(publicState.scores)
      .filter(([, score]) => score === best)
      .map(([uid]) => uid),
  };
}

export const onlineNoteAdapter: OnlineGameAdapter<OnlineNotePublicState, OnlineNotePrivateState, OnlineNoteAction, { roundsCount?: number }> = {
  gameId: 'nota',
  protocolVersion: 1,
  minPlayers: 4,
  maxPlayers: 22,
  validateStart(players) {
    const active = activePlayers(players);
    if (active.length < 4 || active.length % 2 !== 0) {
      return { ok: false, code: 'invalid-state', message: 'Adivinhe a Nota online precisa de pelo menos 4 jogadores e número par.' };
    }
    if (active.length > 22) {
      return { ok: false, code: 'invalid-state', message: 'Adivinhe a Nota online aceita no máximo 22 jogadores.' };
    }
    return { ok: true };
  },
  createInitialState(config, players) {
    const pairs = createPairs(players);
    const roundsCount = Math.max(1, Math.min(10, Number(config?.roundsCount ?? 3)));
    const publicState: OnlineNotePublicState = {
      round: 1,
      roundsCount,
      pairs,
      revealedByPair: {},
      guesses: {},
      results: [],
      scores: Object.fromEntries(activePlayers(players).map((player) => [player.uid, 0])),
      winnerUids: [],
      stage: 'reveal',
    };
    return { publicState, privateStateByPlayer: privateNotesForPlayers(publicState, createRoundNotes(pairs.length)) };
  },
  applyAction(state, action, actor, context): OnlineGameApplyResult<OnlineNotePublicState, OnlineNotePrivateState> {
    const current = state.publicState;
    if (duplicateAction(state, action.id) || current.stage === 'gameOver') {
      return { ok: false, code: 'invalid-action', message: 'Ação já processada ou partida encerrada.' };
    }
    const pairIndex = Number(action.payload?.pairIndex);
    const pair = current.pairs[pairIndex];
    const isHost = actor.uid === context.hostUid;
    if (action.type === 'REVEAL_NOTE' || action.type === 'HIDE_NOTE') {
      const ownerUid = pair ? roles(pair, current.round - 1).ownerUid : '';
      if (current.stage !== 'reveal' || ownerUid !== actor.uid) return { ok: false, code: 'invalid-action', message: 'Somente o dono da nota pode revelar este cartão.' };
      const publicState = { ...current, revealedByPair: { ...current.revealedByPair, [pairIndex]: action.type === 'REVEAL_NOTE' } };
      return { ok: true, nextState: rememberAction(state, action.id, publicState, 'playing') };
    }
    if (action.type === 'GO_TO_GUESSES') {
      if (!isHost || current.stage !== 'reveal') return { ok: false, code: 'not-host', message: 'Somente o anfitrião avança para as tentativas.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, stage: 'guess' }, 'playing') };
    }
    if (action.type === 'SUBMIT_GUESS') {
      const guess = Number(action.payload?.guess);
      if (current.stage !== 'guess' || !pair?.includes(actor.uid) || guess < 0 || guess > 10) return { ok: false, code: 'invalid-action', message: 'Palpite inválido agora.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, guesses: { ...current.guesses, [pairIndex]: guess } }, 'playing') };
    }
    if (action.type === 'FINISH_ROUND') {
      if (!isHost || current.stage !== 'guess') return { ok: false, code: 'not-host', message: 'Somente o anfitrião finaliza a rodada.' };
      if (!current.pairs.every((_, index) => current.guesses[index] !== undefined)) return { ok: false, code: 'invalid-state', message: 'Todas as duplas precisam responder.' };
      const roundResult = {
        round: current.round,
        pairs: current.pairs.map((roundPair, index) => {
          const { ownerUid, guesserUid } = roles(roundPair, current.round - 1);
          const ownerPrivate = context.privateStateByPlayer?.[ownerUid] as OnlineNotePrivateState | undefined;
          const note = ownerPrivate?.notesByPair[index] ?? -1;
          const guess = current.guesses[index];
          return { pairIndex: index, ownerUid, guesserUid, note, guess, correct: guess === note };
        }),
      };
      const scores = { ...current.scores };
      roundResult.pairs.forEach((result) => {
        if (result.correct) scores[result.guesserUid] = (scores[result.guesserUid] ?? 0) + 1;
      });
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, stage: 'roundResult', results: [...current.results, roundResult], scores }, 'playing') };
    }
    if (action.type === 'NEXT_ROUND') {
      if (!isHost || current.stage !== 'roundResult') return { ok: false, code: 'not-host', message: 'Somente o anfitrião avança a rodada.' };
      if (current.round >= current.roundsCount) {
        return { ok: true, nextState: rememberAction(state, action.id, finishGame(current), 'finished') };
      }
      const nextPublic = { ...current, stage: 'reveal' as const, round: current.round + 1, revealedByPair: {}, guesses: {} };
      return { ok: true, nextState: rememberAction(state, action.id, nextPublic, 'playing'), privateStateByPlayer: privateNotesForPlayers(nextPublic, createRoundNotes(nextPublic.pairs.length)) };
    }
    if (action.type === 'END_GAME') {
      if (!isHost) return { ok: false, code: 'not-host', message: 'Somente o anfitrião encerra o jogo.' };
      return { ok: true, nextState: rememberAction(state, action.id, finishGame(current), 'finished') };
    }
    return { ok: false, code: 'invalid-action', message: 'Ação não reconhecida.' };
  },
  getStateForPlayer(state, privateState) {
    return { ...state.publicState, privateState };
  },
  isGameFinished(state) {
    return state.phase === 'finished' || state.publicState.stage === 'gameOver';
  },
};
