# @m5/storefront-web — 门店前端收银台应用

> **门店综合运营终端** — 面向门店运营、收银员、导购员、店长等岗位，提供收银、会员、商品、报表、库存管理、员工排班等一站式门店管理功能。基于 **Next.js 15** (App Router) + **TypeScript 5.8** + **Ant Design 6** 构建，属于 M5 SaaS 多租户零售平台的门店终端。

---

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [功能模块](#功能模块)
- [目录结构](#目录结构)
- [本地开发指南](#本地开发指南)
- [环境变量说明](#环境变量说明)
- [构建部署流程](#构建部署流程)
- [核心架构](#核心架构)
- [路由说明](#路由说明)
- [多端适配策略](#多端适配策略)
- [测试体系](#测试体系)

---

## 项目概述

`storefront-web` 是 M5 平台面向门店场景的前端终端，覆盖零售门店的完整运营闭环：

- **收银台**: 快速收银、会员登录/注册、充值、会员卡核销
- **商品管理**: 商品展示、编辑、分类、推荐
- **订单履约**: 订单查询、退换货、退款、配货
- **库存管理**: 盘点、调拨、补货预警
- **门店运营**: 排班、交接班、设备巡检、预约
- **销售分析**: 报表、业绩分析、经营看板
- **营销工具**: 优惠券核销、促销活动、团购/拼团
- **AI 辅助**: AI 决策建议、异常频次检测

项目采用 **Next.js 15 App Router**，支持 **PC / H5 / PAD** 三端适配。核心业务逻辑通过 ViewModel 模式与 UI 层解耦，数据层通过 `@m5/sdk` 与后端 API 通信。

---

## 技术栈

| 层         | 技术                                       | 说明                          |
|-----------|--------------------------------------------|-------------------------------|
| 框架       | Next.js 15 (App Router)                     | React Server Components + 文件路由 |
| 语言       | TypeScript 5.8                              | 全量类型声明 + strict 模式       |
| UI 框架    | React 18 + Ant Design 6                     | 企业级组件库 + 响应式布局       |
| 图标       | @ant-design/icons 6                         | Ant Design 图标集               |
| 状态管理   | ViewModel 模式 (纯 TypeScript)              | 每页面级 ViewModel 管理业务状态 |
| HTTP 客户端| @m5/sdk (ApiClient)                         | 统一 API 调用与错误处理         |
| 测试       | vitest + @testing-library/react + jsdom     | 单元测试 + 组件测试 + ViewModel 测试 |
| 构建       | Next.js 15 `output: standalone`             | 自包含生产构建                  |
| 包管理     | pnpm workspace monorepo                     | 与 @m5/domain, @m5/sdk, @m5/types, @m5/ui 共享 |
| 容器化     | Docker multi-stage (node:22-alpine)          | 生产镜像约 200MB                |

---

## 功能模块

### 🧾 收银模块
- 快速收银：扫码/搜索添加商品，多支付方式聚合
- 会员收银：会员登录、余额充值、会员卡折扣
- 自助充值：H5 端自助充值入口
- 结账流程：购物车管理、优惠券核销、结算确认

### 👥 会员管理
- 会员中心：会员详情、等级、积分、充值记录
- 会员注册/登录：微信登录、手机验证码
- 会员卡：电子会员卡展示、核销
- 会员升级路径：等级晋升规则与进度
- 会员流失分析：流失预警与挽回建议

### 📦 商品管理
- 商品展示：列表/网格视图、SKU 详情
- 商品编辑：价格、库存、描述维护
- 分类管理：商品分类树维护
- 推荐管理：商品推荐位配置
- 库存管理：库存查询、盘点、调拨、补货

### 📋 订单履约
- 订单列表：按状态/时间筛选
- 订单详情：商品明细、物流追踪
- 退货退款：退货申请、退款处理
- 配货管理：配货单、拣货流程
- 配送追踪：配送状态实时更新

### 📊 数据洞察
- 销售报表：日/周/月销售趋势
- 销售业绩：导购员业绩排行
- 销售预测：基于历史数据的销量预估
- 门店营收：各门店营收对比
- 经营看板：关键指标实时看板

### 🏪 门店运营
- 门店管理：门店信息维护
- 员工管理/排班：班次设置、排班表
- 交接班：班次交接、交接记录
- 设备巡检：设备状态检查
- 预约管理：服务预约、排期

### 🎯 营销推广
- 优惠券核销：核销码验证
- 促销活动：满减、折扣活动配置
- 团购/拼团：团购商品管理
- 营销数据：活动效果分析

### 🤖 AI 能力
- AI 决策辅助：基于数据的智能建议
- AI 实验：A/B 测试管理
- 异常频次检测：运营异常自动识别

---

## 目录结构

```
apps/storefront-web/
├── app/                              # Next.js App Router 页面
│   ├── layout.tsx                    # 全局布局 (Header/Sidebar/Auth Guard)
│   ├── page.tsx                      # 根页面 (自动路由跳转)
│   ├── loading.tsx                   # 全局加载态组件
│   ├── globals.css                   # 全局样式 + CSS 变量
│   ├── runtime-governance.ts         # 运行时治理入口
│   ├── market-bootstrap.ts           # 市场配置引导
│   ├── store-scope.ts                # 门店作用域管理
│   ├── storefront-home-view-model.ts # 门店首页 ViewModel
│   ├── storefront-product-edit.ts    # 商品编辑入口
│   ├── [...storeScope]/              # 动态门店作用域路由
│   ├── _components/                  # 页面级共享组件 (非路由组件)
│   ├── cashier/                      # 收银台 (含收银流程)
│   ├── members/                      # 会员管理
│   ├── member-center/                # 会员中心
│   ├── member-login/                 # 会员登录
│   ├── member-register/              # 会员注册
│   ├── member-recharge/              # 会员充值
│   ├── member-card/                  # 会员卡
│   ├── member-churn/                 # 流失分析
│   ├── member-upgrade-path/          # 升级路径
│   ├── products/                     # 商品管理
│   ├── product-detail/               # 商品详情
│   ├── product-display/              # 商品展示
│   ├── categories/                   # 分类管理
│   ├── recommendations/              # 推荐管理
│   ├── orders/                       # 订单管理
│   ├── checkout/                     # 结算
│   ├── refunds/                      # 退款管理
│   ├── returns/                      # 退货管理
│   ├── return-orders/                # 退货单
│   ├── delivery-tracking/            # 配送追踪
│   ├── transactions/                 # 交易记录
│   ├── inventory/                    # 库存查询
│   ├── stocktaking/                  # 盘点
│   ├── stock-transfer/               # 库存调拨
│   ├── stock/                        # 库存管理
│   ├── replenishment/                # 补货管理
│   ├── inventory-keeper/             # 库存管理员工作台
│   ├── coupons/                      # 优惠券
│   ├── promotions/                   # 促销活动
│   ├── group-booking/                # 团购/拼团
│   ├── campaigns/                    # 活动管理
│   ├── insights/                     # 数据洞察
│   ├── analytics/                    # 分析报表
│   ├── sales-forecast/               # 销售预测
│   ├── sales-performance/            # 销售业绩
│   ├── sales-guide/                  # 销售导购
│   ├── sales-clerk/                  # 导购员工作台
│   ├── staff-performance/            # 员工绩效
│   ├── store-revenue/                # 门店营收
│   ├── store-rank/                   # 门店排名
│   ├── stores/                       # 门店管理
│   ├── store-manager/                # 店长工作台
│   ├── store-locator/                # 门店定位
│   ├── store-ratings/                # 门店评分
│   ├── employee/                     # 员工管理
│   ├── scheduling/                   # 排班管理
│   ├── shift-handover/               # 交接班
│   ├── departments/                  # 部门管理
│   ├── appointments/                 # 预约管理
│   ├── maintenance/                  # 维修管理
│   ├── device-monitoring/            # 设备监控
│   ├── device-inspection/            # 设备巡检
│   ├── device-reservation/           # 设备预约
│   ├── ops-manager/                  # 运营管理
│   ├── operations/                   # 运营工作台
│   ├── customer-service/             # 客服中心
│   ├── feedback/                     # 反馈管理
│   ├── frontdesk/                    # 前台管理
│   ├── messages/                     # 消息中心
│   ├── announcements/                # 公告管理
│   ├── notifications/                # 通知设置
│   ├── bookings/                     # 预订管理
│   ├── coach/                        # 教练管理
│   ├── dashboard/                    # 工作台看板
│   ├── bookshelf/                    # 知识库/书架
│   ├── ai-decisions/                 # AI 决策
│   ├── ai-experiments/               # AI 实验
│   ├── anomaly-frequency/            # 异常频次检测
│   ├── reports/                      # 报表
│   ├── purchase-orders/              # 采购单
│   ├── suppliers/                    # 供应商
│   ├── finance/                      # 财务管理
│   ├── performance/                  # 绩效管理
│   ├── staff/                        # 员工 (共用)
│   ├── point-history/                # 积分历史
│   ├── self-recharge/                # 自助充值 (H5)
│   ├── events/                       # 活动管理
│   ├── team-building/                # 团队建设
│   ├── reviews/                      # 评价管理
│   ├── account/                      # 账户管理
│   ├── settings/                     # 设置
│   ├── help/                         # 帮助中心
│   ├── task-center/                  # 任务中心
│   ├── gadgets/                      # 小工具
│   ├── alerts/                       # 告警管理
│   ├── h5/                           # H5 独立视图页面
│   ├── __smoke__/                    # 冒烟测试页面
│   └── components/                   # 页面级组件库
├── components/                       # 跨模块共享组件
│   ├── WechatLoginButton.tsx         # 微信登录按钮
│   └── h5-components.tsx             # H5 通用组件
├── lib/                              # 工具与服务层
│   ├── campaign-service.ts           # 活动服务
│   ├── contact-service.ts            # 联系方式服务
│   ├── coupon-service.ts             # 优惠券服务
│   ├── favorites-service.ts          # 收藏服务
│   ├── member-auth-service.ts        # 会员认证服务
│   ├── member-card-service.ts        # 会员卡服务
│   ├── order-service.ts              # 订单服务
│   ├── payment-service.ts            # 支付服务
│   ├── points-service.ts             # 积分服务
│   ├── store-locator-service.ts      # 门店定位服务
│   ├── store-locator-style.ts        # 门店定位样式
│   ├── storefront-finance.ts         # 门店财务工具
│   ├── storefront-orders.ts          # 门店订单工具
│   ├── storefront-transactions.ts    # 门店交易工具
│   ├── wechat-auth-service.ts        # 微信认证服务
│   └── __tests__/                    # lib 层测试
├── next.config.mjs                   # Next.js 配置 (standalone output)
├── tsconfig.json                     # TypeScript 严格配置
├── vitest.config.ts                  # vitest 测试配置
├── vitest.setup.ts                   # 测试环境初始化
├── .test-setup.cjs                   # CommonJS 测试配置
├── eslint.config.mjs                 # ESLint 扁平化配置
├── Dockerfile                        # 多阶段 Docker 构建
└── package.json                      # 依赖 & 脚本
```

---

## 本地开发指南

### 前置条件

- Node.js >= 22（推荐使用 nvm/n 管理版本）
- pnpm >= 10.14（`corepack enable && corepack prepare pnpm@10.14.0 --activate`）
- Docker (可选，用于容器化构建)

### 快速开始

```bash
# 1. 在 monorepo 根目录安装依赖
cd /path/to/shenjiying88
pnpm install

# 2. 启动 storefront-web 开发服务器
cd apps/storefront-web
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
pnpm test       # 运行 vitest 测试
pnpm test:vitest # 运行 vitest (别名)
```

### 开发工作流

1. **分支策略**: 基于 `main` 创建功能分支，命名如 `feat/cashier-multi-payment`
2. **类型检查**: 提交前执行 `pnpm typecheck` 确保无类型错误
3. **测试**: `pnpm test` 运行所有测试，ViewModel 测试无 DOM 依赖
4. **lint**: `pnpm lint` 检查代码风格
5. **构建验证**: 合并前本地 `pnpm build` 确保生产构建通过

### ViewModel 模式说明

每个页面路由对应一个 ViewModel 文件（如 `cashier-view-model.ts`），负责：

- 管理页面状态（loading / error / data）
- 封装业务逻辑（通过 `@m5/sdk` 调用 API）
- 提供纯函数式的测试接口
- 与 React 组件通过 hooks / props 连接

```tsx
// 典型 ViewModel 使用示例
import { useCashierViewModel } from './cashier-view-model';

export default function CashierPage() {
  const { items, total, loading, addItem, checkout } = useCashierViewModel();

  return (
    <div>
      <CartItems items={items} onAdd={addItem} />
      <CheckoutPanel total={total} loading={loading} onCheckout={checkout} />
    </div>
  );
}
```

---

## 环境变量说明

storefront-web 支持以下环境变量（通过 `NEXT_PUBLIC_*` 前缀暴露到客户端）：

| 变量名                              | 必填 | 说明                          | 示例值                        |
|-------------------------------------|------|-------------------------------|-------------------------------|
| `NEXT_PUBLIC_M5_API_BASE_URL`       | 是   | 后端 API 地址                 | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_M5_MARKET_CODE`        | 否   | 默认市场代码                  | `CN`                          |
| `NEXT_PUBLIC_M5_STORE_ID`           | 否   | 默认门店 ID                   | `store-001`                   |
| `NEXT_PUBLIC_WECHAT_APP_ID`         | 否   | 微信 AppID (微信登录)         | `wx1234567890abcdef`          |
| `NEXT_PUBLIC_CDN_BASE_URL`          | 否   | CDN 静态资源地址              | `https://cdn.m5.com/storefront` |

环境变量可通过 `.env.local` 文件或部署平台设置：

```bash
# .env.local (本地开发)
NEXT_PUBLIC_M5_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_M5_MARKET_CODE=CN
```

> ⚠️ 注意: 由于与后端集成，`M5_API_BASE_URL` 也可以在运行时通过 `@m5/sdk` 的 `getDefaultApiBaseUrl()` 自动确定。开发时确保后端服务运行在对应端口。

---

## 构建部署流程

### 本地构建

```bash
# 生产构建
cd apps/storefront-web
pnpm build

# 产物位置: .next/standalone (Next.js standalone 模式)
# 静态资源: .next/static (部署到 CDN)
```

### Docker 构建

使用项目提供的 `Dockerfile` 进行多阶段构建：

```bash
# 从 monorepo 根目录构建
docker build -f apps/storefront-web/Dockerfile -t m5/storefront-web:latest .

# 运行
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_M5_API_BASE_URL=https://api.m5.com/api/v1 \
  -e M5_MARKET_CODE=CN \
  --name storefront-web \
  m5/storefront-web:latest
```

### 部署架构

```
用户请求 → CDN (静态资源) → 负载均衡 → 
  → storefront-web 容器 (Next.js SSR) → 
  → M5 API Gateway → 后端微服务
```

- **静态资源**: 部署到 CDN (`.next/static/`)
- **SSR 服务**: 以 Docker 容器运行，至少 2 副本
- **环境变量**: 通过部署平台 (K8s Secrets / 环境变量) 注入

### CI/CD 流水线

```yaml
# 典型 CI 流程 (GitHub Actions 示例)
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
  - run: pnpm install --frozen-lockfile
  - run: pnpm --filter @m5/storefront-web typecheck
  - run: pnpm --filter @m5/storefront-web lint
  - run: pnpm --filter @m5/storefront-web test
  - run: pnpm --filter @m5/storefront-web build
  - run: docker build -f apps/storefront-web/Dockerfile -t $REGISTRY/storefront-web:${{ github.sha }}
```

---

## 核心架构

### 多端适配架构

```
apps/storefront-web/
├── app/                    # PC 端路由 (默认)
│   └── page.tsx            # 响应式布局, 大屏 PC / 中等 PAD
├── app/h5/                 # H5 移动端独立视图
│   └── page.tsx            # 移动端专属 UI
└── components/             # 跨端共享组件
    └── h5-components.tsx   # H5 端通用组件库
```

- **PC/PAD**: 默认路由路径，响应式布局适配 1024px+ 屏幕
- **H5**: `app/h5/` 目录下独立视图，移动端优先设计
- 核心业务逻辑通过 ViewModel 模式跨端共享

### 门店作用域 (StoreScope)

所有门店端操作在门店上下文内执行：

```ts
// store-scope.ts
const storeScope = useStoreScope();
// → 自动注入 x-store-id, x-brand-id, x-tenant-id 等请求头
```

### 市场配置引导 (MarketBootstrap)

```ts
// market-bootstrap.ts
const market = await useMarketBootstrap();
// → 加载市场级配置 (语言、货币、税率、社交平台)
// → 配置 Ant Design 多语言
```

### 安全设计

- 客户端仅持有上下文 Token，敏感操作走后端 API
- 运行时治理：所有高风险操作（支付、会员登录）经过 runtime governance 审批
- 审计追踪：关键操作提交审计记录

---

## 路由说明

storefront-web 使用 Next.js App Router 文件系统路由。路由路径与门店场景直接对应：

### 核心业务路由

| 路由模式              | 说明                      |
|----------------------|---------------------------|
| `/cashier`           | 收银台                     |
| `/checkout`          | 结账流程                   |
| `/members`           | 会员管理                   |
| `/products`          | 商品管理                   |
| `/orders`            | 订单管理                   |
| `/inventory`         | 库存查询                   |
| `/transactions`      | 交易记录                   |

### 动态作用域路由

```ts
// app/[...storeScope]/layout.tsx
// 支持按门店、品牌、租户动态隔离数据
// URL: /store-001/cashier → 门店 store-001 的收银台
```

### H5 独立路由

所有 `app/h5/` 下的路由专为移动端设计，支持小屏触屏交互。

---

## 多端适配策略

### 适配原则

1. **核心逻辑共享**: ViewModel / Service / SDK 跨端复用
2. **UI 差异隔离**: PC / H5 差异通过条件渲染和 `_components` 目录隔离
3. **响应式布局**: Ant Design Grid + CSS media queries 处理中等屏幕（PAD）

### 检测方式

```tsx
// 使用响应式 hook 判断当前端
const isMobile = useMediaQuery('(max-width: 768px)');
const isPad = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
const isDesktop = useMediaQuery('(min-width: 1025px)');
```

---

## 测试体系

### 测试工具

- **vitest**: 测试运行器 (配置: `vitest.config.ts`)
- **@testing-library/react**: 组件测试
- **@testing-library/jest-dom**: DOM 断言扩展
- **jsdom**: 浏览器环境模拟

### 测试结构

```
app/cashier/
├── page.tsx                   # 页面组件
├── cashier-view-model.ts      # ViewModel (业务逻辑)
├── cashier-view-model.test.ts # ViewModel 纯逻辑测试
├── page.test.tsx              # 组件渲染测试
└── page.loading.tsx           # 加载态组件

lib/
└── __tests__/                 # 服务层测试
```

### 测试覆盖

- **ViewModel 测试**: 纯 `.ts` 测试，无 DOM 依赖，速度快
- **组件测试**: 使用 `@testing-library/react` 渲染并断言
- **快照测试**: 关键 UI 组件的稳定性检测
