/**
 * price-monitor.service.spec.ts — 价格监控 Service 单元测试 (V23)
 *
 * 覆盖: create / get / require / list / delete /
 *       getPriceComparison / getAnomalies / getSummary
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PriceMonitorService } from './price-monitor.service'
import { PriceCategory } from './price-monitor.entity'

const TENANT_ID = 'tenant-001'

describe('PriceMonitorService', () => {
  let svc: PriceMonitorService

  beforeEach(() => {
    svc = new PriceMonitorService()
    svc.resetStoreForTests()
  })

  // ════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════

  describe('create', () => {
    it('正例: 创建价格记录', () => {
      const item = svc.create({
        tenantId: TENANT_ID, storeId: 'store-001', storeName: '测试店',
        itemName: '可乐', category: PriceCategory.Food,
        price: 5, marketAvgPrice: 4,
      })
      expect(item.id).toBeTruthy()
      expect(item.priceDiff).toBe(1)
      expect(item.diffPercent).toBe(25)
      expect(item.isAnomaly).toBe(true) // >20%
    })

    it('正例: 正常价格不标记异常', () => {
      const item = svc.create({
        tenantId: TENANT_ID, storeId: 'store-001', storeName: '测试店',
        itemName: '水', category: PriceCategory.Game,
        price: 3, marketAvgPrice: 3,
      })
      expect(item.isAnomaly).toBe(false)
    })
  })

  // ════════════════════════════════════════════
  // get / require
  // ════════════════════════════════════════════

  describe('get', () => {
    it('正例: 获取价格记录', () => {
      const item = svc.create({
        tenantId: TENANT_ID, storeId: 's-001', storeName: '店A',
        itemName: '可乐', category: PriceCategory.Food, price: 5, marketAvgPrice: 4,
      })
      const found = svc.get(item.id, TENANT_ID)
      expect(found).toBeDefined()
    })

    it('反例: 不同tenant返回undefined', () => {
      const item = svc.create({
        tenantId: TENANT_ID, storeId: 's-001', storeName: '店A',
        itemName: '可乐', category: PriceCategory.Food, price: 5, marketAvgPrice: 4,
      })
      expect(svc.get(item.id, 'other-tenant')).toBeUndefined()
    })
  })

  describe('require', () => {
    it('正例: 获取或抛异常', () => {
      const item = svc.create({
        tenantId: TENANT_ID, storeId: 's-1', storeName: '店',
        itemName: '测试', category: PriceCategory.Game, price: 3, marketAvgPrice: 3,
      })
      expect(() => svc.require(item.id, TENANT_ID)).not.toThrow()
    })

    it('反例: 不存在抛异常', () => {
      expect(() => svc.require('nonexist', TENANT_ID)).toThrow('not found')
    })
  })

  // ════════════════════════════════════════════
  // list
  // ════════════════════════════════════════════

  describe('list', () => {
    it('正例: 列出所有价格记录（含种子数据）', () => {
      const list = svc.list(TENANT_ID)
      expect(list.length).toBeGreaterThanOrEqual(10)
    })

    it('正例: 按门店筛选', () => {
      svc.create({
        tenantId: TENANT_ID, storeId: 's-specific', storeName: '特定店',
        itemName: '爆米花', category: PriceCategory.Food, price: 10, marketAvgPrice: 8,
      })
      const list = svc.list(TENANT_ID, { storeId: 's-specific' })
      expect(list.every(i => i.storeId === 's-specific')).toBe(true)
    })

    it('正例: 按品类筛选', () => {
      const list = svc.list(TENANT_ID, { category: PriceCategory.Game })
      expect(list.every(i => i.category === PriceCategory.Game)).toBe(true)
    })

    it('边界: 按价格范围筛选', () => {
      const list = svc.list(TENANT_ID, { minPrice: 10, maxPrice: 100 })
      expect(list.every(i => i.price >= 10 && i.price <= 100)).toBe(true)
    })
  })

  // ════════════════════════════════════════════
  // delete
  // ════════════════════════════════════════════

  describe('delete', () => {
    it('正例: 删除价格记录', () => {
      const item = svc.create({
        tenantId: TENANT_ID, storeId: 's-1', storeName: '店',
        itemName: '删', category: PriceCategory.Game, price: 1, marketAvgPrice: 1,
      })
      svc.delete(item.id, TENANT_ID)
      expect(svc.get(item.id, TENANT_ID)).toBeUndefined()
    })
  })

  // ════════════════════════════════════════════
  // getPriceComparison
  // ════════════════════════════════════════════

  describe('getPriceComparison', () => {
    it('正例: 返回价格对比', () => {
      const list = svc.getPriceComparison(TENANT_ID)
      expect(list.length).toBeGreaterThan(0)
      expect(list[0]).toHaveProperty('price')
      expect(list[0]).toHaveProperty('marketAvgPrice')
      expect(list[0]).toHaveProperty('diffPercent')
    })
  })

  // ════════════════════════════════════════════
  // getAnomalies
  // ════════════════════════════════════════════

  describe('getAnomalies', () => {
    it('正例: 筛选异常价格', () => {
      svc.create({
        tenantId: TENANT_ID, storeId: 's-001', storeName: '异常店',
        itemName: '高价品', category: PriceCategory.Food, price: 100, marketAvgPrice: 10,
      })
      const anomalies = svc.getAnomalies(TENANT_ID)
      expect(anomalies.length).toBeGreaterThan(0)
      expect(anomalies.every(a => Math.abs(a.diffPercent) >= 20)).toBe(true)
    })
  })

  // ════════════════════════════════════════════
  // getSummary
  // ════════════════════════════════════════════

  describe('getSummary', () => {
    it('正例: 返回价格摘要', () => {
      const summary = svc.getSummary(TENANT_ID)
      expect(summary.totalItems).toBeGreaterThan(0)
      expect(summary.avgPrice).toBeGreaterThan(0)
      expect(summary.avgMarketPrice).toBeGreaterThan(0)
      expect(summary.lowestPriceStore).toBeTruthy()
      expect(summary.highestPriceStore).toBeTruthy()
    })
  })
})
