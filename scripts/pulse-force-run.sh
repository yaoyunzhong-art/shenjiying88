#!/bin/bash
# 🐜 pulse-force-run.sh — 每5脉冲全覆盖 force-run (时间戳模式)
# V17 fix: 去掉.pulse-counter文件依赖，用时间戳判断脉冲序号
#         脉冲间隔=1800s(30min)，每5脉冲(约2.5h)触发一次全覆盖
# Usage: bash scripts/pulse-force-run.sh

set -euo pipefail

PROJECT="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
NOW=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT"

# ── 时间戳脉冲编号 ────────────────────────────────────────────────
# 脉冲序号 = 当前unix时间戳 / 1800 (每30min一个脉冲)
PULSE_NUM=$(($(date +%s) / 1800))

echo "[pulse-force-run] $NOW — 脉冲 #$PULSE_NUM"

# ── 每5脉冲触发一次全覆盖 force-run ────────────────────────────
if [ $((PULSE_NUM % 5)) -eq 0 ]; then
  echo "[pulse-force-run] 🔄 脉冲 #$PULSE_NUM → 触发全覆盖 force-run"

  # 执行 turbo test --force（全覆盖）
  npx turbo test --force 2>&1 | tail -5

  echo "[pulse-force-run] ✅ FORCE_RUN_COMPLETED at pulse #$PULSE_NUM"
else
  NEXT=$((5 - PULSE_NUM % 5))
  echo "[pulse-force-run] ℹ️ 跳过（需 ${NEXT} 脉冲后触发）"
fi

echo "[pulse-force-run] 📊 PULSE_NUM: $PULSE_NUM"
