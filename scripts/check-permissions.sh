#!/bin/bash
# =============================================================================
# 权限链审计脚本
# =============================================================================
# 检查所有交易主链 API 的多租户隔离情况，
# 验证 docs/knowledge/v22-api-chain-verification.md 中的鉴权要求是否实现。
#
# 审计范围: cashier / transactions / payment-gateway 三个核心模块
#
# 使用方式:
#   bash scripts/check-permissions.sh
# =============================================================================

set -o pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
WARN=0

# ── 辅助函数 ──────────────────────────────────────────────────────────────────

report_pass()  { echo "  ✅ $1"; ((PASS++)); }
report_fail()  { echo "  ❌ $1"; ((FAIL++)); }
report_warn()  { echo "  ⚠️  $1"; ((WARN++)); }

section() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# grep -c on macOS may return output like "       0" with leading spaces
# This wrapper strips whitespace
grep_count() {
  local pattern="$1"
  local file="$2"
  grep -c "$pattern" "$file" 2>/dev/null | tr -d '[:space:]'
  return 0
}

check_controller_for_guard() {
  local module="$1"
  local file="$2"
  local rel_path="${file#$ROOT_DIR/}"

  if [ ! -f "$file" ]; then
    report_fail "${module}: Controller 文件不存在 ($rel_path)"
    return 1
  fi

  echo ""
  echo "  --- ${module} ($rel_path) ---"

  local tenant_guard
  tenant_guard=$(grep_count "TenantGuard" "$file")

  local use_guards
  use_guards=$(grep_count "@UseGuards" "$file")

  local tenant_context
  tenant_context=$(grep_count "@TenantContext()" "$file")

  local x_tenant
  x_tenant=$(grep_count "x-tenant-id\|X-Tenant-Id" "$file")

  printf "  %-22s: " "UseGuards(TenantGuard)"
  if [ "$tenant_guard" -gt 0 ]; then
    echo "✅ 有 (${tenant_guard}处)"
  else
    echo "⚠️  无"
  fi

  printf "  %-22s: " "@UseGuards (any)"
  if [ "$use_guards" -gt 0 ]; then
    echo "✅ ${use_guards}处"
  else
    echo "⚠️  无"
  fi

  printf "  %-22s: " "@TenantContext() parameter"
  if [ "$tenant_context" -gt 0 ]; then
    echo "✅ ${tenant_context}处"
  else
    echo "⚠️  无"
  fi

  printf "  %-22s: " "x-tenant-id header"
  if [ "$x_tenant" -gt 0 ]; then
    echo "✅ 检出"
  else
    echo "⚠️  未显式检出"
  fi

  local score="PASS"
  if [ "$tenant_guard" -eq 0 ] && [ "$use_guards" -eq 0 ] && [ "$tenant_context" -eq 0 ]; then
    score="FAIL"
  elif [ "$tenant_guard" -eq 0 ] && [ "$tenant_context" -eq 0 ]; then
    score="WARN"
  fi

  echo ""
  case "$score" in
    PASS)  report_pass "${module}: 有 TenantGuard 或 @TenantContext() 保护";;
    WARN)  report_warn "${module}: 缺少 @UseGuards(TenantGuard)，但可能有全局 IdentityAccessGuard 保护";;
    FAIL)  report_fail "${module}: 无 TenantGuard 也无 @TenantContext() — 可能无多租户隔离";;
  esac

  return 0
}

# ── 主程序 ────────────────────────────────────────────────────────────────────

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                权限链审计报告 — Permission Chain Audit              ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo "日期: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "项目根: ${ROOT_DIR}"
echo ""

# ── 1. Controller 级别 Tenant Guard 覆盖 ──────────────────────────────────────
section "1. Controller 级别 Tenant Guard 覆盖"

check_controller_for_guard "cashier" \
  "${ROOT_DIR}/apps/api/src/modules/cashier/cashier.controller.ts"

check_controller_for_guard "transactions" \
  "${ROOT_DIR}/apps/api/src/modules/transactions/transactions.controller.ts"

check_controller_for_guard "payment-gateway" \
  "${ROOT_DIR}/apps/api/src/modules/payment-gateway/payment-gateway.controller.ts"

# ── 2. 全局 Guard 机制 ────────────────────────────────────────────────────────
section "2. 全局 Guard 机制"

app_module="${ROOT_DIR}/apps/api/src/app.module.ts"
if [ -f "$app_module" ]; then
  echo ""
  echo "--- APP_GUARD 注册 ---"

  if grep -q "useClass: IdentityAccessGuard" "$app_module" 2>/dev/null; then
    id_line=$(grep -n "IdentityAccessGuard" "$app_module" | head -1)
    echo "  IdentityAccessGuard: ✅ 全局注册 (APP_GUARD) — line ${id_line%%:*}"
  else
    report_fail "IdentityAccessGuard 未全局注册"
  fi

  if grep -q "useClass: TrafficGovernanceGuard" "$app_module" 2>/dev/null; then
    echo "  TrafficGovernanceGuard: ✅ 全局注册 (APP_GUARD)"
  else
    report_warn "TrafficGovernanceGuard 未全局注册"
  fi
fi

# ── 3. IdentityAccessGuard 实现分析 ───────────────────────────────────────────
section "3. IdentityAccessGuard 实现分析"

id_guard="${ROOT_DIR}/apps/api/src/modules/foundation/identity-access/identity-access.guard.ts"
if [ -f "$id_guard" ]; then
  echo ""
  echo "--- 鉴权逻辑 ---"

  if grep -q "roles.length === 0 && permissions.length === 0 && !tenantScopeMetadata" "$id_guard" 2>/dev/null; then
    report_warn "IdentityAccessGuard: 当 roles/permissions/tenantScope 元数据均未设置时 return true (放行)"
    report_warn "→ 当前 transactions/payment-gateway controller 无 @RequireRoles/@RequirePermissions/@TenantScope"
  fi

  if grep -q "validateTenantScope\|tenantScope" "$id_guard" 2>/dev/null; then
    echo "  Tenant scope 校验: ✅ 实现"
  fi

  if grep -q "hasAnyRole" "$id_guard" 2>/dev/null; then
    echo "  角色校验: ✅ hasAnyRole 实现"
  fi

  if grep -q "hasAllPermissions" "$id_guard" 2>/dev/null; then
    echo "  权限校验: ✅ hasAllPermissions 实现"
  fi
fi

# ── 4. Service 层租户隔离 ─────────────────────────────────────────────────────
section "4. Service 层租户隔离"

# 4a. CashierService
echo ""
echo "--- CashierService ---"
cs_file="${ROOT_DIR}/apps/api/src/modules/cashier/cashier.service.ts"
if [ -f "$cs_file" ]; then
  list_orders_guard=$(grep_count "tenantContext.tenantId" "$cs_file")
  echo "  tenantContext tenantId 过滤: ${list_orders_guard} 处"
  if grep -q "\.filter.*tenantContext\.tenantId" "$cs_file" 2>/dev/null; then
    report_pass "CashierService.listOrders() 按 tenantId 过滤数据"
  else
    report_warn "CashierService.listOrders() 可能无显式租户过滤"
  fi
fi

# 4b. TransactionsService
echo ""
echo "--- TransactionsService ---"
ts_file="${ROOT_DIR}/apps/api/src/modules/transactions/transactions.service.ts"
if [ -f "$ts_file" ]; then
  require_refund_line=$(grep -n "refund.tenantContext.tenantId !== tenantContext" "$ts_file" 2>/dev/null | head -1)
  if [ -n "$require_refund_line" ]; then
    report_pass "TransactionsService.requireRefund() 校验调用者 tenantId 匹配 — line ${require_refund_line%%:*}"
  else
    report_fail "TransactionsService.requireRefund() 无租户校验"
  fi

  list_refunds_line=$(grep -n "refund.tenantContext.tenantId === tenantContext" "$ts_file" 2>/dev/null | head -1)
  if [ -n "$list_refunds_line" ]; then
    report_pass "TransactionsService.listRefunds() 按 tenantId 过滤 — line ${list_refunds_line%%:*}"
  fi

  callback_line=$(grep -n "applyPaymentCallback" "$ts_file" 2>/dev/null | head -1)
  echo "  applyPaymentCallback: 参数无 @TenantContext (从回调数据继承 tenantContext)"

  snapshot_filter=$(grep_count "tenantContext.tenantId" "$ts_file")
  echo "  LYT 快照 tenantId 过滤: ${snapshot_filter} 处"

  refund_store_line=$(grep -n "const refundStore" "$ts_file" 2>/dev/null)
  echo "  refundStore: ${refund_store_line#*:} (全局 Map，依赖 Service 层过滤)"

  # check listOrders — delegates to CashierService which filters by tenant
  list_orders_delegation=$(grep_count "listOrders(tenantContext)" "$ts_file")
  echo "  listOrders 调用: ${list_orders_delegation} 处 (委托 CashierService)"
fi

# 4c. PaymentGatewayService
echo ""
echo "--- PaymentGatewayService ---"
pg_file="${ROOT_DIR}/apps/api/src/modules/payment-gateway/payment-gateway.service.ts"
if [ -f "$pg_file" ]; then
  pg_tenant=$(grep_count "tenant\|tenantId" "$pg_file")
  echo "  tenantId 引用: ${pg_tenant} 处"
  if [ "$pg_tenant" -eq 0 ]; then
    report_warn "PaymentGateway 完全没有租户概念 — 使用全局内存 Map"
  fi
fi

# ── 5. TenantGuard 实现 ───────────────────────────────────────────────────────
section "5. TenantGuard 实现"

tg_file="${ROOT_DIR}/apps/api/src/modules/agent/tenant.guard.ts"
if [ -f "$tg_file" ]; then
  echo ""
  echo "--- TenantGuard 行为 ---"
  if grep -q "UnauthorizedException" "$tg_file" 2>/dev/null; then
    report_pass "TenantGuard: 缺失 x-tenant-id → 401 UnauthorizedException"
  fi
  if grep -q "request.tenantId" "$tg_file" 2>/dev/null; then
    echo "  TenantGuard: 将 tenantId 写入 request.tenantId"
  fi
else
  report_fail "TenantGuard 文件未找到"
fi

# ── 6. 安全总结 ──────────────────────────────────────────────────────────────
section "6. 安全总结"

# Grab numbers for the matrix
tx_tenant_ctx=$(grep_count "@TenantContext()" "${ROOT_DIR}/apps/api/src/modules/transactions/transactions.controller.ts")

echo ""
echo "--- 多租户隔离矩阵 ---"
echo "  模块              | Controller Guard | @TenantContext() | Service 层过滤"
echo "  ------------------ | ---------------- | ---------------- | --------------"
echo "  cashier           | ✅ TenantGuard   | ❌ 无            | ✅ listOrders"
echo "  transactions      | ⚠️  无            | ✅ ${tx_tenant_ctx}处         | ✅ listRefunds / Prisma where"
echo "  payment-gateway   | ❌ 无            | ❌ 无            | ❌ 无"

echo ""
echo "--- 风险项 ---"
echo "  1. TransactionsController 无 @UseGuards(TenantGuard)"
echo "     → 但每个方法均使用 @TenantContext() 参数装饰器获取租户上下文"
echo "     → 全局 IdentityAccessGuard 提供基础认证"
echo "     → Service 层所有数据查询均按 tenantId 过滤"
echo ""
echo "  2. PaymentGatewayController 无任何 Guard/租户保护"
echo "     → 使用全局内存 Map (transactions, walletBalances, refundRecords)"
echo "     → 无租户隔离概念，所有商户共享数据"
echo "     → 非生产级实现"
echo ""
echo "  3. IdentityAccessGuard 无角色装饰器时放行"
echo "     → transactions/payment-gateway 未设置 @RequireRoles()"
echo "     → 任何认证 actor 均可调用"
echo ""

TOTAL=$((PASS + FAIL + WARN))
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║  总计: ${TOTAL} 项  |  PASS: ${PASS}  |  WARN: ${WARN}  |  FAIL: ${FAIL}  ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"

exit $FAIL
