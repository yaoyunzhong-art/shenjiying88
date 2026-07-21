# @m5/storefront-web — 门店前端

> 门店综合运营终端，面向门店运营/收银/导购/店长等角色，提供收银、会员、商品、报表等一站式门店管理功能。

## 核心功能

- **收银系统** — 快速收银、顾客登录/注册、余额充值、会员卡
- **会员管理** — 会员注册/升级、会员详情、积分查询、充值记录、历史订单
- **商品管理** — 商品展示、商品编辑、分类管理、推荐管理
- **订单履约** — 订单查询、退换货处理、退款管理、配货管理
- **库存管理** — 库存查询、盘点、库存调拨、补货预警
- **门店运营** — 门店信息、员工排班、交接班、设备巡检、预约管理
- **销售与报表** — 销售报表、业绩分析、销售预测、经营看板
- **营销推广** — 优惠券核销、促销活动、团购/拼团、营销数据
- **客户服务** — 消息通知、客服、反馈管理
- **多端适配** — PC 端(PAD 兼容) + H5 移动端 + 微信小程序多端适配
- **智能分析** — AI 决策辅助、AI 实验、异常频次检测

## 技术栈

| 层     | 技术                         |
| ------ | ---------------------------- |
| 框架   | Next.js 15 (App Router)      |
| 语言   | TypeScript 5.8               |
| UI     | React 18 + Ant Design 6      |
| 图标   | @ant-design/icons 6          |
| 测试   | Node Test Runner + Testing Library + jsdom |
| 包管理 | pnpm workspace (monorepo)    |
| 内部包 | @m5/domain, @m5/sdk, @m5/types, @m5/ui |

## 页面路由

```
/                           → 门店首页/登录(根据市场配置自动跳转)
/customers                  → 客户管理
/cashier                    → 收银台
/member-center              → 会员中心
/member-login               → 会员登录
/member-register            → 会员注册
/member-recharge            → 会员充值
/member-card                → 会员卡
/member-churn               → 会员流失分析
/member-upgrade-path        → 会员升级路径
/products                   → 商品管理
/product-detail             → 商品详情
/product-display            → 商品展示
/orders                     → 订单管理
/checkout                   → 结算
/refunds                    → 退款管理
/returns                    → 退货管理
/coupons                    → 优惠券
/promotions                 → 促销活动
/group-booking              → 团购/拼团
/categories                 → 分类管理
/inventory                  → 库存查询
/stocktaking                → 盘点
/stock-transfer             → 库存调拨
/replenishment              → 补货管理
/transactions               → 交易记录
/insights                   → 数据洞察
/analytics                  → 分析报表
/sales-forecast             → 销售预测
/sales-performance          → 销售业绩
/staff-performance          → 员工绩效
/store-revenue              → 门店营收
/store-rank                 → 门店排名
/stores                     → 门店管理
/store-manager              → 门店经理工作台
/ops-manager                → 运营管理
/employee                   → 员工管理
/scheduling                 → 排班管理
/shift-handover             → 交接班
/departments                → 部门管理
/appointments               → 预约管理
/device-monitoring          → 设备监控
/device-inspection          → 设备巡检
/device-reservation         → 设备预约
/messages                   → 消息中心
/announcements              → 公告管理
/notifications              → 通知管理
/settings                   → 设置
/help                       → 帮助中心
/booking                    → 预订管理
/coach                      → 教练管理
/feedback                   → 反馈管理
/sales-guide                → 销售导购
/sales-clerk                → 导购员工作台
/self-recharge              → 自助充值
/frontdesk                  → 前台管理
/customer-service           → 客服中心
/task-center                → 任务中心
/recommendations            → 推荐管理
/dashboard                  → 工作台看板
/bookself                   → 书架/知识库
/ai-decisions               → AI 决策
/ai-experiments             → AI 实验
/anomaly-frequency          → 异常频次检测
/reports                    → 报表
/staff                      → 员工
/purchase-orders            → 采购单
/suppliers                  → 供应商
/team-building              → 团队建设
/store-locator              → 门店定位
/stores-v2                  → 门店管理(v2)
/account                    → 账户管理
/events                     → 活动管理
```

> **说明**：H5 端独立页面见 `app/h5/` 目录。部分功能包含 PAD 端适配。

## 目录结构

```
apps/storefront-web/
├── app/                         # Next.js App Router 页面
│   ├── layout.tsx               # 全局布局
│   ├── page.tsx                 # 根页面(自动路由跳转)
│   ├── loading.tsx              # 全局加载态
│   ├── globals.css              # 全局样式
│   ├── runtime-governance.ts    # 运行时治理入口
│   ├── market-bootstrap.ts      # 市场配置引导
│   ├── store-scope.ts           # 门店作用域管理
│   ├── storefront-home-view-model.ts # 门店首页 ViewModel
│   ├── storefront-product-edit.ts    # 商品编辑入口
│   ├── members/                 # 会员模块
│   ├── cashier/                 # 收银模块
│   ├── products/                # 商品模块
│   ├── orders/                  # 订单模块
│   ├── insights/                # 数据洞察
│   ├── h5/                      # H5 独立视图
│   └── ...                      # 100+ 功能路由页面
├── components/                  # 跨模块共享组件
│   ├── WechatLoginButton.tsx    # 微信登录按钮
│   └── h5-components.tsx        # H5 通用组件
├── lib/                         # 工具库
├── next.config.mjs              # Next.js 配置
├── tsconfig.json                # TypeScript 配置
├── Dockerfile                   # Docker 构建
└── package.json                 # 依赖与脚本
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

## 开发指南

1. **环境准备**：在 monorepo 根目录执行 `pnpm install`
2. **启动开发**：`pnpm dev`（默认 http://localhost:3000）
3. **测试风格**：
   - 每个页面路由文件夹下包含 `.test.ts` 和 `.test.tsx` 测试文件
   - 测试使用 `node --test` + `@testing-library/react` + `jsdom`
   - ViewModel 和数据层测试为纯逻辑测试（.ts，无 DOM 依赖）
4. **多端适配原则**：
   - 核心逻辑与组件放在非终端特化目录共享
   - PC / H5 差异通过条件渲染和 `_components` 目录隔离
5. **路由规范**：
   - 使用 Next.js App Router 文件系统路由
   - 每个路由文件夹包含 `page.tsx`（页面组件）+ `loading.tsx`（过渡态）

## 架构说明

- **门店作用域**：通过 `StoreScope` 隔离不同门店的数据访问范围
- **多市场支持**：根据 `MarketBootstrap` 加载市场级配置（语言、货币、税率等）
- **安全规范**：客户端仅持有必要的上下文 Token，敏感操作走后端 API
- **测试覆盖**：全局 `.test.ts` / `.test.tsx` 测试覆盖率达核心功能模块
