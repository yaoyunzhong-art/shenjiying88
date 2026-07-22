# @m5/admin-web — 管理后台

> **多租户零售管理后台** — 面向品牌运营、租户管理员、门店经理等角色，提供统一的管理控制台。覆盖身份与访问控制、配置管理、运行时治理、会员/商品/订单/C端运营、AI 能力、系统集成、监控告警等全链路运营能力。

基于 **Next.js 15** (App Router) + **TypeScript 5.8** + **Ant Design 6** 构建，属于 M5 SaaS 多租户零售平台的管理终端。

---

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [模块架构](#模块架构)
- [目录结构](#目录结构)
- [路由说明](#路由说明)
- [开发指南](#开发指南)
- [环境变量说明](#环境变量说明)
- [构建部署流程](#构建部署流程)
- [核心架构设计](#核心架构设计)
- [多租户隔离](#多租户隔离)
- [测试体系](#测试体系)

---

## 项目概述

`admin-web` 是 M5 平台的**管理后台**，为多租户场景中的品牌方、租户管理员、门店经理等角色提供服务。与面向门店操作员的 `storefront-web` 和面向个人的 `miniapp` 不同，`admin-web` 聚焦于**管理与配置**场景：

- **平台级管理**: 租户管理、市场配置、品牌管理
- **运营管理**: 会员、商品、订单、库存、供应链管理
- **安全与合规**: 身份访问控制、审计日志、限流策略、权限策略
- **配置治理**: 配置条目、Secret 管理、Feature Flag 灰度发布
- **系统监控**: 告警中心、弹性策略、文件监控、系统监控
- **AI 能力**: AI 决策、AI 场景模拟器、智能客服、LLM 配置
- **集成管理**: API 网关、Webhook、集成编排、开放平台
- **财务与 HR**: 财务报表、员工管理、排班、合同管理

---

## 技术栈

| 层         | 技术                                       | 说明                          |
|-----------|--------------------------------------------|-------------------------------|
| 框架       | Next.js 15 (App Router)                     | React Server Components + 文件路由 |
| 语言       | TypeScript 5.8                              | 全量类型声明 + strict 模式       |
| UI 框架    | React 18 + Ant Design 6                     | 企业级组件库                   |
| 图标       | @ant-design/icons 6                         | Ant Design 图标集               |
| 日期处理   | dayjs                                       | 轻量日期库                     |
| 状态管理   | ViewModel 模式 (纯 TypeScript)              | 每页面级 ViewModel 管理业务状态 |
| HTTP 客户端| @m5/sdk (ApiClient)                         | 统一 API 调用与错误处理         |
| 测试       | Node Test Runner + @testing-library/react + happy-dom | 单元测试 + 组件测试 |
| 构建       | Next.js 15 `output: standalone`             | 自包含生产构建                  |
| 包管理     | pnpm workspace monorepo                     | 与 @m5/domain, @m5/sdk, @m5/types, @m5/ui 共享 |
| 容器化     | Docker multi-stage (node:22-alpine)          | 生产镜像约 200MB                |

---

## 模块架构

admin-web 拥有 70+ 功能模块，按领域划分如下：

### 🛡️ 平台治理 (Foundation/Platform)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Tenants** | `app/tenants/` | 租户管理 — 租户创建/编辑/生命周期管理 |
| **Markets** | `app/markets/` | 市场配置 — 市场级语言/货币/税率/社交平台 |
| **Brands** | `app/brands/` | 品牌管理 — 品牌创建/编辑/品牌级配置 |
| **Foundation** | `app/foundation/` | 基础平台 — 平台级配置与运行参数 |

### 🔐 安全与合规 (Security & Compliance)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Identity Access** | `app/identity-access/` | 身份与访问控制 — 用户管理、角色权限 (ABAC)、策略引擎 |
| **Audit Logs** | `app/audit-logs/` | 审计日志 — 操作审计、追溯查询 |
| **Audit Trail** | `app/audit-trail/` | 审计追踪 — 全链路审计追踪 |
| **Rate Limits** | `app/rate-limits/` | 限流策略 — API 限流、配额管理、频控策略 |
| **Safety** | `app/safety/` | 安全管理 — 安全策略、风险管控 |

### ⚙️ 配置与治理 (Configuration & Governance)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Configuration** | `app/configuration/` | 配置管理 — 配置条目 (JSON/String/Number/Boolean)、Secret 管理、Feature Flag |
| **Runtime** | `app/runtime-governance.ts` | 运行时治理 — 运行时操作追踪、回放、同步 |
| **Resilience** | `app/resilience/` | 弹性策略 — 重试策略、恢复计划、边缘回放、可观测性 |
| **Alerts** | `app/alerts/` | 告警管理 — 告警目录、下钻、确认/静默 |

### 👥 会员与客户 (Members & Customers)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Members** | `app/members/` | 会员管理 — 会员查询/详情/等级/积分 |
| **Customer Tags** | `app/customer-tags/` | 客户标签 — 标签管理、分群 |
| **CRM** | `app/crm/` | CRM — 客户关系管理 |
| **Feedback** | `app/feedback/` | 反馈管理 — 用户反馈收集与处理 |

### 📦 商品与供应链 (Products & Supply Chain)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Products** | `app/products/` | 商品管理 — 商品创建/编辑/分类/SKU 管理 |
| **Categories** | `app/categories/` | 分类管理 — 商品分类树 |
| **Inventory** | `app/inventory/` | 库存管理 — 库存查询/盘点/调拨 |
| **Stock** | `app/stock/` | 库存管理 — 库存操作 |
| **Stock Transfer** | `app/stock-transfer/` | 库存调拨 — 调拨单管理 |
| **Stock Operations** | `app/stock-operations/` | 库存操作 — 出入库记录 |
| **Suppliers** | `app/suppliers/` | 供应商管理 |
| **Procurement** | `app/procurement/` | 采购管理 |
| **Purchase Orders** | `app/purchase-orders/` | 采购单管理 |
| **Logistics** | `app/logistics/` | 物流管理 — 配送、运输 |

### 📋 订单与交易 (Orders & Transactions)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Orders** | `app/orders/` | 订单管理 — 订单查询/详情/退款/退货 |
| **Refunds** | `app/refunds/` | 退款管理 |
| **Returns** | `app/returns/` | 退货管理 |
| **Contracts** | `app/contracts/` | 合同管理 |

### 🏪 门店与品牌 (Stores & Brands)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Stores** | `app/stores/` | 门店管理 — 门店创建/编辑/状态管理 |
| **Brand Operations** | `app/brand-operations/` | 品牌运营 — 品牌级运营管理 |
| **Shop** | `app/shop/` | 店铺管理 |
| **Devices** | `app/devices/` | 设备管理 — 门店设备维护 |
| **Equipment** | `app/equipment/` | 设备管理 — 固定资产管理 |
| **Maintenance** | `app/maintenance/` | 维修管理 |
| **Fire Prevention** | `app/fire-prevention/` | 消防安全管理 |
| **License Renewal** | `app/license-renewal/` | 许可证续期管理 |

### 🎯 营销与促销 (Marketing & Promotions)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Campaigns** | `app/campaigns/` | 活动管理 — 活动创建/编辑/投放 |
| **Campaign Rules** | `app/campaign-rules/` | 活动规则引擎 |
| **Coupons** | `app/coupons/` | 优惠券管理 — 优惠券生成/核销 |
| **Coupon Templates** | `app/coupon-templates/` | 优惠券模板 — 模板定义与管理 |
| **Promotions** | `app/promotions/` | 促销管理 — 满减/折扣/买赠活动 |
| **Points Rules** | `app/points-rules/` | 积分规则 — 积分策略配置 |
| **Marketing** | `app/marketing/` | 营销管理 — 营销活动总览 |

### 🤖 AI 与智能 (AI & Intelligence)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **AI Decision** | `app/ai-decision/` | AI 决策 — 基于数据的智能决策 |
| **AI Scenario Simulator** | `app/ai-scenario-simulator/` | AI 场景模拟器 — 假设场景推演 |
| **AI CS** | `app/ai-cs/` | AI 客服 — 智能客服对话管理 |
| **LLM Config** | `app/llm-config/` | LLM 配置 — 大模型连接配置 |
| **Agents** | `app/agents/` | Agent 管理 — AI Agent 配置与运行 |
| **Intelligence** | `app/intelligence/` | 智能分析 |
| **Knowledge** | `app/knowledge/` | 知识库 — 文档、FAQ、培训材料 |

### 🔗 系统集成 (Integration)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Integrations** | `app/integrations/` | 集成管理 — 第三方系统对接 |
| **Integration Orchestration** | `app/integration-orchestration/` | 集成编排 — Webhook、事件、幂等记录 |
| **OpenAPI** | `app/openapi/` | 开放平台 — API 管理、开发者中心 |
| **Payment Channels** | `app/payment-channels/` | 支付渠道 — 支付网关配置 |
| **Alliances** | `app/alliances/` | 联盟管理 — 合作伙伴管理 |
| **SEO** | `app/seo/` | SEO 管理 |

### 📊 数据分析 (Analytics)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Analytics** | `app/analytics/` | 数据分析 — 报表与仪表盘 |
| **Analytics V2** | `app/analytics-v2/` | 数据分析 V2 — 新一代分析视图 |
| **Dashboard** | `app/dashboard/` | 工作台首页 — 角色定制化看板 |
| **Reports** | `app/reports/` | 报表管理 |
| **Competitor Track** | `app/competitor-track/` | 竞品追踪 |
| **Anomaly Frequency** | `app/anomaly-frequency/` | 异常频次检测 |

### 💰 财务与人事 (Finance & HR)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Finance** | `app/finance/` | 财务管理 — 财务报表、对账 |
| **HR** | `app/hr/` | 人事管理 |
| **Staff** | `app/staff/` | 员工管理 |
| **Training** | `app/training/` | 培训管理 |
| **Team Building** | `app/team-building/` | 团队建设 |

### ⚡ 运营与工作流 (Operations & Workflow)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **Approvals** | `app/approvals/` | 审批管理 — 审批流程与记录 |
| **Notifications** | `app/notifications/` | 消息通知 — 通知模板/发送记录 |
| **Announcements** | `app/announcements/` | 公告管理 |
| **Workbench** | `app/workbench/` | 工作台 — 用户工作台管理 |
| **Operations** | `app/operations/` | 运营工作台 |
| **Tags** | `app/tags/` | 标签管理 |
| **Rules** | `app/rules/` | 规则引擎 |

### 🔧 系统与工具 (System & Tools)

| 模块 | 路由路径 | 说明 |
|------|----------|------|
| **System Monitor** | `app/system-monitor/` | 系统监控 — 服务状态、资源使用 |
| **Settings** | `app/settings/` | 系统设置 |
| **Admin** | `app/admin/` | 管理控制台 |
| **Users** | `app/users/` | 用户管理 |
| **Dev Tools** | `app/dev-tools/` | 开发者工具 |
| **Help Center** | `app/help-center/` | 帮助中心 |

---

## 目录结构

```
apps/admin-web/
├── app/                              # Next.js App Router 页面
│   ├── layout.tsx                    # 全局布局 (Sidebar/Header/Auth/多租户)
│   ├── page.tsx                      # 根页面 (自动路由到工作台)
│   ├── loading.tsx                   # 全局加载态
│   ├── globals.css                   # 全局样式
│   ├── bootstrap.ts                  # 应用引导 (多租户/市场配置认证)
│   ├── runtime-governance.ts         # 运行时治理入口
│   ├── admin/                        # 管理控制台
│   ├── agents/                       # AI Agent 管理
│   ├── ai-cs/                        # AI 客服
│   ├── ai-decision/                  # AI 决策
│   ├── ai-scenario-simulator/        # AI 场景模拟器
│   ├── alerts/                       # 告警管理
│   ├── alliances/                    # 联盟管理
│   ├── analytics/                    # 数据分析
│   ├── analytics-v2/                 # 数据分析 V2
│   ├── announcements/                # 公告管理
│   ├── anomaly-frequency/            # 异常频次检测
│   ├── api/                          # API 路由 (Server Actions)
│   ├── approvals/                    # 审批管理
│   ├── audit-logs/                   # 审计日志
│   ├── audit-trail/                  # 审计追踪
│   ├── brand-operations/             # 品牌运营
│   ├── brands/                       # 品牌管理
│   ├── campaign-rules/               # 活动规则引擎
│   ├── campaigns/                    # 活动管理
│   ├── categories/                   # 分类管理
│   ├── competitor-track/             # 竞品追踪
│   ├── components/                   # 页面级共享组件
│   ├── configuration/                # 配置管理
│   ├── contracts/                    # 合同管理
│   ├── coupon-templates/             # 优惠券模板
│   ├── coupons/                      # 优惠券管理
│   ├── crm/                          # CRM
│   ├── customer-tags/                # 客户标签
│   ├── customers/                    # 客户管理
│   ├── dashboard/                    # 工作台首页
│   ├── dev-tools/                    # 开发者工具
│   ├── devices/                      # 设备管理
│   ├── equipment/                    # 固定资产
│   ├── feedback/                     # 反馈管理
│   ├── finance/                      # 财务管理
│   ├── fire-prevention/              # 消防安全
│   ├── foundation/                   # 基础平台
│   ├── help-center/                  # 帮助中心
│   ├── hr/                           # 人事管理
│   ├── identity-access/              # 身份与访问控制
│   ├── integration-orchestration/    # 集成编排
│   ├── integrations/                 # 集成管理
│   ├── intelligence/                 # 智能分析
│   ├── inventory/                    # 库存管理
│   ├── knowledge/                    # 知识库
│   ├── lib/                          # 页面级工具库
│   ├── license-renewal/              # 许可证续期
│   ├── llm-config/                   # LLM 配置
│   ├── login/                        # 登录页
│   ├── logistics/                    # 物流管理
│   ├── maintenance/                  # 维修管理
│   ├── marketing/                    # 营销管理
│   ├── markets/                      # 市场配置
│   ├── member/                       # 会员管理
│   ├── members/                      # 会员管理
│   ├── notifications/                # 消息通知
│   ├── openapi/                      # 开放平台
│   ├── operations/                   # 运营工作台
│   ├── orders/                       # 订单管理
│   ├── pad/                          # PAD 端视图
│   ├── payment-channels/             # 支付渠道
│   ├── points-rules/                 # 积分规则
│   ├── procurement/                  # 采购管理
│   ├── products/                     # 商品管理
│   ├── promotions/                   # 促销管理
│   ├── purchase-orders/              # 采购单
│   ├── rate-limits/                  # 限流策略
│   ├── recommendations/              # 推荐管理
│   ├── refunds/                      # 退款管理
│   ├── reports/                      # 报表管理
│   ├── resilience/                   # 弹性策略
│   ├── returns/                      # 退货管理
│   ├── rules/                        # 规则引擎
│   ├── safety/                       # 安全管理
│   ├── seo/                          # SEO 管理
│   ├── settings/                     # 系统设置
│   ├── shop/                         # 店铺管理
│   ├── staff/                        # 员工管理
│   ├── stock/                        # 库存(统一)
│   ├── stock-operations/             # 库存操作
│   ├── stock-transfer/               # 库存调拨
│   ├── stores/                       # 门店管理
│   ├── suppliers/                    # 供应商
│   ├── system-monitor/               # 系统监控
│   ├── tags/                         # 标签管理
│   ├── team-building/                # 团队建设
│   ├── tenants/                      # 租户管理
│   ├── training/                     # 培训管理
│   ├── users/                        # 用户管理
│   ├── workbench/                    # 用户工作台
│   ├── __e2e__/                      # E2E 测试用例
│   └── page.test.tsx / .ts           # 页面测试
├── types/                            # 全局类型声明
│   └── pg.d.ts                       # PostgreSQL 类型扩展
├── next.config.mjs                   # Next.js 主配置
├── next.config.performance.js        # 性能优化配置 (图像优化/缓存策略)
├── tsconfig.json                     # TypeScript 严格配置
├── Dockerfile                        # 多阶段 Docker 构建
├── eslint.config.mjs                 # ESLint 配置
└── package.json                      # 依赖 & 脚本
```

---

## 路由说明

admin-web 使用 Next.js App Router 文件系统路由，路由路径按功能域组织：

### 安全与治理路由

| 路径 | 说明 |
|------|------|
| `/identity-access` | 身份与访问控制 (用户/角色/策略) |
| `/audit-logs` | 审计日志列表与查询 |
| `/audit-trail` | 全链路审计追踪 |
| `/rate-limits` | 限流策略管理 |
| `/safety` | 安全管理 |

### 配置路由

| 路径 | 说明 |
|------|------|
| `/configuration` | 配置治理 (配置条目/Secrets/Feature Flag) |
| `/resilience` | 弹性策略 (重试/恢复/可观测) |
| `/alerts` | 告警中心 |

### 运营路由

| 路径 | 说明 |
|------|------|
| `/dashboard` | 工作台首页 (角色自定义) |
| `/members` | 会员管理 |
| `/products` | 商品管理 |
| `/orders` | 订单管理 |
| `/stores` | 门店管理 |
| `/inventory` | 库存管理 |
| `/campaigns` | 活动管理 |
| `/analytics` | 数据分析 |

### AI 路由

| 路径 | 说明 |
|------|------|
| `/ai-decision` | AI 决策 |
| `/ai-scenario-simulator` | AI 场景模拟器 |
| `/ai-cs` | AI 客服 |
| `/llm-config` | LLM 配置 |
| `/agents` | Agent 管理 |
| `/intelligence` | 智能分析 |

### 平台管理路由

| 路径 | 说明 |
|------|------|
| `/tenants` | 租户管理 |
| `/markets` | 市场配置 |
| `/brands` | 品牌管理 |
| `/integrations` | 集成管理 |
| `/integration-orchestration` | 集成编排 |

---

## 开发指南

### 前置条件

- Node.js >= 22
- pnpm >= 10.14
- Docker (可选)

### 快速开始

```bash
# 1. 安装依赖 (在 monorepo 根目录)
pnpm install

# 2. 启动 admin-web 开发服务器
cd apps/admin-web
pnpm dev
# 默认访问: http://localhost:3000
```

### 可用脚本

```bash
pnpm dev        # 启动 Next.js 开发服务器 (热更新)
pnpm build      # 生产构建 (output: standalone)
pnpm start      # 启动生产服务器
pnpm lint       # ESLint 代码检查
pnpm typecheck  # TypeScript 类型检查 (tsc --noEmit)
pnpm test       # 运行测试 (Node Test Runner)
```

### 开发工作流

```bash
# 1. 创建功能分支
git checkout -b feat/my-feature

# 2. 开发
# 在对应模块目录下编写代码

# 3. 类型检查 (必须通过)
pnpm typecheck

# 4. 测试 (相关模块)
pnpm test

# 5. 代码检查
pnpm lint

# 6. 构建验证
pnpm build
```

### ViewModel 模式

每个页面路由采用 ViewModel 模式，将业务逻辑与 UI 分离：

```tsx
// app/rate-limits/rate-limits-view-model.ts
export function useRateLimitsViewModel() {
  const [policies, setPolicies] = useState<RateLimitPolicyRecord[]>([]);

  const load = useCallback(async () => {
    const client = new ApiClient({ baseUrl: getDefaultApiBaseUrl() });
    const data = await client.listRateLimitPolicies();
    setPolicies(data);
  }, []);

  return { policies, load };
}

// app/rate-limits/page.tsx
export default function RateLimitsPage() {
  const { policies, load } = useRateLimitsViewModel();

  useEffect(() => { load(); }, []);

  return <RateLimitPolicyTable policies={policies} />;
}
```

### 测试风格

```ts
// app/rate-limits/rate-limits-view-model.test.ts
import { describe, it, assert } from 'node:test';

describe('RateLimitsViewModel', () => {
  it('should filter active policies', () => {
    // 纯逻辑测试，无 DOM 依赖
    const result = filterActivePolicies(mockPolicies);
    assert.equal(result.length, 2);
  });
});
```

---

## 环境变量说明

| 变量名 | 必填 | 说明 | 示例值 |
|--------|------|------|--------|
| `NEXT_PUBLIC_M5_API_BASE_URL` | 是 | 后端 API 地址 | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_M5_MARKET_CODE` | 否 | 默认市场代码 | `CN` |
| `NEXT_PUBLIC_CDN_BASE_URL` | 否 | CDN 静态资源地址 | `https://cdn.m5.com/admin` |

```bash
# .env.local
NEXT_PUBLIC_M5_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_M5_MARKET_CODE=CN
```

---

## 构建部署流程

### 本地构建

```bash
cd apps/admin-web
pnpm build
# 产物: .next/standalone/
```

### Docker 构建

```bash
# 从 monorepo 根目录
docker build -f apps/admin-web/Dockerfile -t m5/admin-web:latest .

# 运行
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_M5_API_BASE_URL=https://api.m5.com/api/v1 \
  --name admin-web \
  m5/admin-web:latest
```

### 部署架构

```
用户请求 → CDN (静态资源) → 负载均衡 →
  → admin-web 容器 (Next.js SSR) →
  → M5 API Gateway → 后端微服务
```

---

## 核心架构设计

### 多租户架构

admin-web 采用四层作用域隔离：

| 层级 | 范围 | 说明 |
|------|------|------|
| 平台级 (SaaS) | 全局 | 平台管理、市场配置 |
| 租户级 | 单个租户 | 租户专属配置、用户管理 |
| 品牌级 | 品牌 | 品牌配置、商品策略 |
| 门店级 | 门店 | 门店运营、排班 |

`bootstrap.ts` 负责应用引导，从后端加载当前用户的身份上下文、租户信息、市场配置，初始化全局 scope。

```ts
// bootstrap.ts 流程
1. 加载 FoundationBootstrap → 获取平台基础配置
2. 加载 MarketBootstrap → 获取市场配置 (语言/货币)
3. 加载 IdentityAccessContext → 获取用户角色/权限
4. 初始化应用 scope (TenantScope / BrandScope / StoreScope)
5. 路由到对应角色工作台
```

### ABAC 权限策略

admin-web 支持 10+ 种角色和基于属性的权限策略 (ABAC)：

- **权限模型**: Attribute-Based Access Control
- **角色**: super_admin / admin / auditor / operator / manager / staff / ...
- **策略引擎**: 支持条件表达式 (部门/门店/时间范围)
- **权限验证**: 前端 + 后端双验证

### 运行时治理 (Runtime Governance)

所有高风险操作经过运行时治理流程：

```
用户操作 → 治理提交 (submit) → 风险判定 → 挑战/审批 → 放行/回放 (replay)
```

核心流程在 `app/runtime-governance.ts` 中定义。

### 配置治理 (Configuration Governance)

支持三级配置继承：

```
平台级 (default) → 租户级 (override) → 品牌级 (override) → 门店级 (override)
```

配置类型包括：配置条目、Secret、Feature Flag 灰度发布、证书管理。

---

## 多租户隔离

### 数据隔离

- 所有 API 请求携带 `x-tenant-id` / `x-brand-id` / `x-store-id` 头
- 后端根据上下文自动过滤数据范围
- Secret 和敏感信息仅在对应作用域内可见

### 视图隔离

- 根据用户角色展示不同的工作台和侧边栏
- 平台管理员可见全部租户
- 品牌运营仅见所属品牌和门店

---

## 测试体系

### 测试工具

- **Node Test Runner**: 原生测试运行器
- **@testing-library/react**: React 组件测试
- **@testing-library/user-event**: 用户事件模拟
- **happy-dom**: 轻量 DOM 环境 (替代 jsdom)

### 测试结构

```
app/rate-limits/
├── page.tsx                   # 页面组件
├── rate-limits-view-model.ts  # ViewModel
├── page.test.tsx              # 组件测试
├── page.test.ts               # ViewModel 测试
└── loading.tsx                # 加载态

app/audit-logs/
├── page.tsx                   # 审计日志页面
├── audit-logs-view-model.ts   # ViewModel
├── page.test.tsx              # 组件测试
└── ...
```

### 测试覆盖范围

- **ViewModel 测试**: 纯 TypeScript 逻辑测试，无 DOM 依赖
- **组件测试**: 渲染测试、交互测试、边界条件
- **集成测试**: 跨模块功能验证
- **E2E 测试**: 在 `app/__e2e__/` 目录下
