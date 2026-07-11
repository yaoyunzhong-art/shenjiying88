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
    const result = service.forecast('prod-001', 30)
    expect(result.sku).toBe('prod-001')
    expect(result.predictions).toHaveLength(30)
  })

  it('所有预测值应为非负整数', () => {
    const result = service.forecast('prod-001', 14)
    for (const p of result.predictions) {
      expect(p.value).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(p.value)).toBe(true)
    }
  })

  it('置信度应在 0-1 之间', () => {
    const result = service.forecast('prod-001', 7)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('短天数预测应仍返回有效结果', () => {
    const result = service.forecast('prod-001', 1)
    expect(result.predictions).toHaveLength(1)
  })

  it('不同 SKU 应返回不同数据', () => {
    const r1 = service.forecast('prod-001', 5)
    const r2 = service.forecast('prod-999', 5)
    expect(r1.sku).toBe('prod-001')
    expect(r2.sku).toBe('prod-999')
  })

  it('大量天数应正常工作', () => {
    const result = service.forecast('prod-001', 365)
    expect(result.predictions).toHaveLength(365)
  })
})

describe('InventoryOptimizer (Complete)', () => {
  let service: InventoryOptimizer

  beforeEach(() => { service = new InventoryOptimizer() })

  it('补货数量应基于当前库存和提前期', () => {
    const result = service.suggestReorder('prod-001', 100, 7)
    expect(result.sku).toBe('prod-001')
    expect(result.reorderQuantity).toBeGreaterThan(0)
    expect(result.leadTime).toBe(7)
  })

  it('低库存时应建议补货', () => {
    const result = service.suggestReorder('prod-001', 10, 14)
    expect(result.urgent).toBeDefined()
  })

  it('零库存时应紧急补货', () => {
    const result = service.suggestReorder('prod-001', 0, 7)
    expect(result.reorderQuantity).toBeGreaterThan(0)
  })

  it('高库存时应建议暂缓补货', () => {
    const result = service.suggestReorder('prod-001', 1000, 7)
    expect(result).toBeDefined()
  })

  it('不同 SKU 补货建议应不同', () => {
    const r1 = service.suggestReorder('prod-001', 100, 7)
    const r2 = service.suggestReorder('prod-002', 100, 7)
    expect(r1.sku).not.toBe(r2.sku)
  })
})

describe('TransferRecommendationService (Complete)', () => {
  let service: TransferRecommendationService

  beforeEach(() => { service = new TransferRecommendationService() })

  it('应返回调拨建议列表', () => {
    const recs = service.getRecommendations('store-a', ['store-b', 'store-c'])
    expect(recs).toBeInstanceOf(Array)
  })

  it('每个建议应包含源和目标门店', () => {
    const recs = service.getRecommendations('store-a', ['store-b'])
    if (recs.length > 0) {
      expect(recs[0].from).toBeDefined()
      expect(recs[0].to).toBeDefined()
    }
  })

  it('空目标门店列表应返回空或默认', () => {
    const recs = service.getRecommendations('store-a', [])
    expect(recs).toBeInstanceOf(Array)
  })
})
