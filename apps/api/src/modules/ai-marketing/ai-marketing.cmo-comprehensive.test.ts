/**
 * ai-marketing.cmo-comprehensive.test.ts — AI 营销 CMO 子服务完整测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
} from './ai-marketing-cmo.service'

describe('MarketingROIService', () => {
  let service: MarketingROIService

  beforeEach(() => {
    service = new MarketingROIService()
  })

  it('应计算正收益活动的 ROI', () => {
    const result = service.calculateCampaignROI('camp-001')
    expect(result!.isPositive).toBe(true)
    expect(result!.profit).toBeGreaterThan(0)
  })

  it('应计算亏损活动的 ROI', () => {
    const result = service.calculateCampaignROI('camp-005')
    expect(result!.isPositive).toBe(false)
    expect(result!.profit).toBeLessThan(0)
  })

  it('不存在活动应返回 null', () => {
    expect(service.calculateCampaignROI('ghost')).toBeNull()
  })

  it('compareCampaigns 应返回按 ROI 降序的结果', () => {
    const results = service.compareCampaigns(['camp-001', 'camp-002', 'camp-005'])
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].roi).toBeGreaterThanOrEqual(results[i].roi)
    }
  })

  it('projectROI 应返回合法范围', () => {
    const proj = service.projectROI({ type: 'performance', budget: 50000 })
    expect(proj.maxROI).toBeGreaterThanOrEqual(proj.minROI)
    expect(proj.expectedROI).toBeGreaterThanOrEqual(proj.minROI)
    expect(proj.expectedROI).toBeLessThanOrEqual(proj.maxROI)
  })

  it('getOptimalBudget 应分配 100% 预算', () => {
    const allocs = service.getOptimalBudget('performance', 100000)
    const totalPct = allocs.reduce((s, a) => s + a.percent, 0)
    expect(totalPct).toBeCloseTo(100, 0)
  })
})

describe('CopywritingAssistant', () => {
  let service: CopywritingAssistant

  beforeEach(() => {
    service = new CopywritingAssistant()
  })

  it('应生成包含所有字段的文案', () => {
    const copy = service.generateCopy({
      product: '智能手表',
      goal: 'conversion',
      audience: '25-40岁',
    })
    expect(copy.headline).toBeTruthy()
    expect(copy.body).toBeTruthy()
    expect(copy.cta).toBeTruthy()
    expect(copy.taglines.length).toBeGreaterThan(0)
  })

  it('optimizeHeadline 应返回优化后的标题', () => {
    const original = '新款智能手表'
    const optimized = service.optimizeHeadline(original)
    expect(optimized).toBeTruthy()
    expect(optimized.length).toBeGreaterThanOrEqual(original.length)
  })

  it('localizeCopy 应替换 CTA', () => {
    const copy = service.generateCopy({
      product: 'Test',
      goal: 'conversion',
      audience: 'test',
    })
    const localized = service.localizeCopy(copy, 'en-US')
    expect(localized.cta).toBe('Buy Now')
  })

  it('abTestVariants 应生成指定数量的变体', () => {
    const variants = service.abTestVariants({
      product: 'Test',
      goal: 'conversion',
      audience: 'test',
    }, 3)
    expect(variants).toHaveLength(3)
  })

  it('abTestVariants 即使请求 10 个变体也最多返回 5 个', () => {
    const variants = service.abTestVariants({
      product: 'Test',
      goal: 'conversion',
      audience: 'test',
    }, 10)
    expect(variants.length).toBeLessThanOrEqual(5)
  })
})

describe('CampaignPlanner', () => {
  let service: CampaignPlanner

  beforeEach(() => {
    service = new CampaignPlanner()
  })

  it('应推荐 3 个活动类型', () => {
    const suggestions = service.suggestCampaignType('conversion', 50000, '25-40岁白领')
    expect(suggestions).toHaveLength(3)
    suggestions.forEach(s => {
      expect(s.type).toBeTruthy()
      expect(s.channels.length).toBeGreaterThan(0)
    })
  })

  it('planCampaignTimeline 应返回 3 个里程碑', () => {
    const timeline = service.planCampaignTimeline('awareness')
    expect(timeline).toHaveLength(3)
    expect(timeline[0].phase).toBe('预热期')
  })

  it('estimateReach 应返回正数', () => {
    const reach = service.estimateReach(10000, 'wechat')
    expect(reach.impressions).toBeGreaterThan(0)
    expect(reach.cost).toBeGreaterThan(0)
  })
})
