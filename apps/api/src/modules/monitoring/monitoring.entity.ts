/**
 * 监控告警 - Entity (V10 Day 9 Phase 93)
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

export type AlertChannel = 'email' | 'sms' | 'webhook' | 'in_app' | 'phone'

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
  /** 比较方式 */
  comparator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  /** 阈值 */
  threshold: number
  /** 持续时间 (秒) - 满足阈值 N 秒后触发 */
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
  status: 'firing' | 'resolved' | 'silenced'
  value: number
  threshold: number
  message: string
  firedAt: string
  resolvedAt?: string
  silencedUntil?: string
  /** 接收人 */
  receivers: string[]
}

export interface AlertAuditLog {
  id: string
  alertId: string
  action: 'fire' | 'resolve' | 'silence' | 'escalate'
  operator?: string
  reason?: string
  timestamp: string
}

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: '信息', warning: '警告', error: '错误', critical: '严重',
}

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#1677ff', warning: '#fa8c16', error: '#f5222d', critical: '#a8071a',
}

export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 1, warning: 2, error: 3, critical: 4,
}

export const BUILTIN_METRICS: MetricDefinition[] = [
  { name: 'http.request.duration_ms', type: 'histogram', unit: 'ms', description: 'HTTP 请求延迟' },
  { name: 'http.request.count', type: 'counter', unit: 'count', description: 'HTTP 请求总数' },
  { name: 'http.error.rate', type: 'gauge', unit: 'ratio', description: 'HTTP 错误率 (0-1)' },
  { name: 'ai.token.usage', type: 'counter', unit: 'tokens', description: 'AI Token 用量' },
  { name: 'ai.latency.avg', type: 'gauge', unit: 'ms', description: 'AI 平均延迟' },
  { name: 'db.connection.active', type: 'gauge', unit: 'count', description: '数据库活跃连接' },
  { name: 'db.query.duration_ms', type: 'histogram', unit: 'ms', description: 'DB 查询延迟' },
  { name: 'memory.usage_mb', type: 'gauge', unit: 'MB', description: '内存使用' },
  { name: 'cpu.usage_percent', type: 'gauge', unit: '%', description: 'CPU 使用率' },
]
