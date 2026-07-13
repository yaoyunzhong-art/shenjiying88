#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

BASE_URL="${BASE_URL:-http://127.0.0.1:3005}"
OUTPUT_DIR="$PROJECT_ROOT/tmp/phase49-seo-geo"
SERVER_LOG="$OUTPUT_DIR/tob-web-dev.log"

mkdir -p "$OUTPUT_DIR"

SERVER_STARTED_BY_SCRIPT=0
SERVER_PID=""

cleanup() {
  if [[ "$SERVER_STARTED_BY_SCRIPT" -eq 1 && -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

is_server_ready() {
  curl -fsS "$BASE_URL" >/dev/null 2>&1
}

start_server() {
  echo "▶️  启动 tob-web dev server: $BASE_URL"
  pnpm --dir apps/tob-web dev --hostname 127.0.0.1 --port 3005 >"$SERVER_LOG" 2>&1 &
  SERVER_PID=$!
  SERVER_STARTED_BY_SCRIPT=1
  bash "$SCRIPT_DIR/wait-for-it.sh" 127.0.0.1:3005 -t 120
}

main() {
  if is_server_ready; then
    echo "♻️  复用现有 tob-web 服务: $BASE_URL"
  else
    start_server
  fi

  pnpm exec tsx scripts/phase49-e2e-seo-geo.ts
}

main "$@"
