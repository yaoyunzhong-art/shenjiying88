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
    [--kubectl-dry-run server|client] \
    [--skip-tls-check] \
    [--skip-restart] \
    [--skip-rollout-wait] \
    [--offline] \
    [--log-file <path>]
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
SKIP_TLS_CHECK="false"
SKIP_RESTART="false"
SKIP_ROLLOUT_WAIT="false"
OFFLINE="false"
LOG_FILE=""

CURRENT_SCRIPT="$(basename "$0")"

on_error() {
  local exit_code="$1"
  local line_no="$2"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> cutover failure"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] script=$CURRENT_SCRIPT"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] line=$line_no"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] exit_code=$exit_code"
}

trap 'on_error $? $LINENO' ERR

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
    --offline)
      OFFLINE="true"
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

if [[ -z "${TLS_SECRET_NAME:-}" ]]; then
  echo "TLS_SECRET_NAME is required in the env file" >&2
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover apply start"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] env_file=$ENV_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] rendered_dir=$RENDERED_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] namespace=$NAMESPACE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] tls_manifest=${TLS_MANIFEST:-auto}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] backup_dir=${BACKUP_DIR:-auto}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] kubectl_dry_run=${KUBECTL_DRY_RUN:-none}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] offline=$OFFLINE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] skip_tls_check=$SKIP_TLS_CHECK"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] skip_restart=$SKIP_RESTART"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] skip_rollout_wait=$SKIP_ROLLOUT_WAIT"

echo "==> Rendering public cutover manifests"
"$ROOT_DIR/scripts/render-prod-public-cutover.sh" \
  --env-file "$ENV_FILE" \
  --output-dir "$RENDERED_DIR"

INGRESS_MANIFEST="$RENDERED_DIR/m5-ingress-public.yaml"
CONFIG_MANIFEST="$RENDERED_DIR/m5-config-public.yaml"
RENDERED_TLS_MANIFEST="$RENDERED_DIR/m5-tls.yaml"

for manifest in "$INGRESS_MANIFEST" "$CONFIG_MANIFEST"; do
  if [[ ! -f "$manifest" ]]; then
    echo "Rendered manifest is missing: $manifest" >&2
    exit 1
  fi
done

if [[ -z "$BACKUP_DIR" ]]; then
  BACKUP_DIR="$ROOT_DIR/infra/k8s/backups/public-cutover/$(date +%Y%m%d-%H%M%S)"
fi
mkdir -p "$BACKUP_DIR"

if [[ "$OFFLINE" != "true" ]]; then
  echo "==> Backing up live resources to $BACKUP_DIR"
  kubectl -n "$NAMESPACE" get ingress m5-ingress -o yaml > "$BACKUP_DIR/m5-ingress.live.yaml"
  kubectl -n "$NAMESPACE" get configmap m5-config -o yaml > "$BACKUP_DIR/m5-config.live.yaml"
else
  echo "==> Offline mode enabled; skipping live resource backup"
fi

if [[ -z "$TLS_MANIFEST" && -f "$RENDERED_TLS_MANIFEST" ]]; then
  TLS_MANIFEST="$RENDERED_TLS_MANIFEST"
fi

dry_run_args=()
if [[ -n "$KUBECTL_DRY_RUN" ]]; then
  dry_run_args=(--dry-run="$KUBECTL_DRY_RUN")
  SKIP_RESTART="true"
fi

if [[ "$SKIP_TLS_CHECK" == "true" ]]; then
  echo "==> Skipping TLS secret existence check"
elif [[ -n "$TLS_MANIFEST" ]]; then
  if [[ ! -f "$TLS_MANIFEST" ]]; then
    echo "TLS manifest does not exist: $TLS_MANIFEST" >&2
    exit 1
  fi
  echo "==> Applying TLS secret manifest"
  if [[ "$OFFLINE" == "true" ]]; then
    echo "Offline mode does not apply TLS manifest"
  else
    kubectl apply "${dry_run_args[@]}" -f "$TLS_MANIFEST"
  fi
else
  echo "==> Checking existing TLS secret: $TLS_SECRET_NAME"
  if [[ "$OFFLINE" != "true" ]]; then
    kubectl -n "$NAMESPACE" get secret "$TLS_SECRET_NAME" >/dev/null
  fi
fi

echo "==> Applying ConfigMap and Ingress"
if [[ "$OFFLINE" == "true" ]]; then
  echo "Offline mode enabled; manifest rendering only"
else
  kubectl apply "${dry_run_args[@]}" -f "$CONFIG_MANIFEST"
  kubectl apply "${dry_run_args[@]}" -f "$INGRESS_MANIFEST"
fi

deployments=(
  m5-api
  m5-admin-web
  m5-storefront-web
  m5-tob-web
)

if [[ "$SKIP_RESTART" == "true" ]]; then
  echo "==> Skipping production workload restart"
else
  echo "==> Restarting production workloads"
  for deployment in "${deployments[@]}"; do
    kubectl -n "$NAMESPACE" rollout restart "deployment/$deployment"
  done
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
  kubectl dry-run = ${KUBECTL_DRY_RUN:-none}
  offline         = $OFFLINE
  skip tls check  = $SKIP_TLS_CHECK
  skip restart    = $SKIP_RESTART
EOF

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover apply done"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] final_backup_dir=$BACKUP_DIR"
