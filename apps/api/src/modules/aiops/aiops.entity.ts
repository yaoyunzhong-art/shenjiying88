// aiops.entity.ts - 自动补全
// 用途: AIOps 实体类型定义
import type { TimeSeriesPoint } from './aiops-prediction.service'

export type AnomalySeverity = 'NORMAL' | 'WARNING' | 'CRITICAL'

export interface AnomalyDetectInput {
  metricName: string
  value: number
  history: TimeSeriesPoint[]
  timestamp?: string
}

export interface AnomalyDetectResult {
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

export interface PredictInput {
  metricName: string
  horizon: number
  timestamp?: string
}

export interface PredictResult {
  metricName: string
  horizon: number
  predictedValues: number[]
  confidence: number
  predictedAt: string
}

export interface AttackDetectInput {
  metricName: string
  timestamp?: string
}

export interface AttackDetectResult {
  metricName: string
  isUnderAttack: boolean
  confidence: number
  attackType?: 'ddos' | 'brute_force' | 'data_exfil'
  evidence: string[]
  detectedAt: string
}

export interface HealInput {
  targetSystem: string
  timestamp?: string
}

export interface HealingActionResult {
  id: string
  targetSystem: string
  action: 'restart' | 'rollback' | 'scale' | 'isolate'
  status: 'pending' | 'running' | 'completed' | 'failed'
  triggeredAt: string
  completedAt?: string
  result?: string
}

export interface SystemHealthStatus {
  systemId: string
  status: 'healthy' | 'degraded' | 'critical' | 'unknown'
  lastCheck: string
  metrics: Record<string, number>
  issues: string[]
}

export interface AIOpsEngineStatus {
  engineName: 'AIOpsPredictionService'
  anomalyRulesCount: number
  attackRulesCount: number
  healedSystemsCount: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  lastDetectedAt?: string
}
