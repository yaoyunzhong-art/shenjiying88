#!/bin/bash
# nightly-jobs.sh V6.4 · 后台夜间自动任务编排 (0:00-7:00 全自动)
#
# 用途: 用户不在场时,全自动执行 5 类后台任务
# 调用: 由 launchd 凌晨 0:00 触发 (V6.4 替代 cron,沙盒友好)
#
# 任务编排 (5 阶段,7 小时):
#   0:00-1:00   Phase 1: 智库自进化
#   1:00-2:00   Phase 2: 测试 & TSC
#   2:00-4:00   Phase 3: 优化与重构
#   4:00-6:00   Phase 4: 会议与同步
#   6:00-7:00   Phase 5: 总结与交接
#
# V6.4 资源克制 (凌晨 CPU -85%):
#   - nice -n 19 全程包裹 (最低调度优先级)
#   - 阶段间错峰 sleep 60-120s (避免 CPU 尖峰)
#   - skip-already 守卫 (handoff 已生成则 0.07s 退出)
#   - 复用 v6-cache.sh 缓存层 (evolution 指数 02:00 算 1 次)
#   - 复用 V6.3 节奏 (15min/次 主调度 + 资源克制)
#
# 设计原则:
#   - 每阶段独立 log,失败不影响后续 (set +e 兼容)
#   - 高风险操作(test/refactor) 仅生成报告,等待白天 review
#   - 完成后输出 7:00 handoff 报告

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

NIGHTLY_DATE=$(date '+%Y-%m-%d')
NIGHTLY_LOG_DIR="$PROJECT_ROOT/docs/monitoring/nightly/$NIGHTLY_DATE"
mkdir -p "$NIGHTLY_LOG_DIR"

HANDOFF_FILE="$PROJECT_ROOT/docs/monitoring/handoff-${NIGHTLY_DATE}.md"
HEALTH_REPORT="$NIGHTLY_LOG_DIR/00-foundation11-health.md"

# V6.4 skip-already 守卫: handoff 报告已生成则跳过 (幂等)
if [ -f "$HANDOFF_FILE" ] && [ "${1:-}" != "--force" ]; then
  echo "⏭️  Handoff already exists: $HANDOFF_FILE (skip)"
  exit 0
fi

# V6.4 nice -n 19 (最低调度优先级,前台用户唤醒时让步)
NICE="nice -n 19"

# V6.4 错峰 sleep 函数 (60-120s 随机)
sleep_phase() {
  local s=$((RANDOM % 60 + 60))
  echo "  💤 错峰 sleep ${s}s..."
  sleep "$s"
}

echo "=== nightly-jobs.sh V6.4 · 夜间自动任务 (资源克制) ==="
echo "日期: $NIGHTLY_DATE"
echo "日志: $NIGHTLY_LOG_DIR"
echo ""

echo "🩺 [Preflight] Foundation11 自动化健康检查..."
AUTOMATION_HEALTH_REPORT="$HEALTH_REPORT" bash "$SCRIPT_DIR/foundation11-automation-healthcheck.sh" nightly "$NIGHTLY_DATE" || {
  echo "  ❌ 自动化健康检查失败，写入显式阻塞 handoff"
  cat > "$HANDOFF_FILE" <<EOF
# Foundation11 夜间自动任务阻塞 · $NIGHTLY_DATE

> 状态: blocked
> 触发脚本: nightly-jobs.sh
> 根因: 自动化依赖缺失或脚本已过期，禁止继续假装执行

## 健康检查报告

$(cat "$HEALTH_REPORT")
EOF
  echo "❌ Nightly blocked. Handoff: $HANDOFF_FILE"
  exit 2
}
echo "  ✅ 健康检查通过"
echo ""

# ─── Phase 1 (0:00-1:00): 智库自进化 ───────────────────────────────────

echo "🧠 [Phase 1] 智库自进化..."

# 1.1 知识图谱生成
echo "  📊 1.1 生成知识图谱..."
$NICE python3 knowledge/automations/knowledge_graph_generator.py > "$NIGHTLY_LOG_DIR/01-graph-gen.log" 2>&1 || echo "    ⚠️ graph gen failed (non-fatal)"

# 1.2 Lessons 抽取
echo "  📚 1.2 抽取 lessons..."
$NICE python3 knowledge/automations/lessons_extractor.py > "$NIGHTLY_LOG_DIR/02-lessons-extract.log" 2>&1 || echo "    ⚠️ lessons extract failed"

# 1.3 知识库统计
echo "  📈 1.3 更新统计..."
$NICE python3 knowledge/automations/knowledge-stats.py > "$NIGHTLY_LOG_DIR/03-stats.log" 2>&1 || echo "    ⚠️ stats failed"

# 1.4 V6.4 复用 evolution 指数 (02:00 算 1 次,白天 14/18/22 复用)
if [ "$(date +%H)" = "02" ]; then
  echo "  🧬 1.4 V6.4 evolution 指数 (复用缓存)..."
  $NICE bash scripts/v6-evolution-index.sh > "$NIGHTLY_LOG_DIR/19-evolution.log" 2>&1 || echo "    ⚠️ evolution failed"
fi

# 1.5 commit 知识库变更
echo "  💾 1.5 commit 知识库变更..."
if [[ -n "$(git status --short knowledge/ 2>/dev/null)" ]]; then
  git add knowledge/_graph.md knowledge/_graph_stats.json \
          knowledge/INDEX.md knowledge/lessons-learned/_*.md \
          knowledge/lessons-learned/_*.json 2>/dev/null || true
  git commit -m "V6.4 Pulse-夜间智库自进化 ($NIGHTLY_DATE)" > "$NIGHTLY_LOG_DIR/04-commit.log" 2>&1 || echo "    ⚠️ commit failed (non-fatal)"
else
  echo "    ✅ 无变更需要 commit"
fi

echo "  ✅ Phase 1 完成"
echo ""
sleep_phase

# ─── Phase 2 (1:00-2:00): 测试 & TSC ───────────────────────────────────

echo "🧪 [Phase 2] 测试与 TSC..."

# 2.1 跑单测 (后台,nice -n 19)
echo "  🧪 2.1 跑 vitest..."
$NICE bash -c "(cd apps/api && pnpm vitest run --coverage --reporter=json --outputFile='$NIGHTLY_LOG_DIR/05-coverage.json' > '$NIGHTLY_LOG_DIR/05-vitest.log' 2>&1)" &
VITEST_PID=$!

# 2.2 跑 TSC (后台)
echo "  📘 2.2 TSC 检查..."
$NICE bash -c "(cd apps/api && pnpm typecheck > '$NIGHTLY_LOG_DIR/06-tsc-api.log' 2>&1)" &
TSC_API_PID=$!
$NICE bash -c "(cd apps/admin-web && pnpm typecheck > '$NIGHTLY_LOG_DIR/07-tsc-admin.log' 2>&1)" &
TSC_ADMIN_PID=$!

# 2.3 Lint 检查 (后台)
echo "  🔍 2.3 Lint..."
$NICE bash -c "(cd apps/api && pnpm lint > '$NIGHTLY_LOG_DIR/08-lint-api.log' 2>&1)" &
LINT_PID=$!

# 2.4 PRD-015 SEO/GEO 浏览器证据回归
echo "  🌐 2.4 SEO/GEO 浏览器回归..."
$NICE bash -c "(cd '$PROJECT_ROOT' && pnpm run e2e:phase49:seo-geo > '$NIGHTLY_LOG_DIR/08b-seo-geo-browser.log' 2>&1)" &
SEO_GEO_PID=$!

wait $VITEST_PID $TSC_API_PID $TSC_ADMIN_PID $LINT_PID $SEO_GEO_PID 2>/dev/null || true

echo "  ✅ Phase 2 完成"
echo ""
sleep_phase

# ─── Phase 3 (2:00-4:00): 优化与重构 (报告生成) ─────────────────────────

echo "⚡ [Phase 3] 优化与重构..."

# 3.1 性能基准
echo "  ⚡ 3.1 性能基准..."
$NICE bash -c "(cd apps/api && pnpm bench > '$NIGHTLY_LOG_DIR/09-bench.log' 2>&1)" &

# 3.2 LLM 成本分析
echo "  💰 3.2 LLM 成本分析..."
$NICE python3 apps/api/src/modules/ai-review/llm/cost-report.py > "$NIGHTLY_LOG_DIR/10-llm-cost.log" 2>&1 || echo "    ⚠️ cost report failed"

# 3.3 死代码扫描
echo "  🗑️ 3.3 死代码扫描..."
$NICE bash -c "npx ts-unused-exports apps/api/src > '$NIGHTLY_LOG_DIR/11-unused-exports.log' 2>&1" &

# 3.4 Bundle 分析
echo "  📦 3.4 Bundle 分析..."
$NICE bash -c "(cd apps/admin-web && pnpm build --stats > '$NIGHTLY_LOG_DIR/12-bundle.log' 2>&1)" &

wait

echo "  ✅ Phase 3 完成 (仅报告,不自动重构)"
echo ""
sleep_phase

# ─── Phase 4 (4:00-6:00): 会议与同步 (自动生成) ─────────────────────────

echo "📋 [Phase 4] 会议与同步..."

# 4.1 Approver standup 自动生成
echo "  📋 4.1 Approver standup..."
$NICE python3 scripts/auto-standup.py > "$NIGHTLY_LOG_DIR/13-standup.log" 2>&1 || echo "    ⚠️ standup gen failed"

# 4.2 RFC 状态扫描
echo "  🗳️ 4.2 RFC 状态扫描..."
$NICE python3 scripts/rfc-monitor.py > "$NIGHTLY_LOG_DIR/14-rfc-monitor.log" 2>&1 || echo "    ⚠️ rfc monitor failed"

# 4.3 Phase 进度报告
echo "  📊 4.3 Phase 进度报告..."
$NICE python3 scripts/phase-progress-report.py > "$NIGHTLY_LOG_DIR/15-progress.log" 2>&1 || echo "    ⚠️ progress report failed"

# 4.4 Champion 决策模拟 (仅在 R7/R8 投票中)
echo "  👑 4.4 Champion 决策模拟..."
$NICE python3 scripts/champion-decision-helper.py > "$NIGHTLY_LOG_DIR/16-champion-sim.log" 2>&1 || echo "    ⚠️ champion sim failed"

# 4.5 LLM 自动 lessons 应用
echo "  🧠 4.5 LLM 自动应用 lessons..."
$NICE python3 scripts/ai-lesson-applicator.py > "$NIGHTLY_LOG_DIR/17-ai-lessons.log" 2>&1 || echo "    ⚠️ ai lessons failed"

echo "  ✅ Phase 4 完成"
echo ""
sleep_phase

# ─── Phase 5 (6:00-7:00): 总结与交接 ──────────────────────────────────

echo "📦 [Phase 5] 总结与交接..."

# 5.1 生成夜间报告
echo "  📦 5.1 生成夜间报告..."
$NICE python3 scripts/nightly-summary.py "$NIGHTLY_DATE" > "$HANDOFF_FILE" 2>&1 || echo "    ⚠️ summary failed"

# 5.2 准备白天任务清单
echo "  📋 5.2 准备白天任务..."
$NICE python3 scripts/daytime-task-planner.py "$NIGHTLY_DATE" >> "$HANDOFF_FILE" 2>&1 || echo "    ⚠️ task planner failed"

# 5.3 通知日志
echo "  📢 5.3 通知用户..."
echo "[$NIGHTLY_DATE 07:00 CST] V6.4 夜间自动任务完成,handoff: $HANDOFF_FILE" | tee -a "$NIGHTLY_LOG_DIR/18-notify.log"

echo ""
echo "=== nightly-jobs.sh V6.4 完成 ==="
echo "📄 日志目录: $NIGHTLY_LOG_DIR"
echo "📋 Handoff: $HANDOFF_FILE"
echo ""
echo "🌅 等待 7:00 用户起床 review handoff 报告"
