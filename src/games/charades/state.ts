import { difficultyPoints } from './content';
import type { CharadesAction, CharadesParticipant, CharadesRanking, CharadesSetup, CharadesState, CharadesTerm } from './types';

export const defaultCharadesSetup: CharadesSetup = {
  mode: 'teams',
  players: ['Jogador 1', 'Jogador 2', 'Jogador 3', 'Jogador 4'],
  teams: ['Time Azul', 'Time Vermelho'],
  selectedCategoryIds: [],
  selectedDifficulties: ['easy', 'medium', 'hard'],
  turnDuration: 60,
  maxRounds: 4,
  targetScore: 30,
  endOnTargetScore: true,
};

export const initialCharadesState: CharadesState = {
  phase: 'IDLE',
  setup: defaultCharadesSetup,
  participants: [],
  activeParticipantIndex: 0,
  currentRound: 1,
  timeLeft: defaultCharadesSetup.turnDuration,
  queue: [],
  usedTermIds: [],
  turnItems: [],
  turnScore: 0,
  winnerIds: [],
  ranking: [],
  actionLocked: false,
};

export function fisherYates<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createParticipants(setup: CharadesSetup): CharadesParticipant[] {
  const names = setup.mode === 'teams' ? setup.teams : setup.players;
  return names
    .map((name, index) => ({ id: `${setup.mode}-${index}-${name.trim().toLowerCase().replace(/\s+/g, '-')}`, name: name.trim(), score: 0 }))
    .filter((participant) => participant.name.length > 0);
}

export function createRanking(participants: CharadesParticipant[]): CharadesRanking[] {
  const sorted = [...participants].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let previousScore: number | undefined;
  let previousPlace = 0;
  return sorted.map((participant, index) => {
    const place = previousScore === participant.score ? previousPlace : index + 1;
    previousScore = participant.score;
    previousPlace = place;
    return { participant, place };
  });
}

function getWinnerIds(participants: CharadesParticipant[]) {
  const bestScore = Math.max(...participants.map((participant) => participant.score));
  return participants.filter((participant) => participant.score === bestScore).map((participant) => participant.id);
}

function shouldFinishAfterTurn(state: CharadesState) {
  if (state.setup.endOnTargetScore && state.participants.some((participant) => participant.score >= state.setup.targetScore)) {
    return true;
  }

  const lastParticipantTurn = state.activeParticipantIndex >= state.participants.length - 1;
  return lastParticipantTurn && state.currentRound >= state.setup.maxRounds;
}

function drawNextTerm(queue: CharadesTerm[], usedTermIds: string[]) {
  const used = new Set(usedTermIds);
  return queue.find((term) => !used.has(term.id));
}

function finishGame(state: CharadesState): CharadesState {
  const ranking = createRanking(state.participants);
  return {
    ...state,
    phase: 'GAME_OVER',
    ranking,
    winnerIds: getWinnerIds(state.participants),
    currentTerm: undefined,
    actionLocked: false,
  };
}

function completeTurn(state: CharadesState): CharadesState {
  if (shouldFinishAfterTurn(state)) {
    return finishGame({ ...state, phase: 'ROUND_SUMMARY', currentTerm: undefined, actionLocked: false });
  }

  return {
    ...state,
    phase: 'ROUND_SUMMARY',
    currentTerm: undefined,
    actionLocked: false,
  };
}

function moveToNextActor(state: CharadesState): CharadesState {
  const nextIndex = (state.activeParticipantIndex + 1) % state.participants.length;
  const nextRound = nextIndex === 0 ? state.currentRound + 1 : state.currentRound;
  const nextTerm = drawNextTerm(state.queue, state.usedTermIds);

  if (!nextTerm) {
    return finishGame({ ...state, message: 'O banco disponível acabou para os filtros escolhidos.' });
  }

  return {
    ...state,
    phase: 'ROUND_READY',
    activeParticipantIndex: nextIndex,
    currentRound: nextRound,
    currentTerm: nextTerm,
    timeLeft: state.setup.turnDuration,
    turnItems: [],
    turnScore: 0,
    actionLocked: false,
    message: undefined,
  };
}

function scoreCurrentTerm(state: CharadesState, result: 'correct' | 'skipped'): CharadesState {
  if (!state.currentTerm || state.actionLocked || state.phase !== 'ACTIVE_ROUND') {
    return state;
  }

  const currentTerm = state.currentTerm;
  const points = result === 'correct' ? difficultyPoints[currentTerm.difficulty] : 0;
  const participants = state.participants.map((participant, index) =>
    index === state.activeParticipantIndex ? { ...participant, score: participant.score + points } : participant
  );
  const usedTermIds = [...state.usedTermIds, currentTerm.id];
  const nextTerm = drawNextTerm(state.queue, usedTermIds);
  const nextState: CharadesState = {
    ...state,
    participants,
    usedTermIds,
    turnItems: [...state.turnItems, { term: currentTerm, result }],
    turnScore: state.turnScore + points,
    currentTerm: nextTerm,
    actionLocked: true,
    message: nextTerm ? undefined : 'O banco disponível acabou para os filtros escolhidos.',
  };

  if (!nextTerm) {
    return completeTurn(nextState);
  }

  return nextState;
}

export function charadesReducer(state: CharadesState, action: CharadesAction): CharadesState {
  switch (action.type) {
    case 'START_SETUP':
      return { ...initialCharadesState, phase: 'SETUP_MODE' };
    case 'SET_MODE':
      return { ...state, setup: { ...state.setup, mode: action.mode }, phase: 'SETUP_PLAYERS', message: undefined };
    case 'SET_PLAYERS':
      return { ...state, setup: { ...state.setup, players: action.players }, message: undefined };
    case 'SET_TEAMS':
      return { ...state, setup: { ...state.setup, teams: action.teams }, message: undefined };
    case 'GO_TO_CATEGORIES':
      return { ...state, phase: 'SETUP_CATEGORIES', message: undefined };
    case 'GO_TO_RULES':
      return { ...state, phase: 'SETUP_RULES', message: undefined };
    case 'SET_CATEGORIES':
      return { ...state, setup: { ...state.setup, selectedCategoryIds: action.categoryIds }, message: undefined };
    case 'SET_DIFFICULTIES':
      return { ...state, setup: { ...state.setup, selectedDifficulties: action.difficulties }, message: undefined };
    case 'SET_RULES':
      return {
        ...state,
        setup: {
          ...state.setup,
          turnDuration: action.duration,
          maxRounds: action.maxRounds,
          targetScore: action.targetScore,
          endOnTargetScore: action.endOnTargetScore,
        },
        message: undefined,
      };
    case 'CONFIRM_SETUP': {
      if (state.phase === 'ROUND_READY' || state.phase === 'ACTIVE_ROUND') return state;
      const participants = createParticipants(state.setup);
      const queue = fisherYates(action.terms);
      const firstTerm = queue[0];
      if (participants.length < 2) {
        return { ...state, message: 'Adicione pelo menos dois participantes.' };
      }
      if (!firstTerm) {
        return { ...state, message: 'Não há palavras suficientes para estes filtros.' };
      }
      return {
        ...state,
        phase: 'ROUND_READY',
        participants,
        activeParticipantIndex: 0,
        currentRound: 1,
        timeLeft: state.setup.turnDuration,
        queue,
        usedTermIds: [],
        currentTerm: firstTerm,
        turnItems: [],
        turnScore: 0,
        winnerIds: [],
        ranking: [],
        actionLocked: false,
        message: undefined,
      };
    }
    case 'START_TURN':
      if (state.phase !== 'ROUND_READY' || !state.currentTerm) return state;
      return { ...state, phase: 'ACTIVE_ROUND', timeLeft: state.setup.turnDuration, actionLocked: false };
    case 'TICK':
      if (state.phase !== 'ACTIVE_ROUND') return state;
      if (state.timeLeft <= 1) {
        return completeTurn({ ...state, timeLeft: 0 });
      }
      return { ...state, timeLeft: state.timeLeft - 1 };
    case 'CORRECT':
      return scoreCurrentTerm(state, 'correct');
    case 'SKIP':
      return scoreCurrentTerm(state, 'skipped');
    case 'UNLOCK_ACTION':
      return { ...state, actionLocked: false };
    case 'END_TURN':
      if (state.phase !== 'ACTIVE_ROUND') return state;
      return completeTurn(state);
    case 'NEXT_TURN':
      if (state.phase !== 'ROUND_SUMMARY') return state;
      return moveToNextActor(state);
    case 'PLAY_AGAIN':
      return charadesReducer({ ...initialCharadesState, setup: state.setup }, { type: 'CONFIRM_SETUP', terms: state.queue });
    case 'NEW_GAME':
      return { ...initialCharadesState, phase: 'SETUP_MODE' };
    default:
      return state;
  }
}
