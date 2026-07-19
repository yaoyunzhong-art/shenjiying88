#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/run-g8-recheck.sh \
    --env-file <path> \
    [--release-env-file <path>] \
    [--namespace m5] \
    [--window-id <id>] \
    [--log-root infra/k8s/cutover-logs] \
    [--cert-file <path> --key-file <path>] \
    [--tls-manifest <path>]

Behavior:
  1. Capture current DNS answers for api/admin/store/tob hosts
  2. Capture current live TLS secret status
  3. Run scripts/run-g8-formal-window-ready.sh
  4. Write a compact recheck summary into the same window log directory
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV_FILE=""
RELEASE_ENV_FILE=""
NAMESPACE="m5"
WINDOW_ID="formal-window-$(date +%Y%m%d-%H%M%S)"
LOG_ROOT="$ROOT_DIR/infra/k8s/cutover-logs"
CERT_FILE=""
KEY_FILE=""
TLS_MANIFEST=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --release-env-file)
      RELEASE_ENV_FILE="${2:-}"
      shift 2
      ;;
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --window-id)
      WINDOW_ID="${2:-}"
      shift 2
      ;;
    --log-root)
      LOG_ROOT="${2:-}"
      shift 2
      ;;
    --cert-file)
      CERT_FILE="${2:-}"
      shift 2
      ;;
    --key-file)
      KEY_FILE="${2:-}"
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

if [[ -n "$RELEASE_ENV_FILE" && ! -f "$RELEASE_ENV_FILE" ]]; then
  echo "release env file does not exist: $RELEASE_ENV_FILE" >&2
  exit 1
fi

if [[ ( -n "$CERT_FILE" && -z "$KEY_FILE" ) || ( -z "$CERT_FILE" && -n "$KEY_FILE" ) ]]; then
  echo "--cert-file and --key-file must be provided together" >&2
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

LOG_DIR="$LOG_ROOT/$WINDOW_ID"
DNS_LOG="$LOG_DIR/10-dns-recheck.log"
TLS_LOG="$LOG_DIR/11-tls-secret-recheck.log"
SUMMARY_MD="$LOG_DIR/RECHECK-SUMMARY.md"
mkdir -p "$LOG_DIR"

get_a_records() {
  local host="$1"
  if command -v dig >/dev/null 2>&1; then
    dig +short A "$host" | sed '/^$/d'
  else
    nslookup "$host" 2>/dev/null | awk '/^Address: / { print $2 }' | sed '/^$/d'
  fi
}

{
  echo "# DNS Recheck"
  echo
  echo "- window_id: \`$WINDOW_ID\`"
  echo "- checked_at: \`$(date '+%Y-%m-%d %H:%M:%S')\`"
  echo
  for host in "$API_HOST" "$ADMIN_HOST" "$STOREFRONT_HOST" "$TOB_HOST"; do
    echo "## $host"
    records="$(get_a_records "$host" || true)"
    if [[ -n "$records" ]]; then
      echo '```text'
      echo "$records"
      echo '```'
    else
      echo "_NO_A_RECORD_"
    fi
    echo
  done
} > "$DNS_LOG"

if kubectl -n "$NAMESPACE" get secret "$TLS_SECRET_NAME" >/tmp/g8_tls_secret_check.$$ 2>/tmp/g8_tls_secret_check_err.$$; then
  {
    echo "# TLS Secret Recheck"
    echo
    echo "- window_id: \`$WINDOW_ID\`"
    echo "- namespace: \`$NAMESPACE\`"
    echo "- secret: \`$TLS_SECRET_NAME\`"
    echo "- status: \`present\`"
    echo
    echo '```text'
    cat /tmp/g8_tls_secret_check.$$
    echo '```'
  } > "$TLS_LOG"
else
  {
    echo "# TLS Secret Recheck"
    echo
    echo "- window_id: \`$WINDOW_ID\`"
    echo "- namespace: \`$NAMESPACE\`"
    echo "- secret: \`$TLS_SECRET_NAME\`"
    echo "- status: \`missing_or_inaccessible\`"
    echo
    echo '```text'
    cat /tmp/g8_tls_secret_check_err.$$
    echo '```'
  } > "$TLS_LOG"
fi
rm -f /tmp/g8_tls_secret_check.$$ /tmp/g8_tls_secret_check_err.$$

ready_args=(
  --env-file "$ENV_FILE"
  --namespace "$NAMESPACE"
  --window-id "$WINDOW_ID"
  --log-root "$LOG_ROOT"
)
if [[ -n "$RELEASE_ENV_FILE" ]]; then
  ready_args+=(--release-env-file "$RELEASE_ENV_FILE")
fi
if [[ -n "$CERT_FILE" && -n "$KEY_FILE" ]]; then
  ready_args+=(--cert-file "$CERT_FILE" --key-file "$KEY_FILE")
fi
if [[ -n "$TLS_MANIFEST" ]]; then
  ready_args+=(--tls-manifest "$TLS_MANIFEST")
fi

if bash "$ROOT_DIR/scripts/run-g8-formal-window-ready.sh" "${ready_args[@]}"; then
  readiness_status="passed"
else
  readiness_status="blocked"
fi

{
  echo "# G8 Recheck Summary"
  echo
  echo "- window_id: \`$WINDOW_ID\`"
  echo "- readiness_status: \`$readiness_status\`"
  echo "- dns_log: [10-dns-recheck.log](file://$DNS_LOG)"
  echo "- tls_log: [11-tls-secret-recheck.log](file://$TLS_LOG)"
  echo "- readiness_log: [00-formal-ready.log](file://$LOG_DIR/00-formal-ready.log)"
  echo "- blocker_report: [READINESS-BLOCKERS.md](file://$LOG_DIR/READINESS-BLOCKERS.md)"
  echo
  echo "## Next Step"
  echo
  if [[ "$readiness_status" == "passed" ]]; then
    echo "- Readiness is green. You can proceed to the formal window command from \`run-g8-formal-window-ready.sh --execute-apply --execute-rollback\`."
  else
    echo "- Readiness is still blocked. Fix DNS/TLS/host issues first, then rerun this script."
  fi
} > "$SUMMARY_MD"

echo "==> G8 recheck snapshot ready"
echo "window_id=$WINDOW_ID"
echo "dns_log=$DNS_LOG"
echo "tls_log=$TLS_LOG"
echo "summary=$SUMMARY_MD"
echo "readiness_log=$LOG_DIR/00-formal-ready.log"

if [[ "$readiness_status" != "passed" ]]; then
  exit 1
fi
