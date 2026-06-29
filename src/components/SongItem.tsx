import React from 'react';
import { Play, Heart } from 'lucide-react';
import { Song } from '../types/audio';

interface SongItemProps {
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export const SongItem: React.FC<SongItemProps> = ({
  song,
  isPlaying,
  isCurrent,
  onPlay,
  onToggleFavorite,
  isFavorite,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isCurrent ? 'bg-gray-700' : 'hover:bg-gray-800'
      }`}
      onClick={onPlay}
    >
      <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
        {isPlaying && isCurrent ? (
          <div className="flex gap-0.5">
            <div className="w-1 h-4 bg-green-500 animate-pulse" />
            <div className="w-1 h-6 bg-green-500 animate-pulse delay-75" />
            <div className="w-1 h-3 bg-green-500 animate-pulse delay-150" />
          </div>
        ) : (
          <Play size={16} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-green-400' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-gray-500">{formatDuration(song.duration)}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`${isFavorite ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
      >
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
};
