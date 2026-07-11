#!/bin/bash
# 🐜 balance-check.sh — 余额监控告警
# K029: 从daily-brief读取余额，若<¥100写入告警
# 每1小时由cron触发
# Usage: bash scripts/balance-check.sh

set -euo pipefail

PROJECT="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
DAILY_BRIEF="${PROJECT}/docs/knowledge/daily-brief.md"
STATE_FILE="${PROJECT}/.balance-alert-state"
NOW=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT"

# ── 1. 从 daily-brief 读取余额 ──────────────────────────────────
# 余额行格式: | 余额 | 🟡 | ¥171.66 |
BALANCE_RAW=$(awk -F'|' '/余额/ {for(i=1;i<=NF;i++) if($i ~ /¥/) {gsub(/.*¥/,"",$i); gsub(/[^0-9.]/,"",$i); print $i}}' "$DAILY_BRIEF" | head -1)

if [ -z "$BALANCE_RAW" ]; then
  echo "[balance-check] $NOW — ⚠️ 无法从 daily-brief 解析余额行，跳过"
  exit 0
fi

BALANCE=$(printf "%.0f" "$BALANCE_RAW" 2>/dev/null || echo "0")
echo "[balance-check] $NOW — 当前余额: ¥${BALANCE_RAW} (¥${BALANCE})"

# 如果余额包含小数，用原始数字保留精度
BALANCE_FLOAT=$(echo "$BALANCE_RAW" | awk '{printf "%.2f", $1}')
BALANCE_INT=$(echo "$BALANCE_FLOAT" | awk '{printf "%d", $1}')

# ── 2. 判断阈值 ──────────────────────────────────────────────────

ALERT_TYPE=""
ALERT_LINE=""

if [ "$(echo "$BALANCE_FLOAT < 50" | bc -l 2>/dev/null)" = "1" ] 2>/dev/null; then
  ALERT_TYPE="🔴紧急"
  ALERT_LINE="> 🚨 **🔴 余额紧急告警（${NOW}）** 余额仅 **¥${BALANCE_FLOAT}**，紧急充值为上！⚠️ 低于 ¥50 红线"
elif [ "$(echo "$BALANCE_FLOAT < 100" | bc -l 2>/dev/null)" = "1" ] 2>/dev/null; then
  ALERT_TYPE="🟡告警"
  ALERT_LINE="> ⚠️ **🟡 余额告警（${NOW}）** 余额 ¥${BALANCE_FLOAT}，接近红线（¥100）— 请及时充值"
else
  echo "[balance-check] $NOW — ✅ 余额充足 (¥${BALANCE_FLOAT})，无告警"
  rm -f "$STATE_FILE"
  exit 0
fi

# ── 3. 去重 — 用状态文件避免重复告警 ────────────────────────────
if [ -f "$STATE_FILE" ]; then
  PREV=$(cat "$STATE_FILE" 2>/dev/null || echo "")
  # 只记录当前浮动整数值，状态未变化则跳过
  if [ "$PREV" = "$BALANCE_INT" ]; then
    echo "[balance-check] $NOW — ℹ️ 余额状态无变化（¥${BALANCE_FLOAT}），跳过重复告警"
    exit 0
  fi
fi

# ── 4. 写入告警到 daily-brief ────────────────────────────────────
{
  echo ""
  echo "$ALERT_LINE"
} >> "$DAILY_BRIEF"

# ── 5. 更新状态文件 ──────────────────────────────────────────────
echo "$BALANCE_INT" > "$STATE_FILE"

echo "[balance-check] $NOW — ✅ ${ALERT_TYPE}已写入 daily-brief: 余额 ¥${BALANCE_FLOAT}"
