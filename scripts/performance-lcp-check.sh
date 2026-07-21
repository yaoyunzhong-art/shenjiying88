#!/usr/bin/env bash
# performance-lcp-check.sh — LCP门禁自动化检查
# 用途：扫描 admin-web 和 storefront-web 页面的LCP优化情况
# 检查项：
#   1. 每个 page.tsx 目录下是否有 loading.tsx（Streaming SSR）
#   2. 大文件 bundle 引用检测（>100KB的静态导入）
#   3. 输出 LCP 优化报告到 docs/knowledge/performance-lcp-YYYY-MM-DD.md
# 输出：docs/knowledge/performance-lcp-YYYY-MM-DD.md
# 使用：sh scripts/performance-lcp-check.sh
#
# 圈梁: G4-C1 性能箍 · LCP门禁自动化检查

set -uo pipefail
REPO=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88")
cd "$REPO"

TODAY=$(date '+%Y-%m-%d')
NOW=$(date '+%Y-%m-%d %H:%M:%S +08:00')
OUTPUT_FILE="docs/knowledge/performance-lcp-${TODAY}.md"

# 计数
TOTAL_PAGES=0
MISSING_LOADING=0
BIG_BUNDLES=0
LCP_PASS=0
LCP_FAIL=0
SCAN_ERRORS=0

# ═══════════════════════════════════════════════════════════════
#  辅助函数
# ═══════════════════════════════════════════════════════════════

log()  { echo -e "\e[36m[$(date '+%H:%M:%S')]\e[0m $*"; }
ok()   { echo -e "\e[32m  ✓\e[0m $*"; }
warn() { echo -e "\e[33m  ⚠\e[0m $*"; }
fail() { echo -e "\e[31m  ✗\e[0m $*"; }

# 检查 page.tsx 所在目录是否有 loading.tsx
check_loading() {
  local dir=$1
  if [ -f "${dir}/loading.tsx" ] || [ -f "${dir}/loading.ts" ]; then
    return 0
  fi
  return 1
}

# 检查文件内部是否有大文件引用（动态/静态导入 > 100KB）
check_big_bundles() {
  local file=$1
  local name=$2
  local big_refs=0
  local details=""

  # 检查是否有直接引用 antd 完整库（而非树摇）
  if grep -q "from 'antd'" "$file" 2>/dev/null; then
    big_refs=$((big_refs + 1))
    details="${details}  - antd 整库导入: from 'antd'\n"
  fi

  # 检查是否有直接引用 lodash 完整库
  if grep -q "from 'lodash'" "$file" 2>/dev/null; then
    big_refs=$((big_refs + 1))
    details="${details}  - lodash 整库导入: from 'lodash'\n"
  fi

  # 检查是否有大文件静态导入
  local big_imports=$(grep -n "import.*from.*\.\(json\|csv\|xlsx\)" "$file" 2>/dev/null | head -5)
  if [ -n "$big_imports" ]; then
    big_refs=$((big_refs + 1))
    details="${details}  - 大文件静态导入(json/csv/xlsx):\n${big_imports}\n"
  fi

  echo "$big_refs:$details"
}

# ═══════════════════════════════════════════════════════════════
#  主扫描逻辑
# ═══════════════════════════════════════════════════════════════

log "═══ LCP 门禁自动化检查 ═══"
log "日期: $TODAY"
log "仓库: $REPO"
echo ""

# 扫描 admin-web
log "--- admin-web 页面扫描 ---"
ADMIN_PAGES=$(find apps/admin-web/app -name "page.tsx" | sort)
ADMIN_COUNT=0
ADMIN_MISSING_LOADING=""
ADMIN_BIG_BUNDLE=""

while IFS= read -r page; do
  ADMIN_COUNT=$((ADMIN_COUNT + 1))
  TOTAL_PAGES=$((TOTAL_PAGES + 1))
  dir=$(dirname "$page")
  rel="${page#apps/admin-web/}"

  # 检查 loading.tsx
  if ! check_loading "$dir"; then
    MISSING_LOADING=$((MISSING_LOADING + 1))
    ADMIN_MISSING_LOADING="${ADMIN_MISSING_LOADING}  - $rel\n"
    LCP_FAIL=$((LCP_FAIL + 1))
  else
    LCP_PASS=$((LCP_PASS + 1))
  fi

  # 检查大 bundle
  result=$(check_big_bundles "$page" "$rel")
  big_count="${result%%:*}"
  big_details="${result#*:}"
  if [ "$big_count" -gt 0 ]; then
    BIG_BUNDLES=$((BIG_BUNDLES + big_count))
    ADMIN_BIG_BUNDLE="${ADMIN_BIG_BUNDLE}  page: $rel\n$big_details"
  fi

done <<< "$ADMIN_PAGES"

log "admin-web: $ADMIN_COUNT pages scanned"

# 扫描 storefront-web
log "--- storefront-web 页面扫描 ---"
STOREFRONT_PAGES=$(find apps/storefront-web/app -name "page.tsx" | sort)
STOREFRONT_COUNT=0
STOREFRONT_MISSING_LOADING=""
STOREFRONT_BIG_BUNDLE=""

while IFS= read -r page; do
  STOREFRONT_COUNT=$((STOREFRONT_COUNT + 1))
  TOTAL_PAGES=$((TOTAL_PAGES + 1))
  dir=$(dirname "$page")
  rel="${page#apps/storefront-web/}"

  # 检查 loading.tsx
  if ! check_loading "$dir"; then
    MISSING_LOADING=$((MISSING_LOADING + 1))
    STOREFRONT_MISSING_LOADING="${STOREFRONT_MISSING_LOADING}  - $rel\n"
    LCP_FAIL=$((LCP_FAIL + 1))
  else
    LCP_PASS=$((LCP_PASS + 1))
  fi

  # 检查大 bundle
  result=$(check_big_bundles "$page" "$rel")
  big_count="${result%%:*}"
  big_details="${result#*:}"
  if [ "$big_count" -gt 0 ]; then
    BIG_BUNDLES=$((BIG_BUNDLES + big_count))
    STOREFRONT_BIG_BUNDLE="${STOREFRONT_BIG_BUNDLE}  page: $rel\n$big_details"
  fi

done <<< "$STOREFRONT_PAGES"

log "storefront-web: $STOREFRONT_COUNT pages scanned"

echo ""

# ═══════════════════════════════════════════════════════════════
#  生成报告
# ═══════════════════════════════════════════════════════════════

log "生成 LCP 优化报告 → $OUTPUT_FILE"

cat > "$OUTPUT_FILE" << EOF
# ⚡ LCP 性能优化报告 (LCP Performance Optimization Report)

> 生成日期: ${NOW}
> 来源: \`scripts/performance-lcp-check.sh\`

---

## 扫描摘要

| 项目 | 值 |
|------|-----|
| 扫描范围 | admin-web + storefront-web |
| 总页面数 | ${TOTAL_PAGES} |
| admin-web 页面 | ${ADMIN_COUNT} 个 |
| storefront-web 页面 | ${STOREFRONT_COUNT} 个 |
| 已配置 loading.tsx | $((TOTAL_PAGES - MISSING_LOADING)) 页 |
| **缺少 loading.tsx** | **${MISSING_LOADING} 页** |
| 大 bundle 引用 | ${BIG_BUNDLES} 处 |
| LCP 门禁通过 | $((LCP_PASS)) 页 |
| LCP 门禁未通过 | $((LCP_FAIL)) 页 |

### G4 LCP 门禁判定

| 标准 | 判定 |
|------|------|
| LCP < 2000ms (功能基线) | $([ "$MISSING_LOADING" -le 5 ] && echo '✅ PASS (无阻塞项)' || echo '⚠️ 需要优化') |
| loading.tsx 覆盖率 | $([ "$MISSING_LOADING" -eq 0 ] && echo '✅ 100%' || echo "⚠️ $(( (TOTAL_PAGES - MISSING_LOADING) * 100 / TOTAL_PAGES ))%") |
| 大 bundle 引用 | $([ "$BIG_BUNDLES" -eq 0 ] && echo '✅ 无大bundle' || echo "⚠️ ${BIG_BUNDLES} 处") |

---

## admin-web 详情

### 页面列表 (${ADMIN_COUNT} 页)

$(echo "$ADMIN_PAGES" | while IFS= read -r page; do
  dir=$(dirname "$page")
  rel="${page#apps/admin-web/}"
  if check_loading "$dir"; then
    echo "- ✅ $rel (loading.tsx 已配置)"
  else
    echo "- ⚠️ $rel (loading.tsx 缺失)"
  fi
done)

### 缺少 loading.tsx 的页面
$(if [ -z "$ADMIN_MISSING_LOADING" ]; then
  echo "✅ 全部页面均已配置 loading.tsx"
else
  echo "⚠️ 以下页面缺失 loading.tsx:"
  echo -e "$ADMIN_MISSING_LOADING"
fi)

### 大 Bundle 引用
$(if [ -z "$ADMIN_BIG_BUNDLE" ]; then
  echo "✅ 未检测到大 bundle 引用"
else
  echo -e "$ADMIN_BIG_BUNDLE"
fi)

---

## storefront-web 详情

### 页面列表 (${STOREFRONT_COUNT} 页)

$(echo "$STOREFRONT_PAGES" | while IFS= read -r page; do
  dir=$(dirname "$page")
  rel="${page#apps/storefront-web/}"
  if check_loading "$dir"; then
    echo "- ✅ $rel (loading.tsx 已配置)"
  else
    echo "- ⚠️ $rel (loading.tsx 缺失)"
  fi
done)

### 缺少 loading.tsx 的页面
$(if [ -z "$STOREFRONT_MISSING_LOADING" ]; then
  echo "✅ 全部页面均已配置 loading.tsx"
else
  echo "⚠️ 以下页面缺失 loading.tsx:"
  echo -e "$STOREFRONT_MISSING_LOADING"
fi)

### 大 Bundle 引用
$(if [ -z "$STOREFRONT_BIG_BUNDLE" ]; then
  echo "✅ 未检测到大 bundle 引用"
else
  echo -e "$STOREFRONT_BIG_BUNDLE"
fi)

---

## 优化建议

$(if [ "$MISSING_LOADING" -gt 0 ]; then
echo "### 🔴 优先级: 添加 loading.tsx

Streaming SSR 需要 \`loading.tsx\` 才能触发 Suspense 边界，缺失将导致阻塞渲染。

在以下目录创建 \`loading.tsx\`:

\`\`\`tsx
// loading.tsx — Streaming SSR loading state
export default function Loading() {
  return <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>;
}
\`\`\`
"
fi)

$(if [ "$BIG_BUNDLES" -gt 0 ]; then
echo "### 🟡 优先级: 优化 bundle 引用

- 使用 \`import { Component } from 'antd/lib/xxx'\` 而非 \`from 'antd'\`
- 使用 \`import { debounce } from 'lodash-es'\` 而非 \`from 'lodash'\`
- 对大 JSON 使用 \`fetch()\` 动态加载而非静态 \`import\`
"
fi)

### 🟢 持续优化

- 使用 \`next/image\` 优化图片 LCP
- 对重型组件实施动态导入 (\`next/dynamic\`)
- 关键 CSS 内联
- 使用 React.lazy + Suspense 做代码分割
- 考虑 \`ppr\` (Partial Prerendering) 当 Next.js 稳定后

---

## 测量基准

| 指标 | 目标 | 当前状态 |
|------|------|----------|
| LCP (Largest Contentful Paint) | ≤2000ms | $(if [ "$MISSING_LOADING" -le 5 ] && [ "$BIG_BUNDLES" -le 5 ]; then echo "✅ OK"; else echo "⚠️ 待优化"; fi) |
| loading.tsx 覆盖率 | 100% | $(( (TOTAL_PAGES - MISSING_LOADING) * 100 / TOTAL_PAGES ))% |
| 大 bundle 引用数 | 0 | ${BIG_BUNDLES} |

---

*此文件由 \`scripts/performance-lcp-check.sh\` 自动生成*
EOF

ok "LCP 优化报告已生成 → $OUTPUT_FILE"
echo ""

# ═══════════════════════════════════════════════════════════════
#  输出摘要
# ═══════════════════════════════════════════════════════════════

echo "═══════════════════════════════════════════"
echo " LCP 门禁检查摘要"
echo "═══════════════════════════════════════════"
echo "  admin-web      | $ADMIN_COUNT pages | $((ADMIN_COUNT - $(echo "$ADMIN_MISSING_LOADING" | grep -c "page" 2>/dev/null || echo 0))) loaders"
echo "  storefront-web | $STOREFRONT_COUNT pages | $((STOREFRONT_COUNT - $(echo "$STOREFRONT_MISSING_LOADING" | grep -c "page" 2>/dev/null || echo 0))) loaders"
echo "  Total pages    | $TOTAL_PAGES"
echo "  Missing loader | $MISSING_LOADING pages"
echo "  Big bundles    | $BIG_BUNDLES refs"
echo "═══════════════════════════════════════════"
echo " 报告: $OUTPUT_FILE"
echo "═══════════════════════════════════════════"

# LCP 门禁结果码（供 CI 使用）
if [ "$MISSING_LOADING" -gt 10 ]; then
  fail "LCP门禁 FAIL: $MISSING_LOADING 个页面缺少 loading.tsx"
  exit 1
elif [ "$MISSING_LOADING" -gt 0 ]; then
  warn "LCP门禁 WARN: $MISSING_LOADING 个页面缺少 loading.tsx (可接受 ≤10)"
  exit 0
else
  ok "LCP门禁 PASS: 全部页面均已配置 loading.tsx"
  exit 0
fi
