import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [time-series] [D] 合约测试
 *
 * 验证 time-series 模块的实体 Shape、业务逻辑契约
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import { TimeSeriesService } from './time-series.service'
import type { WindowSize } from './time-series.dto'
import type { TimeSeriesMetricEntity } from './time-series.entity'
import {
  toTimeSeriesMetricContract,
  toAggregateContract,
  toAlertRuleContract,
  toAlertEventContract,
  toTimeSeriesSummaryContract,
  toCollectorStatusContract,
  toSeasonalityPatternContract,
  toWindowCompareResultContracts,
} from './time-series.contract'

// ─── 服务实例 helper ──────────────────────────────────

function makeColl(): TimeSeriesCollectorService {
  const svc = new TimeSeriesCollectorService()
  svc.resetForTests()
  return svc
}

function makeService(): { collector: TimeSeriesCollectorService; service: TimeSeriesService } {
  const collector = makeColl()
  const service = new TimeSeriesService(collector)
  return { collector, service }
}

function seedMetrics(collector: TimeSeriesCollectorService): void {
  const now = Date.now()
  // 写入 60 个点: 过去 60 分钟内每分钟一个点，值 50~150
  for (let i = 60; i >= 1; i--) {
    collector.recordMetric({
      metricName: 'api_latency_ms',
      value: 80 + Math.round(Math.random() * 70),
      timestamp: new Date(now - i * 60 * 1000).toISOString(),
    })
  }
  // 写入 10 个异常高值点
  for (let i = 10; i >= 1; i--) {
    collector.recordMetric({
      metricName: 'api_latency_ms',
      value: 500 + Math.round(Math.random() * 500),
      timestamp: new Date(now - i * 120 * 1000).toISOString(),
    })
  }
  // 第二个指标: cpu_usage
  for (let i = 60; i >= 1; i--) {
    collector.recordMetric({
      metricName: 'cpu_usage',
      tenantId: 't-001',
      value: 30 + Math.round(Math.random() * 40),
      timestamp: new Date(now - i * 60 * 1000).toISOString(),
    })
  }
}

// ─── 合约: 实体 Shape ─────────────────────────────────

describe('[time-series] 合约: 时序数据 Shape', () => {
  it('recordMetric + query 返回完整 TimeSeriesMetricEntity', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'test_metric', value: 100 })
    const result = collector.query({ metricName: 'test_metric', window: '30d' })

    assert.equal(typeof result.metricKey, 'string')
    assert.equal(result.metricKey, 'test_metric:global')
    assert.equal(result.window, '30d')
    assert.ok(Array.isArray(result.points))
    assert.ok(result.points.length >= 1)
    assert.equal(typeof result.aggregate, 'object')
    assert.equal(result.aggregate.count, result.points.length)
    assert.equal(typeof result.seasonality, 'number')
    assert.ok(result.seasonality >= 0)
  })

  it('aggregate 字段完整性', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'agg_test', value: 10 })
    collector.recordMetric({ metricName: 'agg_test', value: 20 })
    collector.recordMetric({ metricName: 'agg_test', value: 30 })
    const result = collector.query({ metricName: 'agg_test', window: '30d' })

    assert.equal(result.aggregate.min, 10)
    assert.equal(result.aggregate.max, 30)
    assert.equal(result.aggregate.avg, 20)
    assert.equal(result.aggregate.p50, 20)
    assert.equal(result.aggregate.count, 3)
    assert.ok(result.aggregate.p95 >= 20)
    assert.ok(result.aggregate.p99 >= 20)
  })

  it('空数据返回零值', () => {
    const { collector } = makeService()
    const result = collector.query({ metricName: 'empty_metric', window: '1h' })
    assert.equal(result.aggregate.count, 0)
    assert.equal(result.aggregate.min, 0)
    assert.equal(result.aggregate.avg, 0)
    assert.equal(result.aggregate.max, 0)
  })
})

// ─── 合约: 窗口查询 ───────────────────────────────────

describe('[time-series] 合约: 窗口查询', () => {
  it('1h 窗口只返回最近 1 小时数据', () => {
    const { collector } = makeService()
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const recent = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    collector.recordMetric({ metricName: 'window_test', value: 10, timestamp: old })
    collector.recordMetric({ metricName: 'window_test', value: 20, timestamp: recent })
    const result = collector.query({ metricName: 'window_test', window: '1h' })
    assert.equal(result.points.length, 1)
    assert.equal(result.points[0].value, 20)
  })

  it('30d 窗口包含所有点', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'wide_window', value: 10 })
    collector.recordMetric({ metricName: 'wide_window', value: 20 })
    const result = collector.query({ metricName: 'wide_window', window: '30d' })
    assert.equal(result.points.length, 2)
  })

  it('不同窗口返回不同粒度', () => {
    const { collector } = makeService()
    seedMetrics(collector)
    const h1 = collector.query({ metricName: 'api_latency_ms', window: '1h' })
    const h24 = collector.query({ metricName: 'api_latency_ms', window: '24h' })
    // 1h 窗口点数 <= 24h 窗口点数
    assert.ok(h1.points.length <= h24.points.length)
  })
})

// ─── 合约: 季节性识别 ─────────────────────────────────

describe('[time-series] 合约: 季节性识别', () => {
  it('detectSeasonality 返回 daily/weekly/monthly 模式', () => {
    const { collector } = makeService()
    seedMetrics(collector)
    const pattern = collector.detectSeasonality({ metricName: 'api_latency_ms' })

    assert.ok(Array.isArray(pattern.daily))
    assert.equal(pattern.daily.length, 24)
    assert.ok(Array.isArray(pattern.weekly))
    assert.equal(pattern.weekly.length, 7)
    assert.ok(Array.isArray(pattern.monthly))
    assert.equal(pattern.monthly.length, 31)
    // 每天至少有一个均值
    assert.ok(pattern.daily.some((v) => v > 0))
  })

  it('空数据的季节性指数为 0', () => {
    const { collector } = makeService()
    const metric = collector.query({ metricName: 'empty_season', window: '30d' })
    assert.equal(metric.seasonality, 0)
  })

  it('周期性数据产生非零季节性指数', () => {
    const { collector } = makeService()
    const now = Date.now()
    // 写入严格周期的数据: 每小时峰值
    for (let day = 0; day < 7; day++) {
      for (let h = 0; h < 24; h++) {
        const value = h >= 9 && h <= 18 ? 200 : 50 // 工作时间高, 非工作时间低
        collector.recordMetric({
          metricName: 'seasonal_metric',
          value,
          timestamp: new Date(now - day * 24 * 3600 * 1000 - (23 - h) * 3600 * 1000).toISOString(),
        })
      }
    }
    const metric = collector.query({ metricName: 'seasonal_metric', window: '30d' })
    assert.ok(metric.seasonality > 0.3)
  })
})

// ─── 合约: 批量写入 ───────────────────────────────────

describe('[time-series] 合约: 批量写入', () => {
  it('recordBatch 返回正确计数', () => {
    const { collector } = makeService()
    const count = collector.recordBatch([
      { route: '/api/test', tenantId: 't1', durationMs: 100, timestamp: new Date().toISOString(), statusCode: 200 },
      { route: '/api/test', tenantId: 't1', durationMs: 200, timestamp: new Date().toISOString(), statusCode: 200 },
    ])
    assert.equal(count, 2)
  })

  it('批量写入后可查询', () => {
    const { collector } = makeService()
    collector.recordBatch([
      { route: '/api/batch', tenantId: 't2', durationMs: 150, timestamp: new Date().toISOString(), statusCode: 200 },
    ])
    const result = collector.query({ metricName: '/api/batch', tenantId: 't2', window: '30d' })
    assert.equal(result.points.length, 1)
    assert.equal(result.points[0].value, 150)
  })
})

// ─── 合约: Metric Keys ────────────────────────────────

describe('[time-series] 合约: Metric Keys', () => {
  it('listMetricKeys 返回已注册的 key', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'alpha', tenantId: 't1', value: 1 })
    collector.recordMetric({ metricName: 'beta', value: 2 })
    const keys = collector.listMetricKeys()
    assert.ok(keys.includes('alpha:t1'))
    assert.ok(keys.includes('beta:global'))
    assert.equal(keys.length, 2)
  })

  it('空收集器返回空数组', () => {
    const coll = makeColl()
    assert.equal(coll.listMetricKeys().length, 0)
  })
})

// ─── 合约: 告警规则管理 ───────────────────────────────

describe('[time-series] 合约: 告警规则管理', () => {
  it('registerAlertRule 返回合法 id 和 rule', () => {
    const { service } = makeService()
    const result = service.registerAlertRule({
      metricName: 'cpu_usage',
      tenantId: 't-001',
      operator: 'gt',
      threshold: 90,
      window: '1h',
      description: 'CPU 过高告警',
    })
    assert.equal(typeof result.id, 'number')
    assert.equal(result.id, 0)
    assert.equal(result.rule.metricName, 'cpu_usage')
    assert.equal(result.rule.operator, 'gt')
    assert.equal(result.rule.threshold, 90)
  })

  it('listAlertRules 返回所有规则', () => {
    const { service } = makeService()
    service.registerAlertRule({ metricName: 'm1', operator: 'gt', threshold: 50, window: '1h' })
    service.registerAlertRule({ metricName: 'm2', operator: 'lt', threshold: 10, window: '24h' })
    const rules = service.listAlertRules()
    assert.equal(rules.length, 2)
    assert.equal(rules[0].metricName, 'm1')
    assert.equal(rules[1].metricName, 'm2')
  })

  it('removeAlertRule 成功返回 true', () => {
    const { service } = makeService()
    const { id } = service.registerAlertRule({ metricName: 'm', operator: 'gt', threshold: 0, window: '1h' })
    const removed = service.removeAlertRule(id)
    assert.equal(removed, true)
  })

  it('removeAlertRule 不存在返回 false', () => {
    const { service } = makeService()
    const removed = service.removeAlertRule(999)
    assert.equal(removed, false)
  })

  it('移除后 listAlertRules 不再包含', () => {
    const { service } = makeService()
    const { id } = service.registerAlertRule({ metricName: 'm', operator: 'gt', threshold: 0, window: '1h' })
    service.removeAlertRule(id)
    // 移除的规则被设为 undefined
    assert.equal(service.listAlertRules()[0], undefined)
  })
})

// ─── 合约: 告警评估 ───────────────────────────────────

describe('[time-series] 合约: 告警评估', () => {
  it('阈值触发时返回告警事件', () => {
    const { collector, service } = makeService()
    collector.recordMetric({ metricName: 'high_temp', tenantId: 't1', value: 95 })
    service.registerAlertRule({ metricName: 'high_temp', tenantId: 't1', operator: 'gt', threshold: 80, window: '1h' })
    const triggered = service.evaluateAllRules()
    assert.ok(triggered.length >= 1)
    assert.equal(triggered[0].rule.metricName, 'high_temp')
    assert.ok(triggered[0].currentValue > 80)
    assert.equal(typeof triggered[0].triggeredAt, 'string')
    assert.ok(triggered[0].message.includes('[ALERT]'))
  })

  it('未触发时不产生告警', () => {
    const { collector, service } = makeService()
    collector.recordMetric({ metricName: 'normal', value: 30 })
    service.registerAlertRule({ metricName: 'normal', operator: 'gt', threshold: 100, window: '1h' })
    const triggered = service.evaluateAllRules()
    assert.equal(triggered.length, 0)
  })

  it('gte 操作符下阈值边界触发', () => {
    const { collector, service } = makeService()
    collector.recordMetric({ metricName: 'boundary', value: 100 })
    service.registerAlertRule({ metricName: 'boundary', operator: 'gte', threshold: 100, window: '1h' })
    const triggered = service.evaluateAllRules()
    assert.equal(triggered.length, 1)
  })

  it('lt 操作符触发', () => {
    const { collector, service } = makeService()
    collector.recordMetric({ metricName: 'low_value', value: 5 })
    service.registerAlertRule({ metricName: 'low_value', operator: 'lt', threshold: 10, window: '1h' })
    const triggered = service.evaluateAllRules()
    assert.equal(triggered.length, 1)
  })

  it('getRecentAlerts 返回最多最新 20 条', () => {
    const { collector, service } = makeService()
    collector.recordMetric({ metricName: 'm', value: 200 })
    service.registerAlertRule({ metricName: 'm', operator: 'gt', threshold: 100, window: '1h' })
    service.evaluateAllRules()
    const alerts = service.getRecentAlerts(20)
    assert.ok(alerts.length >= 1)
    assert.equal(alerts[0].rule.metricName, 'm')
  })

  it('告警历史超过 MAX_ALERTS 时清理旧告警', () => {
    const { collector, service } = makeService()
    for (let i = 0; i < 50; i++) {
      collector.recordMetric({ metricName: `metric_${i}`, value: 999 })
      service.registerAlertRule({ metricName: `metric_${i}`, operator: 'gt', threshold: 100, window: '1h' })
    }
    service.evaluateAllRules()
    // 最多保留 MAX_ALERTS (100) 条
    const alerts = service.getRecentAlerts(200)
    assert.ok(alerts.length <= 100)
  })
})

// ─── 合约: 时序摘要 ───────────────────────────────────

describe('[time-series] 合约: 时序摘要', () => {
  it('getSummary 返回正确统计', () => {
    const { collector, service } = makeService()
    seedMetrics(collector)
    const summary = service.getSummary()
    assert.equal(typeof summary.totalMetrics, 'number')
    assert.ok(summary.totalMetrics >= 2)
    assert.ok(summary.totalPoints > 0)
    assert.equal(typeof summary.oldestTimestamp, 'string')
    assert.equal(typeof summary.newestTimestamp, 'string')
    assert.ok(Array.isArray(summary.topMetricNames))
    assert.ok(summary.topMetricNames.length > 0)
  })

  it('空收集器摘要返回 0', () => {
    const s = new TimeSeriesService(makeColl())
    const summary = s.getSummary()
    assert.equal(summary.totalMetrics, 0)
    assert.equal(summary.totalPoints, 0)
    assert.equal(summary.oldestTimestamp, null)
    assert.equal(summary.newestTimestamp, null)
  })
})

// ─── 合约: 跨窗口对比 ─────────────────────────────────

describe('[time-series] 合约: 跨窗口对比', () => {
  it('compareWindows 返回 3 个窗口的结果', () => {
    const { collector, service } = makeService()
    seedMetrics(collector)
    const results = service.compareWindows('api_latency_ms', undefined)
    assert.equal(results.length, 3)
    for (const r of results) {
      assert.ok(['1h', '6h', '24h'].includes(r.window))
      assert.equal(typeof r.avg, 'number')
      assert.equal(typeof r.count, 'number')
      assert.equal(typeof r.p95, 'number')
    }
  })

  it('空数据的窗口对比返回零值', () => {
    const { service } = makeService()
    const results = service.compareWindows('nonexistent')
    for (const r of results) {
      assert.equal(r.count, 0)
    }
  })
})

// ─── 合约: Prometheus 导出 ────────────────────────────

describe('[time-series] 合约: Prometheus 导出', () => {
  it('toPrometheus 返回合法文本格式', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'prom_test', value: 100 })
    const output = collector.toPrometheus()
    assert.ok(output.includes('# HELP'))
    assert.ok(output.includes('# TYPE'))
    assert.ok(output.includes('prom_test_1h_avg'))
    assert.ok(output.includes('prom_test_1h_p95'))
    assert.ok(output.includes('prom_test_1h_count'))
  })

  it('空收集器 Prometheus 为空', () => {
    const coll = makeColl()
    assert.equal(coll.toPrometheus(), '')
  })
})

// ─── 合约: 映射器契约 ────────────────────────────────

describe('[time-series] 合约: 映射器', () => {
  it('toTimeSeriesMetricContract 映射所有字段', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'contract_test', value: 42 })
    const entity = collector.query({ metricName: 'contract_test', window: '30d' })
    const contract = toTimeSeriesMetricContract(entity)

    assert.equal(contract.metricKey, entity.metricKey)
    assert.equal(contract.window, entity.window)
    assert.equal(contract.aggregate.avg, entity.aggregate.avg)
    assert.equal(contract.aggregate.count, entity.aggregate.count)
    assert.equal(contract.points.length, entity.points.length)
    assert.equal(contract.seasonality, entity.seasonality)
  })

  it('toAggregateContract 映射聚合字段', () => {
    const agg: TimeSeriesMetricEntity['aggregate'] = { min: 1, max: 100, avg: 50, p50: 40, p95: 90, p99: 99, count: 10 }
    const contract = toAggregateContract(agg)
    assert.deepEqual(contract, agg)
  })

  it('toAlertRuleContract 映射告警规则', () => {
    const rule = { metricName: 'cpu', operator: 'gt' as const, threshold: 80, window: '1h' as WindowSize }
    const contract = toAlertRuleContract(rule)
    assert.equal(contract.metricName, 'cpu')
    assert.equal(contract.operator, 'gt')
    assert.equal(contract.threshold, 80)
  })

  it('toAlertEventContract 映射告警事件', () => {
    const event = {
      rule: { metricName: 'mem', operator: 'gt' as const, threshold: 90, window: '1h' as WindowSize },
      currentValue: 95,
      triggeredAt: '2026-01-01T00:00:00Z',
      message: '[ALERT]',
    }
    const contract = toAlertEventContract(event)
    assert.equal(contract.rule.metricName, 'mem')
    assert.equal(contract.currentValue, 95)
  })

  it('toTimeSeriesSummaryContract 映射摘要', () => {
    const summary = {
      totalMetrics: 5,
      totalPoints: 1000,
      oldestTimestamp: '2026-01-01T00:00:00Z',
      newestTimestamp: '2026-06-27T00:00:00Z',
      topMetricNames: ['cpu', 'mem', 'disk'],
    }
    const contract = toTimeSeriesSummaryContract(summary)
    assert.equal(contract.totalMetrics, 5)
    assert.deepEqual(contract.topMetricNames, ['cpu', 'mem', 'disk'])
  })

  it('toCollectorStatusContract 映射状态', () => {
    const status = {
      collectorName: 'TimeSeriesCollector',
      buffersCount: 3,
      totalPoints: 150,
      status: 'ACTIVE' as const,
      uptimeMs: 3600000,
    }
    const contract = toCollectorStatusContract(status)
    assert.equal(contract.status, 'ACTIVE')
    assert.equal(contract.buffersCount, 3)
  })

  it('toSeasonalityPatternContract 映射季节性', () => {
    const pattern = {
      daily: new Array(24).fill(0).map((_, i) => i * 5),
      weekly: new Array(7).fill(0).map((_, i) => i * 10),
      monthly: new Array(31).fill(0).map((_, i) => i * 2),
    }
    const contract = toSeasonalityPatternContract(pattern)
    assert.equal(contract.daily.length, 24)
    assert.equal(contract.weekly.length, 7)
    assert.equal(contract.monthly.length, 31)
  })

  it('toWindowCompareResultContracts 映射窗口对比', () => {
    const results = [
      { window: '1h' as WindowSize, avg: 50, count: 10, p95: 90 },
      { window: '6h' as WindowSize, avg: 60, count: 60, p95: 95 },
    ]
    const contract = toWindowCompareResultContracts(results)
    assert.equal(contract.length, 2)
    assert.equal(contract[0].window, '1h')
  })
})

// ─── 合约: 边界条件 ───────────────────────────────────

describe('[time-series] 合约: 边界条件', () => {
  it('大量重复指标不崩溃', () => {
    const { collector } = makeService()
    for (let i = 0; i < 1000; i++) {
      collector.recordMetric({ metricName: 'stress_test', value: i })
    }
    const result = collector.query({ metricName: 'stress_test', window: '30d' })
    assert.equal(result.aggregate.count, 1000)
    assert.equal(result.aggregate.min, 0)
    assert.equal(result.aggregate.max, 999)
  })

  it('tenantId 隔离性', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'isolated', tenantId: 't-a', value: 100 })
    collector.recordMetric({ metricName: 'isolated', tenantId: 't-b', value: 200 })
    const a = collector.query({ metricName: 'isolated', tenantId: 't-a', window: '30d' })
    const b = collector.query({ metricName: 'isolated', tenantId: 't-b', window: '30d' })
    assert.equal(a.points[0].value, 100)
    assert.equal(b.points[0].value, 200)
  })

  it('时间戳查询过滤正确', () => {
    const { collector } = makeService()
    const now = Date.now()
    collector.recordMetric({ metricName: 'sorted', value: 3, timestamp: new Date(now - 30000).toISOString() })
    collector.recordMetric({ metricName: 'sorted', value: 1, timestamp: new Date(now - 60000).toISOString() })
    collector.recordMetric({ metricName: 'sorted', value: 2, timestamp: new Date(now - 45000).toISOString() })
    const result = collector.query({ metricName: 'sorted', window: '1h' })
    // 验证仅返回窗口内正确的点数
    assert.equal(result.points.length, 3)
    assert.equal(result.aggregate.count, 3)
    // 验证所有点都在 1h 窗口内 (当前实现用 Date.now() 作为 cutoff)
    for (const p of result.points) {
      const ts = new Date(p.timestamp).getTime()
      assert.ok(ts >= Date.now() - 60 * 60 * 1000)
    }
  })

  it('相同 metricName 不同 tenantId 的 metricKey 不同', () => {
    const { collector } = makeService()
    collector.recordMetric({ metricName: 'shared', tenantId: 'x', value: 1 })
    collector.recordMetric({ metricName: 'shared', tenantId: 'y', value: 2 })
    const keys = collector.listMetricKeys()
    assert.ok(keys.includes('shared:x'))
    assert.ok(keys.includes('shared:y'))
  })
})
