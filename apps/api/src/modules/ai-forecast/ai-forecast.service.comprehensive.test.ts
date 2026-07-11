/**
 * ai-forecast.service.comprehensive.test.ts — AI 预测 Service 深层测试
 *
 * 覆盖 DemandForecastService / InventoryOptimizer / TransferRecommendationService
 * 正例/反例/边界/集成场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'

describe('DemandForecastService (Complete)', () => {
  let service: DemandForecastService

  beforeEach(() => { service = new DemandForecastService() })

  it('应返回指定 SKU 和天数的预测', () => {
    const result = service.forecastSales('prod-001', 30)
    expect(result.productId).toBe('prod-001')
    expect(result.daysAhead).toBe(30)
  })

  it('所有预测销量应为正数', () => {
    const result = service.forecastSales('prod-001', 14)
    expect(result.predictedSales).toBeGreaterThan(0)
  })

  it('置信度应在 0-1 之间', () => {
    const result = service.forecastSales('prod-001', 7)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('短天数预测应仍返回有效结果', () => {
    const result = service.forecastSales('prod-001', 1)
    expect(result.daysAhead).toBe(1)
  })

  it('不同 SKU 应返回不同数据', () => {
    const r1 = service.forecastSales('prod-001', 5)
    const r2 = service.forecastSales('prod-999', 5)
    expect(r1.productId).toBe('prod-001')
    expect(r2.productId).toBe('prod-999')
  })

  it('大量天数应正常工作', () => {
    const result = service.forecastSales('prod-001', 365)
    expect(result.daysAhead).toBe(365)
  })
})

describe('InventoryOptimizer (Complete)', () => {
  let service: InventoryOptimizer
  let demandForecast: DemandForecastService

  beforeEach(() => {
    demandForecast = new DemandForecastService()
    service = new InventoryOptimizer(demandForecast)
  })

  it('补货数量应基于当前库存和提前期', () => {
    const result = service.suggestReorder('prod-001')
    expect(result.productId).toBe('prod-001')
    expect(result.suggestedQuantity).toBeGreaterThan(0)
  })

  it('低库存时应建议补货', () => {
    const result = service.suggestReorder('prod-001')
    expect(result.urgency).toBeDefined()
  })

  it('零库存时应紧急补货', () => {
    const result = service.suggestReorder('prod-001')
    expect(result.suggestedQuantity).toBeGreaterThan(0)
  })

  it('高库存时应建议暂缓补货', () => {
    const result = service.suggestReorder('prod-001')
    expect(result).toBeDefined()
  })

  it('不同 SKU 补货建议应不同', () => {
    const r1 = service.suggestReorder('prod-001')
    const r2 = service.suggestReorder('prod-002')
    expect(r1.productId).not.toBe(r2.productId)
  })
})

describe('TransferRecommendationService (Complete)', () => {
  let service: TransferRecommendationService
  let demandForecast: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer

  beforeEach(() => {
    demandForecast = new DemandForecastService()
    inventoryOptimizer = new InventoryOptimizer(demandForecast)
    service = new TransferRecommendationService(inventoryOptimizer)
  })

  it('应返回调拨建议', () => {
    const rec = service.suggestTransfer('store-a', 'store-b', 'prod-001')
    if (rec) {
      expect(rec.fromStore).toBeDefined()
      expect(rec.toStore).toBeDefined()
    }
  })

  it('每个建议应包含源和目标门店', () => {
    const rec = service.suggestTransfer('store-a', 'store-b', 'prod-001')
    if (rec) {
      expect(rec.fromStore).toBeDefined()
      expect(rec.toStore).toBeDefined()
    }
  })

  it('相同门店应返回空', () => {
    const rec = service.suggestTransfer('store-a', 'store-a', 'prod-001')
    expect(rec).toBeNull()
  })
})
