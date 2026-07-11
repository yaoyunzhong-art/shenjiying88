/**
 * ai-advanced-services.spec.ts — 全部高级服务综合测试
 *
 * 覆盖：AdvancedInsightService + ForecastInsightService(部分)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AdvancedInsightService } from './ai-insight-advanced.service'

describe('AdvancedInsightService', () => {
  let service: AdvancedInsightService

  beforeEach(() => {
    service = new AdvancedInsightService()
  })

  it('deepAttribution 应返回归因贡献度并按贡献降序', () => {
    const attr = service.deepAttribution('营收', '渠道')
    expect(attr.contributions.length).toBeGreaterThan(0)
    expect(attr.topDrivers.length).toBeGreaterThan(0)
    for (let i = 1; i < attr.contributions.length; i++) {
      expect(attr.contributions[i - 1].contribution).toBeGreaterThanOrEqual(attr.contributions[i].contribution)
    }
  })

  it('forecastMetric 应包含历史和预测数据', () => {
    const forecast = service.forecastMetric('日营收')
    expect(forecast.historicalData.length).toBeGreaterThan(0)
    expect(forecast.forecastData.length).toBeGreaterThan(0)
    expect(forecast.confidenceScore).toBeGreaterThan(0)
  })

  it('getDataQualityReport 应包含总分和各维度得分', () => {
    const report = service.getDataQualityReport()
    expect(report.overallScore).toBeGreaterThan(0)
    expect(report.completeness).toBeGreaterThan(0)
    expect(report.issues.length).toBeGreaterThan(0)
    expect(report.scoreHistory.length).toBeGreaterThan(0)
  })

  it('generateInsightRecommendations 应包含多种类型', () => {
    const recs = service.generateInsightRecommendations()
    expect(recs.length).toBeGreaterThan(0)
    const types = new Set(recs.map(r => r.type))
    expect(types.size).toBeGreaterThanOrEqual(2)
    recs.forEach(r => {
      expect(r.actionable).toBe(true)
      expect(r.suggestedAction).toBeTruthy()
      expect(r.relatedKPIs.length).toBeGreaterThan(0)
    })
  })

  it('drillDown 应返回可下钻的路径', () => {
    const dd = service.drillDown('营收', '全部', {})
    expect(dd.drillDownPaths.length).toBeGreaterThan(0)
    expect(dd.breadcrumbs.length).toBeGreaterThan(0)
    expect(dd.availableLevels.length).toBeGreaterThan(0)
  })

  it('getBenchmarkComparison 应返回同行对比', () => {
    const bench = service.getBenchmarkComparison('CSAT')
    expect(bench.yourValue).toBeGreaterThan(0)
    expect(bench.industryAverage).toBeGreaterThan(0)
    expect(bench.topPerformer).toBeGreaterThan(0)
    expect(bench.recommendations.length).toBeGreaterThan(0)
  })

  it('compareTimePeriods 应返回同比环比', () => {
    const comp = service.compareTimePeriods('营收')
    expect(comp.currentPeriod.value).toBeGreaterThan(0)
    expect(comp.periodChange.absolute).not.toBeNaN()
    expect(comp.preDefinedComparisons.length).toBeGreaterThan(0)
  })

  it('analyzeCorrelations 应返回相关性矩阵', () => {
    const corr = service.analyzeCorrelations(['日营收', '到店人数', '客单价'])
    expect(corr.metrics).toHaveLength(3)
    expect(corr.correlationMatrix.length).toBeGreaterThan(0)
    expect(corr.keyInsights.length).toBeGreaterThan(0)
    corr.correlationMatrix.forEach(c => {
      expect(c.correlationCoefficient).toBeGreaterThanOrEqual(-1)
      expect(c.correlationCoefficient).toBeLessThanOrEqual(1)
    })
  })
})
