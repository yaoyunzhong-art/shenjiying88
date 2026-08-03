#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PASS_COUNT=0
FAIL_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "[PASS] $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo "[FAIL] $1"
}

check_file() {
  local relative_path="$1"
  if [[ -f "$ROOT_DIR/$relative_path" ]]; then
    pass "文件存在: $relative_path"
  else
    fail "文件缺失: $relative_path"
  fi
}

check_text() {
  local relative_path="$1"
  local needle="$2"
  if [[ ! -f "$ROOT_DIR/$relative_path" ]]; then
    fail "文件缺失，无法检查文本: $relative_path"
    return
  fi

  if grep -Fq "$needle" "$ROOT_DIR/$relative_path"; then
    pass "文本命中: $relative_path -> $needle"
  else
    fail "文本缺失: $relative_path -> $needle"
  fi
}

echo "==> 恢复文件一键核对开始"
echo "root=$ROOT_DIR"

echo
echo "==> G6 文件存在性"
check_file "apps/miniapp/src/app.config.ts"
check_file "apps/miniapp/src/pages/index/index.tsx"
check_file "apps/miniapp/src/pages/member/index.tsx"
check_file "apps/miniapp/src/page-navigation.test.ts"
check_file "docs/knowledge/acceptance/2026-07-19-g6-miniapp-linkage-acceptance.md"
check_file "docs/knowledge/acceptance/2026-07-19-g6-miniapp-browser-evidence.html"
check_file "scripts/g6-browser-capture.ts"
check_file "docs/knowledge/acceptance/assets/g6-miniapp-browser-index.png"
check_file "docs/knowledge/acceptance/assets/g6-miniapp-browser-member.png"
check_file "docs/knowledge/acceptance/assets/g6-miniapp-browser-roles.png"

echo
echo "==> G6 关键文本"
check_text "apps/miniapp/src/app.config.ts" "pages/redeem-center/index"
check_text "apps/miniapp/src/pages/index/index.tsx" "G6 联动入口"
check_text "apps/miniapp/src/pages/member/index.tsx" "会员权益联动"
check_text "apps/miniapp/src/page-navigation.test.ts" "pages/customer-service/index"
check_text "docs/knowledge/acceptance/2026-07-19-g6-miniapp-linkage-acceptance.md" "g6-miniapp-browser-index.png"
check_text "scripts/g6-browser-capture.ts" "g6-miniapp-browser-roles.png"

echo
echo "==> G7 文件存在性"
check_file "apps/miniapp/src/supplychain-runtime.ts"
check_file "apps/miniapp/src/supplychain-runtime.test.ts"
check_file "apps/miniapp/src/pages/purchase-orders/detail/index.tsx"
check_file "apps/miniapp/src/pages/purchase-orders/detail/page.test.ts"
check_file "apps/miniapp/src/pages/return-orders/detail/index.tsx"
check_file "apps/miniapp/src/pages/return-orders/detail/page.test.ts"
check_file "apps/api/src/modules/inventory/inventory-purchase.service.ts"
check_file "apps/api/src/modules/inventory/inventory-purchase.controller.ts"
check_file "apps/api/src/modules/inventory/inventory-purchase.service.spec.ts"
check_file "docs/knowledge/acceptance/2026-07-19-g7-miniapp-supplychain-acceptance.md"
check_file "docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-acceptance.md"
check_file "docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html"
check_file "scripts/g7-browser-capture.ts"
check_file "docs/knowledge/acceptance/assets/g7-miniapp-browser-entry.png"
check_file "docs/knowledge/acceptance/assets/g7-miniapp-browser-purchase.png"
check_file "docs/knowledge/acceptance/assets/g7-miniapp-browser-return.png"

echo
echo "==> G7 关键文本"
check_text "apps/miniapp/src/supplychain-runtime.ts" "executeMiniappPurchaseOrderAction"
check_text "apps/miniapp/src/supplychain-runtime.ts" "deleteMiniappPurchaseOrder"
check_text "apps/miniapp/src/supplychain-runtime.ts" "resolveMiniappReturnActionExecution"
check_text "apps/miniapp/src/supplychain-runtime.ts" "refunded"
check_text "apps/miniapp/src/supplychain-runtime.ts" "exchanged"
check_text "apps/miniapp/src/supplychain-runtime.ts" "closed"
check_text "apps/api/src/modules/inventory/inventory-purchase.service.ts" "inspectReturn("
check_text "apps/api/src/modules/inventory/inventory-purchase.service.ts" "rejectReturn("
check_text "apps/api/src/modules/inventory/inventory-purchase.service.ts" "refundReturn("
check_text "apps/api/src/modules/inventory/inventory-purchase.service.ts" "exchangeReturn("
check_text "apps/api/src/modules/inventory/inventory-purchase.service.ts" "closeReturn("
check_text "apps/api/src/modules/inventory/inventory-purchase.controller.ts" "returns/:returnId/inspect"
check_text "apps/api/src/modules/inventory/inventory-purchase.controller.ts" "returns/:returnId/reject"
check_text "apps/api/src/modules/inventory/inventory-purchase.controller.ts" "returns/:returnId/refund"
check_text "apps/api/src/modules/inventory/inventory-purchase.controller.ts" "returns/:returnId/exchange"
check_text "apps/api/src/modules/inventory/inventory-purchase.controller.ts" "returns/:returnId/close"
check_text "docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-acceptance.md" "g7-miniapp-browser-entry.png"
check_text "scripts/g7-browser-capture.ts" "g7-miniapp-browser-return.png"

echo
echo "==> G8 文件存在性"
check_file "scripts/lib-m5-kubeconfig.sh"
check_file "scripts/preflight-prod-public-cutover.sh"
check_file "scripts/apply-prod-public-cutover.sh"
check_file "scripts/verify-prod-public-endpoints.sh"
check_file "scripts/preflight-prod-formal-window.sh"
check_file "scripts/run-prod-cutover-window.sh"
check_file "scripts/prepare-prod-cutover-bundle.sh"
check_file "docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md"
check_file "PROD-INGRESS-CUTOVER-20260718.md"

echo
echo "==> G8 关键文本"
check_text "scripts/run-prod-cutover-window.sh" "00-formal-ready.log"
check_text "scripts/run-prod-cutover-window.sh" "01-preflight.log"
check_text "scripts/run-prod-cutover-window.sh" "02-server-dry-run.log"
check_text "scripts/run-prod-cutover-window.sh" "03-apply.log"
check_text "scripts/run-prod-cutover-window.sh" "04-verify.log"
check_text "scripts/run-prod-cutover-window.sh" "05-rollback.log"
check_text "scripts/run-prod-cutover-window.sh" "summary_file="
check_text "scripts/preflight-prod-formal-window.sh" "formal window readiness start"
check_text "scripts/preflight-prod-formal-window.sh" "DNS has no A record"
check_text "scripts/preflight-prod-formal-window.sh" "live tls secret verify"
check_text "scripts/preflight-prod-formal-window.sh" "TLS manifest does not exist"
check_text "scripts/prepare-prod-cutover-bundle.sh" "CUTOVER-LOG-PLAN.md"
check_text "docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md" "DNS + TLS"

echo
echo "==> 总表与状态板"
check_file "TASKS_STATUS.md"
check_file "WEEKLY-RYG-STATUS-BOARD.md"
check_file "V7.2-RESIGN-CHECKLIST.md"
check_file "DEVELOP-PLAN-v7.md"
check_file "EXTERNAL-BLOCKERS-OWNER-BOARD.md"
check_file "docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md"
check_file "docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md"

check_text "TASKS_STATUS.md" '`G6`: 🟢'
check_text "TASKS_STATUS.md" '`G7`: 🟢'
check_text "TASKS_STATUS.md" "DNS + TLS"
check_text "WEEKLY-RYG-STATUS-BOARD.md" "| G6 | 🟢 |"
check_text "WEEKLY-RYG-STATUS-BOARD.md" "| G7 | 🟢 |"
check_text "WEEKLY-RYG-STATUS-BOARD.md" "| G8 | 🟡 |"
check_text "V7.2-RESIGN-CHECKLIST.md" "| G6 | 🟢 |"
check_text "V7.2-RESIGN-CHECKLIST.md" "| G7 | 🟢 |"
check_text "V7.2-RESIGN-CHECKLIST.md" "DNS 无 A 记录 + m5-tls 缺失"
check_text "V7.2-RESIGN-CHECKLIST.md" "不得正式发起"
check_text "DEVELOP-PLAN-v7.md" "| G8 | 🟡 |"
check_text "EXTERNAL-BLOCKERS-OWNER-BOARD.md" "DNS + TLS"
check_text "docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md" "preflight-prod-formal-window.sh"
check_text "docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md" "| G6 | 🟢 |"
check_text "docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md" "| G7 | 🟢 |"

echo
echo "==> 核对完成"
echo "pass=$PASS_COUNT"
echo "fail=$FAIL_COUNT"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi
