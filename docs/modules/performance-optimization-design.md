# P-55 性能优化详细设计文档

## 1. 系统概述

性能优化模块是数字运动潮玩平台 V17 的核心基础设施，通过三级缓存架构、性能基准测试、智能路由等技术手段，确保系统在高并发场景下的稳定性和响应速度。

### 1.1 核心目标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| **API P95延迟** | < 100ms | 95%请求响应时间 |
| **API P99延迟** | < 200ms | 99%请求响应时间 |
| **吞吐量** | ≥ 1000 RPS | 常规负载 |
| **峰值吞吐量** | ≥ 5000 RPS | 峰值负载 |
| **错误率** | < 0.1% | 常规负载 |
| **缓存命中率** | > 95% | 三级缓存综合 |

### 1.2 架构位置

```
┌─────────────────────────────────────────────────────────┐
│                    M5 Platform V17                       │
├─────────────────────────────────────────────────────────┤
│  P-31 多租户  │  P-30 物流  │  P-48 营销券              │
├─────────────────────────────────────────────────────────┤
│  P-55 性能优化 ◄── 本模块                                │
│  ├── L1 内存缓存 (应用内)                               │
│  ├── L2 Redis缓存 (分布式)                              │
│  ├── L3 数据库 (持久化)                                 │
│  ├── 性能基准测试                                       │
│  └── 智能路由/负载均衡                                  │
├─────────────────────────────────────────────────────────┤
│  P-53 基础设施  │  P-54 自动化测试                       │
└─────────────────────────────────────────────────────────┘
```

## 2. 三级缓存架构

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         三级缓存架构 (L1/L2/L3)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                           应用请求                                  │   │
│   └───────────────────────────────┬───────────────────────────────────┘   │
│                                   │                                       │
│                                   ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│   │  │   L1 Cache   │  │   L2 Cache   │  │   L3 Cache   │             │   │
│   │  │  (内存)      │  │  (Redis)     │  │  (数据库)     │             │   │
│   │  ├──────────────┤  ├──────────────┤  ├──────────────┤             │   │
│   │  │ Latency: 1μs │  │ Latency: 1ms │  │ Latency: 10ms│             │   │
│   │  │ Capacity: 1GB│  │ Capacity:10GB│  │ Capacity: TB │             │   │
│   │  │ Hit Rate:80% │  │ Hit Rate:15% │  │ Hit Rate: 5% │             │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘             │   │
│   │                                                                     │   │
│   │  读取流程: L1 → L2 → L3 (Cache-Aside)                               │   │
│   │  写入策略: Write-Through (同步更新) / Write-Behind (异步更新)        │   │
│   │  淘汰策略: LRU / LFU / TTL                                          │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心类型定义

```typescript
// cache-tier.service.ts

export type CacheTier = 'l1' | 'l2' | 'l3'
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl'

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  tier: CacheTier
  createdAt: Date
  accessedAt: Date
  accessCount: number
  sizeBytes: number
  ttlMs?: number
  tags?: string[]
}

export interface CacheStats {
  tier: CacheTier
  totalKeys: number
  totalBytes: number
  hitCount: number
  missCount: number
  hitRate: number
  evictionCount: number
}

export interface MultiLevelConfig {
  l1: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number }
  l2: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number; host?: string }
  l3: { maxBytes: number; evictionPolicy: EvictionPolicy; ttlMs: number; host?: string }
  readThrough: boolean
  writeThrough: boolean
  prefetchEnabled: boolean
}
```

### 2.3 缓存服务实现

```typescript
// CacheService 接口定义

export interface CacheService {
  /** 取值,反序列化;不存在 / 错误返回 null */
  get<T = unknown>(key: string): Promise<T | null>

  /** 设置值,ttl 秒为单位;传 0 表示无过期 */
  set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void>

  /** 删除指定 key,不存在返回 false */
  del(key: string): Promise<boolean>

  /** 批量删除 (按 prefix 模式: 'prefix:*'),返回删除数 */
  delByPrefix(prefix: string): Promise<number>

  /** 自增,不存在则初始化为 0 */
  incr(key: string): Promise<number>

  /** 设置过期时间 (秒);返回 1 成功,0 不存在 */
  expire(key: string, ttlSeconds: number): Promise<boolean>

  /**
   * 缓存穿透保护:取 key,不存在则执行 loader,写入缓存再返回。
   * loader 抛错则不写入缓存。
   */
  wrap<T = unknown>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T>

  /** 后端健康检查 */
  ping(): Promise<boolean>

  /** 强制清空所有缓存 (用于验收脉冲 cache-bust) */
  clear(): Promise<void>

  /** 后端类型标识 (用于日志 / 监控) */
  readonly backend: 'redis' | 'memory'
}

// Redis 实现
@Injectable()
export class RedisCacheService implements CacheService {
  readonly backend = 'redis' as const

  constructor(@Inject('IOREDIS_CACHE_CLIENT') private readonly client: Redis) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds = 0): Promise<void> {
    const payload = JSON.stringify(value)
    if (ttlSeconds > 0) {
      await this.client.set(key, payload, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, payload)
    }
  }

  async del(key: string): Promise<boolean> {
    const count = await this.client.del(key)
    return count > 0
  }

  async delByPrefix(prefix: string): Promise<number> {
    let cursor = '0'
    let total = 0
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200)
      cursor = next
      if (keys.length > 0) {
        total += await this.client.unlink(...keys)
      }
    } while (cursor !== '0')
    return total
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const reply = await this.client.expire(key, ttlSeconds)
    return reply === 1
  }

  async wrap<T = unknown>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached
    const fresh = await loader()
    if (fresh !== undefined && fresh !== null) {
      await this.set(key, fresh, ttlSeconds)
    }
    return fresh
  }

  async ping(): Promise<boolean> {
    try {
      const reply = await this.client.ping()
      return reply === 'PONG'
    } catch {
      return false
    }
  }

  async clear(): Promise<void> {
    await this.client.flushdb()
  }
}
```

## 3. 性能基准测试

### 3.1 基准测试配置

```yaml
# performance-baseline.yml

metadata:
  name: M5-Performance-Baseline
  version: "1.0.0"
  environment: production

# API 延迟基线 (毫秒)
api_latency:
  endpoints:
    - name: "健康检查"
      path: "/api/v1/health/ping"
      method: "GET"
      p50: 10
      p95: 25
      p99: 50
      max: 100
      
    - name: "用户登录"
      path: "/api/v1/auth/login"
      method: "POST"
      p50: 50
      p95: 150
      p99: 300
      max: 500

# 吞吐量基线
throughput:
  scenarios:
    - name: "常规负载"
      concurrent_users: 100
      target_rps: 1000
      duration: 60
      error_rate_threshold: 0.01
      
    - name: "峰值负载"
      concurrent_users: 500
      target_rps: 5000
      duration: 60
      error_rate_threshold: 0.05

# 资源使用基线
resource_usage:
  thresholds:
    cpu:
      idle: 20
      normal: 50
      warning: 70
      critical: 90
    memory:
      idle: 30
      normal: 60
      warning: 80
      critical: 95

# 验收标准
acceptance_criteria:
  must_meet:
    - "API P95 延迟 < 200ms"
    - "API P99 延迟 < 500ms"
    - "常规负载 RPS >= 1000"
    - "错误率 < 1%"
  should_meet:
    - "API P95 延迟 < 100ms"
    - "峰值负载 RPS >= 5000"
    - "错误率 < 0.1%"
    - "缓存命中率 > 95%"
```

### 3.2 压测引擎

```typescript
// load-test.ts - 压测引擎

export interface LoadTestConfig {
  name: string
  vu: number              // 虚拟用户数
  duration: number      // 持续时间(秒)
  pattern: 'constant' | 'ramp' | 'peak' | 'stress' | 'spike'
  targetRPS?: number
  stages?: { duration: number; vu: number }[]
}

export interface LoadTestResult {
  config: LoadTestConfig
  metrics: AggregateMetrics
  duration: number
  startedAt: Date
  completedAt: Date
  statusCode: 'ok' | 'error' | 'timeout' | 'crash'
  bottlenecks: string[]
}

@Injectable()
export class LoadTester {
  async run(runner: TaskRunner, options: LoadTestOptions = {}): Promise<LoadTestResult> {
    const concurrency