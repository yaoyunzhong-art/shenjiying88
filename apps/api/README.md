# @m5/api — 神机营 API 服务

> NestJS 10 · 200+ 业务模块 · 多租户 SaaS · AI 智能引擎 · 可观测性

## 📋 模块概述

`@m5/api` 是神机营 SaaS 平台的后端 API 服务核心，基于 **NestJS 10** 框架构建，采用模块化架构设计，覆盖 200+ 业务模块，支撑门店管理、会员运营、库存物流、支付结算、营销活动、AI 智能分析等全场景业务能力。

**架构理念：**
- **领域驱动分层** — 将业务能力拆分为自治的业务模块，每个模块包含 Controller → Service → Repository 三层，模块间通过事件总线松散耦合
- **多租户隔离** — 基于 Row-Level Security (RLS) + 租户上下文中间件，实现数据级租户隔离，同时支持租户级别 LLM 模型定制
- **AI 原生集成** — 内嵌 AI Agent 框架，支持智能诊断、营销推荐、会员预测、智能客服等 AI 能力，通过 RAG + 向量数据库 (Qdrant) 持久化知识
- **可观测性优先** — OpenTelemetry 全链路自动埋点，Pino 结构化日志，ClickHouse 事件存储，Sentry + 自定义告警体系

---

## 🏗️ 架构总览

```
┌────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                       │
│  REST Controllers · WebSocket Gateways · OpenAPI (Swagger) │
├────────────────────────────────────────────────────────────┤
│                    Guard & Interceptor                      │
│  AuthGuard · RBAC Guard · TenantGuard · LoggingInterceptor │
├────────────────────────────────────────────────────────────┤
│                   Business Modules                         │
│  Member │ Inventory │ Payment │ Campaign │ AI │ Analytics │
│  ... 200+ modules, event-bus loosely coupled                │
├────────────────────────────────────────────────────────────┤
│                   Infrastructure                            │
│  Prisma(ORM) │ Redis(Cache) │ RabbitMQ(MQ) │ Qdrant(Vector)│
├────────────────────────────────────────────────────────────┤
│                   Platform Layer                            │
│  NestJS 10 · Express · OpenTelemetry · Pino                │
└────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
apps/api/
├── prisma/                         # 数据层定义
│   ├── schema.prisma               # 完整数据模型 (200+ 表)
│   └── migrations/                 # 数据库迁移 (时序化)
├── scripts/                        # 运维脚本
├── docker-entrypoint               # Docker 容器入口脚本
├── Dockerfile                      # 多阶段构建
├── tsconfig.json                   # TypeScript 严格模式
├── vitest.config.ts                # Vitest 测试配置
├── .eslintrc.js                    # ESLint 规则
├── nest-cli.json                   # NestJS CLI 配置
└── src/
    ├── main.ts                     # 应用启动入口 (bootstrap + swagger)
    ├── app.module.ts               # 根模块 (全局 imports)
    ├── app.controller.ts           # 健康检查根路由
    │
    ├── config/                     # 配置定义 (env vars + validation)
    │   ├── app.config.ts           # 应用配置 (port, cors, swagger)
    │   ├── database.config.ts      # 数据库连接配置
    │   ├── redis.config.ts         # 缓存配置
    │   └── ai.config.ts            # AI 模型与 API Key 配置
    │
    ├── common/                     # 公共基础设施
    │   ├── context/                # 请求上下文 (tenantId, userId, traceId)
    │   │   ├── request-context.ts  # AsyncLocalStorage 实现
    │   │   └── tenant-context.ts   # 租户信息注入
    │   ├── filters/                # 异常过滤器
    │   │   ├── http-exception.filter.ts     # HTTP 异常格式化
    │   │   └── all-exceptions.filter.ts     # 全局未捕获异常
    │   ├── governance/             # 运行时治理层
    │   │   ├── rate-limiter.ts     # 令牌桶限流
    │   │   ├── circuit-breaker.ts  # 熔断器 (外部服务依赖)
    │   │   └── retry-policy.ts     # 重试策略 (指数退避)
    │   ├── guards/                 # 路由守卫
    │   │   ├── auth.guard.ts       # JWT/SSO 认证守卫
    │   │   ├── rbac.guard.ts       # 角色权限守卫
    │   │   └── tenant.guard.ts     # 多租户隔离守卫
    │   └── interceptors/           # 拦截器
    │       ├── logging.interceptor.ts  # 请求日志
    │       ├── transform.interceptor.ts# 响应统一格式
    │       └── timeout.interceptor.ts  # 请求超时控制
    │
    ├── database/                   # 数据库连接与管理
    │   ├── prisma.service.ts       # Prisma 服务 (连接池 + 健康检查)
    │   └── prisma.module.ts        # Prisma 全局模块
    │
    ├── infrastructure/             # 基础设施层
    │   ├── cache/                  # 缓存服务 (Redis)
    │   ├── redis/                  # ioredis 连接管理
    │   ├── rabbitmq/               # RabbitMQ 连接/生产/消费
    │   ├── queue/                  # 任务队列 (Bull)
    │   ├── clickhouse/             # ClickHouse 事件日志存储
    │   ├── qdrant/                 # Qdrant 向量数据库 (RAG)
    │   ├── ollama/                 # Ollama 本地 LLM 推理
    │   ├── event-bus/              # 自建事件总线 (模块间通信)
    │   ├── typeorm/                # TypeORM (Prisma 补充, 复杂查询用)
    │   └── e2e/                    # E2E 测试工具
    │
    ├── modules/                    # 200+ 业务模块 (按领域划分)
    │   │
    │   │   ★ 核心基础模块
    │   ├── auth/                   # 认证授权 (JWT/OAuth2/SSO)
    │   ├── tenant/                 # 多租户管理 (注册/配置/隔离)
    │   ├── rbac/                   # 角色权限 (权限矩阵/数据权限)
    │   ├── permission/            # 细粒度权限
    │   ├── security/              # 安全策略 (IP白名单/CORS/Session)
    │   │
    │   │   ★ 会员运营
    │   ├── member/                 # 会员管理 (档案/等级/标签/分组)
    │   ├── membership/             # 会员权益 (等级权益/积分规则)
    │   ├── member-level/           # 会员等级体系 (升降级规则)
    │   ├── member-predict/         # 会员流失预测 (AI)
    │   ├── member-spending-analysis/ # 会员消费分析 (AI)
    │   ├── crm/                    # 客户关系管理 (任务/跟进记录)
    │   ├── loyalty/                # 忠诚度计划 (积分/等级/奖励)
    │   ├── points/                 # 积分系统 (获取/消耗/过期)
    │   ├── coupon/                 # 优惠券 (创建/发放/核销)
    │   ├── gift-card/              # 礼品卡 (创建/充值/挂失)
    │   ├── empower-card/           # 赋能卡 (营销权益)
    │   ├── birthday/               # 生日营销 (自动祝福/优惠)
    │   └── svip/                   # SVIP 超级会员
    │   │
    │   │   ★ 门店与供应链
    │   ├── store/                  # 门店管理 (信息/设备/营业状态)
    │   ├── store-rank/             # 门店排名 (AI)
    │   ├── store-revenue-report/   # 门店营收报告
    │   ├── inventory/              # 库存管理 (实时/预警/调拨)
    │   ├── inventory-alert/        # 库存预警 (AI)
    │   ├── logistics/              # 物流管理 (配送/签收/回单)
    │   ├── logistics-management/   # 物流调度 (AI)
    │   ├── procurement-order/      # 采购订单 (下单/审批/到货)
    │   ├── return-request/         # 退货请求 (质检/退款)
    │   ├── supplier-manager/       # 供应商管理
    │   ├── warehouse-bin/          # 库位管理
    │   ├── delivery-tracking/      # 配送追踪
    │   └── stock/                  # 实时库存
    │   │
    │   │   ★ 交易与财务
    │   ├── cashier/                # 收银系统 (POS 核心)
    │   │   ├── cashier-transaction/# 收银交易
    │   │   ├── gateways/           # 支付网关适配器
    │   │   ├── bridges/            # 中间件桥接
    │   │   ├── ports/              # 领域端口定义
    │   │   └── retry/              # 交易重试
    │   ├── payment-gateway/        # 支付网关 (微信/支付宝/银行卡)
    │   ├── billing/                # 计费系统
    │   ├── transactions/           # 交易流水
    │   ├── finance/                # 财务管理
    │   ├── tax/                    # 税务管理
    │   ├── expense/                # 费用管理
    │   ├── salary/                 # 薪酬管理
    │   ├── contract-manager/       # 合同管理
    │   └── royalty/                # 分润/提成
    │   │
    │   │   ★ 营销活动
    │   ├── campaign/               # 营销活动 (创建/投放/效果分析)
    │   ├── campaign-performance/   # 活动效果分析 (AI)
    │   ├── marketing/              # 营销引擎
    │   ├── marketing-metrics/      # 营销指标 (AI)
    │   ├── referral/               # 裂变/推荐 (社交传播)
    │   ├── recommend/              # 推荐系统 (AI)
    │   │   ├── datasources/        # 推荐数据源
    │   │   ├── strategies/         # 推荐策略 (协同/内容/混合)
    │   │   └── d4-promotion/       # D4 促销引擎
    │   ├── content/                # 内容管理
    │   ├── employee-marketing/     # 员工营销
    │   ├── brand-custom/           # 品牌自定义
    │   ├── brand-operations/       # 品牌运营
    │   └── seo/                    # SEO/搜索优化
    │   │
    │   │   ★ AI 智能引擎
    │   ├── ai/                     # AI 核心框架
    │   ├── agent/                  # AI Agent (LLM 编排)
    │   ├── ai-diagnosis/           # AI 智能诊断 (门店健康)
    │   ├── ai-forecast/            # AI 智能预测 (销量/客流)
    │   ├── ai-insight/             # AI 数据洞察
    │   ├── ai-marketing/           # AI 营销文案生成
    │   ├── ai-sales/               # AI 销售助手
    │   ├── ai-cs/                  # AI 智能客服 (RAG)
    │   ├── ai-rag/                 # AI 知识库 RAG
    │   ├── ai-recommend/           # AI 推荐引擎
    │   ├── ai-review/              # AI 评论分析
    │   ├── ai-reviewer/            # AI 代码审查
    │   ├── ai-rule-engine/         # AI 规则引擎
    │   ├── ai-push/                # AI 智能推送
    │   ├── ai-profile/             # AI 用户画像
    │   ├── ai-model-config/        # AI 模型配置 (租户级 LLM)
    │   ├── ai-content/             # AI 内容生成
    │   ├── multimodal-fusion/      # 多模态融合
    │   ├── federated-learning/     # 联邦学习
    │   ├── image-recognition/      # 图片识别
    │   ├── voice-processing/       # 语音处理
    │   ├── ocr/                    # 文字识别
    │   └── retrieval/              # 智能检索
    │   │
    │   │   ★ 通知与通信
    │   ├── notification/           # 通知引擎 (多通道)
    │   ├── push/                   # 推送服务 (FCM/APNs/微信)
    │   ├── notice/                 # 公告系统
    │   ├── webhook/                # Webhook 回调
    │   ├── realtime/               # 实时通信 (Socket.IO)
    │   └── edge/                   # 边缘节点通信
    │   │
    │   │   ★ 数据与分析
    │   ├── analytics/              # 数据分析
    │   ├── analytics-v2/           # 分析 v2 (ClickHouse)
    │   │   ├── datasources/        # 分析数据源
    │   │   └── services/           # 分析服务
    │   ├── reports/                # 报表系统
    │   ├── report/                 # 导出报告
    │   ├── insight/                # 数据洞察 (AI)
    │   ├── time-series/            # 时序数据
    │   └── monitoring/             # 业务监控
    │   │
    │   │   ★ 开放平台与集成
    │   ├── open-api/               # 开放平台 API (第三方接入)
    │   ├── open-platform/          # 开放平台管理
    │   ├── gateway/                # 内部网关
    │   ├── oss/                    # 对象存储
    │   ├── cdn-cache/              # CDN 缓存管理
    │   ├── device-adapter/         # 设备适配器 (IoT)
    │   ├── iot/                    # IoT 设备管理
    │   └── lowcode/                # 低代码平台
    │   │
    │   │   ★ 治理与运维
    │   ├── foundation/             # 基础治理 (告警/限流/熔断)
    │   ├── health/                 # 健康检查 (内存/CPU/DB/Redis)
    │   ├── health-dashboard/       # 健康看板
    │   ├── observability/          # 可观测性 (OpenTelemetry)
    │   ├── performance/            # 性能监控
    │   ├── perf-monitor/           # 性能分析器
    │   ├── anomaly-detector/       # 异常检测 (AI)
    │   ├── chaos/                  # 混沌工程
    │   ├── auto-rollback/          # 自动回滚
    │   ├── runbook/                # 自动化故障响应
    │   ├── devops/                 # DevOps 集成
    │   ├── deploy/                 # 部署管理
    │   ├── sandbox/                # 沙箱环境
    │   ├── canary/                 # 灰度发布
    │   ├── license/                # 许可证管理
    │   ├── license-package/        # 许可套餐
    │   ├── license-renewal/        # 许可续期
    │   ├── tenant-config/          # 租户配置
    │   ├── system-config/          # 系统配置
    │   ├── tenant-llm/             # 租户 LLM 模型
    │   ├── compliance/             # 合规管理
    │   └── audit/                  # 审计日志
    │   │
    │   │   ★ 其它业务模块
    │   ├── hr/                     # 人力资源
    │   ├── attendance/             # 考勤管理
    │   ├── leave-request/          # 请假审批
    │   ├── shift-scheduler/        # 排班管理
    │   ├── performance-review/     # 绩效考核
    │   ├── employee-performance-review/ # 员工绩效复盘
    │   ├── training/               # 培训管理
    │   ├── team-building/          # 团建活动
    │   ├── bootstrap/              # 初始化引导
    │   ├── alliance/               # 联盟管理
    │   ├── collab/                 # 协作管理
    │   ├── locale/                 # 国际化/多语言
    │   ├── i18n/                   # i18n 工具
    │   ├── multi-region/           # 多区域部署
    │   ├── terminal/               # 终端管理
    │   ├── venue/                  # 场地管理
    │   ├── reservation/            # 预约系统
    │   ├── feed/                   # 动态/Feed 流
    │   ├── feedback/               # 用户反馈
    │   ├── quality/                # 质量管理
    │   ├── quality-inspection/     # 质检系统
    │   ├── maintenance-plan/       # 维修保养计划
    │   ├── repair/                 # 维修工单
    │   ├── equipment-fault-report/ # 设备故障上报
    │   ├── champion/               # 打卡/成就系统
    │   ├── tournament/             # 竞赛活动
    │   ├── scout/                  # 市场巡查
    │   ├── chain/                  # 连锁管理
    │   ├── competitor-track/       # 竞品追踪
    │   ├── customer-satisfaction/  # 客户满意度
    │   ├── leads/                  # 线索管理
    │   ├── storefront/             # 店铺前端 (在线商店)
    │   ├── omnichannel/            # 全渠道
    │   ├── transfer/               # 转单/交接
    │   ├── market/                 # 市场管理
    │   ├── knowledge/              # 知识库 (FAQ/文档)
    │   ├── ops-manual/             # 运营手册
    │   ├── db-knowledge/           # 数据库知识库
    │   ├── docs/                   # 文档系统
    │   ├── currency/               # 多币种
    │   ├── task-scheduler/         # 任务调度 (定时/周期)
    │   ├── automation/             # 自动化引擎
    │   ├── cross-module/           # 跨模块编排
    │   ├── session/                # 会话管理
    │   ├── workbench/              # 工作台
    │   ├── portal/                 # 门户
    │   ├── price-monitor/          # 价格监控
    │   ├── categories/             # 类目系统
    │   ├── multimedia/             # 多媒体管理
    │   ├── saas-advanced/          # SaaS 高级功能
    │   ├── saas-billing/           # SaaS 计费
    │   ├── queue/                  # 队列管理
    │   ├── rls/                    # Row-Level Security
    │   ├── lineage/                # 数据血缘
    │   ├── e2e-auto-gen/           # E2E 自动化测试生成
    │   └── shared/                 # 共享模块
    │
    ├── agents/                     # LLM 智能体 (AI Agent编排)
    ├── migrations/                 # 代码迁移脚本
    └── testing/                    # 测试工具与基类
```

---

## ⚙️ 环境要求

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | ≥ 18 LTS | 运行时 |
| pnpm | ≥ 8 | 包管理 |
| PostgreSQL | ≥ 15 | 主数据库 (Prisma ORM) |
| Redis | ≥ 7 | 缓存 + 会话 + 限流 |
| RabbitMQ | AMQP 0-9-1 | 消息队列 (可选模块) |
| Qdrant | ≥ 1.7 | 向量数据库 (AI RAG) |
| ClickHouse | ≥ 23 | 事件日志分析 (可选) |
| Docker | ≥ 24 | 容器化部署 |

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# monorepo 根目录执行
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

关键配置项：

```env
# 应用
NODE_ENV=development
PORT=3000

# 数据库 (PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/shenjiying

# 缓存 (Redis)
REDIS_URL=redis://localhost:6379

# 消息队列 (可选)
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# 向量数据库 (AI 模块需要)
QDRANT_URL=http://localhost:6333

# 可观测性
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
SENTRY_DSN=your_sentry_dsn

# AI 服务 (可选)
OPENAI_API_KEY=sk-xxx
OLLAMA_URL=http://localhost:11434
```

### 3. 数据库迁移

```bash
# 应用迁移
pnpm --filter @m5/api prisma:migrate:deploy

# 开发环境生成 Prisma Client
pnpm --filter @m5/api prisma:generate

# 查看 Prisma Studio (数据浏览器)
pnpm --filter @m5/api prisma:studio
```

### 4. 启动开发服务

```bash
# 开发模式 (tsx watch + 热重载)
pnpm --filter @m5/api dev

# TypeScript 编译构建
pnpm --filter @m5/api build

# 生产启动
pnpm --filter @m5/api start
```

### 5. 访问 Swagger API 文档

服务启动后，浏览器访问 **http://localhost:3000/api-docs** 查看 Swagger 交互式文档。

---

## 🎯 核心功能

| # | 功能域 | 覆盖模块数 | 说明 |
|---|--------|-----------|------|
| 1 | **多租户平台** | 5 模块 | 租户生命周期管理、数据隔离 (RLS)、自定义配置、LLM 模型定制 |
| 2 | **会员运营体系** | 12+ 模块 | 会员档案/等级/积分/标签、CRM、忠诚度计划、SVIP、生日营销 |
| 3 | **门店与供应链** | 12+ 模块 | 门店管理、库存、采购、物流、退货、供应商、库位 |
| 4 | **收银与交易** | 8+ 模块 | POS 收银、多支付网关、退款、交易流水、计费结算 |
| 5 | **营销活动引擎** | 10+ 模块 | 活动创建/投放/分析、优惠券、礼品卡、裂变推荐、AI 营销文案 |
| 6 | **AI 智能引擎** | 20+ 模块 | 智能诊断、销量预测、智能客服 (RAG)、用户画像、规则引擎、推荐系统 |
| 7 | **实时通知** | 5 模块 | 多通道通知 (Push/短信/邮件/微信)、Webhook、Socket.IO 实时通信 |
| 8 | **数据分析** | 8+ 模块 | 业务报表、ClickHouse 时序分析、AI 数据洞察、多维分析 (OLAP) |
| 9 | **开放平台** | 6 模块 | 第三方 API 接入、OAuth2、网关、Webhook 回调、低代码集成 |
| 10 | **运维治理** | 15+ 模块 | 健康检查、限流熔断、可观测性 (OpenTelemetry)、混沌工程、灰度发布、自动回滚 |
| 11 | **权限安全** | 6 模块 | RBAC、细粒度数据权限、审计日志、IP 白名单、合规管理、安全策略 |
| 12 | **国际化/多区域** | 4 模块 | i18n 多语言、多区域部署、多币种、Locale 配置 |
| 13 | **IoT 设备** | 3 模块 | 设备适配器、IoT 管控、边缘通信 |
| 14 | **人力资源管理** | 7+ 模块 | 考勤、排班、请假、培训、绩效、薪酬 |
| 15 | **连锁与联盟** | 8+ 模块 | 连锁管理、联盟管理、竞品追踪、客户满意度、巡查、转单 |

---

## 🔧 技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **运行时** | Node.js | ≥ 18 LTS | 服务端运行时 (tsx watch / tsc build) |
| **框架** | NestJS | 10.x | 后端框架 (Express 平台) |
| **语言** | TypeScript | 5.x | 严格模式，装饰器 + 类型安全 |
| **数据库 ORM** | Prisma | 5.x | PostgreSQL ORM + 迁移管理 |
| **补充 ORM** | TypeORM | 0.3 | 复杂查询批量场景 |
| **缓存** | Redis (ioredis) | 7.x | 分布式缓存 + 限流 + Session |
| **消息队列** | RabbitMQ (amqplib) | — | 异步任务分发 |
| **任务调度** | Bull (Redis-backed) | 4.x | 定时/延迟/重试任务 |
| **向量数据库** | Qdrant | 1.7+ | AI RAG 知识库存储 |
| **事件存储** | ClickHouse | 23+ | 埋点/日志/时序分析 |
| **实时通信** | Socket.IO | 4.x | WebSocket 双向通信 |
| **API 文档** | Swagger (OpenAPI 3.0) | — | 自动生成 API 文档 |
| **可观测性** | OpenTelemetry | — | 全链路自动埋点 + OTLP |
| **日志** | Pino | 8.x | 结构化 JSON 日志 |
| **校验** | class-validator + class-transformer | — | DTO 参数校验与转换 |
| **安全** | Helmet + Passport | — | HTTP 安全头 + 认证策略 |
| **LLM 推理** | Ollama / OpenAI SDK | — | 本地/云端 AI 模型服务 |
| **测试** | Vitest + supertest | — | 单元 + E2E 测试 |
| **代码检查** | ESLint + Prettier | — | 代码规范 + 自动格式化 |
| **容器化** | Docker (多阶段构建) | — | 生产部署镜像 |

---

## 📐 开发规范

### 模块结构规范

每个业务模块遵循统一的目录结构：

```
modules/example/
├── example.module.ts          # NestJS 模块定义
├── example.controller.ts      # REST 控制器 (路由定义)
├── example.service.ts         # 业务逻辑层
├── dto/                       # 数据传输对象 (请求/响应)
│   ├── create-example.dto.ts
│   └── update-example.dto.ts
├── entities/                  # Prisma 实体类型扩展
├── repositories/              # 数据访问层 (可选)
├── interfaces/                # 内部接口定义
├── guards/                    # 模块级守卫 (可选)
├── interceptors/              # 模块级拦截器 (可选)
└── __tests__/                 # 模块单元测试
```

### 代码风格
- **TypeScript strict** 模式，禁止 `any`
- 依赖注入 (DI) 优先于手动实例化
- Decorator 用于路由/校验/序列化，严禁用装饰器执行副作用
- Controller 仅做路由转发，业务逻辑在 Service 中
- 所有 DTO 使用 `@ApiProperty` 装饰器 (Swagger 文档自动生成)

### 错误处理规范
- 业务异常继承 `BusinessException` (含错误码 + 业务提示)
- 异常统一由 `AllExceptionsFilter` 捕获，返回统一格式
- 外部依赖调用使用 `circuit-breaker` + `retry-policy`

### 测试要求
- **单元测试**: Service 层逻辑 100% 覆盖，使用 Vitest
- **E2E 测试**: 关键 API 路径使用 supertest 覆盖
- **集成测试**: 数据库交互使用独立测试库
- **安全测试**: OWASP Top 10 安全检查

### 提交规范
```
feat(api): 新增会员流失预测 AI 模型接口
fix(api): 修复支付回调幂等性校验缺陷
perf(api): 优化库存查询 SQL (覆盖索引)
chore(api): 升级 Prisma 5.10 → 5.12
```

---

## 🔗 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| API 架构设计 | `docs/api/architecture.md` | 整体架构设计文档 |
| 数据模型 | `prisma/schema.prisma` | 完整 Prisma Schema |
| Swagger 文档 | `http://localhost:3000/api-docs` | 启动后可访问 |
| AI 引擎设计 | `docs/api/ai-engine.md` | AI Agent + RAG 设计 |
| 多租户方案 | `docs/api/multi-tenant.md` | RLS + 租户隔离设计 |
| 治理层设计 | `docs/api/governance.md` | 限流/熔断/重试策略 |
| 移动端 | `apps/mobile/README.md` | React Native 前端 |
| 小程序 | `apps/miniapp/README.md` | 微信小程序前端 |
| 公共类型 | `packages/types/README.md` | 共享类型定义 |

---

## 📊 性能指标 (基线)

| 指标 | 目标值 | 说明 |
|------|-------|------|
| P99 响应时间 | < 200ms | 核心 API (成员查询/订单) |
| P90 响应时间 | < 100ms | 静态/缓存数据 |
| 吞吐量 | > 5000 RPS | 单实例 (4C8G) |
| 数据库连接池 | 20-50 | Prisma 连接池 |
| 缓存命中率 | > 85% | Redis 缓存 (热数据) |
| API 可用率 | > 99.9% | 健康检查 + 熔断 |

---

## 🐳 Docker 部署

```dockerfile
# 多阶段构建 (参考项目 Dockerfile)
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @m5/api build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json .
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```bash
# 构建
docker build -t shenjiying-api -f apps/api/Dockerfile .

# 运行
docker run -d \
  --name shenjiying-api \
  -p 3000:3000 \
  --env-file .env \
  shenjiying-api
```

---

## 许可证

私有 — 仅供 神机营 平台内部使用。
