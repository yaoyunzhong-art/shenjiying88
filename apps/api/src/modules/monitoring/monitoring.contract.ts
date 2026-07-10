/**
 * 监控告警 - Contract (V10 Day 9 Phase 93)
 *
 * 用于 API 响应契约转换，确保对外数据格式统一。
 */

import type {
  MetricDefinition, MetricPoint, AlertRule, Alert, AlertAuditLog,
} from './monitoring.entity'

/** 指标定义对外契约 */
export interface MetricDefinitionContract {
  name: string
  type: string
  unit: string
  description: string
  labels: string[]
}

/** 指标点对外契约 */
export interface MetricPointContract {
  name: string
  value: number
  labels: Record<string, string>
  timestamp: string
}

/** 告警规则对外契约 */
export interface AlertRuleContract {
  id: string
  name: string
  metric: string
  comparator: string
  threshold: number
  durationSec: number
  severity: string
  channels: string[]
  enabled: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** 告警对外契约 */
export interface AlertContract {
  id: string
  ruleId: string
  ruleName: string
  severity: string
  status: string
  value: number
  threshold: number
  message: string
  firedAt: string
  resolvedAt?: string
  silencedUntil?: string
  receivers: string[]
}

/** 告警统计数据 */
export interface AlertCountBySeverity {
  info: number
  warning: number
  error: number
  critical: number
}

/** 审计日志对外契约 */
export interface AlertAuditLogContract {
  id: string
  alertId: string
  action: string
  operator?: string
  reason?: string
  timestamp: string
}

/** 健康检查摘要 */
export interface MonitoringHealthContract {
  status: 'ok' | 'degraded' | 'unavailable'
  ruleCount: number
  firingAlertCount: number
  highestSeverity: string
}

/** 监控仪表盘对外契约 */
export interface MonitoringDashboardContract {
  metrics: MetricDefinitionContract[]
  firingAlerts: AlertContract[]
  severityCount: AlertCountBySeverity
  health: MonitoringHealthContract
}

// ─── 转换函数 ───

export function toMetricDefinitionContract(def: MetricDefinition): MetricDefinitionContract {
  return {
    name: def.name,
    type: def.type,
    unit: def.unit,
    description: def.description,
    labels: def.labels ?? [],
  }
}

export function toMetricPointContract(pt: MetricPoint): MetricPointContract {
  return {
    name: pt.name,
    value: pt.value,
    labels: pt.labels,
    timestamp: pt.timestamp,
  }
}

export function toAlertRuleContract(rule: AlertRule): AlertRuleContract {
  return {
    id: rule.id,
    name: rule.name,
    metric: rule.metric,
    comparator: rule.comparator,
    threshold: rule.threshold,
    durationSec: rule.durationSec,
    severity: rule.severity,
    channels: rule.channels,
    enabled: rule.enabled,
    createdBy: rule.createdBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

export function toAlertContract(alert: Alert): AlertContract {
  return {
    id: alert.id,
    ruleId: alert.ruleId,
    ruleName: alert.ruleName,
    severity: alert.severity,
    status: alert.status,
    value: alert.value,
    threshold: alert.threshold,
    message: alert.message,
    firedAt: alert.firedAt,
    resolvedAt: alert.resolvedAt,
    silencedUntil: alert.silencedUntil,
    receivers: alert.receivers,
  }
}

export function toAlertAuditLogContract(log: AlertAuditLog): AlertAuditLogContract {
  return {
    id: log.id,
    alertId: log.alertId,
    action: log.action,
    operator: log.operator,
    reason: log.reason,
    timestamp: log.timestamp,
  }
}

export function toMonitoringHealthContract(
  ruleCount: number,
  firingAlertCount: number,
  severityCount: AlertCountBySeverity,
): MonitoringHealthContract {
  let highestSeverity: string = 'ok'
  if (severityCount.critical > 0) highestSeverity = 'critical'
  else if (severityCount.error > 0) highestSeverity = 'error'
  else if (severityCount.warning > 0) highestSeverity = 'warning'
  else if (severityCount.info > 0) highestSeverity = 'info'

  const status = severityCount.critical > 0 || severityCount.error > 0
    ? ('unavailable' as const)
    : severityCount.warning > 0
      ? ('degraded' as const)
      : ('ok' as const)

  return { status, ruleCount, firingAlertCount, highestSeverity }
}

export function toMonitoringDashboardContract(
  definitions: MetricDefinition[],
  firingAlerts: Alert[],
): MonitoringDashboardContract {
  const alertContracts = firingAlerts.map(toAlertContract)
  const severityCount: AlertCountBySeverity = { info: 0, warning: 0, error: 0, critical: 0 }
  for (const a of firingAlerts) {
    if (a.severity === 'critical') severityCount.critical++
    else if (a.severity === 'error') severityCount.error++
    else if (a.severity === 'warning') severityCount.warning++
    else if (a.severity === 'info') severityCount.info++
  }
  return {
    metrics: definitions.map(toMetricDefinitionContract),
    firingAlerts: alertContracts,
    severityCount,
    health: toMonitoringHealthContract(definitions.length, firingAlerts.length, severityCount),
  }
}
