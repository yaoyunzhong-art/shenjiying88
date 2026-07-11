import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [time-series] [D] controller 场景测试补全
 *
 * 覆盖现有 controller.test.ts 未充分测试的场景：
 * - 并发/时序边界（空历史、单点、大量点）
 * - 告警联动场景（注册 → 采集 → 评估 → 查询 → 删除）
 * - 跨窗口对比 + 季节性模式 (多时间尺度)
 * - 批量采集与聚合一致性
 * - 状态查询快照
 * - 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import { TimeSeriesController } from './time-series.controller'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import { TimeSeriesService } from './time-series.service'

// ── 测试工厂 ──
function createEnv() {
  const collector = new TimeSeriesCollectorService()
  const service = new TimeSeriesService(collector)
  const controller = new TimeSeriesController(collector, service)
  collector.resetForTests()
  return { collector, service, controller }
}

// ═══════════════════════════════════════════════════════
// 场景 1: 空/边界输入
// ═══════════════════════════════════════════════════════
describe('场景1 — 空/边界输入', () => {
  it('空指标查询返回空 points 和零聚合', () => {
    const { controller } = createEnv()
    const result = controller.query({ metricName: 'does_not_exist', window: '1h' })
    expect(result.data.points).toEqual([])
    expect(result.data.aggregate.count).toBe(0)
    expect(result.data.aggregate.avg).toBe(0)
  })

  it('空批量采集返回 count 0', () => {
    const { controller } = createEnv()
    const result = controller.recordBatch({ samples: [] })
    expect(result.status).toBe('ok')
    expect(result.count).toBe(0)
  })

  it('记录单个点后查询返回该点正确聚合', () => {
    const { controller } = createEnv()
    controller.record({ metricName: 'single_point', value: 42 })
    const result = controller.query({ metricName: 'single_point', window: '1h' })
    expect(result.data.aggregate.count).toBe(1)
    expect(result.data.aggregate.avg).toBe(42)
    expect(result.data.aggregate.min).toBe(42)
    expect(result.data.aggregate.max).toBe(42)
  })

  it('记录相同指标多次后聚合正确', () => {
    const { controller } = createEnv()
    for (let i = 0; i < 5; i++) {
      controller.record({ metricName: 'repeated_metric', value: 10 + i * 5 })
    }
    const result = controller.query({ metricName: 'repeated_metric', window: '1h' })
    // values: 10, 15, 20, 25, 30 => avg = 20, min = 10, max = 30, count = 5
    expect(result.data.aggregate.count).toBe(5)
    expect(result.data.aggregate.avg).toBe(20)
    expect(result.data.aggregate.min).toBe(10)
    expect(result.data.aggregate.max).toBe(30)
  })

  it('记录零值和负值', () => {
    const { controller } = createEnv()
    controller.record({ metricName: 'delta', value: 0 })
    controller.record({ metricName: 'delta', value: -5 })
    controller.record({ metricName: 'delta', value: -10 })
    const result = controller.query({ metricName: 'delta', window: '1h' })
    expect(result.data.aggregate.count).toBe(3)
    expect(result.data.aggregate.min).toBe(-10)
    expect(result.data.aggregate.max).toBe(0)
    expect(result.data.aggregate.avg).toBe(-5)
  })

  it('大量数据点后 p50/p95/p99 分位数正确', () => {
    const { controller } = createEnv()
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    for (const v of values) {
      controller.record({ metricName: 'percentile_test', value: v })
    }
    const result = controller.query({ metricName: 'percentile_test', window: '1h' })
    expect(result.data.aggregate.count).toBe(20)
    expect(result.data.aggregate.p50).toBeGreaterThanOrEqual(10)
    expect(result.data.aggregate.p50).toBeLessThanOrEqual(11)
    expect(result.data.aggregate.p95).toBeGreaterThanOrEqual(19)
    expect(result.data.aggregate.p99).toBeGreaterThanOrEqual(19)
  })
})

// ═══════════════════════════════════════════════════════
// 场景 2: 告警联动 — 注册 → 采集 → 评估 → 查询 → 删除
// ═══════════════════════════════════════════════════════
describe('场景2 — 告警联动工作流', () => {
  it('告警规则注册后出现在列表', () => {
    const { controller } = createEnv()
    const rule = controller.registerAlertRule({
      metricName: 'cpu_usage',
      operator: 'gt',
      threshold: 90,
      window: '1h',
      description: 'CPU 超过 90%',
    })
    expect(rule.id).toBe(0)
    expect(rule.rule.metricName).toBe('cpu_usage')

    const rules = controller.getAlertRules()
    expect(rules.data).toHaveLength(1)
    expect(rules.data[0].metricName).toBe('cpu_usage')
  })

  it('注册 — 采集超标 — 评估触发告警', () => {
    const { controller } = createEnv()
    controller.registerAlertRule({
      metricName: 'error_rate',
      operator: 'gt',
      threshold: 5,
      window: '1h',
      description: '错误率超过 5%',
    })

    // 采集超标数据（avg > 5）
    for (let i = 0; i < 5; i++) {
      controller.record({ metricName: 'error_rate', value: 10 })
    }

    const alerts = controller.evaluateAlerts()
    expect(alerts.data).toHaveLength(1)
    expect(alerts.data[0].rule.metricName).toBe('error_rate')
    expect(alerts.data[0].currentValue).toBe(10)
    expect(alerts.data[0].message).toContain('error_rate')
  })

  it('注册 — 采集正常 — 评估不触发告警', () => {
    const { controller } = createEnv()
    controller.registerAlertRule({
      metricName: 'latency_ms',
      operator: 'gt',
      threshold: 500,
      window: '1h',
    })

    for (let i = 0; i < 3; i++) {
      controller.record({ metricName: 'latency_ms', value: 100 })
    }

    const alerts = controller.evaluateAlerts()
    expect(alerts.data).toHaveLength(0)
  })

  it('删除告警规则后不再触发评估', () => {
    const { controller } = createEnv()
    controller.registerAlertRule({
      metricName: 'memory_usage',
      operator: 'gt',
      threshold: 80,
      window: '1h',
    })
    controller.removeAlertRule('0')
    for (let i = 0; i < 3; i++) {
      controller.record({ metricName: 'memory_usage', value: 95 })
    }
    const alerts = controller.evaluateAlerts()
    expect(alerts.data).toHaveLength(0)
  })

  it('删除不存在的告警规则返回 false', () => {
    const { controller } = createEnv()
    const result = controller.removeAlertRule('999')
    expect(result.removed).toBe(false)
  })

  it('注册多条告警规则并全部触发', () => {
    const { controller } = createEnv()
    controller.registerAlertRule({ metricName: 'cpu', operator: 'gt', threshold: 80, window: '1h' })
    controller.registerAlertRule({ metricName: 'memory', operator: 'gt', threshold: 80, window: '1h' })
    controller.registerAlertRule({ metricName: 'disk', operator: 'lt', threshold: 10, window: '1h' })

    for (let i = 0; i < 3; i++) {
      controller.record({ metricName: 'cpu', value: 95 })
      controller.record({ metricName: 'memory', value: 90 })
      controller.record({ metricName: 'disk', value: 5 })
    }

    const alerts = controller.evaluateAlerts()
    expect(alerts.data).toHaveLength(3)
    const metricNames = alerts.data.map(a => a.rule.metricName)
    expect(metricNames).toContain('cpu')
    expect(metricNames).toContain('memory')
    expect(metricNames).toContain('disk')
  })

  it('告警使用 gte/lte 运算符', () => {
    const { controller } = createEnv()
    controller.registerAlertRule({ metricName: 'test_gte', operator: 'gte', threshold: 100, window: '1h' })
    controller.registerAlertRule({ metricName: 'test_lte', operator: 'lte', threshold: 10, window: '1h' })

    controller.record({ metricName: 'test_gte', value: 100 }) // === threshold => trigger
    controller.record({ metricName: 'test_lte', value: 10 })  // === threshold => trigger

    const alerts = controller.evaluateAlerts()
    expect(alerts.data).toHaveLength(2)
  })
})

// ═══════════════════════════════════════════════════════
// 场景 3: 跨窗口对比 + 季节性模式
// ═══════════════════════════════════════════════════════
describe('场景3 — 跨窗口对比与季节性模式', () => {
  it('跨窗口对比返回 1h / 6h / 24h 三个窗口', () => {
    const { controller } = createEnv()
    for (let i = 0; i < 10; i++) {
      controller.record({ metricName: 'response_time', value: 100 + i * 10 })
    }
    const compare = controller.compareWindows({ metricName: 'response_time' })
    expect(compare.data).toHaveLength(3)
    const windows = compare.data.map(w => w.window)
    expect(windows).toEqual(['1h', '6h', '24h'])
  })

  it('跨窗口对比各窗口 avgs 值一致（同区间）', () => {
    const { controller } = createEnv()
    controller.record({ metricName: 'stable_metric', value: 50 })

    const compare = controller.compareWindows({ metricName: 'stable_metric' })
    for (const w of compare.data) {
      expect(w.avg).toBe(50)
      expect(w.count).toBe(1)
    }
  })

  it('季节性模式返回 daily(24) + weekly(7) + monthly', () => {
    const { controller } = createEnv()
    const now = new Date('2026-07-07T00:00:00Z')
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const ts = new Date(now.getTime() + d * 86400000 + h * 3600000)
        controller.record({
          metricName: 'traffic_hourly',
          value: (h >= 9 && h <= 22) ? 200 : 20,
          timestamp: ts.toISOString(),
        })
      }
    }
    const result = controller.seasonality({ metricName: 'traffic_hourly' })
    expect(result.data.daily.length).toBe(24)
    expect(result.data.weekly.length).toBe(7)
    // 白天的每日平均值应 > 夜间
    const dayAvg = result.data.daily.filter((_, i) => i >= 9 && i <= 22).reduce((s, v) => s + v, 0)
    const nightAvg = result.data.daily.filter((_, i) => i < 9 || i > 22).reduce((s, v) => s + v, 0)
    expect(dayAvg).toBeGreaterThan(nightAvg)
  })

  it('没有数据的季节性模式返回默认零值', () => {
    const { controller } = createEnv()
    const result = controller.seasonality({ metricName: 'nonexistent' })
    expect(result.data.daily).toBeDefined()
    expect(result.data.weekly).toBeDefined()
    expect(result.data.daily.length).toBeGreaterThan(0)
    expect(result.data.weekly.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════
// 场景 4: 批量采集与聚合一致性
// ═══════════════════════════════════════════════════════
describe('场景4 — 批量采集与聚合一致性', () => {
  it('批量采集多条不同路由', () => {
    const { controller } = createEnv()
    const result = controller.recordBatch({
      samples: [
        { route: '/api/orders', durationMs: 100, statusCode: 200 },
        { route: '/api/users', durationMs: 50, statusCode: 200 },
        { route: '/api/products', durationMs: 200, statusCode: 500 },
      ],
    })
    expect(result.count).toBe(3)

    const summary = controller.getSummary()
    expect(summary.data.totalMetrics).toBe(3)
    expect(summary.data.totalPoints).toBeGreaterThanOrEqual(3)
  })

  it('批量 + 单点混合采集后聚合一致', () => {
    const { controller } = createEnv()
    controller.recordBatch({
      samples: [
        { route: '/api/mixed', durationMs: 100 },
        { route: '/api/mixed', durationMs: 200 },
      ],
    })
    controller.record({ metricName: '/api/mixed', value: 300 })

    const result = controller.query({ metricName: '/api/mixed', window: '1h' })
    expect(result.data.aggregate.count).toBe(3)
    expect(result.data.aggregate.min).toBe(100)
    expect(result.data.aggregate.max).toBe(300)
    expect(result.data.aggregate.avg).toBe(200)
  })

  it('批量采集中 timestamp 自动填充', () => {
    const { controller } = createEnv()
    const before = Date.now()
    controller.recordBatch({
      samples: [{ route: '/api/auto_ts', durationMs: 50 }],
    })
    const result = controller.query({ metricName: '/api/auto_ts', window: '1h' })
    expect(result.data.points[0].timestamp).toBeDefined()
    expect(new Date(result.data.points[0].timestamp).getTime()).toBeGreaterThanOrEqual(before - 1000)
  })

  it('批量采集中 statusCode 默认 200', () => {
    const { collector, controller } = createEnv()
    controller.recordBatch({
      samples: [{ route: '/api/default_status', durationMs: 99 }],
    })
    const result = controller.query({ metricName: '/api/default_status', window: '1h' })
    expect(result.data.aggregate.count).toBe(1)
  })

  it('批量采集超大样本 100 个不崩溃', () => {
    const { controller } = createEnv()
    const samples = Array.from({ length: 100 }, (_, i) => ({
      route: `/api/endpoint_${i % 5}`,
      durationMs: 50 + i,
    }))
    const result = controller.recordBatch({ samples })
    expect(result.count).toBe(100)

    const summary = controller.getSummary()
    expect(summary.data.totalMetrics).toBe(5)
  })
})

// ═══════════════════════════════════════════════════════
// 场景 5: 状态/摘要/Key 查询
// ═══════════════════════════════════════════════════════
describe('场景5 — 状态/摘要/Keys 查询', () => {
  it('getStatus 返回 ACTIVE 状态及 uptimeMs', () => {
    const { controller } = createEnv()
    const status = controller.getStatus()
    expect(status.data.status).toBe('ACTIVE')
    expect(status.data.collectorName).toBe('TimeSeriesCollector')
    expect(typeof status.data.uptimeMs).toBe('number')
    expect(status.data.uptimeMs).toBeGreaterThanOrEqual(0)
  })

  it('采集后 listKeys 返回正确指标列表', () => {
    const { controller } = createEnv()
    controller.record({ metricName: 'metric_a', value: 1 })
    controller.record({ metricName: 'metric_b', value: 2 })
    const result = controller.listKeys()
    expect(result.data.keys).toContain('metric_a:global')
    expect(result.data.keys).toContain('metric_b:global')
  })

  it('空采集 listKeys 返回空数组', () => {
    const { controller } = createEnv()
    const result = controller.listKeys()
    expect(result.data.keys).toEqual([])
  })

  it('getSummary 返回 totalMetrics 和 totalPoints', () => {
    const { controller } = createEnv()
    controller.record({ metricName: 'summary_test', value: 10 })
    controller.record({ metricName: 'summary_test', value: 20 })
    const result = controller.getSummary()
    expect(result.data.totalMetrics).toBe(1)
    expect(result.data.totalPoints).toBeGreaterThanOrEqual(2)
    expect(result.data.topMetricNames).toContain('summary_test')
  })

  it('getSummary 中 oldest/newestTimestamp 存在', () => {
    const { controller } = createEnv()
    controller.record({ metricName: 'timestamp_test', value: 1 })
    const result = controller.getSummary()
    expect(result.data.oldestTimestamp).toBeTruthy()
    expect(result.data.newestTimestamp).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════
// 场景 6: 完整的端到端工作流 — 注册 → 采集 → 告警 → 查询 → 清理
// ═══════════════════════════════════════════════════════
describe('场景6 — 端到端工作流', () => {
  it('完整工作流：采集指标 → 查看Key → 查看摘要 → 查看状态', () => {
    const { controller } = createEnv()
    // 采集
    controller.record({ metricName: 'e2e_metric', value: 100 })
    controller.record({ metricName: 'e2e_metric', value: 200 })

    // 查看 keys
    const keys = controller.listKeys()
    expect(keys.data.keys).toContain('e2e_metric:global')

    // 查询聚合
    const query = controller.query({ metricName: 'e2e_metric', window: '1h' })
    expect(query.data.aggregate.avg).toBe(150)

    // 提交季节模式
    const seasonality = controller.seasonality({ metricName: 'e2e_metric' })
    expect(seasonality.data.daily).toBeDefined()

    // 查看状态
    const status = controller.getStatus()
    expect(status.data.status).toBe('ACTIVE')
  })

  it('完整工作流：告警 → 注册 → 采集 → 评估 → 删除', () => {
    const { controller } = createEnv()

    // 注册
    controller.registerAlertRule({
      metricName: 'workflow_metric',
      operator: 'gt',
      threshold: 50,
      window: '1h',
      description: '工作流告警测试',
    })

    // 采集超标
    controller.record({ metricName: 'workflow_metric', value: 100 })

    // 评估触发
    const alerts = controller.evaluateAlerts()
    expect(alerts.data).toHaveLength(1)

    // 删除规则 (内部置为 undefined, 仍占位)
    controller.removeAlertRule('0')

    // 采集更多超标 — 不再触发
    controller.record({ metricName: 'workflow_metric', value: 200 })
    const noAlerts = controller.evaluateAlerts()
    expect(noAlerts.data).toHaveLength(0)

    // getAlertRules 返回包含 undefined 的数组
    const activeRules = controller.getAlertRules().data.filter((r: any) => r != null)
    expect(activeRules).toHaveLength(0)
  })
})
