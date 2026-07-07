/**
 * 灰度发布 - Entity (V9 需求 6 · V10 Day 8 Phase 92)
 *
 * 核心能力:
 * - 4 类灰度策略 (percentage/tenant/store/tag)
 * - 灰度状态机 (draft/active/paused/completed/rolled_back)
 * - 受众评估 + 自动晋级
 */

export type CanaryStrategy = 'percentage' | 'tenant' | 'store' | 'tag'

export type CanaryStatus = 'draft' | 'active' | 'paused' | 'completed' | 'rolled_back'

/** 灰度实验定义 */
export interface CanaryExperiment {
  id: string
  name: string
  description: string
  /** 实验 key (唯一, 用于代码引用) */
  flagKey: string
  strategy: CanaryStrategy
  /** 策略配置 */
  strategyConfig: CanaryStrategyConfig
  status: CanaryStatus
  /** 起始百分比 */
  initialPercentage: number
  /** 目标百分比 (晋级目标) */
  targetPercentage: number
  /** 当前百分比 */
  currentPercentage: number
  /** 起始时间 */
  startedAt?: string
  /** 结束时间 */
  endedAt?: string
  /** 自动晋级规则 */
  autoPromote?: AutoPromoteRule
  /** 健康阈值 (e.g. 错误率 < 1%) */
  healthThreshold?: number
  /** 创建者 */
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type CanaryStrategyConfig =
  | { type: 'percentage'; includeAll: boolean }
  | { type: 'tenant'; tenantIds: string[] }
  | { type: 'store'; storeIds: string[] }
  | { type: 'tag'; tags: string[]; matchAll?: boolean }

/** 自动晋级规则 */
export interface AutoPromoteRule {
  /** 每多少分钟检查一次 */
  checkIntervalMin: number
  /** 健康指标 (错误率/延迟/P95) */
  healthMetrics: ('error_rate' | 'latency_p95' | 'latency_avg')[]
  /** 升级步长 (e.g. 10% -> 25% -> 50% -> 100%) */
  promoteSteps: number[]
  /** 健康阈值 */
  healthThreshold: number
  /** 最大晋级次数 */
  maxPromotions: number
}

/** 灰度评估请求 */
export interface CanaryEvaluationRequest {
  flagKey: string
  tenantId: string
  storeId?: string
  tags?: string[]
}

/** 灰度评估响应 */
export interface CanaryEvaluationResponse {
  flagKey: string
  enabled: boolean
  matchedStrategy: CanaryStrategy | null
  experimentId?: string
  percentage?: number
  reason: string
}

/** 灰度健康快照 */
export interface CanaryHealthSnapshot {
  experimentId: string
  timestamp: string
  /** 错误率 */
  errorRate: number
  /** P95 延迟 (ms) */
  latencyP95: number
  /** 平均延迟 */
  latencyAvg: number
  /** 请求总数 */
  totalRequests: number
  /** 是否健康 */
  isHealthy: boolean
}

/** 灰度审计日志 */
export interface CanaryAuditLog {
  id: string
  experimentId: string
  action: 'create' | 'activate' | 'pause' | 'promote' | 'rollback' | 'complete'
  fromStatus?: CanaryStatus
  toStatus?: CanaryStatus
  fromPercentage?: number
  toPercentage?: number
  operator: string
  reason?: string
  timestamp: string
}
