/**
 * 🐜 自动: [ai-push] [A] contract 补全
 *
 * AI 精准推送：跨模块合约类型
 * 定义 ai-push 模块对外暴露的稳定合约接口，
 * 供其他模块（member, loyalty, campaign, analytics 等）消费。
 */
import type {
  PushTask,
  PushRecord,
  PushStats,
  SegmentProfile,
  OptimalTimeWindow,
  ExperimentConfig,
  ExperimentResult,
  PushChannel,
  PushStatus,
  BehaviorSegment,
  ValueSegment,
  LifecycleSegment,
} from './ai-push.entity'

/**
 * 推送任务合约（跨模块安全子集）
 */
export interface PushTaskContract {
  id: string
  title: string
  content: string
  channel: PushChannel
  targetMemberCount: number
  status: PushStatus
  scheduledAt: number
  sentAt?: number
  createdAt: number
  metadata?: Record<string, unknown>
}

/**
 * 推送记录合约（跨模块安全子集）
 */
export interface PushRecordContract {
  id: string
  taskId: string
  memberId: string
  channel: PushChannel
  status: PushStatus
  sentAt?: number
  deliveredAt?: number
  clickedAt?: number
  createdAt: number
}

/**
 * 推送统计合约
 */
export interface PushStatsContract {
  totalTasks: number
  totalRecords: number
  sentCount: number
  deliveredCount: number
  clickedCount: number
  failedCount: number
  deliveryRate: number
  clickRate: number
}

/**
 * 行为分群合约
 */
export interface BehaviorSegmentContract {
  memberId: string
  segment: BehaviorSegment
  description: string
  activeDaysAgo: number
  purchaseCount: number
  totalSpent: number
}

/**
 * 价值分群合约
 */
export interface ValueSegmentContract {
  memberId: string
  segment: ValueSegment
  totalSpent: number
  percentileRank: number
}

/**
 * 生命周期分群合约
 */
export interface LifecycleSegmentContract {
  memberId: string
  segment: LifecycleSegment
  memberAgeDays: number
  purchaseFrequency: number
}

/**
 * 分群特征画像合约
 */
export interface SegmentProfileContract {
  segmentId: string
  segmentType: string
  description: string
  tags: string[]
  memberCount: number
  avgPurchaseCount: number
  avgTotalSpent: number
  avgActiveDaysAgo: number
}

/**
 * 最优推送时段合约
 */
export interface OptimalTimeWindowContract {
  startHour: number
  endHour: number
  score: number
  channel: string
}

/**
 * A/B 实验合约
 */
export interface ExperimentContract {
  id: string
  name: string
  description?: string
  variantCount: number
  trafficSplit: number
  startAt: number
  isRunning: boolean
}

/**
 * A/B 实验结果合约
 */
export interface ExperimentResultContract {
  experimentId: string
  experimentName: string
  winner?: string
  confidence: number
  liftMap: Record<string, number>
  totalSamples: number
  isSignificant: boolean
  variantResults: ExperimentVariantResultContract[]
}

/**
 * A/B 实验变体结果合约
 */
export interface ExperimentVariantResultContract {
  name: string
  sampleCount: number
  conversionCount: number
  conversionRate: number
  avgValue: number
}

/**
 * 推送请求合约（供其他模块发起推送用）
 */
export interface PushRequestContract {
  title: string
  content: string
  channel: PushChannel
  targetMemberIds: string[]
  segmentType?: string
  segmentId?: string
  scheduledAt?: number
}

// ── 转换函数 ──

/**
 * 将内部 PushTask 转换为跨模块合约
 */
export function toPushTaskContract(task: PushTask): PushTaskContract {
  return {
    id: task.id,
    title: task.title,
    content: task.content,
    channel: task.channel,
    targetMemberCount: task.targetMemberIds.length,
    status: task.status,
    scheduledAt: task.scheduledAt,
    sentAt: task.sentAt,
    createdAt: task.createdAt,
    metadata: task.metadata,
  }
}

/**
 * 将内部 PushRecord 转换为跨模块合约
 */
export function toPushRecordContract(record: PushRecord): PushRecordContract {
  return {
    id: record.id,
    taskId: record.taskId,
    memberId: record.memberId,
    channel: record.channel,
    status: record.status,
    sentAt: record.sentAt,
    deliveredAt: record.deliveredAt,
    clickedAt: record.clickedAt,
    createdAt: record.createdAt,
  }
}

/**
 * 将内部 PushStats 转换为跨模块合约
 */
export function toPushStatsContract(stats: PushStats): PushStatsContract {
  return {
    totalTasks: stats.totalTasks,
    totalRecords: stats.totalRecords,
    sentCount: stats.sentCount,
    deliveredCount: stats.deliveredCount,
    clickedCount: stats.clickedCount,
    failedCount: stats.failedCount,
    deliveryRate: stats.deliveryRate,
    clickRate: stats.clickRate,
  }
}

/**
 * 将内部 ExperimentResult 转换为跨模块合约
 */
export function toExperimentResultContract(result: ExperimentResult): ExperimentResultContract {
  return {
    experimentId: result.experimentId,
    experimentName: result.experimentName,
    winner: result.winner,
    confidence: result.confidence,
    liftMap: result.liftMap,
    totalSamples: result.totalSamples,
    isSignificant: result.isSignificant,
    variantResults: result.variants.map(v => ({
      name: v.name,
      sampleCount: v.sampleCount,
      conversionCount: v.conversionCount,
      conversionRate: v.conversionRate,
      avgValue: v.avgValue,
    })),
  }
}

/**
 * 将内部 SegmentProfile 转换为跨模块合约
 */
export function toSegmentProfileContract(profile: SegmentProfile): SegmentProfileContract {
  return {
    segmentId: profile.segmentId,
    segmentType: profile.segmentType,
    description: profile.description,
    tags: profile.tags,
    memberCount: 0, // 由调用方补充
    avgPurchaseCount: profile.avgMetrics.purchaseCount,
    avgTotalSpent: profile.avgMetrics.totalSpent,
    avgActiveDaysAgo: profile.avgMetrics.activeDaysAgo,
  }
}

/**
 * 将 OptimalTimeWindow 转换为跨模块合约
 */
export function toOptimalTimeWindowContract(window: OptimalTimeWindow): OptimalTimeWindowContract {
  return {
    startHour: window.startHour,
    endHour: window.endHour,
    score: window.score,
    channel: window.channel,
  }
}
