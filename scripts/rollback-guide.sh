#!/usr/bin/env bash
# rollback-guide.sh
# 用途: 神机营 — 生产回滚指南
# 每次发布都能明确回到哪个镜像和哪个配置; 出问题 5-15 分钟内回到稳态
#
# 使用:
#   export KUBECONFIG="$HOME/.kube/m5-prod-config"
#   bash scripts/rollback-guide.sh
#
# 或直接用完整参数:
#   NAMESPACE=m5 KUBECONFIG="$HOME/.kube/m5-prod-config" bash scripts/rollback-guide.sh

set -euo pipefail

NAMESPACE="${NAMESPACE:-m5}"
KUBECONFIG="${KUBECONFIG:-$HOME/.kube/m5-prod-config}"

echo "╔══════════════════════════════════════════════════╗"
echo "║         神机营 · 生产回滚指南                    ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║ K8s Namespace:  $NAMESPACE                       "
echo "║ 镜像仓库:       shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88"
echo "║ 正式域名:       *.sportsant.net                   "
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "📅 时间: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo ""

# ============================================================
# 1. 当前镜像版本
# ============================================================
echo "━━━ 1. 当前部署镜像版本 ━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if command -v kubectl &>/dev/null && [[ -f "$KUBECONFIG" ]]; then
  for DEPLOY in m5-api m5-admin-web m5-storefront-web m5-tob-web; do
    IMAGE=$(kubectl --kubeconfig="$KUBECONFIG" get deploy -n "$NAMESPACE" "$DEPLOY" \
      -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "❌ 未找到")
    REV=$(kubectl --kubeconfig="$KUBECONFIG" get deploy -n "$NAMESPACE" "$DEPLOY" \
      -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}' 2>/dev/null || echo "?")
    printf "  %-22s     revision=%s\n" "$DEPLOY:" "$REV"
    printf "  %-22s %s\n" "" "$IMAGE"
    echo ""
  done
else
  echo "  ⚠️  kubectl 或 kubeconfig 不可用, 请手动确认镜像版本"
  echo ""
  echo "  预期镜像 (上次记录):"
  echo "  m5-api:             shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-api@sha256:..."
  echo "  m5-admin-web:       shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-admin-web@sha256:..."
  echo "  m5-storefront-web:  shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-storefront-web@sha256:..."
  echo "  m5-tob-web:         shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-tob-web@sha256:..."
  echo ""
fi

# ============================================================
# 2. ConfigMap 摘要
# ============================================================
echo "━━━ 2. ConfigMap (m5-config) 关键配置 ━━━━━━━━━━━━"
echo ""
if command -v kubectl &>/dev/null && [[ -f "$KUBECONFIG" ]]; then
  CM_KEYS=$(kubectl --kubeconfig="$KUBECONFIG" get configmap -n "$NAMESPACE" m5-config \
    -o jsonpath='{.data}' 2>/dev/null || echo "")
  if [[ -n "$CM_KEYS" ]]; then
    echo "  配置项数: $(echo "$CM_KEYS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))")"
    echo ""
    # 显示关键配置
    for KEY in NODE_ENV LOG_LEVEL NEXT_PUBLIC_API_URL NEXT_PUBLIC_WS_URL CORS_ORIGIN LLM_DEFAULT_PROVIDER; do
      VAL=$(kubectl --kubeconfig="$KUBECONFIG" get configmap -n "$NAMESPACE" m5-config \
        -o jsonpath="{.data.$KEY}" 2>/dev/null || echo "?")
      printf "  %-25s %s\n" "$KEY:" "$VAL"
    done
  else
    echo "  ⚠️ 无法读取 ConfigMap"
  fi
else
  echo "  ⚠️ kubectl/KUBECONFIG 不可用"
fi
echo ""

# ============================================================
# 3. Rollout History
# ============================================================
echo "━━━ 3. Rollout History ━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if command -v kubectl &>/dev/null && [[ -f "$KUBECONFIG" ]]; then
  for DEPLOY in m5-api m5-admin-web m5-storefront-web m5-tob-web; do
    echo "  ◆ $DEPLOY"
    kubectl --kubeconfig="$KUBECONFIG" rollout history deployment "$DEPLOY" -n "$NAMESPACE" 2>/dev/null \
      | sed 's/^/    /' || echo "    ❌ 无法读取"
    echo ""
  done
else
  echo "  ⚠️ kubectl/KUBECONFIG 不可用, 跳过"
fi

# ============================================================
# 4. 回滚操作
# ============================================================
echo "━━━ 4. 回滚命令 (复制粘贴执行) ━━━━━━━━━━━━━━━━━━━"
echo ""

# -- 4a. 快速回滚 (一步到位) --
echo "  【场景 A】快速回滚 — 所有服务回到上一个版本"
echo "  ────────────────────────────────────────────────"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-api -n $NAMESPACE"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-admin-web -n $NAMESPACE"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-storefront-web -n $NAMESPACE"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-tob-web -n $NAMESPACE"
echo ""

# -- 4b. 指定 revision --
echo "  【场景 B】回滚到指定 Revision (从上方 History 中获取数字)"
echo "  ────────────────────────────────────────────────"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-api -n $NAMESPACE --to-revision=REVISION"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-admin-web -n $NAMESPACE --to-revision=REVISION"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-storefront-web -n $NAMESPACE --to-revision=REVISION"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-tob-web -n $NAMESPACE --to-revision=REVISION"
echo ""

# -- 4c. 回滚然后等待 --
echo "  【场景 C】回滚 + 等待完成 (脚本化)"
echo "  ────────────────────────────────────────────────"
echo "  for D in m5-api m5-admin-web m5-storefront-web m5-tob-web; do"
echo '    echo "→ 回滚 $D..."'
echo "    kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/\$D -n $NAMESPACE"
echo "  done"
echo "  echo "" && echo '→ 等待所有服务就绪...'"
echo "  kubectl --kubeconfig=$KUBECONFIG rollout status deployment -n $NAMESPACE --timeout=120s"
echo ""

# -- 4d. 回滚指定单个服务 --
echo "  【场景 D】回滚单个服务"
echo "  ────────────────────────────────────────────────"
echo "  只回滚 API:      kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-api -n $NAMESPACE"
echo "  只回滚 管理后台:  kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-admin-web -n $NAMESPACE"
echo "  只回滚 前台:      kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-storefront-web -n $NAMESPACE"
echo "  只回滚 ToB:       kubectl --kubeconfig=$KUBECONFIG rollout undo deployment/m5-tob-web -n $NAMESPACE"
echo ""

# ============================================================
# 5. 健康检查
# ============================================================
echo "━━━ 5. 回滚后验证 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  # 检查 Pod 状态"
echo "  kubectl --kubeconfig=$KUBECONFIG get pods -n $NAMESPACE"
echo ""
echo "  # 检查 API 健康检查"
echo '  curl -s -o /dev/null -w "%{http_code}" https://api.sportsant.net/api/v1/health/ping'
echo "  echo"
echo ""
echo "  # 检查前端页面"
echo '  curl -s -o /dev/null -w "%{http_code}" https://admin.sportsant.net/'
echo "  echo"
echo '  curl -s -o /dev/null -w "%{http_code}" https://store.sportsant.net/'
echo "  echo"
echo '  curl -s -o /dev/null -w "%{http_code}" https://tob.sportsant.net/'
echo "  echo"
echo ""

# ============================================================
# 6. 应急方案
# ============================================================
echo "━━━ 6. 应急方案 (rollout undo 失效时) ━━━━━━━━━━━"
echo ""
echo "  如果 rollout undo 不可用 (例如重建 deployment), 直接 set image:"
echo ""
echo "  kubectl --kubeconfig=$KUBECONFIG set image deployment/m5-api -n $NAMESPACE"
echo "    api=shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-api@sha256:xxx"
echo ""
echo "  # 从历史版本中获取 sha256 (通过 rollout history 找到正确 revision 后):"
echo '  kubectl --kubeconfig=$KUBECONFIG rollout history deployment/m5-api -n $NAMESPACE --revision=REV'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 提示: 运行此脚本不需要特殊权限, 但回滚命令需要 K8s 管理员权限"
echo "💡 提示: 回滚前建议先备份当前 m5-config ConfigMap"
echo "   kubectl --kubeconfig=$KUBECONFIG get configmap m5-config -n $NAMESPACE -o yaml > /tmp/m5-config-backup.yaml"
