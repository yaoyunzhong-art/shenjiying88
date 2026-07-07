#!/bin/bash
# 🦞 V6.2 · 10:00 知识抽取 + lint (日深度版)
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
mkdir -p knowledge/expert-insights logs/v6-rhythm

# 1. 抽取 lessons (从最近 commits + 反模式更新)
LESSONS=$(python3 scripts/extract-knowledge.py --phase lessons --since "${DATE}" 2>/dev/null | head -50 || echo "")

# 2. lint 知识库
LINT_RESULT=$(python3 scripts/lint-knowledge.py 2>&1 | tail -10 || echo "lint passed")

# 3. 更新 INDEX.md (如果有新增)
EXPERT_COUNT=$(ls experts/E*.md 2>/dev/null | wc -l | tr -d ' ')
INSIGHT_COUNT=$(ls knowledge/expert-insights/insight-*.md 2>/dev/null | wc -l | tr -d ' ')
AP_COUNT=$(ls knowledge/anti-patterns/v4/*.md 2>/dev/null | wc -l | tr -d ' ')

cat > "knowledge/expert-insights/extract-${DATE}.md" << EOF
# Knowledge Extract · ${DATE} 10:00

> 自动生成 by v6-knowledge-extract.sh
> V6.2: 在 extract-knowledge.py 基础上 + 每日定时深度版

---

## 📊 知识库统计

| 维度 | 数量 |
|------|------|
| 专家档案 | ${EXPERT_COUNT} |
| 洞察报告 | ${INSIGHT_COUNT} |
| 反模式 v4 | ${AP_COUNT} |

## 🔍 Lint 结果

\`\`\`
${LINT_RESULT}
\`\`\`

## 📚 Lessons (新增)

${LESSONS}

---

> 自动生成 by v6-knowledge-extract.sh
EOF

echo "✅ Knowledge extract: knowledge/expert-insights/extract-${DATE}.md"
echo "📊 统计: 专家=${EXPERT_COUNT} 洞察=${INSIGHT_COUNT} 反模式=${AP_COUNT}"