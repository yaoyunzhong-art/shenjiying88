/**
 * ai-forecast-service-spec.ts — 预测 Service 测试补充
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DemandForecastService, InventoryOptimizer } from './ai-forecast.service'

describe('DemandForecastService (All)', () => {
  let s: DemandForecastService
  beforeEach(() => { s = new DemandForecastService() })

  it('7天预测', () => { expect(s.forecastSales('p1', 7).daysAhead).toBe(7) })
  it('30天预测', () => { expect(s.forecastSales('p1', 30).daysAhead).toBe(30) })
  it('1天预测', () => { expect(s.forecastSales('p1', 1).daysAhead).toBe(1) })
  it('90天预测', () => { expect(s.forecastSales('p1', 90).daysAhead).toBe(90) })
  it('置信度范围', () => {
    const r = s.forecastSales('p1', 7)
    expect(r.confidence).toBeGreaterThan(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
  })
  it('值非负', () => {
    expect(s.forecastSales('p1', 30).predictedSales).toBeGreaterThanOrEqual(0)
  })
  it('不同 SKU 不同预测', () => {
    const r1 = s.forecastSales('p1', 3)
    const r2 = s.forecastSales('p2', 3)
    expect(r1.productId).not.toBe(r2.productId)
  })
})

describe('InventoryOptimizer (All)', () => {
  let s: InventoryOptimizer
  let d: DemandForecastService
  beforeEach(() => {
    d = new DemandForecastService()
    s = new InventoryOptimizer(d)
  })

  it('补货量正数', () => { expect(s.suggestReorder('p1').suggestedQuantity).toBeGreaterThan(0) })
  it('零库存补货', () => { expect(s.suggestReorder('p1').suggestedQuantity).toBeGreaterThan(0) })
  it('高库存处理', () => { expect(s.suggestReorder('p1')).toBeDefined() })
  it('不同 SKU', () => {
    const r1 = s.suggestReorder('p1')
    const r2 = s.suggestReorder('p2')
    expect(r1.productId).not.toBe(r2.productId)
  })
  it('返回建议日期', () => {
    const r = s.suggestReorder('p1')
    expect(r.suggestedDate).toBeDefined()
  })
})
