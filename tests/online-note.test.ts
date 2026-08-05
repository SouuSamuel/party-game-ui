import test from 'node:test';
import { applyOnlineNoteCommand, createOnlineNoteState } from '../src/games/online-note/adapter';
import type { OnlineParticipant } from '../src/online/types';

function equal<T>(actual: T, expected: T) {
  if (actual !== expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
}

function participant(uid: string, name: string, isHost = false): OnlineParticipant {
  return { uid, name, isHost, status: 'online', joinedAt: 1, lastSeenAt: 1 };
}

const players = [participant('u1', 'Ana', true), participant('u2', 'Bia'), participant('u3', 'Caio'), participant('u4', 'Duda')];

test('creates synchronized online note state', () => {
  const state = createOnlineNoteState(players, 2, () => 0);
  equal(state.phase, 'reveal');
  equal(state.pairs.length, 2);
  equal(Object.keys(state.scores).length, 4);
});

test('rejects invalid actions and non-host transitions', () => {
  const state = createOnlineNoteState(players, 2, () => 0);
  const invalid = applyOnlineNoteCommand(state, { type: 'GO_TO_GUESSES', uid: 'u2' }, 'u1');
  equal(invalid.commandVersion, state.commandVersion);
});

test('syncs reveal, guesses, round result and duplicate advance protection', () => {
  let state = createOnlineNoteState(players, 1, () => 0);
  state = applyOnlineNoteCommand(state, { type: 'REVEAL_NOTE', uid: 'u1', pairIndex: 0 }, 'u1');
  equal(state.revealedByPair[0], true);
  state = applyOnlineNoteCommand(state, { type: 'GO_TO_GUESSES', uid: 'u1' }, 'u1');
  equal(state.phase, 'guess');
  state = applyOnlineNoteCommand(state, { type: 'SUBMIT_GUESS', uid: 'u1', pairIndex: 0, guess: state.notes[0] }, 'u1');
  state = applyOnlineNoteCommand(state, { type: 'SUBMIT_GUESS', uid: 'u3', pairIndex: 1, guess: 99 }, 'u1');
  equal(state.guesses[1], undefined);
  state = applyOnlineNoteCommand(state, { type: 'SUBMIT_GUESS', uid: 'u3', pairIndex: 1, guess: state.notes[1] }, 'u1');
  state = applyOnlineNoteCommand(state, { type: 'FINISH_ROUND', uid: 'u1' }, 'u1');
  equal(state.phase, 'roundResult');
  equal(state.results.length, 1);
  const ended = applyOnlineNoteCommand(state, { type: 'NEXT_ROUND', uid: 'u1' }, 'u1');
  equal(ended.phase, 'gameOver');
  const duplicate = applyOnlineNoteCommand(ended, { type: 'NEXT_ROUND', uid: 'u1' }, 'u1');
  equal(duplicate.commandVersion, ended.commandVersion);
});

test('allows host to end the online note match', () => {
  const state = createOnlineNoteState(players, 2, () => 0);
  const blocked = applyOnlineNoteCommand(state, { type: 'END_GAME', uid: 'u2' }, 'u1');
  equal(blocked.commandVersion, state.commandVersion);
  const ended = applyOnlineNoteCommand(state, { type: 'END_GAME', uid: 'u1' }, 'u1');
  equal(ended.phase, 'gameOver');
});
