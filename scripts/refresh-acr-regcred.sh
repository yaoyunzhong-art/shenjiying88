#!/usr/bin/env bash
# refresh-acr-regcred.sh
# 用途: 一键刷新 acr-regcred 避免 ImagePullBackOff
# 使用方式:  KUBECONFIG="$HOME/.kube/m5-prod-config" bash scripts/refresh-acr-regcred.sh
# 或者直接运行（自动从环境/脚本库加载 kubeconfig）

set -euo pipefail

NAMESPACE="${NAMESPACE:-m5}"
SECRET_NAME="acr-regcred"

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
  echo "  请先设置 KUBECONFIG 或确保 $HOME/.kube/m5-prod-config 存在"
  exit 1
fi
echo "==> 使用 KUBECONFIG: $KUBECONFIG"

# ---------- ACR 地址 ----------
# 从现有 Secret 中自动探测 registry 地址
REGISTRY="$(kubectl --kubeconfig="$KUBECONFIG" get secret "$SECRET_NAME" -n "$NAMESPACE" \
  -o jsonpath='{.data.\.dockerconfigjson}' 2>/dev/null | base64 -d | python3 -c "
import sys,json
d=json.load(sys.stdin)
for k in d.get('auths',{}):
  print(k)
  break
" 2>/dev/null)" || REGISTRY=""

if [[ -z "$REGISTRY" ]]; then
  # 探测正在运行的 pod 镜像地址
  REGISTRY="$(kubectl --kubeconfig="$KUBECONFIG" get deployment -n "$NAMESPACE" \
    -o jsonpath='{.items[0].spec.template.spec.containers[0].image}' 2>/dev/null | cut -d/ -f1)" || REGISTRY=""
fi

# 回退硬编码
if [[ -z "$REGISTRY" ]]; then
  REGISTRY="shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com"
fi

echo "==> ACR Registry: $REGISTRY"
echo "==> Namespace:    $NAMESPACE"
echo ""

# ---------- 1. 获取凭据 ----------
if [[ -z "${ALIYUN_ACR_USERNAME:-}" ]]; then
  echo "ℹ️  ALIYUN_ACR_USERNAME 未设置，尝试从现有 secret 读取..."
  EXISTING_USERNAME="$(kubectl --kubeconfig="$KUBECONFIG" get secret "$SECRET_NAME" -n "$NAMESPACE" \
    -o jsonpath='{.data.\.dockerconfigjson}' 2>/dev/null | base64 -d | python3 -c "
import sys,json,base64
d=json.load(sys.stdin)
for k,v in d.get('auths',{}).items():
  print(v.get('username',''))
  break
" 2>/dev/null)" || EXISTING_USERNAME=""
  if [[ -n "$EXISTING_USERNAME" ]]; then
    echo "  发现现有凭据用户名: $EXISTING_USERNAME"
    export ALIYUN_ACR_USERNAME="$EXISTING_USERNAME"
  fi
fi

if [[ -z "${ALIYUN_ACR_PASSWORD:-}" ]]; then
  echo "ℹ️  ALIYUN_ACR_PASSWORD 未设置，尝试从现有 secret 读取..."
  EXISTING_PASSWORD="$(kubectl --kubeconfig="$KUBECONFIG" get secret "$SECRET_NAME" -n "$NAMESPACE" \
    -o jsonpath='{.data.\.dockerconfigjson}' 2>/dev/null | base64 -d | python3 -c "
import sys,json
d=json.load(sys.stdin)
for k,v in d.get('auths',{}).items():
  print(v.get('password',''))
  break
" 2>/dev/null)" || EXISTING_PASSWORD=""
  if [[ -n "$EXISTING_PASSWORD" ]]; then
    echo "  从现有 secret 继承密码（可能是临时令牌）"
    export ALIYUN_ACR_PASSWORD="$EXISTING_PASSWORD"
  fi
fi

if [[ -z "${ALIYUN_ACR_USERNAME:-}" || -z "${ALIYUN_ACR_PASSWORD:-}" ]]; then
  echo "❌ 无法获取 ACR 凭据。请设置环境变量:"
  echo "  export ALIYUN_ACR_USERNAME='你的阿里云账号全名或 cr_temp_user'"
  echo "  export ALIYUN_ACR_PASSWORD='你的 ACR 密码或临时令牌'"
  echo ""
  echo "  从现有凭据类型（cr_temp_user + 令牌）判断，你需要:"
  echo "  a) 登录阿里云 ACR 控制台生成新的临时令牌"
  echo "  b) 或使用长期有效的固定密码（阿里云 ACR 独立密码）"
  exit 1
fi

# ---------- 2. 创建/替换 docker-registry secret ----------
echo "==> 替换 secret: $SECRET_NAME"

kubectl --kubeconfig="$KUBECONFIG" delete secret "$SECRET_NAME" -n "$NAMESPACE" --ignore-not-found=true
kubectl --kubeconfig="$KUBECONFIG" create secret docker-registry "$SECRET_NAME" \
  --docker-server="$REGISTRY" \
  --docker-username="$ALIYUN_ACR_USERNAME" \
  --docker-password="$ALIYUN_ACR_PASSWORD" \
  --namespace "$NAMESPACE"

echo "  ✅ secret $SECRET_NAME 已更新"

# ---------- 3. 重启所有 Deployment 触发新拉取 ----------
echo ""
echo "=== 重启 Deployment（ns=$NAMESPACE）=="

DEPLOY_COUNT=0
for DEPLOY in $(kubectl --kubeconfig="$KUBECONFIG" get deploy -n "$NAMESPACE" -o name 2>/dev/null); do
  kubectl --kubeconfig="$KUBECONFIG" rollout restart "$DEPLOY" -n "$NAMESPACE" >/dev/null
  echo "  ✅ $DEPLOY restarted"
  DEPLOY_COUNT=$((DEPLOY_COUNT + 1))
done

if [[ "$DEPLOY_COUNT" -eq 0 ]]; then
  echo "  ⚠️  namespace $NAMESPACE 中没有 Deployment"
fi

# ---------- 4. 等待就绪 ----------
echo ""
echo "=== 等待就绪（最长 120s）==="
if kubectl --kubeconfig="$KUBECONFIG" rollout status deployment -n "$NAMESPACE" --timeout=120s 2>/dev/null; then
  echo ""
  echo "✅ acr-regcred 刷新完成 — 所有 Pod 已就绪"
else
  echo ""
  echo "⚠️  超时等待就绪，请手动检查:"
  echo "  kubectl --kubeconfig=$KUBECONFIG get pods -n $NAMESPACE"
fi
