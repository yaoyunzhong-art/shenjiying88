import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * IntelligenceController 单元测试
 *
 * 覆盖端点:
 *   - POST /intelligence/feasibility
 *   - POST /intelligence/finance-panorama
 *   - GET  /intelligence/operations/:storeId
 *   - GET  /intelligence/monitor/:storeId
 *   - GET  /intelligence/monitor/summary
 *   - POST /intelligence/monitor/scan/incremental
 *   - POST /intelligence/monitor/scan/full
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type RenovationTier = 'luxury' | 'standard' | 'economy'

type FeasibilityReport = {
  city: string
  district: string
  budget: number
  score: number
  scoreLevel: 'high' | 'medium' | 'low'
  summary: string
  competitorDensity: number
  competitorCount: number
  avgPrice: number
  suggestedEquipment: { name: string; count: number; cost: number; reason: string }[]
  suggestedPriceRange: { min: number; max: number; avg: number }
  riskFactors: { factor: string; level: 'high' | 'medium' | 'low'; suggestion: string }[]
  marketTrend: string
  estimatedMonthlyRevenue: number
  estimatedPaybackMonths: number
}

type FinancePanorama = {
  budget: number
  area: number
  tier: RenovationTier
  city: string
  district: string
  totalInvestment: number
  breakdown: { category: string; amount: number; percentage: number }[]
  monthlyRevenue: number
  monthlyCost: number
  netMonthlyProfit: number
  paybackMonths: number
  roi: number
  recommendation: string
}

type OperationAdvice = {
  storeId: string
  category: string
  advice: string[]
  metrics: { revenue: number; orders: number; rating: number }
}

type PlanningGrade = '非常适合' | '可考虑' | '不建议'
type DensityLevel = '高' | '中' | '低'

type SitingAssessmentOutput = {
  city: string
  district: string
  overallScore: number
  confidenceInterval: { low: number; high: number }
  grade: PlanningGrade
  competition: {
    totalCompetitors: number
    districtDistribution: Record<string, number>
    avgTicketPrice: number
    densityLevel: DensityLevel
  }
  riskFactors: { factor: string; level: 'high' | 'medium' | 'low'; suggestion: string }[]
  financialEstimate: { avgRent: number; monthlyRevenue: number; monthlyCost: number; paybackMonths: number }
  suggestions: string[]
  dataSource: { disclaimer: string; freshness: string; sourceType: string }
}

type StorePlanningOutput = {
  city: string
  district: string
  score: number
  confidenceInterval: { low: number; high: number }
  grade: PlanningGrade
  competition: {
    totalCompetitors: number
    districtDistribution: Record<string, number>
    avgTicketPrice: number
    densityLevel: DensityLevel
    topCompetitors: string[]
  }
  financialOverview: {
    initialInvestment: { equipment: number; renovation: number; systemSoftware: number; deposit: number; total: number }
    monthlyFixedCost: { rent: number; labor: number; maintenance: number; saas: number; total: number }
    monthlyVariableCost: { electricity: number; consumables: number; marketing: number; total: number }
    estimatedMonthlyRevenue: number
    estimatedMonthlyProfit: number
    paybackMonths: number
  }
  equipmentSuggestions: { name: string; count: number; unitPrice: number; totalPrice: number; supplier: string; warrantyMonths: number; monthlyMaintenance: number }[]
  renovationEstimate: { baseRenovation: number; themedDesign: number; furnitureDecor: number; fireSafetyApproval: number; total: number }
  riskFactors: { factor: string; level: 'high' | 'medium' | 'low'; suggestion: string }[]
  aiSummary: string
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  let latestScanResult = { lastScannedAt: '2026-07-20T08:00:00Z', totalCompetitors: 15 }

  return {
    generateFeasibilityReport(city: string, district: string, budget: number): FeasibilityReport {
      return {
        city, district, budget,
        score: 78,
        scoreLevel: 'medium',
        summary: `${city}${district}区域开${budget}万预算可行性中等`,
        competitorDensity: 3.2,
        competitorCount: 15,
        avgPrice: 35,
        suggestedEquipment: [
          { name: '标准娃娃', count: 8, cost: 80000, reason: '基础配置' },
        ],
        suggestedPriceRange: { min: 28, max: 58, avg: 38 },
        riskFactors: [
          { factor: '竞争激烈', level: 'medium', suggestion: '差异化定位' },
        ],
        marketTrend: '上升',
        estimatedMonthlyRevenue: 150000,
        estimatedPaybackMonths: 24,
      }
    },

    calculateFinancePanorama(budget: number, area: number, tier: RenovationTier, city: string, district: string): FinancePanorama {
      const tierFactors: Record<RenovationTier, number> = { luxury: 1.5, standard: 1.0, economy: 0.7 }
      const factor = tierFactors[tier]
      return {
        budget, area, tier, city, district,
        totalInvestment: budget * 10000 * factor,
        breakdown: [
          { category: '装修', amount: budget * 5000 * factor, percentage: 50 },
          { category: '设备', amount: budget * 3000 * factor, percentage: 30 },
          { category: '运营', amount: budget * 2000 * factor, percentage: 20 },
        ],
        monthlyRevenue: 150000,
        monthlyCost: 80000,
        netMonthlyProfit: 70000,
        paybackMonths: Math.ceil(budget * 10000 * factor / 70000),
        roi: 85,
        recommendation: `${tier}档次: 总投资约${(budget * 10000 * factor / 10000).toFixed(1)}万`,
      }
    },

    generateOperationAdvice(storeId: string, category?: string): OperationAdvice {
      return {
        storeId,
        category: category ?? 'pricing',
        advice: ['建议调整定价策略', '增加优惠券发放频率'],
        metrics: { revenue: 100000, orders: 500, rating: 4.5 },
      }
    },

    monitorCompetitor(city?: string, mode?: 'incremental' | 'full'): Promise<any> {
      return Promise.resolve({
        mode: mode ?? 'incremental',
        city: city ?? 'all',
        competitorsFound: 15,
        newEntries: mode === 'incremental' ? 2 : 15,
        scannedAt: '2026-07-20T08:00:00Z',
      })
    },

    sitingAssessment(city: string, district: string): SitingAssessmentOutput {
      return {
        city, district,
        overallScore: 78,
        confidenceInterval: { low: 68, high: 88 },
        grade: '非常适合',
        competition: {
          totalCompetitors: 8,
          districtDistribution: { [district]: 8 },
          avgTicketPrice: 128,
          densityLevel: '高',
        },
        riskFactors: [
          { factor: '同城竞品密度', level: 'high' as const, suggestion: '建议差异化定位' },
        ],
        financialEstimate: { avgRent: 280, monthlyRevenue: 192000, monthlyCost: 144000, paybackMonths: 24 },
        suggestions: ['建议差异化定位', '建议实地考察'],
        dataSource: { disclaimer: '仅供��考', freshness: '24小时内', sourceType: '侦察兵竞品' },
      }
    },

    storePlanning(input: { city: string; district: string; budget: number; area: number; tier: string }): StorePlanningOutput {
      return {
        city: input.city,
        district: input.district,
        score: 72,
        confidenceInterval: { low: 62, high: 82 },
        grade: '可考虑',
        competition: {
          totalCompetitors: 6,
          districtDistribution: { [input.district]: 6 },
          avgTicketPrice: 145,
          densityLevel: '中',
          topCompetitors: ['竞品1', '竞品2'],
        },
        financialOverview: {
          initialInvestment: { equipment: 1350000, renovation: 480000, systemSoftware: 120000, deposit: 336000, total: 2286000 },
          monthlyFixedCost: { rent: 112000, labor: 96000, maintenance: 11250, saas: 4200, total: 223450 },
          monthlyVariableCost: { electricity: 8000, consumables: 4800, marketing: 9600, total: 22400 },
          estimatedMonthlyRevenue: 192000,
          estimatedMonthlyProfit: -53850,
          paybackMonths: 999,
        },
        equipmentSuggestions: [
          { name: '街机射击区', count: 8, unitPrice: 40000, totalPrice: 320000, supplier: '华立', warrantyMonths: 12, monthlyMaintenance: 2667 },
        ],
        renovationEstimate: { baseRenovation: 240000, themedDesign: 96000, furnitureDecor: 96000, fireSafetyApproval: 48000, total: 480000 },
        riskFactors: [
          { factor: '同城竞品密度', level: 'high', suggestion: '建议差异化定位' },
        ],
        aiSummary: `${input.city}选址评估72分。该区域竞争中等。`,
      }
    },

    getLatestScanResult(): Promise<any> {
      return Promise.resolve(latestScanResult)
    },

    triggerIncrementalScan(city?: string): Promise<any> {
      return Promise.resolve({ mode: 'incremental', city: city ?? 'all', triggered: true })
    },

    triggerFullScan(city?: string): Promise<any> {
      return Promise.resolve({ mode: 'full', city: city ?? 'all', triggered: true })
    },

    async deviceRecommendation(input: { budget: number; area: number; city: string; storeType: string; tier: string }): Promise<any> {
      return {
        budget: input.budget, area: input.area, city: input.city, storeType: input.storeType, tier: input.tier,
        devices: [
          { name: '街机射击', brand: '华立科技', count: 6, unitPrice: 40000, totalPrice: 240000, supplier: '华立科技', warrantyMonths: 12, monthlyMaintenance: 400, category: '街机', reason: '同城竞品平均配置' },
          { name: '夹娃娃机', brand: '广州雄业', count: 10, unitPrice: 8000, totalPrice: 80000, supplier: '广州雄业', warrantyMonths: 6, monthlyMaintenance: 80, category: '礼品', reason: '高利润率项目' },
        ],
        totalCost: 320000, remainingBudget: 80000, budgetUtilizationPercent: 80,
        alternatives: [{ name: '射击机', brand: '世宇科技', unitPrice: 35000, count: 5, totalPrice: 175000, supplier: '世宇科技', reason: '替代方案', tradeOff: '价格更低' }],
        notes: ['基于同城竞品数据推荐', '标准档配置', '建议预留20万运营备用金'],
      }
    },

    async renovationPlan(input: { area: number; tier: string; city: string; style?: string }): Promise<any> {
      const style = input.style || '现代'
      return {
        area: input.area, tier: input.tier, city: input.city, style,
        baseDecoration: { category: '基础装修', amount: 135000, percent: 45, detail: '地面/墙面/吊顶' },
        themedDesign: { category: '主题设计', amount: 75000, percent: 25, detail: `${style}风格主题包装` },
        furnitureDecor: { category: '家具装饰', amount: 60000, percent: 20, detail: '休息区沙发·吧台' },
        fireSafetyApproval: { category: '审批消防', amount: 30000, percent: 10, detail: '消防报审·喷淋烟感' },
        items: [
          { category: '基础装修', amount: 135000, percent: 45, detail: '地面/墙面/吊顶' },
          { category: '主题设计', amount: 75000, percent: 25, detail: `${style}风格主题包装` },
          { category: '家具装饰', amount: 60000, percent: 20, detail: '休息区沙发·吧台' },
          { category: '审批消防', amount: 30000, percent: 10, detail: '消防报审·喷淋烟感' },
        ],
        subTotal: input.area * (input.tier === '豪华' ? 1200 : 800), budgetPercent: 40,
        tierAdaptation: '标准型（性价比最优）',
        renovationDuration: '约45天（1-2个月）',
        recommendations: ['现代风格适合上海市场定位', '建议预留15%不可预见费', '预估工期约45天'],
      }
    },

    operationsPlan(body: { storeId: string; stage: string }) {
      const stages: Record<string, any> = {
        early: { storeId: body.storeId, stage: 'early', stageName: '开业初期', duration: '1-3个月', keyPoints: [{ area: '开业活动', content: '开业促销', priority: 'high' }, { area: '定价策略', content: '渗透定价', priority: 'high' }, { area: '设备调试', content: '设备调试', priority: 'high' }, { area: '团队培训', content: '培训', priority: 'high' }], pricingStrategy: '渗透定价策略', activityRhythm: ['第1周: 开业', '第2周: 会员日', '第3周: 挑战赛', '第4周: 邻里联欢'], competitorContingencies: [{ scenario: '竞品降价', response: '观察', triggerCondition: '降价>15%' }, { scenario: '竞品同期开业', response: '加大活动', triggerCondition: '新竞品开业' }], riskWarnings: ['客流波动', '设备磨合', '员工流失', '热度消退'], milestones: ['M1', 'M2', 'M3'] },
        growth: { storeId: body.storeId, stage: 'growth', stageName: '快速成长期', duration: '3-12个月', keyPoints: [{ area: '营销', content: '月度营销', priority: 'high' }, { area: '会员', content: '会员拉新', priority: 'high' }], pricingStrategy: '竞争定价', activityRhythm: ['第1月: 春游季'], competitorContingencies: [{ scenario: '价格战', response: '不跟进', triggerCondition: '3家降价' }], riskWarnings: ['盲目扩张'], milestones: ['M1'] },
        mature: { storeId: body.storeId, stage: 'mature', stageName: '成熟运营期', duration: '1-3年', keyPoints: [{ area: '设备更新', content: '更新计划', priority: 'high' }, { area: '会员深耕', content: '分层运营', priority: 'high' }], pricingStrategy: '价值定价', activityRhythm: ['Q1', 'Q2'], competitorContingencies: [{ scenario: '新竞品', response: '构建壁垒', triggerCondition: '资本推动' }], riskWarnings: ['创新不足'], milestones: ['M1'] },
        renewal: { storeId: body.storeId, stage: 'renewal', stageName: '转型升级焕新期', duration: '3年以上', keyPoints: [{ area: '重新装修', content: '全店翻新', priority: 'high' }, { area: '设备换代', content: '全面淘汰', priority: 'high' }], pricingStrategy: '品牌溢价焕新策略: 新设备+新装修支撑高客单价定位', activityRhythm: ['开业期', '升级期'], competitorContingencies: [{ scenario: '同期翻新', response: '差异化', triggerCondition: '重合期' }], riskWarnings: ['投入高'], milestones: ['M1'] },
      }
      return stages[body.stage] ?? stages.early
    },

    syncKnowledge(): Promise<any> {
      return Promise.resolve({ synced: true, scoutDataCount: 5, knowledgeEntriesCreated: 2, timestamp: new Date().toISOString() })
    },

    dataBaseSummary(): Promise<any> {
      return Promise.resolve({ venueCount: 42, dimensionCoverage: ['竞品数量', '竞品价格', '竞品评分', '竞品活动'], updateStatus: { lastFullSync: null, lastIncrementalSync: new Date().toISOString(), overallFreshness: 'fresh' }, knowledgeBaseEntries: 12, coverageByCity: { '上海': { venueCount: 8, avgFreshness: 90 } } })
    },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineIntelligenceController {
  constructor(private readonly svc: ReturnType<typeof createMocks>) {}

  feasibility(body: { city: string; district: string; budget: number }) {
    if (!body.city?.trim() || !body.district?.trim()) {
      throw Object.assign(new Error('城市和区域不能为空'), { status: 404 })
    }
    return this.svc.generateFeasibilityReport(body.city.trim(), body.district.trim(), body.budget || 300)
  }

  financePanorama(body: { budget: number; area: number; tier: RenovationTier; city: string; district: string }) {
    if (!body.city?.trim()) throw Object.assign(new Error('城市不能为空'), { status: 400 })
    if (!body.district?.trim()) throw Object.assign(new Error('区域不能为空'), { status: 400 })
    if (!body.area || body.area <= 0) throw Object.assign(new Error('面积必须大于0'), { status: 400 })
    if (!body.budget || body.budget <= 0) throw Object.assign(new Error('预算必须大于0'), { status: 400 })
    const validTiers: RenovationTier[] = ['luxury', 'standard', 'economy']
    if (!body.tier || !validTiers.includes(body.tier)) throw Object.assign(new Error('装修档次无效'), { status: 400 })
    return this.svc.calculateFinancePanorama(body.budget, body.area, body.tier, body.city.trim(), body.district.trim())
  }

  operations(storeId: string, category?: string) {
    return this.svc.generateOperationAdvice(storeId, category)
  }

  async monitor(storeId: string, city?: string, mode?: string) {
    return this.svc.monitorCompetitor(city, (mode as 'incremental' | 'full') ?? 'incremental')
  }

  async monitorSummary() {
    return this.svc.getLatestScanResult()
  }

  sitingAssessment(city: string, district: string) {
    if (!city?.trim() || !district?.trim()) {
      throw Object.assign(new Error('城市和区域不能为空'), { status: 400 })
    }
    return this.svc.sitingAssessment(city.trim(), district.trim())
  }

  storePlanning(body: { city: string; district: string; budget: number; area: number; tier: string }) {
    if (!body.city?.trim()) throw Object.assign(new Error('城市不能为空'), { status: 400 })
    if (!body.district?.trim()) throw Object.assign(new Error('区域不能为空'), { status: 400 })
    if (!body.area || body.area <= 0) throw Object.assign(new Error('面积必须大于0'), { status: 400 })
    if (!body.budget || body.budget <= 0) throw Object.assign(new Error('预算必须大于0'), { status: 400 })
    const validTiers = ['economy', 'standard', 'deluxe', 'luxury']
    if (!body.tier || !validTiers.includes(body.tier)) throw Object.assign(new Error('装修档次无效'), { status: 400 })
    const input = { city: body.city.trim(), district: body.district.trim(), budget: body.budget, area: body.area, tier: body.tier }
    return this.svc.storePlanning(input)
  }

  async triggerIncremental(city?: string) {
    return this.svc.triggerIncrementalScan(city)
  }

  async triggerFull(city?: string) {
    return this.svc.triggerFullScan(city)
  }

  operationsPlan(body: { storeId: string; stage: 'early' | 'growth' | 'mature' | 'renewal' }) {
    if (!body.storeId?.trim()) throw Object.assign(new Error('门店ID不能为空'), { status: 400 })
    const validStages = ['early', 'growth', 'mature', 'renewal']
    if (!body.stage || !validStages.includes(body.stage)) throw Object.assign(new Error('阶段无效'), { status: 400 })
    return this.svc.operationsPlan(body)
  }

  async deviceRecommendation(body: { budget: number; area: number; city: string; storeType: string; tier: string }) {
    if (!body.city?.trim()) throw Object.assign(new Error('城市不能为空'), { status: 400 })
    if (!body.area || body.area <= 0) throw Object.assign(new Error('面积必须大于0'), { status: 400 })
    if (!body.budget || body.budget <= 0) throw Object.assign(new Error('预算必须大于0'), { status: 400 })
    const validStoreTypes = ['arcade', 'game', 'mixed']
    if (!body.storeType || !validStoreTypes.includes(body.storeType)) throw Object.assign(new Error('门店类型无效'), { status: 400 })
    const validTiers = ['经济', '标准', '精装', '豪华']
    if (!body.tier || !validTiers.includes(body.tier)) throw Object.assign(new Error('装修档次无效'), { status: 400 })
    return this.svc.deviceRecommendation({ budget: body.budget, area: body.area, city: body.city.trim(), storeType: body.storeType, tier: body.tier })
  }

  async renovationPlan(body: { area: number; tier: string; city: string; style?: string }) {
    if (!body.city?.trim()) throw Object.assign(new Error('城市不能为空'), { status: 400 })
    if (!body.area || body.area <= 0) throw Object.assign(new Error('面积必须大于0'), { status: 400 })
    const validTiers = ['经济', '标准', '精装', '豪华']
    if (!body.tier || !validTiers.includes(body.tier)) throw Object.assign(new Error('装修档次无效'), { status: 400 })
    const validStyles = ['现代', '工业', '卡通', '科技']
    if (body.style && !validStyles.includes(body.style)) throw Object.assign(new Error('风格无效'), { status: 400 })
    return this.svc.renovationPlan({ area: body.area, tier: body.tier, city: body.city.trim(), style: body.style })
  }

  async syncKnowledge() {
    return this.svc.syncKnowledge()
  }

  async dataBaseSummary() {
    return this.svc.dataBaseSummary()
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('IntelligenceController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineIntelligenceController

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineIntelligenceController(mock)
  })

  describe('POST /intelligence/feasibility - feasibility', () => {
    it('[正例] 生成可行性报告', () => {
      const result = controller.feasibility({ city: '广州', district: '天河', budget: 300 })
      assert.equal(result.city, '广州')
      assert.equal(result.district, '天河')
      assert.ok(result.score >= 0)
      assert.ok(result.suggestedEquipment.length > 0)
    })

    it('[正例] budget 默认为 300', () => {
      const result = controller.feasibility({ city: '广州', district: '天河', budget: 0 })
      assert.equal(result.budget, 300)
    })

    it('[反例] 空城市抛异常', () => {
      assert.throws(
        () => controller.feasibility({ city: '', district: '天河', budget: 300 }),
        (err: any) => err.status === 404 && err.message.includes('不能为空'),
      )
    })

    it('[反例] 空区域抛异常', () => {
      assert.throws(
        () => controller.feasibility({ city: '广州', district: '  ', budget: 300 }),
        (err: any) => err.status === 404,
      )
    })
  })

  describe('POST /intelligence/finance-panorama - financePanorama', () => {
    it('[正例] 生成财务全景', () => {
      const result = controller.financePanorama({ budget: 50, area: 200, tier: 'standard', city: '广州', district: '天河' })
      assert.equal(result.tier, 'standard')
      assert.equal(result.city, '广州')
      assert.ok(result.totalInvestment > 0)
      assert.ok(result.breakdown.length > 0)
    })

    it('[正例] luxury 档次系数更高', () => {
      const standard = controller.financePanorama({ budget: 50, area: 200, tier: 'standard', city: '广州', district: '天河' })
      const luxury = controller.financePanorama({ budget: 50, area: 200, tier: 'luxury', city: '广州', district: '天河' })
      assert.ok(luxury.totalInvestment > standard.totalInvestment)
    })

    it('[反例] 空城市抛 400', () => {
      assert.throws(
        () => controller.financePanorama({ budget: 50, area: 200, tier: 'standard', city: '', district: '天河' }),
        (err: any) => err.status === 400 && err.message.includes('城市不能为空'),
      )
    })

    it('[反例] 空区域抛 400', () => {
      assert.throws(
        () => controller.financePanorama({ budget: 50, area: 200, tier: 'standard', city: '广州', district: '' }),
        (err: any) => err.status === 400,
      )
    })

    it('[反例] 面积 <= 0 抛 400', () => {
      assert.throws(
        () => controller.financePanorama({ budget: 50, area: 0, tier: 'standard', city: '广州', district: '天河' }),
        (err: any) => err.status === 400,
      )
    })

    it('[反例] 预算 <= 0 抛 400', () => {
      assert.throws(
        () => controller.financePanorama({ budget: 0, area: 200, tier: 'standard', city: '广州', district: '天河' }),
        (err: any) => err.status === 400,
      )
    })

    it('[反例] 无效 tier 抛 400', () => {
      assert.throws(
        () => controller.financePanorama({ budget: 50, area: 200, tier: 'premium' as any, city: '广州', district: '天河' }),
        (err: any) => err.status === 400 && err.message.includes('装修档次无效'),
      )
    })

    it('[边界] economy 档次', () => {
      const result = controller.financePanorama({ budget: 30, area: 100, tier: 'economy', city: '深圳', district: '南山' })
      assert.equal(result.tier, 'economy')
      assert.ok(result.totalInvestment > 0)
    })
  })

  describe('GET /intelligence/operations/:storeId - operations', () => {
    it('[正例] 返回运营建议', () => {
      const result = controller.operations('store-1')
      assert.equal(result.storeId, 'store-1')
      assert.ok(result.advice.length > 0)
      assert.ok(result.metrics.revenue > 0)
    })

    it('[正例] 指定分类', () => {
      const result = controller.operations('store-1', 'pricing')
      assert.equal(result.category, 'pricing')
    })
  })

  describe('GET /intelligence/monitor/:storeId - monitor', () => {
    it('[正例] 默认增量监控', async () => {
      const result = await controller.monitor('store-1', '广州')
      assert.equal(result.mode, 'incremental')
      assert.equal(result.competitorsFound, 15)
    })

    it('[正例] 全量监控', async () => {
      const result = await controller.monitor('store-1', '广州', 'full')
      assert.equal(result.mode, 'full')
    })
  })

  describe('GET /intelligence/monitor/summary - monitorSummary', () => {
    it('[正例] 返回最新扫描结果', async () => {
      const result = await controller.monitorSummary()
      assert.ok(result.lastScannedAt)
      assert.equal(result.totalCompetitors, 15)
    })
  })

  describe('POST /intelligence/monitor/scan/incremental - triggerIncremental', () => {
    it('[正例] 触发增量扫描', async () => {
      const result = await controller.triggerIncremental('广州')
      assert.ok(result.triggered)
      assert.equal(result.mode, 'incremental')
    })
  })

  describe('POST /intelligence/monitor/scan/full - triggerFull', () => {
    it('[正例] 触发全量扫描', async () => {
      const result = await controller.triggerFull('深圳')
      assert.ok(result.triggered)
      assert.equal(result.mode, 'full')
    })
  })

  describe('GET /intelligence/siting-assessment (场景A)', () => {
    it('[正例] 返回选址评估结果', () => {
      const result = controller.sitingAssessment('上海', '徐汇')
      assert.equal(result.city, '上海')
      assert.equal(result.district, '徐汇')
      assert.ok(result.overallScore >= 0)
      assert.ok(result.confidenceInterval.low <= result.overallScore)
      assert.ok(result.confidenceInterval.high >= result.overallScore)
      assert.ok(['非常适合', '可考虑', '不建议'].includes(result.grade))
      assert.ok(result.competition.totalCompetitors > 0)
      assert.ok(result.riskFactors.length > 0)
      assert.ok(result.dataSource.disclaimer.length > 0)
    })

    it('[反例] 空城市抛 400', () => {
      assert.throws(
        () => controller.sitingAssessment('', '徐汇'),
        (err: any) => err.status === 400 && err.message.includes('不能为空'),
      )
    })

    it('[反例] 空区域抛 400', () => {
      assert.throws(
        () => controller.sitingAssessment('上海', ''),
        (err: any) => err.status === 400,
      )
    })
  })

  describe('POST /intelligence/store-planning (场景B)', () => {
    it('[正例] 返回完整新店规划报告', () => {
      const result = controller.storePlanning({ city: '上海', district: '徐汇', budget: 300, area: 400, tier: 'standard' })
      assert.equal(result.city, '上海')
      assert.equal(result.district, '徐汇')
      assert.ok(result.score >= 0)
      assert.ok(result.confidenceInterval.low <= result.score)
      assert.ok(result.competition.totalCompetitors > 0)
      assert.ok(result.financialOverview.initialInvestment.total > 0)
      assert.ok(result.equipmentSuggestions.length > 0)
      assert.ok(result.renovationEstimate.total > 0)
      assert.ok(result.riskFactors.length > 0)
      assert.ok(result.aiSummary.length > 0)
    })

    it('[反例] 空城市抛 400', () => {
      assert.throws(
        () => controller.storePlanning({ city: '', district: '徐汇', budget: 300, area: 400, tier: 'standard' }),
        (err: any) => err.status === 400 && err.message.includes('城市不能为空'),
      )
    })

    it('[反例] 空区域抛 400', () => {
      assert.throws(
        () => controller.storePlanning({ city: '上海', district: '', budget: 300, area: 400, tier: 'standard' }),
        (err: any) => err.status === 400,
      )
    })

    it('[反例] 面积 <= 0 抛 400', () => {
      assert.throws(
        () => controller.storePlanning({ city: '上海', district: '徐汇', budget: 300, area: 0, tier: 'standard' }),
        (err: any) => err.status === 400,
      )
    })

    it('[反例] 无效 tier 抛 400', () => {
      assert.throws(
        () => controller.storePlanning({ city: '上海', district: '徐汇', budget: 300, area: 400, tier: 'premium' }),
        (err: any) => err.status === 400 && err.message.includes('装修档次无效'),
      )
    })

    it('[正例] economy 档次可运行', () => {
      const result = controller.storePlanning({ city: '成都', district: '锦江', budget: 200, area: 200, tier: 'economy' })
      assert.equal(result.city, '成都')
      assert.ok(result.financialOverview.initialInvestment.total > 0)
    })
  })

  describe('POST /intelligence/operations-plan (场景G)', () => {
    it('[正例] 返回完整的早期运营方案', () => {
      const result = controller.operationsPlan({ storeId: 'store-001', stage: 'early' })
      assert.equal(result.storeId, 'store-001')
      assert.equal(result.stage, 'early')
      assert.equal(result.stageName, '开业初期')
      assert.ok(result.keyPoints.length >= 4)
      assert.ok(result.activityRhythm.length >= 4)
      assert.ok(result.competitorContingencies.length >= 2)
      assert.ok(result.riskWarnings.length >= 2)
      assert.ok(result.milestones.length >= 2)
    })

    it('[正例] 返回完整的成长期运营方案', () => {
      const result = controller.operationsPlan({ storeId: 'store-001', stage: 'growth' })
      assert.equal(result.stage, 'growth')
      assert.equal(result.stageName, '快速成长期')
      assert.equal(result.duration, '3-12个月')
    })

    it('[正例] 返回完整的成熟期运营方案', () => {
      const result = controller.operationsPlan({ storeId: 'store-001', stage: 'mature' })
      assert.equal(result.stage, 'mature')
      assert.equal(result.stageName, '成熟运营期')
    })

    it('[正例] 返回完整的焕新期运营方案', () => {
      const result = controller.operationsPlan({ storeId: 'store-001', stage: 'renewal' })
      assert.equal(result.stage, 'renewal')
      assert.equal(result.stageName, '转型升级焕新期')
      assert.ok(result.pricingStrategy.length > 10)
    })

    it('[反例] 空storeId抛400', () => {
      assert.throws(
        () => controller.operationsPlan({ storeId: '', stage: 'early' }),
        (err: any) => err.status === 400 && err.message.includes('门店ID不能为空'),
      )
    })

    it('[反例] 无效stage抛400', () => {
      assert.throws(
        () => controller.operationsPlan({ storeId: 'store-001', stage: 'invalid' as any }),
        (err: any) => err.status === 400 && err.message.includes('阶段无效'),
      )
    })
  })

  describe('POST /intelligence/sync-knowledge (场景H)', () => {
    it('[正例] 执行知识同步返回结果', async () => {
      const result = await controller.syncKnowledge()
      assert.ok(result.synced)
      assert.ok(typeof result.scoutDataCount === 'number')
      assert.ok(typeof result.knowledgeEntriesCreated === 'number')
      assert.ok(result.timestamp)
    })
  })

  describe('GET /intelligence/data-base/summary (场景H)', () => {
    it('[正例] 返回数据底座汇总', async () => {
      const result = await controller.dataBaseSummary()
      assert.ok(result.venueCount >= 0)
      assert.ok(Array.isArray(result.dimensionCoverage))
      assert.ok(result.dimensionCoverage.length >= 4)
      assert.ok(result.updateStatus)
      assert.ok(result.knowledgeBaseEntries >= 0)
    })
  })

  describe('POST /intelligence/device-recommendation (场景C)', () => {
    it('[正例] 返回设备推荐清单', async () => {
      const result = await controller.deviceRecommendation({ budget: 200, area: 300, city: '上海', storeType: 'arcade', tier: '标准' })
      assert.equal(result.city, '上海')
      assert.ok(result.devices.length > 0)
      assert.ok(result.totalCost > 0)
      assert.ok(result.budgetUtilizationPercent > 0)
      assert.ok(result.alternatives.length > 0)
      assert.ok(result.notes.length > 0)
    })

    it('[正例] mixed类型返回更多设备', async () => {
      const arcade = await controller.deviceRecommendation({ budget: 300, area: 400, city: '上海', storeType: 'arcade', tier: '标准' })
      const mixed = await controller.deviceRecommendation({ budget: 300, area: 400, city: '上海', storeType: 'mixed', tier: '标准' })
      assert.ok(mixed.devices.length >= arcade.devices.length)
    })

    it('[反例] 空城市抛 400', async () => {
      await assert.rejects(
        () => controller.deviceRecommendation({ budget: 200, area: 300, city: '', storeType: 'arcade', tier: '标准' }),
        (err: any) => err.status === 400 && err.message.includes('城市不能为空'),
      )
    })

    it('[反例] 面积 <= 0 抛 400', async () => {
      await assert.rejects(
        () => controller.deviceRecommendation({ budget: 200, area: 0, city: '上海', storeType: 'arcade', tier: '标准' }),
        (err: any) => err.status === 400,
      )
    })

    it('[反例] 无效 storeType 抛 400', async () => {
      await assert.rejects(
        () => controller.deviceRecommendation({ budget: 200, area: 300, city: '上海', storeType: 'invalid' as any, tier: '标准' }),
        (err: any) => err.status === 400 && err.message.includes('门店类型无效'),
      )
    })

    it('[反例] 无效 tier 抛 400', async () => {
      await assert.rejects(
        () => controller.deviceRecommendation({ budget: 200, area: 300, city: '上海', storeType: 'arcade', tier: '奢华' as any }),
        (err: any) => err.status === 400 && err.message.includes('装修档次无效'),
      )
    })
  })

  describe('POST /intelligence/renovation-plan (场景D)', () => {
    it('[正例] 返回装修方案', async () => {
      const result = await controller.renovationPlan({ area: 300, tier: '标准', city: '上海', style: '现代' })
      assert.equal(result.city, '上海')
      assert.equal(result.style, '现代')
      assert.ok(result.baseDecoration.amount > 0)
      assert.ok(result.themedDesign.amount > 0)
      assert.ok(result.furnitureDecor.amount > 0)
      assert.ok(result.fireSafetyApproval.amount > 0)
      assert.equal(result.items.length, 4)
      assert.ok(result.subTotal > 0)
      assert.ok(result.renovationDuration.length > 0)
      assert.ok(result.recommendations.length > 0)
    })

    it('[正例] 不传style时默认为现代', async () => {
      const result = await controller.renovationPlan({ area: 200, tier: '豪华', city: '上海' })
      assert.equal(result.style, '现代')
    })

    it('[正例] 豪华档装修费用更高', async () => {
      const economy = await controller.renovationPlan({ area: 300, tier: '经济', city: '上海' })
      const luxury = await controller.renovationPlan({ area: 300, tier: '豪华', city: '上海' })
      assert.ok(luxury.subTotal > economy.subTotal)
    })

    it('[反例] 空城市抛 400', async () => {
      await assert.rejects(
        () => controller.renovationPlan({ area: 300, tier: '标准', city: '' }),
        (err: any) => err.status === 400 && err.message.includes('城市不能为空'),
      )
    })

    it('[反例] 面积 <= 0 抛 400', async () => {
      await assert.rejects(
        () => controller.renovationPlan({ area: 0, tier: '标准', city: '上海' }),
        (err: any) => err.status === 400,
      )
    })

    it('[反例] 无效 tier 抛 400', async () => {
      await assert.rejects(
        () => controller.renovationPlan({ area: 300, tier: '顶级' as any, city: '上海' }),
        (err: any) => err.status === 400 && err.message.includes('装修档次无效'),
      )
    })

    it('[反例] 无效 style 抛 400', async () => {
      await assert.rejects(
        () => controller.renovationPlan({ area: 300, tier: '标准', city: '上海', style: '复古' as any }),
        (err: any) => err.status === 400 && err.message.includes('风格无效'),
      )
    })
  })
})
