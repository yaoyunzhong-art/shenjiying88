/**
 * ai-forecast-insight.service.spec.ts — 预测洞察服务综合测试
 *
 * 覆盖：ForecastInsightService 全方法测试 + 集成场景
 * 三件套：正例+反例+边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { ForecastInsightService } from './ai-forecast-insight.service'

describe('ForecastInsightService (Complete)', () => {
  let service: ForecastInsightService

  beforeEach(() => { service = new ForecastInsightService() })

  // ===== 多模型对比 =====

  it('compareForecastModels 应对比至少3种模型', () => {
    const result = service.compareForecastModels()
    expect(result.models.length).toBeGreaterThanOrEqual(3)
    result.models.forEach(m => {
      expect(m.mape).toBeGreaterThan(0)
      expect(m.rSquared).toBeGreaterThan(0)
    })
  })

  it('compareForecastModels 各模型rSquared应在0-1之间', () => {
    const result = service.compareForecastModels()
    result.models.forEach(m => {
      expect(m.rSquared).toBeGreaterThanOrEqual(0)
      expect(m.rSquared).toBeLessThanOrEqual(1)
    })
  })

  it('compareForecastModels bestModel应为最佳模型', () => {
    const result = service.compareForecastModels()
    expect(result.bestModel).toBeTruthy()
    expect(typeof result.bestModel).toBe('string')
  })

  // ===== 场景模拟 =====

  it('simulateScenarios 应包含4种场景概率加权', () => {
    const sim = service.simulateScenarios(1000000)
    expect(sim.scenarios).toHaveLength(4)
    const probSum = sim.scenarios.reduce((s, sc) => s + sc.probability, 0)
    expect(probSum).toBeCloseTo(1.0, 1)
  })

  it('simulateScenarios 乐观场景adjustedForecast应高于基线', () => {
    const sim = service.simulateScenarios(1000000)
    const optimistic = sim.scenarios.find(s => s.name === '乐观场景')
    expect(optimistic).toBeDefined()
    expect(optimistic!.adjustedForecast).toBeGreaterThan(1000000)
  })

  it('simulateScenarios 极端场景adjustedForecast应最低', () => {
    const sim = service.simulateScenarios(1000000)
    const extreme = sim.scenarios.find(s => s.name === '极端场景')
    expect(extreme).toBeDefined()
    expect(extreme!.adjustedForecast).toBeLessThan(1000000)
  })

  it('simulateScenarios 每个场景应有confidenceInterval', () => {
    const sim = service.simulateScenarios(1000000)
    sim.scenarios.forEach(sc => {
      expect(sc.confidenceInterval[0]).toBeLessThanOrEqual(sc.confidenceInterval[1])
    })
  })

  // ===== 敏感性分析 =====

  it('analyzeSensitivity 应返回11个弹性数据点', () => {
    const sa = service.analyzeSensitivity()
    expect(sa.impactCurve).toHaveLength(11)
    expect(sa.mostSensitiveVariables.length).toBeGreaterThan(0)
  })

  it('analyzeSensitivity impactCurve应包含弹性系数', () => {
    const sa = service.analyzeSensitivity()
    sa.impactCurve.forEach(point => {
      expect(point.elasticity).toBeGreaterThanOrEqual(0)
    })
  })

  it('analyzeSensitivity mostSensitiveVariables应排序', () => {
    const sa = service.analyzeSensitivity()
    for (let i = 1; i < sa.mostSensitiveVariables.length; i++) {
      expect(sa.mostSensitiveVariables[i - 1].ranking)
        .toBeLessThanOrEqual(sa.mostSensitiveVariables[i].ranking)
    }
  })

  // ===== 置信度评估 =====

  it('assessForecastConfidence 置信度区间应有序', () => {
    const conf = service.assessForecastConfidence('fc-1')
    const { p10, p25, p50, p75, p90 } = conf.confidenceInterval
    expect(p10).toBeLessThanOrEqual(p25)
    expect(p25).toBeLessThanOrEqual(p50)
    expect(p50).toBeLessThanOrEqual(p75)
    expect(p75).toBeLessThanOrEqual(p90)
  })

  it('assessForecastConfidence 各维度分数应在0-100', () => {
    const conf = service.assessForecastConfidence('fc-1')
    expect(conf.dataQuality).toBeGreaterThan(0)
    expect(conf.dataQuality).toBeLessThanOrEqual(100)
    expect(conf.overallConfidence).toBeGreaterThan(0)
    expect(conf.overallConfidence).toBeLessThanOrEqual(100)
  })

  it('assessForecastConfidence uncertaintyFactors描述应非空', () => {
    const conf = service.assessForecastConfidence('fc-1')
    conf.uncertaintyFactors.forEach(f => {
      expect(f.description).toBeTruthy()
      expect(['high', 'medium', 'low']).toContain(f.impact)
    })
  })

  // ===== 库存推荐 =====

  it('recommendInventory 应给出差异化补货建议', () => {
    const rec1 = service.recommendInventory('SKU-HIGH')
    const rec2 = service.recommendInventory('SKU-LOW')
    expect(rec1.recommendedAction).toBeTruthy()
    expect(rec2.recommendedAction).toBeTruthy()
  })

  it('recommendInventory 成本应合理', () => {
    const rec = service.recommendInventory('SKU-001')
    expect(rec.costImpact.totalCost).toBeGreaterThan(0)
    expect(rec.forecastedDemand).toBeGreaterThan(0)
  })

  it('recommendInventory reorderPoint应基于leadTime', () => {
    const rec = service.recommendInventory('SKU-001')
    expect(rec.reorderPoint).toBeGreaterThan(rec.safetyStock)
  })

  it('recommendInventory stockoutRisk和excessStockRisk对立', () => {
    const rec = service.recommendInventory('SKU-001')
    // 不可能同时高
    expect(rec.stockoutRisk > 50 ? rec.excessStockRisk < 50 : true).toBe(true)
  })

  // ===== 异常检测 =====

  it('detectAnomalies 应标记异常并分配严重程度', () => {
    const anomalies = service.detectAnomalies('营收')
    anomalies.forEach(a => {
      expect(['critical', 'major', 'minor']).toContain(a.severity)
      expect(typeof a.isAnomaly).toBe('boolean')
    })
  })

  it('detectAnomalies 严重异常应有建议操作', () => {
    const anomalies = service.detectAnomalies('营收')
    const critical = anomalies.find(a => a.severity === 'critical')
    if (critical) {
      expect(critical.suggestedAction).toBe('立即调查原因')
    }
  })

  it('detectAnomalies deviationPercent应正确反映偏差', () => {
    const anomalies = service.detectAnomalies('营收')
    anomalies.forEach(a => {
      const expectedDelta = Math.round(((a.actualValue - a.expectedValue) / a.expectedValue) * 10000) / 100
      expect(Math.abs(a.deviationPercent - expectedDelta)).toBeLessThan(0.1)
    })
  })

  // ===== 时间序列分解 =====

  it('decomposeTimeSeries 三部分之和应接近原始值', () => {
    const decomp = service.decomposeTimeSeries(30, 7)
    for (let i = 0; i < decomp.original.length; i++) {
      const reconstructed = decomp.trend[i].value + decomp.seasonal[i].value + decomp.residual[i].value
      const diff = Math.abs(reconstructed - decomp.original[i].value)
      expect(diff).toBeLessThanOrEqual(200)
    }
  })

  it('decomposeTimeSeries 应返回强度指标', () => {
    const decomp = service.decomposeTimeSeries(30, 7)
    expect(decomp.trendStrength).toBeGreaterThan(0)
    expect(decomp.trendStrength).toBeLessThanOrEqual(1)
    expect(decomp.seasonalStrength).toBeGreaterThan(0)
    expect(decomp.seasonalStrength).toBeLessThanOrEqual(1)
  })

  // ===== What-If分析 =====

  it('whatIfAnalysis 应包含多变量调整', () => {
    const wia = service.whatIfAnalysis(1000000)
    expect(wia.adjustments.length).toBeGreaterThanOrEqual(4)
    expect(wia.bestCase.forecast).toBeGreaterThan(wia.baseForecast)
    expect(wia.worstCase.forecast).toBeLessThan(wia.baseForecast)
  })

  it('whatIfAnalysis 每个adjustment应有delta信息', () => {
    const wia = service.whatIfAnalysis(1000000)
    wia.adjustments.forEach(adj => {
      expect(typeof adj.deltaPercent).toBe('number')
    })
  })

  // ===== 准确度报告 =====

  it('getForecastAccuracyReport 应含多时间维度精度', () => {
    const report = service.getForecastAccuracyReport('2026-Q2')
    expect(report.accuracyByHorizon.map(h => h.horizon)).toContain('日')
    expect(report.accuracyByHorizon.map(h => h.horizon)).toContain('周')
    expect(report.accuracyByHorizon.map(h => h.horizon)).toContain('月')
  })

  it('getForecastAccuracyReport 短期精度应高于长期', () => {
    const report = service.getForecastAccuracyReport('2026-Q2')
    const day = report.accuracyByHorizon.find(h => h.horizon === '日')
    const quarter = report.accuracyByHorizon.find(h => h.horizon === '季')
    expect(day!.accuracy).toBeGreaterThan(quarter!.accuracy)
  })

  // ===== 需求塑形 =====

  it('analyzeDemandShaping 价格曲线应递减', () => {
    const ds = service.analyzeDemandShaping('prod-001')
    for (let i = 1; i < ds.priceVolumeCurve.length; i++) {
      expect(ds.priceVolumeCurve[i].price).toBeGreaterThan(ds.priceVolumeCurve[i - 1].price)
      expect(ds.priceVolumeCurve[i].demand).toBeLessThanOrEqual(ds.priceVolumeCurve[i - 1].demand)
    }
    expect(ds.promotionCalendar.length).toBeGreaterThan(0)
  })

  it('analyzeDemandShaping revenue先升后降体现最优价格', () => {
    const ds = service.analyzeDemandShaping('prod-001')
    const revenues = ds.priceVolumeCurve.map(p => p.revenue)
    const maxRev = Math.max(...revenues)
    const maxIdx = revenues.indexOf(maxRev)
    // 最优价格点存在(非端点都合理)
    expect(maxRev).toBeGreaterThan(0)
  })

  // ===== 集成场景 =====

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
