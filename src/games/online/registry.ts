import type { GameId } from '../types';
import { onlineNoteAdapter } from '../online-note/onlineAdapter';
import { onlineCharadesAdapter } from '../charades/onlineAdapter';
import { onlineImpostorAdapter } from '../impostor/onlineAdapter';
import { onlineContactAdapter } from '../contact/onlineAdapter';
import { onlinePhraseCutAdapter } from '../phrase-cut/onlineAdapter';
import type { OnlineCommandResult, OnlineGameAction, OnlineGameApplyResult, OnlineGameEnvelope, RoomPlayer } from '../../online/types';
import type { OnlineGameContext } from './types';

export type RegisteredOnlineGameAdapter = {
  gameId: GameId;
  protocolVersion: number;
  minPlayers: number;
  maxPlayers?: number;
  validateStart: (players: RoomPlayer[], config: unknown | undefined) => OnlineCommandResult;
  createInitialState: (config: unknown | undefined, players: RoomPlayer[], hostUid: string) => {
    publicState: unknown;
    privateStateByPlayer?: Record<string, unknown | null>;
  };
  applyAction: (
    state: OnlineGameEnvelope,
    action: OnlineGameAction,
    actor: RoomPlayer,
    context: OnlineGameContext
  ) => OnlineGameApplyResult;
  getStateForPlayer: (state: OnlineGameEnvelope, privateState: unknown, playerId: string) => unknown;
  isGameFinished: (state: OnlineGameEnvelope) => boolean;
};

const adapters = {
  nota: onlineNoteAdapter,
  mimica: onlineCharadesAdapter,
  impostor: onlineImpostorAdapter,
  contato: onlineContactAdapter,
  frase: onlinePhraseCutAdapter,
};

export function getOnlineGameAdapter(gameId: GameId): RegisteredOnlineGameAdapter {
  return adapters[gameId] as unknown as RegisteredOnlineGameAdapter;
}

export function hasOnlineGameAdapter(gameId: GameId) {
  return Boolean(adapters[gameId]);
}
