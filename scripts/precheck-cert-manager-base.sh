#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/precheck-cert-manager-base.sh [--strict]

Behavior:
  1. Checks cert-manager CRDs
  2. Checks cert-manager namespace
  3. Checks core cert-manager deployments
  4. Exits non-zero with --strict if anything is missing
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"

STRICT="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --strict)
      STRICT="true"
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

ensure_m5_kubeconfig "$ROOT_DIR"

missing_items=()
required_crds=(
  certificates.cert-manager.io
  certificaterequests.cert-manager.io
  clusterissuers.cert-manager.io
  orders.acme.cert-manager.io
  challenges.acme.cert-manager.io
)

required_deployments=(
  cert-manager
  cert-manager-webhook
  cert-manager-cainjector
)

echo "==> cert-manager base precheck"

for crd_name in "${required_crds[@]}"; do
  if kubectl get crd "$crd_name" >/dev/null 2>&1; then
    echo "OK   CRD $crd_name"
  else
    echo "MISS CRD $crd_name"
    missing_items+=("Missing CRD: $crd_name")
  fi
done

if kubectl get namespace cert-manager >/dev/null 2>&1; then
  echo "OK   namespace cert-manager"
  for deployment_name in "${required_deployments[@]}"; do
    if kubectl -n cert-manager get "deployment/$deployment_name" >/dev/null 2>&1; then
      echo "OK   deployment cert-manager/$deployment_name"
    else
      echo "MISS deployment cert-manager/$deployment_name"
      missing_items+=("Missing deployment: cert-manager/$deployment_name")
    fi
  done
else
  echo "MISS namespace cert-manager"
  missing_items+=("Missing namespace: cert-manager")
fi

echo
if [[ "${#missing_items[@]}" -eq 0 ]]; then
  echo "==> cert-manager base is ready"
  exit 0
fi

echo "==> cert-manager base is not ready"
for item in "${missing_items[@]}"; do
  echo " - $item"
done

if [[ "$STRICT" == "true" ]]; then
  exit 1
fi
