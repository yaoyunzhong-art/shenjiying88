/**
 * intelligence-ai.service.ts — P-50 V2 AI 决策引擎 (M2 + E9修复)
 *
 * 基于同城竞品数据的统计分析 + empower_card 知识匹配进行推理。
 * 不直接调用外部LLM，而是在 service 层做算术+规则推理。
 * 支持 future 接入真实 LLM。
 */

import { Injectable, Logger } from '@nestjs/common'
import type { ActivityAdvice, PricingStats, EmpowerCard, StoreBasicData } from './intelligence.entity'
import type { CompetitorAlert } from './intelligence.entity'

/** 同城竞品模拟数据库 (按 city-district 索引) */
interface CompetitorRecord {
  count: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  tiers: Record<string, number>
}

/** 活动效果基线库 (按 season 索引) */
interface ActivityTemplate {
  name: string
  description: string
  baseGrowth: number   // 基准增长百分比
  riskLevel: 'low' | 'medium' | 'high'
  adoptionRate: number // 同城竞品采用率 (0-1)
  avgEffectPercent: number // 采用竞品平均效果
}

@Injectable()
export class IntelligenceAiService {
  private readonly logger = new Logger(IntelligenceAiService.name)

  // ── 竞品密度模拟数据 ──
  private readonly COMPETITOR_DB: Record<string, CompetitorRecord> = {
    '上海-徐汇': { count: 8, avgPrice: 128, minPrice: 68, maxPrice: 198, tiers: { low: 2, mid: 4, high: 2 } },
    '上海-浦东': { count: 6, avgPrice: 145, minPrice: 78, maxPrice: 228, tiers: { low: 1, mid: 3, high: 2 } },
    '上海-静安': { count: 5, avgPrice: 168, minPrice: 88, maxPrice: 258, tiers: { low: 1, mid: 2, high: 2 } },
    '北京-朝阳': { count: 7, avgPrice: 135, minPrice: 68, maxPrice: 208, tiers: { low: 2, mid: 3, high: 2 } },
    '北京-海淀': { count: 4, avgPrice: 118, minPrice: 58, maxPrice: 188, tiers: { low: 1, mid: 2, high: 1 } },
    '深圳-南山': { count: 6, avgPrice: 98, minPrice: 48, maxPrice: 168, tiers: { low: 2, mid: 3, high: 1 } },
    '深圳-福田': { count: 5, avgPrice: 112, minPrice: 58, maxPrice: 178, tiers: { low: 1, mid: 3, high: 1 } },
    '成都-锦江': { count: 4, avgPrice: 78, minPrice: 38, maxPrice: 128, tiers: { low: 1, mid: 2, high: 1 } },
    '成都-武侯': { count: 3, avgPrice: 72, minPrice: 38, maxPrice: 118, tiers: { low: 1, mid: 1, high: 1 } },
    '广州-天河': { count: 5, avgPrice: 88, minPrice: 48, maxPrice: 148, tiers: { low: 2, mid: 2, high: 1 } },
    '杭州-西湖': { count: 3, avgPrice: 92, minPrice: 58, maxPrice: 148, tiers: { low: 1, mid: 1, high: 1 } },
    '南京-鼓楼': { count: 2, avgPrice: 75, minPrice: 38, maxPrice: 118, tiers: { low: 1, mid: 1, high: 0 } },
  }

  private readonly DEFAULT_RECORD: CompetitorRecord = {
    count: 1, avgPrice: 60, minPrice: 30, maxPrice: 100,
    tiers: { low: 1, mid: 0, high: 0 },
  }

  // ── 活动效果基线 ──
  private readonly ACTIVITY_TEMPLATES: Record<string, ActivityTemplate[]> = {
    spring: [
      { name: '春游季套餐', description: '亲子/学生春游主题畅玩套餐', baseGrowth: 20, riskLevel: 'low', adoptionRate: 0.35, avgEffectPercent: 22 },
      { name: '女神节活动', description: '3.8女神主题派对+折扣', baseGrowth: 15, riskLevel: 'low', adoptionRate: 0.50, avgEffectPercent: 18 },
      { name: '会员回馈月', description: '会员积分翻倍+专属活动', baseGrowth: 12, riskLevel: 'low', adoptionRate: 0.60, avgEffectPercent: 14 },
    ],
    summer: [
      { name: '暑期畅玩卡', description: '学生暑期不限次畅玩卡¥299', baseGrowth: 35, riskLevel: 'low', adoptionRate: 0.45, avgEffectPercent: 38 },
      { name: '夜场特惠', description: '晚间18:00后特价入场¥49', baseGrowth: 25, riskLevel: 'medium', adoptionRate: 0.30, avgEffectPercent: 28 },
      { name: '水上主题月', description: '暑期水上游戏/水枪大战主题活动', baseGrowth: 30, riskLevel: 'medium', adoptionRate: 0.20, avgEffectPercent: 33 },
    ],
    autumn: [
      { name: '中秋团圆套餐', description: '家庭套票+月饼礼盒', baseGrowth: 18, riskLevel: 'low', adoptionRate: 0.40, avgEffectPercent: 20 },
      { name: '万圣节派对', description: '万圣主题变装派对+鬼屋', baseGrowth: 28, riskLevel: 'medium', adoptionRate: 0.55, avgEffectPercent: 30 },
      { name: '双11预售', description: '双11限时抢购季卡/年卡', baseGrowth: 22, riskLevel: 'medium', adoptionRate: 0.50, avgEffectPercent: 24 },
    ],
    winter: [
      { name: '寒假特惠卡', description: '寒假学生/亲子特惠套票', baseGrowth: 25, riskLevel: 'low', adoptionRate: 0.40, avgEffectPercent: 27 },
      { name: '圣诞主题月', description: '圣诞装置+主题游戏+抽奖', baseGrowth: 32, riskLevel: 'medium', adoptionRate: 0.60, avgEffectPercent: 35 },
      { name: '新年倒计时', description: '跨年倒计时派对+大礼包', baseGrowth: 20, riskLevel: 'high', adoptionRate: 0.25, avgEffectPercent: 22 },
    ],
  }

  private readonly DEFAULT_TEMPLATES: ActivityTemplate[] = [
    { name: '人气引流套餐', description: '低价引流+增值体验', baseGrowth: 15, riskLevel: 'low', adoptionRate: 0.50, avgEffectPercent: 18 },
    { name: '主题嘉年华', description: '限时主题嘉年华活动', baseGrowth: 22, riskLevel: 'medium', adoptionRate: 0.30, avgEffectPercent: 25 },
    { name: '会员专属日', description: '会员日专属折扣+抽奖', baseGrowth: 12, riskLevel: 'low', adoptionRate: 0.55, avgEffectPercent: 14 },
  ]

  // ── 知识卡片模拟库 ──
  private readonly KNOWLEDGE_BASE: EmpowerCard[] = [
    { id: 'kc-001', tag: '定价', summary: '分时段定价策略可使门店月收入提升15-30%', source: '竞品分析战报', freshnessScore: 92, moduleMapping: 'intelligence', confidence: 85 },
    { id: 'kc-002', tag: '活动', summary: '抖音团购套餐平均引流效果是传统渠道的2.3倍', source: '行业调研', freshnessScore: 88, moduleMapping: 'intelligence', confidence: 80 },
    { id: 'kc-003', tag: '设备', summary: 'VR设备更新周期建议18个月，超时导致客流量下降12%', source: '运营月报', freshnessScore: 75, moduleMapping: 'intelligence', confidence: 90 },
    { id: 'kc-004', tag: '定价', summary: '竞品降价时，增值应对比直接降价长线收益高40%', source: '竞品策略研究', freshnessScore: 85, moduleMapping: 'intelligence', confidence: 82 },
    { id: 'kc-005', tag: '活动', summary: '联名IP活动期间人均消费提升35%，但授权成本需控制', source: '市场部复盘', freshnessScore: 80, moduleMapping: 'intelligence.recruit', confidence: 78 },
    { id: 'kc-006', tag: '活动', summary: '暑期档营收占全年30%+，提前1个月筹备效果最佳', source: '年度运营报告', freshnessScore: 95, moduleMapping: 'intelligence.seasonal', confidence: 88 },
    { id: 'kc-007', tag: '活动', summary: '合规盲盒方案客单价提升50%，但需注意相关法规要求', source: '合规部通告', freshnessScore: 70, moduleMapping: 'intelligence.blindbox', confidence: 75 },
    { id: 'kc-008', tag: '竞品', summary: '同城竞品采用相似方案的平均获客增长为22-28%', source: '竞品跟踪系统', freshnessScore: 90, moduleMapping: 'intelligence', confidence: 83 },
    { id: 'kc-009', tag: '会员', summary: '会员日半价活动在开业6个月以上的门店效果更显著', source: '会员分析报告', freshnessScore: 78, moduleMapping: 'intelligence', confidence: 76 },
    { id: 'kc-010', tag: '定价', summary: '同城竞品价格带主集中在¥60-120区间，中端定价竞争最激烈', source: '价格监控报告', freshnessScore: 82, moduleMapping: 'intelligence', confidence: 80 },
  ]

  // ── 联名活动/IP跨界 ──
  private readonly RECRUIT_CAMPAIGNS: ActivityTemplate[] = [
    { name: 'IP联名主题活动', description: '与热门动漫/游戏IP合作推出联名主题活动', baseGrowth: 30, riskLevel: 'medium', adoptionRate: 0.15, avgEffectPercent: 35 },
    { name: '跨界品牌联名', description: '与奶茶/餐饮品牌联合推出联名畅玩套餐', baseGrowth: 22, riskLevel: 'low', adoptionRate: 0.25, avgEffectPercent: 26 },
    { name: 'KOL探店推广', description: '邀请本地KOL探店+联名限定活动', baseGrowth: 18, riskLevel: 'low', adoptionRate: 0.40, avgEffectPercent: 20 },
  ]

  // ── 暑假/寒假限定活动 ──
  private readonly SEASONAL_CAMPAIGNS: ActivityTemplate[] = [
    { name: '寒暑假畅玩卡', description: '学生假期不限次畅玩卡+赠品', baseGrowth: 35, riskLevel: 'low', adoptionRate: 0.40, avgEffectPercent: 38 },
    { name: '季节性主题布置', description: '假期限定主题装饰+互动游戏', baseGrowth: 25, riskLevel: 'low', adoptionRate: 0.35, avgEffectPercent: 28 },
    { name: '假期托管营', description: '假期日间托管+游乐+餐饮一站式', baseGrowth: 28, riskLevel: 'medium', adoptionRate: 0.10, avgEffectPercent: 32 },
  ]

  // ── 盲盒/抽奖促销(合规版) ──
  private readonly BLINDBOX_CAMPAIGNS: ActivityTemplate[] = [
    { name: '潮玩盲盒机', description: '合规版盲盒机(明示概率·保底机制)', baseGrowth: 20, riskLevel: 'medium', adoptionRate: 0.30, avgEffectPercent: 25 },
    { name: '集章抽奖活动', description: '消费集章兑换抽奖机会(无需额外付费)', baseGrowth: 18, riskLevel: 'low', adoptionRate: 0.35, avgEffectPercent: 20 },
    { name: '幸运转盘', description: '消费满额转盘抽奖(实物+优惠券)', baseGrowth: 15, riskLevel: 'low', adoptionRate: 0.45, avgEffectPercent: 17 },
  ]

  // ════════════════════════════════════════════════
  // 1. 基于同城竞品数据生成定价建议
  // ════════════════════════════════════════════════

  async generatePricingAdvice(city: string, district: string, storeTier: string): Promise<string> {
    const stats = this.getCityPricingStats(city, district)
    const avgPrice = stats.avgPrice
    const tierPrices = stats.tierDistribution

    // 根据店铺档次推荐定价区间
    const tierMultiplier: Record<string, number> = { low: 0.8, mid: 1.0, high: 1.3 }
    const multiplier = tierMultiplier[storeTier] ?? 1.0
    const recommendedBase = Math.round(avgPrice * multiplier)

    const competitorInsight = stats.competitorCount >= 5
      ? `该区域竞品密集(${stats.competitorCount}家), 建���差异化定价`
      : `该区域竞品适中(${stats.competitorCount}家), 可参考均价±20%`

    const tierInsight = storeTier === 'high'
      ? `高端路线: 建议定价¥${recommendedBase}-${Math.round(recommendedBase * 1.15)}，突出品质差异`
      : storeTier === 'low'
        ? `性价比路线: 建议定价¥${Math.round(recommendedBase * 0.9)}-${recommendedBase}，走量收益`
        : `中端路线: 建议定价¥${Math.round(recommendedBase * 0.95)}-${Math.round(recommendedBase * 1.1)}，���衡价格与客流`

    return `${competitorInsight}。${tierInsight}。同城均价¥${avgPrice}，价格区间¥${stats.minPrice}-${stats.maxPrice}。`
  }

  // ════════════════════════════════════════════════
  // 2. 基于活动历史数据推荐活动方案
  // ════════════════════════════════════════════════

  async generateActivityAdvice(city: string, season: string): Promise<ActivityAdvice> {
    const templates = this.ACTIVITY_TEMPLATES[season] ?? this.DEFAULT_TEMPLATES
    const stats = this.getCityPricingStats(city, '')

    // 根据城市竞争环境调整推荐
    const competitiveFactor = Math.min(stats.competitorCount / 10, 1)
    const adjustedGrowth = (base: number) => Math.round(base * (1 + (1 - competitiveFactor) * 0.3))

    // 选择最佳活动: 综合考虑增长 + 风险 + 采用率
    let best = templates[0]!
    let bestScore = -1
    for (const t of templates) {
      const riskPenalty = t.riskLevel === 'high' ? 0.6 : t.riskLevel === 'medium' ? 0.8 : 1.0
      const score = (t.baseGrowth * 0.5 + t.avgEffectPercent * 0.3 + t.adoptionRate * 100 * 0.2) * riskPenalty
      if (score > bestScore) { bestScore = score; best = t }
    }

    return {
      name: best.name,
      description: best.description,
      expectedGrowthPercent: adjustedGrowth(best.baseGrowth),
      riskLevel: best.riskLevel,
      referencedCards: this.KNOWLEDGE_BASE.filter(k => k.tag === '活动').length,
    }
  }

  // ════════════════════════════════════════════════
  // 3. 竞争监控告警的AI决策
  // ════════════════════════════════════════════════

  async analyzeAlert(alert: CompetitorAlert, storeData: StoreBasicData): Promise<string> {
    const stats = this.getCityPricingStats(storeData.city, storeData.district)

    if (alert.type === 'price_change') {
      // 分析价格变动是否值得跟进
      const priceDiff = storeData.currentPrice - stats.avgPrice
      if (priceDiff > 30) {
        return `您的定价(¥${storeData.currentPrice})高于同城均价(¥${stats.avgPrice})¥${priceDiff}，可考虑小幅调整或增加附加值以支撑高价，不建议直接降价跟进。`
      }
      if (priceDiff < -20) {
        return `您的定价已低于同城均价¥${Math.abs(priceDiff)}，有价格优势。竞品降价无需跟进，保持当前策略。`
      }
      return `您的定价与同城均价接近(±¥${Math.abs(priceDiff)})，竞品降价建议观察1-2周再决定。该区域${stats.competitorCount}家竞品中，耐心等待是最优策略。`
    }

    if (alert.type === 'new_activity') {
      const similarActivities = this.ACTIVITY_TEMPLATES.summer ?? this.DEFAULT_TEMPLATES
      const avgEffect = similarActivities.reduce((s, t) => s + t.avgEffectPercent, 0) / similarActivities.length
      return `竞品新活动同城平均获客增长${avgEffect}%。建议评估自身情况后差异化应对，避免同质化竞争。${storeData.city}市场竞品密度${stats.competitorCount}家，创新方案溢价空间更大。`
    }

    if (alert.type === 'new_promotion') {
      return `短期促销活动会拉低竞品利润。同城${stats.competitorCount}家竞品平均促销周期为7-14天。建议关注而非跟风，将资源投入会员体系建设。`
    }

    // rating_change
    return `竞品评分变化是获客窗口期。同城竞品评分提高1分平均获客提升12%。建议加强评价管理，主动引导好评。`
  }

  // ════════════════════════════════════════════════
  // 4. RAG: 从知识库检索相关卡片 + 数据 → AI推理
  // ════════════════════════════════════════════════

  async retrieveKnowledge(module: string, keywords: string[]): Promise<EmpowerCard[]> {
    const moduleKey = module.toLowerCase()
    let results = this.KNOWLEDGE_BASE.filter(card => {
      // 模块匹配
      const moduleMatch = card.moduleMapping?.toLowerCase().includes(moduleKey) ?? false
      // 关键词匹配
      const keywordMatch = keywords.length === 0 || keywords.some(kw =>
        card.summary.toLowerCase().includes(kw.toLowerCase()) ||
        card.tag.toLowerCase().includes(kw.toLowerCase())
      )
      return moduleMatch || keywordMatch
    })

    // 按新鲜度+置信度排序
    results.sort((a, b) => (b.freshnessScore + b.confidence) - (a.freshnessScore + a.confidence))

    // 取 top-3
    return results.slice(0, 3)
  }

  // ── 联名/IP跨界活动方案 ──

  getRecruitCampaigns(): ActivityTemplate[] {
    return [...this.RECRUIT_CAMPAIGNS]
  }

  // ── 季节性活动方案 ──

  getSeasonalCampaigns(season?: string): ActivityTemplate[] {
    if (season) {
      const seasonTemplates = this.ACTIVITY_TEMPLATES[season]
      if (seasonTemplates) return [...seasonTemplates]
    }
    return [...this.SEASONAL_CAMPAIGNS]
  }

  // ── 盲盒促销方案 ──

  getBlindboxCampaigns(): ActivityTemplate[] {
    return [...this.BLINDBOX_CAMPAIGNS]
  }

  // ── 获取城市定价统计 ──

  getCityPricingStats(city: string, district: string): PricingStats {
    const key = district ? `${city}-${district}` : city
    const record = this.COMPETITOR_DB[key] ?? this.DEFAULT_RECORD

    return {
      city,
      competitorCount: record.count,
      avgPrice: record.avgPrice,
      minPrice: record.minPrice,
      maxPrice: record.maxPrice,
      tierDistribution: record.tiers,
    }
  }

  // ── 根据竞品数据产生数据佐证 ──

  getDataEvidence(category: string, optionsCount: number = 3): string[] {
    const evidences: string[] = []

    if (category === 'pricing') {
      evidences.push('同城竞品采用分时段定价的平均月收入增长22%')
      evidences.push('动态定价方案在3家以上竞品中验证有效')
      evidences.push('统一价格方案竞争劣势明显，仅2家低端竞品采用')
    } else if (category === 'activity') {
      evidences.push('同城竞品抖音团购平均获客增长40%+')
      evidences.push('主题赛事活动在周末的复购率提升35%')
      evidences.push('会员日半价在开业6个月以上门店效果显著')
    } else if (category === 'equipment') {
      evidences.push('VR设备更新后平均客流量增长15%')
      evidences.push('运动竞技类设备新增后的差异化获客提升25%')
      evidences.push('娃娃机翻新低成本高回报，回收期3-4个月')
    } else if (category === 'promotion') {
      evidences.push('价格战长期收益为负，5家跟价竞品中3家利润下降')
      evidences.push('增值不加价策略的客户满意度评分高23%')
      evidences.push('场景升级方案在同城高端竞品中验证有效')
    } else if (category === 'recruit') {
      evidences.push('联名IP活动期间人均消费提升35%')
      evidences.push('跨界联名方案获客成本降低28%')
      evidences.push('KOL探店推广的ROI平均为1:4.5')
    } else if (category === 'seasonal') {
      evidences.push('暑期档营收占全年30%+，畅玩卡方案效果最佳')
      evidences.push('主题布置活动在假期季的客单价提升22%')
      evidences.push('托管营方案竞争少，仅2家竞品采用但效果突出')
    } else if (category === 'blindbox') {
      evidences.push('合规盲盒方案客单价提升50%以上')
      evidences.push('集章抽奖活动的复购率提升28%')
      evidences.push('幸运转盘活动参与转化率65%，成本可控')
    }

    // 确保有足够的数据佐证
    while (evidences.length < optionsCount) {
      evidences.push('基于同城竞品数据分析的推荐方案')
    }

    return evidences.slice(0, optionsCount)
  }
}
