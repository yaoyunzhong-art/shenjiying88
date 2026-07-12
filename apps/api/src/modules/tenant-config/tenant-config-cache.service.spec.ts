import { describe, it, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
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
})
