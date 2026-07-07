# Pattern · Bulkhead (隔板模式 · 资源隔离)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 多租户隔离 / 多 Provider 隔离 / 慢消费者隔离
> 来源: Phase-19 ai-review (LLM Provider 隔离) + circuit-breaker

---

## 1. 🎯 问题

共享资源池被某个"坏邻居"耗尽,导致全站不可用:
- ❌ 租户 A 大查询占满 DB 连接池 → 所有租户 500
- ❌ Claude API 慢响应占满 HTTP agent → 其他 provider 也卡
- ❌ 慢消费者占满 BullMQ worker → 其他 job 排队

隔板模式 = **将资源池分割,坏邻居只影响自己的池**。

---

## 2. 🏗️ 三种隔板类型

### 2.1 线程池隔板 (Thread Pool Bulkhead)

```typescript
// ✅ 按租户隔离连接池
@Injectable()
export class TenantConnectionPool {
  private readonly pools = new Map<string, Pool>()

  async getPool(tenantId: string): Promise<Pool> {
    if (!this.pools.has(tenantId)) {
      this.pools.set(tenantId, new Pool({
        max: 5,                              // 每租户最多 5 连接
        idleTimeoutMillis: 30_000,
      }))
    }
    return this.pools.get(tenantId)!
  }
}
```

### 2.2 信号量隔板 (Semaphore Bulkhead)

```typescript
// ✅ 并发限制
@Injectable()
export class LLMProviderPool {
  private readonly claudeSemaphore = new Semaphore(10)   // Claude 最多 10 并发
  private readonly openaiSemaphore = new Semaphore(20)   // OpenAI 最多 20 并发

  async callClaude(req: LLMRequest): Promise<LLMResponse> {
    await this.claudeSemaphore.acquire()
    try {
      return await this.claudeProvider.generate(req)
    } finally {
      this.claudeSemaphore.release()
    }
  }
}
```

### 2.3 队列隔板 (Queue Bulkhead)

```typescript
// ✅ 按租户独立队列
const queues = new Map<string, Queue>()

function getQueue(tenantId: string): Queue {
  if (!queues.has(tenantId)) {
    queues.set(tenantId, new Queue(`member-events-${tenantId}`, {
      redis: { host: 'localhost' },
      defaultJobOptions: {
        maxStalledCount: 3,
        concurrency: 5,  // 每租户最多 5 个 worker
      },
    }))
  }
  return queues.get(tenantId)!
}
```

---

## 3. 📐 神机营 LLM Bulkhead 实现

```typescript
// apps/api/src/modules/ai-review/llm/llm.bulkhead.ts
import { Semaphore } from 'await-semaphore'

@Injectable()
export class LLMBulkhead {
  private readonly semaphores = new Map<LlmProvider, Semaphore>([
    ['claude', new Semaphore(10)],     // 主 provider 10 并发
    ['openai', new Semaphore(20)],     // fallback 20 并发
    ['local-bge', new Semaphore(100)], // 本地 100 并发 (Phase-25)
  ])

  async acquire(provider: LlmProvider): Promise<() => void> {
    const sem = this.semaphores.get(provider)
    if (!sem) throw new Error(`no bulkhead for ${provider}`)
    return await sem.acquire()
  }

  getAvailableSlots(provider: LlmProvider): number {
    const sem = this.semaphores.get(provider)
    return sem ? sem.getAvailableSlots() : 0
  }
}

// 在 LLMProviderFactory 中使用
@Injectable()
export class LLMProviderFactory {
  constructor(
    private readonly bulkhead: LLMBulkhead,
    // ...
  ) {}

  async get(name: LlmProvider): Promise<ILLMProvider> {
    const release = await this.bulkhead.acquire(name)
    try {
      return this.providers.get(name)!
    } catch (err) {
      release()
      throw err
    }
  }
}
```

---

## 4. 📐 多租户 DB Bulkhead

```typescript
// ✅ TypeORM connection pool 按租户隔离
@Injectable()
export class TenantAwareDataSource {
  private readonly pools = new LRUCache<string, DataSource>({
    max: 100,  // 最多 100 个租户连接池
    ttl: 1000 * 60 * 10,  // 10 分钟未用 → 关闭
  })

  async getDataSource(tenantId: string): Promise<DataSource> {
    if (!this.pools.has(tenantId)) {
      this.pools.set(tenantId, await this.createPool(tenantId))
    }
    return this.pools.get(tenantId)!
  }

  private async createPool(tenantId: string): Promise<DataSource> {
    return new DataSource({
      type: 'postgres',
      host: this.cfg.db.host,
      database: this.cfg.db.database,
      // 每个租户最多 10 连接
      extra: { max: 10, min: 1 },
      // Tenant context 注入
      poolErrorHandler: (err) => this.logger.error(`[Tenant ${tenantId}] pool error`, err),
    })
  }
}
```

---

## 5. ✅ 必须遵守

- [ ] 每租户独立资源上限 (连接 / 队列 / worker)
- [ ] 隔板满时立即抛错 (不排队)
- [ ] 隔板状态可观测 (metrics + alert)
- [ ] LRU 淘汰闲置资源 (避免内存泄漏)

---

## 6. 📊 监控

```typescript
metrics.gauge('bulkhead.available_slots', { provider: 'claude' }, sem.getAvailableSlots())
metrics.counter('bulkhead.acquired', { provider: 'claude' })
metrics.counter('bulkhead.rejected', { provider: 'claude' })  // 满载拒绝

// 告警
// - bulkhead 满载率 > 80% → P2 告警
// - bulkhead 拒绝次数 > 0 → P1 告警 (需要扩容或限流)
```

---

## 7. 🔗 关联

- [circuit-breaker.md](./circuit-breaker.md) · 熔断器
- [throttling-pattern.md](./throttling-pattern.md) · 限流
- [best-practices/multi-tenant-isolation.md](../best-practices/multi-tenant-isolation.md) · 多租户隔离
