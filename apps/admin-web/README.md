# @m5/admin-web — 管理后台

> 多租户零售管理后台，面向品牌/租户/门店运营人员，提供统一的管理控制台。

## 核心功能

- **多租户架构** — 支持平台级(SaaS)、租户级、品牌级、门店级四层作用域
- **身份与访问控制** — 用户管理、角色权限(10 种角色)、策略引擎(ABAC)、审计日志
- **配置管理** — 配置条目(JSON/String/Number/Boolean)、Secret 管理、Feature Flag 灰度发布
- **运行时治理** — 运行时操作追踪、告警管理、弹性策略、限流策略
- **运营管理** — 门店/品牌/市场管理、会员管理、商品管理、订单/退款/库存/采购
- **营销促销** — 优惠券/优惠券模版、活动规则、积分规则、推广活动
- **财务/HR** — 财务报表、员工管理、排班
- **AI 能力** — AI 决策、AI 场景模拟器、AI 客服、LLM 配置
- **系统集成** — API 网关、Webhook、集成编排、开放平台
- **监控与安全** — 系统监控、告警中心、PII 数据保护、备份恢复、审计追踪
- **多市场多语言** — 区域性配置(市场/时区/货币/税率/社交平台)、多语言支持

## 技术栈

| 层     | 技术                         |
| ------ | ---------------------------- |
| 框架   | Next.js 15 (App Router)      |
| 语言   | TypeScript 5.8               |
| UI     | React 18 + Ant Design 6      |
| 图标   | @ant-design/icons 6          |
| 状态   | 各模块 ViewModel 模式        |
| 测试   | Node Test Runner + Testing Library + happy-dom |
| 包管理 | pnpm workspace (monorepo)    |
| 内部包 | @m5/domain, @m5/sdk, @m5/types, @m5/ui |

## 目录结构

```
apps/admin-web/
├── app/                    # Next.js App Router 页面与逻辑
│   ├── layout.tsx          # 全局布局
│   ├── page.tsx            # 根页面
│   ├── loading.tsx         # 全局加载态
│   ├── globals.css         # 全局样式
│   ├── bootstrap.ts        # 应用引导(多租户、市场配置)
│   ├── page.test.tsx / .ts # 根页面测试
│   ├── runtime-governance.ts# 运行时治理入口
│   ├── approvals/          # 审批管理
│   ├── analytics/          # 分析仪表盘
│   ├── audit-logs/         # 审计日志
│   ├── configuration/      # 配置管理(配置条目/密钥/Feature Flag/操作)
│   ├── customers/          # 客户管理
│   ├── dashboard/          # 工作台首页
│   ├── finance/            # 财务管理
│   ├── identity-access/    # 身份与访问控制(用户/角色/策略)
│   ├── integrations/       # 集成管理
│   ├── members/            # 会员管理
│   ├── notifications/      # 消息通知
│   ├── orders/             # 订单管理
│   ├── products/           # 商品管理
│   ├── rate-limits/        # 限流策略
│   ├── resilience/         # 弹性策略
│   ├── settings/           # 系统设置
│   ├── stores/             # 门店管理
│   ├── tenants/            # 租户管理
│   ├── ai-scenario-simulator/ # AI 场景模拟器
│   ├── alert-service/      # 告警服务
│   └── ...                 # 其他模块(70+ 功能模块)
├── types/                  # 全局类型声明
│   └── pg.d.ts             # PostgreSQL 类型扩展
├── next.config.mjs         # Next.js 配置
├── next.config.performance.js # 性能配置
├── tsconfig.json           # TypeScript 配置
├── Dockerfile              # Docker 构建
└── package.json            # 依赖与脚本
```

## 开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 生产模式启动
pnpm start

# 代码检查
pnpm lint

# TypeScript 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

## 启动方式

1. 确保已安装依赖：`pnpm install`（在 monorepo 根目录执行）
2. 启动开发服务器：`pnpm dev`
3. 默认访问：`http://localhost:3000`
4. 登录后根据角色权限显示对应工作台

## 架构说明

- **多租户隔离**：通过 `TenantScope` 和 `FoundationScope` 实现多层级作用域隔离
- **ViewModel 模式**：每个页面及其子组件采用 ViewModel 模式，职责清晰、可测试
- **测试覆盖**：每个功能模块均包含测试文件（`.test.ts` / `.test.tsx`）
- **错误处理**：统一的错误边界、加载态、重试机制
