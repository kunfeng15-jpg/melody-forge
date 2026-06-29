import { useCallback, useEffect, useRef } from 'react';

/**
 * Sets up a Web Audio AnalyserNode on top of an existing <audio> element
 * and exposes real-time frequency data for visualization.
 *
 * Usage:
 *   const { initAnalyser, getFrequencyData } = useAudioVisualizer(audioRef);
 *   // call initAnalyser() from a user gesture (e.g. the play handler)
 *   // call getFrequencyData() each animation frame
 *
 * Notes:
 * - A single <audio> element can only ever be wired to ONE
 *   MediaElementAudioSourceNode for its lifetime, so the source is created
 *   lazily and guarded.
 * - AudioContext starts suspended in most browsers; initAnalyser() resumes
 *   it, which must happen inside a user gesture to satisfy autoplay policy.
 */
export function useAudioVisualizer(
  audioRef: React.RefObject<HTMLAudioElement>
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Workaround: TS strict mode treats Uint8Array as generic over ArrayBuffer,
  // but getByteFrequencyData populates a Uint8Array backed by ArrayBufferLike.
  // We use a plain array ref to avoid the type mismatch.
  const freqDataRef = useRef<number[]>([]);

  const initAnalyser = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    // Create the AudioContext once.
    if (!audioContextRef.current) {
      const Ctx: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioContextRef.current = new Ctx();
    }
    const ctx = audioContextRef.current;

    // Create the analyser once. fftSize 256 -> 128 frequency bins.
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      freqDataRef.current = new Array(analyser.frequencyBinCount).fill(0);
    }

    // Wire the element into the graph once: source -> analyser -> output.
    if (!sourceRef.current) {
      try {
        const source = ctx.createMediaElementSource(audioEl);
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
        sourceRef.current = source;
      } catch (err) {
        // Thrown if a source node already exists for this element.
        // Safe to ignore — the existing graph is reused.
        console.warn(
          'useAudioVisualizer: media element already has a source node',
          err
        );
      }
    }

    // Resume if the browser suspended the context (autoplay policy).
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('useAudioVisualizer: failed to resume AudioContext', err);
      }
    }
  }, [audioRef]);

  const getFrequencyData = useCallback((): number[] => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyser.getByteFrequencyData(dataArray as any);
    // Copy to plain number array to avoid TS strict ArrayBufferLike issues
    const result: number[] = [];
    for (let i = 0; i < dataArray.length; i++) {
      result.push(dataArray[i]);
    }
    return result;
  }, []);

  // Tear down the audio graph on unmount.
  useEffect(() => {
    return () => {
      try {
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
      } catch {
        /* no-op */
      }
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {
          /* no-op */
        });
      }
    };
  }, []);

  return { initAnalyser, getFrequencyData };
}
