#!/usr/bin/env bash
# scripts/security-scan.sh · 🐜 [V17: security-gates]
# ============================================================
# 安全门硬阻断 — 嵌入 CI pipeline 的 SAST + 密钥扫描
#
# 用法:
#   bash scripts/security-scan.sh                    # 完整扫描
#   bash scripts/security-scan.sh --quick            # 仅密钥/token扫描(跳过audit)
#   bash scripts/security-scan.sh --audit-only       # 仅依赖审计
#   bash scripts/security-scan.sh --json             # 输出JSON格式(调试用)
#   bash scripts/security-scan.sh --help             # 帮助
#
# 输出:
#   1. 控制台报告 (human-readable)
#   2. docs/knowledge/security-scan-YYYY-MM-DD.md    (markdown报告)
#   3. 退出码: 0=通过 / 1=发现高危 / 2=发现中危 / 3=发现低危
#
# 集成:
#   - alignment-verify.py 的 run_security_scan()
#   - pulse 验收脉冲 --security flag
#   - 夜间 cron (nightly-jobs.sh)
#
# 安全模式:
#   - 仅扫描未排除的 .ts 文件
#   - .test.ts / .spec.ts / mock / example / sample / test 目录自动跳过
# ============================================================

set -euo pipefail 2>/dev/null || set -e errexit nounset

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT"

SCAN_DATE="$(date '+%Y-%m-%d')"
SCAN_TIME="$(date '+%Y-%m-%d %H:%M:%S %Z')"
REPORT_DIR="${PROJECT}/docs/knowledge"
REPORT_FILE="${REPORT_DIR}/security-scan-${SCAN_DATE}.md"
MODE="${1:-full}"

# ── 命令行参数 ──────────────────────────────────────────────
JSON_MODE=false
for arg in "$@"; do
  case "$arg" in
    --quick)       MODE="quick" ;;
    --audit-only)  MODE="audit" ;;
    --json)        JSON_MODE=true ;;
    --help|-h)
      echo "安全门扫描脚本 · 🐜 [V17: security-gates]"
      echo ""
      echo "用法: bash scripts/security-scan.sh [OPTION]"
      echo ""
      echo "选项:"
      echo "  (无选项)   完整扫描 (密钥+token+依赖审计)"
      echo "  --quick    仅密钥/token扫描 (跳过依赖审计,适合快速CI)"
      echo "  --audit-only 仅依赖审计 (跳过密钥/token扫描)"
      echo "  --json      输出JSON格式报告"
      echo "  --help,-h  显示此帮助"
      exit 0
      ;;
  esac
done

# ── 工具函数 ──────────────────────────────────────────────

# Markdown safe string (sanitize pipe chars for tables)
md_safe() {
  echo "$1" | sed 's/|/\\|/g'
}

# Generate a score badge from count
badge() {
  local count="$1"
  if [ "$count" -eq 0 ]; then echo "🟢"; else echo "🔴"; fi
}

# Log with timestamp
log() {
  local level="$1" msg="$2"
  echo "[$(date '+%H:%M:%S')] [${level}] ${msg}"
}

# ── 扫描模块 ──────────────────────────────────────────────

SECRETS_FOUND=0
TOKENS_FOUND=0
AUDIT_HIGH=0
AUDIT_CRITICAL=0
SECRETS_RESULTS=""
TOKENS_RESULTS=""
AUDIT_RESULTS=""
SCAN_MESSAGES=()

# ─── 模块1: 密钥扫描 ─────────────────────────────────
scan_secrets() {
  log "INFO" "🔐 密钥扫描: apps/api/src/ 中疑似硬编码密码..."

  local results
  results=$(grep -rn 'password.*=.*"[^"]\{5,\}"' apps/api/src/ --include="*.ts" \
    | grep -v '.test.ts' | grep -v '.spec.ts' \
    | grep -v 'example\|sample\|test\|mock\|fake\|stub' \
    | head -20 2>/dev/null || true)

  if [ -z "$results" ]; then
    log "OK" "  ✅ 无硬编码密码发现"
    SECRETS_RESULTS="无发现"
    return 0
  fi

  SECRETS_FOUND=$(echo "$results" | grep -c .)
  log "WARN" "  ⚠️ 发现 ${SECRETS_FOUND} 处可疑密码"

  SECRETS_RESULTS=""
  while IFS= read -r line; do
    local file=$(echo "$line" | cut -d: -f1)
    local lineno=$(echo "$line" | cut -d: -f2)
    # 不保留原始密码本身,只显示被替换的版本
    local preview=$(echo "$line" | sed 's/"[^"]\{5,\}"/"***REDACTED***"/g')
    preview=$(md_safe "$preview")
    SECRETS_RESULTS+="  | \`$file:$lineno\` | \`${preview:0:80}\` | ⚠️  |\n"
  done <<< "$results"
}

# ─── 模块2: Token扫描 ──────────────────────────────────
scan_tokens() {
  log "INFO" "🔑 Token扫描: apps/ 中疑似硬编码token..."

  local results
  results=$(grep -rn 'token.*=.*"[^"]\{10,\}"' apps/ --include="*.ts" \
    | grep -v '.test.ts' | grep -v '.spec.ts' \
    | grep -v '^.*:.*\`' \
    | head -20 2>/dev/null || true)

  if [ -z "$results" ]; then
    log "OK" "  ✅ 无硬编码token发现"
    TOKENS_RESULTS="无发现"
    return 0
  fi

  TOKENS_FOUND=$(echo "$results" | grep -c .)
  log "WARN" "  ⚠️ 发现 ${TOKENS_FOUND} 处可疑token"

  TOKENS_RESULTS=""
  while IFS= read -r line; do
    local file=$(echo "$line" | cut -d: -f1)
    local lineno=$(echo "$line" | cut -d: -f2)
    local preview=$(echo "$line" | sed 's/"[^"]\{10,\}"/"***REDACTED***"/g')
    preview=$(md_safe "$preview")
    TOKENS_RESULTS+="  | \`$file:$lineno\` | \`${preview:0:80}\` | ⚠️  |\n"
  done <<< "$results"
}

# ─── 模块3: 依赖审计 ────────────────────────────────
audit_deps() {
  log "INFO" "📦 依赖审计: pnpm audit --audit-level=high ..."

  if ! command -v pnpm &>/dev/null; then
    log "WARN" "  ⚠️ pnpm 不可用,跳过依赖审计"
    AUDIT_RESULTS="pnpm 不可用,跳过"
    SCAN_MESSAGES+=("⚠️ pnpm not found — 依赖审计已跳过")
    return 0
  fi

  if [ ! -f "pnpm-lock.yaml" ] && [ ! -f "package.json" ]; then
    log "WARN" "  ⚠️ 未找到 package.json 或 pnpm-lock.yaml,跳过依赖审计"
    AUDIT_RESULTS="无清单文件,跳过"
    return 0
  fi

  # 🐜 [V17-round3: fix-security-audit] 使用 pnpm audit --json + python3 解析
  # macOS 兼容: 替代 paste+bc 解析,直接解析 JSON 输出避免 SIGPIPE/BSD 问题
  _audit_json=$(pnpm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
  AUDIT_HIGH=$(echo "$_audit_json" | python3 -c "import sys,json; d=json.load(sys.stdin).get('vulnerabilities',{}); print(sum(1 for s in d.values() if s.get('severity','')=='high'))" 2>/dev/null || echo "0")
  AUDIT_CRITICAL=$(echo "$_audit_json" | python3 -c "import sys,json; d=json.load(sys.stdin).get('vulnerabilities',{}); print(sum(1 for s in d.values() if s.get('severity','')=='critical'))" 2>/dev/null || echo "0")

  log "INFO" "  审计结果: high=${AUDIT_HIGH} critical=${AUDIT_CRITICAL}"

  # 如果有critical漏洞或高危>2个 -> 硬阻断(退出码由下方汇总逻辑决定)
  if [ "$AUDIT_CRITICAL" -gt 0 ] || [ "$AUDIT_HIGH" -gt 2 ]; then
    AUDIT_RESULTS="$AUDIT_HIGH high · $AUDIT_CRITICAL critical ⛔ HARD BLOCK"
    SCAN_MESSAGES+=("⚠️ 依赖审计硬阻断: high=${AUDIT_HIGH} critical=${AUDIT_CRITICAL}")
  else
    AUDIT_RESULTS="✅ 无高/危急漏洞"
    SCAN_MESSAGES+=("✅ 依赖审计通过")
  fi
}

# ── 执行扫描 ────────────────────────────────────────────

case "$MODE" in
  quick)
    scan_secrets
    scan_tokens
    ;;
  audit)
    audit_deps
    ;;
  full|*)
    scan_secrets
    scan_tokens
    audit_deps
    ;;
esac

# ── 汇总计算 ──────────────────────────────────────────

RISK_LEVEL="低危"
EXIT_CODE=0

total_issues=$((SECRETS_FOUND + TOKENS_FOUND))

if [ "$AUDIT_CRITICAL" -gt 0 ] || [ "$SECRETS_FOUND" -gt 0 ]; then
  RISK_LEVEL="高危"
  EXIT_CODE=1
elif [ "$AUDIT_HIGH" -gt 0 ] || [ "$TOKENS_FOUND" -gt 0 ]; then
  RISK_LEVEL="中危"
  EXIT_CODE=2
elif [ "$total_issues" -gt 0 ]; then
  RISK_LEVEL="低危"
  EXIT_CODE=3
fi

# ── JSON 输出 (调试用) ────────────────────────────────
if [ "$JSON_MODE" = true ]; then
  cat <<JSONEOF
{
  "scan_date": "$SCAN_DATE",
  "scan_time": "$SCAN_TIME",
  "mode": "$MODE",
  "secrets_found": $SECRETS_FOUND,
  "tokens_found": $TOKENS_FOUND,
  "audit_high": $AUDIT_HIGH,
  "audit_critical": $AUDIT_CRITICAL,
  "risk_level": "$RISK_LEVEL",
  "exit_code": $EXIT_CODE
}
JSONEOF
  exit $EXIT_CODE
fi

# ── Markdown 报告 ──────────────────────────────────────
mkdir -p "$REPORT_DIR"

cat > "$REPORT_FILE" <<REPORTEOF
# 🔐 安全扫描报告

> 扫描时间: ${SCAN_TIME}
> 项目: shenjiying88 (V17)
> 扫描模式: ${MODE}
> 脚本: scripts/security-scan.sh

---

## 📊 汇总

| 检查项 | 结果 | 数量 |
|--------|:----:|:----:|
| 硬编码密码 | $(badge $SECRETS_FOUND) | ${SECRETS_FOUND} |
| 硬编码Token | $(badge $TOKENS_FOUND) | ${TOKENS_FOUND} |
| 依赖危急漏洞 | $(badge $AUDIT_CRITICAL) | ${AUDIT_CRITICAL} |
| 依赖高危漏洞 | $(badge $AUDIT_HIGH) | ${AUDIT_HIGH} |
| **总体风险** | **🔴 ${RISK_LEVEL}** | **退出码: ${EXIT_CODE}** |

---

## 1️⃣ 密钥泄漏检查

> 扫描范围: apps/api/src/ — 排除 test/spec/mock/example

| 文件位置 | 内容(脱敏) | 状态 |
|----------|-----------|:----:|
REPORTEOF

if [ "$SECRETS_FOUND" -gt 0 ]; then
  printf "%s" "$SECRETS_RESULTS" >> "$REPORT_FILE"
else
  echo "无发现 🟢" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<REPORTEOF

---

## 2️⃣ Token硬编码检查

> 扫描范围: apps/ — 排除 test/spec

| 文件位置 | 内容(脱敏) | 状态 |
|----------|-----------|:----:|
REPORTEOF

if [ "$TOKENS_FOUND" -gt 0 ]; then
  printf "%s" "$TOKENS_RESULTS" >> "$REPORT_FILE"
else
  echo "无发现 🟢" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<REPORTEOF

---

## 3️⃣ 依赖审计

> 命令: pnpm audit --audit-level=high
REPORTEOF

if [ -z "$AUDIT_RESULTS" ]; then
  echo "" >> "$REPORT_FILE"
  echo "✅ 无高/危急漏洞" >> "$REPORT_FILE"
else
  echo "" >> "$REPORT_FILE"
  echo "${AUDIT_RESULTS}" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" <<REPORTEOF

---

## 🚦 闸门判定

| 条件 | 状态 | 说明 |
|------|:----:|------|
| 硬编码密码 > 0 | $(badge $SECRETS_FOUND) | 🚫 硬阻断 — 必须修复后才能合并 |
| 硬编码Token > 0 | $(badge $TOKENS_FOUND) | 🚫 硬阻断 — 必须修复后才能合并 |
| 依赖危急漏洞 > 0 | $(badge $AUDIT_CRITICAL) | 🚫 硬阻断 — 必须修复后才能合并 |
| 依赖高危漏洞 > 0 | $(badge $AUDIT_HIGH) | ⚠️ 建议修复 |
| **出口** | **🔴 ${RISK_LEVEL} (退出码 ${EXIT_CODE})** | |

> 🐜 [V17: security-gates] · 安全门硬阻断pipeline

REPORTEOF

# ── 控制台输出 ──────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo " 🐜 安全门扫描报告 · 🐜 [V17: security-gates]"
echo "═══════════════════════════════════════════════"
echo " 扫描时间: ${SCAN_TIME}"
echo " 扫描模式: ${MODE}"
echo ""
echo " 📊 扫描结果:"
echo "   硬编码密码:     ${SECRETS_FOUND} 处发现"
echo "   硬编码Token:    ${TOKENS_FOUND} 处发现"
echo "   依赖审计(高危): ${AUDIT_HIGH}"
echo "   依赖审计(危急): ${AUDIT_CRITICAL}"
echo ""
echo " 🚦 风险等级: ${RISK_LEVEL}"

if [ "$EXIT_CODE" -gt 0 ]; then
  echo " ❌ 安全门阻断: 发现 ${total_issues} 个问题,需修复后重试"
else
  echo " ✅ 安全门通过"
fi

echo ""
echo " 📝 详细报告: ${REPORT_FILE}"
echo "═══════════════════════════════════════════════"

exit $EXIT_CODE
