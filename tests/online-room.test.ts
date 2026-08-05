import test from 'node:test';
import type { OnlineParticipant, OnlineRoom } from '../src/online/types';
import { createCompositeUnsubscribe } from '../src/online/listeners';
import { canJoinRoom, canStartGame, chooseNextHost, cleanPlayerName, generateRoomCode, normalizeRoomCode } from '../src/online/model/roomRules';

function equal<T>(actual: T, expected: T) {
  if (actual !== expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
}

function ok(value: unknown, message = 'Expected truthy value') {
  if (!value) throw new Error(message);
}

function failureCode(result: ReturnType<typeof canJoinRoom> | ReturnType<typeof canStartGame>) {
  if (result.ok) throw new Error('Expected failure');
  return result.code;
}

function makeRoom(overrides: Partial<OnlineRoom> = {}): OnlineRoom {
  return {
    id: 'room-1',
    code: 'ABC234',
    hostUid: 'u1',
    status: 'lobby',
    selectedGameId: 'nota',
    maxParticipants: 4,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function participant(uid: string, name: string, isHost = false): OnlineParticipant {
  return { uid, name, isHost, status: 'online', joinedAt: 1, lastSeenAt: 1 };
}

test('generates and normalizes room codes', () => {
  equal(normalizeRoomCode(' ab-c 234 '), 'ABC234');
  const code = generateRoomCode(() => 0);
  equal(code.length, 6);
});

test('allows joining an existing lobby by code', () => {
  const result = canJoinRoom(makeRoom(), [participant('u1', 'Ana', true)], 'u2', 'Bruno');
  equal(result.ok, true);
});

test('rejects missing room, duplicate name and full room', () => {
  equal(failureCode(canJoinRoom(undefined, [], 'u2', 'Ana')), 'not-found');
  equal(failureCode(canJoinRoom(makeRoom(), [participant('u1', 'Ana')], 'u2', 'ana')), 'duplicate-name');
  equal(
    failureCode(canJoinRoom(makeRoom({ maxParticipants: 2 }), [participant('u1', 'Ana'), participant('u2', 'Bia')], 'u3', 'Caio')),
    'full'
  );
});

test('rejects new participant after game started but allows reconnect', () => {
  const room = makeRoom({ status: 'playing' });
  equal(failureCode(canJoinRoom(room, [participant('u1', 'Ana')], 'u2', 'Bia')), 'already-started');
  equal(canJoinRoom(room, [participant('u1', 'Ana')], 'u1', 'Ana').ok, true);
});

test('rejects joining an ended room', () => {
  equal(failureCode(canJoinRoom(makeRoom({ status: 'ended' }), [participant('u1', 'Ana')], 'u2', 'Bia')), 'ended');
});

test('starts only by host with enough participants', () => {
  const players = [participant('u1', 'Ana', true), participant('u2', 'Bia'), participant('u3', 'Caio'), participant('u4', 'Duda')];
  equal(failureCode(canStartGame(makeRoom(), players, 'u2', 'nota')), 'not-host');
  equal(failureCode(canStartGame(makeRoom(), players.slice(0, 3), 'u1', 'nota')), 'invalid-state');
  equal(canStartGame(makeRoom(), players, 'u1', 'mimica').ok, true);
  equal(canStartGame(makeRoom(), players, 'u1', 'nota').ok, true);
});

test('chooses a new host when current host leaves', () => {
  const nextHost = chooseNextHost([participant('u1', 'Ana', true), participant('u2', 'Bia')], 'u1');
  equal(nextHost, 'u2');
  equal(chooseNextHost([participant('u1', 'Ana', true), participant('u2', 'Bia')], 'u2'), 'u1');
});

test('cleans player names', () => {
  equal(cleanPlayerName('  Ana   Maria  '), 'Ana Maria');
  ok(cleanPlayerName('x'.repeat(40)).length <= 24);
});

test('cleans online listeners exactly once', () => {
  let roomCalls = 0;
  let participantCalls = 0;
  const unsubscribe = createCompositeUnsubscribe([
    () => {
      roomCalls += 1;
    },
    () => {
      participantCalls += 1;
    },
  ]);
  unsubscribe();
  unsubscribe();
  equal(roomCalls, 1);
  equal(participantCalls, 1);
});
