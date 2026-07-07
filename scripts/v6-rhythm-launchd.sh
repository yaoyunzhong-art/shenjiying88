#!/bin/bash
# 🦞 V6.3 24h 节奏主调度 (launchd 每 15 分钟调用, V6.3 CPU 克制)
#
# 内部按小时判断执行哪个任务:
#  - 05:00  监控日报 (skip if exists)
#  - 07:00  standup 预热 (skip if exists)
#  - 09:00  Daily Standup (skip if exists)
#  - 10:00  知识抽取 + lint (1 天 1 次)
#  - 12:00  午间 handoff
#  - 14/18/22  自我进化指数 (V6.3 降频 6->3)
#  - 19:00  专家唤醒
#  - 20:00  晚间 handoff (V6.3 改 18->20 错峰)
#  - 22:00  投票倒计时
#  - 22:30  复盘提醒
#
# 凌晨 Pulse-Nightly-04 由 launchd autocommit 守护,本脚本不重复
# 06:00-07:00 静默 (Pulse-Nightly 收尾)
#
# V6.3 资源克制:
#  - 全部用 nice -n 19 包裹 (最低优先级)
#  - 错峰 sleep 0-30s
#  - 已有产物 skip (monitoring/standup/evolution)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

LOG_DIR="logs/v6-rhythm"
mkdir -p "$LOG_DIR"

LOCK="/tmp/v6-rhythm.lock"
if [ -f "$LOCK" ]; then
  # 已运行 (< 14 分钟内),直接退出
  exit 0
fi
touch "$LOCK"

HOUR=$(date +%H)
MIN=$(date +%M)
NOW=$(date +"%Y-%m-%d %H:%M:%S")
LOG="$LOG_DIR/v6-rhythm-$HOUR.log"

# V6.3 错峰 0-30s,避免和前台 IDE / nightly 撞车
SLEEP_S=$((RANDOM % 30))
sleep "$SLEEP_S"

echo "[$NOW] v6-rhythm tick hour=$HOUR min=$MIN sleep=${SLEEP_S}s" >> "$LOG"

# nice -n 19 = 最低调度优先级 (CPU 占用时不抢前台)
NICE="nice -n 19"

case $HOUR in
  "05")
    if [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-monitoring-daily.sh >> "$LOG" 2>&1
    fi
    ;;
  "07")
    if [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-morning-standup.sh --prep >> "$LOG" 2>&1
    fi
    ;;
  "09")
    if [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-morning-standup.sh >> "$LOG" 2>&1
    fi
    ;;
  "10")
    if [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-knowledge-extract.sh >> "$LOG" 2>&1
    fi
    ;;
  "12")
    if [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-handoff-noon.sh >> "$LOG" 2>&1
    fi
    ;;
  # V6.3 降频: 14-21 时段 6 次 -> 3 次 (14/18/22)
  "14"|"18"|"22")
    if [ "$MIN" -lt 15 ] || { [ "$HOUR" = "22" ] && [ "$MIN" -ge 30 ] && [ "$MIN" -lt 45 ]; }; then
      $NICE bash scripts/v6-evolution-index.sh >> "$LOG" 2>&1
    fi
    ;;
  "19")
    if [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-expert-wakeup.sh >> "$LOG" 2>&1
    fi
    ;;
  "20")
    # V6.3 改 18->20 错峰 (不和 standup/knowledge 撞)
    if [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-handoff-evening.sh >> "$LOG" 2>&1
    fi
    # V6.3 大飞哥指令: 20:00 每日专家团会议 + 知识进化报告
    if [ "$MIN" -ge 0 ] && [ "$MIN" -lt 5 ]; then
      $NICE bash scripts/v6-meeting-daily.sh >> "$LOG" 2>&1
    fi
    ;;
  "23")
    if [ "$MIN" -ge 0 ] && [ "$MIN" -lt 15 ]; then
      $NICE bash scripts/v6-vote-countdown.sh >> "$LOG" 2>&1
    fi
    ;;
esac

# 14 分钟后删除锁 (V6.3 launchd 改 900s 间隔,锁延长)
( sleep 840 && rm -f "$LOCK" ) &
disown

exit 0