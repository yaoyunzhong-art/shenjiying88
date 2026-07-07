# Anti-Pattern · N+1 Query (N+1 查询)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 严重度: 🔴 P0
> 来源: Phase-15+ 列表性能问题

---

## 1. 🚨 反模式

循环中逐条查询数据库:
```typescript
const orders = await db.query('SELECT * FROM orders WHERE tenant_id = ?', [tid])  // 1 次
for (const order of orders) {
  order.member = await db.query('SELECT * FROM members WHERE id = ?', [order.memberId])  // N 次
}
// 总查询: 1 + N 次 → 100 订单 = 101 次查询
```

---

## 2. ❌ 反例

```typescript
// ❌ 反例 1: 循环内 query
async findOrdersWithMember(tenantId: string) {
  const orders = await this.orderRepo.find({ where: { tenantId } })
  for (const order of orders) {
    order.member = await this.memberRepo.findOne(order.memberId)  // N+1!
  }
  return orders
}

// ❌ 反例 2: lazy load
@Entity()
export class Order {
  @ManyToOne(() => Member)
  member: Member  // 访问 .member 时才查 DB
}
// orders.forEach(o => o.member.name) → N+1
```

---

## 3. ✅ 正确做法

### 3.1 方案 1: JOIN / eager loading

```typescript
// ✅ TypeORM relations
const orders = await this.orderRepo.find({
  where: { tenantId },
  relations: ['member', 'items', 'coupon'],  // 一次性 JOIN
})
// 总查询: 1 次 (或多 N 次,但远好于 N+1)
```

### 3.2 方案 2: 批量 IN 查询

```typescript
// ✅ 批量 IN
async findOrdersWithMember(tenantId: string) {
  const orders = await this.orderRepo.find({ where: { tenantId } })
  const memberIds = [...new Set(orders.map(o => o.memberId))]

  // 一次查所有 member
  const members = await this.memberRepo.find({
    where: { id: In(memberIds) }
  })
  const memberMap = new Map(members.map(m => [m.id, m]))

  // 内存中组装
  return orders.map(o => ({ ...o, member: memberMap.get(o.memberId) }))
}
// 总查询: 2 次
```

### 3.3 方案 3: QueryBuilder

```typescript
// ✅ QueryBuilder (复杂查询)
const orders = await this.orderRepo
  .createQueryBuilder('o')
  .leftJoinAndSelect('o.member', 'm')
  .leftJoinAndSelect('o.items', 'i')
  .where('o.tenantId = :tid', { tid: tenantId })
  .getMany()
```

---

## 4. 📐 监控 + 检测

```typescript
// 启用 TypeORM query logging
TypeOrmModule.forRoot({
  logging: 'all',  // 打印所有 SQL
  maxQueryExecutionTime: 50,  // 慢查询阈值
})

// 监控: 单请求查询数
@Injectable()
export class QueryCountInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const startCount = this.queryCounter.get()
    return next.handle().pipe(
      tap(() => {
        const queries = this.queryCounter.get() - startCount
        if (queries > 10) {
          this.logger.warn(`[N+1?] ${ctx.getClass().name}.${ctx.getHandler().name} executed ${queries} queries`)
        }
      })
    )
  }
}
```

---

## 5. ✅ 必须遵守

- [ ] 列表接口禁用 lazy load
- [ ] 列表查询用 JOIN / relations / 批量 IN
- [ ] 单请求查询数 ≤ 10
- [ ] 慢查询监控 (> 50ms 告警)
- [ ] Code Review 必查循环内 query

---

## 6. 🔗 关联

- [performance-optimization.md](../best-practices/performance-optimization.md) · 性能
- [monitoring-observability.md](../best-practices/monitoring-observability.md) · 监控
