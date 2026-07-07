# Pattern · Idempotency (幂等性模式)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 支付 / 优惠券核销 / 事件处理 / 任何有副作用的 API
> 来源: knowledge/patterns/saga-pattern.md (Saga 幂等) + Phase-17 coupon

---

## 1. 🎯 问题

网络不可靠 + 重试 + 事件重放 → 同一个请求可能被处理多次,导致:
- ❌ 重复扣款
- ❌ 重复发券
- ❌ 重复扣减库存
- ❌ 重复创建订单

幂等性 = **同一请求执行 N 次 = 执行 1 次**。

---

## 2. ✅ 三种实现策略

### 2.1 策略 1: Idempotency-Key (推荐)

```typescript
// Client 端生成幂等键 (UUID)
const idempotencyKey = crypto.randomUUID()

const response = await fetch('/api/coupon/redeem', {
  method: 'POST',
  headers: { 'Idempotency-Key': idempotencyKey },
  body: JSON.stringify({ couponCode: 'COUPON1' }),
})

// Server 端存储 idempotencyKey → response
// 重复请求 (同 key) → 直接返回缓存的 response,不执行
```

### 2.2 策略 2: 唯一索引

```typescript
// 数据库 unique constraint
@Entity()
@Index(['tenantId', 'orderId'], { unique: true })  // 复合唯一
export class CouponRedemption {
  @Column() tenantId: string
  @Column() orderId: string
  @Column() couponCode: string
}

// 重复 insert → 抛 IntegrityConstraintViolationException
// Service 捕获 → 查询已存在记录 → 返回
```

### 2.3 策略 3: 状态机检查

```typescript
// 服务内部检查当前状态,转移后跳过
async redeemCoupon(orderId: string) {
  const redemption = await this.findByOrderId(orderId)
  if (redemption?.status === 'completed') return redemption  // 已处理,跳过
  if (redemption?.status === 'in_progress') throw new ConflictException('processing')

  // 执行核销
  return await this.doRedeem(redemption)
}
```

---

## 3. 📐 神机营 Coupon 幂等实现

```typescript
// apps/api/src/modules/coupon/coupon-redemption-log.entity.ts
@Entity()
export class CouponRedemptionLog {
  @PrimaryGeneratedColumn('uuid') id: string

  @Index({ unique: true })  // 全局唯一
  @Column() idempotencyKey: string  // 客户端生成

  @Column() tenantId: string
  @Column() couponCode: string
  @Column() orderId: string

  @Column() discountAmount: number
  @Column() status: 'pending' | 'completed' | 'failed' | 'rolled_back'
  @Column() completedAt: Date

  @CreateDateColumn() createdAt: Date
  @UpdateDateColumn() updatedAt: Date
}

// Service: 三重幂等保护
async redeemCrossStore(params: RedeemParams): Promise<RedemptionResult> {
  // 1. Idempotency-Key 检查 (最快)
  const existing = await this.redemptionRepo.findOne({
    where: { idempotencyKey: params.idempotencyKey }
  })
  if (existing?.status === 'completed') {
    return this.toResult(existing)  // 重复请求直接返回
  }

  // 2. 业务唯一性检查
  const byOrder = await this.redemptionRepo.findOne({
    where: { orderId: params.orderId, status: 'completed' }
  })
  if (byOrder) {
    return this.toResult(byOrder)
  }

  // 3. 事务 + 唯一索引保护
  return await this.dataSource.transaction(async (manager) => {
    const redemption = manager.create(CouponRedemptionLog, {
      idempotencyKey: params.idempotencyKey,
      status: 'pending',
      // ...
    })
    await manager.save(redemption)  // unique 约束防止并发重复

    // 业务逻辑 (事务内)
    // ...
    redemption.status = 'completed'
    redemption.completedAt = new Date()
    await manager.save(redemption)

    return this.toResult(redemption)
  })
}
```

---

## 4. 📐 事件处理幂等 (Saga)

```typescript
// Saga worker 必须幂等
@OnEvent('OrderCreated')
async onOrderCreated(event: SagaOrderEvent) {
  if (event.type !== 'OrderCreated') return

  // 检查 eventId 是否已处理
  const processed = await this.processedEventRepo.findOne({
    where: { eventId: event.eventId }
  })
  if (processed) return  // 已处理,跳过

  // 业务处理
  await this.doWork(event)

  // 记录已处理
  await this.processedEventRepo.save({
    eventId: event.eventId,
    processedAt: new Date(),
  })
}
```

---

## 5. ✅ 必须遵守

- [ ] 所有 POST API 接收 `Idempotency-Key` header
- [ ] 所有事件处理函数检查 `eventId` 幂等
- [ ] 所有唯一索引覆盖业务关键字段 (tenantId + orderId)
- [ ] 幂等键 TTL ≥ 24h (防止 24h 内重放)
- [ ] 幂等存储失败时 fail-safe (抛错而非放行)

---

## 6. ❌ 反模式

- ❌ "先扣款,失败回滚" (扣款 2 次)
- ❌ 无 idempotency key (依赖客户端不重试)
- ❌ 用时间戳去重 (并发不可靠)
- ❌ 用随机数去重 (可能冲突)

---

## 7. 🔗 关联

- [saga-pattern.md](./saga-pattern.md) · Saga 幂等要求
- [event-driven-architecture.md](./event-driven-architecture.md) · 事件幂等
