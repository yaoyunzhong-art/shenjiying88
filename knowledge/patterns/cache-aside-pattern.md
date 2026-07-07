# Pattern · Cache-Aside (旁路缓存模式)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 高频读 / 数据变化不频繁
> 来源: 神机营会员 / 商品 / 优惠券查询

---

## 1. 🎯 问题

数据库查询慢:
- ❌ 复杂 join (多表关联)
- ❌ 聚合查询 (count / sum)
- ❌ 高并发 (DB 连接耗尽)

Cache-Aside = **应用层控制缓存读写**,DB 是 source of truth。

---

## 2. ✅ 标准流程

```
读取:
1. 先查缓存
2. 命中 → 返回
3. 未命中 → 查 DB
4. 写入缓存 (TTL)
5. 返回数据

写入:
1. 更新 DB
2. 删除缓存 (而非更新!)
```

---

## 3. 📐 神机营实现

```typescript
// apps/api/src/common/cache-aside.ts
export interface CacheAsideOptions {
  ttlSeconds: number
  keyPrefix: string
  serialize?: (value: any) => string
  deserialize?: (text: string) => any
}

@Injectable()
export class CacheAsideService {
  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async get<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheAsideOptions,
  ): Promise<T> {
    const fullKey = `${options.keyPrefix}:${key}`

    // 1. 查缓存
    const cached = await this.redis.get(fullKey)
    if (cached) {
      try {
        return options.deserialize?.(cached) ?? JSON.parse(cached)
      } catch (err) {
        this.logger.warn(`[CacheAside] deserialize failed for ${fullKey}`, err as Error)
        // fallthrough 查 DB
      }
    }

    // 2. 查 DB
    const fresh = await loader()
    if (fresh === null || fresh === undefined) {
      return fresh  // 不缓存空值
    }

    // 3. 写入缓存
    const text = options.serialize?.(fresh) ?? JSON.stringify(fresh)
    await this.redis.setex(fullKey, options.ttlSeconds, text)

    return fresh
  }

  /**
   * 删除缓存 (写操作后调用)
   */
  async invalidate(key: string, options: CacheAsideOptions): Promise<void> {
    const fullKey = `${options.keyPrefix}:${key}`
    await this.redis.del(fullKey)
  }

  /**
   * 按 pattern 删除 (谨慎使用, SCAN 性能差)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let cursor = '0'
    let deleted = 0
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = next
      if (keys.length > 0) {
        await this.redis.del(...keys)
        deleted += keys.length
      }
    } while (cursor !== '0')
    return deleted
  }
}
```

---

## 4. 📐 业务使用 (会员查询)

```typescript
// apps/api/src/modules/member/member.service.ts
@Injectable()
export class MemberService {
  private readonly CACHE_OPTIONS: CacheAsideOptions = {
    ttlSeconds: 300,        // 5 分钟
    keyPrefix: 'cache:tenant',  // 隔离多租户
  }

  async findById(tenantId: string, memberId: string): Promise<Member | null> {
    // tenantId 必含在 cache key 中 (跨租户隔离)
    return await this.cacheAside.get(
      `${tenantId}:member:${memberId}`,  // cache key
      () => this.memberRepo.findOne({ where: { id: memberId, tenantId } }),  // loader
      this.CACHE_OPTIONS,
    )
  }

  async update(dto: UpdateMemberDto): Promise<Member> {
    const member = await this.memberRepo.save({ ... })
    // 写操作 → 失效缓存
    await this.cacheAside.invalidate(
      `${member.tenantId}:member:${member.id}`,
      this.CACHE_OPTIONS,
    )
    return member
  }
}
```

---

## 5. ⚠️ 3 大陷阱

### 5.1 缓存击穿 (热点 key 失效)

**问题**: 热点 key 过期瞬间,大量请求打 DB
**解决**: 分布式锁 + single flight

```typescript
async getWithSingleFlight<T>(key: string, loader: () => Promise<T>): Promise<T> {
  // 1. 查缓存
  const cached = await this.redis.get(key)
  if (cached) return JSON.parse(cached)

  // 2. 分布式锁 (只让一个请求去 DB)
  const lockKey = `${key}:lock`
  const acquired = await this.redis.set(lockKey, '1', 'EX', 5, 'NX')
  if (!acquired) {
    // 其他请求正在加载 → 等待 + 重试
    await new Promise(r => setTimeout(r, 100))
    return this.getWithSingleFlight(key, loader)
  }

  try {
    // 3. 加载 + 写入
    const fresh = await loader()
    await this.redis.setex(key, 300, JSON.stringify(fresh))
    return fresh
  } finally {
    await this.redis.del(lockKey)
  }
}
```

### 5.2 缓存雪崩 (大量 key 同时失效)

**问题**: TTL 相同 → 大量 key 同时过期 → DB 雪崩
**解决**: TTL 加随机抖动

```typescript
const ttl = 300 + Math.floor(Math.random() * 60)  // 300-360s 随机
await this.redis.setex(key, ttl, JSON.stringify(fresh))
```

### 5.3 缓存穿透 (查询不存在数据)

**问题**: 攻击者故意查不存在 key → 每次都打 DB
**解决**: 空值缓存

```typescript
const cached = await this.redis.get(key)
if (cached === '__NULL__') return null  // 空值标记
if (cached) return JSON.parse(cached)

const fresh = await loader()
if (fresh === null) {
  await this.redis.setex(key, 60, '__NULL__')  // 短 TTL 缓存空值
}
return fresh
```

---

## 6. ✅ 必须遵守

- [ ] Cache key 必须含 tenantId (跨租户隔离)
- [ ] TTL 必须有随机抖动 (防雪崩)
- [ ] 写操作 → 失效缓存 (而非更新)
- [ ] 热点 key → 分布式锁 (防击穿)
- [ ] 空值 → 短 TTL 缓存 (防穿透)

---

## 7. 📊 监控

```typescript
metrics.counter('cache.get', { hit: 'true' | 'false' })
metrics.histogram('cache.get.duration_ms')

// 命中率 = hits / (hits + misses)
// 告警: 命中率 < 80% → P3 (缓存配置问题)
```

---

## 8. 🔗 关联

- [multi-tenant-isolation.md](../best-practices/multi-tenant-isolation.md) · cache key 隔离
- [idempotency-pattern.md](./idempotency-pattern.md) · 缓存幂等
