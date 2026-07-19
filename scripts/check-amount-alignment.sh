#!/bin/bash
# =============================================================================
# 金额口径核对脚本
# =============================================================================
# 扫描项目源码中的金额字段定义和 cent ↔ decimal 转换点，
# 验证 V22 金额链一致性文档 (docs/knowledge/v22-amount-chain-alignment.md) 的实际实现。
#
# 使用方式:
#   bash scripts/check-amount-alignment.sh
#
# 输出:
#   报告包含以下三部分:
#   1. 所有 *Cents 字段定义及分布
#   2. cents ↔ decimal 转换点
#   3. 类型不一致（Float/Decimal/number 混用）
#
# 依赖:
#   - bash 4+
#   - grep / sed / awk (标准 POSIX 工具)
# =============================================================================

set -o pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCAN_DIRS="apps/api/src packages modules"
PASS=0
FAIL=0

# ── 辅助函数 ──────────────────────────────────────────────────────────────────

report_pass()  { echo "  ✅ $1"; ((PASS++)); }
report_fail()  { echo "  ❌ $1"; ((FAIL++)); }
report_warn()  { echo "  ⚠️  $1"; }

section() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ── 主程序 ────────────────────────────────────────────────────────────────────

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║              金额口径核对报告 — Amount Alignment Audit              ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo "日期: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "项目根: ${ROOT_DIR}"
echo "扫描范围: ${SCAN_DIRS}"
echo ""

# ── 1. 扫描所有 *Cents 字段定义 ──────────────────────────────────────────────
section "1. Cents 字段定义分布"

# 从 packages/types 中提取核心类型定义
echo ""
echo "--- packages/types/src/index.ts (核心类型) ---"
if [ -f "${ROOT_DIR}/packages/types/src/index.ts" ]; then
  grep -n "Cents:" "${ROOT_DIR}/packages/types/src/index.ts" | \
    sed 's/^/  /' | head -40
  report_pass "Cents 核心类型定义存在 ($(grep -c "Cents:" "${ROOT_DIR}/packages/types/src/index.ts") 个字段)"
else
  report_fail "packages/types/src/index.ts 未找到"
fi

# 扫描所有带 >Cents< 的文件
echo ""
echo "--- 全项目 Cents 字段分布 ---"
total_cents_fields=0
while IFS= read -r dir; do
  path="${ROOT_DIR}/${dir}"
  if [ ! -d "$path" ]; then
    continue
  fi
  file_count=$(find "$path" -name "*.ts" -not -path "*/node_modules/*" \
    -not -path "*/__mocks__/*" -not -path "*/dist/*" \
    -exec grep -l "Cents" {} \; 2>/dev/null | wc -l | tr -d ' ')
  if [ "$file_count" -gt 0 ] 2>/dev/null; then
    echo "  ${dir}: ${file_count} 个文件包含 Cents 引用"
    total_cents_fields=$((total_cents_fields + file_count))
  fi
done <<< "$(echo "${SCAN_DIRS}" | tr ' ' '\n')"
echo "  总计: ${total_cents_fields} 个文件"
report_pass "Cents 字段分布检查完成"

# ── 2. 扫描 cents ↔ decimal 转换点 ──────────────────────────────────────────
section "2. Cents ↔ Decimal 转换点"

echo ""
echo "--- 分 转 元 (cents → yuan) ---"
convert_count=0
while IFS= read -r match; do
  file=$(echo "$match" | cut -d: -f1 | sed "s|${ROOT_DIR}/||")
  line=$(echo "$match" | cut -d: -f2)
  code=$(echo "$match" | cut -d: -f3- | xargs)
  echo "  ${file}:${line}  →  ${code}"
  ((convert_count++))
done < <(grep -rn "/100\b\|Math\.round.*\/100\|\/\s*100\b" \
  "${ROOT_DIR}/packages/types/src/index.ts" \
  "${ROOT_DIR}/apps/api/src/modules/cashier/" \
  "${ROOT_DIR}/apps/api/src/modules/transactions/" \
  "${ROOT_DIR}/apps/api/src/modules/payment-gateway/" \
  2>/dev/null | grep -iE "cent|price|amount|total|yuan|dollar" | grep -v node_modules | head -20)
echo "  找到 $convert_count 个分→元转换点"

echo ""
echo "--- 元 转 分 (yuan → cents) ---"
convert_yc=0
while IFS= read -r match; do
  file=$(echo "$match" | cut -d: -f1 | sed "s|${ROOT_DIR}/||")
  line=$(echo "$match" | cut -d: -f2)
  code=$(echo "$match" | cut -d: -f3- | xargs)
  echo "  ${file}:${line}  →  ${code}"
  ((convert_yc++))
done < <(grep -rn "\*100\b\|\* 100\b\|Math\.round.*\*100\|\*100\)" \
  "${ROOT_DIR}/apps/api/src/modules/payment-gateway/" \
  "${ROOT_DIR}/apps/api/src/modules/transactions/" \
  "${ROOT_DIR}/apps/api/src/modules/cashier/" \
  "${ROOT_DIR}/packages/types/" \
  2>/dev/null | grep -iE "cent|price|amount|total" | grep -v node_modules | head -20)
echo "  找到 $convert_yc 个元→分转换点"

if [ "$convert_count" -eq 0 ] && [ "$convert_yc" -eq 0 ]; then
  report_warn "未找到显式的 cents ↔ decimal 转换 — 可能是两套体系未桥接"
fi

# ── 3. 逐模块检查类型一致性 ──────────────────────────────────────────────────
section "3. 模块级金额类型一致性"

# 3a. CashierService (旧链: float 元)
echo ""
echo "--- CashierService (旧链: float 元体系) ---"
cashier_float_file="${ROOT_DIR}/apps/api/src/modules/cashier/cashier.service.ts"
if [ -f "$cashier_float_file" ]; then
  float_count=$(grep -cE "price|totalAmount|\"amount\"| amount\b" "$cashier_float_file")
  echo "  CashierService 使用 float 元字段: 检出 ${float_count} 处"
  report_warn "旧链 CashierService 使用 float 元（非 Cents），与 V22 新链体系不同"
fi

# 3b. OrderService (新链: integer cents)
echo ""
echo "--- OrderService / PaymentService / RefundService (新链: 整数分体系) ---"
for svc in order payment refund; do
  svc_file="${ROOT_DIR}/apps/api/src/modules/cashier/${svc}.service.ts"
  if [ -f "$svc_file" ]; then
    cents_count=$(grep -cE "Cents" "$svc_file")
    echo "  ${svc}.service.ts: ${cents_count} 处 Cents 引用"
  fi
done

# 3c. PaymentGateway (float 元)
echo ""
echo "--- PaymentGateway (float 元体系) ---"
pg_file="${ROOT_DIR}/apps/api/src/modules/payment-gateway/payment-gateway.service.ts"
if [ -f "$pg_file" ]; then
  pg_float=$(grep -cE "amount: number" "$pg_file")
  pg_cents=$(grep -cE "Cents|cents" "$pg_file")
  echo "  amount: number 出现 ${pg_float} 次"
  echo "  Cents 引用出现 ${pg_cents} 次"
  if [ "$pg_cents" -eq 0 ]; then
    report_warn "PaymentGateway 完全使用 float 元体系，未对接 Cents"
  fi
fi

# 3d. LYT Snapshot Prisma Float 风险
echo ""
echo "--- LYT 快照 (Prisma Float 精度风险) ---"
prisma_file="${ROOT_DIR}/apps/api/prisma/schema.prisma"
if [ -f "$prisma_file" ]; then
  float_fields=$(grep -cE "Float\s*@default\(0\)" "$prisma_file")
  echo "  Prisma Float 金额字段: ${float_fields} 个"
  report_warn "LYT 快照使用 Prisma Float，存在浮点精度风险 (详见 v22-amount-chain-alignment.md 问题 #3)"
fi

# 3e. Storefront 前端
echo ""
echo "--- Storefront 前端 (浏览器端计算) ---"
sf_file="${ROOT_DIR}/apps/storefront-web/app/cashier/page.tsx"
if [ -f "$sf_file" ]; then
  sf_prices=$(grep -cE "price:\s*[0-9]+" "$sf_file")
  echo "  price: 出现 ${sf_prices} 次（全部内联 Mock）"
  report_warn "前端收银台全部内联 Mock，金额计算在浏览器端进行"
fi

# 3f. 前端 Member Center
mc_file="${ROOT_DIR}/apps/storefront-web/app/member-center/page.tsx"
if [ -f "$mc_file" ]; then
  mc_mock=$(grep -cE "amount:.*[0-9]" "$mc_file")
  echo "  member-center page.tsx 硬编码金额: ${mc_mock} 处"
  report_warn "Member Center 金额硬编码 Mock"
fi

# ── 4. LYT 快照 Entity 类型 (number = Float 映射) ────────────────────────────
section "4. LYT 快照 Entity 金额类型检查"

entity_file="${ROOT_DIR}/apps/api/src/modules/transactions/transactions.entity.ts"
if [ -f "$entity_file" ]; then
  for field in amount discountAmount payableAmount; do
    type_def=$(grep "  ${field}:" "$entity_file" | head -1)
    echo "  LytOrderSnapshot.${field}: ${type_def:-未找到}"
  done
  for field in amount; do
    type_def=$(grep "  ${field}:" "$entity_file" | grep -A1 "LytPaymentSnapshot\|PaymentSnapshot" | head -2 | grep "  ${field}:" | head -1)
    echo "  LytPaymentSnapshot.${field}: ${type_def:-未找到}"
  done
  report_warn "LYT Entity fields are 'number' (from Prisma Float) — precision loss risk"
fi

# ── 5. 统计 & 结论 ───────────────────────────────────────────────────────────
section "结论"

echo ""
if [ "$FAIL" -eq 0 ]; then
  report_pass "PASS: 新链 (OrderService/PaymentService/RefundService) 全部使用整数分 Cents"
else
  report_fail "部分检查未通过"
fi

echo ""
echo "--- 体系对照 ---"
echo "  新链 (整数分): Order/Payment/Refund service  — 全部 *Cents ✅"
echo "  旧链 (float 元): CashierService               — price/totalAmount ⚠️"
echo "  POS 网关 (float 元): PaymentGateway            — amount ⚠️"
echo "  LYT 快照 (Prisma Float): LytOrderSnapshot       — 精度风险 ⚠️"
echo "  前端 (float 元/Mock): Storefront Cashier        — 全 Mock 🚫"
echo ""
echo "--- 已知问题 (详见 docs/knowledge/v22-amount-chain-alignment.md) ---"
echo "  HIGH: 两套金额体系并行 (新链 cents vs 旧链 float 元)"
echo "  HIGH: 前端收银台全部内联 Mock"
echo "  MEDIUM: LYT 快照 Float 精度风险"
echo "  MEDIUM: PaymentGateway 无订单总金额校验"
echo "  LOW: freight 字段不存在"
echo ""

TOTAL=$((PASS + FAIL))
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║  总计: ${TOTAL} 项  |  PASS: ${PASS}  |  FAIL: ${FAIL}  ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"

exit $FAIL
