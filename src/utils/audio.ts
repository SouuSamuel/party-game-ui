import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export type SoundEffect = 'click' | 'correct' | 'error' | 'roundEnd' | 'start';

const SOUND_ENABLED_KEY = '@hangout:sound-enabled';

let soundEnabled = true;
let initialized = false;
let audioReady = false;

const soundConfig: Record<SoundEffect, { frequency: number; duration: number; volume: number }> = {
  click: { frequency: 720, duration: 0.045, volume: 0.16 },
  correct: { frequency: 880, duration: 0.12, volume: 0.24 },
  error: { frequency: 220, duration: 0.14, volume: 0.22 },
  roundEnd: { frequency: 520, duration: 0.22, volume: 0.24 },
  start: { frequency: 660, duration: 0.16, volume: 0.24 },
};

function encodeBase64(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];

    output += alphabet[first >> 2];
    output += alphabet[((first & 3) << 4) | ((second ?? 0) >> 4)];
    output += index + 1 < bytes.length ? alphabet[((second & 15) << 2) | ((third ?? 0) >> 6)] : '=';
    output += index + 2 < bytes.length ? alphabet[third & 63] : '=';
  }

  return output;
}

function createToneDataUri(frequency: number, duration: number) {
  const sampleRate = 22050;
  const samples = Math.floor(sampleRate * duration);
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, value: string) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let index = 0; index < samples; index += 1) {
    const progress = index / samples;
    const envelope = Math.sin(Math.PI * progress);
    const sample = Math.sin((2 * Math.PI * frequency * index) / sampleRate) * envelope;
    view.setInt16(44 + index * 2, sample * 0x7fff * 0.45, true);
  }

  const bytes = new Uint8Array(buffer);
  return `data:audio/wav;base64,${encodeBase64(bytes)}`;
}

const soundUris = Object.fromEntries(
  Object.entries(soundConfig).map(([key, config]) => [key, createToneDataUri(config.frequency, config.duration)])
) as Record<SoundEffect, string>;

async function prepareAudio() {
  if (audioReady) return;

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });
  audioReady = true;
}

export async function initAudioPreference() {
  if (initialized) return soundEnabled;

  try {
    const storedValue = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    soundEnabled = storedValue === null ? true : storedValue === 'true';
  } catch {
    soundEnabled = true;
  }

  initialized = true;
  return soundEnabled;
}

export async function getSoundEnabled() {
  await initAudioPreference();
  return soundEnabled;
}

export async function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  initialized = true;

  try {
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  } catch {
    // Keep the in-memory preference even if local storage is temporarily unavailable.
  }
}

export async function playSoundEffect(effect: SoundEffect) {
  try {
    await initAudioPreference();

    if (!soundEnabled) return;

    await prepareAudio();

    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUris[effect] },
      { shouldPlay: true, volume: soundConfig[effect].volume }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  } catch {
    // Audio should never interrupt game flow.
  }
}
