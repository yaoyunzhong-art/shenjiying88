# Best Practice · Performance Optimization (性能优化规范)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🟡 P1
> 来源: 神机营 P95 < 200ms 目标 + Phase-15+

---

## 1. 🎯 目标

API 响应时间:
- ✅ P50 < 50ms
- ✅ P95 < 200ms
- ✅ P99 < 500ms

数据库查询:
- ✅ 简单查询 < 10ms
- ✅ 复杂查询 < 100ms
- ✅ 无 N+1

---

## 2. 📐 数据库优化

### 2.1 索引设计

```sql
-- ✅ 复合索引 (高频查询)
CREATE INDEX idx_member_tenant_status ON members (tenant_id, status, created_at DESC);

-- ✅ 部分索引 (节省空间)
CREATE INDEX idx_active_members ON members (tenant_id) WHERE status = 'active';

-- ✅ 表达式索引 (函数索引)
CREATE INDEX idx_member_email_lower ON members (LOWER(email));

-- ❌ 反例: 索引过多 (写入慢)
CREATE INDEX idx1 ON members (a);
CREATE INDEX idx2 ON members (b);
CREATE INDEX idx3 ON members (c);
-- 每个 INSERT 都更新所有索引
```

### 2.2 查询优化

```typescript
// ❌ N+1 查询
const orders = await this.orderRepo.find()
for (const order of orders) {
  order.member = await this.memberRepo.findOne(order.memberId)  // N 次查询!
}

// ✅ 批量查询 (JOIN / eager loading)
const orders = await this.orderRepo.find({
  relations: ['member', 'items'],
})

// ✅ 分页 (避免 OFFSET 性能差)
const orders = await this.orderRepo
  .createQueryBuilder('o')
  .where('o.tenantId = :tid', { tid: tenantId })
  .andWhere('o.id > :cursor', { cursor: lastId })  // 游标分页
  .orderBy('o.id', 'ASC')
  .limit(20)
  .getMany()
```

### 2.3 慢查询监控

```typescript
// 启用 TypeORM query logging
TypeOrmModule.forRoot({
  logging: ['error', 'warn', 'migration'],
  logger: 'advanced-console',
  maxQueryExecutionTime: 100,  // > 100ms 记录为慢查询
})
```

---

## 3. 📐 缓存优化

```typescript
// ✅ 多级缓存
// L1: 内存 (Map, LRU, 进程内, ns 级)
// L2: Redis (跨进程, ms 级)
// L3: DB (最终一致, 10ms 级)

@Injectable()
export class MultiLevelCache {
  private l1Cache = new LRUCache<string, any>({ max: 1000, ttl: 60_000 })  // L1 1 min
  private l2Cache = new Redis(...)

  async get<T>(key: string, loader: () => Promise<T>): Promise<T> {
    // L1
    const l1 = this.l1Cache.get(key)
    if (l1) return l1 as T

    // L2
    const l2 = await this.l2Cache.get(key)
    if (l2) {
      this.l1Cache.set(key, JSON.parse(l2))
      return JSON.parse(l2) as T
    }

    // L3 (DB)
    const fresh = await loader()
    await this.l2Cache.setex(key, 300, JSON.stringify(fresh))
    this.l1Cache.set(key, fresh)
    return fresh
  }
}
```

---

## 4. 📐 异步化

```typescript
// ❌ 同步等待 3 个独立操作
const order = await orderService.create()
const coupon = await couponService.grant()
const notification = await notificationService.send()
// 总耗时: T1 + T2 + T3

// ✅ Promise.all 并发
const [order, coupon, notification] = await Promise.all([
  orderService.create(),
  couponService.grant(),
  notificationService.send(),
])
// 总耗时: max(T1, T2, T3)
```

---

## 5. 📐 响应压缩

```typescript
// main.ts 启用 gzip
import * as compression from 'compression'
app.use(compression({
  filter: (req, res) => req.headers['accept-encoding']?.includes('gzip'),
  threshold: 1024,  // > 1KB 才压缩
  level: 6,
}))
```

---

## 6. 📐 连接池

```typescript
// TypeORM 连接池配置
TypeOrmModule.forRoot({
  type: 'postgres',
  // ...
  extra: {
    max: 20,                  // 最大连接
    min: 5,                   // 最小连接
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  },
})
```

---

## 7. ✅ 必须遵守

- [ ] 慢查询监控 (> 100ms 告警)
- [ ] 索引覆盖高频查询
- [ ] 无 N+1 查询
- [ ] 关键数据多级缓存
- [ ] 独立操作并发执行
- [ ] 响应 > 1KB 启用 gzip
- [ ] 连接池配置合理

---

## 8. 🔗 关联

- [cache-aside-pattern.md](../patterns/cache-aside-pattern.md) · 缓存
- [throttling-pattern.md](../patterns/throttling-pattern.md) · 限流保护
- [monitoring-observability.md](./monitoring-observability.md) · 监控
