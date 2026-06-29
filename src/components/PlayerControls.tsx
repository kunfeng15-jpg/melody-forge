import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { Song } from '../types/audio';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentSong: Song | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  currentSong,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* Song info */}
        <div className="w-48 flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
            {currentSong?.coverUrl ? (
              <img src={currentSong.coverUrl} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span className="text-gray-500 text-xs">♪</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{currentSong?.title || 'No song'}</p>
            <p className="text-xs text-gray-400 truncate">{currentSong?.artist || 'Select a song'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={onPlayPause}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />
        </div>

        {/* Volume */}
        <div className="w-32">
          <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />
        </div>
      </div>
    </div>
  );
};
