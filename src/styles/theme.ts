import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'dark' | 'neon' | 'calm' | 'party';

type ThemeColors = {
  background: string;
  backgroundSoft: string;
  surface: string;
  surfaceStrong: string;
  panel: string;
  panelStrong: string;
  panelLight: string;
  border: string;
  borderStrong: string;
  text: string;
  textDark: string;
  muted: string;
  mutedStrong: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  dangerSoft: string;
  cyan: string;
  blue: string;
  lime: string;
  pink: string;
  amber: string;
  violet: string;
};

type ThemeGradients = {
  screen: readonly [string, string, string];
  screenAlt: readonly [string, string, string];
  primary: readonly [string, string];
  secondary: readonly [string, string];
  dark: readonly [string, string];
};

export type AppTheme = {
  name: ThemeName;
  label: string;
  colors: ThemeColors;
  gradients: ThemeGradients;
};

const THEME_KEY = '@hangout:theme';

export const themes: Record<ThemeName, AppTheme> = {
  dark: {
    name: 'dark',
    label: 'Escuro',
    colors: {
      background: '#070A14',
      backgroundSoft: '#101827',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: 'rgba(255,255,255,0.12)',
      panel: 'rgba(255,255,255,0.92)',
      panelStrong: 'rgba(255,255,255,0.12)',
      panelLight: 'rgba(255,255,255,0.92)',
      border: 'rgba(15,23,42,0.12)',
      borderStrong: 'rgba(255,255,255,0.2)',
      text: '#101827',
      textDark: '#101827',
      muted: '#64748B',
      mutedStrong: '#334155',
      accent: '#2563EB',
      accentSoft: 'rgba(37,99,235,0.12)',
      onAccent: '#FFFFFF',
      danger: '#DC2626',
      dangerSoft: 'rgba(220,38,38,0.1)',
      cyan: '#67E8F9',
      blue: '#38BDF8',
      lime: '#BEF264',
      pink: '#FB7185',
      amber: '#FBBF24',
      violet: '#A78BFA',
    },
    gradients: {
      screen: ['#F8FAFC', '#EEF2FF', '#E0F2FE'],
      screenAlt: ['#F8FAFC', '#F1F5F9', '#E2E8F0'],
      primary: ['#2563EB', '#0891B2'],
      secondary: ['rgba(255,255,255,0.94)', 'rgba(241,245,249,0.94)'],
      dark: ['rgba(15,23,42,0.08)', 'rgba(15,23,42,0.04)'],
    },
  },
  neon: {
    name: 'neon',
    label: 'Neon',
    colors: {
      background: '#05030D',
      backgroundSoft: '#120A24',
      surface: 'rgba(255,255,255,0.92)',
      surfaceStrong: 'rgba(255,255,255,0.12)',
      panel: 'rgba(255,255,255,0.08)',
      panelStrong: 'rgba(255,255,255,0.14)',
      panelLight: 'rgba(255,255,255,0.94)',
      border: 'rgba(217,70,239,0.22)',
      borderStrong: 'rgba(103,232,249,0.34)',
      text: '#FFFFFF',
      textDark: '#0B0614',
      muted: 'rgba(245,208,254,0.72)',
      mutedStrong: 'rgba(245,208,254,0.9)',
      accent: '#7C3AED',
      accentSoft: 'rgba(124,58,237,0.16)',
      onAccent: '#FFFFFF',
      danger: '#FB7185',
      dangerSoft: 'rgba(251,113,133,0.14)',
      cyan: '#22D3EE',
      blue: '#60A5FA',
      lime: '#D9F99D',
      pink: '#F472B6',
      amber: '#FDE047',
      violet: '#C084FC',
    },
    gradients: {
      screen: ['#05030D', '#160B2D', '#3B0764'],
      screenAlt: ['#05030D', '#111827', '#581C87'],
      primary: ['#F0ABFC', '#22D3EE'],
      secondary: ['rgba(217,70,239,0.18)', 'rgba(34,211,238,0.08)'],
      dark: ['rgba(255,255,255,0.12)', 'rgba(217,70,239,0.08)'],
    },
  },
  calm: {
    name: 'calm',
    label: 'Calmo',
    colors: {
      background: '#071214',
      backgroundSoft: '#0E2428',
      surface: 'rgba(240,253,250,0.94)',
      surfaceStrong: 'rgba(236,253,245,0.13)',
      panel: 'rgba(236,253,245,0.075)',
      panelStrong: 'rgba(236,253,245,0.13)',
      panelLight: 'rgba(240,253,250,0.94)',
      border: 'rgba(153,246,228,0.16)',
      borderStrong: 'rgba(153,246,228,0.28)',
      text: '#F0FDFA',
      textDark: '#082F2E',
      muted: 'rgba(204,251,241,0.68)',
      mutedStrong: 'rgba(204,251,241,0.88)',
      accent: '#0F766E',
      accentSoft: 'rgba(15,118,110,0.16)',
      onAccent: '#FFFFFF',
      danger: '#E11D48',
      dangerSoft: 'rgba(225,29,72,0.14)',
      cyan: '#99F6E4',
      blue: '#7DD3FC',
      lime: '#CCFBF1',
      pink: '#F9A8D4',
      amber: '#FDE68A',
      violet: '#C4B5FD',
    },
    gradients: {
      screen: ['#071214', '#0F2A2E', '#164E63'],
      screenAlt: ['#071214', '#0E2428', '#134E4A'],
      primary: ['#CCFBF1', '#7DD3FC'],
      secondary: ['rgba(153,246,228,0.14)', 'rgba(125,211,252,0.08)'],
      dark: ['rgba(255,255,255,0.1)', 'rgba(153,246,228,0.06)'],
    },
  },
  party: {
    name: 'party',
    label: 'Festa',
    colors: {
      background: '#120917',
      backgroundSoft: '#24111F',
      surface: 'rgba(255,247,237,0.94)',
      surfaceStrong: 'rgba(255,255,255,0.14)',
      panel: 'rgba(255,255,255,0.08)',
      panelStrong: 'rgba(255,255,255,0.14)',
      panelLight: 'rgba(255,247,237,0.94)',
      border: 'rgba(251,146,60,0.2)',
      borderStrong: 'rgba(251,113,133,0.3)',
      text: '#FFF7ED',
      textDark: '#1F130B',
      muted: 'rgba(254,215,170,0.72)',
      mutedStrong: 'rgba(254,215,170,0.9)',
      accent: '#C2410C',
      accentSoft: 'rgba(194,65,12,0.16)',
      onAccent: '#FFFFFF',
      danger: '#E11D48',
      dangerSoft: 'rgba(225,29,72,0.14)',
      cyan: '#FDBA74',
      blue: '#F0ABFC',
      lime: '#FDE68A',
      pink: '#FB7185',
      amber: '#F59E0B',
      violet: '#E879F9',
    },
    gradients: {
      screen: ['#120917', '#2E1065', '#7C2D12'],
      screenAlt: ['#120917', '#3B0764', '#9A3412'],
      primary: ['#FDE68A', '#FB7185'],
      secondary: ['rgba(251,146,60,0.16)', 'rgba(251,113,133,0.08)'],
      dark: ['rgba(255,255,255,0.12)', 'rgba(251,146,60,0.06)'],
    },
  },
};

export const themeNames = Object.keys(themes) as ThemeName[];
export const colors = themes.dark.colors;
export const gradients = themes.dark.gradients;
export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  button: 16,
  card: 22,
  chip: 999,
  pill: 999,
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  eyebrow: {
    fontSize: 12,
    fontWeight: '900' as const,
    letterSpacing: 0,
    textTransform: 'uppercase' as const,
  },
  h1: {
    fontSize: 31,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  h2: {
    fontSize: 24,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  h3: {
    fontSize: 18,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  button: {
    fontSize: 16,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
};

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
};

type ThemeContextValue = {
  theme: AppTheme;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.dark,
  themeName: 'dark',
  setThemeName: async () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>('dark');

  useEffect(() => {
    void AsyncStorage.getItem(THEME_KEY).then((storedTheme) => {
      if (storedTheme && storedTheme in themes) {
        setThemeNameState(storedTheme as ThemeName);
      }
    });
  }, []);

  async function setThemeName(name: ThemeName) {
    setThemeNameState(name);
    try {
      await AsyncStorage.setItem(THEME_KEY, name);
    } catch {
      // Keep the in-memory theme if storage is temporarily unavailable.
    }
  }

  const value = useMemo(
    () => ({
      theme: themes[themeName],
      themeName,
      setThemeName,
    }),
    [themeName]
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useThemeController() {
  return useContext(ThemeContext);
}

export function useAppTheme() {
  return useContext(ThemeContext).theme;
}
