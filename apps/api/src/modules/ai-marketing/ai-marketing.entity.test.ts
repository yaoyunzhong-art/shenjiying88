import { describe, it, expect } from 'vitest'
import {
  Campaign,
  CampaignType,
  Channel,
  GeneratedCopy,
  ROIResult,
  BudgetAllocation,
  TimelineMilestone,
  ReachEstimate,
  MarketingAnalysisRequest,
  MarketingAnalysisResponse,
  BatchCopyItem,
  BatchCopyResponse,
  CampaignComparison,
  AIMarketingModuleStats,
} from './ai-marketing.entity'

describe('ai-marketing entity type exports', () => {
  it('should export Campaign type with expected fields', () => {
    const campaign: Campaign = {
      id: 'camp-001',
      name: '测试活动',
      type: 'performance',
      revenue: 100000,
      cost: 30000,
      audience: 50000,
      channel: 'douyin',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    }
    expect(campaign.id).toBe('camp-001')
    expect(campaign.type).toBe('performance')
    expect(campaign.channel).toBe('douyin')
  })

  it('should support all CampaignType values', () => {
    const types: CampaignType[] = ['brand', 'performance', 'social', 'email', 'promotion', 'kOL']
    expect(types).toHaveLength(6)
  })

  it('should support all Channel values', () => {
    const channels: Channel[] = [
      'wechat', 'weibo', 'douyin', 'xiaohongshu',
      'bilibili', 'offline', 'email', 'sms',
    ]
    expect(channels).toHaveLength(8)
  })

  it('should export GeneratedCopy with all fields', () => {
    const copy: GeneratedCopy = {
      headline: '测试标题',
      body: '测试正文',
      cta: '立即购买',
      taglines: ['品质', '信赖'],
    }
    expect(copy.headline).toBeDefined()
    expect(copy.body).toBeDefined()
    expect(copy.cta).toBeDefined()
    expect(copy.taglines).toHaveLength(2)
  })

  it('should export ROIResult with numeric fields', () => {
    const result: ROIResult = {
      campaignId: 'camp-001',
      revenue: 100000,
      cost: 30000,
      roi: 2.33,
      roiPercent: 233.33,
      profit: 70000,
      isPositive: true,
    }
    expect(result.roiPercent).toBeCloseTo(233.33, 1)
    expect(result.isPositive).toBe(true)
  })

  it('should export BudgetAllocation with correct structure', () => {
    const alloc: BudgetAllocation = {
      channel: 'douyin',
      amount: 50000,
      percent: 50,
      expectedROI: 1.5,
    }
    expect(alloc.channel).toBe('douyin')
    expect(alloc.amount).toBeGreaterThan(0)
  })

  it('should export TimelineMilestone with activity list', () => {
    const milestone: TimelineMilestone = {
      phase: '爆发期',
      startDay: 1,
      endDay: 7,
      activities: ['发布', '推广', '运营'],
    }
    expect(milestone.activities).toHaveLength(3)
  })

  it('should export ReachEstimate with cost calculation', () => {
    const reach: ReachEstimate = {
      channel: 'wechat',
      audience: 50000,
      impressions: 100000,
      reach: 40000,
      cpm: 50,
      cost: 5000,
    }
    expect(reach.cost).toBeGreaterThan(0)
  })

  it('should export MarketingAnalysisRequest with optional fields', () => {
    const req: MarketingAnalysisRequest = {
      campaignId: 'camp-001',
      includeROI: true,
      includeTimeline: false,
    }
    expect(req.includeROI).toBe(true)
  })

  it('should export MarketingAnalysisResponse with analyzed timestamp', () => {
    const res: MarketingAnalysisResponse = {
      campaignId: 'camp-001',
      campaignName: '测试活动',
      roi: null,
      analyzedAt: new Date().toISOString(),
    }
    expect(res.analyzedAt).toBeDefined()
  })

  it('should export BatchCopyItem and BatchCopyResponse', () => {
    const item: BatchCopyItem = {
      product: '产品A',
      goal: 'conversion',
      audience: '年轻用户',
    }
    expect(item.product).toBe('产品A')

    const resp: BatchCopyResponse = {
      items: [],
      totalGenerated: 0,
      generatedAt: new Date().toISOString(),
    }
    expect(resp.totalGenerated).toBe(0)
  })

  it('should export CampaignComparison with rank', () => {
    const comp: CampaignComparison = {
      campaignId: 'camp-001',
      campaignName: '测试活动',
      roiPercent: 150,
      revenue: 100000,
      cost: 40000,
      rank: 1,
    }
    expect(comp.rank).toBe(1)
  })

  it('should export AIMarketingModuleStats with aggregate fields', () => {
    const stats: AIMarketingModuleStats = {
      totalCampaigns: 5,
      totalRevenue: 500000,
      totalCost: 210000,
      averageROI: 138.1,
      positiveCampaigns: 4,
      negativeCampaigns: 1,
    }
    expect(stats.averageROI).toBeGreaterThan(0)
    expect(stats.positiveCampaigns + stats.negativeCampaigns).toBe(stats.totalCampaigns)
  })
})
