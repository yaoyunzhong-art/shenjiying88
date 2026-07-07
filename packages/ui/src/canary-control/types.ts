/**
 * 灰度发布 - 类型 (V10 Day 8)
 */

export type CanaryStrategy = 'percentage' | 'tenant' | 'store' | 'tag'
export type CanaryStatus = 'draft' | 'active' | 'paused' | 'completed' | 'rolled_back'

export interface AutoPromoteRule {
  checkIntervalMin: number
  healthMetrics: ('error_rate' | 'latency_p95' | 'latency_avg')[]
  promoteSteps: number[]
  healthThreshold: number
  maxPromotions: number
}

export interface CanaryExperiment {
  id: string
  name: string
  description: string
  flagKey: string
  strategy: CanaryStrategy
  strategyConfig: any
  status: CanaryStatus
  initialPercentage: number
  targetPercentage: number
  currentPercentage: number
  startedAt?: string
  endedAt?: string
  autoPromote?: AutoPromoteRule
  healthThreshold?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CanaryHealthSnapshot {
  experimentId: string
  timestamp: string
  errorRate: number
  latencyP95: number
  latencyAvg: number
  totalRequests: number
  isHealthy: boolean
}

export const STATUS_LABELS: Record<CanaryStatus, string> = {
  draft: '草稿', active: '进行中', paused: '已暂停',
  completed: '已完成', rolled_back: '已回滚',
}

export const STATUS_COLORS: Record<CanaryStatus, string> = {
  draft: '#8c8c8c', active: '#52c41a', paused: '#fa8c16',
  completed: '#1677ff', rolled_back: '#f5222d',
}

export const STRATEGY_LABELS: Record<CanaryStrategy, string> = {
  percentage: '百分比', tenant: '租户', store: '门店', tag: '标签',
}
