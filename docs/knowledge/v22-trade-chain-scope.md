# V22 交易主链范围冻结

> 编制日期: 2026-07-20
> 冻结版本: Phase-35 Cashier / Phase-37 Inventory / Phase-17 Stock
> 状态标记: ✅ 已存在 / ⚠️ 存在但需增强 / ❌ 不存在

---

## 唯一业务主线

**POS 收银 → Checkout 下单 → 支付 → 退款**

---

## 入口页面

| 入口 | URL | 状态 | 说明 |
|------|-----|------|------|
| POS 收银台页面 | `admin.sportsant.net` → POS | ⚠️ 需增强 | CashierController 存在 11 个端点，但 Scan/Product lookup 含 Mock fallback，需对接真实库存 |
| 商品选择 | POS 扫码/搜索 → 加入购物车 | ⚠️ 需增强 | `GET /cashier/products/:sku` 有 Mock 回落（SKU-001/002/003），下线 Mock 前需接入真实 ProductService |
| 收银 | 购物车确认 → 创建订单 | ✅ 已存在 | `POST /cashier/orders` + `POST /cashier/orders/:id/submit` |
| 支付 | 订单提交 → 发起支付 | ✅ 已存在 | `POST /cashier/orders/:id/payments` → PaymentGateway |
| 退款 | 订单 → 退款申请 | ✅ 已存在 | `POST /cashier/orders/:id/refunds` → `POST /payment-gateway/refund` |

---

## 核心接口清单

### POS 商品

| 接口 | 路由 | 状态 | 文件位置 | 说明 |
|------|------|------|----------|------|
| 商品列表 | `GET /api/inventory/products` | ✅ 已存在 | `inventory/inventory.controller.ts` | `listProducts()`, 支持 storeId 过滤 ✅ |
| 商品详情 | `GET /api/inventory/products/:productId` | ✅ 已存在 | `inventory/inventory.controller.ts` | `getProduct()` |
| POS 扫码 | `GET /cashier/products/:sku` | ⚠️ 需增强 | `cashier/cashier.controller.ts` | 先查 InventoryItemService → OK，回退 Mock → 需移除 |
| 库存列表 | `GET /stock/items` | ✅ 已存在 | `stock/stock.controller.ts` | `list()`, 支持 storeId+category 过滤 |
| 库存详情 | `GET /stock/items/:id` | ✅ 已存在 | `stock/stock.controller.ts` | `getById()` |
| 分类 | ❌ 不存在 | — | — | 商品分类未独立为 REST 端点。StockItem 有 `category` 字段但无 `/api/categories` 路由 |

### Checkout (收银订单)

| 接口 | 路由 | 状态 | 文件位置 | 说明 |
|------|------|------|----------|------|
| 创建订单 | `POST /cashier/orders` | ✅ 已存在 | `cashier/cashier.controller.ts` | 创建草稿状态订单，tenantId+userId 注入 |
| 提交订单 | `POST /cashier/orders/:id/submit` | ✅ 已存在 | `cashier/cashier.controller.ts` | DRAFT → PENDING 状态迁移 |
| 订单详情 | `GET /cashier/orders/:id` | ✅ 已存在 | `cashier/cashier.controller.ts` | `getById()`, 含跨租户防御 |
| 订单行 | `GET /cashier/orders/:id/items` | ✅ 已存在 | `cashier/cashier.controller.ts` | 返回 OrderItem[] |
| 订单列表 | `GET /cashier/orders` | ✅ 已存在 | `cashier/cashier.controller.ts` | 支持 status/memberId/分页过滤 |
| 取消订单 | `POST /cashier/orders/:id/cancel` | ✅ 已存在 | `cashier/cashier.controller.ts` | PENDING/PAID → CANCELLED |
| 履约确认 | `POST /cashier/orders/:id/fulfill` | ✅ 已存在 | `cashier/cashier.controller.ts` | PAID → FULFILLED |

### Payment (支付)

| 接口 | 路由 | 状态 | 文件位置 | 说明 |
|------|------|------|----------|------|
| 发起支付 | `POST /cashier/orders/:id/payments` | ✅ 已存在 | `cashier/cashier.controller.ts` | 调用 PaymentService 创建 |
| 支付代理 | `POST /payment-gateway/pay` | ⚠️ 需增强 | `payment-gateway/payment-gateway.controller.ts` | 本地化支付代理。Phase-35 用 Mock (付款立即 SUCCESS)，Phase-45 需接入微信/支付宝 |
| 支付回调 | `POST /cashier/payments/:id/callback` | ✅ 已存在 | `cashier/cashier.controller.ts` | Webhook 回调/模拟回调 |
| 支付查询 | `GET /payment-gateway/pay/:id` | ✅ 已存在 | `payment-gateway/payment-gateway.controller.ts` | 查询支付结果 |
| 支付统计 | `GET /cashier/stats/channels` | ⚠️ 需增强 | `cashier/cashier.controller.ts` | 返回 Mock 统计，未接入真实数据源 |

### Refund (退款)

| 接口 | 路由 | 状态 | 文件位置 | 说明 |
|------|------|------|----------|------|
| 申请退款 | `POST /cashier/orders/:id/refunds` | ✅ 已存在 | `cashier/cashier.controller.ts` | 调用 RefundService.create() |
| 发起退款 | `POST /payment-gateway/refund` | ✅ 已存在 | `payment-gateway/payment-gateway.controller.ts` | 退款到原方式; 防超付 (availableCents 校验) |
| 退款查询 | `GET /payment-gateway/refund/:id` | ✅ 已存在 | `payment-gateway/payment-gateway.controller.ts` | 查询退款状态 |
| 退款详情 | `GET /cashier/refunds/:id` | ✅ 已存在 | `cashier/cashier.controller.ts` | 查询退款 |

---

## 状态机

### 订单状态 (order-state-machine.ts)

```
DRAFT → PENDING → PAID → FULFILLED
  │        │
  │        ↓
  ↓    CANCELLED
CANCELLED
```

- `transitionOrder()` — 校验合法性, 非法跳转抛 400
- 决策 1: In-memory (Phase-35) → Postgres (Phase-46)
- 决策 3: 乐观锁 (version 字段)
- 决策 4: 整数分 (cents), 绝不用浮点
- 决策 7: 订单号格式 `ORD-YYYYMMDD-XXXXX`

### 支付状态

```
PENDING → SUCCESS
    ↓
  FAILED
```

- `transitionPayment()` — Mock 网关立即 SUCCESS
- 决策 5: 异步确认 + 主动 query 双保险
- 决策 10: Phase-35 Mock → Phase-45 真实网关

### 退款状态

```
PENDING → SUCCESS
    ↓
  FAILED
```

- `transitionRefund()` — 防超付校验: `availableCents = paidCents - 已退总和`

---

## 成功路径

### 场景: 线下收银 → 支付成功 → 订单完成

```
1. 收银员打开 admin.sportsant.net → POS 收银台
2. 扫码/搜索商品:  GET /cashier/products/:sku
   → 返回 { sku, name, price, category }
3. 确认购物车 → 点击"结算"
4. POST /cashier/orders       → 创建订单草稿 (status=DRAFT)
5. POST /cashier/orders/:id/submit  → 提交订单 (DRAFT→PENDING)
6. 选择支付方式 (微信/支付宝/现金/刷卡)
7. POST /cashier/orders/:id/payments → 创建支付 (status=PENDING)

   [Mock 网关自动确认]
   POST /cashier/payments/:id/callback → 回调触发 (PAYMENT→SUCCESS)

8. 订单自动 PAID
9. POST /cashier/orders/:id/fulfill  → 履约完成 (PAID→FULFILLED)
   (可选: 在门店场景下可由收银员手动点击"完成")
```

---

## 失败路径

### 场景 A: 余额不足 → 支付失败 → 重新支付 / 取消订单

```
1. (同上 1-7) POS 收银 → 提交订单 → 发起支付
2. POST /cashier/payments/:id/callback
   body: { standardizedEventName: "cashier.payment-failed", ... }
   → 支付状态 FAILED
   → 订单保持 PENDING (不自动取消)
3. 用户选择:
   a) 重新支付: 再次 POST /cashier/orders/:id/payments → 新 payment
   b) 取消订单: POST /cashier/orders/:id/cancel → 订单 CANCELLED
      body: { reason: "支付失败后用户放弃" }
```

### 场景 B: 退款

```
1. 进入已支付订单 (status=PAID 或 FULFILLED)
2. 收银员点击"退款"
3. POST /cashier/orders/:id/refunds
   body: { paymentId, amountCents, reason }
   → Refund PENDING
4. POST /payment-gateway/refund ← 网关退款 (mock 立即成功)
   body: { transactionId, amount, reason }
5. Refund → SUCCESS
6. 退款到原支付方式
```

### 场景 C: 库存不足 → 下单失败

```
1. 收银员选择商品
2. POST /cashier/orders → 创建订单成功
3. POST /cashier/orders/:id/submit → 库存校验失败
   → InventoryItemService.reserve() 可用库存不足
   → BadRequestException: "库存不足"
   → 订单状态回退 / 提示收银员
   → 收银员修改数量或取消
```

### 场景 D: 超时取消

```
1. 订单创建后 PENDING 超时 (MOQ: 自定义 TTL, 默认 30min)
2. 系统/定时任务调用 POST /cashier/orders/:id/cancel
   body: { reason: "支付超时自动取消" }
3. 订单 → CANCELLED
```

---

## 核心代码模块速查

| 模块 | 路径 | 功能 |
|------|------|------|
| **cashier** | `apps/api/src/modules/cashier/` | POS 收银台全链路 (Controller/Order/Payment/Refund 服务) |
| **payment-gateway** | `apps/api/src/modules/payment-gateway/` | 支付网关代理 (本地化) |
| **inventory** | `apps/api/src/modules/inventory/` | 商品 CRUD + 库存出入库 |
| **stock** | `apps/api/src/modules/stock/` | 库存管理 (TypeORM) |
| **inventory-item** | `apps/api/src/modules/inventory/inventory-item.service.ts` | 单品库存 与 SKU 预留能力 |

---

## 本周禁止

- ❌ 不开发新活动页
- ❌ 不开发新装修页
- ❌ 不开发非主链运营功能
- ❌ 不开发新实验模块

---

## TODO 遗留项 (Phase-35→Phase-45过渡)

| # | 项 | 优先级 |
|---|-----|--------|
| 1 | 移除 `cashier.controller.ts` 中 Mock 商品回落 (SKU-001/002/003) | P1 |
| 2 | 商品分类独立 REST 端点 `GET /api/categories` | P1 |
| 3 | PaymentService Mock 网关 → 真实微信/支付宝网关 | P0 |
| 4 | 订单超时自动取消定时任务 | P1 |
| 5 | 通道统计接入真实数据源 (撤掉 Mock) | P2 |
| 6 | 库存事务原子化: Redis SETNX+Lua 替代内存锁 | P1 |
| 7 | Postgres 持久化替代 In-memory (Order/Payment/Refund) | P0 |
