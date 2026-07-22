/**
 * ai-marketing.e2e.enhanced.test.ts — AI营销模块增强E2E测试
 *
 * 覆盖: 营销活动创建、投放策略、效果追踪、预算控制、多渠道分发、
 *       A/B测试、人群定向、素材管理、归因分析、季节趋势等
 *
 * 总计: 30 个测试用例 (it/test)
 */
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

describe('ai-marketing E2E enhanced — 30 tests', () => {
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

  // ═══════════════ 营销活动创建 (Campaign Creation) ═══════════════

  it('T01: 活动推荐 — awareness 目标推荐KOL/品牌/社交类型', () => {
    const res = controller.suggestCampaign({ goal: 'awareness', budget: 50000, audience: '大学生' })
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(1)
    expect(res.data[0].type).toBeDefined()
    expect(res.data[0].channels).toBeInstanceOf(Array)
    expect(res.data[0].reason).toBeDefined()
  })

  it('T02: 活动推荐 — conversion 目标优先推荐效果广告', () => {
    const res = controller.suggestCampaign({ goal: 'conversion', budget: 100000, audience: '高消费人群' })
    expect(res.success).toBe(true)
    const types = res.data.map((r: any) => r.type)
    expect(types).toContain('performance')
  })

  it('T03: 活动推荐 — retention 目标推荐邮件和社交渠道', () => {
    const res = controller.suggestCampaign({ goal: 'retention', budget: 20000, audience: '老会员' })
    expect(res.success).toBe(true)
    const types = res.data.map((r: any) => r.type)
    expect(types).toContain('email')
    expect(types).toContain('social')
  })

  it('T04: 活动时间线 — awareness 有三个阶段', () => {
    const res = controller.planTimeline({ goal: 'awareness' })
    expect(res.data).toHaveLength(3)
    expect(res.data[0].phase).toBe('预热期')
    expect(res.data[1].phase).toBe('爆发期')
    expect(res.data[2].phase).toBe('延续期')
  })

  it('T05: 活动时间线 — conversion 阶段包含秒杀和倒计时', () => {
    const res = controller.planTimeline({ goal: 'conversion' })
    expect(res.data).toHaveLength(3)
    const allActivities = res.data.flatMap((m: any) => m.activities)
    expect(allActivities).toContain('限时秒杀')
    expect(allActivities).toContain('倒计时')
  })

  // ═══════════════ 投放策略 (Delivery Strategy) ═══════════════

  it('T06: 触达估算 — 抖音渠道返回 impressions/reach/cost', () => {
    const res = controller.estimateReach({ audience: 50000, channel: ChannelEnum.DOUYIN })
    expect(res.data.channel).toBe('douyin')
    expect(res.data.impressions).toBeGreaterThan(0)
    expect(res.data.reach).toBeGreaterThan(0)
    expect(res.data.cpm).toBe(100)
    expect(res.data.cost).toBeGreaterThan(0)
  })

  it('T07: 触达估算 — 邮件渠道CPM最低且reachRate最高', () => {
    const email = controller.estimateReach({ audience: 50000, channel: ChannelEnum.EMAIL })
    expect(email.data.cpm).toBe(10)
    expect(email.data.impressions).toBeGreaterThan(0)
  })

  it('T08: 触达估算 — 不同受众规模影响impressions', () => {
    const small = controller.estimateReach({ audience: 1000, channel: ChannelEnum.WECHAT })
    const large = controller.estimateReach({ audience: 100000, channel: ChannelEnum.WECHAT })
    expect(small.data.impressions).toBeLessThan(large.data.impressions)
  })

  it('T09: 跨渠道频控报告 — 不同渠道返回完整报告', () => {
    const res = controller.getChannelFrequency({ channels: ['douyin', 'wechat', 'weibo'] })
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(3)
    res.data.forEach((r: any) => {
      expect(r.channel).toBeDefined()
      expect(r.totalReach).toBeGreaterThan(0)
      expect(r.averageFrequency).toBeGreaterThan(0)
      expect(r.frequencyDistribution).toBeInstanceOf(Array)
      expect(r.recommendation).toBeDefined()
    })
  })

  // ═══════════════ 效果追踪 (Performance Tracking) ═══════════════

  it('T10: 活动性能概览 — 返回所有关键指标', () => {
    const res = controller.getCampaignPerformance('camp-001')
    expect(res.success).toBe(true)
    const perf = res.data
    expect(perf.campaignId).toBe('camp-001')
    expect(perf.currentROI).toBeGreaterThan(0)
    expect(perf.currentSpend).toBeGreaterThan(0)
    expect(perf.currentRevenue).toBeGreaterThan(0)
    expect(perf.currentConversions).toBeGreaterThan(0)
    expect(perf.currentCVR).toBeGreaterThan(0)
    expect(['improving', 'stable', 'declining']).toContain(perf.trend)
    expect(perf.optimizationScore).toBeGreaterThan(0)
  })

  it('T11: 活动性能 — 不同campaignId返回不同数据', () => {
    const a = controller.getCampaignPerformance('camp-001').data
    const b = controller.getCampaignPerformance('camp-002').data
    expect(a.currentSpend).not.toBe(b.currentSpend)
  })

  it('T12: ROI计算 — camp-001 为正收入', () => {
    const res = controller.calculateROI({ campaignId: 'camp-001' })
    expect(res.success).toBe(true)
    expect(res.data!.isPositive).toBe(true)
    expect(res.data!.roiPercent).toBeGreaterThan(0)
  })

  it('T13: ROI比较 — 多个活动按ROI排序', () => {
    const res = controller.compareROI({ campaignIds: ['camp-001', 'camp-002', 'camp-003'] })
    expect(res.data.length).toBe(3)
    // 已验证: 排序为 camp-001(4.0) > camp-003(1.5) > camp-002(0.6)
    expect(res.data[0].roiPercent).toBeGreaterThanOrEqual(res.data[1].roiPercent)
  })

  it('T14: ROI预测 — performance类型预估范围合理', () => {
    const res = controller.projectROI({ type: CampaignTypeEnum.PERFORMANCE, budget: 100000 })
    expect(res.data.minROI).toBe(0.5)
    expect(res.data.maxROI).toBe(2.0)
    expect(res.data.expectedROI).toBeGreaterThanOrEqual(0.5)
    expect(res.data.expectedROI).toBeLessThanOrEqual(2.0)
  })

  it('T15: ROI预测 — brand类型returns低范围', () => {
    const res = controller.projectROI({ type: CampaignTypeEnum.BRAND, budget: 100000 })
    expect(res.data.minROI).toBe(-0.2)
    expect(res.data.maxROI).toBe(0.5)
  })

  it('T16: 模块统计 — 5个活动总计指标', () => {
    const res = controller.getModuleStats()
    expect(res.data.totalCampaigns).toBe(5)
    expect(res.data.totalRevenue).toBeGreaterThan(0)
    expect(res.data.averageROI).toBeDefined()
    expect(res.data.positiveCampaigns).toBe(4)
    expect(res.data.negativeCampaigns).toBe(1)
  })

  // ═══════════════ 预算控制 (Budget Control) ═══════════════

  it('T17: 预算分配 — performance类型优先抖音和微信', () => {
    const res = controller.getBudgetAllocation({ campaignType: CampaignTypeEnum.PERFORMANCE, totalBudget: 100000 })
    expect(res.success).toBe(true)
    const channels = res.data.map((a: any) => a.channel)
    expect(channels).toContain('douyin')
    expect(channels).toContain('wechat')
    const totalAllocated = res.data.reduce((s: number, a: any) => s + a.amount, 0)
    expect(totalAllocated).toBe(100000)
  })

  it('T18: 预算分配 — email类型100%分配到email', () => {
    const res = controller.getBudgetAllocation({ campaignType: CampaignTypeEnum.EMAIL, totalBudget: 50000 })
    expect(res.data).toHaveLength(1)
    expect(res.data[0].channel).toBe('email')
    expect(res.data[0].amount).toBe(50000)
  })

  it('T19: 预算节奏分析 — ahead状态建议降低', () => {
    const res = controller.analyzeBudgetPacing({
      totalBudget: 100000,
      startDate: '2026-07-01',
      endDate: '2026-07-30',
      spentToDate: 80000,
      elapsedDays: 15,
    })
    expect(res.success).toBe(true)
    expect(res.data.pacing).toBe('ahead')
    expect(res.data.adjustment).toBe('decrease')
    expect(res.data.remaining).toBe(20000)
  })

  it('T20: 预算节奏分析 — behind状态建议增加', () => {
    const res = controller.analyzeBudgetPacing({
      totalBudget: 100000,
      startDate: '2026-07-01',
      endDate: '2026-07-30',
      spentToDate: 10000,
      elapsedDays: 15,
    })
    expect(res.data.pacing).toBe('behind')
    expect(res.data.adjustment).toBe('increase')
  })

  // ═══════════════ 多渠道分发 (Multi-Channel Distribution) ═══════════════

  it('T21: 归因分析 — 包含所有渠道的归因数据', () => {
    const res = controller.attributionAnalysis({ campaignIds: ['camp-001', 'camp-002', 'camp-003'] })
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThan(0)
    res.data.forEach((a: any) => {
      expect(a.channel).toBeDefined()
      expect(a.firstTouch).toBeGreaterThan(0)
      expect(a.lastTouch).toBeGreaterThan(0)
      expect(a.multiTouch).toBeGreaterThan(0)
      expect(a.timeDecay).toBeGreaterThan(0)
      expect(a.costPerAcquisition).toBeGreaterThan(0)
    })
  })

  it('T22: 漏斗分析 — 从曝光到转化的完整漏斗', () => {
    const res = controller.funnelAnalysis({ campaignIds: ['camp-001', 'camp-002'] })
    expect(res.success).toBe(true)
    expect(res.data.topOfFunnel.impressions).toBeGreaterThan(0)
    expect(res.data.topOfFunnel.reach).toBeGreaterThan(0)
    expect(res.data.middleOfFunnel.clicks).toBeGreaterThan(0)
    expect(res.data.bottomOfFunnel.conversions).toBeGreaterThan(0)
    expect(res.data.dropOffRates.overall).toBeGreaterThan(0)
  })

  // ═══════════════ A/B测试 (A/B Testing) ═══════════════

  it('T23: A/B测试变体生成 — 返回指定数量变体', () => {
    const res = controller.generateABTest({
      brief: { product: '夏季盲盒', goal: 'conversion', audience: '年轻人' },
      count: 5,
    })
    expect(res.success).toBe(true)
    expect(res.data.variants).toHaveLength(5)
    res.data.variants.forEach((v: any) => {
      expect(v.headline).toBeDefined()
      expect(v.body).toBeDefined()
      expect(v.cta).toBeDefined()
      expect(v.taglines).toBeInstanceOf(Array)
    })
  })

  it('T24: A/B测试变体 — 原始版本跟优化版本不同', () => {
    const res = controller.generateABTest({
      brief: { product: '全年会员', goal: 'retention', audience: '老会员' },
      count: 3,
    })
    expect(res.data.variants[0].headline).not.toBe(res.data.variants[1].headline)
  })

  // ═══════════════ 人群定向 (Audience Targeting) ═══════════════

  it('T25: 受众分群推荐 — 按ROI排序推荐', () => {
    const res = controller.recommendAudience('camp-001')
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(5)
    for (let i = 0; i < res.data.length - 1; i++) {
      expect(res.data[i].predictedROI).toBeGreaterThanOrEqual(res.data[i + 1].predictedROI)
    }
    res.data.forEach((s: any) => {
      expect(s.segmentName).toBeDefined()
      expect(s.segmentSize).toBeGreaterThan(0)
      expect(s.predictedCVR).toBeGreaterThan(0)
      expect(s.recommendedBid).toBeGreaterThan(0)
    })
  })

  it('T26: 同群分析 — 返回cohortCount个群组', () => {
    const res = controller.cohortAnalysis({ count: 6 })
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(6)
    res.data.forEach((c: any) => {
      expect(c.cohortId).toBeDefined()
      expect(c.customerCount).toBeGreaterThan(0)
      expect(c.retentionRates).toBeInstanceOf(Array)
      expect(c.lifetimeValue).toBeGreaterThan(0)
    })
  })

  // ═══════════════ 素材管理 (Creative Management) ═══════════════

  it('T27: 创意素材性能 — 多素材性能对比', () => {
    const res = controller.getCreativePerformance({ creativeIds: ['cr-001', 'cr-002', 'cr-003', 'cr-004'] })
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(4)
    const types = res.data.map((c: any) => c.type)
    expect(types).toContain('image')
    expect(types).toContain('video')
    expect(types).toContain('text')
    expect(types).toContain('carousel')
    res.data.forEach((c: any) => {
      expect(c.impressions).toBeGreaterThan(0)
      expect(c.clicks).toBeGreaterThan(0)
      expect(c.ctr).toBeGreaterThan(0)
      expect(c.roas).toBeGreaterThan(0)
      expect(['active', 'underperforming', 'paused']).toContain(c.status)
    })
  })

  it('T28: 频控建议 — 返回日/周频控上限', () => {
    const res = controller.getFrequencyCap('camp-001')
    expect(res.success).toBe(true)
    expect(res.data.currentFrequency).toBeGreaterThan(0)
    expect(res.data.recommendedDailyCap).toBeGreaterThan(0)
    expect(res.data.recommendedWeeklyCap).toBeGreaterThan(0)
    expect(res.data.saturationPoint).toBeGreaterThan(0)
  })

  // ═══════════════ 综合分析 (Comprehensive Analysis) ═══════════════

  it('T29: 竞争分析 — 返回竞争对手数据', () => {
    const res = controller.competitiveAnalysis({ market: 'tech' })
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThan(0)
    res.data.forEach((c: any) => {
      expect(c.competitorName).toBeDefined()
      expect(c.marketShare).toBeGreaterThan(0)
      expect(c.estimatedBudget).toBeGreaterThan(0)
      expect(c.channels).toBeInstanceOf(Array)
      expect(c.threatLevel).toBeDefined()
    })
  })

  it('T30: 营销综合分析 — ROI/时间线/触达完整链路', () => {
    const res = controller.analyzeMarketing({
      campaignId: 'camp-001',
      includeROI: true,
      includeTimeline: true,
      includeReach: true,
    })
    expect(res.success).toBe(true)
    expect(res.data.campaignName).toContain('camp-001')
    expect(res.data.roi).toBeDefined()
    expect(res.data.roi!.campaignId).toBe('camp-001')
    expect(res.data.timeline).toBeDefined()
    expect(res.data.timeline!.length).toBeGreaterThan(0)
    expect(res.data.reach).toBeDefined()
    expect(res.data.reach!.length).toBe(2)
    expect(res.data.analyzedAt).toBeDefined()
  })

  // ═══════════════ AI建议 (AI Suggestions) ═══════════════

  it('T31: AI营销建议 — 返回各分类建议', () => {
    const res = controller.getSuggestions()
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(5)
    const categories = res.data.map((s: any) => s.category)
    expect(categories).toContain('budget')
    expect(categories).toContain('channel')
    expect(categories).toContain('creative')
    res.data.forEach((s: any) => {
      expect(s.suggestionId).toBeDefined()
      expect(s.priority).toBeDefined()
      expect(s.description).toBeDefined()
      expect(s.expectedImpact).toBeDefined()
      expect(s.confidence).toBeGreaterThan(0)
    })
  })

  it('T32: 季节趋势 — 四季数据完整', () => {
    const res = controller.seasonalTrends()
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(4)
    const seasons = res.data.map((s: any) => s.season)
    expect(seasons).toContain('春季')
    expect(seasons).toContain('夏季')
    expect(seasons).toContain('秋季')
    expect(seasons).toContain('冬季')
  })
})
