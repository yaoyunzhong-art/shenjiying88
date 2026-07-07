import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * MonitoringController 单元测试 (node:test)
 *
 * 使用内联 Controller + Mock Service 覆盖所有路由端点
 * 正向流程 + 边界条件（空数据集、未知 ID、缺失参数）
 */

import assert from 'node:assert/strict'

// ── 内联 Controller (mirrors monitoring.controller.ts) ─────
class MonitoringController {
  constructor(private service: any) {}

  listMetrics() {
    const items = this.service.listMetricDefinitions()
    return { items, total: items.length }
  }

  record(body: any) {
    return this.service.recordMetric(body)
  }

  recordBatch(body: any) {
    return this.service.recordMetricsBatch(body.points)
  }

  getMetric(name: string, limit?: string) {
    return {
      name,
      definition: this.service.getMetricDefinition(name),
      points: this.service.queryMetric(name, limit ? parseInt(limit, 10) : 100),
      avg: this.service.getMetricAverage(name),
    }
  }

  listRules() {
    const items = this.service.listAlertRules()
    return { items, total: items.length }
  }

  createRule(body: any) {
    return this.service.createAlertRule(body)
  }

  updateRule(id: string, body: any) {
    const r = this.service.updateAlertRule(id, body)
    if (!r) throw new Error(`Rule ${id} not found`)
    return r
  }

  listAlerts(status?: string) {
    const items = this.service.listAlerts(status)
    return { items, total: items.length, severityCount: this.service.countBySeverity() }
  }

  silenceAlert(id: string, body: any) {
    const a = this.service.silenceAlert(id, body.durationSec, body.operator, body.reason)
    if (!a) throw new Error(`Alert ${id} not found`)
    return a
  }

  auditLogs(id: string) {
    const items = this.service.listAudits(id)
    return { items, total: items.length }
  }
}

// ── Mock Service 工厂 ────────────────────────────────────
function makeMockService(overrides: Record<string, any> = {}) {
  const now = Date.now()
  return {
    listMetricDefinitions: () => [
      { name: 'http.error.rate', type: 'gauge', unit: 'ratio', description: 'HTTP 错误率' },
      { name: 'cpu.usage_percent', type: 'gauge', unit: '%', description: 'CPU 使用率' },
    ],
    recordMetric: (point: any) => ({ ...point, timestamp: new Date(now).toISOString() }),
    recordMetricsBatch: (points: any[]) => ({ count: points.length }),
    queryMetric: () => [],
    getMetricDefinition: (name: string) =>
      name === 'http.error.rate'
        ? { name: 'http.error.rate', type: 'gauge', unit: 'ratio', description: 'HTTP 错误率' }
        : null,
    getMetricAverage: () => null,
    listAlertRules: () => [
      { id: 'rule-1', name: '高错误率告警', metric: 'http.error.rate', comparator: 'gt', threshold: 0.05, enabled: true },
      { id: 'rule-2', name: 'CPU 高占用', metric: 'cpu.usage_percent', comparator: 'gt', threshold: 80, enabled: true },
    ],
    createAlertRule: (input: any) => ({
      ...input,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    updateAlertRule: (id: string, patch: any) => {
      if (id === 'unknown-rule') return null
      return { id, ...patch, updatedAt: new Date().toISOString() }
    },
    listAlerts: (status?: string) => {
      const alerts = [{ id: 'alert-1', ruleId: 'rule-1', ruleName: '高错误率告警', severity: 'error', status: 'firing' }]
      if (status) return alerts.filter((a) => a.status === status)
      return alerts
    },
    countBySeverity: () => ({ info: 0, warning: 0, error: 1, critical: 0 }),
    silenceAlert: (id: string, durationSec: number, operator: string, reason?: string) => {
      if (id === 'non-existent') return null
      return {
        id, status: 'silenced', silencedUntil: new Date(Date.now() + durationSec * 1000).toISOString(),
        operator, reason,
      }
    },
    listAudits: (alertId: string) => {
      if (alertId === 'no-audit') return []
      return [{ id: 'audit-1', alertId, action: 'fire', timestamp: new Date().toISOString() }]
    },
    ...overrides,
  }
}

// ── 测试套件 ──────────────────────────────────────────────
describe('MonitoringController', () => {
  // ── GET /monitoring/metrics ─────────────────────────────
  describe('listMetrics()', () => {
    it('returns all metric definitions with total', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.listMetrics()

      assert.ok(Array.isArray(result.items))
      assert.equal(result.total, 2)
      assert.equal(result.items[0].name, 'http.error.rate')
    })

    it('each metric has required fields', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.listMetrics()

      for (const m of result.items) {
        assert.ok(typeof m.name === 'string')
        assert.ok(typeof m.type === 'string')
        assert.ok(typeof m.unit === 'string')
      }
    })
  })

  // ── POST /monitoring/metrics/record ────────────────────
  describe('record()', () => {
    it('records a metric point with timestamp', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.record({ name: 'cpu.usage_percent', value: 75, labels: { host: 'app-1' } })

      assert.ok(result.timestamp)
      assert.equal(result.name, 'cpu.usage_percent')
      assert.equal(result.value, 75)
    })
  })

  // ── POST /monitoring/metrics/record-batch ──────────────
  describe('recordBatch()', () => {
    it('records multiple metric points and returns count', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.recordBatch({
        points: [
          { name: 'cpu.usage_percent', value: 50, labels: {} },
          { name: 'memory.usage_mb', value: 2048, labels: {} },
        ],
      })

      assert.equal(result.count, 2)
    })

    it('handles empty batch gracefully', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.recordBatch({ points: [] })

      assert.equal(result.count, 0)
    })
  })

  // ── GET /monitoring/metrics/:name ───────────────────────
  describe('getMetric()', () => {
    it('returns metric definition, points, and average for known metric', () => {
      const now = new Date()
      const service = makeMockService({
        queryMetric: () => [{ name: 'http.error.rate', value: 0.03, labels: {}, timestamp: now.toISOString() }],
        getMetricAverage: () => 0.03,
      })
      const ctrl = new MonitoringController(service)
      const result = ctrl.getMetric('http.error.rate', '10')

      assert.equal(result.name, 'http.error.rate')
      assert.ok(result.definition)
      assert.ok(Array.isArray(result.points))
      assert.equal(result.points.length, 1)
      assert.equal(result.avg, 0.03)
    })

    it('returns null definition and empty points for unknown metric', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.getMetric('unknown.metric')

      assert.equal(result.definition, null)
      assert.ok(Array.isArray(result.points))
      assert.equal(result.points.length, 0)
      assert.equal(result.avg, null)
    })
  })

  // ── GET /monitoring/rules ───────────────────────────────
  describe('listRules()', () => {
    it('returns all alert rules with total', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.listRules()

      assert.ok(Array.isArray(result.items))
      assert.equal(result.total, 2)
    })
  })

  // ── POST /monitoring/rules/create ───────────────────────
  describe('createRule()', () => {
    it('creates a new alert rule with generated id', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const input = {
        name: '自定义告警', metric: 'memory.usage_mb', comparator: 'gt' as const,
        threshold: 1024, durationSec: 60, severity: 'warning' as const,
        channels: ['email'] as const, enabled: true, createdBy: 'admin',
      }
      const result = ctrl.createRule(input)

      assert.ok(result.id.startsWith('rule-'))
      assert.equal(result.name, '自定义告警')
      assert.equal(result.metric, 'memory.usage_mb')
      assert.ok(result.createdAt)
      assert.ok(result.updatedAt)
    })
  })

  // ── POST /monitoring/rules/:id/update ───────────────────
  describe('updateRule()', () => {
    it('updates existing rule and returns new config', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.updateRule('rule-1', { enabled: false })

      assert.equal(result.id, 'rule-1')
      assert.equal(result.enabled, false)
    })

    it('throws when rule id does not exist', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      assert.throws(
        () => ctrl.updateRule('unknown-rule', { enabled: false }),
        /Rule unknown-rule not found/,
      )
    })
  })

  // ── GET /monitoring/alerts ──────────────────────────────
  describe('listAlerts()', () => {
    it('returns all alerts with severity count', () => {
      const service = makeMockService({
        listAlerts: () => [
          { id: 'alert-1', ruleId: 'rule-1', severity: 'error', status: 'firing' },
          { id: 'alert-2', ruleId: 'rule-2', severity: 'warning', status: 'resolved' },
        ],
        countBySeverity: () => ({ info: 0, warning: 1, error: 1, critical: 0 }),
      })
      const ctrl = new MonitoringController(service)
      const result = ctrl.listAlerts()

      assert.ok(Array.isArray(result.items))
      assert.equal(result.total, 2)
      assert.equal(result.severityCount.error, 1)
    })

    it('filters alerts by status', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.listAlerts('firing')

      assert.equal(result.total, 1)
      assert.equal(result.items[0].status, 'firing')
    })

    it('returns empty array when no alerts', () => {
      const service = makeMockService({
        listAlerts: () => [],
        countBySeverity: () => ({ info: 0, warning: 0, error: 0, critical: 0 }),
      })
      const ctrl = new MonitoringController(service)
      const result = ctrl.listAlerts()

      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })
  })

  // ── POST /monitoring/alerts/:id/silence ─────────────────
  describe('silenceAlert()', () => {
    it('silences an active alert for specified duration', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.silenceAlert('alert-1', { durationSec: 3600, operator: 'admin', reason: '维护窗口' })

      assert.equal(result.status, 'silenced')
      assert.ok(result.silencedUntil)
      assert.equal(result.operator, 'admin')
    })

    it('throws when alert id does not exist', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      assert.throws(
        () => ctrl.silenceAlert('non-existent', { durationSec: 300, operator: 'admin' }),
        /Alert non-existent not found/,
      )
    })
  })

  // ── GET /monitoring/alerts/:id/audit ────────────────────
  describe('auditLogs()', () => {
    it('returns audit trail for an alert', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.auditLogs('alert-1')

      assert.ok(Array.isArray(result.items))
      assert.equal(result.total, 1)
      assert.equal(result.items[0].action, 'fire')
    })

    it('returns empty audit trail when no audit logs', () => {
      const service = makeMockService()
      const ctrl = new MonitoringController(service)
      const result = ctrl.auditLogs('no-audit')

      assert.equal(result.total, 0)
      assert.deepEqual(result.items, [])
    })
  })
})
