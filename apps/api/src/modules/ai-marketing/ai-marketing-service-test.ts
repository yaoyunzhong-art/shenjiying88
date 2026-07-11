/**
 * ai-marketing-service-test.ts — 营销 Service 额外测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiMarketingService } from './ai-marketing.service'
import { MarketingROIService, CopywritingAssistant, CampaignPlanner, AIMarketingCMOService } from './ai-marketing-cmo.service'

describe('AiMarketingService Final', () => {
  let s: AiMarketingService
  beforeEach(() => {
    const roi = new MarketingROIService()
    const copy = new CopywritingAssistant()
    const planner = new CampaignPlanner()
    const cmo = new AIMarketingCMOService(roi, copy, planner)
    s = new AiMarketingService(roi, copy, planner, cmo)
  })

  it('calculateCampaignROI 存在', () => expect(s.calculateCampaignROI('camp-001')!.isPositive).toBe(true))
  it('calculateCampaignROI 不存在', () => expect(s.calculateCampaignROI('ghost')).toBeNull())
  it('compareCampaigns', () => expect(s.compareCampaigns(['camp-001', 'camp-002'])).toHaveLength(2))
  it('projectROI', () => expect(s.projectROI({ type: 'brand', budget: 0 }).expectedROI).toBeDefined())
  it('getOptimalBudget', () => expect(s.getOptimalBudget('performance', 10000).length).toBeGreaterThan(0))
  it('generateCopy', () => expect(s.generateCopy({ product: 'P', goal: 'awareness', audience: 'A' }).headline).toBeTruthy())
  it('optimizeHeadline', () => expect(s.optimizeHeadline('新品').length).toBeGreaterThan(2))
  it('localizeCopy', () => {
    const c = s.generateCopy({ product: 'P', goal: 'conversion', audience: 'A' })
    expect(s.localizeCopy(c, 'ja-JP').cta).toBe('今すぐ購入')
  })
  it('getModuleStats', () => {
    const stat = s.getModuleStats()
    expect(stat.positiveCampaigns + stat.negativeCampaigns).toBe(stat.totalCampaigns)
  })
  it('analyzeMarketing 含ROI', () => expect(s.analyzeMarketing('camp-001').roi).toBeDefined())
  it('analyzeMarketing 不含ROI', () => expect(s.analyzeMarketing('camp-001', { includeROI: false }).roi).toBeUndefined())
})

/**
 * ai-insight-service-test.ts — 洞察 Service 额外测试
 */
import { AiInsightService } from './ai-insight.service'

describe('AiInsightService Final', () => {
  const s = new AiInsightService()

  it('getKPIs 返回列表', () => expect(s.getKPIs('default').length).toBeGreaterThan(0))
  it('getKPIDetail 存在', () => expect(s.getKPIDetail('kpi-0')).toBeDefined())
  it('getKPIDetail 不存在', () => expect(s.getKPIDetail('none')).toBeUndefined())
  it('generateReport', () => {
    const r = s.generateReport('default', undefined, 'revenue', '2026-01-01', '2026-01-07')
    expect(r.type).toBe('revenue')
  })
  it('getReports', () => {
    s.generateReport('default', undefined, 'revenue', '2026-01-01', '2026-01-07')
    expect(s.getReports('default').length).toBe(1)
  })
  it('detectAnomalies', () => expect(s.detectAnomalies('default')).toBeInstanceOf(Array))
  it('getDashboardSummary', () => expect(s.getDashboardSummary('default').tenantId).toBe('default'))
  it('generateForecast', () => {
    const t = s.generateForecast('default', '日营收', '7d')
    expect(t.forecast).toHaveLength(7)
  })
})
