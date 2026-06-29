import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerControls } from './components/PlayerControls';
import { HomePage } from './pages/HomePage';
import { useAudioPlayer } from './hooks/useAudioPlayer';
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
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const player = useAudioPlayer();

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
          {/* Other tabs will be implemented later */}
        </main>
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