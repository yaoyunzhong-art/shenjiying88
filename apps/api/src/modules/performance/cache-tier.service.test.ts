import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { CacheTierService } from './cache-tier.service'

describe('CacheTierService', () => {
  let service: CacheTierService

  beforeEach(() => {
    service = new CacheTierService()
    service.configure({
      l1: { maxBytes: 1000, evictionPolicy: 'lru', ttlMs: 1000 },
      l2: { maxBytes: 5000, evictionPolicy: 'lru', ttlMs: 5000 },
      l3: { maxBytes: 10000, evictionPolicy: 'lru', ttlMs: 10000 },
      readThrough: true,
      writeThrough: true,
      prefetchEnabled: true,
    })
  })

  describe('configure', () => {
    it('should configure cache with multi-level settings', () => {
      const config = service.getConfig()
      expect(config.l1.maxBytes).toBe(1000)
      expect(config.readThrough).toBe(true)
    })
  })

  describe('set and get', () => {
    it('should store and retrieve value from cache', () => {
      service.set('key1', 'value1')
      const result = service.get('key1')
      expect(result).toBe('value1')
    })

    it('should return null for non-existent key', () => {
      const result = service.get('nonexistent')
      expect(result).toBeNull()
    })

    it('should store value with TTL', () => {
      service.set('key1', 'value1', { ttlMs: 5000 })
      const result = service.get('key1')
      expect(result).toBe('value1')
    })
  })

  describe('delete', () => {
    it('should delete a key from all tiers', () => {
      service.set('key1', 'value1')
      service.delete('key1')
      const result = service.get('key1')
      expect(result).toBeNull()
    })
  })

  describe('has', () => {
    it('should return true for existing key', () => {
      service.set('key1', 'value1')
      expect(service.has('key1')).toBe(true)
    })

    it('should return false for non-existing key', () => {
      expect(service.has('nonexistent')).toBe(false)
    })
  })

  describe('flush', () => {
    it('should flush all tiers when no tier specified', () => {
      service.set('key1', 'value1')
      service.flush()
      expect(service.get('key1')).toBeNull()
    })

    it('should flush specific tier', () => {
      service.flush('l1')
      const config = service.getConfig()
      expect(config.l1.maxBytes).toBeDefined()
    })
  })

  describe('mget and mset', () => {
    it('should get multiple keys', () => {
      service.set('key1', 'value1')
      service.set('key2', 'value2')
      const results = service.mget(['key1', 'key2', 'key3'])
      expect(results[0]).toBe('value1')
      expect(results[1]).toBe('value2')
      expect(results[2]).toBeNull()
    })

    it('should set multiple entries', () => {
      service.mset([
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ])
      expect(service.get('key1')).toBe('value1')
      expect(service.get('key2')).toBe('value2')
    })
  })

  describe('getTTL', () => {
    it('should return TTL for key with TTL set', () => {
      service.set('key1', 'value1', { ttlMs: 5000 })
      const ttl = service.getTTL('key1')
      expect(ttl).toBeGreaterThan(0)
    })

    it('should return -1 for key without TTL', () => {
      service.set('key1', 'value1')
      const ttl = service.getTTL('key1')
      expect(ttl).toBe(-1)
    })
  })

  describe('expire', () => {
    it('should update TTL for existing key', () => {
      service.set('key1', 'value1', { ttlMs: 5000 })
      service.expire('key1', 10000)
      const ttl = service.getTTL('key1')
      expect(ttl).toBeGreaterThan(5000)
    })
  })

  describe('stats', () => {
    it('should return stats for all tiers', () => {
      service.set('key1', 'value1')
      service.get('key1')
      service.get('nonexistent')
      const stats = service.getStats()
      expect(stats).toHaveLength(3)
    })

    it('should return global stats', () => {
      service.set('key1', 'value1')
      service.get('key1')
      const globalStats = service.getGlobalStats()
      expect(globalStats.totalHits).toBeGreaterThan(0)
    })
  })
})
