import test from 'node:test';
import { charadesTerms } from '../src/games/charades/content';
import { charadesReducer, initialCharadesState } from '../src/games/charades/state';
import type { CharadesAction, CharadesState } from '../src/games/charades/types';

function dispatchAll(actions: CharadesAction[]) {
  return actions.reduce<CharadesState>((state, action) => charadesReducer(state, action), initialCharadesState);
}

function readyState() {
  return dispatchAll([
    { type: 'START_SETUP' },
    { type: 'SET_MODE', mode: 'teams' },
    { type: 'SET_TEAMS', teams: ['Azul', 'Vermelho'] },
    { type: 'SET_CATEGORIES', categoryIds: ['filmes'] },
    { type: 'SET_DIFFICULTIES', difficulties: ['easy', 'medium', 'hard'] },
    { type: 'SET_RULES', duration: 3, maxRounds: 1, targetScore: 3, endOnTargetScore: true },
    { type: 'CONFIRM_SETUP', terms: charadesTerms.slice(0, 20) },
  ]);
}

test('scores by difficulty and prevents duplicate rapid taps', () => {
  const active = charadesReducer(readyState(), { type: 'START_TURN' });
  const current = active.currentTerm;
  if (!current) throw new Error('Expected current term');
  const scored = charadesReducer(active, { type: 'CORRECT' });
  const repeated = charadesReducer(scored, { type: 'CORRECT' });
  equal(scored.participants[0].score, current.points);
  equal(repeated.participants[0].score, current.points);
  equal(scored.usedTermIds.includes(current.id), true);
});

test('skip records word without adding points', () => {
  const active = charadesReducer(readyState(), { type: 'START_TURN' });
  const skipped = charadesReducer(active, { type: 'SKIP' });
  equal(skipped.participants[0].score, 0);
  equal(skipped.turnItems[0].result, 'skipped');
});

test('timer ends turn once', () => {
  const active = charadesReducer(readyState(), { type: 'START_TURN' });
  const afterTicks = dispatchAllFrom(active, [{ type: 'TICK' }, { type: 'TICK' }, { type: 'TICK' }, { type: 'TICK' }]);
  equal(afterTicks.phase, 'ROUND_SUMMARY');
  equal(afterTicks.timeLeft, 0);
});

test('alternates participants and increments round after all teams play', () => {
  const firstSummary = charadesReducer(charadesReducer(readyState(), { type: 'START_TURN' }), { type: 'END_TURN' });
  const secondReady = charadesReducer(firstSummary, { type: 'NEXT_TURN' });
  equal(secondReady.activeParticipantIndex, 1);
  equal(secondReady.currentRound, 1);
  const gameOver = charadesReducer(charadesReducer(secondReady, { type: 'START_TURN' }), { type: 'END_TURN' });
  equal(gameOver.phase, 'GAME_OVER');
});

test('ends by target score at turn boundary', () => {
  let state = readyState();
  state = charadesReducer(state, { type: 'START_TURN' });
  state = charadesReducer(state, { type: 'CORRECT' });
  state = { ...state, participants: [{ ...state.participants[0], score: 99 }, state.participants[1]] };
  state = charadesReducer(state, { type: 'END_TURN' });
  equal(state.phase, 'GAME_OVER');
  equal(state.winnerIds.length, 1);
});

test('keeps tied winners instead of declaring wrong champion', () => {
  const summary = {
    ...readyState(),
    phase: 'ACTIVE_ROUND' as const,
    activeParticipantIndex: 1,
    participants: [
      { id: 'a', name: 'Azul', score: 5 },
      { id: 'b', name: 'Vermelho', score: 5 },
    ],
  };
  const gameOver = charadesReducer(summary, { type: 'END_TURN' });
  equal(gameOver.phase, 'GAME_OVER');
  deepEqual(gameOver.winnerIds.sort(), ['a', 'b']);
});

test('play again resets previous used words and score', () => {
  const active = charadesReducer(readyState(), { type: 'START_TURN' });
  const scored = charadesReducer(active, { type: 'CORRECT' });
  const over = { ...scored, phase: 'GAME_OVER' as const };
  const again = charadesReducer(over, { type: 'PLAY_AGAIN' });
  equal(again.phase, 'ROUND_READY');
  equal(again.usedTermIds.length, 0);
  equal(again.participants.every((participant) => participant.score === 0), true);
});

function dispatchAllFrom(state: CharadesState, actions: CharadesAction[]) {
  return actions.reduce<CharadesState>((current, action) => charadesReducer(current, action), state);
}

function equal<T>(actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function deepEqual(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}
