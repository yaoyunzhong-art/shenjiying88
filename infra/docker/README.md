# Docker 基础设施文档

## 概览

本项目使用 Docker Compose 管理 M5 平台的后端依赖基础设施，涵盖 PostgreSQL（数据库）、Redis（缓存）、RabbitMQ（消息队列）和 MinIO（对象存储）。所有服务均通过 `docker-compose.dev.yml` 统一编排，支持开发环境的快速启动与销毁。

## 核心概念

### 服务角色

| 服务 | 镜像 | 端口 | 用途 |
|------|------|------|------|
| **PostgreSQL** | `postgres:16-alpine` | 5432 | 主业务数据库，Prisma ORM 后端存储 |
| **Redis** | `redis:7-alpine` | 6379 | 缓存、Session 存储、Rate Limiter |
| **RabbitMQ** | `rabbitmq:3.13-management-alpine` | 5672 / 15672 | 异步消息队列、事件驱动架构 |
| **MinIO** | `minio/minio:latest` | 9000 / 9001 | S3 兼容对象存储，文件上传、图片托管 |

### Infrastructure Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                    Docker Host                                │
│                                                              │
│  ┌────────────┐  ┌────────┐  ┌───────────┐  ┌───────────┐  │
│  │ PostgreSQL  │  │ Redis  │  │ RabbitMQ  │  │  MinIO    │  │
│  │   :5432     │  │ :6379  │  │:5672/15672│  │:9000/9001 │  │
│  └─────┬──────┘  └───┬────┘  └─────┬─────┘  └─────┬─────┘  │
│        │             │             │              │          │
│        ├── Prisma ORM│             │              │          │
│        │             ├── ioredis   │              │          │
│        │             │             ├── amqplib    │          │
│        │             │             │              ├── @aws-  │
│        │             │             │              │   sdk/s3 │
│        v             v             v              v          │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              M5 Backend Applications                 │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  Named Volumes:                                              │
│  ┌─────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────┐  │
│  │postgres_data│ │redis_data│ │rabbitmq_data│ │minio_data│  │
│  └─────────────┘ └──────────┘ └─────────────┘ └──────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 多阶段构建策略

当前开发环境使用官方镜像直接运行，生产部署推荐采用多阶段 Dockerfile：

1. **阶段一（Builder）**：使用 `node:20-alpine` 安装依赖、编译 TypeScript
2. **阶段二（Production）**：复制构建产物，仅安装生产依赖，运行 NestJS 应用
3. **镜像瘦身**：产物镜像应控制在 200MB 以内，减少攻击面

### 镜像分层原则

- **基层**：`node:20-alpine` / `postgres:16-alpine` 等官方 Alpine 镜像
- **依赖层**：`node_modules` 安装 —— 仅 `package.json` 变更时重建
- **代码层**：源码构建产物 —— 业务代码变更时重建
- **配置层**：环境变量、配置文件 —— 运行时注入不打包

## 配置项

### compose.env.example 关键配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `POSTGRES_USER` | `m5` | 数据库用户 |
| `POSTGRES_PASSWORD` | `m5_dev_password` | 数据库密码 |
| `POSTGRES_DB` | `m5` | 数据库名称 |
| `REDIS_PASSWORD` | *(空)* | Redis 认证密码 |
| `RABBITMQ_DEFAULT_USER` | `m5` | 消息队列用户名 |
| `RABBITMQ_DEFAULT_PASS` | `m5_dev_password` | 消息队列密码 |
| `MINIO_ROOT_USER` | `m5` | MinIO 管理员用户 |
| `MINIO_ROOT_PASSWORD` | `m5_dev_password` | MinIO 管理员密码 |

## 快速开始

### 启动基础服务（PostgreSQL + Redis + RabbitMQ）

```bash
# 使用 pnpm 脚本（推荐）
pnpm docker:up

# 或直接使用 docker compose
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

### 启动全部服务（含 MinIO）

```bash
pnpm docker:up:full

# 或直接启动（含 full profile）
docker compose -f infra/docker/docker-compose.dev.yml --profile full up -d
```

### 停止服务

```bash
pnpm docker:down

# 或
docker compose -f infra/docker/docker-compose.dev.yml down
```

### 查看服务状态

```bash
docker compose -f infra/docker/docker-compose.dev.yml ps
```

### 查看日志

```bash
# 所有服务日志
docker compose -f infra/docker/docker-compose.dev.yml logs -f

# 指定服务日志
docker compose -f infra/docker/docker-compose.dev.yml logs -f postgres
```

### 清除数据卷（⚠️ 会删除所有持久化数据）

```bash
docker compose -f infra/docker/docker-compose.dev.yml down -v
```

### 健康检查

所有服务均配置了 `healthcheck`，可通过以下命令确认：

```bash
docker inspect --format='{{.State.Health.Status}}' m5-postgres
docker inspect --format='{{.State.Health.Status}}' m5-redis
```

## FAQ

### Q1: 数据卷在哪里？重启容器会丢数据吗？

数据存储在命名卷中（`m5_postgres_data`、`m5_redis_data` 等），重启容器不会丢失数据。如需彻底清除数据，需显式 `docker volume rm` 或使用 `docker compose down -v`。

### Q2: 如何修改默认密码？

编辑 `infra/docker/compose.env.example` 中的密码变量，然后通过 `--env-file` 加载。**生产环境务必使用强密码**，且不要将密码提交到版本控制。

### Q3: MinIO 为什么不默认启动？

MinIO 使用 `profiles: ["full"]` 标记，属于可选服务。大部分开发场景不依赖对象存储，按需启动可减少资源占用。使用 `pnpm docker:up:full` 或 `--profile full` 启动。

### Q4: 端口冲突了怎么办？

编辑 `docker-compose.dev.yml` 中的 `ports` 映射，例如将 `5432:5432` 改为 `5433:5432`。注意同时修改应用侧数据库连接配置。
