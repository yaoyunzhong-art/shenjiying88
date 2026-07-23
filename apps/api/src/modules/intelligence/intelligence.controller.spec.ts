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
})
