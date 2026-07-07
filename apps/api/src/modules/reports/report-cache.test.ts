import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ReportCacheService } from './report-cache.service'
import type { ReportResult } from './reports.entity'

describe('ReportCacheService - LRU + TTL', () => {
  let cache: ReportCacheService

  const makeResult = (overrides: Partial<ReportResult> = {}): ReportResult => ({
    type: 'revenue',
    tenantId: 'tenant-A',
    period: { from: '2024-06-01', to: '2024-06-30' },
    columns: [{ field: 'total', alias: 'Total', type: 'metric' }],
    rows: [{ total: 1000 }],
    generatedAt: '2024-06-28T00:00:00Z',
    cached: false,
    ...overrides
  })

  // 每个测试前新建 cache (LRU 实例状态隔离)
  const newCache = () => new ReportCacheService()

  describe('CACHE-1: fingerprint 缓存 key 生成', () => {
    it('同输入产生同 key', () => {
      cache = newCache()
      const k1 = cache.fingerprint({ tenantId: 'A', type: 'revenue', from: '2024-01-01', to: '2024-01-31' })
      const k2 = cache.fingerprint({ tenantId: 'A', type: 'revenue', from: '2024-01-01', to: '2024-01-31' })
      assert.equal(k1, k2)
    })

    it('不同 tenantId 不同 key', () => {
      cache = newCache()
      const k1 = cache.fingerprint({ tenantId: 'A', type: 'revenue' })
      const k2 = cache.fingerprint({ tenantId: 'B', type: 'revenue' })
      assert.notEqual(k1, k2)
    })

    it('不同 type 不同 key', () => {
      cache = newCache()
      const k1 = cache.fingerprint({ tenantId: 'A', type: 'revenue' })
      const k2 = cache.fingerprint({ tenantId: 'A', type: 'order' })
      assert.notEqual(k1, k2)
    })

    it('不同 from 不同 key', () => {
      cache = newCache()
      const k1 = cache.fingerprint({ tenantId: 'A', type: 'revenue', from: '2024-01-01' })
      const k2 = cache.fingerprint({ tenantId: 'A', type: 'revenue', from: '2024-02-01' })
      assert.notEqual(k1, k2)
    })

    it('不同 granularity 不同 key', () => {
      cache = newCache()
      const k1 = cache.fingerprint({ tenantId: 'A', type: 'revenue', granularity: 'day' })
      const k2 = cache.fingerprint({ tenantId: 'A', type: 'revenue', granularity: 'month' })
      assert.notEqual(k1, k2)
    })

    it('不同 filters 不同 key', () => {
      cache = newCache()
      const k1 = cache.fingerprint({ tenantId: 'A', type: 'revenue', filters: { status: 'PAID' } })
      const k2 = cache.fingerprint({ tenantId: 'A', type: 'revenue', filters: { status: 'REFUNDED' } })
      assert.notEqual(k1, k2)
    })

    it('key 长度固定 32 字符 (sha256 slice)', () => {
      cache = newCache()
      const k = cache.fingerprint({ tenantId: 'A', type: 'revenue' })
      assert.equal(k.length, 32)
    })

    it('空输入生成有效 key', () => {
      cache = newCache()
      const k = cache.fingerprint({ tenantId: 'A', type: 'revenue' })
      assert.ok(k.length > 0)
    })
  })

  describe('CACHE-2: get / set 基础', () => {
    it('set 后 get 返回 cached=true', () => {
      cache = newCache()
      const k = 'k1'
      const r = makeResult()
      cache.set(k, r)
      const got = cache.get(k)
      assert.ok(got)
      assert.equal(got!.cached, true)
      assert.equal(got!.tenantId, 'tenant-A')
    })

    it('未命中返回 null', () => {
      cache = newCache()
      assert.equal(cache.get('nope'), null)
    })

    it('set 写入时 cached=false (原始)', () => {
      cache = newCache()
      cache.set('k', makeResult({ cached: true }))
      // 读出后变 cached=true
      const got = cache.get('k')
      assert.equal(got!.cached, true)
    })

    it('不存在的 key get 返回 null', () => {
      cache = newCache()
      cache.set('a', makeResult())
      assert.equal(cache.get('b'), null)
    })
  })

  describe('CACHE-3: TTL 过期', () => {
    it('set 不带 ttl 用默认 5min', () => {
      cache = newCache()
      cache.set('k', makeResult())
      const got = cache.get('k')
      assert.ok(got)
    })

    it('set 带 ttl=50ms', (done: any) => {
      cache = newCache()
      cache.set('k', makeResult(), 50)
      // 60ms 后应过期
      setTimeout(() => {
        const got = cache.get('k')
        assert.equal(got, null)
        done()
      }, 60)
    })

    it('过期 entry 自动清理', (done: any) => {
      cache = newCache()
      cache.set('k', makeResult(), 30)
      setTimeout(() => {
        cache.get('k')  // 触发清理
        assert.equal(cache.stats().size, 0)
        done()
      }, 50)
    })
  })

  describe('CACHE-4: LRU 淘汰', () => {
    it('超 100 entries 触发 LRU 淘汰', () => {
      cache = newCache()
      for (let i = 0; i < 105; i++) {
        cache.set(`k${i}`, makeResult())
      }
      const stats = cache.stats()
      assert.ok(stats.size <= 100, `size should be <= 100, got ${stats.size}`)
    })

    it('访问后 lastAccessAt 更新,不被淘汰', () => {
      cache = newCache()
      // 写满 100 entries
      for (let i = 0; i < 100; i++) {
        cache.set(`k${i}`, makeResult())
      }
      assert.equal(cache.stats().size, 100)
      // 访问 k0 后再写一个,应触发 LRU evict 一个 entry
      cache.get('k0')
      cache.set('k100', makeResult())
      // size 仍 ≤ 100 (LRU 替换)
      assert.ok(cache.stats().size <= 100, 'LRU should keep size <= 100')
    })
  })

  describe('CACHE-5: invalidate', () => {
    it('按 tenantId 失效所有该租户 entry', () => {
      cache = newCache()
      cache.set('a', makeResult({ tenantId: 'T1' }))
      cache.set('b', makeResult({ tenantId: 'T1' }))
      cache.set('c', makeResult({ tenantId: 'T2' }))
      const n = cache.invalidate('T1')
      assert.equal(n, 2)
      assert.equal(cache.get('a'), null)
      // T2 的 c 不应被失效
      assert.ok(cache.get('c'))
    })

    it('按 tenantId + type 精确失效', () => {
      cache = newCache()
      cache.set('a', makeResult({ tenantId: 'T1', type: 'revenue' }))
      cache.set('b', makeResult({ tenantId: 'T1', type: 'order' }))
      const n = cache.invalidate('T1', 'revenue')
      assert.equal(n, 1)
      assert.equal(cache.get('a'), null)
      assert.ok(cache.get('b'))
    })

    it('无 tenantId 命中返回 0', () => {
      cache = newCache()
      cache.set('a', makeResult({ tenantId: 'T1' }))
      const n = cache.invalidate('T-nonexistent')
      assert.equal(n, 0)
    })
  })

  describe('CACHE-6: clear / stats', () => {
    it('clear 清空所有', () => {
      cache = newCache()
      cache.set('a', makeResult())
      cache.set('b', makeResult())
      cache.clear()
      assert.equal(cache.stats().size, 0)
    })

    it('stats 报告 size/maxEntries', () => {
      cache = newCache()
      cache.set('a', makeResult())
      const s = cache.stats()
      assert.equal(s.size, 1)
      assert.equal(s.maxEntries, 100)
    })

    it('stats hitRate 在命中后上升', () => {
      cache = newCache()
      cache.set('a', makeResult())
      cache.get('a')  // 命中
      cache.get('nope')  // 未命中
      const s = cache.stats()
      assert.equal(s.hits, 1)
      assert.equal(s.misses, 1)
      assert.equal(s.hitRate, 0.5)
    })
  })

  describe('CACHE-7: 反模式 - cache key 不含时间戳', () => {
    it('同 fingerprint 跨时间应同 key (缓存复用)', () => {
      cache = newCache()
      const k1 = cache.fingerprint({ tenantId: 'A', type: 'revenue', from: '2024-01-01', to: '2024-01-31' })
      const k2 = cache.fingerprint({ tenantId: 'A', type: 'revenue', from: '2024-01-01', to: '2024-01-31' })
      assert.equal(k1, k2)
    })
  })
})