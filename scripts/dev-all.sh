#!/bin/bash
set -uo pipefail

# 按端口杀掉所有占用进程（包括孤儿进程）
kill_by_port() {
  local port=$1
  local pids
  pids=$(lsof -ti:"$port" 2>/dev/null) || true
  if [[ -n "$pids" ]]; then
    echo "$pids" | while IFS= read -r pid; do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
}

# 启动前清理残留进程
cleanup_ports() {
  kill_by_port 8080
  kill_by_port 5173
  sleep 0.5
}

# 退出时清理
cleaned_up=false
cleanup() {
  if [[ "$cleaned_up" == true ]]; then
    return
  fi
  cleaned_up=true
  echo ""
  echo "正在关闭服务..."
  cleanup_ports
  exit 0
}

trap cleanup EXIT INT TERM

cleanup_ports

go run ./cmd/server &
backend_pid=$!

(cd frontend && pnpm dev --host 127.0.0.1 --strictPort) &
frontend_pid=$!

echo "后端: http://localhost:8080"
echo "前端: http://127.0.0.1:5173"

wait
