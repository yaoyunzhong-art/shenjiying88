import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AiMarketingController } from './ai-marketing.controller'
import { CampaignTypeEnum, ChannelEnum } from './ai-marketing.dto'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'
import { MarketingAnalyticsService } from './ai-marketing-analytics.service'
import { CampaignOptimizerService } from './ai-marketing-campaign-optimizer.service'

/**
 * ai-marketing 端到端测试
 * Controller → Service 完整链路
 */
describe('ai-marketing E2E', () => {
  let controller: AiMarketingController

  beforeAll(() => {
    const roiService = new MarketingROIService()
    const copywritingService = new CopywritingAssistant()
    const campaignPlanner = new CampaignPlanner()
    const analyticsService = new MarketingAnalyticsService()
    const optimizerService = new CampaignOptimizerService()
    const cmoService = new AIMarketingCMOService(roiService, copywritingService, campaignPlanner)
    controller = new AiMarketingController(roiService, copywritingService, campaignPlanner, cmoService, analyticsService, optimizerService)
  })

  // ─── ROI 全流程 ─────────────────────────────────────────────

  it('E2E: ROI calculate → compare → project 完整链路', () => {
    // Step 1: Calculate ROI for camp-001
    const calcRes = controller.calculateROI({ campaignId: 'camp-001' })
    expect(calcRes.success).toBe(true)
    expect(calcRes.data!.roi).toBeGreaterThan(0)

    // Step 2: Compare with camp-002
    const cmpRes = controller.compareROI({ campaignIds: ['camp-001', 'camp-002'] })
    expect(cmpRes.data.length).toBe(2)
    expect(cmpRes.data[0].roiPercent).toBeGreaterThanOrEqual(cmpRes.data[1].roiPercent)

    // Step 3: Project new campaign ROI
    const projRes = controller.projectROI({ type: CampaignTypeEnum.PERFORMANCE, budget: 100000 })
    expect(projRes.data.minROI).toBeLessThanOrEqual(projRes.data.expectedROI)
  })

  // ─── 文案全流程 ─────────────────────────────────────────────

  it('E2E: 文案生成 → 优化 → 本地化 完整链路', () => {
    // Step 1: Generate copy
    const genRes = controller.generateCopy({ product: '夏季盲盒', goal: 'conversion', audience: '年轻人' })
    expect(genRes.data.headline).toBeDefined()

    // Step 2: Optimize headline
    const optRes = controller.optimizeHeadline({ headline: genRes.data.headline })
    expect(optRes.data.optimized).toBeDefined()
    expect(optRes.data.optimized).not.toBe('')

    // Step 3: Localize to English
    const locRes = controller.localizeCopy({
      headline: genRes.data.headline,
      body: genRes.data.body,
      cta: genRes.data.cta,
      taglines: genRes.data.taglines,
      locale: 'en-US',
    })
    expect(locRes.data.cta).toBe('Buy Now')
  })

  // ─── 活动规划全流程 ─────────────────────────────────────────

  it('E2E: 推荐活动 → 排期 → 触达估算 完整链路', () => {
    // Step 1: Suggest campaign type
    const sugRes = controller.suggestCampaign({ goal: 'awareness', budget: 50000, audience: '大学生' })
    expect(sugRes.data.length).toBeGreaterThan(0)

    // Step 2: Plan timeline
    const tmRes = controller.planTimeline({ goal: 'awareness' })
    expect(tmRes.data).toHaveLength(3)

    // Step 3: Estimate reach
    const reRes = controller.estimateReach({ audience: 50000, channel: ChannelEnum.DOUYIN })
    expect(reRes.data.channel).toBe('douyin')
    expect(reRes.data.impressions).toBeGreaterThan(0)
  })

  // ─── 综合分析 ───────────────────────────────────────────────

  it('E2E: 综合分析端点', () => {
    const res = controller.analyzeMarketing({
      campaignId: 'camp-001',
      includeROI: true,
      includeTimeline: true,
      includeReach: true,
    })
    expect(res.success).toBe(true)
    expect(res.data.campaignName).toContain('camp-001')
    expect(res.data.roi).toBeDefined()
    expect(res.data.timeline).toBeDefined()
    expect(res.data.reach).toBeDefined()
  })

  // ─── 模块统计 ───────────────────────────────────────────────

  it('E2E: 获取模块统计', () => {
    const res = controller.getModuleStats()
    expect(res.success).toBe(true)
    expect(res.data.totalCampaigns).toBe(5)
    expect(res.data.totalRevenue).toBeGreaterThan(0)
    expect(res.data.totalCost).toBeGreaterThan(0)
    expect(res.data.averageROI).toBeDefined()
    expect(res.data.positiveCampaigns).toBe(4)
    expect(res.data.negativeCampaigns).toBe(1)
  })

  // ─── 批量生成 ───────────────────────────────────────────────

  it('E2E: 批量生成端点', () => {
    const res = controller.batchGenerateCopy({
      items: [
        { product: '盲盒A', goal: 'conversion', audience: '青少年' },
        { product: '盲盒B', goal: 'awareness', audience: '成年人' },
        { product: '盲盒C', goal: 'retention', audience: '老会员' },
      ],
    })
    expect(res.data.totalGenerated).toBe(3)
  })
})
