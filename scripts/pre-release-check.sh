#!/usr/bin/env bash
# pre-release-check.sh
# 用途: 生产发布前必查项脚本
# 使用: KUBECONFIG="$HOME/.kube/m5-prod-config" bash scripts/pre-release-check.sh
set -euo pipefail

NAMESPACE="${NAMESPACE:-m5-prod}"
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/m5-prod-config}"
PASS=0
FAIL=0
WARN=0
RESULTS=""

check() {
  local name="$1" status="$2" detail="$3"
  case "$status" in
    PASS) ((PASS++)) ;;
    FAIL) ((FAIL++)) ;;
    WARN) ((WARN++)) ;;
  esac
  RESULTS+="$status\t$name\t$detail\n"
}

echo "=== 神机营 发布前检查 ==="
echo "Namespace: $NAMESPACE"
echo "KUBECONFIG: $KUBECONFIG"
echo ""

# 1. Ingress 域名检查
echo "--- 1. Ingress ---"
INGRESS_HOST=$(kubectl --kubeconfig="$KUBECONFIG" get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.rules[0].host}' 2>/dev/null || echo "")
if echo "$INGRESS_HOST" | grep -q "sportsant.net"; then
  check "域名" "PASS" "正式域名: $INGRESS_HOST"
else
  check "域名" "FAIL" "非正式域名: ${INGRESS_HOST:-未配置}"
fi

# 2. TLS 证书检查
echo "--- 2. TLS ---"
TLS_SECRET=$(kubectl --kubeconfig="$KUBECONFIG" get ingress -n "$NAMESPACE" -o jsonpath='{.items[0].spec.tls[0].secretName}' 2>/dev/null || echo "")
if [ "$TLS_SECRET" = "m5-tls" ]; then
  check "TLS Secret" "PASS" "正式证书: $TLS_SECRET"
else
  check "TLS Secret" "FAIL" "非正式证书: ${TLS_SECRET:-未配置}"
fi

# 证书过期检查
CERT_EXPIRY=$(kubectl --kubeconfig="$KUBECONFIG" get certificate -n "$NAMESPACE" m5-tls -o jsonpath='{.status.notAfter}' 2>/dev/null || echo "")
if [ -n "$CERT_EXPIRY" ]; then
  EXPIRY_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CERT_EXPIRY" +%s 2>/dev/null || date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo 0)
  NOW_EPOCH=$(date +%s)
  if [ $((EXPIRY_EPOCH - NOW_EPOCH)) -gt $((30*24*3600)) ]; then
    check "证书过期" "PASS" "过期: $CERT_EXPIRY (>30天)"
  else
    check "证书过期" "WARN" "即将过期: $CERT_EXPIRY"
  fi
else
  check "证书过期" "WARN" "无法读取证书过期时间"
fi

# 3. ConfigMap 检查
echo "--- 3. Config ---"
NEXT_PUBLIC_API_URL=$(kubectl --kubeconfig="$KUBECONFIG" get configmap -n "$NAMESPACE" m5-config -o jsonpath='{.data.NEXT_PUBLIC_API_URL}' 2>/dev/null || echo "")
if echo "$NEXT_PUBLIC_API_URL" | grep -q "api.sportsant.net"; then
  check "NEXT_PUBLIC_API_URL" "PASS" "$NEXT_PUBLIC_API_URL"
else
  check "NEXT_PUBLIC_API_URL" "FAIL" "非正式: ${NEXT_PUBLIC_API_URL:-未配置}"
fi

# 4. Deployment Ready
echo "--- 4. Deployment ---"
DEPLOYMENTS=$(kubectl --kubeconfig="$KUBECONFIG" get deploy -n "$NAMESPACE" -o name 2>/dev/null || echo "")
for DEPLOY in $DEPLOYMENTS; do
  NAME=$(echo "$DEPLOY" | cut -d/ -f2)
  READY=$(kubectl --kubeconfig="$KUBECONFIG" get deploy -n "$NAMESPACE" "$NAME" -o jsonpath='{.status.readyReplicas}/{.status.replicas}' 2>/dev/null || echo "?/0")
  if echo "$READY" | grep -qE "^[0-9]+/[0-9]+$"; then
    AVAIL=$(echo "$READY" | cut -d/ -f1)
    TOTAL=$(echo "$READY" | cut -d/ -f2)
    if [ "$AVAIL" = "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
      check "$NAME Ready" "PASS" "$READY"
    else
      check "$NAME Ready" "FAIL" "$READY"
    fi
  fi
done

# 5. Pod 错误检查
echo "--- 5. Pod ---"
POD_ERRORS=$(kubectl --kubeconfig="$KUBECONFIG" get pods -n "$NAMESPACE" 2>/dev/null | grep -E "CrashLoopBackOff|ImagePullBackOff|Error|Pending" || true)
if [ -z "$POD_ERRORS" ]; then
  check "Pod 状态" "PASS" "无异常 Pod"
else
  check "Pod 状态" "FAIL" "存在异常 Pod: $POD_ERRORS"
fi

# 6. 健康接口检查
echo "--- 6. API Health ---"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "https://api.sportsant.net/api/v1/health/ping" 2>/dev/null || echo "000")
if [ "$HEALTH_STATUS" = "200" ]; then
  check "API Health" "PASS" "200"
else
  check "API Health" "FAIL" "HTTP $HEALTH_STATUS"
fi

# 7. ACR 凭据检查
echo "--- 7. ACR ---"
kubectl --kubeconfig="$KUBECONFIG" get secret acr-regcred -n "$NAMESPACE" -o jsonpath='{.data.\.dockerconfigjson}' 2>/dev/null | base64 -d | python3 -c "import sys,json; d=json.load(sys.stdin); a=list(d.get('auths',{}).keys())[0] if d.get('auths') else 'none'; print('ACR地址:', a)" 2>/dev/null || check "ACR" "WARN" "无法读取 acr-regcred"

# 8. 浏览器首屏
echo "--- 8. Web 首屏 ---"
for DOMAIN in admin.sportsant.net store.sportsant.net tob.sportsant.net; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "https://$DOMAIN" 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    check "$DOMAIN 首屏" "PASS" "200"
  else
    check "$DOMAIN 首屏" "FAIL" "HTTP $STATUS"
  fi
done

# 9. Billing/余额检查
echo "--- 9. Billing ---"
check "阿里云余额" "WARN" "需手动检查阿里云控制台"

# 10. acr-regcred 过期检查
echo "--- 10. ACR 令牌过期 ---"
TOKEN_JSON=$(kubectl --kubeconfig="$KUBECONFIG" get secret acr-regcred -n "$NAMESPACE" -o jsonpath='{.data.\.dockerconfigjson}' 2>/dev/null | base64 -d || echo "")
if [ -n "$TOKEN_JSON" ]; then
  AUTH_B64=$(echo "$TOKEN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); a=list(d.get('auths',{}).values())[0]; print(a.get('auth',''))" 2>/dev/null || echo "")
  if [ -n "$AUTH_B64" ]; then
    DECODED=$(echo "$AUTH_B64" | base64 -d 2>/dev/null || echo "")
    if echo "$DECODED" | grep -q ":"; then
      check "ACR 凭据" "PASS" "凭据存在，格式正确"
    fi
  fi
fi

# 输出结果
echo ""
echo "==================="
echo "  检查结果"
echo "==================="
echo -e "$RESULTS" | column -t -s $'\t' 2>/dev/null || echo -e "$RESULTS"
echo ""
echo "PASS: $PASS  |  FAIL: $FAIL  |  WARN: $WARN"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ 存在 $FAIL 个失败项，修复后再发布"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "⚠️ 存在 $WARN 个警告项，建议检查"
  exit 0
else
  echo "✅ 全部通过，可以发布"
  exit 0
fi
