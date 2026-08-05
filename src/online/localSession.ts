import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LastOnlineSession } from './types';

const LAST_SESSION_KEY = '@groupgames:last-online-session';

export async function saveLastOnlineSession(session: LastOnlineSession) {
  await AsyncStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session));
}

export async function getLastOnlineSession() {
  const raw = await AsyncStorage.getItem(LAST_SESSION_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as LastOnlineSession;
  } catch {
    return undefined;
  }
}

export async function clearLastOnlineSession() {
  await AsyncStorage.removeItem(LAST_SESSION_KEY);
}
