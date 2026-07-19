import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { RateLimiter } from './rate-limiter'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'

describe('RateLimiter - 滑动窗口限流', () => {
  let adapter: RateLimitAdapter
  let limiter: RateLimiter

  beforeEach(() => {
    adapter = new RateLimitAdapter()
    limiter = new RateLimiter(adapter)
  })

  it('createBucket 创建新的限流桶', () => {
    const bucket = limiter.createBucket({
      tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 1000
    })
    assert.ok(bucket.id)
    assert.equal(bucket.active, true)
  })

  it('check 无桶配置 → 不限流', () => {
    const result = limiter.check({ tenantId: 't-001', endpoint: '/api/orders' })
    assert.equal(result.allowed, true)
    assert.equal(result.remaining, -1)
  })

  it('check QPS 未超 → 允许通过', () => {
    limiter.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 5, dailyQuota: 100 })
    const result = limiter.check({ tenantId: 't-001', endpoint: '/api/orders' })
    assert.equal(result.allowed, true)
  })

  it('check QPS 超限 → 拒绝 + retryAfter', () => {
    limiter.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 2, dailyQuota: 100 })
    // 发送 2 个请求 (填满 QPS 窗口)
    const now = Date.now()
    limiter.check({ tenantId: 't-001', endpoint: '/api/orders', now })
    limiter.check({ tenantId: 't-001', endpoint: '/api/orders', now })
    const result = limiter.check({ tenantId: 't-001', endpoint: '/api/orders', now })
    assert.equal(result.allowed, false)
    assert.equal(result.reason, 'qps_exceeded')
    assert.ok(typeof result.retryAfter === 'number')
  })

  it('check bucket_disabled → 拒绝', () => {
    const bucket = limiter.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 100 })
    limiter.setBucketActive(bucket.id, false)
    const result = limiter.check({ tenantId: 't-001', endpoint: '/api/orders' })
    assert.equal(result.allowed, false)
    assert.equal(result.reason, 'bucket_disabled')
  })

  it('peek 只读检查不记录请求', () => {
    limiter.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 3, dailyQuota: 100 })
    const p1 = limiter.peek('t-001', '/api/orders')
    assert.equal(p1.qps, 3)
    assert.equal(p1.dailyUsed, 0)
    assert.equal(p1.allowed, true)
  })

  it('setBucketActive 启用/禁用桶', () => {
    const bucket = limiter.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 100 })
    const r1 = limiter.setBucketActive(bucket.id, false)
    assert.equal(r1, true)
    const r2 = limiter.setBucketActive('non_existent', false)
    assert.equal(r2, false)
  })

  it('同 tenant 不同 endpoint 独立限流', () => {
    limiter.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 1, dailyQuota: 100 })
    limiter.createBucket({ tenantId: 't-001', endpoint: '/api/members', qps: 1, dailyQuota: 100 })
    const now = Date.now()
    limiter.check({ tenantId: 't-001', endpoint: '/api/orders', now })
    const r1 = limiter.check({ tenantId: 't-001', endpoint: '/api/orders', now })
    assert.equal(r1.allowed, false) // orders 超限
    const r2 = limiter.check({ tenantId: 't-001', endpoint: '/api/members', now })
    assert.equal(r2.allowed, true) // members 未超
  })
})

describe('RateLimitAdapter - 数据层', () => {
  let adapter: RateLimitAdapter

  beforeEach(() => {
    adapter = new RateLimitAdapter()
  })

  it('saveBucket + queryBucket 保存和查询', () => {
    adapter.saveBucket({ id: 'b1', tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 1000, windowMs: 60000, active: true, createdAt: '2025-01-01' })
    const found = adapter.queryBucket('b1')
    assert.ok(found)
    assert.equal(found!.tenantId, 't-001')
  })

  it('queryBucketByTenant 按租户+endpoint 查找', () => {
    adapter.saveBucket({ id: 'b1', tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 1000, windowMs: 60000, active: true, createdAt: '2025-01-01' })
    adapter.saveBucket({ id: 'b2', tenantId: 't-002', endpoint: '/api/orders', qps: 5, dailyQuota: 500, windowMs: 60000, active: true, createdAt: '2025-01-01' })
    assert.equal(adapter.queryBucketByTenant('t-001', '/api/orders')!.qps, 10)
    assert.equal(adapter.queryBucketByTenant('t-001', '/api/members'), null)
  })

  it('queryInWindow 滑动窗口查询', () => {
    adapter.recordRequest({ id: 'r1', tenantId: 't-001', endpoint: '/api/orders', timestamp: 2000, weight: 1 })
    adapter.recordRequest({ id: 'r2', tenantId: 't-001', endpoint: '/api/orders', timestamp: 4000, weight: 1 })
    adapter.recordRequest({ id: 'r3', tenantId: 't-002', endpoint: '/api/orders', timestamp: 3000, weight: 1 })
    const inWindow = adapter.queryInWindow('t-001', '/api/orders', 5000, 5000)
    assert.equal(inWindow.length, 2)
  })

  it('queryDailyUsage 日配额统计', () => {
    adapter.recordRequest({ id: 'r1', tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders', timestamp: 100, weight: 1 })
    adapter.recordRequest({ id: 'r2', tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders', timestamp: 200, weight: 1 })
    adapter.recordRequest({ id: 'r3', tenantId: 't-001', keyId: 'sk_live_b', endpoint: '/api/orders', timestamp: 150, weight: 1 })
    const used = adapter.queryDailyUsage('t-001', 'sk_live_a', 0, 1000)
    assert.equal(used, 2)
  })

  it('cleanupExpired 清理过期记录', () => {
    adapter.recordRequest({ id: 'r1', tenantId: 't-001', endpoint: '/api/orders', timestamp: 100, weight: 1 })
    adapter.recordRequest({ id: 'r2', tenantId: 't-001', endpoint: '/api/orders', timestamp: 200, weight: 1 })
    const count = adapter.cleanupExpired(150)
    assert.equal(count, 1) // r1 被清理
  })

  it('reset 清空所有数据', () => {
    adapter.seedBuckets([{ id: 'b1', tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 1000, windowMs: 60000, active: true, createdAt: '2025-01-01' }])
    adapter.reset()
    assert.equal(adapter.queryBucketByTenant('t-001', '/api/orders'), null)
  })
})
