export interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  mood?: string;
  duration: number;
  filePath: string;
  coverUrl?: string;
  lyrics?: string;
  isAiGenerated: boolean;
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
