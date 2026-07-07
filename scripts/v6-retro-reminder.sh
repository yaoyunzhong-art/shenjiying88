#!/bin/bash
# 🦞 V6.2 · 22:30 复盘提醒
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
HOUR=$(date +%H)
MIN=$(date +%M)
mkdir -p docs/retros .trae/handoffs

cat > "docs/retros/retro-${DATE}.md" << EOF
# Retro Reminder · ${DATE}

> 时间: ${HOUR}:${MIN} CST · v6-retro-reminder.sh

---

## 📋 今日复盘大纲

### 🦞 龙虾哥 (后台)
- [ ] V6.2 启动是否成功?
- [ ] 6 个白天任务是否全部召回?
- [ ] 自我进化指数是否合理?

### 🌲 树哥 (前台)
- [ ] 上午/下午交付是否完成?
- [ ] 组件库是否持续扩展?

### 🕵️ 侦察兵 (外勤)
- [ ] 第 157 轮是否启动?

### 🌟 Champion 决策
- [ ] V6.2 是否得到 5 Champion 批准?
- [ ] 渐进唤醒是否继续?

---

## 📊 自我进化指数

\`\`\`
$(bash scripts/v6-evolution-index.sh --report 2>/dev/null || echo "(待计算)")
\`\`\`

## 🎯 明日目标

- Pulse-Nightly-05 启动
- P0-007 @m5/api timeout 排障
- V6.2 持续监控

---

> 自动生成 by v6-retro-reminder.sh
EOF

echo "✅ Retro: docs/retros/retro-${DATE}.md"