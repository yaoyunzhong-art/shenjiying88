import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import type { MetricDefinition, AlertRule, Alert, AlertAuditLog } from './monitoring.entity'
import {
  toMetricDefinitionContract,
  toAlertRuleContract,
  toAlertContract,
  toAlertAuditLogContract,
  toMonitoringHealthContract,
  toMonitoringDashboardContract,
} from './monitoring.contract'

/* ── toMetricDefinitionContract ── */

it('toMetricDefinitionContract maps complete definition', () => {
  const def: MetricDefinition = {
    name: 'http.request.count',
    type: 'counter',
    unit: 'count',
    description: 'HTTP 请求总数',
    labels: ['method', 'path'],
  }

  const c = toMetricDefinitionContract(def)

  assert.equal(c.name, 'http.request.count')
  assert.equal(c.type, 'counter')
  assert.equal(c.unit, 'count')
  assert.equal(c.description, 'HTTP 请求总数')
  assert.deepStrictEqual(c.labels, ['method', 'path'])
})

it('toMetricDefinitionContract handles missing labels', () => {
  const def: MetricDefinition = {
    name: 'memory.usage_mb',
    type: 'gauge',
    unit: 'MB',
    description: '内存使用',
  }

  const c = toMetricDefinitionContract(def)

  assert.equal(c.name, 'memory.usage_mb')
  assert.deepStrictEqual(c.labels, [])
})

/* ── toAlertRuleContract ── */

it('toAlertRuleContract maps all fields', () => {
  const rule: AlertRule = {
    id: 'rule-123',
    name: '高 CPU 告警',
    metric: 'cpu.usage_percent',
    comparator: 'gt',
    threshold: 80,
    durationSec: 120,
    severity: 'warning',
    channels: ['email', 'in_app'],
    enabled: true,
    createdBy: 'admin',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T01:00:00.000Z',
  }

  const c = toAlertRuleContract(rule)

  assert.equal(c.id, 'rule-123')
  assert.equal(c.comparator, 'gt')
  assert.equal(c.threshold, 80)
  assert.equal(c.durationSec, 120)
  assert.equal(c.severity, 'warning')
  assert.ok(c.enabled)
  assert.equal(c.channels.length, 2)
})

it('toAlertRuleContract maps disabled rule', () => {
  const rule: AlertRule = {
    id: 'rule-456',
    name: '旧规则',
    metric: 'http.error.rate',
    comparator: 'gt',
    threshold: 0.1,
    durationSec: 30,
    severity: 'error',
    channels: ['email'],
    enabled: false,
    createdBy: 'system',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  }

  const c = toAlertRuleContract(rule)

  assert.equal(c.id, 'rule-456')
  assert.equal(c.enabled, false)
})

/* ── toAlertContract ── */

it('toAlertContract maps firing alert', () => {
  const alert: Alert = {
    id: 'alert-999',
    ruleId: 'rule-123',
    ruleName: '高 CPU 告警',
    severity: 'warning',
    status: 'firing',
    value: 85.5,
    threshold: 80,
    message: 'cpu.usage_percent > 80 (current: 85.50)',
    firedAt: '2026-07-10T03:00:00.000Z',
    receivers: [],
  }

  const c = toAlertContract(alert)

  assert.equal(c.id, 'alert-999')
  assert.equal(c.status, 'firing')
  assert.equal(c.value, 85.5)
  assert.equal(c.threshold, 80)
  assert.equal(c.receivers.length, 0)
  assert.equal(c.resolvedAt, undefined)
})

it('toAlertContract maps resolved alert', () => {
  const alert: Alert = {
    id: 'alert-888',
    ruleId: 'rule-456',
    ruleName: '错误率告警',
    severity: 'error',
    status: 'resolved',
    value: 0.02,
    threshold: 0.05,
    message: '已恢复',
    firedAt: '2026-07-10T02:00:00.000Z',
    resolvedAt: '2026-07-10T02:30:00.000Z',
    receivers: ['ops@email.com'],
  }

  const c = toAlertContract(alert)

  assert.equal(c.status, 'resolved')
  assert.equal(c.resolvedAt, '2026-07-10T02:30:00.000Z')
  assert.equal(c.receivers.length, 1)
  assert.equal(c.receivers[0], 'ops@email.com')
})

it('toAlertContract maps silenced alert', () => {
  const alert: Alert = {
    id: 'alert-777',
    ruleId: 'rule-789',
    ruleName: '测试告警',
    severity: 'info',
    status: 'silenced',
    value: 60,
    threshold: 50,
    message: '静默中',
    firedAt: '2026-07-10T01:00:00.000Z',
    silencedUntil: '2026-07-10T12:00:00.000Z',
    receivers: [],
  }

  const c = toAlertContract(alert)

  assert.equal(c.status, 'silenced')
  assert.equal(c.silencedUntil, '2026-07-10T12:00:00.000Z')
})

/* ── toAlertAuditLogContract ── */

it('toAlertAuditLogContract maps basic log', () => {
  const log: AlertAuditLog = {
    id: 'audit-001',
    alertId: 'alert-999',
    action: 'fire',
    timestamp: '2026-07-10T03:00:00.000Z',
  }

  const c = toAlertAuditLogContract(log)

  assert.equal(c.id, 'audit-001')
  assert.equal(c.action, 'fire')
  assert.equal(c.operator, undefined)
  assert.equal(c.reason, undefined)
})

it('toAlertAuditLogContract maps with operator and reason', () => {
  const log: AlertAuditLog = {
    id: 'audit-002',
    alertId: 'alert-777',
    action: 'silence',
    operator: 'admin',
    reason: '已知维护窗口',
    timestamp: '2026-07-10T03:05:00.000Z',
  }

  const c = toAlertAuditLogContract(log)

  assert.equal(c.action, 'silence')
  assert.equal(c.operator, 'admin')
  assert.equal(c.reason, '已知维护窗口')
})

/* ── toMonitoringHealthContract ── */

it('toMonitoringHealthContract returns ok when no alerts', () => {
  const c = toMonitoringHealthContract(5, 0, { info: 0, warning: 0, error: 0, critical: 0 })
  assert.equal(c.status, 'ok')
  assert.equal(c.highestSeverity, 'ok')
  assert.equal(c.ruleCount, 5)
  assert.equal(c.firingAlertCount, 0)
})

it('toMonitoringHealthContract returns degraded with warnings', () => {
  const c = toMonitoringHealthContract(3, 2, { info: 1, warning: 2, error: 0, critical: 0 })
  assert.equal(c.status, 'degraded')
  assert.equal(c.highestSeverity, 'warning')
})

it('toMonitoringHealthContract returns unavailable with errors', () => {
  const c = toMonitoringHealthContract(3, 3, { info: 0, warning: 0, error: 1, critical: 1 })
  assert.equal(c.status, 'unavailable')
  assert.equal(c.highestSeverity, 'critical')
})

/* ── toMonitoringDashboardContract ── */

it('toMonitoringDashboardContract builds full dashboard', () => {
  const defs: MetricDefinition[] = [
    { name: 'cpu.usage_percent', type: 'gauge', unit: '%', description: 'CPU 使用率' },
    { name: 'memory.usage_mb', type: 'gauge', unit: 'MB', description: '内存使用' },
  ]
  const alerts: Alert[] = [
    {
      id: 'a1', ruleId: 'r1', ruleName: 'CPU', severity: 'warning',
      status: 'firing', value: 90, threshold: 80, message: '高',
      firedAt: '2026-07-10T00:00:00.000Z', receivers: [],
    },
    {
      id: 'a2', ruleId: 'r2', ruleName: 'ERR', severity: 'error',
      status: 'firing', value: 0.1, threshold: 0.05, message: '错误率高',
      firedAt: '2026-07-10T00:01:00.000Z', receivers: ['ops'],
    },
  ]

  const d = toMonitoringDashboardContract(defs, alerts)

  assert.equal(d.metrics.length, 2)
  assert.equal(d.firingAlerts.length, 2)
  assert.equal(d.severityCount.warning, 1)
  assert.equal(d.severityCount.error, 1)
  assert.equal(d.severityCount.critical, 0)
  assert.equal(d.health.status, 'unavailable')
  assert.equal(d.health.highestSeverity, 'error')
  assert.equal(d.health.ruleCount, 2)
})

it('toMonitoringDashboardContract handles empty alerts', () => {
  const defs: MetricDefinition[] = [
    { name: 'cpu.usage_percent', type: 'gauge', unit: '%', description: 'CPU' },
  ]

  const d = toMonitoringDashboardContract(defs, [])

  assert.equal(d.metrics.length, 1)
  assert.equal(d.firingAlerts.length, 0)
  assert.deepStrictEqual(d.severityCount, { info: 0, warning: 0, error: 0, critical: 0 })
  assert.equal(d.health.status, 'ok')
  assert.equal(d.health.firingAlertCount, 0)
})
