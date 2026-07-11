/**
 * ai-forecast-diagnostic.test.ts — AI 预测诊断服务集成测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'
import { ForecastInsightService } from './ai-forecast-insight.service'

describe('Forecast Full Integration', () => {
  let forecastService: DemandForecastService
  let insightService: ForecastInsightService
  let inventoryService: InventoryOptimizer
  let transferService: TransferRecommendationService

  beforeEach(() => {
    forecastService = new DemandForecastService()
    insightService = new ForecastInsightService()
    inventoryService = new InventoryOptimizer()
    transferService = new TransferRecommendationService()
  })

  it('需求预测 → 库存推荐 → 调拨建议完整链路', () => {
    // 1. 需求预测
    const forecast = forecastService.forecast('prod-001', 30)
    expect(forecast.predictions.length).toBe(30)

    // 2. 库存补货
    const reorder = inventoryService.suggestReorder('prod-001', 100, 7)
    expect(reorder.reorderQuantity).toBeGreaterThan(0)

    // 3. 调拨建议
    const transfers = transferService.getRecommendations('store-a', ['store-b', 'store-c'])
    expect(transfers).toBeInstanceOf(Array)
  })

  it('场景模拟 → 敏感性分析 → 置信度评估', () => {
    // 1. 场景模拟
    const sim = insightService.simulateScenarios(1000000)
    expect(sim.scenarios.length).toBe(4)
    expect(sim.weightedForecast).toBeGreaterThan(0)

    // 2. 敏感性分析
    const sa = insightService.analyzeSensitivity()
    expect(sa.mostSensitiveVariables.length).toBeGreaterThan(0)

    // 3. 置信度
    const conf = insightService.assessForecastConfidence('fc-001')
    expect(conf.overallConfidence).toBeGreaterThan(0)
  })

  it('异常检测 → 时间序列分解 → 什么-如果分析', () => {
    // 1. 异常检测
    const anomalies = insightService.detectAnomalies('月营收')
    expect(anomalies.length).toBeGreaterThan(0)

    // 2. 时间序列
    const decomp = insightService.decomposeTimeSeries(30, 7)
    expect(decomp.original.length).toBe(30)

    // 3. What-if
    const wia = insightService.whatIfAnalysis(1000000)
    expect(wia.adjustments.length).toBeGreaterThan(0)
  })

  it('多模型对比 → 需求塑形 → 准确度报告', () => {
    // 1. 模型对比
    const compare = insightService.compareForecastModels()
    expect(compare.bestModel).toBeTruthy()

    // 2. 需求塑形
    const ds = insightService.analyzeDemandShaping('prod-001')
    expect(ds.priceVolumeCurve.length).toBe(9)

    // 3. 准确度报告
    const report = insightService.getForecastAccuracyReport('2026-Q2')
    expect(report.overallAccuracy).toBeGreaterThan(0)
  })
})
