#!/bin/bash
# setup-rhythm-cron.sh · 24h 开发节奏 cron 配置生成 (V2 完整版)
#
# 用途: 输出 24h 节奏的 cron 配置 (用户本地执行)
# 调用: bash scripts/setup-rhythm-cron.sh [--install]
#
# V2 模式:
#   --install  实际安装到 crontab (需用户本地权限)
#   默认      仅输出配置,不修改
#
# V2 cron 表 (16h 自动 + 8h 协作):
#   00:00  nightly-jobs.sh        夜间 7h 自动
#   07:00  daytime-handoff.sh     起床 review handoff
#   08:00  morning-dev-jobs.sh    上午 4h 自动开发
#   09:00  standup-reminder.sh    工作日 standup
#   13:00  afternoon-dev-jobs.sh  下午 5h 自动开发
#   22:00  retro-reminder.sh      复盘提醒

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

INSTALL=false
if [[ "$1" == "--install" ]]; then
  INSTALL=true
fi

CRON_LINES=$(cat <<EOF
# === 神机营 24h 开发节奏 V2 (Pulse-68) ===
# 🤖 自动时段 (16h): 0:00-12:00 + 13:00-18:00
# 夜间自动 (0:00-7:00) - 智库/测试/优化/会议
0 0 * * * "$SCRIPT_DIR/nightly-jobs.sh" >> /tmp/nightly-cron.log 2>&1

# 👤 起床 review (7:00) - handoff 报告
0 7 * * * "$SCRIPT_DIR/daytime-handoff.sh" >> /tmp/daytime-cron.log 2>&1

# 🤖 上午自动 (8:00-12:00) - T1-T4 主任务
0 8 * * * "$SCRIPT_DIR/morning-dev-jobs.sh" >> /tmp/morning-cron.log 2>&1

# 👑 工作日 standup (9:00 周一-周五)
0 9 * * 1-5 "$SCRIPT_DIR/standup-reminder.sh" >> /tmp/standup-cron.log 2>&1

# 🤖 下午自动 (13:00-18:00) - T5-T10 + Phase-19
0 13 * * * "$SCRIPT_DIR/afternoon-dev-jobs.sh" >> /tmp/afternoon-cron.log 2>&1

# 👑 复盘提醒 (22:00)
0 22 * * * "$SCRIPT_DIR/retro-reminder.sh" >> /tmp/retro-cron.log 2>&1
EOF
)

if [[ "$INSTALL" == "true" ]]; then
  echo "🔧 安装 24h V2 开发节奏 cron..."
  # 保留现有 cron + 追加 (去重)
  ( crontab -l 2>/dev/null | grep -v "nightly-jobs.sh\|daytime-handoff.sh\|morning-dev-jobs.sh\|afternoon-dev-jobs.sh\|standup-reminder.sh\|retro-reminder.sh" || true
    echo ""
    echo "# === 神机营 24h 开发节奏 V2 (Pulse-68) ==="
    echo "$CRON_LINES"
  ) | crontab -
  echo "✅ V2 cron 安装完成"
  echo ""
  echo "📋 当前 cron:"
  crontab -l | grep -A 25 "24h 开发节奏"
else
  echo "📋 24h V2 开发节奏 cron 配置 (用户本地执行: bash scripts/setup-rhythm-cron.sh --install):"
  echo ""
  echo "$CRON_LINES"
  echo ""
  echo "🚀 手动安装:"
  echo "  bash scripts/setup-rhythm-cron.sh --install"
  echo ""
  echo "📅 V2 时间表 (16h 自动 + 8h 协作):"
  echo ""
  echo "  🤖 自动时段 (16h)"
  echo "  ──────────────────────────────────────"
  echo "  00:00  nightly-jobs.sh        夜间 7h 智库/测试/优化"
  echo "  08:00  morning-dev-jobs.sh    上午 4h Phase-17 T1-T4"
  echo "  13:00  afternoon-dev-jobs.sh  下午 5h T5-T10 + Phase-19"
  echo ""
  echo "  👤 用户协作时段 (8h)"
  echo "  ──────────────────────────────────────"
  echo "  07:00  daytime-handoff.sh     起床 review handoff"
  echo "  09:00  standup-reminder.sh    工作日 standup"
  echo "  12:00-13:00   午间 review + 决策"
  echo "  18:00-19:00   晚餐 review"
  echo "  22:00  retro-reminder.sh      复盘提醒"
  echo ""
  echo "  👑 黄金时段 (19:00-23:00)"
  echo "  ──────────────────────────────────────"
  echo "  用户主参与: 关键决策 / Champion 签字 / RFC 直批"
fi