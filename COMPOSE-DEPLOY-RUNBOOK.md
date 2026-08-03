# Compose Deploy Runbook

## 目标

- 定义 `SSH + docker compose` 发布链的唯一适用范围。
- 让 `staging` 和 `应急回退` 有一套可预检、可执行、可交接的口径。
- 避免它继续和 `ACK + ACR + Ingress` 的正式生产公网切流链混用。

## 适用范围

- 允许：
  - `staging` 环境发布
  - `production` 主机上的应急 compose 回退或临时验证
- 不允许：
  - 作为正式公网生产切流主链
  - 替代 `ACK` 上的 `Ingress / TLS / DNS` 切换流程

## 关键文件

- [deploy.yml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/.github/workflows/deploy.yml)
- [docker-compose.yml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docker-compose.yml)
- [docker-compose.staging.yml](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docker-compose.staging.yml)
- [compose.env.example](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/docker/compose.env.example)
- [preflight-compose-deploy.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/preflight-compose-deploy.sh)
- [PROD-BATCH-CHECKLIST-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-BATCH-CHECKLIST-20260718.md)

## CI Secrets

- `ACR_USERNAME`
- `ACR_PASSWORD`
- `DEPLOY_SSH_KEY`
- `STAGING_SSH_HOST`
- `STAGING_SSH_USER`
- `STAGING_SSH_PORT`
- `PROD_SSH_HOST`
- `PROD_SSH_USER`
- `PROD_SSH_PORT`

## 发布前预检

先在仓库根目录执行：

```bash
bash scripts/preflight-compose-deploy.sh \
  --environment staging \
  --registry shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com \
  --registry-namespace shenjiying88 \
  --deploy-dir /opt/m5-staging \
  --compose-file docker-compose.yml \
  --compose-file docker-compose.staging.yml
```

生产应急 compose 路径改成：

```bash
bash scripts/preflight-compose-deploy.sh \
  --environment production \
  --registry shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com \
  --registry-namespace shenjiying88 \
  --deploy-dir /opt/m5 \
  --compose-file docker-compose.yml
```

## 手动发布口径

### Staging

```bash
export BUILD_TAG=<tag>
export API_IMAGE=shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-api
export ADMIN_WEB_IMAGE=shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-admin-web
export STOREFRONT_WEB_IMAGE=shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-storefront-web
export TOB_WEB_IMAGE=shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-tob-web

docker compose -f docker-compose.yml -f docker-compose.staging.yml pull
docker compose -f docker-compose.yml -f docker-compose.staging.yml run --rm --no-deps api \
  npx prisma migrate deploy --schema ./prisma/schema.prisma
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --no-deps --remove-orphans
curl -sf http://localhost:3101/api/v1/health/ping
```

### Production 应急 compose

```bash
export BUILD_TAG=<tag>
docker compose -f docker-compose.yml pull
docker compose -f docker-compose.yml run --rm --no-deps api \
  npx prisma migrate deploy --schema ./prisma/schema.prisma
docker compose -f docker-compose.yml up -d --no-deps --remove-orphans
curl -sf http://localhost:3001/api/v1/health/ping
```

## 回滚口径

- compose 链只负责镜像版本回退和容器重启。
- 正式公网入口回滚继续按：
  - [rollback-prod-public-cutover.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/rollback-prod-public-cutover.sh)
- 数据库回滚继续按：
  - [rollback-all.sql](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/sql/prod-db/rollback/rollback-all.sql)
  - [rollback-prod-db-bootstrap-draft.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/rollback-prod-db-bootstrap-draft.sh)

## 禁止事项

- 不要用 compose 链替代 `ACK` 正式生产切流。
- 不要在同一窗口混跑 `compose deploy` 和 `prod public cutover`。
- 不要跳过预迁移直接起新镜像。
- 不要继续使用未配置 ACR 镜像变量的旧 compose 方式。
