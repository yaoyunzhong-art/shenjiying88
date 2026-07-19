#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/render-prod-public-cutover.sh --env-file <path> [--output-dir <path>]

Required env vars:
  TLS_SECRET_NAME
  ROOT_HOST
  WWW_HOST
  API_HOST
  ADMIN_HOST
  STOREFRONT_HOST
  TOB_HOST
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_WS_URL
  CORS_ORIGIN
  NLB_IP_1
  NLB_IP_2

Optional env vars:
  TLS_CERT_B64
  TLS_KEY_B64
  CERT_MANAGER_SOLVER_MODE
  CERT_MANAGER_ENABLED
  CERT_MANAGER_CLUSTER_ISSUER
  CERT_MANAGER_CERTIFICATE_NAME
  CERT_MANAGER_WAIT_TIMEOUT
  ACME_EMAIL
  ACME_SERVER_URL
  CERT_MANAGER_WEBHOOK_GROUP_NAME
  ALIDNS_REGION
  ALIDNS_SECRET_NAME
  ALIDNS_ACCESS_KEY_ID_KEY
  ALIDNS_ACCESS_KEY_SECRET_KEY
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/infra/k8s/templates"
OUTPUT_DIR="$ROOT_DIR/infra/k8s/rendered-public"
ENV_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
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
  usage >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

CERT_MANAGER_ENABLED="${CERT_MANAGER_ENABLED:-false}"
CERT_MANAGER_SOLVER_MODE="${CERT_MANAGER_SOLVER_MODE:-http01}"

required_vars=(
  TLS_SECRET_NAME
  ROOT_HOST
  WWW_HOST
  API_HOST
  ADMIN_HOST
  STOREFRONT_HOST
  TOB_HOST
  NEXT_PUBLIC_API_URL
  NEXT_PUBLIC_WS_URL
  CORS_ORIGIN
  NLB_IP_1
  NLB_IP_2
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: $var_name" >&2
    exit 1
  fi
done

if [[ "$CERT_MANAGER_ENABLED" == "true" ]]; then
  cert_manager_required_vars=(
    CERT_MANAGER_CLUSTER_ISSUER
    CERT_MANAGER_CERTIFICATE_NAME
    ACME_EMAIL
    ACME_SERVER_URL
    ACME_PRIVATE_KEY_SECRET_NAME
  )

  for var_name in "${cert_manager_required_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      echo "Missing required cert-manager env var: $var_name" >&2
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
fi

mkdir -p "$OUTPUT_DIR"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

render_file() {
  local input_path="$1"
  local output_path="$2"
  local solver_block_file="${3:-}"
  local sed_args=(
    -e "s|__TLS_SECRET_NAME__|$(escape_sed "$TLS_SECRET_NAME")|g"
    -e "s|__ROOT_HOST__|$(escape_sed "$ROOT_HOST")|g"
    -e "s|__WWW_HOST__|$(escape_sed "$WWW_HOST")|g"
    -e "s|__API_HOST__|$(escape_sed "$API_HOST")|g"
    -e "s|__ADMIN_HOST__|$(escape_sed "$ADMIN_HOST")|g"
    -e "s|__STOREFRONT_HOST__|$(escape_sed "$STOREFRONT_HOST")|g"
    -e "s|__TOB_HOST__|$(escape_sed "$TOB_HOST")|g"
    -e "s|__NEXT_PUBLIC_API_URL__|$(escape_sed "$NEXT_PUBLIC_API_URL")|g"
    -e "s|__NEXT_PUBLIC_WS_URL__|$(escape_sed "$NEXT_PUBLIC_WS_URL")|g"
    -e "s|__CORS_ORIGIN__|$(escape_sed "$CORS_ORIGIN")|g"
    -e "s|__NLB_IP_1__|$(escape_sed "$NLB_IP_1")|g"
    -e "s|__NLB_IP_2__|$(escape_sed "$NLB_IP_2")|g"
    -e "s|__CERT_MANAGER_CLUSTER_ISSUER__|$(escape_sed "${CERT_MANAGER_CLUSTER_ISSUER:-}")|g"
    -e "s|__CERT_MANAGER_CERTIFICATE_NAME__|$(escape_sed "${CERT_MANAGER_CERTIFICATE_NAME:-}")|g"
    -e "s|__ACME_EMAIL__|$(escape_sed "${ACME_EMAIL:-}")|g"
    -e "s|__ACME_SERVER_URL__|$(escape_sed "${ACME_SERVER_URL:-}")|g"
    -e "s|__ACME_PRIVATE_KEY_SECRET_NAME__|$(escape_sed "${ACME_PRIVATE_KEY_SECRET_NAME:-}")|g"
    -e "s|__CERT_MANAGER_WEBHOOK_GROUP_NAME__|$(escape_sed "${CERT_MANAGER_WEBHOOK_GROUP_NAME:-}")|g"
    -e "s|__ALIDNS_REGION__|$(escape_sed "${ALIDNS_REGION:-}")|g"
    -e "s|__ALIDNS_SECRET_NAME__|$(escape_sed "${ALIDNS_SECRET_NAME:-}")|g"
    -e "s|__ALIDNS_ACCESS_KEY_ID_KEY__|$(escape_sed "${ALIDNS_ACCESS_KEY_ID_KEY:-}")|g"
    -e "s|__ALIDNS_ACCESS_KEY_SECRET_KEY__|$(escape_sed "${ALIDNS_ACCESS_KEY_SECRET_KEY:-}")|g"
  )

  sed "${sed_args[@]}" "$input_path" > "$output_path"

  if [[ -n "$solver_block_file" ]]; then
    local solver_block
    solver_block="$(sed "${sed_args[@]}" "$solver_block_file")"
    python3 - <<'PY' "$output_path" "$solver_block"
from pathlib import Path
import sys

output_path = Path(sys.argv[1])
solver_block = sys.argv[2]
content = output_path.read_text()
output_path.write_text(content.replace("__CERT_MANAGER_SOLVER_BLOCK__", solver_block))
PY
  fi
}

render_file "$TEMPLATE_DIR/m5-ingress-public.template.yaml" "$OUTPUT_DIR/m5-ingress-public.yaml"
render_file "$TEMPLATE_DIR/m5-config-public.template.yaml" "$OUTPUT_DIR/m5-config-public.yaml"
render_file "$TEMPLATE_DIR/m5-public-dns-records.template.csv" "$OUTPUT_DIR/m5-public-dns-records.csv"

if [[ "$CERT_MANAGER_ENABLED" == "true" ]]; then
  if [[ "$CERT_MANAGER_SOLVER_MODE" == "dns01" ]]; then
    CERT_MANAGER_SOLVER_TEMPLATE="$TEMPLATE_DIR/m5-cert-manager-dns01-alidns-solver.template.yaml"
  else
    CERT_MANAGER_SOLVER_TEMPLATE="$TEMPLATE_DIR/m5-cert-manager-http01-solver.template.yaml"
  fi

  render_file \
    "$TEMPLATE_DIR/m5-cert-manager-clusterissuer.template.yaml" \
    "$OUTPUT_DIR/m5-cert-manager-clusterissuer.yaml" \
    "$CERT_MANAGER_SOLVER_TEMPLATE"
  render_file \
    "$TEMPLATE_DIR/m5-cert-manager-certificate.template.yaml" \
    "$OUTPUT_DIR/m5-cert-manager-certificate.yaml"
else
  rm -f \
    "$OUTPUT_DIR/m5-cert-manager-clusterissuer.yaml" \
    "$OUTPUT_DIR/m5-cert-manager-certificate.yaml"
fi

if [[ -n "${TLS_CERT_B64:-}" && -n "${TLS_KEY_B64:-}" ]]; then
  sed \
    -e "s|__TLS_SECRET_NAME__|$(escape_sed "$TLS_SECRET_NAME")|g" \
    -e "s|__TLS_CERT_B64__|$(escape_sed "$TLS_CERT_B64")|g" \
    -e "s|__TLS_KEY_B64__|$(escape_sed "$TLS_KEY_B64")|g" \
    "$TEMPLATE_DIR/m5-tls-secret.template.yaml" > "$OUTPUT_DIR/m5-tls.yaml"
else
  cp "$TEMPLATE_DIR/m5-tls-secret.template.yaml" "$OUTPUT_DIR/m5-tls-secret.template.yaml"
fi

cat <<EOF
Rendered files:
  $OUTPUT_DIR/m5-ingress-public.yaml
  $OUTPUT_DIR/m5-config-public.yaml
  $OUTPUT_DIR/m5-public-dns-records.csv
EOF

if [[ -f "$OUTPUT_DIR/m5-tls.yaml" ]]; then
  echo "  $OUTPUT_DIR/m5-tls.yaml"
else
  echo "  $OUTPUT_DIR/m5-tls-secret.template.yaml"
fi

if [[ "$CERT_MANAGER_ENABLED" == "true" ]]; then
  echo "  $OUTPUT_DIR/m5-cert-manager-clusterissuer.yaml"
  echo "  $OUTPUT_DIR/m5-cert-manager-certificate.yaml"
fi
