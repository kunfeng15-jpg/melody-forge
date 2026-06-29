// Shared types for the audio visualizer, lyrics, and generation features.

export interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  mood: string;
  duration: number;
  filePath: string;
  isAiGenerated: boolean;
  lyrics?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentSong: Song | null;
  playlist: Song[];
  currentIndex: number;
}

export type Mood =
  | 'Happy'
  | 'Sad'
  | 'Energetic'
  | 'Calm'
  | 'Dreamy'
  | 'Dark'
  | 'Romantic'
  | 'Epic';

export type Genre =
  | 'Pop'
  | 'Rock'
  | 'Electronic'
  | 'Jazz'
  | 'Classical'
  | 'Hip Hop'
  | 'Ambient'
  | 'Folk';

export type Duration = 30 | 60 | 120 | 180;

export const MOODS: Mood[] = [
  'Happy',
  'Sad',
  'Energetic',
  'Calm',
  'Dreamy',
  'Dark',
  'Romantic',
  'Epic',
];

export const GENRES: Genre[] = [
  'Pop',
  'Rock',
  'Electronic',
  'Jazz',
  'Classical',
  'Hip Hop',
  'Ambient',
  'Folk',
];

export const DURATIONS: { value: Duration; label: string }[] = [
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 120, label: '120s' },
  { value: 180, label: '180s' },
];

/** Parameters collected from the generation form. */
export interface GenerateParams {
  theme: string;
  mood: Mood;
  genre: Genre;
  duration: Duration;
}

/** Normalized song shape used by the UI. */
export interface GeneratedSong {
  title: string;
  audioUrl: string;
  lyrics: string;
  duration?: number;
}

/**
 * Raw response from POST /generate. The backend may use snake_case
 * (audio_url) or camelCase (audioUrl); both are tolerated by the
 * normalizer in GeneratePage.
 */
export interface GenerateResponseRaw {
  title?: string;
  audio_url?: string;
  audioUrl?: string;
  lyrics?: string;
  duration?: number;
  [key: string]: unknown;
}
