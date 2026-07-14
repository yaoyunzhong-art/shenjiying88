#!/bin/bash
# 🐜 pulse-force-run.sh — 每5脉冲全覆盖 force-run
# Part of: shenjiying88 V17 force-run-mvl
# Usage: bash scripts/pulse-force-run.sh

set -euo pipefail

PROJECT="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
PULSE_FILE="${PROJECT}/.pulse-counter"
NOW=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT"

# ── 1. 读取/初始化脉冲计数器 ─────────────────────────────────────
if [ -f "$PULSE_FILE" ]; then
  COUNT=$(cat "$PULSE_FILE")
  COUNT=$((COUNT + 1))
else
  COUNT=1
fi
echo $COUNT > "$PULSE_FILE"

echo "[pulse-force-run] $NOW — 脉冲 #$COUNT"

# ── 2. 每5脉冲触发一次全覆盖 force-run ────────────────────────────
if [ $((COUNT % 5)) -eq 0 ]; then
  echo "[pulse-force-run] 🔄 脉冲 #$COUNT → 触发全覆盖 force-run"

  # 执行 turbo test --force（全覆盖）
  npx turbo test --force 2>&1 | tail -5

  echo "[pulse-force-run] ✅ FORCE_RUN_COMPLETED at pulse #$COUNT"
else
  echo "[pulse-force-run] ℹ️ 跳过（需 #$((5 - COUNT % 5)) 脉冲后触发）"
fi

echo "[pulse-force-run] 📊 PULSE_COUNTER: $COUNT"
