# Pattern · Saga (分布式事务模式)

> 创建: 2026-06-26 · Pulse-68 Day 2 后台
> 适用: 跨模块业务 (Order + Coupon + Points + Inventory)
> 来源: Phase-17 cross-store coupon + Phase-15e register + Phase-19 ai-review

---

## 1. 🎯 问题

SaaS 业务常涉及**跨模块事务**,如:

**场景: 用户下单使用跨门店优惠券**
```
1. Order.create()        创建订单
2. Coupon.redeem()       核销优惠券
3. Points.deduct()       扣除用户积分 (满减积分)
4. Inventory.deduct()    扣减库存
5. Notification.send()   发送通知
```

**传统分布式事务 (2PC/3PC) 问题**:
- ❌ 同步阻塞,性能差
- ❌ 协调者单点故障
- ❌ 长时间持有锁
- ❌ 不适合云原生 + 微服务

**Saga 模式优势**:
- ✅ 异步 + 高性能
- ✅ 无锁
- ✅ 适合事件驱动架构
- ✅ 失败时补偿 (Compensating Transaction)

---

## 2. 🏗️ Saga 两种类型

### 2.1 Choreography (编排) - 推荐

```
每个 service 监听上一步事件,完成后发布下一步事件
无中心协调者,完全去中心
```

```
[Order Service]               [Coupon Service]           [Points Service]      [Inventory Service]
       │                             │                          │                       │
       │── OrderCreated ────────────>│                          │                       │
       │                             │── CouponRedeemed ───────>│                       │
       │                             │                          │── PointsDeducted ────>│
       │                             │                          │                       │── InventoryDeducted
       │                             │                          │                       │
       │<────── (所有 success) ──────│<─────────────────────────│<──────────────────────│
       │                             │                          │                       │
       │ 失败: 补偿链 (反向)         │                          │                       │
       │<──── CouponRelease ─────────│                          │                       │
       │<──── OrderCancel ───────────│                          │                       │
```

### 2.2 Orchestration (协调) - 复杂场景

```
中心 Saga Orchestrator 协调所有步骤
适合 ≥5 步的复杂事务
```

```typescript
// 显式编排
class OrderSagaOrchestrator {
  async execute(orderRequest: OrderRequest) {
    const order = await this.orderService.create(orderRequest)

    try {
      const coupon = await this.couponService.redeem(orderRequest.couponCode, order)
      const points = await this.pointsService.deduct(orderRequest.userId, order.amount)
      const inventory = await this.inventoryService.deduct(orderRequest.items)
      return { order, coupon, points, inventory }
    } catch (err) {
      // 补偿
      await this.compensate(order, err)
      throw err
    }
  }

  async compensate(order: Order, err: Error) {
    // 逆序补偿
    if (order.inventoryDeducted) await this.inventoryService.restore(order)
    if (order.pointsDeducted) await this.pointsService.refund(order)
    if (order.couponRedeemed) await this.couponService.release(order)
    await this.orderService.cancel(order)
  }
}
```

---

## 3. 📐 神机营 Saga 实现 (Choreography)

### 3.1 Order Saga 事件链

```typescript
// events/saga-order.events.ts
export type SagaOrderEvent =
  | { type: 'OrderCreated'; data: { orderId: string; tenantId: string; userId: string; amount: number; couponCode?: string; usePoints?: number; items: Array<{ sku: string; quantity: number }> } }
  | { type: 'CouponRedeemed'; data: { orderId: string; couponCode: string; discount: number } }
  | { type: 'PointsDeducted'; data: { orderId: string; userId: string; amount: number } }
  | { type: 'InventoryDeducted'; data: { orderId: string; items: Array<{ sku: string; quantity: number }> } }
  | { type: 'OrderCompleted'; data: { orderId: string } }
  | { type: 'OrderCancelled'; data: { orderId: string; reason: string } }
```

### 3.2 各服务监听

```typescript
// coupon.service.ts (Saga step 2)
@OnEvent('OrderCreated')
async onOrderCreated(event: SagaOrderEvent) {
  if (event.type !== 'OrderCreated') return
  if (!event.data.couponCode) {
    // 无优惠券,直接发下一步事件
    await this.eventBus.emit('CouponRedeemed', { orderId: event.data.orderId, couponCode: '', discount: 0 })
    return
  }

  try {
    const result = await this.redeemCrossStore({
      userId: event.data.userId,
      couponCode: event.data.couponCode,
      storeId: event.data.storeId,  // 需要 storeId 在 OrderCreated 事件中
      orderAmount: event.data.amount,
      orderId: event.data.orderId,
      idempotencyKey: `coupon:${event.data.orderId}`,
    })

    await this.eventBus.emit('CouponRedeemed', {
      orderId: event.data.orderId,
      couponCode: event.data.couponCode,
      discount: result.discountAmount,
    })
  } catch (err) {
    // 失败 → 触发 OrderCancelled
    await this.eventBus.emit('OrderCancelled', {
      orderId: event.data.orderId,
      reason: `Coupon redeem failed: ${(err as Error).message}`,
    })
  }
}
```

### 3.3 补偿 (Compensating Transaction)

```typescript
// coupon.service.ts (补偿)
@OnEvent('OrderCancelled')
async onOrderCancelled(event: SagaOrderEvent) {
  if (event.type !== 'OrderCancelled') return

  // 1. 释放优惠券 (如果已核销)
  const redemption = await this.redemptionLogRepo.findOne({ where: { orderId: event.data.orderId } })
  if (redemption) {
    await this.releaseCoupon(redemption.couponCode, event.data.orderId)
    await this.redemptionLogRepo.delete(redemption.id)
    this.logger.log(`[Saga] released coupon for order ${event.data.orderId}`)
  }
}

// points.service.ts (补偿)
@OnEvent('OrderCancelled')
async onOrderCancelled(event: SagaOrderEvent) {
  if (event.type !== 'OrderCancelled') return
  // 退还积分
  await this.refund(event.data.userId, event.data.amount)
}
```

---

## 4. ✅ 必须遵守原则

### 4.1 每个 step 必须幂等

```typescript
// ✅ 正确: 使用 idempotencyKey
async redeemCrossStore(params: RedeemParams) {
  // 检查是否已核销 (幂等)
  const existing = await this.redemptionLogRepo.findOne({ where: { idempotencyKey: params.idempotencyKey } })
  if (existing) return existing

  // 真实核销
  // ...
}

// ❌ 错误: 无幂等,事件重放导致重复扣款
async redeemCrossStore(params: RedeemParams) {
  await this.couponRepo.update(...)  // 重放会多次扣款!
}
```

### 4.2 补偿必须可靠

```typescript
// ✅ 正确: 补偿写入死信队列,确保一定执行
@OnEvent('OrderCancelled')
async onOrderCancelled(event) {
  try {
    await this.releaseCoupon(...)
  } catch (err) {
    // 补偿失败 → 死信队列,人工介入
    await this.dlq.add('release-coupon-failed', { event, error: err.message })
  }
}

// ❌ 错误: 补偿失败抛错导致 OrderCancelled 处理失败
async onOrderCancelled(event) {
  await this.releaseCoupon(...)  // 失败抛错,可能影响其他 listener
}
```

### 4.3 Saga 超时必须设置

```typescript
// ✅ 正确: Saga 整体超时 (e.g. 5 分钟未完成 → 自动取消)
@Cron('*/1 * * * *')  // 每分钟检查
async checkStuckSagas() {
  const stuck = await this.sagaRepo.find({
    where: { status: 'InProgress', createdAt: LessThan(Date.now() - 5 * 60_000) },
  })
  for (const saga of stuck) {
    await this.eventBus.emit('OrderCancelled', {
      orderId: saga.orderId,
      reason: 'Saga timeout (5min)',
    })
  }
}
```

### 4.4 Tenant 隔离必须传递

```typescript
// ✅ 正确: tenantId 在事件顶层
interface SagaOrderEvent {
  type: string
  tenantId: string  // 顶层
  data: { orderId: string }
}

// ❌ 错误: tenantId 埋在 data 中
interface BadEvent {
  type: string
  data: { tenantId: string; orderId: string }  // 深层,易遗漏
}
```

---

## 5. 🧪 测试策略

### 5.1 单元测试 (各 step)

```typescript
describe('CouponService.onOrderCreated', () => {
  it('正常核销后发出 CouponRedeemed 事件', async () => {
    await service.onOrderCreated({ type: 'OrderCreated', data: {...} })
    expect(eventBus.emit).toHaveBeenCalledWith('CouponRedeemed', {...})
  })

  it('核销失败后发出 OrderCancelled 事件', async () => {
    jest.spyOn(service, 'redeemCrossStore').mockRejectedValue(new Error('quota exceeded'))
    await service.onOrderCreated({ type: 'OrderCreated', data: {...} })
    expect(eventBus.emit).toHaveBeenCalledWith('OrderCancelled', { reason: expect.stringContaining('quota') })
  })
})
```

### 5.2 集成测试 (完整 Saga)

```typescript
it('完整 Order Saga 成功', async () => {
  const orderId = await orderService.create({...})
  await new Promise(r => setTimeout(r, 1000))  // 等待所有 listener

  const order = await orderRepo.findOne(orderId)
  expect(order.status).toBe('completed')

  // 验证各 step 已完成
  expect(await couponRepo.countRedemptions(orderId)).toBe(1)
  expect(await pointsRepo.countDeductions(orderId)).toBe(1)
  expect(await inventoryRepo.countDeductions(orderId)).toBeGreaterThan(0)
})

it('Coupon 失败触发 Order 取消', async () => {
  // 模拟 coupon 已用完
  await couponService.markExhausted('COUPON1')

  const orderId = await orderService.create({ couponCode: 'COUPON1', ... })
  await new Promise(r => setTimeout(r, 1000))

  const order = await orderRepo.findOne(orderId)
  expect(order.status).toBe('cancelled')
})
```

### 5.3 e2e 测试 (Playwright)

```typescript
test('用户下单使用跨门店优惠券', async ({ page }) => {
  await page.goto('/order/create')
  await page.selectOption('select[name=coupon]', 'COUPON1')
  await page.click('button[type=submit]')

  // 等待 saga 完成 (e2e 可能 5s+)
  await page.waitForSelector('[data-testid=order-completed]', { timeout: 10_000 })
})
```

---

## 6. ⚠️ 已知限制

| 限制 | 缓解 |
|---|---|
| Saga 不提供 ACID 强一致 | 业务最终一致 (1-5s 内) |
| 补偿可能失败 | 死信队列 + 人工介入 |
| 调试复杂 (事件流) | 引入 correlationId + 分布式追踪 |
| 事件重放导致副作用 | 强制幂等 (idempotencyKey) |

---

## 7. 📊 监控

```typescript
// 必须监控的指标
metrics.counter('saga.started', { type: 'order' })
metrics.counter('saga.completed', { type: 'order' })
metrics.counter('saga.compensated', { type: 'order', reason: 'coupon_failed' })
metrics.histogram('saga.duration_ms', { type: 'order' })

// 告警
// - Saga 失败率 > 5% → P1 告警
// - Saga P95 延迟 > 5s → P2 告警
// - 补偿队列堆积 > 100 → P0 告警
```

---

## 8. 🔗 关联文档

- [knowledge/patterns/event-driven-architecture.md](./event-driven-architecture.md) · 事件驱动 (Saga 基础)
- [knowledge/patterns/quota-guard.md](./quota-guard.md) · Quota 守卫
- [knowledge/patterns/reserve-rollback.md](./reserve-rollback.md) · Reserve-Rollback
- [.trae/specs/phase-17-marketing-community/](../../.trae/specs/phase-17-marketing-community/) · Phase-17 实施 Saga

---

> 由 main agent 创建 · Pulse-68 Day 2 后台
> 强制: 跨模块事务必须用 Saga (Phase-17 起强制)
> 评审: Champion (待 R8 通过)
