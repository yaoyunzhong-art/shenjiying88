# M5 部署指南

> **适用范围**: 店A上线前首次部署 / 服务迁移 / 环境重建
> **版本**: v1.0 · 2026-07-13
> **Monorepo**: `shenjiying-m5` · pnpm@10.14.0 · Turborepo

---

## 目录

1. [环境要求](#1-环境要求)
2. [项目结构速览](#2-项目结构速览)
3. [基础设施部署](#3-基础设施部署)
4. [环境变量配置](#4-环境变量配置)
5. [NestJS API 部署](#5-nestjs-api-部署)
6. [Next.js 前端部署](#6-nextjs-前端部署)
7. [Docker 生产部署](#7-docker-生产部署)
8. [数据库迁移](#8-数据库迁移)
9. [健康检查与验证](#9-健康检查与验证)
10. [启动脚本速查](#10-启动脚本速查)
11. [常见排错](#11-常见排错)

---

## 1. 环境要求

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| **Node.js** | ≥ 22 | 生产使用 `node:22-alpine` 镜像 |
| **pnpm** | 10.14.0 | 通过 `corepack enable` 管理 |
| **Docker** | ≥ 24 | 容器化部署 |
| **Docker Compose** | v2 | 编排基础设施与服务 |
| **PostgreSQL** | ≥ 15 | 主数据库 |
| **Redis** | ≥ 7 | 缓存 / Session |
| **RabbitMQ** | ≥ 3.13 | 消息队列 |
| **MinIO** | ≥ latest | 对象存储 (文件/图片) |
| **Qdrant** | 1.10.0 | 向量数据库 (RAG/AI Reviewer) |

> 💡 **本地开发**仅需 Docker 启动基础设施，前端代码通过 `pnpm dev` 热重载。
> **生产部署**推荐全部走 Docker Compose 或 K8s。

---

## 2. 项目结构速览

```
shenjiying88/
├── apps/
│   ├── api/              # NestJS 后端 (port 3001)
│   ├── admin-web/        # Next.js 管理后台 (port 3002)
│   ├── storefront-web/   # Next.js 前台 (port 3003)
│   ├── tob-web/          # Next.js 企业版 (port 3011)
│   ├── app/              # React Native (移动端)
│   ├── mobile/           # 移动端
│   └── miniapp/          # 小程序
├── packages/
│   ├── domain/           # 领域逻辑
│   ├── sdk/              # SDK
│   ├── types/            # 公共类型
│   ├── ui/               # 共享 UI 组件
│   └── config-typescript/# TS 配置
├── infra/
│   └── docker/
│       └── docker-compose.dev.yml   # 本地基础设施
├── docker-compose.yml               # 生产编排 (含 nginx + certbot)
├── docker-compose.dev.yml           # Phase-19 RAG 本地基础设施
├── Dockerfile                        # 多阶段构建 (5 个 target)
└── .env                              # 环境变量
```

---

## 3. 基础设施部署

### 3.1 本地开发基础设施

```bash
# 启动 PostgreSQL + Redis + RabbitMQ + MinIO
pnpm docker:up

# 启动全部（含 Qdrant 向量数据库）
pnpm docker:up:full

# 查看日志
pnpm docker:logs

# 停止
pnpm docker:down
```

**端口映射** (均绑定 `127.0.0.1`):

| 服务 | 端口 | 用途 |
|------|------|------|
| PostgreSQL | 5432 | 主数据库 |
| Redis | 6379 | 缓存 |
| RabbitMQ | 5672 | 消息队列 |
| RabbitMQ Mgmt | 15672 | 管理面板 |
| MinIO API | 9000 | 对象存储 |
| MinIO Console | 9001 | 管理面板 |
| Qdrant HTTP | 6333 | 向量数据库 REST API |
| Qdrant gRPC | 6334 | 向量数据库 gRPC |

### 3.2 生产基础设施

生产环境使用 `docker-compose.yml`（根目录），包含完整服务编排：

```bash
# 启动全部 (含 nginx + certbot + 所有应用)
docker compose -f docker-compose.yml up -d

# 仅启动数据库等基础设施（应用单独部署时使用）
docker compose -f docker-compose.yml up -d postgres redis rabbitmq minio

# 停止
docker compose -f docker-compose.yml down
```

> ⚠️ 生产环境请务必修改 `.env` 中所有密码和密钥。

---

## 4. 环境变量配置

### 4.1 首次配置

```bash
# 基于模板创建 .env
cp .env.example .env

# 编辑 .env，修改以下关键值（生产环境必须修改）：
# - POSTGRES_PASSWORD / DATABASE_URL
# - REDIS_PASSWORD
# - RABBITMQ_PASSWORD
# - MINIO_SECRET_KEY
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

### 4.2 关键环境变量一览

| 变量 | 说明 | 开发默认值 |
|------|------|-----------|
| `NODE_ENV` | 运行环境 | `development` |
| `API_PORT` | API 端口 | `3001` |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://postgres:postgres@127.0.0.1:5432/shenjiying` |
| `REDIS_HOST` | Redis 地址 | `localhost` |
| `RABBITMQ_HOST` | RabbitMQ 地址 | `localhost` |
| `MINIO_ENDPOINT` | MinIO 地址 | `localhost` |
| `JWT_SECRET` | JWT 签名密钥 | **必须修改** |
| `JWT_REFRESH_SECRET` | Refresh Token 密钥 | **必须修改** |
| `CORS_ORIGIN` | 允许的跨域源 | `http://localhost:3002,http://localhost:3003,http://localhost:3011` |
| `LOG_LEVEL` | 日志级别 | `debug` (开发) / `info` (生产) |

> 📝 完整变量列表参见 `.env.example`。

---

## 5. NestJS API 部署

### 5.1 本地开发启动

```bash
# 先确保基础设施已启动 (PostgreSQL + Redis + RabbitMQ)
pnpm docker:up

# 安装依赖
pnpm install

# 数据库迁移
pnpm --filter @m5/api prisma:migrate:deploy

# 启动开发服务（含热重载）
pnpm dev
```

API 默认运行在 `http://localhost:3001`，Swagger 文档在 `http://localhost:3001/api-docs`。

### 5.2 生产构建与启动

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 构建
pnpm build

# 3. 数据库迁移
pnpm --filter @m5/api prisma:migrate:deploy

# 4. 启动
pnpm --filter @m5/api start
```

> 💡 生产环境推荐使用 Docker 部署（见第 7 节）。

---

## 6. Next.js 前端部署

### 6.1 本地开发启动（自动随 `pnpm dev` 启动）

```bash
pnpm dev
```

| 前端 | 端口 | 说明 |
|------|------|------|
| admin-web | 3002 | 管理后台 |
| storefront-web | 3003 | 前台 |
| tob-web | 3011 | 企业版 |

### 6.2 独立运行

```bash
# 构建
pnpm --filter @m5/admin-web build

# 启动
pnpm --filter @m5/admin-web start

# 或直接使用 next
cd apps/admin-web && node .next/standalone/apps/admin-web/server.js
```

> 🔧 生产环境使用 Docker 多阶段构建的 standalone 输出模式。

---

## 7. Docker 生产部署

### 7.1 镜像构建

```bash
# 构建所有服务镜像（并行）
pnpm docker:build

# 或逐个构建
pnpm docker:build:api       # → m5-api:latest         (port 3001)
pnpm docker:build:admin     # → m5-admin:latest        (port 3002)
pnpm docker:build:storefront # → m5-storefront:latest  (port 3003)
pnpm docker:build:tob       # → m5-tob:latest          (port 3011)
```

### 7.2 Dockerfile 多阶段构建说明

`Dockerfile` 定义了 5 个 target：

| Target | 基阶段 | 用途 | 暴露端口 |
|--------|--------|------|---------|
| `base` | `node:22-alpine` | 基础环境 (pnpm + tini) | — |
| `deps` | base | 依赖安装 (frozen lockfile) | — |
| `build` | deps | 全量构建 | — |
| `api-prod` | base | NestJS 生产镜像 | 3001 |
| `admin-prod` | base | 管理后台生产镜像 | 3002 |
| `storefront-prod` | base | 前台生产镜像 | 3003 |
| `tob-prod` | base | 企业版生产镜像 | 3011 |

### 7.3 完整生产启动

```bash
# 1. 构建镜像
pnpm docker:build

# 2. 启动生产环境（含 nginx 反向代理 + HTTPS 自动续签）
pnpm docker:prod:up

# 3. 检查状态
pnpm docker:prod:ps

# 4. 查看日志
pnpm docker:prod:logs

# 5. 重启
pnpm docker:prod:restart

# 6. 停止
pnpm docker:prod:down
```

### 7.4 Nginx 反向代理

生产环境通过 `nginx` 服务统一入口（端口 80/443）：

| 域名路径 | 后端服务 |
|----------|---------|
| `api.xxx.com` | `api:3001` |
| `admin.xxx.com` | `admin-web:3002` |
| `store.xxx.com` | `storefront-web:3003` |
| `tob.xxx.com` | `tob-web:3011` |

HTTPS 证书由 `certbot` 自动管理（Let's Encrypt）。

---

## 8. 数据库迁移

### 8.1 Prisma 操作

```bash
# 生成 Prisma Client
pnpm --filter @m5/api prisma:generate

# 查看迁移状态
pnpm --filter @m5/api prisma:migrate:status

# 执行待处理迁移
pnpm --filter @m5/api prisma:migrate:deploy
```

### 8.2 首次部署流程

```bash
# 1. 启动 PostgreSQL
pnpm docker:up

# 2. 安装依赖
pnpm install

# 3. 生成 Prisma Client
pnpm --filter @m5/api prisma:generate

# 4. 执行迁移
pnpm --filter @m5/api prisma:migrate:deploy
```

---

## 9. 健康检查与验证

### 9.1 API 健康检查

```bash
# 生产环境
curl http://localhost:3001/health
curl https://api.xxx.com/health

# 期望响应
# {"status":"ok","timestamp":"2026-07-13T01:00:00.000Z","uptime":1234}
```

### 9.2 基础设施健康检查

```bash
# PostgreSQL
pg_isready -h localhost -p 5432

# Redis
redis-cli ping  # 期望: PONG

# RabbitMQ
curl -u guest:guest http://localhost:15672/api/health/checks/alarms

# MinIO
curl http://localhost:9000/minio/health/live

# Qdrant
curl http://localhost:6333/healthz  # 期望: {"status":"ok"}
```

### 9.3 E2E 冒烟测试

```bash
# 本地开发（需要 dev server 运行中）
pnpm e2e:smoke

# 图形模式调试
pnpm e2e:smoke:headed

# 查看测试报告
pnpm e2e:report
```

---

## 10. 启动脚本速查

| 场景 | 命令 |
|------|------|
| 安装依赖 | `pnpm install` |
| 冻结安装 | `pnpm install --frozen-lockfile` |
| 启动基础设施 | `pnpm docker:up` |
| 启动全部开发 | `pnpm dev` |
| 构建全部 | `pnpm build` |
| 运行测试 | `pnpm test` |
| 类型检查 | `pnpm typecheck` |
| 代码检查 | `pnpm lint` |
| 构建 Docker 镜像 | `pnpm docker:build` |
| 启动生产 | `pnpm docker:prod:up` |
| 查看生产日志 | `pnpm docker:prod:logs` |
| 停止生产 | `pnpm docker:prod:down` |
| 数据库迁移 | `pnpm --filter @m5/api prisma:migrate:deploy` |
| E2E 冒烟测试 | `pnpm e2e:smoke` |
| 清理 Docker | `pnpm docker:clean` |
| 彻底清理 | `pnpm docker:prune` |

---

## 11. 常见排错

### 11.1 pnpm 安装失败

```bash
# 清除缓存重试
pnpm store prune
rm -rf node_modules
pnpm install

# 检查 lockfile 一致性
pnpm install --frozen-lockfile --fix-lockfile
```

### 11.2 数据库连接失败

```bash
# 检查 PostgreSQL 是否运行
docker ps | grep postgres

# 检查连接参数
echo $DATABASE_URL

# 尝试直接连接
psql "$DATABASE_URL"
```

### 11.3 Prisma Client 未生成

```bash
pnpm --filter @m5/api prisma:generate
# 如果失败，检查 prisma/schema.prisma 是否存在
ls apps/api/prisma/schema.prisma
```

### 11.4 Docker 构建失败

```bash
# 清理构建缓存
docker builder prune -f

# 不使用缓存构建
docker build --no-cache --target=api-prod -t m5-api:latest .

# 检查 Dockerfile 语法
docker build --check .
```

### 11.5 Next.js 构建输出为空

Next.js standalone 模式需要正确的 `next.config.mjs` 配置：

```js
// 确认 next.config.mjs 包含:
const nextConfig = {
  output: 'standalone',
  // ...
};
```

### 11.6 端口冲突

```bash
# 查看端口占用
lsof -i :3001

# 修改 .env 中的 API_PORT
# 或在 docker-compose.yml 中修改 ports 映射
```

### 11.7 证书过期 (生产)

```bash
# 手动续签
docker compose -f docker-compose.yml exec certbot certbot renew
docker compose -f docker-compose.yml exec nginx nginx -s reload

# 检查证书状态
docker compose -f docker-compose.yml exec certbot certbot certificates
```

---

## 附录

### A. 各服务可执行脚本 (package.json)

```jsonc
// 根目录 scripts
{
  "dev":           "turbo dev --parallel",                    // 本地全部服务热重载
  "build":         "turbo build",                             // 全量构建
  "test":          "turbo test",                              // 全量测试
  "docker:up":     "docker compose -f infra/docker/docker-compose.dev.yml up -d postgres redis rabbitmq", // 基础设施
  "docker:build":  "docker compose build --parallel",          // 构建所有 Docker 服务镜像
  "docker:prod:up":"docker compose -f docker-compose.yml up -d" // 生产启动
}
```

### B. 端口汇总

| 端口 | 服务 | 说明 |
|------|------|------|
| 5432 | PostgreSQL | 主数据库 |
| 6379 | Redis | 缓存 |
| 5672 | RabbitMQ | 消息队列 |
| 15672 | RabbitMQ Mgmt | 管理控制台 |
| 9000 | MinIO API | 对象存储 |
| 9001 | MinIO Console | 存储管理面板 |
| 6333 | Qdrant HTTP | 向量数据库 (RAG) |
| 6334 | Qdrant gRPC | 向量数据库 (内部) |
| 3001 | API | NestJS 后端 |
| 3002 | admin-web | 管理后台 |
| 3003 | storefront-web | 前台 |
| 3011 | tob-web | 企业版 |
| 80 | Nginx | HTTP |
| 443 | Nginx | HTTPS |

---

> 📅 最后更新: 2026-07-13 01:22 CST
> ✍️ 如发现文档与实际情况不一致，请更新此文档或提交 Issue。
