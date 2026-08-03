#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/verify-m5-tls-secret.sh \
    [--namespace m5] \
    [--secret-name m5-tls] \
    [--env-file <path>] \
    [--show-full-cert]

Behavior:
  1. Auto-discovers the production kubeconfig
  2. Checks that the TLS secret exists and is of type kubernetes.io/tls
  3. Prints certificate subject, issuer, validity and SAN entries
  4. If --env-file is provided, verifies that the certificate SANs cover:
     API_HOST, ADMIN_HOST, STOREFRONT_HOST, TOB_HOST
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"

NAMESPACE="m5"
SECRET_NAME="m5-tls"
ENV_FILE=""
SHOW_FULL_CERT="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --secret-name)
      SECRET_NAME="${2:-}"
      shift 2
      ;;
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --show-full-cert)
      SHOW_FULL_CERT="true"
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

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl is required" >&2
  exit 1
fi

ensure_m5_kubeconfig "$ROOT_DIR"

if [[ -n "$ENV_FILE" && ! -f "$ENV_FILE" ]]; then
  echo "The env file does not exist: $ENV_FILE" >&2
  exit 1
fi

EXPECTED_HOSTS=()
if [[ -n "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a

  required_env_vars=(API_HOST ADMIN_HOST STOREFRONT_HOST TOB_HOST)
  for var_name in "${required_env_vars[@]}"; do
    if [[ -z "${!var_name:-}" ]]; then
      echo "Missing required env var in env file: $var_name" >&2
      exit 1
    fi
  done

  EXPECTED_HOSTS=("$API_HOST" "$ADMIN_HOST" "$STOREFRONT_HOST" "$TOB_HOST")
fi

echo "==> Checking TLS secret metadata"
secret_type="$(kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.type}')"
if [[ "$secret_type" != "kubernetes.io/tls" ]]; then
  echo "Unexpected secret type: $secret_type" >&2
  exit 1
fi
echo "Secret: $NAMESPACE/$SECRET_NAME"
echo "Type:   $secret_type"
echo

tmp_cert="$(mktemp)"
cleanup() {
  rm -f "$tmp_cert"
}
trap cleanup EXIT

kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.tls\.crt}' | base64 --decode > "$tmp_cert"

echo "==> Certificate summary"
openssl x509 -in "$tmp_cert" -noout -subject -issuer -dates
echo

echo "==> Certificate SAN"
san_output="$(openssl x509 -in "$tmp_cert" -noout -ext subjectAltName 2>/dev/null || true)"
if [[ -n "$san_output" ]]; then
  printf '%s\n' "$san_output"
else
  echo "No SAN extension found"
fi
echo

if [[ "$SHOW_FULL_CERT" == "true" ]]; then
  echo "==> Full certificate"
  openssl x509 -in "$tmp_cert" -text -noout
  echo
fi

if [[ "${#EXPECTED_HOSTS[@]}" -gt 0 ]]; then
  echo "==> SAN coverage check"
  san_entries=()
  while IFS= read -r san_entry; do
    san_entry="${san_entry#DNS:}"
    san_entry="${san_entry%,}"
    if [[ -n "$san_entry" ]]; then
      san_entries+=("$san_entry")
    fi
  done < <(grep -o 'DNS:[^,[:space:]]*' <<<"$san_output" || true)

  host_matches_san() {
    local host="$1"
    local san_entry="$2"
    if [[ "$host" == "$san_entry" ]]; then
      return 0
    fi
    if [[ "$san_entry" == \*.* ]]; then
      local suffix="${san_entry#*.}"
      if [[ "$host" == *."$suffix" && "$host" != "$suffix" ]]; then
        local prefix="${host%.$suffix}"
        if [[ -n "$prefix" && "$prefix" != *.* ]]; then
          return 0
        fi
      fi
    fi
    return 1
  }

  missing_hosts=()
  for host in "${EXPECTED_HOSTS[@]}"; do
    covered="false"
    for san_entry in "${san_entries[@]}"; do
      if host_matches_san "$host" "$san_entry"; then
        covered="true"
        break
      fi
    done
    if [[ "$covered" == "true" ]]; then
      echo "OK   $host"
    else
      echo "MISS $host"
      missing_hosts+=("$host")
    fi
  done
  echo

  if [[ "${#missing_hosts[@]}" -gt 0 ]]; then
    echo "The certificate SAN does not cover all required hosts." >&2
    exit 1
  fi
fi

echo "==> TLS secret verification finished"
