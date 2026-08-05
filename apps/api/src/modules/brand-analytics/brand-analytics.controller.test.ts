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

  // ── 新增端点 V24 Phase1 ──────────────────────────────────────────────────

  describe('getAnalytics', () => {
    it('returns aggregated analytics', async () => {
      const result = await controller.getAnalytics('brand-1', {
        startDate: '2026-01-01', endDate: '2026-06-30', granularity: 'month' as any,
      })
      expect(result).toHaveProperty('kpis')
      expect(result).toHaveProperty('attribution')
      expect(result).toHaveProperty('mentions')
      expect(result).toHaveProperty('health')
      expect(result).toHaveProperty('content')
      expect(Array.isArray(result.kpis)).toBe(true)
      expect(Array.isArray(result.attribution)).toBe(true)
      expect(Array.isArray(result.mentions)).toBe(true)
      expect(result.health.overallScore).toBeGreaterThan(0)
      expect(Array.isArray(result.content)).toBe(true)
    })
  })

  describe('compareBrands', () => {
    it('compares multiple brands', async () => {
      const results = await controller.compareBrands({
        brandIds: ['brand-1', 'brand-2'],
        startDate: '2026-01-01', endDate: '2026-06-30',
      })
      expect(results).toHaveLength(2)
      expect(results[0]).toHaveProperty('kpis')
      expect(results[0]).toHaveProperty('health')
    })
  })

  describe('compareCompetitors', () => {
    it('compares brand vs competitors', async () => {
      const results = await controller.compareCompetitors({
        brandId: 'brand-1',
        competitorIds: ['comp-1', 'comp-2'],
        startDate: '2026-01-01', endDate: '2026-06-30',
      })
      expect(results).toHaveLength(2)
      expect(results[0]).toHaveProperty('competitorId')
      expect(results[0]).toHaveProperty('comparison')
    })
  })

  describe('getTopContent', () => {
    it('returns ranked content', async () => {
      const results = await controller.getTopContent('brand-1', {
        startDate: '2026-01-01', endDate: '2026-06-30',
      })
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('getHealthTrend', () => {
    it('returns health trend data', async () => {
      const trends = await controller.getHealthTrend('brand-1', { months: '3' })
      expect(Array.isArray(trends)).toBe(true)
      if (trends.length > 0) {
        expect(trends[0]).toHaveProperty('date')
        expect(trends[0]).toHaveProperty('overallScore')
      }
    })

    it('defaults to 6 months when months param missing', async () => {
      const trends = await controller.getHealthTrend('brand-1', {})
      expect(trends).toHaveLength(6)
    })
  })

  describe('getContentSuggestions', () => {
    it('returns suggestions for content', async () => {
      const suggestions = await controller.getContentSuggestions('content-1', {})
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toHaveProperty('suggestion')
      expect(suggestions[0]).toHaveProperty('priority')
    })
  })
})
