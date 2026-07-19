#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ALIDNS_ACCESS_KEY_ID=... \
  ALIDNS_ACCESS_KEY_SECRET=... \
  scripts/create-alidns-secret.sh \
    --env-file <path> \
    [--namespace cert-manager]

Behavior:
  1. Loads the env file to discover the AliDNS secret contract
  2. Creates or updates the runtime secret in the cert-manager namespace
  3. Never writes the access key pair into the repo
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"

ENV_FILE=""
NAMESPACE="cert-manager"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
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

if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Missing --env-file or file does not exist" >&2
  exit 1
fi

if [[ -z "${ALIDNS_ACCESS_KEY_ID:-}" || -z "${ALIDNS_ACCESS_KEY_SECRET:-}" ]]; then
  echo "ALIDNS_ACCESS_KEY_ID and ALIDNS_ACCESS_KEY_SECRET are required" >&2
  exit 1
fi

ensure_m5_kubeconfig "$ROOT_DIR"

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

ALIDNS_SECRET_NAME="${ALIDNS_SECRET_NAME:-alidns-credentials}"
ALIDNS_ACCESS_KEY_ID_KEY="${ALIDNS_ACCESS_KEY_ID_KEY:-access-key-id}"
ALIDNS_ACCESS_KEY_SECRET_KEY="${ALIDNS_ACCESS_KEY_SECRET_KEY:-access-key-secret}"

kubectl -n "$NAMESPACE" create secret generic "$ALIDNS_SECRET_NAME" \
  --from-literal="$ALIDNS_ACCESS_KEY_ID_KEY=$ALIDNS_ACCESS_KEY_ID" \
  --from-literal="$ALIDNS_ACCESS_KEY_SECRET_KEY=$ALIDNS_ACCESS_KEY_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> AliDNS credential secret is ready"
echo "namespace=$NAMESPACE"
echo "secret_name=$ALIDNS_SECRET_NAME"
