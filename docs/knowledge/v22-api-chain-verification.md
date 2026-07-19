# V22 API 真链路核对报告

> 日期: 2026-07-20
> 范围: POS / Checkout / 支付 / 退款 主链

## 接口清单

### 后端实际路由（app.setGlobalPrefix = `api/v1`）

| 路径 | 模块 | 状态 | 说明 |
|:-----|:----:|:----:|:-----|
| `POST /api/v1/payment-gateway/pay` | `payment-gateway` | ✅ **真实接口** | 发起支付，支持 PayPal/Stripe/PayPay/支付宝/微信/本地钱包 |
| `GET /api/v1/payment-gateway/pay/:id` | `payment-gateway` | ✅ **真实接口** | 查询支付结果 |
| `POST /api/v1/payment-gateway/refund` | `payment-gateway` | ✅ **真实接口** | 发起退款 |
| `GET /api/v1/payment-gateway/refund/:id` | `payment-gateway` | ✅ **真实接口** | 查询退款状态 |
| `POST /api/v1/transactions/checkout` | `transactions` | ✅ **真实接口** | 创建交易结账（下单+支付一步到位） |
| `POST /api/v1/transactions/payments/standardized-callback` | `transactions` | ✅ **真实接口** | 收银台支付回调 |
| `GET /api/v1/transactions/orders/:orderId` | `transactions` | ✅ **真实接口** | 查询订单交易聚合信息 |
| `GET /api/v1/transactions/orders` | `transactions` | ✅ **真实接口** | 交易订单列表 |
| `POST /api/v1/transactions/orders/:orderId/timeout-close` | `transactions` | ✅ **真实接口** | 超时关闭订单 |
| `POST /api/v1/transactions/orders/batch-timeout-close` | `transactions` | ✅ **真实接口** | 批量超时关闭订单 |
| `POST /api/v1/transactions/orders/:orderId/manual-close` | `transactions` | ✅ **真实接口** | 手动关闭订单 |
| `GET /api/v1/transactions/orders/:orderId/refunds` | `transactions` | ✅ **真实接口** | 查询订单退款记录 |
| `GET /api/v1/transactions/refunds` | `transactions` | ✅ **真实接口** | 退款列表 |
| `GET /api/v1/transactions/refunds/pending` | `transactions` | ✅ **真实接口** | 待处理退款列表 |
| `GET /api/v1/transactions/refunds/dashboard` | `transactions` | ✅ **真实接口** | 退款看板（SLA/升级/优先级队列） |
| `GET /api/v1/transactions/refunds/:refundId` | `transactions` | ✅ **真实接口** | 查询单条退款 |
| `POST /api/v1/transactions/orders/:orderId/refunds` | `transactions` | ✅ **真实接口** | 申请退款 |
| `POST /api/v1/transactions/refunds/:refundId/approve` | `transactions` | ✅ **真实接口** | 审批通过退款 |
| `POST /api/v1/transactions/refunds/:refundId/reject` | `transactions` | ✅ **真实接口** | 拒绝退款 |
| `POST /api/v1/transactions/refunds/batch-approve` | `transactions` | ✅ **真实接口** | 批量审批退款 |
| `POST /api/v1/transactions/refunds/batch-reject` | `transactions` | ✅ **真实接口** | 批量拒绝退款 |
| `POST /api/v1/transactions/refunds/batch-assign` | `transactions` | ✅ **真实接口** | 批量分配退款 |
| `POST /api/v1/transactions/refunds/batch-claim` | `transactions` | ✅ **真实接口** | 批量认领退款 |
| `GET /api/v1/transactions/members/:memberId` | `transactions` | ✅ **真实接口** | 会员交易列表 |
| `GET /api/v1/transactions/members/:memberId/refunds` | `transactions` | ✅ **真实接口** | 会员退款列表 |
| `GET /api/v1/transactions/persistent/snapshots/orders` | `transactions` | ✅ **真实接口** | 订单快照列表（LYT 同步） |
| `GET /api/v1/transactions/persistent/snapshots/orders/:externalOrderId` | `transactions` | ✅ **真实接口** | 订单快照详情 |
| `GET /api/v1/transactions/persistent/snapshots/payments` | `transactions` | ✅ **真实接口** | 支付快照列表（LYT 同步） |
| `GET /api/v1/transactions/persistent/snapshots/payments/:externalPaymentId` | `transactions` | ✅ **真实接口** | 支付快照详情 |

> **注:** 以上所有路由均已在 `apps/api/src/app.module.ts` 注册。模块名称为 `TransactionsModule` 和 `PaymentGatewayModule`，名称与 Controller 路径一致。

---

## 检查结果

### 后端模块

| 模块 | 状态 | 说明 |
|:-----|:----:|:------|
| `payment-gateway` | ✅ **已存在** | Controller + Service + DTO + Module + 单元测试 + E2E测试 + 角色测试完整 |
| `transactions` | ✅ **已存在** | Controller + Service + DTO + Entity + Module + 单元测试 + E2E测试 + 角色测试完整 |
| `cashier` | ✅ **已存在** | 基础收银服务，被 `transactions` 调用，含 Order/Service/Entity/SateMachine |
| `loyalty` | ✅ **已存在** | 积分/优惠券/盲盒服务，被 `transactions` 调用 |
| `order` (独立模块) | ⚠️ **不存在独立模块** | 订单逻辑由 `cashier` + `transactions` 联合管理 |

> 注: 原任务中预期的 `payment`、`order`、`checkout` 模块命名与实际项目不符。实际实现为 `payment-gateway` + `transactions` + `cashier` 三模块协同。

### 鉴权要求

| 鉴权层 | 机制 | 是否生效 |
|:-------|:----|:--------:|
| 全局 Guard | `IdentityAccessGuard` (APP_GUARD) — 检查 `actorContext` 认证、角色权限、租户范围 | ✅ 全局生效 |
| Controller 级 | `payment-gateway` 和 `transactions` controller **未设置** `@RequireRoles` / `@RequirePermissions` / `@TenantScope` 装饰器 | ⚠️ 未显式限制角色 |
| 路由鉴权行为 | Guard 检查逻辑: 当 roles/permissions/tenantScope 元数据均未设置时 → `return true` (放行) | ⚠️ **当前无角色限制** |
| 租户上下文 | 通过 `@TenantContext()` 参数装饰器获取，服务层自行校验 | ✅ 服务层使用 |
| `TenantScopeGuard` | 存在于 `__mocks__/tenant.guard.ts`（仅供测试使用） | ✅ 测试覆盖 |
| 角色渗透测试 | 8角色测试文件: `payment-gateway.role.test.ts` + `transactions.role.test.ts` | ✅ 测试验证多角色行为 |

**结论:** 鉴权框架完善（`IdentityAccessGuard` + `IdentityAccessService`），但当前支付/交易 controller **未显式配置角色/权限约束**，任何经过认证的 actor 均可调用。如需限制特定角色（如仅店长可退款），需添加 `@RequireRoles()` 装饰器。

### Mock 依赖

#### 后端

| 模块 | Mock 情况 | 细节 |
|:-----|:---------:|:-----|
| `payment-gateway.service` | ⚠️ **内存模拟** | `transactions = new Map()`, `walletBalances = new Map()`, `refundRecords = new Map()` — 纯内存存储。无 `Prisma` 或数据库持久化。PayPal/Stripe/PayPay 均为模拟调用。 |
| `transactions.service` | ⚠️ **部分 mock** | 退款记录 `refundStore = new Map()` 内存存储；订单/支付委托 `cashier.service`。快照数据可选 Prisma 持久化 (`@Optional() prisma`) |
| `cashier.service` | ⚠️ **内存+Redis** | `orderStore = new Map()`, `paymentStore = new Map()` + 异步 Redis 回写 (write-through)。`cache?.set()` 静默降级 |
| `loyalty.service` | ⚠️ **内存模拟** | 积分/优惠券/盲盒/结算均为 `Map` 内存存储 |

**后端整体评价: ⚠️ 部分 mock (内存模拟)**

所有 API **接口层是真实的**（有 Controller/Service/Module/Guards/测试），但 **底层存储是内存 Map**，无数据库持久化。适用于功能验证和开发，不适合生产环境。不过架构已预留 Prisma 集成（`@Optional()` 注入），快照类数据可无缝切换到数据库。

#### 前端

| 页面 | Mock 情况 | 细节 |
|:-----|:---------:|:-----|
| `admin-web/app/orders/page.tsx` | 🚫 **完全 mock** | 使用 `MOCK_ORDERS` 常量数据，无 API fetch 调用 |
| `admin-web/app/refunds/page.tsx` | 🚫 **完全 mock** | 使用常量数据（`refund-data.ts`），测试使用 `MOCK_REFUNDS` |
| `admin-web/app/orders/[id]/page.tsx` | 🚫 **完全 mock** | 详情页同样使用 mock |
| `admin-web/app/workbench/cashier/page.tsx` | 🚫 **完全 mock** | 硬编码 session 数据 + `Array.from({length:10}, ...)` 生成交易记录 |
| `admin-web/app/settings/payment-config/page.tsx` | 🚫 **完全 mock** | `ACTIVE_CHANNELS` 常量，无 API 调用 |
| `admin-web/app/payment-channels/page.tsx` | ⚠️ 未深入检查 | 存在页面文件 |
| `storefront-web/app/h5/payment/[orderId]/page.tsx` | 🚫 **部分 mock** | 页面标题注明"模拟创建支付订单"，`mockAmount = 9999`，`paymentService.createPayment` 调用真实 API |
| `storefront-web/lib/payment-service.ts` | ⚠️ **部分 mock** | 真实 fetch 调用 `POST /payments`，但 `generateQRCode` 返回 mock URL (`mock-pay-${orderId}-${method}`) |

**前端整体评价: 🚫 前端全 mock**

管理后台(admin-web)的订单、退款、收银页面 **完全不调用后端 API**，数据全部使用内联 mock 常量。Storefront 的支付页面使用 `payment-service.ts` 调用真实后端，但创建流程含 mock amount。

---

## 主链调用流程

```
[Users: 收银台/小程序/扫码支付]
       │
       ▼
[admin-web orders/refunds page]  ⚠️ MOCK ONLY — 未连后端
[storefront-web h5/payment]      ⚠️ 调用 paymentService (部分 mock)
       │
       ▼
[后端 API Gateway]  ─────────  globalPrefix: api/v1
       │
       ├── POST /payment-gateway/pay      ⚠️ 底层为内存 Map
       ├── POST /payment-gateway/refund   ⚠️ 底层为内存 Map
       ├── POST /transactions/checkout    ⚠️ 委托 cashier (内存 Map)
       ├── POST /transactions/...         ⚠️ 退款记录内存 Map
       └── POST /transactions/payments/...  ⚠️ 回调处理后端验证
```

---

## 结论

### 可用的真实接口

除 `GET /api/v1/products` 未在本次检查范围内外，POS/Checkout/支付/退款主链**共计 28 个真实 API 接口**，均已完成:
- Controller 定义 ✅
- Service 实现 ✅
- DTO 定义 ✅
- Entity/Type 定义 ✅
- Module 注册 ✅
- 单元测试 + 角色测试 + E2E 测试 ✅
- app.module.ts 注册 ✅

### 需要增强的方面

| 优先级 | 项目 | 当前问题 | 建议 |
|:------:|:-----|:---------|:-----|
| P0 | **后端存储持久化** | payment-gateway 使用纯内存 Map，重启丢失 | 添加 Prisma Entity + 迁移文件 |
| P0 | **前端真实 API 调用** | orders/refunds/cashier 页面完全不调用后端 | 替换 MOCK_ORDERS 为 API fetch 调用 |
| P1 | **Controller 角色权限** | 支付/交易接口未设置 @RequireRoles() 装饰器 | 添加上下文角色约束：退款需店长/Ops权限 |
| P2 | **payment-gateway 真实支付对接** | PayPal/Stripe 等为模拟实现 | 对接真实 SDK：@paypal/checkout-server-sdk, stripe-node |
| P2 | **storefront 支付 mock** | 前端 mockAmount + mock 二维码 | 传入真实金额，对接 real QR generation |

### 不需要新建的模块

| 原任务预期 | 实际状态 | 说明 |
|:-----------|:--------|:------|
| `payment` 模块 | ✅ `payment-gateway` | 名称不同但功能完整 |
| `order` 模块 | ✅ `transactions` + `cashier` | 订单由 cashier 管理，交易聚合由 transactions 提供 |
| `checkout` 模块 | ✅ `transactions` + `cashier` | `POST /transactions/checkout` 即实现 |
| `product` 模块 | ❌ 不在检查范围内 | 未深入检查 |

### 风险摘要

1. **⚡ 高:** payment-gateway 后端纯内存存储 — 生产不可用
2. **⚡ 高:** 管理端前端全 mock — 无法验证真实数据流
3. **⚠️ 中:** 支付接口无角色权限约束
4. **⚠️ 中:** storefront 支付含 mock 数据
5. **🟢 低:** 架构清晰，对接真实支付 SDK 和数据库时改造量可控
