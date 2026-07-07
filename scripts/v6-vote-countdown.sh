#!/bin/bash
# 🦞 V6.2 · 22:00 投票倒计时
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
HOUR=$(date +%H)
mkdir -p docs/monitoring

# 计算 V6.2 进度
PROGRESS=$(echo "scale=2; $(date +%s) / 86400 % 1 * 100" | bc 2>/dev/null || echo "50")

cat >> "docs/monitoring/vote-countdown.log" << EOF
[${DATE} ${HOUR}:00] V6.2 24h 节奏启动 · 进度 ${PROGRESS}% · 距 Pulse-Nightly-05 还有 ${PROGRESS}% 小时
EOF

echo "✅ Vote countdown: docs/monitoring/vote-countdown.log"