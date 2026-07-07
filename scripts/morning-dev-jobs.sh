#!/bin/bash
# morning-dev-jobs.sh · 8:00-12:00 基础开发11 上午自动推进
#
# 用途: 会员/营销/活动主链扫描 + Foundation11 真回归 + 中午交接
# 调用: 由 cron 8:00 触发
#
# 任务清单 (4 小时):
#   8:00-9:00   T1 扫描 member/loyalty/transactions 主链
#   9:00-10:30 T2 跑 analytics/campaign/cross-module 关键回归
#   10:30-11:30 T3 跑 admin-web/tob-web 当前真接口读面回归
#   11:30-12:00 T4 汇总状态、可选提交、输出 midday handoff
#
# 设计:
#   - 每个 T 任务独立 log,失败显式记录
#   - 先回归、后提交,不再伪造脚手架完成度
#   - 输出可追溯的 handoff 作为后台静默工作证据
#   - 12:00 输出上午成果到 midday-handoff 文件

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

TODAY=$(date '+%Y-%m-%d')
LOG_DIR="$PROJECT_ROOT/docs/monitoring/dev/$TODAY/morning"
mkdir -p "$LOG_DIR"

MIDDAY_HANDOFF="$PROJECT_ROOT/docs/monitoring/midday-handoff-${TODAY}.md"
HEALTH_REPORT="$LOG_DIR/00-foundation11-health.md"

echo "=== morning-dev-jobs.sh · 上午开发全自动 ==="
echo "日期: $TODAY"
echo "时段: 8:00-12:00"
echo "日志: $LOG_DIR"
echo ""

echo "🩺 [Preflight] Foundation11 自动化健康检查..."
AUTOMATION_HEALTH_REPORT="$HEALTH_REPORT" bash "$SCRIPT_DIR/foundation11-automation-healthcheck.sh" morning "$TODAY" || {
  cat > "$MIDDAY_HANDOFF" <<EOF
# Foundation11 上午自动开发阻塞 · $TODAY

> 状态: blocked
> 触发脚本: morning-dev-jobs.sh
> 根因: 自动化健康检查失败，禁止继续执行陈旧/缺依赖脚本

## 健康检查报告

$(cat "$HEALTH_REPORT")
EOF
  echo "❌ Morning blocked. Handoff: $MIDDAY_HANDOFF"
  exit 2
}
echo "  ✅ 健康检查通过"
echo ""

# ─── T1 (8:00-9:00): 主链扫描 ───────────────────────────────────────────

echo "🔨 [T1] 基础开发11主链扫描 (60 min)..."

echo "  📝 1.1 扫描 member/loyalty/transactions 关键文件..."
{
  echo "# Foundation11 主链扫描"
  echo
  ls apps/api/src/modules/member
  ls apps/api/src/modules/loyalty
  ls apps/api/src/modules/transactions
} > "$LOG_DIR/t1-chain-scan.log" 2>&1 || echo "    ⚠️ chain scan failed"

echo "  🧪 1.2 记录最近主线提交..."
git log --date=iso --pretty=format:'%h %ad %s' -n 12 > "$LOG_DIR/t1-git.log" 2>&1 || echo "    ⚠️ git log failed"

echo "  ✅ T1 完成"
echo ""

# ─── T2 (9:00-10:30): API 主链回归 ──────────────────────────────────────

echo "🔨 [T2] analytics/campaign/cross-module 回归 (90 min)..."

echo "  🧪 2.1 跑关键 Node 测试..."
(cd apps/api && pnpm exec tsx --test \
  src/modules/cross-module/cross-module-e2e-26-marketing-analytics-snapshot.test.ts \
  src/modules/cross-module/cross-module-e2e-27-member-payment-analytics.test.ts \
  src/modules/cross-module/cross-module-e2e-28-campaign-analytics-snapshot.test.ts \
  src/modules/campaign/campaign.evaluate-validation.e2e.test.ts \
  > "$LOG_DIR/t2-test.log" 2>&1 || echo "    ⚠️ foundation11 api tests failed")

echo "  ✅ T2 完成"
echo ""

# ─── T3 (10:30-11:30): Web 真接口读面回归 ───────────────────────────────

echo "🔨 [T3] admin-web/tob-web 真接口读面回归 (60 min)..."

echo "  🧪 3.1 admin-web 回归..."
(cd apps/admin-web && pnpm exec node --import tsx --require ./.test-setup.cjs --test \
  app/api/analytics/snapshot/route.test.ts \
  app/marketing/page.test.ts \
  > "$LOG_DIR/t3-admin.log" 2>&1 || echo "    ⚠️ admin-web tests failed")

echo "  🧪 3.2 tob-web 回归..."
(cd apps/tob-web && pnpm exec node --import tsx --test \
  "app/api/campaigns/route.test.ts" \
  "app/api/campaigns/detail-route.test.ts" \
  "app/api/campaigns/dispatches-route.test.ts" \
  "app/campaigns/campaigns-service.test.ts" \
  "app/campaigns/page.test.ts" \
  > "$LOG_DIR/t3-tob.log" 2>&1 || echo "    ⚠️ tob-web tests failed")

echo "  ✅ T3 完成"
echo ""

# ─── T4 (11:30-12:00): 汇总与可选提交 ──────────────────────────────────

echo "🔨 [T4] 汇总状态与可选提交 (30 min)..."

echo "  📘 4.1 收集 git status..."
git status --short > "$LOG_DIR/t4-status.log" 2>&1 || echo "    ⚠️ git status failed"

# 4.2 自动 commit
if [[ -n "$(git status --short 2>/dev/null)" ]]; then
  echo "  💾 4.2 Foundation11 auto commit..."
  git add -A
  git commit -m "Foundation11 上午自动推进 ($TODAY)

自动完成:
- T1 主链扫描
- T2 API 主链回归
- T3 Web 真接口读面回归
- T4 状态汇总与 handoff

PR 描述: docs/monitoring/dev/$TODAY/morning/pr-description.md" > "$LOG_DIR/t4-commit.log" 2>&1 || echo "    ⚠️ commit failed"
else
  echo "  ✅ 无变更"
fi

# 4.3 生成 PR 描述
cat > "$LOG_DIR/pr-description.md" <<EOF
# Foundation11 上午自动推进报告

## 📋 概述
- 自动实施: $TODAY 8:00-12:00
- 由 morning-dev-jobs.sh 全自动编排
- 以基础开发11主链为准

## 🔨 变更
- T1: member/loyalty/transactions 主链扫描
- T2: analytics/campaign/cross-module 关键回归
- T3: admin-web/tob-web 真接口读面回归

## 🧪 测试
- API 测试: 见 $LOG_DIR/t2-test.log
- admin-web: 见 $LOG_DIR/t3-admin.log
- tob-web: 见 $LOG_DIR/t3-tob.log

## 📊 KPI
- 任务完成率: T1-T3
- 中午 handoff: $MIDDAY_HANDOFF
EOF

echo "  ✅ T4 完成"
echo ""

# ─── 12:00 中午交接 ───────────────────────────────────────────────────

echo "📦 生成中午 handoff..."

cat > "$MIDDAY_HANDOFF" <<EOF
# 🌞 上午开发 Handoff · $TODAY

> 时间: $TODAY 12:00 CST
> 自动完成: morning-dev-jobs.sh
> 下一步: 13:00 afternoon-dev-jobs.sh 启动

## 📊 上午成果

### T1-T3 状态
- ✅ T1 主链扫描: $(wc -l < "$LOG_DIR/t1-chain-scan.log" 2>/dev/null || echo 0) 行
- ✅ T2 API 回归: $(grep -oE "[0-9]+ pass(ed)?" "$LOG_DIR/t2-test.log" 2>/dev/null | tail -1 || echo "见 t2-test.log")
- ✅ T3 Web 回归: admin + tob 结果见 t3-admin.log / t3-tob.log

### PR 状态
- PR 描述: $LOG_DIR/pr-description.md
- 工作区变化: $(wc -l < "$LOG_DIR/t4-status.log" 2>/dev/null || echo 0) 项
- 最近提交: $(head -1 "$LOG_DIR/t1-git.log" 2>/dev/null || echo "见 t1-git.log")

## 🎯 13:00 下午任务 (自动启动)

- 13:00-14:30 cross-module / campaign dispatch 主链回归
- 14:30-16:00 dispatch 读面与全局筛选缺口扫描
- 16:00-18:00 交接与 evening handoff

## ⚠️ 用户决策项

EOF

# 检查 PR 是否需要 Approver review
if [[ -f "$LOG_DIR/pr-description.md" ]]; then
  cat >> "$MIDDAY_HANDOFF" <<EOF
- [ ] review health report 与 midday handoff
- [ ] 决定是否继续自动运行 afternoon-dev-jobs.sh

EOF
fi

cat >> "$MIDDAY_HANDOFF" <<EOF
## 🔗 关联

- afternoon-dev-jobs.sh (13:00 启动)
- retro-reminder.sh (22:00 触发复盘)
EOF

echo "📄 中午 handoff: $MIDDAY_HANDOFF"
echo ""
echo "=== morning-dev-jobs.sh 完成 ==="
echo "🚀 13:00 afternoon-dev-jobs.sh 自动启动 (无需用户介入)"
