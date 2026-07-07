#!/bin/bash
# 🦞 V6.2 · 18:00 晚间 handoff
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
HOUR=$(date +%H)
mkdir -p .trae/handoffs

cat > ".trae/handoffs/evening-${DATE}.md" << EOF
# 🌆 Evening Handoff · ${DATE}

> 时间: ${HOUR}:00 CST · v6-handoff-evening.sh

---

## 🦞 龙虾哥 (下午交付)

- (待 22:30 retro 补)

## 🌲 树哥 (下午交付)

- (待补)

## 🕵️ 侦察兵 (下午交付)

- (待补)

## 🌟 Champion 决策

- (待 22:00 投票)

---

## 📊 晚间目标

- 19:00 专家唤醒 (本周 5 位)
- 22:00 投票倒计时
- 22:30 复盘提醒
- 23:00 Pulse-Nightly-05 准备

---

> 自动生成 by v6-handoff-evening.sh
EOF

echo "✅ Evening handoff: .trae/handoffs/evening-${DATE}.md"