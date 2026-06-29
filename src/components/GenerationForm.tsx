import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  DURATIONS,
  GENRES,
  MOODS,
  type Duration,
  type GenerateParams,
  type Genre,
  type Mood,
} from '../types/audio';

interface GenerationFormProps {
  onSubmit: (params: GenerateParams) => void;
  isLoading?: boolean;
}

/** A pill-style toggle button used by each option group. */
function OptionPill({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-full px-3 py-1.5 text-sm transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'bg-green-500 text-black'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [theme, setTheme] = useState('');
  const [mood, setMood] = useState<Mood>('Happy');
  const [genre, setGenre] = useState<Genre>('Pop');
  const [duration, setDuration] = useState<Duration>(60);

  const canSubmit = theme.trim().length > 0 && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ theme: theme.trim(), mood, genre, duration });
  };

  return (
    <div className="space-y-6 rounded-2xl bg-gray-900/70 p-6">
      {/* Theme */}
      <div className="space-y-2">
        <label
          htmlFor="theme"
          className="block text-sm font-medium text-gray-300"
        >
          主题
        </label>
        <input
          id="theme"
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          disabled={isLoading}
          placeholder="例如：夏夜的海边、错过的列车…"
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-green-500 disabled:opacity-50"
        />
      </div>

      {/* Mood */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-300">情绪</span>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <OptionPill
              key={m}
              label={m}
              selected={mood === m}
              onClick={() => setMood(m)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Genre */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-300">曲风</span>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <OptionPill
              key={g}
              label={g}
              selected={genre === g}
              onClick={() => setGenre(g)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-gray-300">时长</span>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <OptionPill
              key={d.value}
              label={d.label}
              selected={duration === d.value}
              onClick={() => setDuration(d.value)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 font-semibold text-black transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            生成中…
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            生成歌曲
          </>
        )}
      </button>
    </div>
  );
};
