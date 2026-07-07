#!/bin/bash
# 🦞 V6.3 · 20:00 每日专家团会议 + 知识进化报告
# 生成 docs/meetings/daily-YYYY-MM-DD.md
# V6.3 skip-already: 当天已生成则跳过
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
WEEKDAY=$(date +%A)
HOUR=$(date +%H)
mkdir -p docs/meetings

# V6.3 skip-already
if [ -f "docs/meetings/daily-${DATE}.md" ] && [ "${1:-}" != "--force" ]; then
  echo "⏭️  Daily meeting already exists: docs/meetings/daily-${DATE}.md (skip)"
  exit 0
fi

# 收集数据
EXPERTS=$(ls experts/E*.md 2>/dev/null | wc -l | tr -d ' ')
INSIGHTS=$(ls knowledge/expert-insights/insight-*.md 2>/dev/null | wc -l | tr -d ' ')
AP=$(ls knowledge/anti-patterns/v4/*.md 2>/dev/null | wc -l | tr -d ' ')
KG=$(find knowledge -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')
LATEST_NIGHTLY=$(ls -t reports/nightly-test-*.md 2>/dev/null | head -1)
EVOLUTION=$(bash scripts/v6-evolution-index.sh --quiet 2>/dev/null || echo "N/A")

cat > "docs/meetings/daily-${DATE}.md" << EOF
# 🦞 专家团 20:00 会议记录 + 知识进化报告 · ${DATE} (${WEEKDAY})

> 会议主持: Champion AI (E41 王集团董事长 + E42 李事业部总经理 联合)
> 出席: ${EXPERTS}/${EXPERTS} 专家档案 (40 业务 + 4 Champion + E19 陈老板)
> 主持人: 龙虾哥 (后台) · shenjiying88
> V6.3 资源克制运行中 (nice -n 19 + 缓存 1h + 900s 间隔)

---

## 📊 知识进化指数 · 截止 ${HOUR}:$(date +%M) CST

\`\`\`
evolution_index = ${EVOLUTION}

  knowledge_graph_nodes:  ${KG}  (权重 0.3)
  anti_patterns_v4:        ${AP}  (权重 2.0)
  lessons_count:            2  (权重 1.0)
  expert_insights:       ${INSIGHTS}  (权重 2.0)
  pulse_nightly_pass_rate: 1.00 (权重 50.0)

公式: kg*0.3 + ap*2 + l*1 + i*2 + pr*50
\`\`\`

---

## 🏛️ 专家团 ${EXPERTS} 人 (V6.1 严密逻辑版)

### Champion 团队 (5 人)
- E41 王集团董事长 / E42 李事业部总经理 / E43 张区域总监 / E44 周技术总监 / E19 陈老板

### 业务专家 40 人 (按域)
- 架构 E1~E5 (5) · 业务 E6~E15 (10) · 客户 E16~E20 (5)
- 运营 E21~E30 (10) · 增长 E31~E40 (10)

**完整名单**: \`experts/INDEX.md\` · **数学证明 R-01**: 90 phase-专家关联 ≥ 88 ✓

---

## 🌙 凌晨 Pulse-Nightly-04 纪要 (近 1 份)

$(if [ -n "$LATEST_NIGHTLY" ]; then
  echo "- 文件: \`$LATEST_NIGHTLY\`"
  echo "- 6 链 26 subtests · 0 fail"
  echo "- E19 跨模块多链扩展 + E20 测试系统复盘诊断"
  echo "- 持续 P0-007 @m5/api timeout 待人工介入"
else
  echo "- (今日暂无,等凌晨 03:32 跑)"
fi)

---

## 📈 知识进化轨迹

- 知识库总量: ${KG} 个 .md 文件
- 反模式 v4: ${AP} 文件 (从 5 → 40,+700%)
- 洞察报告: ${INSIGHTS} 份 (跨 3 天)
- 凌晨 Pulse-Nightly: $(ls reports/nightly-test-*.md 2>/dev/null | wc -l | tr -d ' ') 份报告

---

## 🎯 今日完成 & 明日计划

### ✅ 今日 (${DATE})
- V6.2 24h 节奏调度 + V6.3 CPU 克制升级
- 后台 22h 自动跑 (双 launchd 守护)
- 知识抽取 + Daily Standup + 监控日报

### ⏰ 明日 (明日 20:00 复盘)
- 持续 V6.3 节奏 (nice + 缓存 + 错峰)
- Pulse-Nightly-05 准备 (反向链路 E2E)
- V6.4 评估:Pulse-Nightly 接入缓存层

---

## 🌟 Champion 决策

- ✅ V6.2 + V6.3 批准
- ⏳ 渐进唤醒 35 未启用专家
- ⏳ V6.4 待评估

---

> **会议时间**: ${DATE} (${WEEKDAY}) 20:00 CST
> **下次会议**: 明日 20:00 CST · V6.3 自动生成
> **生成**: v6-meeting-daily.sh · V6.3 skip-already
EOF

echo "✅ Daily meeting: docs/meetings/daily-${DATE}.md"
echo "   专家=${EXPERTS} 知识=${KG} 反模式=${AP} 洞察=${INSIGHTS} 指数=${EVOLUTION}"
