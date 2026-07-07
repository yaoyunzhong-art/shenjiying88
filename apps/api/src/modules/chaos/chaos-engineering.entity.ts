/**
 * 混沌工程模块实体定义
 */

/** 实验状态 */
export type ExperimentStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED'

/** 故障类型 */
export type FaultType = 'LATENCY' | 'ERROR' | 'TIMEOUT' | 'CPU_BURN'

/** 回滚触发方式 */
export type RollbackTrigger = 'MANUAL' | 'AUTO' | 'SCHEDULED'

/** 故障注入 */
export interface FaultInjection {
  type: FaultType
  target: string
  params: Record<string, number | string>
  active: boolean
  startedAt?: string
}

/** 实验指标 */
export interface ExperimentMetrics {
  requestsTotal: number
  requestsFailed: number
  latencyAvg: number
  latencyP99: number
  errorRate: number
}

/** 实验结果 */
export interface ExperimentResult {
  success: boolean
  durationMs: number
  metrics: ExperimentMetrics
  faultsTriggered: number
  rollbackTriggered: boolean
  summary: string
}

/** 混沌实验 */
export interface ChaosExperiment {
  id: string
  name: string
  target: string
  faultInjections: FaultInjection[]
  status: ExperimentStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  results?: ExperimentResult
}

/** 回滚历史记录 */
export interface RollbackHistoryEntry {
  id: string
  experimentId: string
  trigger: RollbackTrigger
  reason: string
  triggeredAt: string
  completedAt?: string
  success: boolean
  healthCheckPassed: boolean
}

/** 系统指标 */
export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  errorRate: number
  latencyAvg: number
  healthy: boolean
}

/** 系统健康状态 */
export interface HealthStatus {
  experimentId: string
  healthy: boolean
  shouldRollback: boolean
  failureCount: number
  cpuUsage: number
  memoryUsage: number
  errorRate: number
  latencyAvg: number
}
