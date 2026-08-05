/**
 * ai-marketing-analytics.service.spec.ts — AI 营销高级分析服务测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MarketingAnalyticsService } from './ai-marketing-analytics.service'
import { CampaignOptimizerService } from './ai-marketing-campaign-optimizer.service'

describe('MarketingAnalyticsService', () => {
  let service: MarketingAnalyticsService

  beforeEach(() => {
    service = new MarketingAnalyticsService()
  })

  it('attributionAnalysis 应返回所有渠道的归因结果', () => {
    const results = service.attributionAnalysis([])
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => {
      expect(r.channel).toBeTruthy()
      expect(r.costPerAcquisition).toBeGreaterThanOrEqual(0)
      expect(r.returnOnAdSpend).toBeGreaterThanOrEqual(0)
    })
  })

  it('funnelAnalysis 应包含完整漏斗指标', () => {
    const funnel = service.funnelAnalysis([])
    expect(funnel.topOfFunnel.impressions).toBeGreaterThan(0)
    expect(funnel.middleOfFunnel.clicks).toBeGreaterThan(0)
    expect(funnel.bottomOfFunnel.conversions).toBeGreaterThan(0)
    expect(funnel.dropOffRates.overall).toBeGreaterThan(0)
  })

  it('simulateBudgetAllocation 应生成多个方案并推荐最佳', () => {
    const sim = service.simulateBudgetAllocation(100000, [])
    expect(sim.scenarios.length).toBeGreaterThanOrEqual(2)
    expect(sim.recommendedScenario).toBeTruthy()
    sim.scenarios.forEach(s => {
      expect(s.expectedROI).toBeGreaterThan(0)
    })
  })

  it('cohortAnalysis 应返回指定数量的 cohort', () => {
    const cohorts = service.cohortAnalysis(4)
    expect(cohorts).toHaveLength(4)
    cohorts.forEach(c => {
      expect(c.retentionRates.length).toBeGreaterThan(0)
      expect(c.cumulativeRevenue).toBeGreaterThan(0)
    })
  })

  it('competitiveAnalysis 应返回竞争对手列表', () => {
    const competitors = service.competitiveAnalysis('martech')
    expect(competitors.length).toBeGreaterThan(0)
    competitors.forEach(c => {
      expect(c.strengths.length).toBeGreaterThan(0)
      expect(c.weaknesses.length).toBeGreaterThan(0)
    })
  })

  it('seasonalTrends 应覆盖全年四季', () => {
    const trends = service.seasonalTrends()
    expect(trends).toHaveLength(4)
    const seasons = trends.map(t => t.season)
    expect(seasons).toContain('春季')
    expect(seasons).toContain('夏季')
    expect(seasons).toContain('秋季')
    expect(seasons).toContain('冬季')
  })

  it('generateAISuggestions 应返回至少 3 条建议', () => {
    const suggestions = service.generateAISuggestions()
    expect(suggestions.length).toBeGreaterThanOrEqual(3)
    suggestions.forEach(s => {
      expect(s.category).toBeTruthy()
      expect(s.priority).toBeTruthy()
      expect(s.expectedImpact).toBeTruthy()
    })
  })
})

describe('CampaignOptimizerService', () => {
  let service: CampaignOptimizerService

  beforeEach(() => {
    service = new CampaignOptimizerService()
  })

  it('getCampaignPerformance 应返回性能指标', () => {
    const perf = service.getCampaignPerformance('camp-001')
    expect(perf.campaignId).toBe('camp-001')
    expect(perf.currentROI).toBeGreaterThan(0)
    expect(perf.optimizationScore).toBeGreaterThan(0)
  })

  it('optimizeBid 应基于当前出价给出优化建议', () => {
    const result = service.optimizeBid('camp-001', 2.5, 5000, 8)
    expect(result.currentBid).toBe(2.5)
    expect(result.suggestedBid).toBeGreaterThan(0)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('recommendAudienceSegments 应按 ROI 降序排列', () => {
    const segments = service.recommendAudienceSegments('camp-001')
    expect(segments.length).toBeGreaterThan(0)
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i - 1].predictedROI).toBeGreaterThanOrEqual(segments[i].predictedROI)
    }
  })

  it('getCreativePerformance 应返回每个素材的性能', () => {
    const results = service.getCreativePerformance(['cre-1', 'cre-2', 'cre-3'])
    expect(results).toHaveLength(3)
    results.forEach(r => {
      expect(['image', 'video', 'text', 'carousel']).toContain(r.type)
      expect(r.roas).toBeGreaterThanOrEqual(0)
    })
  })

  it('recommendFrequencyCap 应给出合理频控建议', () => {
    const cap = service.recommendFrequencyCap('camp-001')
    expect(cap.currentFrequency).toBeGreaterThan(0)
    expect(cap.recommendedDailyCap).toBeGreaterThan(0)
    expect(cap.recommendedWeeklyCap).toBeGreaterThan(cap.recommendedDailyCap)
  })

  it('analyzeBudgetPacing 应识别预算消耗节奏', () => {
    const pacing = service.analyzeBudgetPacing(10000, '2026-01-01', '2026-01-31', 3000, 10)
    expect(pacing.totalBudget).toBe(10000)
    expect(pacing.remaining).toBeGreaterThan(0)
    expect(['ahead', 'behind', 'on_track']).toContain(pacing.pacing)
  })

  it('getRealTimeBidAdvice 应返回实时竞价建议', () => {
    const advice = service.getRealTimeBidAdvice('camp-001', 2.0)
    expect(advice.suggestedBid).toBeGreaterThan(0)
    expect(advice.minBid).toBeLessThanOrEqual(advice.suggestedBid)
    expect(advice.maxBid).toBeGreaterThanOrEqual(advice.suggestedBid)
  })

  it('getChannelFrequencyReport 应返回每个渠道的频率报告', () => {
    const reports = service.getChannelFrequencyReport(['push', 'sms', 'email'])
    expect(reports).toHaveLength(3)
    reports.forEach(r => {
      expect(r.averageFrequency).toBeGreaterThan(0)
      expect(r.frequencyDistribution.length).toBeGreaterThan(0)
    })
  })

  it('optimizeCPA 应给出 CPA 优化建议', () => {
    const result = service.optimizeCPA(50, 30, 2.5, 200)
    expect(result.recommendedCPA).toBeGreaterThan(0)
    expect(result.expectedConversions).toBeGreaterThan(0)
  })

  it('当当前 CPA 已低于目标时应维持不变', () => {
    const result = service.optimizeCPA(20, 30, 3.0, 200)
    expect(result.recommendedCPA).toBe(20)
    expect(result.savings).toBe(0)
  })
})
