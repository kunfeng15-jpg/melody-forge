import React, { useEffect, useMemo, useRef } from 'react';

interface LyricsDisplayProps {
  /** Raw lyrics text, one line per row (separated by '\n'). */
  lyrics: string;
  /** Current playback position in seconds. */
  currentTime: number;
  /** Approximate seconds each line is held. Defaults to 5. */
  secondsPerLine?: number;
  className?: string;
}

/**
 * Displays lyrics synced to playback. The active line is highlighted
 * (green + slightly enlarged), already-played lines are dimmed, and
 * upcoming lines use the default color. Each line lasts ~secondsPerLine.
 */
export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics,
  currentTime,
  secondsPerLine = 5,
  className = '',
}) => {
  const lines = useMemo(
    () =>
      lyrics
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [lyrics]
  );

  const activeIndex =
    lines.length > 0
      ? Math.min(Math.floor(currentTime / secondsPerLine), lines.length - 1)
      : -1;

  const activeRef = useRef<HTMLParagraphElement>(null);

  // Keep the active line centered as playback advances.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex]);

  if (lines.length === 0) {
    return (
      <div className={`py-6 text-center text-gray-500 ${className}`}>
        暂无歌词
      </div>
    );
  }

  return (
    <div
      className={`max-h-64 space-y-2 overflow-y-auto px-4 py-2 ${className}`}
    >
      {lines.map((line, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <p
            key={i}
            ref={isActive ? activeRef : undefined}
            className={[
              'text-center transition-all duration-300',
              isActive
                ? 'scale-105 font-semibold text-green-400'
                : isPast
                ? 'text-gray-600'
                : 'text-gray-300',
            ].join(' ')}
          >
            {line}
          </p>
        );
      })}
    </div>
  );
};
