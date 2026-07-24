#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/verify-local-api-startup-baseline.sh [--port <port>] [--timeout <seconds>] [--keep-artifacts]

Description:
  启动本地 apps/api，校验当前约定的启动日志基线，并抽样验证关键 HTTP 端点。

Options:
  --port <port>         指定启动端口，默认 3145
  --timeout <seconds>   启动等待超时，默认 25
  --keep-artifacts      保留临时日志与响应体文件
  -h, --help            显示帮助
EOF
}

PORT="3145"
TIMEOUT_SECONDS="25"
KEEP_ARTIFACTS="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --port)
      PORT="${2:-}"
      shift 2
      ;;
    --timeout)
      TIMEOUT_SECONDS="${2:-}"
      shift 2
      ;;
    --keep-artifacts)
      KEEP_ARTIFACTS="true"
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$REPO_ROOT/apps/api"

if [[ ! -d "$API_DIR" ]]; then
  echo "apps/api directory not found: $API_DIR" >&2
  exit 1
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "FAIL: port ${PORT} is already in use; choose another port with --port" >&2
  exit 1
fi

RUN_ID="$(date '+%Y%m%d-%H%M%S')-$$"
LOG_FILE="/tmp/m5-api-startup-baseline-${PORT}-${RUN_ID}.log"
HEALTH_HEADERS="/tmp/m5-api-health-${PORT}-${RUN_ID}.headers"
HEALTH_BODY="/tmp/m5-api-health-${PORT}-${RUN_ID}.body"
DOCS_HEADERS="/tmp/m5-api-docs-${PORT}-${RUN_ID}.headers"
DOCS_BODY="/tmp/m5-api-docs-${PORT}-${RUN_ID}.body"
FOUNDATION_HEADERS="/tmp/m5-api-foundation-bootstrap-${PORT}-${RUN_ID}.headers"
FOUNDATION_BODY="/tmp/m5-api-foundation-bootstrap-${PORT}-${RUN_ID}.body"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi

  if [[ "$KEEP_ARTIFACTS" != "true" ]]; then
    rm -f \
      "$LOG_FILE" \
      "$HEALTH_HEADERS" \
      "$HEALTH_BODY" \
      "$DOCS_HEADERS" \
      "$DOCS_BODY" \
      "$FOUNDATION_HEADERS" \
      "$FOUNDATION_BODY"
  fi
}

trap cleanup EXIT

require_pattern() {
  local pattern="$1"
  local file="$2"
  local description="$3"
  if ! grep -Fq "$pattern" "$file"; then
    echo "FAIL: missing ${description}" >&2
    echo "  pattern: $pattern" >&2
    echo "  log_file: $file" >&2
    exit 1
  fi
  echo "PASS: ${description}"
}

forbid_pattern() {
  local pattern="$1"
  local file="$2"
  local description="$3"
  if grep -Fq "$pattern" "$file"; then
    echo "FAIL: unexpected ${description}" >&2
    echo "  pattern: $pattern" >&2
    echo "  log_file: $file" >&2
    exit 1
  fi
  echo "PASS: ${description} absent"
}

require_http_status() {
  local expected_status="$1"
  local actual_status="$2"
  local description="$3"
  if [[ "$actual_status" != "$expected_status" ]]; then
    echo "FAIL: ${description} expected ${expected_status}, got ${actual_status}" >&2
    exit 1
  fi
  echo "PASS: ${description} -> ${actual_status}"
}

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> local api startup baseline verify start"
echo "port=$PORT timeout=${TIMEOUT_SECONDS}s keep_artifacts=$KEEP_ARTIFACTS"
echo "log_file=$LOG_FILE"

(
  cd "$API_DIR"
  exec env LOG_PRETTY=false API_PORT="$PORT" node --require ts-node/register --require tsconfig-paths/register src/main.ts
) >"$LOG_FILE" 2>&1 &
SERVER_PID="$!"

READY="false"
for ((i = 0; i < TIMEOUT_SECONDS; i++)); do
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "FAIL: api process exited before readiness" >&2
    sed -n '1,200p' "$LOG_FILE" >&2 || true
    exit 1
  fi

  if curl -sS -o /dev/null "http://127.0.0.1:${PORT}/api/v1/health/ping" 2>/dev/null; then
    READY="true"
    break
  fi

  sleep 1
done

if [[ "$READY" != "true" ]]; then
  echo "FAIL: api did not become ready within ${TIMEOUT_SECONDS}s" >&2
  sed -n '1,200p' "$LOG_FILE" >&2 || true
  exit 1
fi

sleep 1

echo "== Startup log assertions =="
require_pattern "m5-api started" "$LOG_FILE" "startup success log"
require_pattern "foundation blueprint endpoint" "$LOG_FILE" "foundation bootstrap endpoint log"
require_pattern "swagger docs endpoint" "$LOG_FILE" "swagger docs endpoint log"

forbid_pattern "Starting Nest application..." "$LOG_FILE" "NestFactory startup banner"
forbid_pattern "Nest application successfully started" "$LOG_FILE" "NestApplication startup banner"
forbid_pattern "GatewayAnalyticsService: log source connected" "$LOG_FILE" "GatewayAnalytics startup log"
forbid_pattern "EventStore enabled for dual-write" "$LOG_FILE" "EventBuffer dual-write log"
forbid_pattern "Skip default mock channel bootstrap because ENABLE_MOCK_PAYMENT_CHANNELS is not enabled" "$LOG_FILE" "mock payment bootstrap skip log"
forbid_pattern "context: \"RouterExplorer\"" "$LOG_FILE" "RouterExplorer route enumeration"
forbid_pattern "context: \"RoutesResolver\"" "$LOG_FILE" "RoutesResolver route enumeration"
forbid_pattern "context: \"InstanceLoader\"" "$LOG_FILE" "InstanceLoader startup enumeration"

echo "== HTTP smoke assertions =="
HEALTH_STATUS="$(curl -sS -D "$HEALTH_HEADERS" -o "$HEALTH_BODY" -w '%{http_code}' "http://127.0.0.1:${PORT}/api/v1/health/ping")"
DOCS_STATUS="$(curl -sS -D "$DOCS_HEADERS" -o "$DOCS_BODY" -w '%{http_code}' "http://127.0.0.1:${PORT}/docs")"
FOUNDATION_STATUS="$(
  curl -sS \
    -D "$FOUNDATION_HEADERS" \
    -H 'x-tenant-id: demo-tenant' \
    -o "$FOUNDATION_BODY" \
    -w '%{http_code}' \
    "http://127.0.0.1:${PORT}/api/v1/foundation/bootstrap"
)"

require_http_status "200" "$HEALTH_STATUS" "GET /api/v1/health/ping"
require_http_status "200" "$DOCS_STATUS" "GET /docs"
require_http_status "401" "$FOUNDATION_STATUS" "GET /api/v1/foundation/bootstrap with tenant header only"

require_pattern "This endpoint is not publicly accessible." "$FOUNDATION_BODY" "foundation bootstrap auth guard message"

echo "== Observed retained startup logs =="
grep -E 'm5-api started|foundation blueprint endpoint|swagger docs endpoint|load custom domains skipped|loadAllInstances|onModuleInit skipped' "$LOG_FILE" || true

echo
echo "PASS: local api startup baseline is stable"
if [[ "$KEEP_ARTIFACTS" == "true" ]]; then
  echo "Artifacts kept:"
  echo "  $LOG_FILE"
  echo "  $HEALTH_HEADERS"
  echo "  $HEALTH_BODY"
  echo "  $DOCS_HEADERS"
  echo "  $DOCS_BODY"
  echo "  $FOUNDATION_HEADERS"
  echo "  $FOUNDATION_BODY"
fi
