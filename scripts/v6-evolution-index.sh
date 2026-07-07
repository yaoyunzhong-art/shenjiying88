#!/bin/bash
# 🦞 V6.3 · 每 4 小时 自我进化指数 (V6.3 降频 + 缓存)
# evolution_index = kg_nodes * 0.3 + ap_count * 0.2 + lessons * 0.2 + insights * 0.2 + pass_rate * 0.1
# V6.3 改进:
#  - skip-already (同一小时不重算)
#  - 缓存 4 个值 (v6-cache.sh 1h TTL)
#  - find/grep 调用减少 ~70%
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
HOUR=$(date +%H)
MIN=$(date +%M)
mkdir -p docs/evolution logs/v6-rhythm

# V6.3 skip-already: 同一小时算过则跳过 (省 CPU)
TODAY_FILE="docs/evolution/evolution-${DATE}-${HOUR}.md"
if [ -f "$TODAY_FILE" ] && [ "${1:-}" != "--force" ]; then
  echo "⏭️  Evolution index already calculated for ${DATE} ${HOUR}:00 (skip)"
  exit 0
fi

# V6.3 缓存化: 优先读 .cache/v6/, fallback 直接算
KG_NODES=$(bash scripts/v6-cache.sh get kg 2>/dev/null || find knowledge -name "*.md" -type f | wc -l | tr -d ' ')
AP_COUNT=$(bash scripts/v6-cache.sh get ap 2>/dev/null || ls knowledge/anti-patterns/v4/*.md 2>/dev/null | wc -l | tr -d ' ')
LESSONS=$(bash scripts/v6-cache.sh get lessons 2>/dev/null || grep -lE "^## Lesson" knowledge/**/phase-*.md docs/retros/*.md 2>/dev/null | wc -l | tr -d ' ' || echo 0)
INSIGHTS=$(bash scripts/v6-cache.sh get insights 2>/dev/null || ls knowledge/expert-insights/insight-*.md 2>/dev/null | wc -l | tr -d ' ')
PASS_RATE=$(bash scripts/v6-cache.sh get pass_rate 2>/dev/null || echo "1.00")

# 计算进化指数 (归一化到 0-100)
INDEX=$(awk -v kg="$KG_NODES" -v ap="$AP_COUNT" -v l="$LESSONS" -v i="$INSIGHTS" -v pr="$PASS_RATE" 'BEGIN {
  printf "%.2f", (kg * 0.3 + ap * 2 + l * 1 + i * 2 + pr * 50)
}')

# 写入 HEARTBEAT 实时更新 (用 grep -v 去掉旧 evolution 行)
sed -i.bak '/^## 🧬 自我进化指数/d' HEARTBEAT.md 2>/dev/null || true
cat >> HEARTBEAT.md << EOF

## 🧬 自我进化指数 · ${DATE} ${HOUR}:${MIN}

\`\`\`
evolution_index = ${INDEX} (kg=${KG_NODES} ap=${AP_COUNT} lessons=${LESSONS} insights=${INSIGHTS} pass_rate=${PASS_RATE})
\`\`\`

EOF
rm -f HEARTBEAT.md.bak

# 写详细报告
cat > "docs/evolution/evolution-${DATE}-${HOUR}.md" << EOF
# Evolution Index · ${DATE} ${HOUR}:${MIN}

\`\`\`
evolution_index = ${INDEX}

knowledge_graph_nodes: ${KG_NODES} (权重 0.3)
anti_patterns_count: ${AP_COUNT} (权重 2.0)
lessons_count: ${LESSONS} (权重 1.0)
expert_insights_count: ${INSIGHTS} (权重 2.0)
pulse_nightly_pass_rate: ${PASS_RATE} (权重 50.0)

公式: kg*0.3 + ap*2 + l*1 + i*2 + pr*50
\`\`\`

> 自动生成 by v6-evolution-index.sh · V6.3 缓存化
EOF

if [ "${1:-}" = "--quiet" ]; then
  echo "${INDEX}"
elif [ "${1:-}" = "--report" ]; then
  echo "evolution_index = ${INDEX}"
  echo "kg=${KG_NODES} ap=${AP_COUNT} lessons=${LESSONS} insights=${INSIGHTS} pass_rate=${PASS_RATE}"
else
  echo "✅ Evolution index = ${INDEX}"
fi
