/**
 * 可观测信号状态
 */
export enum ObservabilitySignalStatus {
  Healthy = 'healthy',
  Warning = 'warning',
  Critical = 'critical'
}

/**
 * 恢复计划状态
 */
export enum RecoveryPlanStatus {
  Ready = 'ready',
  Attention = 'attention'
}

/**
 * 可观测信号类型
 */
export type ObservabilitySignalType = 'metrics' | 'logs' | 'traces'

/**
 * 可观测信号记录
 */
export interface ObservabilitySignalRecord {
  /** 信号类型 */
  signal: ObservabilitySignalType
  /** 信号状态 */
  status: ObservabilitySignalStatus
  /** 覆盖率 (0-100) */
  coverage: number
  /** 采集延迟秒数 */
  collectionLagSeconds: number
  /** 上次采集时间 */
  lastCollectedAt: string
  /** 负责人 */
  owner: string
  /** 告警路由 */
  alertRoutes: string[]
  /** 证据文件路径 */
  evidence: string[]
}

/**
 * 重试策略记录
 */
export interface RetryPolicyRecord {
  /** 策略唯一键 */
  key: string
  /** 所属能力 */
  capability: string
  /** 触发场景 */
  trigger: string
  /** 最大重试次数 */
  maxAttempts: number
  /** 退避策略描述 */
  backoff: string
  /** 恢复动作 */
  recoveryAction: string
  /** 升级通知目标 */
  escalationTarget: string
}

/**
 * 恢复计划记录
 */
export interface RecoveryPlanRecord {
  /** 资源名称 */
  resource: string
  /** 计划状态 */
  status: RecoveryPlanStatus
  /** 恢复时间目标 (分钟) */
  rtoMinutes: number
  /** 恢复点目标 (分钟) */
  rpoMinutes: number
  /** 上次演练时间 */
  lastDrillAt: string
  /** 过期天数阈值 */
  staleAfterDays: number
  /** 依赖资源列表 */
  dependencies: string[]
  /** 操作手册路径 */
  runbook: string
}

/**
 * 治理元数据
 */
export interface GovernanceMetadataRecord {
  /** 操作代码 */
  operation: string
  /** RBAC 信息 */
  rbac: {
    resource: string
    action: string
    requiredRoles: string[]
    requiredPermissions: string[]
  }
}

/**
 * 边缘重放暂存结果
 */
export interface EdgeReplayResult {
  /** 执行状态 */
  status: 'staged'
  /** 门店 ID */
  storeId: string
  /** 操作计数 */
  operationCount: number
  /** 重放流水线 */
  replayPipeline: string[]
  /** 匹配的重试策略 */
  retryPolicy?: RetryPolicyRecord
  /** 可观测钩子 */
  observabilityHooks: string[]
  /** 匹配的恢复计划 */
  recoveryPlan?: RecoveryPlanRecord
}

/**
 * 可观测概览统计
 */
export interface ObservabilityOverview {
  /** 信号总数 */
  totalSignals: number
  /** 降级信号数 */
  degradedSignals: number
  /** 按状态分布 */
  byStatus: Record<string, number>
  /** 平均覆盖率 */
  averageCoverage: number
  /** 最大采集延迟 */
  maxCollectionLagSeconds: number
  /** 信号列表 */
  signals: ObservabilitySignalRecord[]
}

/**
 * 重试策略概览统计
 */
export interface RetryPolicyOverview {
  /** 策略总数 */
  totalPolicies: number
  /** 按能力分布 */
  byCapability: Record<string, number>
  /** 最大重试次数 */
  maxAttempts: number
  /** 策略列表 */
  policies: RetryPolicyRecord[]
}

/**
 * 恢复计划概览统计
 */
export interface RecoveryPlanOverview {
  /** 计划总数 */
  totalPlans: number
  /** 需要关注的计划数 */
  attentionRequired: number
  /** 过期的演练数 */
  staleDrills: number
  /** 计划列表 */
  plans: RecoveryPlanRecord[]
}

/**
 * 运维总览
 */
export interface OperationsOverview {
  /** 生成时间 */
  generatedAt: string
  /** 可观测概览 */
  observability: ObservabilityOverview
  /** 重试策略概览 */
  retries: RetryPolicyOverview
  /** 恢复计划概览 */
  recovery: RecoveryPlanOverview
}

/**
 * 恢复计划详细信息
 */
export interface RecoveryPlanDetail {
  /** 当前状态 */
  status: RecoveryPlanStatus
  /** 资源名称 */
  resource: string
  /** 基线能力列表 */
  baseline: string[]
  /** 关联计划（可为空） */
  plan: RecoveryPlanRecord | null
}
