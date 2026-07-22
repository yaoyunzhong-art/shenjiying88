#!/usr/bin/env bash
# pre-release-check.sh
# 用途: 生产发布前必查项脚本
# 使用: KUBECONFIG="$HOME/.kube/m5-prod-config" NAMESPACE=m5 bash scripts/pre-release-check.sh
set -euo pipefail

EXPECTED_NAMESPACE="${EXPECTED_NAMESPACE:-m5}"
NAMESPACE="${NAMESPACE:-$EXPECTED_NAMESPACE}"
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/m5-prod-config}"
PASS=0
FAIL=0
WARN=0
RESULTS=""

check() {
  local name="$1" status="$2" detail="$3"
  case "$status" in
    PASS) PASS=$((PASS + 1)) ;;
    FAIL) FAIL=$((FAIL + 1)) ;;
    WARN) WARN=$((WARN + 1)) ;;
  esac
  RESULTS+="$status\t$name\t$detail\n"
}

ACR_SECRET_JSON=""
ACR_REGISTRY=""
ACR_USERNAME=""
ACR_AUTH=""

load_acr_secret() {
  local encoded_json
  encoded_json="$(kubectl --kubeconfig="$KUBECONFIG" get secret acr-regcred -n "$NAMESPACE" -o jsonpath='{.data.\.dockerconfigjson}' 2>/dev/null || true)"
  if [ -z "$encoded_json" ]; then
    return 1
  fi

  ACR_SECRET_JSON="$(printf '%s' "$encoded_json" | base64 -d 2>/dev/null || true)"
  if [ -z "$ACR_SECRET_JSON" ]; then
    return 1
  fi

  ACR_REGISTRY="$(printf '%s' "$ACR_SECRET_JSON" | python3 -c "import sys, json; d = json.load(sys.stdin); auths = d.get('auths') or {}; print(next(iter(auths.keys()), ''))" 2>/dev/null || true)"
  ACR_USERNAME="$(printf '%s' "$ACR_SECRET_JSON" | python3 -c "import sys, json; d = json.load(sys.stdin); auths = d.get('auths') or {}; first = next(iter(auths.values()), {}); print(first.get('username', ''))" 2>/dev/null || true)"
  ACR_AUTH="$(printf '%s' "$ACR_SECRET_JSON" | python3 -c "import sys, json; d = json.load(sys.stdin); auths = d.get('auths') or {}; first = next(iter(auths.values()), {}); print(first.get('auth', ''))" 2>/dev/null || true)"
  return 0
}

curl_failed_with_libressl() {
  local output="$1"
  [[ "$output" == *"LibreSSL"* ]] || [[ "$output" == *"Connection reset by peer"* ]]
}

python_https_status() {
  local host="$1"
  local path="$2"
  python3 - "$host" "$path" <<'PY'
import http.client
import ssl
import sys

host, path = sys.argv[1:3]
context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

conn = http.client.HTTPSConnection(host, 443, context=context, timeout=8)
conn.request("GET", path, headers={"Host": host, "User-Agent": "m5-pre-release/python-probe"})
resp = conn.getresponse()
print(resp.status)
PY
}

probe_https_status() {
  local host="$1"
  local path="$2"
  local output=""
  local curl_exit=0
  local url="https://$host$path"

  output="$(curl -k -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 10 "$url" 2>&1)" || curl_exit=$?
  if [ "$curl_exit" -eq 0 ] && echo "$output" | grep -qE '^[0-9]{3}$'; then
    printf '%s' "$output"
    return 0
  fi

  if command -v python3 >/dev/null 2>&1 && curl_failed_with_libressl "$output"; then
    output="$(python_https_status "$host" "$path" 2>/dev/null || true)"
    if echo "$output" | grep -qE '^[0-9]{3}$'; then
      printf '%s' "$output"
      return 0
    fi
  fi

  printf '000'
  return 1
}

read_tls_secret_expiry() {
  local encoded_cert=""
  encoded_cert="$(kubectl --kubeconfig="$KUBECONFIG" get secret "$TLS_SECRET" -n "$NAMESPACE" -o go-template='{{index .data "tls.crt"}}' 2>/dev/null || true)"
  if [ -z "$encoded_cert" ]; then
    return 1
  fi

  printf '%s' "$encoded_cert" | base64 -d 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | sed 's/^notAfter=//'
}

echo "=== 神机营 发布前检查 ==="
echo "Namespace: $NAMESPACE"
echo "KUBECONFIG: $KUBECONFIG"
echo ""

# 0. 正式命名空间口径检查
echo "--- 0. Namespace ---"
if [ "$NAMESPACE" = "$EXPECTED_NAMESPACE" ]; then
  check "生产命名空间" "PASS" "$NAMESPACE"
else
  check "生产命名空间" "FAIL" "正式发布必须使用 namespace=$EXPECTED_NAMESPACE，当前为 $NAMESPACE"
fi

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
CERT_EXPIRY="$(kubectl --kubeconfig="$KUBECONFIG" get certificate -n "$NAMESPACE" "$TLS_SECRET" -o jsonpath='{.status.notAfter}' 2>/dev/null || true)"
if [ -z "$CERT_EXPIRY" ]; then
  CERT_EXPIRY="$(read_tls_secret_expiry || true)"
fi
if [ -n "$CERT_EXPIRY" ]; then
  EXPIRY_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %e %T %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null || date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo 0)
  NOW_EPOCH=$(date +%s)
  if [ "$EXPIRY_EPOCH" -eq 0 ]; then
    check "证书过期" "WARN" "无法解析过期时间: $CERT_EXPIRY"
  elif [ $((EXPIRY_EPOCH - NOW_EPOCH)) -gt $((30*24*3600)) ]; then
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
HEALTH_STATUS="$(probe_https_status "api.sportsant.net" "/api/v1/health/ping" || true)"
if [ "$HEALTH_STATUS" = "200" ]; then
  check "API Health" "PASS" "200"
else
  check "API Health" "FAIL" "HTTP $HEALTH_STATUS"
fi

# 7. ACR Secret 检查
echo "--- 7. ACR ---"
if load_acr_secret; then
  check "acr-regcred" "PASS" "存在于 namespace=$NAMESPACE"
  if [ -n "$ACR_REGISTRY" ]; then
    check "ACR Registry" "PASS" "$ACR_REGISTRY"
  else
    check "ACR Registry" "FAIL" "acr-regcred 中未解析到 registry"
  fi
else
  check "acr-regcred" "FAIL" "namespace=$NAMESPACE 中缺失或损坏"
fi

# 8. 浏览器首屏
echo "--- 8. Web 首屏 ---"
for DOMAIN in admin.sportsant.net store.sportsant.net tob.sportsant.net; do
  STATUS="$(probe_https_status "$DOMAIN" "/" || true)"
  if [ "$STATUS" = "200" ]; then
    check "$DOMAIN 首屏" "PASS" "200"
  else
    check "$DOMAIN 首屏" "FAIL" "HTTP $STATUS"
  fi
done

# 9. Billing/余额检查
echo "--- 9. Billing ---"
if BILLING_OUTPUT="$(ALIYUN_BALANCE_CNY="${ALIYUN_BALANCE_CNY:-}" bash "$(dirname "$0")/check-aliyun-billing.sh" 2>&1)"; then
  BALANCE_LINE="$(printf '%s\n' "$BILLING_OUTPUT" | awk '/^当前余额:/ {print $0}' | tail -n 1)"
  check "阿里云余额" "PASS" "${BALANCE_LINE:-余额充足}"
else
  BILLING_EXIT=$?
  BALANCE_LINE="$(printf '%s\n' "$BILLING_OUTPUT" | awk '/^当前余额:/ {print $0}' | tail -n 1)"
  case "$BILLING_EXIT" in
    2)
      check "阿里云余额" "FAIL" "${BALANCE_LINE:-余额低于紧急线}"
      ;;
    3)
      check "阿里云余额" "WARN" "${BALANCE_LINE:-余额低于告警线}"
      ;;
    *)
      check "阿里云余额" "WARN" "$(printf '%s\n' "$BILLING_OUTPUT" | tail -n 1)"
      ;;
  esac
fi

# 10. ACR 登录身份检查
echo "--- 10. ACR 登录身份 ---"
if [ -z "$ACR_SECRET_JSON" ] && ! load_acr_secret; then
  check "ACR 登录用户名" "FAIL" "无法读取 acr-regcred，无法校验用户名"
elif [ -z "$ACR_USERNAME" ]; then
  check "ACR 登录用户名" "FAIL" "acr-regcred 中缺失 username"
elif echo "$ACR_USERNAME" | grep -qE '^[0-9]+$'; then
  check "ACR 登录用户名" "FAIL" "疑似误用阿里云 userId: $ACR_USERNAME"
elif [ "$ACR_USERNAME" = "cr_temp_user" ]; then
  check "ACR 登录用户名" "FAIL" "当前为临时用户 cr_temp_user，正式发布必须使用阿里云账户全名邮箱"
elif echo "$ACR_USERNAME" | grep -q '\*'; then
  check "ACR 登录用户名" "FAIL" "用户名仍为掩码值: $ACR_USERNAME"
elif echo "$ACR_USERNAME" | grep -q '@'; then
  check "ACR 登录用户名" "PASS" "$ACR_USERNAME"
else
  check "ACR 登录用户名" "FAIL" "非阿里云账户全名邮箱: $ACR_USERNAME"
fi

if [ -n "$ACR_AUTH" ]; then
  check "ACR 凭据格式" "PASS" "auth 字段存在"
else
  check "ACR 凭据格式" "FAIL" "auth 字段缺失"
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
