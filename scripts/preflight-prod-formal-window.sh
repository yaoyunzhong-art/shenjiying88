#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/preflight-prod-formal-window.sh \
    --env-file <path> \
    [--namespace m5] \
    [--tls-manifest <path>]

Behavior:
  1. Validate formal DNS records for api/admin/store/tob hosts
  2. Validate live m5-tls secret, or validate the provided TLS manifest
  3. Fail fast before a real production apply window starts
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"

ENV_FILE=""
NAMESPACE="m5"
TLS_MANIFEST=""

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
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --tls-manifest)
      TLS_MANIFEST="${2:-}"
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
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

required_vars=(API_HOST ADMIN_HOST STOREFRONT_HOST TOB_HOST TLS_SECRET_NAME)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: $var_name" >&2
    exit 1
  fi
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> formal window readiness start"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] env_file=$ENV_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] namespace=$NAMESPACE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] tls_manifest=${TLS_MANIFEST:-live-secret}"

ensure_m5_kubeconfig "$ROOT_DIR"

get_a_records() {
  local host="$1"
  if command -v dig >/dev/null 2>&1; then
    dig +short A "$host" | sed '/^$/d'
  else
    nslookup "$host" 2>/dev/null | awk '/^Address: / { print $2 }' | sed '/^$/d'
  fi
}

check_dns() {
  local host="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> dns check $host"
  local records
  records="$(get_a_records "$host" || true)"
  if [[ -z "$records" ]]; then
    echo "DNS has no A record for $host"
    return 1
  fi

  local expected=()
  [[ -n "${NLB_IP_1:-}" ]] && expected+=("$NLB_IP_1")
  [[ -n "${NLB_IP_2:-}" ]] && expected+=("$NLB_IP_2")

  if [[ "${#expected[@]}" -gt 0 ]]; then
    local matched="false"
    while IFS= read -r record; do
      for ip in "${expected[@]}"; do
        if [[ "$record" == "$ip" ]]; then
          matched="true"
        fi
      done
    done <<< "$records"

    if [[ "$matched" != "true" ]]; then
      echo "DNS for $host does not point to expected NLB IPs: ${expected[*]}"
      echo "$records"
      return 1
    fi
  fi

  echo "$records"
}

check_dns "$API_HOST"
check_dns "$ADMIN_HOST"
check_dns "$STOREFRONT_HOST"
check_dns "$TOB_HOST"

if [[ -n "$TLS_MANIFEST" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> tls manifest check"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] tls_manifest_path=$TLS_MANIFEST"
  if [[ ! -f "$TLS_MANIFEST" ]]; then
    echo "TLS manifest does not exist: $TLS_MANIFEST"
    exit 1
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> live tls secret verify"
  echo "==> Checking TLS secret metadata"
  kubectl -n "$NAMESPACE" get secret "$TLS_SECRET_NAME" >/dev/null
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> formal window readiness done"
