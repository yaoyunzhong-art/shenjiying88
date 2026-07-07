# Node.js 并发安全反模式 v4

## 元信息
- **编号**: AP-W11 (Anti-Pattern Watch #11)
- **分类**: 并发 / 竞态条件
- **发现**: 2026-06-27 Phase-35 收银台 + Phase-36 跨租户设计
- **影响**: 数据竞争 / 重复扣减 / 超卖
- **修复耗时**: DR-36 决策 3 乐观锁 + MemberTenantMapping upsert

---

## 现象描述

神机营 SaaS 在以下场景容易触发并发问题:

1. **库存超卖**: 多用户同时下单,库存扣减负数
2. **重复扣款**: 同一订单回调 2 次,扣款 2 次
3. **积分错乱**: 多个会员同时消费,积分计算错误
4. **跨租户串数据**: 不同租户请求并发处理时混淆

---

## 根因分析

### 1. 共享状态无锁

```typescript
// ❌ 反例 (无锁)
class StockService {
  private stocks = new Map<string, number>()
  
  deduct(productId: string, qty: number): void {
    const current = this.stocks.get(productId) ?? 0
    this.stocks.set(productId, current - qty)  // 竞态
  }
}

// 调用方
Promise.all([
  service.deduct('sku-1', 5),  // 当前 10
  service.deduct('sku-1', 5),  // 当前 10 (并发读到同样值)
  service.deduct('sku-1', 5)   // 当前 10
])
// 结果: 库存 = 5 (期望 0)
```

### 2. 非原子操作

```typescript
// ❌ 反例 (读 + 改分离)
const order = await orderRepo.findById(orderId)
if (order.status === 'PAID') return  // check
await paymentService.refund(orderId)   // act
order.status = 'REFUNDED'              // 两次操作中间可被打断
await orderRepo.save(order)
```

### 3. 数据库无乐观锁

```sql
-- ❌ 反例
UPDATE stock SET quantity = quantity - 5 WHERE product_id = 'sku-1';
-- 没有 WHERE quantity >= 5,可能变负数
```

---

## 数学证明 · 并发错误率

设:
- `N` = 并发请求数
- `Δt` = 操作耗时 (ms)
- `P(冲突)` = 同时访问共享资源概率

在 Node.js 单线程事件循环下,P(冲突) 主要来自:
- IO 等待期间的事件插入
- Promise.all 并行
- 数据库事务间隙

```
P(冲突) ≈ N × Δt / 1000  (粗估)
```

N=10, Δt=50ms → P ≈ 50% 冲突率。

---

## 修复方案 (R-06 V2 · DR-36)

### 方案 1: 乐观锁 (DR-36 决策 3)

```typescript
// ✅ 推荐 (DR-36 决策 3)
interface Order {
  version: number
}

async updateWithVersion(id: string, version: number, patch: Partial<Order>): Promise<Order> {
  const order = await this.getById(id)
  if (order.version !== version) {
    throw new BadRequestException({
      error: 'order_version_conflict',
      current: order.version,
      provided: version
    })
  }
  // SQL: UPDATE ... WHERE id = ? AND version = ?
  const updated = await this.prisma.order.update({
    where: { id, version },
    data: { ...patch, version: version + 1 }
  })
  return updated
}
```

✅ 优点: 不阻塞,性能好
❌ 缺点: 冲突时需重试

### 方案 2: 数据库悲观锁

```sql
-- ✅ 适合高冲突场景
BEGIN;
SELECT quantity FROM stock WHERE product_id = 'sku-1' FOR UPDATE;
-- 锁住这一行,其他事务等待
UPDATE stock SET quantity = quantity - 5 WHERE product_id = 'sku-1';
COMMIT;
```

✅ 优点: 强一致
❌ 缺点: 阻塞,性能差

### 方案 3: 事件队列串行化

```typescript
// ✅ 适合单租户内串行
class OrderQueue {
  private queues = new Map<string, Promise<void>>()
  
  async enqueue(orderId: string, work: () => Promise<void>): Promise<void> {
    const prev = this.queues.get(orderId) ?? Promise.resolve()
    const next = prev.catch(() => {}).then(work)
    this.queues.set(orderId, next)
    return next
  }
}
```

✅ 优点: 保证顺序
❌ 缺点: 复杂度高

### 方案 4: 幂等键 + upsert

```typescript
// ✅ 推荐 (Phase-36 T166-3)
await this.prisma.memberTenantMapping.upsert({
  where: { userId_tenantId: { userId, tenantId } },
  update: { lastVisitAt: new Date(), visitCount: { increment: 1 } },
  create: { userId, tenantId, brandId, storeId, ... }
})
```

✅ 优点: 自动处理并发
❌ 缺点: 仅适合创建/累加

---

## 预防机制 (R-07 V2)

### 1. 关键资源必须乐观锁

- ✅ 订单状态变更
- ✅ 库存扣减
- ✅ 积分操作
- ✅ 退款操作

### 2. 共享状态用 upsert

```typescript
// 检查模式
const exists = await prisma.x.findUnique({ where: { id } })
if (exists) {
  await prisma.x.update({ ... })
} else {
  await prisma.x.create({ ... })
}
// 改为
await prisma.x.upsert({ where: { id }, update: {}, create: {} })
```

### 3. 状态机必须事务化

```typescript
// ✅ 状态机 + 乐观锁组合
await prisma.$transaction(async (tx) => {
  const order = await tx.order.findUnique({ where: { id } })
  transitionOrder(order.status, 'PAID')  // 抛 400 if 非法
  await tx.order.update({
    where: { id, version: order.version },
    data: { status: 'PAID', version: { increment: 1 } }
  })
})
```

### 4. 单元测试覆盖并发场景

```typescript
test('并发扣库存不超卖', async () => {
  const svc = new StockService()
  await svc.init({ 'sku-1': 10 })
  
  await Promise.all([
    svc.deduct('sku-1', 5),
    svc.deduct('sku-1', 5),
    svc.deduct('sku-1', 5)
  ])
  
  const stock = await svc.get('sku-1')
  assert.ok(stock >= 0)  // 不超卖
  // 期望: stock = -5 (超卖) 或 stock = 5 (拒绝 2 次)
  // 实际: 根据实现策略
})
```

---

## 经验教训

> 🦞 **"Node.js 单线程 ≠ 无并发"**

1. **IO 异步 = 真实并发**: 等待数据库时其他请求插入
2. **Promise.all = 真实并发**: 同时发起多个操作
3. **数据库事务**: 默认 READ COMMITTED,需显式锁
4. **测试要并发**: 单线程测试通过 ≠ 并发安全

---

## 相关反模式

- [markpaid-idempotency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/markpaid-idempotency.md): 幂等键
- [residual-pending-state.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/residual-pending-state.md): 状态机闭合
- [cron-wipe-phase34.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/cron-wipe-phase34.md): R-06 防御

---

> 🦞 **"无锁 = 无序"**