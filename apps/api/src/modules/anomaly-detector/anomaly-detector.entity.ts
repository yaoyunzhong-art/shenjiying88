// anomaly-detector.entity.ts - Phase-19 T26
// 用途: 异常检测实体类型定义
import type { TimeSeriesPoint } from '../time-series/time-series-collector.service'

export type AnomalySeverity = 'NORMAL' | 'WARNING' | 'CRITICAL'

export interface AnomalyDetectorConfig {
  whitelist?: Array<{ metricKey: string; reason: string; ttlMs?: number }>
  sigmaThreshold?: number
  ewmaAlpha?: number
  criticalThreshold?: number
  warningThreshold?: number
}

export interface ThreeSigmaResult {
  zScore: number
  detected: boolean
}

export interface IqrResult {
  lower: number
  upper: number
  deviation: number
  detected: boolean
}

export interface EwmaResult {
  expected: number
  deviation: number
  detected: boolean
}

export interface AnomalyDetectors {
  threeSigma?: ThreeSigmaResult
  iqr?: IqrResult
  ewma?: EwmaResult
}

export interface AnomalyResult {
  metricKey: string
  value: number
  baseline: number
  deviation: number
  score: number
  severity: AnomalySeverity
  detectors: AnomalyDetectors
  whitelisted: boolean
  reason: string
  detectedAt: string
}

export interface AnomalyDetectInput {
  metricKey: string
  value: number
  history: TimeSeriesPoint[]
  timestamp?: string
}

export interface AnomalyDetectBatchInput {
  points: Array<{ metricKey: string; value: number; history: TimeSeriesPoint[] }>
  timestamp?: string
}

export interface AnomalyEngineStatus {
  engineName: string
  rulesCount: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  lastEvaluationAt?: string
}

export interface AnomalyAlert {
  id: string
  metricKey: string
  value: number
  score: number
  severity: AnomalySeverity
  message: string
  detectedAt: string
  acknowledged: boolean
}
