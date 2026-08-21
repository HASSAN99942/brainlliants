import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from '../constants/colors';
import { cache } from '../storage/cache';

export type ThemeMode = 'light' | 'dark';
export type ThemePref = ThemeMode | 'system';

const PREF_KEY = 'pref_theme';

interface ThemeState {
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}

function loadPref(): ThemePref {
  const saved = cache.get<string>(PREF_KEY);
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

export const useThemeStore = create<ThemeState>((set) => ({
  pref: loadPref(),
  setPref: (p) => { cache.set(PREF_KEY, p); set({ pref: p }); },
}));

interface ResolvedTheme {
  mode: ThemeMode;
  colors: ThemeColors;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}

export function useTheme(): ResolvedTheme {
  const pref = useThemeStore((s) => s.pref);
  const system = useColorScheme();
  const mode: ThemeMode = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref;
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    pref,
    setPref: useThemeStore((s) => s.setPref),
  };
}
