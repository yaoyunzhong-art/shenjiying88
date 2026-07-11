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

  describe('forecast', () => {
    it('应返回指定 SKU 的预测结果', () => {
      const result = service.forecast('prod-001', 30)
      expect(result).toBeDefined()
      expect(result.sku).toBe('prod-001')
      expect(result.predictions.length).toBe(30)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('所有预测值应为正数', () => {
      const result = service.forecast('prod-002', 14)
      for (const p of result.predictions) {
        expect(p.value).toBeGreaterThanOrEqual(0)
      }
    })

    it('未指定 SKU 时应使用默认值', () => {
      const result = service.forecast('unknown-sku', 7)
      expect(result.predictions.length).toBe(7)
    })
  })
})

describe('InventoryOptimizer', () => {
  let service: InventoryOptimizer

  beforeEach(() => {
    service = new InventoryOptimizer()
  })

  describe('suggestReorder', () => {
    it('应返回补货建议', () => {
      const suggestion = service.suggestReorder('prod-001', 100, 5)
      expect(suggestion).toBeDefined()
      expect(suggestion.sku).toBe('prod-001')
      expect(suggestion.reorderQuantity).toBeGreaterThan(0)
    })
  })
})

describe('TransferRecommendationService', () => {
  let service: TransferRecommendationService

  beforeEach(() => {
    service = new TransferRecommendationService()
  })

  describe('getRecommendations', () => {
    it('应返回调拨建议', () => {
      const recommendations = service.getRecommendations('store-a', ['store-b', 'store-c'])
      expect(recommendations).toBeInstanceOf(Array)
    })
  })
})
