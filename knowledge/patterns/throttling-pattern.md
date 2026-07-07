# Pattern · Throttling (限流模式)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: API 网关 / LLM Provider / 任何远程调用
> 来源: Phase-19 ai-review (LLM 速率控制) + multi-tenant 配额

---

## 1. 🎯 问题

防止系统过载:
- ❌ 防止租户 A 突发流量拖垮全站
- ❌ 防止 LLM Provider 触发 429
- ❌ 防止爬虫 / DDoS

限流 = **在单位时间内允许最多 N 个请求**。

---

## 2. 🏗️ 4 种算法

### 2.1 固定窗口 (Fixed Window)

```typescript
// 每 1 分钟最多 100 次
class FixedWindowRateLimiter {
  private count = 0
  private windowStart = Date.now()

  async acquire(): Promise<boolean> {
    const now = Date.now()
    if (now - this.windowStart >= 60_000) {
      this.windowStart = now
      this.count = 0
    }
    if (this.count >= 100) return false
    this.count++
    return true
  }
}
```

**优点**: 简单
**缺点**: 窗口边界突发 (1:59 100 次 + 2:00 100 次 = 200 次/2s)

### 2.2 滑动窗口 (Sliding Window) ⭐ 推荐

```typescript
class SlidingWindowRateLimiter {
  private timestamps: number[] = []
  constructor(private limit: number, private windowMs: number) {}

  async acquire(): Promise<boolean> {
    const now = Date.now()
    // 清理窗口外的时间戳
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs)
    if (this.timestamps.length >= this.limit) return false
    this.timestamps.push(now)
    return true
  }
}
```

### 2.3 令牌桶 (Token Bucket)

```typescript
class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number

  constructor(
    private capacity: number,      // 桶容量 (e.g. 100)
    private refillRate: number,    // 每秒补充 (e.g. 10/s)
  ) {
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  async acquire(): Promise<boolean> {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now

    if (this.tokens < 1) return false
    this.tokens--
    return true
  }
}
```

### 2.4 漏桶 (Leaky Bucket)

```typescript
class LeakyBucketRateLimiter {
  private queue: Array<{ releaseAt: number }> = []
  constructor(private rate: number) {} // 每秒处理 N 个

  async acquire(): Promise<boolean> {
    const now = Date.now()
    const interval = 1000 / this.rate
    const lastRelease = this.queue[this.queue.length - 1]?.releaseAt ?? now
    const releaseAt = Math.max(now, lastRelease + interval)

    if (releaseAt - now > 5000) return false  // 队列满 → 拒绝
    this.queue.push({ releaseAt })
    return true
  }
}
```

---

## 3. 📐 神机营限流实现 (Redis Sliding Window)

```typescript
// apps/api/src/common/redis-rate-limiter.ts
import Redis from 'ioredis'

@Injectable()
export class RedisRateLimiter {
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  /**
   * Sliding Window via Redis ZSET
   * @param key 限流键 (e.g. `ratelimit:tenant:${tenantId}:api:coupon`)
   * @param limit 时间窗口内最大请求数
   * @param windowMs 时间窗口 (ms)
   */
  async acquire(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean
    remaining: number
    resetAt: number
  }> {
    const now = Date.now()
    const windowStart = now - windowMs
    const member = `${now}-${Math.random()}`

    // Lua 脚本保证原子性
    const lua = `
      redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
      local count = redis.call('ZCARD', KEYS[1])
      if count >= tonumber(ARGV[2]) then
        return { 0, 0 }
      else
        redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4])
        redis.call('EXPIRE', KEYS[1], ARGV[5])
        return { 1, tonumber(ARGV[2]) - count - 1 }
      end
    `
    const [allowed, remaining] = await this.redis.eval(
      lua, 1, key, windowStart, limit, now, member, Math.ceil(windowMs / 1000)
    ) as [number, number]

    return {
      allowed: allowed === 1,
      remaining,
      resetAt: now + windowMs,
    }
  }
}

// NestJS Guard
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly limiter: RedisRateLimiter,
    @Inject('RATE_LIMIT_OPTIONS') private readonly options: RateLimitOptions,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const tenantId = req.user?.tenantId ?? req.ip
    const key = `ratelimit:tenant:${tenantId}:api:${req.route.path}`

    const result = await this.limiter.acquire(key, this.options.limit, this.options.windowMs)

    if (!result.allowed) {
      throw new HttpException({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retryAfter: this.options.windowMs / 1000,
      }, HttpStatus.TOO_MANY_REQUESTS)
    }

    // 设置响应头
    const res = ctx.switchToHttp().getResponse()
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt / 1000))
    return true
  }
}
```

---

## 4. 📊 多维度限流

```typescript
// apps/api/src/common/multi-dim-rate-limiter.ts
export interface RateLimitDimension {
  name: string       // 'tenant' / 'user' / 'ip' / 'api'
  key: string        // 'rate:tenant:A:coupon'
  limit: number      // 100
  windowMs: number   // 60_000
}

@Injectable()
export class MultiDimensionalRateLimiter {
  async acquireAll(dimensions: RateLimitDimension[]): Promise<{
    allowed: boolean
    violatedDimension?: string
  }> {
    for (const dim of dimensions) {
      const r = await this.limiter.acquire(dim.key, dim.limit, dim.windowMs)
      if (!r.allowed) {
        return { allowed: false, violatedDimension: dim.name }
      }
    }
    return { allowed: true }
  }
}

// Controller 使用
@UseGuards(MultiDimRateLimitGuard)
@Post('coupon/redeem')
async redeem(@Body() dto, @Req() req) {
  return await this.couponService.redeem(dto)
}

// Guard 配置 (来自 env / 配置文件)
const dimensions: RateLimitDimension[] = [
  { name: 'tenant', key: `rate:tenant:${req.user.tenantId}:*`, limit: 1000, windowMs: 60_000 },
  { name: 'user', key: `rate:user:${req.user.id}:coupon`, limit: 100, windowMs: 60_000 },
  { name: 'ip', key: `rate:ip:${req.ip}:coupon`, limit: 200, windowMs: 60_000 },
  { name: 'api', key: `rate:api:coupon:redeem`, limit: 5000, windowMs: 60_000 },
]
```

---

## 5. ✅ 必须遵守

- [ ] 限流键含 tenantId (多租户隔离)
- [ ] 限流响应含 `Retry-After` 头
- [ ] 限流 Lua 脚本保证原子性 (Redis)
- [ ] 限流 metrics 上报 (命中率 / 拒绝率)
- [ ] 关键 API 限流 (写操作优先)

---

## 6. ❌ 反模式

- ❌ 同步计数限流 (高并发不安全)
- ❌ 内存 Map 限流 (多实例不一致)
- ❌ 限流键不含租户 (某租户消耗全配额)

---

## 7. 🔗 关联

- [bulkhead-pattern.md](./bulkhead-pattern.md) · 隔板 (限制资源)
- [circuit-breaker.md](./circuit-breaker.md) · 熔断器 (触发后限流)
