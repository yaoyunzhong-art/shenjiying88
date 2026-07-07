import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { RecommendCacheService } from './recommend-cache.service'
import type { RecommendationRequest, RecommendationResult } from './recommend.entity'

describe('RecommendCacheService', () => {
  let service: RecommendCacheService

  const makeRequest = (overrides: Partial<RecommendationRequest> = {}): RecommendationRequest => ({
    tenantId: 't1',
    memberId: 'm1',
    limit: 10,
    strategies: ['popular', 'item-cf'],
    excludePurchased: true,
    excludeOutOfStock: true,
    diversify: true,
    ...overrides,
  })

  const makeResult = (request: RecommendationRequest): RecommendationResult => ({
    request,
    candidates: [
      { itemId: 'a', score: 0.9, reasoning: 'popular', strategy: 'popular' },
    ],
    metadata: {
      strategiesApplied: ['popular'],
      totalCandidates: 1,
      filteredOut: 0,
      executionMs: 10,
      cached: false,
      generatedAt: new Date().toISOString(),
    },
  })

  beforeEach(() => {
    service = new RecommendCacheService()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-28T03:10:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('fingerprint', () => {
    it('should generate deterministic hash for same request', () => {
      const req1 = makeRequest()
      const req2 = makeRequest()
      expect(service.fingerprint(req1)).toBe(service.fingerprint(req2))
    })

    it('should generate different hash for different tenantId', () => {
      const f1 = service.fingerprint(makeRequest({ tenantId: 't1' }))
      const f2 = service.fingerprint(makeRequest({ tenantId: 't2' }))
      expect(f1).not.toBe(f2)
    })

    it('should generate different hash for different memberId', () => {
      const f1 = service.fingerprint(makeRequest({ memberId: 'm1' }))
      const f2 = service.fingerprint(makeRequest({ memberId: 'm2' }))
      expect(f1).not.toBe(f2)
    })

    it('should be consistent regardless of strategy order', () => {
      const req1 = makeRequest({ strategies: ['popular', 'item-cf'] })
      const req2 = makeRequest({ strategies: ['item-cf', 'popular'] })
      expect(service.fingerprint(req1)).toBe(service.fingerprint(req2))
    })

    it('should handle missing optional fields', () => {
      const req = makeRequest({ memberId: undefined, contextItemId: undefined, filters: undefined })
      const fingerprint = service.fingerprint(req)
      expect(fingerprint).toBeTruthy()
      expect(fingerprint.length).toBe(32)
    })
  })

  describe('get / set', () => {
    it('should store and retrieve cached result', () => {
      const req = makeRequest()
      const key = service.fingerprint(req)
      const result = makeResult(req)

      service.set(key, result)
      const cached = service.get(key)

      expect(cached).not.toBeNull()
      expect(cached!.metadata.cached).toBe(true)
      expect(cached!.candidates[0].itemId).toBe('a')
    })

    it('should return null for non-existent key', () => {
      const result = service.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should expire TTL and return null', () => {
      const req = makeRequest()
      const key = service.fingerprint(req)
      service.set(key, makeResult(req))

      // Advance time past 5 min default TTL
      vi.advanceTimersByTime(5 * 60 * 1000 + 1)

      const cached = service.get(key)
      expect(cached).toBeNull()
    })

    it('should respect custom TTL', () => {
      const req = makeRequest()
      const key = service.fingerprint(req)
      service.set(key, makeResult(req), 60_000) // 1 min

      // Advance past 1 min
      vi.advanceTimersByTime(60_001)
      expect(service.get(key)).toBeNull()
    })

    it('should return non-expired result within TTL', () => {
      const req = makeRequest()
      const key = service.fingerprint(req)
      service.set(key, makeResult(req))

      vi.advanceTimersByTime(60_000) // 1 min < 5 min TTL

      const cached = service.get(key)
      expect(cached).not.toBeNull()
    })

    it('should evict LRU when exceeding max entries', () => {
      const maxEntries = 200

      // Insert max entries
      for (let i = 0; i < maxEntries; i++) {
        const req = makeRequest({ tenantId: `t${i}`, memberId: `m${i}` })
        const key = service.fingerprint(req)
        service.set(key, makeResult(req))
      }

      expect(service.stats().size).toBe(maxEntries)

      // Insert one more to trigger eviction
      const extraReq = makeRequest({ tenantId: 'extra', memberId: 'extra' })
      const extraKey = service.fingerprint(extraReq)
      service.set(extraKey, makeResult(extraReq))

      expect(service.stats().size).toBe(maxEntries)
    })
  })

  describe('invalidate', () => {
    it('should invalidate all entries for given tenant', () => {
      const req1 = makeRequest({ tenantId: 't1' })
      const req2 = makeRequest({ tenantId: 't2' })

      service.set(service.fingerprint(req1), makeResult(req1))
      service.set(service.fingerprint(req2), makeResult(req2))

      const count = service.invalidate('t1')
      expect(count).toBe(1)
      expect(service.get(service.fingerprint(req1))).toBeNull()
      expect(service.get(service.fingerprint(req2))).not.toBeNull()
    })

    it('should return 0 when no entries for tenant', () => {
      const count = service.invalidate('nonexistent')
      expect(count).toBe(0)
    })

    it('should invalidate multiple entries for same tenant', () => {
      const req1 = makeRequest({ tenantId: 't1', memberId: 'm1' })
      const req2 = makeRequest({ tenantId: 't1', memberId: 'm2' })

      service.set(service.fingerprint(req1), makeResult(req1))
      service.set(service.fingerprint(req2), makeResult(req2))

      const count = service.invalidate('t1')
      expect(count).toBe(2)
      expect(service.stats().size).toBe(0)
    })
  })

  describe('stats', () => {
    it('should return current size and max', () => {
      const stats = service.stats()
      expect(stats.size).toBe(0)
      expect(stats.maxEntries).toBe(200)
    })

    it('should reflect size changes', () => {
      const req = makeRequest()
      service.set(service.fingerprint(req), makeResult(req))
      expect(service.stats().size).toBe(1)
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      const req = makeRequest()
      service.set(service.fingerprint(req), makeResult(req))
      expect(service.stats().size).toBe(1)

      service.clear()
      expect(service.stats().size).toBe(0)
    })
  })
})
