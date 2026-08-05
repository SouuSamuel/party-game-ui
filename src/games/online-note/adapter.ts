import type { OnlineParticipant } from '../../online/types';
import type { OnlineNoteCommand, OnlineNotePair, OnlineNoteRoundResult, OnlineNoteState } from './types';

export function createOnlineNotePairs(participants: OnlineParticipant[]): OnlineNotePair[] {
  const active = participants.filter((participant) => participant.status !== 'left');
  const pairs: OnlineNotePair[] = [];
  for (let index = 0; index < active.length; index += 2) {
    if (active[index] && active[index + 1]) {
      pairs.push([active[index].uid, active[index + 1].uid]);
    }
  }
  return pairs;
}

export function createRoundNotes(pairCount: number, random = Math.random) {
  const notes = Array.from({ length: 11 }, (_, index) => index);
  for (let index = notes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [notes[index], notes[swapIndex]] = [notes[swapIndex], notes[index]];
  }
  return notes.slice(0, pairCount);
}

export function getOnlineNoteRoles(pair: OnlineNotePair, roundIndex: number) {
  return {
    ownerUid: pair[roundIndex % 2],
    guesserUid: pair[(roundIndex + 1) % 2],
  };
}

export function createOnlineNoteState(participants: OnlineParticipant[], roundsCount = 3, random = Math.random): OnlineNoteState {
  const pairs = createOnlineNotePairs(participants);
  const scores = Object.fromEntries(participants.filter((participant) => participant.status !== 'left').map((participant) => [participant.uid, 0]));
  return {
    phase: 'reveal',
    round: 1,
    roundsCount,
    pairs,
    notes: createRoundNotes(pairs.length, random),
    revealedByPair: {},
    guesses: {},
    results: [],
    scores,
    commandVersion: 0,
    winnerUids: [],
  };
}

export function findPairIndexByUid(state: OnlineNoteState, uid: string) {
  return state.pairs.findIndex((pair) => pair.includes(uid));
}

function isHost(uid: string, hostUid: string) {
  return uid === hostUid;
}

function finishGame(state: OnlineNoteState): OnlineNoteState {
  const maxScore = Math.max(...Object.values(state.scores));
  const winnerUids = Object.entries(state.scores)
    .filter(([, score]) => score === maxScore)
    .map(([uid]) => uid);
  return { ...state, phase: 'gameOver', winnerUids, commandVersion: state.commandVersion + 1 };
}

export function applyOnlineNoteCommand(state: OnlineNoteState, command: OnlineNoteCommand, hostUid: string, random = Math.random): OnlineNoteState {
  if (state.phase === 'gameOver') return state;

  switch (command.type) {
    case 'REVEAL_NOTE': {
      const pair = state.pairs[command.pairIndex];
      if (state.phase !== 'reveal' || !pair?.includes(command.uid)) return state;
      return { ...state, revealedByPair: { ...state.revealedByPair, [command.pairIndex]: true }, commandVersion: state.commandVersion + 1 };
    }
    case 'HIDE_NOTE': {
      const pair = state.pairs[command.pairIndex];
      if (state.phase !== 'reveal' || !pair?.includes(command.uid)) return state;
      return { ...state, revealedByPair: { ...state.revealedByPair, [command.pairIndex]: false }, commandVersion: state.commandVersion + 1 };
    }
    case 'GO_TO_GUESSES':
      if (!isHost(command.uid, hostUid) || state.phase !== 'reveal') return state;
      return { ...state, phase: 'guess', commandVersion: state.commandVersion + 1 };
    case 'SUBMIT_GUESS': {
      const pair = state.pairs[command.pairIndex];
      if (state.phase !== 'guess' || !pair?.includes(command.uid) || command.guess < 0 || command.guess > 10) return state;
      return { ...state, guesses: { ...state.guesses, [command.pairIndex]: command.guess }, commandVersion: state.commandVersion + 1 };
    }
    case 'FINISH_ROUND': {
      if (!isHost(command.uid, hostUid) || state.phase !== 'guess') return state;
      if (!state.pairs.every((_, pairIndex) => state.guesses[pairIndex] !== undefined)) return state;
      const roundResult: OnlineNoteRoundResult = {
        round: state.round,
        pairs: state.pairs.map((pair, pairIndex) => {
          const { ownerUid, guesserUid } = getOnlineNoteRoles(pair, state.round - 1);
          const note = state.notes[pairIndex];
          const guess = state.guesses[pairIndex];
          return {
            pairIndex,
            ownerUid,
            guesserUid,
            note,
            guess,
            correct: guess === note,
          };
        }),
      };
      const scores = { ...state.scores };
      for (const result of roundResult.pairs) {
        if (result.correct) {
          scores[result.guesserUid] = (scores[result.guesserUid] ?? 0) + 1;
        }
      }
      return { ...state, phase: 'roundResult', results: [...state.results, roundResult], scores, commandVersion: state.commandVersion + 1 };
    }
    case 'NEXT_ROUND':
      if (!isHost(command.uid, hostUid) || state.phase !== 'roundResult') return state;
      if (state.round >= state.roundsCount) return finishGame(state);
      return {
        ...state,
        phase: 'reveal',
        round: state.round + 1,
        notes: createRoundNotes(state.pairs.length, random),
        revealedByPair: {},
        guesses: {},
        commandVersion: state.commandVersion + 1,
      };
    case 'END_GAME':
      if (!isHost(command.uid, hostUid)) return state;
      return finishGame(state);
    default:
      return state;
  }
}
