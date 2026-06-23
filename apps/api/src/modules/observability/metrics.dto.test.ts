/**
 * metrics.dto.test.ts — DTO 类型契约测试
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import type {
  MetricsListResponse,
  HealthzResponse,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
  AlertRuleResponse
} from './metrics.dto'

describe('metrics.dto — MetricsListResponse', () => {
  test('包含 metrics 列表和 count', () => {
    const resp: MetricsListResponse = {
      metrics: ['http_requests_total', 'http_active_connections'],
      count: 2
    }
    assert.equal(resp.count, 2)
    assert.equal(resp.metrics.length, 2)
  })

  test('空指标列表合法', () => {
    const resp: MetricsListResponse = { metrics: [], count: 0 }
    assert.equal(resp.count, 0)
    assert.deepEqual(resp.metrics, [])
  })
})

describe('metrics.dto — HealthzResponse', () => {
  test('正常状态包含 uptime', () => {
    const resp: HealthzResponse = { status: 'ok', metrics: 5, uptimeSeconds: 7200 }
    assert.equal(resp.status, 'ok')
    assert.equal(resp.uptimeSeconds, 7200)
  })

  test('支持 degraded/down 状态', () => {
    const degraded: HealthzResponse = { status: 'degraded', metrics: 3, uptimeSeconds: 60 }
    const down: HealthzResponse = { status: 'down', metrics: 0, uptimeSeconds: 0 }
    assert.equal(degraded.status, 'degraded')
    assert.equal(down.status, 'down')
  })
})

describe('metrics.dto — CreateAlertRuleRequest', () => {
  test('完整创建请求必须包含所有必填字段', () => {
    const req: CreateAlertRuleRequest = {
      name: 'high_error_rate',
      metricName: 'http_exceptions_total',
      operator: '>',
      threshold: 100,
      duration: '5m',
      severity: 'warning',
      description: '5分钟异常超限'
    }
    assert.equal(req.name, 'high_error_rate')
    assert.equal(req.severity, 'warning')
    assert.equal(req.description, '5分钟异常超限')
  })

  test('description 可选', () => {
    const req: CreateAlertRuleRequest = {
      name: 'critical_latency',
      metricName: 'http_request_duration_ms',
      operator: '>',
      threshold: 5000,
      duration: '1m',
      severity: 'critical'
    }
    assert.equal(req.description, undefined)
  })
})

describe('metrics.dto — UpdateAlertRuleRequest', () => {
  test('所有字段可选', () => {
    const req: UpdateAlertRuleRequest = { threshold: 200 }
    assert.equal(req.threshold, 200)
    assert.equal(req.name, undefined)
    assert.equal(req.severity, undefined)
  })
})

describe('metrics.dto — AlertRuleResponse', () => {
  test('继承 CreateAlertRuleRequest 并增加系统字段', () => {
    const resp: AlertRuleResponse = {
      id: 'rule-1',
      name: 'high_error_rate',
      metricName: 'http_exceptions_total',
      operator: '>',
      threshold: 100,
      duration: '5m',
      severity: 'warning',
      description: '异常超限',
      enabled: true,
      createdAt: '2026-06-24T00:00:00.000Z',
      updatedAt: '2026-06-24T00:00:00.000Z'
    }
    assert.equal(resp.id, 'rule-1')
    assert.equal(resp.enabled, true)
    assert.ok(resp.createdAt)
    assert.ok(resp.updatedAt)
  })

  test('disabled 规则也合法', () => {
    const resp: AlertRuleResponse = {
      id: 'rule-2',
      name: 'old_rule',
      metricName: 'process_uptime_seconds',
      operator: '<',
      threshold: 0,
      duration: '1m',
      severity: 'info',
      enabled: false,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z'
    }
    assert.equal(resp.enabled, false)
  })
})
