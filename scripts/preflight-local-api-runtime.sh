#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
用法:
  scripts/preflight-local-api-runtime.sh [--port <port>] [--timeout <seconds>] [--keep-artifacts]

目的:
  1. 作为本地 preflight 入口，统一承接 API 启动日志基线校验
  2. 保持与生产/k8s preflight 语义分层，不把本地启动探针混入线上预检
EOF
}

FORWARD_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    *)
      FORWARD_ARGS+=("$1")
      shift
      ;;
  esac
done

bash "$SCRIPT_DIR/verify-local-api-startup-baseline.sh" "${FORWARD_ARGS[@]}"
