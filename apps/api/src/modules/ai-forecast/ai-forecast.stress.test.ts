import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-forecast] [D] 压力/韧性测试
 *
 * 覆盖边界场景:
 * - 并发大批量预测（高吞吐场景）
 * - 极端输入值（超大数值、负数、空产品ID）
 * - 快速连续状态变更（多次预测、促销调整、调拨循环）
 * - 内存/时间压力 (大量品类/产品循环)
 */

import assert from 'node:assert/strict'
import {
  DemandForecastService,
  InventoryOptimizer,
  TransferRecommendationService,
  initMockData,
  productHistory,
} from './ai-forecast.service'
import { AiForecastController } from './ai-forecast.controller'
import type { SalesForecast, Promotion } from './ai-forecast.entity'

describe('AiForecast - Stress & Resilience', () => {
  let forecastService: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer
  let transferService: TransferRecommendationService
  let controller: AiForecastController

  beforeEach(() => {
    productHistory.clear()
    forecastService = new DemandForecastService()
    inventoryOptimizer = new InventoryOptimizer(forecastService)
    transferService = new TransferRecommendationService(inventoryOptimizer)
    controller = new AiForecastController(
      forecastService,
      inventoryOptimizer,
      transferService,
    )
  })

  // ─── 高并发批量预测 ───

  describe('高并发批量预测', () => {
    it('同时预测 200 个不同产品不崩溃', () => {
      const productIds = Array.from({ length: 200 }, (_, i) => `stress-prod-${i}`)
      const forecasts: SalesForecast[] = []

      for (const pid of productIds) {
        initMockData(pid, `cat-stress-${pid.charCodeAt(pid.length - 1) % 5}`)
        const forecast = forecastService.forecastSales(pid, 30)
        forecasts.push(forecast)
      }

      assert.equal(forecasts.length, 200)
      for (const f of forecasts) {
        assert.ok(f.predictedSales > 0, `预测销量应 > 0: ${f.productId} => ${f.predictedSales}`)
        assert.ok(f.confidence >= 0.5 && f.confidence <= 1.0)
        assert.ok(f.promotionMultiplier >= 0.5)
        assert.ok(f.daysAhead === 30)
      }
    })

    it('同时预测同一产品 365 天（极限跨日）', () => {
      initMockData('stress-maxdays', 'cat-max')
      const forecast = forecastService.forecastSales('stress-maxdays', 365)
      assert.ok(forecast.predictedSales > 0)
      assert.equal(forecast.daysAhead, 365)
    })

    it('预测 1000 个产品品类聚合不超时', () => {
      for (let i = 0; i < 1000; i++) {
        initMockData(`bulk-cat-prod-${i}`, 'bulk-cat-01')
      }
      const categoryForecast = forecastService.forecastByCategory('bulk-cat-01', 7)
      assert.ok(categoryForecast.totalPredictedSales > 0)
      assert.ok(categoryForecast.productForecasts.length > 0)
    })
  })

  // ─── 极端输入值 ───

  describe('极端输入值', () => {
    it('超大销量数据不溢出', () => {
      const pid = 'stress-huge'
      productHistory.set(pid, {
        dailySales: Array.from({ length: 90 }, () => 999999),
        categoryId: 'cat-huge',
      })
      const forecast = forecastService.forecastSales(pid, 30)
      assert.ok(forecast.predictedSales > 0)
      assert.ok(Number.isFinite(forecast.predictedSales))
      assert.ok(forecast.confidence <= 1.0)
    })

    it('零销量产品不崩溃', () => {
      const pid = 'stress-zero'
      productHistory.set(pid, {
        dailySales: Array.from({ length: 30 }, () => 0),
        categoryId: 'cat-zero',
      })
      const forecast = forecastService.forecastSales(pid, 7)
      assert.equal(forecast.predictedSales, 1) // 至少返回 1
    })

    it('空品类创建自动产品不崩溃', () => {
      const result = forecastService.forecastByCategory('nonexistent-empty-cat', 14)
      assert.ok(result.totalPredictedSales > 0)
      assert.equal(result.productForecasts.length, 3)
    })

    it('极高促销提升百分比仍合理', () => {
      initMockData('stress-promo', 'cat-promo')
      const base = forecastService.forecastSales('stress-promo', 7)
      const hugePromos: Promotion[] = [
        {
          id: 'p-huge-1',
          type: 'discount',
          startDate: '2000-01-01',
          endDate: '2099-12-31',
          boostPercent: 500,
        },
      ]
      const adjusted = forecastService.adjustForPromotions(base, hugePromos)
      // 即便 boost=500%，逻辑会衰减，不会爆炸
      assert.ok(adjusted.predictedSales >= base.predictedSales)
      assert.ok(adjusted.promotionMultiplier >= 1.0)
      assert.ok(Number.isFinite(adjusted.predictedSales))
    })
  })

  // ─── 连续操作压力 ───

  describe('连续操作压力', () => {
    it('大量预测+库存+补货循环不崩溃', () => {
      const pid = 'stress-cycle'
      initMockData(pid, 'cat-cycle')

      for (let round = 0; round < 50; round++) {
        const forecast = forecastService.forecastSales(pid, 7)
        const optimal = inventoryOptimizer.calculateOptimalStock(pid, forecast, 7)
        const reorder = inventoryOptimizer.suggestReorder(pid)
        const slow = inventoryOptimizer.detectSlowMoving(pid, 30)

        assert.ok(Number.isFinite(forecast.predictedSales))
        assert.ok(Number.isFinite(optimal.totalOptimalStock))
        assert.ok(Number.isFinite(reorder.suggestedQuantity))
        assert.ok(Number.isFinite(slow.turnoverRate))
      }
    })

    it('大量门店+产品调拨循环不崩溃', () => {
      for (let i = 0; i < 30; i++) {
        initMockData(`transfer-prod-${i}`, 'cat-transfer')
      }

      for (let round = 0; round < 100; round++) {
        const fromStore = `store-${round % 10}`
        const toStore = `store-${(round + 5) % 10}`
        const prodId = `transfer-prod-${round % 30}`

        const suggestion = transferService.suggestTransfer(fromStore, toStore, prodId)
        const benefit = transferService.calculateTransferBenefit(fromStore, toStore, prodId)

        if (suggestion) {
          assert.ok(suggestion.quantity > 0)
          assert.equal(typeof suggestion.netBenefit, 'number')
        }
        assert.ok(Number.isFinite(benefit.totalSavings))
      }
    })

    it('季节性因子在多产品间连续访问不崩溃', () => {
      const pids = Array.from({ length: 50 }, (_, i) => `stress-seas-${i}`)
      for (const pid of pids) {
        initMockData(pid, 'cat-seas')
      }

      for (let round = 0; round < 200; round++) {
        const pid = pids[round % pids.length]
        const sf = forecastService.getSeasonality(pid)
        assert.equal(sf.monthlyFactors.length, 12)
        assert.ok(Number.isFinite(sf.trend))
      }
    })
  })

  // ─── 全局分配压力 ───

  describe('全局分配压力', () => {
    it('50门店×20产品全局分配不崩溃', () => {
      const products: { storeId: string; productId: string }[] = []
      for (let s = 0; s < 50; s++) {
        for (let p = 0; p < 20; p++) {
          initMockData(`gprod-${p}`, 'cat-global')
          products.push({
            storeId: `gstore-${s}`,
            productId: `gprod-${p}`,
          })
        }
      }

      const allocations = transferService.optimizeGlobalAllocation(products)
      assert.ok(Array.isArray(allocations))
    })
  })

  // ─── Controller 请求压力 ───

  describe('Controller 请求压力', () => {
    it('100 次不同产品的 forecast 不崩溃', () => {
      for (let i = 0; i < 100; i++) {
        initMockData(`ctrl-prod-${i}`, 'cat-ctrl')
        const result = controller.forecastSales({
          productId: `ctrl-prod-${i}`,
          daysAhead: 14,
        })
        assert.ok(result.predictedSales > 0)
      }
    })

    it('多次促销调整后预测不变性', () => {
      initMockData('ctrl-promo', 'cat-ctrl-promo')
      const base = controller.forecastSales({
        productId: 'ctrl-promo',
        daysAhead: 7,
      })

      const promos: Promotion[] = [
        { id: 'p1', type: 'discount', startDate: '2025-01-01', endDate: '2025-12-31', boostPercent: 20 },
        { id: 'p2', type: 'bundled', startDate: '2025-06-01', endDate: '2025-12-31', boostPercent: 15 },
      ]

      const adjusted1 = controller.adjustForPromotions({
        productId: 'ctrl-promo',
        daysAhead: 7,
        promotions: promos,
      })
      const adjusted2 = controller.adjustForPromotions({
        productId: 'ctrl-promo',
        daysAhead: 7,
        promotions: promos,
      })
      // 同输入输出应一致（确定性）
      assert.equal(adjusted1.promotionMultiplier, adjusted2.promotionMultiplier)
    })
  })

  // ─── 内存/边界 ───

  describe('内存与边界', () => {
    it('产品记录超大数据量（90天+7倍峰值）不溢出', () => {
      const pid = 'stress-90d'
      productHistory.set(pid, {
        dailySales: Array.from({ length: 90 }, () => 50000),
        categoryId: 'cat-90d',
      })

      for (let d = 1; d <= 90; d++) {
        const forecast = forecastService.forecastSales(pid, d)
        assert.ok(Number.isFinite(forecast.predictedSales))
      }
    })

    it('最优库存计算极端场景（leadTime=1 和 leadTime=365）', () => {
      initMockData('stress-lt1', 'cat-lt')
      initMockData('stress-lt365', 'cat-lt')

      const f1 = forecastService.forecastSales('stress-lt1', 7)
      const opt1 = inventoryOptimizer.calculateOptimalStock('stress-lt1', f1, 1)
      assert.ok(opt1.totalOptimalStock > 0)

      const f2 = forecastService.forecastSales('stress-lt365', 7)
      const opt2 = inventoryOptimizer.calculateOptimalStock('stress-lt365', f2, 365)
      assert.ok(opt2.totalOptimalStock > 0)
    })

    it('调拨建议从同一门店到同一门店返回 null', () => {
      initMockData('stress-self', 'cat-self')
      const result = transferService.suggestTransfer('same-store', 'same-store', 'stress-self')
      // 同门店调拨通常没有意义，但不应崩溃
      // 返回 null 表示不可行
      assert.equal(result, null)
    })
  })
})
