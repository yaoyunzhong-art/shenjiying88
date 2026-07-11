#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# M5 ToB Web 容器入口脚本
#
# 职责:
#   1. 等待 API 就绪
#   2. 启动 Next.js 应用
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ─── 配置 ──────────────────────────────────────────────
PORT="${PORT:-3011}"
API_INTERNAL_URL="${API_INTERNAL_URL:-http://api:3001}"

# ─── 颜色输出 ──────────────────────────────────────────
info()  { echo "[ENTRYPOINT] [INFO]  $*"; }
warn()  { echo "[ENTRYPOINT] [WARN]  $*"; }
error() { echo "[ENTRYPOINT] [ERROR] $*" >&2; }
ok()    { echo "[ENTRYPOINT] [OK]    $*"; }

# ─── 等待 API ─────────────────────────────────────────
wait_for_api() {
    info "等待 API 就绪 ($API_INTERNAL_URL)..."

    local retries=30
    local count=0
    until wget -qO- "${API_INTERNAL_URL}/api/v1/health/ping" 2>/dev/null | grep -q "ok\|pong\|true"; do
        count=$((count + 1))
        if [ "$count" -ge "$retries" ]; then
            error "API 超过 $retries 次重试仍未就绪，退出"
            exit 1
        fi
        warn "API 未就绪，等待 3s (${count}/${retries})"
        sleep 3
    done
    ok "API 就绪"
}

# ─── 主流程 ────────────────────────────────────────────
main() {
    info "M5 ToB Web 入口脚本启动"
    info "环境: NODE_ENV=${NODE_ENV:-production}"
    info "端口: $PORT"
    info "API 地址: $API_INTERNAL_URL"

    # 等待 API
    wait_for_api

    # 启动 Next.js
    info "启动 Next.js 应用 (port $PORT)..."
    exec node .next/standalone/apps/tob-web/server.js
}

main
