# MelodyForge — AI 个人音乐播放器 实现计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 构建一款跨平台（桌面+Web）AI 个人音乐播放器，支持用户输入主题/情绪/曲风，自动生成 AI 歌曲并播放，具备完整播放器功能、音频可视化、收藏历史等进阶特性。

**Architecture:** Tauri (Rust + WebView) 提供跨平台桌面壳，前端 React + TypeScript 构建 UI，Python 后端服务处理 AI 音频生成（Suno API 优先 + MusicGen 本地 fallback），SQLite 本地存储歌曲元数据和播放历史，通过 Tauri Command 桥接前后端。

**Tech Stack:**
- **Desktop Shell:** Tauri (Rust) — 轻量、安全、跨平台
- **Frontend:** React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Audio Engine:** Web Audio API（播放/可视化）
- **AI Generation:** Python FastAPI 服务
  - 优先: Suno API（通过第三方代理或网页逆向）
  - Fallback: Facebook MusicGen（本地 MPS/CPU 推理）
- **Storage:** SQLite (local) + 未来扩展云端同步
- **Build:** Vite (前端) + Cargo (Tauri) + uv (Python)

---

## 项目结构

```
melody-forge/
├── src/                          # React 前端源码
│   ├── components/               # UI 组件
│   ├── pages/                    # 页面级组件
│   ├── hooks/                    # 自定义 React Hooks
│   ├── stores/                   # Zustand 状态管理
│   ├── services/                 # API 调用服务
│   ├── utils/                    # 工具函数
│   ├── types/                    # TypeScript 类型定义
│   └── assets/                   # 静态资源
├── src-tauri/                    # Tauri Rust 后端
│   ├── src/
│   │   └── main.rs               # 入口 + Command 定义
│   ├── Cargo.toml
│   └── tauri.conf.json
├── ai-service/                   # Python AI 生成服务
│   ├── main.py                   # FastAPI 入口
│   ├── generators/               # 音频生成器
│   │   ├── suno.py               # Suno API 调用
│   │   └── musicgen.py           # MusicGen 本地推理
│   ├── models/                   # Pydantic 模型
│   ├── utils/                    # 工具函数
│   └── requirements.txt
├── database/                     # SQLite 数据库
│   └── schema.sql                # 数据库结构
├── docs/                         # 文档
└── package.json / Cargo.toml / pyproject.toml
```

---

## Phase 1: 项目脚手架与基础架构

### Task 1: 初始化 Tauri + React 项目

**Objective:** 创建 Tauri + React + TypeScript 项目骨架

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`

**Step 1: 创建项目目录结构**

```bash
mkdir -p melody-forge/src/{components,pages,hooks,stores,services,utils,types,assets}
mkdir -p melody-forge/src-tauri/src
mkdir -p melody-forge/ai-service/{generators,models,utils}
mkdir -p melody-forge/database
```

**Step 2: 初始化前端**

```bash
cd melody-forge
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @tauri-apps/cli @tauri-apps/api
npm install zustand react-router-dom lucide-react
npm install -D @types/node
```

**Step 3: 配置 Tailwind**

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-900 text-white;
  }
}
```

**Step 4: 配置 Tauri**

`src-tauri/Cargo.toml`:
```toml
[package]
name = "melody-forge"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2.0", features = [] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

`src-tauri/tauri.conf.json`:
```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      }
    },
    "windows": [
      {
        "title": "MelodyForge",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.melodyforge.app"
    }
  }
}
```

`src-tauri/src/main.rs`:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 5: 验证运行**

```bash
npm run tauri dev
```
Expected: 桌面窗口弹出，显示 React 默认页面

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: init Tauri + React + TypeScript project"
```

---

### Task 2: 初始化 Python AI 服务

**Objective:** 创建 FastAPI 服务骨架，配置 MusicGen 环境

**Files:**
- Create: `ai-service/main.py`
- Create: `ai-service/requirements.txt`
- Create: `ai-service/pyproject.toml`
- Create: `ai-service/models/schemas.py`

**Step 1: 创建 Python 虚拟环境**

```bash
cd melody-forge/ai-service
python -m venv .venv
source .venv/bin/activate
```

**Step 2: 安装依赖**

`requirements.txt`:
```
fastapi==0.115.0
uvicorn==0.32.0
pydantic==2.9.0
httpx==0.27.0
torch==2.5.0
torchaudio==2.5.0
transformers==4.46.0
accelerate==1.0.0
audiocraft==1.3.0
sqlite3
python-multipart==0.0.17
```

```bash
pip install -r requirements.txt
```

**Step 3: 创建 FastAPI 入口**

`ai-service/main.py`:
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Literal
import uvicorn

app = FastAPI(title="MelodyForge AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    theme: str
    mood: Optional[str] = None
    genre: Optional[str] = None
    duration: Optional[int] = 30  # seconds
    engine: Optional[Literal["suno", "musicgen"]] = "suno"

class GenerateResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    title: Optional[str] = None
    lyrics: Optional[str] = None
    engine_used: str
    error: Optional[str] = None

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "melodyforge-ai"}

@app.post("/generate", response_model=GenerateResponse)
async def generate_song(request: GenerateRequest):
    # TODO: Implement generation logic
    return GenerateResponse(
        success=False,
        engine_used=request.engine,
        error="Not yet implemented"
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Step 4: 验证运行**

```bash
python main.py
```
Expected: 服务启动在 http://localhost:8000

```bash
curl http://localhost:8000/health
```
Expected: `{"status":"ok","service":"melodyforge-ai"}`

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: init FastAPI AI service with health endpoint"
```

---

### Task 3: 初始化 SQLite 数据库

**Objective:** 创建数据库结构，定义歌曲、播放列表、播放历史表

**Files:**
- Create: `database/schema.sql`
- Create: `database/init_db.py`

**Step 1: 定义数据库结构**

`database/schema.sql`:
```sql
-- Songs table
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'AI Generated',
    album TEXT,
    genre TEXT,
    mood TEXT,
    duration INTEGER, -- in seconds
    file_path TEXT NOT NULL,
    cover_url TEXT,
    lyrics TEXT,
    is_ai_generated BOOLEAN DEFAULT 1,
    generation_params TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playlist songs junction table
CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id INTEGER,
    song_id INTEGER,
    position INTEGER,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, song_id)
);

-- Play history table
CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_played INTEGER, -- in seconds
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    song_id INTEGER PRIMARY KEY,
    favorited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
CREATE INDEX IF NOT EXISTS idx_songs_mood ON songs(mood);
CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history(played_at);
```

**Step 2: 创建初始化脚本**

`database/init_db.py`:
```python
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'melodyforge.db')

def init_database():
    conn = sqlite3.connect(DB_PATH)
    with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == '__main__':
    init_database()
```

**Step 3: 验证**

```bash
cd melody-forge/database
python init_db.py
```
Expected: "Database initialized at .../melodyforge.db"

```bash
sqlite3 melodyforge.db ".tables"
```
Expected: `favorites  play_history  playlist_songs  playlists  songs`

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add SQLite database schema and init script"
```

---

## Phase 2: 核心播放器功能

### Task 4: 创建音频播放器 Hook

**Objective:** 实现基于 Web Audio API 的音频播放控制 Hook

**Files:**
- Create: `src/hooks/useAudioPlayer.ts`
- Create: `src/types/audio.ts`

**Step 1: 定义音频类型**

`src/types/audio.ts`:
```typescript
export interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  mood?: string;
  duration: number;
  filePath: string;
  coverUrl?: string;
  lyrics?: string;
  isAiGenerated: boolean;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentSong: Song | null;
  playlist: Song[];
  currentIndex: number;
}
```

**Step 2: 实现播放器 Hook**

`src/hooks/useAudioPlayer.ts`:
```typescript
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
      // Auto-play next
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
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add audio player hook with play/pause/seek/volume"
```

---

### Task 5: 创建播放器控制组件

**Objective:** 实现播放器底部控制栏 UI

**Files:**
- Create: `src/components/PlayerControls.tsx`
- Create: `src/components/ProgressBar.tsx`
- Create: `src/components/VolumeControl.tsx`

**Step 1: 进度条组件**

`src/components/ProgressBar.tsx`:
```typescript
import React from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    onSeek(newTime);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs text-gray-400 w-10 text-right">
        {formatTime(currentTime)}
      </span>
      <div
        className="flex-1 h-1 bg-gray-700 rounded-full cursor-pointer hover:h-2 transition-all"
        onClick={handleClick}
      >
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-10">
        {formatTime(duration)}
      </span>
    </div>
  );
};
```

**Step 2: 音量控制**

`src/components/VolumeControl.tsx`:
```typescript
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
```

**Step 3: 播放器控制栏**

`src/components/PlayerControls.tsx`:
```typescript
import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { Song } from '../types/audio';

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  currentSong: Song | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  currentSong,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* Song info */}
        <div className="w-48 flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
            {currentSong?.coverUrl ? (
              <img src={currentSong.coverUrl} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <span className="text-gray-500 text-xs">♪</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{currentSong?.title || 'No song'}</p>
            <p className="text-xs text-gray-400 truncate">{currentSong?.artist || 'Select a song'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevious}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={onPlayPause}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />
        </div>

        {/* Volume */}
        <div className="w-32">
          <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />
        </div>
      </div>
    </div>
  );
};
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add player controls, progress bar, and volume control"
```

---

### Task 6: 创建歌曲列表和播放列表组件

**Objective:** 实现歌曲列表展示和播放列表管理

**Files:**
- Create: `src/components/SongList.tsx`
- Create: `src/components/SongItem.tsx`
- Create: `src/components/PlaylistView.tsx`

**Step 1: 歌曲列表项**

`src/components/SongItem.tsx`:
```typescript
import React from 'react';
import { Play, Heart, MoreVertical } from 'lucide-react';
import { Song } from '../types/audio';

interface SongItemProps {
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export const SongItem: React.FC<SongItemProps> = ({
  song,
  isPlaying,
  isCurrent,
  onPlay,
  onToggleFavorite,
  isFavorite,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isCurrent ? 'bg-gray-700' : 'hover:bg-gray-800'
      }`}
      onClick={onPlay}
    >
      <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
        {isPlaying && isCurrent ? (
          <div className="flex gap-0.5">
            <div className="w-1 h-4 bg-green-500 animate-pulse" />
            <div className="w-1 h-6 bg-green-500 animate-pulse delay-75" />
            <div className="w-1 h-3 bg-green-500 animate-pulse delay-150" />
          </div>
        ) : (
          <Play size={16} className="text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-green-400' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-xs text-gray-400 truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-gray-500">{formatDuration(song.duration)}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`${isFavorite ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
      >
        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
};
```

**Step 2: 歌曲列表**

`src/components/SongList.tsx`:
```typescript
import React from 'react';
import { SongItem } from './SongItem';
import { Song } from '../types/audio';

interface SongListProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  favorites: Set<number>;
  onPlaySong: (song: Song) => void;
  onToggleFavorite: (songId: number) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  currentSong,
  isPlaying,
  favorites,
  onPlaySong,
  onToggleFavorite,
}) => {
  return (
    <div className="space-y-1">
      {songs.map((song) => (
        <SongItem
          key={song.id}
          song={song}
          isPlaying={isPlaying}
          isCurrent={currentSong?.id === song.id}
          onPlay={() => onPlaySong(song)}
          onToggleFavorite={() => onToggleFavorite(song.id)}
          isFavorite={favorites.has(song.id)}
        />
      ))}
    </div>
  );
};
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add song list and song item components"
```

---

### Task 7: 创建主页面布局

**Objective:** 整合所有组件到主应用布局

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/HomePage.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Header.tsx`

**Step 1: 侧边栏**

`src/components/Sidebar.tsx`:
```typescript
import React from 'react';
import { Home, Library, Heart, Settings, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'generate', label: 'AI Generate', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold text-green-400">MelodyForge</h1>
      </div>
      <nav className="flex-1 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
```

**Step 2: 主页面**

`src/pages/HomePage.tsx`:
```typescript
import React from 'react';
import { SongList } from '../components/SongList';
import { Song } from '../types/audio';

interface HomePageProps {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  favorites: Set<number>;
  onPlaySong: (song: Song) => void;
  onToggleFavorite: (songId: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  songs,
  currentSong,
  isPlaying,
  favorites,
  onPlaySong,
  onToggleFavorite,
}) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Library</h2>
      <SongList
        songs={songs}
        currentSong={currentSong}
        isPlaying={isPlaying}
        favorites={favorites}
        onPlaySong={onPlaySong}
        onToggleFavorite={onToggleFavorite}
      />
    </div>
  );
};
```

**Step 3: 整合 App.tsx**

`src/App.tsx`:
```typescript
import React, { useState } from 'react';
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
```

**Step 4: 验证**

```bash
npm run tauri dev
```
Expected: 播放器界面显示，侧边栏有导航，底部有播放控制，歌曲列表可点击（mock 数据）

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add main layout with sidebar, home page, and player integration"
```

---

## Phase 3: AI 歌曲生成模块

### Task 8: 实现 Suno API 生成器

**Objective:** 实现 Suno API 调用（通过第三方代理或网页逆向）

**Files:**
- Create: `ai-service/generators/suno.py`

**Step 1: 实现 Suno 生成器**

`ai-service/generators/suno.py`:
```python
import httpx
import asyncio
import os
from typing import Optional, Dict, Any

class SunoGenerator:
    def __init__(self):
        # 使用环境变量或配置文件
        self.api_base = os.getenv("SUNO_API_BASE", "https://api.suno.ai")
        self.api_key = os.getenv("SUNO_API_KEY", "")
        self.timeout = 300  # 5 minutes for generation

    async def generate(
        self,
        theme: str,
        mood: Optional[str] = None,
        genre: Optional[str] = None,
        duration: int = 30,
        custom_lyrics: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a song using Suno API.
        Returns dict with audio_url, title, lyrics, etc.
        """
        # Build prompt
        prompt = f"A song about {theme}"
        if mood:
            prompt += f", with a {mood} mood"
        if genre:
            prompt += f", in {genre} style"

        style_prompt = f"{genre or 'pop'}, {mood or 'emotional'}, high quality production"

        payload = {
            "prompt": prompt,
            "style": style_prompt,
            "title": f"{theme.title()} Song",
            "make_instrumental": custom_lyrics is None,
            "wait_audio": True,
        }

        if custom_lyrics:
            payload["lyrics"] = custom_lyrics

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # 注意：这是示例结构，实际 API 可能不同
                response = await client.post(
                    f"{self.api_base}/generate",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
                )
                response.raise_for_status()
                data = response.json()

                return {
                    "success": True,
                    "audio_url": data.get("audio_url"),
                    "title": data.get("title", payload["title"]),
                    "lyrics": data.get("lyrics", ""),
                    "engine_used": "suno",
                }

        except httpx.HTTPStatusError as e:
            return {
                "success": False,
                "error": f"Suno API error: {e.response.status_code} - {e.response.text}",
                "engine_used": "suno",
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Suno generation failed: {str(e)}",
                "engine_used": "suno",
            }

    async def is_available(self) -> bool:
        """Check if Suno API is available."""
        if not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.api_base}/health")
                return response.status_code == 200
        except:
            return False
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Suno API generator skeleton"
```

---

### Task 9: 实现 MusicGen 本地生成器

**Objective:** 实现 MusicGen 本地推理，支持 MPS (Apple Silicon) 和 CPU

**Files:**
- Create: `ai-service/generators/musicgen.py`

**Step 1: 实现 MusicGen 生成器**

`ai-service/generators/musicgen.py`:
```python
import torch
import torchaudio
import os
from typing import Optional, Dict, Any
from audiocraft.models import MusicGen
from audiocraft.data.audio import audio_write

class MusicGenGenerator:
    def __init__(self, model_size: str = "small"):
        self.model_size = model_size
        self.model = None
        self.device = self._get_device()
        self.output_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'generated')
        os.makedirs(self.output_dir, exist_ok=True)

    def _get_device(self) -> str:
        """Detect best available device."""
        if torch.backends.mps.is_available():
            return "mps"
        elif torch.cuda.is_available():
            return "cuda"
        return "cpu"

    def _load_model(self):
        """Lazy load model."""
        if self.model is None:
            print(f"Loading MusicGen {self.model_size} on {self.device}...")
            self.model = MusicGen.get_pretrained(self.model_size, device=self.device)

    async def generate(
        self,
        theme: str,
        mood: Optional[str] = None,
        genre: Optional[str] = None,
        duration: int = 30,
    ) -> Dict[str, Any]:
        """
        Generate a song using local MusicGen model.
        """
        try:
            self._load_model()

            # Build prompt
            prompt = f"{theme}"
            if mood:
                prompt += f", {mood} mood"
            if genre:
                prompt += f", {genre} music"

            # Set generation parameters
            self.model.set_generation_params(
                duration=duration,
                top_k=250,
                top_p=0.95,
                temperature=1.0,
            )

            # Generate
            descriptions = [prompt]
            wav = self.model.generate(descriptions)

            # Save audio
            filename = f"generated_{theme.replace(' ', '_')}_{duration}s.wav"
            filepath = os.path.join(self.output_dir, filename)

            audio_write(
                filepath.replace('.wav', ''),
                wav[0].cpu(),
                self.model.sample_rate,
                format="wav",
            )

            return {
                "success": True,
                "audio_url": filepath,
                "title": f"{theme.title()} ({duration}s)",
                "lyrics": "",  # Instrumental
                "engine_used": "musicgen",
            }

        except Exception as e:
            return {
                "success": False,
                "error": f"MusicGen generation failed: {str(e)}",
                "engine_used": "musicgen",
            }

    async def is_available(self) -> bool:
        """Check if MusicGen can be loaded."""
        try:
            self._load_model()
            return True
        except:
            return False

    def get_device_info(self) -> Dict[str, str]:
        return {
            "device": self.device,
            "model_size": self.model_size,
        }
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add MusicGen local generator with MPS/CPU support"
```

---

### Task 10: 实现多引擎调度器

**Objective:** 实现引擎选择逻辑：优先 Suno，失败自动切换 MusicGen

**Files:**
- Create: `ai-service/generators/engine_manager.py`
- Modify: `ai-service/main.py`

**Step 1: 创建引擎管理器**

`ai-service/generators/engine_manager.py`:
```python
from typing import Optional, Dict, Any
from .suno import SunoGenerator
from .musicgen import MusicGenGenerator

class EngineManager:
    def __init__(self):
        self.suno = SunoGenerator()
        self.musicgen = MusicGenGenerator()

    async def generate(
        self,
        theme: str,
        mood: Optional[str] = None,
        genre: Optional[str] = None,
        duration: int = 30,
        preferred_engine: Optional[str] = "suno",
    ) -> Dict[str, Any]:
        """
        Generate song with automatic fallback.
        """
        engines = []
        if preferred_engine == "suno":
            engines = [self.suno, self.musicgen]
        else:
            engines = [self.musicgen, self.suno]

        last_error = None
        for engine in engines:
            if await engine.is_available():
                result = await engine.generate(
                    theme=theme,
                    mood=mood,
                    genre=genre,
                    duration=duration,
                )
                if result["success"]:
                    return result
                last_error = result.get("error")

        return {
            "success": False,
            "error": f"All engines failed. Last error: {last_error}",
            "engine_used": "none",
        }

    async def get_status(self) -> Dict[str, Any]:
        """Get status of all engines."""
        return {
            "suno": await self.suno.is_available(),
            "musicgen": await self.musicgen.is_available(),
            "device_info": self.musicgen.get_device_info(),
        }
```

**Step 2: 更新 FastAPI 入口**

`ai-service/main.py` (修改 generate endpoint):
```python
from generators.engine_manager import EngineManager

engine_manager = EngineManager()

@app.post("/generate", response_model=GenerateResponse)
async def generate_song(request: GenerateRequest):
    result = await engine_manager.generate(
        theme=request.theme,
        mood=request.mood,
        genre=request.genre,
        duration=request.duration,
        preferred_engine=request.engine,
    )
    return GenerateResponse(**result)

@app.get("/status")
async def get_status():
    return await engine_manager.get_status()
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add multi-engine manager with automatic fallback"
```

---

### Task 11: 创建 AI 生成页面 UI

**Objective:** 实现用户输入主题/情绪/曲风的生成页面

**Files:**
- Create: `src/pages/GeneratePage.tsx`
- Create: `src/components/GenerationForm.tsx`

**Step 1: 生成表单**

`src/components/GenerationForm.tsx`:
```typescript
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerationFormProps {
  onGenerate: (params: {
    theme: string;
    mood: string;
    genre: string;
    duration: number;
  }) => void;
  isGenerating: boolean;
}

const MOODS = ['Happy', 'Sad', 'Energetic', 'Calm', 'Dreamy', 'Dark', 'Romantic', 'Epic'];
const GENRES = ['Pop', 'Rock', 'Electronic', 'Jazz', 'Classical', 'Hip Hop', 'Ambient', 'Folk'];
const DURATIONS = [30, 60, 120, 180];

export const GenerationForm: React.FC<GenerationFormProps> = ({
  onGenerate,
  isGenerating,
}) => {
  const [theme, setTheme] = useState('');
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    onGenerate({ theme, mood, genre, duration });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Theme / Topic</label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g., Rainy day in Tokyo, Space exploration, Lost love..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Mood</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m === mood ? '' : m)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                m === mood
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Genre</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g === genre ? '' : g)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                g === genre
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Duration</label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                d === duration
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating || !theme.trim()}
        className="w-full py-3 bg-green-500 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Generate Song
          </>
        )}
      </button>
    </form>
  );
};
```

**Step 2: 生成页面**

`src/pages/GeneratePage.tsx`:
```typescript
import React, { useState } from 'react';
import { GenerationForm } from '../components/GenerationForm';
import { Song } from '../types/audio';

interface GeneratePageProps {
  onSongGenerated: (song: Song) => void;
}

export const GeneratePage: React.FC<GeneratePageProps> = ({ onSongGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSong, setGeneratedSong] = useState<Song | null>(null);

  const handleGenerate = async (params: {
    theme: string;
    mood: string;
    genre: string;
    duration: number;
  }) => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();

      if (result.success) {
        const song: Song = {
          id: Date.now(),
          title: result.title,
          artist: 'AI Generated',
          genre: params.genre,
          mood: params.mood,
          duration: params.duration,
          filePath: result.audio_url,
          lyrics: result.lyrics,
          isAiGenerated: true,
        };
        setGeneratedSong(song);
        onSongGenerated(song);
      } else {
        alert(`Generation failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">AI Song Generator</h2>
      <p className="text-gray-400 mb-6">Describe your song and let AI create it</p>

      <GenerationForm onGenerate={handleGenerate} isGenerating={isGenerating} />

      {generatedSong && (
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-medium mb-2">Generated: {generatedSong.title}</h3>
          <audio controls className="w-full" src={generatedSong.filePath} />
        </div>
      )}
    </div>
  );
};
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add AI generation page with form and result display"
```

---

## Phase 4: 音频可视化与进阶功能

### Task 12: 实现音频可视化

**Objective:** 使用 Web Audio API 实现实时频谱可视化

**Files:**
- Create: `src/components/AudioVisualizer.tsx`
- Create: `src/hooks/useAudioVisualizer.ts`

**Step 1: 可视化 Hook**

`src/hooks/useAudioVisualizer.ts`:
```typescript
import { useRef, useEffect, useCallback } from 'react';

export function useAudioVisualizer(audioRef: React.RefObject<HTMLAudioElement>) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number>(0);

  const initAnalyser = useCallback(() => {
    if (!audioRef.current) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioRef.current);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;
  }, [audioRef]);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return null;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    return dataArrayRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return { initAnalyser, getFrequencyData };
}
```

**Step 2: 可视化组件**

`src/components/AudioVisualizer.tsx`:
```typescript
import React, { useRef, useEffect } from 'react';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRef,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { initAnalyser, getFrequencyData } = useAudioVisualizer(audioRef);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      initAnalyser();
    }
  }, [isPlaying, initAnalyser, audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const data = getFrequencyData();
      if (!data) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / data.length;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        // Gradient color based on frequency
        const hue = (i / data.length) * 120 + 150; // Green to blue
        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      }

      animationId = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, getFrequencyData]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={100}
      className="w-full h-24 rounded-lg bg-gray-800"
    />
  );
};
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add audio frequency visualizer with canvas"
```

---

### Task 13: 实现歌词显示

**Objective:** 实现歌词同步显示组件

**Files:**
- Create: `src/components/LyricsDisplay.tsx`

**Step 1: 歌词组件**

`src/components/LyricsDisplay.tsx`:
```typescript
import React from 'react';

interface LyricsDisplayProps {
  lyrics: string;
  currentTime: number;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics,
  currentTime,
}) => {
  if (!lyrics) {
    return (
      <div className="text-center text-gray-500 py-8">
        No lyrics available for this song
      </div>
    );
  }

  const lines = lyrics.split('\n').filter(line => line.trim());

  // Simple estimation: each line ~5 seconds
  const estimatedLineDuration = 5;
  const currentLineIndex = Math.floor(currentTime / estimatedLineDuration);

  return (
    <div className="space-y-2 py-4">
      {lines.map((line, index) => (
        <p
          key={index}
          className={`text-center transition-all duration-300 ${
            index === currentLineIndex
              ? 'text-green-400 text-lg font-medium scale-105'
              : index < currentLineIndex
              ? 'text-gray-500 text-sm'
              : 'text-gray-300 text-sm'
          }`}
        >
          {line}
        </p>
      ))}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add lyrics display with simple time sync"
```

---

## Phase 5: 数据持久化与状态管理

### Task 14: 实现 SQLite 数据访问层

**Objective:** 创建数据库操作模块，封装 CRUD

**Files:**
- Create: `ai-service/database/db.py`
- Create: `ai-service/database/songs.py`

**Step 1: 数据库连接**

`ai-service/database/db.py`:
```python
import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'melodyforge.db')

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    schema_path = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'schema.sql')
    with get_db() as conn:
        with open(schema_path, 'r') as f:
            conn.executescript(f.read())
        conn.commit()
```

**Step 2: 歌曲数据操作**

`ai-service/database/songs.py`:
```python
import json
from typing import List, Optional, Dict, Any
from .db import get_db

def create_song(
    title: str,
    artist: str = 'AI Generated',
    album: Optional[str] = None,
    genre: Optional[str] = None,
    mood: Optional[str] = None,
    duration: int = 0,
    file_path: str = '',
    cover_url: Optional[str] = None,
    lyrics: Optional[str] = None,
    is_ai_generated: bool = True,
    generation_params: Optional[Dict] = None,
) -> int:
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO songs (title, artist, album, genre, mood, duration, file_path, cover_url, lyrics, is_ai_generated, generation_params)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (title, artist, album, genre, mood, duration, file_path, cover_url, lyrics, is_ai_generated, json.dumps(generation_params) if generation_params else None),
        )
        conn.commit()
        return cursor.lastrowid

def get_song(song_id: int) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM songs WHERE id = ?", (song_id,)).fetchone()
        return dict(row) if row else None

def get_all_songs() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM songs ORDER BY created_at DESC").fetchall()
        return [dict(row) for row in rows]

def get_songs_by_genre(genre: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM songs WHERE genre = ? ORDER BY created_at DESC", (genre,)).fetchall()
        return [dict(row) for row in rows]

def get_songs_by_mood(mood: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM songs WHERE mood = ? ORDER BY created_at DESC", (mood,)).fetchall()
        return [dict(row) for row in rows]

def delete_song(song_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM songs WHERE id = ?", (song_id,))
        conn.commit()
        return cursor.rowcount > 0

def add_to_favorites(song_id: int) -> bool:
    with get_db() as conn:
        try:
            conn.execute("INSERT INTO favorites (song_id) VALUES (?)", (song_id,))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

def remove_from_favorites(song_id: int) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM favorites WHERE song_id = ?", (song_id,))
        conn.commit()
        return cursor.rowcount > 0

def get_favorites() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT s.* FROM songs s
            JOIN favorites f ON s.id = f.song_id
            ORDER BY f.favorited_at DESC
        """).fetchall()
        return [dict(row) for row in rows]

def record_play_history(song_id: int, duration_played: int = 0):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO play_history (song_id, duration_played) VALUES (?, ?)",
            (song_id, duration_played),
        )
        conn.commit()

def get_play_history(limit: int = 50) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT s.*, h.played_at, h.duration_played
            FROM play_history h
            JOIN songs s ON h.song_id = s.id
            ORDER BY h.played_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add SQLite data access layer with songs CRUD"
```

---

### Task 15: 集成数据层到前端

**Objective:** 前端通过 API 调用后端数据服务

**Files:**
- Create: `src/services/api.ts`
- Create: `src/stores/useSongStore.ts`
- Modify: `src/App.tsx`

**Step 1: API 服务**

`src/services/api.ts`:
```typescript
import { Song } from '../types/audio';

const API_BASE = 'http://localhost:8000';

export const api = {
  async generateSong(params: {
    theme: string;
    mood?: string;
    genre?: string;
    duration?: number;
    engine?: string;
  }) {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  async getSongs(): Promise<Song[]> {
    const response = await fetch(`${API_BASE}/songs`);
    return response.json();
  },

  async getFavorites(): Promise<Song[]> {
    const response = await fetch(`${API_BASE}/favorites`);
    return response.json();
  },

  async toggleFavorite(songId: number, isFavorite: boolean) {
    const endpoint = isFavorite ? 'favorites' : `favorites/${songId}`;
    const method = isFavorite ? 'POST' : 'DELETE';
    const body = isFavorite ? JSON.stringify({ song_id: songId }) : undefined;

    await fetch(`${API_BASE}/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  },

  async getStatus() {
    const response = await fetch(`${API_BASE}/status`);
    return response.json();
  },
};
```

**Step 2: Zustand Store**

`src/stores/useSongStore.ts`:
```typescript
import { create } from 'zustand';
import { Song } from '../types/audio';
import { api } from '../services/api';

interface SongStore {
  songs: Song[];
  favorites: Set<number>;
  isLoading: boolean;
  error: string | null;

  loadSongs: () => Promise<void>;
  addSong: (song: Song) => void;
  toggleFavorite: (songId: number) => Promise<void>;
  loadFavorites: () => Promise<void>;
}

export const useSongStore = create<SongStore>((set, get) => ({
  songs: [],
  favorites: new Set(),
  isLoading: false,
  error: null,

  loadSongs: async () => {
    set({ isLoading: true });
    try {
      const songs = await api.getSongs();
      set({ songs, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load songs', isLoading: false });
    }
  },

  addSong: (song) => {
    set((state) => ({
      songs: [song, ...state.songs],
    }));
  },

  toggleFavorite: async (songId) => {
    const isFav = get().favorites.has(songId);
    await api.toggleFavorite(songId, !isFav);
    set((state) => {
      const next = new Set(state.favorites);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return { favorites: next };
    });
  },

  loadFavorites: async () => {
    try {
      const favorites = await api.getFavorites();
      set({ favorites: new Set(favorites.map((s: Song) => s.id)) });
    } catch (error) {
      console.error('Failed to load favorites');
    }
  },
}));
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add API service and Zustand store for state management"
```

---

## Phase 6: Tauri 桥接与桌面集成

### Task 16: 实现 Tauri Commands

**Objective:** 通过 Tauri 桥接实现文件系统访问、本地音频播放

**Files:**
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/tauri.conf.json`

**Step 1: 更新 Tauri 配置**

`src-tauri/tauri.conf.json` (修改 allowlist):
```json
{
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true,
        "readDir": true,
        "createDir": true,
        "removeFile": true
      },
      "path": {
        "all": true
      },
      "os": {
        "all": false
      }
    }
  }
}
```

**Step 2: 添加 Commands**

`src-tauri/src/main.rs`:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::path::PathBuf;

#[tauri::command]
async fn get_app_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let path = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app dir")?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
async fn read_audio_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_generated_audio(
    app_handle: tauri::AppHandle,
    filename: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("Failed to get app dir")?;
    let audio_dir = app_dir.join("generated_audio");
    std::fs::create_dir_all(&audio_dir).map_err(|e| e.to_string())?;

    let file_path = audio_dir.join(&filename);
    std::fs::write(&file_path, &data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_app_dir,
            read_audio_file,
            save_generated_audio,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Tauri commands for file system and audio management"
```

---

### Task 17: 实现系统托盘和快捷键

**Objective:** 添加系统托盘图标和全局快捷键

**Files:**
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/tauri.conf.json`

**Step 1: 更新 Cargo.toml**

添加依赖:
```toml
[dependencies]
tauri = { version = "2.0", features = ["tray-icon"] }
```

**Step 2: 添加系统托盘**

`src-tauri/src/main.rs` (添加):
```rust
use tauri::{SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(SystemTrayMenuItem::new("Show", "show"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(SystemTrayMenuItem::new("Quit", "quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                }
                SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_app_dir,
            read_audio_file,
            save_generated_audio,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add system tray with show/quit menu"
```

---

## Phase 7: 完善与优化

### Task 18: 添加播放列表管理

**Objective:** 实现播放列表的创建、编辑、删除

**Files:**
- Create: `src/components/PlaylistManager.tsx`
- Create: `src/pages/LibraryPage.tsx`
- Modify: `ai-service/database/db.py` (添加播放列表操作)

**Step 1: 播放列表数据库操作**

`ai-service/database/playlists.py`:
```python
from typing import List, Optional, Dict, Any
from .db import get_db

def create_playlist(name: str, description: Optional[str] = None) -> int:
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO playlists (name, description) VALUES (?, ?)",
            (name, description),
        )
        conn.commit()
        return cursor.lastrowid

def get_playlists() -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM playlists ORDER BY created_at DESC").fetchall()
        return [dict(row) for row in rows]

def get_playlist_songs(playlist_id: int) -> List[Dict[str, Any]]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT s.* FROM songs s
            JOIN playlist_songs ps ON s.id = ps.song_id
            WHERE ps.playlist_id = ?
            ORDER BY ps.position
        """, (playlist_id,)).fetchall()
        return [dict(row) for row in rows]

def add_song_to_playlist(playlist_id: int, song_id: int, position: int):
    with get_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)",
            (playlist_id, song_id, position),
        )
        conn.commit()

def remove_song_from_playlist(playlist_id: int, song_id: int):
    with get_db() as conn:
        conn.execute(
            "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
            (playlist_id, song_id),
        )
        conn.commit()

def delete_playlist(playlist_id: int):
    with get_db() as conn:
        conn.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
        conn.commit()
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add playlist CRUD operations"
```

---

### Task 19: 添加设置页面

**Objective:** 实现应用设置，包括音频输出设备、生成引擎偏好、主题

**Files:**
- Create: `src/pages/SettingsPage.tsx`
- Create: `src/stores/useSettingsStore.ts`

**Step 1: 设置 Store**

`src/stores/useSettingsStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  theme: 'dark' | 'light' | 'system';
  defaultEngine: 'suno' | 'musicgen';
  defaultDuration: number;
  audioOutput: string;
  autoPlay: boolean;
  showVisualizer: boolean;
}

interface SettingsStore extends Settings {
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      defaultEngine: 'suno',
      defaultDuration: 30,
      audioOutput: 'default',
      autoPlay: true,
      showVisualizer: true,

      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'melodyforge-settings',
    }
  )
);
```

**Step 2: 设置页面**

`src/pages/SettingsPage.tsx`:
```typescript
import React from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

export const SettingsPage: React.FC = () => {
  const settings = useSettingsStore();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-medium mb-3">Appearance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label>Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => settings.updateSettings({ theme: e.target.value as any })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-3">AI Generation</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label>Default Engine</label>
              <select
                value={settings.defaultEngine}
                onChange={(e) => settings.updateSettings({ defaultEngine: e.target.value as any })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                <option value="suno">Suno (Cloud)</option>
                <option value="musicgen">MusicGen (Local)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label>Default Duration</label>
              <select
                value={settings.defaultDuration}
                onChange={(e) => settings.updateSettings({ defaultDuration: parseInt(e.target.value) })}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2"
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={180}>3 minutes</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-3">Playback</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label>Auto-play next song</label>
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) => settings.updateSettings({ autoPlay: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between">
              <label>Show audio visualizer</label>
              <input
                type="checkbox"
                checked={settings.showVisualizer}
                onChange={(e) => settings.updateSettings({ showVisualizer: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add settings page with theme, engine, and playback preferences"
```

---

### Task 20: 添加搜索和过滤

**Objective:** 实现歌曲搜索和按风格/情绪过滤

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/FilterChips.tsx`
- Modify: `src/pages/HomePage.tsx`

**Step 1: 搜索栏**

`src/components/SearchBar.tsx`:
```typescript
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search songs...',
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
      />
    </div>
  );
};
```

**Step 2: 过滤组件**

`src/components/FilterChips.tsx`:
```typescript
import React from 'react';

interface FilterChipsProps {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  label: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  selected,
  onToggle,
  label,
}) => {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selected.includes(option)
                ? 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add search bar and filter chips for song discovery"
```

---

## Phase 8: 构建与部署

### Task 21: 配置构建脚本

**Objective:** 配置打包脚本，支持 macOS、Windows、Linux

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/tauri.conf.json`

**Step 1: 更新 package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "ai:dev": "cd ai-service && source .venv/bin/activate && uvicorn main:app --reload",
    "ai:start": "cd ai-service && source .venv/bin/activate && uvicorn main:app",
    "db:init": "cd database && python init_db.py",
    "setup": "npm install && cd ai-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd .. && npm run db:init"
  }
}
```

**Step 2: 更新 Tauri 配置**

`src-tauri/tauri.conf.json` (更新 bundle):
```json
{
  "bundle": {
    "active": true,
    "targets": ["dmg", "app", "appimage", "msi"],
    "identifier": "com.melodyforge.app",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: add build scripts and cross-platform bundle config"
```

---

### Task 22: 添加 README 和文档

**Objective:** 编写项目文档，包含安装、使用、开发指南

**Files:**
- Create: `README.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/API.md`

**Step 1: README**

`README.md`:
```markdown
# MelodyForge — AI Personal Music Player

A cross-platform (Desktop + Web) AI-powered music player that generates original songs based on your themes, moods, and genres.

## Features

- 🎵 **AI Song Generation** — Create unique songs from text descriptions
- 🎨 **Multiple AI Engines** — Suno API (cloud) + MusicGen (local) with automatic fallback
- 🎧 **Full Music Player** — Play, pause, seek, volume control, playlists
- 📊 **Audio Visualization** — Real-time frequency spectrum display
- 📝 **Lyrics Display** — Synchronized lyrics viewing
- ❤️ **Favorites & History** — Track your favorite AI-generated songs
- 🔍 **Search & Filter** — Find songs by genre, mood, or keyword
- 🖥️ **Cross-Platform** — macOS, Windows, Linux via Tauri

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Desktop:** Tauri (Rust)
- **AI Backend:** Python FastAPI + MusicGen (Facebook) + Suno API
- **Storage:** SQLite (local)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Rust (for Tauri desktop build)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd melody-forge

# Setup everything (frontend + Python + database)
npm run setup

# Start AI service
npm run ai:dev

# Start desktop app (in another terminal)
npm run tauri:dev
```

### Usage

1. Open the app
2. Go to "AI Generate" tab
3. Enter a theme (e.g., "Rainy night in Tokyo")
4. Select mood and genre
5. Click "Generate Song"
6. Enjoy your AI-generated music!

## Development

### Project Structure

```
melody-forge/
├── src/              # React frontend
├── src-tauri/        # Rust desktop shell
├── ai-service/       # Python AI generation service
└── database/         # SQLite schema and scripts
```

### Scripts

- `npm run dev` — Start frontend dev server
- `npm run tauri:dev` — Start desktop app in dev mode
- `npm run ai:dev` — Start AI service with hot reload
- `npm run db:init` — Initialize database
- `npm run tauri:build` — Build desktop app for distribution

## License

MIT
```

**Step 2: Commit**

```bash
git add -A
git commit -m "docs: add comprehensive README and project documentation"
```

---

## 验证清单

- [ ] Tauri 桌面应用能正常启动
- [ ] React 前端渲染正常
- [ ] Python AI 服务能启动并响应 health check
- [ ] SQLite 数据库初始化成功
- [ ] 音频播放器能播放/暂停/跳转
- [ ] AI 生成页面能提交请求
- [ ] MusicGen 本地推理能运行（MPS/CPU）
- [ ] 音频可视化正常工作
- [ ] 歌词显示正常
- [ ] 收藏功能正常
- [ ] 播放列表管理正常
- [ ] 设置能持久化
- [ ] 搜索和过滤正常
- [ ] 系统托盘正常工作
- [ ] 构建脚本能生成可执行文件

---

## 后续扩展方向

1. **云端同步** — 添加 Supabase/Firebase 后端，支持多设备同步
2. **更多 AI 引擎** — 集成 Udio、Stable Audio 等
3. **社交功能** — 分享歌曲、社区播放列表
4. **高级可视化** — 3D 音频可视化、粒子效果
5. **离线模式** — 完全离线运行，无需网络
6. **移动端** — React Native 或 Tauri 移动端支持
7. **插件系统** — 允许第三方扩展音频效果、可视化等
