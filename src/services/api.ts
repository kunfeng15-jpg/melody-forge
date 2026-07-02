import { Song } from '../types/audio';

const API_BASE_URL = 'http://localhost:8000';

type ApiSong = {
  id: number;
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  mood?: string | null;
  duration: number;
  file_path: string;
  cover_url?: string | null;
  lyrics?: string | null;
  is_ai_generated: boolean | number;
};

export interface GenerateSongRequest {
  theme: string;
  mood?: string;
  genre?: string;
  duration?: number;
  engine?: 'suno' | 'musicgen';
}

export interface GenerateSongResponse {
  success: boolean;
  audio_url?: string;
  title?: string;
  lyrics?: string;
  engine_used: string;
  error?: string;
}

export interface Playlist {
  id: number;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  created_at?: string;
  song_count?: number;
  songs?: Song[];
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  cover_url?: string;
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  cover_url?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

function mapSong(song: ApiSong): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album ?? undefined,
    genre: song.genre ?? undefined,
    mood: song.mood ?? undefined,
    duration: song.duration ?? 0,
    filePath: song.file_path,
    coverUrl: song.cover_url ?? undefined,
    lyrics: song.lyrics ?? undefined,
    isAiGenerated: Boolean(song.is_ai_generated),
  };
}

function mapPlaylist(playlist: Playlist & { songs?: ApiSong[] }): Playlist {
  return {
    ...playlist,
    songs: playlist.songs?.map(mapSong),
  };
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health'),
  status: () => request<Record<string, unknown>>('/status'),
  generateSong: (data: GenerateSongRequest) =>
    request<GenerateSongResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSongs: async () => {
    const songs = await request<ApiSong[]>('/songs');
    return songs ? songs.map(mapSong) : [];
  },
  getFavorites: async () => {
    const songs = await request<ApiSong[]>('/favorites');
    return songs ? songs.map(mapSong) : [];
  },
  addFavorite: (songId: number) =>
    request<{ success: boolean }>(`/favorites?song_id=${songId}`, {
      method: 'POST',
    }),
  removeFavorite: (songId: number) =>
    request<{ success: boolean }>(`/favorites/${songId}`, {
      method: 'DELETE',
    }),
  getPlaylists: async () => {
    const playlists = await request<Array<Playlist & { songs?: ApiSong[] }>>('/playlists');
    return playlists ? playlists.map(mapPlaylist) : [];
  },
  getPlaylist: async (playlistId: number) => {
    const playlist = await request<Playlist & { songs?: ApiSong[] }>(`/playlists/${playlistId}`);
    return playlist ? mapPlaylist(playlist) : null;
  },
  createPlaylist: (data: CreatePlaylistRequest) =>
    request<Playlist>('/playlists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePlaylist: (playlistId: number, data: UpdatePlaylistRequest) =>
    request<Playlist>(`/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePlaylist: (playlistId: number) =>
    request<{ success: boolean }>(`/playlists/${playlistId}`, {
      method: 'DELETE',
    }),
  addSongToPlaylist: (playlistId: number, songId: number, position?: number) =>
    request<{ success: boolean }>(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ song_id: songId, position }),
    }),
  removeSongFromPlaylist: (playlistId: number, songId: number) =>
    request<{ success: boolean }>(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
    }),
};
