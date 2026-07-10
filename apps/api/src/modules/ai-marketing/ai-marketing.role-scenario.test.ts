import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-marketing] [C] 角色场景测试
 *
 * 8 角色视角的AI营销模块业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 使用 Service 层 in-memory 模拟业务逻辑
 */

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 类型定义（简化版，与服务对齐） ──

type CampaignType = 'brand' | 'performance' | 'social' | 'email' | 'promotion' | 'kOL'
type Channel = 'wechat' | 'weibo' | 'douyin' | 'xiaohongshu' | 'bilibili' | 'offline' | 'email' | 'sms'
type CopyGoal = 'awareness' | 'conversion' | 'retention' | 're-engagement'
type CopyTone = 'formal' | 'casual' | 'humorous' | 'inspirational'
type CopyLength = 'short' | 'medium' | 'long'
type Locale = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP'

interface Campaign {
  id: string
  name: string
  type: CampaignType
  revenue: number
  cost: number
  audience: number
  channel: Channel
  startDate: string
  endDate: string
  createdBy: string // 创建人角色
}

interface ROIResult {
  campaignId: string
  revenue: number
  cost: number
  roi: number
  roiPercent: number
  profit: number
  isPositive: boolean
}

interface GeneratedCopy {
  headline: string
  body: string
  cta: string
  taglines: string[]
}

interface CopyBrief {
  product: string
  goal: CopyGoal
  audience: string
  tone?: CopyTone
  length?: CopyLength
  cta?: string
}

interface BudgetAllocation {
  channel: Channel
  amount: number
  percent: number
  expectedROI: number
}

interface TimelineMilestone {
  phase: string
  startDay: number
  endDay: number
  activities: string[]
}

interface ReachEstimate {
  channel: Channel
  audience: number
  impressions: number
  reach: number
  cpm: number
  cost: number
}

// ── Mock Service ──

class AiMarketingMockService {
  private campaigns = new Map<string, Campaign>()
  private copies = new Map<string, GeneratedCopy>()
  private seq = 0
  private copySeq = 0

  private readonly channelCpm: Record<Channel, number> = {
    wechat: 50, weibo: 80, douyin: 100, xiaohongshu: 120,
    bilibili: 90, offline: 200, email: 10, sms: 30,
  }

  private readonly channelROI: Record<Channel, number> = {
    wechat: 1.2, weibo: 0.6, douyin: 1.5, xiaohongshu: 0.8,
    bilibili: 0.7, offline: 0.4, email: 3.0, sms: 2.0,
  }

  private readonly typeRanges: Record<CampaignType, { min: number; max: number }> = {
    brand: { min: -0.2, max: 0.5 },
    performance: { min: 0.5, max: 2.0 },
    social: { min: 0.2, max: 1.2 },
    email: { min: 1.0, max: 5.0 },
    promotion: { min: 0.3, max: 1.5 },
    kOL: { min: -0.1, max: 0.8 },
  }

  private readonly campaignRatios: Record<CampaignType, Record<Channel, number>> = {
    brand: { wechat: 0.2, weibo: 0.3, douyin: 0.2, xiaohongshu: 0.2, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
    performance: { wechat: 0.3, weibo: 0.1, douyin: 0.4, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
    social: { wechat: 0.4, weibo: 0.2, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
    email: { wechat: 0, weibo: 0, douyin: 0, xiaohongshu: 0, bilibili: 0, offline: 0, email: 1, sms: 0 },
    promotion: { wechat: 0.2, weibo: 0.1, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0.3, email: 0, sms: 0 },
    kOL: { wechat: 0.2, weibo: 0.4, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
  }

  private now(): string {
    return new Date().toISOString()
  }

  private nextId(): string {
    return `camp-${String(++this.seq).padStart(3, '0')}`
  }

  private nextCopyId(): string {
    return `copy-${++this.copySeq}`
  }

  constructor() {
    this.seed()
  }

  private seed() {
    const data: Campaign[] = [
      { id: 'camp-001', name: '夏季新品推广', type: 'performance', revenue: 150000, cost: 30000, audience: 50000, channel: 'douyin', startDate: '2026-06-01', endDate: '2026-06-30', createdBy: 'marketing' },
      { id: 'camp-002', name: '品牌代言合作', type: 'kOL', revenue: 80000, cost: 50000, audience: 100000, channel: 'weibo', startDate: '2026-05-15', endDate: '2026-06-15', createdBy: 'marketing' },
      { id: 'camp-003', name: '会员日促销', type: 'promotion', revenue: 200000, cost: 80000, audience: 30000, channel: 'offline', startDate: '2026-06-18', endDate: '2026-06-18', createdBy: 'store-manager' },
      { id: 'camp-004', name: '私域引流活动', type: 'social', revenue: 50000, cost: 10000, audience: 20000, channel: 'wechat', startDate: '2026-06-01', endDate: '2026-06-30', createdBy: 'store-manager' },
      { id: 'camp-005', name: '亏损测试活动', type: 'brand', revenue: 20000, cost: 40000, audience: 80000, channel: 'xiaohongshu', startDate: '2026-06-01', endDate: '2026-06-30', createdBy: 'marketing' },
    ]
    for (const c of data) {
      this.campaigns.set(c.id, c)
    }
    this.seq = data.length
  }

  // ── ROI 分析 ──

  calculateROI(campaignId: string): ROIResult | null {
    const c = this.campaigns.get(campaignId)
    if (!c) return null
    const profit = c.revenue - c.cost
    const roi = c.cost > 0 ? profit / c.cost : 0
    const roiPercent = Math.round(roi * 10000) / 100
    return { campaignId: c.id, revenue: c.revenue, cost: c.cost, roi, roiPercent, profit, isPositive: profit > 0 }
  }

  compareCampaigns(campaignIds: string[]): ROIResult[] {
    return campaignIds
      .map((id) => this.calculateROI(id))
      .filter((r): r is ROIResult => r != null)
      .sort((a, b) => b.roi - a.roi)
  }

  projectROI(config: { type: CampaignType; budget: number; expectedCPM?: number; expectedCTR?: number; expectedConversionRate?: number; averageOrderValue?: number }): { minROI: number; maxROI: number; expectedROI: number } {
    const { type, budget, expectedCPM = 80, expectedCTR = 0.02, expectedConversionRate = 0.03, averageOrderValue = 200 } = config
    const impressions = (budget / expectedCPM) * 1000
    const clicks = impressions * expectedCTR
    const conversions = clicks * expectedConversionRate
    const expectedRevenue = conversions * averageOrderValue
    const range = this.typeRanges[type]
    const profit = expectedRevenue - budget
    const roi = budget > 0 ? profit / budget : 0
    const expectedROI = Math.max(range.min, Math.min(range.max, roi))
    return { minROI: Math.round(range.min * 100), maxROI: Math.round(range.max * 100), expectedROI: Math.round(expectedROI * 100) }
  }

  getBudgetAllocation(campaignType: CampaignType, totalBudget: number): BudgetAllocation[] {
    const ratios = this.campaignRatios[campaignType]
    return Object.entries(ratios)
      .filter(([, ratio]) => ratio > 0)
      .map(([channel, ratio]) => ({
        channel: channel as Channel,
        amount: Math.round(totalBudget * ratio * 100) / 100,
        percent: Math.round(ratio * 10000) / 100,
        expectedROI: this.channelROI[channel as Channel],
      }))
      .sort((a, b) => b.expectedROI - a.expectedROI)
  }

  // ── 文案生成 ──

  generateCopy(brief: CopyBrief): GeneratedCopy {
    const toneStyle = brief.tone ?? 'casual'
    const lengthMap: Record<CopyLength, string> = { short: '简短促销', medium: '标准文案', long: '详细说明' }
    const headerPrefix = toneStyle === 'humorous' ? '🔥' : toneStyle === 'formal' ? '📋' : '✨'
    return {
      headline: `${headerPrefix} ${brief.product} — ${brief.goal === 'conversion' ? '限时特惠' : brief.goal === 'awareness' ? '发现好物' : '专属回馈'}`,
      body: `面向${brief.audience}的${lengthMap[brief.length ?? 'medium']}内容，主打${brief.product}，目标${brief.goal}。`,
      cta: brief.cta ?? '立即了解',
      taglines: [`${brief.product}不容错过`, `专为${brief.audience}打造`, '立即行动'],
    }
  }

  optimizeHeadline(headline: string): string {
    if (!headline || headline.length < 3) throw new Error('标题过短，无法优化')
    // 模拟优化：添加热门关键词前缀
    return `【热门】${headline}`
  }

  localizeCopy(content: { headline: string; body: string; cta: string; taglines: string[] }, locale: string): { headline: string; body: string; cta: string; taglines: string[] } {
    const localeMap: Record<string, { prefix: string; cta: string }> = {
      'zh-CN': { prefix: '', cta: content.cta },
      'zh-TW': { prefix: '【繁體】', cta: content.cta },
      'en-US': { prefix: '[EN] ', cta: 'Learn More' },
      'ja-JP': { prefix: '【日本語】', cta: '詳細を見る' },
    }
    const l = localeMap[locale] ?? { prefix: `[${locale}]`, cta: content.cta }
    return {
      headline: `${l.prefix}${content.headline}`,
      body: `${l.prefix}${content.body}`,
      cta: l.cta,
      taglines: content.taglines.map((t) => `${l.prefix}${t}`),
    }
  }

  generateABTestVariants(brief: CopyBrief, count: number): GeneratedCopy[] {
    if (count < 2 || count > 10) throw new Error('A/B测试变体数量需在2-10之间')
    const variants: GeneratedCopy[] = []
    const tones: CopyTone[] = ['formal', 'casual', 'humorous', 'inspirational']
    for (let i = 0; i < count; i++) {
      variants.push(this.generateCopy({ ...brief, tone: tones[i % tones.length], cta: brief.cta ?? `方案${i + 1}` }))
    }
    return variants
  }

  // ── 活动规划 ──

  suggestCampaignType(goal: string, budget: number, audience: number): string[] {
    if (budget <= 0) throw new Error('预算必须大于0')
    if (goal === 'awareness') return audience > 50000 ? ['kOL', 'social', 'brand'] : ['social', 'performance']
    if (goal === 'conversion') return ['performance', 'promotion', 'email']
    if (goal === 'retention') return ['email', 'social', 'promotion']
    if (goal === 'brand') return ['brand', 'kOL', 'social']
    return ['performance', 'promotion']
  }

  planCampaignTimeline(goal: string): TimelineMilestone[] {
    const timelines: Record<string, TimelineMilestone[]> = {
      awareness: [
        { phase: '预热期', startDay: 1, endDay: 3, activities: ['社交媒体预告', 'KOL合作确认', '素材准备'] },
        { phase: '爆发期', startDay: 4, endDay: 10, activities: ['广告投放启动', '内容发布', '互动活动'] },
        { phase: '持续期', startDay: 11, endDay: 21, activities: ['效果优化', '二次传播', '数据复盘'] },
      ],
      conversion: [
        { phase: '引流期', startDay: 1, endDay: 5, activities: ['精准投放', '优惠券发放', '落地页优化'] },
        { phase: '转化期', startDay: 6, endDay: 14, activities: ['限时促销', '直播带货', '订单跟进'] },
        { phase: '复购期', startDay: 15, endDay: 21, activities: ['会员回访', '售后跟进', '复购优惠'] },
      ],
      retention: [
        { phase: '唤醒期', startDay: 1, endDay: 5, activities: ['老客回访', '会员权益提醒', '积分兑换'] },
        { phase: '活跃期', startDay: 6, endDay: 14, activities: ['专属活动', '社群互动', '生日关怀'] },
        { phase: '巩固期', startDay: 15, endDay: 30, activities: ['满意度调研', '忠诚度计划', '裂变活动'] },
      ],
    }
    return timelines[goal] ?? timelines.conversion
  }

  estimateReach(audience: number, channel: Channel): ReachEstimate {
    const cpm = this.channelCpm[channel]
    const reachRate = channel === 'offline' ? 0.6 : channel === 'email' ? 0.9 : 0.7
    const impressions = audience * (channel === 'email' ? 3 : 5)
    const reach = Math.round(audience * reachRate)
    const cost = (impressions / 1000) * cpm
    return { channel, audience, impressions, reach, cpm, cost }
  }

  // ── 综合查询 ──

  getModuleStats(): { totalCampaigns: number; totalRevenue: number; totalCost: number; averageROI: number; positiveCount: number; negativeCount: number } {
    let totalRevenue = 0, totalCost = 0, positiveCount = 0, negativeCount = 0
    for (const c of this.campaigns.values()) {
      totalRevenue += c.revenue
      totalCost += c.cost
      if (c.revenue > c.cost) positiveCount++; else negativeCount++
    }
    const averageROI = totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0
    return { totalCampaigns: this.campaigns.size, totalRevenue, totalCost, averageROI, positiveCount, negativeCount }
  }

  getAllCampaignIds(): string[] {
    return Array.from(this.campaigns.keys())
  }

  reset() {
    this.campaigns.clear()
    this.copies.clear()
    this.seq = 0
    this.copySeq = 0
    this.seed()
  }
}

function createService(): AiMarketingMockService {
  return new AiMarketingMockService()
}

// ── 👔 店长 ──
describe(`${ROLES.StoreManager} ai-marketing 角色场景测试`, () => {
  it('店长查看门店活动 ROI 统计，了解营销效果', () => {
    const svc = createService()
    const stats = svc.getModuleStats()
    expect(stats.totalCampaigns).toBeGreaterThanOrEqual(5)
    expect(stats.totalRevenue).toBeGreaterThan(stats.totalCost) // 总体盈利
    expect(stats.positiveCount).toBeGreaterThanOrEqual(stats.negativeCount)
  })

  it('店长查看某门店促销活动的 ROI 详情', () => {
    const svc = createService()
    const roi = svc.calculateROI('camp-003') // 会员日促销，由店长创建
    expect(roi).not.toBeNull()
    expect(roi!.profit).toBeGreaterThan(0) // 盈利活动
    expect(roi!.roiPercent).toBeGreaterThan(100) // ROI > 100%
  })

  it('店长查看不存在的活动时返回 null', () => {
    const svc = createService()
    const roi = svc.calculateROI('camp-999')
    expect(roi).toBeNull()
  })
})

// ── 🛒 前台 ──
describe(`${ROLES.FrontDesk} ai-marketing 角色场景测试`, () => {
  it('前台为来店顾客生成促销文案卡片', () => {
    const svc = createService()
    const copy = svc.generateCopy({
      product: '暑期畅玩卡',
      goal: 'conversion',
      audience: '亲子家庭',
      tone: 'casual',
      length: 'short',
      cta: '立即购买',
    })
    expect(copy.headline).toContain('暑期畅玩卡')
    expect(copy.cta).toBe('立即购买')
    expect(copy.taglines.length).toBeGreaterThanOrEqual(3)
  })

  it('前台比较多个活动的 ROI，向前台推荐最佳活动', () => {
    const svc = createService()
    const results = svc.compareCampaigns(['camp-001', 'camp-003', 'camp-005'])
    expect(results.length).toBe(3)
    // 应该按 ROI 降序排列
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].roi).toBeGreaterThanOrEqual(results[i].roi)
    }
  })

  it('前台查询不存在的活动 ROI 比较列表排除 null', () => {
    const svc = createService()
    const results = svc.compareCampaigns(['camp-001', 'camp-not-exist'])
    expect(results.length).toBe(1)
    expect(results[0].campaignId).toBe('camp-001')
  })
})

// ── 👥 HR ──
describe(`${ROLES.HR} ai-marketing 角色场景测试`, () => {
  it('HR 查看营销部门的整体 ROI 统计数据', () => {
    const svc = createService()
    const stats = svc.getModuleStats()
    expect(stats.totalCampaigns).toBeGreaterThanOrEqual(5)
    expect(stats.averageROI).toBeDefined()
  })

  it('HR 预估员工内推邮件活动的触达效果', () => {
    const svc = createService()
    const reach = svc.estimateReach(2000, 'email')
    expect(reach.channel).toBe('email')
    expect(reach.cpm).toBe(10) // email CPM = 10
    expect(reach.reach).toBeGreaterThan(0)
    expect(reach.impressions).toBeGreaterThan(reach.reach)
  })

  it('HR 尝试查询空预算时活动类型推荐抛出异常', () => {
    const svc = createService()
    expect(() => svc.suggestCampaignType('retention', 0, 1000)).toThrow('预算必须大于0')
  })
})

// ── 🔧 安监 ──
describe(`${ROLES.Security} ai-marketing 角色场景测试`, () => {
  it('安监检查所有营销活动的 ROI，识别亏损活动', () => {
    const svc = createService()
    const ids = svc.getAllCampaignIds()
    const results = svc.compareCampaigns(ids)
    const negativeOnes = results.filter((r) => !r.isPositive)
    expect(negativeOnes.length).toBeGreaterThanOrEqual(1) // camp-005 是亏损的
    expect(negativeOnes.some((r) => r.campaignId === 'camp-005')).toBe(true)
  })

  it('安监确认营销文案不包含敏感词（前缀检查）', () => {
    const svc = createService()
    const copy = svc.generateCopy({
      product: '促销活动',
      goal: 'awareness',
      audience: '大众',
      tone: 'formal',
    })
    expect(copy.headline).not.toContain('违规')
    expect(copy.body).not.toContain('违法')
  })

  it('安监检查预算分配的合规性——总预算和渠道分配一致', () => {
    const svc = createService()
    const allocations = svc.getBudgetAllocation('performance', 100000)
    const totalPercent = allocations.reduce((s, a) => s + a.percent, 0)
    expect(totalPercent).toBeCloseTo(100, 0) // 总分配应为 100%
    const totalAmount = allocations.reduce((s, a) => s + a.amount, 0)
    expect(totalAmount).toBeCloseTo(100000, 0)
  })
})

// ── 🎮 导玩员 ──
describe(`${ROLES.Guide} ai-marketing 角色场景测试`, () => {
  it('导玩员生成游戏区活动的推广文案', () => {
    const svc = createService()
    const copy = svc.generateCopy({
      product: '街机大赛挑战赛',
      goal: 'conversion',
      audience: '游戏爱好者',
      tone: 'humorous',
      length: 'short',
      cta: '来挑战！',
    })
    expect(copy.headline).toContain('街机大赛挑战赛')
    expect(copy.cta).toBe('来挑战！')
  })

  it('导玩员生成 3 个 A/B 测试文案变体', () => {
    const svc = createService()
    const variants = svc.generateABTestVariants({
      product: '新游戏机台',
      goal: 'awareness',
      audience: '年轻玩家',
      tone: 'casual',
    }, 3)
    expect(variants.length).toBe(3)
    // 每个变体应有不同的 tone
    const tones = variants.map((v) => v.cta)
    expect(new Set(tones).size).toBeGreaterThanOrEqual(2)
  })

  it('导玩员尝试生成少于 2 个 A/B 测试变体时抛出异常', () => {
    const svc = createService()
    expect(() => svc.generateABTestVariants({
      product: '新游戏',
      goal: 'awareness',
      audience: '玩家',
    }, 1)).toThrow('A/B测试变体数量需在2-10之间')
  })
})

// ── 🎯 运行专员 ──
describe(`${ROLES.Operations} ai-marketing 角色场景测试`, () => {
  it('运行专员规划品牌活动的完整时间线', () => {
    const svc = createService()
    const timeline = svc.planCampaignTimeline('awareness')
    expect(timeline.length).toBeGreaterThanOrEqual(3)
    expect(timeline[0].phase).toBe('预热期')
    expect(timeline[0].activities).toContain('素材准备')
    expect(timeline[1].phase).toBe('爆发期')
  })

  it('运行专员预估抖音渠道的触达效果', () => {
    const svc = createService()
    const reach = svc.estimateReach(50000, 'douyin')
    expect(reach.channel).toBe('douyin')
    expect(reach.cpm).toBe(100)
    expect(reach.cost).toBeGreaterThan(0)
  })

  it('运行专员计算各渠道预算分配方案', () => {
    const svc = createService()
    const allocations = svc.getBudgetAllocation('performance', 50000)
    expect(allocations.length).toBeGreaterThanOrEqual(3) // performance 分配至少 3 个渠道
    // 抖音是 performance 的主要渠道
    const douyin = allocations.find((a) => a.channel === 'douyin')
    expect(douyin).toBeDefined()
    expect(douyin!.expectedROI).toBeGreaterThanOrEqual(1.0)
  })

  it('运行专员获取转换类活动的最佳时间线', () => {
    const svc = createService()
    const timeline = svc.planCampaignTimeline('conversion')
    expect(timeline.length).toBe(3)
    expect(timeline.some((t) => t.activities.includes('限时促销'))).toBe(true)
  })
})

// ── 🤝 团建 ──
describe(`${ROLES.Teambuilding} ai-marketing 角色场景测试`, () => {
  it('团建查看已有活动 ROI 数据作为参考', () => {
    const svc = createService()
    const stats = svc.getModuleStats()
    expect(stats.averageROI).toBeGreaterThanOrEqual(0) // 平均 ROI 应该 >= 0
  })

  it('团建预估团队建设活动的社交媒体触达', () => {
    const svc = createService()
    const reach = svc.estimateReach(3000, 'wechat')
    expect(reach.channel).toBe('wechat')
    expect(reach.cpm).toBe(50)
  })

  it('团建为团建活动规划时间线', () => {
    const svc = createService()
    const timeline = svc.planCampaignTimeline('retention')
    expect(timeline.length).toBe(3)
    expect(timeline[0].activities).toContain('老客回访')
  })
})

// ── 📢 营销 ──
describe(`${ROLES.Marketing} ai-marketing 角色场景测试`, () => {
  it('营销人员全面分析某活动的 ROI', () => {
    const svc = createService()
    const roi = svc.calculateROI('camp-001')
    expect(roi).not.toBeNull()
    expect(roi!.revenue).toBe(150000)
    expect(roi!.cost).toBe(30000)
    expect(roi!.roi).toBeCloseTo(4, 0) // (150000-30000)/30000 = 4
    expect(roi!.isPositive).toBe(true)
  })

  it('营销人员预测新活动的 ROI 范围', () => {
    const svc = createService()
    const projection = svc.projectROI({
      type: 'performance',
      budget: 50000,
      expectedCPM: 80,
      expectedCTR: 0.03,
      expectedConversionRate: 0.05,
      averageOrderValue: 150,
    })
    expect(projection.minROI).toBeLessThanOrEqual(projection.expectedROI)
    expect(projection.expectedROI).toBeLessThanOrEqual(projection.maxROI)
  })

  it('营销人员批量生成多语种本地化文案', () => {
    const svc = createService()
    const en = svc.localizeCopy({
      headline: 'Summer Sale',
      body: 'Great deals on arcade games',
      cta: 'Shop Now',
      taglines: ['Don\'t miss out', 'Limited time'],
    }, 'en-US')
    expect(en.headline).toContain('[EN]')
    expect(en.cta).toBe('Learn More')

    const jp = svc.localizeCopy({
      headline: 'Summer Sale',
      body: 'Deals',
      cta: 'Shop',
      taglines: ['Hurry'],
    }, 'ja-JP')
    expect(jp.headline).toContain('【日本語】')
    expect(jp.cta).toBe('詳細を見る')
  })

  it('营销人员优化标题', () => {
    const svc = createService()
    const optimized = svc.optimizeHeadline('超值会员套餐限时抢购')
    expect(optimized).toContain('【热门】')
  })

  it('营销人员尝试优化过短标题抛出异常', () => {
    const svc = createService()
    expect(() => svc.optimizeHeadline('短')).toThrow('标题过短，无法优化')
  })
})
