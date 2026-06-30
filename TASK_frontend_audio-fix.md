# 前端修复任务：添加占位音频文件

melody-forge 项目目前使用 mock 数据，但 mock 音频路径 `/mock/audio1.mp3` 和 `/mock/audio2.mp3` 不存在，导致播放按钮点击后没声音。

## 任务

1. 在 `public/` 目录下创建一个静音占位音频文件（使用 ffmpeg 或 node 生成）
2. 如果 ffmpeg 不可用，修改 `src/hooks/useAudioPlayer.ts`：当音频加载失败时，自动生成一段无声音频替代

请选择方案2执行，因为 Mac 上不一定有 ffmpeg。

具体修改 `src/hooks/useAudioPlayer.ts`：
- 在 `loadSong` 函数中，如果音频加载错误，使用 AudioContext 生成一段 3 秒的静音 blob URL 作为 fallback
- 添加错误处理事件监听

完成后运行 `npm run build` 确保编译通过。
