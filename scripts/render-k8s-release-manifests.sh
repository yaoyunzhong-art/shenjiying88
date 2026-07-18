#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
用法:
  scripts/render-k8s-release-manifests.sh \
    --env-file infra/k8s/templates/m5-release-images.env.example \
    [--source-dir infra/k8s] \
    [--output-dir infra/k8s/rendered-release]

作用:
  1. 从 release env 模板读取四个业务镜像 tag
  2. 复制一份 K8s 清单到输出目录
  3. 将输出目录中的业务镜像和 kustomization tag 固化成明确版本
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/infra/k8s"
OUTPUT_DIR="$ROOT_DIR/infra/k8s/rendered-release"
ENV_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --source-dir)
      SOURCE_DIR="${2:-}"
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

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "source dir 不存在: $SOURCE_DIR" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

required_vars=(
  REGISTRY
  REGISTRY_NAMESPACE
  API_IMAGE_TAG
  ADMIN_WEB_IMAGE_TAG
  STOREFRONT_WEB_IMAGE_TAG
  TOB_WEB_IMAGE_TAG
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "缺少必需变量: $var_name" >&2
    exit 1
  fi
done

for tag_var in API_IMAGE_TAG ADMIN_WEB_IMAGE_TAG STOREFRONT_WEB_IMAGE_TAG TOB_WEB_IMAGE_TAG; do
  if [[ "${!tag_var}" == "latest" ]]; then
    echo "业务镜像 tag 不允许使用 latest: $tag_var" >&2
    exit 1
  fi
done

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
if command -v rsync >/dev/null 2>&1; then
  rsync -a \
    --exclude 'backups' \
    --exclude 'templates' \
    --exclude 'rendered-public' \
    --exclude 'rendered-public-preflight' \
    --exclude 'rendered-release' \
    --exclude 'rendered-release-preflight' \
    --exclude 'rendered-release-test' \
    --exclude 'cutover-bundles' \
    "$SOURCE_DIR"/ "$OUTPUT_DIR"/
else
  find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 \
    ! -name 'backups' \
    ! -name 'templates' \
    ! -name 'rendered-public' \
    ! -name 'rendered-public-preflight' \
    ! -name 'rendered-release' \
    ! -name 'rendered-release-preflight' \
    ! -name 'rendered-release-test' \
    ! -name 'cutover-bundles' \
    -exec cp -R {} "$OUTPUT_DIR"/ \;
fi

replace_image() {
  local file_path="$1"
  local image_name="$2"
  local image_tag="$3"
  local image_ref="${REGISTRY}/${REGISTRY_NAMESPACE}/${image_name}:${image_tag}"
  sed -i '' -E "s|${REGISTRY}/${REGISTRY_NAMESPACE}/${image_name}:[^[:space:]\"]+|${image_ref}|g" "$file_path"
}

replace_tag_in_kustomization() {
  local image_name="$1"
  local image_tag="$2"
  local image_ref="${REGISTRY}/${REGISTRY_NAMESPACE}/${image_name}"
  python3 - "$OUTPUT_DIR/kustomization.yaml" "$image_ref" "$image_tag" <<'PY'
import sys
from pathlib import Path

file_path = Path(sys.argv[1])
image_name = sys.argv[2]
new_tag = sys.argv[3]
lines = file_path.read_text().splitlines()
for i, line in enumerate(lines):
    if f"name: {image_name}" in line:
        for j in range(i + 1, min(i + 5, len(lines))):
            if "newTag:" in lines[j]:
                indent = lines[j].split("newTag:")[0]
                lines[j] = f"{indent}newTag: {new_tag}"
                break
file_path.write_text("\n".join(lines) + "\n")
PY
}

replace_image "$OUTPUT_DIR/api-deployment.yaml" "m5-api" "$API_IMAGE_TAG"
replace_image "$OUTPUT_DIR/admin-deployment.yaml" "m5-admin-web" "$ADMIN_WEB_IMAGE_TAG"
replace_image "$OUTPUT_DIR/storefront-deployment.yaml" "m5-storefront-web" "$STOREFRONT_WEB_IMAGE_TAG"
replace_image "$OUTPUT_DIR/tob-deployment.yaml" "m5-tob-web" "$TOB_WEB_IMAGE_TAG"

replace_tag_in_kustomization "m5-api" "$API_IMAGE_TAG"
replace_tag_in_kustomization "m5-admin-web" "$ADMIN_WEB_IMAGE_TAG"
replace_tag_in_kustomization "m5-storefront-web" "$STOREFRONT_WEB_IMAGE_TAG"
replace_tag_in_kustomization "m5-tob-web" "$TOB_WEB_IMAGE_TAG"

cat > "$OUTPUT_DIR/RELEASE-METADATA.env" <<EOF
REGISTRY=$REGISTRY
REGISTRY_NAMESPACE=$REGISTRY_NAMESPACE
API_IMAGE_TAG=$API_IMAGE_TAG
ADMIN_WEB_IMAGE_TAG=$ADMIN_WEB_IMAGE_TAG
STOREFRONT_WEB_IMAGE_TAG=$STOREFRONT_WEB_IMAGE_TAG
TOB_WEB_IMAGE_TAG=$TOB_WEB_IMAGE_TAG
RELEASE_NAME=${RELEASE_NAME:-}
RELEASE_CHANNEL=${RELEASE_CHANNEL:-}
EOF

echo "Rendered release manifests:"
echo "  $OUTPUT_DIR"
echo "Image tags:"
echo "  api=$API_IMAGE_TAG"
echo "  admin=$ADMIN_WEB_IMAGE_TAG"
echo "  storefront=$STOREFRONT_WEB_IMAGE_TAG"
echo "  tob=$TOB_WEB_IMAGE_TAG"
