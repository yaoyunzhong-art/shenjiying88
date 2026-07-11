#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# M5 Qdrant 容器入口脚本
#
# 职责:
#   1. 确保数据目录就绪
#   2. 启动 Qdrant 服务
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

info()  { echo "[ENTRYPOINT] [INFO]  $*"; }
error() { echo "[ENTRYPOINT] [ERROR] $*" >&2; }

# ─── 数据目录 ──────────────────────────────────────────
STORAGE_DIR="${QDRANT_STORAGE_DIR:-/qdrant/storage}"
SNAPSHOTS_DIR="${QDRANT_SNAPSHOTS_DIR:-/qdrant/snapshots}"

main() {
    info "M5 Qdrant 入口脚本启动"

    # 确保目录存在并有正确权限
    mkdir -p "$STORAGE_DIR" "$SNAPSHOTS_DIR"

    info "存储目录: $STORAGE_DIR"
    info "快照目录: $SNAPSHOTS_DIR"
    info "启动 Qdrant..."

    exec /qdrant/entrypoint.sh
}

main
