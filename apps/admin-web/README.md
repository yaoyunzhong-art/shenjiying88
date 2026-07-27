# @m5/admin-web — 管理后台前端

> 多租户零售管理后台，面向品牌运营、租户管理员、门店经理等角色，提供统一的管理控制台。
>
> 基于 **Next.js 15** (App Router) + **TypeScript 5.8** + **React 18** + **Ant Design 6** 构建，
> 属于 M5 神机营 SaaS 多租户零售平台的管理终端。

---

## 目录

- [模块概述](#模块概述)
- [核心能力](#核心能力)
- [技术栈](#技术栈)
- [文件结构](#文件结构)
- [路由说明](#路由说明)
- [开发指南](#开发指南)
- [测试体系](#测试体系)
- [构建部署](#构建部署)

---

## 模块概述

`admin-web` 是 M5 平台的管理后台，承载 70+ 功能模块，覆盖租户管理、商品运营、会员管理、订单履约、供应链、AI 智能、安全合规、系统监控等全链路运营场景。

与同一平台的其他终端分工如下：

| 终端 | 技术栈 | 目标用户 | 核心场景 |
|------|--------|----------|----------|
| **admin-web** | Next.js 15 | 品牌运营、租户管理员、门店经理 | 管理与配置 |
| **storefront-web** | Next.js 15 | UGC 消费者、门店访客 | 消费与浏览 |
| **tob-web** | Next.js 15 | B 端商家、合作伙伴 | 企业协同 |
| **mobile** | React Native | 门店操作员、收银员 | 线下离线操作 |
| **miniapp** | Taro 4 | 微信生态用户 | 小程序入口 |
| **api** | NestJS 10 | 所有前端 | 后端 API 服务 |

---

## 核心能力

### 🛡️ 平台治理 (Platform Governance)

| 能力 | 路由 | 说明 |
|------|------|------|
| 租户管理 | `tenants/` | 租户创建/编辑/生命周期管理 |
| 市场配置 | `markets/` | 市场级语言/货币/税率/社交平台 |
| 品牌管理 | `brands/` | 品牌创建/编辑/品牌级配置 |
| 基础平台 | `foundation/` | 平台级配置与运行参数 |

### 🔐 安全与合规 (Security & Compliance)

| 能力 | 说明 |
|------|------|
| 身份与访问控制 (ABAC) | 用户管理、角色权限、策略引擎 |
| 审计日志 | 操作审计、追溯查询、全链路追踪 |
| 限流策略 | API 限流、配额管理、频控策略 |
| 安全管理 | 安全策略、风险管控、PII 保护 |

### ⚙️ 配置与运行时治理

| 能力 | 说明 |
|------|------|
| 配置管理 | 配置条目 (JSON/String/Number/Boolean)、Secret、Feature Flag |
| 运行时治理 | 运行时操作追踪、回放、同步 |
| 弹性策略 | 重试策略、恢复计划、边缘回放 |
| 告警管理 | 告警目录、下钻、确认与静默 |

### 👥 会员与门店运营

| 能力 | 说明 |
|------|------|
| 会员管理 | 会员查询/详情/等级/积分/充值 |
| 客户管理 | CRM、客户标签、分群、反馈 |
| 门店运营 | 门店管理、设备管理、库存管理调拨 |
| 采购管理 | 供应商管理、采购订单、商品采购 |

### 🧠 AI 能力

| 能力 | 说明 |
|------|------|
| AI 决策 | 规则链、决策看板、效果分析 |
| AI 场景模拟器 | 假设推演、场景对比 |
| 智能客服 | 客服会话、工单、FAQ |
| LLM 配置 | 多 Provider 管理、Prompt 模板、调用统计 |
| AI 分析 | 需求预测、定价推荐、竞品分析 |

### 📊 财务与 HR

| 能力 | 说明 |
|------|------|
| 财务报表 | 收入/支出汇总、对账 |
| 员工管理 | 人员信息、排班、合同 |
| 薪酬管理 | 绩效评估、薪酬核算 |

### 🔌 集成管理

| 能力 | 说明 |
|------|------|
| API 网关 | 开放平台、Webhook |
| 集成编排 | 事件源管理、事件编排、幂等记录 |
| 系统监控 | 监控仪表盘、告警配置 |

---

## 技术栈

### 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.3.5 | React Server Components + App Router 文件路由 |
| React | 18.3.1 | UI 组件库基础 |
| TypeScript | 5.8.3 | 全量类型声明 (tsconfig strict: false, skipLibCheck) |
| Ant Design | 6.5.0 | 企业级 UI 组件库 |
| @ant-design/icons | 6.3.2 | 图标集 |

### 内部依赖 (workspace)

| 包名 | 作用 |
|------|------|
| `@m5/domain` | 领域模型、枚举、Mock 服务 |
| `@m5/sdk` | API 客户端、工具函数、Actor 头构建 |
| `@m5/types` | 共享类型定义 (TS interface) |
| `@m5/ui` | UI 组件库 (200+ 组件) |

### 测试与构建

| 工具 | 用途 |
|------|------|
| Node Test Runner | 单元测试、组件测试 |
| @testing-library/react | 组件测试 (React Testing Library) |
| happy-dom | 轻量 DOM 环境 |
| Next.js standalone | 独立生产构建 |
| pnpm + Turborepo | monorepo 构建编排 |

### Docker 镜像

```
多阶段构建 (node:22-alpine) → 生产镜像约 200MB
Dockerfile 位于: apps/admin-web/Dockerfile
```

---

## 文件结构

```
apps/admin-web/
├── app/                              # Next.js App Router 页面目录 (70+ 模块)
│   ├── admin/                        # 系统管理
│   ├── agents/                       # AI Agent 管理
│   ├── ai-cs/                        # AI 客服
│   ├── ai-decision/                  # AI 决策
│   ├── ai-scenario-simulator/        # AI 场景模拟器
│   ├── alerts/                       # 告警中心
│   ├── alliances/                    # 联盟管理
│   ├── analytics/                    # 分析报表
│   ├── analytics-v2/                 # 分析报表 V2
│   ├── announcements/                # 公告管理
│   ├── anomaly-frequency/            # 异常频率统计
│   ├── api/                          # API Route 处理函数
│   ├── approvals/                    # 审批管理
│   ├── audit-logs/                   # 审计日志
│   ├── audit-trail/                  # 审计追踪
│   ├── brand-operations/             # 品牌运营
│   ├── brands/                       # 品牌管理
│   ├── campaign-rules/               # 活动规则
│   ├── campaigns/                    # 营销活动
│   ├── categories/                   # 分类管理
│   ├── competitor-track/             # 竞品追踪
│   ├── components/                   # 通用组件
│   ├── configuration/                # 配置管理
│   ├── contracts/                    # 合同管理
│   ├── coupon-templates/             # 优惠券模板
│   ├── coupons/                      # 优惠券管理
│   ├── crm/                          # CRM
│   ├── customer-tags/                # 客户标签
│   ├── customers/                    # 客户管理
│   ├── dashboard/                    # 仪表盘
│   ├── dev-tools/                    # 开发工具
│   ├── devices/                      # 设备管理
│   ├── equipment/                    # 设备资产
│   ├── feedback/                     # 反馈管理
│   ├── finance/                      # 财务
│   ├── fire-prevention/              # 消防安全
│   ├── foundation/                   # 基础平台
│   ├── help-center/                  # 帮助中心
│   ├── hr/                           # 人力资源
│   ├── identity-access/              # 身份访问控制
│   ├── integration-orchestration/    # 集成编排
│   ├── integrations/                 # 集成管理
│   ├── intelligence/                 # 情报分析
│   ├── inventory/                    # 库存管理
│   ├── knowledge/                    # 知识库
│   ├── lib/                          # 通用工具函数
│   ├── license-renewal/              # 许可续期
│   ├── llm-config/                   # LLM 配置
│   ├── login/                        # 登录
│   ├── logistics/                    # 物流管理
│   ├── maintenance/                  # 维护管理
│   ├── marketing/                    # 营销
│   ├── markets/                      # 市场配置
│   ├── member/                       # 会员管理
│   ├── members/                      # 会员体系
│   ├── notifications/                # 通知管理
│   ├── openapi/                      # OpenAPI
│   ├── operations/                   # 运营管理
│   ├── orders/                       # 订单管理
│   ├── pad/                          # 平板端
│   ├── payment-channels/             # 支付通道
│   ├── points-rules/                 # 积分规则
│   ├── procurement/                  # 采购管理
│   ├── products/                     # 商品管理
│   ├── promotions/                   # 促销管理
│   ├── purchase-orders/              # 采购订单
│   ├── rate-limits/                  # 限流策略
│   ├── recommendations/              # 推荐管理
│   ├── refunds/                      # 退款管理
│   ├── reports/                      # 报表
│   ├── resilience/                   # 弹性策略
│   ├── returns/                      # 退货管理
│   ├── rules/                        # 规则引擎
│   ├── safety/                       # 安全管理
│   ├── seo/                          # SEO
│   ├── settings/                     # 设置
│   ├── shop/                         # 店铺管理
│   ├── staff/                        # 员工管理
│   ├── stock/                        # 库存
│   ├── stock-operations/             # 库存操作
│   ├── stock-transfer/               # 调拨管理
│   ├── stores/                       # 门店管理
│   ├── suppliers/                    # 供应商管理
│   ├── system-monitor/               # 系统监控
│   ├── tags/                         # 标签管理
│   ├── team-building/                # 团建管理
│   ├── tenants/                      # 租户管理
│   ├── training/                     # 培训管理
│   ├── users/                        # 用户管理
│   └── workbench/                    # 工作台
│
├── types/                            # 本地类型声明
│   └── pg.d.ts                       # PostgreSQL 类型补充
├── .next/                            # Next.js 构建缓存 (gitignored)
├── .turbo/                           # Turborepo 缓存 (gitignored)
├── node_modules/                     # 依赖 (gitignored)
│
├── next.config.mjs                   # Next.js 配置
├── next.config.performance.js        # 性能优化配置
├── tsconfig.json                     # TypeScript 配置 (extends @m5/config-typescript/next.json)
├── eslint.config.mjs                 # ESLint 配置
├── package.json                      # @m5/admin-web 包定义
├── Dockerfile                        # 生产镜像构建
├── test.mjs                          # 测试入口
├── .test-setup.cjs                   # 测试 Setup (CommonJS)
├── .test-setup.mjs                   # 测试 Setup (ESM)
└── README.md                         # 本文件
```

---

## 路由说明

admin-web 使用 Next.js App Router 文件系统路由：

```
# 页面路由
/login                → 登录页
/tenants              → 租户管理列表
/tenants/new          → 新建租户
/tenants/[id]         → 租户详情
/markets              → 市场配置列表
/brands               → 品牌管理列表
/members              → 会员管理列表
/orders               → 订单列表
/products             → 商品管理
/stores               → 门店管理
/customers            → 客户管理

# API Route
/api/logistics/*      → 物流相关 API Handler
```

模块间支持嵌套路由、loading 态、错误边界、404 处理等 App Router 原生能力。

---

## 开发指南

### 环境要求

```bash
Node.js >= 20
pnpm >= 10.14
```

### 启动开发

```bash
# 在 monorepo 根目录
pnpm dev                         # 启动所有应用
pnpm --filter @m5/admin-web dev  # 仅启动 admin-web
```

### 常用命令

```bash
pnpm build                    # 生产构建
pnpm lint                     # ESLint 代码检查
pnpm typecheck                # TypeScript 类型检查
pnpm test                     # 运行全部测试
```

### 测试命令分解

```bash
# 运行全部测试 (排除 [id] 动态路由)
pnpm test

# 按模块测试
node --import tsx --import ./.test-setup.mjs --test app/customers/page.test.tsx

# 指定测试文件
node --import tsx --import ./.test-setup.mjs --test app/rate-limits/page.test.ts
```

---

## 测试体系

admin-web 采用 **Node Test Runner** + **@testing-library/react** + **happy-dom** 的测试方案。

### 测试文件分布

```
app/**/*.test.ts      # 纯逻辑/ViewModel 测试
app/**/*.test.tsx     # 组件测试 (React Testing Library)
```

### 测试目录结构

```bash
app/customers/
├── page.tsx                      # 页面组件
├── page.test.tsx                 # 组件测试
├── page.test.ts                  # 数据层测试
├── customers-client.tsx          # 客户端组件
├── customers-data.ts             # 数据层
├── error.tsx                     # 错误边界
├── loading.tsx                   # 加载态
├── not-found.tsx                 # 404 页
└── new/                          # 子路由
    ├── page.tsx
    ├── page.test.tsx
    ├── page.test.ts
    └── loading.tsx
```

### 测试覆盖率

当前 70+ 模块中，大部分模块包含至少 2 个测试文件（组件测试 + 数据层测试）。部分高复杂度模块含 4+ 测试文件（页面、数据、ViewModel、工具函数）。

---

## 构建部署

### 构建流程

```bash
# 1. 完整构建
pnpm build

# 2. Docker 镜像构建
docker build -f apps/admin-web/Dockerfile -t m5/admin-web:latest .
```

### 构建产出

Next.js 15 `output: standalone` 模式生成自包含构建，位于 `.next/standalone/`，包含：

- 编译后的服务端代码
- 静态资源
- 必要的 `node_modules`

### 部署环境变量

参考 `.env.example` 配置：

```bash
NEXT_PUBLIC_M5_API_BASE_URL=https://api.m5.example.com
NEXT_PUBLIC_M5_WS_URL=wss://ws.m5.example.com
NEXT_PUBLIC_APP_ENV=production
```

---

## 相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| 根项目 README | `/README.md` | 项目整体概览 |
| 应用模块概览 | `/apps/README.md` | Apps 目录说明 |
| API 客户端 SDK | `/packages/sdk/README.md` | 统一 API 调用 |
| UI 组件库 | `/packages/ui/README.md` | 200+ 可复用组件 |
| 领域模型 | `/packages/domain/README.md` | 核心实体与枚举 |
| 类型定义 | `/packages/types/README.md` | 共享 TS 类型 |
