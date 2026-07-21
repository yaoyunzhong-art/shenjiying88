#!/usr/bin/env bash
# create-loading.sh — Create loading.tsx for core pages (Streaming SSR Suspense边界)
# 圈梁: G4-C1 性能箍 · LCP门禁 — 前100页loading.tsx补齐

set -euo pipefail
REPO="/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88"
cd "$REPO"

LOADING_CONTENT='// loading.tsx — Streaming SSR Suspense 边界
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse space-y-4 w-full max-w-4xl">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
'

ADMIN_BASE="apps/admin-web/app"
STOREFRONT_BASE="apps/storefront-web/app"

created_count=0

create_loading_if_page_exists() {
  local dir="$1"
  local page="$dir/page.tsx"
  local loading="$dir/loading.tsx"
  if [ -f "$page" ] && [ ! -f "$loading" ]; then
    echo "$LOADING_CONTENT" > "$loading"
    echo "  ✅ Created: $loading"
    created_count=$((created_count + 1))
  elif [ -f "$loading" ]; then
    echo "  ⏭️  Already exists: $loading"
  else
    echo "  ⚠️  No page.tsx in: $dir"
  fi
}

echo "═══════════════════════════════════════════"
echo " creating loading.tsx for core pages"
echo "═══════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════
# admin-web 核心页面
# ═══════════════════════════════════════════════

echo "--- admin-web: dashboard ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/dashboard"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/admin/dashboard"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/admin/settings"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/admin/tenants"

echo ""
echo "--- admin-web: members (员工/会员) ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/staff"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/staff/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/[id]/edit"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/[id]/receipts/[executionId]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/[id]/sources/[kind]/[sourceId]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/[id]/tasks/[taskId]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/cards"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/cards/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/create"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/form"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/import"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/levels"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/levels/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/tiers"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/tiers/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/tiers/new"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/members/reports"

echo ""
echo "--- admin-web: stores ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/analytics"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/audit"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/capability-access"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/cashier"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/devices"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/events"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/finance"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/health-score"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/inspection"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/inventory"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/logistics"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/marketing"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/members"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/operations"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/orders"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/promotions"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/purchasing"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/reconciliation"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/reports"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/reservations"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/scheduling"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/security"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/service"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/settings"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/shift-handover"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/staff"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/tenant"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/[id]/training"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/form"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/new"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/stores/reports"

echo ""
echo "--- admin-web: finance ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/dashboard"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/budget"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/invoices"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/payouts"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/profit-loss"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/reconciliation"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/reconciliation/discrepancies/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/reconciliation/rules"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/finance/rules"

echo ""
echo "--- admin-web: reports ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/promotions-adjustments"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/revenue"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/sales-comparison"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/sales-summary"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/settlement-reconciliation"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/store-summary"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/tax-report"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/user-activity"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/user-portrait"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/reports/venue-ranking"

echo ""
echo "--- admin-web: marketing + campaigns ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/marketing"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/marketing/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/marketing/[id]/performance"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/campaigns"

echo ""
echo "--- admin-web: brands ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/brands"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/brands/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/brands/new"

echo ""
echo "--- admin-web: coupons ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/coupons"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/coupons/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/coupons/form"

echo ""
echo "--- admin-web: inventory + procurement + contracts ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/inventory"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/inventory/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/inventory/rules"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/procurement"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/contracts"

echo ""
echo "--- admin-web: orders + settlement ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/orders"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/orders/[id]"

echo ""
echo "--- admin-web: rules ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/rules"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/rules/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/rules/executions"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/rules/executions/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/rules/ai-decisions/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/campaign-rules"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/campaign-rules/[id]"

echo ""
echo "--- admin-web: safety + settings ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/safety"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/custom-fields"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/membership-levels"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/notification-templates"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/notifications"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/payment-config"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/permissions"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/promotion-rules"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/security"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/system-config"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/tax-rates"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/venue-config"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/settings/workflow"

echo ""
echo "--- admin-web: notices ---"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/notifications"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/notifications/[id]"
create_loading_if_page_exists "$REPO/$ADMIN_BASE/notifications/new"

# ═══════════════════════════════════════════════
# storefront-web 核心页面
# ═══════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════"
echo " storefront-web 核心页面"
echo "═══════════════════════════════════════════"

echo ""
echo "--- storefront-web: home + dashboard ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/dashboard"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/dashboard/inventory"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/dashboard/team"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/page"  # root home page

echo ""
echo "--- storefront-web: cashier ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/cashier"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/frontdesk"

echo ""
echo "--- storefront-web: members ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/members"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/members/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/members/growth"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/members/loyalty"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/members/new"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/members/payment"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/members/tier-distribution"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-center"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-card"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-login"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-register"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-recharge"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-recharge/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-churn"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/member-upgrade-path"

echo ""
echo "--- storefront-web: products ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/products"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/products/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/products/[id]/edit"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/products/new"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/products/setmeal"

echo ""
echo "--- storefront-web: finance ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/finance"

echo ""
echo "--- storefront-web: reports ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/reports"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/reports/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/reports/[id]/edit"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/reports/new"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/analytics"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/insights"

echo ""
echo "--- storefront-web: campaigns ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/campaigns"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/campaigns/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/campaigns/[id]/edit"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/campaigns/new"

echo ""
echo "--- storefront-web: coupons ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/coupons"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/coupons/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/coupons/new"

echo ""
echo "--- storefront-web: promotions ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/promotions"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/promotions/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/promotions/[id]/edit"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/promotions/new"

echo ""
echo "--- storefront-web: checkout ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/checkout"

echo ""
echo "--- storefront-web: orders ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/orders"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/orders/[id]"

echo ""
echo "--- storefront-web: payments + refunds ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/refunds"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/refunds/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/refunds/new"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/returns"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/returns/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/return-orders"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/return-orders/[id]"

echo ""
echo "--- storefront-web: reservations + bookings ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/appointments"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/booking"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/group-booking"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/device-reservation"

echo ""
echo "--- storefront-web: team-building ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/team-building/[id]"

echo ""
echo "--- storefront-web: venue-booking ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/scheduling"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/scheduling/[id]"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/events"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/events/[id]"

echo ""
echo "--- storefront-web: settings ---"
create_loading_if_page_exists "$REPO/$STOREFRONT_BASE/settings"

echo ""
echo "═══ Result ═══"
echo "Created $created_count loading.tsx files"
echo "═════════════"
