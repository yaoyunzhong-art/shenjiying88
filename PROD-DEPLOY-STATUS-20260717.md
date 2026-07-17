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

## 3. 本轮仓库侧部署修正

- 已将以下前端 Deployment 镜像源从 `ghcr.io` 对齐到 ACR：
  - `infra/k8s/admin-deployment.yaml`
  - `infra/k8s/storefront-deployment.yaml`
  - `infra/k8s/tob-deployment.yaml`
- 已为以上三个前端 Deployment 增加 `acr-regcred` 拉镜像配置。
- 已将以上三个前端 Deployment 默认副本数调整为 `0`，与当前生产“未握手拉起前保持停机”策略对齐。
- 已新增标准前端 Kaniko 构建清单：
  - `infra/k8s/kaniko-build-frontends.yaml`

## 4. 当前明确 blocker

### 4.1 数据库权限

- 现网运行账号 `m5admin` 仅具备 `public` schema 的 `USAGE`，不具备：
  - 数据库级 `CREATE`
  - `public` schema 级 `CREATE`
- 已在生产运行 Pod 内实测：
  - `has_database_privilege(current_user, current_database(), 'CREATE') = false`
  - `has_schema_privilege(current_user, 'public', 'CREATE') = false`
- 直接执行 `foundation-wave0.sql` 已被数据库拒绝，报错：
  - `permission denied for database m5platform`
  - `permission denied for schema public`
- 导致 `prisma migrate deploy` 和当前 foundation 初始化脚本都无法落库。
- 当前影响：
  - `AuditLog`
  - `GovernanceApproval`
  - `RateLimitPolicy`
  - `QuotaLedger`
  - `ConfigInstance`
  - `ConfigAuditLog`
  相关持久化表仍未建立。

### 4.2 前端域名仍为本地占位

- 当前 `infra/k8s/ingress.yaml` 仍使用：
  - `api.m5.local`
  - `admin.m5.local`
  - `store.m5.local`
  - `tob.m5.local`
- 当前 `infra/k8s/configmap.yaml` 中前端公开地址仍引用这些本地占位域名。
- 在未拿到正式生产域名之前，不应直接拉起前端流量。

### 4.3 前端镜像尚未完成生产验收

- 仓库 CI 已具备前端镜像构建到 ACR 的定义。
- 当前 ACR 企业版中三个前端仓库已存在：
  - `m5-admin-web`
  - `m5-storefront-web`
  - `m5-tob-web`
- 但截至本清单更新时间，三个前端仓库仍无任何 tag，说明镜像构建尚未完成入仓。
- 当前生产上三个前端仍保持 `0` 副本，尚未做：
  - ACR 镜像存在性验证
  - 单副本拉起验证
  - Ingress 路由可达验证
  - 首屏与 API 联通回归

### 4.4 当前前端构建进度

- `kaniko-build-admin-web` 已在 ACK 内拉起并进入运行中。
- 第一轮失败原因为 `acr-regcred` 过期导致 `push permission 401`。
- 现已完成 ACR 临时凭据刷新并重启构建。
- 当前目标：先验证 `m5-admin-web` 的 ACR 构建链，再决定是否扩到 `storefront/tob`。

## 5. 下一步部署动作建议

### 5.1 生产部署侧可继续推进

- 继续保持当前稳态：
  - `m5-api = 1/1`
  - `m5-admin-web = 2/2`
  - `m5-storefront-web = 2/2`
  - `m5-tob-web = 1/1`
- 部署链路侧 blocker 已切换为数据库权限，而非镜像链路。
- 在正式域名未确认前，不直接开放新的前端流量面。

### 5.2 前端拉起前置条件

- 条件一：确认正式生产域名和 TLS 绑定方案。
- 条件二：确认三个前端镜像已成功进入 ACR。
- 条件三：确认前端运行时环境变量与 API 域名一致。
- 条件四：确认是否允许按 `admin -> storefront -> tob` 的顺序单副本灰度拉起。

### 5.3 后端待命条件

- 数据库授权/迁移属于后端执行链路。
- 当前已准备好：
  - foundation/remaining SQL 切片
  - verify SQL
  - rollback SQL
  - 时间窗执行清单
- 但现网运行凭据不足以执行 DDL。
- 等待龙虾哥确认以下任一方案后，再执行后端持久化恢复动作：
  - 为 `m5admin` 补齐数据库与 `public` schema 的 `CREATE`
  - 提供具备 DDL 权限的独立执行账号

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
