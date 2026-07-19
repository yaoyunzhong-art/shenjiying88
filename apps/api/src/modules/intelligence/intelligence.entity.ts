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
