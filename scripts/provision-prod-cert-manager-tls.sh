#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/provision-prod-cert-manager-tls.sh \
    --env-file <path> \
    [--namespace m5] \
    [--rendered-dir <path>] \
    [--certificate-timeout 1200s] \
    [--kubectl-dry-run server|client] \
    [--offline] \
    [--log-file <path>]

Behavior:
  1. Render cert-manager ClusterIssuer and Certificate manifests
  2. Apply them to mint the live m5-tls secret
  3. Wait for Certificate Ready=True
  4. Verify SAN coverage against api/admin/store/tob hosts
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"

ENV_FILE=""
NAMESPACE="m5"
RENDERED_DIR="$ROOT_DIR/infra/k8s/rendered-cert-manager"
CERTIFICATE_TIMEOUT=""
KUBECTL_DRY_RUN=""
OFFLINE="false"
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
    --certificate-timeout)
      CERTIFICATE_TIMEOUT="${2:-}"
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

CERT_MANAGER_ENABLED="${CERT_MANAGER_ENABLED:-false}"
CERT_MANAGER_SOLVER_MODE="${CERT_MANAGER_SOLVER_MODE:-http01}"
CERTIFICATE_TIMEOUT="${CERTIFICATE_TIMEOUT:-${CERT_MANAGER_WAIT_TIMEOUT:-1200s}}"

if [[ "$CERT_MANAGER_ENABLED" != "true" ]]; then
  echo "CERT_MANAGER_ENABLED=true is required in the env file" >&2
  exit 1
fi

required_vars=(
  TLS_SECRET_NAME
  API_HOST
  ADMIN_HOST
  STOREFRONT_HOST
  TOB_HOST
  CERT_MANAGER_CLUSTER_ISSUER
  CERT_MANAGER_CERTIFICATE_NAME
  ACME_EMAIL
  ACME_SERVER_URL
  ACME_PRIVATE_KEY_SECRET_NAME
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: $var_name" >&2
    exit 1
  fi
done

if [[ "$CERT_MANAGER_SOLVER_MODE" == "dns01" ]]; then
  dns01_required_vars=(
    CERT_MANAGER_WEBHOOK_GROUP_NAME
    ALIDNS_REGION
    ALIDNS_SECRET_NAME
    ALIDNS_ACCESS_KEY_ID_KEY
    ALIDNS_ACCESS_KEY_SECRET_KEY
  )

  for var_name in "${dns01_required_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      echo "Missing required DNS-01 env var: $var_name" >&2
      exit 1
    fi
  done
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> cert-manager tls provision start"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] env_file=$ENV_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] namespace=$NAMESPACE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] rendered_dir=$RENDERED_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] certificate_timeout=$CERTIFICATE_TIMEOUT"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] kubectl_dry_run=${KUBECTL_DRY_RUN:-none}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] offline=$OFFLINE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] cert_manager_solver_mode=$CERT_MANAGER_SOLVER_MODE"

echo "==> Rendering cert-manager manifests"
"$ROOT_DIR/scripts/render-prod-public-cutover.sh" \
  --env-file "$ENV_FILE" \
  --output-dir "$RENDERED_DIR"

CLUSTER_ISSUER_MANIFEST="$RENDERED_DIR/m5-cert-manager-clusterissuer.yaml"
CERTIFICATE_MANIFEST="$RENDERED_DIR/m5-cert-manager-certificate.yaml"

for manifest in "$CLUSTER_ISSUER_MANIFEST" "$CERTIFICATE_MANIFEST"; do
  if [[ ! -f "$manifest" ]]; then
    echo "Rendered cert-manager manifest is missing: $manifest" >&2
    exit 1
  fi
done

dry_run_args=()
if [[ -n "$KUBECTL_DRY_RUN" ]]; then
  dry_run_args=(--dry-run="$KUBECTL_DRY_RUN")
fi

kubectl_apply_manifest() {
  local manifest_path="$1"
  if [[ "${#dry_run_args[@]}" -gt 0 ]]; then
    kubectl apply "${dry_run_args[@]}" -f "$manifest_path"
  else
    kubectl apply -f "$manifest_path"
  fi
}

check_cert_manager_prereqs() {
  local missing_items=()
  local required_crds=(
    certificates.cert-manager.io
    certificaterequests.cert-manager.io
    clusterissuers.cert-manager.io
    orders.acme.cert-manager.io
    challenges.acme.cert-manager.io
  )

  for crd_name in "${required_crds[@]}"; do
    if ! kubectl get crd "$crd_name" >/dev/null 2>&1; then
      missing_items+=("Missing CRD: $crd_name")
    fi
  done

  if ! kubectl get namespace cert-manager >/dev/null 2>&1; then
    missing_items+=("Missing namespace: cert-manager")
  else
    local required_deployments=(
      cert-manager
      cert-manager-webhook
      cert-manager-cainjector
    )

    for deployment_name in "${required_deployments[@]}"; do
      if ! kubectl -n cert-manager get "deployment/$deployment_name" >/dev/null 2>&1; then
        missing_items+=("Missing deployment: cert-manager/$deployment_name")
      fi
    done
  fi

  if [[ "${#missing_items[@]}" -gt 0 ]]; then
    echo "cert-manager base is not ready for TLS provisioning." >&2
    for item in "${missing_items[@]}"; do
      echo " - $item" >&2
    done
    echo "Fix the cert-manager base first, or fall back to manual PEM -> m5-tls secret delivery." >&2
    exit 1
  fi

  echo "==> cert-manager base check passed"
}

check_dns01_prereqs() {
  if ! kubectl -n cert-manager get secret "$ALIDNS_SECRET_NAME" >/dev/null 2>&1; then
    echo "AliDNS credential secret is missing: cert-manager/$ALIDNS_SECRET_NAME" >&2
    echo "Create it first via scripts/create-alidns-secret.sh" >&2
    exit 1
  fi

  if ! kubectl -n cert-manager get deployment/alidns-webhook >/dev/null 2>&1; then
    echo "AliDNS webhook deployment is missing: cert-manager/alidns-webhook" >&2
    echo "Install it first via scripts/install-alidns-webhook.sh" >&2
    exit 1
  fi

  kubectl -n cert-manager rollout status deployment/alidns-webhook --timeout=300s >/dev/null
  echo "==> DNS-01 webhook check passed"
}

echo "==> Applying ClusterIssuer and Certificate"
if [[ "$OFFLINE" == "true" ]]; then
  echo "Offline mode enabled; manifests were rendered only"
else
  echo "==> Checking cert-manager base"
  check_cert_manager_prereqs
  if [[ "$CERT_MANAGER_SOLVER_MODE" == "dns01" ]]; then
    echo "==> Checking DNS-01 webhook prerequisites"
    check_dns01_prereqs
  fi
  kubectl_apply_manifest "$CLUSTER_ISSUER_MANIFEST"
  kubectl_apply_manifest "$CERTIFICATE_MANIFEST"
fi

if [[ "$OFFLINE" != "true" && -z "$KUBECTL_DRY_RUN" ]]; then
  echo "==> Waiting for Certificate Ready=True"
  kubectl -n "$NAMESPACE" wait \
    --for=condition=Ready \
    "certificate/$CERT_MANAGER_CERTIFICATE_NAME" \
    --timeout="$CERTIFICATE_TIMEOUT"

  echo "==> Verifying live TLS secret"
  kubectl -n "$NAMESPACE" get secret "$TLS_SECRET_NAME" >/dev/null
  bash "$ROOT_DIR/scripts/verify-m5-tls-secret.sh" \
    --namespace "$NAMESPACE" \
    --secret-name "$TLS_SECRET_NAME" \
    --env-file "$ENV_FILE"
fi

echo
echo "==> cert-manager tls provision finished"
echo "cluster_issuer_manifest=$CLUSTER_ISSUER_MANIFEST"
echo "certificate_manifest=$CERTIFICATE_MANIFEST"
echo "next_command=pnpm g8:recheck"
