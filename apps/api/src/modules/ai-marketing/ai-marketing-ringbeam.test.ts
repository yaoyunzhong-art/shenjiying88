/**
 * ai-marketing-ringbeam.test.ts - V17#圈梁 Phase3 AI模块
 * 用途: PRD对齐测试 - 验证营销ROI分析/文案生成/活动规划/预算分配
 * 覆盖: 正例(ROI计算+文案生成+活动推荐) + 反例(无效Campaign/空变体) + 边界(亏损活动/多渠道预算)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MarketingROIService, CopywritingAssistant, CampaignPlanner, AIMarketingCMOService } from './ai-marketing-cmo.service'
import { AiMarketingService } from './ai-marketing.service'

describe('🔵 AiMarketingRingBeam: 营销模块PRD对齐', () => {
  let roiService: MarketingROIService
  let copyService: CopywritingAssistant
  let planner: CampaignPlanner
  let cmoService: AIMarketingCMOService
  let marketingService: AiMarketingService

  beforeEach(() => {
    roiService = new MarketingROIService()
    copyService = new CopywritingAssistant()
    planner = new CampaignPlanner()
    cmoService = new AIMarketingCMOService(roiService, copyService, planner)
    marketingService = new AiMarketingService(roiService, copyService, planner, cmoService)
  })

  // ─── 1. ROI 分析 ────────────────────────────────────────────

  describe('ROI分析', () => {
    it('[P0] 盈利活动的ROI为正数且isPositive为true', () => {
      const roi = roiService.calculateCampaignROI('camp-001') // 夏季新品推广: 150000-30000=120000
      expect(roi).not.toBeNull()
      expect(roi!.profit).toBe(120000)
      expect(roi!.roiPercent).toBeGreaterThan(0)
      expect(roi!.isPositive).toBe(true)
    })

    it('[P1] 亏损活动的isPositive为false', () => {
      const roi = roiService.calculateCampaignROI('camp-005') // 亏损测试: 20000-40000=-20000

      expect(roi).not.toBeNull()
      expect(roi!.profit).toBe(-20000)
      expect(roi!.isPositive).toBe(false)
    })

    it('[P1] 不存在活动返回null', () => {
      const roi = roiService.calculateCampaignROI('camp-nonexistent')
      expect(roi).toBeNull()
    })

    it('[P1] compareCampaigns按ROI降序排列', () => {
      const results = roiService.compareCampaigns(['camp-001', 'camp-002', 'camp-003', 'camp-005'])
      expect(results.length).toBe(4)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].roi).toBeGreaterThanOrEqual(results[i].roi)
      }
    })

    it('[P1] projectROI基于配置返回合理ROI区间', () => {
      const projected = roiService.projectROI({
        type: 'performance',
        budget: 50000,
        expectedCPM: 80,
        expectedCTR: 0.02,
        expectedConversionRate: 0.03,
        averageOrderValue: 200,
      })

      expect(projected.minROI).toBeLessThanOrEqual(projected.expectedROI)
      expect(projected.expectedROI).toBeLessThanOrEqual(projected.maxROI)
    })
  })

  // ─── 2. 文案生成 ────────────────────────────────────────────

  describe('文案生成', () => {
    it('[P0] generateCopy返回完整的标题/正文/CTA/标签', () => {
      const copy = copyService.generateCopy({
        product: '超级会员卡',
        goal: 'conversion',
        audience: '游戏玩家',
        tone: 'casual',
        length: 'medium',
        cta: '立即开通',
      })

      expect(copy.headline).toBeTruthy()
      expect(copy.body).toBeTruthy()
      expect(copy.cta).toBe('立即开通')
      expect(copy.taglines.length).toBeGreaterThan(0)
    })

    it('[P1] optimizeHeadline生成优化后的标题', () => {
      const original = '超级会员'
      const optimized = copyService.optimizeHeadline(original)

      expect(optimized).toBeTruthy()
      // 优化后的标题应包含原内容的一部分或完全启用新结构
      expect(optimized.length).toBeGreaterThan(original.length)
    })

    it('[P1] localizeCopy根据locale调整CTA', () => {
      const copy = { headline: '促销', body: '内容', cta: '立即购买', taglines: ['优惠'] }
      const en = copyService.localizeCopy(copy, 'en-US')
      const zhTW = copyService.localizeCopy(copy, 'zh-TW')

      expect(en.cta).toBe('Buy Now')
      expect(zhTW.cta).toBe('立即選購')
    })

    it('[P1] abTestVariants生成指定数量的变体', () => {
      const variants = copyService.abTestVariants(
        { product: '测试商品', goal: 'conversion', audience: '用户' },
        3,
      )

      expect(variants.length).toBe(3)
      variants.forEach((v) => {
        expect(v.headline).toBeTruthy()
      })
    })

    it('[P2] 空brief时使用默认值生成', () => {
      const copy = copyService.generateCopy({
        product: '默认',
        goal: 'awareness',
        audience: '所有人',
      })

      expect(copy.headline).toBeTruthy()
      expect(copy.cta).toBe('立即购买') // 默认CTA
    })
  })

  // ─── 3. 活动规划 ────────────────────────────────────────────

  describe('活动规划', () => {
    it('[P0] suggestCampaignType返回按评分排序的推荐', () => {
      const suggestions = planner.suggestCampaignType('conversion', 50000, '年轻用户')

      expect(suggestions.length).toBeGreaterThanOrEqual(1)
      expect(suggestions.length).toBeLessThanOrEqual(3)
      // 第一个应为performance类型（conversion目标的最高分）
      expect(suggestions[0].type).toBe('performance')
      expect(suggestions[0].channels.length).toBeGreaterThan(0)
      expect(suggestions[0].reason).toBeTruthy()
    })

    it('[P1] planCampaignTimeline为不同目标返回不同的时间线', () => {
      const awarenessTimeline = planner.planCampaignTimeline('awareness')
      const conversionTimeline = planner.planCampaignTimeline('conversion')

      expect(awarenessTimeline.length).toBeGreaterThan(0)
      expect(conversionTimeline.length).toBeGreaterThan(0)
      // 不同类型的时间线阶段名不同
      expect(awarenessTimeline[0].activities).not.toEqual(conversionTimeline[0].activities)
    })

    it('[P1] estimateReach按渠道返回合理的触达预估', () => {
      const reach = planner.estimateReach(100000, 'douyin')

      expect(reach.channel).toBe('douyin')
      expect(reach.audience).toBe(100000)
      expect(reach.impressions).toBeGreaterThan(reach.reach)
      expect(reach.cpm).toBeGreaterThan(0)
      expect(reach.cost).toBeGreaterThan(0)
    })
  })

  // ─── 4. 预算分配 ────────────────────────────────────────────

  describe('预算分配', () => {
    it('[P0] getOptimalBudget按渠道比例分配', () => {
      const allocations = roiService.getOptimalBudget('performance', 100000)

      expect(allocations.length).toBeGreaterThan(0)
      const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0)
      expect(totalPercent).toBeCloseTo(100, 0)
      const totalAmount = allocations.reduce((sum, a) => sum + a.amount, 0)
      expect(totalAmount).toBeCloseTo(100000, 0)
    })

    it('[P1] 各渠道分配金额为正数', () => {
      const allocations = roiService.getOptimalBudget('email', 50000)
      allocations.forEach((a) => {
        expect(a.amount).toBeGreaterThan(0)
        expect(a.expectedROI).toBeGreaterThan(0)
      })
    })
  })

  // ─── 5. 聚合服务 ────────────────────────────────────────────

  describe('AiMarketingService聚合接口', () => {
    it('[P0] calculateCampaignROI通过聚合服务返回一致结果', () => {
      const roi = marketingService.calculateCampaignROI('camp-001')
      expect(roi).not.toBeNull()
      expect(roi!.campaignId).toBe('camp-001')
    })

    it('[P1] generateCopy通过聚合服务生成文案', () => {
      const copy = marketingService.generateCopy({
        product: '聚合商品',
        goal: 'conversion',
        audience: '测试用户',
      })
      expect(copy.headline).toBeTruthy()
      expect(copy.body).toBeTruthy()
    })
  })
})
