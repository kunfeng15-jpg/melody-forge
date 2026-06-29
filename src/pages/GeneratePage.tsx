import React, { useState } from 'react';
import { GenerationForm } from '../components/GenerationForm';
import { LyricsDisplay } from '../components/LyricsDisplay';
import {
  type Song,
  type GeneratedSong,
  type GenerateParams,
  type GenerateResponseRaw,
} from '../types/audio';

const API_URL = 'http://localhost:8000/generate';

/** Normalizes the backend payload into the shape the UI uses. */
function normalizeSong(raw: GenerateResponseRaw, fallbackTitle: string): GeneratedSong {
  return {
    title: raw.title ?? fallbackTitle,
    audioUrl: raw.audioUrl ?? raw.audio_url ?? '',
    lyrics: raw.lyrics ?? '',
    duration: raw.duration,
  };
}

async function generateSong(params: GenerateParams): Promise<GeneratedSong> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`生成失败（HTTP ${res.status}）`);
  }

  const raw = (await res.json()) as GenerateResponseRaw;
  return normalizeSong(raw, params.theme);
}

interface GeneratePageProps {
  onPlaySong?: (song: Song) => void;
}

export const GeneratePage: React.FC<GeneratePageProps> = ({ onPlaySong }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [song, setSong] = useState<GeneratedSong | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const handleSubmit = async (params: GenerateParams) => {
    setIsLoading(true);
    setError(null);
    setSong(null);
    setCurrentTime(0);
    try {
      const result = await generateSong(params);
      setSong(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '生成失败，请确认后端服务已启动（localhost:8000）。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayGenerated = () => {
    if (!song || !onPlaySong) return;
    onPlaySong({
      id: Date.now(),
      title: song.title,
      artist: 'AI Generated',
      genre: '',
      mood: '',
      duration: song.duration ?? 0,
      filePath: song.audioUrl,
      isAiGenerated: true,
      lyrics: song.lyrics,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-white">生成歌曲</h1>
        <p className="text-sm text-gray-400">
          输入主题，选择情绪、曲风与时长，让 AI 为你谱写。
        </p>
      </header>

      <GenerationForm onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {song && (
        <section className="space-y-4 rounded-2xl bg-gray-900/70 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{song.title}</h2>
            {onPlaySong && (
              <button
                type="button"
                onClick={handlePlayGenerated}
                disabled={!song.audioUrl}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                播放
              </button>
            )}
          </div>

          {song.audioUrl ? (
            <audio
              src={song.audioUrl}
              controls
              className="w-full"
              onTimeUpdate={(e) =>
                setCurrentTime(e.currentTarget.currentTime)
              }
            />
          ) : (
            <p className="text-sm text-gray-500">未返回音频地址。</p>
          )}

          {song.lyrics && (
            <LyricsDisplay lyrics={song.lyrics} currentTime={currentTime} />
          )}
        </section>
      )}
    </div>
  );
};

export default GeneratePage;
