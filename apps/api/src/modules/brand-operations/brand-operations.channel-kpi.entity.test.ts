import { describe, it, expect } from 'vitest'
import type {
  BrandChannel,
  ChannelType,
  ChannelStatus,
  BrandKPI,
  KpiCategory,
  KpiPeriod,
  BrandKPISummary,
} from './brand-operations.channel-kpi.entity'

describe('BrandChannel Entity', () => {
  it('should create a minimal BrandChannel', () => {
    const channel: BrandChannel = {
      id: 'chan-1',
      tenantId: 't-1',
      brandId: 'b-1',
      name: '抖音推广',
      type: 'social_media',
      status: 'active',
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(channel.name).toBe('抖音推广')
    expect(channel.type).toBe('social_media')
    expect(channel.status).toBe('active')
    expect(channel.config).toBeUndefined()
    expect(channel.contactName).toBeUndefined()
  })

  it('should support all channel types', () => {
    const types: ChannelType[] = ['social_media', 'search_engine', 'display_ad', 'offline_store', 'email', 'sms', 'app_push', 'affiliate', 'other']
    expect(types).toHaveLength(9)
  })

  it('should support all channel statuses', () => {
    const statuses: ChannelStatus[] = ['active', 'inactive', 'paused']
    expect(statuses).toHaveLength(3)
  })

  it('should create a full BrandChannel with config and contacts', () => {
    const channel: BrandChannel = {
      id: 'chan-2',
      tenantId: 't-1',
      brandId: 'b-1',
      name: 'Google Ads',
      type: 'search_engine',
      status: 'active',
      config: {
        accountId: 'ga-123',
        dailyBudget: 5000000,
        monthlyBudget: 150000000,
      },
      contactName: '张三',
      contactPhone: '13800138000',
      notes: '主要投放品牌词',
      operatorId: 'op-1',
      operatorName: '李四',
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(channel.config!.accountId).toBe('ga-123')
    expect(channel.config!.dailyBudget).toBe(5000000)
    expect(channel.contactName).toBe('张三')
    expect(channel.operatorName).toBe('李四')
  })
})

describe('BrandKPI Entity', () => {
  it('should create a BrandKPI', () => {
    const kpi: BrandKPI = {
      id: 'kpi-1',
      tenantId: 't-1',
      brandId: 'b-1',
      name: '7月曝光量',
      category: 'exposure',
      period: 'monthly',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      targetValue: 1000000,
      actualValue: 850000,
      achievementRate: 85,
      source: '抖音',
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(kpi.name).toBe('7月曝光量')
    expect(kpi.category).toBe('exposure')
    expect(kpi.achievementRate).toBe(85)
    expect(kpi.targetValue).toBe(1000000)
  })

  it('should support all KPI categories', () => {
    const categories: KpiCategory[] = ['exposure', 'engagement', 'conversion', 'revenue', 'retention', 'brand_awareness']
    expect(categories).toHaveLength(6)
  })

  it('should support all KPI periods', () => {
    const periods: KpiPeriod[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    expect(periods).toHaveLength(5)
  })

  it('should create a BrandKPI linked to channel and campaign', () => {
    const kpi: BrandKPI = {
      id: 'kpi-2',
      tenantId: 't-1',
      brandId: 'b-1',
      name: 'ROI',
      category: 'revenue',
      period: 'monthly',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      targetValue: 300,
      actualValue: 280,
      achievementRate: 93.33,
      channelId: 'chan-1',
      campaignId: 'bc-1',
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(kpi.channelId).toBe('chan-1')
    expect(kpi.campaignId).toBe('bc-1')
    expect(kpi.achievementRate).toBe(93.33)
  })
})

describe('BrandKPISummary', () => {
  it('should create a KPI summary', () => {
    const summary: BrandKPISummary = {
      totalKpis: 10,
      byCategory: {
        exposure: { count: 3, avgAchievement: 85 },
        engagement: { count: 2, avgAchievement: 72 },
        conversion: { count: 2, avgAchievement: 60 },
        revenue: { count: 1, avgAchievement: 93 },
        retention: { count: 1, avgAchievement: 78 },
        brand_awareness: { count: 1, avgAchievement: 45 },
      },
      exposure: { impressions: 5000000, reach: 3000000 },
      engagement: { likes: 15000, shares: 5000, comments: 3000 },
      conversion: { conversions: 1200, conversionRate: 0.024 },
      revenue: { revenue: 50000000, roi: 2.5 },
      topChannels: [
        { channelId: 'chan-1', channelName: '抖音推广', impressions: 3000000, conversions: 800 },
      ],
    }
    expect(summary.totalKpis).toBe(10)
    expect(summary.byCategory.exposure.count).toBe(3)
    expect(summary.topChannels).toHaveLength(1)
    expect(summary.revenue.roi).toBe(2.5)
  })
})
