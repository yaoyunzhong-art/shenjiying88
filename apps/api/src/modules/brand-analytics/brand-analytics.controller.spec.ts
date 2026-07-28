import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../common/guards/identity-access.guard', () => ({
  IdentityAccessGuard: class IdentityAccessGuardMock { canActivate() { return true } },
}))

import { BrandAnalyticsController } from './brand-analytics.controller'
import { BrandAnalyticsService } from './brand-analytics.service'

describe('BrandAnalyticsController', () => {
  let controller: BrandAnalyticsController
  let service: BrandAnalyticsService

  beforeEach(() => {
    service = new BrandAnalyticsService()
    controller = new BrandAnalyticsController(service)
  })

  describe('getKPI', () => {
    it('returns KPIs for brand within date range', async () => {
      const kpis = await controller.getKPI('brand-1', { startDate: '2026-01-01', endDate: '2026-12-31' })
      expect(Array.isArray(kpis)).toBe(true)
    })
  })

  describe('trackKPI', () => {
    it('tracks a new KPI', async () => {
      const kpi = await controller.trackKPI({
        brandId: 'brand-1', tenantId: 't1',
        metrics: { impressions: 100, clicks: 10, clickRate: 10, conversions: 1, conversionRate: 1, engagementRate: 2, shareCount: 3, commentCount: 1, likeCount: 20, avgEngagementTime: 30, bounceRate: 40, costPerClick: 3, costPerMille: 20, returnOnAdSpend: 2.5 },
      })
      expect(kpi.brandId).toBe('brand-1')
    })
  })

  describe('getChannelAttribution', () => {
    it('returns 7 channels', async () => {
      const channels = await controller.getChannelAttribution('brand-1')
      expect(channels).toHaveLength(7)
    })
  })

  describe('compareModels', () => {
    it('returns 5 model comparisons', async () => {
      const models = await controller.compareModels('brand-1')
      expect(models).toHaveLength(5)
    })
  })

  describe('getBrandMentions', () => {
    it('returns mentions (filtered by platform)', async () => {
      const mentions = await controller.getBrandMentions('brand-1', 'weibo')
      expect(Array.isArray(mentions)).toBe(true)
    })
  })

  describe('trackMention', () => {
    it('tracks a mention', async () => {
      const m = await controller.trackMention({
        brandId: 'brand-1', date: '2026-07-29', platform: 'weibo',
        mentionCount: 100, positiveCount: 60, negativeCount: 10, neutralCount: 30, sentimentScore: 0.5,
        topKeywords: [], topMentions: [],
      })
      expect(m.id).toBeDefined()
    })
  })

  describe('getBrandHealth', () => {
    it('returns health score', async () => {
      const h = await controller.getBrandHealth('brand-1')
      expect(h.overallScore).toBe(78)
    })
  })

  describe('updateHealthScore', () => {
    it('partially updates health score', async () => {
      const u = await controller.updateHealthScore('brand-1', { overallScore: 90 })
      expect(u.overallScore).toBe(90)
    })
  })

  describe('getContentPerformance', () => {
    it('returns content list', async () => {
      const list = await controller.getContentPerformance('brand-1')
      expect(Array.isArray(list)).toBe(true)
    })
  })

  describe('trackContent', () => {
    it('tracks content', async () => {
      const c = await controller.trackContent({
        contentType: 'video', title: '测试', platform: 'douyin',
        publishDate: '2026-07-29',
        metrics: { views: 100, likes: 10, shares: 2, comments: 1, saves: 5, avgWatchTime: 60, completionRate: 0.8 },
      })
      expect(c.contentId).toBeDefined()
    })
  })

  describe('generateReport', () => {
    it('generates a report', async () => {
      const r = await controller.generateReport('brand-1', { reportType: 'weekly' })
      expect(r.reportType).toBe('weekly')
    })
  })

  describe('getReports', () => {
    it('returns reports for brand', async () => {
      await controller.generateReport('brand-1', { reportType: 'daily' })
      const reports = await controller.getReports('brand-1')
      expect(reports.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getReport', () => {
    it('returns report by id', async () => {
      const r = await controller.generateReport('brand-1', { reportType: 'monthly' })
      const found = await controller.getReport(r.id)
      expect(found.id).toBe(r.id)
    })
  })

  describe('calculateROI', () => {
    it('returns ROI calculation', async () => {
      const roi = await controller.calculateROI('brand-1', { startDate: '2026-01-01', endDate: '2026-12-31' })
      expect(roi.netProfit).toBe(roi.totalRevenue - roi.totalCost)
    })
  })

  describe('getMarketShare', () => {
    it('returns market share data', async () => {
      const data = await controller.getMarketShare()
      expect(data).toHaveLength(3)
    })
  })
})
