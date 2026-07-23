/**
 * intelligence.service.ts — 运营参谋 (P-50 V2 · AI赋能引擎) + V23 全场景赋能
 *
 * 功能:
 *   1. 开业可行性报告 (基于侦察兵竞品数据)
 *   2. 装修全景财务报告 (P-50 V2 · 完整财务模型)
 *   3. 运营参谋 (AI选择题模式 · 7大类)
 *   4. 竞争监控 (异步采集 · 增量/全量/去重/走势)
 *   5. AI决策引擎 (数据推理 · 含数据佐证)
 *   [V23] 6. 新店规划 (store-planning)
 *   [V23] 7. 设备选型推荐 (device-recommendation)
 *   [V23] 8. 装修方案 (renovation-plan)
 *   [V23] 9. 选址评估增强 (siting-assessment)
 *   [V23] 10. 动态定价策略 (pricing-strategy)
 *   [V23] 11. 营销活动6大类 (marketing-campaign)
 *   [V23] 12. 全周期运营方案 (operations-plan)
 *   [V23] 13. 数据底座整合 (sync-knowledge / data-base)
 */
import { Injectable, Logger } from '@nestjs/common'
import { IntelligenceAiService } from './intelligence-ai.service'
import { MonitorCollectorService } from './monitor-collector.service'
import { VenueDataService } from './venue-data.service'
import { EmpowerCardService } from '../empower-card/empower-card.service'
import type {
  FeasibilityReport,
  OperationAdviceChoice,
  AdviceOption,
  CompetitorAlert,
  MonitorScanResult,
  ScanMode,
  FinancePanorama,
  RenovationTier,
  RenovationTierZh,
  TrendPoint,
  StorePlanningInput,
  StorePlanningOutput,
  PlanningGrade,
  CompetitionAnalysis,
  FinancialOverview,
  EquipmentSuggestion,
  RiskFactorItem,
  DeviceCandidate,
  AlternativeDeviceRecommendation,
  DeviceRecommendationInput,
  DeviceRecommendationOutput,
  RecommendedDevice,
  RenovationPlanInput,
  RenovationPlanOutput,
  RenovationItem,
  SitingAssessmentOutput,
  SitingRiskFactor,
  DensityLevel,
  PricingStrategyInput,
  PricingStrategyOutput,
  PriceProposal,
  CampaignProposal,
  MarketingCampaignInput,
  MarketingCampaignOutput,
  CampaignType,
  OperationsPlanInput,
  OperationsPlanOutput,
  StageOperationKeyPoint,
  CompetitorContingency,
  StoreStage,
  DataBaseSummary,
  SyncKnowledgeResult,
} from './intelligence.entity'

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name)

  constructor(
    private readonly aiService: IntelligenceAiService,
    private readonly collector: MonitorCollectorService,
    private readonly venueData: VenueDataService,
    private readonly empowerCardService: EmpowerCardService,
  ) {}

  /** 模拟侦察兵数据库的竞品密度数据 */
  private readonly COMPETITOR_DENSITY: Record<string, { count: number; avgPrice: number }> = {
    '上海-徐汇': { count: 8, avgPrice: 128 },
    '上海-浦东': { count: 6, avgPrice: 145 },
    '上海-静安': { count: 5, avgPrice: 168 },
    '北京-朝阳': { count: 7, avgPrice: 135 },
    '北京-海淀': { count: 4, avgPrice: 118 },
    '深圳-南山': { count: 6, avgPrice: 98 },
    '深圳-福田': { count: 5, avgPrice: 112 },
    '成都-锦江': { count: 4, avgPrice: 78 },
    '成都-武侯': { count: 3, avgPrice: 72 },
    '广州-天河': { count: 5, avgPrice: 88 },
    '杭州-西湖': { count: 3, avgPrice: 92 },
    '南京-鼓楼': { count: 2, avgPrice: 75 },
    default: { count: 1, avgPrice: 60 },
  }

  /** 最近一次扫描缓存 */
  private lastScanResult: MonitorScanResult | null = null

  // ─── 1. 开业可行性报告 ──────────────────────────────

  generateFeasibilityReport(city: string, district: string, budget: number): FeasibilityReport {
    const key = `${city}-${district}`
    const density = this.COMPETITOR_DENSITY[key] || this.COMPETITOR_DENSITY.default!

    const competitorDensity = Math.min(density.count / 10, 1)
    const score = Math.round((1 - competitorDensity * 0.4) * 60 + Math.min(budget / 500, 0.3) * 100 + 10)
    const finalScore = Math.min(Math.max(score, 0), 100)

    const scoreLevel = finalScore >= 75 ? 'high' as const : finalScore >= 50 ? 'medium' as const : 'low' as const

    // 设备建议
    const suggestedEquipment = [
      { name: '街机射击区', count: 8, cost: 320000, reason: `${city}同城竞品平均配置6-10台，覆盖率高` },
      { name: 'VR体验区', count: 4, cost: 280000, reason: `年轻客群偏好${city}区域VR需求年增30%` },
      { name: '跳舞机/音游区', count: 3, cost: 120000, reason: '社交属性强，周末翻台率高' },
      { name: '夹娃娃机', count: 12, cost: 96000, reason: `高利润率项目，${city}平均回收期6个月` },
      { name: '篮球机', count: 4, cost: 48000, reason: '亲子客群必配，引流效果好' },
      { name: '赛车模拟器', count: 3, cost: 156000, reason: `${district}周边竞品差异化配置` },
    ]

    const riskFactors = [
      { factor: '同城竞品密度', level: competitorDensity > 0.5 ? 'high' as const : 'medium' as const,
        suggestion: density.count >= 5 ? '建议差异化定位，避开头部竞品主力项目' : '正常竞争环境，做好本地化运营即可' },
      { factor: '预算匹配度', level: budget < 200 ? 'high' as const : 'low' as const,
        suggestion: budget < 200 ? '建议提高预算至300万+，确保设备和装修品质' : '预算充裕，可配置高端设备' },
      { factor: '商圈成熟度', level: 'medium' as const,
        suggestion: '建议实地考察人流量和周边配套，优先选择商场一层或负一层' },
    ]

    const avgMonthlyRevenue = Math.round((density.avgPrice * 1500 + budget * 8) / 10)

    return {
      city, district, budget,
      score: finalScore,
      scoreLevel,
      summary: `${city}${district}地区${finalScore >= 75 ? '非常适合' : finalScore >= 50 ? '可以考虑' : '不建议'}投资开设新店。当前该区域有${density.count}家竞品，人均消费约¥${density.avgPrice}。`,
      competitorDensity: Math.round(competitorDensity * 100),
      competitorCount: density.count,
      avgPrice: density.avgPrice,
      suggestedEquipment: suggestedEquipment.map(e => ({ ...e, reason: `${e.reason}·` })),
      suggestedPriceRange: { min: density.avgPrice - 20, max: density.avgPrice + 30, avg: density.avgPrice },
      riskFactors,
      marketTrend: `${city}娱乐市场年增长率约15-20%，${district}商圈流量稳定，周末高峰期明显`,
      estimatedMonthlyRevenue: avgMonthlyRevenue,
      estimatedPaybackMonths: Math.round(budget * 10000 / avgMonthlyRevenue),
    }
  }

  // ─── 1a. 选址评估增强 (V23 场景A) ──────────────────

  /**
   * 增强的选址评估，输出含置信区间、竞争分析、风险因素和数据来源声明。
   * 响应 GET /intelligence/siting-assessment?city=&district=
   */
  sitingAssessment(city: string, district: string): SitingAssessmentOutput {
    const key = `${city}-${district}`
    const density = this.COMPETITOR_DENSITY[key] || this.COMPETITOR_DENSITY.default!

    const competitorDensity = Math.min(density.count / 10, 1)
    const totalScore = Math.round((1 - competitorDensity * 0.4) * 60 + 25)
    const score = Math.min(Math.max(totalScore, 0), 100)

    // 置信区间: 样本量越大越窄
    const margin = density.count <= 2 ? 15 : density.count <= 5 ? 10 : 6
    const confidenceInterval = { low: Math.max(0, score - margin), high: Math.min(100, score + margin) }

    // 等级
    const grade: PlanningGrade = score >= 70 ? '非常适合' : score >= 45 ? '可考虑' : '不建议'

    // 密度等级
    const densityLevel: DensityLevel = density.count >= 6 ? '高' : density.count >= 3 ? '中' : '低'

    // 竞争分析
    const districtDistribution: Record<string, number> = { [district]: density.count }

    // 财务预估
    const CITY_RENT_MAP: Record<string, number> = {
      '上海': 280, '北京': 250, '深圳': 220, '广州': 200,
      '杭州': 180, '成都': 150, '南京': 160, '重庆': 130,
      '武汉': 140, '西安': 120, '长沙': 130,
    }
    const avgRent = CITY_RENT_MAP[city] ?? 100
    const estimatedMonthlyRevenue = Math.round(density.avgPrice * 1500)
    const estimatedMonthlyCost = Math.round(avgRent * 300 + 60000 + estimatedMonthlyRevenue * 0.1)
    const paybackMonths = estimatedMonthlyRevenue > estimatedMonthlyCost
      ? Math.ceil(estimatedMonthlyRevenue * 12 / ((estimatedMonthlyRevenue - estimatedMonthlyCost) * 12))
      : 999

    // 风险因素
    const riskFactors: SitingRiskFactor[] = [
      {
        factor: '同城竞品密度',
        level: density.count >= 6 ? 'high' : density.count >= 3 ? 'medium' : 'low',
        suggestion: density.count >= 5
          ? '建议差异化定位，避开头部竞品主力项目'
          : '正常竞争环境，做好本地化运营即可',
      },
      {
        factor: '商圈租金水平',
        level: avgRent >= 250 ? 'high' : avgRent >= 150 ? 'medium' : 'low',
        suggestion: avgRent >= 200
          ? `¥${avgRent}/㎡的租金偏高，需确保日均客流达标`
          : '租金可控，成本压力较小',
      },
      {
        factor: '竞品客单价',
        level: density.avgPrice >= 150 ? 'medium' : 'low',
        suggestion: density.avgPrice >= 120
          ? `${city}区域客单价偏高，建议走中高端路线`
          : '客单价适中，利于走量经营',
      },
    ]

    // 建议
    const suggestions: string[] = []
    if (density.count >= 5) suggestions.push('竞品密集区建议差异化定位，避开主力竞品项目')
    if (avgRent >= 200) suggestions.push('租金偏高，建议评估日客流能否支撑')
    suggestions.push('建议实地考察人流量和周边配套')
    suggestions.push('优先选择商场一层或负一层位置')
    if (score >= 70) suggestions.push('该区域适合投资，建议尽快锁定优质铺位')

    return {
      city,
      district,
      overallScore: score,
      confidenceInterval,
      grade,
      competition: {
        totalCompetitors: density.count,
        districtDistribution,
        avgTicketPrice: density.avgPrice,
        densityLevel,
      },
      riskFactors,
      financialEstimate: {
        avgRent,
        monthlyRevenue: estimatedMonthlyRevenue,
        monthlyCost: estimatedMonthlyCost,
        paybackMonths,
      },
      suggestions,
      dataSource: {
        disclaimer: '本评估基于侦察兵同城竞品公开信息及行业基准数据，仅供参考，不构成投资建议。实际经营效果受多方因素影响。',
        freshness: '数据更新于最近一次同城扫描',
        sourceType: '侦察兵竞品数据库 + 行业基准',
      },
    }
  }

  // ─── 1ab. 新店开张整体规划 (V23 场景B) ──────────────

  /**
   * 新店开张整体规划 — 整合选址评估+财务全景+设备+装修+AI建议。
   * 响应 POST /intelligence/store-planning
   */
  storePlanning(input: StorePlanningInput): StorePlanningOutput {
    const { city, district, budget, area, tier } = input

    // 复用选址评估
    const siting = this.sitingAssessment(city, district)

    // 财务全景（复用现有逻辑）
    const mappedTier: RenovationTier = tier === 'deluxe' ? 'standard' : tier as RenovationTier
    const finance = this.calculateFinancePanorama(budget, area, mappedTier, city, district)

    // 竞争分析
    const density = this.COMPETITOR_DENSITY[`${city}-${district}`] || this.COMPETITOR_DENSITY.default!
    const densityLevel: DensityLevel = density.count >= 6 ? '高' : density.count >= 3 ? '中' : '低'
    const competition: CompetitionAnalysis = {
      totalCompetitors: density.count,
      districtDistribution: { [district]: density.count },
      avgTicketPrice: density.avgPrice,
      densityLevel,
      topCompetitors: density.count > 0
        ? Array.from({ length: Math.min(density.count, 5) }, (_, i) => `${city}竞品${i + 1}`)
        : [],
    }

    // 财务全景 (新店规划版)
    const financialOverview: FinancialOverview = {
      initialInvestment: {
        equipment: finance.initialInvestment.equipmentCost,
        renovation: finance.initialInvestment.renovationCost,
        systemSoftware: finance.initialInvestment.softwareSystemCost,
        deposit: finance.initialInvestment.deposit,
        total: finance.initialInvestment.total,
      },
      monthlyFixedCost: {
        rent: finance.monthlyFixedCost.rent,
        labor: finance.monthlyFixedCost.labor,
        maintenance: finance.monthlyFixedCost.equipmentMaintenance,
        saas: finance.monthlyFixedCost.systemSubscription,
        total: finance.monthlyFixedCost.total,
      },
      monthlyVariableCost: {
        electricity: finance.monthlyVariableCost.electricity,
        consumables: finance.monthlyVariableCost.consumables,
        marketing: finance.monthlyVariableCost.marketing,
        total: finance.monthlyVariableCost.total,
      },
      estimatedMonthlyRevenue: finance.revenueEstimate.estimatedMonthlyRevenue,
      estimatedMonthlyProfit: finance.revenueEstimate.estimatedMonthlyProfit,
      paybackMonths: finance.paybackMonths,
    }

    // 设备建议 (按tier缩放)
    const tierFactor = tier === 'luxury' ? 1.4 : tier === 'deluxe' ? 1.2 : tier === 'standard' ? 1.0 : 0.7
    const equipmentSuggestions: EquipmentSuggestion[] = [
      { name: '街机射击区', count: Math.round(8 * tierFactor), unitPrice: 40000, totalPrice: Math.round(8 * tierFactor * 40000), supplier: '华立科技', warrantyMonths: 12, monthlyMaintenance: Math.round(8 * tierFactor * 40000 * 0.1 / 12) },
      { name: 'VR体验区', count: Math.round(4 * tierFactor), unitPrice: 70000, totalPrice: Math.round(4 * tierFactor * 70000), supplier: 'Pico', warrantyMonths: 24, monthlyMaintenance: Math.round(4 * tierFactor * 70000 * 0.1 / 12) },
      { name: '跳舞机/音游区', count: Math.round(3 * tierFactor), unitPrice: 40000, totalPrice: Math.round(3 * tierFactor * 40000), supplier: '华立科技', warrantyMonths: 12, monthlyMaintenance: Math.round(3 * tierFactor * 40000 * 0.1 / 12) },
      { name: '夹娃娃机', count: Math.round(12 * tierFactor), unitPrice: 8000, totalPrice: Math.round(12 * tierFactor * 8000), supplier: '广州雄业', warrantyMonths: 6, monthlyMaintenance: Math.round(12 * tierFactor * 8000 * 0.1 / 12) },
      { name: '篮球机', count: Math.round(4 * tierFactor), unitPrice: 12000, totalPrice: Math.round(4 * tierFactor * 12000), supplier: '中娱', warrantyMonths: 12, monthlyMaintenance: Math.round(4 * tierFactor * 12000 * 0.1 / 12) },
      { name: '赛车模拟器', count: Math.round(3 * tierFactor), unitPrice: 52000, totalPrice: Math.round(3 * tierFactor * 52000), supplier: 'Playseat', warrantyMonths: 12, monthlyMaintenance: Math.round(3 * tierFactor * 52000 * 0.1 / 12) },
    ]

    // 装修预估
    const renovationPerSqm =
      tier === 'luxury' ? 3500 :
      tier === 'deluxe' ? 2000 :
      tier === 'standard' ? 1200 : 600
    const baseRenovation = Math.round(renovationPerSqm * area * 0.5)
    const themedDesign = Math.round(renovationPerSqm * area * 0.2)
    const furnitureDecor = Math.round(renovationPerSqm * area * 0.2)
    const fireSafetyApproval = Math.round(renovationPerSqm * area * 0.1)

    // 风险因素
    const riskFactors: SitingRiskFactor[] = [
      ...siting.riskFactors,
      {
        factor: '装修档次与预算匹配',
        level: budget < 200 && tier === 'luxury' ? 'high' : 'medium',
        suggestion: budget < 200 && tier === 'luxury'
          ? '豪华装修预算建议300万以上'
          : '档���与预算基本匹配，可按计划执行',
      },
      {
        factor: '回收期风险',
        level: finance.paybackMonths >= 36 ? 'high' : finance.paybackMonths >= 24 ? 'medium' : 'low',
        suggestion: finance.paybackMonths >= 24
          ? `预计回收期${finance.paybackMonths}个月，建议做好现金流规划`
          : '回收期合理，投资回报预期良好',
      },
    ]

    // AI摘要
    const grade: PlanningGrade = siting.grade
    const aiSummary = `${city}${district}选址评估${siting.overallScore}分(${grade})。
该区域有${density.count}家竞品，人均消费约¥${density.avgPrice}，竞争${densityLevel}。
${tier === 'luxury' ? '豪华' : tier === 'deluxe' ? '精装' : tier === 'standard' ? '标准' : '经济'}档装修${area}㎡，总投资约¥${(financialOverview.initialInvestment.total / 10000).toFixed(0)}万，
预计月营收¥${(financialOverview.estimatedMonthlyRevenue / 10000).toFixed(1)}万，回收期${finance.paybackMonths}个月。
建议：${siting.suggestions.slice(0, 2).join('；')}`

    return {
      city,
      district,
      score: siting.overallScore,
      confidenceInterval: siting.confidenceInterval,
      grade,
      competition,
      financialOverview,
      equipmentSuggestions,
      renovationEstimate: {
        baseRenovation,
        themedDesign,
        furnitureDecor,
        fireSafetyApproval,
        total: baseRenovation + themedDesign + furnitureDecor + fireSafetyApproval,
      },
      riskFactors,
      aiSummary,
    }
  }

  // ─── 1b. 装修全景财务报告 (P-50 V2) ──────────────────

  calculateFinancePanorama(
    budgetParam: number,
    area: number,
    tier: RenovationTier,
    city: string,
    district: string,
  ): FinancePanorama {
    // 参数清理
    const safeBudget = budgetParam <= 0 ? 300 : budgetParam
    const safeArea = area <= 0 ? 300 : Math.min(area, 5000)

    // 装修档次单价（中文映射）
    const RENOVATION_ZH: Record<RenovationTier, RenovationTierZh> = {
      luxury: '豪华',
      standard: '标准',
      economy: '经济',
    }
    const RENOVATION_PRICE_MAP: Record<RenovationTierZh, number> = {
      '豪华': 3500,
      '精装': 2000,
      '标准': 1200,
      '经济': 600,
    }
    const tierZh = RENOVATION_ZH[tier] ?? '标准'
    const renovationPerSqm = RENOVATION_PRICE_MAP[tierZh]
    const renovationCost = Math.round(renovationPerSqm * safeArea)

    // 城市数据
    const CITY_RENT_MAP: Record<string, { rent: number; salary: number }> = {
      '上海': { rent: 280, salary: 12000 },
      '北京': { rent: 250, salary: 12000 },
      '深圳': { rent: 220, salary: 11000 },
      '广州': { rent: 200, salary: 10000 },
      '杭州': { rent: 180, salary: 9500 },
      '成都': { rent: 150, salary: 8000 },
      '南京': { rent: 160, salary: 8500 },
      '重庆': { rent: 130, salary: 7500 },
      '武汉': { rent: 140, salary: 7500 },
      '西安': { rent: 120, salary: 7000 },
      '长沙': { rent: 130, salary: 7000 },
      default: { rent: 100, salary: 6000 },
    }
    const cityData = CITY_RENT_MAP[city] ?? CITY_RENT_MAP.default!

    // ── 首期投入 ──
    const equipmentCost = Math.round(safeBudget * 10000 * 0.45)
    const softwareSystemCost = Math.round(Math.min(Math.max(80000 + safeArea * 60, 80000), 200000))
    const monthlyRent = Math.round(cityData.rent * safeArea)
    const deposit = monthlyRent * 3

    const initialInvestment = {
      equipmentCost,
      renovationCost,
      softwareSystemCost,
      deposit,
      total: equipmentCost + renovationCost + softwareSystemCost + deposit,
    }

    // ── 月固定成本 ──
    const staffCount = safeArea <= 200 ? 6 : safeArea <= 500 ? 8 : safeArea <= 800 ? 10 : 12
    const labor = staffCount * cityData.salary
    const equipmentMaintenance = Math.round(equipmentCost * 0.1 / 12)
    const systemSubscription = Math.round(Math.min(Math.max(3000 + safeArea * 3, 3000), 8000))

    const monthlyFixedCost = {
      rent: monthlyRent,
      labor,
      equipmentMaintenance,
      systemSubscription,
      total: monthlyRent + labor + equipmentMaintenance + systemSubscription,
    }

    // ── 营收预估（基于竞品数据） ──
    const densityKey = `${city}-${district}`
    const density = this.COMPETITOR_DENSITY[densityKey] ?? this.COMPETITOR_DENSITY.default!
    const avgTicketPrice = density.avgPrice
    const peoplePerSqm = 2.5
    const estimatedDailyTraffic = Math.round(safeArea / peoplePerSqm * 1.2)
    const estimatedMonthlyRevenue = Math.round(avgTicketPrice * estimatedDailyTraffic * 30)

    // ── 月变动成本 ──
    const electricity = Math.round(safeArea * 20)
    const consumables = Math.round(estimatedMonthlyRevenue * 0.025)
    const marketing = Math.round(estimatedMonthlyRevenue * 0.05)

    const monthlyVariableCost = {
      electricity,
      consumables,
      marketing,
      total: electricity + consumables + marketing,
    }

    // ── 月总成本 ──
    const monthlyTotalCost = monthlyFixedCost.total + monthlyVariableCost.total

    // ── 折旧与摊销 ──
    const monthlyDepreciation = Math.round(equipmentCost / 36)
    const monthlyAmortization = Math.round(renovationCost / 60)

    // ── 利润与回收期 ──
    const estimatedMonthlyProfit = estimatedMonthlyRevenue - monthlyTotalCost

    const paybackMonths = estimatedMonthlyProfit > 0
      ? Math.ceil(initialInvestment.total / estimatedMonthlyProfit)
      : 999

    const monthlyDeduct = estimatedMonthlyProfit - monthlyDepreciation - monthlyAmortization
    const paybackWithDepreciation = monthlyDeduct > 0
      ? Math.ceil(initialInvestment.total / monthlyDeduct)
      : 999

    // ── 同城对比 ──
    const cityAvgComparison = {
      initialInvestment: Math.round(initialInvestment.total * 0.9),
      monthlyFixedCost: Math.round(monthlyFixedCost.total * 0.95),
      monthlyRevenue: Math.round(estimatedMonthlyRevenue * 1.1),
      paybackMonths: Math.max(1, Math.round(paybackMonths * 1.15)),
    }

    // ── 兼容旧字段 ──
    const totalCost = initialInvestment.total
    const monthlyOpEx = monthlyTotalCost
    const projectedMonthlyRevenue = estimatedMonthlyRevenue
    const projectedMonthlyProfit = estimatedMonthlyProfit
    const annualRevenueProjection = projectedMonthlyRevenue * 12

    const breakEvenAnalysis = paybackMonths <= 12
      ? '一年内可回本，投资回报率较高'
      : paybackMonths <= 24
        ? '1-2年可回本，属于行业平均水平'
        : '回本周期较长，建议优化成本结构'

    const recommendation = tier === 'luxury'
      ? '高端路线适合核心商圈，建议关注服务体验差异化'
      : tier === 'economy'
        ? '经济型方案适合社区店，控制成本的同时保证基本体验'
        : '标准方案性价比最优，适多数商圈投资'

    return {
      // 输入参数
      budget: safeBudget, area: safeArea, tier, city, district,

      // 新版财务全景
      initialInvestment,
      monthlyFixedCost,
      monthlyVariableCost,
      monthlyTotalCost,
      revenueEstimate: {
        avgTicketPrice,
        estimatedDailyTraffic,
        estimatedMonthlyRevenue,
        estimatedMonthlyProfit,
      },
      monthlyDepreciation,
      monthlyAmortization,
      paybackMonths,
      paybackWithDepreciation,
      cityAvgComparison,

      // 兼容旧字段
      renovationCostBreakdown: [
        { category: '硬装(地面/墙面/吊顶)', amount: Math.round(renovationCost * 0.5), percent: 50 },
        { category: '软装(灯光/标识/休息区)', amount: Math.round(renovationCost * 0.3), percent: 30 },
        { category: '消防/安防/通风', amount: Math.round(renovationCost * 0.2), percent: 20 },
      ],
      equipmentCostBreakdown: [
        { name: '街机/射击区', count: 8, unitCost: 40000, total: 320000 },
        { name: 'VR体验区', count: 4, unitCost: 70000, total: 280000 },
        { name: '跳舞机/音游', count: 3, unitCost: 40000, total: 120000 },
        { name: '夹娃娃机', count: 12, unitCost: 8000, total: 96000 },
      ],
      totalCost,
      monthlyOpEx,
      projectedMonthlyRevenue,
      projectedMonthlyProfit,
      annualRevenueProjection,
      breakEvenAnalysis,
      recommendation,
    }
  }

  // ─── 2. 运营参谋 (AI选择题 · 7大类) ──────────────────

  generateOperationAdvice(storeId: string, category?: string): OperationAdviceChoice[] {
    const choices: OperationAdviceChoice[] = [
      // ── Pricing ──
      {
        id: 'pricing-1', category: 'pricing',
        question: '周末高峰时段如何定价？',
        aiSuggestion: '建议采用分时段定价策略，周末18:00-21:00为黄金时段，溢价20%',
        options: this.buildOptions('pricing', [
          { id: 'p-a', label: '统一价格', description: '全天统一价¥88/人', pros: ['简单易执行', '客户体验好'], cons: ['高峰期收入少', '平时段闲置'], estimatedEffect: '预计月收入+8%' },
          { id: 'p-b', label: '分时段定价', description: '高峰¥108/人·平峰¥68', pros: ['收入最大化', '引导错峰'], cons: ['定价复杂', '需系统支持'], estimatedEffect: '预计月收入+22%' },
          { id: 'p-c', label: '动态定价', description: 'AI根据实时客流量调整', pros: ['最优定价', '智能化'], cons: ['技术门槛高', '客户接受度低'], estimatedEffect: '预计月收入+30%' },
        ]),
      },
      // ── Activity ──
      {
        id: 'activity-1', category: 'activity',
        question: '本月主推什么活动？',
        aiSuggestion: '参考同城竞品活动日历，建议推出抖音团购套餐+周末主题比赛',
        options: this.buildOptions('activity', [
          { id: 'a-a', label: '抖音团购', description: '¥69双人畅玩2小时', pros: ['曝光量大', '引流快'], cons: ['利润薄', '到店转化需配套'], estimatedEffect: '预计新增客流+40%' },
          { id: 'a-b', label: '周末主题赛', description: '投篮/跳舞机PK赛', pros: ['话题性强', '复购率高'], cons: ['筹备周期长', '奖品成本'], estimatedEffect: '预计新增客流+25%' },
          { id: 'a-c', label: '会员日半价', description: '每月15号会员专享半价', pros: ['会员粘性', '口碑传播'], cons: ['短期损失', '需足够会员基础'], estimatedEffect: '预计新增客流+15%' },
        ]),
      },
      // ── Equipment ──
      {
        id: 'equipment-1', category: 'equipment',
        question: '下季度哪些设备需要更新？',
        aiSuggestion: '根据竞品设备数据分析，建议优先更新VR设备和新增运动竞技类设备',
        options: this.buildOptions('equipment', [
          { id: 'e-a', label: '升级VR区', description: '更换4台最新VR设备', pros: ['技术优势', '体验感强'], cons: ['投入大', '需专业人员'], estimatedEffect: '预计新增收入+15%' },
          { id: 'e-b', label: '新增保龄球/射箭', description: '运动竞技类2-4道', pros: ['差异化', '适合团建'], cons: ['占地大', '运维复杂'], estimatedEffect: '预计新增收入+25%' },
          { id: 'e-c', label: '翻新夹娃娃机', description: '更换10台新款+增加奖品', pros: ['低成本', '效果立竿见影'], cons: ['同质化', '短期效果'], estimatedEffect: '预计新增收入+10%' },
        ]),
      },
      // ── Promotion ──
      {
        id: 'promotion-1', category: 'promotion',
        question: '如何应对竞品新出的¥49团购？',
        aiSuggestion: '不建议打价格战，建议用差异化套餐回应',
        options: this.buildOptions('promotion', [
          { id: 'r-a', label: '跟进降价', description: '同步推出¥49套餐', pros: ['维持客流量'], cons: ['利润下降', '品牌掉价'], estimatedEffect: '短期保客流·利润-20%' },
          { id: 'r-b', label: '增值不加价', description: '保持原价¥69但增加礼品', pros: ['价值感知', '不伤品牌'], cons: ['增加成本'], estimatedEffect: '保持客流·成本+10%' },
          { id: 'r-c', label: '场景升级', description: '推出¥99"畅玩+饮品"套餐', pros: ['客单价提升', '差异化'], cons: ['需配套'], estimatedEffect: '预计月收入+18%' },
        ]),
      },
      // ── Recruit — 联名活动/IP跨界 (新增) ──
      {
        id: 'recruit-1', category: 'recruit',
        question: '如何策划联名活动提升品牌影响力？',
        aiSuggestion: '建议优先考虑与本地热门IP合作，联名活动可带来30%+客流增长。同城竞品联名活动平均获客增长35%',
        options: this.buildOptions('recruit', [
          { id: 'rec-a', label: 'IP联名主题', description: '与热门动漫/游戏IP合作主题活动', pros: ['话题性强', '客单价高'], cons: ['授权成本', '周期长'], estimatedEffect: '预计月收入+35%' },
          { id: 'rec-b', label: '跨界品牌联名', description: '与热门茶饮/餐饮品牌联名套餐', pros: ['成本可控', '精准互导'], cons: ['排他性', '协调复杂'], estimatedEffect: '预计月收入+22%' },
          { id: 'rec-c', label: 'KOL探店推广', description: '邀请本地KOL探店+联名限定活动', pros: ['传播快', 'ROI高'], cons: ['效果波动', '筛选成本'], estimatedEffect: '预计月收入+18%' },
        ]),
      },
      // ── Seasonal — 暑假/寒假限定活动 (新增) ──
      {
        id: 'seasonal-1', category: 'seasonal',
        question: '假期季推什么类型活动最有效？',
        aiSuggestion: '假期档营收占全年30%+，建议提前1个月筹备。畅玩卡方案在同城竞品中平均获客增长38%',
        options: this.buildOptions('seasonal', [
          { id: 'sea-a', label: '假期畅玩卡', description: '假期不限次畅玩卡+赠品', pros: ['锁客强', '现金流好'], cons: ['需预售', '限时效应'], estimatedEffect: '预计月收入+35%' },
          { id: 'sea-b', label: '季节性主题布置', description: '限时主题装饰+互动游戏', pros: ['新鲜感', '社交传播'], cons: ['布置成本', '时效短'], estimatedEffect: '预计月收入+25%' },
          { id: 'sea-c', label: '假期托管营', description: '假期日间托管+游乐+餐饮', pros: ['差异化', '客单价高'], cons: ['人力成本高', '资质要求'], estimatedEffect: '预计月收入+28%' },
        ]),
      },
      // ── Blindbox — 盲盒/抽奖促销(合规版) (新增) ──
      {
        id: 'blindbox-1', category: 'blindbox',
        question: '如何设计合规的盲盒/抽奖促销？',
        aiSuggestion: '合规盲盒方案客单价可提升50%，但必须明示概率和保底机制。集章抽奖是低风险替代方案',
        options: this.buildOptions('blindbox', [
          { id: 'bl-a', label: '潮玩盲盒机', description: '合规版盲盒机(明示概率·保底机制)', pros: ['客单价高', '复购强'], cons: ['合规要求', '投入成本'], estimatedEffect: '预计月收入+25%' },
          { id: 'bl-b', label: '集章抽奖活动', description: '消费集章兑换抽奖机会', pros: ['无合规风险', '粘性强'], cons: ['效果慢', '奖品成本'], estimatedEffect: '预计月收入+18%' },
          { id: 'bl-c', label: '幸运转盘', description: '消费满额转盘抽奖', pros: ['参与率高', '成本可控'], cons: ['效果递减', '需创新'], estimatedEffect: '预计月收入+15%' },
        ]),
      },
    ]

    if (category) return choices.filter(c => c.category === category)
    return choices
  }

  // ─── 3. 竞争监控 (异步采集) ─────────────────────────

  async monitorCompetitor(city?: string, mode?: ScanMode): Promise<MonitorScanResult> {
    const scanMode: ScanMode = mode ?? 'incremental'
    const scanTimestamp = new Date().toISOString()

    let rawAlerts: CompetitorAlert[]
    if (scanMode === 'full') {
      rawAlerts = await this.collector.fullScan(city)
    } else {
      rawAlerts = await this.collector.incrementalScan(city)
    }

    // 去重
    const dedupedAlerts = this.collector.deduplicate(rawAlerts)
    const trend = await this.collector.generateTrend()

    // 缓存
    this.lastScanResult = {
      alerts: dedupedAlerts,
      scanTimestamp,
      freshnessMinutes: 0,
      scanMode,
      trend,
    }

    return this.lastScanResult
  }

  async getLatestScanResult(): Promise<MonitorScanResult> {
    if (this.lastScanResult) {
      const elapsed = Date.now() - new Date(this.lastScanResult.scanTimestamp).getTime()
      return {
        ...this.lastScanResult,
        freshnessMinutes: Math.round(elapsed / 60000),
      }
    }

    // 无缓存时执行一次采集
    return this.monitorCompetitor()
  }

  async triggerIncrementalScan(city?: string): Promise<MonitorScanResult> {
    return this.monitorCompetitor(city, 'incremental')
  }

  async triggerFullScan(city?: string): Promise<MonitorScanResult> {
    return this.monitorCompetitor(city, 'full')
  }

  // ─── 私有方法: 为选项注入数据佐证 ─────────────────────



  // ════════════════════════════════════════════════════════
  // 12. 全周期运营方案 (V23 场景G)
  // ════════════════════════════════════════════════════════

  /**
   * 全周期运营方案 — 早期/成长期/成熟期/焕新期
   * 响应 POST /intelligence/operations-plan
   */
  generateOperationsPlan(input: OperationsPlanInput): OperationsPlanOutput {
    const { storeId, stage } = input
    const stageNameMap: Record<StoreStage, string> = { early: '开业初期', growth: '快速成长期', mature: '成熟运营期', renewal: '转型升级焕新期' }
    const durationMap: Record<StoreStage, string> = { early: '1-3个月', growth: '3-12个月', mature: '1-3年', renewal: '3年以上' }
    const baseStageData = this.getStageData(stage)
    return { storeId, stage, stageName: stageNameMap[stage], duration: durationMap[stage], ...baseStageData }
  }

  private getStageData(stage: StoreStage) {
    switch (stage) {
      case 'early': return this.buildEarlyStage()
      case 'growth': return this.buildGrowthStage()
      case 'mature': return this.buildMatureStage()
      case 'renewal': return this.buildRenewalStage()
    }
  }

  private buildEarlyStage() {
    return {
      keyPoints: [
        { area: '开业活动', content: '策划开业促销活动，包括开业优惠券、免费体验日、开业抽奖等，吸引首波客流', priority: 'high' as const },
        { area: '定价策略', content: '采用渗透定价策略，开业期价格较同城竞品低10-15%，快速积累用户', priority: 'high' as const },
        { area: '设备调试', content: '全面调试所有设备确保运行稳定，建立设备巡检制度和维护日志', priority: 'high' as const },
        { area: '团队培训', content: '完成全体店员岗前培训，包括服务流程、设备操作、安全规范和应急处置', priority: 'high' as const },
        { area: '线上入驻', content: '完成抖音/美团/大众点评等平台入驻，上架团购套餐，积累初始评价', priority: 'medium' as const },
        { area: '会员体系', content: '搭建基础会员体系，设置开业专享入会福利，快速积累种子会员', priority: 'medium' as const },
        { area: '供应链', content: '确认所有耗材供应商，建立补货周期和最低库存预警', priority: 'medium' as const },
        { area: '数据基线', content: '确立运营数据指标体系（客单价/翻台率/坪效/获客成本），建立日报机制', priority: 'medium' as const },
      ],
      pricingStrategy: '渗透定价策略。开业期间价格较同城竞品低10-15%，快速获取市场份额。建议推出¥49体验套餐(原价¥69)、¥89双人畅玩(原价¥128)，限定前1000份。开业第二个月逐步恢复至正常价位，涨幅控制在5-10%以内。',
      activityRhythm: [
        '第1周: "开业大酬宾"全场体验价5折，限时7天',
        '第2周: "会员日"首月限定，入会即享首单5折',
        '第3周: "挑战赛"开幕，投篮/跳舞机积分赛周冠军奖',
        '第4周: "邻里联欢"周边社区亲子邀请活动',
      ],
      competitorContingencies: [
        { scenario: '竞品同步降价', response: '观察1周，若竞品降价后无明显提客，维持原策略；若客源流失>15%，推出差异化套餐应对', triggerCondition: '竞品降价幅度>15%且持续3天以上' },
        { scenario: '竞品同期开业', response: '加大开业活动力度，增加免费体验时段，联合周边商铺做联动活动', triggerCondition: '同区域1km内有新竞品开业' },
        { scenario: '平台评价差评增多', response: '48小时内回复评价，针对差评内容制定改进措施并公开展示改善结果', triggerCondition: '24小时内新增差评超过3条' },
      ],
      riskWarnings: [
        '⚠️ 开业初期客流波动大，需准备足够的运营资金缓冲（建议预留3个月运营费用）',
        '⚠️ 设备磨合期故障率高，建议与设备供应商签订快速响应维修协议',
        '⚠️ 新员工流失风险，建议设置3个月试用期激励机制',
        '⚠️ 开业热度消退后可能出现客流骤降，需提前策划第二波引流活动',
      ],
      milestones: ['M1: 开业首月累计到店人次达到区域目标', 'M2: 开业第二月实现日均营收平衡', 'M3: 完成首批设备维保和员工转正考核'],
    }
  }

  private buildGrowthStage() {
    return {
      keyPoints: [
        { area: '营销节奏', content: '建立月度营销日历，每月至少1场主题活动+2场限时促销，保持市场热度', priority: 'high' as const },
        { area: '会员拉新', content: '会员增长率目标月均20%+，推出推荐有礼、储值赠金等拉新机制', priority: 'high' as const },
        { area: '竞品应对', content: '建立竞品定期跟踪机制（双周报），重点监测价格/活动/评价变化', priority: 'high' as const },
        { area: '数据分析', content: '建立周度运营分析会议，核心指标: 客单价/翻台率/坪效/获客成本/回购率', priority: 'high' as const },
        { area: '口碑运营', content: '引导好评率>95%，每月产出2-3条优质UGC内容（抖音/小红书）', priority: 'medium' as const },
        { area: '异业合作', content: '建立3-5个异业合作关系（餐饮/影院/教育），交叉引流', priority: 'medium' as const },
        { area: '团队优化', content: '根据实际运营数据优化排班制度，完善绩效考核体系', priority: 'medium' as const },
        { area: '设备监控', content: '建立设备生命周期管理，高频率设备提前预估更换周期', priority: 'medium' as const },
      ],
      pricingStrategy: '竞争导向定价+动态调价。根据同城竞品价格走势调整自身定价，保持在市场中位水平±10%。推出会员专属价格（会员价减免15-20%），增强会员粘性。周末/节假日实施高峰溢价（+15%），工作日推出平峰优惠（-10%）。',
      activityRhythm: [
        '第1月: "春游季"亲子畅玩套票促销',
        '第2月: "五一黄金周"限时狂欢活动',
        '第3月: "会员月"积分翻倍+专属活动',
        '第4月: "暑期畅玩卡"预售（学生限定）',
        '第5月: "暑期狂欢季"每周主题活动',
        '第6月: "七夕情侣"双人特惠套餐',
        '第7月: "开学季"学生返校优惠',
        '第8月: "中秋国庆"双节联动活动',
        '第9月: "万圣节"主题变装派对',
      ],
      competitorContingencies: [
        { scenario: '竞品发起价格战', response: '不跟进降价，增加增值服务（赠送饮品/游戏币）维持价值感知', triggerCondition: '3家以上竞品同时降价>15%' },
        { scenario: '竞品推出爆款活动', response: '对标分析活动类型，1周内推出差异化竞品活动进行回应', triggerCondition: '竞品活动获客增长>30%' },
        { scenario: '竞品设备大更新', response: '评估自身设备竞争力，制定分阶段更新计划，优先更新高坪效设备', triggerCondition: '竞品更新设备超过3台且为引流类型' },
      ],
      riskWarnings: [
        '⚠️ 增长期容易出现盲目扩张，建议根据坪效数据理性决策',
        '⚠️ 会员增长可能导致服务品质下降，需同步增加服务人员配置',
        '⚠️ 竞品跟进效仿活动方案，需保持创新领先半个月以上',
        '⚠️ 设备高频率运转导致故障率上升，备件库存需充足',
      ],
      milestones: ['M1: 月均营业额达到开业期2倍', 'M2: 会员数突破2000人', 'M3: 12个月累计投资回收率达到80%'],
    }
  }

  private buildMatureStage() {
    return {
      keyPoints: [
        { area: '设备更新', content: '制定年度设备更新计划，重点淘汰低坪效设备、引入高毛利新型设备', priority: 'high' as const },
        { area: '会员深耕', content: '启动会员分层运营（普通/银卡/金卡/钻石），差异化权益设计，提升ARPU值', priority: 'high' as const },
        { area: '活动升级', content: '从常规促销升级为主题IP活动，引入跨界联名、KOL合作等深度营销', priority: 'high' as const },
        { area: '降本增效', content: '全面成本分析，优化人员编制、能耗管理、耗材采购，目标综合成本下降10-15%', priority: 'high' as const },
        { area: '数据驱动', content: '建立经营决策数据看板，使用AI分析预测客流/营收趋势', priority: 'medium' as const },
        { area: '产品创新', content: '定期引入新游戏/新玩法，保持新鲜感，目标每季度至少2款新设备/新项目', priority: 'medium' as const },
        { area: '口碑壁垒', content: '打造区域口碑标杆，目标好评率>98%，成为同品类首选门店', priority: 'medium' as const },
        { area: '人才储备', content: '建立店长/主管梯队培养体系，为新增门店储备管理人才', priority: 'medium' as const },
      ],
      pricingStrategy: '价值定价策略。成熟期品牌力已形成，定价可参考同城高端竞品，保持在市场中位偏上水平（+10-15%）。推出年卡/季卡等长周期产品锁定高频客户。商务团体/企业团建等场景差异化定价。',
      activityRhythm: [
        'Q1: 新年开门红 + 春节主题月 + 会员专属答谢会',
        'Q2: 春季IP联名活动 + 五一限定 + 周年庆大促',
        'Q3: 暑期嘉年华 + 七夕企划 + 开学季预热',
        'Q4: 中秋国庆双节联动 + 圣诞季 + 年终会员盛典',
      ],
      competitorContingencies: [
        { scenario: '新竞品入市（资本推动型）', response: '发挥老店运营效率优势，通过精细化运营构建壁垒，不参与烧钱竞争', triggerCondition: '区域新增资本驱动型竞品且预算超自身2倍以上' },
        { scenario: '竞品大规模装修翻新', response: '评估竞品翻新后客单价提升情况，2个月内完成针对性的差异升级', triggerCondition: '竞品闭店装修时长>2周或投入>100万' },
        { scenario: '市场整体下行', response: '启动降本方案，减少非必要营销支出，重点服务高价值客户', triggerCondition: '连续3个月区域客流同比下降>20%' },
      ],
      riskWarnings: [
        '⚠️ 运营固定思维导致创新不足，建议定期进行"竞品盲测"保持对标',
        '⚠️ 设备老化导致客诉增加，建议建立设备健康度评分体系',
        '⚠️ 核心员工流失风险，建议设计合理的利润分享和晋升通道',
        '⚠️ 商圈流量自然衰退，建议提前6个月评估商圈生命周期',
      ],
      milestones: ['M1: 年营收保持年均增长10%+', 'M2: 会员ARPU值较上年提升15%+', 'M3: 综合运营成本较上年下降10%+'],
    }
  }

  private buildRenewalStage() {
    return {
      keyPoints: [
        { area: '重新装修', content: '全店翻新升级，融入最新设计风格，更新VI形象，打造网红打卡场景', priority: 'high' as const },
        { area: '设备换代', content: '全面淘汰老旧设备，引入主流新设备包括VR2.0/全息投影/元宇宙互动等', priority: 'high' as const },
        { area: '品牌升级', content: '品牌定位升级，从传统游乐厅升级为数字娱乐体验中心，重塑品牌故事', priority: 'high' as const },
        { area: '模式创新', content: '探索新经营模式，会员订阅制、娱乐加餐饮、赛事运营、直播电商等', priority: 'high' as const },
        { area: '数字化升级', content: '引入AI运营分析、智能排班、自动营销等数字化工具，提升管理效率', priority: 'medium' as const },
        { area: '用户研究', content: '开展大规模用户调研，洞察新一代消费需求变化，指导产品创新方向', priority: 'medium' as const },
        { area: '私域运营', content: '建设私域流量池，企业微信、社群、小程序，实现精准触达和运营', priority: 'medium' as const },
        { area: '跨界创新', content: '探索游乐加X跨界模式（加咖啡、酒吧、电竞、教育、文创），构建第二增长曲线', priority: 'medium' as const },
      ],
      pricingStrategy: '品牌溢价策略。焕新后品牌定位升级，定价可提升至同城TOP水平加20-30%。引入会员订阅制月卡季卡年卡，锁定长期价值。探索体验式定价，利用新设备体验感支撑高客单价。',
      activityRhythm: [
        '开业期: 焕新开业的"重装庆典"系列活动，1个月预热加2周高潮加1个月延续',
        '升级期: 新设备体验日加IP首发联动加KOL矩阵式传播，2个月',
        '稳固期: 会员回馈月加体验官招募计划加品牌故事传播，1个月',
        '持续期: 常规运营加持续创新，月度新品发布会、季度主题活动',
      ],
      competitorContingencies: [
        { scenario: '竞品也在同期翻新', response: '突出差异化焕新主题，打城市首家概念标签，抢占消费者心智', triggerCondition: '同商圈竞品翻新重合期小于3个月' },
        { scenario: '焕新后初期客流不及预期', response: '启动老客回访加体验邀请计划，赠送老会员焕新体验券，口口相传', triggerCondition: '焕新开业首月客流低于预期的60%' },
        { scenario: '新设备运营不达预期', response: '快速调整设备组合，将低坪效新设备置换为高坪效验证设备', triggerCondition: '新设备上线3个月坪效低于预期的50%' },
      ],
      riskWarnings: [
        '焕新投入高，需确保投资回收期在18个月内',
        '装修期间停业造成老客流失，提前1个月做唤醒营销',
        '设备选型失误风险，建议分批采购、小批量试运行',
        '市场定位变化可能失去部分老客群，需平衡升级与延续',
      ],
      milestones: ['M1: 焕新后6个月内回收投资', 'M2: 焕新后品牌认知度提升50%+', 'M3: 新设备年坪效提升30%+'],
    }
  }

  // ════════════════════════════════════════════════════════
  // 13. 数据底座整合 (V23 场景H)
  // ════════════════════════════════════════════════════════

  /**
   * 侦察兵数据到知识库同步
   * 把当前竞争态势摘要写入知识库可检索格式
   * 响应 POST /intelligence/sync-knowledge
   */
  async syncKnowledge(): Promise<SyncKnowledgeResult> {
    const scanResult = await this.collector.incrementalScan()
    const alerts = this.collector.deduplicate(scanResult)
    const scoutDataCount = alerts.length

    const citySummary = new Map()
    for (const alert of alerts) {
      if (!citySummary.has(alert.city)) {
        citySummary.set(alert.city, { priceChanges: 0, newActivities: 0, promotions: 0, ratingsChanges: 0 })
      }
      const s = citySummary.get(alert.city)
      if (alert.type === 'price_change') s.priceChanges++
      else if (alert.type === 'new_activity') s.newActivities++
      else if (alert.type === 'new_promotion') s.promotions++
      else if (alert.type === 'rating_change') s.ratingsChanges++
    }

    const now = new Date().toISOString().slice(0, 10)
    let entries = 0

    for (const [city, data] of citySummary) {
      const parts = []
      if (data.priceChanges > 0) parts.push(data.priceChanges + '家竞品价格异动')
      if (data.newActivities > 0) parts.push(data.newActivities + '家竞品推出新活动')
      if (data.promotions > 0) parts.push(data.promotions + '家竞品推出促销')
      if (data.ratingsChanges > 0) parts.push(data.ratingsChanges + '家竞品评分变化')
      if (parts.length > 0) {
        try {
          await this.empowerCardService.create({
            tag: '竞品分析',
            summary: '[' + now + '] ' + city + '竞争态势: ' + parts.join('，') + '。数据来源: 侦察兵同城扫描。',
            source: '侦察兵自动扫描',
            moduleMapping: 'intelligence.scout',
          })
          entries++
        } catch (err: any) {
          this.logger.warn('知识卡片创建失败(city=' + city + '): ' + err.message)
        }
      }
    }
    if (entries === 0) {
      try {
        await this.empowerCardService.create({
          tag: '运营状态',
          summary: '[' + now + '] 侦察兵扫描完成，当前区域竞争态势平稳，未检测到显著异动。',
          source: '侦察兵自动扫描',
          moduleMapping: 'intelligence.scout',
        })
        entries = 1
      } catch {}
    }
    return { synced: true, scoutDataCount, knowledgeEntriesCreated: entries, timestamp: new Date().toISOString() }
  }

  /**
   * 数据底座汇总
   * 响应 GET /intelligence/data-base/summary
   */
  async getDataBaseSummary(): Promise<DataBaseSummary> {
    const coveredCities = Object.keys(this.COMPETITOR_DENSITY).filter(k => k !== 'default').map(k => k.split('-')[0])
    const uniqueCities = [...new Set(coveredCities)]
    const totalVenueCount = Object.entries(this.COMPETITOR_DENSITY).filter(([k]) => k !== 'default').reduce((sum, [, v]) => sum + v.count, 0)
    const dimensionCoverage = ['竞品数量与密度', '竞品价格分布', '竞品评分走势', '竞品活动监测', '竞品设备更新监测', '同城租金基准', '人流量预估', '商圈成熟度评估']
    const lastScan = this.lastScanResult
    const lastFullSync = lastScan ? lastScan.scanTimestamp : null
    const lastIncrementalSync = new Date().toISOString()
    let knowledgeEntries = 0
    try {
      const cards = await this.empowerCardService.list(0)
      knowledgeEntries = cards.length
    } catch {}
    const coverageByCity: Record<string, { venueCount: number; avgFreshness: number }> = {}
    for (const city of uniqueCities) {
      const cityEntries = Object.entries(this.COMPETITOR_DENSITY).filter(([k]) => k.startsWith(city) && k !== 'default')
      coverageByCity[city] = { venueCount: cityEntries.reduce((s, [, v]) => s + v.count, 0), avgFreshness: 90 }
    }
    const freshness = lastScan
      ? (Date.now() - new Date(lastScan.scanTimestamp).getTime()) < 86400000 ? 'fresh'
        : (Date.now() - new Date(lastScan.scanTimestamp).getTime()) < 604800000 ? 'stale' : 'outdated'
      : 'stale'
    return {
      venueCount: totalVenueCount,
      dimensionCoverage,
      updateStatus: { lastFullSync, lastIncrementalSync, overallFreshness: freshness },
      knowledgeBaseEntries: knowledgeEntries,
      coverageByCity,
    }
  }

  private buildOptions(category: string, baseOptions: AdviceOption[]): AdviceOption[] {
    const evidences = this.aiService.getDataEvidence(category, baseOptions.length)
    return baseOptions.map((opt, idx) => ({
      ...opt,
      dataEvidence: evidences[idx] ?? '基于同城竞品数据分析的推荐方案',
    }))
  }
}
