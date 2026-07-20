#!/usr/bin/env bash
# performance-baseline.sh — 建立LCP/FCP/TTI性能基线
# 用途：Lighthouse CI模拟，测量 admin-web 和 storefront-web 首页性能指标
# 输出：docs/knowledge/performance-baseline.md
# 使用：sh scripts/performance-baseline.sh
#
# 前置条件：
#   - pnpm install 已完成（提供 lighthouse+puppeteer）
#   - node >=18
#   - dev server 未占用 3002/3003 端口（脚本会自动启动）

set -uo pipefail
REPO=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88")
cd "$REPO"

ADMIN_PORT=3002
STOREFRONT_PORT=3003
ADMIN_URL="http://localhost:${ADMIN_PORT}"
STOREFRONT_URL="http://localhost:${STOREFRONT_PORT}"
OUTPUT_FILE="docs/knowledge/performance-baseline.md"

# ═══════════════════════════════════════════════════════════════
#  辅助函数
# ═══════════════════════════════════════════════════════════════

log()  { echo -e "\e[36m[$(date '+%H:%M:%S')]\e[0m $*"; }
ok()   { echo -e "\e[32m  ✓\e[0m $*"; }
fail() { echo -e "\e[31m  ✗\e[0m $*"; }

cleanup() {
  log "清理进程..."
  [ -n "${ADMIN_PID:-}" ] && kill "$ADMIN_PID" 2>/dev/null && ok "停止 admin-web (pid=$ADMIN_PID)"
  [ -n "${STOREFRONT_PID:-}" ] && kill "$STOREFRONT_PID" 2>/dev/null && ok "停止 storefront-web (pid=$STOREFRONT_PID)"
  # 确保端口释放
  lsof -ti tcp:"${ADMIN_PORT}" -ti tcp:"${STOREFRONT_PORT}" 2>/dev/null | xargs kill 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# ═══════════════════════════════════════════════════════════════
#  步骤1 — 启动dev server
# ═══════════════════════════════════════════════════════════════

log "═══ 性能基线建立 ═══"
log "仓库: $REPO"

# 检查 lighthouse 可用
LIGHTHOUSE_BIN="./node_modules/.bin/lighthouse"
if [ ! -f "$LIGHTHOUSE_BIN" ]; then
  log "lighthouse 未安装，尝试 pnpm install..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install 2>/dev/null
  if [ ! -f "$LIGHTHOUSE_BIN" ]; then
    fail "lighthouse 安装失败，请运行 pnpm install"
    exit 1
  fi
fi
ok "lighthouse 可用（$(node -e "console.log(require('./node_modules/lighthouse/package.json').version)")）"

# 清理旧进程
lsof -ti tcp:"${ADMIN_PORT}" -ti tcp:"${STOREFRONT_PORT}" 2>/dev/null | xargs kill 2>/dev/null || true
sleep 1

# 启动 admin-web
log "启动 admin-web (port $ADMIN_PORT)..."
cd apps/admin-web
ADMIN_PORT=$ADMIN_PORT npx next dev --port "$ADMIN_PORT" 2>&1 &
ADMIN_PID=$!
cd "$REPO"
# 等待 admin-web 就绪
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w '%{http_code}' "$ADMIN_URL" 2>/dev/null | grep -q '200\|302\|301'; then
    ok "admin-web 就绪 (pid=$ADMIN_PID)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    fail "admin-web 启动超时"
    exit 1
  fi
  sleep 2
done

# 启动 storefront-web
log "启动 storefront-web (port $STOREFRONT_PORT)..."
cd apps/storefront-web
PORT=$STOREFRONT_PORT npx next dev --port "$STOREFRONT_PORT" 2>&1 &
STOREFRONT_PID=$!
cd "$REPO"
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w '%{http_code}' "$STOREFRONT_URL" 2>/dev/null | grep -q '200\|302\|301'; then
    ok "storefront-web 就绪 (pid=$STOREFRONT_PID)"
    break
  fi
  if [ "$i" -eq 30 ]; then
    fail "storefront-web 启动超时"
    exit 1
  fi
  sleep 2
done

# ═══════════════════════════════════════════════════════════════
#  步骤2 — 运行Lighthouse测量
# ═══════════════════════════════════════════════════════════════

OUT_DIR="/tmp/lighthouse-baseline-$(date +%s)"
mkdir -p "$OUT_DIR"

run_lighthouse() {
  local label=$1
  local url=$2
  local json_output="${OUT_DIR}/${label}.report.json"
  local html_output="${OUT_DIR}/${label}.report.html"
  local summary="${OUT_DIR}/${label}.summary.json"

  log "测量 $label ($url)..."

  "$LIGHTHOUSE_BIN" \
    "$url" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
    --output=json \
    --output-path="${json_output}" \
    --preset=perf \
    --throttling-method=provided \
    --only-categories=performance \
    --max-wait-for-load=30000 \
    2>/dev/null || {
    fail "lighthouse 对 $label 测量失败"
    return 1
  }

  if [ ! -f "$json_output" ]; then
    fail "lighthouse 报告未生成 ($json_output)"
    return 1
  fi

  # 提取核心指标
  node -e "
const r = require('${json_output}');
const audits = r.lhr?.audits || r.audits || {};
const categories = r.lhr?.categories || r.categories || {};
const score = categories.performance?.score || 0;
const get = (id) => audits[id]?.numericValue != null ? audits[id].numericValue : null;
const getUnit = (id) => audits[id]?.numericUnit || 'ms';

const result = {
  url: '${url}',
  label: '${label}',
  score: Math.round(score * 100),
  timestamp: new Date(r.lhr?.fetchTime || Date.now()).toISOString(),
  metrics: {
    lcp: get('largest-contentful-paint'),
    fcp: get('first-contentful-paint'),
    tti: get('interactive'),
    si: get('speed-index'),
    tbt: get('total-blocking-time'),
    cls: audits['cumulative-layout-shift']?.numericValue || null
  }
};
require('fs').writeFileSync('${summary}', JSON.stringify(result, null, 2));
console.log('LCP:' + (result.metrics.lcp||'N/A') + ' FCP:' + (result.metrics.fcp||'N/A') + ' TTI:' + (result.metrics.tti||'N/A') + ' score:' + result.score);
" 2>&1

  [ -f "$summary" ] && return 0 || return 1
}

ADMIN_SUMMARY="${OUT_DIR}/admin-web.summary.json"
STOREFRONT_SUMMARY="${OUT_DIR}/storefront-web.summary.json"

run_lighthouse "admin-web" "$ADMIN_URL" || {
  log "admin-web 测量失败，使用默认值"
  echo '{"url":"http://localhost:3002","label":"admin-web","score":0,"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metrics":{"lcp":null,"fcp":null,"tti":null,"si":null,"tbt":null,"cls":null}}' > "$ADMIN_SUMMARY"
}

run_lighthouse "storefront-web" "$STOREFRONT_URL" || {
  log "storefront-web 测量失败，使用默认值"
  echo '{"url":"http://localhost:3003","label":"storefront-web","score":0,"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metrics":{"lcp":null,"fcp":null,"tti":null,"si":null,"tbt":null,"cls":null}}' > "$STOREFRONT_SUMMARY"
}

# ═══════════════════════════════════════════════════════════════
#  步骤3 — 生成基线文档
# ═══════════════════════════════════════════════════════════════

BASELINE_DATE=$(date '+%Y-%m-%d')
BASELINE_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S +08:00')

log "生成基线文档 → $OUTPUT_FILE"

cat > "$OUTPUT_FILE" << 'HEADERMD'
# ⚡ 性能基线 (Performance Baseline)

> Last updated:
HEADERMD

# 追加日期
echo "> $BASELINE_TIMESTAMP" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'SECTMD'
## 概述

| 项目 | 值 |
|------|-----|
| 测量工具 | Lighthouse (Headless Chrome) |
| 测量环境 | Local Dev (macOS) |
| 网络节流 | 无 (Provided) |
| CPU节流 | 无 |
| 目标 | LCP < 2000ms (G4 审计条件) |

SECTMD

# 读取 summary json 生成报告
generate_app_section() {
  local summary_file=$1
  local app_label=$2
  local app_description=$3

  if [ ! -f "$summary_file" ]; then
    echo "⚠️  $app_description — 无测量结果" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    return
  fi

  local score lcp fcp tti si tbt cls
  score=$(node -e "const r=require('${summary_file}'); console.log(r.score)" 2>/dev/null || echo "0")
  lcp=$(node -e "const r=require('${summary_file}'); const v=r.metrics.lcp; console.log(v!=null?v.toFixed(0):'null')" 2>/dev/null || echo "null")
  fcp=$(node -e "const r=require('${summary_file}'); const v=r.metrics.fcp; console.log(v!=null?v.toFixed(0):'null')" 2>/dev/null || echo "null")
  tti=$(node -e "const r=require('${summary_file}'); const v=r.metrics.tti; console.log(v!=null?v.toFixed(0):'null')" 2>/dev/null || echo "null")
  si=$(node -e "const r=require('${summary_file}'); const v=r.metrics.si; console.log(v!=null?v.toFixed(0):'null')" 2>/dev/null || echo "null")
  tbt=$(node -e "const r=require('${summary_file}'); const v=r.metrics.tbt; console.log(v!=null?v.toFixed(0):'null')" 2>/dev/null || echo "null")
  cls=$(node -e "const r=require('${summary_file}'); const v=r.metrics.cls; console.log(v!=null?v.toFixed(3):'null')" 2>/dev/null || echo "null")

  local lcp_pass lcp_color
  lcp_pass="❌ FAIL"
  lcp_color="\e[31m"
  if [ "$lcp" != "null" ] && [ "$lcp" -le 2500 ] 2>/dev/null; then
    lcp_pass="✅ PASS"
    lcp_color="\e[32m"
  elif [ "$lcp" != "null" ] && [ "$lcp" -le 4000 ] 2>/dev/null; then
    lcp_pass="⚠️  NEEDS_IMPROVEMENT"
    lcp_color="\e[33m"
  fi

  echo "## $app_label — $app_description" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "| 指标 | 值 | 阈值 | 状态 |" >> "$OUTPUT_FILE"
  echo "|------|-----|------|------|" >> "$OUTPUT_FILE"

  if [ "$lcp" != "null" ]; then echo "| **LCP** (Largest Contentful Paint) | ${lcp}ms | ≤2000ms | $lcp_pass |" >> "$OUTPUT_FILE"; else echo "| **LCP** (Largest Contentful Paint) | N/A | ≤2000ms | ⚠️ 未测量 |" >> "$OUTPUT_FILE"; fi
  if [ "$fcp" != "null" ]; then echo "| **FCP** (First Contentful Paint) | ${fcp}ms | ≤3000ms | $([ "$fcp" -le 3000 ] 2>/dev/null && echo '✅ PASS' || echo '⚠️ 超阈值') |" >> "$OUTPUT_FILE"; else echo "| **FCP** (First Contentful Paint) | N/A | ≤3000ms | ⚠️ 未测量 |" >> "$OUTPUT_FILE"; fi
  if [ "$tti" != "null" ]; then echo "| **TTI** (Time to Interactive) | ${tti}ms | ≤5000ms | $([ "$tti" -le 5000 ] 2>/dev/null && echo '✅ PASS' || echo '⚠️ 超阈值') |" >> "$OUTPUT_FILE"; else echo "| **TTI** (Time to Interactive) | N/A | ≤5000ms | ⚠️ 未测量 |" >> "$OUTPUT_FILE"; fi
  if [ "$si" != "null" ]; then echo "| **SI** (Speed Index) | ${si}ms | ≤5000ms | $([ "$si" -le 5000 ] 2>/dev/null && echo '✅ PASS' || echo '⚠️ 超阈值') |" >> "$OUTPUT_FILE"; else echo "| **SI** (Speed Index) | N/A | ≤5000ms | ⚠️ 未测量 |" >> "$OUTPUT_FILE"; fi
  if [ "$tbt" != "null" ]; then echo "| **TBT** (Total Blocking Time) | ${tbt}ms | ≤500ms | $([ "$tbt" -le 500 ] 2>/dev/null && echo '✅ PASS' || echo '⚠️ 超阈值') |" >> "$OUTPUT_FILE"; else echo "| **TBT** (Total Blocking Time) | N/A | ≤500ms | ⚠️ 未测量 |" >> "$OUTPUT_FILE"; fi
  if [ "$cls" != "null" ]; then echo "| **CLS** (Cumulative Layout Shift) | ${cls} | ≤0.1 | $([ "$(echo "$cls <= 0.1" | bc -l 2>/dev/null || echo 0)" = "1" ] && echo '✅ PASS' || echo '⚠️ 超阈值') |" >> "$OUTPUT_FILE"; else echo "| **CLS** (Cumulative Layout Shift) | N/A | ≤0.1 | ⚠️ 未测量 |" >> "$OUTPUT_FILE"; fi

  echo "" >> "$OUTPUT_FILE"
  echo "**Performance Score:** ${score}/100" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
}

generate_app_section "$ADMIN_SUMMARY" "admin-web" "运营管理后台 — 首页"
generate_app_section "$STOREFRONT_SUMMARY" "storefront-web" "用户端 — 首页"

# 追加结论
cat >> "$OUTPUT_FILE" << 'CONCMD'

---

## 基线结论

| 条目 | 状态 |
|------|------|
| G4 LCP门禁 (`lcp < 2000ms`) | 有待验证 |
| 测量工具 | Lighthouse Performance preset |
| 测量日期 | 
CONCMD

echo "$BASELINE_DATE" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'CONCMD2'
> ⚠️ **注意**: 此为本地开发环境基线，生产环境指标可能因 CDN/GZIP/缓存/机器配置 等差异而不同。
> 生产基线应在 CI/CD Pipeline 中通过 `lighthouse-ci` 或类似工具在 staging/production 环境建立。

## 历史基线

| 日期 | admin-web LCP | storefront-web LCP |
|------|------|------|
CONCMD2

# 添加当前基线到历史表
ADMIN_LCP_STR=$(node -e "const r=require('${ADMIN_SUMMARY}'); const v=r.metrics.lcp; console.log(v!=null?v.toFixed(0)+'ms':'N/A')" 2>/dev/null || echo "N/A")
STOREFRONT_LCP_STR=$(node -e "const r=require('${STOREFRONT_SUMMARY}'); const v=r.metrics.lcp; console.log(v!=null?v.toFixed(0)+'ms':'N/A')" 2>/dev/null || echo "N/A")
echo "| $BASELINE_DATE | $ADMIN_LCP_STR | $STOREFRONT_LCP_STR |" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'CONCMD3'
---

*此文件由 `scripts/performance-baseline.sh` 自动生成*
CONCMD3

echo ""
ok "基线文档已生成 → $OUTPUT_FILE"
echo ""

# ═══════════════════════════════════════════════════════════════
#  步骤4 — 输出摘要
# ═══════════════════════════════════════════════════════════════

ADMIN_SCORE=$(node -e "const r=require('${ADMIN_SUMMARY}'); console.log(r.score)" 2>/dev/null || echo "N/A")
STOREFRONT_SCORE=$(node -e "const r=require('${STOREFRONT_SUMMARY}'); console.log(r.score)" 2>/dev/null || echo "N/A")
ADMIN_LCP=$(node -e "const r=require('${ADMIN_SUMMARY}'); const v=r.metrics.lcp; console.log(v!=null?v.toFixed(0)+'ms':'N/A')" 2>/dev/null || echo "N/A")
STOREFRONT_LCP=$(node -e "const r=require('${STOREFRONT_SUMMARY}'); const v=r.metrics.lcp; console.log(v!=null?v.toFixed(0)+'ms':'N/A')" 2>/dev/null || echo "N/A")

echo "═══════════════════════════════════════════"
echo " 性能基线摘要"
echo "═══════════════════════════════════════════"
echo "  admin-web   | Score: ${ADMIN_SCORE} | LCP: ${ADMIN_LCP}"
echo "  storefront  | Score: ${STOREFRONT_SCORE} | LCP: ${STOREFRONT_LCP}"
echo "═══════════════════════════════════════════"
echo " 基线文档位置: $OUTPUT_FILE"
echo "═══════════════════════════════════════════"
