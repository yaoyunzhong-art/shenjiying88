#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
用法:
  scripts/preflight-k8s-release.sh \
    [--k8s-dir infra/k8s] \
    [--public-env-file infra/k8s/templates/m5-public-endpoints.env.example] \
    [--release-env-file infra/k8s/templates/m5-release-images.env.example]

目的:
  1. 校验 K8s 主清单是否仍引用旧的 GHCR 口径
  2. 校验 ConfigMap 中不再携带 DATABASE_URL 之类高敏值
  3. 校验 Secret 模板、Kustomize 和公网切流模板能本地静态通过
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
K8S_DIR="$ROOT_DIR/infra/k8s"
PUBLIC_ENV_FILE="$ROOT_DIR/infra/k8s/templates/m5-public-endpoints.env.example"
RELEASE_ENV_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --k8s-dir)
      K8S_DIR="${2:-}"
      shift 2
      ;;
    --public-env-file)
      PUBLIC_ENV_FILE="${2:-}"
      shift 2
      ;;
    --release-env-file)
      RELEASE_ENV_FILE="${2:-}"
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

if [[ ! -d "$K8S_DIR" ]]; then
  echo "::error::K8s 目录不存在: $K8S_DIR" >&2
  exit 1
fi

required_files=(
  "$K8S_DIR/kustomization.yaml"
  "$K8S_DIR/configmap.yaml"
  "$K8S_DIR/secret.yaml"
  "$K8S_DIR/api-deployment.yaml"
  "$K8S_DIR/admin-deployment.yaml"
  "$K8S_DIR/storefront-deployment.yaml"
  "$K8S_DIR/tob-deployment.yaml"
  "$ROOT_DIR/scripts/preflight-prod-public-cutover.sh"
  "$ROOT_DIR/scripts/render-prod-public-cutover.sh"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "::error::缺少必需文件: $file" >&2
    exit 1
  fi
done

release_source_files=(
  "$K8S_DIR/api-deployment.yaml"
  "$K8S_DIR/admin-deployment.yaml"
  "$K8S_DIR/storefront-deployment.yaml"
  "$K8S_DIR/tob-deployment.yaml"
  "$K8S_DIR/secret.yaml"
  "$K8S_DIR/kustomization.yaml"
)

if grep -n "ghcr-pull-secret\|ghcr.io" "${release_source_files[@]}" >/dev/null 2>&1; then
  echo "::error::K8s 生产发布面仍残留 GHCR 相关引用" >&2
  grep -n "ghcr-pull-secret\|ghcr.io" "${release_source_files[@]}" >&2 || true
  exit 1
fi

if grep -n "DATABASE_URL:" "$K8S_DIR/configmap.yaml" >/dev/null 2>&1; then
  echo "::error::configmap.yaml 不应再包含 DATABASE_URL" >&2
  exit 1
fi

if ! grep -n 'name: acr-regcred' "$K8S_DIR/secret.yaml" >/dev/null 2>&1; then
  echo "::error::secret.yaml 未提供 acr-regcred 模板" >&2
  exit 1
fi

if ! grep -n 'replace-with-real-postgres-password' "$K8S_DIR/secret.yaml" >/dev/null 2>&1; then
  echo "::error::secret.yaml 看起来不是占位模板，缺少占位值保护" >&2
  exit 1
fi

if command -v kubectl >/dev/null 2>&1; then
  kubectl kustomize "$K8S_DIR" >/dev/null
else
  echo "::warning::本机无 kubectl，跳过 kubectl kustomize 校验"
fi

if [[ -n "$RELEASE_ENV_FILE" ]]; then
  if [[ ! -f "$RELEASE_ENV_FILE" ]]; then
    echo "::error::release env 文件不存在: $RELEASE_ENV_FILE" >&2
    exit 1
  fi

  release_output_dir="$ROOT_DIR/infra/k8s/rendered-release-preflight"
  bash "$ROOT_DIR/scripts/render-k8s-release-manifests.sh" \
    --source-dir "$K8S_DIR" \
    --env-file "$RELEASE_ENV_FILE" \
    --output-dir "$release_output_dir" >/dev/null

  release_surface_files=(
    "$release_output_dir/api-deployment.yaml"
    "$release_output_dir/admin-deployment.yaml"
    "$release_output_dir/storefront-deployment.yaml"
    "$release_output_dir/tob-deployment.yaml"
    "$release_output_dir/kustomization.yaml"
  )

  if grep -n 'shenjiying88acr20260717-registry\.cn-hangzhou\.cr\.aliyuncs\.com/shenjiying88/m5-.*:latest\|newTag: latest' "${release_surface_files[@]}" >/dev/null 2>&1; then
    echo "::error::版本化后的 release surface 仍残留 latest" >&2
    exit 1
  fi

  if command -v kubectl >/dev/null 2>&1; then
    kubectl kustomize "$release_output_dir" >/dev/null
  fi
fi

if [[ -f "$PUBLIC_ENV_FILE" ]]; then
  bash "$ROOT_DIR/scripts/preflight-prod-public-cutover.sh" \
    --env-file "$PUBLIC_ENV_FILE" \
    --offline \
    --allow-missing-tls >/dev/null
else
  echo "::warning::未找到公网 env 模板，跳过公网切流离线预检: $PUBLIC_ENV_FILE"
fi

echo "K8s release preflight 通过:"
echo "- k8s dir: $K8S_DIR"
echo "- public env: $PUBLIC_ENV_FILE"
if [[ -n "$RELEASE_ENV_FILE" ]]; then
  echo "- release env: $RELEASE_ENV_FILE"
fi
