/**
 * ai-advanced-services.spec.ts — 全部高级服务综合测试
 *
 * 覆盖：AdvancedInsightService 所有方法
 * 三件套：正例+反例+边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AdvancedInsightService } from './ai-insight-advanced.service'

describe('AdvancedInsightService', () => {
  let service: AdvancedInsightService

  beforeEach(() => {
    service = new AdvancedInsightService()
  })

  // ===== 深度归因 =====

  it('deepAttribution 应返回归因贡献度并按贡献降序', () => {
    const attr = service.deepAttribution('营收', '渠道')
    expect(attr.contributions.length).toBeGreaterThan(0)
    expect(attr.topDrivers.length).toBeGreaterThan(0)
    for (let i = 1; i < attr.contributions.length; i++) {
      expect(attr.contributions[i - 1].contribution).toBeGreaterThanOrEqual(attr.contributions[i].contribution)
    }
  })

  it('deepAttribution 每个贡献项应有priorPeriodValue', () => {
    const attr = service.deepAttribution('营收', '渠道')
    attr.contributions.forEach(c => {
      expect(c.priorPeriodValue).toBeGreaterThan(0)
      expect(c.changePercent).toBeDefined()
    })
  })

  it('deepAttribution 应支持自定义filters参数', () => {
    const attr = service.deepAttribution('营收', '渠道', { region: '华东', period: '2026-Q2' })
    expect(attr.filters).toEqual({ region: '华东', period: '2026-Q2' })
  })

  it('deepAttribution topDrivers不超过3个', () => {
    const attr = service.deepAttribution('营收', '渠道')
    expect(attr.topDrivers.length).toBeLessThanOrEqual(3)
    expect(attr.topDrivers.length).toBeGreaterThan(0)
  })

  // ===== 指标预测 =====

  it('forecastMetric 应包含历史和预测数据', () => {
    const forecast = service.forecastMetric('日营收')
    expect(forecast.historicalData.length).toBeGreaterThan(0)
    expect(forecast.forecastData.length).toBeGreaterThan(0)
    expect(forecast.confidenceScore).toBeGreaterThan(0)
  })

  it('forecastMetric 预测值应在上下界之间', () => {
    const forecast = service.forecastMetric('日营收', 12)
    forecast.forecastData.forEach(f => {
      expect(f.forecast).toBeGreaterThanOrEqual(f.lowerBound)
      expect(f.forecast).toBeLessThanOrEqual(f.upperBound)
    })
  })

  it('forecastMetric 自定义periods参数', () => {
    const forecast5 = service.forecastMetric('日营收', 5)
    expect(forecast5.historicalData).toHaveLength(5)
    const forecast12 = service.forecastMetric('日营收', 12)
    expect(forecast12.historicalData).toHaveLength(12)
  })

  // ===== 数据质量报告 =====

  it('getDataQualityReport 应包含总分和各维度得分', () => {
    const report = service.getDataQualityReport()
    expect(report.overallScore).toBeGreaterThan(0)
    expect(report.completeness).toBeGreaterThan(0)
    expect(report.issues.length).toBeGreaterThan(0)
    expect(report.scoreHistory.length).toBeGreaterThan(0)
  })

  it('getDataQualityReport 各维度得分独立影响总分', () => {
    const report = service.getDataQualityReport()
    const avg = (report.completeness + report.accuracy + report.consistency + report.timeliness + report.uniqueness) / 5
    expect(Math.abs(report.overallScore - avg)).toBeLessThanOrEqual(0.5)
  })

  it('getDataQualityReport 每个issue应有recommendation', () => {
    const report = service.getDataQualityReport()
    report.issues.forEach(issue => {
      expect(issue.recommendation).toBeTruthy()
      expect(issue.affectedRows).toBeGreaterThan(0)
    })
  })

  // ===== 洞察推荐 =====

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

  it('generateInsightRecommendations 应包含opportunity/risk等类型', () => {
    const recs = service.generateInsightRecommendations()
    const allTypes = recs.map(r => r.type)
    expect(allTypes).toContain('opportunity')
    expect(allTypes).toContain('risk')
    expect(allTypes).toContain('trend')
    expect(allTypes).toContain('anomaly')
  })

  it('generateInsightRecommendations impact异号表示方向', () => {
    const recs = service.generateInsightRecommendations()
    const positives = recs.filter(r => r.impact > 0)
    const negatives = recs.filter(r => r.impact < 0)
    expect(positives.length).toBeGreaterThan(0)
    expect(negatives.length).toBeGreaterThan(0)
  })

  // ===== 多维下钻 =====

  it('drillDown 应返回可下钻的路径', () => {
    const dd = service.drillDown('营收', '全部', {})
    expect(dd.drillDownPaths.length).toBeGreaterThan(0)
    expect(dd.breadcrumbs.length).toBeGreaterThan(0)
    expect(dd.availableLevels.length).toBeGreaterThan(0)
  })

  it('drillDown 当前级别不可下钻时应有默认下级', () => {
    const dd = service.drillDown('营收', '未知级别', {})
    expect(dd.drillDownPaths.length).toBeGreaterThan(0)
    expect(dd.currentLevel).toBe('未知级别')
  })

  it('drillDown drillDownPaths应metric降序排列', () => {
    const dd = service.drillDown('营收', '全部', {})
    for (let i = 1; i < dd.drillDownPaths.length; i++) {
      expect(dd.drillDownPaths[i - 1].metric).toBeGreaterThanOrEqual(dd.drillDownPaths[i].metric)
    }
  })

  // ===== 同行对比 =====

  it('getBenchmarkComparison 应返回同行对比', () => {
    const bench = service.getBenchmarkComparison('CSAT')
    expect(bench.yourValue).toBeGreaterThan(0)
    expect(bench.industryAverage).toBeGreaterThan(0)
    expect(bench.topPerformer).toBeGreaterThan(0)
    expect(bench.recommendations.length).toBeGreaterThan(0)
  })

  it('getBenchmarkComparison yourValue应介于industryAverage和topPerformer之间或之外', () => {
    const bench = service.getBenchmarkComparison('CSAT')
    // 不一定，但需要是有效数字
    expect(bench.yourValue).toBeGreaterThanOrEqual(0)
    expect(bench.topPerformer).toBeGreaterThanOrEqual(bench.industryAverage)
  })

  it('getBenchmarkComparison 返回有效的percentile', () => {
    const bench = service.getBenchmarkComparison('CSAT')
    expect(bench.percentile).toBeGreaterThanOrEqual(0)
    expect(bench.percentile).toBeLessThanOrEqual(100)
  })

  // ===== 时间对比 =====

  it('compareTimePeriods 应返回同比环比', () => {
    const comp = service.compareTimePeriods('营收')
    expect(comp.currentPeriod.value).toBeGreaterThan(0)
    expect(comp.periodChange.absolute).not.toBeNaN()
    expect(comp.preDefinedComparisons.length).toBeGreaterThan(0)
  })

  it('compareTimePeriods YoY数据点完整', () => {
    const comp = service.compareTimePeriods('营收')
    expect(comp.yearOverYear.current).toBeGreaterThan(0)
    expect(comp.yearOverYear.previous).toBeGreaterThan(0)
    expect(comp.yearOverYear.changePercent).toBeDefined()
  })

  it('compareTimePeriods preDefinedComparisons应有环比标签', () => {
    const comp = service.compareTimePeriods('营收')
    const labels = comp.preDefinedComparisons.map(c => c.label)
    expect(labels).toContain('环比上周')
    expect(labels).toContain('同比去年')
  })

  // ===== 相关性分析 =====

  it('analyzeCorrelations 应返回相关性矩阵', () => {
    const corr = service.analyzeCorrelations(['日营收', '到店人数', '客单价'])
    expect(corr.metrics).toHaveLength(3)
    expect(corr.correlationMatrix.length).toBeGreaterThan(0)
    expect(corr.keyInsights.length).toBeGreaterThan(0)
  })

  it('analyzeCorrelations 系数范围应在[-1, 1]之间', () => {
    const corr = service.analyzeCorrelations(['日营收', '到店人数', '客单价'])
    corr.correlationMatrix.forEach(c => {
      expect(c.correlationCoefficient).toBeGreaterThanOrEqual(-1)
      expect(c.correlationCoefficient).toBeLessThanOrEqual(1)
    })
  })

  it('analyzeCorrelations 空metrics应使用默认指标', () => {
    const corr = service.analyzeCorrelations([])
    expect(corr.metrics.length).toBeGreaterThan(0)
    expect(corr.correlationMatrix.length).toBeGreaterThan(0)
  })

  it('analyzeCorrelations strength字段应有效', () => {
    const corr = service.analyzeCorrelations(['日营收', '到店人数', '客单价'])
    corr.correlationMatrix.forEach(c => {
      expect(['strong', 'moderate', 'weak', 'none']).toContain(c.strength)
    })
  })
})
