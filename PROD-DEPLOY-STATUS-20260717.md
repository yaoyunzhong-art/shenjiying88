# 生产部署状态清单（2026-07-17）

## 1. 当前稳态

- 命名空间：`m5`
- 当前对外入口：`m5-ingress`
- 当前存活业务 Deployment：
  - `m5-api = 1/1`
  - `m5-admin-web = 2/2`
  - `m5-storefront-web = 2/2`
  - `m5-tob-web = 1/1`

## 2. 已完成的部署链路收口

- `m5-api` 已切换到 ACR 镜像源并完成受控滚更。
- `m5-api` 当前镜像已收口到 digest：
  - `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/m5-api@sha256:bffffe15e2333e92e72a812bfeeb127f564944f1f3463631118d867d23da7ad3`
- `acr-regcred` 已完成刷新，`m5-api` digest 拉取 `401` 问题已收口。
- ACK 内 Kaniko 构建链路可用，最近一次 `kaniko-build-api` 已成功完成。
- `m5-api` 健康检查已恢复：
  - `/api/v1/health/ping = 200`
- Redis 鉴权问题已修复，`NOAUTH` 日志已消失。
- tracing 噪音已修复，`4318/ECONNREFUSED` 日志已消失。
- 生产库 `m5admin` 已通过 RDS 授权补齐数据库写库能力，当前实测：
  - `has_database_privilege(current_user, current_database(), 'CREATE') = true`
  - `has_schema_privilege(current_user, 'public', 'CREATE') = true`
- 已完成数据库初始化切片：
  - `foundation-wave0.sql`
  - `foundation-wave1.sql`
  - `foundation-wave2-wave3.sql`
  - `remaining-wave0.sql`
  - `phase-a-master-data.sql`
  - `phase-b-regional-portal.sql`
  - `phase-c-member-domain.sql`
  - `phase-d-ops-audit.sql`
- 当前生产库 `public` schema 已存在：
  - `52` 张表
  - `30` 个枚举
  - `34` 条外键
- `m5-api` 已在补表后完成受控重启，新 Pod 启动日志中已无 `P2021` / `ConfigInstance` 噪音。

## 3. 本轮仓库侧部署修正

- 已将以下前端 Deployment 镜像源从 `ghcr.io` 对齐到 ACR：
  - `infra/k8s/admin-deployment.yaml`
  - `infra/k8s/storefront-deployment.yaml`
  - `infra/k8s/tob-deployment.yaml`
- 已为以上三个前端 Deployment 增加 `acr-regcred` 拉镜像配置。
- 已将以上三个前端 Deployment 默认副本数调整为 `0`，与当前生产“未握手拉起前保持停机”策略对齐。
- 已新增标准前端 Kaniko 构建清单：
  - `infra/k8s/kaniko-build-frontends.yaml`
- 已补齐正式公网切换执行资产：
  - `scripts/lib-m5-kubeconfig.sh`
  - `scripts/render-prod-public-cutover.sh`
  - `scripts/verify-prod-public-endpoints.sh`
  - `scripts/build-m5-tls-secret.sh`
  - `scripts/verify-m5-tls-secret.sh`
  - `scripts/preflight-prod-public-cutover.sh`
  - `scripts/apply-prod-public-cutover.sh`
  - `scripts/rollback-prod-public-cutover.sh`
  - `infra/k8s/templates/m5-public-endpoints.env.example`
  - `infra/k8s/templates/m5-ingress-public.template.yaml`
  - `infra/k8s/templates/m5-config-public.template.yaml`
  - `infra/k8s/templates/m5-tls-secret.template.yaml`
  - `infra/k8s/templates/m5-public-dns-records.template.csv`

## 4. 当前明确 blocker

### 4.1 数据库权限

- 历史阻塞已收口：
  - 通过 `aliyun rds GrantAccountPrivilege --AccountName m5admin --DBName m5platform --AccountPrivilege DBOwner`
  - 现网运行账号 `m5admin` 已恢复 DDL 权限
- 当前已落库的关键对象包括：
  - `GovernanceApproval`
  - `RateLimitPolicy`
  - `QuotaLedger`
  - `ConfigInstance`
  - `ConfigAuditLog`
  - `AuditLog`
- 当前数据库主线已从“权限缺失”切换为“全量基线已落库，后续按业务需要补数据与回归”。

### 4.2 前端域名仍为本地占位

- 当前 `infra/k8s/ingress.yaml` 仍使用：
  - `api.m5.local`
  - `admin.m5.local`
  - `store.m5.local`
  - `tob.m5.local`
- 当前 `infra/k8s/configmap.yaml` 中前端公开地址仍引用这些本地占位域名。
- 当前现网 `Ingress` 与仓库配置保持一致，均指向这些 `.local` 域名。
- 当前 `Ingress` 已绑定 NLB：
  - `nlb-gjgd785d7s4albohcx.cn-hangzhou.nlb.aliyuncsslb.com`
  - `121.41.69.154`
  - `120.26.66.40`
- 当前 HTTP 路由已验证工作正常：
  - 访问 80 端口会按预期返回 `308 -> https://*.m5.local`
- 当前 HTTPS 入口也已验证可回源到四个服务，但 TLS 证书仍是 NGINX 默认假证书：
  - `Kubernetes Ingress Controller Fake Certificate`
- 集群内不存在：
  - `m5-tls` secret
  - `Certificate/CertificateRequest/Order/Challenge` 资源
- 当前正式公网入口 blocker 已明确为：
  - 正式 DNS 记录尚未创建
  - 正式 TLS 证书尚未签发/下发
  - `storefront/tob` 的正式域名命名方案尚未最终确定
- 仓库当前已具备“一键切换 + 一键回滚”脚本，但仍不能跳过上述外部前置条件。
- 仓库当前已补上“预检 + server dry-run”路径，即使域名后绑，也可继续推进集群兼容性校验。
- 当前公网切换脚本已支持自动发现生产 kubeconfig：
  - `KUBECONFIG`
  - `~/.kube/m5-prod-config`
  - `./.tmp/ack-kubeconfig.yaml`
- 阿里云资产审计补充结论：
  - 当前账号的 `alidns` 中不存在 `m5-platform.com`
  - 当前集群未安装 `cert-manager`
  - 因此正式域名切换不能依赖“现网自动签发证书”，必须先补 DNS 托管和证书来源

### 4.3 前端镜像尚未完成生产验收

- 仓库 CI 已具备前端镜像构建到 ACR 的定义。
- 当前 ACR 企业版中三个前端仓库已存在：
  - `m5-admin-web`
  - `m5-storefront-web`
  - `m5-tob-web`
- 三个前端当前已在生产稳态运行：
  - `m5-admin-web = 2/2`
  - `m5-storefront-web = 2/2`
  - `m5-tob-web = 1/1`
- 当前剩余前端主线不再是镜像可用性，而是正式生产域名、TLS 与公开入口配置对齐。
- 通过 `NLB IP + Host` 的方式已验证当前四个入口都能正确回源：
  - `api` 健康接口可达
  - `admin/storefront/tob` 首页 HTML 可返回

### 4.4 当前前端构建进度

- 历史 ACR 401 鉴权问题已通过刷新 `acr-regcred` 收口。
- 前端镜像链路已完成，当前运行重点转为入口域名和路由策略收口。

## 5. 下一步部署动作建议

### 5.1 生产部署侧可继续推进

- 继续保持当前稳态：
  - `m5-api = 1/1`
  - `m5-admin-web = 2/2`
  - `m5-storefront-web = 2/2`
  - `m5-tob-web = 1/1`
- 部署链路侧数据库阻塞已收口，当前 blocker 主要在正式域名与公网入口配置。
- 在正式域名未确认前，不直接开放新的前端流量面。

### 5.2 前端拉起前置条件

- 条件一：确认正式生产域名和 TLS 绑定方案。
- 条件二：确认三个前端镜像已成功进入 ACR。
- 条件三：确认前端运行时环境变量与 API 域名一致。
- 条件四：确认是否允许按 `admin -> storefront -> tob` 的顺序单副本灰度拉起。
- 当前条件二已满足。
- 当前条件一、三仍未满足，具体表现为：
  - `api/admin` 在 `infra/production-config.yaml` 中已有 `*.m5-platform.com` 草案
  - `store/tob` 仍缺正式域名定义
  - 现网和仓库 `NEXT_PUBLIC_API_URL/NEXT_PUBLIC_WS_URL/CORS_ORIGIN` 仍引用 `.local`
- 当前 `infra/k8s/templates/m5-public-endpoints.env.example` 已预填默认候选：
  - `store.m5-platform.com`
  - `tob.m5-platform.com`
  - 仅作为渲染占位，不视为最终业务定版
- 在域名后绑阶段，推荐先执行：
  - `scripts/preflight-prod-public-cutover.sh --env-file infra/k8s/templates/m5-public-endpoints.env.example --allow-missing-tls`
  - `scripts/apply-prod-public-cutover.sh --env-file infra/k8s/templates/m5-public-endpoints.env.example --kubectl-dry-run server --skip-tls-check`
- 若当前终端未挂载 ACK kubeconfig，则先走离线路径：
  - `scripts/preflight-prod-public-cutover.sh --env-file infra/k8s/templates/m5-public-endpoints.env.example --offline --allow-missing-tls`
  - `scripts/apply-prod-public-cutover.sh --env-file infra/k8s/templates/m5-public-endpoints.env.example --kubectl-dry-run client --offline --skip-tls-check`
- 当前 ACK 实证结果已补齐：
  - live `Ingress` hosts 仍为 `.local`
  - live `NEXT_PUBLIC_API_URL/NEXT_PUBLIC_WS_URL/CORS_ORIGIN` 仍为 `.local`
  - `m5-api=1/1`, `m5-admin-web=2/2`, `m5-storefront-web=2/2`, `m5-tob-web=1/1`
  - `preflight --allow-missing-tls` 已通过
  - `apply --kubectl-dry-run server --skip-tls-check` 已通过
  - 当前唯一硬阻塞继续收口到 `m5-tls` 缺失
- 证书后补阶段的最短路径也已预置：
  - `build-m5-tls-secret.sh`
  - `kubectl apply -f m5-tls.yaml`
  - `verify-m5-tls-secret.sh`
  - `apply-prod-public-cutover.sh --kubectl-dry-run server`

### 5.3 后端待命条件

- 数据库授权/迁移属于后端执行链路。
- 当前已完成：
  - foundation 全量切片落库
  - remaining wave0 落库
  - phase A/B/C/D 全量切片落库
  - `m5-api` 重启后的无噪音验证
- 当前后端主线从“补表”切换为“按业务需要补种子数据和接口回归”。

## 6. 推荐灰度顺序

- 第一步：`m5-api` 维持单副本稳态，持续观察日志和重启数。
- 第二步：完成生产域名与前端 API 地址对齐。
- 第三步：构建并核验 `m5-admin-web` ACR 镜像。
- 第四步：单副本拉起 `m5-admin-web`，只做管理端验证。
- 第五步：通过后再按同样方式拉起 `m5-storefront-web`。
- 第六步：最后拉起 `m5-tob-web`。

## 7. 当前执行口径

- 树哥主抓前端与生产部署。
- 后端事项由龙虾哥统一安排，树哥按指令执行。
- 所有生产动作继续遵循：
  - 最小变更
  - 单点验证
  - 有证据再扩面
  - 高风险动作必须带回滚预案
