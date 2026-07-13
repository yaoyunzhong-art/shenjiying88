import { describe, it, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import type { CacheService } from '../../infrastructure/cache/cache.module'
import { InMemoryCacheService } from '../../infrastructure/cache/cache.module'
import { TenantConfigCacheService } from './tenant-config-cache.service'

describe('TenantConfigCacheService', () => {
  let backend: InMemoryCacheService
  let service: TenantConfigCacheService

  const ctx = {
    tenantId: 'tenant-A',
    brandId: 'tenant-A::brand-main',
    storeId: 'store-001',
    role: 'tenant_admin' as const,
  }

  beforeEach(() => {
    backend = new InMemoryCacheService()
    service = new TenantConfigCacheService(backend)
    service.resetStats()
  })

  class FakeRemoteCacheService implements CacheService {
    readonly backend = 'redis' as const
    private readonly store = new Map<string, string>()

    async get<T = unknown>(key: string): Promise<T | null> {
      const raw = this.store.get(key)
      return raw ? JSON.parse(raw) as T : null
    }

    async set<T = unknown>(key: string, value: T): Promise<void> {
      this.store.set(key, JSON.stringify(value))
    }

    async del(key: string): Promise<boolean> {
      return this.store.delete(key)
    }

    async delByPrefix(prefix: string): Promise<number> {
      let count = 0
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) {
          this.store.delete(key)
          count++
        }
      }
      return count
    }

    async incr(): Promise<number> {
      return 1
    }

    async expire(): Promise<boolean> {
      return true
    }

    async wrap<T = unknown>(key: string, _ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
      const cached = await this.get<T>(key)
      if (cached !== null) return cached
      const fresh = await loader()
      await this.set(key, fresh)
      return fresh
    }

    async ping(): Promise<boolean> {
      return true
    }
  }

  class FailingSetCacheService extends FakeRemoteCacheService {
    override async set<T = unknown>(_key: string, _value: T): Promise<void> {
      throw new Error('set failed')
    }
  }

  it('F2-1 缓存未命中后写入，再次读取命中', async () => {
    let loaderCalls = 0

    const r1 = await service.getOrLoad(
      'configs',
      ctx,
      ['store', 'pos'],
      async () => {
        loaderCalls++
        return [{ key: 'pos.tax_rate', value: '0.13' }]
      },
      300,
    )
    const r2 = await service.getOrLoad(
      'configs',
      ctx,
      ['store', 'pos'],
      async () => {
        loaderCalls++
        return [{ key: 'pos.tax_rate', value: '0.99' }]
      },
      300,
    )

    assert.equal(loaderCalls, 1)
    assert.deepEqual(r1, [{ key: 'pos.tax_rate', value: '0.13' }])
    assert.deepEqual(r2, [{ key: 'pos.tax_rate', value: '0.13' }])

    const stats = service.getStats()
    assert.equal(stats.misses, 1)
    assert.equal(stats.hits, 1)
    assert.equal(stats.hitRate, 0.5)
  })

  it('F2-2 invalidateTenant 按租户前缀清理缓存', async () => {
    await service.getOrLoad(
      'config',
      ctx,
      ['pos.tax_rate'],
      async () => ({ key: 'pos.tax_rate', value: '0.13' }),
      300,
    )
    await service.getOrLoad(
      'effective-configs',
      ctx,
      ['member'],
      async () => [{ key: 'member.daily_checkin_enabled', value: 'true' }],
      300,
    )

    const removed = await service.invalidateTenant('tenant-A')
    assert.equal(removed, 2)

    const stats = service.getStats()
    assert.equal(stats.invalidations, 2)
  })

  it('F2-3 无缓存后端时降级直读 loader', async () => {
    const direct = new TenantConfigCacheService()
    let loaderCalls = 0

    const result = await direct.getOrLoad(
      'configs',
      ctx,
      ['store'],
      async () => {
        loaderCalls++
        return ['ok']
      },
      300,
    )

    assert.deepEqual(result, ['ok'])
    assert.equal(loaderCalls, 1)
    assert.equal(direct.getStats().misses, 1)
  })

  it('F2-4 远端缓存后端契约可用 (模拟 L2/redis)', async () => {
    const remote = new TenantConfigCacheService(new FakeRemoteCacheService())
    let loaderCalls = 0

    const first = await remote.getOrLoad(
      'config',
      ctx,
      ['pos.tax_rate'],
      async () => {
        loaderCalls++
        return { key: 'pos.tax_rate', value: '0.13' }
      },
      300,
    )
    const second = await remote.getOrLoad(
      'config',
      ctx,
      ['pos.tax_rate'],
      async () => {
        loaderCalls++
        return { key: 'pos.tax_rate', value: '0.99' }
      },
      300,
    )

    assert.equal(loaderCalls, 1, '模拟远端后端也必须复用缓存命中')
    assert.deepEqual(first, { key: 'pos.tax_rate', value: '0.13' })
    assert.deepEqual(second, { key: 'pos.tax_rate', value: '0.13' })
    assert.equal(remote.getStats().hits, 1)
  })

  it('F2-5 stats 按 tenant 隔离，不返回其他租户累计值', async () => {
    await service.getOrLoad(
      'configs',
      { ...ctx, tenantId: 'tenant-A' },
      ['store'],
      async () => ['A'],
      300,
    )
    await service.getOrLoad(
      'configs',
      { ...ctx, tenantId: 'tenant-A' },
      ['store'],
      async () => ['A2'],
      300,
    )
    await service.getOrLoad(
      'configs',
      { ...ctx, tenantId: 'tenant-B' },
      ['store'],
      async () => ['B'],
      300,
    )

    const tenantAStats = service.getStats('tenant-A')
    const tenantBStats = service.getStats('tenant-B')
    const globalStats = service.getStats()

    assert.equal(tenantAStats.hits, 1)
    assert.equal(tenantAStats.misses, 1)
    assert.equal(tenantBStats.hits, 0)
    assert.equal(tenantBStats.misses, 1)
    assert.equal(globalStats.hits, 1)
    assert.equal(globalStats.misses, 2)
  })

  it('F2-6 cache.set 失败时不应重复执行 loader', async () => {
    const flaky = new TenantConfigCacheService(new FailingSetCacheService())
    let loaderCalls = 0

    const result = await flaky.getOrLoad(
      'config',
      ctx,
      ['pos.tax_rate'],
      async () => {
        loaderCalls++
        return { key: 'pos.tax_rate', value: '0.13' }
      },
      300,
    )

    assert.equal(loaderCalls, 1)
    assert.deepEqual(result, { key: 'pos.tax_rate', value: '0.13' })
    assert.equal(flaky.getStats().misses, 1)
    assert.equal(flaky.getStats().errors, 1)
  })
})
