import test from 'node:test';
import { getOnlineGameAdapter } from '../src/games/online/registry';
import type { OnlineGameAction, OnlineGameEnvelope, OnlineParticipant } from '../src/online/types';

function equal<T>(actual: T, expected: T) {
  if (actual !== expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
}

function ok(value: unknown, message = 'Expected truthy value') {
  if (!value) throw new Error(message);
}

function participant(uid: string, name: string, isHost = false): OnlineParticipant {
  return { uid, name, isHost, status: 'online', joinedAt: 1, lastSeenAt: 1 };
}

function envelope(gameId: OnlineGameEnvelope['gameId'], protocolVersion: number, publicState: unknown): OnlineGameEnvelope {
  return { gameId, protocolVersion, phase: 'playing', sequence: 0, processedActionIds: [], publicState };
}

function action(uid: string, type: string, payload?: Record<string, unknown>): OnlineGameAction {
  return { id: `${uid}-${type}-1`, uid, type, payload };
}

const players = [participant('u1', 'Ana', true), participant('u2', 'Bia'), participant('u3', 'Caio'), participant('u4', 'Duda')];

test('online registry starts every enabled game adapter', () => {
  for (const gameId of ['nota', 'mimica', 'impostor', 'contato', 'frase'] as const) {
    const adapter = getOnlineGameAdapter(gameId);
    const initial = adapter.createInitialState(undefined, players, 'u1');
    ok(initial.publicState, `${gameId} should create public state`);
    equal(adapter.validateStart(players, undefined).ok, true);
  }
});

test('online note keeps notes private and blocks duplicate action ids', () => {
  const adapter = getOnlineGameAdapter('nota');
  const initial = adapter.createInitialState({ roundsCount: 1 }, players, 'u1');
  const state = envelope('nota', adapter.protocolVersion, initial.publicState);
  ok(initial.privateStateByPlayer?.u1, 'owner should receive private note');
  const first = adapter.applyAction(state, action('u1', 'REVEAL_NOTE', { pairIndex: 0 }), players[0], { hostUid: 'u1', players, privateStateByPlayer: initial.privateStateByPlayer });
  if (!first.ok) throw new Error(first.message);
  const duplicate = adapter.applyAction(first.nextState, action('u1', 'REVEAL_NOTE', { pairIndex: 0 }), players[0], { hostUid: 'u1', players, privateStateByPlayer: initial.privateStateByPlayer });
  equal(duplicate.ok, false);
});

test('charades online scores active player only', () => {
  const adapter = getOnlineGameAdapter('mimica');
  const initial = adapter.createInitialState(undefined, players, 'u1');
  let state = envelope('mimica', adapter.protocolVersion, initial.publicState);
  const started = adapter.applyAction(state, action('u1', 'START_TURN'), players[0], { hostUid: 'u1', players, privateStateByPlayer: initial.privateStateByPlayer });
  if (!started.ok) throw new Error(started.message);
  state = started.nextState;
  const scored = adapter.applyAction(state, action('u1', 'CORRECT'), players[0], { hostUid: 'u1', players, privateStateByPlayer: initial.privateStateByPlayer });
  if (!scored.ok) throw new Error(scored.message);
  const publicState = scored.nextState.publicState as { participants: Array<{ uid: string; score: number }> };
  ok((publicState.participants.find((player) => player.uid === 'u1')?.score ?? 0) > 0);
});

test('impostor online stores roles privately and accepts one vote per player', () => {
  const adapter = getOnlineGameAdapter('impostor');
  const initial = adapter.createInitialState(undefined, players, 'u1');
  const state = envelope('impostor', adapter.protocolVersion, initial.publicState);
  ok(Object.values(initial.privateStateByPlayer ?? {}).some((privateState) => (privateState as { role?: string } | null)?.role === 'impostor'));
  const voteBeforePhase = adapter.applyAction(state, action('u2', 'CAST_VOTE', { targetUid: 'u1' }), players[1], { hostUid: 'u1', players, privateStateByPlayer: initial.privateStateByPlayer });
  equal(voteBeforePhase.ok, false);
});
