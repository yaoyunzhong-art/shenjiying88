# DR-36: Phase-35 订单状态机 + 支付幂等性 + 并发控制

> **决策日期**: 2026-06-27
> **决策者**: 🦞 openclaw (后台)
> **评审**: 5 专家 (待)
> **关联**: phase-35-spec.md
> **影响**: Phase-35 全部 task, 后续 Phase-36/37/38 都将沿用

---

## 决策 1: 订单状态机 — 显式状态字段 + 非法转移抛 400

### 背景
订单有 8 个状态 (DRAFT/PENDING/PAID/FULFILLED/CANCELED/REFUNDED/PARTIALLY_REFUNDED/TIMEOUT),需要一个明确的状态机实现。

### 候选方案

| 方案 | 优点 | 缺点 | 评级 |
|------|------|------|------|
| **A. if-else 嵌套** | 简单 | 难维护, 易漏转移 | ❌ |
| **B. 状态转移表 + Map** | 集中管理, 易扩展 | 需多写一层 | ✅ (选) |
| **C. XState 库** | 可视化, 工业级 | 引入新依赖, 学习成本 | ❌ (过度) |
| **D. 事件溯源** | 完美审计 | 复杂度过高 | ❌ (P3) |

### 决定
**选 B**: 状态转移表 + Map

```typescript
// 允许的转移
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['PENDING', 'CANCELED'],
  PENDING: ['PAID', 'CANCELED'],  // 取消由超时或用户
  PAID: ['FULFILLED', 'PARTIALLY_REFUNDED', 'REFUNDED'],
  FULFILLED: ['PARTIALLY_REFUNDED', 'REFUNDED'],
  PARTIALLY_REFUNDED: ['PARTIALLY_REFUNDED', 'REFUNDED'],
  REFUNDED: [],  // 终态
  CANCELED: [],  // 终态
}

function transition(order: Order, target: OrderStatus) {
  const allowed = ORDER_TRANSITIONS[order.status]
  if (!allowed.includes(target)) {
    throw new BadRequestException({
      error: 'invalid_state_transition',
      from: order.status,
      to: target
    })
  }
  order.status = target
}
```

### 反模式
- ❌ 直接修改 `order.status = 'PAID'` (无校验)
- ❌ 状态名硬编码字符串散落各处
- ✅ 统一 OrderStatus enum + 集中转移表

---

## 决策 2: 幂等性 — clientOrderId (创建) + providerTxnId (回调) + (orderId+method) (支付)

### 背景
- 顾客点支付按钮可能因网络抖重点击 → 重复扣款
- 微信/支付宝回调可能重发 3-5 次 → 重复处理
- 商家点退款按钮可能重复 → 重复退款

### 候选方案

| 方案 | 适用场景 | 评价 |
|------|---------|------|
| **A. 业务键唯一索引** | 订单号/流水号 | ✅ (选) |
| **B. Redis 分布式锁** | 高频短时操作 | ⚠️ (重) |
| **C. 数据库行锁 SELECT FOR UPDATE** | 状态切换 | ✅ (并发) |
| **D. 客户端 UUID + 服务端去重表** | 跨系统 | ✅ (创建订单) |

### 决定 (组合方案)

| 操作 | 幂等键 | 存储 |
|------|--------|------|
| 创建订单 | `clientOrderId` (前端 UUID) | UNIQUE (tenantId, clientOrderId) |
| 发起支付 | `(orderId, paymentMethod)` | UNIQUE (orderId, method) where status != FAILED |
| 支付回调 | `providerTxnId` | UNIQUE (providerTxnId) |
| 退款 | `(orderId, amount, reasonHash)` | UNIQUE (orderId, amount, reasonHash) |

```sql
-- 创建订单幂等
ALTER TABLE orders ADD CONSTRAINT uniq_tenant_client_order 
  UNIQUE (tenant_id, client_order_id);

-- 支付幂等 (同一订单同方式只能一笔 PENDING/SUCCESS)
CREATE UNIQUE INDEX uniq_payment_order_method 
  ON payments(order_id, method) 
  WHERE status IN ('PENDING', 'SUCCESS');
```

### 反模式
- ❌ 信任前端不重复请求 (网络不可信)
- ❌ 微信回调时只判断 status, 不判 providerTxnId (回调重发场景)
- ✅ 所有写操作前置幂等键校验

---

## 决策 3: 并发控制 — 乐观锁 (version 字段) + SELECT FOR UPDATE (状态切换)

### 背景
两个收银员同时改同一订单, 两个支付回调并发到达, 库存超卖

### 候选方案

| 方案 | 场景 | 评价 |
|------|------|------|
| **A. 悲观锁 (SELECT FOR UPDATE)** | 状态切换 | ✅ (强一致) |
| **B. 乐观锁 (version 字段)** | 订单编辑 | ✅ (低冲突) |
| **C. 分布式锁 (Redis)** | 跨实例 | ⚠️ (重) |
| **D. 无锁** | - | ❌ (必出 bug) |

### 决定 (组合)

```typescript
// 订单编辑: 乐观锁
async updateOrder(id: string, patch: Partial<Order>, version: number) {
  const result = await db.query(
    `UPDATE orders SET ... , version = version + 1 
     WHERE id = ? AND version = ?`,
    [id, version]
  )
  if (result.affectedRows === 0) {
    throw new ConflictException('order_version_conflict')
  }
}

// 状态切换: 悲观锁 (避免 ABA)
async transitionStatus(id: string, target: OrderStatus) {
  return db.transaction(async (tx) => {
    const [order] = await tx.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [id])
    transition(order, target)  // 状态机校验
    await tx.query(`UPDATE orders SET status = ? WHERE id = ?`, [target, id])
  })
}

// 库存扣减: 乐观锁 + 条件更新
async decrementStock(productId: string, qty: number) {
  const result = await db.query(
    `UPDATE products SET stock = stock - ?, version = version + 1
     WHERE id = ? AND stock >= ? AND version = ?`,
    [qty, productId, qty, currentVersion]
  )
  if (result.affectedRows === 0) {
    throw new ConflictException('insufficient_stock_or_version_conflict')
  }
}
```

### 反模式
- ❌ 状态切换用乐观锁 (容易 ABA: 状态机无法验证中间过程)
- ❌ 库存扣减用悲观锁 (并发差, 不必要)
- ✅ 状态切换悲观锁, 库存乐观锁, 订单编辑乐观锁

---

## 决策 4: 金额 — 全部用整数分 (cents), 绝不用浮点

### 背景
0.1 + 0.2 = 0.30000000000000004 (IEEE 754), 财务对账绝对禁止

### 决定
```typescript
// ❌ 禁止
const total = 9.99 * 3  // 29.97 (可能 = 29.970000000000002)

// ✅ 强制
const totalCents = 999 * 3  // 2997 (整数)
```

- 全部字段 `*Cents` 后缀
- 序列化时除 100 显示
- 数据库列 `BIGINT NOT NULL`

### 反模式
- ❌ `total: number` 浮点字段
- ❌ `decimal(10, 2)` 数据库类型 (JS 仍会转浮点)
- ✅ 整数分 + 后缀命名

---

## 决策 5: 支付回调 — 异步确认 + 主动 query 双保险

### 背景
微信/支付宝回调可能丢失 (网络/服务重启), 用户已支付但订单仍 PENDING

### 决定
```
1. PaymentService.createPayment() → status PENDING, scheduledCheckAt = now + 5min
2. 微信回调到达 → confirm(txnId) → status SUCCESS
3. 兜底: 定时任务每 60s 扫 PENDING 且 scheduledCheckAt < now 的 payment
   → 调微信 query API → 如已支付则 confirm, 如未支付则延长 scheduledCheckAt
4. 15 分钟仍 PENDING → 取消订单
```

### 反模式
- ❌ 只信回调 (会丢)
- ❌ 只信主动 query (会被限流)
- ✅ 双保险, 回调优先, query 兜底

---

## 决策 6: 退款 — 部分退 + 全部退 + 防超付

### 决定
```typescript
async createRefund(orderId: string, amount: number, reason: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.query(`SELECT * FROM orders WHERE id = ? FOR UPDATE`, [orderId])
    
    const refundedCents = await tx.query(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total FROM refunds 
       WHERE order_id = ? AND status = 'SUCCESS'`, [orderId]
    )
    const availableCents = order.paidCents - refundedCents.total
    
    if (amount > availableCents) {
      throw new BadRequestException({
        error: 'refund_exceeds_paid',
        available: availableCents,
        requested: amount
      })
    }
    
    // 创建退款 + 调微信
    const refund = await createRefundRecord(orderId, amount, reason)
    await callWechatRefund(refund)
    return refund
  })
}
```

### 反模式
- ❌ 信任前端传入的金额 (无服务端校验)
- ❌ 不锁订单直接退款 (并发会超付)
- ✅ 事务 + 行锁 + availableCents 校验

---

## 决策 7: 订单号 — ORD-YYYYMMDD-XXXXX (日期前缀 + 5 位序列)

### 决定
```typescript
function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const seq = (counter++ % 100000).toString().padStart(5, '0')
  return `ORD-${date}-${seq}`
}
```

类似: `PAY-YYYYMMDD-XXXXX` / `RFD-YYYYMMDD-XXXXX`

### 反模式
- ❌ UUID (不可读, 财务对账痛苦)
- ❌ 自增 INT (泄漏业务量, 多租户冲突)
- ✅ 日期前缀 + 序列 (人类可读 + 租户内唯一 + 排序)

---

## 决策 8: 收银台 SSE 事件 — 复用 Phase-32 EventBuffer

### 决定
- OrderEvent 类型: `order_created` / `order_submitted` / `payment_pending` / `order_paid` / `order_fulfilled` / `order_refunded` / `order_timeout` / `order_canceled`
- 走 EventBuffer → 收银台页面订阅 → 自动刷新
- 关键事件: `order_paid` / `order_refunded` (触发票据打印)

### 反模式
- ❌ 收银员手动刷新 (体验差)
- ❌ 轮询 /orders/:id (浪费)
- ✅ SSE 推送, 收银员无感知

---

## 决策 9: RLS — orders/payments/refunds 全部启用, 复用 Phase-34 模板

### 决定
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_select ON orders FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));
-- INSERT/UPDATE/DELETE 同模式

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- 4 个 policy

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
-- 4 个 policy
```

### 反模式
- ❌ 在应用层只校验 orderId, 忽略子表 (Payment/Refund 跨租户风险)
- ✅ 子表全部 RLS, 父表+子表联合查询自动过滤

---

## 决策 10: 微信/支付宝 — Phase-35 用 Mock, 真实对接推迟到 Phase-45

### 背景
- 真实对接需要商户号/证书/沙箱 (申请周期 1-2 周)
- Phase-35 优先跑通业务逻辑

### 决定
```typescript
// interface WechatPayGateway {
//   createPrepay(order): Promise<{ prepayId, codeUrl }>
//   query(txnId): Promise<{ status, ... }>
//   refund(refund): Promise<{ refundId, status }>
// }

// Mock 实现
class MockWechatPay implements WechatPayGateway {
  async createPrepay(order) { 
    return { prepayId: 'mock_prepay_' + order.id, codeUrl: 'weixin://wxpay/...' }
  }
  // 立即返回 SUCCESS
  async callback(orderId) { return { status: 'SUCCESS' } }
}
```

- Phase-45 替换为真实 SDK (只需换实现, 接口不变)
- E2E 用 mock 跑通全流程

### 反模式
- ❌ 现在就接真实支付 (阻塞 Phase-35 完成)
- ❌ 跳过支付直接做订单 (不能验证集成)
- ✅ Mock 跑通 + 真实接口预留, Phase-45 切换

---

## 总结 (10 个决策)

| # | 主题 | 决定 |
|---|------|------|
| 1 | 状态机 | 转移表 + Map + 非法转移 400 |
| 2 | 幂等性 | 业务键 + UNIQUE 索引 (4 类) |
| 3 | 并发 | 状态切换悲观锁, 编辑/库存乐观锁 |
| 4 | 金额 | 整数分 + 后缀命名, 绝不用浮点 |
| 5 | 支付回调 | 异步确认 + 主动 query 双保险 |
| 6 | 退款 | 事务 + 行锁 + availableCents 防超付 |
| 7 | 订单号 | ORD-YYYYMMDD-XXXXX 日期+序列 |
| 8 | SSE 推送 | 复用 Phase-32 EventBuffer |
| 9 | RLS | orders/payments/refunds 全部启用 |
| 10 | 微信支付 | Mock 实现, 真实对接 Phase-45 |

---

> 🦞 openclaw 待 5 专家评审, 大飞哥签收后启动 T158+
