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
declare -a FAILURES=()

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

CERT_MANAGER_ENABLED="${CERT_MANAGER_ENABLED:-false}"

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
echo "[$(date '+%Y-%m-%d %H:%M:%S')] cert_manager_enabled=$CERT_MANAGER_ENABLED"

ensure_m5_kubeconfig "$ROOT_DIR"

add_failure() {
  FAILURES+=("$1")
}

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
    add_failure "DNS has no A record for $host"
    return 0
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
      add_failure "DNS for $host does not point to expected NLB IPs: ${expected[*]} (actual: $(echo "$records" | tr '\n' ' ' | sed 's/[[:space:]]*$//'))"
      return 0
    fi
  fi

  echo "$records" | sed 's/^/A: /'
}

check_dns "$API_HOST"
check_dns "$ADMIN_HOST"
check_dns "$STOREFRONT_HOST"
check_dns "$TOB_HOST"

if [[ -n "$TLS_MANIFEST" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> tls manifest check"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] tls_manifest_path=$TLS_MANIFEST"
  if [[ ! -f "$TLS_MANIFEST" ]]; then
    add_failure "TLS manifest does not exist: $TLS_MANIFEST"
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> live tls secret verify"
  echo "==> Checking TLS secret metadata"
  if ! kubectl -n "$NAMESPACE" get secret "$TLS_SECRET_NAME" >/dev/null 2>&1; then
    add_failure "Live TLS secret is missing: $TLS_SECRET_NAME"
    if [[ "$CERT_MANAGER_ENABLED" == "true" ]]; then
      add_failure "cert-manager TLS is not ready yet; run pnpm g8:tls:provision and wait for $TLS_SECRET_NAME"
    fi
  elif ! bash "$ROOT_DIR/scripts/verify-m5-tls-secret.sh" \
    --namespace "$NAMESPACE" \
    --secret-name "$TLS_SECRET_NAME" \
    --env-file "$ENV_FILE" >/dev/null; then
    add_failure "Live TLS secret SAN does not cover api/admin/store/tob hosts: $TLS_SECRET_NAME"
  fi
fi

if [[ "${#FAILURES[@]}" -gt 0 ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> formal window readiness blocked"
  for failure in "${FAILURES[@]}"; do
    echo " - $failure"
  done
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> formal window readiness done"
