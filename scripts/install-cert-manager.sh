#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/install-cert-manager.sh \
    [--manifest-url <url>] \
    [--wait-timeout 300s] \
    [--dry-run]

Behavior:
  1. Installs cert-manager from an upstream release manifest
  2. Waits for core deployments to become Available
  3. Runs the local cert-manager base precheck

Notes:
  - Default manifest uses the latest upstream release artifact.
  - This script mutates the cluster unless --dry-run is set.
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"

MANIFEST_URL="https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml"
WAIT_TIMEOUT="300s"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest-url)
      MANIFEST_URL="${2:-}"
      shift 2
      ;;
    --wait-timeout)
      WAIT_TIMEOUT="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
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

echo "==> cert-manager install start"
echo "manifest_url=$MANIFEST_URL"
echo "wait_timeout=$WAIT_TIMEOUT"
echo "dry_run=$DRY_RUN"

if [[ "$DRY_RUN" == "true" ]]; then
  kubectl apply --dry-run=server -f "$MANIFEST_URL"
  echo "==> dry-run finished"
  exit 0
fi

kubectl apply -f "$MANIFEST_URL"

echo "==> waiting for cert-manager deployments"
kubectl -n cert-manager rollout status deployment/cert-manager --timeout="$WAIT_TIMEOUT"
kubectl -n cert-manager rollout status deployment/cert-manager-webhook --timeout="$WAIT_TIMEOUT"
kubectl -n cert-manager rollout status deployment/cert-manager-cainjector --timeout="$WAIT_TIMEOUT"

echo "==> running base precheck"
bash "$ROOT_DIR/scripts/precheck-cert-manager-base.sh" --strict

echo "==> cert-manager install finished"
echo "next_command=pnpm g8:tls:provision"
