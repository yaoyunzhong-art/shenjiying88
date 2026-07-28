import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type {
  BrandKPI,
  ChannelAttribution,
  BrandMention,
  BrandHealthScore,
  ContentPerformance,
  BrandAnalyticsReport,
  ROICalculation,
  AttributionModelComparison,
  MarketShareData,
} from './brand-analytics.entity'

@Injectable()
export class BrandAnalyticsService {
  private kpis = new Map<string, BrandKPI>()
  private mentions = new Map<string, BrandMention>()
  private healthScores = new Map<string, BrandHealthScore>()
  private content = new Map<string, ContentPerformance>()
  private reports = new Map<string, BrandAnalyticsReport>()

  // ── KPI ──────────────────────────────────────────────────────────────────

  async getKPI(brandId: string, startDate: string, endDate: string): Promise<BrandKPI[]> {
    return Array.from(this.kpis.values()).filter(
      k => k.brandId === brandId && k.date >= startDate && k.date <= endDate,
    )
  }

  async trackKPI(data: Omit<BrandKPI, 'date'> & { date?: string }): Promise<BrandKPI> {
    const kpi: BrandKPI = {
      ...data,
      date: data.date ?? new Date().toISOString().slice(0, 10),
    }
    const id = `${kpi.brandId}:${kpi.date}`
    this.kpis.set(id, kpi)
    return kpi
  }

  // ── 渠道归因 ─────────────────────────────────────────────────────────────

  async getChannelAttribution(brandId: string): Promise<ChannelAttribution[]> {
    return Array.from({ length: 7 }, (_, i) => ({
      channel: ['social', 'search', 'email', 'display', 'direct', 'referral', 'organic'][i],
      channelName: ['社交媒体', '搜索引擎', '电子邮件', '展示广告', '直接访问', '引荐流量', '自然搜索'][i],
      touchpoints: Math.floor(Math.random() * 5000) + 1000,
      firstTouchConversions: Math.floor(Math.random() * 200) + 10,
      lastTouchConversions: Math.floor(Math.random() * 300) + 20,
      linearConversions: Math.floor(Math.random() * 250) + 15,
      timeDecayConversions: Math.floor(Math.random() * 150) + 5,
      attributedRevenue: Math.floor(Math.random() * 500000) + 50000,
      attributedConversions: Math.floor(Math.random() * 400) + 50,
      conversionValue: Math.floor(Math.random() * 500) + 100,
    }))
  }

  async compareAttributionModels(brandId: string): Promise<AttributionModelComparison[]> {
    const models: AttributionModelComparison['model'][] = [
      'first_touch', 'last_touch', 'linear', 'time_decay', 'position_based',
    ]
    return models.map(model => ({
      model,
      channels: Array.from({ length: 3 }, (_, i) => ({
        channel: ['social', 'search', 'organic'][i],
        attributedConversions: Math.floor(Math.random() * 100) + 10,
        attributedRevenue: Math.floor(Math.random() * 100000) + 10000,
      })),
      totalAttributedConversions: Math.floor(Math.random() * 300) + 50,
      totalAttributedRevenue: Math.floor(Math.random() * 300000) + 50000,
    }))
  }

  // ── 品牌声量 ─────────────────────────────────────────────────────────────

  async getBrandMentions(brandId: string, platform?: string): Promise<BrandMention[]> {
    return Array.from(this.mentions.values()).filter(
      m => m.brandId === brandId && (!platform || m.platform === platform),
    )
  }

  async trackMention(data: Omit<BrandMention, 'id'>): Promise<BrandMention> {
    const mention: BrandMention = { id: randomUUID(), ...data }
    this.mentions.set(mention.id, mention)
    return mention
  }

  // ── 健康度 ───────────────────────────────────────────────────────────────

  async getBrandHealth(brandId: string): Promise<BrandHealthScore> {
    const existing = this.healthScores.get(brandId)
    if (existing) return existing

    const score: BrandHealthScore = {
      brandId,
      overallScore: 78,
      dimensions: {
        awareness: { score: 72, trend: 'up', description: '品牌知名度稳中有升' },
        engagement: { score: 81, trend: 'stable', description: '用户互动率保持稳定' },
        reputation: { score: 85, trend: 'up', description: '品牌美誉度提升' },
        loyalty: { score: 68, trend: 'down', description: '复购率略有下降' },
        content: { score: 76, trend: 'up', description: '内容质量持续改善' },
      },
      lastUpdated: new Date(),
    }
    this.healthScores.set(brandId, score)
    return score
  }

  async updateHealthScore(
    brandId: string,
    update: Partial<BrandHealthScore>,
  ): Promise<BrandHealthScore> {
    const existing = await this.getBrandHealth(brandId)
    const updated = { ...existing, ...update, lastUpdated: new Date() }
    this.healthScores.set(brandId, updated)
    return updated
  }

  // ── 内容表现 ─────────────────────────────────────────────────────────────
  private contentBrandMap = new Map<string, string>() // contentId → brandId

  async getContentPerformance(brandId: string): Promise<ContentPerformance[]> {
    return Array.from(this.content.values()).filter((c) => {
      return this.contentBrandMap.get(c.contentId) === brandId
    })
  }

  async trackContent(data: Omit<ContentPerformance, 'contentId'> & { brandId?: string }): Promise<ContentPerformance> {
    const item: ContentPerformance = { contentId: randomUUID(), ...data }
    this.content.set(item.contentId, item)
    this.contentBrandMap.set(item.contentId, data.brandId ?? 'default')
    return item
  }

  // ── 报告 ─────────────────────────────────────────────────────────────────

  async generateReport(brandId: string, reportType: BrandAnalyticsReport['reportType']): Promise<BrandAnalyticsReport> {
    const health = await this.getBrandHealth(brandId)
    const kpis = await this.getKPI(brandId, '', '')
    const report: BrandAnalyticsReport = {
      id: randomUUID(),
      brandId,
      tenantId: 'default',
      reportType,
      dateRange: { start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
      summary: `品牌分析报告 - ${reportType}`,
      kpiSummary: kpis[kpis.length - 1] ?? { brandId, tenantId: '', date: '', metrics: {} as any },
      channelAttribution: await this.getChannelAttribution(brandId),
      brandMentions: await this.getBrandMentions(brandId),
      healthScore: health,
      topContent: await this.getContentPerformance(brandId),
      recommendations: ['增加社交媒体投放', '优化内容质量', '关注竞品动态'],
      generatedAt: new Date(),
    }
    this.reports.set(report.id, report)
    return report
  }

  async getReports(brandId: string): Promise<BrandAnalyticsReport[]> {
    return Array.from(this.reports.values()).filter(r => r.brandId === brandId)
  }

  async getReport(id: string): Promise<BrandAnalyticsReport> {
    const report = this.reports.get(id)
    if (!report) throw new NotFoundException(`Report ${id} not found`)
    return report
  }

  // ── ROI ──────────────────────────────────────────────────────────────────

  async calculateROI(brandId: string, startDate: string, endDate: string): Promise<ROICalculation> {
    const totalCost = Math.floor(Math.random() * 500000) + 100000
    const totalRevenue = Math.floor(Math.random() * 1500000) + 200000
    return {
      brandId,
      startDate,
      endDate,
      totalCost,
      totalRevenue,
      roi: ((totalRevenue - totalCost) / totalCost) * 100,
      roas: totalRevenue / totalCost,
      netProfit: totalRevenue - totalCost,
    }
  }

  // ── 市场占比 ─────────────────────────────────────────────────────────────

  async getMarketShare(): Promise<MarketShareData[]> {
    return [
      { brandId: 'brand-1', brandName: '主品牌', share: 35.2, categoryTotal: 100, rank: 1 },
      { brandId: 'brand-2', brandName: '子品牌A', share: 18.7, categoryTotal: 100, rank: 3 },
      { brandId: 'brand-3', brandName: '子品牌B', share: 12.4, categoryTotal: 100, rank: 5 },
    ]
  }

  // ── 品牌分析综合查询 ───────────────────────────────────────────────────

  async getAnalytics(query: {
    brandId: string
    startDate: string
    endDate: string
    granularity: string
    channels?: string[]
    platforms?: string[]
  }): Promise<{
    kpis: BrandKPI[]
    attribution: ChannelAttribution[]
    mentions: BrandMention[]
    health: BrandHealthScore
    content: ContentPerformance[]
  }> {
    const [kpis, attribution, mentions, health, content] = await Promise.all([
      this.getKPI(query.brandId, query.startDate, query.endDate),
      this.getChannelAttribution(query.brandId),
      this.getBrandMentions(query.brandId),
      this.getBrandHealth(query.brandId),
      this.getContentPerformance(query.brandId),
    ])
    return { kpis, attribution, mentions, health, content }
  }

  // ── 竞争品牌对比 ───────────────────────────────────────────────────────

  async compareBrands(
    brandIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<{ brandId: string; kpis: BrandKPI[]; health: BrandHealthScore }[]> {
    return Promise.all(
      brandIds.map(async (brandId) => ({
        brandId,
        kpis: await this.getKPI(brandId, startDate, endDate),
        health: await this.getBrandHealth(brandId),
      })),
    )
  }

  // ── 竞争分析（主品牌 vs 竞品） ─────────────────────────────────────────

  async compareCompetitors(
    brandId: string,
    competitorIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<{ brandId: string; competitorId: string; comparison: Record<string, number> }[]> {
    return competitorIds.map((competitorId) => ({
      brandId,
      competitorId,
      comparison: {
        awarenessDiff: Math.floor(Math.random() * 30) - 15,
        shareDiff: Math.floor(Math.random() * 20) - 10,
        engagementDiff: Math.floor(Math.random() * 10) - 5,
        sentimentDiff: Math.random() * 0.6 - 0.3,
      },
    }))
  }

  // ── 热门内容排名 ───────────────────────────────────────────────────────

  async getTopContent(
    brandId: string,
    options: { contentType?: string; platform?: string; startDate: string; endDate: string },
  ): Promise<ContentPerformance[]> {
    const all = await this.getContentPerformance(brandId)
    return all
      .filter((c) => {
        if (options.contentType && c.contentType !== options.contentType) return false
        if (options.platform && c.platform !== options.platform) return false
        return true
      })
      .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0))
      .slice(0, 10)
  }

  // ── 健康度趋势 ─────────────────────────────────────────────────────────

  async getHealthTrend(brandId: string, months: number): Promise<{ date: string; overallScore: number }[]> {
    const now = new Date()
    return Array.from({ length: months })
      .fill(null)
      .map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        return {
          date: d.toISOString().slice(0, 7),
          overallScore: Math.floor(Math.random() * 30) + 60,
        }
      })
      .reverse()
  }

  // ── 内容建议 ───────────────────────────────────────────────────────────

  async getContentSuggestions(
    contentId: string,
    _contentType?: string,
  ): Promise<{ suggestion: string; priority: 'high' | 'medium' | 'low' }[]> {
    return [
      { suggestion: '优化标题吸引点击', priority: 'high' },
      { suggestion: '增加互动引导文案', priority: 'high' },
      { suggestion: '提升内容视觉质量', priority: 'medium' },
      { suggestion: '结合热点话题创作', priority: 'medium' },
      { suggestion: '优化发布时间策略', priority: 'low' },
    ]
  }
}
