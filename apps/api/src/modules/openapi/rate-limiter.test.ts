import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { RateLimiter } from './rate-limiter'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'

describe('RateLimiter', () => {
  let limiter: RateLimiter
  let adapter: RateLimitAdapter

  beforeEach(() => {
    adapter = new RateLimitAdapter()
    limiter = new RateLimiter(adapter)
  })

  describe('createBucket', () => {
    it('创建限流桶', () => {
      const r = limiter.createBucket({
        tenantId: 't1', endpoint: '/api/orders',
        qps: 10, dailyQuota: 1000
      })
      assert.ok(r.id)
      assert.equal(r.active, true)
    })

    it('可设置窗口大小', () => {
      const r = limiter.createBucket({
        tenantId: 't1', endpoint: '/api/orders',
        qps: 10, dailyQuota: 1000, windowMs: 30000
      })
      const bucket = adapter.queryBucket(r.id)
      assert.equal(bucket?.windowMs, 30000)
    })
  })

  describe('check', () => {
    it('无桶配置 = 不限流', () => {
      const r = limiter.check({ tenantId: 't1', endpoint: '/api/none' })
      assert.equal(r.allowed, true)
      assert.equal(r.remaining, -1)
    })

    it('QPS 内允许', () => {
      limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 5, dailyQuota: 0 })
      for (let i = 0; i < 5; i++) {
        const r = limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1000 + i * 10 })
        assert.equal(r.allowed, true)
      }
    })

    it('QPS 超额拒绝', () => {
      limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 3, dailyQuota: 0, windowMs: 60000 })
      // 前 3 个通过
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1000 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 2000 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 3000 })
      // 第 4 个被拒
      const r = limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 4000 })
      assert.equal(r.allowed, false)
      assert.equal(r.reason, 'qps_exceeded')
      assert.ok(r.retryAfter && r.retryAfter > 0)
    })

    it('日配额耗尽拒绝', () => {
      limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 1000, dailyQuota: 3 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', keyId: 'k1', now: 1000 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', keyId: 'k1', now: 2000 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', keyId: 'k1', now: 3000 })
      const r = limiter.check({ tenantId: 't1', endpoint: '/api/x', keyId: 'k1', now: 4000 })
      assert.equal(r.allowed, false)
      assert.equal(r.reason, 'daily_quota_exceeded')
    })

    it('桶禁用 = 拒绝', () => {
      const b = limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 10, dailyQuota: 0 })
      limiter.setBucketActive(b.id, false)
      const r = limiter.check({ tenantId: 't1', endpoint: '/api/x' })
      assert.equal(r.allowed, false)
      assert.equal(r.reason, 'bucket_disabled')
    })

    it('滑动窗口: 窗口外请求重新计数', () => {
      limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 3, dailyQuota: 0, windowMs: 1000 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1000 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1100 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1200 })
      // t=1300 时 第一个请求在窗口外
      const r = limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 2500 })
      assert.equal(r.allowed, true)
    })
  })

  describe('setBucketActive', () => {
    it('启用/禁用', () => {
      const b = limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 10, dailyQuota: 0 })
      assert.equal(limiter.setBucketActive(b.id, false), true)
      assert.equal(limiter.setBucketActive(b.id, true), true)
    })

    it('不存在 = false', () => {
      assert.equal(limiter.setBucketActive('non-existent', false), false)
    })
  })

  describe('peek', () => {
    it('返回当前状态', () => {
      limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 10, dailyQuota: 0 })
      const r = limiter.peek('t1', '/api/x', Date.now())
      assert.equal(r.qps, 10)
      assert.equal(r.allowed, true)
    })
  })

  describe('多租户隔离', () => {
    it('T1 不影响 T2', () => {
      limiter.createBucket({ tenantId: 't1', endpoint: '/api/x', qps: 2, dailyQuota: 0 })
      limiter.createBucket({ tenantId: 't2', endpoint: '/api/x', qps: 2, dailyQuota: 0 })
      // t1 用满
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1000 })
      limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1100 })
      assert.equal(limiter.check({ tenantId: 't1', endpoint: '/api/x', now: 1200 }).allowed, false)
      // t2 不受影响
      assert.equal(limiter.check({ tenantId: 't2', endpoint: '/api/x', now: 1000 }).allowed, true)
    })
  })
})