/**
 * AI Sales 导购副驾 - 实体定义
 */
export type ObjectionType = 'price' | 'quality' | 'competitor' | 'need'

export interface CustomerProfile {
  memberId: string
  purchaseHistory: string[]
  avgSpend: number
  preferences: string[]
  lifecycleStage: 'new' | 'active' | 'dormant' | 'churned'
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  quality: 'low' | 'medium' | 'high' | 'premium'
  tags: string[]
  relatedCategories: string[]
}

export interface RecommendationContext {
  currentBrowsing?: string
  recentViewed: string[]
  scenario?: 'birthday' | 'festival' | 'casual'
}

export interface ScoredProduct {
  product: Product
  score: number
  reason: string
}

export interface ObjectionContext {
  customerId: string
  productId: string
  conversationHistory: string[]
}

export interface ConversationSimulation {
  turn: number
  speaker: 'customer' | 'agent'
  message: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

export interface FollowUpReminder {
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

export interface UpcomingBirthday {
  customerId: string
  daysUntil: number
}

export interface RecommendationRequest {
  customerId: string
  currentBrowsing?: string
  recentViewed: string[]
  scenario?: 'birthday' | 'festival' | 'casual'
}

export interface UpsellRequest {
  productId: string
}

export interface CrossSellRequest {
  productId: string
}

export interface ObjectionClassifyRequest {
  customerReply: string
}

export interface ObjectionResponseRequest {
  customerId: string
  productId: string
  objectionType: ObjectionType
  conversationHistory: string[]
}

export interface SimulateConversationRequest {
  objection: string
  response: string
}

export interface ScheduleFollowUpRequest {
  customerId: string
  salesId: string
  type: 'birthday' | 'inactive' | 'price_alert' | 'reorder'
  scheduledAt: string
  message: string
}

export type RecommendationType = 'context-aware' | 'upsell' | 'cross-sell'

export interface SalesRecommendationResponse {
  type: RecommendationType
  recommendations: ScoredProduct[]
  context?: string
}

export interface ObjectionResponse {
  type: ObjectionType
  response: string
}

export interface ConverseSimulationResponse {
  turns: ConversationSimulation[]
  finalSentiment: 'positive' | 'neutral' | 'negative'
}

export interface FollowUpCreatedResponse {
  id: string
  message: string
  priority: number
  status: 'pending' | 'completed' | 'missed'
}
