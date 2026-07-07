import { describe, it, expect } from 'vitest'
import {
  ROICalculateRequest,
  ROICalculateResponse,
  ROICompareRequest,
  ROIProjectRequest,
  ROIProjectResponse,
  CopyGenerateRequest,
  HeadlineOptimizeRequest,
  LocalizeCopyRequest,
  ABTestRequest,
  SuggestCampaignRequest,
  PlanTimelineRequest,
  ReachEstimateRequest,
  MarketingAnalysisRequest,
} from './ai-marketing.contract'

describe('ai-marketing API contract types', () => {
  describe('ROI contracts', () => {
    it('should define ROICalculateRequest with campaignId', () => {
      const req: ROICalculateRequest = { campaignId: 'camp-001' }
      expect(req.campaignId).toBeTruthy()
    })

    it('should define ROICalculateResponse with success flag', () => {
      const res: ROICalculateResponse = {
        success: true,
        data: {
          campaignId: 'camp-001',
          revenue: 100000,
          cost: 30000,
          roi: 2.33,
          roiPercent: 233.33,
          profit: 70000,
          isPositive: true,
        },
      }
      expect(res.success).toBe(true)
      expect(res.data?.roiPercent).toBe(233.33)
    })

    it('should define ROICompareRequest with string array', () => {
      const req: ROICompareRequest = { campaignIds: ['a', 'b', 'c'] }
      expect(req.campaignIds).toHaveLength(3)
    })

    it('should define ROIProjectRequest with optional fields', () => {
      const req: ROIProjectRequest = { type: 'performance', budget: 50000 }
      expect(req.type).toBe('performance')

      const full: ROIProjectRequest = {
        type: 'brand',
        budget: 100000,
        expectedCPM: 80,
        expectedCTR: 0.02,
        expectedConversionRate: 0.03,
        averageOrderValue: 200,
      }
      expect(full.expectedCPM).toBe(80)
    })

    it('should define ROIProjectResponse with min/max/expected', () => {
      const res: ROIProjectResponse = {
        success: true,
        data: { minROI: -20, maxROI: 200, expectedROI: 150 },
      }
      expect(res.data?.minROI).toBeLessThan(res.data!.maxROI)
    })
  })

  describe('Copywriting contracts', () => {
    it('should define CopyGenerateRequest', () => {
      const req: CopyGenerateRequest = {
        product: '产品A',
        goal: 'conversion',
        audience: '用户',
      }
      expect(req.product).toBe('产品A')
    })

    it('should define HeadlineOptimizeRequest', () => {
      const req: HeadlineOptimizeRequest = { headline: '测试' }
      expect(req.headline).toBeTruthy()
    })

    it('should define LocalizeCopyRequest with locale union', () => {
      const req: LocalizeCopyRequest = {
        headline: 'H',
        body: 'B',
        cta: 'C',
        taglines: ['A'],
        locale: 'en-US',
      }
      expect(req.locale).toBe('en-US')

      const zh: LocalizeCopyRequest = { ...req, locale: 'zh-CN' }
      expect(zh.locale).toBe('zh-CN')
    })

    it('should define ABTestRequest with brief and count', () => {
      const req: ABTestRequest = {
        brief: { product: 'P', goal: 'conversion', audience: 'A' },
        count: 3,
      }
      expect(req.count).toBeGreaterThan(0)
    })
  })

  describe('Campaign planning contracts', () => {
    it('should define SuggestCampaignRequest', () => {
      const req: SuggestCampaignRequest = {
        goal: 'awareness',
        budget: 50000,
        audience: '白领',
      }
      expect(req.goal).toBe('awareness')
      expect(req.budget).toBeGreaterThan(0)
    })

    it('should define PlanTimelineRequest with goal', () => {
      const req: PlanTimelineRequest = { goal: 'brand' }
      expect(req.goal).toBe('brand')
    })

    it('should define ReachEstimateRequest', () => {
      const req: ReachEstimateRequest = { audience: 50000, channel: 'wechat' }
      expect(req.channel).toBe('wechat')
    })
  })

  describe('Analysis contracts', () => {
    it('should define MarketingAnalysisRequest with optional flags', () => {
      const req: MarketingAnalysisRequest = { campaignId: 'camp-001' }
      expect(req.includeROI).toBeUndefined()

      const full: MarketingAnalysisRequest = {
        campaignId: 'camp-001',
        includeROI: true,
        includeTimeline: false,
        includeReach: true,
      }
      expect(full.includeROI).toBe(true)
      expect(full.includeReach).toBe(true)
    })
  })
})
