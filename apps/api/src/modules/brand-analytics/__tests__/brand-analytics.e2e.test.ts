/**
 * Brand Analytics - E2E 集成测试 (V24 Phase 1)
 *
 * 覆盖: KPI 追踪与查询、渠道归因、品牌声量、健康度、内容表现、报告生成、ROI、市场占比
 * 直接调用 Controller 验证完整业务链路 (无 HTTP 直连)
 */

import 'reflect-metadata'
import { describe, it, beforeAll, expect, vi } from 'vitest'

// Mock IdentityAccessGuard to avoid import resolution issues in standalone E2E
vi.mock('../../common/guards/identity-access.guard', () => ({
  IdentityAccessGuard: class IdentityAccessGuardMock {
    canActivate() { return true }
  },
}))
import assert from 'node:assert/strict'
import { BrandAnalyticsController } from '../brand-analytics.controller'
import { BrandAnalyticsService } from '../brand-analytics.service'

// ============ Helpers ============

const fullMetrics = {
  impressions: 50000,
  clicks: 2500,
  clickRate: 5.0,
  conversions: 150,
  conversionRate: 6.0,
  engagementRate: 3.2,
  shareCount: 320,
  commentCount: 180,
  likeCount: 1200,
  avgEngagementTime: 45,
  bounceRate: 35.5,
  costPerClick: 2.5,
  costPerMille: 15.0,
  returnOnAdSpend: 3.8,
}

const contentMetrics = {
  views: 5000,
  likes: 300,
  shares: 50,
  comments: 20,
  saves: 100,
  avgWatchTime: 120,
  completionRate: 0.7,
}

// ============ Setup ============

let controller: BrandAnalyticsController

beforeAll(() => {
  controller = new BrandAnalyticsController(new BrandAnalyticsService())
})

// ============ Tests ============

describe('BrandAnalytics E2E — KPI', () => {
  const brandId = 'e2e-kpi-brand'

  it('追踪 KPI 并返回完整字段', async () => {
    const kpi = await controller.trackKPI({ brandId, tenantId: 't-e2e', date: '2026-07-29', metrics: fullMetrics })
    assert.ok(kpi.brandId === brandId)
    assert.ok(kpi.date === '2026-07-29')
    assert.ok(kpi.metrics.impressions === 50000)
    assert.ok(kpi.metrics.returnOnAdSpend === 3.8)
    assert.ok(kpi.metrics.clickRate === 5.0)
  })

  it('按日期范围查询 KPI', async () => {
    await controller.trackKPI({ brandId, tenantId: 't-e2e', date: '2026-07-28', metrics: fullMetrics })
    await controller.trackKPI({ brandId, tenantId: 't-e2e', date: '2026-07-30', metrics: fullMetrics })
    // 查询 7 月最后三天
    const results = await controller.getKPI(brandId, { startDate: '2026-07-28', endDate: '2026-07-30' })
    assert.ok(results.length === 3, `应有 3 条 KPI, 实际 ${results.length}`)
  })

  it('无数据时返回空数组', async () => {
    const results = await controller.getKPI('nonexistent', { startDate: '2025-01-01', endDate: '2025-12-31' })
    assert.ok(results.length === 0)
  })
})

describe('BrandAnalytics E2E — 渠道归因', () => {
  it('返回 7 个渠道且字段完整', async () => {
    const channels = await controller.getChannelAttribution('e2e-attribution')
    assert.ok(channels.length === 7)
    const channelNames = channels.map(c => c.channel)
    assert.ok(channelNames.includes('social'))
    assert.ok(channelNames.includes('search'))
    assert.ok(channelNames.includes('email'))
    assert.ok(channelNames.includes('display'))
    assert.ok(channelNames.includes('direct'))
    assert.ok(channelNames.includes('referral'))
    assert.ok(channelNames.includes('organic'))
    channels.forEach(c => {
      assert.ok(typeof c.touchpoints === 'number' && c.touchpoints > 0)
      assert.ok(typeof c.attributedRevenue === 'number' && c.attributedRevenue > 0)
    })
  })

  it('归因模型对比返回 5 种模型', async () => {
    const models = await controller.compareModels('e2e-attribution')
    assert.ok(models.length === 5)
    const modelNames = models.map(m => m.model)
    assert.ok(modelNames.includes('first_touch'))
    assert.ok(modelNames.includes('last_touch'))
    assert.ok(modelNames.includes('linear'))
    assert.ok(modelNames.includes('time_decay'))
    assert.ok(modelNames.includes('position_based'))
    models.forEach(m => {
      assert.ok(m.channels.length > 0)
      assert.ok(m.totalAttributedConversions > 0)
      assert.ok(m.totalAttributedRevenue > 0)
    })
  })
})

describe('BrandAnalytics E2E — 品牌声量', () => {
  const brandId = 'e2e-mention-brand'

  it('追踪声量并返回 ID', async () => {
    const mention = await controller.trackMention({
      brandId, date: '2026-07-29', platform: 'weibo',
      mentionCount: 500, positiveCount: 300, negativeCount: 50, neutralCount: 150,
      sentimentScore: 0.6,
      topKeywords: [{ keyword: '新品', count: 120 }, { keyword: '优惠', count: 80 }],
      topMentions: [{ title: '品牌话题', url: 'https://weibo.com/xxx', sentiment: 'positive' }],
    })
    assert.ok(mention.id, '应生成 ID')
    assert.ok(mention.brandId === brandId)
  })

  it('无过滤条件查询返回该品牌所有声量', async () => {
    await controller.trackMention({
      brandId, date: '2026-07-29', platform: 'douyin',
      mentionCount: 800, positiveCount: 400, negativeCount: 80, neutralCount: 320,
      sentimentScore: 0.45, topKeywords: [], topMentions: [],
    })
    await controller.trackMention({
      brandId, date: '2026-07-29', platform: 'xiaohongshu',
      mentionCount: 300, positiveCount: 200, negativeCount: 20, neutralCount: 80,
      sentimentScore: 0.72, topKeywords: [], topMentions: [],
    })
    const all = await controller.getBrandMentions(brandId)
    assert.ok(all.length === 3, `应有 3 条声量, 实际 ${all.length}`)
  })

  it('按平台过滤声量', async () => {
    const weiboOnly = await controller.getBrandMentions(brandId, 'weibo')
    assert.ok(weiboOnly.length === 1)
    assert.ok(weiboOnly[0].platform === 'weibo')
  })
})

describe('BrandAnalytics E2E — 品牌健康度', () => {
  const brandId = 'e2e-health-brand'

  it('未初始化品牌返回默认健康度', async () => {
    const health = await controller.getBrandHealth(brandId)
    assert.ok(health.overallScore === 78)
    assert.ok(health.dimensions.awareness.score === 72)
    assert.ok(health.dimensions.awareness.trend === 'up')
    assert.ok(health.dimensions.engagement.score === 81)
    assert.ok(health.dimensions.reputation.score === 85)
    assert.ok(health.dimensions.loyalty.score === 68)
    assert.ok(health.dimensions.content.score === 76)
    assert.ok(health.lastUpdated instanceof Date)
  })

  it('更新健康度并存回', async () => {
    const updated = await controller.updateHealthScore(brandId, { overallScore: 85 })
    assert.ok(updated.overallScore === 85)
    // 再次读取确认持久化
    const reRead = await controller.getBrandHealth(brandId)
    assert.ok(reRead.overallScore === 85)
  })

  it('更新维度时将替换整个 dimensions 对象', async () => {
    const updated = await controller.updateHealthScore(brandId, {
      dimensions: { awareness: { score: 90, trend: 'up' as const, description: '知名度大幅提升' } },
    })
    assert.ok(updated.overallScore === 85, 'overallScore 未改变')
    assert.ok(updated.dimensions.awareness.score === 90)
    // 注意: updateHealthScore 使用浅合并, dimensions 整体替换
    assert.ok(Object.keys(updated.dimensions).length === 1, '浅合并后只有传入的维度')
  })
})

describe('BrandAnalytics E2E — 内容表现', () => {
  it('追踪内容并返回含 contentId', async () => {
    const content = await controller.trackContent({
      contentType: 'article', title: 'E2E 测试文章', platform: 'wechat',
      publishDate: '2026-07-29', metrics: contentMetrics,
      qualityScore: 90, suggestedImprovements: ['优化标题', '增加配图'],
    })
    assert.ok(content.contentId)
    assert.ok(content.contentType === 'article')
    assert.ok(content.metrics.views === 5000)
  })

  it('查询内容列表不报错', async () => {
    const list = await controller.getContentPerformance('e2e-content-brand')
    assert.ok(Array.isArray(list))
  })

  it('追踪不同类型内容均可', async () => {
    const types = ['video', 'image', 'live', 'audio'] as const
    for (const t of types) {
      const c = await controller.trackContent({
        contentType: t, title: `${t}-内容`, platform: 'douyin',
        publishDate: '2026-07-29', metrics: contentMetrics,
      })
      assert.ok(c.contentType === t)
    }
  })
})

describe('BrandAnalytics E2E — 报告生成', () => {
  const brandId = 'e2e-report-brand'

  it('生成周报并包含完整字段', async () => {
    const report = await controller.generateReport(brandId, { reportType: 'weekly' })
    assert.ok(report.id)
    assert.ok(report.reportType === 'weekly')
    assert.ok(report.summary.includes('品牌分析报告'))
    assert.ok(report.channelAttribution.length === 7)
    assert.ok(report.healthScore.overallScore > 0)
    assert.ok(report.recommendations.length === 3)
    assert.ok(report.generatedAt instanceof Date)
  })

  it('支持生成 4 种报告类型', async () => {
    for (const type of ['daily', 'weekly', 'monthly', 'quarterly'] as const) {
      const report = await controller.generateReport(brandId, { reportType: type })
      assert.ok(report.reportType === type)
    }
  })

  it('生成后可在报告列表中查到', async () => {
    const r1 = await controller.generateReport(brandId, { reportType: 'daily' })
    const r2 = await controller.generateReport(brandId, { reportType: 'monthly' })
    const list = await controller.getReports(brandId)
    assert.ok(list.length >= 2)
    const ids = list.map(r => r.id)
    assert.ok(ids.includes(r1.id))
    assert.ok(ids.includes(r2.id))
  })

  it('按 ID 查询报告详情', async () => {
    const r = await controller.generateReport(brandId, { reportType: 'quarterly' })
    const found = await controller.getReport(r.id)
    assert.ok(found.id === r.id)
    assert.ok(found.summary === r.summary)
  })
})

describe('BrandAnalytics E2E — ROI 计算', () => {
  it('返回 ROI 结构且公式正确', async () => {
    const roi = await controller.calculateROI('e2e-roi-brand', {
      startDate: '2026-01-01', endDate: '2026-12-31',
    })
    assert.ok(roi.brandId === 'e2e-roi-brand')
    assert.ok(roi.totalCost > 0)
    assert.ok(roi.totalRevenue > 0)
    assert.ok(roi.netProfit === roi.totalRevenue - roi.totalCost)
    assert.ok(roi.roas === roi.totalRevenue / roi.totalCost)
    assert.ok(roi.roi === ((roi.totalRevenue - roi.totalCost) / roi.totalCost) * 100)
  })
})

describe('BrandAnalytics E2E — 市场占比', () => {
  it('返回市场占比数据', async () => {
    const data = await controller.getMarketShare()
    assert.ok(data.length === 3)
    assert.ok(data[0].brandName === '主品牌')
    assert.ok(data[0].rank === 1)
    assert.ok(data[0].share === 35.2)
    data.forEach(d => {
      assert.ok(d.brandId)
      assert.ok(d.share > 0)
      assert.ok(d.rank > 0)
    })
  })
})
