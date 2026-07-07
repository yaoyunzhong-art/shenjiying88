/**
 * CacheModule — 缓存抽象 (双后端: Redis or in-memory)
 *
 * 设计要点:
 * - 抽象 CacheService 接口 (get/set/del/incr/expire/wrap),业务 service 只依赖接口。
 * - 两个实现:RedisCacheService (生产) + InMemoryCacheService (测试 / Redis 不可用)。
 * - 通过 CacheModule.forRootAsync 选择后端;test 时用 forRootInMemory()。
 * - 自动 JSON 序列化,业务调用方传纯对象即可。
 */
import { DynamicModule, Global, Inject, Injectable, Module, Provider } from '@nestjs/common'
import type { Redis } from 'ioredis'

export const CACHE_SERVICE = Symbol.for('m5.infrastructure.cache.service')

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

  /** 后端类型标识 (用于日志 / 监控) */
  readonly backend: 'redis' | 'memory'
}

// ── Redis 实现 ────────────────────────────────────────────────────────
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
    // ioredis + keyPrefix 注意:scan 时要加 prefix
    let cursor = '0'
    let total = 0
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200)
      cursor = next
      if (keys.length > 0) {
        // 当 keyPrefix 存在时,client.scan 已自动加 prefix;这里返回的是不带 prefix 的 raw keys
        // 用 unlink 避免阻塞
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
}

// ── In-memory 实现 ────────────────────────────────────────────────────
interface MemoryEntry {
  value: string
  expiresAt: number | null
}

@Injectable()
export class InMemoryCacheService implements CacheService {
  readonly backend = 'memory' as const
  private readonly store = new Map<string, MemoryEntry>()

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    try {
      return JSON.parse(entry.value) as T
    } catch {
      return null
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds = 0): Promise<void> {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null
    this.store.set(key, { value: JSON.stringify(value), expiresAt })
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key)
  }

  async delByPrefix(prefix: string): Promise<number> {
    let count = 0
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key) ?? 0
    const next = current + 1
    const entry = this.store.get(key)
    this.store.set(key, { value: JSON.stringify(next), expiresAt: entry?.expiresAt ?? null })
    return next
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const entry = this.store.get(key)
    if (!entry) return false
    entry.expiresAt = Date.now() + ttlSeconds * 1000
    return true
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
    return true
  }

  /** 测试 helper:清空所有 keys */
  clear(): void {
    this.store.clear()
  }

  /** 测试 helper:查看 entries */
  size(): number {
    return this.store.size
  }
}

// ── Module ────────────────────────────────────────────────────────────
export interface CacheModuleRedisOptions {
  backend: 'redis'
  client: Redis
}

export interface CacheModuleMemoryOptions {
  backend: 'memory'
}

export type CacheModuleOptions = CacheModuleRedisOptions | CacheModuleMemoryOptions

const cacheServiceProvider: Provider = {
  provide: CACHE_SERVICE,
  inject: ['CACHE_MODULE_OPTIONS'],
  useFactory: (options: CacheModuleOptions): CacheService => {
    if (options.backend === 'redis') {
      return new RedisCacheService(options.client)
    }
    return new InMemoryCacheService()
  },
}

@Global()
@Module({})
export class CacheModule {
  static forRoot(options: CacheModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: 'CACHE_MODULE_OPTIONS',
      useValue: options,
    }
    return {
      module: CacheModule,
      providers: [optionsProvider, cacheServiceProvider],
      exports: [CACHE_SERVICE],
    }
  }

  /** 便利方法:测试 / 演示用 in-memory 后端 */
  static forRootInMemory(): DynamicModule {
    return this.forRoot({ backend: 'memory' })
  }

  /** 便利方法:生产用 Redis 后端 */
  static forRootRedis(client: Redis): DynamicModule {
    return this.forRoot({ backend: 'redis', client })
  }
}