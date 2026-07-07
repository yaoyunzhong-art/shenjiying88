import { describe, it, expect, beforeEach } from 'vitest'
import { AiMarketingController } from './ai-marketing.controller'
import { CampaignTypeEnum, ChannelEnum } from './ai-marketing.dto'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'

describe('AiMarketingController (spec)', () => {
  let controller: AiMarketingController
  let roiService: MarketingROIService
  let copywritingService: CopywritingAssistant
  let campaignPlanner: CampaignPlanner

  beforeEach(() => {
    roiService = new MarketingROIService()
    copywritingService = new CopywritingAssistant()
    campaignPlanner = new CampaignPlanner()
    const cmoService = new AIMarketingCMOService(roiService, copywritingService, campaignPlanner)
    controller = new AiMarketingController(roiService, copywritingService, campaignPlanner, cmoService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('POST /ai-marketing/roi/calculate', () => {
    it('should return ROI for existing campaign', () => {
      const result = controller.calculateROI({ campaignId: 'camp-001' })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.campaignId).toBe('camp-001')
    })

    it('should return not found for non-existing campaign', () => {
      const result = controller.calculateROI({ campaignId: 'non-existent' })
      expect(result.success).toBe(false)
      expect(result.message).toContain('not found')
    })
  })

  describe('POST /ai-marketing/roi/compare', () => {
    it('should compare multiple campaigns sorted by ROI', () => {
      const result = controller.compareROI({ campaignIds: ['camp-001', 'camp-002', 'camp-003'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(3)
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i - 1].roi).toBeGreaterThanOrEqual(result.data[i].roi)
      }
    })
  })

  describe('POST /ai-marketing/roi/project', () => {
    it('should project ROI with valid config', () => {
      const result = controller.projectROI({ type: CampaignTypeEnum.PERFORMANCE, budget: 50000 })
      expect(result.success).toBe(true)
      expect(result.data.expectedROI).toBeDefined()
      expect(result.data.minROI).toBeLessThanOrEqual(result.data.expectedROI)
      expect(result.data.expectedROI).toBeLessThanOrEqual(result.data.maxROI)
    })
  })

  describe('POST /ai-marketing/roi/budget-allocation', () => {
    it('should return budget allocations for kOL type', () => {
      const result = controller.getBudgetAllocation({ campaignType: CampaignTypeEnum.KOL, totalBudget: 100000 })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      const totalPercent = result.data.reduce((s: number, a: any) => s + a.percent, 0)
      expect(Math.round(totalPercent)).toBe(100)
    })
  })

  describe('POST /ai-marketing/copy/generate', () => {
    it('should generate copy for valid brief', () => {
      const result = controller.generateCopy({ product: '夏季新品', goal: 'conversion', audience: '年轻用户' })
      expect(result.success).toBe(true)
      expect(result.data.headline).toBeDefined()
      expect(result.data.body).toBeDefined()
      expect(result.data.cta).toBeDefined()
      expect(result.data.taglines.length).toBeGreaterThan(0)
    })

    it('不同目标生成不同标题', () => {
      const awareness = controller.generateCopy({ product: 'P', goal: 'awareness', audience: 'A' })
      const conversion = controller.generateCopy({ product: 'P', goal: 'conversion', audience: 'A' })
      expect(awareness.data.headline).not.toBe(conversion.data.headline)
    })
  })

  describe('POST /ai-marketing/copy/optimize-headline', () => {
    it('should optimize a headline', () => {
      const result = controller.optimizeHeadline({ headline: '新品上市' })
      expect(result.success).toBe(true)
      expect(result.data.original).toBe('新品上市')
      expect(result.data.optimized).toBeDefined()
    })
  })

  describe('POST /ai-marketing/copy/localize', () => {
    it('should localize copy to en-US', () => {
      const result = controller.localizeCopy({ headline: '新品', body: '正文', cta: '购买', taglines: ['品质'], locale: 'en-US' })
      expect(result.success).toBe(true)
      expect(result.data.cta).toBe('Buy Now')
    })
  })

  describe('POST /ai-marketing/copy/ab-test', () => {
    it('should generate requested number of variants', () => {
      const result = controller.generateABTest({ brief: { product: '产品A', goal: 'conversion', audience: '用户' }, count: 3 })
      expect(result.success).toBe(true)
      expect(result.data.variants.length).toBe(3)
    })
  })

  describe('POST /ai-marketing/copy/generate-batch', () => {
    it('should generate copies for multiple items', () => {
      const result = controller.batchGenerateCopy({ items: [{ product: 'P1', goal: 'conversion', audience: 'A1' }, { product: 'P2', goal: 'awareness', audience: 'A2' }] })
      expect(result.success).toBe(true)
      expect(result.data.totalGenerated).toBe(2)
      expect(result.data.items.length).toBe(2)
    })
  })

  describe('POST /ai-marketing/campaign/suggest', () => {
    it('should suggest campaigns for awareness goal', () => {
      const result = controller.suggestCampaign({ goal: 'awareness', budget: 100000, audience: '白领' })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0].type).toBeDefined()
    })
  })

  describe('POST /ai-marketing/campaign/timeline', () => {
    it('should return timeline for brand goal', () => {
      const result = controller.planTimeline({ goal: 'brand' })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(3)
    })
  })

  describe('POST /ai-marketing/campaign/reach-estimate', () => {
    it('should estimate reach for wechat', () => {
      const result = controller.estimateReach({ audience: 50000, channel: ChannelEnum.WECHAT })
      expect(result.success).toBe(true)
      expect(result.data.channel).toBe('wechat')
      expect(result.data.cost).toBeGreaterThan(0)
    })
  })

  describe('POST /ai-marketing/analyze', () => {
    it('should analyze campaign with ROI only', () => {
      const result = controller.analyzeMarketing({ campaignId: 'camp-001', includeROI: true, includeTimeline: false, includeReach: false })
      expect(result.success).toBe(true)
      expect(result.data.roi).toBeDefined()
      expect(result.data.timeline).toBeUndefined()
    })
  })

  describe('GET /ai-marketing/stats', () => {
    it('should return module stats', () => {
      const result = controller.getModuleStats()
      expect(result.success).toBe(true)
      expect(result.data.totalCampaigns).toBeGreaterThan(0)
      expect(result.data.totalRevenue).toBeGreaterThan(0)
    })
  })
})
