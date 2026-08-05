export type OnlineNotePhase = 'lobby' | 'reveal' | 'guess' | 'roundResult' | 'gameOver';
export type OnlineNotePair = [string, string];

export type OnlineNotePairResult = {
  pairIndex: number;
  ownerUid: string;
  guesserUid: string;
  note: number;
  guess?: number;
  correct: boolean;
};

export type OnlineNoteRoundResult = {
  round: number;
  pairs: OnlineNotePairResult[];
};

export type OnlineNoteState = {
  phase: OnlineNotePhase;
  round: number;
  roundsCount: number;
  pairs: OnlineNotePair[];
  notes: number[];
  revealedByPair: Record<number, boolean>;
  guesses: Record<number, number>;
  results: OnlineNoteRoundResult[];
  scores: Record<string, number>;
  commandVersion: number;
  winnerUids: string[];
};

export type OnlineNoteCommand =
  | { type: 'REVEAL_NOTE'; uid: string; pairIndex: number }
  | { type: 'HIDE_NOTE'; uid: string; pairIndex: number }
  | { type: 'GO_TO_GUESSES'; uid: string }
  | { type: 'SUBMIT_GUESS'; uid: string; pairIndex: number; guess: number }
  | { type: 'FINISH_ROUND'; uid: string }
  | { type: 'NEXT_ROUND'; uid: string }
  | { type: 'END_GAME'; uid: string };
