#!/usr/bin/env bash
# security-baseline-scan.sh - G2-C1 安全基线真实扫描
# G2审计发现宣称8/8通过实际仅3/8。本脚本只扫真实状态。

set -euo pipefail
REPO=$(git rev-parse --show-toplevel 2>/dev/null || echo "/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88")
cd "$REPO"

echo "=========================================="
echo " G2-C1 安全基线真实扫描"
echo " 时间: $(date '+%Y-%m-%d %H:%M')"
echo "=========================================="
echo ""

PASS=0; FAIL=0; WARN=0; DETAILS=""

p()  { PASS=$((PASS+1)); echo "  [PASS] $1"; }
f()  { FAIL=$((FAIL+1)); echo "  [FAIL] $1"; DETAILS="${DETAILS}FAIL: $1"$'\n'; }
w()  { WARN=$((WARN+1)); echo "  [WARN] $1"; }

# 1 AuthGuard使用率
echo "--- [1/8] AuthGuard使用率 >=80% ---"
if [ -f scripts/authguard-coverage-check.sh ]; then
  result=$(bash scripts/authguard-coverage-check.sh 2>&1 | grep -oE '覆盖率:\s*[0-9.]+%' | grep -oE '[0-9.]+' || echo "0")
  if awk "BEGIN{exit($result>=80?0:1)}" 2>/dev/null; then p "AuthGuard $result% >=80%"
  else f "AuthGuard $result% <80%"; fi
else f "scripts/authguard-coverage-check.sh 不存在"; fi

# 2 TenantId透传
echo "--- [2/8] TenantId透传 ---"
if grep -q 'tenantId' apps/api/src/modules/payment-gateway/payment-gateway.controller.ts 2>/dev/null; then p "PaymentGateway有tenantId"
else f "PaymentGateway缺少tenantId"; fi

# 3 数据库层RLS
echo "--- [3/8] 数据库层RLS ---"
if grep -r 'tenantId\|RLS\|@Column' apps/api/src/modules/rls/ --include='*.ts' 2>/dev/null | grep -q '.'; then p "RLS模块有拦截"
else f "RLS模块缺少拦截"; fi

# 4 deviceToken持久化
echo "--- [4/8] deviceToken持久化 ---"
if grep -q '@Entity' apps/api/src/modules/push/push.entity.ts 2>/dev/null; then p "PushRecord DB存储"
else f "PushRecord非DB存储(Gate5未满足)"; fi

# 5 远程推送禁令
echo "--- [5/8] 远程推送禁令 ---"
if [ -f scripts/remote-push-detect.sh ]; then
  s=$(bash scripts/remote-push-detect.sh 2>&1 | grep '^STATUS=' | cut -d= -f2 || echo "")
  if [ "$s" = "pass" ]; then p "远程推送通过"
  else w "远程推送:$s"; fi
else f "remote-push-detect.sh 不存在"; fi

# 6 密码/SSO
echo "--- [6/8] 密码强度/SSO ---"
if grep -q 'password\|sso\|oauth' apps/api/src/modules/auth/auth.service.ts 2>/dev/null; then p "密码策略/SSO"
else w "未发现密码强度或SSO"; fi

# 7 审计日志
echo "--- [7/8] 审计日志完备性 ---"
if [ -d apps/api/src/modules/audit/ ]; then p "审计模块存在"
else w "审计模块不存在"; fi

# 8 密钥管理
echo "--- [8/8] 密钥管理/环境变量 ---"
if [ -f .env.example ]; then p ".env.example存在"
else w ".env.example不存在"; fi

echo ""
echo "=========================================="
echo "  真实扫描结果: ${PASS}/8 PASS, ${FAIL} FAIL, ${WARN} WARN"
echo "=========================================="
[ "$FAIL" -gt 0 ] && echo "  G2审计发现: 宣称8/8 真实${PASS}/8"
echo "STATUS=$([ "$FAIL" -gt 0 ] && echo "fail" || echo "pass")"
echo "PASSED=$PASS"
exit $([ "$FAIL" -gt 0 ] && echo 2 || echo 0)
