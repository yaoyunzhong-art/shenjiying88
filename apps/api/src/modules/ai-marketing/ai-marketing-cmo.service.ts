import { Injectable } from '@nestjs/common'

/**
 * AI Marketing CMO - 营销参谋服务
 * ROI 分析 | 文案助手 | 活动规划
 */

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  revenue: number
  cost: number
  audience: number
  channel: Channel
  startDate: string
  endDate: string
}

export type CampaignType = 'brand' | 'performance' | 'social' | 'email' | 'promotion' | 'kOL'
export type Channel = 'wechat' | 'weibo' | 'douyin' | 'xiaohongshu' | 'bilibili' | 'offline' | 'email' | 'sms'
export type Locale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP'

export interface CopyBrief {
  product: string
  goal: 'awareness' | 'conversion' | 'retention' | 're-engagement'
  audience: string
  tone?: 'formal' | 'casual' | 'humorous' | 'inspirational'
  length?: 'short' | 'medium' | 'long'
  cta?: string
}

export interface GeneratedCopy {
  headline: string
  body: string
  cta: string
  taglines: string[]
}

export interface ROIResult {
  campaignId: string
  revenue: number
  cost: number
  roi: number
  roiPercent: number
  profit: number
  isPositive: boolean
}

export interface CampaignConfig {
  type: CampaignType
  budget: number
  expectedCPM?: number
  expectedCTR?: number
  expectedConversionRate?: number
  averageOrderValue?: number
}

export interface BudgetAllocation {
  channel: Channel
  amount: number
  percent: number
  expectedROI: number
}

export interface TimelineMilestone {
  phase: string
  startDay: number
  endDay: number
  activities: string[]
}

export interface ReachEstimate {
  channel: Channel
  audience: number
  impressions: number
  reach: number
  cpm: number
  cost: number
}

// ─── 模拟数据 ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-001',
    name: '夏季新品推广',
    type: 'performance',
    revenue: 150000,
    cost: 30000,
    audience: 50000,
    channel: 'douyin',
    startDate: '2026-06-01',
    endDate: '2026-06-30'
  },
  {
    id: 'camp-002',
    name: '品牌代言合作',
    type: 'kOL',
    revenue: 80000,
    cost: 50000,
    audience: 100000,
    channel: 'weibo',
    startDate: '2026-05-15',
    endDate: '2026-06-15'
  },
  {
    id: 'camp-003',
    name: '会员日促销',
    type: 'promotion',
    revenue: 200000,
    cost: 80000,
    audience: 30000,
    channel: 'offline',
    startDate: '2026-06-18',
    endDate: '2026-06-18'
  },
  {
    id: 'camp-004',
    name: '私域引流活动',
    type: 'social',
    revenue: 50000,
    cost: 10000,
    audience: 20000,
    channel: 'wechat',
    startDate: '2026-06-01',
    endDate: '2026-06-30'
  },
  {
    id: 'camp-005',
    name: '亏损测试活动',
    type: 'brand',
    revenue: 20000,
    cost: 40000,
    audience: 80000,
    channel: 'xiaohongshu',
    startDate: '2026-06-01',
    endDate: '2026-06-30'
  }
]

const CHANNEL_CPM: Record<Channel, number> = {
  wechat: 50,
  weibo: 80,
  douyin: 100,
  xiaohongshu: 120,
  bilibili: 90,
  offline: 200,
  email: 10,
  sms: 30
}

const CAMPAIGN_TYPE_RATIOS: Record<CampaignType, Record<Channel, number>> = {
  brand: { wechat: 0.2, weibo: 0.3, douyin: 0.2, xiaohongshu: 0.2, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
  performance: { wechat: 0.3, weibo: 0.1, douyin: 0.4, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
  social: { wechat: 0.4, weibo: 0.2, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
  email: { wechat: 0, weibo: 0, douyin: 0, xiaohongshu: 0, bilibili: 0, offline: 0, email: 1, sms: 0 },
  promotion: { wechat: 0.2, weibo: 0.1, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0.3, email: 0, sms: 0 },
  kOL: { wechat: 0.2, weibo: 0.4, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 }
}

// ─── MarketingROIService ─────────────────────────────────────────────────────

@Injectable()
export class MarketingROIService {
  /**
   * 计算单个活动的 ROI
   * ROI = (营收 - 成本) / 成本 * 100%
   */
  calculateCampaignROI(campaignId: string): ROIResult | null {
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaignId)
    if (!campaign) return null

    const profit = campaign.revenue - campaign.cost
    const roi = campaign.cost > 0 ? profit / campaign.cost : 0
    const roiPercent = Math.round(roi * 10000) / 100 // 保留2位小数

    return {
      campaignId: campaign.id,
      revenue: campaign.revenue,
      cost: campaign.cost,
      roi,
      roiPercent,
      profit,
      isPositive: profit > 0
    }
  }

  /**
   * 比较多个活动的 ROI
   * 返回按 ROI 从高到低排序的结果
   */
  compareCampaigns(campaignIds: string[]): ROIResult[] {
    const results: ROIResult[] = []

    for (const id of campaignIds) {
      const result = this.calculateCampaignROI(id)
      if (result) {
        results.push(result)
      }
    }

    // 按 ROI 从高到低排序
    results.sort((a, b) => b.roi - a.roi)
    return results
  }

  /**
   * 预测新活动的 ROI
   * 基于配置返回预估 ROI 范围
   */
  projectROI(config: CampaignConfig): { minROI: number; maxROI: number; expectedROI: number } {
    const {
      type,
      budget,
      expectedCPM = 80,
      expectedCTR = 0.02,
      expectedConversionRate = 0.03,
      averageOrderValue = 200
    } = config

    // 估算触达人数
    const impressions = (budget / expectedCPM) * 1000
    const clicks = impressions * expectedCTR
    const conversions = clicks * expectedConversionRate
    const expectedRevenue = conversions * averageOrderValue

    // 不同活动类型的典型 ROI 范围
    const typeRanges: Record<CampaignType, { min: number; max: number }> = {
      brand: { min: -0.2, max: 0.5 },
      performance: { min: 0.5, max: 2.0 },
      social: { min: 0.2, max: 1.2 },
      email: { min: 1.0, max: 5.0 },
      promotion: { min: 0.3, max: 1.5 },
      kOL: { min: -0.1, max: 0.8 }
    }

    const range = typeRanges[type]
    const profit = expectedRevenue - budget
    const roi = budget > 0 ? profit / budget : 0

    // 根据实际计算调整范围
    const expectedROI = Math.max(range.min, Math.min(range.max, roi))
    const minROI = range.min
    const maxROI = range.max

    return {
      minROI: Math.round(minROI * 10000) / 100,
      maxROI: Math.round(maxROI * 10000) / 100,
      expectedROI: Math.round(expectedROI * 10000) / 100
    }
  }

  /**
   * 获取最优预算分配
   * 根据活动类型分配预算到不同渠道
   */
  getOptimalBudget(campaignType: CampaignType, totalBudget: number): BudgetAllocation[] {
    const ratios = CAMPAIGN_TYPE_RATIOS[campaignType]
    const allocations: BudgetAllocation[] = []

    for (const [channel, ratio] of Object.entries(ratios)) {
      if (ratio > 0) {
        const amount = Math.round(totalBudget * ratio * 100) / 100
        const cpm = CHANNEL_CPM[channel as Channel]
        const expectedROI = this.estimateChannelROI(channel as Channel)

        allocations.push({
          channel: channel as Channel,
          amount,
          percent: Math.round(ratio * 10000) / 100,
          expectedROI
        })
      }
    }

    // 按预期ROI排序
    allocations.sort((a, b) => b.expectedROI - a.expectedROI)
    return allocations
  }

  private estimateChannelROI(channel: Channel): number {
    const baseROI: Record<Channel, number> = {
      wechat: 1.2,
      weibo: 0.6,
      douyin: 1.5,
      xiaohongshu: 0.8,
      bilibili: 0.7,
      offline: 0.4,
      email: 3.0,
      sms: 2.0
    }
    return baseROI[channel]
  }
}

// ─── CopywritingAssistant ─────────────────────────────────────────────────────

@Injectable()
export class CopywritingAssistant {
  /**
   * 生成营销文案
   * 返回标题 + 正文 + CTA 完整结构
   */
  generateCopy(brief: CopyBrief): GeneratedCopy {
    const { product, goal, audience, tone = 'casual', length = 'medium', cta = '立即购买' } = brief

    const headline = this.buildHeadline(product, goal, tone)
    const body = this.buildBody(product, goal, audience, tone, length)
    const taglines = this.buildTaglines(product, goal, tone)

    return {
      headline,
      body,
      cta,
      taglines
    }
  }

  /**
   * 优化标题 - 提升点击率
   * 通过添加数字、情感词、悬念等方式优化
   */
  optimizeHeadline(headline: string): string {
    const techniques = [
      () => {
        // 添加数字
        const num = Math.floor(Math.random() * 9) + 1
        return `${num}个理由让你选择${headline}`
      },
      () => {
        // 添加情感词
        const emotions = ['惊人', '超值', '限时', '独家', '必看']
        return `${emotions[Math.floor(Math.random() * emotions.length)]}！${headline}`
      },
      () => {
        // 反问句
        return `${headline}？没想到还能这样！`
      },
      () => {
        // 感叹句
        return `${headline}！太厉害了`
      },
      () => {
        // 加入时间压力
        return `🔥 ${headline} (仅限今日)`
      }
    ]

    // 随机选择一种优化技术
    const techIndex = Math.floor(Math.random() * techniques.length)
    return techniques[techIndex]()
  }

  /**
   * 本地化文案
   * 根据地区/语言调整文案
   */
  localizeCopy(copy: GeneratedCopy, locale: Locale): GeneratedCopy {
    const localeMap: Record<Locale, { cta: string; prefix?: string; suffix?: string }> = {
      'zh-CN': { cta: '立即购买', prefix: '', suffix: '' },
      'zh-TW': { cta: '立即選購', prefix: '', suffix: '' },
      'en-US': { cta: 'Buy Now', prefix: '🇺🇸 ', suffix: '' },
      'ja-JP': { cta: '今すぐ購入', prefix: '🇯🇵 ', suffix: '' }
    }

    const map = localeMap[locale]

    return {
      headline: map.prefix ? `${map.prefix}${copy.headline}` : copy.headline,
      body: copy.body,
      cta: map.cta,
      taglines: copy.taglines.map((t) => `${t}${map.suffix}`)
    }
  }

  /**
   * 生成 A/B 测试变体
   * 生成 N 个不同的文案变体
   */
  abTestVariants(brief: CopyBrief, count: number): GeneratedCopy[] {
    const variants: GeneratedCopy[] = []
    const baseCopy = this.generateCopy(brief)

    // 变体1：原始版本
    variants.push({ ...baseCopy })

    // 变体2：强调价格
    if (count > 1) {
      variants.push({
        headline: `${brief.product} 超值特惠中！`,
        body: `限时优惠，价格低至史上最低！${brief.audience}正在疯抢...`,
        cta: '抢先下单',
        taglines: ['省钱', '划算', '抢到就是赚到']
      })
    }

    // 变体3：强调品质
    if (count > 2) {
      variants.push({
        headline: `品质之选：${brief.product}`,
        body: `专业推荐，${brief.audience}的一致选择，品质有保障！`,
        cta: '了解详情',
        taglines: ['专业', '品质', '放心']
      })
    }

    // 变体4：情感化
    if (count > 3) {
      variants.push({
        headline: `给自己的一份礼物：${brief.product}`,
        body: `善待自己，从拥有${brief.product}开始...`,
        cta: '宠爱自己',
        taglines: ['爱自己', '享受', '犒赏']
      })
    }

    // 变体5：紧迫感
    if (count > 4) {
      variants.push({
        headline: `⏰ ${brief.product} 即将售罄！`,
        body: `库存告急！再不抢就没了...`,
        cta: '立即抢购',
        taglines: ['紧迫', '稀缺', '限时']
      })
    }

    return variants.slice(0, count)
  }

  private buildHeadline(product: string, goal: string, tone: string): string {
    const templates: Record<string, Record<string, string>> = {
      awareness: {
        formal: `${product}——引领行业新标杆`,
        casual: `你还在等什么？${product}来了！`,
        humorous: `${product}？用了都说好！`,
        inspirational: `${product}，开启品质生活`
      },
      conversion: {
        formal: `${product}限时优惠中`,
        casual: `错过等一年！${product}大促`,
        humorous: `${product}便宜到不敢相信`,
        inspirational: `${product}——给自己最好的`
      },
      retention: {
        formal: `${product}感谢您的信赖`,
        casual: `回来啦！${product}想你了~`,
        humorous: `老朋友，${product}想死你了！`,
        inspirational: `${product}与您相伴每一天`
      },
      're-engagement': {
        formal: `${product}期待您的回归`,
        casual: `好久不见！${product}有新惊喜`,
        humorous: `还以为你把我忘了？${product}想你啦！`,
        inspirational: `${product}——重逢是美好的`
      }
    }

    const toneTemplates = templates[goal] || templates.conversion
    return toneTemplates[tone as keyof typeof toneTemplates] || toneTemplates.casual
  }

  private buildBody(product: string, goal: string, audience: string, tone: string, length: string): string {
    const lengthMap: Record<string, number> = { short: 30, medium: 60, long: 120 }
    const maxLen = lengthMap[length] || 60

    const sentences = [
      `${product}专为${audience}设计，解决您的核心需求。`,
      `采用高品质材料，值得信赖。`,
      `全网销量领先，口碑保证。`,
      `限时优惠，欲购从速。`,
      `售后服务完善，购买无忧。`,
      `新品上市，惊喜连连。`,
      `会员专属福利，优惠多多。`
    ]

    let body = ''
    let currentLen = 0

    for (const sentence of sentences) {
      if (currentLen + sentence.length > maxLen) break
      body += sentence
      currentLen += sentence.length
    }

    return body.trim()
  }

  private buildTaglines(product: string, goal: string, tone: string): string[] {
    const taglines: Record<string, string[]> = {
      awareness: ['新品上市', '热门推荐', '不容错过'],
      conversion: ['限时特惠', '爆款热卖', '立即下单'],
      retention: ['会员专享', '感谢信赖', '长期使用'],
      're-engagement': ['期待回眸', '再续前缘', '优惠回归']
    }

    return taglines[goal] || taglines.conversion
  }
}

// ─── CampaignPlanner ─────────────────────────────────────────────────────────

@Injectable()
export class CampaignPlanner {
  /**
   * 推荐活动类型
   * 根据目标、预算、受众特征推荐合适的活动类型
   */
  suggestCampaignType(
    goal: 'awareness' | 'conversion' | 'retention' | 'brand',
    budget: number,
    audience: string
  ): { type: CampaignType; channels: Channel[]; reason: string }[] {
    const recommendations: Array<{ type: CampaignType; channels: Channel[]; reason: string; score: number }> = []

    // 品牌认知目标
    if (goal === 'awareness' || goal === 'brand') {
      recommendations.push(
        { type: 'kOL', channels: ['weibo', 'douyin'], reason: 'KOL合作能快速扩大品牌曝光', score: 0.9 },
        { type: 'brand', channels: ['weibo', 'xiaohongshu', 'douyin'], reason: '品牌广告覆盖广，适合提升知名度', score: 0.8 },
        { type: 'social', channels: ['wechat', 'weibo'], reason: '社交媒体互动性强，适合口碑传播', score: 0.7 }
      )
    }

    // 转化目标
    if (goal === 'conversion') {
      recommendations.push(
        { type: 'performance', channels: ['douyin', 'wechat'], reason: '效果广告直接带来转化', score: 0.95 },
        { type: 'promotion', channels: ['offline', 'douyin', 'wechat'], reason: '促销活动刺激购买决策', score: 0.85 },
        { type: 'email', channels: ['email'], reason: '邮件营销成本低，转化精准', score: 0.6 }
      )
    }

    // 复购/留存目标
    if (goal === 'retention') {
      recommendations.push(
        { type: 'email', channels: ['email', 'sms'], reason: '邮件和短信适合老客户召回', score: 0.9 },
        { type: 'social', channels: ['wechat'], reason: '私域运营提升用户粘性', score: 0.85 },
        { type: 'promotion', channels: ['wechat', 'offline'], reason: '会员促销提升复购率', score: 0.8 }
      )
    }

    // 按评分排序
    recommendations.sort((a, b) => b.score - a.score)
    return recommendations.slice(0, 3).map(({ type, channels, reason }) => ({ type, channels, reason }))
  }

  /**
   * 规划活动时间线
   * 返回各阶段里程碑
   */
  planCampaignTimeline(goal: string): TimelineMilestone[] {
    const templates: Record<string, TimelineMilestone[]> = {
      awareness: [
        { phase: '预热期', startDay: 1, endDay: 3, activities: ['发布悬念海报', 'KOL预告', '社交媒体造势'] },
        { phase: '爆发期', startDay: 4, endDay: 10, activities: ['正式发布', 'KOL推广', '话题挑战'] },
        { phase: '延续期', startDay: 11, endDay: 14, activities: ['用户UGC', '二次传播', '口碑沉淀'] }
      ],
      conversion: [
        { phase: '准备期', startDay: 1, endDay: 2, activities: ['优惠设置', '库存确认', '客服培训'] },
        { phase: '抢购期', startDay: 3, endDay: 3, activities: ['限时秒杀', '倒计时', '催促下单'] },
        { phase: '收尾期', startDay: 4, endDay: 5, activities: ['库存清仓', '复盘总结'] }
      ],
      retention: [
        { phase: '激活期', startDay: 1, endDay: 3, activities: ['老客户通知', '专属优惠推送'] },
        { phase: '维护期', startDay: 4, endDay: 7, activities: ['会员权益', '积分奖励', '互动活动'] },
        { phase: '召回期', startDay: 8, endDay: 10, activities: ['未购提醒', '追加优惠', '感谢信'] }
      ],
      brand: [
        { phase: '策划期', startDay: 1, endDay: 5, activities: ['品牌定位', '创意策划', '资源对接'] },
        { phase: '执行期', startDay: 6, endDay: 20, activities: ['分批次投放', '效果监测', '实时优化'] },
        { phase: '收官期', startDay: 21, endDay: 25, activities: ['数据总结', '案例包装', '品牌沉淀'] }
      ]
    }

    return templates[goal] || templates.conversion
  }

  /**
   * 预估触达人数
   * 根据受众规模和渠道特性估算
   */
  estimateReach(audience: number, channel: Channel): ReachEstimate {
    const channelFactors: Record<Channel, { reachRate: number; cpm: number }> = {
      wechat: { reachRate: 0.4, cpm: 50 },
      weibo: { reachRate: 0.15, cpm: 80 },
      douyin: { reachRate: 0.25, cpm: 100 },
      xiaohongshu: { reachRate: 0.2, cpm: 120 },
      bilibili: { reachRate: 0.18, cpm: 90 },
      offline: { reachRate: 0.6, cpm: 200 },
      email: { reachRate: 0.5, cpm: 10 },
      sms: { reachRate: 0.8, cpm: 30 }
    }

    const factor = channelFactors[channel]
    const impressions = Math.round(audience / factor.reachRate)
    const reach = Math.round(impressions * factor.reachRate * 0.8) // 考虑重复触达
    const cost = Math.round((impressions / 1000) * factor.cpm * 100) / 100

    return {
      channel,
      audience,
      impressions,
      reach,
      cpm: factor.cpm,
      cost
    }
  }
}

// ─── AI Marketing CMO Service ─────────────────────────────────────────────────

/**
 * AI Marketing CMO - 营销参谋主服务
 * 整合 ROI 分析、文案助手、活动规划三大模块
 */
@Injectable()
export class AIMarketingCMOService {
  constructor(
    private readonly roiService: MarketingROIService,
    private readonly copywritingService: CopywritingAssistant,
    private readonly campaignPlanner: CampaignPlanner
  ) {}

  getROIService(): MarketingROIService {
    return this.roiService
  }

  getCopywritingService(): CopywritingAssistant {
    return this.copywritingService
  }

  getCampaignPlanner(): CampaignPlanner {
    return this.campaignPlanner
  }
}
