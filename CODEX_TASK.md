# MelodyForge — Task for Codex

> **Agent:** Codex
> **Role:** Feature Implementation & API Integration
> **Branch:** `feature/playlist-settings-backend`
> **Base:** `master`

---

## 你的任务

实现 **播放列表管理**、**设置页面** 和 **后端数据 API** 功能。

## 项目信息

- **仓库:** https://github.com/kunfeng15-jpg/melody-forge
- **前端:** React 18 + TypeScript + Tailwind CSS + Zustand（尚未安装，需自行 `npm install zustand`）
- **当前状态:** 基础播放器 + AI 生成 + 音频可视化 + 歌词显示 已完成
- **最新代码:** https://github.com/kunfeng15-jpg/melody-forge/tree/master
- **重要:** 请先 `git pull origin master` 获取最新代码，基于 master 分支工作

## 具体任务

### Task 1: Zustand 状态管理 Store

**文件:** `src/stores/useSongStore.ts`

实现全局状态管理：

```typescript
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
```

- 使用 Zustand `persist` 中间件持久化 favorites
- API 基地址: `http://localhost:8000`

### Task 2: API 服务层

**文件:** `src/services/api.ts`

封装所有后端调用：

```typescript
export const api = {
  generateSong(params) => POST /generate
  getSongs() => GET /songs
  getFavorites() => GET /favorites
  toggleFavorite(songId, isFavorite) => POST/DELETE /favorites
  getStatus() => GET /status
}
```

### Task 3: 设置页面

**文件:** `src/pages/SettingsPage.tsx`, `src/stores/useSettingsStore.ts`

实现设置页面：

1. **useSettingsStore** (Zustand + persist):
   - theme: 'dark' | 'light' | 'system'
   - defaultEngine: 'suno' | 'musicgen'
   - defaultDuration: 30 | 60 | 120 | 180
   - autoPlay: boolean
   - showVisualizer: boolean

2. **SettingsPage**:
   - 外观设置（主题选择）
   - AI 生成设置（默认引擎、默认时长）
   - 播放设置（自动播放、显示可视化）
   - 使用 `<select>` 和 `<input type="checkbox">`

### Task 4: 播放列表管理（后端）

**文件:** `ai-service/database/playlists.py`

实现播放列表 CRUD：

```python
def create_playlist(name, description) -> int
def get_playlists() -> List[Dict]
def get_playlist_songs(playlist_id) -> List[Dict]
def add_song_to_playlist(playlist_id, song_id, position)
def remove_song_from_playlist(playlist_id, song_id)
def delete_playlist(playlist_id)
```

在 `main.py` 中添加对应 API endpoints：
- `GET /playlists`
- `POST /playlists`
- `GET /playlists/{id}/songs`
- `POST /playlists/{id}/songs`
- `DELETE /playlists/{id}/songs/{song_id}`
- `DELETE /playlists/{id}`

### Task 5: 提交 PR

```bash
git checkout -b feature/playlist-settings-backend
git add .
git commit -m "feat: add playlist management, settings page, and API service layer"
git push origin feature/playlist-settings-backend
```

然后在 GitHub 上创建 Pull Request，标题: `feat: Playlist Management & Settings`

## 验收标准

- [ ] Zustand store 能正确管理 songs 和 favorites 状态
- [ ] API 服务层封装所有后端调用
- [ ] 设置页面能修改并持久化偏好
- [ ] 播放列表后端 API 完整可用
- [ ] 所有新增代码通过 `npm run build` 和 Python 语法检查
- [ ] 代码风格与现有项目一致

## 注意事项

- 前端使用 Tailwind CSS，保持深色主题
- 后端使用 FastAPI，遵循现有代码结构
- 数据库操作放在 `ai-service/database/` 下
- 不要修改现有的 `useAudioPlayer` hook
- 有问题在 PR 中 @ Hermes review

---

**开始吧！完成后创建 PR，我会 review。**
