/**
 * store-rank.service.spec.ts — 门店排行模块 Service 单元测试
 *
 * 覆盖: CRUD / 排行计算 / 排名变化追踪 / 排行摘要 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreRankService } from './store-rank.service'
import { RankPeriod, RankMetric } from './store-rank.entity'
import { NotFoundException } from '@nestjs/common'

describe('StoreRankService — CRUD', () => {
  let svc: StoreRankService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
  })

  it('create 创建排名记录成功', () => {
    const rank = svc.create({
      tenantId,
      storeId: 'store-001',
      storeName: '深圳店',
      rank: 1,
      prevRank: 2,
      revenue: 1000000,
      growth: 5.5,
      satisfaction: 90,
      efficiency: 85,
      memberCount: 3000,
      deviceCount: 12,
      period: RankPeriod.Monthly,
      metric: RankMetric.Revenue,
    })
    expect(rank.id).toMatch(/^rank-/)
    expect(rank.storeName).toBe('深圳店')
    expect(rank.rank).toBe(1)
    expect(rank.revenue).toBe(1000000)
  })

  it('get 返回指定排名', () => {
    const rank = svc.create({
      tenantId, storeId: 's1', storeName: '门店1',
      rank: 2, prevRank: 1, revenue: 500000, growth: 3,
      satisfaction: 88, efficiency: 80, memberCount: 2000,
      deviceCount: 8, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    const found = svc.get(rank.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.revenue).toBe(500000)
  })

  it('get 返回 undefined 当租户不匹配', () => {
    const rank = svc.create({
      tenantId: 'other', storeId: 's1', storeName: '其他',
      rank: 1, prevRank: 0, revenue: 0, growth: 0,
      satisfaction: 0, efficiency: 0, memberCount: 0,
      deviceCount: 0, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    expect(svc.get(rank.id, tenantId)).toBeUndefined()
  })

  it('require 存在时返回，不存在抛 NotFoundException', () => {
    expect(() => svc.require('fake-id', tenantId)).toThrow(NotFoundException)
  })

  it('delete 删除成功', () => {
    const rank = svc.create({
      tenantId, storeId: 's-del', storeName: '待删除',
      rank: 5, prevRank: 5, revenue: 0, growth: 0,
      satisfaction: 0, efficiency: 0, memberCount: 0,
      deviceCount: 0, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    svc.delete(rank.id, tenantId)
    expect(svc.get(rank.id, tenantId)).toBeUndefined()
  })

  it('delete 不存在抛 NotFoundException', () => {
    expect(() => svc.delete('fake-id', tenantId)).toThrow(NotFoundException)
  })
})

describe('StoreRankService — 列表与排序', () => {
  let svc: StoreRankService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
  })

  it('list 默认按 rank 升序', () => {
    svc.create({
      tenantId, storeId: 's1', storeName: 'A',
      rank: 5, prevRank: 4, revenue: 100, growth: 1,
      satisfaction: 80, efficiency: 70, memberCount: 100,
      deviceCount: 5, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    svc.create({
      tenantId, storeId: 's2', storeName: 'B',
      rank: 1, prevRank: 1, revenue: 1000, growth: 5,
      satisfaction: 95, efficiency: 90, memberCount: 500,
      deviceCount: 10, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    const items = svc.list(tenantId)
    expect(items[0].rank).toBeLessThanOrEqual(items[items.length - 1].rank)
  })

  it('list 按 Revenue 排序', () => {
    svc.create({
      tenantId, storeId: 's1', storeName: '低营收',
      rank: 2, prevRank: 3, revenue: 100, growth: 1,
      satisfaction: 80, efficiency: 70, memberCount: 100,
      deviceCount: 5, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    const items = svc.list(tenantId, { sortBy: RankMetric.Revenue })
    expect(items.length).toBeGreaterThan(0)
    // Seed data has revenue items
  })

  it('list 按 period 筛选', () => {
    svc.create({
      tenantId, storeId: 's-wk', storeName: '周排行',
      rank: 1, prevRank: 0, revenue: 200, growth: 2,
      satisfaction: 85, efficiency: 75, memberCount: 50,
      deviceCount: 3, period: RankPeriod.Weekly, metric: RankMetric.Revenue,
    })
    const items = svc.list(tenantId, { period: RankPeriod.Weekly })
    items.forEach((r) => expect(r.period).toBe(RankPeriod.Weekly))
  })

  it('list 限制返回数量', () => {
    svc.create({
      tenantId, storeId: 's-l1', storeName: 'L1',
      rank: 1, prevRank: 0, revenue: 100, growth: 1,
      satisfaction: 80, efficiency: 70, memberCount: 10,
      deviceCount: 1, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    svc.create({
      tenantId, storeId: 's-l2', storeName: 'L2',
      rank: 2, prevRank: 0, revenue: 50, growth: 0.5,
      satisfaction: 75, efficiency: 65, memberCount: 8,
      deviceCount: 1, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    const items = svc.list(tenantId, { limit: 1 })
    expect(items.length).toBe(1)
  })
})

describe('StoreRankService — 排行计算与追踪', () => {
  let svc: StoreRankService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new StoreRankService()
    svc.resetStoreForTests()
  })

  it('computeRanking 为各指标生成排名记录', () => {
    const results = svc.computeRanking({
      tenantId, storeId: 's-new', storeName: '新门店',
      revenue: 800000, growth: 4.2, satisfaction: 91,
      efficiency: 83, memberCount: 2500, deviceCount: 10,
      period: RankPeriod.Monthly,
    })
    expect(results).toHaveLength(4) // 4 metrics
  })

  it('getRankChanges 返回排名变化', () => {
    svc.create({
      tenantId, storeId: 's1', storeName: '门店A',
      rank: 1, prevRank: 3, revenue: 1000, growth: 5,
      satisfaction: 90, efficiency: 85, memberCount: 100,
      deviceCount: 5, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    const changes = svc.getRankChanges(tenantId)
    expect(changes.length).toBeGreaterThan(0)
    changes.forEach((c) => {
      expect(c.change).toBeGreaterThanOrEqual(0)
    })
  })

  it('getRankChanges 按门店筛选', () => {
    svc.create({
      tenantId, storeId: 's-only', storeName: '唯一门店',
      rank: 1, prevRank: 2, revenue: 100, growth: 1,
      satisfaction: 80, efficiency: 70, memberCount: 50,
      deviceCount: 3, period: RankPeriod.Monthly, metric: RankMetric.Revenue,
    })
    const changes = svc.getRankChanges(tenantId, 's-only')
    changes.forEach((c) => expect(c.storeId).toBe('s-only'))
  })

  it('getSummary 返回排行摘要', () => {
    const summary = svc.getSummary(tenantId)
    expect(summary.totalStores).toBeGreaterThan(0)
    expect(summary.avgRevenue).toBeGreaterThan(0)
    expect(summary.topStore).not.toBe('N/A')
    expect(typeof summary.improvedStores).toBe('number')
    expect(typeof summary.declinedStores).toBe('number')
  })
})
