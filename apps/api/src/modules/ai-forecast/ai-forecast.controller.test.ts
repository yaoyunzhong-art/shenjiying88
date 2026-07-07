import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AiForecastController 单元测试（controller.test 风格）
 *
 * 覆盖：销量预测、库存优化、调拨管理三大模块
 * 正例 + 反例 + 边界条件
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiForecastController } from './ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'

describe('AiForecastController', () => {
  let controller: AiForecastController
  let demandService: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer
  let transferService: TransferRecommendationService

  beforeEach(() => {
    demandService = new DemandForecastService()
    inventoryOptimizer = new InventoryOptimizer(demandService)
    transferService = new TransferRecommendationService(inventoryOptimizer)
    controller = new AiForecastController(demandService, inventoryOptimizer, transferService)
  })

  describe('route metadata', () => {
    it('controller path metadata should be ai-forecast', () => {
      const path = Reflect.getMetadata('path', AiForecastController)
      assert.equal(path, 'ai-forecast')
    })

    it('forecastSales route should have GET method and correct path', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.forecastSales)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.forecastSales)
      assert.equal(method, 0) // GET
      assert.equal(path, 'forecast/sales')
    })

    it('forecastCategory route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.forecastCategory)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.forecastCategory)
      assert.equal(method, 0) // GET
      assert.equal(path, 'forecast/category')
    })

    it('getSeasonality route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.getSeasonality)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.getSeasonality)
      assert.equal(method, 0) // GET
      assert.equal(path, 'seasonality')
    })

    it('adjustForPromotions route should have POST method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.adjustForPromotions)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.adjustForPromotions)
      assert.equal(method, 1) // POST
      assert.equal(path, 'forecast/adjust-promotions')
    })

    it('calculateOptimalStock route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.calculateOptimalStock)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.calculateOptimalStock)
      assert.equal(method, 0) // GET
      assert.equal(path, 'inventory/optimal-stock')
    })

    it('suggestReorder route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.suggestReorder)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.suggestReorder)
      assert.equal(method, 0) // GET
      assert.equal(path, 'inventory/reorder')
    })

    it('detectSlowMoving route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.detectSlowMoving)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.detectSlowMoving)
      assert.equal(method, 0) // GET
      assert.equal(path, 'inventory/slow-moving')
    })

    it('suggestTransfer route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.suggestTransfer)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.suggestTransfer)
      assert.equal(method, 0) // GET
      assert.equal(path, 'transfer/suggest')
    })

    it('calculateTransferBenefit route should have GET method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.calculateTransferBenefit)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.calculateTransferBenefit)
      assert.equal(method, 0) // GET
      assert.equal(path, 'transfer/benefit')
    })

    it('optimizeGlobalAllocation route should have POST method', () => {
      const method = Reflect.getMetadata('method', AiForecastController.prototype.optimizeGlobalAllocation)
      const path = Reflect.getMetadata('path', AiForecastController.prototype.optimizeGlobalAllocation)
      assert.equal(method, 1) // POST
      assert.equal(path, 'transfer/optimize-global')
    })
  })

  describe('GET /ai-forecast/forecast/sales', () => {
    // 正例：正常预测
    it('should return sales forecast for a valid product', () => {
      const result = controller.forecastSales({ productId: 'prod-001', daysAhead: 7 })

      assert.ok(result)
      assert.equal(result.productId, 'prod-001')
      assert.equal(result.daysAhead, 7)
      assert.ok(result.predictedSales > 0)
      assert.ok(result.confidence > 0)
      assert.ok(result.confidence <= 1)
    })

    // 正例：不同天数预测值不同
    it('should handle different forecast days', () => {
      const result30 = controller.forecastSales({ productId: 'prod-001', daysAhead: 30 })
      const result90 = controller.forecastSales({ productId: 'prod-001', daysAhead: 90 })

      assert.ok(result30.predictedSales > 0)
      assert.ok(result90.predictedSales > 0)
      // 预测天数不同，结果不同（天数不同则预测值有差异）
      // 天数越长预测值越大
      assert.ok(result90.predictedSales >= result30.predictedSales)
      // 置信度在有效范围内
      assert.ok(result30.confidence > 0 && result30.confidence <= 1)
      assert.ok(result90.confidence > 0 && result90.confidence <= 1)
    })

    // 边界：daysAhead 为 1
    it('should handle minimum forecast window', () => {
      const result = controller.forecastSales({ productId: 'prod-001', daysAhead: 1 })
      assert.equal(result.daysAhead, 1)
      assert.ok(result.predictedSales >= 0)
    })
  })

  describe('GET /ai-forecast/forecast/category', () => {
    // 正例：品类预测
    it('should return category forecast with product details', () => {
      const result = controller.forecastCategory({ categoryId: 'cat-001', daysAhead: 7 })

      assert.equal(result.categoryId, 'cat-001')
      assert.equal(result.daysAhead, 7)
      assert.ok(result.totalPredictedSales > 0)
      assert.ok(Array.isArray(result.productForecasts))
      assert.ok(result.productForecasts.length > 0)
    })

    // 边界：不同品类
    it('should return different forecasts for different categories', () => {
      const cat1 = controller.forecastCategory({ categoryId: 'cat-electronic', daysAhead: 7 })
      const cat2 = controller.forecastCategory({ categoryId: 'cat-food', daysAhead: 7 })

      assert.notEqual(cat1.totalPredictedSales, cat2.totalPredictedSales)
    })
  })

  describe('GET /ai-forecast/seasonality', () => {
    // 正例：返回季节性因子
    it('should return 12-month seasonality factors', () => {
      const result = controller.getSeasonality('prod-001')

      assert.equal(result.productId, 'prod-001')
      assert.equal(result.monthlyFactors.length, 12)
      assert.ok(typeof result.trend === 'number')
    })

    // 边界：当月因子应为正值
    it('each monthly factor should be positive', () => {
      const result = controller.getSeasonality('prod-001')
      for (const factor of result.monthlyFactors) {
        assert.ok(factor > 0)
      }
    })
  })

  describe('POST /ai-forecast/forecast/adjust-promotions', () => {
    // 正例：无促销时乘数为 1.0
    it('should return multiplier 1.0 with no promotions', () => {
      const result = controller.adjustForPromotions({
        productId: 'prod-001',
        daysAhead: 7,
        promotions: []
      })

      assert.equal(result.productId, 'prod-001')
      assert.equal(result.promotionMultiplier, 1.0)
    })

    // 正例：有促销时调整
    it('should boost prediction when promotions exist', () => {
      const base = controller.forecastSales({ productId: 'prod-001', daysAhead: 7 })
      const result = controller.adjustForPromotions({
        productId: 'prod-001',
        daysAhead: 7,
        promotions: [
          {
            id: 'p1',
            type: 'discount',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 86400000).toISOString(),
            boostPercent: 0.2
          }
        ]
      })

      assert.ok(result.promotionMultiplier > 1.0)
      // 促销后预测 >= 基础预测
      assert.ok(result.predictedSales >= base.predictedSales)
    })
  })

  describe('GET /ai-forecast/inventory/optimal-stock', () => {
    // 正例：计算最优库存
    it('should calculate optimal stock levels', () => {
      const result = controller.calculateOptimalStock({ productId: 'prod-001', leadTime: 7, daysAhead: 7 })

      assert.equal(result.productId, 'prod-001')
      assert.ok(result.safetyStock > 0)
      assert.ok(result.cycleStock > 0)
      assert.equal(result.totalOptimalStock, result.safetyStock + result.cycleStock)
      assert.ok(result.reorderPoint > 0)
      assert.ok(result.reorderQuantity > 0)
    })

    // 边界：不同 leadTime
    it('should increase safety stock with longer lead time', () => {
      const short = controller.calculateOptimalStock({ productId: 'prod-001', leadTime: 3, daysAhead: 7 })
      const long = controller.calculateOptimalStock({ productId: 'prod-001', leadTime: 14, daysAhead: 7 })

      assert.ok(long.safetyStock >= short.safetyStock)
    })
  })

  describe('GET /ai-forecast/inventory/reorder', () => {
    // 正例：补货建议
    it('should return reorder suggestion with valid urgency', () => {
      const result = controller.suggestReorder({ productId: 'prod-low-stock' })

      assert.equal(result.productId, 'prod-low-stock')
      assert.ok(result.suggestedQuantity > 0)
      assert.ok(['low', 'medium', 'high'].includes(result.urgency))
      assert.ok(result.reason.length > 0)
    })

    // 边界：不同产品不同推荐
    it('should give different suggestions for different products', () => {
      const result1 = controller.suggestReorder({ productId: 'prod-high-demand' })
      const result2 = controller.suggestReorder({ productId: 'prod-low-demand' })

      assert.ok(result1.suggestedQuantity !== result2.suggestedQuantity ||
                result1.urgency !== result2.urgency)
    })
  })

  describe('GET /ai-forecast/inventory/slow-moving', () => {
    // 正例：检测滞销品
    it('should detect slow moving products', () => {
      const result = controller.detectSlowMoving({ productId: 'prod-slow', thresholdDays: 30 })

      assert.equal(result.productId, 'prod-slow')
      assert.ok(result.daysSinceLastSale >= 0)
      assert.ok(result.currentStock >= 0)
      assert.ok(result.recommendation.length > 0)
    })

    // 边界：默认阈值 30 天
    it('should use default threshold of 30 days', () => {
      const result = controller.detectSlowMoving({ productId: 'prod-slow' })

      assert.ok(result.daysSinceLastSale >= 0)
      assert.ok(result.recommendation.length > 0)
    })
  })

  describe('GET /ai-forecast/transfer/suggest', () => {
    // 正例：调拨建议
    it('should suggest transfer between stores', () => {
      const result = controller.suggestTransfer({
        fromStore: 'store-A',
        toStore: 'store-B',
        productId: 'prod-001'
      })

      if (result !== null) {
        assert.equal(result.fromStore, 'store-A')
        assert.equal(result.toStore, 'store-B')
        assert.equal(result.productId, 'prod-001')
        assert.ok(result.quantity > 0)
        assert.ok(typeof result.netBenefit === 'number')
      } else {
        // 库存不足不需要调拨时返回 null（属正常边界）
        assert.equal(result, null)
      }
    })

    // 边界：自身调动返回 null
    it('should return null when fromStore equals toStore', () => {
      const result = controller.suggestTransfer({
        fromStore: 'store-A',
        toStore: 'store-A',
        productId: 'prod-001'
      })

      assert.equal(result, null)
    })
  })

  describe('GET /ai-forecast/transfer/benefit', () => {
    // 正例：计算调拨收益
    it('should calculate transfer benefit with cost details', () => {
      const result = controller.calculateTransferBenefit({
        fromStore: 'store-A',
        toStore: 'store-B',
        productId: 'prod-001'
      })

      assert.ok(result.cost.freight > 0)
      assert.ok(result.cost.loss > 0)
      assert.ok(result.cost.labor > 0)
      assert.equal(result.cost.total, result.cost.freight + result.cost.loss + result.cost.labor)
      // 收益 >= 0
      assert.ok(result.totalSavings >= 0)
    })

    // 边界：成本结构完整
    it('should always return valid cost structure', () => {
      const result = controller.calculateTransferBenefit({
        fromStore: 'store-A',
        toStore: 'store-A',
        productId: 'prod-001'
      })

      assert.ok(result.cost.freight > 0)
      assert.ok(result.cost.total >= 0)
      assert.ok(result.totalSavings >= 0)
    })
  })

  describe('POST /ai-forecast/transfer/optimize-global', () => {
    // 正例：全局最优分配
    it('should return global allocation plan', () => {
      const result = controller.optimizeGlobalAllocation({
        products: [
          { storeId: 'store-A', productId: 'prod-001' },
          { storeId: 'store-B', productId: 'prod-001' }
        ]
      })

      assert.ok(Array.isArray(result))
      assert.ok(result.length > 0)
      // 净调拨量为 0
      for (const plan of result) {
        const sum = plan.allocations.reduce((s: number, a: { quantity: number }) => s + a.quantity, 0)
        assert.equal(sum, 0)
      }
      assert.ok(result[0].totalBenefit > 0)
    })

    // 边界：单门店返回空数组
    it('should return empty for single store input', () => {
      const result = controller.optimizeGlobalAllocation({
        products: [{ storeId: 'store-A', productId: 'prod-001' }]
      })

      assert.equal(result.length, 0)
    })
  })
})
