/**
 * ai-push.entity.ts
 * AI 精准推送核心实体定义
 */

export type PushChannel = 'push' | 'sms' | 'email' | 'wechat' | 'app'
export type PushStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'clicked'
export type BehaviorSegment = 'newcomer' | 'active' | 'sleeping' | 'churned'
export type ValueSegment = 'high' | 'medium' | 'low' | 'rfm'
export type LifecycleSegment = 'newborn' | 'growth' | 'mature' | 'declining'

/**
 * 推送任务
 */
export interface PushTask {
  id: string
  title: string
  content: string
  channel: PushChannel
  targetMemberIds: string[]
  scheduledAt: number
  sentAt?: number
  status: PushStatus
  retryCount: number
  maxRetries: number
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

/**
 * 推送记录
 */
export interface PushRecord {
  id: string
  taskId: string
  memberId: string
  channel: PushChannel
  status: PushStatus
  sentAt?: number
  deliveredAt?: number
  clickedAt?: number
  error?: string
  createdAt: number
}

/**
 * 会员行为数据
 */
export interface MemberBehavior {
  memberId: string
  lastActiveAt: number
  purchaseCount: number
  totalSpent: number
  avgOrderValue: number
  sessionCount: number
  lastPurchaseAt: number
  churnDays: number
}

/**
 * 分群特征画像
 */
export interface SegmentProfile {
  segmentId: string
  segmentType: string
  description: string
  tags: string[]
  avgMetrics: {
    purchaseCount: number
    totalSpent: number
    activeDaysAgo: number
  }
}

/**
 * 最佳推送时段
 */
export interface OptimalTimeWindow {
  startHour: number
  endHour: number
  score: number
  channel: string
}

/**
 * A/B 实验配置
 */
export interface ExperimentConfig {
  id: string
  name: string
  description?: string
  variants: VariantConfig[]
  trafficSplit?: number
  startAt?: number
}

/**
 * A/B 实验变体
 */
export interface VariantConfig {
  name: string
  weight: number
  config: Record<string, unknown>
}

/**
 * A/B 实验结果
 */
export interface ExperimentResult {
  experimentId: string
  experimentName: string
  variants: VariantResult[]
  winner?: string
  confidence: number
  liftMap: Record<string, number>
  totalSamples: number
  isSignificant: boolean
}

/**
 * A/B 实验变体结果
 */
export interface VariantResult {
  name: string
  sampleCount: number
  conversionCount: number
  conversionRate: number
  avgValue: number
}

/**
 * A/B 实验分配记录
 */
export interface ABTestAssignment {
  memberId: string
  experimentId: string
  variantName: string
  config: Record<string, unknown>
  assignedAt: number
}

/**
 * 推送请求
 */
export interface PushRequest {
  title: string
  content: string
  channel: PushChannel
  segmentType: string
  segmentId: string
  targetMemberIds?: string[]
  scheduledAt?: number
}

/**
 * 推送统计
 */
export interface PushStats {
  totalTasks: number
  totalRecords: number
  sentCount: number
  deliveredCount: number
  clickedCount: number
  failedCount: number
  deliveryRate: number
  clickRate: number
}
