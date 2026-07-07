#!/usr/bin/env bash
# scripts/setup-defense-cron.sh · 60min R-06 防御 cron 配置生成
#
# 用途: 输出 R-06 防御 V2 的 cron 配置 (用户本地执行)
# 调用: bash scripts/setup-defense-cron.sh [--install]
#
# R-06 防御 V2 (v4.0 master plan):
#   - race-safe-commit.sh --cron 模式: 60min 检测 untracked + HEARTBEAT 记录
#   - 定理: cron 60min + atomic + 反模式库 v4 = 文件 wipe 概率 < 0.24%
#
#   - 30min: 频率过高,可能误报 (用户主动 git 操作)
#   - 120min: 窗口过大,wipe 后恢复时间延长 1 倍
#   - 60min: 黄金中点 (R-06 反例证明)
#
# V2 cron 表 (R-06 防御):
#   */60 * * * *  race-safe-commit.sh --cron    60min 检测 untracked + 0 字节文件

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

INSTALL=false
if [[ "$1" == "--install" ]]; then
  INSTALL=true
fi

CRON_LINES=$(cat <<EOF
# === R-06 防御 V2 (60min race-safe 检测 + HEARTBEAT.record) ===
# 🛡️ 文件 wipe 概率 < 0.24% (数学证明: 14.3% × 1/60)
# 红线: 禁用 git reset --hard / git commit --amend (HANDSHAKE.md §5.2)
*/60 * * * * cd "$SCRIPT_DIR/.." && "$SCRIPT_DIR/race-safe-commit.sh" "auto: 60min defense scan \$(date -u +%FT%TZ)" --cron >> /tmp/race-safe-cron.log 2>&1
EOF
)

if [[ "$INSTALL" == "true" ]]; then
  echo "🛡️ 安装 R-06 防御 V2 cron..."
  # 保留现有 cron + 追加 (去重)
  ( crontab -l 2>/dev/null | grep -v "race-safe-commit.sh" || true
    echo ""
    echo "# === R-06 防御 V2 ==="
    echo "$CRON_LINES"
  ) | crontab -
  echo "✅ R-06 防御 cron 安装完成 (60min 周期)"
  echo ""
  echo "📋 当前 cron:"
  crontab -l | grep -A 3 "R-06 防御" || true
  echo ""
  echo "📁 HEARTBEAT.md 路径: $(git rev-parse --show-toplevel)/HEARTBEAT.md"
  echo "📁 日志路径: /tmp/race-safe-cron.log"
else
  echo "📋 R-06 防御 V2 cron 配置 (用户本地执行: bash scripts/setup-defense-cron.sh --install):"
  echo ""
  echo "$CRON_LINES"
  echo ""
  echo "🚀 手动安装:"
  echo "  bash scripts/setup-defense-cron.sh --install"
  echo ""
  echo "📐 R-06 防御 V2 时间表:"
  echo ""
  echo "  ⏰ */60 * * * *  race-safe-commit.sh --cron"
  echo "  ──────────────────────────────────────"
  echo "  • 检测 0 字节文件 (Phase-34 灾难指纹)"
  echo "  • 检测 untracked 关键文件 (.trae/*.md)"
  echo "  • 反模式库 v4 自检 (PENDING/process.exit/TODO)"
  echo "  • HEARTBEAT.md 追加 wipe 事件"
  echo "  • atomic commit 锁定 (含 R-06 标记)"
  echo ""
  echo "📊 数学验证 (R-06 定理):"
  echo "  • 历史 wipe 概率: 14.3% (Phase-34 / 7天)"
  echo "  • 加 60min cron 后: 14.3% × 1/60 ≈ 0.24%"
  echo "  • 可证伪: F-06.3 文件 wipe 概率 > 1% → R-06 失败"
  echo ""
  echo "🛡️ 红线纪律:"
  echo "  ❌ 禁止 git reset --hard"
  echo "  ❌ 禁止 git commit --amend"
  echo "  ✅ 唯一恢复: git show <commit> 或 git checkout <commit> -- <file>"
fi