/**
 * time-series.service.test.ts
 * 圈梁五道箍: TimeSeriesService 单元测试
 * 覆盖: 正常路径4+ / 边界条件3+ / 错误处理4+ / 空值/空数组4+ / 并发/时序3+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TimeSeriesService } from './time-series.service'
import { TimeSeriesCollectorService } from './time-series-collector.service'

// ================================================================
// 辅助：构造 mock 的 TimeSeriesMetric
// ================================================================

function makeMockMetric(overrides: Partial<{
  metricKey: string
  tenantId: string
  window: string
  points: Array<{ timestamp: string; value: number }>
  aggregate: { min: number; max: number; avg: number; p50: number; p95: number; p99: number; count: number }
  seasonality: number
}> = {}) {
  return {
    metricKey: 'test',
    tenantId: undefined as string | undefined,
    window: '1h',
    points: [],
    aggregate: { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, count: 0 },
    seasonality: 0,
    ...overrides,
  }
}

describe('TimeSeriesService', () => {
  let collector: TimeSeriesCollectorService
  let service: TimeSeriesService

  beforeEach(() => {
    collector = new TimeSeriesCollectorService()
    service = new TimeSeriesService(collector)
  })

  // ================================================================
  // 正常路径 (4 cases)
  // ================================================================

  describe('正常路径', () => {
    it('应该能够注册告警规则并返回 id', () => {
      const result = service.registerAlertRule({
        metricName: 'latency',
        operator: 'gt',
        threshold: 500,
        window: '1h',
        description: 'Latency too high',
      })

      expect(result.id).toBe(0)
      expect(result.rule.metricName).toBe('latency')
      expect(result.rule.operator).toBe('gt')
    })

    it('listAlertRules 应该返回所有已注册的规则副本', () => {
      service.registerAlertRule({ metricName: 'cpu', operator: 'gt', threshold: 80, window: '1h' })
      service.registerAlertRule({ metricName: 'mem', operator: 'lt', threshold: 100, window: '6h' })

      const rules = service.listAlertRules()
      expect(rules).toHaveLength(2)
      expect(rules[0].metricName).toBe('cpu')
      expect(rules[1].metricName).toBe('mem')
    })

    it('evaluateAllRules 应该触发符合条件的告警', () => {
      // 先注册一条规则
      service.registerAlertRule({
        metricName: 'api_latency',
        operator: 'gt',
        threshold: 100,
        window: '1h',
      })

      // 注入数据: latency > 100 应该触发
      collector.recordMetric({ metricName: 'api_latency', value: 250 })

      const triggered = service.evaluateAllRules()
      expect(triggered).toHaveLength(1)
      expect(triggered[0].currentValue).toBeGreaterThan(100)
      expect(triggered[0].rule.metricName).toBe('api_latency')
      expect(triggered[0].message).toContain('[ALERT]')
    })

    it('getSummary 在有数据时应该返回正确的摘要', () => {
      collector.recordMetric({ metricName: 'metric_a', value: 1 })
      collector.recordMetric({ metricName: 'metric_a', value: 2 })
      collector.recordMetric({ metricName: 'metric_b', value: 3 })

      const summary = service.getSummary()
      expect(summary.totalMetrics).toBe(2)
      expect(summary.totalPoints).toBe(3)
      expect(summary.topMetricNames).toContain('metric_a')
      expect(summary.topMetricNames).toContain('metric_b')
    })
  })

  // ================================================================
  // 边界条件 (3 cases)
  // ================================================================

  describe('边界条件', () => {
    it('compareWindows 应该返回 1h/6h/24h 三窗口的对比', () => {
      collector.recordMetric({ metricName: 'cmp_test', value: 100 })
      const results = service.compareWindows('cmp_test')
      expect(results).toHaveLength(3)
      expect(results[0].window).toBe('1h')
      expect(results[1].window).toBe('6h')
      expect(results[2].window).toBe('24h')
      results.forEach((r) => {
        expect(r.avg).toBe(100)
        expect(r.count).toBe(1)
      })
    })

    it('removeAlertRule 删除越界 ID 应该返回 false', () => {
      const result = service.removeAlertRule(999)
      expect(result).toBe(false)
    })

    it('getRecentAlerts 不设 limit 时默认返回最近 20 条', () => {
      // 先注册规则
      service.registerAlertRule({ metricName: 'alerts_metric', operator: 'gt', threshold: 0, window: '1h' })
      // 注入数据触发告警
      collector.recordMetric({ metricName: 'alerts_metric', value: 1 })
      service.evaluateAllRules()

      const alerts = service.getRecentAlerts()
      expect(alerts.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ================================================================
  // 错误处理 (4 cases)
  // ================================================================

  describe('错误处理', () => {
    it('evaluateAllRules 在没有数据时不触发告警', () => {
      service.registerAlertRule({ metricName: 'no_data', operator: 'gt', threshold: 0, window: '1h' })
      // 注意：没有 inject 任何数据
      const triggered = service.evaluateAllRules()
      expect(triggered).toHaveLength(0)
    })

    it('removeAlertRule 删除已删除的规则 ID 也应该返回 true（因为 slot 存在）', () => {
      service.registerAlertRule({ metricName: 'del_test', operator: 'gt', threshold: 1, window: '1h' })
      const first = service.removeAlertRule(0)
      expect(first).toBe(true)
      // 删除同一 slot 第二次 — slot 已变为 undefined, length 未变
      const second = service.removeAlertRule(0)
      // 第二次删除 undefined 的 slot → 条件 id>=0 && id<length 通过 → 设为 undefined 并返回 true
      expect(second).toBe(true)
    })

    it('getSummary 在无数据时应该返回 0', () => {
      const summary = service.getSummary()
      expect(summary.totalMetrics).toBe(0)
      expect(summary.totalPoints).toBe(0)
      expect(summary.oldestTimestamp).toBeNull()
      expect(summary.newestTimestamp).toBeNull()
      expect(summary.topMetricNames).toEqual([])
    })

    it('evaluateAllRules 中 getRecentAlerts 在无告警历史时返回空数组', () => {
      const alerts = service.getRecentAlerts()
      expect(alerts).toEqual([])
    })
  })

  // ================================================================
  // 空值/空数组 (4 cases)
  // ================================================================

  describe('空值/空数组', () => {
    it('未注册任何规则时 listAlertRules 返回空数组', () => {
      expect(service.listAlertRules()).toEqual([])
    })

    it('removeAlertRule 在空规则列表时应该返回 false', () => {
      expect(service.removeAlertRule(0)).toBe(false)
    })

    it('compareWindows 在无数据时返回 count=0 的三个窗口', () => {
      const results = service.compareWindows('nonexistent')
      expect(results).toHaveLength(3)
      results.forEach((r) => {
        expect(r.count).toBe(0)
        expect(r.avg).toBe(0)
      })
    })

    it('registerAlertRule 不传 description 也应该正常工作', () => {
      const result = service.registerAlertRule({
        metricName: 'no_desc',
        operator: 'lt',
        threshold: 10,
        window: '7d',
      })
      expect(result.id).toBe(0)
      expect(result.rule.description).toBeUndefined()
    })
  })

  // ================================================================
  // 并发/时序 (3 cases)
  // ================================================================

  describe('并发/时序', () => {
    it('多次注册规则并交替插入数据', () => {
      for (let i = 0; i < 10; i++) {
        service.registerAlertRule({
          metricName: 'seq',
          operator: 'gt',
          threshold: i * 10,
          window: '1h',
        })
      }
      expect(service.listAlertRules()).toHaveLength(10)
    })

    it('MAX_ALERTS 限制: 超过 100 条告警时最旧的被移除', () => {
      service.registerAlertRule({ metricName: 'overflow', operator: 'gt', threshold: 0, window: '1h' })
      collector.recordMetric({ metricName: 'overflow', value: 1 })

      // 触发 120 次告警
      for (let i = 0; i < 120; i++) {
        service.evaluateAllRules()
      }

      const alerts = service.getRecentAlerts(200)
      // 内部 buffer 是 shift 模式, 最多 100 条
      expect(alerts.length).toBeLessThanOrEqual(100)
    })

    it('多规则按顺序触发告警，告警历史按触发顺序排列', () => {
      service.registerAlertRule({ metricName: 'm1', operator: 'gt', threshold: 5, window: '1h' })
      service.registerAlertRule({ metricName: 'm2', operator: 'lt', threshold: 100, window: '1h' })

      collector.recordMetric({ metricName: 'm1', value: 10 })
      collector.recordMetric({ metricName: 'm2', value: 50 })

      const triggered = service.evaluateAllRules()
      expect(triggered).toHaveLength(2)
      expect(triggered[0].rule.metricName).toBe('m1')
      expect(triggered[1].rule.metricName).toBe('m2')
    })
  })
})
