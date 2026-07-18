#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_ENV_FILE="$ROOT_DIR/infra/k8s/templates/m5-public-endpoints.env.example"
RELEASE_ENV_FILE="$ROOT_DIR/infra/k8s/templates/m5-release-images.env.example"
RELEASE_OUTPUT_DIR="$ROOT_DIR/infra/k8s/rendered-release-drill"
PUBLIC_PREFLIGHT_DIR="$ROOT_DIR/infra/k8s/rendered-public-preflight-drill"
PUBLIC_APPLY_DIR="$ROOT_DIR/infra/k8s/rendered-public-apply-drill"
BUNDLE_DIR="$ROOT_DIR/infra/k8s/cutover-bundles/drill-$(date +%Y%m%d-%H%M%S)"

echo "==> 1/5 render release manifests"
rm -rf "$RELEASE_OUTPUT_DIR"
bash "$ROOT_DIR/scripts/render-k8s-release-manifests.sh" \
  --env-file "$RELEASE_ENV_FILE" \
  --output-dir "$RELEASE_OUTPUT_DIR"

echo
echo "==> 2/5 preflight k8s release"
bash "$ROOT_DIR/scripts/preflight-k8s-release.sh" \
  --k8s-dir "$ROOT_DIR/infra/k8s" \
  --public-env-file "$PUBLIC_ENV_FILE" \
  --release-env-file "$RELEASE_ENV_FILE"

echo
echo "==> 3/5 preflight public cutover (offline)"
rm -rf "$PUBLIC_PREFLIGHT_DIR"
bash "$ROOT_DIR/scripts/preflight-prod-public-cutover.sh" \
  --env-file "$PUBLIC_ENV_FILE" \
  --rendered-dir "$PUBLIC_PREFLIGHT_DIR" \
  --offline \
  --allow-missing-tls

echo
echo "==> 4/5 client dry-run public cutover (offline)"
rm -rf "$PUBLIC_APPLY_DIR"
bash "$ROOT_DIR/scripts/apply-prod-public-cutover.sh" \
  --env-file "$PUBLIC_ENV_FILE" \
  --rendered-dir "$PUBLIC_APPLY_DIR" \
  --kubectl-dry-run client \
  --offline \
  --skip-tls-check

echo
echo "==> 5/5 prepare cutover bundle"
rm -rf "$BUNDLE_DIR"
bash "$ROOT_DIR/scripts/prepare-prod-cutover-bundle.sh" \
  --env-file "$PUBLIC_ENV_FILE" \
  --release-env-file "$RELEASE_ENV_FILE" \
  --output-dir "$BUNDLE_DIR" || true

echo
echo "==> drill summary"
echo "release manifests: $RELEASE_OUTPUT_DIR"
echo "public preflight: $PUBLIC_PREFLIGHT_DIR"
echo "public apply: $PUBLIC_APPLY_DIR"
echo "bundle dir: $BUNDLE_DIR"
