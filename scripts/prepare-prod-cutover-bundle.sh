#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
用法:
  scripts/prepare-prod-cutover-bundle.sh \
    --env-file infra/k8s/templates/m5-public-endpoints.env.example \
    [--release-env-file infra/k8s/templates/m5-release-images.env.example] \
    [--output-dir infra/k8s/cutover-bundles/$(date +%Y%m%d-%H%M%S)] \
    [--tls-cert-file /path/to/fullchain.pem] \
    [--tls-key-file /path/to/privkey.pem]

作用:
  1. 生成公网切流 bundle 目录
  2. 渲染公网 Ingress / ConfigMap / DNS 记录
  3. 可选生成 m5-tls Secret manifest
  4. 可选生成 K8s 版本化 release bundle
  5. 输出一份窗口内可直接执行的命令清单
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE=""
RELEASE_ENV_FILE=""
OUTPUT_DIR="$ROOT_DIR/infra/k8s/cutover-bundles/$(date +%Y%m%d-%H%M%S)"
TLS_CERT_FILE=""
TLS_KEY_FILE=""

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
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    --tls-cert-file)
      TLS_CERT_FILE="${2:-}"
      shift 2
      ;;
    --tls-key-file)
      TLS_KEY_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "缺少 --env-file 或文件不存在" >&2
  exit 1
fi

if [[ -n "$RELEASE_ENV_FILE" && ! -f "$RELEASE_ENV_FILE" ]]; then
  echo "release env 文件不存在: $RELEASE_ENV_FILE" >&2
  exit 1
fi

if [[ -n "$TLS_CERT_FILE" && -z "$TLS_KEY_FILE" ]] || [[ -z "$TLS_CERT_FILE" && -n "$TLS_KEY_FILE" ]]; then
  echo "tls cert 和 key 必须同时提供" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
cp "$ENV_FILE" "$OUTPUT_DIR/public-endpoints.env"

bash "$ROOT_DIR/scripts/render-prod-public-cutover.sh" \
  --env-file "$ENV_FILE" \
  --output-dir "$OUTPUT_DIR/rendered-public" >/dev/null

if [[ -n "$TLS_CERT_FILE" && -n "$TLS_KEY_FILE" ]]; then
  bash "$ROOT_DIR/scripts/build-m5-tls-secret.sh" \
    --cert-file "$TLS_CERT_FILE" \
    --key-file "$TLS_KEY_FILE" \
    --secret-name m5-tls \
    --namespace m5 \
    --output-file "$OUTPUT_DIR/rendered-public/m5-tls.yaml" >/dev/null
fi

if [[ -n "$RELEASE_ENV_FILE" ]]; then
  cp "$RELEASE_ENV_FILE" "$OUTPUT_DIR/release-images.env"
  bash "$ROOT_DIR/scripts/render-k8s-release-manifests.sh" \
    --env-file "$RELEASE_ENV_FILE" \
    --output-dir "$OUTPUT_DIR/rendered-release" >/dev/null
fi

bash "$ROOT_DIR/scripts/preflight-prod-public-cutover.sh" \
  --env-file "$ENV_FILE" \
  --rendered-dir "$OUTPUT_DIR/preflight-rendered" \
  --offline \
  --allow-missing-tls >/dev/null

cat > "$OUTPUT_DIR/CUTOVER-COMMANDS.md" <<EOF
# Cutover Commands

## 0. G8 Readiness Only

\`\`\`bash
bash scripts/run-g8-formal-window-ready.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env${RELEASE_ENV_FILE:+ \\}
${RELEASE_ENV_FILE:+  --release-env-file $OUTPUT_DIR/release-images.env \\}
  --window-id formal-window-\$(date +%Y%m%d-%H%M%S) \\
  --log-root infra/k8s/cutover-logs
\`\`\`

## 1. G8 Formal Window Execute

\`\`\`bash
bash scripts/run-g8-formal-window-ready.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env${RELEASE_ENV_FILE:+ \\}
${RELEASE_ENV_FILE:+  --release-env-file $OUTPUT_DIR/release-images.env \\}
  --window-id formal-window-\$(date +%Y%m%d-%H%M%S) \\
  --log-root infra/k8s/cutover-logs \\
  --execute-apply \\
  --execute-rollback
\`\`\`

## 2. With PEM Material

\`\`\`bash
bash scripts/run-g8-formal-window-ready.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env${RELEASE_ENV_FILE:+ \\}
${RELEASE_ENV_FILE:+  --release-env-file $OUTPUT_DIR/release-images.env \\}
  --cert-file /secure/path/fullchain.pem \\
  --key-file /secure/path/privkey.pem \\
  --window-id formal-window-\$(date +%Y%m%d-%H%M%S) \\
  --log-root infra/k8s/cutover-logs \\
  --execute-apply \\
  --execute-rollback
\`\`\`

## 3. K8s Release Preflight

\`\`\`bash
bash scripts/preflight-k8s-release.sh \\
  --k8s-dir infra/k8s \\
  --public-env-file $ENV_FILE${RELEASE_ENV_FILE:+ \\}
${RELEASE_ENV_FILE:+  --release-env-file $OUTPUT_DIR/release-images.env}
\`\`\`

## 4. TLS Verify

\`\`\`bash
bash scripts/verify-m5-tls-secret.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env
\`\`\`

## 5. Public Cutover Preflight

\`\`\`bash
bash scripts/preflight-prod-public-cutover.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env
\`\`\`

## 6. Public Cutover Dry Run

\`\`\`bash
bash scripts/apply-prod-public-cutover.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env \\
  --kubectl-dry-run server${TLS_CERT_FILE:+ \\}
${TLS_CERT_FILE:+  --tls-manifest $OUTPUT_DIR/rendered-public/m5-tls.yaml}
\`\`\`

## 7. Public Cutover Apply

\`\`\`bash
bash scripts/apply-prod-public-cutover.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env${TLS_CERT_FILE:+ \\}
${TLS_CERT_FILE:+  --tls-manifest $OUTPUT_DIR/rendered-public/m5-tls.yaml}
\`\`\`

## 8. Verify and Rollback Ready

\`\`\`bash
bash scripts/verify-prod-public-endpoints.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env

bash scripts/rollback-prod-public-cutover.sh
\`\`\`
EOF

cat > "$OUTPUT_DIR/CUTOVER-LOG-PLAN.md" <<EOF
# Cutover Log Plan

\`\`\`text
infra/k8s/cutover-logs/<window-id>/
  00-formal-ready.log
  01-preflight.log
  02-server-dry-run.log
  03-apply.log
  04-verify.log
  05-rollback.log
  SUMMARY.md
\`\`\`

- `00-formal-ready.log`: 只在正式窗口 `--execute-apply` 时生成
- `01-preflight.log`: 集群预检与渲染 dry-run
- `02-server-dry-run.log`: Ingress / ConfigMap server dry-run
- `03-apply.log`: 正式 apply 窗口日志
- `04-verify.log`: DNS / TLS / health 校验
- `05-rollback.log`: 正式回滚日志
- `SUMMARY.md`: 窗口摘要与日志入口

## Evidence Rule

- 仅运行 readiness 时，至少归档 \`01-preflight.log\`、\`02-server-dry-run.log\`、\`04-verify.log\`
- 进入正式窗口时，必须归档完整 \`00~05\` 日志并保留 \`SUMMARY.md\`
- 若 \`00-formal-ready.log\` 不存在，说明并未真正通过正式窗口门禁，不得将该次运行计为 G8 完成
- 若 \`05-rollback.log\` 不存在，说明 rollback 证据未完成，G8 仍只能记为待补证据
EOF

cat > "$OUTPUT_DIR/FORMAL-WINDOW-CHECKLIST.md" <<EOF
# Formal Window Checklist

## External Materials

- [ ] DNS provider access for \`m5-platform.com\`
- [ ] Final production hosts confirmed for \`api / admin / storefront / tob\`
- [ ] PEM material ready: \`fullchain.pem\` and \`privkey.pem\`, or an equivalent live \`m5-tls\` secret source
- [ ] \`m5-tls\` manifest rendered or live cluster secret verified
- [ ] Four public A records point to the production NLB IPs

## Run Order

1. Run \`run-g8-formal-window-ready.sh\` without \`--execute-apply\` to confirm readiness.
2. During the formal window, run the same entry with \`--execute-apply --execute-rollback\`.
3. Archive \`infra/k8s/cutover-logs/<window-id>/\` as the single evidence directory.
4. Update the G8 acceptance record, resign checklist, and weekly RYG board with the final log directory.

## Done Standard

- \`00-formal-ready.log\` exists and ends with a passed readiness gate
- \`02-server-dry-run.log\`, \`03-apply.log\`, \`04-verify.log\`, and \`05-rollback.log\` all exist
- \`SUMMARY.md\` points to the exact log set used during the formal window
- The acceptance record explicitly links the final log directory
EOF

echo "Prepared cutover bundle:"
echo "  $OUTPUT_DIR"
echo "Bundle files:"
echo "  $OUTPUT_DIR/public-endpoints.env"
echo "  $OUTPUT_DIR/rendered-public"
if [[ -n "$RELEASE_ENV_FILE" ]]; then
  echo "  $OUTPUT_DIR/rendered-release"
fi
echo "  $OUTPUT_DIR/CUTOVER-COMMANDS.md"
echo "  $OUTPUT_DIR/CUTOVER-LOG-PLAN.md"
echo "  $OUTPUT_DIR/FORMAL-WINDOW-CHECKLIST.md"
