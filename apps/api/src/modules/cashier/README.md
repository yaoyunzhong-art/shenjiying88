# 收银台模块 (Cashier)

## 模块概述

门店收银台核心能力模块，提供完整的订单-支付-退款生命周期管理。支持多租户隔离、多支付渠道（微信/支付宝/余额）、SSE 实时事件推送、离线同步及商业化计费管理。

## 功能范围

| 功能域 | 说明 |
|--------|------|
| 订单管理 | 创建/提交/取消/履约/查询订单，含订单状态机 |
| 支付处理 | 支付发起、渠道回调、状态更新 |
| 退款处理 | 退款申请、状态查询 |
| POS 会员查询 | 收银台实时会员检索 |
| POS 商品扫码 | 商品扫码查询 |
| SSE 事件流 | 实时订单/支付事件推送，支持 Last-Event-ID 重连 |
| 离线同步 | 离线数据缓存与同步 |
| 商业化计费 | 用量报告/钱包/账单/套餐管理 (admin) |
| 超时自动关单 | 未支付订单超时自动关闭 |

## 边界约束

- ❌ 不处理用户认证/登录（见 auth 模块）
- ❌ 不处理会员管理（见 member 模块）
- ❌ 不处理积分发行与销毁（见 loyalty 模块）
- ❌ 不处理实际资金支付渠道对接（见 gateways/ 下的渠道适配器）
- ❌ 不处理发票/财务记账（见 finance 模块）
- ✅ 聚焦 门店收银 → 订单 → 支付 → 退款 → 事后同步 完整闭环

## 目录结构

```
cashier/
├── cashier.module.ts                        — NestJS 模块（导入 TypeORM/Member/Loyalty/Inventory/Billing）
├── cashier.controller.ts                    — 主控制器（订单/支付/退款/POS/统计）
├── cashier-billing.controller.ts            — 商业化计费 admin 控制器（6 端点）
├── cashier.sse.ts                           — SSE 控制器（3 端点 + replay）
├── cashier.service.ts                       — 核心服务（创建/支付/回调/关单/渠道统计）
├── cashier.entity.ts                        — 类型定义 + 接口合约
├── cashier.dto.ts                           — DTO 定义
├── cashier.events.ts                        — 事件总线（11 类事件 + Subject + EventStore 重放）
├── cashier.contract.ts                      — 接口合约
├── cashier-id.ts                            — 订单号生成器
├── cashier-tenant.ts                        — 租户上下文
├── cashier.seed.ts                          — 种子数据
├── cashier-memory-store.ts                  — 内存存储实现
├── cashier-store.interface.ts               — 存储接口定义
│
├── order.service.ts                         — 订单服务（状态机）
├── payment.service.ts                       — 支付服务（渠道对接）
├── refund.service.ts                        — 退款服务
├── order-state-machine.ts                   — 订单状态机（状态转换规则）
├── cashier-offline.service.ts               — 离线同步服务
├── offline-sync.service.ts                  — 离线同步引擎
│
├── gateways/                                — 支付渠道网关
│   ├── index.ts
│   ├── base-payment-gateway.ts              — 抽象基类
│   ├── alipay-gateway.ts                    — 支付宝网关
│   ├── wechat-pay-gateway.ts                — 微信支付网关
│   └── balance-gateway.ts                   — 余额支付网关
│
├── ports/                                   — 端口适配器
│   ├── payment-channel.port.ts              — 支付通道接口
│   ├── payment-channel.registry.ts          — 多租户通道注册表
│   └── payment-channel.bootstrap.ts         — 启动时注册 Mock 通道
│
├── bridges/                                 — 模块间桥接
│   ├── cashier-lyt-events.ts                — LYT 事件类型定义
│   ├── cashier-to-lyt.bridge.ts             — cashier → LYT 事件桥
│   └── lyt-to-cashier.bridge.ts             — LYT → cashier 事件桥
│
├── cashier-transaction/                     — 事务持久化
├── retry/                                   — 重试策略
└── *.test.ts / *.spec.ts                    — ~37 个测试文件
```

## 核心数据结构

### 订单状态机

```
CashierOrderStatus: CREATED → PENDING_PAYMENT → PAID → FULFILLED
                                       ↓            ↓
                                  CLOSED       CLOSED
```

### 订单 (CashierOrder)

```typescript
interface CashierOrder {
  orderId: string
  orderNo?: string
  tenantContext: RequestTenantContext  // 租户隔离
  memberId: string
  items: CashierOrderItem[]
  currency: string
  totalAmount: number
  couponCode?: string
  status: CashierOrderStatus
  latestPaymentId?: string
}
```

### 支付 (CashierPayment)

```typescript
interface CashierPayment {
  paymentId: string
  orderId: string
  channel: string          // WECHAT | ALIPAY | CARD | CASH
  amount: number
  status: CashierPaymentStatus  // PENDING → SUCCEEDED | FAILED
  qrCodeUrl?: string
}
```

## REST 接口

### CashierController (主收银台)

| 方法 | 路由 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/cashier/orders` | TenantGuard | 创建订单 (草稿) |
| `POST` | `/api/cashier/orders/:id/submit` | TenantGuard | 提交订单 DRAFT→PENDING |
| `POST` | `/api/cashier/orders/:id/cancel` | TenantGuard | 取消订单 |
| `POST` | `/api/cashier/orders/:id/fulfill` | TenantGuard | 履约 PAID→FULFILLED |
| `GET` | `/api/cashier/orders/:id` | TenantGuard | 查询订单 |
| `GET` | `/api/cashier/orders/:id/items` | TenantGuard | 查询订单行 |
| `GET` | `/api/cashier/orders` | TenantGuard | 订单列表 |
| `POST` | `/api/cashier/orders/:id/payments` | TenantGuard | 发起支付 |
| `POST` | `/api/cashier/payments/:id/callback` | TenantGuard | 支付回调 |
| `POST` | `/api/cashier/orders/:id/refunds` | TenantGuard | 申请退款 |
| `GET` | `/api/cashier/refunds/:id` | TenantGuard | 查询退款 |
| `GET` | `/api/cashier/members/lookup` | @Public | POS 会员查询 |
| `GET` | `/api/cashier/products/:sku` | @Public | POS 商品扫码 |
| `GET` | `/api/cashier/products` | @Public | 商品目录 |
| `GET` | `/api/cashier/stats/channels` | TenantGuard | 支付渠道统计 |

### CashierBillingController (商业化计费)

| 方法 | 路由 | 说明 |
|------|------|------|
| `GET` | `/api/cashier/admin/billing/usage` | 本期用量报告 |
| `GET` | `/api/cashier/admin/billing/wallet` | 查钱包余额 |
| `POST` | `/api/cashier/admin/billing/wallet/recharge` | 充值 |
| `GET` | `/api/cashier/admin/billing/bills` | 账单列表 |
| `POST` | `/api/cashier/admin/billing/plan` | 设置/切换套餐 |
| `GET` | `/api/cashier/admin/billing/plan` | 查当前套餐 |

### CashierSseController (SSE 事件流)

| 方法 | 路由 | 说明 |
|------|------|------|
| `SSE` | `/api/cashier/orders/events` | 全订单事件流 |
| `SSE` | `/api/cashier/orders/:orderId/events` | 单订单事件流 |
| `SSE` | `/api/cashier/payments/events` | 支付事件流 |
| `GET` | `/api/cashier/orders/events/replay` | SSE 重连 (Last-Event-ID) |

SSE 事件类型: order.created, order.paid, payment.success, refund.success 等 11 种事件。

## 使用示例

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
  -d '{"channel": "WECHAT"}'
```

### POS 会员查询

```bash
curl "http://localhost:3000/api/cashier/members/lookup?q=13800138002" \
  -H "x-tenant-id: tenant-demo"
```

### 订阅 SSE 事件流

```bash
curl -N http://localhost:3000/api/cashier/orders/events \
  -H "x-tenant-id: tenant-demo"
```

## 依赖关系

| 模块/组件 | 说明 |
|-----------|------|
| `agent/tenant.guard` | 多租户守卫 |
| member 模块 (MemberService) | 会员校验/查询 |
| loyalty 模块 (LoyaltyService) | 积分结算 |
| inventory 模块 (InventoryItemService) | 商品查询 |
| foundation/commercial-billing (BillingWall) | 调用方付费拦截 |
| TypeORM | 订单/支付实体持久化 |
| CacheService (Redis) | 可选缓存层 |

## 持久化策略

```
写入: in-memory Map → Redis(fire-and-forget) → DB(upsert)
读取: in-memory(L1) → Redis(L2) → DB(L3)
Redis/DB 不可用时静默降级，不阻塞主流程
```

## 配置项

| 配置 | 默认值 | 说明 |
|------|--------|------|
| NODE_ENV | development | 影响种子数据加载 |
| DB 连接 | 全局 TypeORM | 实体自动绑定 |
| Redis | 全局 CacheService | cache-aside 可选缓存层 |

## 运行测试

```bash
# 核心服务测试
npx jest apps/api/src/modules/cashier/cashier.service.test.ts
npx jest apps/api/src/modules/cashier/cashier.service.spec.ts
npx jest apps/api/src/modules/cashier/cashier.controller.test.ts
npx jest apps/api/src/modules/cashier/cashier.controller.spec.ts
npx jest apps/api/src/modules/cashier/cashier.e2e.test.ts

# 角色权限测试
npx jest apps/api/src/modules/cashier/cashier.role.test.ts
npx jest apps/api/src/modules/cashier/cashier.role-extended.test.ts

# 计费扩展测试
npx jest apps/api/src/modules/cashier/cashier-billing.e2e.test.ts
npx jest apps/api/src/modules/cashier/cashier-billing-extension.test.ts

# 离线/状态机测试
npx jest apps/api/src/modules/cashier/cashier-offline.test.ts
npx jest apps/api/src/modules/cashier/order-state-machine.test.ts

# 网关联道测试
npx jest apps/api/src/modules/cashier/payment.service.test.ts

# 桥接测试
npx jest apps/api/src/modules/cashier/bridges/cashier-lyt-bridges.test.ts
```
