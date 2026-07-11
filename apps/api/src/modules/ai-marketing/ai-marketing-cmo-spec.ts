/**
 * ai-marketing-cmo-spec.ts — 营销 CMO 子服务完整测试
 */
import { describe, it, expect } from 'vitest'
import { MarketingROIService, CopywritingAssistant, CampaignPlanner } from './ai-marketing-cmo.service'

describe('MarketingROIService (All)', () => {
  const s = new MarketingROIService()
  it('camp-001 ROI 正', () => expect(s.calculateCampaignROI('camp-001')!.isPositive).toBe(true))
  it('camp-002 ROI 正', () => expect(s.calculateCampaignROI('camp-002')!.isPositive).toBe(true))
  it('camp-003 ROI 正', () => expect(s.calculateCampaignROI('camp-003')!.isPositive).toBe(true))
  it('camp-004 ROI 正', () => expect(s.calculateCampaignROI('camp-004')!.isPositive).toBe(true))
  it('camp-005 ROI 负', () => expect(s.calculateCampaignROI('camp-005')!.isPositive).toBe(false))
  it('不存在返回 null', () => expect(s.calculateCampaignROI('ghost')).toBeNull())
  it('compareCampaigns 过滤不存在', () => expect(s.compareCampaigns(['camp-001', 'ghost'])).toHaveLength(1))
  it('projectROI 返回范围', () => {
    const p = s.projectROI({ type: 'performance', budget: 50000 })
    expect(p.maxROI).toBeGreaterThanOrEqual(p.minROI)
  })
  it('getOptimalBudget', () => expect(s.getOptimalBudget('email', 10000).length).toBeGreaterThan(0))
})

describe('CopywritingAssistant (All)', () => {
  const s = new CopywritingAssistant()
  it('generateCopy', () => {
    const c = s.generateCopy({ product: 'P', goal: 'conversion', audience: 'A' })
    expect(c.headline).toBeTruthy()
    expect(c.body).toBeTruthy()
    expect(c.cta).toBeTruthy()
  })
  it('optimizeHeadline', () => expect(s.optimizeHeadline('新品').length).toBeGreaterThan(2))
  it('localizeCopy 替换 CTA', () => {
    const c = s.generateCopy({ product: 'P', goal: 'conversion', audience: 'A' })
    expect(s.localizeCopy(c, 'en-US').cta).toBe('Buy Now')
  })
  it('abTestVariants 2 变体', () => {
    expect(s.abTestVariants({ product: 'P', goal: 'conversion', audience: 'A' }, 2)).toHaveLength(2)
  })
  it('abTestVariants 最多 5', () => {
    expect(s.abTestVariants({ product: 'P', goal: 'conversion', audience: 'A' }, 10).length).toBeLessThanOrEqual(5)
  })
})

describe('CampaignPlanner (All)', () => {
  const s = new CampaignPlanner()
  it('suggestCampaignType 3 推荐', () => expect(s.suggestCampaignType('conversion', 50000, 'A')).toHaveLength(3))
  it('planCampaignTimeline 3 阶段', () => expect(s.planCampaignTimeline('awareness')).toHaveLength(3))
  it('estimateReach', () => {
    const r = s.estimateReach(10000, 'wechat')
    expect(r.impressions).toBeGreaterThan(0)
    expect(r.cost).toBeGreaterThan(0)
  })
})
