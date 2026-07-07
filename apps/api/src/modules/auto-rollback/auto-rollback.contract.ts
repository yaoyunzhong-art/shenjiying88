/**
 * 🐜 自动: [auto-rollback] [A] contract 补全
 *
 * 自动回滚：跨模块合约类型
 * 定义 auto-rollback 模块对外暴露的稳定合约接口，
 * 供 observability、anomaly-detector、notification 等模块消费。
 */
import type {
  RollbackStatus,
  RollbackSeverity,
  SnapshotKind,
} from './auto-rollback.entity'

/**
 * 回滚记录合约（消费方安全子集）
 * 不含内部 history 数组,不含 confirmationDelayMs 实现细节
 */
export interface RollbackRecordContract {
  /** 回滚记录唯一 ID */
  id: string
  /** 触发原因 */
  reason: string
  /** 严重级别 */
  severity: RollbackSeverity
  /** 受影响指标键 */
  metricKey: string
  /** 触发时的异常值 */
  anomalyValue: number
  /** baseline 基准值 */
  baselineValue: number
  /** 状态机当前状态 */
  status: RollbackStatus
  /** 关联快照 ID（可选） */
  snapshotId?: string
  /** 是否需要二次确认 */
  requiresConfirmation: boolean
  /** 创建时间（ISO-8601） */
  createdAt: string
  /** 完成时间（ISO-8601，可选） */
  completedAt?: string
}

/**
 * 快照合约（消费方安全子集）
 */
export interface SnapshotContract {
  id: string
  kind: SnapshotKind
  size: number
  createdAt: string
  trigger: string
}

/**
 * 回滚触发请求合约
 */
export interface RollbackTriggerContract {
  reason: string
  severity: RollbackSeverity
  metricKey: string
  anomalyValue: number
  baselineValue: number
  snapshotKind?: SnapshotKind
  trigger?: string
}

/**
 * 回滚引擎状态合约
 */
export interface RollbackEngineStatusContract {
  engineName: string
  activeRecords: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  lastEvaluationAt?: string
}

/**
 * 回滚配置合约
 */
export interface RollbackConfigContract {
  criticalRequiresConfirm: boolean
  confirmationDelayMs: number
  autoTimeoutMs: number
  maxConcurrent: number
  snapshotRetentionMs: number
}

/**
 * 回滚列表查询合约
 */
export interface RollbackListFilterContract {
  status?: RollbackStatus
  metricKey?: string
}

/**
 * 回滚统计合约：聚合多条回滚记录的状态分布
 */
export interface RollbackStatsContract {
  totalRecords: number
  active: number
  completed: number
  failed: number
  cancelled: number
  awaitingConfirm: number
  bySeverity: Record<RollbackSeverity, number>
  avgDurationMs: number
}

/**
 * 回滚历史条目合约
 */
export interface RollbackHistoryEntryContract {
  status: RollbackStatus
  timestamp: string
  note?: string
}
