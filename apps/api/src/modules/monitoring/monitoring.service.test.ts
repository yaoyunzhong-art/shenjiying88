import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * MonitoringService test (V10 Day 9 Phase 93)
 */

import assert from 'node:assert/strict'
import { MonitoringService } from './monitoring.service'

describe('MonitoringService V10 Day 9 Phase 93', () => {
  let service: MonitoringService

  beforeEach(() => { service = new MonitoringService() })

  describe('Metrics', () => {
    it('lists builtin metrics', () => {
      const metrics = service.listMetricDefinitions()
      assert.ok(metrics.length >= 9)
      assert.ok(metrics.some((m) => m.name === 'http.error.rate'))
    })

    it('recordMetric adds timestamp', () => {
      const p = service.recordMetric({ name: 'http.error.rate', value: 0.01, labels: {} })
      assert.ok(p.timestamp)
      assert.equal(p.value, 0.01)
    })

    it('recordMetricsBatch counts', () => {
      const r = service.recordMetricsBatch([
        { name: 'http.request.count', value: 1, labels: {} },
        { name: 'http.request.count', value: 2, labels: {} },
      ])
      assert.equal(r.count, 2)
    })

    it('queryMetric returns recent points', () => {
      service.recordMetric({ name: 'cpu.usage_percent', value: 50, labels: {} })
      const points = service.queryMetric('cpu.usage_percent')
      assert.equal(points.length, 1)
    })

    it('getMetricAverage computes correctly', () => {
      service.recordMetric({ name: 'ai.latency.avg', value: 100, labels: {} })
      service.recordMetric({ name: 'ai.latency.avg', value: 200, labels: {} })
      const avg = service.getMetricAverage('ai.latency.avg')
      assert.equal(avg, 150)
    })

    it('getMetricAverage returns null when no data', () => {
      assert.equal(service.getMetricAverage('unknown.metric'), null)
    })
  })

  describe('Alert rules CRUD', () => {
    it('createAlertRule generates id', () => {
      const r = service.createAlertRule({
        name: 'T', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 90, durationSec: 60, severity: 'critical',
        channels: ['email'], enabled: true, createdBy: 'admin',
      })
      assert.ok(r.id.startsWith('rule-'))
    })

    it('listAlertRules returns seeded rules', () => {
      assert.ok(service.listAlertRules().length >= 3)
    })

    it('updateAlertRule patches fields', () => {
      const r = service.updateAlertRule('rule-seed-error-rate', { enabled: false })
      assert.ok(r)
      assert.equal(r.enabled, false)
    })

    it('updateAlertRule returns null for unknown', () => {
      assert.equal(service.updateAlertRule('unknown', {}), null)
    })
  })

  describe('Alert evaluation', () => {
    it('fires when threshold exceeded for duration', async () => {
      // durationSec = 60 for rule-seed-error-rate, threshold = 0.05
      // 模拟短时间: 我们手动设置 evalState
      // 直接测试: 用一个短 durationSec 的规则
      const rule = service.createAlertRule({
        name: 'Fast Test', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 50, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: true, createdBy: 'admin',
      })
      service.recordMetric({ name: 'cpu.usage_percent', value: 80, labels: {} })
      const alerts = service.listAlerts('firing')
      assert.ok(alerts.some((a) => a.ruleId === rule.id))
    })

    it('does not fire below threshold', () => {
      const rule = service.createAlertRule({
        name: 'Never Fire', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 90, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: true, createdBy: 'admin',
      })
      service.recordMetric({ name: 'cpu.usage_percent', value: 50, labels: {} })
      const alerts = service.listAlerts('firing').filter((a) => a.ruleId === rule.id)
      assert.equal(alerts.length, 0)
    })

    it('resolved when value drops back', () => {
      const rule = service.createAlertRule({
        name: 'Resolve Test', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 50, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: true, createdBy: 'admin',
      })
      service.recordMetric({ name: 'cpu.usage_percent', value: 80, labels: {} })
      assert.ok(service.listAlerts('firing').some((a) => a.ruleId === rule.id))
      service.recordMetric({ name: 'cpu.usage_percent', value: 10, labels: {} })
      // 平均 (80+10)/2 = 45 < 50, 不再 matched, 已 resolve
      assert.equal(service.listAlerts('firing').filter((a) => a.ruleId === rule.id).length, 0)
      const resolved = service.listAlerts('resolved').find((a) => a.ruleId === rule.id)
      assert.ok(resolved)
    })

    it('disabled rule does not fire', () => {
      const rule = service.createAlertRule({
        name: 'Disabled', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 50, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: false, createdBy: 'admin',
      })
      service.recordMetric({ name: 'cpu.usage_percent', value: 80, labels: {} })
      const alerts = service.listAlerts('firing').filter((a) => a.ruleId === rule.id)
      assert.equal(alerts.length, 0)
    })

    it('comparator lt fires when value below threshold', () => {
      const rule = service.createAlertRule({
        name: 'Low Traffic', metric: 'http.request.count', comparator: 'lt',
        threshold: 10, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: true, createdBy: 'admin',
      })
      service.recordMetric({ name: 'http.request.count', value: 5, labels: {} })
      assert.ok(service.listAlerts('firing').some((a) => a.ruleId === rule.id))
    })
  })

  describe('Alert management', () => {
    it('silenceAlert marks as silenced', () => {
      const rule = service.createAlertRule({
        name: 'Silence Test', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 50, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: true, createdBy: 'admin',
      })
      service.recordMetric({ name: 'cpu.usage_percent', value: 80, labels: {} })
      const alert = service.listAlerts('firing').find((a) => a.ruleId === rule.id)!
      const silenced = service.silenceAlert(alert.id, 3600, 'admin', 'maintenance')
      assert.equal(silenced!.status, 'silenced')
      assert.ok(silenced!.silencedUntil)
    })

    it('countBySeverity aggregates', () => {
      const rule = service.createAlertRule({
        name: 'Count Test', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 50, durationSec: 0, severity: 'critical',
        channels: ['in_app'], enabled: true, createdBy: 'admin',
      })
      service.recordMetric({ name: 'cpu.usage_percent', value: 90, labels: {} })
      const counts = service.countBySeverity()
      assert.ok(counts.critical >= 1)
    })

    it('audit logs recorded', () => {
      const rule = service.createAlertRule({
        name: 'Audit Test', metric: 'cpu.usage_percent', comparator: 'gt',
        threshold: 50, durationSec: 0, severity: 'warning',
        channels: ['in_app'], enabled: true, createdBy: 'admin',
      })
      service.recordMetric({ name: 'cpu.usage_percent', value: 80, labels: {} })
      const alert = service.listAlerts('firing').find((a) => a.ruleId === rule.id)!
      const audits = service.listAudits(alert.id)
      assert.ok(audits.some((a) => a.action === 'fire'))
    })
  })
})
