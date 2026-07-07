/**
 * 🐜 自动: [anomaly-detector] [A] contract 补全
 *
 * 异常检测：跨模块合约类型
 * 定义 anomaly-detector 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-diagnosis, ai-rule-engine, observability, notifications 等）消费。
 */
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service'
import type {
  AnomalySeverity,
  ThreeSigmaResult,
  IqrResult,
  EwmaResult,
  AnomalyDetectors,
  AnomalyResult,
  AnomalyDetectInput,
  AnomalyDetectBatchInput,
  AnomalyEngineStatus,
  AnomalyAlert,
} from './anomaly-detector.entity'

/**
 * 异常检测请求合约（跨模块安全子集）
 */
export interface AnomalyDetectRequestContract {
  metricKey: string
  value: number
  history: TimeSeriesPoint[]
  timestamp?: string
}

/**
 * 异常检测批量请求合约（跨模块安全子集）
 */
export interface AnomalyDetectBatchRequestContract {
  points: Array<{
    metricKey: string
    value: number
    history: TimeSeriesPoint[]
  }>
  timestamp?: string
}

/**
 * 3σ 检测结果合约（跨模块安全子集）
 */
export interface ThreeSigmaResultContract {
  zScore: number
  detected: boolean
}

/**
 * IQR 检测结果合约（跨模块安全子集）
 */
export interface IqrResultContract {
  lower: number
  upper: number
  deviation: number
  detected: boolean
}

/**
 * EWMA 检测结果合约（跨模块安全子集）
 */
export interface EwmaResultContract {
  expected: number
  deviation: number
  detected: boolean
}

/**
 * 异常检测器结果合约（跨模块安全子集）
 */
export interface AnomalyDetectorsContract {
  threeSigma?: ThreeSigmaResultContract
  iqr?: IqrResultContract
  ewma?: EwmaResultContract
}

/**
 * 异常检测结果合约（跨模块安全子集）
 */
export interface AnomalyResultContract {
  metricKey: string
  value: number
  baseline: number
  deviation: number
  score: number
  severity: AnomalySeverity
  detectors: AnomalyDetectorsContract
  whitelisted: boolean
  reason: string
  detectedAt: string
}

/**
 * 异常检测配置合约（跨模块安全子集）
 */
export interface AnomalyConfigContract {
  whitelist?: Array<{ metricKey: string; reason: string; ttlMs?: number }>
  sigmaThreshold?: number
  ewmaAlpha?: number
  criticalThreshold?: number
  warningThreshold?: number
}

/**
 * 配置响应合约（跨模块安全子集）
 */
export interface ConfigureResponseContract {
  status: string
  applied: string[]
}

/**
 * 引擎状态合约（跨模块安全子集）
 */
export interface AnomalyEngineStatusContract {
  engineName: string
  rulesCount: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  lastEvaluationAt?: string
}

/**
 * 异常告警合约（跨模块安全子集）
 */
export interface AnomalyAlertContract {
  id: string
  metricKey: string
  value: number
  score: number
  severity: AnomalySeverity
  message: string
  detectedAt: string
  acknowledged: boolean
}

/**
 * 批量检测结果合约（跨模块安全子集）
 */
export interface AnomalyBatchResultContract {
  results: AnomalyResultContract[]
  totalCount: number
  anomalyCount: number
  timestamp: string
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toAnomalyResultContract(entity: AnomalyResult): AnomalyResultContract {
  return {
    metricKey: entity.metricKey,
    value: entity.value,
    baseline: entity.baseline,
    deviation: entity.deviation,
    score: entity.score,
    severity: entity.severity,
    detectors: {
      threeSigma: entity.detectors.threeSigma
        ? { zScore: entity.detectors.threeSigma.zScore, detected: entity.detectors.threeSigma.detected }
        : undefined,
      iqr: entity.detectors.iqr
        ? {
            lower: entity.detectors.iqr.lower,
            upper: entity.detectors.iqr.upper,
            deviation: entity.detectors.iqr.deviation,
            detected: entity.detectors.iqr.detected,
          }
        : undefined,
      ewma: entity.detectors.ewma
        ? { expected: entity.detectors.ewma.expected, deviation: entity.detectors.ewma.deviation, detected: entity.detectors.ewma.detected }
        : undefined,
    },
    whitelisted: entity.whitelisted,
    reason: entity.reason,
    detectedAt: entity.detectedAt,
  }
}

/** 引擎状态 -> 合约映射 */
export function toAnomalyEngineStatusContract(entity: AnomalyEngineStatus): AnomalyEngineStatusContract {
  return {
    engineName: entity.engineName,
    rulesCount: entity.rulesCount,
    status: entity.status,
    lastEvaluationAt: entity.lastEvaluationAt,
  }
}

/** 告警 -> 合约映射 */
export function toAnomalyAlertContract(entity: AnomalyAlert): AnomalyAlertContract {
  return {
    id: entity.id,
    metricKey: entity.metricKey,
    value: entity.value,
    score: entity.score,
    severity: entity.severity,
    message: entity.message,
    detectedAt: entity.detectedAt,
    acknowledged: entity.acknowledged,
  }
}

/** 批量检测 -> 合约映射 */
export function toAnomalyBatchResultContract(results: AnomalyResult[]): AnomalyBatchResultContract {
  return {
    results: results.map(toAnomalyResultContract),
    totalCount: results.length,
    anomalyCount: results.filter((r) => r.severity !== 'NORMAL').length,
    timestamp: new Date().toISOString(),
  }
}

/** 批量映射 */
export function toAnomalyResultContracts(entities: AnomalyResult[]): AnomalyResultContract[] {
  return entities.map(toAnomalyResultContract)
}

/** 批量映射 */
export function toAnomalyAlertContracts(entities: AnomalyAlert[]): AnomalyAlertContract[] {
  return entities.map(toAnomalyAlertContract)
}
