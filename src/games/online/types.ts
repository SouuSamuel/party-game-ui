import type { OnlineCommandResult, OnlineGameAction, OnlineGameApplyResult, OnlineGameEnvelope, OnlineGameId, RoomPlayer } from '../../online/types';

export type OnlineGameContext = {
  hostUid: string;
  players: RoomPlayer[];
  privateStateByPlayer?: Record<string, unknown>;
};

export type OnlineGameAdapter<TPublicState = unknown, TPrivateState = unknown, TAction extends OnlineGameAction = OnlineGameAction, TConfig = unknown> = {
  gameId: OnlineGameId;
  protocolVersion: number;
  minPlayers: number;
  maxPlayers?: number;
  createInitialState: (config: TConfig | undefined, players: RoomPlayer[], hostUid: string) => {
    publicState: TPublicState;
    privateStateByPlayer?: Record<string, TPrivateState | null>;
  };
  validateStart: (players: RoomPlayer[], config: TConfig | undefined) => OnlineCommandResult;
  applyAction: (
    state: OnlineGameEnvelope<TPublicState>,
    action: TAction,
    actor: RoomPlayer,
    context: OnlineGameContext
  ) => OnlineGameApplyResult<TPublicState, TPrivateState>;
  getStateForPlayer: (state: OnlineGameEnvelope<TPublicState>, privateState: TPrivateState | undefined, playerId: string) => unknown;
  isGameFinished: (state: OnlineGameEnvelope<TPublicState>) => boolean;
};

export function createActionId(uid: string, type: string) {
  return `${uid}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function rememberAction<TPublicState>(state: OnlineGameEnvelope<TPublicState>, actionId: string, publicState: TPublicState, phase = state.phase): OnlineGameEnvelope<TPublicState> {
  return {
    ...state,
    phase,
    sequence: state.sequence + 1,
    processedActionIds: [...state.processedActionIds.slice(-49), actionId],
    publicState,
  };
}

export function duplicateAction<TPublicState>(state: OnlineGameEnvelope<TPublicState>, actionId: string) {
  return state.processedActionIds.includes(actionId);
}
