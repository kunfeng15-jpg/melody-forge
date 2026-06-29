import { useState, useRef, useCallback, useEffect } from 'react';
import { Song, PlayerState } from '../types/audio';

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
      audioRef.current.play();
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

  const loadSong = useCallback((song: Song, playlist: Song[] = []) => {
    const index = playlist.findIndex(s => s.id === song.id);
    if (audioRef.current) {
      audioRef.current.src = song.filePath;
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
      if (state.currentIndex < state.playlist.length - 1) {
        next();
      }
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
  }, [next, state.currentIndex, state.playlist.length]);

  return {
    ...state,
    audioRef,
    play,
    pause,
    togglePlay,
    loadSong,
    next,
    previous,
    seek,
    setVolume,
  };
}
