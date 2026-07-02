import { useState, useRef, useCallback, useEffect } from 'react';
import { Song, PlayerState } from '../types/audio';

/** 生成一段静音 WAV Blob URL（3 秒），代替不存在或加载失败的音频 */
function createSilentAudio(): string {
  try {
    const ctx = new AudioContext();
    const sr = ctx.sampleRate;
    const length = sr * 3;
    const buf = ctx.createBuffer(1, length, sr);
    const data = buf.getChannelData(0);
    // -60dB 极低底噪，波形可见但不可闻
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() - 0.5) * 0.001;
    }
    const wav = audioBufferToWav(buf);
    const blob = new Blob([wav], { type: 'audio/wav' });
    ctx.close();
    return URL.createObjectURL(blob);
  } catch {
    return '';
  }
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const data = buffer.getChannelData(0);
  const dataLength = data.length * numChannels * (bitsPerSample / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return arrayBuffer;
}

let _silentUrl: string | null = null;
function getSilentUrl(): string {
  if (!_silentUrl) _silentUrl = createSilentAudio();
  return _silentUrl;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    currentSong: null,
    playlist: [],
    currentIndex: -1,
  });

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  /** 重新加载当前音频，失败时自动回退到静音 WAV */
  const reloadWithFallback = useCallback(() => {
    if (!audioRef.current) return;
    // 保留原始 src，仅挂载 onerror 和 oncanplaythrough
    const currentSrc = audioRef.current.src;
    audioRef.current.onerror = () => {
      if (audioRef.current && audioRef.current.src !== getSilentUrl()) {
        audioRef.current.src = getSilentUrl();
        audioRef.current.load();
      }
    };
    if (currentSrc && !currentSrc.startsWith('blob:')) {
      audioRef.current.load();
    }
  }, []);

  const loadSong = useCallback((song: Song, playlist: Song[] = []) => {
    const index = playlist.findIndex(s => s.id === song.id);
    if (audioRef.current) {
      audioRef.current.src = song.filePath || getSilentUrl();
      audioRef.current.onerror = () => {
        if (audioRef.current && audioRef.current.src !== getSilentUrl()) {
          audioRef.current.src = getSilentUrl();
          audioRef.current.load();
        }
      };
      audioRef.current.load();
    }
    setState(prev => ({
      ...prev,
      currentSong: song,
      playlist,
      currentIndex: index >= 0 ? index : -1,
      currentTime: 0,
    }));
  }, []);

  const next = useCallback(() => {
    if (state.currentIndex < state.playlist.length - 1) {
      const nextSong = state.playlist[state.currentIndex + 1];
      loadSong(nextSong, state.playlist);
      play();
    }
  }, [state.currentIndex, state.playlist, loadSong, play]);

  const previous = useCallback(() => {
    if (state.currentIndex > 0) {
      const prevSong = state.playlist[state.currentIndex - 1];
      loadSong(prevSong, state.playlist);
      play();
    }
  }, [state.currentIndex, state.playlist, loadSong, play]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setState(prev => ({ ...prev, volume }));
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const updateTime = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const updateDuration = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  return {
    ...state,
    audioRef,
    play,
    pause,
    togglePlay,
    loadSong,
    reloadWithFallback,
    next,
    previous,
    seek,
    setVolume,
  };
}
