/**
 * store-rank.service.test.ts - 门店排名 Service 单元测试
 *
 * 覆盖: 正例 + 反例 + 边界（三件套）
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: beforeEach 重置 Service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreRankService } from './store-rank.service'
import { RankPeriod, RankMetric } from './store-rank.entity'

function createFreshService(): StoreRankService {
  const service = new StoreRankService()
  service.resetStoreForTests()
  return service
}

const TENANT = 'tenant-001'

// ═══════════════════════════════════════════════════════════════════
// create
// ═══════════════════════════════════════════════════════════════════

describe('StoreRankService · create', () => {
  let service: StoreRankService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 创建一条 Revenue 排名', () => {
    const result = service.create({
      tenantId: TENANT,
      storeId: 'store-007',
      storeName: '测试店',
      rank: 1,
      prevRank: 2,
      revenue: 500000,
      growth: 10.5,
      satisfaction: 90,
      efficiency: 85,
      memberCount: 1000,
      deviceCount: 8,
      period: RankPeriod.Monthly,
      metric: RankMetric.Revenue,
    })
    expect(result.storeName).toBe('测试店')
    expect(result.id).toMatch(/^rank-/)
    expect(result.tenantId).toBe(TENANT)
    expect(result.createdAt).toBeTruthy()
  })

  it('正例: 创建后可通过 get 查到', () => {
    const created = service.create({
      tenantId: TENANT,
      storeId: 'store-007',
      storeName: '可查询店',
      rank: 2,
      prevRank: 3,
      revenue: 300000,
      growth: 8.0,
      satisfaction: 85,
      efficiency: 80,
      memberCount: 800,
      deviceCount: 5,
      period: RankPeriod.Weekly,
      metric: RankMetric.Growth,
    })
    const found = service.get(created.id, TENANT)
    expect(found).toBeDefined()
    expect(found!.storeName).toBe('可查询店')
  })

  it('反例: 不同 tenant 无法查到', () => {
    const created = service.create({
      tenantId: TENANT,
      storeId: 'store-007',
      storeName: '隔离测试',
      rank: 1,
      prevRank: 1,
      revenue: 100000,
      growth: 5.0,
      satisfaction: 80,
      efficiency: 75,
      memberCount: 500,
      deviceCount: 3,
      period: RankPeriod.Monthly,
      metric: RankMetric.Revenue,
    })
    const found = service.get(created.id, 'tenant-other')
    expect(found).toBeUndefined()
  })

  it('边界: revenue 为 0 的排名', () => {
    const result = service.create({
      tenantId: TENANT,
      storeId: 'store-008',
      storeName: '新店',
      rank: 10,
      prevRank: 0,
      revenue: 0,
      growth: 0,
      satisfaction: 0,
      efficiency: 0,
      memberCount: 0,
      deviceCount: 0,
      period: RankPeriod.Monthly,
      metric: RankMetric.Revenue,
    })
    expect(result.revenue).toBe(0)
    expect(result.rank).toBe(10)
  })
})

// ═══════════════════════════════════════════════════════════════════
// get / require
// ═══════════════════════════════════════════════════════════════════

describe('StoreRankService · get / require', () => {
  let service: StoreRankService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 不存在的 id 返回 undefined', () => {
    const result = service.get('nonexistent', TENANT)
    expect(result).toBeUndefined()
  })

  it('反例: require 不存在的 id 抛异常', () => {
    expect(() => service.require('nonexistent', TENANT)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// list
// ═══════════════════════════════════════════════════════════════════

describe('StoreRankService · list', () => {
  let service: StoreRankService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 无筛选返回所有模拟数据', () => {
    const result = service.list(TENANT)
    expect(result.length).toBeGreaterThanOrEqual(8)
    expect(result.every(r => r.tenantId === TENANT)).toBe(true)
  })

  it('正例: 按 metric 筛选', () => {
    const revenue = service.list(TENANT, { sortBy: RankMetric.Revenue })
    expect(revenue.every(r => r.metric === RankMetric.Revenue)).toBe(true)
    // 按 revenue 降序
    for (let i = 1; i < revenue.length; i++) {
      expect(revenue[i - 1].revenue).toBeGreaterThanOrEqual(revenue[i].revenue)
    }
  })

  it('正例: 按 period 筛选', () => {
    const result = service.list(TENANT, { period: RankPeriod.Monthly })
    expect(result.every(r => r.period === RankPeriod.Monthly)).toBe(true)
  })

  it('正例: limit 限制返回数量', () => {
    const result = service.list(TENANT, { limit: 3 })
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('正例: Growth 维度按 growth 降序', () => {
    const result = service.list(TENANT, { sortBy: RankMetric.Growth })
    expect(result.every(r => r.metric === RankMetric.Growth)).toBe(true)
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].growth).toBeGreaterThanOrEqual(result[i].growth)
    }
  })

  it('边界: 不存在的 tenant 返回空', () => {
    const result = service.list('tenant-nonexistent')
    expect(result.length).toBe(0)
  })

  it('边界: limit 为 0 时返回全部（filter.limit 为 falsy）', () => {
    const result = service.list(TENANT, { limit: 0 })
    // limit=0 是 falsy，service 视同未传 limit，返回全部
    expect(result.length).toBeGreaterThanOrEqual(8)
  })
})

// ═══════════════════════════════════════════════════════════════════
// delete
// ═══════════════════════════════════════════════════════════════════

describe('StoreRankService · delete', () => {
  let service: StoreRankService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 删除已存在的排名', () => {
    const created = service.create({
      tenantId: TENANT,
      storeId: 'store-007',
      storeName: '待删除',
      rank: 5,
      prevRank: 4,
      revenue: 200000,
      growth: 3.0,
      satisfaction: 80,
      efficiency: 75,
      memberCount: 300,
      deviceCount: 4,
      period: RankPeriod.Monthly,
      metric: RankMetric.Revenue,
    })
    service.delete(created.id, TENANT)
    expect(service.get(created.id, TENANT)).toBeUndefined()
  })

  it('反例: 删除不存在的排名抛异常', () => {
    expect(() => service.delete('nonexistent', TENANT)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// getRankChanges
// ═══════════════════════════════════════════════════════════════════

describe('StoreRankService · getRankChanges', () => {
  let service: StoreRankService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回排名变化列表', () => {
    const changes = service.getRankChanges(TENANT)
    expect(changes.length).toBeGreaterThan(0)
    for (const c of changes) {
      expect(c.storeId).toBeTruthy()
      expect(typeof c.change).toBe('number')
    }
  })

  it('正例: 按 storeId 筛选', () => {
    const changes = service.getRankChanges(TENANT, 'store-001')
    expect(changes.every(c => c.storeId === 'store-001')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════
// getSummary
// ═══════════════════════════════════════════════════════════════════

describe('StoreRankService · getSummary', () => {
  let service: StoreRankService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回摘要包含有效数据', () => {
    const summary = service.getSummary(TENANT)
    expect(summary.totalStores).toBeGreaterThan(0)
    expect(summary.topStore).toBeTruthy()
    expect(typeof summary.improvedStores).toBe('number')
    expect(typeof summary.declinedStores).toBe('number')
  })

  it('正例: metric 筛选影响结果', () => {
    const revenueSummary = service.getSummary(TENANT, RankMetric.Revenue)
    expect(revenueSummary.totalStores).toBeGreaterThanOrEqual(3)
  })

  it('边界: 不存在的 tenant 返回默认值', () => {
    const summary = service.getSummary('tenant-nonexistent')
    expect(summary.totalStores).toBe(0)
    expect(summary.topStore).toBe('N/A')
    expect(summary.avgRevenue).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// computeRanking
// ═══════════════════════════════════════════════════════════════════

describe('StoreRankService · computeRanking', () => {
  let service: StoreRankService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 为所有 4 个维度生成排名', () => {
    const results = service.computeRanking({
      tenantId: TENANT,
      storeId: 'store-007',
      storeName: '新门店',
      revenue: 900000,
      growth: 6.5,
      satisfaction: 88,
      efficiency: 82,
      memberCount: 2000,
      deviceCount: 10,
      period: RankPeriod.Monthly,
    })
    // 应为 4 条（Revenu / Growth / Satisfaction / Efficiency）
    expect(results.length).toBe(4)
    const metrics = new Set(results.map(r => r.metric))
    expect(metrics.has(RankMetric.Revenue)).toBe(true)
    expect(metrics.has(RankMetric.Growth)).toBe(true)
    expect(metrics.has(RankMetric.Satisfaction)).toBe(true)
    expect(metrics.has(RankMetric.Efficiency)).toBe(true)
  })

  it('正例: 每条排名都有 rank 和 prevRank', () => {
    const results = service.computeRanking({
      tenantId: TENANT,
      storeId: 'store-007',
      storeName: '新门店',
      revenue: 500000,
      growth: 4.0,
      satisfaction: 85,
      efficiency: 80,
      memberCount: 1500,
      deviceCount: 8,
      period: RankPeriod.Monthly,
    })
    for (const r of results) {
      expect(r.rank).toBeGreaterThanOrEqual(1)
      expect(typeof r.prevRank).toBe('number')
    }
  })
})
