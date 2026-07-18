#!/bin/bash
# VRT 运行入口
# 用法: ./scripts/vrt/run-vrt.sh [--baseline]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/../.."

echo "=== VRT 运行 ==="

if [ "${1:-}" = "--baseline" ]; then
  echo "模式: 生成基线截图"
  npx tsx "$SCRIPT_DIR/snapshot.ts" --baseline
else
  echo "模式: 截图 + 对比"
  npx tsx "$SCRIPT_DIR/snapshot.ts"
  npx tsx "$SCRIPT_DIR/compare.ts"
fi

echo "=== 完成 ==="
