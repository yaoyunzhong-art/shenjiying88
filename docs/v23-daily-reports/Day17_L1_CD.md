# Day17 L1: CI/CD + 部署配置审查

> **日期**: 2026-07-26 (Sun)
> **审查人**: 龙虾哥 (Subagent)
> **分支**: `tree/codeup-acr-ci-20260717`
> **审查范围**: `apps/admin-web/`, `apps/tob-web/`, `apps/storefront-web/`, `infras/`, `scripts/`, 根 Dockerfile, nginx/, docker-compose 系列

---

## ⭐ 综合评分: **B+ / 85分**

成熟度很高，CI/CD pipeline 完备，有几个中等问题需要修复。

---

## 1. 构建管道 (Dockerfile / Build)

### 1.1 构建策略

项目使用**双重 Dockerfile 策略**：

| 镜像 | 构建方式 | 状态 |
|------|----------|------|
| `m5-api` | 根 `Dockerfile` multi-stage（含 `api-prod` target） | ✅ 良好 |
| `m5-admin-web` | 根 `Dockerfile` (`admin-prod` target) **AND** `apps/admin-web/Dockerfile` | ⚠️ 双重维护 |
| `m5-storefront-web` | 根 `Dockerfile` (`storefront-prod` target) **AND** `apps/storefront-web/Dockerfile` | ⚠️ 双重维护 |
| `m5-tob-web` | 根 `Dockerfile` (`tob-prod` target) **AND** `apps/tob-web/Dockerfile` | ⚠️ 双重维护 |

**⚠️ 中等问题：前端存在两套 Dockerfile，构建路径不一致**

- **根 Dockerfile** 的 `admin-prod` target：直接 `COPY .next` 产物，依赖 `turbo build --filter=@m5/api...` 完成前置构建。这是一个**共享构建**模式，所有东西一起编译。
- **apps/\*/Dockerfile**（独立 multi-stage）：各自完成 `pnpm install` → `workspace packages build` → `next build` → `pnpm deploy`。这是**独立构建**模式。

**风险**：
- 根 Dockerfile 的 `admin-prod` target 引用了 `.next/standalone/apps/admin-web/server.js`，但 CMD 是 `node .next/standalone/apps/admin-web/server.js`——说明根 Dockerfile 的 `build` stage 里 `turbo build --filter=@m5/api...` 实际上也构建了三个前端。
- `kaniko-build-frontends.yaml` 中引用的是根 Dockerfile 的 `admin-prod` / `storefront-prod` / `tob-prod` targets，而独立 Dockerfile **可能在 CI 中未被使用**。
- **双重 Dockerfile 维护成本**：变更需要同步两处。

**建议**：
- 统一为一个 Dockerfile 策略。如果 Kaniko 用根 Dockerfile，删除 apps/\*/Dockerfile（或添加到 .dockerignore 避免混淆）。
- 当前根 Dockerfile 的 `api-prod` target 构建链路更合理（一次性依赖安装 → turbo build），建议以此为准。

### 1.2 Healthcheck 差异

| Target | Healthcheck 方式 | 端点 |
|--------|-----------------|------|
| `api-prod` (根 Dockerfile) | `node -e "fetch(...)"` | `/api/v1/health/ping` |
| `admin-prod` (根 Dockerfile) | `wget -qO-` | `/api/health` |
| `admin-prod` (独立 Dockerfile) | `wget -qO-` | `/` （**根路径**） |
| `storefront-prod` (独立) | `wget -qO-` | `/` |
| `tob-prod` (独立) | `wget -qO-` | `/` |

**⚠️ 低风险**：独立 Dockerfile 的 healthcheck 指向 `/` 而不是 `/api/health`。Next.js 的 `/` 可能返回 200（有页面），但这测试的不是 API 路由健康。根 Dockerfile 的 `admin-prod` 已修正为 `/api/health`。

### 1.3 镜像注册表

- **阿里云 ACR**: `shenjiying88acr20260717-registry.cn-hangzhou.cr.aliyuncs.com/shenjiying88/`
- **Kaniko 构建**: K8s Job 中通过 `kaniko-executor` 执行 `--target=api-prod` / `--target=admin-prod` 等
- **acr-regcred**: 有 `refresh-acr-regcred.sh` 和 `check-acr-regcred-expiry.sh` 做凭据轮换

✅ ACR 凭据管理完善。

### 1.4 基础镜像

- Node.js: `node:22-alpine`（通过 `docker.m.daocloud.io` 镜像代理）
- Nginx: `nginx:1.27-alpine`（通过 `docker.m.daocloud.io` 镜像代理）
- pnpm: `10.14.0`

✅ 镜像源使用国内 DaoCloud 代理，prisma engine 也配置了 `PRISMA_ENGINES_MIRROR` 国内源。

---

## 2. 编排 (Docker Compose)

### 2.1 docker-compose.yml（开发）

- PostgreSQL 15, Redis 7, API（NestJS）
- 网络: `m5-network` (bridge, 172.28.0.0/16)
- 日志: json-file, 10MB/3file rotation
- API 依赖 postgres + redis healthcheck before start

✅ 结构清晰，配置完善。

### 2.2 docker-compose.staging.yml

- 覆盖开发 compose，提供独立端口映射（55432, 16379 等）
- 有独立的 volumes 和 container names

### 2.3 docker-compose.dev.yml

- Qdrant 向量数据库（RAG 基础设施）
- 独立网络 `shenjiying-rag-net`

✅ 环境隔离清晰。

### 2.4 可用的 docker: 命令

从 `package.json` 可以看到完整的 docker 生命周期管理命令：
- `docker:up` / `docker:down` — 基础设施
- `docker:up:full` — 全量
- `docker:build:*` — 分别构建各模块
- `docker:prod:*` — 生产 compose
- `docker:clean` / `docker:prune` — 清理

✅ 命令体系完整。

---

## 3. K8s 部署 (infra/k8s/)

### 3.1 清单覆盖

| 资源 | 文件 | 状态 |
|------|------|------|
| Namespace | `namespace.yaml` | ✅ |
| ConfigMap | `configmap.yaml` | ✅ |
| Secret | `secret.yaml`（acr-regcred 模板） | ✅ |
| API Deployment | `api-deployment.yaml` | ✅ |
| Admin Deployment | `admin-deployment.yaml` | ✅ |
| Storefront Deployment | `storefront-deployment.yaml` | ✅ |
| ToB Deployment | `tob-deployment.yaml` | ✅ |
| PostgreSQL | `postgres-statefulset.yaml` | ✅ |
| Redis | `redis-deployment.yaml` | ✅ |
| RabbitMQ | `rabbitmq-deployment.yaml` | ✅ |
| MinIO | `minio-deployment.yaml` | ✅ |
| Ingress | `ingress.yaml` | ✅ |
| NetworkPolicy | `network-policy.yaml` | ✅ |
| PDB | `pod-disruption-budget.yaml` | ✅ |
| ResourceQuota | `resource-quota.yaml` | ✅ |
| Kaniko Build | `kaniko-build-api.yaml`, `kaniko-build-frontends.yaml` | ✅ |
| Monitoring | `monitoring-stack.yaml` | ✅ |
| Kustomize | `kustomization.yaml` | ✅ |

✅ 清单非常完整。

### 3.2 Kustomize 配置

`kubectl apply -k infra/k8s` 一键部署，镜像 tag 通过 `images.newTag` 管理。

### 3.3 镜像版本固化

`render-k8s-release-manifests.sh` 能够：
- 从 release env 模板读取四个业务镜像的 tag
- 生成固化版本的 rendered 清单
- **拒绝 `latest` tag**（安全检查）
- 输出 `RELEASE-METADATA.env` 记录版本信息

✅ 版本管理机制健全。

### 3.4 生产发布前置检查

`preflight-k8s-release.sh` 覆盖：
1. 必需文件存在性检查
2. GHCR 残留引用检查
3. ConfigMap 高敏值检查
4. Secret 占位值保护检查
5. kubectl kustomize 语法校验
6. release 渲染后 latest 残留检查
7. 公网切流模板离线检查
8. 可选 live 生产检查（acr-regcred expiry, TLS secret, public endpoints）

✅ 生产前置检查非常完善。

### 3.5 生产切流 (Cutover)

完整的 G8 生产切流体系：
- `preflight-prod-public-cutover.sh` — 公网切流预检
- `render-prod-public-cutover.sh` — 渲染公网切流 manifest
- `prepare-prod-cutover-bundle.sh` — 准备切流 bundle
- `run-g8-formal-window-ready.sh` — 正式窗口入口
- `run-g8-recheck.sh` — 二次确认
- `g8-window-status.sh` — 窗口状态
- `g8-closeout.sh` — 收尾
- `rollback-guide.sh` — 回滚指南

✅ 切流体系非常专业。

---

## 4. Terraform (infra/terraform/)

### 4.1 基础设施即代码

- 阿里云 ACK 托管版 K8s 集群
- 模块化: `modules/vpc/`
- 多环境: `environments/staging/`, `environments/production/`
- 有 `deploy-full.sh` 一键部署脚本
- 有 `import-existing.sh` 导入已有资源

✅ 基础设施即代码规范。

### 4.2 运维脚本

- `setup-ack-roles.sh` — RAM 角色设置
- `setup-csi-roles.sh` — CSI 驱动权限
- `setup-all-ack-roles.sh` — 一键设置所有角色

---

## 5. Nginx 反向代理

### 5.1 配置

- 子域路由: `api.*`, `admin.*`, `store.*`, `tob.*`
- SSL 证书管理（`ssl/`, `certs/`）
- `ssl-setup.sh` 自动化证书设置

### 5.2 Dockerfile

- 基于 `nginx:1.27-alpine`
- 非 root 运行

✅ 标准的反向代理设置。

---

## 6. Scripts 体系总览

`scripts/` 目录有 **~200 个脚本文件**，按功能分类：

| 类别 | 代表性脚本 | 数量 |
|------|-----------|------|
| 部署/发布 | `deploy-check.sh`, `preflight-*.sh`, `g8-*.sh`, `render-*.sh` | ~15 |
| K8s 运维 | `refresh-acr-regcred.sh`, `check-acr-regcred-expiry.sh`, `rollback-guide.sh` | ~10 |
| 数据库 | `backup-db.sh`, `restore-db.sh` | 2 |
| 安全 | `security-scan.sh`, `security-baseline-scan.sh`, `security-pentest.sh`, `authguard-coverage-check.sh` | ~10 |
| E2E 测试 | `phase*-e2e-*.ts` (Phase 25-49) | ~20+ |
| 知识库 | `knowledge-*.sh`, `extract-knowledge.py`, `lint-knowledge.py` | ~8 |
| 监控 | `monitoring-daily.sh`, `audit-*.sh`, `check-coverage.sh` | ~8 |
| 日常节奏 | `morning-dev-jobs.sh`, `nightly-*.sh`, `standup-prep.py` | ~10 |
| 工具 | `index-codebase.py`, `race-safe-commit.sh`, `commit-lint.sh`, `wait-for-it.sh` | ~10 |

✅ 脚本体系覆盖全面。

---

## 7. 入口脚本 (Entrypoints)

三个前端入口脚本完全一致（仅端口和路径不同）：
- 等待 API 就绪（最多 30 次 × 3s = 90s）
- 启动 Next.js standalone server

✅ 启动顺序控制正确。

---

## 8. 发现的问题 & 建议

### 8.1 🔴 中等问题

1. **双重 Dockerfile 维护** — 根 Dockerfile 和 apps/\*/Dockerfile 都能构建前端镜像，但构建路径不同。
   - **建议**: 统一为一种策略。如果 Kaniko CI 用根 Dockerfile，删除 apps/\*/Dockerfile 或加注释说明用途。

2. **`infras/` 目录为空** — `find infras -type f` 返回空，但 `infra/`（不带 s）有完整内容。
   - **建议**: 检查是否有多余的空目录 `infras/`，或确认期望的路径是 `infra/`。

### 8.2 🟡 低风险

3. **独立 Dockerfile healthcheck 指向 `/`** — apps/storefront-web/Dockerfile 和 apps/tob-web/Dockerfile 的 healthcheck 测试 `http://127.0.0.1:3003/`（根路径）而不是 `/api/health`。
   - 根 Dockerfile 的 `admin-prod` target 已修正为 `/api/health`。
   - **影响**: 如果首页是 ISR/SSR 页面，healthcheck 可能受渲染延迟影响。`/api/health` 更可靠。

4. **Terraform state 为 local backend** — `backend "local"` 意味着 state 文件在本地文件系统。
   - **建议**: 生产环境考虑迁移到远程 backend（如阿里云 OSS），避免多人协作冲突。

5. **Kaniko 构建镜像 tag 为 `latest`** — `kaniko-build-api.yaml` 中 `--destination=...:latest`，需要 `render-k8s-release-manifests.sh` 后处理才能固化。
   - **影响**: 如果跳过 render 步骤直接 apply Kaniko 产物，会使用 `latest` tag。

### 8.3 ✅ 优点

- 生产发布有完整的前置检查、切流窗口、回滚指南
- acr-regcred 凭据管理有自动刷新和过期检查
- 数据库有备份/恢复脚本
- K8s 清单覆盖所有组件（API、三个前端、PG、Redis、RabbitMQ、MinIO、Ingress、NetworkPolicy、PDB、ResourceQuota）
- Terraform 管理基础设施
- pnpm + Turbo + monorepo 的构建配置成熟
- Nginx 反向代理 + SSL 证书管理完善

---

## 9. 总结

| 维度 | 评分 | 备注 |
|------|------|------|
| 构建配置 | B+ | 双重 Dockerfile 需统一 |
| 容器编排 | A- | docker-compose 完善，多环境隔离 |
| K8s 部署 | A | 清单完整，preflight 专业 |
| 发布流程 | A | 切流窗口 + 回滚体系成熟 |
| 基础设施 | B+ | Terraform local state 需迁移 |
| 运维脚本 | A- | 覆盖全面，~200 个脚本 |

**综合评价: B+ / 85分** — 成熟的生产级 CI/CD 体系，需清理双重 Dockerfile 和统一 healthcheck 端点。
