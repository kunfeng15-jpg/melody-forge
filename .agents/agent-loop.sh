#!/bin/bash
PROJECT_DIR="$HOME/melody-forge"
LOG_DIR="$HOME/melody-forge-agents/logs"
POLL_INTERVAL=30
mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR" 2>/dev/null || { echo "项目目录不存在"; exit 1; }

# 配置 Codex 信任此目录（只跑一次）
CODX_CONFIG="$HOME/.codex/config.json"
if [ -f "$CODX_CONFIG" ]; then
  # 确保当前目录在 trust 列表中
  TRUSTED=$(python3 -c "
import json, os
try:
    with open('$CODX_CONFIG') as f:
        cfg = json.load(f)
    trusted = cfg.get('trusted_directories', [])
    path = os.path.realpath('$PROJECT_DIR')
    if path not in trusted:
        trusted.append(path)
        cfg['trusted_directories'] = trusted
        with open('$CODX_CONFIG', 'w') as f:
            json.dump(cfg, f, indent=2)
        print('added')
    else:
        print('ok')
except: print('skip')
" 2>/dev/null)
  [ "$TRUSTED" = "added" ] && echo "已添加项目目录到 Codex 信任列表"
fi

git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null
LAST_COMMIT=$(git rev-parse HEAD)
rm -f "$PROJECT_DIR"/TASK_*.md
echo "开始轮询，间隔 ${POLL_INTERVAL}s..."
while true; do
    git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null
    BRANCH="main"; git rev-parse --verify origin/main &>/dev/null || BRANCH="master"
    REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH")
    if [ "$REMOTE_COMMIT" != "$LAST_COMMIT" ]; then
        echo "[$(date)] 检测到新提交"
        git reset --hard "origin/$BRANCH"
        git clean -fd
        npm install 2>&1 | tail -1
        for TASK_FILE in "$PROJECT_DIR"/TASK_*.md; do
            [ -f "$TASK_FILE" ] || continue
            TASK_NAME=$(basename "$TASK_FILE" .md)
            LOG_FILE="$LOG_DIR/${TASK_NAME}-$(date +%Y%m%d-%H%M%S).log"
            echo "→ Codex: $TASK_NAME"
            codex exec --skip-git-repo-check "读取 $TASK_NAME.md 并执行所有任务。执行过程中不要询问用户意见，直接做决策。完成后运行: cd $PROJECT_DIR && git add -A && git commit -m 'auto: $TASK_NAME' && git push origin $BRANCH" >> "$LOG_FILE" 2>&1
            rm -f "$TASK_FILE"
        done
        sleep 5; git fetch origin $BRANCH; git reset --hard "origin/$BRANCH"
        LAST_COMMIT=$(git rev-parse HEAD)
        echo "✓ 完成"
    fi
    sleep $POLL_INTERVAL
done
