#!/bin/bash
# vote-countdown-notify.sh · 投票倒计时通知脚本 (由 cron 调用)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_ROOT/docs/monitoring/vote-countdown.log"
NOW=$(date '+%Y-%m-%d %H:%M:%S')

# 投票截止: 2026-06-29 00:30:00 CST (Asia/Shanghai = UTC+8)
VOTE_END_TS=1782664200  # unix timestamp (UTC), CST 2026-06-29 00:30 = UTC 2026-06-28 16:30
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
