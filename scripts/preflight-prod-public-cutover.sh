#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/preflight-prod-public-cutover.sh \
    --env-file <path> \
    [--namespace m5] \
    [--rendered-dir <path>] \
    [--offline] \
    [--allow-missing-tls] \
    [--log-file <path>]

Behavior:
  1. Check kubectl connectivity and namespace/resource presence
  2. Print current Ingress hosts and public runtime URLs
  3. Check readiness of the four production Deployments
  4. Render public cutover manifests from the shared template set
  5. Validate rendered manifests with kubectl --dry-run=server

Note:
  This script does not mutate live production resources.
  --offline skips live cluster checks and falls back to rendered-manifest
  sanity checks. It is a preparation path, not a replacement for server dry-run.
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"
ENV_FILE=""
NAMESPACE="m5"
RENDERED_DIR="$ROOT_DIR/infra/k8s/rendered-public-preflight"
OFFLINE="false"
ALLOW_MISSING_TLS="false"
LOG_FILE=""

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
    --rendered-dir)
      RENDERED_DIR="${2:-}"
      shift 2
      ;;
    --offline)
      OFFLINE="true"
      shift
      ;;
    --allow-missing-tls)
      ALLOW_MISSING_TLS="true"
      shift
      ;;
    --log-file)
      LOG_FILE="${2:-}"
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

if [[ -n "$LOG_FILE" ]]; then
  mkdir -p "$(dirname "$LOG_FILE")"
  exec > >(tee "$LOG_FILE") 2>&1
fi

if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Missing --env-file or file does not exist" >&2
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

if [[ "$OFFLINE" != "true" ]]; then
  ensure_m5_kubeconfig "$ROOT_DIR"
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

required_vars=(
  TLS_SECRET_NAME
  API_HOST
  ADMIN_HOST
  STOREFRONT_HOST
  TOB_HOST
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_WS_URL
  CORS_ORIGIN
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: $var_name" >&2
    exit 1
  fi
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> prod public preflight start"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] env_file=$ENV_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] namespace=$NAMESPACE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] rendered_dir=$RENDERED_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] offline=$OFFLINE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] allow_missing_tls=$ALLOW_MISSING_TLS"

warnings=()

warn() {
  warnings+=("$1")
  echo "WARN: $1"
}

check_rendered_manifest() {
  local manifest_path="$1"
  if grep -q '__[A-Z0-9_]\+__' "$manifest_path"; then
    echo "Rendered manifest still contains placeholder tokens: $manifest_path" >&2
    exit 1
  fi
}

if [[ "$OFFLINE" != "true" ]]; then
  echo "==> Checking namespace access"
  kubectl get namespace "$NAMESPACE" >/dev/null

  echo "==> Checking live resources"
  kubectl -n "$NAMESPACE" get ingress m5-ingress >/dev/null
  kubectl -n "$NAMESPACE" get configmap m5-config >/dev/null

  echo "==> Current ingress hosts"
  kubectl -n "$NAMESPACE" get ingress m5-ingress -o jsonpath='{range .spec.rules[*]}{.host}{"\n"}{end}'
  echo

  echo "==> Current runtime public URLs"
  echo "NEXT_PUBLIC_API_URL=$(kubectl -n "$NAMESPACE" get configmap m5-config -o jsonpath='{.data.NEXT_PUBLIC_API_URL}')"
  echo "NEXT_PUBLIC_WS_URL=$(kubectl -n "$NAMESPACE" get configmap m5-config -o jsonpath='{.data.NEXT_PUBLIC_WS_URL}')"
  echo "CORS_ORIGIN=$(kubectl -n "$NAMESPACE" get configmap m5-config -o jsonpath='{.data.CORS_ORIGIN}')"
  echo
else
  warn "Offline mode enabled; live cluster checks are skipped"
fi

echo "==> Target public URLs from env file"
echo "API_HOST=$API_HOST"
echo "ADMIN_HOST=$ADMIN_HOST"
echo "STOREFRONT_HOST=$STOREFRONT_HOST"
echo "TOB_HOST=$TOB_HOST"
echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
echo "NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL"
echo "CORS_ORIGIN=$CORS_ORIGIN"
echo

deployments=(
  m5-api
  m5-admin-web
  m5-storefront-web
  m5-tob-web
)

if [[ "$OFFLINE" != "true" ]]; then
  echo "==> Deployment readiness"
  for deployment in "${deployments[@]}"; do
    kubectl -n "$NAMESPACE" get "deployment/$deployment" \
      -o jsonpath='{.metadata.name}{" ready="}{.status.readyReplicas}{"/"}{.status.replicas}{" available="}{.status.availableReplicas}{" updated="}{.status.updatedReplicas}{"\n"}'
  done
  echo
else
  warn "Offline mode enabled; deployment readiness is not queried"
fi

echo "==> TLS status"
if [[ "$OFFLINE" != "true" ]]; then
  if kubectl -n "$NAMESPACE" get secret "$TLS_SECRET_NAME" >/dev/null 2>&1; then
    echo "TLS secret exists: $TLS_SECRET_NAME"
  else
    if [[ "$ALLOW_MISSING_TLS" == "true" ]]; then
      warn "TLS secret is missing: $TLS_SECRET_NAME"
    else
      echo "TLS secret is missing: $TLS_SECRET_NAME" >&2
      exit 1
    fi
  fi
else
  warn "Offline mode enabled; live TLS secret status is not queried"
fi
echo

echo "==> Rendering manifests to $RENDERED_DIR"
"$ROOT_DIR/scripts/render-prod-public-cutover.sh" \
  --env-file "$ENV_FILE" \
  --output-dir "$RENDERED_DIR"

CONFIG_MANIFEST="$RENDERED_DIR/m5-config-public.yaml"
INGRESS_MANIFEST="$RENDERED_DIR/m5-ingress-public.yaml"
TLS_MANIFEST="$RENDERED_DIR/m5-tls.yaml"

if [[ "$OFFLINE" != "true" ]]; then
  echo "==> Running kubectl server dry-run"
  kubectl apply --dry-run=server -f "$CONFIG_MANIFEST" >/dev/null
  kubectl apply --dry-run=server -f "$INGRESS_MANIFEST" >/dev/null
else
  echo "==> Running offline manifest sanity checks"
  check_rendered_manifest "$CONFIG_MANIFEST"
  check_rendered_manifest "$INGRESS_MANIFEST"
fi

if [[ -f "$TLS_MANIFEST" ]]; then
  if [[ "$OFFLINE" != "true" ]]; then
    kubectl apply --dry-run=server -f "$TLS_MANIFEST" >/dev/null
  else
    check_rendered_manifest "$TLS_MANIFEST"
  fi
elif [[ "$ALLOW_MISSING_TLS" == "true" ]]; then
  warn "Rendered TLS manifest is absent; provide TLS_CERT_B64/TLS_KEY_B64 or existing live secret before real cutover"
else
  echo "Rendered TLS manifest is absent and --allow-missing-tls is not set" >&2
  exit 1
fi

echo "==> Preflight finished"
echo "Rendered dir: $RENDERED_DIR"

if [[ "${#warnings[@]}" -gt 0 ]]; then
  echo
  echo "Warnings:"
  for warning in "${warnings[@]}"; do
    echo "  - $warning"
  done
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> prod public preflight done"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] warning_count=${#warnings[@]}"
