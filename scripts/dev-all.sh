#!/bin/bash
set -euo pipefail

cleanup() {
  if [[ -n "${backend_pid:-}" ]]; then
    kill "$backend_pid" >/dev/null 2>&1 || true
  fi
  if [[ -n "${frontend_pid:-}" ]]; then
    kill "$frontend_pid" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

go run ./cmd/server &
backend_pid=$!

(cd frontend && pnpm dev --host 127.0.0.1 --strictPort) &
frontend_pid=$!

echo "后端: http://localhost:8080"
echo "前端: http://127.0.0.1:5173"

wait "$backend_pid" "$frontend_pid"
