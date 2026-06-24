/**
 * AI 诊断：跨模块合约类型
 *
 * 定义 ai-diagnosis 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-rule-engine, ai-insight, ai-recommend, observability 等）消费。
 */
import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity'

/**
 * 诊断合约（跨模块消费安全子集）
 * 仅暴露诊断对外必需的只读字段
 */
export interface DiagnosisContract {
  diagnosisId: string
  engineId: string
  scenarioId: string
  status: DiagnosisEntity['status']
  riskLevel: DiagnosisEntity['riskLevel']
  recommendation: string
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
 * 批量诊断合约（跨模块消费安全子集）
 */
export interface DiagnosisBatchContract {
  batchId: string
  engineId: string
  totalDiagnoses: number
  matchedDiagnoses: number
  matchRate: number
  avgEvaluationDurationMs: number
  createdAt: string
  triggeredBy: string
  tenantId: string
}

/**
 * 风险报告合约
 */
export interface RiskReportContract {
  generatedAt: string
  totalEvaluated: number
  riskDistribution: { low: number; medium: number; high: number; critical: number }
  topRecommendations: Array<{
    diagnosisId: string
    riskLevel: DiagnosisEntity['riskLevel']
    recommendation: string
  }>
  averageEvaluationDurationMs: number
}

/**
 * Contract: 实体 -> 合约映射器
 */
export function toDiagnosisContract(entity: DiagnosisEntity): DiagnosisContract {
  return {
    diagnosisId: entity.diagnosisId,
    engineId: entity.engineId,
    scenarioId: entity.scenarioId,
    status: entity.status,
    riskLevel: entity.riskLevel,
    recommendation: entity.recommendation,
    matchedRuleIds: [...entity.matchedRuleIds],
    matchedConditionIds: [...entity.matchedConditionIds],
    triggeredActionIds: [...entity.triggeredActionIds],
    evaluationDurationMs: entity.evaluationDurationMs,
    createdAt: entity.createdAt,
    completedAt: entity.completedAt,
    tenantId: entity.tenantId,
    requestedBy: entity.requestedBy
  }
}

/**
 * Contract: 批量诊断 -> 合约映射器
 */
export function toDiagnosisBatchContract(entity: DiagnosisBatch): DiagnosisBatchContract {
  return {
    batchId: entity.batchId,
    engineId: entity.engineId,
    totalDiagnoses: entity.totalDiagnoses,
    matchedDiagnoses: entity.matchedDiagnoses,
    matchRate: entity.matchRate,
    avgEvaluationDurationMs: entity.avgEvaluationDurationMs,
    createdAt: entity.createdAt,
    triggeredBy: entity.triggeredBy,
    tenantId: entity.tenantId
  }
}

/**
 * Contract: 实体 -> 合约映射器（批量）
 */
export function toDiagnosisContracts(entities: DiagnosisEntity[]): DiagnosisContract[] {
  return entities.map(toDiagnosisContract)
}
