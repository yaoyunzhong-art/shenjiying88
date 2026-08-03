#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/build-m5-tls-secret.sh \
    --cert-file <path> \
    --key-file <path> \
    [--secret-name m5-tls] \
    [--namespace m5] \
    [--output-file <path>]

This command renders a Kubernetes TLS secret manifest using the prepared template.
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE_PATH="$ROOT_DIR/infra/k8s/templates/m5-tls-secret.template.yaml"

CERT_FILE=""
KEY_FILE=""
SECRET_NAME="m5-tls"
NAMESPACE="m5"
OUTPUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cert-file)
      CERT_FILE="${2:-}"
      shift 2
      ;;
    --key-file)
      KEY_FILE="${2:-}"
      shift 2
      ;;
    --secret-name)
      SECRET_NAME="${2:-}"
      shift 2
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --output-file)
      OUTPUT_FILE="${2:-}"
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

if [[ -z "$CERT_FILE" || -z "$KEY_FILE" ]]; then
  echo "Both --cert-file and --key-file are required" >&2
  exit 1
fi

if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" ]]; then
  echo "Certificate file or key file does not exist" >&2
  exit 1
fi

if [[ -z "$OUTPUT_FILE" ]]; then
  OUTPUT_FILE="$ROOT_DIR/infra/k8s/rendered-public/${SECRET_NAME}.yaml"
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

TLS_CERT_B64="$(base64 < "$CERT_FILE" | tr -d '\n')"
TLS_KEY_B64="$(base64 < "$KEY_FILE" | tr -d '\n')"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

sed \
  -e "s|namespace: m5|namespace: $(escape_sed "$NAMESPACE")|g" \
  -e "s|__TLS_SECRET_NAME__|$(escape_sed "$SECRET_NAME")|g" \
  -e "s|__TLS_CERT_B64__|$(escape_sed "$TLS_CERT_B64")|g" \
  -e "s|__TLS_KEY_B64__|$(escape_sed "$TLS_KEY_B64")|g" \
  "$TEMPLATE_PATH" > "$OUTPUT_FILE"

echo "Rendered TLS secret manifest:"
echo "  $OUTPUT_FILE"
