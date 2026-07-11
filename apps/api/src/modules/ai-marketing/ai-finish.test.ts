/**
 * ai-finish.test.ts — 最终测试补充
 */
import { describe, it, expect } from 'vitest'
import { MarketingAnalyticsService } from './ai-marketing-analytics.service'
import { CampaignOptimizerService } from './ai-marketing-campaign-optimizer.service'

describe('CampaignOptimizerService Final', () => {
  const s = new CampaignOptimizerService()

  it('getCampaignPerformance', () => {
    const r = s.getCampaignPerformance('c1')
    expect(r.optimizationScore).toBeGreaterThan(0)
    expect(r.trend).toBeDefined()
  })

  it('optimizeBid', () => {
    const r = s.optimizeBid('c1', 2, 1000, 10)
    expect(r.suggestedBid).toBeGreaterThan(0)
  })

  it('recommendAudienceSegments', () => expect(s.recommendAudienceSegments('c1').length).toBeGreaterThan(0))
  it('getCreativePerformance', () => expect(s.getCreativePerformance(['c1', 'c2'])).toHaveLength(2))
  it('recommendFrequencyCap', () => expect(s.recommendFrequencyCap('c1').recommendedDailyCap).toBeGreaterThan(0))
  it('analyzeBudgetPacing', () => expect(s.analyzeBudgetPacing(1000, '2026-01-01', '2026-01-31', 500, 15).pacing).toBeDefined())
  it('getRealTimeBidAdvice', () => expect(s.getRealTimeBidAdvice('c1', 2).suggestedBid).toBeGreaterThan(0))
  it('getChannelFrequencyReport', () => {
    const r = s.getChannelFrequencyReport(['push', 'email'])
    expect(r).toHaveLength(2)
  })
  it('optimizeCPA under target', () => expect(s.optimizeCPA(20, 30, 2, 100).savings).toBe(0))
  it('optimizeCPA over target', () => expect(s.optimizeCPA(50, 30, 2, 100).savings).toBeGreaterThan(0))
})

describe('MarketingAnalyticsService Final', () => {
  const s = new MarketingAnalyticsService()

  it('attributionAnalysis', () => expect(s.attributionAnalysis([]).length).toBeGreaterThan(0))
  it('funnelAnalysis', () => expect(s.funnelAnalysis([]).topOfFunnel.impressions).toBeGreaterThan(0))
  it('simulateBudgetAllocation', () => {
    const r = s.simulateBudgetAllocation(50000, [])
    expect(r.scenarios).toHaveLength(3)
  })
  it('cohortAnalysis', () => expect(s.cohortAnalysis(4)).toHaveLength(4))
  it('competitiveAnalysis', () => expect(s.competitiveAnalysis('tech').length).toBeGreaterThan(0))
  it('seasonalTrends', () => expect(s.seasonalTrends()).toHaveLength(4))
  it('generateAISuggestions', () => expect(s.generateAISuggestions().length).toBeGreaterThanOrEqual(4))
})
