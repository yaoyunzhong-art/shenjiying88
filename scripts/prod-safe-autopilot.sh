#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/lib-m5-kubeconfig.sh"

usage() {
  cat <<'EOF'
Usage:
  scripts/prod-safe-autopilot.sh \
    [--env-file <path>] \
    [--duration-hours 5] \
    [--interval-seconds 900] \
    [--output-dir <path>]

Behavior:
  - Runs for a fixed duration in the background
  - Only executes non-mutating production checks
  - Prefers cluster-connected preflight + server dry-run when kubeconfig exists
  - Falls back to offline preflight + client dry-run otherwise
  - Probes candidate public endpoints against the current NLB with --use-resolve

Important:
  - This script never performs the real production cutover
  - This script never restarts workloads
  - This script is safe to leave running unattended while external blockers remain
EOF
}

ENV_FILE="$ROOT_DIR/infra/k8s/templates/m5-public-endpoints.env.example"
DURATION_HOURS="5"
INTERVAL_SECONDS="900"
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --duration-hours)
      DURATION_HOURS="${2:-}"
      shift 2
      ;;
    --interval-seconds)
      INTERVAL_SECONDS="${2:-}"
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

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file does not exist: $ENV_FILE" >&2
  exit 1
fi

if ! [[ "$DURATION_HOURS" =~ ^[0-9]+$ && "$INTERVAL_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "--duration-hours and --interval-seconds must be positive integers" >&2
  exit 1
fi

RUN_ID="$(date +%Y%m%d-%H%M%S)"
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="$ROOT_DIR/tmp/prod-safe-autopilot/$RUN_ID"
fi
mkdir -p "$OUTPUT_DIR"

TOTAL_SECONDS=$((DURATION_HOURS * 3600))
if (( TOTAL_SECONDS <= 0 || INTERVAL_SECONDS <= 0 )); then
  echo "Duration and interval must be greater than zero" >&2
  exit 1
fi

ITERATIONS=$(( (TOTAL_SECONDS + INTERVAL_SECONDS - 1) / INTERVAL_SECONDS ))
STATUS_FILE="$OUTPUT_DIR/status.txt"
SUMMARY_FILE="$OUTPUT_DIR/summary.log"
READINESS_FILE="$OUTPUT_DIR/readiness.txt"

log_summary() {
  local message="$1"
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$message" | tee -a "$SUMMARY_FILE"
}

run_step() {
  local title="$1"
  local log_file="$2"
  shift 2

  {
    printf '=== %s ===\n' "$title"
    printf 'timestamp=%s\n' "$(date '+%Y-%m-%d %H:%M:%S')"
    printf 'command='
    printf '%q ' "$@"
    printf '\n\n'
    "$@"
  } >"$log_file" 2>&1
}

write_status() {
  local mode="$1"
  local loop_index="$2"
  local preflight_rc="$3"
  local dry_run_rc="$4"
  local verify_rc="$5"
  local tls_rc="$6"
  local cutover_candidate="$7"

  cat >"$STATUS_FILE" <<EOF
run_id=$RUN_ID
updated_at=$(date '+%Y-%m-%d %H:%M:%S')
mode=$mode
loop_index=$loop_index
total_loops=$ITERATIONS
preflight_rc=$preflight_rc
dry_run_rc=$dry_run_rc
verify_rc=$verify_rc
tls_rc=$tls_rc
cutover_candidate=$cutover_candidate
output_dir=$OUTPUT_DIR
EOF
}

write_readiness() {
  local mode="$1"
  local loop_index="$2"
  local preflight_rc="$3"
  local dry_run_rc="$4"
  local verify_rc="$5"
  local tls_rc="$6"
  local cutover_candidate="$7"

  cat >"$READINESS_FILE" <<EOF
updated_at=$(date '+%Y-%m-%d %H:%M:%S')
mode=$mode
loop_index=$loop_index
preflight_rc=$preflight_rc
dry_run_rc=$dry_run_rc
verify_rc=$verify_rc
tls_rc=$tls_rc
cutover_candidate=$cutover_candidate

criteria:
- preflight_rc=0
- dry_run_rc=0
- tls_rc=0
- verify_rc=0
EOF
}

log_summary "prod-safe-autopilot started"
log_summary "env_file=$ENV_FILE"
log_summary "duration_hours=$DURATION_HOURS interval_seconds=$INTERVAL_SECONDS iterations=$ITERATIONS"
log_summary "output_dir=$OUTPUT_DIR"

for ((i = 1; i <= ITERATIONS; i++)); do
  LOOP_DIR="$OUTPUT_DIR/loop-$(printf '%03d' "$i")"
  mkdir -p "$LOOP_DIR"

  MODE="offline"
  if discover_m5_kubeconfig "$ROOT_DIR" >/dev/null 2>&1; then
    MODE="online"
  fi

  log_summary "loop=$i/$ITERATIONS mode=$MODE started"

  PREFLIGHT_LOG="$LOOP_DIR/preflight.log"
  DRY_RUN_LOG="$LOOP_DIR/dry-run.log"
  VERIFY_LOG="$LOOP_DIR/verify.log"
  TLS_LOG="$LOOP_DIR/tls.log"

  PREFLIGHT_RC=0
  DRY_RUN_RC=0
  VERIFY_RC=0
  TLS_RC=0
  CUTOVER_CANDIDATE="false"

  if [[ "$MODE" == "online" ]]; then
    run_step "preflight online" "$PREFLIGHT_LOG" \
      bash "$ROOT_DIR/scripts/preflight-prod-public-cutover.sh" \
      --env-file "$ENV_FILE" \
      --allow-missing-tls || PREFLIGHT_RC=$?

    run_step "server dry-run" "$DRY_RUN_LOG" \
      bash "$ROOT_DIR/scripts/apply-prod-public-cutover.sh" \
      --env-file "$ENV_FILE" \
      --kubectl-dry-run server \
      --skip-tls-check || DRY_RUN_RC=$?
  else
    run_step "preflight offline" "$PREFLIGHT_LOG" \
      bash "$ROOT_DIR/scripts/preflight-prod-public-cutover.sh" \
      --env-file "$ENV_FILE" \
      --offline \
      --allow-missing-tls || PREFLIGHT_RC=$?

    run_step "client dry-run offline" "$DRY_RUN_LOG" \
      bash "$ROOT_DIR/scripts/apply-prod-public-cutover.sh" \
      --env-file "$ENV_FILE" \
      --kubectl-dry-run client \
      --offline \
      --skip-tls-check || DRY_RUN_RC=$?
  fi

  run_step "verify endpoints with resolve" "$VERIFY_LOG" \
    bash "$ROOT_DIR/scripts/verify-prod-public-endpoints.sh" \
    --env-file "$ENV_FILE" \
    --use-resolve || VERIFY_RC=$?

  if [[ "$MODE" == "online" ]]; then
    run_step "verify tls secret" "$TLS_LOG" \
      bash "$ROOT_DIR/scripts/verify-m5-tls-secret.sh" \
      --env-file "$ENV_FILE" || TLS_RC=$?
  else
    printf 'offline mode skips live tls secret verification\n' >"$TLS_LOG"
    TLS_RC=99
  fi

  if [[ "$PREFLIGHT_RC" -eq 0 && "$DRY_RUN_RC" -eq 0 && "$VERIFY_RC" -eq 0 && "$TLS_RC" -eq 0 ]]; then
    CUTOVER_CANDIDATE="true"
    log_summary "loop=$i/$ITERATIONS reached cutover-candidate=true"
  fi

  write_status "$MODE" "$i" "$PREFLIGHT_RC" "$DRY_RUN_RC" "$VERIFY_RC" "$TLS_RC" "$CUTOVER_CANDIDATE"
  write_readiness "$MODE" "$i" "$PREFLIGHT_RC" "$DRY_RUN_RC" "$VERIFY_RC" "$TLS_RC" "$CUTOVER_CANDIDATE"
  log_summary "loop=$i/$ITERATIONS finished preflight_rc=$PREFLIGHT_RC dry_run_rc=$DRY_RUN_RC verify_rc=$VERIFY_RC tls_rc=$TLS_RC cutover_candidate=$CUTOVER_CANDIDATE"

  if (( i < ITERATIONS )); then
    sleep "$INTERVAL_SECONDS"
  fi
done

log_summary "prod-safe-autopilot finished"
