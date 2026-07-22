# @m5/api — API 服务

## 模块简介

`@m5/api` 是 神机营 平台的后端 API 服务核心，基于 NestJS 框架构建。该服务提供 SaaS 多租户场景下的完整业务能力，涵盖会员管理、库存与物流、支付结算、营销活动、AI 智能分析、基础治理（运维告警、运行时治理）等 200+ 业务模块。采用模块化架构设计，支持按需加载与独立发布。

## 技术栈

| 类别         | 技术                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 运行时       | Node.js (tsx watch / tsc build)                                      |
| 框架         | NestJS 10 (Express 平台)                                             |
| 数据库       | PostgreSQL (Prisma ORM + 原生 pg 驱动)                               |
| 缓存         | Redis (ioredis)                                                      |
| 消息队列     | RabbitMQ / 事件总线 (@nestjs/event-emitter + 自建 event-bus)         |
| 实时通信     | Socket.IO (WebSocket 网关)                                           |
| API 文档     | Swagger (@nestjs/swagger + swagger-ui-express)                       |
| 可观测性     | OpenTelemetry (自动埋点 + OTLP 导出)、Pino 日志                       |
| 安全         | Helmet、class-validator (参数校验)、RBAC 权限                        |
| 测试         | Vitest + supertest (E2E)                                             |
| 部署         | Docker (多阶段构建)                                                  |

## 目录结构

```
apps/api/
├── prisma/                     # Prisma schema 与迁移
│   ├── schema.prisma           # 数据模型定义 (PostgreSQL)
│   └── migrations/             # 数据库迁移文件
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 根模块
│   ├── config/                 # 配置定义与环境变量
│   ├── common/                 # 公共基础设施
│   │   ├── context/            # 请求上下文
│   │   ├── filters/            # 异常过滤器
│   │   ├── governance/         # 治理层
│   │   ├── guards/             # 路由守卫
│   │   └── interceptors/       # 拦截器
│   ├── database/               # 数据库连接
│   ├── infrastructure/         # 基础设施层 (Redis、MQ、ClickHouse 等)
│   ├── modules/                # 200+ 业务模块
│   │   ├── auth/               # 认证授权
│   │   ├── member/             # 会员管理
│   │   ├── store/              # 门店管理
│   │   ├── inventory/          # 库存
│   │   ├── logistics/          # 物流
│   │   ├── payment-gateway/    # 支付网关
│   │   ├── cashier/            # 收银
│   │   ├── coupon/             # 优惠券
│   │   ├── loyalty/            # 忠诚度
│   │   ├── campaign/           # 营销活动
│   │   ├── ai-*                # AI 能力 (诊断/推荐/营销等)
│   │   ├── analytics/          # 数据分析
│   │   ├── foundation/         # 基础治理 (告警/运行时治理)
│   │   ├── gateway/            # 网关模块
│   │   ├── open-api/           # 开放平台 API
│   │   ├── notification/       # 通知
│   │   ├── i18n/               # 国际化/多语言
│   │   ├── multi-region/       # 多区域
│   │   └── ...                 # 其余业务模块
│   ├── agents/                 # LLM 智能体
│   ├── migrations/             # 代码迁移/脚本
│   └── testing/                # 测试工具
├── scripts/                    # 运维脚本
├── docker-entrypoint
├── Dockerfile                  # Docker 构建文件
├── tsconfig.json               # TypeScript 配置
└── vitest.config.ts            # 单元测试配置
```

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm (推荐) 或 npm
- PostgreSQL 15+
- Redis 7+
- RabbitMQ (可选，部分模块需要)

### 安装与启动

```bash
# 1. 安装依赖 (在 monorepo 根目录执行)
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL、REDIS_URL 等

# 3. 数据库迁移
pnpm --filter @m5/api prisma:migrate:deploy

# 4. 启动开发服务 (热重载)
pnpm --filter @m5/api dev

# 5. 生产构建
pnpm --filter @m5/api build

# 6. 启动生产服务
pnpm --filter @m5/api start
```

### 可用命令

| 命令                          | 说明                   |
| ----------------------------- | ---------------------- |
| `pnpm --filter @m5/api dev`   | 开发模式 (热重载)      |
| `pnpm --filter @m5/api build` | TypeScript 编译构建    |
| `pnpm --filter @m5/api start` | 生产启动               |
| `pnpm --filter @m5/api test`  | 运行单元测试           |
| `pnpm --filter @m5/api lint`  | ESLint 代码检查        |
| `pnpm --filter @m5/api typecheck` | TypeScript 类型检查 |

### 访问 API 文档

启动服务后，默认访问 `http://localhost:3000/api-docs` 查看 Swagger 文档。

## 相关包

| 包名            | 说明                     |
| --------------- | ------------------------ |
| `@m5/types`     | 公共类型定义             |
| `@m5/domain`    | 领域模型与业务逻辑       |
| `@m5/miniapp`   | 微信小程序前端           |

## 许可证

私有 — 仅供 神机营 平台内部使用。
