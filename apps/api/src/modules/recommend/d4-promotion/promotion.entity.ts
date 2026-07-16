/**
 * V18 Day2 D4: Promotion Entity
 *
 * 推广引擎核心类型:
 *  - PromotionStrategy: 推广策略抽象 (策略模式)
 *  - PromotionContext: 推广上下文 (时间/用户/商品/店铺)
 *  - PromotionCandidate: 推广候选 (扩展自 Candidate)
 *  - ABTestConfig: A/B 测试配置
 *  - TimeWindow: 时段窗口定义
 *  - CrossStoreConfig: 跨店配置
 *  - PromotionResult: 推广执行结果
 */

import type { StrategyType } from '../recommend.entity'

// ============================================================
// 推广策略类型
// ============================================================

export type PromotionStrategyType =
  | 'ab-test-optimized'        // A/B 测试自动调优
  | 'time-boosted'             // 时段增强
  | 'cross-store-synergy'      // 跨店协同
  | 'holiday-special'          // 节假日特别
  | 'event-flash'              // 闪购事件

export type PromotionStatus = 'draft' | 'active' | 'paused' | 'expired'

// ============================================================
// 推广上下文
// ============================================================

export interface PromotionContext {
  // 时间
  currentDateTime: Date
  timezoneOffsetMinutes?: number

  // 用户
  memberId?: string
  memberStoreIds?: string[]        // 用户关联店铺
  memberPurchaseCategories?: string[]
  memberLifecycleStage?: string

  // 商品
  contextItemId?: string
  itemCategory?: string
  itemPriceCents?: number
  itemStoreId?: string

  // 店铺/租户
  tenantId: string
  storeId?: string                // 当前店铺
  chainStoreIds?: string[]        // 连锁店铺列表

  // A/B 测试
  abTestGroup?: 'control' | 'variant'

  // 推广参数
  promotionIds?: string[]         // 用户已命中的推广
}

// ============================================================
// 推广候选
// ============================================================

export interface PromotionCandidate {
  itemId: string
  score: number           // 0..1 推广增强后分数
  baseScore: number       // 原始推荐分数
  boostedScore: number    // 推广增加的分数
  strategy: PromotionStrategyType
  reasoning: string
  promotionId?: string
  promotionName?: string
  promotionDiscount?: number  // 折扣百分比 (0-100)
  promotionStartDate?: string
  promotionEndDate?: string
  storeId?: string
  metadata?: Record<string, unknown>
}

// ============================================================
// A/B 测试配置
// ============================================================

export interface ABTestConfig {
  experimentId: string
  name: string
  description: string
  control: {
    label: string
    params: Record<string, unknown>
  }
  variant: {
    label: string
    params: Record<string, unknown>
  }
  trafficSplit: number          // variant 流量百分比 (1-99, control = 100 - this)
  startDate: string
  endDate?: string
  status: ABTestStatus
  metrics: ABTestMetric[]
  minSampleSize: number
  confidenceLevel: number       // 0.95 = 95%
}

export type ABTestStatus = 'running' | 'paused' | 'completed' | 'cancelled'
export type ABTestWinner = 'control' | 'variant' | 'tie' | 'insufficient-data'

export interface ABTestMetric {
  name: string
  weight: number               // 综合评分权重 (总和1)
  higherIsBetter: boolean
  controlValue?: number
  variantValue?: number
  improvement?: number         // 提升百分比
  significant?: boolean
}

export interface ABTestSnapshot {
  experimentId: string
  controlExposures: number
  variantExposures: number
  controlConversions: number
  variantConversions: number
  controlRevenue: number
  variantRevenue: number
  metrics: ABTestMetric[]
  winner: ABTestWinner
  startedAt: string
  updatedAt: string
  recommendedParams: Record<string, unknown>  // 优胜组参数
}

// ============================================================
// 时段窗口
// ============================================================

export interface TimeWindow {
  name: string
  type: TimeWindowType
  priority: number             // 优先级 (高者优先)
  boostFactor: number          // 分数增强倍数
  daysOfWeek: number[]         // 0=Sun..6=Sat
  startHour: number            // 0-23
  endHour: number              // 0-23 (exclusive)
  months?: number[]            // 1-12 (可选)
  dates?: number[]             // 日 (1-31, 可选)
  timezone?: string
  metadata?: Record<string, unknown>
}

export type TimeWindowType =
  | 'weekday'          // 工作日档
  | 'weekend'          // 周末档
  | 'holiday'          // 节假日
  | 'special-event'    // 特别活动
  | 'flash-sale'       // 闪购
  | 'happy-hour'       // 开心时段

export interface TimeBoostResult {
  windows: TimeWindow[]
  totalBoostFactor: number
  activeWindowName: string | null
  isHoliday: boolean
  isWeekend: boolean
  isFlashSale: boolean
}

// ============================================================
// 跨店协同
// ============================================================

export interface CrossStoreConfig {
  storeId: string
  storeName: string
  storeRegion: string
  storeType: 'headquarters' | 'chain' | 'franchise'
  parentStoreId?: string
  inventorySharingEnabled: boolean
  synergyWeight: number           // 协同推荐权重 (0-1)
}

export interface CrossStoreProduct {
  itemId: string
  itemName: string
  storeId: string
  storeName: string
  category: string
  priceCents: number
  available: boolean
  crossStoreScore: number         // 跨店推荐分数
}

export interface CrossStoreRecommendation {
  candidate: CrossStoreProduct
  synergyReason: string
  boostFactor: number
}

// ============================================================
// 推广执行结果
// ============================================================

export interface PromotionResult {
  promotedCandidates: PromotionCandidate[]
  totalBaseScore: number          // 原始总分
  totalBoostedScore: number       // 增强后总分
  boostCount: number              // 增强商品数
  strategiesUsed: PromotionStrategyType[]
  abTestApplied: boolean
  abTestSnapshot?: ABTestSnapshot
  timeWindowApplied: boolean
  timeBoostResult?: TimeBoostResult
  crossStoreApplied: boolean
  crossStoreResults?: CrossStoreRecommendation[]
  executionMs: number
  generatedAt: string
}

// ============================================================
// 节假日日历
// ============================================================

export interface HolidayDefinition {
  name: string
  date: string                    // MM-DD 格式
  boostFactor: number
  priority: number
  categoryRelevance?: string[]    // 相关商品类目
  description: string
}

// ============================================================
// 默认常量
// ============================================================

export const DEFAULT_TIME_BOOST_FACTOR = 1.5
export const DEFAULT_HOLIDAY_BOOST_FACTOR = 2.0
export const DEFAULT_FLASH_SALE_BOOST_FACTOR = 3.0
export const DEFAULT_CROSS_STORE_BOOST_FACTOR = 1.3
export const DEFAULT_AB_TEST_TRAFFIC_SPLIT = 50
export const DEFAULT_AB_TEST_CONFIDENCE = 0.95
export const DEFAULT_AB_TEST_MIN_SAMPLE = 100

export const DEFAULT_HOLIDAYS: HolidayDefinition[] = [
  { name: '元旦', date: '01-01', boostFactor: 2.0, priority: 10, categoryRelevance: ['食品', '礼品'], description: '元旦促销' },
  { name: '春节', date: '02-10', boostFactor: 2.5, priority: 10, categoryRelevance: ['食品', '礼品', '服饰'], description: '春节大促' },
  { name: '情人节', date: '02-14', boostFactor: 1.8, priority: 8, categoryRelevance: ['礼品', '食品'], description: '情人节特惠' },
  { name: '妇女节', date: '03-08', boostFactor: 1.6, priority: 7, categoryRelevance: ['美妆', '服饰', '礼品'], description: '妇女节促销' },
  { name: '劳动节', date: '05-01', boostFactor: 1.8, priority: 8, categoryRelevance: ['食品', '饮料', '旅游'], description: '五一特惠' },
  { name: '端午节', date: '06-10', boostFactor: 1.8, priority: 8, categoryRelevance: ['食品'], description: '端午特卖' },
  { name: '中秋节', date: '09-17', boostFactor: 2.0, priority: 9, categoryRelevance: ['食品', '礼品'], description: '中秋团圆季' },
  { name: '国庆节', date: '10-01', boostFactor: 2.2, priority: 10, categoryRelevance: ['食品', '饮料', '旅游', '服饰'], description: '国庆大促' },
  { name: '双十一', date: '11-11', boostFactor: 3.0, priority: 10, categoryRelevance: ['食品', '饮料', '美妆', '服饰', '礼品'], description: '双十一狂欢' },
  { name: '双十二', date: '12-12', boostFactor: 2.5, priority: 10, categoryRelevance: ['食品', '服饰', '礼品'], description: '双十二年末特惠' },
  { name: '圣诞节', date: '12-25', boostFactor: 2.0, priority: 9, categoryRelevance: ['礼品', '食品'], description: '圣诞特惠' },
]

export const DEFAULT_TIME_WINDOWS: TimeWindow[] = [
  // 工作日早晚高峰
  { name: '早高峰', type: 'weekday', priority: 5, boostFactor: 1.3, daysOfWeek: [1, 2, 3, 4, 5], startHour: 7, endHour: 9 },
  { name: '午休', type: 'weekday', priority: 4, boostFactor: 1.2, daysOfWeek: [1, 2, 3, 4, 5], startHour: 11, endHour: 13 },
  { name: '晚高峰', type: 'weekday', priority: 6, boostFactor: 1.4, daysOfWeek: [1, 2, 3, 4, 5], startHour: 17, endHour: 21 },
  // 周末全天
  { name: '周末上午', type: 'weekend', priority: 5, boostFactor: 1.3, daysOfWeek: [0, 6], startHour: 8, endHour: 12 },
  { name: '周末下午', type: 'weekend', priority: 6, boostFactor: 1.4, daysOfWeek: [0, 6], startHour: 12, endHour: 18 },
  { name: '周末夜晚', type: 'weekend', priority: 4, boostFactor: 1.5, daysOfWeek: [0, 6], startHour: 18, endHour: 23 },
  // 开心时段
  { name: '开心时段', type: 'happy-hour', priority: 7, boostFactor: 1.6, daysOfWeek: [5], startHour: 16, endHour: 19 },
]
