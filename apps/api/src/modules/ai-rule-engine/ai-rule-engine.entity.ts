import { AiProvider, PolicyConditionOperator, AiExecutionStatus } from '@m5/domain'

/**
 * AI 规则引擎：条件定义
 */
export interface RuleCondition {
  id: string
  engineId: string
  field: string
  operator: PolicyConditionOperator
  value: number | string | boolean | (string | number)[]
  weight: number
  description?: string
}

/**
 * AI 规则引擎：动作定义
 */
export interface RuleAction {
  id: string
  engineId: string
  type: string
  params: Record<string, unknown>
  priority: number
  description?: string
}

/**
 * AI 规则引擎定义
 */
export interface RuleEngine {
  id: string
  name: string
  provider: AiProvider
  model: string
  description?: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  matchStrategy: 'ALL' | 'ANY'
  status: AiExecutionStatus
  lastEvaluatedAt?: string
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
 * 设备指标
 */
export interface DeviceMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatencyMs: number
  errorRate: number
  uptimeHours?: number
}

/**
 * 设备异常检测输入
 */
export interface DeviceAnomalyInput {
  deviceId: string
  storeId: string
  metrics: DeviceMetrics
  tenantId: string
}

/**
 * 设备异常检测输出
 */
export interface DeviceAnomalyOutput {
  deviceId: string
  isAnomaly: boolean
  anomalyType?: string
  severity: string
  triggeredRules: string[]
  recommendations: string[]
}

/**
 * 风险评分指标
 */
export interface RiskMetrics {
  refundCount?: number
  abnormalPaymentCount?: number
  deviceAnomalyCount?: number
  complaintCount?: number
  voidRefundAmount?: number
  activeDays?: number
  recentTransactionAmount?: number
}

/**
 * 风险评分输入
 */
export interface RiskScoreInput {
  subjectId: string
  subjectType: 'member' | 'device' | 'store'
  metrics: RiskMetrics
  tenantId: string
}

/**
 * 风险评分输出
 */
export interface RiskScoreOutput {
  subjectId: string
  riskScore: number
  riskLevel: string
  triggeredRules: string[]
  reasons: string[]
  recommendations: string[]
  evaluatedAt: string
}

/**
 * 批量评估请求项（可辨识联合体）
 */
export type BatchEvaluateItem =
  | { index: number; type: 'member-level'; data: MemberLevelInput }
  | { index: number; type: 'device-anomaly'; data: DeviceAnomalyInput }

/**
 * 批量评估请求
 */
export interface BatchEvaluateRequest {
  items: BatchEvaluateItem[]
}

/**
 * 批量评估响应项
 */
export interface BatchEvaluateResponseItem {
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
  items: BatchEvaluateResponseItem[]
  timestamp: string
}

/**
 * 引擎状态
 */
export interface EngineStatus {
  engineId: string
  engineName: string
  conditionsCount: number
  actionsCount: number
  matchStrategy: string
  status: AiExecutionStatus
  enabled: boolean
  lastEvaluatedAt?: string
}

/**
 * 引擎详情（详细版）
 */
export interface EngineDetail extends EngineStatus {
  provider: AiProvider
  model: string
  description?: string
  conditions: Array<{
    id: string
    field: string
    operator: PolicyConditionOperator
    value: number | string | boolean | (string | number)[]
    weight: number
    description?: string
  }>
  actions: Array<{
    id: string
    type: string
    params: Record<string, unknown>
    priority: number
    description?: string
  }>
}

/**
 * 引擎配置更新（引擎管理功能）
 */
export interface EngineConfigUpdate {
  enabled?: boolean
  matchStrategy?: 'ALL' | 'ANY'
  description?: string
  conditionOverrides?: Array<{
    conditionId: string
    field?: string
    value?: number | string | boolean | (string | number)[]
    weight?: number
    operator?: PolicyConditionOperator
  }>
}

/**
 * 模拟器定义
 */
/**
 * 规则模拟器（兼容别名）
 */
export type RuleSimulator = Simulator

/**
 * 单次模拟输出（兼容别名）
 */
export type SimulatorResult = SimulatorRunOutput

/**
 * 批量模拟聚合输出（兼容别名）
 */
export type SimulatorSummary = SimulatorBatchRunOutput

/**
 * 模拟器定义
 */
export interface Simulator {
  id: string
  engineId: string
  name: string
  rounds: number
  timeoutMs: number
  enableMutation: boolean
  createdAt: string
}

/**
 * 模拟运行输入
 */
export interface SimulatorRunInput {
  simulatorId: string
  conditionOverrides?: Array<{ conditionId: string; value: unknown }>
  dataType: 'member-level' | 'device-anomaly' | 'risk-score'
  data: Record<string, unknown>
  verbose?: boolean
}

/**
 * 模拟运行输出
 */
export interface SimulatorRunOutput {
  simulatorId: string
  simulatorName: string
  runIndex: number
  matched: boolean
  triggeredConditions: string[]
  triggeredActions: string[]
  matchScore: number
  executionTimeMs: number
  timestamp: string
  logs?: string[]
}

/**
 * 模拟批量运行输出
 */
export interface SimulatorBatchRunOutput {
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
  results: SimulatorRunOutput[]
  recommendation: string
}

/**
 * 诊断记录
 */
export interface Diagnosis {
  diagnosisId: string
  engineId: string
  scenarioId: string
  status: AiExecutionStatus
  riskLevel: string
  recommendation?: string
  matchedRuleIds: string[]
  matchedConditionIds: string[]
  triggeredActionIds: string[]
  evaluationDurationMs: number
  createdAt: string
  completedAt?: string
  tenantId: string
  requestedBy: string
}

/**
 * 诊断实体（带快照的完整版）
 * @deprecated 改用 Diagnosis 接口，该类型用于向后兼容
 */
export interface DiagnosisEntity extends Diagnosis {
  promptSummary?: string
  inputSnapshot?: Record<string, unknown>
  outputSnapshot?: Record<string, unknown>
}

/**
 * 批量诊断记录
 */
export interface DiagnosisBatch {
  batchId: string
  engineId: string
  totalDiagnoses: number
  matchedDiagnoses: number
  matchRate: number
  riskDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  avgEvaluationDurationMs: number
  diagnoses: Diagnosis[]
  createdAt: string
  triggeredBy: string
  tenantId: string
}
