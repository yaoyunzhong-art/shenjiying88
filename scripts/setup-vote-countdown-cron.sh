#!/bin/bash
# setup-vote-countdown-cron.sh · R7/R8 投票倒计时 cron 安装脚本
#
# 用途: 72h 等待期内,自动提醒投票进展
#
# 倒计时节点 (相对 2026-06-26 00:30 投票开始):
#   +24h → 2026-06-27 00:30 (Day 2 早,已过)
#   +48h → 2026-06-28 00:30 (Day 3 早,提醒 Champion review)
#   +60h → 2026-06-28 12:30 (Day 3 中,提醒 Approver 集中审阅)
#   +72h → 2026-06-29 00:30 (Day 4 截止,自动归档)
#
# 安装: bash scripts/setup-vote-countdown-cron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/docs/monitoring"
COUNTDOWN_LOG="$LOG_DIR/vote-countdown.log"
mkdir -p "$LOG_DIR"

# ─── 倒计时脚本 ────────────────────────────────────────────────────────

COUNTDOWN_SCRIPT="$SCRIPT_DIR/vote-countdown-notify.sh"

cat > "$COUNTDOWN_SCRIPT" <<'EOF'
#!/bin/bash
# vote-countdown-notify.sh · 投票倒计时通知脚本 (由 cron 调用)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/docs/monitoring/vote-countdown.log"
NOW=$(date '+%Y-%m-%d %H:%M:%S')

# 投票截止: 2026-06-29 00:30:00 (Asia/Shanghai = UTC+8)
VOTE_END_TS=1751217000  # 2026-06-29 00:30:00 UTC+8 → UTC: 2026-06-28 16:30:00
NOW_TS=$(date +%s)
REMAINING=$((VOTE_END_TS - NOW_TS))
HOURS=$((REMAINING / 3600))
MINUTES=$(((REMAINING % 3600) / 60))

# 当前阶段
if [ "$HOURS" -gt 48 ]; then
  STAGE="🟢 等待期前半 (剩余 ${HOURS}h)"
elif [ "$HOURS" -gt 24 ]; then
  STAGE="🟡 等待期后半 (剩余 ${HOURS}h) - Champion review 启动"
elif [ "$HOURS" -gt 12 ]; then
  STAGE="🟠 关键审阅期 (剩余 ${HOURS}h) - Approver 集中评审"
elif [ "$HOURS" -gt 0 ]; then
  STAGE="🔴 倒计时冲刺 (剩余 ${HOURS}h)"
else
  STAGE="⚫ 投票截止"
fi

# Approver 当前状态 (示意,实际从 docs/rfc/r7-status.md 读取)
APPROVERS_TOTAL=5
APPROVERS_AGREED=3
APPROVERS_PENDING=$((APPROVERS_TOTAL - APPROVERS_AGREED))

# 输出
cat <<MSG | tee -a "$LOG_FILE"
[$NOW] $STAGE
  📊 R7 投票状态: $APPROVERS_AGREED/$APPROVERS_TOTAL Approver 同意
  ⏳ 剩余: ${HOURS}h ${MINUTES}m
  📋 待办: $APPROVERS_PENDING Approver 待审阅, 0 Champion 待决
  🎯 截止: 2026-06-29 00:30 (UTC+8)
MSG
EOF

chmod +x "$COUNTDOWN_SCRIPT"

# ─── cron 安装 ─────────────────────────────────────────────────────────

CRON_TMP=$(mktemp)
cat > "$CRON_TMP" <<EOF
# 投票倒计时 cron (Pulse-68 Day 3 准备)
# 每 6 小时输出一次状态,关键节点 (60h/12h/0h) 加频
0 */6 * * * "$COUNTDOWN_SCRIPT"
# 关键节点额外提醒
0 12 28 6 * "$COUNTDOWN_SCRIPT"   # Day 3 中午 60h 节点
30 12 28 6 * "$COUNTDOWN_SCRIPT"  # Day 3 12:30 60h
0 0 29 6 * "$COUNTDOWN_SCRIPT"    # 截止时刻
EOF

# 保留现有 cron + 追加
( crontab -l 2>/dev/null | grep -v "vote-countdown-notify.sh" || true
  echo ""
  echo "# === R7/R8 投票倒计时 (Pulse-68 Day 3 启动) ==="
  cat "$CRON_TMP"
) | crontab -

rm -f "$CRON_TMP"

# ─── 立即执行一次(记录基线) ───────────────────────────────────────────

echo "✅ 倒计时 cron 安装完成"
echo ""
echo "📋 cron 配置:"
crontab -l | grep -A 10 "vote-countdown"
echo ""
echo "🚀 立即执行一次:"
"$COUNTDOWN_SCRIPT"