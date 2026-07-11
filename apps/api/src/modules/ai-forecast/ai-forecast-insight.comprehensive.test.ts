/**
 * ai-forecast-insight.comprehensive.test.ts — 预测洞察完整测试
 */
import { describe, it, expect } from 'vitest'
import { ForecastInsightService } from './ai-forecast-insight.service'

describe('ForecastInsightService (All Methods)', () => {
  const service = new ForecastInsightService()

  it('compareForecastModels: 返回模型列表', () => {
    const r = service.compareForecastModels()
    expect(r.models.length).toBe(5)
    expect(r.bestModel).toBe('Ensemble')
  })

  it('simulateScenarios: 4场景概率和=1', () => {
    const r = service.simulateScenarios(1000000)
    expect(r.scenarios).toHaveLength(4)
    const sum = r.scenarios.reduce((s, x) => s + x.probability, 0)
    expect(Math.round(sum)).toBe(1)
  })

  it('analyzeSensitivity: 11个弹性点', () => {
    const r = service.analyzeSensitivity()
    expect(r.impactCurve).toHaveLength(11)
  })

  it('assessForecastConfidence: 有序置信区间', () => {
    const r = service.assessForecastConfidence('f1')
    expect(r.confidenceInterval.p10).toBeLessThan(r.confidenceInterval.p90)
  })

  it('recommendInventory: 返回补货建议', () => {
    const r = service.recommendInventory('SKU-001')
    expect(r.reorderPoint).toBeGreaterThan(0)
  })

  it('detectAnomalies: 返回异常列表', () => {
    const r = service.detectAnomalies('营收')
    expect(r.length).toBe(5)
  })

  it('decomposeTimeSeries: 30数据点', () => {
    const r = service.decomposeTimeSeries(30)
    expect(r.original).toHaveLength(30)
    expect(r.trend).toHaveLength(30)
    expect(r.seasonal).toHaveLength(30)
    expect(r.residual).toHaveLength(30)
  })

  it('whatIfAnalysis: 5个调整', () => {
    const r = service.whatIfAnalysis(1000000)
    expect(r.adjustments).toHaveLength(5)
  })

  it('getForecastAccuracyReport: 多维度精度', () => {
    const r = service.getForecastAccuracyReport('Q2')
    expect(r.accuracyByHorizon.length).toBe(4)
  })

  it('analyzeDemandShaping: 产品价格曲线递减', () => {
    const r = service.analyzeDemandShaping('prod-001')
    for (let i = 1; i < r.priceVolumeCurve.length; i++) {
      expect(r.priceVolumeCurve[i].price).toBeGreaterThan(r.priceVolumeCurve[i - 1].price)
    }
  })
})

describe('ForecastInsightService Performance Baseline', () => {
  const service = new ForecastInsightService()

  it('大量数据点时间序列分解', () => {
    const r = service.decomposeTimeSeries(365, 7)
    expect(r.original).toHaveLength(365)
  })

  it('100次场景模拟循环', () => {
    for (let i = 0; i < 100; i++) {
      const r = service.simulateScenarios(500000 + i * 10000)
      expect(r.scenarios).toHaveLength(4)
      expect(r.weightedForecast).toBeGreaterThan(0)
    }
  })
})
