/**
 * ai-forecast.service.spec.ts — 扩展版 AI 预测 Service 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'

describe('DemandForecastService', () => {
  let service: DemandForecastService

  beforeEach(() => {
    service = new DemandForecastService()
  })

  describe('forecastSales', () => {
    it('应返回指定 SKU 的预测结果', () => {
      const result = service.forecastSales('prod-001', 30)
      expect(result).toBeDefined()
      expect(result.productId).toBe('prod-001')
      expect(result.daysAhead).toBe(30)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('所有预测值应为正数', () => {
      const result = service.forecastSales('prod-002', 14)
      expect(result.predictedSales).toBeGreaterThanOrEqual(0)
    })

    it('未指定 SKU 时应使用默认值', () => {
      const result = service.forecastSales('unknown-sku', 7)
      expect(result.daysAhead).toBe(7)
    })
  })
})

describe('InventoryOptimizer', () => {
  let service: InventoryOptimizer
  let demandForecast: DemandForecastService

  beforeEach(() => {
    demandForecast = new DemandForecastService()
    service = new InventoryOptimizer(demandForecast)
  })

  describe('suggestReorder', () => {
    it('应返回补货建议', () => {
      const suggestion = service.suggestReorder('prod-001')
      expect(suggestion).toBeDefined()
      expect(suggestion.productId).toBe('prod-001')
      expect(suggestion.suggestedQuantity).toBeGreaterThan(0)
    })
  })
})

describe('TransferRecommendationService', () => {
  let service: TransferRecommendationService
  let demandForecast: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer

  beforeEach(() => {
    demandForecast = new DemandForecastService()
    inventoryOptimizer = new InventoryOptimizer(demandForecast)
    service = new TransferRecommendationService(inventoryOptimizer)
  })

  describe('suggestTransfer', () => {
    it('应返回调拨建议', () => {
      const rec = service.suggestTransfer('store-a', 'store-b', 'prod-001')
      expect(rec).toBeDefined()
    })
  })
})
