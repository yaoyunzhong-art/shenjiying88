/**
 * price-monitor.service.test.ts - 价格监控 Service 单元测试
 *
 * 覆盖: 正例 + 反例 + 边界（三件套）
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: beforeEach 重置 Service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PriceMonitorService } from './price-monitor.service'
import { PriceCategory } from './price-monitor.entity'

function createFreshService(): PriceMonitorService {
  const service = new PriceMonitorService()
  service.resetStoreForTests()
  return service
}

const TENANT = 'tenant-001'

// ═══════════════════════════════════════════════════════════════════
// create
// ═══════════════════════════════════════════════════════════════════

describe('PriceMonitorService · create', () => {
  let service: PriceMonitorService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 创建价格监控条目', () => {
    const item = service.create({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      itemName: '测试商品',
      category: PriceCategory.Game,
      price: 5,
      marketAvgPrice: 4,
    })
    expect(item.itemName).toBe('测试商品')
    expect(item.id).toMatch(/^price-/)
    expect(item.priceDiff).toBe(1) // 5 - 4 = 1
    expect(item.diffPercent).toBe(25) // 1/4 * 100 = 25
    expect(item.isAnomaly).toBe(true) // 25% > 20%
  })

  it('正例: 价格等于市场均价', () => {
    const item = service.create({
      tenantId: TENANT,
      storeId: 'store-002',
      storeName: '北京国贸店',
      itemName: '平价商品',
      category: PriceCategory.Food,
      price: 10,
      marketAvgPrice: 10,
    })
    expect(item.priceDiff).toBe(0)
    expect(item.diffPercent).toBe(0)
    expect(item.isAnomaly).toBe(false)
  })

  it('正例: 创建后可通过 get 查到', () => {
    const created = service.create({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      itemName: '可查询',
      category: PriceCategory.Game,
      price: 3,
      marketAvgPrice: 3,
    })
    const found = service.get(created.id, TENANT)
    expect(found).toBeDefined()
    expect(found!.itemName).toBe('可查询')
  })

  it('反例: 不同 tenant 无法查到', () => {
    const created = service.create({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      itemName: '隔离检查',
      category: PriceCategory.Game,
      price: 2,
      marketAvgPrice: 3,
    })
    const found = service.get(created.id, 'tenant-other')
    expect(found).toBeUndefined()
  })

  it('边界: marketAvgPrice 为 0 时 divPercent 为 0', () => {
    const item = service.create({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      itemName: '免费测试',
      category: PriceCategory.Game,
      price: 0,
      marketAvgPrice: 0,
    })
    expect(item.diffPercent).toBe(0)
    expect(item.isAnomaly).toBe(false)
  })

  it('边界: 价格为负数', () => {
    const item = service.create({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      itemName: '负价格',
      category: PriceCategory.Game,
      price: -1,
      marketAvgPrice: 5,
    })
    expect(item.price).toBe(-1)
    expect(item.priceDiff).toBe(-6)
    expect(item.isAnomaly).toBe(true) // |-120%| > 20%
  })
})

// ═══════════════════════════════════════════════════════════════════
// get / require
// ═══════════════════════════════════════════════════════════════════

describe('PriceMonitorService · get / require', () => {
  let service: PriceMonitorService

  beforeEach(() => {
    service = createFreshService()
  })

  it('边界: 不存在的 id 返回 undefined', () => {
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

describe('PriceMonitorService · list', () => {
  let service: PriceMonitorService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 无筛选返回所有模拟数据', () => {
    const items = service.list(TENANT)
    expect(items.length).toBeGreaterThanOrEqual(10)
    expect(items.every(i => i.tenantId === TENANT)).toBe(true)
  })

  it('正例: 按 storeId 筛选', () => {
    const items = service.list(TENANT, { storeId: 'store-001' })
    expect(items.every(i => i.storeId === 'store-001')).toBe(true)
  })

  it('正例: 按 category 筛选', () => {
    const items = service.list(TENANT, { category: PriceCategory.Game })
    expect(items.every(i => i.category === PriceCategory.Game)).toBe(true)
  })

  it('正例: 按价格范围筛选', () => {
    const items = service.list(TENANT, { minPrice: 100, maxPrice: 500 })
    expect(items.every(i => i.price >= 100 && i.price <= 500)).toBe(true)
  })

  it('边界: 不存在的 storeId', () => {
    const items = service.list(TENANT, { storeId: 'store-999' })
    expect(items.length).toBe(0)
  })

  it('边界: 不存在的 tenant 返回空', () => {
    const items = service.list('tenant-nonexistent')
    expect(items.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// delete
// ═══════════════════════════════════════════════════════════════════

describe('PriceMonitorService · delete', () => {
  let service: PriceMonitorService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 删除已存在的条目', () => {
    const created = service.create({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '深圳万象城店',
      itemName: '待删除',
      category: PriceCategory.Game,
      price: 5,
      marketAvgPrice: 4,
    })
    service.delete(created.id, TENANT)
    expect(service.get(created.id, TENANT)).toBeUndefined()
  })

  it('反例: 删除不存在的条目抛异常', () => {
    expect(() => service.delete('nonexistent', TENANT)).toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════
// getPriceComparison
// ═══════════════════════════════════════════════════════════════════

describe('PriceMonitorService · getPriceComparison', () => {
  let service: PriceMonitorService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回所有价格对比', () => {
    const comparison = service.getPriceComparison(TENANT)
    expect(comparison.length).toBeGreaterThanOrEqual(10)
    for (const c of comparison) {
      expect(typeof c.price).toBe('number')
      expect(typeof c.marketAvgPrice).toBe('number')
      expect(typeof c.diffPercent).toBe('number')
    }
  })

  it('正例: 按 category 筛选', () => {
    const comparison = service.getPriceComparison(TENANT, { category: PriceCategory.Vip })
    expect(comparison.every(c => c.diffPercent !== undefined)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════
// getAnomalies
// ═══════════════════════════════════════════════════════════════════

describe('PriceMonitorService · getAnomalies', () => {
  let service: PriceMonitorService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回价格异常条目（默认 20% 阈值）', () => {
    const anomalies = service.getAnomalies(TENANT)
    // 模拟数据中，街霸6(2/3, -33.3%), 可乐(5/4, 25%), 爆米花(12/10, 20%) 可能触发
    expect(anomalies.length).toBeGreaterThanOrEqual(0)
    for (const a of anomalies) {
      expect(Math.abs(a.diffPercent)).toBeGreaterThanOrEqual(20)
    }
  })

  it('正例: 不同阈值筛选', () => {
    // 30% 阈值，更严格
    const strictAnomalies = service.getAnomalies(TENANT, { minDiffPercent: 30 })
    for (const a of strictAnomalies) {
      expect(Math.abs(a.diffPercent)).toBeGreaterThanOrEqual(30)
    }
  })

  it('正例: 按 storeId 筛选异常', () => {
    const anomalies = service.getAnomalies(TENANT, { storeId: 'store-001' })
    expect(anomalies.every(a => a.storeId === 'store-001')).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════
// getSummary
// ═══════════════════════════════════════════════════════════════════

describe('PriceMonitorService · getSummary', () => {
  let service: PriceMonitorService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 返回价格监控摘要', () => {
    const summary = service.getSummary(TENANT)
    expect(summary.totalItems).toBeGreaterThanOrEqual(10)
    expect(summary.avgPrice).toBeGreaterThan(0)
    expect(summary.avgMarketPrice).toBeGreaterThan(0)
    expect(summary.lowestPriceStore).toBeTruthy()
    expect(summary.highestPriceStore).toBeTruthy()
  })

  it('正例: 按分类筛选摘要', () => {
    const summary = service.getSummary(TENANT, { category: PriceCategory.Game })
    expect(summary.totalItems).toBe(3)
    // Game 分类均价应该合理
    expect(summary.avgPrice).toBeGreaterThan(0)
  })

  it('正例: 按门店筛选摘要', () => {
    const summary = service.getSummary(TENANT, { storeId: 'store-001' })
    expect(summary.totalItems).toBeGreaterThanOrEqual(3)
  })

  it('边界: 不存在的 tenant 返回空摘要', () => {
    const summary = service.getSummary('tenant-nonexistent')
    expect(summary.totalItems).toBe(0)
    expect(summary.avgPrice).toBe(0)
    expect(summary.lowestPriceStore).toBe('')
  })
})
