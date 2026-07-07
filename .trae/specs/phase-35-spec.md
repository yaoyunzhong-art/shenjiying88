# Phase-35 Spec: 收银台业务模块

> **状态**: 🟡 规划中
> **估时**: 3 天 (8 task × 4-6h)
> **作者**: 🦞 openclaw
> **签收**: 🧑‍✈️ 大飞哥 (待)
> **依赖**: Phase-25~34 (P0 全部 ✓)

---

## 1. 业务目标

神机营 SaaS 的**收银台**模块: 支持多租户创建订单 → 发起支付 → 收款确认 → 退款/对账。

**核心场景**:
- 商家 A 收银员创建订单 (选商品 → 计算金额 → 选支付方式)
- 顾客扫码/刷卡完成支付
- 系统异步确认 → 订单状态推进 → 库存扣减 → 通知商家
- 退款流程 (整单/部分) + 对账报表

**P0 复用**:
- 多租户: Phase-31 TenantGuard + Phase-34 ViewModel
- 实时推送: Phase-32 SSE EventBuffer
- 持久化: Phase-33 EventStore
- 三层防御: RLS + Service + Provider

---

## 2. 领域模型

### 2.1 实体 (5 个)

```typescript
/** 订单主单 */
Order {
  id: string                    // ORD-YYYYMMDD-XXXXX
  tenantId: string              // 多租户
  memberId?: string             // 可选 (散客 = null)
  items: OrderItem[]            // 商品行
  subtotalCents: number         // 商品小计 (分)
  discountCents: number         // 优惠
  taxCents: number              // 税
  totalCents: number            // 应付
  paidCents: number             // 已付
  status: OrderStatus           // 见 §2.2 状态机
  paymentMethod?: PaymentMethod // CASH / WECHAT / ALIPAY / CARD
  createdBy: string             // 收银员 userId
  createdAt: string
  paidAt?: string
  closedAt?: string             // 关闭 (超时/取消)
  metadata: Record<string, unknown>
}

/** 订单行 */
OrderItem {
  productId: string
  productName: string           // 冗余 (商品改名不影响历史订单)
  unitPriceCents: number
  quantity: number
  subtotalCents: number         // unitPriceCents × quantity
  discountCents: number
}

/** 支付记录 */
Payment {
  id: string                    // PAY-YYYYMMDD-XXXXX
  tenantId: string
  orderId: string
  method: PaymentMethod
  amountCents: number
  status: PaymentStatus         // PENDING / SUCCESS / FAILED / REFUNDED
  providerTxnId?: string        // 微信/支付宝流水号
  paidAt?: string
  failureReason?: string
  idempotencyKey: string        // 防重 key (见 DR-36)
}

/** 退款记录 */
Refund {
  id: string                    // RFD-YYYYMMDD-XXXXX
  tenantId: string
  orderId: string
  paymentId: string
  amountCents: number           // 退款金额
  reason: string
  status: RefundStatus          // PENDING / SUCCESS / FAILED
  providerRefundId?: string
  refundedAt?: string
  idempotencyKey: string
}

/** 商品 (P0 已经在 domain 有 Product, 这里只引用) */
Product { id, name, priceCents, stock, ... }
```

### 2.2 状态机 (DR-36 核心)

**Order 状态机**:
```
        ┌──────────────┐
        │   DRAFT      │ ← 创建未提交
        └──────┬───────┘
               │ submit()
        ┌──────▼───────┐
        │   PENDING    │ ← 待支付 (15 分钟超时)
        └─┬──────┬─────┘
          │      │ cancel() / timeout
          │      ▼
          │   ┌──────────────┐
          │   │   CANCELED   │
          │   └──────────────┘
          │ pay success
   ┌──────▼───────┐
   │   PAID       │
   └──────┬───────┘
          │ fulfill() (发货/核销)
   ┌──────▼───────┐
   │  FULFILLED   │
   └──────┬───────┘
          │ refund()
   ┌──────▼───────┐
   │  REFUNDED    │ (全部退) / PARTIALLY_REFUNDED (部分退)
   └──────────────┘
```

**Payment 状态机**:
```
PENDING ──► SUCCESS ──► REFUNDED
   │           │
   └──────┐    └──► FAILED
          ▼
       (终态)
```

**Refund 状态机**:
```
PENDING ──► SUCCESS
   │           │
   └──────┐    └──► FAILED
          ▼
       (终态)
```

### 2.3 幂等性 (DR-36 关键)

| 操作 | Idempotency Key | 重复请求处理 |
|------|----------------|-------------|
| 创建订单 | `clientOrderId` (前端 UUID) | 同 key 返回同 order |
| 发起支付 | `orderId + method` | 同 (orderId, method) 返回同 payment |
| 支付回调 | `providerTxnId` | 已 SUCCESS 直接 ack |
| 退款 | `orderId + amount + reason-hash` | 同 key 拒绝重发 |

---

## 3. 架构 (沿用 P0 三层防御)

```
┌─────────────────────────────────────────────────┐
│  Frontend (Web/POS/PDA)                          │
│  ├─ CashierProvider (tenant + cashier)           │
│  └─ OrderForm / PaymentForm / RefundForm         │
└────────────────────┬────────────────────────────┘
                     │ REST + SSE
┌────────────────────▼────────────────────────────┐
│  NestJS API                                       │
│  ├─ TenantGuard (Phase-31)                       │
│  ├─ CashierController (新)                       │
│  ├─ ViewModelService (Phase-34)                  │
│  ├─ OrderService     (新, 状态机)                │
│  ├─ PaymentService   (新, 幂等)                  │
│  ├─ RefundService    (新, 幂等)                  │
│  ├─ ProductService   (Phase-25, 复用)            │
│  ├─ EventBuffer      (Phase-32, 订单事件流)      │
│  └─ EventStore       (Phase-33, 持久化)          │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│  PostgreSQL                                       │
│  ├─ orders / order_items (新)                    │
│  ├─ payments (新)                                │
│  ├─ refunds (新)                                 │
│  ├─ RLS Policies (Phase-34 模板复用)             │
│  └─ audit_log (Phase-34 复用)                    │
└─────────────────────────────────────────────────┘
```

---

## 4. API 设计 (REST)

| Method | Path | 说明 |
|--------|------|------|
| `POST` | `/orders` | 创建订单 (草稿) |
| `POST` | `/orders/:id/submit` | 提交订单 (DRAFT → PENDING) |
| `POST` | `/orders/:id/cancel` | 取消订单 |
| `GET` | `/orders/:id` | 查询订单 |
| `GET` | `/orders` | 列表 (按 tenantId + 时间范围) |
| `GET` | `/orders/:id/stream` | SSE 订单事件流 (Phase-32 复用) |
| `POST` | `/orders/:id/payments` | 发起支付 |
| `POST` | `/payments/:id/callback` | 支付回调 (webhook) |
| `POST` | `/orders/:id/refunds` | 申请退款 |
| `GET` | `/refunds/:id` | 查询退款 |

---

## 5. 数据流 (支付成功)

```
1. 收银员 POST /orders          → OrderService.create()
2. 收银员 POST /orders/:id/submit → OrderService.submit() → status PENDING
3. 顾客扫码 → POST /orders/:id/payments { method: WECHAT }
   → PaymentService.create() → idempotencyKey = (orderId, method)
   → status PENDING, emit OrderEvent 'payment_pending'
4. 微信回调 → POST /payments/:id/callback { txnId, status: SUCCESS }
   → PaymentService.confirm(txnId) → status SUCCESS
   → OrderService.markPaid(orderId, amount)
   → Order.status PAID, paidAt=now
   → emit OrderEvent 'order_paid'
   → 推送 SSE 给收银台 → 自动打印小票
5. 库存扣减 (ProductService.decrementStock)
6. 商家发货/核销 → POST /orders/:id/fulfill
   → status FULFILLED
```

---

## 6. 退款流程

```
1. 商家 POST /orders/:id/refunds { amount, reason }
   → RefundService.create() → idempotencyKey
   → status PENDING
2. 调微信退款 API → 成功 → status SUCCESS
3. 同步更新 Order: paidCents -= amount
   ├─ 全部退 → status REFUNDED
   └─ 部分退 → status PARTIALLY_REFUNDED
4. emit OrderEvent 'order_refunded'
```

---

## 7. 超时处理

- 订单 PENDING 15 分钟未支付 → 定时扫描 → status CANCELED
- 库存回滚 (释放 ProductService reservedStock)
- emit OrderEvent 'order_timeout'

---

## 8. 与 P0 集成点

| P0 能力 | Phase-35 复用方式 |
|---------|------------------|
| Phase-31 TenantGuard | 全部 controller 路由 |
| Phase-32 EventBuffer | OrderEvent 走 SSE 推送 |
| Phase-33 EventStore | OrderEvent 异步持久化 |
| Phase-34 ViewModel | 订单/支付/退款统一入口 |
| Phase-34 RLS | orders/payments/refunds 表 4 个 policy |
| Phase-34 Audit | 跨租户访问 + 状态异常切换 全部审计 |

---

## 9. 验收标准 (AC)

- [ ] 5 个实体 (Order/OrderItem/Payment/Refund + Product 引用) 全部有 type
- [ ] 3 个状态机实现, 非法转移抛 400
- [ ] 4 个幂等键全部生效, 重复请求不重复扣款/扣库存
- [ ] RLS 4 policy 全部生效, 跨租户访问 403
- [ ] SSE 订单事件流推送 PAID/REFUNDED 等关键事件
- [ ] 退款流程: 部分退 + 全部退 + 异常重试
- [ ] 单元/E2E 测试覆盖 ≥ 60 断言
- [ ] 0 fail, atomic commit 锁定

---

## 10. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 微信/支付宝回调超时 | 订单长期 PENDING | webhook 重试 + 定时主动 query |
| 库存超卖 | 商家损失 | Product.version 乐观锁 |
| 金额精度 | 财务对账错 | 全程整数分 (cents) |
| 退款超付 | 财务损失 | Refund.amount ≤ Order.paidCents - refundedCents |
| 时区错乱 | 报表错 | 全 UTC 存储 + 展示时转本地 |

---

## 11. 不在 Phase-35 范围

- 营销/优惠券/积分 (Phase-38)
- 财务报表 (Phase-39)
- 微信/支付宝真实对接 (Phase-45) — 本 phase 只做 mock
- 库存预警/补货 (Phase-46)
- 多门店/跨店核销 (Phase-47)

---

## 12. 下一步

🦞 openclaw 出 DR-36 (状态机/幂等性/并发决策) → 5 专家评审
→ 树哥trae 出 phase-35-tasks.md → 启动 T158
