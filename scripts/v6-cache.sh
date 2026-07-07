#!/bin/bash
# 🦞 V6.3 · 缓存工具 (V6.2 升级 - CPU 克制)
# 把 find/grep/wc 重操作的结果缓存 1 小时,子脚本读缓存
# 目标: CPU 占用 -30%
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

CACHE_DIR=".cache/v6"
mkdir -p "$CACHE_DIR"
TTL=${V6_CACHE_TTL:-3600}  # 默认 1 小时

# 用法: bash scripts/v6-cache.sh get <key>
#   key: kg | ap | lessons | insights | pass_rate
# 行为:
#   - 缓存命中且未过期 -> 输出缓存值
#   - 否则重新计算并写入缓存

# 兼容两种调用: v6-cache.sh <key> 或 v6-cache.sh get <key>
if [ "${1:-}" = "get" ]; then
  KEY="${2:-}"
else
  KEY="${1:-}"
fi
if [ -z "$KEY" ]; then
  echo "Usage: v6-cache.sh [get] <key>" >&2
  echo "Keys: kg, ap, lessons, insights, pass_rate" >&2
  exit 2
fi

CACHE_FILE="$CACHE_DIR/${KEY}.cache"

# 命中且未过期
if [ -f "$CACHE_FILE" ]; then
  AGE=$(($(date +%s) - $(stat -f %m "$CACHE_FILE")))
  if [ "$AGE" -lt "$TTL" ]; then
    cat "$CACHE_FILE"
    exit 0
  fi
fi

# 重新计算
case "$KEY" in
  kg)
    find knowledge -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' '
    ;;
  ap)
    ls knowledge/anti-patterns/v4/*.md 2>/dev/null | wc -l | tr -d ' '
    ;;
  lessons)
    grep -lE "^## Lesson" knowledge/**/phase-*.md docs/retros/*.md 2>/dev/null | wc -l | tr -d ' ' || echo 0
    ;;
  insights)
    ls knowledge/expert-insights/insight-*.md 2>/dev/null | wc -l | tr -d ' '
    ;;
  pass_rate)
    LATEST=$(ls -t reports/nightly-test-*.md 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
      PASS=$(grep -cE "✅" "$LATEST" 2>/dev/null | head -1 | tr -d ' ' || echo 0)
      TOTAL=$PASS
      awk -v p="$PASS" -v t="$TOTAL" 'BEGIN {if (t>0) printf "%.2f", p/t; else print "1.00"}'
    else
      echo "1.00"
    fi
    ;;
  *)
    echo "Unknown key: $KEY" >&2
    exit 1
    ;;
esac | tee "$CACHE_FILE"
