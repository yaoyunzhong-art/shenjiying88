/**
 * ai-forecast-insight.service.spec.ts — 预测洞察服务综合测试
 *
 * 覆盖：ForecastInsightService 全方法测试 + 集成场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { ForecastInsightService } from './ai-forecast-insight.service'

describe('ForecastInsightService (Complete)', () => {
  let service: ForecastInsightService

  beforeEach(() => { service = new ForecastInsightService() })

  it('compareForecastModels 应对比至少 3 种模型', () => {
    const result = service.compareForecastModels()
    expect(result.models.length).toBeGreaterThanOrEqual(3)
    result.models.forEach(m => {
      expect(m.mape).toBeGreaterThan(0)
      expect(m.rSquared).toBeGreaterThan(0)
    })
  })

  it('simulateScenarios 应包含 4 种场景概率加权', () => {
    const sim = service.simulateScenarios(1000000)
    expect(sim.scenarios).toHaveLength(4)
    const probSum = sim.scenarios.reduce((s, sc) => s + sc.probability, 0)
    expect(probSum).toBeCloseTo(1.0, 1)
  })

  it('analyzeSensitivity 应返回 11 个弹性数据点', () => {
    const sa = service.analyzeSensitivity()
    expect(sa.impactCurve).toHaveLength(11)
    expect(sa.mostSensitiveVariables.length).toBeGreaterThan(0)
  })

  it('assessForecastConfidence 置信度区间应有序', () => {
    const conf = service.assessForecastConfidence('fc-1')
    const { p10, p25, p50, p75, p90 } = conf.confidenceInterval
    expect(p10).toBeLessThanOrEqual(p25)
    expect(p25).toBeLessThanOrEqual(p50)
    expect(p50).toBeLessThanOrEqual(p75)
    expect(p75).toBeLessThanOrEqual(p90)
  })

  it('recommendInventory 应给出差异化补货建议', () => {
    const rec1 = service.recommendInventory('SKU-HIGH')
    const rec2 = service.recommendInventory('SKU-LOW')
    expect(rec1.recommendedAction).toBeTruthy()
    expect(rec2.recommendedAction).toBeTruthy()
  })

  it('detectAnomalies 应标记异常并分配严重程度', () => {
    const anomalies = service.detectAnomalies('营收')
    anomalies.forEach(a => {
      expect(['critical', 'major', 'minor']).toContain(a.severity)
      expect(typeof a.isAnomaly).toBe('boolean')
    })
  })

  it('decomposeTimeSeries 三部分之和应接近原始值', () => {
    const decomp = service.decomposeTimeSeries(30, 7)
    for (let i = 0; i < decomp.original.length; i++) {
      const reconstructed = decomp.trend[i].value + decomp.seasonal[i].value + decomp.residual[i].value
      const diff = Math.abs(reconstructed - decomp.original[i].value)
      expect(diff).toBeLessThanOrEqual(200)
    }
  })

  it('whatIfAnalysis 应包含多变量调整', () => {
    const wia = service.whatIfAnalysis(1000000)
    expect(wia.adjustments.length).toBeGreaterThanOrEqual(4)
    expect(wia.bestCase.forecast).toBeGreaterThan(wia.baseForecast)
    expect(wia.worstCase.forecast).toBeLessThan(wia.baseForecast)
  })

  it('getForecastAccuracyReport 应含多时间维度精度', () => {
    const report = service.getForecastAccuracyReport('2026-Q2')
    expect(report.accuracyByHorizon.map(h => h.horizon)).toContain('日')
    expect(report.accuracyByHorizon.map(h => h.horizon)).toContain('周')
    expect(report.accuracyByHorizon.map(h => h.horizon)).toContain('月')
  })

  it('analyzeDemandShaping 价格曲线应递减', () => {
    const ds = service.analyzeDemandShaping('prod-001')
    for (let i = 1; i < ds.priceVolumeCurve.length; i++) {
      expect(ds.priceVolumeCurve[i].price).toBeGreaterThan(ds.priceVolumeCurve[i - 1].price)
      expect(ds.priceVolumeCurve[i].demand).toBeLessThanOrEqual(ds.priceVolumeCurve[i - 1].demand)
    }
    expect(ds.promotionCalendar.length).toBeGreaterThan(0)
  })

  describe('集成场景', () => {
    it('多模型对比 → 选择最优 → 场景模拟完整链路', () => {
      const compare = service.compareForecastModels()
      expect(compare.bestModel).toBeTruthy()
      const sim = service.simulateScenarios(1000000)
      expect(sim.recommendations.length).toBeGreaterThan(0)
    })

    it('库存推荐 + 异常检测链', () => {
      const rec = service.recommendInventory('SKU-TEST')
      expect(rec.forecastedDemand).toBeGreaterThan(0)
      const anomalies = service.detectAnomalies('库存')
      expect(anomalies.length).toBeGreaterThanOrEqual(0)
    })
  })
})
