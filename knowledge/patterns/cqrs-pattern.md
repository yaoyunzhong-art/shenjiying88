# Pattern · CQRS (Command Query Responsibility Segregation)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 复杂查询 / 报表 / 数据分析
> 来源: Phase-15+ 业务 (订单查询 vs 业务命令分离)

---

## 1. 🎯 问题

传统 CRUD 模型中,读和写共享同一 model:
- ❌ 报表查询复杂,拖慢业务
- ❌ 写操作要兼顾读 schema,字段冗余
- ❌ 性能优化困难 (索引/物化视图 影响写入)

CQRS = **读写分离**:命令(写)和查询(读)走不同路径。

---

## 2. 🏗️ 架构

```
                  ┌──────────────┐
   Write ────→    │ Command Side │ ──→  Event Bus ──→ ┌──────────────┐
                  │  (Normalize) │                   │ Query Side   │
                  └──────────────┘                   │ (Denormalize)│ ──→ Read
                                                     └──────────────┘
```

| 维度 | Command Side | Query Side |
|---|---|---|
| 用途 | 写操作 (Create/Update/Delete) | 读操作 (Search/Report) |
| Schema | 范式化 (3NF) | 反范式 (预聚合) |
| 存储 | PostgreSQL 主库 | PostgreSQL 副本 / ClickHouse / ElasticSearch |
| 一致性 | 强一致 | 最终一致 (异步同步) |
| 优化 | 索引 / 约束 | 物化视图 / 列存 |

---

## 3. 📐 神机营订单 CQRS 实现

### 3.1 Command Side (写)

```typescript
// apps/api/src/modules/order/order.command.service.ts
@Injectable()
export class OrderCommandService {
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    // 1. 业务校验
    await this.validateOrder(dto)

    // 2. 保存 (范式化 schema)
    const order = await this.orderRepo.save({
      tenantId: dto.tenantId,
      memberId: dto.memberId,
      status: 'pending',
      totalAmount: dto.totalAmount,
      // 详细 items 在另一张表 (order_items)
    })

    // 3. 发事件 → Query Side 同步
    await this.eventBus.emit('OrderCreated', {
      tenantId: order.tenantId,
      orderId: order.id,
      memberId: order.memberId,
      totalAmount: order.totalAmount,
      timestamp: order.createdAt.toISOString(),
    })

    return order
  }
}
```

### 3.2 Query Side (读)

```typescript
// apps/api/src/modules/order/order.query.service.ts
@Injectable()
export class OrderQueryService {
  async getOrderDetail(orderId: string): Promise<OrderDetailDto> {
    // 1. 查 Read Model (反范式, 1 次查询搞定)
    const view = await this.orderViewRepo.findOne({
      where: { orderId },
      // orderView 含: order + member + items + coupon + points + store
    })
    if (!view) throw new NotFoundException()

    return this.toDto(view)
  }

  async getMemberOrderHistory(memberId: string, options: {
    page: number
    pageSize: number
    status?: string[]
    dateFrom?: Date
    dateTo?: Date
  }): Promise<PaginatedOrders> {
    // 复杂查询直接查 ES (Phase-22 接入)
    return await this.esClient.search({
      index: 'orders',
      body: {
        query: {
          bool: {
            must: [
              { term: { memberId } },
              options.status ? { terms: { status: options.status } } : { match_all: {} },
              { range: { createdAt: { gte: options.dateFrom, lte: options.dateTo } } },
            ],
          },
        },
        from: options.page * options.pageSize,
        size: options.pageSize,
      },
    })
  }
}
```

### 3.3 Read Model 同步 (Event Handler)

```typescript
// apps/api/src/modules/order/order.view-sync.worker.ts
@OnEvent('OrderCreated')
async onOrderCreated(event: OrderCreatedEvent) {
  // 同步到 Read Model (反范式)
  const view = this.orderViewRepo.create({
    orderId: event.orderId,
    tenantId: event.tenantId,
    memberId: event.memberId,
    totalAmount: event.totalAmount,
    // 预聚合字段 (便于查询)
    memberName: await this.getMemberName(event.memberId),
    storeName: await this.getStoreName(event.storeId),
    itemCount: event.items.length,
  })
  await this.orderViewRepo.save(view)
}
```

---

## 4. ✅ 适用场景

- ✅ 报表 / 数据分析 (复杂聚合查询)
- ✅ 全文搜索 (订单详情/会员搜索)
- ✅ 多维度查询 (按时间/状态/金额/地区)
- ✅ 高频读 / 低频写

**不适用**:
- ❌ 简单 CRUD (< 10 张表的小应用)
- ❌ 强一致需求 (实时余额查询)
- ❌ 团队 < 3 人 (维护成本高)

---

## 5. ⚠️ 已知问题

| 问题 | 缓解 |
|---|---|
| Read Model 同步延迟 | 最终一致 SLA 文档化 (e.g. < 5s) |
| 双倍存储 | Read Model 只放查询必需字段 |
| 事件丢失导致 read 缺失 | Outbox pattern (Phase-22) |
| 团队协作复杂 | 明确读写边界 (different team) |

---

## 6. 🔗 关联

- [event-driven-architecture.md](./event-driven-architecture.md) · 事件驱动 (CQRS 同步)
- [outbox-pattern.md](./outbox-pattern.md) · Outbox (解决事件丢失)
- [saga-pattern.md](./saga-pattern.md) · Saga (CQRS 命令侧)
