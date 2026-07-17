#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/rollback-prod-public-cutover.sh \
    [--namespace m5] \
    [--backup-dir <path>] \
    [--skip-rollout-wait]

Behavior:
  1. Backup the current live Ingress and ConfigMap
  2. Re-apply the repo baseline:
     - infra/k8s/configmap.yaml
     - infra/k8s/ingress.yaml
  3. Restart the four production Deployments
  4. Wait for rollout unless --skip-rollout-wait is set

Note:
  This rollback intentionally keeps the TLS secret untouched.
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"
NAMESPACE="m5"
BACKUP_DIR=""
SKIP_ROLLOUT_WAIT="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --backup-dir)
      BACKUP_DIR="${2:-}"
      shift 2
      ;;
    --skip-rollout-wait)
      SKIP_ROLLOUT_WAIT="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

ensure_m5_kubeconfig "$ROOT_DIR"

INGRESS_BASELINE="$ROOT_DIR/infra/k8s/ingress.yaml"
CONFIG_BASELINE="$ROOT_DIR/infra/k8s/configmap.yaml"

for file_path in "$INGRESS_BASELINE" "$CONFIG_BASELINE"; do
  if [[ ! -f "$file_path" ]]; then
    echo "Baseline file is missing: $file_path" >&2
    exit 1
  fi
done

if [[ -z "$BACKUP_DIR" ]]; then
  BACKUP_DIR="$ROOT_DIR/infra/k8s/backups/public-cutover-rollback/$(date +%Y%m%d-%H%M%S)"
fi
mkdir -p "$BACKUP_DIR"

echo "==> Backing up current live resources to $BACKUP_DIR"
kubectl -n "$NAMESPACE" get ingress m5-ingress -o yaml > "$BACKUP_DIR/m5-ingress.before-rollback.yaml"
kubectl -n "$NAMESPACE" get configmap m5-config -o yaml > "$BACKUP_DIR/m5-config.before-rollback.yaml"

echo "==> Re-applying repo baseline (.local)"
kubectl apply -f "$CONFIG_BASELINE"
kubectl apply -f "$INGRESS_BASELINE"

deployments=(
  m5-api
  m5-admin-web
  m5-storefront-web
  m5-tob-web
)

echo "==> Restarting production workloads"
for deployment in "${deployments[@]}"; do
  kubectl -n "$NAMESPACE" rollout restart "deployment/$deployment"
done

if [[ "$SKIP_ROLLOUT_WAIT" != "true" ]]; then
  echo "==> Waiting for rollout completion"
  for deployment in "${deployments[@]}"; do
    kubectl -n "$NAMESPACE" rollout status "deployment/$deployment" --timeout=300s
  done
fi

cat <<EOF
==> Rollback to repo baseline finished
Backup dir:
  $BACKUP_DIR

Quick cluster checks:
  kubectl -n $NAMESPACE get ingress m5-ingress
  kubectl -n $NAMESPACE get configmap m5-config -o jsonpath='{.data.NEXT_PUBLIC_API_URL}'
EOF
