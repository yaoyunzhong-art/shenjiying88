#!/bin/bash
# 🆘 神机营 SaaS — 紧急回滚 (基于 7/29 NLB 事故经验)
#    用法: ./infra/rollback.sh [--all | --list]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
K8S_DIR="$SCRIPT_DIR/k8s/rendered-release-preflight"
NAMESPACE="m5-platform"

echo "🆘 M5 紧急回滚"

DEPLOYS=("m5-admin-web" "m5-api" "m5-storefront-web" "m5-tob-web")

if [ "${1:-}" = "--list" ]; then
  echo "  可回滚的 Deployment:"
  for d in "${DEPLOYS[@]}"; do
    echo "    $d  →  kubectl -n $NAMESPACE rollout undo deployment/$d"
  done
  exit 0
fi

TARGET="${1:---all}"
if [ "$TARGET" = "--all" ]; then
  for d in "${DEPLOYS[@]}"; do
    echo "  ↩ 回滚 $d..."
    kubectl -n "$NAMESPACE" rollout undo deployment/"$d" || echo "    ⚠️ $d 无可回滚历史"
  done
else
  echo "  ↩ 回滚 $TARGET..."
  kubectl -n "$NAMESPACE" rollout undo deployment/"$TARGET"
fi

echo "  ⏳ 等待 Pod Ready..."
kubectl -n "$NAMESPACE" wait --for=condition=Ready pod \
  -l 'app.kubernetes.io/part-of=shenjiying' --timeout=120s || true

echo "  📊 回滚后状态:"
kubectl -n "$NAMESPACE" get pods -o wide

# NLB 自愈检查 (7/29 事故)
echo ""
echo "  🔧 NLB 检查..."
if command -v aliyun &>/dev/null; then
  echo "    如 NLB 监听器挂载丢失, 执行:"
  echo "    aliyun nlb ListListeners --region cn-hangzhou | jq '.Listeners[] | select(.ListenerStatus==\"Stopped\")'"
else
  echo "    ⚠️ aliyun CLI 未安装, 请手动检查 NLB 监听器状态"
fi
echo "  ✅ 回滚完成"