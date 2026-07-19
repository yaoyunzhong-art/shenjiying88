#!/usr/bin/env bash
# check-acr-regcred-expiry.sh
# 用途: 检查 acr-regcred 是否即将过期 / 是否存在 ImagePullBackOff
# 使用方式:  KUBECONFIG="$HOME/.kube/m5-prod-config" bash scripts/check-acr-regcred-expiry.sh
# 不需要 ACR 密码即可运行

set -euo pipefail

NAMESPACE="${NAMESPACE:-m5}"
SECRET_NAME="acr-regcred"
WARN_HOURS="${WARN_HOURS:-24}"   # 剩余少于多少小时告警

# ---------- kubeconfig 发现 ----------
if [[ -z "${KUBECONFIG:-}" || ! -f "${KUBECONFIG:-}" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  if [[ -f "$SCRIPT_DIR/lib-m5-kubeconfig.sh" ]]; then
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/lib-m5-kubeconfig.sh"
    ensure_m5_kubeconfig "$SCRIPT_DIR/.."
  else
    export KUBECONFIG="$HOME/.kube/m5-prod-config"
  fi
fi

if [[ ! -f "$KUBECONFIG" ]]; then
  echo "❌ Kubeconfig not found: $KUBECONFIG"
  exit 1
fi
echo "==> 使用 KUBECONFIG: $KUBECONFIG"
echo ""

# ---------- 1. 检查 Secret 是否存在 ----------
echo "=== 1. 检查 Secret 是否存在 ==="
if ! kubectl --kubeconfig="$KUBECONFIG" get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
  echo "❌ Secret $SECRET_NAME 在 ns=$NAMESPACE 中不存在"
  echo "  请运行: bash scripts/refresh-acr-regcred.sh"
  exit 1
fi
echo "  ✅ Secret $SECRET_NAME 存在"
echo ""

# ---------- 2. 解析凭据、过期时间 ----------
echo "=== 2. 凭据信息 ==="
CRED_JSON="$(kubectl --kubeconfig="$KUBECONFIG" get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d)"

REGISTRY="$(echo "$CRED_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for k in d.get('auths',{}):
  print(k)
  break
" 2>/dev/null)" || REGISTRY="<unknown>"

USERNAME="$(echo "$CRED_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for k,v in d.get('auths',{}).items():
  print(v.get('username',''))
  break
" 2>/dev/null)" || USERNAME="<unknown>"

echo "  Registry: $REGISTRY"
echo "  Username: $USERNAME"

# ---------- 2b. 尝试解码临时令牌获取过期时间 ----------
# 临时令牌格式: eyJpbnN0YW5jZUlkIjoi... 是一个 JWT/base64 编码的 payload
PASSWORD="$(echo "$CRED_JSON" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for k,v in d.get('auths',{}).items():
  print(v.get('password',''))
  break
" 2>/dev/null)" || PASSWORD=""

if [[ -n "$PASSWORD" ]]; then
  # ACR 临时令牌格式: {base64(payload)}:{signature}
  # payload 是一个 JSON，包含 "time" 字段（Unix 毫秒时间戳）
  PAYLOAD_B64="$(echo "$PASSWORD" | cut -d: -f1)"
  if [[ -n "$PAYLOAD_B64" ]]; then
    # 修复 base64 padding
    case $(( ${#PAYLOAD_B64} % 4 )) in
      2) PADDED="${PAYLOAD_B64}==";;
      3) PADDED="${PAYLOAD_B64}=";;
      *) PADDED="$PAYLOAD_B64";;
    esac
    PAYLOAD_DECODED="$(echo "$PADDED" | base64 -d 2>/dev/null)" || PAYLOAD_DECODED=""
    if echo "$PAYLOAD_DECODED" | python3 -c "import sys,json; json.load(sys.stdin)" &>/dev/null 2>&1; then
      EXPIRE_TS="$(echo "$PAYLOAD_DECODED" | python3 -c "
import sys,json
d=json.load(sys.stdin)
ts_ms = d.get('time')
if ts_ms:
  print(ts_ms)
else:
  print('')
" 2>/dev/null)" || EXPIRE_TS=""
      if [[ -n "$EXPIRE_TS" ]]; then
        # 毫秒时间戳 -> 人类可读 + 剩余时间
        EXPIRE_HUMAN="$(python3 -c "
import datetime
ts = float($EXPIRE_TS) / 1000
print(datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S'))
" 2>/dev/null)" || EXPIRE_HUMAN="<unknown>"
        REMAINING_SEC=$(( (EXPIRE_TS / 1000) - $(date +%s) ))
        REMAINING_HOURS=$(( REMAINING_SEC / 3600 ))
        REMAINING_MINS=$(( (REMAINING_SEC % 3600) / 60 ))
        if [[ $REMAINING_SEC -gt 0 ]]; then
          echo "  过期时间: $EXPIRE_HUMAN（剩余 ${REMAINING_HOURS}h ${REMAINING_MINS}m）"
          if [[ $REMAINING_HOURS -lt $WARN_HOURS ]]; then
            echo "  ⚠️  即将过期（<$WARN_HOURS 小时）！建议刷新"
          else
            echo "  ✅ 凭据有效期充足"
          fi
        else
          echo "  ❌ 凭据已过期于 $EXPIRE_HUMAN"
          echo "  请运行: bash scripts/refresh-acr-regcred.sh"
          exit 2
        fi
      fi
    fi
  fi
fi
echo ""

# ---------- 3. 检查 ImagePullBackOff ----------
echo "=== 3. 检查 ImagePullBackOff ==="
BACKOFF_COUNT="$(kubectl --kubeconfig="$KUBECONFIG" get pods -n "$NAMESPACE" 2>/dev/null | grep -c 'ImagePullBackOff\|ErrImagePull\|PullBackOff' || true)"
if [[ "$BACKOFF_COUNT" -gt 0 ]]; then
  echo "❌ 发现 $BACKOFF_COUNT 个拉取失败 Pod:"
  kubectl --kubeconfig="$KUBECONFIG" get pods -n "$NAMESPACE" | grep -E 'ImagePullBackOff|ErrImagePull|PullBackOff'
  echo ""
  echo "  建议立即刷新凭据:"
  echo "  export ALIYUN_ACR_USERNAME='cr_temp_user'"
  echo "  export ALIYUN_ACR_PASSWORD='<新的临时令牌>'"
  echo "  bash scripts/refresh-acr-regcred.sh"
  exit 3
else
  echo "  ✅ 无 ImagePullBackOff / ErrImagePull"
fi
echo ""

# ---------- 4. Pod 整体状态 ----------
echo "=== 4. Pod 状态 ==="
kubectl --kubeconfig="$KUBECONFIG" get pods -n "$NAMESPACE" -o wide
echo ""

# ---------- 5. Deployment Ready 数 ----------
echo "=== 5. Deployment Ready ==="
kubectl --kubeconfig="$KUBECONFIG" get deploy -n "$NAMESPACE"
echo ""

echo "✅ acr-regcred 状态检查完成"
