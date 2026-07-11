#!/bin/bash
# 🐜 pulse-health-check.sh — 验收脉冲健康检查
# AM-019修复: 读取phase-progress.md最新脉记录，若最近2次中有任一失败→写入daily-brief告警
# Part of: shenjiying88 20min验收健康检查cron
# Usage: bash scripts/pulse-health-check.sh

set -euo pipefail

PROJECT="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
PHASE_PROGRESS="${PROJECT}/docs/knowledge/phase-progress.md"
DAILY_BRIEF="${PROJECT}/docs/knowledge/daily-brief.md"
STATE_FILE="${PROJECT}/.pulse-health-alert-state"
NOW=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT"

# ── 1. 解析脉冲表最后2个记录 ──────────────────────────────────────
PULSE_LINES=$(awk '
  /^## 验收脉冲记录/ { found=1; next }
  found && /^\|/ && /pulse#/ { lines[++n]=$0 }
  END { 
    if (n>=2) { print lines[n-1]; print lines[n] }
    else if (n>=1) { print lines[n] }
  }
' "$PHASE_PROGRESS")

TOTAL_LINES=$(echo "$PULSE_LINES" | grep -c .)

echo "[pulse-health-check] $NOW — 检查最近脉冲 ($TOTAL_LINES 条)"

if [ "$TOTAL_LINES" -eq 0 ]; then
  echo "[pulse-health-check] ⚠️ 无可检查的脉冲记录，跳过"
  exit 0
fi

# ── 2. 判断每个脉冲是否失败 ────────────────────────────────────────
HAS_FAILURE=false
FAILED_PULSES=""

while IFS= read -r line; do
  PULSE_NUM=$(echo "$line" | grep -oE 'pulse#[0-9]+' | head -1)
  STATUS_COL=$(echo "$line" | awk -F'\\|' '{print $(NF-1)}')
  
  if echo "$STATUS_COL" | grep -qE '[❌⛔]'; then
    HAS_FAILURE=true
    FAILED_PULSES="$FAILED_PULSES $PULSE_NUM"
    echo "[pulse-health-check] ❌ $PULSE_NUM 失败"
  elif echo "$STATUS_COL" | grep -qE '[✅🏆]'; then
    echo "[pulse-health-check] ✅ $PULSE_NUM 正常"
  else
    echo "[pulse-health-check] ⚠️ $PULSE_NUM 状态未知"
  fi
done <<< "$(echo "$PULSE_LINES" | tail -2)"

# ── 3. 若所有通过则静默退出 ───────────────────────────────────────
if [ "$HAS_FAILURE" = false ]; then
  echo "[pulse-health-check] ✅ 最近脉冲全部正常，无告警"
  # 清除状态文件
  rm -f "$STATE_FILE"
  exit 0
fi

# ── 4. 发现断裂 — 用状态文件去重 ─────────────────────────────────
FAILED_SET=$(echo "$FAILED_PULSES" | tr ' ' '\n' | grep -v '^$' | sort -t# -k2 -n | tr '\n' ' ' | sed 's/ $//')

if [ -f "$STATE_FILE" ]; then
  PREV_FAILED=$(cat "$STATE_FILE" 2>/dev/null || echo "")
  if [ "$FAILED_SET" = "$PREV_FAILED" ]; then
    echo "[pulse-health-check] ℹ️ 断裂状态无变化（${FAILED_SET}），跳过重复告警"
    exit 0
  fi
fi

# ── 5. 写入告警到 daily-brief.md ─────────────────────────────────
ALERT_LINE="> 🚨 **验收断裂告警（${NOW}）** 脉冲${FAILED_PULSES} 失败 — AM-019脉冲健康检查"

{
  echo ""
  echo "$ALERT_LINE"
} >> "$DAILY_BRIEF"

# ── 6. 更新状态文件 ───────────────────────────────────────────────
echo "$FAILED_SET" > "$STATE_FILE"

echo "[pulse-health-check] ✅ 告警已写入: 脉冲${FAILED_PULSES} 失败"
