#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
K8S_DIR="$SCRIPT_DIR/k8s/rendered-release-preflight"
ACR="shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88"
VERSION="${VERSION:-v1.0.0}"
NAMESPACE="m5"
DRY=false; SKIP=false
for a in "$@"; do case "$a" in --dry-run) DRY=true ;; --skip-build) SKIP=true ;; esac; done

echo "🚀 M5 deploy v$VERSION"

echo "[1/5] Pre-flight..."
kubectl cluster-info &>/dev/null || { echo "❌ kubectl not connected"; exit 1; }
echo "  ✅ cluster ok"

echo "[2/5] Build & Push..."
if [ "$SKIP" = false ]; then
  for svc in admin-web api storefront-web tob-web; do
    IMG="$ACR/m5-$svc:$VERSION"
    echo "  📦 m5-$svc..."
    docker build -t "$IMG" -f "apps/$svc/Dockerfile" . || exit 1
    docker push "$IMG" || exit 1
  done
else echo "  ⏭ skip (--skip-build)"; fi

echo "[3/5] Update tags..."
for svc in admin-web api storefront-web tob-web; do
  IMG="$ACR/m5-$svc:$VERSION"
  sed -i.bak "s|image: $ACR/m5-$svc:.*|image: $IMG|g" "$K8S_DIR/${svc}-deployment.yaml"
done

echo "[4/5] Activate replicas 0→2..."
for svc in admin-web storefront-web tob-web; do
  sed -i.bak 's/replicas: 0/replicas: 2/g' "$K8S_DIR/${svc}-deployment.yaml"
done
sed -i.bak 's/replicas: 1/replicas: 3/g' "$K8S_DIR/api-deployment.yaml"

echo "[5/5] kubectl apply..."
CMD="kubectl apply"
[ "$DRY" = true ] && CMD="kubectl apply --dry-run=client" && echo "  ⚠️ DRY-RUN"
$CMD -k "$K8S_DIR"

if [ "$DRY" = false ]; then
  kubectl -n "$NAMESPACE" wait --for=condition=Ready pod -l 'app.kubernetes.io/part-of=shenjiying' --timeout=300s || true
  kubectl -n "$NAMESPACE" get pods -o wide
  echo "✅ Done! https://admin.m5.com"
fi