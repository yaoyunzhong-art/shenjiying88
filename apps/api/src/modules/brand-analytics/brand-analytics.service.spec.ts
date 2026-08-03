import { describe, it, expect, beforeEach } from 'vitest'
import { BrandAnalyticsService } from './brand-analytics.service'

describe('BrandAnalyticsService', () => {
  let service: BrandAnalyticsService

  beforeEach(() => {
    service = new BrandAnalyticsService()
  })

  // ── KPI ──

  describe('trackKPI / getKPI', () => {
    it('tracks a KPI and retrieves it by date range', async () => {
      const kpi = await service.trackKPI({
        brandId: 'brand-1',
        tenantId: 'tenant-1',
        date: '2026-07-29',
        metrics: { impressions: 1000, clicks: 200, clickRate: 20, conversions: 30, conversionRate: 3, engagementRate: 5, shareCount: 10, commentCount: 5, likeCount: 50, avgEngagementTime: 45, bounceRate: 35, costPerClick: 2.5, costPerMille: 15, returnOnAdSpend: 3.8 },
      })
      expect(kpi.brandId).toBe('brand-1')
      const results = await service.getKPI('brand-1', '2026-07-01', '2026-07-31')
      expect(results).toHaveLength(1)
    })

    it('returns empty array when no KPI in date range', async () => {
      const results = await service.getKPI('brand-1', '2025-01-01', '2025-12-31')
      expect(results).toHaveLength(0)
    })

    it('auto-assigns date when not provided', async () => {
      const kpi = await service.trackKPI({
        brandId: 'brand-2',
        tenantId: 't1',
        metrics: { impressions: 500, clicks: 50, clickRate: 10, conversions: 5, conversionRate: 1, engagementRate: 2, shareCount: 3, commentCount: 1, likeCount: 20, avgEngagementTime: 30, bounceRate: 40, costPerClick: 3, costPerMille: 20, returnOnAdSpend: 2.5 },
      })
      expect(kpi.date).toBeDefined()
      expect(kpi.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  // ── 渠道归因 ──

  describe('getChannelAttribution', () => {
    it('returns 7 channel entries', async () => {
      const channels = await service.getChannelAttribution('brand-1')
      expect(channels).toHaveLength(7)
      expect(channels[0].channel).toBe('social')
      expect(channels[0].touchpoints).toBeGreaterThanOrEqual(1000)
    })
  })

  describe('compareAttributionModels', () => {
    it('returns 5 model comparisons', async () => {
      const models = await service.compareAttributionModels('brand-1')
      expect(models).toHaveLength(5)
      const modelNames = models.map(m => m.model)
      expect(modelNames).toContain('first_touch')
      expect(modelNames).toContain('last_touch')
      expect(modelNames).toContain('linear')
    })
  })

  // ── 品牌声量 ──

  describe('trackMention / getBrandMentions', () => {
    it('tracks a mention and retrieves by brand', async () => {
      const mention = await service.trackMention({
        brandId: 'brand-1',
        date: '2026-07-29',
        platform: 'weibo',
        mentionCount: 100,
        positiveCount: 60,
        negativeCount: 10,
        neutralCount: 30,
        sentimentScore: 0.5,
        topKeywords: [{ keyword: '品牌', count: 50 }],
        topMentions: [{ title: '测试微博', url: 'https://weibo.com/xxx', sentiment: 'positive' }],
      })
      expect(mention.id).toBeDefined()
      const mentions = await service.getBrandMentions('brand-1')
      expect(mentions).toHaveLength(1)
    })

    it('filters mentions by platform', async () => {
      await service.trackMention({
        brandId: 'brand-1', date: '2026-07-29', platform: 'weibo',
        mentionCount: 100, positiveCount: 60, negativeCount: 10, neutralCount: 30, sentimentScore: 0.5,
        topKeywords: [], topMentions: [],
      })
      await service.trackMention({
        brandId: 'brand-1', date: '2026-07-29', platform: 'douyin',
        mentionCount: 200, positiveCount: 100, negativeCount: 20, neutralCount: 80, sentimentScore: 0.4,
        topKeywords: [], topMentions: [],
      })
      const weiboMentions = await service.getBrandMentions('brand-1', 'weibo')
      expect(weiboMentions).toHaveLength(1)
    })
  })

  // ── 健康度 ──

  describe('getBrandHealth / updateHealthScore', () => {
    it('returns default health score for brand', async () => {
      const health = await service.getBrandHealth('brand-1')
      expect(health.overallScore).toBe(78)
      expect(health.dimensions).toBeDefined()
      expect(health.dimensions.awareness.trend).toBe('up')
    })

    it('caches health score after first retrieval', async () => {
      const first = await service.getBrandHealth('brand-1')
      const second = await service.getBrandHealth('brand-1')
      expect(second.overallScore).toBe(first.overallScore)
    })

    it('updateHealthScore merges partial updates', async () => {
      const updated = await service.updateHealthScore('brand-1', { overallScore: 85 })
      expect(updated.overallScore).toBe(85)
      expect(updated.dimensions).toBeDefined()
    })
  })

  // ── 内容表现 ──

  describe('trackContent / getContentPerformance', () => {
    it('tracks content and returns it', async () => {
      const content = await service.trackContent({
        brandId: 'brand-1',
        contentType: 'article',
        title: '测试文章',
        platform: 'wechat',
        publishDate: '2026-07-29',
        metrics: { views: 5000, likes: 300, shares: 50, comments: 20, saves: 100, avgWatchTime: 120, completionRate: 0.7 },
        qualityScore: 85,
        suggestedImprovements: ['优化标题', '增加配图'],
      })
      expect(content.contentId).toBeDefined()
      const all = await service.getContentPerformance('brand-1')
      expect(all.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── 报告 ──

  describe('generateReport / getReports / getReport', () => {
    it('generates a report of given type', async () => {
      const report = await service.generateReport('brand-1', 'weekly')
      expect(report.reportType).toBe('weekly')
      expect(report.summary).toContain('品牌分析报告')
      expect(report.recommendations).toHaveLength(3)
    })

    it('getReports returns reports for brand', async () => {
      await service.generateReport('brand-1', 'daily')
      await service.generateReport('brand-1', 'monthly')
      const reports = await service.getReports('brand-1')
      expect(reports).toHaveLength(2)
    })

    it('getReport throws when not found', async () => {
      await expect(service.getReport('nonexistent')).rejects.toThrow('Report')
    })

    it('getReport returns report by id', async () => {
      const report = await service.generateReport('brand-1', 'weekly')
      const found = await service.getReport(report.id)
      expect(found.id).toBe(report.id)
    })
  })

  // ── ROI ──

  describe('calculateROI', () => {
    it('calculates ROI with valid structure', async () => {
      const roi = await service.calculateROI('brand-1', '2026-01-01', '2026-12-31')
      expect(roi.brandId).toBe('brand-1')
      expect(roi.totalCost).toBeGreaterThan(0)
      expect(roi.totalRevenue).toBeGreaterThan(0)
      expect(roi.netProfit).toBe(roi.totalRevenue - roi.totalCost)
      expect(roi.roas).toBe(roi.totalRevenue / roi.totalCost)
      expect(roi.roi).toBe(((roi.totalRevenue - roi.totalCost) / roi.totalCost) * 100)
    })
  })

  // ── 市场占比 ──

  describe('getMarketShare', () => {
    it('returns market share data', async () => {
      const shares = await service.getMarketShare()
      expect(shares).toHaveLength(3)
      expect(shares[0].brandName).toBe('主品牌')
      expect(shares[0].rank).toBe(1)
    })
  })
})
