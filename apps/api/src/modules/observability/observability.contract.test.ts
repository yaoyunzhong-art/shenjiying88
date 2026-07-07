import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [observability] [A] contract 补全
 *
 * ObservabilityContract 转换函数测试：
 * - MetricSnapshot → MetricSnapshotContract
 * - MetricsReport → MetricsReportContract
 * - AlertRule → AlertRuleContract
 * - Healthz → HealthzContract
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { METRIC_TYPE, type MetricSnapshot, type MetricsReport, type AlertRule } from './metrics.entity'
import {
  toMetricSnapshotContract,
  toMetricsReportContract,
  toAlertRuleContract,
  toHealthzContract
} from './observability.contract'

// ── Fixtures ──

const SNAPSHOT_FIXTURE: MetricSnapshot = {
  name: 'http_requests_total',
  type: METRIC_TYPE.COUNTER,
  help: 'Total HTTP requests',
  labels: { method: 'GET', status: 200, path: '/api/health' },
  value: 42
}

const HISTOGRAM_FIXTURE: MetricSnapshot = {
  name: 'request_duration_ms',
  type: METRIC_TYPE.HISTOGRAM,
  help: 'Request duration in ms',
  labels: { method: 'POST' },
  value: 0,
  buckets: { '10': 5, '50': 15, '100': 25, '+Inf': 30 },
  sum: 450,
  count: 30
}

const REPORT_FIXTURE: MetricsReport = {
  generatedAt: '2026-06-25T01:00:00.000Z',
  totalMetrics: 2,
  snapshots: [SNAPSHOT_FIXTURE, HISTOGRAM_FIXTURE]
}

const ALERT_RULE_FIXTURE: AlertRule & { id: string; enabled: boolean; createdAt: string; updatedAt: string } = {
  id: 'alert-1',
  name: 'High Error Rate',
  metricName: 'http_requests_total',
  operator: '>',
  threshold: 100,
  duration: '5m',
  severity: 'critical',
  description: 'Trigger when total requests exceed 100 in 5 minutes',
  enabled: true,
  createdAt: '2026-06-25T00:00:00.000Z',
  updatedAt: '2026-06-25T00:00:00.000Z'
}

// ── Tests ──

describe('observability.contract - MetricSnapshot', () => {

  it('toMetricSnapshotContract maps all fields', () => {
    const result = toMetricSnapshotContract(SNAPSHOT_FIXTURE)
    assert.equal(result.name, 'http_requests_total')
    assert.equal(result.type, METRIC_TYPE.COUNTER)
    assert.equal(result.help, 'Total HTTP requests')
    assert.equal(result.value, 42)
    assert.equal(result.labels.method, 'GET')
    assert.equal(result.labels.status, 200)
  })

  it('toMetricSnapshotContract preserves histogram fields', () => {
    const result = toMetricSnapshotContract(HISTOGRAM_FIXTURE)
    assert.equal(result.type, METRIC_TYPE.HISTOGRAM)
    assert.ok(result.buckets)
    assert.equal(result.buckets!['+Inf'], 30)
    assert.equal(result.sum, 450)
    assert.equal(result.count, 30)
  })

  it('toMetricSnapshotContract handles empty labels', () => {
    const emptyLabels: MetricSnapshot = {
      name: 'empty_metric',
      type: METRIC_TYPE.GAUGE,
      help: 'A metric with no labels',
      labels: {},
      value: 0
    }
    const result = toMetricSnapshotContract(emptyLabels)
    assert.deepEqual(result.labels, {})
    assert.equal(result.value, 0)
  })
})

describe('observability.contract - MetricsReport', () => {

  it('toMetricsReportContract maps report fields', () => {
    const result = toMetricsReportContract(REPORT_FIXTURE)
    assert.equal(result.generatedAt, REPORT_FIXTURE.generatedAt)
    assert.equal(result.totalMetrics, 2)
    assert.equal(result.snapshots.length, 2)
  })

  it('toMetricsReportContract converts all snapshots', () => {
    const result = toMetricsReportContract(REPORT_FIXTURE)
    assert.equal(result.snapshots[0].name, 'http_requests_total')
    assert.equal(result.snapshots[1].name, 'request_duration_ms')
    assert.equal(result.snapshots[1].type, METRIC_TYPE.HISTOGRAM)
  })

  it('toMetricsReportContract handles empty snapshots', () => {
    const empty: MetricsReport = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      totalMetrics: 0,
      snapshots: []
    }
    const result = toMetricsReportContract(empty)
    assert.equal(result.totalMetrics, 0)
    assert.equal(result.snapshots.length, 0)
  })
})

describe('observability.contract - AlertRule', () => {

  it('toAlertRuleContract maps all fields', () => {
    const result = toAlertRuleContract(ALERT_RULE_FIXTURE)
    assert.equal(result.id, 'alert-1')
    assert.equal(result.name, 'High Error Rate')
    assert.equal(result.operator, '>')
    assert.equal(result.threshold, 100)
    assert.equal(result.severity, 'critical')
    assert.equal(result.enabled, true)
  })

  it('toAlertRuleContract handles optional description', () => {
    const noDesc = { ...ALERT_RULE_FIXTURE, description: undefined, id: 'alert-2' }
    const result = toAlertRuleContract(noDesc)
    assert.equal(result.description, undefined)
  })

  it('toAlertRuleContract preserves timestamps', () => {
    const result = toAlertRuleContract(ALERT_RULE_FIXTURE)
    assert.equal(result.createdAt, '2026-06-25T00:00:00.000Z')
    assert.equal(result.updatedAt, '2026-06-25T00:00:00.000Z')
  })
})

describe('observability.contract - Healthz', () => {

  it('toHealthzContract returns correct structure', () => {
    const result = toHealthzContract('ok', 5, 12345)
    assert.equal(result.status, 'ok')
    assert.equal(result.metrics, 5)
    assert.equal(result.uptimeSeconds, 12345)
  })

  it('toHealthzContract handles degraded status', () => {
    const result = toHealthzContract('degraded', 3, 600)
    assert.equal(result.status, 'degraded')
  })

  it('toHealthzContract handles down status', () => {
    const result = toHealthzContract('down', 0, 0)
    assert.equal(result.status, 'down')
    assert.equal(result.metrics, 0)
  })
})
