/**
 * 监控告警 - 类型 (V10 Day 9)
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
export type AlertChannel = 'email' | 'sms' | 'webhook' | 'in_app' | 'phone'
export type AlertStatus = 'firing' | 'resolved' | 'silenced'

export interface MetricDefinition {
  name: string
  type: MetricType
  unit: string
  description: string
  labels?: string[]
}

export interface MetricPoint {
  name: string
  value: number
  labels: Record<string, string>
  timestamp: string
}

export interface AlertRule {
  id: string
  name: string
  metric: string
  comparator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  threshold: number
  durationSec: number
  severity: AlertSeverity
  channels: AlertChannel[]
  enabled: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  status: AlertStatus
  value: number
  threshold: number
  message: string
  firedAt: string
  resolvedAt?: string
  silencedUntil?: string
  receivers: string[]
}

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: '信息', warning: '警告', error: '错误', critical: '严重',
}

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#1677ff', warning: '#fa8c16', error: '#f5222d', critical: '#a8071a',
}

export const STATUS_LABELS: Record<AlertStatus, string> = {
  firing: '告警中', resolved: '已恢复', silenced: '已静默',
}
