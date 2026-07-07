/**
 * canary.contract.ts - 灰度发布模块跨模块契约
 *
 * 定义稳定的跨模块通信接口，供其他模块通过 cross-boundary 消费。
 * 只暴露安全的子集，隐藏实现细节。
 */

import type {
  CanaryExperiment,
  CanaryEvaluationResponse,
  CanaryHealthSnapshot,
  CanaryAuditLog,
  CanaryStatus,
  CanaryStrategy,
  CanaryEvaluationRequest,
} from './canary.entity'

// ── Contract Interfaces ──

/** 跨模块安全的灰度实验概要契约 */
export interface CanaryExperimentContract {
  id: string
  name: string
  description: string
  flagKey: string
  strategy: CanaryStrategy
  status: CanaryStatus
  initialPercentage: number
  targetPercentage: number
  currentPercentage: number
  startedAt?: string
  endedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** 跨模块安全的灰度评估契约 */
export interface CanaryEvaluationContract {
  flagKey: string
  enabled: boolean
  matchedStrategy: CanaryStrategy | null
  experimentId?: string
  percentage?: number
  reason: string
}

/** 跨模块安全的灰度健康快照契约 */
export interface CanaryHealthContract {
  experimentId: string
  timestamp: string
  errorRate: number
  latencyP95: number
  isHealthy: boolean
}

/** 跨模块安全的灰度审计日志契约 */
export interface CanaryAuditContract {
  id: string
  experimentId: string
  action: string
  operator: string
  reason?: string
  timestamp: string
}

/** 跨模块安全的状态聚合契约 */
export interface CanaryStatusContract {
  totalExperiments: number
  activeExperiments: number
  completedExperiments: number
  rolledBackExperiments: number
  overallHealth: 'healthy' | 'degraded' | 'unhealthy'
}

/** 跨模块安全的灰度创建请求契约 */
export interface CanaryCreateContract {
  name: string
  description: string
  flagKey: string
  strategy: CanaryStrategy
  strategyConfig: Record<string, unknown>
  targetPercentage: number
  createdBy: string
}

/**
 * 将内部 CanaryExperiment 转换为跨模块契约
 */
export function toExperimentContract(experiment: CanaryExperiment): CanaryExperimentContract {
  return {
    id: experiment.id,
    name: experiment.name,
    description: experiment.description,
    flagKey: experiment.flagKey,
    strategy: experiment.strategy,
    status: experiment.status,
    initialPercentage: experiment.initialPercentage,
    targetPercentage: experiment.targetPercentage,
    currentPercentage: experiment.currentPercentage,
    startedAt: experiment.startedAt,
    endedAt: experiment.endedAt,
    createdBy: experiment.createdBy,
    createdAt: experiment.createdAt,
    updatedAt: experiment.updatedAt,
  }
}

/**
 * 将内部 CanaryEvaluationResponse 转换为跨模块契约
 */
export function toEvaluationContract(
  response: CanaryEvaluationResponse,
): CanaryEvaluationContract {
  return {
    flagKey: response.flagKey,
    enabled: response.enabled,
    matchedStrategy: response.matchedStrategy,
    experimentId: response.experimentId,
    percentage: response.percentage,
    reason: response.reason,
  }
}

/**
 * 将内部 CanaryHealthSnapshot 转换为跨模块契约
 */
export function toHealthContract(snapshot: CanaryHealthSnapshot): CanaryHealthContract {
  return {
    experimentId: snapshot.experimentId,
    timestamp: snapshot.timestamp,
    errorRate: snapshot.errorRate,
    latencyP95: snapshot.latencyP95,
    isHealthy: snapshot.isHealthy,
  }
}

/**
 * 从多个实验汇总状态契约
 */
export function aggregateStatus(experiments: CanaryExperiment[]): CanaryStatusContract {
  const active = experiments.filter((e) => e.status === 'active').length
  const completed = experiments.filter((e) => e.status === 'completed').length
  const rolledBack = experiments.filter((e) => e.status === 'rolled_back').length

  let overallHealth: CanaryStatusContract['overallHealth'] = 'healthy'
  if (rolledBack > 0) {
    overallHealth = 'unhealthy'
  } else if (active > 0 && active < experiments.length) {
    overallHealth = 'degraded'
  }

  return {
    totalExperiments: experiments.length,
    activeExperiments: active,
    completedExperiments: completed,
    rolledBackExperiments: rolledBack,
    overallHealth,
  }
}
