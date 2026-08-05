declare module 'expo-av' {
  export const Audio: {
    setAudioModeAsync: (mode: Record<string, unknown>) => Promise<void>;
    Sound: {
      createAsync: (
        source: { uri: string },
        initialStatus?: Record<string, unknown>
      ) => Promise<{
        sound: {
          setOnPlaybackStatusUpdate: (callback: (status: { isLoaded?: boolean; didJustFinish?: boolean }) => void) => void;
          unloadAsync: () => Promise<void>;
        };
      }>;
    };
  };
}

declare module 'expo-linear-gradient' {
  import type { ComponentType, ReactNode } from 'react';
  import type { ViewStyle } from 'react-native';

  export const LinearGradient: ComponentType<{
    colors: readonly string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    style?: ViewStyle | ViewStyle[];
    children?: ReactNode;
  }>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };

  export default AsyncStorage;
}
