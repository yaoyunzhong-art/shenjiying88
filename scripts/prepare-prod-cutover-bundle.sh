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

## 1. K8s Release Preflight

\`\`\`bash
bash scripts/preflight-k8s-release.sh \\
  --k8s-dir infra/k8s \\
  --public-env-file $ENV_FILE${RELEASE_ENV_FILE:+ \\}
${RELEASE_ENV_FILE:+  --release-env-file $RELEASE_ENV_FILE}
\`\`\`

## 2. TLS Verify

\`\`\`bash
bash scripts/verify-m5-tls-secret.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env
\`\`\`

## 3. Public Cutover Preflight

\`\`\`bash
bash scripts/preflight-prod-public-cutover.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env
\`\`\`

## 4. Public Cutover Dry Run

\`\`\`bash
bash scripts/apply-prod-public-cutover.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env \\
  --kubectl-dry-run server${TLS_CERT_FILE:+ \\}
${TLS_CERT_FILE:+  --tls-manifest $OUTPUT_DIR/rendered-public/m5-tls.yaml}
\`\`\`

## 5. Public Cutover Apply

\`\`\`bash
bash scripts/apply-prod-public-cutover.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env${TLS_CERT_FILE:+ \\}
${TLS_CERT_FILE:+  --tls-manifest $OUTPUT_DIR/rendered-public/m5-tls.yaml}
\`\`\`

## 6. Verify and Rollback Ready

\`\`\`bash
bash scripts/verify-prod-public-endpoints.sh \\
  --env-file $OUTPUT_DIR/public-endpoints.env

bash scripts/rollback-prod-public-cutover.sh
\`\`\`
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
