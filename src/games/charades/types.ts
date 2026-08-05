export type CharadesDifficulty = 'easy' | 'medium' | 'hard';
export type CharadesMode = 'teams' | 'everyone';
export type CharadesPhase =
  | 'IDLE'
  | 'SETUP_MODE'
  | 'SETUP_PLAYERS'
  | 'SETUP_CATEGORIES'
  | 'SETUP_RULES'
  | 'ROUND_READY'
  | 'ACTIVE_ROUND'
  | 'ROUND_SUMMARY'
  | 'GAME_OVER';

export type CharadesCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type CharadesTerm = {
  id: string;
  term: string;
  normalized: string;
  categoryId: string;
  difficulty: CharadesDifficulty;
  points: number;
  active: boolean;
  contentVersion: number;
};

export type CharadesParticipant = {
  id: string;
  name: string;
  score: number;
};

export type CharadesTurnItem = {
  term: CharadesTerm;
  result: 'correct' | 'skipped';
};

export type CharadesSetup = {
  mode: CharadesMode;
  players: string[];
  teams: string[];
  selectedCategoryIds: string[];
  selectedDifficulties: CharadesDifficulty[];
  turnDuration: number;
  maxRounds: number;
  targetScore: number;
  endOnTargetScore: boolean;
};

export type CharadesRanking = {
  participant: CharadesParticipant;
  place: number;
};

export type CharadesState = {
  phase: CharadesPhase;
  setup: CharadesSetup;
  participants: CharadesParticipant[];
  activeParticipantIndex: number;
  currentRound: number;
  timeLeft: number;
  queue: CharadesTerm[];
  usedTermIds: string[];
  currentTerm?: CharadesTerm;
  turnItems: CharadesTurnItem[];
  turnScore: number;
  winnerIds: string[];
  ranking: CharadesRanking[];
  message?: string;
  actionLocked: boolean;
};

export type CharadesAction =
  | { type: 'START_SETUP' }
  | { type: 'SET_MODE'; mode: CharadesMode }
  | { type: 'SET_PLAYERS'; players: string[] }
  | { type: 'SET_TEAMS'; teams: string[] }
  | { type: 'GO_TO_CATEGORIES' }
  | { type: 'GO_TO_RULES' }
  | { type: 'SET_CATEGORIES'; categoryIds: string[] }
  | { type: 'SET_DIFFICULTIES'; difficulties: CharadesDifficulty[] }
  | { type: 'SET_RULES'; duration: number; maxRounds: number; targetScore: number; endOnTargetScore: boolean }
  | { type: 'CONFIRM_SETUP'; terms: CharadesTerm[] }
  | { type: 'START_TURN' }
  | { type: 'TICK' }
  | { type: 'CORRECT' }
  | { type: 'SKIP' }
  | { type: 'UNLOCK_ACTION' }
  | { type: 'END_TURN' }
  | { type: 'NEXT_TURN' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'NEW_GAME' };
