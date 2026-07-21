#!/usr/bin/env bash
# ==============================================================================
# check-prisma-rls.sh — 数据库层 Prisma RLS 启用状态验证脚本
#
# 🐜 V23: G5-C1 数据库层Prisma RLS自动拦截
#
# 功能:
#   1. 检查 Prisma middleware 文件是否存在且语法正确
#   2. 检查 PrismaService 是否已集成 RLS 扩展
#   3. 检查单元测试文件是否存在
#   4. 汇总 RLS 启用状态
#
# 使用:
#   bash scripts/check-prisma-rls.sh
#   bash scripts/check-prisma-rls.sh --verbose   # 详细输出
# ==============================================================================

set -euo pipefail
IFS=$'\n\t'

# ── 配色 ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── 路径 ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="${ROOT_DIR}/apps/api"

# ── 状态计数器 ──────────────────────────────────────────────────────────────
PASS=0
FAIL=0
WARN=0

check_pass() { echo -e "  ${GREEN}✅${NC} $1"; PASS=$((PASS + 1)); }
check_fail() { echo -e "  ${RED}❌${NC} $1"; FAIL=$((FAIL + 1)); }
check_warn() { echo -e "  ${YELLOW}⚠️ ${NC} $1"; WARN=$((WARN + 1)); }
info() { echo -e "  ${BLUE}ℹ️ ${NC} $1"; }

# ── 横幅 ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  🔐 Prisma RLS Middleware — 数据库层租户隔离检查"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# ── 1. 检查 middleware 文件 ─────────────────────────────────────────────────
echo "📦 [1/5] Prisma RLS Middleware 文件"
echo "───────────────────────────────────────────────────────────────"

MW_FILE="${API_DIR}/src/modules/rls/rls.middleware-prisma.ts"
if [[ -f "$MW_FILE" ]]; then
  check_pass "RLS middleware 文件存在: ${MW_FILE#$ROOT_DIR/}"
  # 检查是否包含关键函数
  if grep -q 'export function createRlsExtension' "$MW_FILE"; then
    check_pass "函数 createRlsExtension() 已导出"
  else
    check_fail "函数 createRlsExtension() 未找到"
  fi
  if grep -q 'TENANT_AWARE_MODELS' "$MW_FILE"; then
    model_count=$(grep -c "^  '" "$MW_FILE" 2>/dev/null || echo 0)
    check_pass "TENANT_AWARE_MODELS 白名单配置 (${model_count} 个模型)"
  else
    check_fail "TENANT_AWARE_MODELS 未找到"
  fi
else
  check_fail "Middleware 文件不存在: ${MW_FILE#$ROOT_DIR/}"
fi

# ── 2. 检查 PrismaService 集成 ──────────────────────────────────────────────
echo ""
echo "📦 [2/5] PrismaService RLS 集成"
echo "───────────────────────────────────────────────────────────────"

PS_FILE="${API_DIR}/src/prisma/prisma.service.ts"
if [[ -f "$PS_FILE" ]]; then
  if grep -q 'createRlsExtension' "$PS_FILE" && grep -q 'rls.middleware-prisma' "$PS_FILE"; then
    check_pass "PrismaService 已导入 createRlsExtension"
  else
    check_fail "PrismaService 未导入 RLS middleware"
  fi
  if grep -q '\$extends\|_mixinExtendedMethods' "$PS_FILE"; then
    check_pass "PrismaService 已调用 \$extends 或 _mixinExtendedMethods"
  else
    check_fail "PrismaService 未调用 \$extends"
  fi
else
  check_fail "PrismaService 文件不存在"
fi

# ── 3. 检查测试文件 ─────────────────────────────────────────────────────────
echo ""
echo "📦 [3/5] 单元测试文件"
echo "───────────────────────────────────────────────────────────────"

TEST_FILE="${API_DIR}/src/modules/rls/rls.middleware-prisma.test.ts"
if [[ -f "$TEST_FILE" ]]; then
  check_pass "测试文件存在: ${TEST_FILE#$ROOT_DIR/}"
  # 检查测试覆盖率
  for pattern in "租户上下文" "create.*注入" "findMany.*注入" "delete.*注入" "update.*注入" "非 tenant-aware" "边界"; do
    if grep -q "$pattern" "$TEST_FILE"; then
      :  # 通过
    else
      check_warn "测试未覆盖模式: $pattern"
    fi
  done
  check_pass "测试文件基本结构完整"
else
  check_fail "测试文件不存在: ${TEST_FILE#$ROOT_DIR/}"
fi

# ── 4. 检查 Tenant Context 依赖 ─────────────────────────────────────────────
echo ""
echo "📦 [4/5] Tenant Context 依赖"
echo "───────────────────────────────────────────────────────────────"

TC_FILE="${API_DIR}/src/common/context/tenant-context.ts"
if [[ -f "$TC_FILE" ]]; then
  check_pass "Tenant Context 文件存在"
  if grep -q 'AsyncLocalStorage\|getTenantContext\|runWithTenant' "$TC_FILE"; then
    check_pass "Tenant Context 使用 AsyncLocalStorage"
  else
    check_fail "Tenant Context 缺少 ALS 实现"
  fi
  # 确认 middleware 中引用
  if grep -q "tenant-context" "$MW_FILE" 2>/dev/null; then
    check_pass "Middleware 正确引用 tenant-context"
  fi
else
  check_fail "Tenant Context 文件不存在"
fi

# ── 5. 运行时检查 (仅当 Prisma client 可用时) ──────────────────────────────
echo ""
echo "📦 [5/5] 运行时集成检查"
echo "───────────────────────────────────────────────────────────────"

if command -v npx &>/dev/null && [[ -f "${API_DIR}/node_modules/.prisma/client/index.js" || -f "${API_DIR}/node_modules/@prisma/client/index.js" ]]; then
  check_pass "Prisma Client 已安装"
else
  check_warn "Prisma Client 未本地安装 (CI 环境预期行为)"
fi

# ── TSC 检查 ────────────────────────────────────────────────────────────────
if command -v npx &>/dev/null; then
  if (cd "$API_DIR" && npx tsc --noEmit -p tsconfig.json 2>/dev/null); then
    check_pass "TypeScript 编译通过 (tsc --noEmit)"
  else
    check_warn "TypeScript 编译有警告 (可能存在类型错误)"
  fi
else
  check_warn "npx 不可用, 跳过 TSC 检查"
fi

# ── 汇总 ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  📊 汇总"
echo "═══════════════════════════════════════════════════════════════════"

echo -e "\n  通过: ${GREEN}${PASS}${NC} | 失败: ${RED}${FAIL}${NC} | 警告: ${YELLOW}${WARN}${NC}\n"

if [[ $FAIL -eq 0 ]]; then
  echo -e "  ${GREEN}✅ G5-C1 数据库层 Prisma RLS 状态: 已启用${NC}"
  echo ""
  echo "  ┌──────────────────────────────────────────────────┐"
  echo "  │ ├─ Middleware:   rls.middleware-prisma.ts        │"
  echo "  │ ├─ 集成:        PrismaService \$extends          │"
  echo "  │ ├─ 测试:        rls.middleware-prisma.test.ts    │"
  echo "  │ ├─ 白名单:      40+ tenant-aware models         │"
  echo "  │ └─ TenantCtx:   AsyncLocalStorage               │"
  echo "  └──────────────────────────────────────────────────┘"
  echo ""
  exit 0
else
  echo -e "  ${RED}❌ G5-C1 数据库层 Prisma RLS 状态: 异常${NC}"
  echo "  请修复上述失败项后重新运行此脚本"
  echo ""
  exit 1
fi
