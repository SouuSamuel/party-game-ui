import { charadesTerms, difficultyPoints } from './content';
import type { CharadesDifficulty, CharadesTerm } from './types';
import type { OnlineGameAction, OnlineGameApplyResult, OnlineGameEnvelope, RoomPlayer } from '../../online/types';
import type { OnlineGameAdapter } from '../online/types';
import { duplicateAction, rememberAction } from '../online/types';

type CharadesOnlineConfig = {
  turnDuration?: number;
  maxRounds?: number;
  targetScore?: number;
  selectedCategoryIds?: string[];
  selectedDifficulties?: CharadesDifficulty[];
  endOnTargetScore?: boolean;
};

type CharadesOnlinePublicState = {
  stage: 'ROUND_READY' | 'ACTIVE_ROUND' | 'ROUND_SUMMARY' | 'GAME_OVER';
  participants: Array<{ uid: string; name: string; score: number }>;
  activeParticipantIndex: number;
  currentRound: number;
  timeLeft: number;
  turnDuration: number;
  maxRounds: number;
  targetScore: number;
  endOnTargetScore: boolean;
  usedTermIds: string[];
  turnItems: Array<{ term: string; points: number; result: 'correct' | 'skipped' }>;
  turnScore: number;
  winnerUids: string[];
  message?: string;
};

type CharadesOnlinePrivateState = {
  queue: CharadesTerm[];
  currentTerm?: CharadesTerm;
};

type CharadesOnlineAction = OnlineGameAction<'START_TURN' | 'TICK' | 'CORRECT' | 'SKIP' | 'END_TURN' | 'NEXT_TURN'>;

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function activePlayers(players: RoomPlayer[]) {
  return players.filter((player) => player.status !== 'left');
}

function drawNext(queue: CharadesTerm[], usedTermIds: string[]) {
  const used = new Set(usedTermIds);
  return queue.find((term) => !used.has(term.id));
}

function privateForActive(publicState: CharadesOnlinePublicState, privateState: CharadesOnlinePrivateState): Record<string, CharadesOnlinePrivateState | null> {
  const activeUid = publicState.participants[publicState.activeParticipantIndex]?.uid;
  if (!activeUid) return {};
  return Object.fromEntries(publicState.participants.map((participant) => [participant.uid, participant.uid === activeUid ? privateState : { queue: [] }]));
}

function finish(publicState: CharadesOnlinePublicState) {
  const best = Math.max(...publicState.participants.map((participant) => participant.score));
  return {
    ...publicState,
    stage: 'GAME_OVER' as const,
    winnerUids: publicState.participants.filter((participant) => participant.score === best).map((participant) => participant.uid),
  };
}

function completeTurn(publicState: CharadesOnlinePublicState) {
  const hitTarget = publicState.endOnTargetScore && publicState.participants.some((participant) => participant.score >= publicState.targetScore);
  const lastParticipant = publicState.activeParticipantIndex >= publicState.participants.length - 1;
  if (hitTarget || (lastParticipant && publicState.currentRound >= publicState.maxRounds)) return finish({ ...publicState, stage: 'ROUND_SUMMARY' });
  return { ...publicState, stage: 'ROUND_SUMMARY' as const };
}

export const onlineCharadesAdapter: OnlineGameAdapter<CharadesOnlinePublicState, CharadesOnlinePrivateState, CharadesOnlineAction, CharadesOnlineConfig> = {
  gameId: 'mimica',
  protocolVersion: 1,
  minPlayers: 2,
  maxPlayers: 24,
  validateStart(players) {
    return activePlayers(players).length >= 2 ? { ok: true } : { ok: false, code: 'invalid-state', message: 'Mímica online precisa de pelo menos 2 jogadores.' };
  },
  createInitialState(config, players) {
    const selectedCategoryIds = config?.selectedCategoryIds?.length ? config.selectedCategoryIds : [...new Set(charadesTerms.map((term) => term.categoryId))];
    const selectedDifficulties = config?.selectedDifficulties?.length ? config.selectedDifficulties : ['easy', 'medium', 'hard'];
    const queue = shuffle(charadesTerms.filter((term) => selectedCategoryIds.includes(term.categoryId) && selectedDifficulties.includes(term.difficulty)));
    const publicState: CharadesOnlinePublicState = {
      stage: 'ROUND_READY',
      participants: activePlayers(players).map((player) => ({ uid: player.uid, name: player.name, score: 0 })),
      activeParticipantIndex: 0,
      currentRound: 1,
      timeLeft: Math.max(15, Math.min(180, Number(config?.turnDuration ?? 60))),
      turnDuration: Math.max(15, Math.min(180, Number(config?.turnDuration ?? 60))),
      maxRounds: Math.max(1, Math.min(10, Number(config?.maxRounds ?? 4))),
      targetScore: Math.max(1, Math.min(200, Number(config?.targetScore ?? 30))),
      endOnTargetScore: config?.endOnTargetScore ?? true,
      usedTermIds: [],
      turnItems: [],
      turnScore: 0,
      winnerUids: [],
    };
    const privateState = { queue, currentTerm: queue[0] };
    return { publicState, privateStateByPlayer: privateForActive(publicState, privateState) };
  },
  applyAction(state, action, actor, context): OnlineGameApplyResult<CharadesOnlinePublicState, CharadesOnlinePrivateState> {
    const current = state.publicState;
    if (duplicateAction(state, action.id) || current.stage === 'GAME_OVER') return { ok: false, code: 'invalid-action', message: 'Ação duplicada ou partida encerrada.' };
    const activeUid = current.participants[current.activeParticipantIndex]?.uid;
    const actorIsActive = activeUid === actor.uid;
    const actorPrivate = context.privateStateByPlayer?.[actor.uid] as CharadesOnlinePrivateState | undefined;

    if (action.type === 'START_TURN') {
      if (!actorIsActive || current.stage !== 'ROUND_READY') return { ok: false, code: 'invalid-action', message: 'Apenas quem está na vez pode começar.' };
      return { ok: true, nextState: rememberAction(state, action.id, { ...current, stage: 'ACTIVE_ROUND', timeLeft: current.turnDuration }, 'playing') };
    }
    if (action.type === 'TICK') {
      if (!actorIsActive || current.stage !== 'ACTIVE_ROUND') return { ok: false, code: 'invalid-action', message: 'Cronômetro fora da vez.' };
      const nextTime = Math.max(0, current.timeLeft - 1);
      const nextPublic = nextTime === 0 ? completeTurn({ ...current, timeLeft: 0 }) : { ...current, timeLeft: nextTime };
      return { ok: true, nextState: rememberAction(state, action.id, nextPublic, nextPublic.stage === 'GAME_OVER' ? 'finished' : 'playing') };
    }
    if (action.type === 'CORRECT' || action.type === 'SKIP') {
      if (!actorIsActive || current.stage !== 'ACTIVE_ROUND') return { ok: false, code: 'invalid-action', message: 'Apenas quem está na vez controla acertos e pulos.' };
      const term = actorPrivate?.currentTerm;
      if (!term) return { ok: false, code: 'invalid-state', message: 'Não há palavra ativa para pontuar.' };
      const result: 'correct' | 'skipped' = action.type === 'CORRECT' ? 'correct' : 'skipped';
      const points = result === 'correct' ? difficultyPoints[term.difficulty] : 0;
      const usedTermIds = [...current.usedTermIds, term.id];
      const nextTerm = drawNext(actorPrivate.queue, usedTermIds);
      const turnItem: { term: string; points: number; result: 'correct' | 'skipped' } = { term: term.term, points, result };
      const nextPublic = {
        ...current,
        participants: current.participants.map((participant) => (participant.uid === actor.uid ? { ...participant, score: participant.score + points } : participant)),
        usedTermIds,
        turnItems: [...current.turnItems, turnItem],
        turnScore: current.turnScore + points,
      };
      const completed = nextTerm ? nextPublic : completeTurn({ ...nextPublic, message: 'O banco disponível acabou para estes filtros.' });
      return {
        ok: true,
        nextState: rememberAction(state, action.id, completed, completed.stage === 'GAME_OVER' ? 'finished' : 'playing'),
        privateStateByPlayer: privateForActive(completed, { queue: actorPrivate.queue, currentTerm: nextTerm }),
      };
    }
    if (action.type === 'END_TURN') {
      if (!actorIsActive || current.stage !== 'ACTIVE_ROUND') return { ok: false, code: 'invalid-action', message: 'Apenas quem está na vez encerra o turno.' };
      const nextPublic = completeTurn(current);
      return { ok: true, nextState: rememberAction(state, action.id, nextPublic, nextPublic.stage === 'GAME_OVER' ? 'finished' : 'playing') };
    }
    if (action.type === 'NEXT_TURN') {
      if (!actorIsActive || current.stage !== 'ROUND_SUMMARY') return { ok: false, code: 'invalid-action', message: 'Apenas quem jogou avança o turno.' };
      const nextIndex = (current.activeParticipantIndex + 1) % current.participants.length;
      const nextRound = nextIndex === 0 ? current.currentRound + 1 : current.currentRound;
      const nextTerm = actorPrivate ? drawNext(actorPrivate.queue, current.usedTermIds) : undefined;
      if (!actorPrivate || !nextTerm) return { ok: false, code: 'invalid-state', message: 'Não há próxima palavra disponível.' };
      const privateState = { queue: actorPrivate.queue, currentTerm: nextTerm };
      const nextPublic = {
        ...current,
        stage: 'ROUND_READY' as const,
        activeParticipantIndex: nextIndex,
        currentRound: nextRound,
        timeLeft: current.turnDuration,
        turnItems: [],
        turnScore: 0,
      };
      return { ok: true, nextState: rememberAction(state, action.id, nextPublic, 'playing'), privateStateByPlayer: privateForActive(nextPublic, privateState) };
    }
    return { ok: false, code: 'invalid-action', message: 'Ação não reconhecida.' };
  },
  getStateForPlayer(state, privateState) {
    return { ...state.publicState, privateState };
  },
  isGameFinished(state) {
    return state.phase === 'finished' || state.publicState.stage === 'GAME_OVER';
  },
};
