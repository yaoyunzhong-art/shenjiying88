import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { UsageService } from './usage.service'
import { RateLimiter } from '../rate-limiter'
import { QuotaAdapter } from '../datasources/quota.adapter'
import { RateLimitAdapter } from '../datasources/rate-limit.adapter'

describe('UsageService - 用量统计业务层', () => {
  let rateLimitAdapter: RateLimitAdapter
  let quotaAdapter: QuotaAdapter
  let service: UsageService

  beforeEach(() => {
    rateLimitAdapter = new RateLimitAdapter()
    quotaAdapter = new QuotaAdapter()
    service = new UsageService(
      new RateLimiter(rateLimitAdapter),
      quotaAdapter,
      rateLimitAdapter
    )
  })

  it('createBucket 创建限流桶', () => {
    const bucket = service.createBucket({
      tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 1000
    })
    assert.ok(bucket.id)
    assert.equal(bucket.active, true)
  })

  it('setBucketActive 启用/禁用桶', () => {
    const bucket = service.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 1000 })
    assert.equal(service.setBucketActive(bucket.id, false), true)
    assert.equal(service.setBucketActive('nonexistent', false), false)
  })

  it('checkRequest 通过后累加日配额', () => {
    service.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 100, dailyQuota: 1000 })
    const result = service.checkRequest({ tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders' })
    assert.equal(result.allowed, true)
    const today = new Date().toISOString().slice(0, 10)
    const usage = service.getUsage('t-001', 'sk_live_a', today)
    assert.ok(usage)
    assert.equal(usage!.usedCount, 1)
  })

  it('checkRequest QPS 超限 → 拒绝', () => {
    service.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 1, dailyQuota: 100 })
    const now = Date.now()
    service.checkRequest({ tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders' })
    const result = service.checkRequest({ tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders' })
    assert.equal(result.allowed, false)
    assert.equal(result.reason, 'qps_exceeded')
  })

  it('getUsage 返回当前用量', () => {
    service.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 100 })
    service.checkRequest({ tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders' })
    service.checkRequest({ tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders' })
    const today = new Date().toISOString().slice(0, 10)
    const usage = service.getUsage('t-001', 'sk_live_a', today)
    assert.equal(usage!.usedCount, 2)
    assert.equal(usage!.remainingCount, 98)
  })

  it('listBuckets 列出租户所有桶', () => {
    service.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 100 })
    service.createBucket({ tenantId: 't-001', endpoint: '/api/members', qps: 5, dailyQuota: 50 })
    service.createBucket({ tenantId: 't-002', endpoint: '/api/orders', qps: 20, dailyQuota: 200 })
    const buckets = service.listBuckets('t-001')
    assert.equal(buckets.length, 2)
  })

  it('report 生成聚合报表', () => {
    service.createBucket({ tenantId: 't-001', endpoint: '/api/orders', qps: 10, dailyQuota: 100 })
    service.createBucket({ tenantId: 't-001', endpoint: '/api/members', qps: 5, dailyQuota: 50 })
    service.checkRequest({ tenantId: 't-001', keyId: 'sk_live_a', endpoint: '/api/orders' })
    const r = service.report('t-001')
    assert.equal(r.totalBuckets, 2)
    assert.equal(r.activeBuckets, 2)
    assert.equal(r.totalUsageToday, 1)
    assert.equal(r.overageKeys, 0)
  })
})

describe('QuotaAdapter - 数据层', () => {
  let adapter: QuotaAdapter

  beforeEach(() => {
    adapter = new QuotaAdapter()
  })

  it('save + query 保存和查询', () => {
    adapter.save({ id: 'q1', tenantId: 't-001', keyId: 'sk_live_a', periodKey: '2025-06-01', usedCount: 10, remainingCount: 90, overageCount: 0 })
    const found = adapter.query('q1')
    assert.ok(found)
    assert.equal(found!.usedCount, 10)
  })

  it('queryByPeriod 按时间段查询', () => {
    adapter.save({ id: 'q1', tenantId: 't-001', keyId: 'sk_live_a', periodKey: '2025-06-01', usedCount: 5, remainingCount: 95, overageCount: 0 })
    assert.ok(adapter.queryByPeriod('t-001', 'sk_live_a', '2025-06-01'))
    assert.equal(adapter.queryByPeriod('t-001', 'sk_live_a', '2025-06-02'), null)
  })

  it('increment 累加用量', () => {
    adapter.increment('t-001', 'sk_live_a', '2025-06-01', 10)
    adapter.increment('t-001', 'sk_live_a', '2025-06-01', 10)
    const usage = adapter.queryByPeriod('t-001', 'sk_live_a', '2025-06-01')
    assert.equal(usage!.usedCount, 2)
    assert.equal(usage!.remainingCount, 8)
    assert.equal(usage!.overageCount, 0)
  })

  it('increment 超过配额 → 超额', () => {
    adapter.increment('t-001', 'sk_live_a', '2025-06-01', 3)
    adapter.increment('t-001', 'sk_live_a', '2025-06-01', 3)
    adapter.increment('t-001', 'sk_live_a', '2025-06-01', 3)
    adapter.increment('t-001', 'sk_live_a', '2025-06-01', 3) // 第4次超了
    const usage = adapter.queryByPeriod('t-001', 'sk_live_a', '2025-06-01')
    assert.equal(usage!.overageCount, 1)
    assert.equal(usage!.remainingCount, 0)
  })

  it('queryByTenant 按租户列出', () => {
    adapter.save({ id: 'q1', tenantId: 't-001', keyId: 'sk_live_a', periodKey: '2025-06-01', usedCount: 5, remainingCount: 95, overageCount: 0 })
    adapter.save({ id: 'q2', tenantId: 't-001', keyId: 'sk_live_b', periodKey: '2025-06-01', usedCount: 3, remainingCount: 97, overageCount: 0 })
    adapter.save({ id: 'q3', tenantId: 't-002', keyId: 'sk_live_c', periodKey: '2025-06-01', usedCount: 1, remainingCount: 99, overageCount: 0 })
    assert.equal(adapter.queryByTenant('t-001').length, 2)
    assert.equal(adapter.queryByTenant('t-002').length, 1)
  })

  it('reset 清空所有数据', () => {
    adapter.seed([{ id: 'q1', tenantId: 't-001', keyId: 'sk_live_a', periodKey: '2025-06-01', usedCount: 5, remainingCount: 95, overageCount: 0 }])
    adapter.reset()
    assert.equal(adapter.queryByTenant('t-001').length, 0)
  })
})
