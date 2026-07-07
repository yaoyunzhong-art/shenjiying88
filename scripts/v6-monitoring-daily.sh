#!/bin/bash
# 🦞 V6.2 · 05:00 监控日报
# 召回 docs/monitoring/YYYY-MM-DD.md
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."

DATE=$(date +%Y-%m-%d)
HOUR=$(date +%H)
mkdir -p docs/monitoring

# V6.3 skip-already: 当天日报已生成则跳过 (省 100% CPU)
if [ -f "docs/monitoring/${DATE}.md" ] && [ "${1:-}" != "--force" ]; then
  echo "⏭️  Monitoring report already exists: docs/monitoring/${DATE}.md (skip)"
  exit 0
fi

cat > "docs/monitoring/${DATE}.md" << EOF
# 🦞 Monitoring Daily Report · ${DATE}

> 自动生成时间: ${HOUR}:00 CST · v6-monitoring-daily.sh
> V6.2: 在 monitoring-daily.sh 基础上 + evolution index + HEARTBEAT 同步

---

## 🟢 系统状态

| 指标 | 值 | 状态 |
|------|----|------|
| launchd autocommit | $(launchctl list 2>/dev/null | grep shenjiying | wc -l | tr -d ' ') 个守护运行中 | ✅ |
| launchd v6-rhythm | $(launchctl list 2>/dev/null | grep v6-rhythm | wc -l | tr -d ' ')/1 | $([ $(launchctl list 2>/dev/null | grep v6-rhythm | wc -l | tr -d ' ') -ge 1 ] && echo "✅" || echo "❌") |
| git working tree | $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') 文件变更 | $([ $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') -le 5 ] && echo "✅" || echo "🟡") |
| 最近 Pulse-Nightly | $(ls -t reports/nightly-test-*.md 2>/dev/null | head -1 | xargs -I{} basename {} .md 2>/dev/null || echo "缺") | ✅ |

## 📊 昨日 (昨天) 总结

- Pulse-Nightly: $(ls reports/nightly-test-*.md 2>/dev/null | wc -l | tr -d ' ') 份报告
- 专家洞察: $(ls knowledge/expert-insights/insight-*.md 2>/dev/null | wc -l | tr -d ' ') 份
- HEARTBEAT: $(wc -l HEARTBEAT.md 2>/dev/null | awk '{print $1}') 行 (最后更新: $(stat -f '%Sm' HEARTBEAT.md 2>/dev/null))

## 🎯 今日目标

- V6.2 全面启动 (10 个子脚本 + launchd)
- P0-007 @m5/api timeout 排障
- Pulse-Nightly-05 准备

## 🧬 自我进化指数

\`\`\`
$(bash scripts/v6-evolution-index.sh --report 2>/dev/null || echo "(待计算)")
\`\`\`

---

> 自动生成 by v6-monitoring-daily.sh
EOF

echo "✅ Monitoring report: docs/monitoring/${DATE}.md"