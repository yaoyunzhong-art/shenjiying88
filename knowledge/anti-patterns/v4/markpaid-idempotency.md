# Anti-Pattern v4 · markpaid-idempotency (markPaid 非幂等导致重复支付)

> 创建日期: 2026-06-27
> 来源: Phase-35 收银订单 markPaid 流程 + 财务对账债务 P0
> 危害等级: 🔴 **极高** (资金损失 + 客户投诉)
> 关联: R-02 测试 Layer 1 + R-04 复盘 + R-06 反模式库 v4

---

## 错误表现

```typescript
// ❌ 错误 1: 无幂等保护
async function markPaid(orderId: string) {
  const order = await db.orders.findOne({ id: orderId });
  if (order.status !== 'PENDING') {
    return; // ❌ 这里直接返回,不记录,网络重试时不知道是否成功
  }
  order.status = 'PAID';
  order.paidAt = new Date();
  await db.orders.save(order); // ❌ 重复调用会覆盖 paidAt
}

// ❌ 错误 2: 用 clientOrderId 但不校验唯一
async function markPaid(orderId: string, clientOrderId: string) {
  await db.orders.update(orderId, { status: 'PAID' });
  // ❌ clientOrderId 仅用于幂等键但代码没用
}

// ❌ 错误 3: 并发竞争
async function markPaid(orderId: string) {
  const order = await db.orders.findOne({ id: orderId });
  if (order.status === 'PENDING') {
    // ❌ 两个并发请求都通过 check,然后都执行 update
    await db.orders.update(orderId, { status: 'PAID' });
    await ledger.record(orderId); // ❌ 重复记账!
  }
}
```

## 为什么错

1. **网络重试不可控**: 客户端超时重发,服务端不知道是否成功
2. **并发竞争**: 多个支付回调同时到达
3. **幂等键未使用**: clientOrderId 形同虚设
4. **状态检查非原子**: check + update 不是原子操作

## 正确做法 1: 数据库幂等键 (UNIQUE 约束)

```sql
-- 迁移: 添加幂等键唯一约束
ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(64) UNIQUE;

-- 调用: 客户端生成 clientOrderId,服务端写入幂等键
INSERT INTO orders (id, client_order_id, status, amount)
VALUES (?, ?, 'PENDING', ?)
ON CONFLICT (client_order_id) DO NOTHING; -- 重复插入直接忽略

UPDATE orders SET status='PAID', paid_at=NOW()
WHERE id = ? AND status = 'PENDING'; -- ✅ 原子更新
```

## 正确做法 2: Redis 分布式锁 + 状态机

```typescript
async function markPaid(orderId: string, idempotencyKey: string) {
  // 1. Redis 幂等键 (SET NX EX)
  const locked = await redis.set(`paid:${idempotencyKey}`, '1', 'NX', 'EX', 300);
  if (!locked) {
    return { success: true, idempotent: true }; // 重复请求,直接返回
  }

  // 2. 分布式锁 (避免并发)
  const lock = await redlock.acquire([`order:${orderId}`], 5000);
  try {
    // 3. 原子 CAS 更新 (compare-and-swap)
    const result = await db.query(`
      UPDATE orders
      SET status='PAID', paid_at=NOW(), idempotency_key=?
      WHERE id=? AND status='PENDING'
      RETURNING *
    `, [idempotencyKey, orderId]);

    if (result.rowCount === 0) {
      throw new Error('Order not in PENDING status');
    }

    // 4. 记账 (放在同一事务)
    await ledger.record(orderId, 'PAID');

    return { success: true, order: result.rows[0] };
  } finally {
    await lock.release();
  }
}
```

## 正确做法 3: 幂等响应缓存

```typescript
// 第一次调用: 执行 + 缓存响应
// 重试调用: 直接返回缓存响应
const cacheKey = `paid:response:${idempotencyKey}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await markPaid(orderId, idempotencyKey);
await redis.setex(cacheKey, 86400, JSON.stringify(result)); // 24h 缓存
return result;
```

## 测试要点 (R-02 三层测试)

### Layer 1 (程序员) 单元测试
```typescript
test('markPaid idempotent: same key called twice → only one PAID', async () => {
  const order = await createOrder({ amount: 100 });
  const key = `idem-${order.id}`;

  const r1 = await markPaid(order.id, key);
  const r2 = await markPaid(order.id, key); // 重试

  expect(r1.status).toBe('PAID');
  expect(r2.idempotent).toBe(true);
  expect(r2.status).toBe('PAID');

  // 验证 ledger 只记一次
  const ledgerEntries = await ledger.find({ orderId: order.id });
  expect(ledgerEntries).toHaveLength(1);
});
```

### Layer 2 (产品) 集成测试
- 模拟 100 并发 markPaid 同 orderId → 只有 1 个 PAID,99 个 idempotent
- 模拟支付回调网络重试 5 次 → 只有 1 个 PAID

### Layer 3 (使用者) 走查
- 收银员: 断网后重试支付 → 订单只支付一次,无重复扣款
- 财务: 日结对账 → 无重复入账

## 监控告警 (R-07 KPI)

- **重复支付率**: 应 < 0.01% (告警阈值 0.1%)
- **幂等键命中率**: 应 > 5% (说明重试机制有效)
- **ledger 平衡**: 日结对账 100% (借 = 贷)

## 关联债务

- debt P0-001: @m5/api hang → 支付回调处理失败风险
- Phase-35 收银订单 markPaid 必须实现幂等

## 关联专家

- E10 郑财务 (风控) · E13 李收银 (流程) · E36 卫审计 (核对)

## 关联文档

- [patterns/idempotency-pattern.md](../patterns/idempotency-pattern.md) — 幂等性通用模式
- [best-practices/error-handling.md](../best-practices/error-handling.md)