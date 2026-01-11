'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePalette =
  | 'violet'
  | 'blue'
  | 'green'
  | 'orange'
  | 'pink'
  | 'teal'
  | 'amber'
  | 'indigo'
  | 'coral'
  | 'midnight'
  | 'monochrome'
  | 'slate';

export type ThemeMode = 'light' | 'dark';

export interface ThemePaletteInfo {
  id: ThemePalette;
  name: string;
  primaryColor: string; // Light mode primary color for preview
}

export const THEME_PALETTES: ThemePaletteInfo[] = [
  { id: 'violet', name: 'Violet', primaryColor: '#6750a4' },
  { id: 'blue', name: 'Blue', primaryColor: '#1976d2' },
  { id: 'green', name: 'Green', primaryColor: '#2e7d32' },
  { id: 'orange', name: 'Orange', primaryColor: '#e65100' },
  { id: 'pink', name: 'Pink', primaryColor: '#c2185b' },
  { id: 'teal', name: 'Teal', primaryColor: '#00796b' },
  { id: 'amber', name: 'Amber', primaryColor: '#f59e0b' },
  { id: 'indigo', name: 'Indigo', primaryColor: '#4f46e5' },
  { id: 'coral', name: 'Coral', primaryColor: '#f97316' },
  { id: 'midnight', name: 'Midnight', primaryColor: '#1e3a5f' },
  { id: 'monochrome', name: 'Monochrome', primaryColor: '#191919' },
  { id: 'slate', name: 'Slate', primaryColor: '#475569' },
];

interface ThemeState {
  palette: ThemePalette;
  mode: ThemeMode;
  setPalette: (palette: ThemePalette) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      palette: 'teal', // Default theme is teal
      mode: 'light',
      setPalette: (palette) => set({ palette }),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'pdf-builder-theme', // localStorage key
    }
  )
);
