/**
 * ai-forecast-service-spec.ts — 预测 Service 测试补充
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DemandForecastService, InventoryOptimizer } from './ai-forecast.service'

describe('DemandForecastService (All)', () => {
  let s: DemandForecastService
  beforeEach(() => { s = new DemandForecastService() })

  it('7天预测', () => { expect(s.forecast('p1', 7).predictions).toHaveLength(7) })
  it('30天预测', () => { expect(s.forecast('p1', 30).predictions).toHaveLength(30) })
  it('1天预测', () => { expect(s.forecast('p1', 1).predictions).toHaveLength(1) })
  it('90天预测', () => { expect(s.forecast('p1', 90).predictions).toHaveLength(90) })
  it('置信度范围', () => {
    const r = s.forecast('p1', 7)
    expect(r.confidence).toBeGreaterThan(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
  })
  it('值非负', () => {
    for (const p of s.forecast('p1', 30).predictions) {
      expect(p.value).toBeGreaterThanOrEqual(0)
    }
  })
  it('不同 SKU 不同预测', () => {
    const r1 = s.forecast('p1', 3)
    const r2 = s.forecast('p2', 3)
    expect(r1.sku).not.toBe(r2.sku)
  })
})

describe('InventoryOptimizer (All)', () => {
  let s: InventoryOptimizer
  beforeEach(() => { s = new InventoryOptimizer() })

  it('补货量正数', () => { expect(s.suggestReorder('p1', 100, 7).reorderQuantity).toBeGreaterThan(0) })
  it('零库存补货', () => { expect(s.suggestReorder('p1', 0, 7).reorderQuantity).toBeGreaterThan(0) })
  it('高库存处理', () => { expect(s.suggestReorder('p1', 9999, 7)).toBeDefined() })
  it('不同 SKU', () => {
    const r1 = s.suggestReorder('p1', 50, 7)
    const r2 = s.suggestReorder('p2', 50, 7)
    expect(r1.sku).not.toBe(r2.sku)
  })
  it('长提前期', () => { expect(s.suggestReorder('p1', 100, 30).leadTime).toBe(30) })
})
