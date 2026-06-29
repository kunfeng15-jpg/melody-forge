import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';
export type DefaultEngine = 'suno' | 'musicgen';

interface SettingsStore {
  theme: Theme;
  defaultEngine: DefaultEngine;
  defaultDuration: number;
  autoPlay: boolean;
  showVisualization: boolean;
  setTheme: (theme: Theme) => void;
  setDefaultEngine: (engine: DefaultEngine) => void;
  setDefaultDuration: (duration: number) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setShowVisualization: (showVisualization: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      defaultEngine: 'suno',
      defaultDuration: 30,
      autoPlay: true,
      showVisualization: true,
      setTheme: (theme) => set({ theme }),
      setDefaultEngine: (defaultEngine) => set({ defaultEngine }),
      setDefaultDuration: (defaultDuration) => set({ defaultDuration }),
      setAutoPlay: (autoPlay) => set({ autoPlay }),
      setShowVisualization: (showVisualization) => set({ showVisualization }),
    }),
    {
      name: 'melodyforge-settings-store',
    },
  ),
);
