/**
 * ai-marketing.controller.test.ts — AI 营销 Controller 扩展测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { AiMarketingController } from './ai-marketing.controller'
import { CampaignTypeEnum } from './ai-marketing.dto'
import { MarketingROIService, CopywritingAssistant, CampaignPlanner, AIMarketingCMOService } from './ai-marketing-cmo.service'
import { MarketingAnalyticsService } from './ai-marketing-analytics.service'
import { CampaignOptimizerService } from './ai-marketing-campaign-optimizer.service'

describe('AiMarketingController (Extended)', () => {
  let controller: AiMarketingController
  let roiService: MarketingROIService
  let copywritingService: CopywritingAssistant
  let campaignPlanner: CampaignPlanner
  let analyticsService: MarketingAnalyticsService
  let optimizerService: CampaignOptimizerService

  beforeEach(() => {
    roiService = new MarketingROIService()
    copywritingService = new CopywritingAssistant()
    campaignPlanner = new CampaignPlanner()
    analyticsService = new MarketingAnalyticsService()
    optimizerService = new CampaignOptimizerService()
    const cmoService = new AIMarketingCMOService(roiService, copywritingService, campaignPlanner)
    controller = new AiMarketingController(roiService, copywritingService, campaignPlanner, cmoService, analyticsService, optimizerService)
  })

  it('should be defined', () => { expect(controller).toBeDefined() })
  it('path = "ai-marketing"', () => {
    const path = Reflect.getMetadata('path', AiMarketingController)
    expect(path).toBe('ai-marketing')
  })

  describe('ROI endpoints', () => {
    it('POST /roi/calculate', () => {
      const result = controller.calculateROI({ campaignId: 'camp-001' })
      expect(result.success).toBe(true)
      expect(result.data!.campaignId).toBe('camp-001')
    })

    it('POST /roi/calculate - 不存在活动', () => {
      const result = controller.calculateROI({ campaignId: 'nonexistent' })
      expect(result.success).toBe(false)
    })

    it('POST /roi/compare', () => {
      const result = controller.compareROI({ campaignIds: ['camp-001', 'camp-002'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(2)
    })

    it('POST /roi/project', () => {
      const result = controller.projectROI({ type: CampaignTypeEnum.PERFORMANCE, budget: 50000 })
      expect(result.success).toBe(true)
      expect(result.data!.expectedROI).toBeDefined()
    })

    it('POST /roi/budget-allocation', () => {
      const result = controller.getBudgetAllocation({ campaignType: CampaignTypeEnum.PERFORMANCE, totalBudget: 100000 })
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('Copywriting endpoints', () => {
    it('POST /copy/generate', () => {
      const result = controller.generateCopy({ product: '智能手表', goal: 'conversion', audience: '25-40岁科技爱好者' })
      expect(result.success).toBe(true)
      expect(result.data.headline).toBeTruthy()
    })

    it('POST /copy/optimize-headline', () => {
      const result = controller.optimizeHeadline({ headline: '新品上市' })
      expect(result.success).toBe(true)
      expect(result.data.optimized).toBeTruthy()
    })

    it('POST /copy/localize', () => {
      const result = controller.localizeCopy({ headline: '新品', body: '快来买', cta: '购买', taglines: ['好'], locale: 'en-US' })
      expect(result.success).toBe(true)
    })

    it('POST /copy/ab-test', () => {
      const result = controller.generateABTest({
        brief: { product: '手表', goal: 'conversion', audience: '25-40岁' },
        count: 3
      })
      expect(result.success).toBe(true)
      expect(result.data.variants.length).toBe(3)
    })

    it('POST /copy/generate-batch', () => {
      const result = controller.batchGenerateCopy({
        items: [
          { product: 'A', goal: 'conversion', audience: 'a' },
          { product: 'B', goal: 'awareness', audience: 'b' },
        ]
      })
      expect(result.success).toBe(true)
      expect(result.data.totalGenerated).toBe(2)
    })
  })

  describe('Campaign endpoints', () => {
    it('POST /campaign/suggest', () => {
      const result = controller.suggestCampaign({ goal: 'conversion', budget: 50000, audience: '25-40岁' })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(3)
    })

    it('POST /campaign/timeline', () => {
      const result = controller.planTimeline({ goal: 'awareness' })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(3)
    })

    it('POST /campaign/reach-estimate', () => {
      const result = controller.estimateReach({ audience: 50000, channel: 'wechat' as any })
      expect(result.success).toBe(true)
    })
  })

  describe('Analysis endpoints', () => {
    it('POST /analyze - 含所有选项', () => {
      const result = controller.analyzeMarketing({
        campaignId: 'camp-001',
        includeROI: true,
        includeTimeline: true,
        includeReach: true,
      })
      expect(result.success).toBe(true)
      expect(result.data.roi).toBeDefined()
      expect(result.data.timeline).toBeDefined()
      expect(result.data.reach).toBeDefined()
    })

    it('GET /stats', () => {
      const result = controller.getModuleStats()
      expect(result.success).toBe(true)
      expect(result.data.totalCampaigns).toBeGreaterThan(0)
    })
  })

  describe('Analytics endpoints', () => {
    it('POST /analytics/attribution', () => {
      const result = controller.attributionAnalysis({})
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('POST /analytics/funnel', () => {
      const result = controller.funnelAnalysis({})
      expect(result.success).toBe(true)
      expect(result.data.topOfFunnel.impressions).toBeGreaterThan(0)
    })

    it('POST /analytics/budget-simulation', () => {
      const result = controller.simulateBudget({ totalBudget: 100000, types: [] })
      expect(result.success).toBe(true)
      expect(result.data.scenarios.length).toBeGreaterThan(1)
    })

    it('GET /analytics/cohort', () => {
      const result = controller.cohortAnalysis({ count: 3 })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(3)
    })

    it('GET /analytics/competitive', () => {
      const result = controller.competitiveAnalysis({})
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('GET /analytics/seasonal-trends', () => {
      const result = controller.seasonalTrends()
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(4)
    })

    it('GET /analytics/suggestions', () => {
      const result = controller.getSuggestions()
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Optimizer endpoints', () => {
    it('GET /optimizer/performance/:id', () => {
      const result = controller.getCampaignPerformance('camp-001')
      expect(result.success).toBe(true)
      expect(result.data!.optimizationScore).toBeGreaterThan(0)
    })

    it('POST /optimizer/bid', () => {
      const result = controller.optimizeBid({ campaignId: 'camp-001', currentBid: 2.5, dailyBudget: 5000, targetCPA: 8 })
      expect(result.success).toBe(true)
    })

    it('GET /optimizer/audience-segments/:id', () => {
      const result = controller.recommendAudience('camp-001')
      expect(result.success).toBe(true)
    })

    it('POST /optimizer/creative-performance', () => {
      const result = controller.getCreativePerformance({ creativeIds: ['cre-1', 'cre-2'] })
      expect(result.success).toBe(true)
      expect(result.data.length).toBe(2)
    })

    it('POST /optimizer/budget-pacing', () => {
      const result = controller.analyzeBudgetPacing({
        totalBudget: 10000, startDate: '2026-01-01', endDate: '2026-01-31',
        spentToDate: 3000, elapsedDays: 10,
      })
      expect(result.success).toBe(true)
    })

    it('POST /optimizer/cpa', () => {
      const result = controller.optimizeCPA({ currentCPA: 50, targetCPA: 30, conversionRate: 2.5, averageOrderValue: 200 })
      expect(result.success).toBe(true)
    })

    it('POST /optimizer/channel-frequency', () => {
      const result = controller.getChannelFrequency({ body: { channels: ['push', 'email'] } } as any)
      expect(result.success).toBe(true)
    })
  })
})
