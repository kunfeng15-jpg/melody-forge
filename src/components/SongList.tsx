import React from 'react';
import { SongItem } from './SongItem';
import { Song } from '../types/audio';

interface SongListProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  favorites: Set<number>;
  onPlaySong: (song: Song) => void;
  onToggleFavorite: (songId: number) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  currentSong,
  isPlaying,
  favorites,
  onPlaySong,
  onToggleFavorite,
}) => {
  return (
    <div className="space-y-1">
      {songs.map((song) => (
        <SongItem
          key={song.id}
          song={song}
          isPlaying={isPlaying}
          isCurrent={currentSong?.id === song.id}
          onPlay={() => onPlaySong(song)}
          onToggleFavorite={() => onToggleFavorite(song.id)}
          isFavorite={favorites.has(song.id)}
        />
      ))}
    </div>
  );
};
