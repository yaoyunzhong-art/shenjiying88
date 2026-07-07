#!/bin/bash
# 🦞 V6.2 · 19:00 专家渐进唤醒
# 每周唤醒 5 位新专家,直至 44/44
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
WEEK_NUM=$(date +%V)
mkdir -p knowledge/expert-insights

# 当前已启用专家
ACTIVE=$(grep -lE "活跃度.*待启动" experts/E*.md 2>/dev/null | wc -l | tr -d ' ' || echo "0")
TOTAL=$(ls experts/E*.md | wc -l | tr -d ' ')
NEW=$((TOTAL - ACTIVE))

echo "📊 专家统计: ${ACTIVE}/${TOTAL} 启用 (${NEW} 待唤醒)"

# 本周唤醒 5 位 (Week $WEEK_NUM)
WAKEUP_TARGETS=$(find experts -name "E*.md" -exec grep -l "待启动" {} \; 2>/dev/null | sort | head -5)

cat > "knowledge/expert-insights/wakeup-${DATE}.md" << EOF
# Expert Wakeup · ${DATE} (Week ${WEEK_NUM})

> 自动生成 by v6-expert-wakeup.sh
> V6.2: 渐进唤醒策略,每周 5 位

---

## 📊 当前状态

- 已启用: ${ACTIVE}/${TOTAL}
- 待唤醒: ${NEW}
- 本周目标: +5

## 🎯 本周唤醒 (Week ${WEEK_NUM})

${WAKEUP_TARGETS}

---

## 📋 唤醒清单

1. E2/E6/E10/E17/E25 (Week 1)
2. E3/E7/E11/E18/E26 (Week 2)
3. ... 直至 44/44

---

> 自动生成 by v6-expert-wakeup.sh
EOF

echo "✅ Wakeup log: knowledge/expert-insights/wakeup-${DATE}.md"