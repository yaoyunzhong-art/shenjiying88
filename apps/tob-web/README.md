# @m5/tob-web — B2B 运营门户

> 神机营 B2B 运营管理门户，面向 SaaS 平台运营人员、合作伙伴及企业客户，提供告警管理、运营监控、会员管理、营销工具等一站式运营控制台。

## 技术栈

| 类别       | 技术                                   |
| ---------- | -------------------------------------- |
| 框架       | Next.js 15 (App Router) + standalone   |
| 语言       | TypeScript 5.8                         |
| UI         | React 18 + CSS-in-JS (内联样式)         |
| 测试       | Node Test Runner + Testing Library + jsdom |
| 包管理     | pnpm workspace (monorepo)              |
| 内部包     | @m5/domain, @m5/sdk, @m5/types, @m5/ui |
| 部署       | Docker (multi-stage, node:22-alpine)   |

## 核心功能

- **多市场多语言** — 基于 `[marketCode]` 动态路由，支持区域性配置（时区/货币/税率）
- **运营监控** — 告警管理、运行时治理面板、AI 规则引擎仪表盘
- **会员管理** — 会员数据中心、会员资料管理、标签管理
- **营销促销** — AI 营销、优惠券管理、活动规则配置、积分管理
- **订单履约** — 订单管理、采购订单、库存管理、库存调拨
- **商品管理** — 商品管理、商品数据配置
- **客户管理** — 客户管理、企业管理
- **支付与收银** — 收银 POS、财务仪表盘
- **开放平台** — OpenAPI Portal、RBAC 权限管理
- **企业服务** — 企业注册、企业控制台、联盟仪表盘
- **品牌管理** — 品牌网站、品牌管理
- **运营支持** — 员工管理、供应商管理、培训中心、公告、通知
- **AI 能力** — AI 营销面板、AI 规则仪表盘、AI 销售助手
- **体育项目** — 电竞联盟站点（Sports Ants 品牌站）

## 目录结构

```
apps/tob-web/
├── app/                         # Next.js App Router
│   ├── layout.tsx               # 全局布局（多语言识别）
│   ├── page.tsx                 # 根页面入口
│   ├── middleware.ts            # 中间件（文档语言解析）
│   ├── [marketCode]/            # 多市场动态路由
│   ├── globals.css              # 全局样式
│   ├── ai-marketing/            # AI 营销
│   ├── ai-rules-dashboard/      # AI 规则引擎仪表盘
│   ├── ai-sales-panel/          # AI 销售面板
│   ├── alerts/                  # 告警管理
│   ├── audit-logs/              # 审计日志
│   ├── brands/                  # 品牌管理
│   ├── brand-website/           # 品牌网站
│   ├── campaigns/               # 活动管理
│   ├── cashier-pos/             # 收银 POS
│   ├── contracts/               # 合同管理
│   ├── coupon-center/           # 优惠券中心
│   ├── coupons/                 # 优惠券配置
│   ├── customers/               # 客户管理
│   ├── docs-center/             # 文档中心
│   ├── employees/               # 员工管理
│   ├── enterprise/              # 企业管理
│   ├── finance-dashboard/       # 财务仪表盘
│   ├── inventory/               # 库存管理
│   ├── member-center/           # 会员中心
│   ├── members/                 # 会员管理
│   ├── members-data/            # 会员数据
│   ├── notifications/           # 通知中心
│   ├── openapi-portal/          # OpenAPI 开放平台
│   ├── operations/              # 运营管理
│   ├── orders/                  # 订单管理
│   ├── products/                # 商品管理
│   ├── purchase-orders/         # 采购订单
│   ├── rbac-admin/              # RBAC 权限管理
│   ├── saas-console/            # SaaS 控制台
│   ├── salesperson-workbench/   # 销售工作台
│   ├── sports-ants/             # Sports Ants 品牌站点
│   ├── stores/                  # 门店管理
│   ├── suppliers/               # 供应商管理
│   ├── svip/                    # SVIP 管理
│   ├── tenants/                 # 租户管理
│   ├── training-center/         # 培训中心
│   ├── components/              # 共享组件
│   ├── lib/                     # 工具库
│   └── __e2e__/                 # E2E 端到端测试
├── next.config.mjs              # Next.js 配置（standalone 输出）
├── Dockerfile                   # 多阶段 Docker 构建
├── middleware.ts                # 中间件
├── eslint.config.mjs            # ESLint 配置
├── tsconfig.json                # TypeScript 配置
└── package.json                 # 依赖与脚本
```

## 环境变量

| 变量名          | 说明                  | 默认值  |
| --------------- | --------------------- | ------- |
| `NODE_ENV`      | 运行环境              | `development` |
| `PORT`          | 服务端口              | `3004`  |
| `HOSTNAME`      | 绑定地址              | `0.0.0.0` |

应用依赖 monorepo 中 `packages/` 下的内部包，环境级配置（API 基地址等）通过 `@m5/sdk` 管理。

## 开发命令

```bash
# 启动开发服务器（monorepo 根目录）
pnpm dev

# 构建生产版本
pnpm build

# 生产模式启动
pnpm start

# TypeScript 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

## 快速开始

1. 在 monorepo 根目录执行 `pnpm install` 安装依赖
2. 执行 `pnpm dev` 启动开发服务器
3. 默认访问 `http://localhost:3000`
4. 生产构建使用 `Dockerfile` 进行多阶段构建

## 架构说明

- **多市场路由**：通过 `[marketCode]` 动态段实现多市场/多语言隔离，中间件自动识别文档语言
- **Standalone 输出**：Next.js `output: 'standalone'`，配合多阶段 Docker 构建，产物尺寸优化
- **ViewModel 模式**：各路由模块采用 ViewModel 模式组织数据与展示逻辑
- **测试覆盖**：每个功能模块包含 `.test.ts` / `.test.tsx` 测试文件
- **E2E 验证**：`__e2e__/` 目录包含跨模块端到端测试（Playwright）
