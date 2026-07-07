/**
 * 自动补全: [aiops] [A] contract
 *
 * AIOps 跨模块合约类型
 * 定义 aiops 模块对外暴露的稳定合约接口
 */
import type { TimeSeriesPoint } from './aiops-prediction.service'
import type {
  AnomalySeverity,
  AnomalyDetectResult,
  PredictResult,
  AttackDetectResult,
  HealingActionResult,
  SystemHealthStatus,
  AIOpsEngineStatus,
} from './aiops.entity'

/**
 * 异常检测请求合约（跨模块安全子集）
 */
export interface AnomalyDetectRequestContract {
  metricName: string
  value: number
  history: TimeSeriesPoint[]
  timestamp?: string
}

/**
 * 异常检测结果合约（跨模块安全子集）
 */
export interface AnomalyDetectResultContract {
  metricName: string
  isAnomaly: boolean
  anomalyScore: number
  anomalyType?: 'spike' | 'drop' | 'trend' | 'seasonal'
  severity: AnomalySeverity
  baseline: number
  deviation: number
  detectedAt: string
  details?: string
}

/**
 * 预测请求合约（跨模块安全子集）
 */
export interface PredictRequestContract {
  metricName: string
  horizon: number
  timestamp?: string
}

/**
 * 预测结果合约（跨模块安全子集）
 */
export interface PredictResultContract {
  metricName: string
  horizon: number
  predictedValues: number[]
  confidence: number
  predictedAt: string
}

/**
 * 攻击检测请求合约（跨模块安全子集）
 */
export interface AttackDetectRequestContract {
  metricName: string
  timestamp?: string
}

/**
 * 攻击检测结果合约（跨模块安全子集）
 */
export interface AttackDetectResultContract {
  metricName: string
  isUnderAttack: boolean
  confidence: number
  attackType?: 'ddos' | 'brute_force' | 'data_exfil'
  evidence: string[]
  detectedAt: string
}

/**
 * 自愈请求合约（跨模块安全子集）
 */
export interface HealRequestContract {
  targetSystem: string
  timestamp?: string
}

/**
 * 自愈结果合约（跨模块安全子集）
 */
export interface HealingActionResultContract {
  id: string
  targetSystem: string
  action: 'restart' | 'rollback' | 'scale' | 'isolate'
  status: 'pending' | 'running' | 'completed' | 'failed'
  triggeredAt: string
  completedAt?: string
  result?: string
}

/**
 * 系统健康状态合约（跨模块安全子集）
 */
export interface SystemHealthStatusContract {
  systemId: string
  status: 'healthy' | 'degraded' | 'critical' | 'unknown'
  lastCheck: string
  metrics: Record<string, number>
  issues: string[]
}

/**
 * 引擎状态合约（跨模块安全子集）
 */
export interface AIOpsEngineStatusContract {
  engineName: string
  anomalyRulesCount: number
  attackRulesCount: number
  healedSystemsCount: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  lastDetectedAt?: string
}

/** 异常检测结果 -> 合约 */
export function toAnomalyDetectResultContract(entity: AnomalyDetectResult): AnomalyDetectResultContract {
  return {
    metricName: entity.metricName,
    isAnomaly: entity.isAnomaly,
    anomalyScore: entity.anomalyScore,
    anomalyType: entity.anomalyType,
    severity: entity.severity,
    baseline: entity.baseline,
    deviation: entity.deviation,
    detectedAt: entity.detectedAt,
    details: entity.details,
  }
}

/** 预测结果 -> 合约 */
export function toPredictResultContract(entity: PredictResult): PredictResultContract {
  return {
    metricName: entity.metricName,
    horizon: entity.horizon,
    predictedValues: entity.predictedValues,
    confidence: entity.confidence,
    predictedAt: entity.predictedAt,
  }
}

/** 攻击检测 -> 合约 */
export function toAttackDetectResultContract(entity: AttackDetectResult): AttackDetectResultContract {
  return {
    metricName: entity.metricName,
    isUnderAttack: entity.isUnderAttack,
    confidence: entity.confidence,
    attackType: entity.attackType,
    evidence: entity.evidence,
    detectedAt: entity.detectedAt,
  }
}

/** 自愈结果 -> 合约 */
export function toHealingActionResultContract(entity: HealingActionResult): HealingActionResultContract {
  return {
    id: entity.id,
    targetSystem: entity.targetSystem,
    action: entity.action,
    status: entity.status,
    triggeredAt: entity.triggeredAt,
    completedAt: entity.completedAt,
    result: entity.result,
  }
}

/** 引擎状态 -> 合约 */
export function toAIOpsEngineStatusContract(entity: AIOpsEngineStatus): AIOpsEngineStatusContract {
  return {
    engineName: entity.engineName,
    anomalyRulesCount: entity.anomalyRulesCount,
    attackRulesCount: entity.attackRulesCount,
    healedSystemsCount: entity.healedSystemsCount,
    status: entity.status,
    lastDetectedAt: entity.lastDetectedAt,
  }
}

/** 系统健康 -> 合约 */
export function toSystemHealthStatusContract(entity: SystemHealthStatus): SystemHealthStatusContract {
  return {
    systemId: entity.systemId,
    status: entity.status,
    lastCheck: entity.lastCheck,
    metrics: entity.metrics,
    issues: entity.issues,
  }
}
