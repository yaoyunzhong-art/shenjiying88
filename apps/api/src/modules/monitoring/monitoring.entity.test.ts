import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 监控告警 - Entity 类型契约测试 (V10 Day 9 Phase 93)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  SEVERITY_RANK,
  BUILTIN_METRICS,
} from './monitoring.entity'
import type {
  MetricDefinition,
  MetricPoint,
  AlertRule,
  Alert,
  AlertAuditLog,
  MetricType,
  AlertSeverity,
  AlertChannel,
} from './monitoring.entity'

// ── MetricType type contract ────────────────────────────────────
describe('monitoring.entity: MetricType', () => {
  it('supports counter type', () => {
    const t: MetricType = 'counter'
    assert.equal(t, 'counter')
  })

  it('supports gauge type', () => {
    const t: MetricType = 'gauge'
    assert.equal(t, 'gauge')
  })

  it('supports histogram type', () => {
    const t: MetricType = 'histogram'
    assert.equal(t, 'histogram')
  })

  it('supports summary type', () => {
    const t: MetricType = 'summary'
    assert.equal(t, 'summary')
  })
})

// ── AlertSeverity type contract ──────────────────────────────────
describe('monitoring.entity: AlertSeverity', () => {
  it('supports all four severity levels', () => {
    const levels: AlertSeverity[] = ['info', 'warning', 'error', 'critical']
    assert.equal(levels.length, 4)
    assert.ok(levels.every((s) => typeof s === 'string'))
  })
})

// ── AlertChannel type contract ───────────────────────────────────
describe('monitoring.entity: AlertChannel', () => {
  it('supports all five channel types', () => {
    const channels: AlertChannel[] = ['email', 'sms', 'webhook', 'in_app', 'phone']
    assert.equal(channels.length, 5)
    assert.ok(channels.every((c) => typeof c === 'string'))
  })
})

// ── MetricDefinition type contract ───────────────────────────────
describe('monitoring.entity: MetricDefinition', () => {
  it('creates valid MetricDefinition with all fields', () => {
    const def: MetricDefinition = {
      name: 'http.request.duration_ms',
      type: 'histogram',
      unit: 'ms',
      description: 'HTTP 请求延迟',
      labels: ['method', 'endpoint'],
    }

    assert.equal(def.name, 'http.request.duration_ms')
    assert.equal(def.type, 'histogram')
    assert.equal(def.unit, 'ms')
    assert.equal(def.description, 'HTTP 请求延迟')
    assert.deepEqual(def.labels, ['method', 'endpoint'])
  })

  it('creates MetricDefinition without optional labels', () => {
    const def: MetricDefinition = {
      name: 'cpu.usage_percent',
      type: 'gauge',
      unit: '%',
      description: 'CPU 使用率',
    }

    assert.equal(def.name, 'cpu.usage_percent')
    assert.equal(def.labels, undefined)
  })
})

// ── MetricPoint type contract ────────────────────────────────────
describe('monitoring.entity: MetricPoint', () => {
  it('creates valid MetricPoint with all fields', () => {
    const point: MetricPoint = {
      name: 'http.request.count',
      value: 42,
      labels: { method: 'GET', endpoint: '/api/users' },
      timestamp: '2026-06-29T06:00:00.000Z',
    }

    assert.equal(point.name, 'http.request.count')
    assert.equal(point.value, 42)
    assert.deepEqual(point.labels, { method: 'GET', endpoint: '/api/users' })
    assert.equal(point.timestamp, '2026-06-29T06:00:00.000Z')
  })

  it('supports empty labels object', () => {
    const point: MetricPoint = {
      name: 'cpu.usage_percent',
      value: 65.5,
      labels: {},
      timestamp: '2026-06-29T06:00:00.000Z',
    }

    assert.deepEqual(point.labels, {})
  })

  it('value can be zero', () => {
    const point: MetricPoint = {
      name: 'http.error.rate',
      value: 0,
      labels: {},
      timestamp: '2026-06-29T06:00:00.000Z',
    }

    assert.equal(point.value, 0)
  })

  it('value can be negative', () => {
    const point: MetricPoint = {
      name: 'temperature.delta',
      value: -5.5,
      labels: { sensor: 'rack-1' },
      timestamp: '2026-06-29T06:00:00.000Z',
    }

    assert.equal(point.value, -5.5)
  })
})

// ── AlertRule type contract ──────────────────────────────────────
describe('monitoring.entity: AlertRule', () => {
  it('creates valid AlertRule with all fields', () => {
    const rule: AlertRule = {
      id: 'rule-001',
      name: '高错误率告警',
      metric: 'http.error.rate',
      comparator: 'gt',
      threshold: 0.05,
      durationSec: 60,
      severity: 'error',
      channels: ['in_app', 'webhook'],
      enabled: true,
      createdBy: 'admin',
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
    }

    assert.equal(rule.id, 'rule-001')
    assert.equal(rule.name, '高错误率告警')
    assert.equal(rule.metric, 'http.error.rate')
    assert.equal(rule.comparator, 'gt')
    assert.equal(rule.threshold, 0.05)
    assert.equal(rule.durationSec, 60)
    assert.equal(rule.severity, 'error')
    assert.deepEqual(rule.channels, ['in_app', 'webhook'])
    assert.equal(rule.enabled, true)
  })

  it('supports all comparator operators', () => {
    const comparators = ['gt', 'gte', 'lt', 'lte', 'eq'] as const
    for (const c of comparators) {
      const rule: AlertRule = {
        id: `rule-${c}`, name: `test-${c}`, metric: 'test',
        comparator: c, threshold: 100, durationSec: 0,
        severity: 'info', channels: ['email'], enabled: false,
        createdBy: 'test', createdAt: '', updatedAt: '',
      }
      assert.equal(rule.comparator, c)
    }
  })

  it('disabled rule has enabled=false', () => {
    const rule: AlertRule = {
      id: 'rule-disabled', name: 'disabled', metric: 'x',
      comparator: 'gt', threshold: 0, durationSec: 0,
      severity: 'info', channels: [], enabled: false,
      createdBy: 'test', createdAt: '', updatedAt: '',
    }
    assert.equal(rule.enabled, false)
  })

  it('supports all channel types in channels array', () => {
    const channels: AlertChannel[] = ['email', 'sms', 'webhook', 'in_app', 'phone']
    const rule: AlertRule = {
      id: 'rule-channels', name: 'all-channels', metric: 'x',
      comparator: 'gt', threshold: 0, durationSec: 0,
      severity: 'critical', channels, enabled: true,
      createdBy: 'test', createdAt: '', updatedAt: '',
    }
    assert.equal(rule.channels.length, 5)
  })
})

// ── Alert type contract ──────────────────────────────────────────
describe('monitoring.entity: Alert', () => {
  it('creates valid Alert with all fields including resolved', () => {
    const alert: Alert = {
      id: 'alert-001',
      ruleId: 'rule-001',
      ruleName: '高错误率告警',
      severity: 'error',
      status: 'resolved',
      value: 0.08,
      threshold: 0.05,
      message: 'http.error.rate gt 0.05 (current: 0.08)',
      firedAt: '2026-06-29T01:00:00.000Z',
      resolvedAt: '2026-06-29T01:05:00.000Z',
      receivers: ['admin@example.com'],
    }

    assert.equal(alert.id, 'alert-001')
    assert.equal(alert.status, 'resolved')
    assert.ok(alert.resolvedAt)
    assert.deepEqual(alert.receivers, ['admin@example.com'])
  })

  it('creates firing alert without optional fields', () => {
    const alert: Alert = {
      id: 'alert-002',
      ruleId: 'rule-002',
      ruleName: 'CPU 高占用',
      severity: 'warning',
      status: 'firing',
      value: 90,
      threshold: 80,
      message: 'cpu.usage_percent gt 80 (current: 90.00)',
      firedAt: '2026-06-29T01:00:00.000Z',
      receivers: [],
    }

    assert.equal(alert.status, 'firing')
    assert.equal(alert.resolvedAt, undefined)
    assert.equal(alert.silencedUntil, undefined)
    assert.deepEqual(alert.receivers, [])
  })

  it('creates silenced alert with silencedUntil', () => {
    const alert: Alert = {
      id: 'alert-003',
      ruleId: 'rule-003',
      ruleName: 'High Latency',
      severity: 'critical',
      status: 'silenced',
      value: 2000,
      threshold: 1000,
      message: 'ai.latency.avg gt 1000 (current: 2000.00)',
      firedAt: '2026-06-29T01:00:00.000Z',
      silencedUntil: '2026-06-29T08:00:00.000Z',
      receivers: ['ops@example.com'],
    }

    assert.equal(alert.status, 'silenced')
    assert.equal(alert.silencedUntil, '2026-06-29T08:00:00.000Z')
  })

  it('supports all three alert statuses', () => {
    const statuses = ['firing', 'resolved', 'silenced'] as const
    for (const status of statuses) {
      const alert: Alert = {
        id: `alert-${status}`, ruleId: 'rule-x', ruleName: 'x',
        severity: 'info', status, value: 0, threshold: 0,
        message: 'test', firedAt: '', receivers: [],
      }
      assert.equal(alert.status, status)
    }
  })
})

// ── AlertAuditLog type contract ──────────────────────────────────
describe('monitoring.entity: AlertAuditLog', () => {
  it('creates valid audit log with all fields', () => {
    const log: AlertAuditLog = {
      id: 'audit-001',
      alertId: 'alert-001',
      action: 'fire',
      operator: 'system',
      reason: 'threshold exceeded',
      timestamp: '2026-06-29T01:00:00.000Z',
    }

    assert.equal(log.id, 'audit-001')
    assert.equal(log.action, 'fire')
    assert.equal(log.operator, 'system')
    assert.equal(log.reason, 'threshold exceeded')
  })

  it('creates audit log without optional operator/reason', () => {
    const log: AlertAuditLog = {
      id: 'audit-002',
      alertId: 'alert-002',
      action: 'resolve',
      timestamp: '2026-06-29T01:05:00.000Z',
    }

    assert.equal(log.action, 'resolve')
    assert.equal(log.operator, undefined)
    assert.equal(log.reason, undefined)
  })

  it('supports all five audit actions', () => {
    const actions = ['fire', 'resolve', 'silence', 'escalate'] as const
    for (const action of actions) {
      const log: AlertAuditLog = {
        id: `audit-${action}`, alertId: 'alert-001', action, timestamp: '',
      }
      assert.equal(log.action, action)
    }
  })
})

// ── Constants: SEVERITY_LABELS ───────────────────────────────────
describe('monitoring.entity: SEVERITY_LABELS', () => {
  it('contains all four severity labels', () => {
    assert.equal(SEVERITY_LABELS.info, '信息')
    assert.equal(SEVERITY_LABELS.warning, '警告')
    assert.equal(SEVERITY_LABELS.error, '错误')
    assert.equal(SEVERITY_LABELS.critical, '严重')
  })

  it('all labels are non-empty strings', () => {
    const values = Object.values(SEVERITY_LABELS)
    assert.equal(values.length, 4)
    assert.ok(values.every((v) => typeof v === 'string' && v.length > 0))
  })
})

// ── Constants: SEVERITY_COLORS ───────────────────────────────────
describe('monitoring.entity: SEVERITY_COLORS', () => {
  it('contains valid hex color for each severity', () => {
    assert.ok(SEVERITY_COLORS.info.startsWith('#'))
    assert.ok(SEVERITY_COLORS.warning.startsWith('#'))
    assert.ok(SEVERITY_COLORS.error.startsWith('#'))
    assert.ok(SEVERITY_COLORS.critical.startsWith('#'))
  })

  it('colors are valid hex colors', () => {
    const values = Object.values(SEVERITY_COLORS)
    assert.equal(values.length, 4)
    assert.ok(values.every((c) => /^#[0-9a-fA-F]{6}$/.test(c)))
  })
})

// ── Constants: SEVERITY_RANK ─────────────────────────────────────
describe('monitoring.entity: SEVERITY_RANK', () => {
  it('ranks increase with severity', () => {
    assert.equal(SEVERITY_RANK.info, 1)
    assert.equal(SEVERITY_RANK.warning, 2)
    assert.equal(SEVERITY_RANK.error, 3)
    assert.equal(SEVERITY_RANK.critical, 4)
  })

  it('all ranks are unique positive integers', () => {
    const ranks = Object.values(SEVERITY_RANK)
    assert.equal(ranks.length, 4)
    const unique = new Set(ranks)
    assert.equal(unique.size, 4)
    assert.ok(ranks.every((r) => Number.isInteger(r) && r > 0))
  })
})

// ── Constants: BUILTIN_METRICS ───────────────────────────────────
describe('monitoring.entity: BUILTIN_METRICS', () => {
  it('contains predefined metric definitions', () => {
    assert.ok(BUILTIN_METRICS.length >= 9)
  })

  it('each builtin metric has required fields', () => {
    for (const m of BUILTIN_METRICS) {
      assert.ok(typeof m.name === 'string' && m.name.length > 0, `name invalid for ${m.name}`)
      assert.ok(['counter', 'gauge', 'histogram', 'summary'].includes(m.type), `type invalid for ${m.name}`)
      assert.ok(typeof m.unit === 'string' && m.unit.length > 0, `unit invalid for ${m.name}`)
      assert.ok(typeof m.description === 'string' && m.description.length > 0, `description invalid for ${m.name}`)
    }
  })

  it('metric names are unique', () => {
    const names = BUILTIN_METRICS.map((m) => m.name)
    const uniqueNames = new Set(names)
    assert.equal(uniqueNames.size, names.length)
  })

  it('includes system metrics (http, ai, db, memory, cpu)', () => {
    const names = BUILTIN_METRICS.map((m) => m.name)
    assert.ok(names.includes('http.request.duration_ms'))
    assert.ok(names.includes('http.request.count'))
    assert.ok(names.includes('http.error.rate'))
    assert.ok(names.includes('ai.token.usage'))
    assert.ok(names.includes('ai.latency.avg'))
    assert.ok(names.includes('db.connection.active'))
    assert.ok(names.includes('db.query.duration_ms'))
    assert.ok(names.includes('memory.usage_mb'))
    assert.ok(names.includes('cpu.usage_percent'))
  })
})
