# 收银台模块 (Cashier)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块负责门店收银台核心能力，提供完整的订单-支付-退款生命周期管理:

- **订单管理** (`create/submit/cancel/fulfill/query`) — 订单状态机 (草稿→待支付→已支付→履约→关闭)
- **支付处理** (`create/callback`) — 支付发起、渠道回调、状态更新
- **退款处理** (`create/query`) — 退款申请、状态查询
- **会员查询** (`GET /cashier/members/lookup`) — POS 收银台会员实时查询
- **商品扫码** (`GET /cashier/products/:sku`) — POS 商品扫码查询
- **SSE 事件流** (`/api/cashier/orders/events`) — 实时订单/支付事件推送
- **离线同步** — 离线数据缓存与同步
- **付费计费** (`/cashier/admin/billing/*`) — 商业化计费 admin 端 (P3-5)

边界约束:
- ❌ 不处理用户认证/登录（见 `auth` 模块）
- ❌ 不处理用户注册/会员管理（见 `member` 模块）
- ❌ 不处理积分的发行与销毁（见 `loyalty` 模块）
- ❌ 不处理实际的资金支付渠道对接（见 `gateways` 下的渠道适配器）
- ❌ 不处理发票/财务记账（见 `billing` / `reports` 模块）
- ✅ 聚焦 门店收银 → 订单 → 支付 → 退款 → 事后同步 的完整闭环

═══════════════════════════════════════
箍二: 核心功能列表
═══════════════════════════════════════

| 功能 | 端点 | 状态 |
|------|------|------|
| 创建订单 | `POST /cashier/orders` | ✅ IMPLEMENTED |
| 提交订单 (草稿→待支付) | `POST /cashier/orders/:id/submit` | ✅ IMPLEMENTED |
| 取消订单 | `POST /cashier/orders/:id/cancel` | ✅ IMPLEMENTED |
| 履约 (已支付→已履约) | `POST /cashier/orders/:id/fulfill` | ✅ IMPLEMENTED |
| 查询订单 | `GET /cashier/orders/:id` | ✅ IMPLEMENTED |
| 查询订单行 | `GET /cashier/orders/:id/items` | ✅ IMPLEMENTED |
| 订单列表 (含分页/过滤) | `GET /cashier/orders` | ✅ IMPLEMENTED |
| 发起支付 | `POST /cashier/orders/:id/payments` | ✅ IMPLEMENTED |
| 支付回调 | `POST /cashier/payments/:id/callback` | ✅ IMPLEMENTED |
| 申请退款 | `POST /cashier/orders/:id/refunds` | ✅ IMPLEMENTED |
| 查询退款 | `GET /cashier/refunds/:id` | ✅ IMPLEMENTED |
| POS 会员查询 | `GET /cashier/members/lookup?q=` | ✅ IMPLEMENTED |
| POS 商品扫码 | `GET /cashier/products/:sku` | ✅ IMPLEMENTED |
| 商品目录 | `GET /cashier/products` | ✅ IMPLEMENTED |
| 支付渠道统计 | `GET /cashier/stats/channels` | ✅ IMPLEMENTED |
| SSE 全订单事件流 | `GET /api/cashier/orders/events` | ✅ IMPLEMENTED |
| SSE 单订单事件流 | `GET /api/cashier/orders/:id/events` | ✅ IMPLEMENTED |
| SSE 支付事件流 | `GET /api/cashier/payments/events` | ✅ IMPLEMENTED |
| SSE 重连 (Last-Event-ID) | `GET /api/cashier/orders/events/replay?lastEventId=` | ✅ IMPLEMENTED |
| 离线同步 | `CashierOfflineService` | ✅ IMPLEMENTED |
| Billing admin (usage/wallet/bills/plan) | `GET/POST /cashier/admin/billing/*` | ✅ IMPLEMENTED |
| 超时自动关单 | `CashierService.closeTimedOutOrder()` | ✅ IMPLEMENTED |
| 手动关单 | `CashierService.closeOrder()` | ✅ IMPLEMENTED |

═══════════════════════════════════════
箍三: 架构说明 — 目录结构
═══════════════════════════════════════

```
apps/api/src/modules/cashier/
├── cashier.module.ts                — NestJS 模块, 导入 TypeORM/Member/Loyalty/Inventory/CommercialBilling
├── cashier.controller.ts            — 主控制器: 11+ 端点 (订单/支付/退款/POS/统计)
├── cashier-billing.controller.ts    — 商业化计费 admin 控制器: 6 端点
├── cashier.sse.ts                   — SSE 控制器: 3 端点 + replay
├── cashier.service.ts               — 核心服务: 创建/支付/回调/关单/渠道统计 (cache-aside 持久化)
├── cashier.entity.ts                — TypeORM 实体 + 接口合约: Order/Payment/Member/Transaction
├── cashier.dto.ts                   — DTO 定义 (CreateCashierOrder/CreateCashierPayment/Callback)
├── cashier.events.ts                — 事件总线: 11 类事件 + Subject + EventStore 重放
├── cashier.contract.ts              — 接口合约
├── cashier-id.ts                    — 订单号生成器
├── cashier-tenant.ts               — 租户上下文
├── cashier.seed.ts                  — 种子数据 (测试会员)
│
├── order.service.ts                 — 订单服务 (状态机)
├── payment.service.ts               — 支付服务 (渠道对接)
├── refund.service.ts                — 退款服务
├── cashier-offline.service.ts       — 离线同步服务
├── offline-sync.service.ts          — 离线同步引擎
├── order-state-machine.ts           — 订单状态机 (状态转换规则)
│
├── gateways/                        — 支付渠道网关
│   ├── index.ts                     — 导出聚合
│   ├── base-payment-gateway.ts      — 抽象基类
│   ├── alipay-gateway.ts            — 支付宝网关
│   ├── wechat-pay-gateway.ts        — 微信支付网关
│   └── balance-gateway.ts           — 余额支付网关
│
├── ports/                           — 端口适配器
│   ├── payment-channel.port.ts      — 支付通道接口
│   ├── payment-channel.registry.ts  — 多租户通道注册表
│   ├── payment-channel.registry.test.ts
│   ├── payment-channel.bootstrap.ts — 启动时注册 Mock 通道
│   └── payment-channel.bootstrap.test.ts
│
├── bridges/                         — 模块间桥接
│   ├── cashier-lyt-events.ts        — LYT 事件类型定义
│   ├── cashier-to-lyt.bridge.ts     — cashier → LYT 事件桥
│   ├── lyt-to-cashier.bridge.ts     — LYT → cashier 事件桥
│   └── cashier-lyt-bridges.test.ts  — 桥接测试
│
├── retry/
│   └── retry.service.spec.ts        — 重试策略测试
│
├── cashier-transaction/
│   └── persistence.service.spec.ts  — 事务持久化测试
│
├── *.test.ts / *.spec.ts            — ~37 个测试文件
│   └── cashier.service.test.ts, cashier.controller.test.ts, cashier.e2e.test.ts,
│       cashier.role.test.ts, cashier.role-extended.test.ts, cashier.role-enhanced.test.ts,
│       cashier.role-v3.test.ts, cashier.controller.spec.ts, cashier.service.spec.ts,
│       cashier.dto.test.ts, cashier.entity.test.ts, cashier.module.test.ts,
│       cashier.contract.test.ts, cashier.persistence.spec.ts,
│       cashier-billing.controller.spec.ts, cashier-billing.e2e.test.ts,
│       cashier-billing.role.test.ts, cashier-billing-extension.test.ts,
│       cashier-billing-integration.test.ts,
│       cashier-ringbeam.test.ts, cashier.simulator.test.ts,
│       cashier-channel-stats.test.ts, cashier-product-scan.test.ts,
│       cashier-member-lookup.test.ts, cashier-offline.test.ts,
│       cashier-tenant.test.ts, cashier.phase-p35.test.ts,
│       order-state-machine.test.ts, payment.service.test.ts,
│       bridge tests, gateway tests, retry tests, persistence tests
└── README.md                        — 本文档
```

═══════════════════════════════════════
箍四: 关键接口 / 数据结构
═══════════════════════════════════════

### REST 端点

#### CashierController (主收银台)

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| POST | `/cashier/orders` | TenantGuard | 创建订单 (草稿) |
| POST | `/cashier/orders/:id/submit` | TenantGuard | 提交订单 DRAFT→PENDING |
| POST | `/cashier/orders/:id/cancel` | TenantGuard | 取消订单 |
| POST | `/cashier/orders/:id/fulfill` | TenantGuard | 履约 PAID→FULFILLED |
| GET | `/cashier/orders/:id` | TenantGuard | 查询订单 |
| GET | `/cashier/orders/:id/items` | TenantGuard | 查询订单行 |
| GET | `/cashier/orders` | TenantGuard | 订单列表 |
| POST | `/cashier/orders/:id/payments` | TenantGuard | 发起支付 |
| POST | `/cashier/payments/:id/callback` | TenantGuard | 支付回调 |
| POST | `/cashier/orders/:id/refunds` | TenantGuard | 申请退款 |
| GET | `/cashier/refunds/:id` | TenantGuard | 查询退款 |
| GET | `/cashier/members/lookup` | @Public | POS 会员查询 |
| GET | `/cashier/products/:sku` | @Public | POS 商品扫码 |
| GET | `/cashier/products` | @Public | 商品目录 |
| GET | `/cashier/stats/channels` | TenantGuard | 支付渠道统计 |

#### CashierBillingController (商业化计费)

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| GET | `/cashier/admin/billing/usage` | TenantGuard | 本期用量报告 |
| GET | `/cashier/admin/billing/wallet` | TenantGuard | 查钱包余额 |
| POST | `/cashier/admin/billing/wallet/recharge` | TenantGuard | 充值 |
| GET | `/cashier/admin/billing/bills` | TenantGuard | 账单列表 |
| POST | `/cashier/admin/billing/plan` | TenantGuard | 设置/切换套餐 |
| GET | `/cashier/admin/billing/plan` | TenantGuard | 查当前套餐 |

#### CashierSseController (SSE)

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| SSE | `/api/cashier/orders/events` | TenantGuard | 全订单事件流 |
| SSE | `/api/cashier/orders/:orderId/events` | TenantGuard | 单订单事件流 |
| SSE | `/api/cashier/payments/events` | TenantGuard | 支付事件流 |
| GET | `/api/cashier/orders/events/replay` | TenantGuard | SSE 重连 (Last-Event-ID) |

### 核心数据结构

```typescript
// 订单
interface CashierOrder {
  orderId: string
  orderNo?: string
  tenantContext: RequestTenantContext  // 租户隔离
  memberId: string
  items: CashierOrderItem[]
  currency: string
  totalAmount: number
  couponCode?: string
  status: CashierOrderStatus  // CREATED→PENDING_PAYMENT→PAID→CLOSED
  latestPaymentId?: string
}

// 订单状态机
CashierOrderStatus: CREATED → PENDING_PAYMENT → PAID → (FULFILLED)
                                       ↓            ↓
                                  CLOSED       CLOSED

// 支付
interface CashierPayment {
  paymentId: string
  orderId: string
  channel: string          // WECHAT | ALIPAY | CARD | CASH
  amount: number
  status: CashierPaymentStatus  // PENDING → SUCCEEDED | FAILED
  qrCodeUrl?: string
}

// SSE 事件 (discriminated union)
type CashierEvent =
  | { type: 'order.created'; tenantId: string; orderId: string; amount: number }
  | { type: 'order.paid'; tenantId: string; orderId: string; paymentId: string }
  | { type: 'payment.success'; tenantId: string; ... }
  | { type: 'refund.success'; tenantId: string; ... }
  | ... // 11 种事件类型
```

═══════════════════════════════════════
箍五: 配置项
═══════════════════════════════════════

| 配置 | 值 | 说明 |
|------|-----|------|
| NODE_ENV | development/production | 影响种子数据加载 |
| DB 连接 | 全局 TypeORM 配置 | TypeORM 实体自动绑定 |
| Redis | 全局 CacheService | cache-aside 可选缓存层 |
| `orderStore` | in-memory Map | L1 缓存 (write-through) |
| `paymentStore` | in-memory Map | L1 缓存 (write-through) |

### 持久化策略 (P0-A1)

```
写入: in-memory Map → Redis(fire-and-forget) → DB(upsert)
读取: in-memory(L1) → Redis(L2) → DB(L3)
Redis/DB 不可用时静默降级, 不阻塞主流程
```

═══════════════════════════════════════
箍六: 依赖关系
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 多租户守卫, 所有端点强制注入 |
| 上游依赖 | `member` 模块 | MemberService: 会员校验/查询 |
| 上游依赖 | `loyalty` 模块 | LoyaltyService: 积分结算 |
| 上游依赖 | `inventory/inventory-item` 模块 | InventoryItemService: 商品查询 |
| 上游依赖 | `foundation/commercial-billing` 模块 | BillingWall: 调用方付费拦截 |
| 上游依赖 | TypeORM | CashierOrderEntity / CashierPaymentEntity 持久化 |
| 上游依赖 | CacheService (可选) | Redis 缓存层 |
| 下游消费 | 外部调用方 | 通过 REST API 或 SSE 消费 |

═══════════════════════════════════════
箍七: 使用示例
═══════════════════════════════════════

### 创建订单

```bash
curl -X POST http://localhost:3000/api/cashier/orders \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -H "x-user-id: cashier-01" \
  -d '{
    "memberId": "member_001",
    "items": [{"skuId": "SKU001", "title": "盲盒A", "quantity": 2, "price": 39.9}],
    "currency": "CNY"
  }'
```

### 发起支付

```bash
curl -X POST http://localhost:3000/api/cashier/orders/<orderId>/payments \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -H "x-user-id: cashier-01" \
  -d '{"channel": "WECHAT"}'
```

### 支付回调

```bash
curl -X POST http://localhost:3000/api/cashier/payments/<paymentId>/callback \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{"providerTxnId": "wx_txn_202607011200"}'
```

### 查询订单

```bash
curl http://localhost:3000/api/cashier/orders/<orderId> \
  -H "x-tenant-id: tenant-demo"
```

### POS 会员查询

```bash
curl "http://localhost:3000/api/cashier/members/lookup?q=13800138002" \
  -H "x-tenant-id: tenant-demo"
```

### 订阅 SSE 事件流

```bash
# 全订单事件流
curl -N http://localhost:3000/api/cashier/orders/events \
  -H "x-tenant-id: tenant-demo"

# 单订单事件流
curl -N http://localhost:3000/api/cashier/orders/<orderId>/events \
  -H "x-tenant-id: tenant-demo"

# SSE 重连 (Last-Event-ID)
curl "http://localhost:3000/api/cashier/orders/events/replay?lastEventId=evt-xxx" \
  -H "x-tenant-id: tenant-demo"
```

### 运行测试

```bash
# 收银台模块核心测试
npx jest apps/api/src/modules/cashier/cashier.service.test.ts
npx jest apps/api/src/modules/cashier/cashier.service.spec.ts
npx jest apps/api/src/modules/cashier/cashier.controller.test.ts
npx jest apps/api/src/modules/cashier/cashier.controller.spec.ts
npx jest apps/api/src/modules/cashier/cashier.e2e.test.ts
npx jest apps/api/src/modules/cashier/cashier.dto.test.ts
npx jest apps/api/src/modules/cashier/cashier.entity.test.ts

# 角色权限测试
npx jest apps/api/src/modules/cashier/cashier.role.test.ts
npx jest apps/api/src/modules/cashier/cashier.role-extended.test.ts
npx jest apps/api/src/modules/cashier/cashier.role-enhanced.test.ts
npx jest apps/api/src/modules/cashier/cashier.role-v3.test.ts

# 计费扩展测试
npx jest apps/api/src/modules/cashier/cashier-billing.e2e.test.ts
npx jest apps/api/src/modules/cashier/cashier-billing-extension.test.ts
npx jest apps/api/src/modules/cashier/cashier-billing-integration.test.ts

# 离线/状态机测试
npx jest apps/api/src/modules/cashier/cashier-offline.test.ts
npx jest apps/api/src/modules/cashier/offline-sync.test.ts
npx jest apps/api/src/modules/cashier/order-state-machine.test.ts
```
