/**
 * 🐜 自动: [ai-rule-engine] [A] contract 补全
 *
 * AI 规则引擎：跨模块合约类型
 * 定义 ai-rule-engine 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-diagnosis, ai-insight, observability, campaign 等）消费。
 */
import type { AiProvider, AiExecutionStatus, PolicyConditionOperator } from '@m5/domain'
import type {
  RuleCondition,
  RuleAction,
  RuleEngine,
  MemberLevelInput,
  MemberLevelOutput,
  DeviceAnomalyInput,
  DeviceAnomalyOutput,
  BatchEvaluateRequest,
  BatchEvaluateResponse,
  BatchEvaluateItem,
  RiskScoreInput,
  RiskScoreOutput,
  EngineStatus,
  Diagnosis,
  DiagnosisEntity,
  DiagnosisBatch,
} from './ai-rule-engine.entity'

/**
 * 规则条件合约（跨模块安全子集）
 */
export interface RuleConditionContract {
  id: string
  engineId: string
  field: string
  operator: PolicyConditionOperator
  value: unknown
  weight: number
  description?: string
}

/**
 * 规则动作合约（跨模块安全子集）
 */
export interface RuleActionContract {
  id: string
  engineId: string
  type: RuleAction['type']
  params: Record<string, unknown>
  priority: number
  description?: string
}

/**
 * 规则引擎合约（跨模块安全子集）
 */
export interface RuleEngineContract {
  id: string
  name: string
  provider: AiProvider
  model: string
  conditions: RuleConditionContract[]
  actions: RuleActionContract[]
  matchStrategy: RuleEngine['matchStrategy']
  status: AiExecutionStatus
  lastEvaluatedAt?: string
  description?: string
}

/**
 * 成员等级评估输出合约（跨模块安全子集）
 */
export interface MemberLevelOutputContract {
  memberId: string
  currentLevel: string
  suggestedLevel: string
  triggeredRules: string[]
  confidence: number
}

/**
 * 设备异常检测输出合约（跨模块安全子集）
 */
export interface DeviceAnomalyOutputContract {
  deviceId: string
  isAnomaly: boolean
  anomalyType?: DeviceAnomalyOutput['anomalyType']
  severity: DeviceAnomalyOutput['severity']
  triggeredRules: string[]
  recommendations: string[]
}

/**
 * 批量评估响应合约（跨模块安全子集）
 */
export interface BatchEvaluateResponseContract {
  total: number
  succeeded: number
  failed: number
  items: Array<{
    index: number
    type: BatchEvaluateItem['type']
    inputId: string
    result: MemberLevelOutputContract | DeviceAnomalyOutputContract
  }>
  timestamp: string
}

/**
 * 风险评分输出合约（跨模块安全子集）
 */
export interface RiskScoreOutputContract {
  subjectId: string
  riskScore: number
  riskLevel: RiskScoreOutput['riskLevel']
  triggeredRules: string[]
  reasons: string[]
  recommendations: string[]
  evaluatedAt: string
}

/**
 * 引擎状态合约（跨模块安全子集）
 */
export interface EngineStatusContract {
  engineId: string
  engineName: string
  conditionsCount: number
  actionsCount: number
  matchStrategy: EngineStatus['matchStrategy']
  status: EngineStatus['status']
  lastEvaluatedAt?: string
}

/**
 * 诊断合约（跨模块安全子集）
 */
export interface DiagnosisContract {
  diagnosisId: string
  engineId: string
  scenarioId: string
  status: Diagnosis['status']
  riskLevel: Diagnosis['riskLevel']
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

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toRuleConditionContract(entity: RuleCondition): RuleConditionContract {
  return {
    id: entity.id,
    engineId: entity.engineId,
    field: entity.field,
    operator: entity.operator,
    value: entity.value,
    weight: entity.weight,
    description: entity.description,
  }
}

/** 实体 -> 合约映射 */
export function toRuleActionContract(entity: RuleAction): RuleActionContract {
  return {
    id: entity.id,
    engineId: entity.engineId,
    type: entity.type,
    params: { ...entity.params },
    priority: entity.priority,
    description: entity.description,
  }
}

/** 实体 -> 合约映射 */
export function toRuleEngineContract(entity: RuleEngine): RuleEngineContract {
  return {
    id: entity.id,
    name: entity.name,
    provider: entity.provider,
    model: entity.model,
    conditions: entity.conditions.map(toRuleConditionContract),
    actions: entity.actions.map(toRuleActionContract),
    matchStrategy: entity.matchStrategy,
    status: entity.status,
    lastEvaluatedAt: entity.lastEvaluatedAt,
    description: entity.description,
  }
}

/** 实体 -> 合约映射 */
export function toMemberLevelOutputContract(entity: MemberLevelOutput): MemberLevelOutputContract {
  return {
    memberId: entity.memberId,
    currentLevel: entity.currentLevel,
    suggestedLevel: entity.suggestedLevel,
    triggeredRules: [...entity.triggeredRules],
    confidence: entity.confidence,
  }
}

/** 实体 -> 合约映射 */
export function toDeviceAnomalyOutputContract(entity: DeviceAnomalyOutput): DeviceAnomalyOutputContract {
  return {
    deviceId: entity.deviceId,
    isAnomaly: entity.isAnomaly,
    anomalyType: entity.anomalyType,
    severity: entity.severity,
    triggeredRules: [...entity.triggeredRules],
    recommendations: [...entity.recommendations],
  }
}

/** 实体 -> 合约映射 */
export function toRiskScoreOutputContract(entity: RiskScoreOutput): RiskScoreOutputContract {
  return {
    subjectId: entity.subjectId,
    riskScore: entity.riskScore,
    riskLevel: entity.riskLevel,
    triggeredRules: [...entity.triggeredRules],
    reasons: [...entity.reasons],
    recommendations: [...entity.recommendations],
    evaluatedAt: entity.evaluatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toEngineStatusContract(entity: EngineStatus): EngineStatusContract {
  return {
    engineId: entity.engineId,
    engineName: entity.engineName,
    conditionsCount: entity.conditionsCount,
    actionsCount: entity.actionsCount,
    matchStrategy: entity.matchStrategy,
    status: entity.status,
    lastEvaluatedAt: entity.lastEvaluatedAt,
  }
}

/** 实体 -> 合约映射 */
export function toDiagnosisContract(entity: DiagnosisEntity | Diagnosis): DiagnosisContract {
  return {
    diagnosisId: entity.diagnosisId,
    engineId: entity.engineId,
    scenarioId: entity.scenarioId,
    status: entity.status,
    riskLevel: entity.riskLevel,
    recommendation: entity.recommendation ?? undefined,
    matchedRuleIds: [...entity.matchedRuleIds],
    matchedConditionIds: [...entity.matchedConditionIds],
    triggeredActionIds: [...entity.triggeredActionIds],
    evaluationDurationMs: entity.evaluationDurationMs,
    createdAt: entity.createdAt,
    completedAt: entity.completedAt,
    tenantId: entity.tenantId,
    requestedBy: entity.requestedBy,
  }
}

/** BatchEvaluateResponse -> 合约映射 */
export function toBatchEvaluateResponseContract(
  entity: BatchEvaluateResponse,
): BatchEvaluateResponseContract {
  return {
    total: entity.total,
    succeeded: entity.succeeded,
    failed: entity.failed,
    items: entity.items.map((item) => ({
      index: item.index,
      type: item.type,
      inputId: item.inputId,
      result:
        item.type === 'member-level'
          ? toMemberLevelOutputContract(item.result as MemberLevelOutput)
          : toDeviceAnomalyOutputContract(item.result as DeviceAnomalyOutput),
    })),
    timestamp: entity.timestamp,
  }
}

/** 批量映射 */
export function toRuleConditionContracts(entities: RuleCondition[]): RuleConditionContract[] {
  return entities.map(toRuleConditionContract)
}

/** 批量映射 */
export function toRuleActionContracts(entities: RuleAction[]): RuleActionContract[] {
  return entities.map(toRuleActionContract)
}

/** 批量映射 */
export function toRuleEngineContracts(entities: RuleEngine[]): RuleEngineContract[] {
  return entities.map(toRuleEngineContract)
}

/** 批量映射 */
export function toDiagnosisContracts(entities: (DiagnosisEntity | Diagnosis)[]): DiagnosisContract[] {
  return entities.map(toDiagnosisContract)
}
