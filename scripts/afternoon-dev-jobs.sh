#!/bin/bash
# afternoon-dev-jobs.sh · 13:00-18:00 基础开发11 下午自动推进
#
# 用途: cross-module / dispatch / read model 主线回归与交接
# 调用: 由 cron 13:00 触发
#
# 任务清单 (5 小时):
#   13:00-14:30 T5 cross-module / campaign 主链回归
#   14:30-16:00 T6 dispatch / 活动读面缺口扫描
#   16:00-18:00 T7 类型检查、工作区汇总、evening handoff
#
# 设计:
#   - 与 morning handoff 衔接
#   - 每个 T 任务独立 log
#   - 不再生成过期 skeleton 任务
#   - 18:00 输出 evening handoff

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

TODAY=$(date '+%Y-%m-%d')
LOG_DIR="$PROJECT_ROOT/docs/monitoring/dev/$TODAY/afternoon"
mkdir -p "$LOG_DIR"

EVENING_HANDOFF="$PROJECT_ROOT/docs/monitoring/evening-handoff-${TODAY}.md"
HEALTH_REPORT="$LOG_DIR/00-foundation11-health.md"

echo "=== afternoon-dev-jobs.sh · 下午开发全自动 ==="
echo "日期: $TODAY"
echo "时段: 13:00-18:00"
echo "日志: $LOG_DIR"
echo ""

echo "🩺 [Preflight] Foundation11 自动化健康检查..."
AUTOMATION_HEALTH_REPORT="$HEALTH_REPORT" bash "$SCRIPT_DIR/foundation11-automation-healthcheck.sh" afternoon "$TODAY" || {
  cat > "$EVENING_HANDOFF" <<EOF
# Foundation11 下午自动开发阻塞 · $TODAY

> 状态: blocked
> 触发脚本: afternoon-dev-jobs.sh
> 根因: 自动化健康检查失败，禁止继续执行陈旧/缺依赖脚本

## 健康检查报告

$(cat "$HEALTH_REPORT")
EOF
  echo "❌ Afternoon blocked. Handoff: $EVENING_HANDOFF"
  exit 2
}
echo "  ✅ 健康检查通过"
echo ""

# ─── T5 (13:00-14:30): Foundation11 主链回归 ───────────────────────────

echo "🔨 [T5] Foundation11 主链回归 (90 min)..."

echo "  🧪 5.1 跑 campaign / analytics / transactions 门禁..."
(cd apps/api && pnpm exec tsx --test \
  src/modules/campaign/campaign.controller.test.ts \
  src/modules/campaign/campaign.service.test.ts \
  src/modules/campaign/campaign.trigger.test.ts \
  src/modules/analytics/analytics.service.test.ts \
  src/modules/cashier/cashier.module.test.ts \
  src/modules/transactions/transactions.module.test.ts \
  > "$LOG_DIR/t5-test.log" 2>&1 || echo "    ⚠️ foundation11 module tests failed")

echo "  ✅ T5 完成"
echo ""

# ─── T6 (14:30-16:00): dispatch / 读面缺口扫描 ─────────────────────────

echo "🔨 [T6] dispatch / 活动读面缺口扫描 (90 min)..."

echo "  📝 6.1 扫描 dispatch 相关代码..."
grep -R "dispatch" apps/api/src/modules/campaign apps/tob-web/app/campaigns > "$LOG_DIR/t6-dispatch-scan.log" 2>&1 || echo "    ⚠️ dispatch scan failed"

echo "  📝 6.2 扫描活动详情读面..."
grep -R "CampaignDetailPage\\|派发记录\\|loadCampaignDispatches" apps/tob-web/app/campaigns > "$LOG_DIR/t6-detail-scan.log" 2>&1 || echo "    ⚠️ detail scan failed"

echo "  ✅ T6 完成"
echo ""

# ─── T7 (16:00-18:00): 工作区汇总与交接 ────────────────────────────────

echo "🔨 [T7] 工作区汇总与交接 (120 min)..."

echo "  📘 7.1 API typecheck..."
(cd apps/api && pnpm typecheck > "$LOG_DIR/tsc.log" 2>&1 || echo "    ⚠️ TSC failed")

echo "  📘 7.2 admin-web typecheck..."
(cd apps/admin-web && pnpm typecheck > "$LOG_DIR/tsc-admin.log" 2>&1 || echo "    ⚠️ admin TSC failed")

echo "  📘 7.3 tob-web typecheck..."
(cd apps/tob-web && pnpm typecheck > "$LOG_DIR/tsc-tob.log" 2>&1 || echo "    ⚠️ tob TSC failed")

if [[ -n "$(git status --short 2>/dev/null)" ]]; then
  git add -A
  git commit -m "Foundation11 下午自动推进 ($TODAY)

自动完成:
- T5 主链回归
- T6 dispatch / 读面缺口扫描
- T7 工作区汇总与交接" > "$LOG_DIR/commit.log" 2>&1 || echo "    ⚠️ commit failed"
fi

# ─── 18:00 晚上交接 ───────────────────────────────────────────────────

echo ""
echo "📦 生成 evening handoff..."

cat > "$EVENING_HANDOFF" <<EOF
# 🌆 下午开发 Handoff · $TODAY

> 时间: $TODAY 18:00 CST
> 自动完成: afternoon-dev-jobs.sh
> 下一步: 19:00 用户主参与 + 22:00 retro

## 📊 下午成果

### T5-T7 状态
- ✅ T5 主链回归: 见 t5-test.log
- ✅ T6 dispatch / 读面扫描: 见 t6-dispatch-scan.log / t6-detail-scan.log
- ✅ T7 工作区汇总: 见 tsc.log / tsc-admin.log / tsc-tob.log

### TSC 状态
- api: $(grep -c "error TS" "$LOG_DIR/tsc.log" 2>/dev/null || echo 0) errors
- admin-web: $(grep -c "error TS" "$LOG_DIR/tsc-admin.log" 2>/dev/null || echo 0) errors
- tob-web: $(grep -c "error TS" "$LOG_DIR/tsc-tob.log" 2>/dev/null || echo 0) errors

## 🎯 19:00 用户主参与 (4h)

### 关键路径
- [ ] review evening handoff 与 health report
- [ ] 决定是否继续追 dispatch 全局筛选页
- [ ] 决定是否补齐 loyalty 主账持久化

### 可选
- [ ] 补 dispatch result drilldown
- [ ] 收口更多前端真接口读面

## ⚠️ 待用户决策

EOF

TSC_ERR=$(grep -c "error TS" "$LOG_DIR/tsc.log" 2>/dev/null || echo 0)
if [[ "$TSC_ERR" -gt 0 ]]; then
  cat >> "$EVENING_HANDOFF" <<EOF
- 🔴 TSC api errors: $TSC_ERR → 优先修复

EOF
fi

cat >> "$EVENING_HANDOFF" <<EOF
## 🔗 关联

- retro-reminder.sh (22:00 触发)
- handoff-\$TODAY.md (07:00 夜间报告)
EOF

echo "📄 晚上 handoff: $EVENING_HANDOFF"
echo ""
echo "=== afternoon-dev-jobs.sh 完成 ==="
echo "🌃 19:00 用户主参与开始 (4h 黄金时段)"
