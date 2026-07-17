#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/apply-prod-public-cutover.sh \
    --env-file <path> \
    [--rendered-dir <path>] \
    [--namespace m5] \
    [--tls-manifest <path>] \
    [--backup-dir <path>] \
    [--kubectl-dry-run client|server] \
    [--offline] \
    [--skip-tls-check] \
    [--skip-restart] \
    [--skip-rollout-wait]

Behavior:
  1. Render final public manifests from the shared template set
  2. Backup the live Ingress and ConfigMap before mutation
  3. Apply TLS Secret (if manifest is provided or rendered)
  4. Apply ConfigMap and Ingress in the same window
  5. Restart the four production Deployments
  6. Wait for rollout unless --skip-rollout-wait is set

Dry-run behavior:
  --kubectl-dry-run client|server validates manifests through kubectl without
  persisting changes. This mode still renders manifests and captures live
  backups, but skips rollout restart by default.

Offline behavior:
  --offline skips live cluster backup/resource checks and falls back to local
  rendered-manifest sanity checks. It must not be used as a substitute for
  cluster-connected server dry-run before the real cutover window.
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"
ENV_FILE=""
RENDERED_DIR="$ROOT_DIR/infra/k8s/rendered-public"
NAMESPACE="m5"
TLS_MANIFEST=""
BACKUP_DIR=""
KUBECTL_DRY_RUN=""
OFFLINE="false"
SKIP_TLS_CHECK="false"
SKIP_RESTART="false"
SKIP_ROLLOUT_WAIT="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --rendered-dir)
      RENDERED_DIR="${2:-}"
      shift 2
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --tls-manifest)
      TLS_MANIFEST="${2:-}"
      shift 2
      ;;
    --backup-dir)
      BACKUP_DIR="${2:-}"
      shift 2
      ;;
    --kubectl-dry-run)
      KUBECTL_DRY_RUN="${2:-}"
      shift 2
      ;;
    --offline)
      OFFLINE="true"
      shift
      ;;
    --skip-tls-check)
      SKIP_TLS_CHECK="true"
      shift
      ;;
    --skip-restart)
      SKIP_RESTART="true"
      shift
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

if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Missing --env-file or file does not exist" >&2
  exit 1
fi

if [[ -n "$KUBECTL_DRY_RUN" && "$KUBECTL_DRY_RUN" != "client" && "$KUBECTL_DRY_RUN" != "server" ]]; then
  echo "--kubectl-dry-run must be either client or server" >&2
  exit 1
fi

if [[ "$OFFLINE" == "true" && -n "$KUBECTL_DRY_RUN" && "$KUBECTL_DRY_RUN" != "client" ]]; then
  echo "--offline only supports --kubectl-dry-run client" >&2
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

if [[ -z "${TLS_SECRET_NAME:-}" ]]; then
  echo "TLS_SECRET_NAME is required in the env file" >&2
  exit 1
fi

kubectl_apply_args=()
if [[ -n "$KUBECTL_DRY_RUN" ]]; then
  kubectl_apply_args+=(--dry-run="$KUBECTL_DRY_RUN")
  SKIP_RESTART="true"
  SKIP_ROLLOUT_WAIT="true"
fi

if [[ "$OFFLINE" == "true" ]]; then
  SKIP_RESTART="true"
  SKIP_ROLLOUT_WAIT="true"
fi

echo "==> Rendering public cutover manifests"
"$ROOT_DIR/scripts/render-prod-public-cutover.sh" \
  --env-file "$ENV_FILE" \
  --output-dir "$RENDERED_DIR"

INGRESS_MANIFEST="$RENDERED_DIR/m5-ingress-public.yaml"
CONFIG_MANIFEST="$RENDERED_DIR/m5-config-public.yaml"
RENDERED_TLS_MANIFEST="$RENDERED_DIR/m5-tls-secret.yaml"

for manifest in "$INGRESS_MANIFEST" "$CONFIG_MANIFEST"; do
  if [[ ! -f "$manifest" ]]; then
    echo "Rendered manifest is missing: $manifest" >&2
    exit 1
  fi
done

check_rendered_manifest() {
  local manifest_path="$1"
  if grep -q '__[A-Z0-9_]\+__' "$manifest_path"; then
    echo "Rendered manifest still contains placeholder tokens: $manifest_path" >&2
    exit 1
  fi
}

check_rendered_manifest "$CONFIG_MANIFEST"
check_rendered_manifest "$INGRESS_MANIFEST"

if [[ "$OFFLINE" != "true" ]]; then
  if [[ -z "$BACKUP_DIR" ]]; then
    BACKUP_DIR="$ROOT_DIR/infra/k8s/backups/public-cutover/$(date +%Y%m%d-%H%M%S)"
  fi
  mkdir -p "$BACKUP_DIR"

  echo "==> Backing up live resources to $BACKUP_DIR"
  kubectl -n "$NAMESPACE" get ingress m5-ingress -o yaml > "$BACKUP_DIR/m5-ingress.live.yaml"
  kubectl -n "$NAMESPACE" get configmap m5-config -o yaml > "$BACKUP_DIR/m5-config.live.yaml"
else
  BACKUP_DIR="offline-skip"
  echo "==> Offline mode: skipping live resource backup"
fi

if [[ -z "$TLS_MANIFEST" && -f "$RENDERED_TLS_MANIFEST" ]]; then
  TLS_MANIFEST="$RENDERED_TLS_MANIFEST"
fi

if [[ -n "$TLS_MANIFEST" ]]; then
  if [[ ! -f "$TLS_MANIFEST" ]]; then
    echo "TLS manifest does not exist: $TLS_MANIFEST" >&2
    exit 1
  fi
  echo "==> Applying TLS secret manifest"
  kubectl apply "${kubectl_apply_args[@]}" -f "$TLS_MANIFEST"
elif [[ "$SKIP_TLS_CHECK" == "true" ]]; then
  echo "==> Skipping TLS secret existence check"
elif [[ "$OFFLINE" == "true" ]]; then
  echo "==> Offline mode: skipping live TLS secret existence check"
else
  echo "==> Checking existing TLS secret: $TLS_SECRET_NAME"
  kubectl -n "$NAMESPACE" get secret "$TLS_SECRET_NAME" >/dev/null
fi

if [[ "$OFFLINE" == "true" ]]; then
  echo "==> Offline mode: manifest sanity checks passed"
else
  echo "==> Applying ConfigMap and Ingress"
  kubectl apply "${kubectl_apply_args[@]}" -f "$CONFIG_MANIFEST"
  kubectl apply "${kubectl_apply_args[@]}" -f "$INGRESS_MANIFEST"
fi

deployments=(
  m5-api
  m5-admin-web
  m5-storefront-web
  m5-tob-web
)

if [[ "$SKIP_RESTART" != "true" ]]; then
  echo "==> Restarting production workloads"
  for deployment in "${deployments[@]}"; do
    kubectl -n "$NAMESPACE" rollout restart "deployment/$deployment"
  done
else
  echo "==> Skipping production workload restart"
fi

if [[ "$SKIP_ROLLOUT_WAIT" != "true" && "$SKIP_RESTART" != "true" ]]; then
  echo "==> Waiting for rollout completion"
  for deployment in "${deployments[@]}"; do
    kubectl -n "$NAMESPACE" rollout status "deployment/$deployment" --timeout=300s
  done
fi

cat <<EOF
==> Public cutover apply finished
Backup dir:
  $BACKUP_DIR

Suggested verification:
  scripts/verify-prod-public-endpoints.sh --env-file $ENV_FILE

Quick cluster checks:
  kubectl -n $NAMESPACE get ingress m5-ingress
  kubectl -n $NAMESPACE get secret $TLS_SECRET_NAME

Execution mode:
  kubectl dry-run = ${KUBECTL_DRY_RUN:-disabled}
  offline         = $OFFLINE
  skip tls check = $SKIP_TLS_CHECK
  skip restart   = $SKIP_RESTART
EOF
