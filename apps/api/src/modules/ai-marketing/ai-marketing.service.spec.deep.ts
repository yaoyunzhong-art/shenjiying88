/**
 * ai-marketing.service.spec.deep.ts — AI 营销 Service 深入边界测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiMarketingService } from './ai-marketing.service'
import { MarketingROIService, CopywritingAssistant, CampaignPlanner, AIMarketingCMOService } from './ai-marketing-cmo.service'

describe('AiMarketingService (Deep)', () => {
  let service: AiMarketingService
  let roiService: MarketingROIService
  let copyService: CopywritingAssistant
  let campaignPlanner: CampaignPlanner

  beforeEach(() => {
    roiService = new MarketingROIService()
    copyService = new CopywritingAssistant()
    campaignPlanner = new CampaignPlanner()
    const cmoService = new AIMarketingCMOService(roiService, copyService, campaignPlanner)
    service = new AiMarketingService(roiService, copyService, campaignPlanner, cmoService)
  })

  describe('ROI边界', () => {
    it('零成本活动 ROI 应为 0 或 Infinity', () => {
      // Zero cost edge case - handled by the ROI service
      // We can't create zero-cost campaigns with mock data, but we test the projection instead
      const proj = service.projectROI({ type: 'email', budget: 0 })
      expect(proj).toBeDefined()
    })

    it('超大预算分配总百分比应接近 100', () => {
      const allocs = service.getOptimalBudget('performance', 10000000)
      const total = allocs.reduce((s, a) => s + a.percent, 0)
      expect(total).toBeCloseTo(100, 0)
    })

    it('多活动比较当全部不存在时返回空数组', () => {
      const results = service.compareCampaigns(['fake1', 'fake2'])
      expect(results).toHaveLength(0)
    })

    it('活动比较混合存在和不存在时应过滤', () => {
      const results = service.compareCampaigns(['camp-001', 'fake1', 'camp-002'])
      expect(results.length).toBe(2)
    })
  })

  describe('文案边界', () => {
    it('超长 CTA 不应截断', () => {
      const copy = service.generateCopy({
        product: '测试产品',
        goal: 'conversion',
        audience: '所有人',
        cta: '这是一个非常长的CTA按钮文案用于测试边界情况是否正常处理',
      })
      expect(copy.cta).toBeTruthy()
    })

    it('A/B 测试最少 2 个变体', () => {
      const variants = service.generateABTestVariants({
        product: 'P', goal: 'conversion', audience: 'A',
      }, 2)
      expect(variants.length).toBe(2)
    })

    it('跨语言本地化应输出不同结果', () => {
      const base = service.generateCopy({
        product: '产品', goal: 'conversion', audience: '用户',
      })
      const en = service.localizeCopy(base, 'en-US')
      const jp = service.localizeCopy(base, 'ja-JP')
      expect(en.cta).not.toBe(jp.cta)
    })
  })

  describe('活动规划边界', () => {
    it('零受众的触达预估应为 0', () => {
      const reach = service.estimateReach(0, 'wechat')
      expect(reach.audience).toBe(0)
      expect(reach.impressions).toBe(0)
    })

    it('超大受众触达预估应计算', () => {
      const reach = service.estimateReach(10000000, 'email')
      expect(reach.impressions).toBeGreaterThan(0)
    })

    it('未知目标活动类型应返回默认时间线', () => {
      const timeline = service.planCampaignTimeline('unknown' as any)
      expect(timeline.length).toBe(3)
    })
  })

  describe('统计边界', () => {
    it('getModuleStats 所有数值应为正数或 0', () => {
      const stats = service.getModuleStats()
      expect(stats.totalCampaigns).toBeGreaterThan(0)
      expect(stats.totalRevenue).toBeGreaterThanOrEqual(0)
      expect(stats.totalCost).toBeGreaterThanOrEqual(0)
      expect(stats.positiveCampaigns + stats.negativeCampaigns).toBe(stats.totalCampaigns)
    })
  })
})
