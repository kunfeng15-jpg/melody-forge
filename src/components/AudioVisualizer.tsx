import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  /** Returns the latest frequency byte data (length === fftSize / 2). */
  getFrequencyData: () => number[];
  /** Only animates while playing; clears the canvas when paused. */
  isPlaying: boolean;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Draws an animated frequency spectrum onto a canvas.
 * Bars are colored with an HSL gradient from green to blue and their
 * height tracks the frequency magnitude.
 */
export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  getFrequencyData,
  isPlaying,
  width = 600,
  height = 100,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render crisply on high-DPI displays. Setting width/height resets the
    // canvas transform, so re-apply the scale on every effect run.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const draw = () => {
      const data = getFrequencyData();
      ctx.clearRect(0, 0, width, height);

      const bars = data.length; // 128 for fftSize 256
      if (bars > 0) {
        const gap = 1;
        const barWidth = (width - gap * (bars - 1)) / bars;

        for (let i = 0; i < bars; i++) {
          const value = data[i] / 255; // 0..1
          const barHeight = value * height;

          // Hue 120 (green) -> 220 (blue) across the spectrum,
          // brightened slightly by the bar's intensity.
          const hue = 120 + (i / bars) * 100;
          const lightness = 35 + value * 25;
          ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;

          const x = i * (barWidth + gap);
          const y = height - barHeight;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [getFrequencyData, isPlaying, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`rounded-lg bg-black/30 ${className}`}
    />
  );
};
