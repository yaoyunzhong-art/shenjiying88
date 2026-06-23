import { AiProvider, AiExecutionStatus, PolicyConditionOperator } from '@m5/domain'

/**
 * AI 规则条件：描述一个可评估的匹配条件
 */
export interface RuleCondition {
  /** 条件唯一标识 */
  id: string
  /** 规则引擎 ID */
  engineId: string
  /** 条件字段名 */
  field: string
  /** 条件操作符 */
  operator: PolicyConditionOperator
  /** 条件期望值 */
  value: unknown
  /** 条件权重 (0-1)，用于多条件组合 */
  weight: number
  /** 条件描述 */
  description?: string
}

/**
 * AI 规则动作：规则命中后执行的动作
 */
export interface RuleAction {
  /** 动作唯一标识 */
  id: string
  /** 规则引擎 ID */
  engineId: string
  /** 动作类型 */
  type: 'ASSIGN_LEVEL' | 'FLAG_ANOMALY' | 'SEND_NOTIFICATION' | 'ESCALATE'
  /** 动作参数 */
  params: Record<string, unknown>
  /** 动作优先级 (1-10, 1 最高) */
  priority: number
  /** 动作描述 */
  description?: string
}

/**
 * AI 规则引擎：将条件、AI 模型与动作串联
 */
export interface RuleEngine {
  /** 引擎唯一标识 */
  id: string
  /** 引擎名称 */
  name: string
  /** AI 提供商 */
  provider: AiProvider
  /** AI 模型名称 */
  model: string
  /** 规则条件列表 */
  conditions: RuleCondition[]
  /** 规则动作列表 */
  actions: RuleAction[]
  /** 匹配策略：ALL 需要全部条件满足，ANY 任意一个条件满足即可 */
  matchStrategy: 'ALL' | 'ANY'
  /** 执行状态 */
  status: AiExecutionStatus
  /** 最后执行时间 */
  lastEvaluatedAt?: string
  /** 引擎描述 */
  description?: string
}

/**
 * 成员等级评估输入
 */
export interface MemberLevelInput {
  memberId: string
  totalPoints: number
  totalSpend: number
  visitCount: number
  tenantId: string
}

/**
 * 成员等级评估输出
 */
export interface MemberLevelOutput {
  memberId: string
  currentLevel: string
  suggestedLevel: string
  triggeredRules: string[]
  confidence: number
}

/**
 * 设备异常检测输入
 */
export interface DeviceAnomalyInput {
  deviceId: string
  storeId: string
  metrics: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatencyMs: number
    errorRate: number
    uptimeHours: number
  }
  tenantId: string
}

/**
 * 设备异常检测输出
 */
export interface DeviceAnomalyOutput {
  deviceId: string
  isAnomaly: boolean
  anomalyType?: 'CPU_SPIKE' | 'MEMORY_LEAK' | 'DISK_FULL' | 'NETWORK_LATENCY' | 'HIGH_ERROR_RATE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  triggeredRules: string[]
  recommendations: string[]
}

/**
 * 批量评估请求：支持同时评估成员等级和设备异常
 */
export interface BatchEvaluateRequest {
  /** 批量评估项列表 */
  items: Array<
    | { type: 'member-level'; data: MemberLevelInput }
    | { type: 'device-anomaly'; data: DeviceAnomalyInput }
  >
}

/**
 * 批量评估单项结果
 */
export interface BatchEvaluateItem {
  index: number
  type: 'member-level' | 'device-anomaly'
  inputId: string
  result: MemberLevelOutput | DeviceAnomalyOutput
}

/**
 * 批量评估响应
 */
export interface BatchEvaluateResponse {
  total: number
  succeeded: number
  failed: number
  items: BatchEvaluateItem[]
  timestamp: string
}

/**
 * 风险评分输入：综合评估业务风险
 */
export interface RiskScoreInput {
  /** 主体 ID（成员、设备或门店） */
  subjectId: string
  /** 主体类型 */
  subjectType: 'member' | 'device' | 'store'
  /** 指标包 */
  metrics: {
    /** 退款次数 */
    refundCount?: number
    /** 异常支付次数 */
    abnormalPaymentCount?: number
    /** 设备异常次数 */
    deviceAnomalyCount?: number
    /** 投诉次数 */
    complaintCount?: number
    /** 注销退款金额 */
    voidRefundAmount?: number
    /** 最近活跃天数 */
    activeDays?: number
    /** 最近交易金额 */
    recentTransactionAmount?: number
  }
  tenantId: string
}

/**
 * 风险评分输出
 */
export interface RiskScoreOutput {
  subjectId: string
  /** 风险分值 0-100, >70 高风险 */
  riskScore: number
  /** 风险等级 */
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  /** 触发的规则条件 ID */
  triggeredRules: string[]
  /** 风险原因列表 */
  reasons: string[]
  /** 建议措施 */
  recommendations: string[]
  /** 评估时间戳 */
  evaluatedAt: string
}

/**
 * 引擎状态快照
 */
export interface EngineStatus {
  engineId: string
  engineName: string
  conditionsCount: number
  actionsCount: number
  matchStrategy: 'ALL' | 'ANY'
  status: AiExecutionStatus
  lastEvaluatedAt?: string
}

/**
 * 规则模拟器：在实际执行规则前进行模拟运行
 */
export interface RuleSimulator {
  /** 模拟器唯一标识 */
  id: string
  /** 关联的规则引擎 ID */
  engineId: string
  /** 模拟器名称 */
  name: string
  /** 模拟轮次 */
  rounds: number
  /** 每次模拟的超时时间(ms) */
  timeoutMs: number
  /** 是否启用随机变异（引入噪声测试规则鲁棒性） */
  enableMutation: boolean
  /** 模拟结果 */
  results?: SimulatorResult[]
  /** 创建时间 */
  createdAt: string
}

/**
 * 单次模拟运行输入：提供模拟数据覆盖
 */
export interface SimulatorRunInput {
  /** 模拟器 ID */
  simulatorId: string
  /** 覆盖引擎条件值 */
  conditionOverrides?: Array<{
    conditionId: string
    value: unknown
  }>
  /** 模拟数据类型 */
  dataType: 'member-level' | 'device-anomaly' | 'risk-score'
  /** 模拟数据 */
  data: MemberLevelInput | DeviceAnomalyInput | RiskScoreInput
  /** 启用详细日志 */
  verbose?: boolean
}

/**
 * 单次模拟运行结果
 */
export interface SimulatorResult {
  /** 模拟器 ID */
  simulatorId: string
  /** 模拟器名称 */
  simulatorName: string
  /** 模拟运行索引 */
  runIndex: number
  /** 是否命中规则 */
  matched: boolean
  /** 命中的条件 ID 列表 */
  triggeredConditions: string[]
  /** 将被执行的动作列表 */
  triggeredActions: string[]
  /** 匹配分数 (0-1) */
  matchScore: number
  /** 用时(ms) */
  executionTimeMs: number
  /** 模拟时间戳 */
  timestamp: string
  /** 详细日志（仅 verbose 模式） */
  logs?: string[]
}

/**
 * 模拟摘要：多轮模拟的聚合结果
 */
export interface SimulatorSummary {
  simulatorId: string
  simulatorName: string
  totalRuns: number
  matchedRuns: number
  matchRate: number
  avgExecutionTimeMs: number
  p50ExecutionTimeMs: number
  p95ExecutionTimeMs: number
  p99ExecutionTimeMs: number
  mostTriggeredConditions: Array<{ conditionId: string; count: number }>
  results: SimulatorResult[]
  recommendation: string
}

/**
 * AI 诊断：单次规则引擎执行的诊断结果
 * 用于记录"为什么这个 case 被这个规则命中/未命中"
 */
export interface DiagnosisEntity {
  /** 诊断唯一标识 */
  diagnosisId: string
  /** 关联的规则引擎 ID */
  engineId: string
  /** 关联的场景 ID（来自 simulator） */
  scenarioId: string
  /** 诊断状态 */
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  /** 命中的规则 ID 列表 */
  matchedRuleIds: string[]
  /** 命中的条件 ID 列表（按权重降序） */
  matchedConditionIds: string[]
  /** 命中的动作 ID 列表 */
  triggeredActionIds: string[]
  /** 风险等级（low/medium/high/critical） */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  /** 诊断建议（人类可读） */
  recommendation: string
  /** 诊断用的 prompt 摘要 */
  promptSummary: string
  /** 评估耗时（毫秒） */
  evaluationDurationMs: number
  /** 输入 payload（脱敏后） */
  inputSnapshot: Record<string, unknown>
  /** 输出 payload（脱敏后） */
  outputSnapshot: Record<string, unknown>
  /** 创建时间 */
  createdAt: string
  /** 完成时间（可选） */
  completedAt?: string
  /** 关联租户 ID */
  tenantId: string
  /** 关联发起人 */
  requestedBy: string
}

/**
 * 诊断集合：批量诊断结果，用于 A/B 评估规则变化
 */
export interface DiagnosisBatch {
  batchId: string
  engineId: string
  totalDiagnoses: number
  matchedDiagnoses: number
  matchRate: number
  riskDistribution: { low: number; medium: number; high: number; critical: number }
  avgEvaluationDurationMs: number
  diagnoses: DiagnosisEntity[]
  createdAt: string
  triggeredBy: string
  tenantId: string
}

