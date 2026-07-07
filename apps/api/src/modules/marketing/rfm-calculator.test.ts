import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { RFMCalculator } from './rfm-calculator'
import { RFMAdapter } from './datasources/rfm.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'

describe('RFMCalculator', () => {
  let rfm: RFMCalculator
  let member: MemberAdapter
  let order: OrderAdapter

  const NOW = new Date('2025-06-15T00:00:00Z').getTime()

  beforeEach(() => {
    member = new MemberAdapter()
    order = new OrderAdapter()
    rfm = new RFMCalculator(new RFMAdapter(), member, order)
  })

  it('Champions: 高 R + 高 F + 高 M', () => {
    member.seed([{
      id: 'm1', tenantId: 't1', level: 'GOLD',
      lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 10,
      lastActiveAt: new Date(NOW - 10 * 86400000).toISOString(),
      createdAt: new Date(NOW - 365 * 86400000).toISOString()
    }])
    // 10 笔订单 都在 90 天内
    const orders = Array.from({ length: 10 }, (_, i) => ({
      id: `o${i}`, tenantId: 't1', memberId: 'm1', totalCents: 12000,
      status: 'COMPLETED' as const,
      createdAt: new Date(NOW - i * 5 * 86400000).toISOString()
    }))
    order.seed(orders)

    const p = rfm.computeForMember('t1', 'm1', NOW)
    assert.ok(p)
    assert.equal(p!.segment, 'CHAMPIONS')
    assert.equal(p!.recency, 'RECENT_30D')
    assert.equal(p!.frequency, 'HIGH')
    assert.equal(p!.monetary, 'HIGH')
  })

  it('Loyal: 高 F + 高 M (老客户)', () => {
    member.seed([{
      id: 'm2', tenantId: 't1', level: 'PLATINUM',
      lifecycleStage: 'ACTIVE', totalSpendCents: 200000, orderCount: 50,
      lastActiveAt: new Date(NOW - 50 * 86400000).toISOString(),
      createdAt: new Date(NOW - 730 * 86400000).toISOString()
    }])
    const orders = Array.from({ length: 50 }, (_, i) => ({
      id: `o${i}`, tenantId: 't1', memberId: 'm2', totalCents: 20000,
      status: 'COMPLETED' as const,
      createdAt: new Date(NOW - (50 + i) * 86400000).toISOString()  // 50-100d 前
    }))
    order.seed(orders)

    const p = rfm.computeForMember('t1', 'm2', NOW)
    assert.ok(p)
    assert.equal(p!.segment, 'LOYAL')
  })

  it('Recent: 高 R + 低 F + 低 M (新客户)', () => {
    member.seed([{
      id: 'm3', tenantId: 't1', level: 'BRONZE',
      lifecycleStage: 'NEW', totalSpendCents: 5000, orderCount: 1,
      lastActiveAt: new Date(NOW - 5 * 86400000).toISOString(),
      createdAt: new Date(NOW - 30 * 86400000).toISOString()
    }])
    order.seed([{
      id: 'o1', tenantId: 't1', memberId: 'm3', totalCents: 5000,
      status: 'COMPLETED',
      createdAt: new Date(NOW - 5 * 86400000).toISOString()
    }])

    const p = rfm.computeForMember('t1', 'm3', NOW)
    assert.ok(p)
    assert.equal(p!.segment, 'RECENT')
  })

  it('At Risk: 低 R + 高 F + 高 M (流失风险)', () => {
    member.seed([{
      id: 'm4', tenantId: 't1', level: 'GOLD',
      lifecycleStage: 'DORMANT', totalSpendCents: 80000, orderCount: 20,
      lastActiveAt: new Date(NOW - 120 * 86400000).toISOString(),
      createdAt: new Date(NOW - 365 * 86400000).toISOString()
    }])
    // 20 笔订单 在 95-150d 前 (高频, 但最近不活跃)
    const orders = Array.from({ length: 20 }, (_, i) => ({
      id: `o${i}`, tenantId: 't1', memberId: 'm4', totalCents: 5000,
      status: 'COMPLETED' as const,
      createdAt: new Date(NOW - (95 + i * 3) * 86400000).toISOString()
    }))
    order.seed(orders)

    const p = rfm.computeForMember('t1', 'm4', NOW)
    assert.ok(p)
    console.log('AT_RISK_TEST:', JSON.stringify({ seg: p!.segment, r: p!.recency, f: p!.frequency, m: p!.monetary, daysSinceLast: p!.daysSinceLastOrder, orderCount90d: p!.orderCount90d }))
    assert.equal(p!.segment, 'AT_RISK')
  })

  it('Hibernating: 低 R + 低 F + 低 M (休眠)', () => {
    member.seed([{
      id: 'm5', tenantId: 't1', level: 'BRONZE',
      lifecycleStage: 'CHURNED', totalSpendCents: 2000, orderCount: 1,
      lastActiveAt: new Date(NOW - 365 * 86400000).toISOString(),
      createdAt: new Date(NOW - 730 * 86400000).toISOString()
    }])
    order.seed([{
      id: 'o1', tenantId: 't1', memberId: 'm5', totalCents: 2000,
      status: 'COMPLETED',
      createdAt: new Date(NOW - 365 * 86400000).toISOString()
    }])

    const p = rfm.computeForMember('t1', 'm5', NOW)
    assert.ok(p)
    assert.equal(p!.segment, 'HIBERNATING')
  })

  it('无订单会员 → HIBERNATING', () => {
    member.seed([{
      id: 'm6', tenantId: 't1', level: 'BRONZE',
      lifecycleStage: 'NEW', totalSpendCents: 0, orderCount: 0,
      lastActiveAt: new Date(NOW).toISOString(),
      createdAt: new Date(NOW).toISOString()
    }])
    const p = rfm.computeForMember('t1', 'm6', NOW)
    assert.ok(p)
    assert.equal(p!.segment, 'HIBERNATING')
    assert.equal(p!.frequency, 'NONE')
  })

  it('不存在会员 → null', () => {
    const p = rfm.computeForMember('t1', 'non-existent')
    assert.equal(p, null)
  })

  it('租户隔离: T1 看不到 T2 会员', () => {
    member.seed([{
      id: 'm1', tenantId: 't1', level: 'GOLD',
      lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 10,
      lastActiveAt: new Date(NOW).toISOString(),
      createdAt: new Date(NOW).toISOString()
    }])
    const p = rfm.computeForMember('t2', 'm1', NOW)
    assert.equal(p, null)
  })

  it('computeForTenant 批量', () => {
    member.seed([
      { id: 'm1', tenantId: 't1', level: 'GOLD', lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 10, lastActiveAt: new Date(NOW).toISOString(), createdAt: new Date(NOW).toISOString() },
      { id: 'm2', tenantId: 't1', level: 'BRONZE', lifecycleStage: 'NEW', totalSpendCents: 0, orderCount: 0, lastActiveAt: new Date(NOW).toISOString(), createdAt: new Date(NOW).toISOString() },
      { id: 'm3', tenantId: 't2', level: 'GOLD', lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 10, lastActiveAt: new Date(NOW).toISOString(), createdAt: new Date(NOW).toISOString() }
    ])
    const profiles = rfm.computeForTenant('t1')
    assert.equal(profiles.length, 2)  // T2 的 m3 不应被计算
  })

  it('getStats: 8 分群统计', () => {
    member.seed([
      { id: 'm1', tenantId: 't1', level: 'GOLD', lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 10, lastActiveAt: new Date(NOW).toISOString(), createdAt: new Date(NOW).toISOString() },
      { id: 'm2', tenantId: 't1', level: 'BRONZE', lifecycleStage: 'NEW', totalSpendCents: 0, orderCount: 0, lastActiveAt: new Date(NOW).toISOString(), createdAt: new Date(NOW).toISOString() }
    ])
    rfm.computeForTenant('t1')
    const stats = rfm.getStats('t1')
    assert.equal(stats.totalMembers, 2)
    assert.ok(stats.segmentDistribution)
  })

  it('isDistributionHealthy: 单分群占比 < 70%', () => {
    member.seed(Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`, tenantId: 't1', level: 'GOLD',
      lifecycleStage: 'ACTIVE', totalSpendCents: 100000, orderCount: 10,
      lastActiveAt: new Date(NOW).toISOString(),
      createdAt: new Date(NOW).toISOString()
    })))
    rfm.computeForTenant('t1')
    const stats = rfm.getStats('t1')
    // 100% 在 CHAMPIONS → 不健康
    assert.equal(rfm.isDistributionHealthy(stats), false)
  })

  it('isDistributionHealthy: 样本 < 10 → false', () => {
    const stats = rfm.getStats('t1')
    assert.equal(rfm.isDistributionHealthy(stats), false)
  })
})