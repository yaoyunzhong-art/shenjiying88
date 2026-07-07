/**
 * AI 异常告警面板 - 类型定义
 */

/** 异常类型 */
export type AnomalyType = 'spike' | 'drop' | 'drift' | 'pattern_change' | 'outlier' | 'seasonal_break'

/** 异常严重度 */
export type AnomalySeverity = 'info' | 'warning' | 'critical'

/** 异常状态 */
export type AnomalyStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'

/** AI 决策记录 */
export interface AiDecision {
  id: string
  ruleName: string
  description: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  confidence: number // 0-1
  executedAt: string
  durationMs: number
  success: boolean
  errorMessage?: string
}

/** 异常告警 */
export interface AnomalyAlert {
  id: string
  anomalyType: AnomalyType
  severity: AnomalySeverity
  status: AnomalyStatus
  metric: string
  metricLabel: string
  currentValue: number
  baselineValue: number
  deviation: number // percentage
  message: string
  detectedAt: string
  resolvedAt?: string
  assignedTo?: string
  aiRecommendation?: string
  relatedDecisionId?: string
}

/** 异常趋势数据点 */
export interface AnomalyTrendPoint {
  timestamp: string
  value: number
  isAnomaly: boolean
  anomalyType?: AnomalyType
}

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  spike: '突增',
  drop: '突降',
  drift: '漂移',
  pattern_change: '模式变更',
  outlier: '离群点',
  seasonal_break: '季节性中断',
}

export const ANOMALY_TYPE_COLORS: Record<AnomalyType, string> = {
  spike: '#f5222d',
  drop: '#722ed1',
  drift: '#fa8c16',
  pattern_change: '#13c2c2',
  outlier: '#eb2f96',
  seasonal_break: '#faad14',
}

export const SEVERITY_LABELS: Record<AnomalySeverity, string> = {
  info: '提示',
  warning: '警告',
  critical: '严重',
}

export const SEVERITY_COLORS: Record<AnomalySeverity, string> = {
  info: '#1677ff',
  warning: '#fa8c16',
  critical: '#f5222d',
}

export const STATUS_LABELS: Record<AnomalyStatus, string> = {
  open: '待处理',
  investigating: '调查中',
  resolved: '已解决',
  dismissed: '已忽略',
}
