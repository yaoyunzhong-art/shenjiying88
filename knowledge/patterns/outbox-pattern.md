# Pattern · Outbox (可靠事件发布模式)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 事件驱动 + Saga + CQRS (任何需要可靠事件投递的场景)
> 来源: knowledge/patterns/event-driven-architecture.md + CQRS 同步问题

---

## 1. 🎯 问题

传统事件发布:
```typescript
// ❌ 反模式: 事务 + 事件发布分离
async createOrder(dto) {
  await this.orderRepo.save(order)        // 事务提交
  await this.eventBus.emit('OrderCreated', event)  // 可能失败!
}
```

**问题**:
- 事务已提交但事件发布失败 → 事件丢失
- 事件已发布但事务回滚 → 幽灵事件

Outbox 模式 = **事务内写 outbox 表,后台 worker 异步读取并发布**。

---

## 2. ✅ Outbox 实现

### 2.1 Schema

```sql
CREATE TABLE outbox (
  id          UUID PRIMARY KEY,
  aggregate   VARCHAR(50) NOT NULL,   -- 'order' / 'coupon' / ...
  aggregateId VARCHAR(50) NOT NULL,   -- entity id
  eventType   VARCHAR(100) NOT NULL,
  payload     JSONB NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending/published/failed
  attempts    INT NOT NULL DEFAULT 0,
  createdAt   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  publishedAt TIMESTAMPTZ,
  error       TEXT
);

CREATE INDEX idx_outbox_pending ON outbox (status, createdAt) WHERE status = 'pending';
```

### 2.2 Service 内 (事务内写 outbox)

```typescript
@Injectable()
export class OrderCommandService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return await this.ds.transaction(async (manager) => {
      // 1. 保存订单
      const order = manager.create(Order, { ...dto, status: 'pending' })
      await manager.save(order)

      // 2. 写 outbox (同事务!)
      const outboxEvent = manager.create(Outbox, {
        aggregate: 'order',
        aggregateId: order.id,
        eventType: 'OrderCreated',
        payload: { tenantId: order.tenantId, orderId: order.id, ... },
        status: 'pending',
      })
      await manager.save(outboxEvent)

      return order
    })
    // 事务提交 → order + outbox 原子写入
  }
}
```

### 2.3 Worker (异步发布)

```typescript
// apps/api/src/workers/outbox.worker.ts
@Processor('outbox-relay')
export class OutboxRelayWorker {
  @Cron('*/1 * * * *')  // 每分钟扫描
  async relayPending() {
    const pending = await this.outboxRepo.find({
      where: { status: 'pending', attempts: LessThan(5) },
      order: { createdAt: 'ASC' },
      take: 100,
    })

    for (const event of pending) {
      try {
        // 1. 发布到 EventBus / MQ
        await this.eventBus.emit(event.eventType, event.payload)

        // 2. 标记已发布
        event.status = 'published'
        event.publishedAt = new Date()
        await this.outboxRepo.save(event)

        this.logger.log(`[Outbox] published ${event.eventType} ${event.id}`)
      } catch (err) {
        // 3. 失败计数 + 留待重试
        event.attempts++
        event.error = (err as Error).message
        if (event.attempts >= 5) event.status = 'failed'
        await this.outboxRepo.save(event)
      }
    }
  }
}
```

---

## 3. ✅ 必须遵守

- [ ] Outbox 写入必须与业务事务同事务
- [ ] Worker 异步读取 + 幂等发布
- [ ] 失败重试 (最多 5 次) + 死信队列
- [ ] Outbox 表清理策略 (已发布事件保留 7 天后归档)
- [ ] 监控: pending 堆积数 / 发布延迟 / 失败率

---

## 4. 📊 监控

```typescript
metrics.gauge('outbox.pending_count', pendingCount)
metrics.histogram('outbox.publish_delay_ms', Date.now() - event.createdAt)
metrics.counter('outbox.published', { event_type: event.eventType })
metrics.counter('outbox.failed', { event_type: event.eventType })

// 告警
// - outbox pending > 1000 → P2 告警 (worker 慢)
// - outbox publish_delay P95 > 30s → P1 告警
// - outbox failed > 0 → P0 告警
```

---

## 5. 🔗 关联

- [event-driven-architecture.md](./event-driven-architecture.md) · 事件驱动
- [saga-pattern.md](./saga-pattern.md) · Saga (Outbox 适合 Saga 命令侧)
- [cqrs-pattern.md](./cqrs-pattern.md) · CQRS (Outbox 同步 Read Model)
