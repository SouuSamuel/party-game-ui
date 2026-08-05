import type { GameId } from '../games/types';

export type OnlineGameId = GameId | 'online-note';
export type OnlineRoomStatus = 'waiting' | 'configuring' | 'lobby' | 'playing' | 'finished' | 'ended';
export type OnlineParticipantStatus = 'online' | 'offline' | 'left';

export type OnlineParticipant = {
  uid: string;
  name: string;
  isHost: boolean;
  status: OnlineParticipantStatus;
  joinedAt: number;
  lastSeenAt: number;
};

export type OnlineRoom = {
  id: string;
  code: string;
  hostUid: string;
  status: OnlineRoomStatus;
  selectedGameId: OnlineGameId;
  maxParticipants: number;
  createdAt: number;
  updatedAt: number;
  endedAt?: number;
  gameState?: OnlineGameEnvelope;
  gameConfig?: unknown;
};

export type OnlineRoomSnapshot = {
  room: OnlineRoom;
  participants: OnlineParticipant[];
  privateState?: unknown;
};

export type OnlineCommandResult =
  | { ok: true }
  | { ok: false; code: 'not-found' | 'ended' | 'full' | 'already-started' | 'duplicate-name' | 'not-host' | 'not-participant' | 'invalid-action' | 'invalid-state' | 'incompatible-version'; message: string };

export type LastOnlineSession = {
  roomId: string;
  code: string;
  uid: string;
  playerName: string;
};

export type RoomPlayer = OnlineParticipant;

export type OnlineGamePhase = 'configuring' | 'playing' | 'finished';

export type OnlineGameEnvelope<TPublicState = unknown> = {
  gameId: OnlineGameId;
  protocolVersion: number;
  phase: OnlineGamePhase;
  sequence: number;
  processedActionIds: string[];
  publicState: TPublicState;
};

export type OnlineGameAction<TType extends string = string, TPayload = Record<string, unknown>> = {
  id: string;
  uid: string;
  type: TType;
  payload?: TPayload;
  expectedSequence?: number;
};

export type OnlineGameApplyResult<TPublicState = unknown, TPrivateState = unknown> =
  | {
      ok: true;
      nextState: OnlineGameEnvelope<TPublicState>;
      privateStateByPlayer?: Record<string, TPrivateState | null>;
    }
  | {
      ok: false;
      code: OnlineCommandResult extends infer Result ? Result extends { ok: false; code: infer Code } ? Code : never : never;
      message: string;
    };
