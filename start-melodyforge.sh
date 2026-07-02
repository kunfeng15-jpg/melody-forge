#!/bin/bash
# MelodyForge 一键启动脚本（在 Mac 上运行）
# 用法: bash start-melodyforge.sh

set -e
PROJECT_DIR="$HOME/melody-forge"

echo "=== MelodyForge 启动 ==="

# 1. 检查项目
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ 项目目录不存在: $PROJECT_DIR"
  echo "请先克隆: git clone https://github.com/kunfeng15-jpg/melody-forge.git"
  exit 1
fi
cd "$PROJECT_DIR"

# 2. 安装前端依赖
if [ ! -d "node_modules" ]; then
  echo "→ 安装前端依赖..."
  npm install
fi

# 安装后端核心依赖（不含 torch/audiocraft，太重）
echo "→ 安装后端核心依赖..."
pip3 install -r ai-service/requirements-core.txt 2>/dev/null || echo "   ⚠ pip3 不可用，尝试 python3 -m pip..."
python3 -m pip install -r ai-service/requirements-core.txt 2>/dev/null || true

# 4. 启动后端（后台）
echo "→ 启动后端服务 (端口 8000)..."
cd ai-service
python3 main.py &
BACKEND_PID=$!
cd ..
echo "   PID: $BACKEND_PID"

# 5. 等待后端就绪
echo "→ 等待后端就绪..."
for i in $(seq 1 15); do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✓ 后端已就绪"
    break
  fi
  sleep 1
done

# 6. 启动前端开发服务器
echo "→ 启动前端 (Vite)..."
npm run dev &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

echo ""
echo "=== 启动完成 ==="
echo "后端: http://localhost:8000"
echo "前端: http://localhost:5173"
echo "桌面: npm run tauri dev"
echo ""
echo "按 Ctrl+C 停止所有服务"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
