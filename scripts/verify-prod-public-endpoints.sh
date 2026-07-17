#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/verify-prod-public-endpoints.sh --env-file <path> [--use-resolve]

Required env vars:
  API_HOST
  ADMIN_HOST
  STOREFRONT_HOST
  TOB_HOST

Required when --use-resolve is set:
  NLB_IP_1
EOF
}

ENV_FILE=""
USE_RESOLVE="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --use-resolve)
      USE_RESOLVE="true"
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
  usage >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

required_vars=(API_HOST ADMIN_HOST STOREFRONT_HOST TOB_HOST)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: $var_name" >&2
    exit 1
  fi
done

if [[ "$USE_RESOLVE" == "true" && -z "${NLB_IP_1:-}" ]]; then
  echo "NLB_IP_1 is required when --use-resolve is set" >&2
  exit 1
fi

if [[ "$USE_RESOLVE" == "true" ]]; then
  cat <<EOF
Note:
  --use-resolve probes future public hostnames against the current NLB IP.
  Before the ingress host rules are switched from .local to formal domains,
  receiving the fake ingress certificate and HTTP 404 is expected.

EOF
fi

resolve_args() {
  local host="$1"
  if [[ "$USE_RESOLVE" == "true" ]]; then
    printf -- "--resolve %s:443:%s" "$host" "$NLB_IP_1"
  fi
}

check_dns() {
  local host="$1"
  echo "=== DNS $host ==="
  if command -v dig >/dev/null 2>&1; then
    dig +short "$host" || true
  else
    nslookup "$host" 2>/dev/null || true
  fi
  echo
}

check_https_headers() {
  local host="$1"
  echo "=== HTTPS $host ==="
  # shellcheck disable=SC2086
  curl -k -sS -o /dev/null -D - $(resolve_args "$host") "https://$host/" | sed -n '1,12p'
  echo
}

check_api_health() {
  local host="$1"
  echo "=== API health $host ==="
  # shellcheck disable=SC2086
  curl -k -sS $(resolve_args "$host") "https://$host/api/v1/health/ping" | sed -n '1,20p'
  echo
}

check_cert() {
  local host="$1"
  echo "=== Certificate $host ==="
  local target_host="$host"
  if [[ "$USE_RESOLVE" == "true" ]]; then
    target_host="$NLB_IP_1"
  fi
  echo | openssl s_client -servername "$host" -connect "${target_host}:443" 2>/dev/null | openssl x509 -noout -subject -issuer -dates
  echo
}

check_dns "$API_HOST"
check_dns "$ADMIN_HOST"
check_dns "$STOREFRONT_HOST"
check_dns "$TOB_HOST"

check_cert "$API_HOST"
check_https_headers "$API_HOST"
check_api_health "$API_HOST"

check_https_headers "$ADMIN_HOST"
check_https_headers "$STOREFRONT_HOST"
check_https_headers "$TOB_HOST"
