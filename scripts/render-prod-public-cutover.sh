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

mkdir -p "$OUTPUT_DIR"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

render_file() {
  local input_path="$1"
  local output_path="$2"

  sed \
    -e "s|__TLS_SECRET_NAME__|$(escape_sed "$TLS_SECRET_NAME")|g" \
    -e "s|__ROOT_HOST__|$(escape_sed "$ROOT_HOST")|g" \
    -e "s|__WWW_HOST__|$(escape_sed "$WWW_HOST")|g" \
    -e "s|__API_HOST__|$(escape_sed "$API_HOST")|g" \
    -e "s|__ADMIN_HOST__|$(escape_sed "$ADMIN_HOST")|g" \
    -e "s|__STOREFRONT_HOST__|$(escape_sed "$STOREFRONT_HOST")|g" \
    -e "s|__TOB_HOST__|$(escape_sed "$TOB_HOST")|g" \
    -e "s|__NEXT_PUBLIC_API_URL__|$(escape_sed "$NEXT_PUBLIC_API_URL")|g" \
    -e "s|__NEXT_PUBLIC_WS_URL__|$(escape_sed "$NEXT_PUBLIC_WS_URL")|g" \
    -e "s|__CORS_ORIGIN__|$(escape_sed "$CORS_ORIGIN")|g" \
    -e "s|__NLB_IP_1__|$(escape_sed "$NLB_IP_1")|g" \
    -e "s|__NLB_IP_2__|$(escape_sed "$NLB_IP_2")|g" \
    "$input_path" > "$output_path"
}

render_file "$TEMPLATE_DIR/m5-ingress-public.template.yaml" "$OUTPUT_DIR/m5-ingress-public.yaml"
render_file "$TEMPLATE_DIR/m5-config-public.template.yaml" "$OUTPUT_DIR/m5-config-public.yaml"
render_file "$TEMPLATE_DIR/m5-public-dns-records.template.csv" "$OUTPUT_DIR/m5-public-dns-records.csv"

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
