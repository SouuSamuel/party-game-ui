import { getGameById, normalizeGameId } from '../../games/registry';
import type { OnlineCommandResult, OnlineGameId, OnlineParticipant, OnlineRoom } from '../types';

export const DEFAULT_MAX_ONLINE_PARTICIPANTS = 12;

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeRoomCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/[IO10]/g, (match) => ({ I: '1', O: '0', '1': '1', '0': '0' }[match] ?? match));
}

export function generateRoomCode(random = Math.random) {
  let code = '';
  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(random() * alphabet.length)];
  }
  return code;
}

export function cleanPlayerName(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 24);
}

export function canJoinRoom(room: OnlineRoom | undefined, participants: OnlineParticipant[], uid: string, name: string): OnlineCommandResult {
  if (!room) return { ok: false, code: 'not-found', message: 'Sala nao encontrada. Confira o codigo e tente novamente.' };
  if (room.status === 'ended' || room.status === 'finished') return { ok: false, code: 'ended', message: 'Esta sala ja foi encerrada.' };
  if ((room.status === 'playing' || room.status === 'configuring') && !participants.some((participant) => participant.uid === uid)) {
    return { ok: false, code: 'already-started', message: 'A partida ja comecou.' };
  }

  const cleanName = cleanPlayerName(name);
  const duplicateName = participants.some((participant) => participant.uid !== uid && participant.status !== 'left' && participant.name.toLowerCase() === cleanName.toLowerCase());
  if (duplicateName) return { ok: false, code: 'duplicate-name', message: 'Ja existe um jogador com esse nome na sala.' };

  const activeCount = participants.filter((participant) => participant.status !== 'left').length;
  const alreadyInside = participants.some((participant) => participant.uid === uid);
  if (!alreadyInside && activeCount >= room.maxParticipants) return { ok: false, code: 'full', message: 'Esta sala esta cheia.' };
  return { ok: true };
}

export function assertHost(room: OnlineRoom, uid: string): OnlineCommandResult {
  if (room.hostUid !== uid) return { ok: false, code: 'not-host', message: 'Somente o anfitriao pode fazer isso.' };
  return { ok: true };
}

export function canStartGame(room: OnlineRoom, participants: OnlineParticipant[], uid: string, gameId: OnlineGameId): OnlineCommandResult {
  const host = assertHost(room, uid);
  if (!host.ok) return host;
  if (room.status !== 'lobby' && room.status !== 'waiting' && room.status !== 'configuring') {
    return { ok: false, code: 'invalid-state', message: 'A sala nao esta no lobby.' };
  }

  const game = getGameById(normalizeGameId(gameId));
  if (!game.supportsOnline) return { ok: false, code: 'invalid-action', message: 'Este jogo online ainda estara disponivel em breve.' };

  const activeParticipants = participants.filter((participant) => participant.status !== 'left');
  if (activeParticipants.length < game.minPlayers) return { ok: false, code: 'invalid-state', message: `${game.name} online precisa de pelo menos ${game.minPlayers} jogadores.` };
  if (game.maxPlayers && activeParticipants.length > game.maxPlayers) return { ok: false, code: 'invalid-state', message: `${game.name} online aceita no maximo ${game.maxPlayers} jogadores.` };
  return { ok: true };
}

export function chooseNextHost(participants: OnlineParticipant[], leavingUid: string) {
  return participants.find((participant) => participant.uid !== leavingUid && participant.status !== 'left')?.uid;
}
