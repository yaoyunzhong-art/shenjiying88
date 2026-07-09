/**
 * 🐜 自动: [ai-sales] [A] contract 补全
 *
 * AI Sales 导购副驾：跨模块合约类型
 * 定义 ai-sales 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-marketing, campaign, loyalty, member 等）消费。
 */
import type {
  ObjectionType,
  CustomerProfile,
  Product,
  SalesRecommendationResponse,
  ObjectionResponse,
  ConverseSimulationResponse,
  FollowUpCreatedResponse,
  FollowUpReminder,
  ScoredProduct,
  UpcomingBirthday,
  RecommendationContext,
} from './ai-sales.entity'

/**
 * 合约：商品推荐引擎接口
 */
export interface RecommendationEngineContract {
  recommendForCustomer(customerId: string, context: RecommendationContext): ScoredProduct[]
  recommendUpsell(productId: string): ScopedRecommendation[]
  recommendCrossSell(productId: string): ScopedRecommendation[]
  getProduct(id: string): ProductContract | undefined
  getAllProducts(): ProductContract[]
  recordPurchase(customerId: string, productId: string): void
}

/**
 * 合约：异议处理器接口
 */
export interface ObjectionHandlerContract {
  classifyObjection(customerReply: string): ObjectionType
  generateResponse(objectionType: ObjectionType, context: ObjectionContextContract): string
  simulateConversation(objection: string, response: string): ConversationSimulationContract[]
}

/**
 * 合约：跟进提醒调度器接口
 */
export interface FollowUpSchedulerContract {
  scheduleFollowUp(customerId: string, reminder: FollowUpInputContract): FollowUpReminderContract
  getDueFollowUps(salesId: string): FollowUpReminderContract[]
  getAllPending(salesId?: string): FollowUpReminderContract[]
  markCompleted(followUpId: string): FollowUpReminderContract | undefined
  getUpcomingBirthdays(daysAhead?: number): UpcomingBirthdayContract[]
  setCustomerBirthday(customerId: string, birthday: string): void
}

// ─── 数据合约类型（跨模块安全子集） ─────────────────

/**
 * 合约：商品（跨模块安全子集）
 */
export interface ProductContract {
  id: string
  name: string
  category: string
  price: number
  quality: 'low' | 'medium' | 'high' | 'premium'
  tags: string[]
  relatedCategories: string[]
}

/**
 * 合约：ScopedRecommendation（安全子集）
 */
export interface ScopedRecommendation {
  product: ProductContract
  score: number
  reason: string
}

/**
 * 合约：异议上下文
 */
export interface ObjectionContextContract {
  customerId: string
  productId: string
  conversationHistory: string[]
}

/**
 * 合约：对话模拟回合
 */
export interface ConversationSimulationContract {
  turn: number
  speaker: 'customer' | 'agent'
  message: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

/**
 * 合约：跟进提醒输入
 */
export interface FollowUpInputContract {
  customerId: string
  salesId: string
  type: 'birthday' | 'inactive' | 'price_alert' | 'reorder'
  scheduledAt: string
  message: string
}

/**
 * 合约：跟进提醒（安全子集）
 */
export interface FollowUpReminderContract {
  id: string
  customerId: string
  salesId: string
  type: 'birthday' | 'inactive' | 'price_alert' | 'reorder'
  scheduledAt: string
  message: string
  priority: number
  status: 'pending' | 'completed' | 'missed'
  createdAt: string
}

/**
 * 合约：即将到来的生日
 */
export interface UpcomingBirthdayContract {
  customerId: string
  daysUntil: number
}

/**
 * 合约：推荐请求
 */
export interface RecommendationRequestContract {
  customerId: string
  currentBrowsing?: string
  recentViewed: string[]
  scenario?: 'birthday' | 'festival' | 'casual'
}

/**
 * 合约：异议处理请求
 */
export interface ObjectionResponseRequestContract {
  customerId: string
  productId: string
  objectionType: ObjectionType
  conversationHistory: string[]
}

/**
 * 合约：跟进安排请求
 */
export interface ScheduleFollowUpRequestContract {
  customerId: string
  salesId: string
  type: 'birthday' | 'inactive' | 'price_alert' | 'reorder'
  scheduledAt: string
  message: string
}

// ─── 合约常量 ──────────────────────────────────────

/**
 * 合约：支持的异议类型列表
 */
export const SUPPORTED_OBJECTION_TYPES: ObjectionType[] = [
  'price',
  'quality',
  'competitor',
  'need',
]

/**
 * 合约：支持的跟进类型列表
 */
export const SUPPORTED_FOLLOWUP_TYPES: FollowUpReminder['type'][] = [
  'birthday',
  'inactive',
  'price_alert',
  'reorder',
]

/**
 * 合约：商品质量等级排序
 */
export const QUALITY_RANK: Record<Product['quality'], number> = {
  low: 1,
  medium: 2,
  high: 3,
  premium: 4,
}

/**
 * 合约：品类亲和度矩阵
 */
export const CATEGORY_AFFINITY: Record<string, Record<string, number>> = {
  skincare: { makeup: 0.8, beauty: 0.9 },
  makeup: { beauty: 0.7 },
  beauty: { skincare: 0.85 },
}
