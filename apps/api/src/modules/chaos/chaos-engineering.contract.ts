/**
 * chaos-engineering.contract.ts — 混沌工程跨模块契约定义
 *
 * 为 ChaosExperiment / FaultInjection / RollbackHistoryEntry 等核心实体
 * 提供稳定、可序列化的跨模块接口类型及转换函数。
 */

import type {
  ChaosExperiment,
  FaultInjection,
  ExperimentResult,
  ExperimentStatus,
  FaultType,
  RollbackHistoryEntry,
  RollbackTrigger,
  SystemMetrics,
} from './chaos-engineering.entity'

// ════════════════════════════════════════════════════════════════════════════════
// 契约接口（跨模块安全子集）
// ════════════════════════════════════════════════════════════════════════════════

/** 混沌实验契约 */
export interface ChaosExperimentContract {
  experimentId: string
  name: string
  target: string
  status: ExperimentStatus
  faults: FaultInjectionContract[]
  createdAt: string
  startedAt?: string
  completedAt?: string
  success: boolean | null
}

/** 故障注入契约 */
export interface FaultInjectionContract {
  type: FaultType
  target: string
  params: Record<string, number | string>
  active: boolean
  startedAt?: string
}

/** 实验结果契约 */
export interface ExperimentResultContract {
  success: boolean
  durationMs: number
  faultsTriggered: number
  rollbackTriggered: boolean
  summary: string
  metrics: {
    requestsTotal: number
    requestsFailed: number
    latencyAvg: number
    latencyP99: number
    errorRate: number
  }
}

/** 回滚历史契约 */
export interface RollbackHistoryContract {
  id: string
  experimentId: string
  trigger: RollbackTrigger
  reason: string
  triggeredAt: string
  completedAt?: string
  success: boolean
  healthCheckPassed: boolean
}

/** 健康状态契约 */
export interface HealthStatusContract {
  experimentId: string
  healthy: boolean
  shouldRollback: boolean
  failureCount: number
  cpuUsage: number
  memoryUsage: number
  errorRate: number
  latencyAvg: number
}

/** 系统指标契约 */
export interface SystemMetricsContract {
  cpuUsage: number
  memoryUsage: number
  errorRate: number
  latencyAvg: number
  healthy: boolean
}

// ════════════════════════════════════════════════════════════════════════════════
// 转换函数
// ════════════════════════════════════════════════════════════════════════════════

/** 内部 ChaosExperiment → 外部 ChaosExperimentContract */
export function toChaosExperimentContract(
  experiment: ChaosExperiment,
): ChaosExperimentContract {
  return {
    experimentId: experiment.id,
    name: experiment.name,
    target: experiment.target,
    status: experiment.status,
    faults: (experiment.faultInjections ?? []).map(toFaultInjectionContract),
    createdAt: experiment.createdAt,
    startedAt: experiment.startedAt,
    completedAt: experiment.completedAt,
    success: experiment.results ? experiment.results.success : null,
  }
}

/** 内部 FaultInjection → 外部 FaultInjectionContract */
export function toFaultInjectionContract(
  fault: FaultInjection,
): FaultInjectionContract {
  return {
    type: fault.type,
    target: fault.target,
    params: { ...fault.params },
    active: fault.active,
    startedAt: fault.startedAt,
  }
}

/** 内部 ExperimentResult → 外部 ExperimentResultContract */
export function toExperimentResultContract(
  result: ExperimentResult,
): ExperimentResultContract {
  return {
    success: result.success,
    durationMs: result.durationMs,
    faultsTriggered: result.faultsTriggered,
    rollbackTriggered: result.rollbackTriggered,
    summary: result.summary,
    metrics: {
      requestsTotal: result.metrics.requestsTotal,
      requestsFailed: result.metrics.requestsFailed,
      latencyAvg: result.metrics.latencyAvg,
      latencyP99: result.metrics.latencyP99,
      errorRate: result.metrics.errorRate,
    },
  }
}

/** 内部 RollbackHistoryEntry → 外部 RollbackHistoryContract */
export function toRollbackHistoryContract(
  entry: RollbackHistoryEntry,
): RollbackHistoryContract {
  return {
    id: entry.id,
    experimentId: entry.experimentId,
    trigger: entry.trigger,
    reason: entry.reason,
    triggeredAt: entry.triggeredAt,
    completedAt: entry.completedAt,
    success: entry.success,
    healthCheckPassed: entry.healthCheckPassed,
  }
}

/** 内部 SystemMetrics → 外部 SystemMetricsContract（浅拷贝） */
export function toSystemMetricsContract(
  metrics: SystemMetrics,
): SystemMetricsContract {
  return {
    cpuUsage: metrics.cpuUsage,
    memoryUsage: metrics.memoryUsage,
    errorRate: metrics.errorRate,
    latencyAvg: metrics.latencyAvg,
    healthy: metrics.healthy,
  }
}

/** 安全格式化：将实验列表转为契约列表 */
export function toChaosExperimentContractList(
  experiments: ChaosExperiment[],
): ChaosExperimentContract[] {
  return experiments.map(toChaosExperimentContract)
}

/** 安全格式化：将回滚历史列表转为契约列表 */
export function toRollbackHistoryContractList(
  entries: RollbackHistoryEntry[],
): RollbackHistoryContract[] {
  return entries.map(toRollbackHistoryContract)
}
