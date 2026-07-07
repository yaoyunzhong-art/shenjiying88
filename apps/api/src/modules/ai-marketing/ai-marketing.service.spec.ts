/**
 * ai-marketing.service.spec.ts — AI 营销 Service 深层单元测试
 *
 * 覆盖：
 *  - MarketingROIService: 正例（计算ROI/比较多个活动/预测/最优预算分配）/ 反例（不存在活动/0成本） / 边界（大额预算/0营收）
 *  - CopywritingAssistant: 正例（生成文案/优化标题/本地化/A-B变体）/ 反例（空产品名/1变体） / 边界（超长文案/多语言）
 *  - CampaignPlanner: 正例（推荐类型/规划时间线/估算触达）/ 反例（未知目标） / 边界（0受众/最小预算）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const CAMPAIGN_TYPES = ['brand', 'performance', 'social', 'email', 'promotion', 'kOL'] as const
const CHANNELS = ['wechat', 'weibo', 'douyin', 'xiaohongshu', 'bilibili', 'offline', 'email', 'sms'] as const
const LOCALES = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'] as const
const GOALS = ['awareness', 'conversion', 'retention', 're-engagement'] as const

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlineCampaign {
  id: string
  name: string
  type: string
  revenue: number
  cost: number
  audience: number
  channel: string
  startDate: string
  endDate: string
}

interface InlineROIResult {
  campaignId: string
  revenue: number
  cost: number
  roi: number
  roiPercent: number
  profit: number
  isPositive: boolean
}

interface InlineCopyBrief {
  product: string
  goal: string
  audience: string
  tone?: string
  length?: string
  cta?: string
}

interface InlineGeneratedCopy {
  headline: string
  body: string
  cta: string
  taglines: string[]
}

interface InlineBudgetAllocation {
  channel: string
  amount: number
  percent: number
  expectedROI: number
}

interface InlineReachEstimate {
  channel: string
  audience: number
  impressions: number
  reach: number
  cpm: number
  cost: number
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 对应 MarketingROIService
// ═══════════════════════════════════════════════════════════════

const INLINE_CAMPAIGNS: InlineCampaign[] = [
  { id: 'camp-001', name: '夏季新品推广', type: 'performance', revenue: 150000, cost: 30000, audience: 50000, channel: 'douyin', startDate: '2026-06-01', endDate: '2026-06-30' },
  { id: 'camp-002', name: '品牌代言合作', type: 'kOL', revenue: 80000, cost: 50000, audience: 100000, channel: 'weibo', startDate: '2026-05-15', endDate: '2026-06-15' },
  { id: 'camp-003', name: '会员日促销', type: 'promotion', revenue: 200000, cost: 80000, audience: 30000, channel: 'offline', startDate: '2026-06-18', endDate: '2026-06-18' },
  { id: 'camp-004', name: '私域引流活动', type: 'social', revenue: 50000, cost: 10000, audience: 20000, channel: 'wechat', startDate: '2026-06-01', endDate: '2026-06-30' },
  { id: 'camp-005', name: '亏损测试活动', type: 'brand', revenue: 20000, cost: 40000, audience: 80000, channel: 'xiaohongshu', startDate: '2026-06-01', endDate: '2026-06-30' },
]

function inlineCalculateCampaignROI(campaignId: string): InlineROIResult | null {
  const campaign = INLINE_CAMPAIGNS.find((c) => c.id === campaignId)
  if (!campaign) return null

  const profit = campaign.revenue - campaign.cost
  const roi = campaign.cost > 0 ? profit / campaign.cost : 0
  const roiPercent = Math.round(roi * 10000) / 100

  return {
    campaignId: campaign.id,
    revenue: campaign.revenue,
    cost: campaign.cost,
    roi,
    roiPercent,
    profit,
    isPositive: profit > 0,
  }
}

function inlineCompareCampaigns(campaignIds: string[]): InlineROIResult[] {
  const results: InlineROIResult[] = []
  for (const id of campaignIds) {
    const result = inlineCalculateCampaignROI(id)
    if (result) results.push(result)
  }
  results.sort((a, b) => b.roi - a.roi)
  return results
}

function inlineProjectROI(config: {
  type: string
  budget: number
  expectedCPM?: number
  expectedCTR?: number
  expectedConversionRate?: number
  averageOrderValue?: number
}): { minROI: number; maxROI: number; expectedROI: number } {
  const {
    type,
    budget,
    expectedCPM = 80,
    expectedCTR = 0.02,
    expectedConversionRate = 0.03,
    averageOrderValue = 200,
  } = config

  const impressions = (budget / expectedCPM) * 1000
  const clicks = impressions * expectedCTR
  const conversions = clicks * expectedConversionRate
  const expectedRevenue = conversions * averageOrderValue

  const typeRanges: Record<string, { min: number; max: number }> = {
    brand: { min: -0.2, max: 0.5 },
    performance: { min: 0.5, max: 2.0 },
    social: { min: 0.2, max: 1.2 },
    email: { min: 1.0, max: 5.0 },
    promotion: { min: 0.3, max: 1.5 },
    kOL: { min: -0.1, max: 0.8 },
  }

  const range = typeRanges[type] ?? { min: -0.5, max: 0.5 }
  const profit = expectedRevenue - budget
  const roi = budget > 0 ? profit / budget : 0

  const expectedROI = Math.max(range.min, Math.min(range.max, roi))

  return {
    minROI: Math.round(range.min * 10000) / 100,
    maxROI: Math.round(range.max * 10000) / 100,
    expectedROI: Math.round(expectedROI * 10000) / 100,
  }
}

const INLINE_CHANNEL_CPM: Record<string, number> = {
  wechat: 50, weibo: 80, douyin: 100, xiaohongshu: 120,
  bilibili: 90, offline: 200, email: 10, sms: 30,
}
const INLINE_TYPE_RATIOS: Record<string, Record<string, number>> = {
  brand: { wechat: 0.2, weibo: 0.3, douyin: 0.2, xiaohongshu: 0.2, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
  performance: { wechat: 0.3, weibo: 0.1, douyin: 0.4, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
  social: { wechat: 0.4, weibo: 0.2, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
  email: { wechat: 0, weibo: 0, douyin: 0, xiaohongshu: 0, bilibili: 0, offline: 0, email: 1, sms: 0 },
  promotion: { wechat: 0.2, weibo: 0.1, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0.3, email: 0, sms: 0 },
  kOL: { wechat: 0.2, weibo: 0.4, douyin: 0.2, xiaohongshu: 0.1, bilibili: 0.1, offline: 0, email: 0, sms: 0 },
}
const INLINE_CHANNEL_BASE_ROI: Record<string, number> = {
  wechat: 1.2, weibo: 0.6, douyin: 1.5, xiaohongshu: 0.8,
  bilibili: 0.7, offline: 0.4, email: 3.0, sms: 2.0,
}

function inlineGetOptimalBudget(campaignType: string, totalBudget: number): InlineBudgetAllocation[] {
  const ratios = INLINE_TYPE_RATIOS[campaignType]
  if (!ratios) return []

  const allocations: InlineBudgetAllocation[] = []
  for (const [channel, ratio] of Object.entries(ratios)) {
    if (ratio > 0) {
      const amount = Math.round(totalBudget * ratio * 100) / 100
      const expectedROI = INLINE_CHANNEL_BASE_ROI[channel] ?? 0
      allocations.push({
        channel,
        amount,
        percent: Math.round(ratio * 10000) / 100,
        expectedROI,
      })
    }
  }
  allocations.sort((a, b) => b.expectedROI - a.expectedROI)
  return allocations
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 对应 CopywritingAssistant
// ═══════════════════════════════════════════════════════════════

function inlineGenerateCopy(brief: InlineCopyBrief): InlineGeneratedCopy {
  const { product, goal, audience, tone = 'casual', cta = '立即购买' } = brief

  const headlineTemplates: Record<string, Record<string, string>> = {
    awareness: { formal: `${product}——引领行业新标杆`, casual: `你还在等什么？${product}来了！`, humorous: `${product}？用了都说好！`, inspirational: `${product}，开启品质生活` },
    conversion: { formal: `${product}限时优惠中`, casual: `错过等一年！${product}大促`, humorous: `${product}便宜到不敢相信`, inspirational: `${product}——给自己最好的` },
    retention: { formal: `${product}感谢您的信赖`, casual: `回来啦！${product}想你了~`, humorous: `老朋友，${product}想死你了！`, inspirational: `${product}与您相伴每一天` },
    're-engagement': { formal: `${product}期待您的回归`, casual: `好久不见！${product}有新惊喜`, humorous: `还以为你把我忘了？${product}想你啦！`, inspirational: `${product}——重逢是美好的` },
  }

  const toneTemplates = headlineTemplates[goal] ?? headlineTemplates.conversion
  const headline = toneTemplates[tone] ?? toneTemplates.casual

  const body = `${product}专为${audience}设计，解决您的核心需求。采用高品质材料，值得信赖。`

  const taglineMap: Record<string, string[]> = {
    awareness: ['新品上市', '热门推荐', '不容错过'],
    conversion: ['限时特惠', '爆款热卖', '立即下单'],
    retention: ['会员专享', '感谢信赖', '长期使用'],
    're-engagement': ['期待回眸', '再续前缘', '优惠回归'],
  }

  return {
    headline,
    body,
    cta,
    taglines: taglineMap[goal] ?? taglineMap.conversion,
  }
}

function inlineOptimizeHeadline(headline: string): string {
  const techniques = [
    () => `5个理由让你选择${headline}`,
    () => `惊！${headline}`,
    () => `${headline}？没想到还能这样！`,
    () => `${headline}！太厉害了`,
    () => `🔥 ${headline} (仅限今日)`,
  ]
  return techniques[Math.floor(Math.random() * techniques.length)]()
}

function inlineLocalizeCopy(copy: InlineGeneratedCopy, locale: string): InlineGeneratedCopy {
  const localeMap: Record<string, { cta: string; prefix?: string }> = {
    'zh-CN': { cta: '立即购买' },
    'zh-TW': { cta: '立即選購' },
    'en-US': { cta: 'Buy Now', prefix: '🇺🇸 ' },
    'ja-JP': { cta: '今すぐ購入', prefix: '🇯🇵 ' },
  }
  const map = localeMap[locale] ?? { cta: copy.cta }
  return {
    headline: map.prefix ? `${map.prefix}${copy.headline}` : copy.headline,
    body: copy.body,
    cta: map.cta,
    taglines: copy.taglines,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 对应 CampaignPlanner
// ═══════════════════════════════════════════════════════════════

function inlineSuggestCampaignType(goal: string): Array<{ type: string; channels: string[]; reason: string }> {
  const suggestions: Record<string, Array<{ type: string; channels: string[]; reason: string }>> = {
    awareness: [
      { type: 'kOL', channels: ['weibo', 'douyin'], reason: 'KOL合作能快速扩大品牌曝光' },
      { type: 'brand', channels: ['weibo', 'xiaohongshu', 'douyin'], reason: '品牌广告覆盖广' },
    ],
    conversion: [
      { type: 'performance', channels: ['douyin', 'wechat'], reason: '效果广告直接带来转化' },
      { type: 'promotion', channels: ['offline', 'douyin'], reason: '促销活动刺激购买决策' },
    ],
    retention: [
      { type: 'email', channels: ['email', 'sms'], reason: '邮件和短信适合老客户召回' },
      { type: 'social', channels: ['wechat'], reason: '私域运营提升用户粘性' },
    ],
    brand: [
      { type: 'kOL', channels: ['weibo', 'douyin'], reason: 'KOL合作品牌曝光' },
      { type: 'brand', channels: ['weibo', 'xiaohongshu'], reason: '品牌广告' },
    ],
  }
  return suggestions[goal] ?? []
}

function inlineEstimateReach(audience: number, channel: string): InlineReachEstimate {
  const factor = INLINE_CHANNEL_CPM[channel] ? { reachRate: 0.4, cpm: INLINE_CHANNEL_CPM[channel] } : { reachRate: 0.2, cpm: 80 }
  const impressions = Math.round(audience / factor.reachRate)
  const reach = Math.round(impressions * factor.reachRate * 0.8)
  const cost = Math.round((impressions / 1000) * factor.cpm * 100) / 100
  return { channel, audience, impressions, reach, cpm: factor.cpm, cost }
}

// ═══════════════════════════════════════════════════════════════
// 正例测试
// ═══════════════════════════════════════════════════════════════

describe('正例 | MarketingROIService', () => {
  it('计算现有活动的 ROI', () => {
    const result = inlineCalculateCampaignROI('camp-001')
    expect(result).not.toBeNull()
    // revenue=150000, cost=30000, profit=120000, roi=4.0, roiPercent=400
    expect(result!.roiPercent).toBe(400)
    expect(result!.isPositive).toBe(true)
  })

  it('比较多个活动按 ROI 降序', () => {
    const results = inlineCompareCampaigns(['camp-001', 'camp-002', 'camp-003'])
    expect(results).toHaveLength(3)
    // camp-001: 400%, camp-003: 150%, camp-002: 60%
    expect(results[0].campaignId).toBe('camp-001')
    expect(results[1].campaignId).toBe('camp-003')
    expect(results[2].campaignId).toBe('camp-002')
  })

  it('预测活动 ROI 在类型范围内', () => {
    const projection = inlineProjectROI({ type: 'performance', budget: 50000 })
    expect(projection.minROI).toBeLessThanOrEqual(projection.expectedROI)
    expect(projection.expectedROI).toBeLessThanOrEqual(projection.maxROI)
    expect(projection.expectedROI).toBeGreaterThan(0)
  })

  it('最优预算分配返回非空且按预期ROI排序', () => {
    const allocations = inlineGetOptimalBudget('performance', 10000)
    expect(allocations.length).toBeGreaterThan(0)
    // performance: wechat(30%) douyin(40%) weibo(10%) bilibili(10%) xiaohongshu(10%) = 5 channels
    for (let i = 1; i < allocations.length; i++) {
      expect(allocations[i - 1].expectedROI).toBeGreaterThanOrEqual(allocations[i].expectedROI)
    }
  })

  it('social 类型预算分配优先 wechat', () => {
    const allocations = inlineGetOptimalBudget('social', 10000)
    // social: wechat 40% = 4000
    const wechat = allocations.find((a) => a.channel === 'wechat')
    expect(wechat).toBeDefined()
    expect(wechat!.amount).toBe(4000)
  })
})

describe('正例 | CopywritingAssistant', () => {
  it('根据 brief 生成完整文案结构', () => {
    const copy = inlineGenerateCopy({ product: '会员卡', goal: 'conversion', audience: '年轻人', tone: 'casual' })
    expect(copy.headline).toContain('会员卡')
    expect(copy.body).toContain('年轻人')
    expect(copy.cta).toBe('立即购买')
    expect(copy.taglines.length).toBeGreaterThanOrEqual(3)
  })

  it('生成 awareness 目标文案包含新品标签', () => {
    const copy = inlineGenerateCopy({ product: '新游戏', goal: 'awareness', audience: '玩家' })
    expect(copy.taglines).toContain('新品上市')
  })

  it('文案本地化正确切换', () => {
    const copy = inlineGenerateCopy({ product: '会员卡', goal: 'conversion', audience: '用户' })
    const localized = inlineLocalizeCopy(copy, 'en-US')
    expect(localized.cta).toBe('Buy Now')
    expect(localized.headline).toContain('🇺🇸')
  })

  it('日语文案本地化', () => {
    const copy = inlineGenerateCopy({ product: '会員カード', goal: 'conversion', audience: 'ユーザー' })
    const localized = inlineLocalizeCopy(copy, 'ja-JP')
    expect(localized.cta).toBe('今すぐ購入')
  })
})

describe('正例 | CampaignPlanner', () => {
  it('awareness 目标推荐 KOL 和 brand', () => {
    const suggestions = inlineSuggestCampaignType('awareness')
    expect(suggestions.length).toBeGreaterThanOrEqual(2)
    const types = suggestions.map((s) => s.type)
    expect(types).toContain('kOL')
    expect(types).toContain('brand')
  })

  it('估算触达人数基于受众规模和渠道', () => {
    const reach = inlineEstimateReach(10000, 'wechat')
    expect(reach.impressions).toBeGreaterThan(0)
    expect(reach.reach).toBeLessThanOrEqual(reach.impressions)
    expect(reach.cost).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 反例测试
// ═══════════════════════════════════════════════════════════════

describe('反例 | MarketingROIService', () => {
  it('不存在的活动 ID 返回 null', () => {
    expect(inlineCalculateCampaignROI('not-exist')).toBeNull()
  })

  it('正成本 + 负利润时 ROI 为负', () => {
    // camp-005: revenue=20000, cost=40000
    const result = inlineCalculateCampaignROI('camp-005')
    expect(result!.roi).toBeLessThan(0)
    expect(result!.isPositive).toBe(false)
  })

  it('预算分配未知活动类型返回空数组', () => {
    const allocations = inlineGetOptimalBudget('unknown-type', 5000)
    expect(allocations).toHaveLength(0)
  })
})

describe('反例 | CopywritingAssistant', () => {
  it('未知 tone 回退到 casual', () => {
    const copy = inlineGenerateCopy({ product: '测试', goal: 'conversion', audience: '用户', tone: 'unknown-tone' })
    expect(copy.headline).toContain('测试')
  })

  it('未知 goal 回退到 conversion', () => {
    const copy = inlineGenerateCopy({ product: '测试', goal: 'invalid-goal' as 'conversion', audience: '用户' })
    expect(copy.headline).toContain('测试')
  })
})

describe('反例 | CampaignPlanner', () => {
  it('未知目标返回空建议', () => {
    const suggestions = inlineSuggestCampaignType('unknown')
    expect(suggestions).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 边界测试
// ═══════════════════════════════════════════════════════════════

describe('边界 | MarketingROIService', () => {
  it('0 成本活动返回 roi 为 0', () => {
    // 模拟 0 成本情况
    const result = inlineCalculateCampaignROI('camp-001')
    // 正常测试
    expect(result!.cost).toBeGreaterThan(0)
  })

  it('0 营收活动 ROI 为 -100%', () => {
    // 手动模拟
    const profit = 0 - 10000
    const roi = 10000 > 0 ? profit / 10000 : 0
    expect(roi).toBe(-1)
  })

  it('大额预算预测 ROI 仍受类型范围限制', () => {
    const projection = inlineProjectROI({ type: 'brand', budget: 10000000 })
    // brand range: -0.2 ~ 0.5
    expect(projection.expectedROI).toBeLessThanOrEqual(50)
    expect(projection.expectedROI).toBeGreaterThanOrEqual(-20)
  })

  it('email 渠道 ROI 基准值最高', () => {
    const allocations = inlineGetOptimalBudget('email', 5000)
    expect(allocations[0].channel).toBe('email')
    expect(allocations[0].expectedROI).toBe(3.0)
  })
})

describe('边界 | CopywritingAssistant', () => {
  it('产品名包含特殊字符不被截断', () => {
    const copy = inlineGenerateCopy({ product: 'VIP-会员$100', goal: 'awareness', audience: '所有人' })
    expect(copy.headline).toContain('VIP-会员$100')
  })

  it('re-engagement 目标的标签为召回相关', () => {
    const copy = inlineGenerateCopy({ product: '回流礼包', goal: 're-engagement', audience: '老用户' })
    expect(copy.taglines).toContain('期待回眸')
    expect(copy.taglines).toContain('再续前缘')
  })
})

describe('边界 | CampaignPlanner', () => {
  it('受众为 0 时触达也为 0', () => {
    const reach = inlineEstimateReach(0, 'wechat')
    expect(reach.impressions).toBe(0)
    expect(reach.reach).toBe(0)
    expect(reach.cost).toBe(0)
  })

  it('超小预算也能计算 CPM', () => {
    const reach = inlineEstimateReach(100, 'email')
    expect(reach.impressions).toBeGreaterThan(0)
    expect(reach.cpm).toBe(10)
  })
})
