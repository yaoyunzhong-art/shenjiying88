#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
用法:
  scripts/preflight-compose-deploy.sh \
    --environment staging \
    --registry <acr-host> \
    --registry-namespace <namespace> \
    --deploy-dir </opt/m5-staging> \
    --compose-file docker-compose.yml \
    --compose-file docker-compose.staging.yml
EOF
}

ENVIRONMENT=""
REGISTRY=""
REGISTRY_NAMESPACE=""
DEPLOY_DIR=""
COMPOSE_FILES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --registry)
      REGISTRY="$2"
      shift 2
      ;;
    --registry-namespace)
      REGISTRY_NAMESPACE="$2"
      shift 2
      ;;
    --deploy-dir)
      DEPLOY_DIR="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILES+=("$2")
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

if [[ -z "$ENVIRONMENT" || -z "$REGISTRY" || -z "$REGISTRY_NAMESPACE" || -z "$DEPLOY_DIR" || ${#COMPOSE_FILES[@]} -eq 0 ]]; then
  echo "缺少必填参数" >&2
  usage >&2
  exit 1
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "environment 仅支持 staging 或 production" >&2
  exit 1
fi

required_files=(
  "docker-compose.yml"
  "infra/docker/compose.env.example"
  "nginx/nginx.conf"
  "scripts/entrypoint-api.sh"
  "scripts/entrypoint-admin.sh"
  "scripts/entrypoint-storefront.sh"
  "scripts/entrypoint-tob.sh"
  "scripts/wait-for-it.sh"
)

if [[ "$ENVIRONMENT" == "staging" ]]; then
  required_files+=("docker-compose.staging.yml")
fi

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "::error::缺少部署文件: $file" >&2
    exit 1
  fi
done

if [[ "$REGISTRY" != *".cr.aliyuncs.com" ]]; then
  echo "::error::当前 registry 不是阿里云 ACR: $REGISTRY" >&2
  exit 1
fi

if [[ "$REGISTRY_NAMESPACE" != "shenjiying88" ]]; then
  echo "::warning::registry namespace 当前不是预期值 shenjiying88: $REGISTRY_NAMESPACE"
fi

if [[ "$DEPLOY_DIR" != /opt/* ]]; then
  echo "::error::deploy dir 必须是 /opt 下的绝对路径: $DEPLOY_DIR" >&2
  exit 1
fi

compose_tokens=()
for compose_file in "${COMPOSE_FILES[@]}"; do
  if [[ ! -f "$compose_file" ]]; then
    echo "::error::compose 文件不存在: $compose_file" >&2
    exit 1
  fi
  compose_tokens+=("-f" "$compose_file")
done

if command -v docker >/dev/null 2>&1; then
  docker compose "${compose_tokens[@]}" config -q
else
  echo "::warning::本机未安装 docker，跳过 compose config 校验"
fi

echo "预检通过:"
echo "- environment: $ENVIRONMENT"
echo "- registry: $REGISTRY"
echo "- registry namespace: $REGISTRY_NAMESPACE"
echo "- deploy dir: $DEPLOY_DIR"
echo "- compose files: ${COMPOSE_FILES[*]}"
