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

    async clear(): Promise<void> {
      this.store.clear()
    }
  }

  class FailingGetCacheService extends FakeRemoteCacheService {
    override async get<T = unknown>(_key: string): Promise<T | null> {
      throw new Error('get failed')
    }
  }

  class FailingSetCacheService extends FakeRemoteCacheService {
    override async set<T = unknown>(_key: string, _value: T): Promise<void> {
      throw new Error('set failed')
    }
  }

  class FailingDelCacheService extends FakeRemoteCacheService {
    override async delByPrefix(_prefix: string): Promise<number> {
      throw new Error('del failed')
    }
  }

  beforeEach(() => {
    backend = new InMemoryCacheService()
    service = new TenantConfigCacheService(backend)
    service.resetStats()
  })

  // ═══════════════════════════════════════════════════════════════════
  // Existing tests
  // ═══════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════
  // New tests (F3-*)
  // ═══════════════════════════════════════════════════════════════════

  // ─── getOrLoad ───────────────────────────────────────────────────

  it('F3-1 getOrLoad 同 scope 不同 parts 对应不同缓存 key', async () => {
    let posLoaderCalls = 0
    let memberLoaderCalls = 0

    const pos = await service.getOrLoad(
      'configs', ctx, ['pos', 'tax_rate'],
      async () => { posLoaderCalls++; return { rate: 0.13 } },
      300,
    )
    const member = await service.getOrLoad(
      'configs', ctx, ['member', 'checkin'],
      async () => { memberLoaderCalls++; return { enabled: true } },
      300,
    )
    // 各自第一次 → 都 miss
    assert.equal(posLoaderCalls, 1)
    assert.equal(memberLoaderCalls, 1)

    // 第二次读各自缓存 → 都 hit
    const pos2 = await service.getOrLoad(
      'configs', ctx, ['pos', 'tax_rate'],
      async () => { posLoaderCalls++; return { rate: 0.99 } },
      300,
    )
    const member2 = await service.getOrLoad(
      'configs', ctx, ['member', 'checkin'],
      async () => { memberLoaderCalls++; return { enabled: false } },
      300,
    )
    assert.equal(posLoaderCalls, 1)
    assert.equal(memberLoaderCalls, 1)
    assert.deepEqual(pos, { rate: 0.13 })
    assert.deepEqual(pos2, { rate: 0.13 })
  })

  it('F3-2 getOrLoad 忽略 undefined parts', async () => {
    let loaderCalls = 0
    await service.getOrLoad(
      'config',
      ctx,
      ['store', undefined, 'pos'],
      async () => {
        loaderCalls++
        return 'ok'
      },
      300,
    )
    assert.equal(loaderCalls, 1)

    // 再次调用应命中
    await service.getOrLoad(
      'config',
      ctx,
      ['store', undefined, 'pos'],
      async () => {
        loaderCalls++
        return 'nok'
      },
      300,
    )
    assert.equal(loaderCalls, 1)
  })

  it('F3-3 getOrLoad 不同 role 生成不同缓存 key', async () => {
    const adminCtx = { ...ctx, role: 'tenant_admin' as const }
    const viewerCtx = { ...ctx, role: 'viewer' as const }
    let adminLoader = 0
    let viewerLoader = 0

    await service.getOrLoad('config', adminCtx, ['feature_x'], async () => { adminLoader++; return 'enabled' }, 300)
    await service.getOrLoad('config', viewerCtx, ['feature_x'], async () => { viewerLoader++; return 'disabled' }, 300)

    assert.equal(adminLoader, 1)
    assert.equal(viewerLoader, 1)
    assert.equal(service.getStats().misses, 2)
  })

  it('F3-4 getOrLoad 使用自定义 ttlSeconds', async () => {
    let loaderCalls = 0
    await service.getOrLoad('cfg', ctx, ['x'], async () => { loaderCalls++; return 42 }, 10)
    await service.getOrLoad('cfg', ctx, ['x'], async () => { loaderCalls++; return 99 }, 10)
    assert.equal(loaderCalls, 1)
    assert.equal(service.getStats().hits, 1)
  })

  it('F3-5 cache.get 失败时降级执行 loader', async () => {
    const flaky = new TenantConfigCacheService(new FailingGetCacheService())
    let loaderCalls = 0

    const result = await flaky.getOrLoad('cfg', ctx, ['x'], async () => {
      loaderCalls++
      return 'fallback'
    }, 300)

    assert.equal(loaderCalls, 1)
    assert.equal(result, 'fallback')
    assert.equal(flaky.getStats().errors, 1)
    assert.equal(flaky.getStats().misses, 1)
  })

  // ─── invalidateTenant ────────────────────────────────────────────

  it('F3-6 invalidateTenant 返回 0 当 tenantId 为空', async () => {
    const ret = await service.invalidateTenant('')
    assert.equal(ret, 0)
  })

  it('F3-7 invalidateTenant 无缓存后端时返回 0', async () => {
    const direct = new TenantConfigCacheService()
    const ret = await direct.invalidateTenant('tenant-A')
    assert.equal(ret, 0)
  })

  it('F3-8 invalidateTenant 只清理目标租户，不碰其他租户', async () => {
    const ctxB = { ...ctx, tenantId: 'tenant-B' }
    await service.getOrLoad('cfg', ctx, ['k'], async () => 'A', 300)
    await service.getOrLoad('cfg', ctxB, ['k'], async () => 'B', 300)

    const removed = await service.invalidateTenant('tenant-A')
    assert.equal(removed, 1)

    // tenant-B 缓存仍在
    const statsB = service.getStats('tenant-B')
    assert.equal(statsB.invalidations, 0)
  })

  // ─── invalidateScope ─────────────────────────────────────────────

  it('F3-9 invalidateScope 按 scope 前缀清理', async () => {
    await service.getOrLoad('configs', ctx, ['a'], async () => 1, 300)
    await service.getOrLoad('configs', ctx, ['b'], async () => 2, 300)
    await service.getOrLoad('cache', ctx, ['x'], async () => 3, 300)

    const removed = await service.invalidateScope('tenant-A', 'configs')
    assert.equal(removed, 2)
    assert.equal(service.getStats().invalidations, 2)
  })

  it('F3-10 invalidateScope 空 tenantId 返回 0', async () => {
    const ret = await service.invalidateScope('', 'configs')
    assert.equal(ret, 0)
  })

  it('F3-11 invalidateScope 无缓存后端时返回 0', async () => {
    const direct = new TenantConfigCacheService()
    const ret = await direct.invalidateScope('tenant-A', 'configs')
    assert.equal(ret, 0)
  })

  // ─── invalidateScopes ────────────────────────────────────────────

  it('F3-12 invalidateScopes 批量清理多个 scope', async () => {
    await service.getOrLoad('scope-a', ctx, ['x'], async () => 1, 300)
    await service.getOrLoad('scope-b', ctx, ['y'], async () => 2, 300)
    await service.getOrLoad('scope-c', ctx, ['z'], async () => 3, 300)

    const total = await service.invalidateScopes('tenant-A', ['scope-a', 'scope-c'])
    assert.equal(total, 2)
    assert.equal(service.getStats().invalidations, 2)
  })

  it('F3-13 invalidateScopes 空数组返回 0', async () => {
    const total = await service.invalidateScopes('tenant-A', [])
    assert.equal(total, 0)
  })

  // ─── getStats ────────────────────────────────────────────────────

  it('F3-14 getStats 返回正确 hitRate', () => {
    // 无调用 → 0
    const empty = service.getStats()
    assert.equal(empty.hitRate, 0)

    // 1 miss + 1 hit → 0.5
    service.getOrLoad('cfg', ctx, ['k'], async () => 'v', 300)
    service.getOrLoad('cfg', ctx, ['k'], async () => 'v2', 300)

    const stats = service.getStats()
    assert.equal(stats.hits, 1)
    assert.equal(stats.misses, 1)
    assert.equal(stats.hitRate, 0.5)
  })

  it('F3-15 getStats 无 tenantId 时返回全局统计', () => {
    service.getOrLoad('cfg', { ...ctx, tenantId: 'A' }, ['k'], async () => 'a', 300)
    service.getOrLoad('cfg', { ...ctx, tenantId: 'B' }, ['k'], async () => 'b', 300)

    const globalStats = service.getStats()
    assert.equal(globalStats.misses, 2)
  })

  it('F3-16 getStats 未知 tenantId 初始化空统计', () => {
    const stats = service.getStats('non-existent-tenant')
    assert.equal(stats.hits, 0)
    assert.equal(stats.misses, 0)
    assert.equal(stats.hitRate, 0)
  })

  // ─── resetStats ──────────────────────────────────────────────────

  it('F3-17 resetStats 清空统计数据', async () => {
    await service.getOrLoad('cfg', ctx, ['k'], async () => 'v', 300)
    await service.getOrLoad('cfg', ctx, ['k'], async () => 'v2', 300)
    assert.equal(service.getStats().hits, 1)
    assert.equal(service.getStats().misses, 1)

    service.resetStats()

    const after = service.getStats()
    assert.equal(after.hits, 0)
    assert.equal(after.misses, 0)
    assert.equal(after.errors, 0)
    assert.equal(after.invalidations, 0)
  })

  // ─── 错误路径: invalidate 异常捕获 ──────────────────────────────

  it('F3-18 invalidateTenant 捕获 cache.delByPrefix 异常', async () => {
    const flaky = new TenantConfigCacheService(new FailingDelCacheService())
    // 先写入一条,再删除使之失败
    const result = await flaky.invalidateTenant('tenant-A')
    assert.equal(result, 0)
    assert.equal(flaky.getStats().errors, 1)
  })

  it('F3-19 invalidateScope 捕获 cache.delByPrefix 异常', async () => {
    const flaky = new TenantConfigCacheService(new FailingDelCacheService())
    const result = await flaky.invalidateScope('tenant-A', 'configs')
    assert.equal(result, 0)
    assert.equal(flaky.getStats().errors, 1)
  })

  it('F3-20 invalidateScopes 抛出其一不影响后续', async () => {
    const flaky = new TenantConfigCacheService(new FailingDelCacheService())
    // 即使每次调用都失败, total 应为 0 而不是抛异常
    const total = await flaky.invalidateScopes('tenant-A', ['a', 'b', 'c'])
    assert.equal(total, 0)
  })
})
