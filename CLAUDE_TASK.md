# MelodyForge — Task for Claude Code

> **Agent:** Claude Code
> **Role:** Core Architecture & Complex UI
> **Branch:** `feature/audio-visualizer-lyrics`
> **Base:** `master`

---

## 你的任务

实现 **音频可视化** 和 **歌词同步显示** 两个核心功能。

## 项目信息

- **仓库:** https://github.com/kunfeng15-jpg/melody-forge
- **技术栈:** React 18 + TypeScript + Tailwind CSS + Web Audio API
- **当前状态:** 基础播放器已完成（播放/暂停/进度条/音量/歌曲列表）

## 具体任务

### Task 1: 音频可视化组件

**文件:** `src/components/AudioVisualizer.tsx`

使用 Web Audio API 的 AnalyserNode 实现实时频谱可视化：

1. 创建 `useAudioVisualizer` hook（`src/hooks/useAudioVisualizer.ts`）
   - 接收 `audioRef` 参数
   - 创建 AudioContext + AnalyserNode
   - 提供 `getFrequencyData()` 返回 Uint8Array
   - fftSize = 256

2. 创建 `AudioVisualizer` 组件
   - 使用 `<canvas>` 绘制频谱条
   - 频谱条颜色用 HSL 渐变（绿到蓝）
   - 高度随频率数据动态变化
   - 组件尺寸: 宽 600px, 高 100px

3. 在 `App.tsx` 中集成
   - 放在播放器控制栏上方
   - 只在播放时显示动画

**参考代码结构:**

```typescript
// useAudioVisualizer.ts
export function useAudioVisualizer(audioRef: React.RefObject<HTMLAudioElement>) {
  // 创建 AudioContext + AnalyserNode
  // 返回 { initAnalyser, getFrequencyData }
}

// AudioVisualizer.tsx
export const AudioVisualizer: React.FC = () => {
  // 使用 requestAnimationFrame 循环绘制
  // canvas 绘制频谱条
}
```

### Task 2: 歌词显示组件

**文件:** `src/components/LyricsDisplay.tsx`

实现歌词同步显示：

1. 接收 `lyrics: string` 和 `currentTime: number` 参数
2. 按行分割歌词，每行约 5 秒
3. 当前行高亮（绿色 + 放大），已播放行变灰，未播放行正常
4. 在 `App.tsx` 中集成到播放器区域

### Task 3: 生成页面 UI

**文件:** `src/pages/GeneratePage.tsx`, `src/components/GenerationForm.tsx`

实现 AI 歌曲生成界面：

1. **GenerationForm** 组件:
   - 主题输入框（text input）
   - 情绪选择（Happy/Sad/Energetic/Calm/Dreamy/Dark/Romantic/Epic）
   - 曲风选择（Pop/Rock/Electronic/Jazz/Classical/Hip Hop/Ambient/Folk）
   - 时长选择（30s/60s/120s/180s）
   - 生成按钮（带 loading 状态）

2. **GeneratePage** 页面:
   - 包含 GenerationForm
   - 显示生成结果（标题 + 音频播放器）
   - 调用后端 API: `POST http://localhost:8000/generate`

### Task 4: 提交 PR

```bash
git checkout -b feature/audio-visualizer-lyrics
git add .
git commit -m "feat: add audio visualizer, lyrics display, and AI generation UI"
git push origin feature/audio-visualizer-lyrics
```

然后在 GitHub 上创建 Pull Request，标题: `feat: Audio Visualizer & Lyrics Display`

## 验收标准

- [ ] 音频可视化在播放时显示动态频谱
- [ ] 歌词随播放进度高亮当前行
- [ ] 生成页面能输入主题/情绪/曲风/时长
- [ ] 生成按钮调用后端 API 并显示结果
- [ ] 所有组件使用 TypeScript，通过 `npm run build` 编译
- [ ] 代码风格与现有项目一致

## 注意事项

- 不要修改现有的 `useAudioPlayer` hook 核心逻辑
- 使用 Tailwind CSS 进行样式，保持深色主题
- 所有新组件放在 `src/components/` 或 `src/pages/`
- 类型定义放在 `src/types/audio.ts` 或新建文件

---

**有问题随时在 PR 中 @ 我（Hermes）review。**
