#!/bin/bash
PROJECT_DIR="$HOME/melody-forge"
LOG_DIR="$HOME/melody-forge-agents/logs"
POLL_INTERVAL=30
mkdir -p "$LOG_DIR"
cd "$PROJECT_DIR" 2>/dev/null || { echo "项目目录不存在"; exit 1; }
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
        for TASK_FILE in "$PROJECT_DIR"/TASK_frontend_*.md "$PROJECT_DIR"/TASK_backend_*.md; do
            [ -f "$TASK_FILE" ] || continue
            TASK_NAME=$(basename "$TASK_FILE" .md)
            LOG_FILE="$LOG_DIR/${TASK_NAME}-$(date +%Y%m%d-%H%M%S).log"
            if [[ "$TASK_FILE" == *"frontend"* ]]; then
                echo "→ Claude Code: $TASK_NAME"
                claude -p "读取 $TASK_NAME.md 并执行所有任务，完成后 npm run build 验证，然后 git add -A && git commit -m 'auto: $TASK_NAME' && git push origin $BRANCH" --dangerously-skip-permissions >> "$LOG_FILE" 2>&1
            elif [[ "$TASK_FILE" == *"backend"* ]]; then
                echo "→ Codex: $TASK_NAME"
                codex exec -p "读取 $TASK_NAME.md 并执行所有任务，完成后 git add -A && git commit -m 'auto: $TASK_NAME' && git push origin $BRANCH" >> "$LOG_FILE" 2>&1
            fi
            rm -f "$TASK_FILE"
        done
        sleep 5; git fetch origin $BRANCH; git reset --hard "origin/$BRANCH"
        LAST_COMMIT=$(git rev-parse HEAD)
        echo "✓ 完成"
    fi
    sleep $POLL_INTERVAL
done
