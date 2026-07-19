#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/run-prod-cutover-window.sh \
    --env-file <path> \
    [--release-env-file <path>] \
    [--window-id <id>] \
    [--log-root infra/k8s/cutover-logs] \
    [--namespace m5] \
    [--tls-manifest <path>] \
    [--allow-missing-tls] \
    [--execute-apply] \
    [--execute-rollback]
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV_FILE=""
RELEASE_ENV_FILE=""
WINDOW_ID="cutover-$(date +%Y%m%d-%H%M%S)"
LOG_ROOT="$ROOT_DIR/infra/k8s/cutover-logs"
NAMESPACE="m5"
TLS_MANIFEST=""
ALLOW_MISSING_TLS="false"
EXECUTE_APPLY="false"
EXECUTE_ROLLBACK="false"

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
    --release-env-file)
      RELEASE_ENV_FILE="${2:-}"
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
    --namespace)
      NAMESPACE="${2:-}"
      shift 2
      ;;
    --tls-manifest)
      TLS_MANIFEST="${2:-}"
      shift 2
      ;;
    --allow-missing-tls)
      ALLOW_MISSING_TLS="true"
      shift
      ;;
    --execute-apply)
      EXECUTE_APPLY="true"
      shift
      ;;
    --execute-rollback)
      EXECUTE_ROLLBACK="true"
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
  exit 1
fi

LOG_DIR="$LOG_ROOT/$WINDOW_ID"
BUNDLE_DIR="$LOG_DIR/cutover-bundle"
mkdir -p "$LOG_DIR"

FORMAL_LOG="$LOG_DIR/00-formal-ready.log"
PREFLIGHT_LOG="$LOG_DIR/01-preflight.log"
SERVER_DRY_RUN_LOG="$LOG_DIR/02-server-dry-run.log"
APPLY_LOG="$LOG_DIR/03-apply.log"
VERIFY_LOG="$LOG_DIR/04-verify.log"
ROLLBACK_LOG="$LOG_DIR/05-rollback.log"
SUMMARY_FILE="$LOG_DIR/SUMMARY.md"

USE_RESOLVE_VERIFY="false"
if [[ "$ALLOW_MISSING_TLS" == "true" ]]; then
  USE_RESOLVE_VERIFY="true"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> prod cutover window start"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] window_id=$WINDOW_ID"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] log_dir=$LOG_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] env_file=$ENV_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] release_env_file=${RELEASE_ENV_FILE:-}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] namespace=$NAMESPACE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] tls_manifest=${TLS_MANIFEST:-auto-or-live-secret}"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] allow_missing_tls=$ALLOW_MISSING_TLS"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] use_resolve_verify=$USE_RESOLVE_VERIFY"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] execute_apply=$EXECUTE_APPLY"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] execute_rollback=$EXECUTE_ROLLBACK"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> prepare cutover bundle"
prepare_args=(
  --env-file "$ENV_FILE"
  --output-dir "$BUNDLE_DIR"
)
if [[ -n "$RELEASE_ENV_FILE" ]]; then
  prepare_args+=(--release-env-file "$RELEASE_ENV_FILE")
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] + bash $ROOT_DIR/scripts/prepare-prod-cutover-bundle.sh ${prepare_args[*]}"
bash "$ROOT_DIR/scripts/prepare-prod-cutover-bundle.sh" "${prepare_args[@]}"

if [[ "$EXECUTE_APPLY" == "true" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> formal window gate"
  formal_args=(
    --env-file "$ENV_FILE"
    --namespace "$NAMESPACE"
  )
  if [[ -n "$TLS_MANIFEST" ]]; then
    formal_args+=(--tls-manifest "$TLS_MANIFEST")
  fi
  bash "$ROOT_DIR/scripts/preflight-prod-formal-window.sh" "${formal_args[@]}" 2>&1 | tee "$FORMAL_LOG"
  test "${PIPESTATUS[0]}" -eq 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover preflight"
preflight_args=(
  --env-file "$ENV_FILE"
  --namespace "$NAMESPACE"
  --rendered-dir "$LOG_DIR/rendered-preflight"
  --log-file "$PREFLIGHT_LOG"
)
if [[ "$ALLOW_MISSING_TLS" == "true" ]]; then
  preflight_args+=(--allow-missing-tls)
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] + bash $ROOT_DIR/scripts/preflight-prod-public-cutover.sh ${preflight_args[*]}"
bash "$ROOT_DIR/scripts/preflight-prod-public-cutover.sh" "${preflight_args[@]}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover server dry-run"
dry_run_args=(
  --env-file "$ENV_FILE"
  --namespace "$NAMESPACE"
  --rendered-dir "$LOG_DIR/rendered-server-dry-run"
  --kubectl-dry-run server
  --log-file "$SERVER_DRY_RUN_LOG"
)
if [[ "$ALLOW_MISSING_TLS" == "true" ]]; then
  dry_run_args+=(--skip-tls-check)
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] + bash $ROOT_DIR/scripts/apply-prod-public-cutover.sh ${dry_run_args[*]}"
bash "$ROOT_DIR/scripts/apply-prod-public-cutover.sh" "${dry_run_args[@]}"

if [[ "$EXECUTE_APPLY" == "true" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover apply"
  apply_args=(
    --env-file "$ENV_FILE"
    --namespace "$NAMESPACE"
    --rendered-dir "$LOG_DIR/rendered-apply"
    --log-file "$APPLY_LOG"
  )
  if [[ -n "$TLS_MANIFEST" ]]; then
    apply_args+=(--tls-manifest "$TLS_MANIFEST")
  fi
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] + bash $ROOT_DIR/scripts/apply-prod-public-cutover.sh ${apply_args[*]}"
  bash "$ROOT_DIR/scripts/apply-prod-public-cutover.sh" "${apply_args[@]}"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover apply skipped"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public endpoint verify"
verify_args=(
  --env-file "$ENV_FILE"
  --log-file "$VERIFY_LOG"
)
if [[ "$USE_RESOLVE_VERIFY" == "true" ]]; then
  verify_args+=(--use-resolve)
fi
echo "[$(date '+%Y-%m-%d %H:%M:%S')] + bash $ROOT_DIR/scripts/verify-prod-public-endpoints.sh ${verify_args[*]}"
bash "$ROOT_DIR/scripts/verify-prod-public-endpoints.sh" "${verify_args[@]}"

if [[ "$EXECUTE_ROLLBACK" == "true" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover rollback"
  bash "$ROOT_DIR/scripts/rollback-prod-public-cutover.sh" --namespace "$NAMESPACE" 2>&1 | tee "$ROLLBACK_LOG"
  test "${PIPESTATUS[0]}" -eq 0
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> public cutover rollback skipped"
fi

{
  echo "# Prod Cutover Window Summary"
  echo
  echo "- window_id: \`$WINDOW_ID\`"
  echo "- env_file: \`$ENV_FILE\`"
  echo "- release_env_file: \`${RELEASE_ENV_FILE:-}\`"
  echo "- namespace: \`$NAMESPACE\`"
  echo "- allow_missing_tls: \`$ALLOW_MISSING_TLS\`"
  echo "- execute_apply: \`$EXECUTE_APPLY\`"
  echo "- execute_rollback: \`$EXECUTE_ROLLBACK\`"
  echo
  echo "## Logs"
  echo
  if [[ "$EXECUTE_APPLY" == "true" ]]; then
    echo "- 00 formal ready: \`$FORMAL_LOG\`"
  fi
  echo "- 01 preflight: \`$PREFLIGHT_LOG\`"
  echo "- 02 server dry-run: \`$SERVER_DRY_RUN_LOG\`"
  if [[ "$EXECUTE_APPLY" == "true" ]]; then
    echo "- 03 apply: \`$APPLY_LOG\`"
  fi
  echo "- 04 verify: \`$VERIFY_LOG\`"
  if [[ "$EXECUTE_ROLLBACK" == "true" ]]; then
    echo "- 05 rollback: \`$ROLLBACK_LOG\`"
  fi
  echo
  echo "## Rendered Dirs"
  echo
  echo "- \`$LOG_DIR/rendered-preflight\`"
  echo "- \`$LOG_DIR/rendered-server-dry-run\`"
  if [[ "$EXECUTE_APPLY" == "true" ]]; then
    echo "- \`$LOG_DIR/rendered-apply\`"
  fi
  echo
  echo "## Next Step"
  echo
  if [[ "$EXECUTE_APPLY" == "true" ]]; then
    echo "- Formal apply has executed. Continue with post-window validation and evidence archiving."
  else
    echo "- This window only produced non-mutating evidence. Re-run with \`--execute-apply\` during the formal cutover window."
  fi
  if [[ "$EXECUTE_ROLLBACK" == "true" ]]; then
    echo "- Attach \`05-rollback.log\` as rollback evidence in the G8 acceptance record."
  else
    echo "- Rollback was not executed in this run. Re-run with \`--execute-rollback\` if rollback evidence is required."
  fi
} > "$SUMMARY_FILE"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ==> prod cutover window done"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] summary_file=$SUMMARY_FILE"
