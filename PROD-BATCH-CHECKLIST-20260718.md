# 生产批量推进清单（2026-07-18）

## 1. 目标

- 将当前生产主线收口为单一执行口径，避免 `GHCR/SSH/docker compose` 旧链路与 `ACK/ACR/NLB` 现网链路混用。
- 在外部 DNS、TLS、正式域名尚未完全到位前，继续批量推进所有非写操作准备项。
- 在外部资产到位后，按同一颗粒度完成 `render -> preflight -> dry-run -> apply -> verify -> rollback ready`。

## 2. 当前已确认稳态

- 生产命名空间：`m5`
- 当前运行副本：
  - `m5-api = 1/1`
  - `m5-admin-web = 2/2`
  - `m5-storefront-web = 2/2`
  - `m5-tob-web = 1/1`
- 生产数据库 `m5platform` 基线已完成初始化：
  - `52` 张表
  - `30` 个枚举
  - `34` 条外键
- 当前公网切流唯一硬阻塞已收口到三项：
  - `storefront/tob` 正式域名未最终拍板
  - 正式 DNS 记录未创建
  - `m5-tls` 真实证书 Secret 未下发

## 3. 现在就能批量推进

### 3.1 非写操作预检

- 在线预检：

```bash
scripts/preflight-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --allow-missing-tls
```

- 在线 server dry-run：

```bash
scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --kubectl-dry-run server \
  --skip-tls-check
```

- 当前终端若无生产 kubeconfig，则先跑离线路径：

```bash
scripts/preflight-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --offline \
  --allow-missing-tls

scripts/apply-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --kubectl-dry-run client \
  --offline \
  --skip-tls-check
```

### 3.2 渲染资产固化

- 渲染当前候选公网配置，统一生成 `Ingress`、`ConfigMap`、DNS CSV：

```bash
scripts/render-prod-public-cutover.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --output-dir infra/k8s/rendered-public
```

- 交付物应至少包含：
  - `infra/k8s/rendered-public/m5-ingress-public.yaml`
  - `infra/k8s/rendered-public/m5-config-public.yaml`
  - `infra/k8s/rendered-public/m5-public-dns-records.csv`

### 3.3 证据归档

- 固化本轮证据：
  - live `Ingress` hosts 仍为 `.local`
  - live runtime URLs 仍为 `.local`
  - `preflight --allow-missing-tls` 已通过
  - `apply --kubectl-dry-run server --skip-tls-check` 已通过
- 推荐把最新执行结果附回：
  - `PROD-DEPLOY-STATUS-20260717.md`
  - `PROD-INGRESS-CUTOVER-20260718.md`
  - 本清单

### 3.4 后端承接动作

- 数据库主线停止继续补 schema，改为准备最小业务验收：
  - Phase A-D 最小种子数据清单
  - 核心接口 smoke 清单
  - 回归顺序与失败回滚口径

## 4. 必须外部配合的阻塞项

### 4.1 域名拍板

- 必须最终确认：
  - `storefront` 正式域名
  - `tob` 正式域名
- 当前候选值仅作渲染占位：
  - `store.m5-platform.com`
  - `tob.m5-platform.com`

### 4.2 DNS 托管

- 需将以下记录指向当前 NLB：
  - `api.m5-platform.com`
  - `admin.m5-platform.com`
  - `<storefront-host>`
  - `<tob-host>`
- 可选记录：
  - `m5-platform.com`
  - `www.m5-platform.com`

### 4.3 TLS 证书

- 生产切流前必须具备真实 `m5-tls` Secret。
- 当前最短路径为导入外部证书并生成 manifest：

```bash
scripts/build-m5-tls-secret.sh \
  --cert-file /path/to/fullchain.pem \
  --key-file /path/to/privkey.pem \
  --secret-name m5-tls \
  --namespace m5 \
  --output-file infra/k8s/rendered-public/m5-tls.yaml
```

## 5. 外部资产到位后的批量执行顺序

1. 生成 `m5-tls.yaml`
2. `kubectl apply -f infra/k8s/rendered-public/m5-tls.yaml`
3. 执行 `scripts/verify-m5-tls-secret.sh`
4. 再跑一次 `scripts/preflight-prod-public-cutover.sh`
5. 强制执行 `KUBECONFIG="$HOME/.kube/m5-prod-config" NAMESPACE=m5 bash scripts/pre-release-check.sh`
6. 再跑一次 `scripts/apply-prod-public-cutover.sh --kubectl-dry-run server`
7. 执行真实 `scripts/apply-prod-public-cutover.sh`
8. 验证 `api/admin/storefront/tob` 公网入口
9. 同终端保留 `scripts/rollback-prod-public-cutover.sh`

### 5.1 新增强制门禁

- 正式发布前，`scripts/pre-release-check.sh` 必须通过。
- 以下任一条件不满足，禁止继续执行真实 cutover：
  - `acr-regcred` 不存在于 `m5`
  - `acr-regcred.username` 为数字 `userId`
  - `acr-regcred.username` 为 `cr_temp_user`
  - `acr-regcred.username` 不是阿里云账户全名邮箱
- 推荐执行口径：

```bash
KUBECONFIG="$HOME/.kube/m5-prod-config" \
NAMESPACE=m5 \
bash scripts/pre-release-check.sh
```

## 6. 明确禁用口径

- 当前生产环境禁止继续使用以下旧链路执行正式公网发布：
  - `GHCR`
  - 未做预检的 `SSH + docker compose`
- `SSH + docker compose` 当前仅允许用于：
  - `staging` 发布
  - `production` 主机上的应急 compose 回退或临时验证
- 当前正式生产公网链路以以下资产为准：
  - `PROD-DEPLOY-STATUS-20260717.md`
  - `scripts/pre-release-check.sh`
  - `PROD-INGRESS-CUTOVER-20260718.md`
  - `scripts/preflight-prod-public-cutover.sh`
  - `scripts/apply-prod-public-cutover.sh`
  - `scripts/rollback-prod-public-cutover.sh`
- compose 链路入口以以下资产为准：
  - `.github/workflows/deploy.yml`
  - `docker-compose.yml`
  - `docker-compose.staging.yml`
  - `scripts/preflight-compose-deploy.sh`
  - `COMPOSE-DEPLOY-RUNBOOK.md`

## 7. 成功判定

- 正式 DNS 生效并指向当前 NLB
- HTTPS 返回真实业务证书而非 Fake Certificate
- `m5-api` 健康检查返回 `200`
- `admin/storefront/tob` 首页可访问
- `NEXT_PUBLIC_API_URL`、`NEXT_PUBLIC_WS_URL`、`CORS_ORIGIN` 全部切换为正式域名
- 回滚脚本在同一执行窗口内可直接使用
