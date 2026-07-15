#!/bin/bash
# 🐜 pulse-health-check.sh — 验收脉冲健康检查
# AM-019修复: 读取phase-progress.md最新脉记录，若最近2次中有任一失败→写入daily-brief告警
# Part of: shenjiying88 20min验收健康检查cron
# Usage: bash scripts/pulse-health-check.sh [--skip-security]
#   (无参数)     默认: 脉冲健康检查 + 安全门扫描
#   --skip-security  跳过安全门扫描
# 🐜 [V17-round3: fix-security-audit] 默认执行安全扫描

set -euo pipefail

PROJECT="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
PHASE_PROGRESS="${PROJECT}/docs/knowledge/phase-progress.md"
DAILY_BRIEF="${PROJECT}/docs/knowledge/daily-brief.md"
STATE_FILE="${PROJECT}/.pulse-health-alert-state"
NOW=$(date '+%Y-%m-%d %H:%M')

cd "$PROJECT"

# ── 解析参数 ──────────────────────────────────────────────────────
# 🐜 [V17-round3: fix-security-audit] 默认执行安全扫描,不再需要 --security 参数
DO_SECURITY=true
for arg in "$@"; do
  case "$arg" in
    --skip-security) DO_SECURITY=false ;;
    --help|-h)
      echo "Usage: bash scripts/pulse-health-check.sh [--skip-security]"
      echo "  (无参数)     脉冲健康检查 + 安全门扫描(默认)"
      echo "  --skip-security  跳过安全门扫描"
      exit 0
      ;;
  esac
done

# ── 安全门扫描前置 (默认执行) ──────────────────────────────────────
if [ "$DO_SECURITY" = true ]; then
  echo ""
  echo "[pulse-health-check] 🔐 触发安全门扫描 (默认执行)..."
  echo ""
  
  SECURITY_SCRIPT="$PROJECT/scripts/security-scan.sh"
  if [ -f "$SECURITY_SCRIPT" ]; then
    if bash "$SECURITY_SCRIPT"; then
      echo ""
      echo "[pulse-health-check] ✅ 安全门通过"
    else
      SEC_EXIT=$?
      echo ""
      echo "[pulse-health-check] ❌ 安全门报告安全问题 (退出码 $SEC_EXIT)"
      echo "[pulse-health-check]    🐜 [V17: security-gates] 安全门硬阻断"
      echo "[pulse-health-check]    检查: docs/knowledge/security-scan-*.md"
      
      # 写入告警到daily-brief
      ALERT_LINE="> 🚨 **安全门阻断（${NOW}）** 安全扫描发现风险 — 🐜 [V17: security-gates]"
      echo "" >> "$DAILY_BRIEF"
      echo "$ALERT_LINE" >> "$DAILY_BRIEF"
      
      # 安全门的失败不阻断脉冲检查流程
      echo ""
      echo "[pulse-health-check] ⚠️ 继续执行脉冲健康检查..."
      echo ""
    fi
  else
    echo "[pulse-health-check] ⚠️ 安全扫描脚本未找到: $SECURITY_SCRIPT"
  fi
fi

# ── 1. 解析脉冲表最后2个记录 ──────────────────────────────────────
PULSE_LINES=$(grep -iE '\| *pulse#[0-9]' "$PHASE_PROGRESS" | tail -2 || true)

TOTAL_LINES=$(echo "$PULSE_LINES" | grep -c . || true)

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
    # 🐜 [V17-round3: fix-fuse-force-adr] 熔断检测: 记录失败到fuse计数器
    MODULE_NAME="pulse-${PULSE_NUM}"
    bash "${PROJECT}/scripts/fuse-check.sh" "${MODULE_NAME}" "pulse_failure" 2>&1 || true
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
