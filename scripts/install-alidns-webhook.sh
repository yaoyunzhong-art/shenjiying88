#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/install-alidns-webhook.sh \
    --env-file <path> \
    [--namespace cert-manager]

Behavior:
  1. Loads DNS-01 webhook settings from the env file
  2. Installs or upgrades the AliDNS webhook into cert-manager namespace
  3. Verifies the webhook deployment rollout
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

if ! command -v helm >/dev/null 2>&1; then
  echo "helm is required to install the AliDNS webhook" >&2
  exit 1
fi

ensure_m5_kubeconfig "$ROOT_DIR"

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

CERT_MANAGER_WEBHOOK_GROUP_NAME="${CERT_MANAGER_WEBHOOK_GROUP_NAME:-}"
if [[ -z "$CERT_MANAGER_WEBHOOK_GROUP_NAME" ]]; then
  echo "CERT_MANAGER_WEBHOOK_GROUP_NAME is required in the env file" >&2
  exit 1
fi

ALIDNS_WEBHOOK_IMAGE_REPOSITORY="${ALIDNS_WEBHOOK_IMAGE_REPOSITORY:-registry.cn-hangzhou.aliyuncs.com/wjiec/alidns-webhook}"
ALIDNS_WEBHOOK_IMAGE_TAG="${ALIDNS_WEBHOOK_IMAGE_TAG:-v1.0.3}"

helm upgrade --install alidns-webhook alidns-webhook \
  --repo https://wjiec.github.io/alidns-webhook \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --set "groupName=$CERT_MANAGER_WEBHOOK_GROUP_NAME" \
  --set "image.repository=$ALIDNS_WEBHOOK_IMAGE_REPOSITORY" \
  --set "image.tag=$ALIDNS_WEBHOOK_IMAGE_TAG"

kubectl -n "$NAMESPACE" rollout status deployment/alidns-webhook --timeout=300s

echo "==> AliDNS webhook is ready"
echo "namespace=$NAMESPACE"
echo "group_name=$CERT_MANAGER_WEBHOOK_GROUP_NAME"
