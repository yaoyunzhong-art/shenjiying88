/**
 * intelligence.entity.ts — 运营参谋数据类型 (P-50 V2)
 */

/** 装修档次: luxury=豪华, standard=标准, economy=经济 */
export type RenovationTier = 'luxury' | 'standard' | 'economy'
/** 中文装修档次映射，用于财务全景表 */
export type RenovationTierZh = '豪华' | '精装' | '标准' | '经济'

export interface FeasibilityReport {
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

export type AdviceCategory =
  | 'pricing'
  | 'activity'
  | 'equipment'
  | 'promotion'
  | 'recruit'
  | 'seasonal'
  | 'blindbox'

export interface AdviceOption {
  id: string
  label: string
  description: string
  pros: string[]
  cons: string[]
  estimatedEffect: string
  /** 数据佐证: 基于同城竞品数据的推理支撑 */
  dataEvidence?: string
}

export interface OperationAdviceChoice {
  id: string
  question: string
  category: AdviceCategory
  options: AdviceOption[]
  aiSuggestion: string
}

export type CompetitorAlertType = 'price_change' | 'new_activity' | 'new_promotion' | 'rating_change' | 'equipment_change' | 'policy_change'

export type AlertSeverity = 'high' | 'medium' | 'low'

export type ScanMode = 'incremental' | 'full'

export interface TrendPoint {
  date: string
  type: CompetitorAlertType
  count: number
}

export interface CompetitorAlert {
  id: string
  storeName: string
  city: string
  type: CompetitorAlertType
  severity: AlertSeverity
  description: string
  detectedAt: string
  recommendedAction: string
  /** 采集模式 */
  scanMode?: ScanMode
  /** 是否已被去重 */
  deduped?: boolean
}

export interface MonitorScanResult {
  alerts: CompetitorAlert[]
  scanTimestamp: string
  freshnessMinutes: number
  scanMode: ScanMode
  trend: TrendPoint[]
}

/** 活动建议（intelligence AI 引擎产出） */
export interface ActivityAdvice {
  name: string
  description: string
  expectedGrowthPercent: number
  riskLevel: 'low' | 'medium' | 'high'
  referencedCards: number
}

/** 定价建议内部统计 */
export interface PricingStats {
  city: string
  competitorCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  tierDistribution: Record<string, number>
}

/** 店铺基本数据 */
export interface StoreBasicData {
  id: string
  name: string
  city: string
  district: string
  tier: string
  currentPrice: number
  monthlyRevenue: number
  visitorCount: number
}

/** 赋能卡片（知识匹配用，简化版） */
export interface EmpowerCard {
  id: string
  tag: string
  summary: string
  source: string
  freshnessScore: number
  moduleMapping: string | null
  confidence: number
}

// ─── 4. 财务全景表 (P-50 V2) ────────────────────────

/** 装修档次单价映射（元/㎡） */
export const RENOVATION_PRICE_MAP: Record<RenovationTierZh, number> = {
  '豪华': 3500,
  '精装': 2000,
  '标准': 1200,
  '经济': 600,
}

/** 首期投入 */
export interface InitialInvestment {
  equipmentCost: number      // 设备成本
  renovationCost: number     // 装修成本
  softwareSystemCost: number // 系统软件
  deposit: number            // 押金(3个月租金)
  total: number              // 合计
}

/** 月固定成本 */
export interface MonthlyFixedCost {
  rent: number               // 租金
  labor: number              // 人力
  equipmentMaintenance: number // 设备维护(年10%/12)
  systemSubscription: number   // 系统订阅
  total: number              // 合计
}

/** 月变动成本 */
export interface MonthlyVariableCost {
  electricity: number        // 电费
  consumables: number        // 耗材(营收2-3%)
  marketing: number          // 营销推广(营收5%)
  total: number              // 合计
}

/** 预估营收 */
export interface RevenueEstimate {
  avgTicketPrice: number        // 预估客单价
  estimatedDailyTraffic: number  // 预估日客流
  estimatedMonthlyRevenue: number // 预估月营收
  estimatedMonthlyProfit: number  // 预估月利润
}

/** 同城平均值对比 */
export interface CityAvgComparison {
  initialInvestment: number
  monthlyFixedCost: number
  monthlyRevenue: number
  paybackMonths: number
}

/** 装修全景报告（完整版 P-50 V2） */
// ════════════════════════════════════════════════════
// 5. 新店规划 (V23 全场景赋能)
// ════════════════════════════════════════════════════

/** 新店规划输入 */
export interface StorePlanningInput {
  city: string
  district: string
  budget: number
  area: number
  tier: 'economy' | 'standard' | 'deluxe' | 'luxury'
}

/** 评级标签 */
export type PlanningGrade = '非常适合' | '可考虑' | '不建议'

/** 竞争密度等级 */
export type DensityLevel = '高' | '中' | '低'

/** 竞争分析 */
export interface CompetitionAnalysis {
  totalCompetitors: number
  districtDistribution: Record<string, number>
  avgTicketPrice: number
  densityLevel: DensityLevel
  topCompetitors: string[]
}

/** 财务全景表 (新店规划版) */
export interface FinancialOverview {
  initialInvestment: {
    equipment: number
    renovation: number
    systemSoftware: number
    deposit: number
    total: number
  }
  monthlyFixedCost: {
    rent: number
    labor: number
    maintenance: number
    saas: number
    total: number
  }
  monthlyVariableCost: {
    electricity: number
    consumables: number
    marketing: number
    total: number
  }
  estimatedMonthlyRevenue: number
  estimatedMonthlyProfit: number
  paybackMonths: number
}

/** 设备建议项 */
export interface EquipmentSuggestion {
  name: string
  count: number
  unitPrice: number
  totalPrice: number
  supplier: string
  warrantyMonths: number
  monthlyMaintenance: number
}

/** 风险因素 */
export interface RiskFactorItem {
  factor: string
  level: 'high' | 'medium' | 'low'
  suggestion: string
}

/** 新店规划输出 */
export interface StorePlanningOutput {
  city: string
  district: string
  score: number
  confidenceInterval: { low: number; high: number }
  grade: PlanningGrade
  competition: CompetitionAnalysis
  financialOverview: FinancialOverview
  equipmentSuggestions: EquipmentSuggestion[]
  renovationEstimate: {
    baseRenovation: number
    themedDesign: number
    furnitureDecor: number
    fireSafetyApproval: number
    total: number
  }
  riskFactors: RiskFactorItem[]
  aiSummary: string
}

// ════════════════════════════════════════════════════
// 6. 设备选型推荐 (V23 全场景赋能)
// ════════════════════════════════════════════════════

export interface DeviceRecommendationInput {
  budget: number
  area: number
  tier: 'economy' | 'standard' | 'deluxe' | 'luxury'
  city: string
  storeType: 'arcade' | 'family' | 'esports' | 'mixed'
}

/** 推荐设备详情 */
export interface RecommendedDevice {
  brand: string
  model: string
  category: string
  count: number
  unitPrice: number
  totalPrice: number
  supplier: string
  supplierQualified: boolean
  warrantyMonths: number
  monthlyMaintenanceFee: number
  reason: string
}

/** 设备推荐输出 */
export interface DeviceRecommendationOutput {
  budget: number
  area: number
  tier: string
  city: string
  storeType: string
  devices: RecommendedDevice[]
  totalCost: number
  remainingBudget: number
  budgetUtilizationPercent: number
  notes: string[]
}

// ════════════════════════════════════════════════════
// 7. 装修方案 (V23 全场景赋能)
// ════════════════════════════════════════════════════

export interface RenovationPlanInput {
  area: number
  tier: 'economy' | 'standard' | 'deluxe' | 'luxury'
  city: string
  style?: 'modern' | 'cyberpunk' | 'retro' | 'minimalist' | 'nature'
}

/** 装修分项 */
export interface RenovationItem {
  category: string
  amount: number
  percent: number
  detail: string
}

/** 档次适配建议 */
export interface TierAdaptationAdvice {
  currentTier: string
  upgrades: { name: string; cost: number; benefit: string }[]
}

/** 装修方案输出 */
export interface RenovationPlanOutput {
  area: number
  tier: string
  city: string
  style: string
  items: RenovationItem[]
  subTotal: number
  tierAdvice: TierAdaptationAdvice
  // 按档次拆分
  economyPlan: RenovationItem[] | null
  standardPlan: RenovationItem[] | null
  deluxePlan: RenovationItem[] | null
  luxuryPlan: RenovationItem[] | null
  recommendations: string[]
}

// ════════════════════════════════════════════════════
// 8. 选址评估增强 (V23 全场景赋能 · 场景A)
// ════════════════════════════════════════════════════

/** 选址评估增强输出 — 带置信区间、风险因素、数据来源免责声明 */
export interface SitingAssessmentOutput {
  city: string
  district: string
  overallScore: number
  /** 置信区间 (基于样本量) */
  confidenceInterval: { low: number; high: number }
  grade: PlanningGrade
  competition: {
    totalCompetitors: number
    districtDistribution: Record<string, number>
    avgTicketPrice: number
    densityLevel: DensityLevel
  }
  riskFactors: SitingRiskFactor[]
  financialEstimate: {
    avgRent: number
    monthlyRevenue: number
    monthlyCost: number
    paybackMonths: number
  }
  suggestions: string[]
  /** 数据来源声明 */
  dataSource: {
    disclaimer: string
    freshness: string
    sourceType: string
  }
}

/** 选址评估风险因素 */
export interface SitingRiskFactor {
  factor: string
  level: 'high' | 'medium' | 'low'
  suggestion: string
}

// ════════════════════════════════════════════════════
// 9. 动态定价策略 (V23 全场景赋能)
// ════════════════════════════════════════════════════

export type PricingScenario = 'new_store' | 'competitor_change' | 'seasonal_adjustment'

export interface PricingStrategyInput {
  city: string
  district: string
  scenario: PricingScenario
  currentPrice?: number
  competitorNewPrice?: number
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
  storeTier?: 'low' | 'mid' | 'high'
}

/** 定价建议项 */
export interface PriceProposal {
  strategy: string
  description: string
  suggestedPrice: number
  priceRange: { min: number; max: number }
  expectedImpact: string
  pros: string[]
  cons: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

/** 定价策略输出 */
export interface PricingStrategyOutput {
  scenario: PricingScenario
  city: string
  district: string
  marketContext: {
    avgMarketPrice: number
    competitorCount: number
    priceRange: { min: number; max: number }
  }
  proposals: PriceProposal[]
  recommendedProposal: PriceProposal
}

// ════════════════════════════════════════════════════
// 10. 营销活动方案 (V23 全场景赋能 · 6大类)
// ════════════════════════════════════════════════════

export type CampaignType =
  | 'douyin_group'       // 抖音团购
  | 'weekend_tournament' // 周末比赛
  | 'member_day'         // 会员日
  | 'ip_collaboration'   // IP联名
  | 'summer_limited'     // 暑假限定
  | 'blindbox_lottery'   // 盲盒抽奖

export interface CampaignProposal {
  type: CampaignType
  name: string
  description: string
  pros: string[]
  cons: string[]
  estimatedEffect: string
  applicableScenarios: string[]
  costEstimate: number
}

export interface MarketingCampaignInput {
  city: string
  district: string
  budget?: number
  targetTypes?: CampaignType[]
}

export interface MarketingCampaignOutput {
  city: string
  district: string
  campaigns: CampaignProposal[]
  recommendedCampaign: CampaignProposal
}

// ════════════════════════════════════════════════════
// 11. 全周期运营管理 (V23 全场景赋能)
// ════════════════════════════════════════════════════

export type StoreStage = 'early' | 'growth' | 'mature' | 'renewal'

export interface OperationsPlanInput {
  storeId: string
  stage: StoreStage
}

/** 阶段运营要点 */
export interface StageOperationKeyPoint {
  area: string
  content: string
  priority: 'high' | 'medium' | 'low'
}

/** 竞品应对预案 */
export interface CompetitorContingency {
  scenario: string
  response: string
  triggerCondition: string
}

/** 运营方案输出 */
export interface OperationsPlanOutput {
  storeId: string
  stage: StoreStage
  stageName: string
  duration: string
  keyPoints: StageOperationKeyPoint[]
  pricingStrategy: string
  activityRhythm: string[]
  competitorContingencies: CompetitorContingency[]
  riskWarnings: string[]
  milestones: string[]
}

// ════════════════════════════════════════════════════
// 12. 数据底座 (V23 全场景赋能)
// ════════════════════════════════════════════════════

export interface DataBaseSummary {
  venueCount: number
  dimensionCoverage: string[]
  updateStatus: {
    lastFullSync: string | null
    lastIncrementalSync: string | null
    overallFreshness: 'fresh' | 'stale' | 'outdated'
  }
  knowledgeBaseEntries: number
  coverageByCity: Record<string, { venueCount: number; avgFreshness: number }>
}

export interface SyncKnowledgeResult {
  synced: boolean
  scoutDataCount: number
  knowledgeEntriesCreated: number
  timestamp: string
}

export interface FinancePanorama {
  // 输入参数
  budget: number
  area: number
  tier: RenovationTier
  city: string
  district: string

  // 首期投入
  initialInvestment: InitialInvestment

  // 月固定成本
  monthlyFixedCost: MonthlyFixedCost

  // 月变动成本
  monthlyVariableCost: MonthlyVariableCost

  // 月总成本
  monthlyTotalCost: number

  // 预估营收
  revenueEstimate: RevenueEstimate

  // 折旧与摊销
  monthlyDepreciation: number    // 设备折旧(3年)
  monthlyAmortization: number    // 装修摊销(5年)

  // 回收期
  paybackMonths: number           // 简单回收期(月)
  paybackWithDepreciation: number  // 含折旧摊销回收期

  // 同城对比
  cityAvgComparison: CityAvgComparison

  // 保留原有字段(兼容旧接口)
  renovationCostBreakdown: { category: string; amount: number; percent: number }[]
  equipmentCostBreakdown: { name: string; count: number; unitCost: number; total: number }[]
  totalCost: number
  monthlyOpEx: number
  projectedMonthlyRevenue: number
  projectedMonthlyProfit: number
  annualRevenueProjection: number
  breakEvenAnalysis: string
  recommendation: string
}
