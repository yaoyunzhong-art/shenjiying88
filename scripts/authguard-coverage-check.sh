#!/usr/bin/env bash
# ============================================================================
# AuthGuard Coverage Check Script
# 安全基线 #1：AuthGuard @UseGuards 装饰器覆盖率 >= 80%
#
# Usage:
#   ./scripts/authguard-coverage-check.sh
#
# Scanning Scope:
#   - src/modules/**/*.controller.ts     (主业务模块)
#   - src/**/*.controller.ts             (其他控制器, 不含 node_modules, 不含 apps/api)
#   - apps/api/src/**/*.controller.ts    (微端业务模块)
#
# Exit Code:
#   0  — 覆盖率 >= 80% (PASS)
#   1  — 覆盖率 < 80%  (FAIL)
#
# Output:
#   总数 / 已覆盖 / 未覆盖 / 覆盖率百分比
#   未覆盖控制器列表
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Color helpers ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Step 1: Find all controller files ──────────────────────────────────────
echo -e "${CYAN}${BOLD}🔍 AuthGuard Coverage Scan${NC}"
echo "========================================"
echo ""

# Collect controllers: all .controller.ts files in src/ and apps/api/src/, excluding node_modules
CONTROLLERS=$(find "$BACKEND_DIR/apps/api/src" \
  -name "*.controller.ts" \
  ! -path "*/node_modules/*" \
  | sort)

TOTAL=$(echo "$CONTROLLERS" | wc -l | tr -d ' ')

# ── Step 2: Check @UseGuards coverage ─────────────────────────────────────
COVERED_LIST=""
UNCOVERED_LIST=""

while IFS= read -r ctrl; do
  if grep -q '@UseGuards' "$ctrl" 2>/dev/null; then
    COVERED_LIST="$COVERED_LIST$ctrl"$'\n'
  else
    # Relative path for prettier output
    rel="${ctrl#$BACKEND_DIR/}"
    UNCOVERED_LIST="$UNCOVERED_LIST$rel"$'\n'
  fi
done <<< "$CONTROLLERS"

COVERED=$(echo "$COVERED_LIST" | grep -c . || true)
UNCOVERED=$(echo "$UNCOVERED_LIST" | grep -c . || true)

# ── Step 3: Calculate percentage ──────────────────────────────────────────
if [ "$TOTAL" -eq 0 ]; then
  echo -e "${RED}❌ No controller files found!${NC}"
  exit 1
fi

COVERAGE_PCT=$(echo "scale=2; $COVERED * 100 / $TOTAL" | bc)

# ── Step 4: Output results ────────────────────────────────────────────────
echo -e "${BOLD}📊 Coverage Summary${NC}"
echo "----------------------------------------"
printf "${BOLD}%s${NC}\n" "Total controllers:   $TOTAL"
printf "${GREEN}%s${NC}\n" "Covered (with @UseGuards): $COVERED"
printf "${RED}%s${NC}\n" "Uncovered:              $UNCOVERED"
echo ""
printf "${BOLD}Coverage rate:${NC}  "

# Color-coded percentage
if (( $(echo "$COVERAGE_PCT >= 80" | bc -l) )); then
  echo -e "${GREEN}${BOLD}${COVERAGE_PCT}%${NC}"
elif (( $(echo "$COVERAGE_PCT >= 60" | bc -l) )); then
  echo -e "${YELLOW}${BOLD}${COVERAGE_PCT}%${NC}"
else
  echo -e "${RED}${BOLD}${COVERAGE_PCT}%${NC}"
fi

echo ""
echo -e "${BOLD}Threshold:${NC} >= 80%"

# ── Step 5: List uncovered controllers ────────────────────────────────────
if [ "$UNCOVERED" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}${BOLD}⚠️  Uncovered Controllers (missing @UseGuards):${NC}"
  echo "----------------------------------------"
  while IFS= read -r ctrl; do
    [ -z "$ctrl" ] && continue
    echo -e "  ${RED}✗${NC} $ctrl"
  done <<< "$UNCOVERED_LIST"
  echo ""
  echo -e "${YELLOW}💡 Tip: Add @UseGuards(JwtAuthGuard) to each controller above,"
  echo -e "   or @Public() if the endpoint is intentionally unauthenticated.${NC}"
fi

# ── Step 6: Result line (for CI parsing) ──────────────────────────────────
echo "========================================"
echo -e "${CYAN}${BOLD}RESULT:${NC} ${COVERED}/${TOTAL} = ${COVERAGE_PCT}%"

if (( $(echo "$COVERAGE_PCT >= 80" | bc -l) )); then
  echo -e "${GREEN}${BOLD}✅ PASS: AuthGuard coverage meets threshold (>=80%)${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}❌ FAIL: AuthGuard coverage below threshold (>=80%)${NC}"
  exit 1
fi
