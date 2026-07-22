#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/run-g8-formal-window-ready.sh \
    --env-file <path> \
    [--release-env-file <path>] \
    [--cert-file <path> --key-file <path>] \
    [--tls-manifest <path>] \
    [--refresh-acr-regcred] \
    [--namespace m5] \
    [--window-id <id>] \
    [--log-root infra/k8s/cutover-logs] \
    [--execute-apply] \
    [--execute-rollback]

Behavior:
  1. If cert/key are provided, render infra/k8s/rendered-public/m5-tls.yaml
  2. Optionally refresh acr-regcred before the formal gate
  3. Run formal DNS/TLS readiness gate
  3. If --execute-apply is set, enter the formal cutover window

Notes:
  - Without --execute-apply, this script only prepares TLS material and validates readiness.
  - --execute-rollback only works together with --execute-apply.
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV_FILE=""
RELEASE_ENV_FILE=""
CERT_FILE=""
KEY_FILE=""
TLS_MANIFEST=""
NAMESPACE="m5"
WINDOW_ID="formal-window-$(date +%Y%m%d-%H%M%S)"
LOG_ROOT="$ROOT_DIR/infra/k8s/cutover-logs"
EXECUTE_APPLY="false"
EXECUTE_ROLLBACK="false"
REFRESH_ACR_REGCRED="false"
LOG_DIR=""
READINESS_LOG=""
BLOCKER_REPORT=""
ACR_REFRESH_LOG=""
PRE_RELEASE_LOG=""

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
    --refresh-acr-regcred)
      REFRESH_ACR_REGCRED="true"
      shift
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

if [[ -n "$RELEASE_ENV_FILE" && ! -f "$RELEASE_ENV_FILE" ]]; then
  echo "release env file does not exist: $RELEASE_ENV_FILE" >&2
  exit 1
fi

if [[ ( -n "$CERT_FILE" && -z "$KEY_FILE" ) || ( -z "$CERT_FILE" && -n "$KEY_FILE" ) ]]; then
  echo "--cert-file and --key-file must be provided together" >&2
  exit 1
fi

if [[ "$EXECUTE_ROLLBACK" == "true" && "$EXECUTE_APPLY" != "true" ]]; then
  echo "--execute-rollback requires --execute-apply" >&2
  exit 1
fi

LOG_DIR="$LOG_ROOT/$WINDOW_ID"
READINESS_LOG="$LOG_DIR/00-formal-ready.log"
BLOCKER_REPORT="$LOG_DIR/READINESS-BLOCKERS.md"
ACR_REFRESH_LOG="$LOG_DIR/00-acr-refresh.log"
PRE_RELEASE_LOG="$LOG_DIR/01-pre-release-check.log"
mkdir -p "$LOG_DIR"

if [[ -n "$CERT_FILE" && -n "$KEY_FILE" ]]; then
  TLS_MANIFEST="${TLS_MANIFEST:-$ROOT_DIR/infra/k8s/rendered-public/m5-tls.yaml}"
  echo "==> Rendering formal TLS manifest"
  bash "$ROOT_DIR/scripts/build-m5-tls-secret.sh" \
    --cert-file "$CERT_FILE" \
    --key-file "$KEY_FILE" \
    --namespace "$NAMESPACE" \
    --output-file "$TLS_MANIFEST"
elif [[ -z "$TLS_MANIFEST" && -f "$ROOT_DIR/infra/k8s/rendered-public/m5-tls.yaml" ]]; then
  TLS_MANIFEST="$ROOT_DIR/infra/k8s/rendered-public/m5-tls.yaml"
fi

if [[ "$REFRESH_ACR_REGCRED" == "true" ]]; then
  echo "==> Refreshing acr-regcred before formal readiness gate"
  if bash "$ROOT_DIR/scripts/refresh-acr-regcred.sh" 2>&1 | tee "$ACR_REFRESH_LOG"; then
    :
  else
    {
      echo "# G8 Formal Readiness Blockers"
      echo
      echo "- window_id: \`$WINDOW_ID\`"
      echo "- env_file: \`$ENV_FILE\`"
      echo "- namespace: \`$NAMESPACE\`"
      echo "- acr_refresh_log: \`$ACR_REFRESH_LOG\`"
      echo
      echo "## Blockers"
      echo
      echo "- acr-regcred refresh failed before the formal readiness gate."
      echo
      echo "## Next Action"
      echo
      echo "- Fix the acr-regcred refresh failure recorded in \`$ACR_REFRESH_LOG\`."
      echo "- Rerun \`scripts/run-g8-formal-window-ready.sh\` after acr-regcred can refresh successfully."
    } > "$BLOCKER_REPORT"
    echo
    echo "==> Formal readiness blocked"
    echo "acr_refresh_log=$ACR_REFRESH_LOG"
    echo "blocker_report=$BLOCKER_REPORT"
    exit 1
  fi
fi

echo "==> Running formal readiness gate"
gate_args=(
  --env-file "$ENV_FILE"
  --namespace "$NAMESPACE"
)
if [[ -n "$TLS_MANIFEST" ]]; then
  gate_args+=(--tls-manifest "$TLS_MANIFEST")
fi
if bash "$ROOT_DIR/scripts/preflight-prod-formal-window.sh" "${gate_args[@]}" 2>&1 | tee "$READINESS_LOG"; then
  :
else
  {
    echo "# G8 Formal Readiness Blockers"
    echo
    echo "- window_id: \`$WINDOW_ID\`"
    echo "- env_file: \`$ENV_FILE\`"
    echo "- namespace: \`$NAMESPACE\`"
    echo "- tls_manifest: \`${TLS_MANIFEST:-live-secret}\`"
    echo "- readiness_log: \`$READINESS_LOG\`"
    echo
    echo "## Blockers"
    echo
    if grep -q '^ - ' "$READINESS_LOG"; then
      grep '^ - ' "$READINESS_LOG"
    else
      echo "- Formal readiness gate failed before a structured blocker list was emitted."
    fi
    echo
    echo "## Next Action"
    echo
    echo "- Resolve all blockers above, then rerun \`scripts/run-g8-formal-window-ready.sh\` with the same \`--window-id\` or a new one."
    echo "- Do not run \`--execute-apply\` until this readiness gate passes."
  } > "$BLOCKER_REPORT"

  echo
  echo "==> Formal readiness blocked"
  echo "readiness_log=$READINESS_LOG"
  echo "blocker_report=$BLOCKER_REPORT"
  exit 1
fi

echo "==> Running pre-release gate"
if KUBECONFIG="${KUBECONFIG:-$HOME/.kube/m5-prod-config}" \
   NAMESPACE="$NAMESPACE" \
   EXPECTED_NAMESPACE="$NAMESPACE" \
   bash "$ROOT_DIR/scripts/pre-release-check.sh" 2>&1 | tee "$PRE_RELEASE_LOG"; then
  :
else
  {
    echo "# G8 Formal Readiness Blockers"
    echo
    echo "- window_id: \`$WINDOW_ID\`"
    echo "- env_file: \`$ENV_FILE\`"
    echo "- namespace: \`$NAMESPACE\`"
    echo "- readiness_log: \`$READINESS_LOG\`"
    echo "- pre_release_log: \`$PRE_RELEASE_LOG\`"
    echo
    echo "## Blockers"
    echo
    echo "- pre-release-check failed; formal cutover is not allowed to continue."
    echo "- Fix the failed checks in \`$PRE_RELEASE_LOG\`, then rerun this command."
    echo
    echo "## Next Action"
    echo
    echo "- Ensure \`acr-regcred\` exists in namespace \`$NAMESPACE\`."
    echo "- Ensure the ACR Docker login username is the full Alibaba Cloud account email, not a numeric \`userId\`."
    echo "- Do not run \`--execute-apply\` until \`scripts/pre-release-check.sh\` passes."
  } > "$BLOCKER_REPORT"
  echo
  echo "==> Pre-release gate blocked"
  echo "pre_release_log=$PRE_RELEASE_LOG"
  echo "blocker_report=$BLOCKER_REPORT"
  exit 1
fi

if [[ "$EXECUTE_APPLY" != "true" ]]; then
  echo
  echo "==> Formal readiness passed"
  echo "window_id=$WINDOW_ID"
  echo "tls_manifest=${TLS_MANIFEST:-live-secret}"
  echo "readiness_log=$READINESS_LOG"
  echo "pre_release_log=$PRE_RELEASE_LOG"
  echo "next_command=bash scripts/run-prod-cutover-window.sh --env-file $ENV_FILE${RELEASE_ENV_FILE:+ --release-env-file $RELEASE_ENV_FILE} --window-id $WINDOW_ID --log-root $LOG_ROOT${TLS_MANIFEST:+ --tls-manifest $TLS_MANIFEST} --execute-apply"
  exit 0
fi

echo "==> Entering formal cutover window"
window_args=(
  --env-file "$ENV_FILE"
  --window-id "$WINDOW_ID"
  --log-root "$LOG_ROOT"
  --namespace "$NAMESPACE"
  --execute-apply
)
if [[ -n "$RELEASE_ENV_FILE" ]]; then
  window_args+=(--release-env-file "$RELEASE_ENV_FILE")
fi
if [[ -n "$TLS_MANIFEST" ]]; then
  window_args+=(--tls-manifest "$TLS_MANIFEST")
fi
if [[ "$EXECUTE_ROLLBACK" == "true" ]]; then
  window_args+=(--execute-rollback)
fi

bash "$ROOT_DIR/scripts/run-prod-cutover-window.sh" "${window_args[@]}"
