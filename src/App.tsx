import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerControls } from './components/PlayerControls';
import { HomePage } from './pages/HomePage';
import { GeneratePage } from './pages/GeneratePage';
import { AudioVisualizer } from './components/AudioVisualizer';
import { LyricsDisplay } from './components/LyricsDisplay';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useAudioVisualizer } from './hooks/useAudioVisualizer';
import { Song } from './types/audio';

// Mock data for testing
const mockSongs: Song[] = [
  {
    id: 1,
    title: 'Midnight Dreams',
    artist: 'AI Generated',
    genre: 'Ambient',
    mood: 'Dreamy',
    duration: 180,
    filePath: '/mock/audio1.mp3',
    isAiGenerated: true,
    lyrics: 'Walking through the midnight sky\nDreams are floating by\nStars are shining bright tonight\nEverything feels right',
  },
  {
    id: 2,
    title: 'Electric Rain',
    artist: 'AI Generated',
    genre: 'Electronic',
    mood: 'Energetic',
    duration: 240,
    filePath: '/mock/audio2.mp3',
    isAiGenerated: true,
    lyrics: 'Rain is falling electric blue\nBeats are pulsing through\nNeon lights and city sounds\nEnergy all around',
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const player = useAudioPlayer();
  const { initAnalyser, getFrequencyData } = useAudioVisualizer(player.audioRef);

  // Initialize audio visualizer when playback starts
  useEffect(() => {
    if (player.isPlaying) {
      void initAnalyser();
    }
  }, [player.isPlaying, initAnalyser]);

  const handlePlaySong = (song: Song) => {
    if (player.currentSong?.id === song.id) {
      player.togglePlay();
    } else {
      player.loadSong(song, mockSongs);
      player.play();
    }
  };

  const handleToggleFavorite = (songId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handlePlayGenerated = (song: Song) => {
    handlePlaySong(song);
    setActiveTab('home');
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-24">
          {activeTab === 'home' && (
            <HomePage
              songs={mockSongs}
              currentSong={player.currentSong}
              isPlaying={player.isPlaying}
              favorites={favorites}
              onPlaySong={handlePlaySong}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          {activeTab === 'generate' && (
            <GeneratePage onPlaySong={handlePlayGenerated} />
          )}
          {/* Other tabs will be implemented later */}
        </main>

        {/* Audio Visualizer */}
        {player.currentSong && (
          <div className="px-4 pt-2">
            <AudioVisualizer
              getFrequencyData={getFrequencyData}
              isPlaying={player.isPlaying}
            />
          </div>
        )}

        {/* Lyrics Display */}
        {player.currentSong?.lyrics && (
          <div className="px-4 py-2">
            <LyricsDisplay
              lyrics={player.currentSong.lyrics}
              currentTime={player.currentTime}
            />
          </div>
        )}

        <PlayerControls
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.volume}
          currentSong={player.currentSong}
          onPlayPause={player.togglePlay}
          onNext={player.next}
          onPrevious={player.previous}
          onSeek={player.seek}
          onVolumeChange={player.setVolume}
        />
      </div>
    </div>
  );
}

export default App;