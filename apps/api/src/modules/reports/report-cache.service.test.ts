import { describe, it, expect, beforeEach } from 'vitest'
import { ReportCacheService } from './report-cache.service'
import type { ReportResult } from './reports.entity'

function makeResult(overrides: Partial<ReportResult> = {}): ReportResult {
  return {
    columns: [{ field: 'amount', alias: '金额', type: 'metric' }],
    rows: [{ amount: 100 }],
    period: { from: '2026-07-01', to: '2026-07-31' },
    tenantId: 'T-001',
    type: 'revenue',
    generatedAt: '2026-07-20T00:00:00Z',
    cached: false,
    ...overrides,
  }
}

describe('ReportCacheService', () => {
  let cache: ReportCacheService

  beforeEach(() => {
    cache = new ReportCacheService()
  })

  describe('fingerprint', () => {
    it('should generate unique hash for different inputs', () => {
      const fp1 = cache.fingerprint({ tenantId: 'T-001', type: 'revenue', from: '2026-07-01', to: '2026-07-31' })
      const fp2 = cache.fingerprint({ tenantId: 'T-002', type: 'revenue', from: '2026-07-01', to: '2026-07-31' })
      expect(fp1).not.toBe(fp2)
    })

    it('should generate same hash for identical inputs', () => {
      const fp1 = cache.fingerprint({ tenantId: 'T-001', type: 'order' })
      const fp2 = cache.fingerprint({ tenantId: 'T-001', type: 'order' })
      expect(fp1).toBe(fp2)
    })
  })

  describe('get/set', () => {
    it('should return null for miss', () => {
      const result = cache.get('missing-key')
      expect(result).toBeNull()
    })

    it('should return cached result on hit', () => {
      const key = cache.fingerprint({ tenantId: 'T-001', type: 'revenue' })
      const result = makeResult()
      cache.set(key, result)
      const hit = cache.get(key)
      expect(hit).not.toBeNull()
      expect(hit!.cached).toBe(true)
      expect(hit!.rows).toEqual([{ amount: 100 }])
    })

    it('should return expired entry as miss', () => {
      const key = cache.fingerprint({ tenantId: 'T-001', type: 'revenue' })
      const result = makeResult()
      cache.set(key, result, -1000) // negative TTL = expired
      const hit = cache.get(key)
      expect(hit).toBeNull()
    })

    it('should evict LRU when exceeding max entries', () => {
      const keys: string[] = []
      for (let i = 0; i < 110; i++) {
        const k = cache.fingerprint({ tenantId: `T-${i}`, type: 'revenue' })
        keys.push(k)
        cache.set(k, makeResult({ tenantId: `T-${i}` }))
      }
      // First key should be evicted
      const first = cache.get(keys[0])
      expect(first).toBeNull()
      // Most recent should be present
      const last = cache.get(keys[109])
      expect(last).not.toBeNull()
    })
  })

  describe('invalidate', () => {
    it('should invalidate all entries for a tenant', () => {
      cache.set('k1', makeResult({ tenantId: 'T-001', type: 'revenue' }))
      cache.set('k2', makeResult({ tenantId: 'T-001', type: 'order' }))
      cache.set('k3', makeResult({ tenantId: 'T-002', type: 'revenue' }))
      const count = cache.invalidate('T-001')
      expect(count).toBe(2)
      expect(cache.stats().size).toBe(1) // only T-002 remains
    })

    it('should invalidate by tenant + type', () => {
      cache.set('k1', makeResult({ tenantId: 'T-001', type: 'revenue' }))
      cache.set('k2', makeResult({ tenantId: 'T-001', type: 'order' }))
      const count = cache.invalidate('T-001', 'revenue')
      expect(count).toBe(1)
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('k1', makeResult())
      cache.set('k2', makeResult())
      cache.clear()
      expect(cache.stats().size).toBe(0)
    })
  })

  describe('stats', () => {
    it('should track hit/miss rate', () => {
      const key = cache.fingerprint({ tenantId: 'T-001', type: 'test' })
      cache.get(key) // miss
      cache.set(key, makeResult())
      cache.get(key) // hit
      const stats = cache.stats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(0.5)
    })

    it('should report size correctly', () => {
      cache.set('a', makeResult())
      cache.set('b', makeResult())
      expect(cache.stats().size).toBe(2)
    })
  })
})
