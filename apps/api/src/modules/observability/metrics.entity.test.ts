/**
 * metrics.entity.test.ts — 可观测性模块实体/类型契约测试
 *
 * 覆盖 MetricDefinition 枚举、MetricsReport 接口、AlertRule 类型
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { METRIC_TYPE, type MetricsReport, type MetricSnapshot, type AlertRule } from './metrics.entity'

describe('metrics.entity — METRIC_TYPE enum', () => {
  test('每个枚举值对应既定字符串', () => {
    assert.equal(METRIC_TYPE.COUNTER, 'counter')
    assert.equal(METRIC_TYPE.GAUGE, 'gauge')
    assert.equal(METRIC_TYPE.HISTOGRAM, 'histogram')
  })

  test('枚举值是只读的，不可反向查找', () => {
    // TypeScript 数值枚举才有 reverse mapping，字符串枚举没有
    assert.equal(Object.keys(METRIC_TYPE).length, 3)
  })
})

describe('metrics.entity — MetricsReport 类型契约', () => {
  test('完整报告 shape 可以通过类型检查', () => {
    const now = new Date().toISOString()
    const report: MetricsReport = {
      generatedAt: now,
      totalMetrics: 3,
      snapshots: [
        {
          name: 'http_requests_total',
          type: METRIC_TYPE.COUNTER,
          help: 'Total HTTP requests',
          labels: { method: 'GET', path: '/api/foo', status: '200' },
          value: 42
        },
        {
          name: 'http_active_connections',
          type: METRIC_TYPE.GAUGE,
          help: 'Active connections',
          labels: {},
          value: 3
        },
        {
          name: 'http_request_duration_ms',
          type: METRIC_TYPE.HISTOGRAM,
          help: 'Request latency',
          labels: { method: 'POST', path: '/api/bar' },
          value: 150,
          buckets: { '5': 0, '10': 0, '25': 1, '+Inf': 1 },
          sum: 150,
          count: 1
        }
      ]
    }

    assert.equal(report.totalMetrics, 3)
    assert.equal(report.snapshots.length, 3)
    assert.equal(report.snapshots[0]?.type, METRIC_TYPE.COUNTER)
    assert.equal(report.snapshots[0]?.value, 42)
    assert.equal(report.snapshots[2]?.type, METRIC_TYPE.HISTOGRAM)
    assert.equal(report.snapshots[2]?.buckets?.['+Inf'], 1)
  })

  test('最小报告只含生成时间即可', () => {
    const report: MetricsReport = {
      generatedAt: new Date().toISOString(),
      totalMetrics: 0,
      snapshots: []
    }
    assert.equal(report.totalMetrics, 0)
    assert.equal(report.snapshots.length, 0)
  })
})

describe('metrics.entity — MetricSnapshot 类型契约', () => {
  test('Counter 快照不需要 buckets/sum/count', () => {
    const snapshot: MetricSnapshot = {
      name: 'http_exceptions_total',
      type: METRIC_TYPE.COUNTER,
      help: 'HTTP exceptions',
      labels: { method: 'GET', kind: 'Error' },
      value: 5
    }
    assert.equal(snapshot.name, 'http_exceptions_total')
    assert.equal(snapshot.value, 5)
    assert.equal(snapshot.buckets, undefined)
    assert.equal(snapshot.sum, undefined)
    assert.equal(snapshot.count, undefined)
  })

  test('Gauge 快照带空 labels', () => {
    const snapshot: MetricSnapshot = {
      name: 'process_uptime_seconds',
      type: METRIC_TYPE.GAUGE,
      help: 'Uptime',
      labels: {},
      value: 3600
    }
    assert.equal(snapshot.value, 3600)
    assert.deepEqual(snapshot.labels, {})
  })

  test('Histogram 快照包含分布信息', () => {
    const snapshot: MetricSnapshot = {
      name: 'http_request_duration_ms',
      type: METRIC_TYPE.HISTOGRAM,
      help: 'Duration',
      labels: { method: 'GET', path: '/metrics' },
      value: 0,
      buckets: { '5': 0, '10': 3, '+Inf': 5 },
      sum: 120,
      count: 5
    }
    assert.equal(snapshot.buckets?.['10'], 3)
    assert.equal(snapshot.count, 5)
    assert.equal(snapshot.sum, 120)
  })
})

describe('metrics.entity — AlertRule 类型契约', () => {
  test('完整告警规则定义', () => {
    const rule: AlertRule = {
      name: 'high_error_rate',
      metricName: 'http_exceptions_total',
      operator: '>',
      threshold: 100,
      duration: '5m',
      severity: 'warning',
      description: '5分钟内异常请求超过100次'
    }
    assert.equal(rule.name, 'high_error_rate')
    assert.equal(rule.metricName, 'http_exceptions_total')
    assert.equal(rule.operator, '>')
    assert.equal(rule.threshold, 100)
    assert.equal(rule.duration, '5m')
  })

  test('告警规则支持最小字段定义', () => {
    const rule: AlertRule = {
      name: 'critical_latency',
      metricName: 'http_request_duration_ms',
      operator: '>',
      threshold: 5000,
      duration: '1m',
      severity: 'critical'
    }
    // description 可选
    assert.equal(rule.description, undefined)
  })
})
