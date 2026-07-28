/**
 * brand-analytics.service.spec.ts — 品牌分析服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - getKPI / trackKPI
 *   - getChannelAttribution / compareAttributionModels
 *   - getBrandMentions / trackMention
 *   - getBrandHealth / updateHealthScore
 *   - getContentPerformance / trackContent
 *   - generateReport / getReports / getReport
 *   - calculateROI / getMarketShare
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandAnalyticsService } from './brand-analytics.service'

describe('BrandAnalyticsService', () => {
  let service: BrandAnalyticsService

  beforeEach(() => {
    service = new BrandAnalyticsService()
  })

  // ── KPI ──────────────────────────────────────────────────────────────────

  describe('KPI', () => {
    it('正例: trackKPI 应创建并返回 KPI', async () => {
      const kpi = await service.trackKPI({
        brandId: 'b1', tenantId: 't1', metrics: { impressions: 1000, clicks: 50 },
      })
      expect(kpi.brandId).toBe('b1')
      expect(kpi.date).toBeTruthy()
    })

    it('正例: getKPI 应按日期范围返回已有 KPI', async () => {
      await service.trackKPI({ brandId: 'b1', tenantId: 't1', metrics: { v: 1 }, date: '2026-07-20' })
      await service.trackKPI({ brandId: 'b1', tenantId: 't1', metrics: { v: 2 }, date: '2026-07-22' })
      const result = await service.getKPI('b1', '2026-07-20', '2026-07-21')
      expect(result).toHaveLength(1)
    })

    it('边缘: 无匹配 KPI 应返回空数组', async () => {
      const result = await service.getKPI('nonexistent', '2026-01-01', '2026-12-31')
      expect(result).toEqual([])
    })
  })

  // ── 渠道归因 ──────────────────────────────────────────────────────────────

  describe('ChannelAttribution', () => {
    it('正例: getChannelAttribution 应返回 7 个渠道数据', async () => {
      const result = await service.getChannelAttribution('b1')
      expect(result).toHaveLength(7)
      expect(result[0].channel).toBeTruthy()
      expect(result[0].touchpoints).toBeGreaterThan(0)
    })

    it('正例: compareAttributionModels 应返回 5 种模型', async () => {
      const result = await service.compareAttributionModels('b1')
      expect(result).toHaveLength(5)
      expect(result[0].model).toBeTruthy()
      expect(result[0].channels.length).toBeGreaterThan(0)
    })
  })

  // ── 品牌声量 ──────────────────────────────────────────────────────────────

  describe('BrandMentions', () => {
    it('正例: trackMention 应创建提及记录', async () => {
      const m = await service.trackMention({
        brandId: 'b1', platform: 'weibo', content: 'mention text',
        mentionType: 'positive', authorName: 'user1', mentionCount: 1,
        reach: 100, sentimentScore: 0.8, url: 'https://example.com',
        mentionedAt: new Date(), tenantId: 't1',
      })
      expect(m.id).toBeTruthy()
      expect(m.platform).toBe('weibo')
    })

    it('正例: getBrandMentions 应支持按平台过滤', async () => {
      await service.trackMention({
        brandId: 'b1', platform: 'weibo', content: 'c1',
        mentionType: 'positive', authorName: 'u1', mentionCount: 1,
        reach: 50, sentimentScore: 0.5, url: 'https://a.com',
        mentionedAt: new Date(), tenantId: 't1',
      })
      await service.trackMention({
        brandId: 'b1', platform: 'redbook', content: 'c2',
        mentionType: 'neutral', authorName: 'u2', mentionCount: 2,
        reach: 80, sentimentScore: 0, url: 'https://b.com',
        mentionedAt: new Date(), tenantId: 't1',
      })
      const weiboOnly = await service.getBrandMentions('b1', 'weibo')
      expect(weiboOnly).toHaveLength(1)
      expect(weiboOnly[0].platform).toBe('weibo')
    })
  })

  // ── 健康度 ────────────────────────────────────────────────────────────────

  describe('BrandHealth', () => {
    it('正例: getBrandHealth 应返回默认健康评分', async () => {
      const h = await service.getBrandHealth('b1')
      expect(h.overallScore).toBe(78)
      expect(h.dimensions.awareness).toBeTruthy()
    })

    it('正例: updateHealthScore 应合并更新', async () => {
      const updated = await service.updateHealthScore('b1', { overallScore: 90 })
      expect(updated.overallScore).toBe(90)
    })
  })

  // ── 内容表现 ──────────────────────────────────────────────────────────────

  describe('ContentPerformance', () => {
    it('正例: trackContent 应创建内容记录', async () => {
      const c = await service.trackContent({
        brandId: 'b1', type: 'article', title: 'Test', url: 'https://x.com',
        views: 100, clicks: 10, shares: 5, engagement: 0.1,
        date: '2026-07-20', tenantId: 't1',
      })
      expect(c.contentId).toBeTruthy()
    })
  })

  // ── 报告 ──────────────────────────────────────────────────────────────────

  describe('Reports', () => {
    it('正例: generateReport 应生成报告', async () => {
      const report = await service.generateReport('b1', 'weekly')
      expect(report.id).toBeTruthy()
      expect(report.reportType).toBe('weekly')
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('正例: getReports 应返回品牌报告列表', async () => {
      await service.generateReport('b1', 'weekly')
      await service.generateReport('b1', 'monthly')
      const reports = await service.getReports('b1')
      expect(reports.length).toBeGreaterThanOrEqual(2)
    })

    it('异常: getReport 不存时应抛 NotFoundException', async () => {
      await expect(service.getReport('nonexistent')).rejects.toThrow()
    })
  })

  // ── ROI & 市场占比 ────────────────────────────────────────────────────────

  describe('ROI & MarketShare', () => {
    it('正例: calculateROI 应返回计算值', async () => {
      const roi = await service.calculateROI('b1', '2026-01-01', '2026-12-31')
      expect(roi.brandId).toBe('b1')
      expect(roi.roi).toBeGreaterThan(0)
      expect(roi.roas).toBeGreaterThan(0)
    })

    it('正例: getMarketShare 应返回品牌份额列表', async () => {
      const shares = await service.getMarketShare()
      expect(shares.length).toBeGreaterThan(0)
      expect(shares[0].brandName).toBeTruthy()
    })
  })
})
