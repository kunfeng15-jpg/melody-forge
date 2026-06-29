import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
        className="text-gray-400 hover:text-white"
      >
        {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );
};
