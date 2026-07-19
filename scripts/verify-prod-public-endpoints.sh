#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/verify-prod-public-endpoints.sh \
    --env-file <path> \
    [--use-resolve] \
    [--strict] \
    [--log-file <path>]
EOF
}

ENV_FILE=""
USE_RESOLVE="false"
STRICT="false"
LOG_FILE=""

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
    --strict)
      STRICT="true"
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

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public endpoint verify start"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] env_file=$ENV_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] use_resolve=$USE_RESOLVE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] strict=$STRICT"

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

python_https_probe() {
  local mode="$1"
  local url="$2"
  local host="$3"
  local connect_host="$4"
  python3 - "$mode" "$url" "$host" "$connect_host" <<'PY'
import http.client
import ssl
import sys
import urllib.parse

mode, url, host, connect_host = sys.argv[1:5]
parsed = urllib.parse.urlparse(url)
path = parsed.path or "/"
if parsed.query:
    path = f"{path}?{parsed.query}"

context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

conn = http.client.HTTPSConnection(connect_host, 443, context=context, timeout=8)
conn.request("GET", path, headers={"Host": host, "User-Agent": "m5-preflight/python-probe"})
resp = conn.getresponse()

print(f"HTTP/1.1 {resp.status} {resp.reason}")
for key, value in resp.getheaders()[:12]:
    print(f"{key}: {value}")

if mode == "body":
    body = resp.read(4096).decode("utf-8", errors="replace")
    if body:
        print()
        print(body)
PY
}

curl_failed_with_libressl() {
  local output="$1"
  [[ "$output" == *"LibreSSL SSL_connect: SSL_ERROR_SYSCALL"* ]]
}

warn() {
  echo "WARN: $1"
  if [[ "$STRICT" == "true" ]]; then
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
  fi
}

FAILURE_COUNT=0

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
  local url="https://$host/"
  local connect_host="$host"
  if [[ "$USE_RESOLVE" == "true" ]]; then
    connect_host="$NLB_IP_1"
  fi
  echo "=== HTTPS $host ==="
  if ! output="$(curl -k -sS -o /dev/null -D - $(resolve_args "$host") "$url" 2>&1)"; then
    if command -v python3 >/dev/null 2>&1 && curl_failed_with_libressl "$output"; then
      echo "INFO: curl/LibreSSL handshake failed for $host, fallback to python ssl probe"
      if ! output="$(python_https_probe headers "$url" "$host" "$connect_host" 2>&1)"; then
        echo "$output"
        warn "HTTPS probe failed for $host"
        echo
        return 0
      fi
    else
      echo "$output"
      warn "HTTPS probe failed for $host"
      echo
      return 0
    fi
  fi
  printf '%s\n' "$output" | sed -n '1,12p'
  status_line="$(printf '%s\n' "$output" | sed -n '1p')"
  status_code="$(printf '%s\n' "$status_line" | awk '{print $2}')"
  if [[ "$host" == "${API_HOST:-}" && "$status_code" == "404" ]]; then
    :
  elif [[ -n "$status_code" && ! "$status_code" =~ ^2[0-9][0-9]$ && ! "$status_code" =~ ^3[0-9][0-9]$ ]]; then
    warn "HTTPS status is not 2xx/3xx for $host: $status_line"
  fi
  echo
}

check_api_health() {
  local host="$1"
  local url="https://$host/api/v1/health/ping"
  local connect_host="$host"
  if [[ "$USE_RESOLVE" == "true" ]]; then
    connect_host="$NLB_IP_1"
  fi
  echo "=== API health $host ==="
  if ! output="$(curl -k -sS -w '\nHTTP_STATUS:%{http_code}\n' $(resolve_args "$host") "$url" 2>&1)"; then
    if command -v python3 >/dev/null 2>&1 && curl_failed_with_libressl "$output"; then
      echo "INFO: curl/LibreSSL handshake failed for $host, fallback to python ssl probe"
      if ! output="$(python_https_probe body "$url" "$host" "$connect_host" 2>&1)"; then
        echo "$output"
        warn "API health probe failed for $host"
        echo
        return 0
      fi
      output="$output"$'\n'"HTTP_STATUS:$(printf '%s\n' "$output" | awk 'NR==1 {print $2}')"
    else
      echo "$output"
      warn "API health probe failed for $host"
      echo
      return 0
    fi
  fi
  printf '%s\n' "$output" | sed -n '1,20p'
  status_code="$(printf '%s\n' "$output" | awk -F: '/^HTTP_STATUS:/ {print $2}' | tail -n 1)"
  if [[ "$status_code" != "200" ]]; then
    warn "API health status is not 200 for $host: ${status_code:-unknown}"
  fi
  echo
}

check_cert() {
  local host="$1"
  echo "=== Certificate $host ==="
  local target_host="$host"
  if [[ "$USE_RESOLVE" == "true" ]]; then
    target_host="$NLB_IP_1"
  fi
  if ! output="$(echo | openssl s_client -servername "$host" -connect "${target_host}:443" 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>&1)"; then
    echo "$output"
    warn "Certificate probe failed for $host"
    echo
    return 0
  fi
  printf '%s\n' "$output"
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

if [[ "$STRICT" == "true" && "$FAILURE_COUNT" -gt 0 ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public endpoint verify failed, count=$FAILURE_COUNT" >&2
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public endpoint verify done"
