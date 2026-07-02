import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Song } from '../types/audio';
import { api } from '../services/api';

interface SongStore {
  songs: Song[];
  favorites: number[];
  isLoading: boolean;
  error: string | null;
  setSongs: (songs: Song[]) => void;
  fetchSongs: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (songId: number) => Promise<void>;
  isFavorite: (songId: number) => boolean;
}

export const useSongStore = create<SongStore>()(
  persist(
    (set, get) => ({
      songs: [],
      favorites: [],
      isLoading: false,
      error: null,
      setSongs: (songs) => set({ songs }),
      fetchSongs: async () => {
        set({ isLoading: true, error: null });
        try {
          const songs = await api.getSongs();
          set({ songs, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },
      fetchFavorites: async () => {
        try {
          const favorites = await api.getFavorites();
          set({ favorites: favorites.map((song) => song.id) });
        } catch {
          // Favorites are persisted locally, so the app can still work offline.
        }
      },
      toggleFavorite: async (songId) => {
        const favorites = get().favorites;
        const isFavorite = favorites.includes(songId);
        const nextFavorites = isFavorite
          ? favorites.filter((id) => id !== songId)
          : [...favorites, songId];

        set({ favorites: nextFavorites });

        try {
          if (isFavorite) {
            await api.removeFavorite(songId);
          } else {
            await api.addFavorite(songId);
          }
        } catch {
          set({ favorites });
        }
      },
      isFavorite: (songId) => get().favorites.includes(songId),
    }),
    {
      name: 'melodyforge-song-store',
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);
