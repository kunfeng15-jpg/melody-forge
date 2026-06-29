import React from 'react';
import { SongList } from '../components/SongList';
import { Song } from '../types/audio';

interface HomePageProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  favorites: Set<number>;
  onPlaySong: (song: Song) => void;
  onToggleFavorite: (songId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  songs,
  currentSong,
  isPlaying,
  favorites,
  onPlaySong,
  onToggleFavorite,
}) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Library</h2>
      <SongList
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        favorites={favorites}
        onPlaySong={onPlaySong}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
};
