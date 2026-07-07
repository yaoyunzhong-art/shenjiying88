import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [time-series] [C] 角色扩展测试
 *
 * 4 个附加角色视角的时序模块测试：
 * 🛒前台 — 关注收银台/前端响应时间趋势
 * 🔧安监 — 关注安全审计指标与异常告警
 * 🎯运行专员 — 关注系统容量与性能基线
 * 🤝团建 — 关注活动报名系统性能趋势与季节性分析
 *
 * 每个角色 3 个测试用例（正常流程 + 业务异常 + 边界场景）
 * 覆盖端点: record, query, batch, keys, status, summary, alert-rules, evaluateAlerts, compareWindows, seasonality, removeAlertRule
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TimeSeriesController } from './time-series.controller'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import { TimeSeriesService } from './time-series.service'

// ── 测试工厂 ──

function createTestEnv() {
  const collector = new TimeSeriesCollectorService()
  const service = new TimeSeriesService(collector)
  const controller = new TimeSeriesController(collector, service)
  return { collector, service, controller }
}

// ═══════════════════════════════════════════════════════
// 🛒前台 — 关注收银台/前端系统响应时间趋势
// ═══════════════════════════════════════════════════════
describe('🛒前台 — 收银/前端性能视角', () => {
  it('前台可以查看收银操作响应时间趋势（正常流程）', () => {
    const { collector, controller } = createTestEnv()

    // 模拟收银台一天内响应时间的变化
    const now = Date.now()
    for (let i = 0; i < 24; i++) {
      // 高峰时段 (12-14点, 18-21点) 响应更慢
      const hour = i % 24
      const baseLatency = (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21) ? 800 : 200
      collector.recordMetric({
        metricName: 'cashier_response_ms',
        value: baseLatency + Math.round(Math.random() * 100),
        timestamp: new Date(now - (23 - i) * 3600 * 1000).toISOString(),
      })
    }

    const result = controller.query({ metricName: 'cashier_response_ms', window: '24h' })
    assert.equal(result.data.aggregate.count, 24)
    assert.ok(result.data.aggregate.avg > 300, '含高峰时段平均响应应 > 300ms')
    assert.equal(result.data.metricKey, 'cashier_response_ms:global')
    assert.ok(result.data.points.length === 24)
  })

  it('前台可以批量记录收银系统各接口耗时（业务异常 — 空样本应返回正常）', () => {
    const { controller } = createTestEnv()

    // 空样本场景 — 不应抛错
    const emptyResult = controller.recordBatch({ samples: [] })
    assert.equal(emptyResult.status, 'ok')
    assert.equal(emptyResult.count, 0)

    // 正常批量记录
    const result = controller.recordBatch({
      samples: [
        { route: '/api/cashier/payment', durationMs: 150, statusCode: 200 },
        { route: '/api/cashier/refund', durationMs: 300, statusCode: 200 },
        { route: '/api/cashier/query', durationMs: 50, statusCode: 200 },
      ],
    })
    assert.equal(result.status, 'ok')
    assert.equal(result.count, 3)
  })

  it('前台可以查看系统状态确认收银服务正常（边界场景 — 非高峰期状态）', () => {
    const { controller } = createTestEnv()

    // 凌晨低负载 — 新创建控制器 uptime 可能为 0
    const status = controller.getStatus()
    assert.equal(status.data.status, 'ACTIVE')
    assert.ok(status.data.uptimeMs >= 0)
    assert.equal(typeof status.data.uptimeMs, 'number')
  })
})

// ═══════════════════════════════════════════════════════
// 🔧安监 — 关注安全审计指标与异常告警
// ═══════════════════════════════════════════════════════
describe('🔧安监 — 安全审计与异常告警视角', () => {
  it('安监可以注册登录失败告警规则（正常流程）', () => {
    const { controller } = createTestEnv()

    const result = controller.registerAlertRule({
      metricName: 'failed_login_attempts',
      operator: 'gt',
      threshold: 5,
      window: '1h',
      description: '1小时内登录失败超过5次触发告警',
    })
    assert.equal(result.id, 0)
    assert.equal(result.rule.metricName, 'failed_login_attempts')
    assert.equal(result.rule.operator, 'gt')
    assert.equal(result.rule.threshold, 5)

    // 验证规则已注册
    const rules = controller.getAlertRules()
    assert.equal(rules.data.length, 1)
  })

  it('安监可以评估告警规则检测暴力破解（业务异常场景 — 连续失败触发告警）', () => {
    const { collector, controller } = createTestEnv()

    // 注册告警规则 — 登录失败超过5次
    controller.registerAlertRule({
      metricName: 'failed_auth',
      operator: 'gt',
      threshold: 5,
      window: '1h',
      description: '暴力破解检测',
    })

    // 模拟10次失败登录 (每次记录平均值，collector内部会算聚合)
    for (let i = 0; i < 10; i++) {
      collector.recordMetric({ metricName: 'failed_auth', value: i + 1 })
    }

    // 评估告警 — 平均值=5.5 > 5，应触发
    const alerts = controller.evaluateAlerts()
    assert.ok(alerts.data.length >= 1, '应触发告警')
    const authAlert = alerts.data.find((a: any) => a.rule.metricName === 'failed_auth')
    assert.ok(authAlert, '应包含登录失败告警')
    assert.ok(authAlert.currentValue > 5)
    assert.ok(authAlert.message.includes('failed_auth'))
  })

  it('安监可以删除过时的告警规则（边界场景 — 删除不存在的规则应返回 false）', () => {
    const { controller } = createTestEnv()

    // 注册一条规则然后删除
    controller.registerAlertRule({
      metricName: 'old_security_rule',
      operator: 'gt',
      threshold: 100,
      window: '24h',
    })
    const removed = controller.removeAlertRule('0')
    assert.equal(removed.removed, true)

    // 删除不存在的规则
    const removedInvalid = controller.removeAlertRule('999')
    assert.equal(removedInvalid.removed, false)

    // 删除后规则列表不应包含已删除的规则
    const rules = controller.getAlertRules()
    assert.equal(rules.data.length, 1)
    assert.equal(rules.data[0], undefined)
  })
})

// ═══════════════════════════════════════════════════════
// 🎯运行专员 — 关注系统容量与性能基线
// ═══════════════════════════════════════════════════════
describe('🎯运行专员 — 容量与性能基线视角', () => {
  it('运行专员可以批量记录各 API 端点耗时用于容量规划（正常流程）', () => {
    const { controller } = createTestEnv()

    // 模拟多个端点的耗时数据
    const result = controller.recordBatch({
      samples: [
        { route: '/api/orders', durationMs: 250, statusCode: 200 },
        { route: '/api/orders', durationMs: 300, statusCode: 200 },
        { route: '/api/orders', durationMs: 200, statusCode: 200 },
        { route: '/api/payments', durationMs: 500, statusCode: 200 },
        { route: '/api/payments', durationMs: 450, statusCode: 200 },
        { route: '/api/inventory', durationMs: 100, statusCode: 200 },
      ],
    })
    assert.equal(result.status, 'ok')
    assert.equal(result.count, 6)

    // 查询 orders 端点性能
    const orderQuery = controller.query({ metricName: '/api/orders', window: '1h' })
    assert.equal(orderQuery.data.aggregate.count, 3)
    assert.equal(orderQuery.data.aggregate.avg, 250)
    assert.equal(orderQuery.data.aggregate.min, 200)
    assert.equal(orderQuery.data.aggregate.max, 300)
  })

  it('运行专员可以跨窗口对比 API 性能变化趋势（边界 — 无数据指标应返回空结果）', () => {
    const { collector, controller } = createTestEnv()

    // 查询不存在的指标 — 应返回空结果而非抛错
    const nonexistent = controller.compareWindows({ metricName: 'nonexistent_api' })
    assert.equal(nonexistent.data.length, 3)
    nonexistent.data.forEach((w: any) => {
      assert.equal(w.avg, 0)
      assert.equal(w.count, 0)
      assert.equal(w.p95, 0)
    })

    // 写入数据后查询
    collector.recordMetric({ metricName: 'payment_gateway', value: 150 })
    collector.recordMetric({ metricName: 'payment_gateway', value: 250 })

    const withData = controller.compareWindows({ metricName: 'payment_gateway' })
    assert.equal(withData.data.length, 3)
    withData.data.forEach((w: any) => {
      assert.ok(w.avg > 0)
      assert.ok(w.count > 0)
    })
  })

  it('运行专员可以查看系统摘要了解整体健康度（边界场景 — 大量指标吞吐场景）', () => {
    const { collector, controller } = createTestEnv()

    // 模拟大量指标 — 写入 50 个不同指标
    for (let i = 0; i < 50; i++) {
      collector.recordMetric({
        metricName: `endpoint_${i}`,
        value: Math.round(50 + Math.random() * 200),
      })
    }

    const summary = controller.getSummary()
    assert.equal(summary.data.totalMetrics, 50)
    assert.equal(summary.data.topMetricNames.length, 10)
    assert.ok(summary.data.totalPoints >= 50)

    // 确认所有指标 key 可列出
    const keys = controller.listKeys()
    assert.equal(keys.data.keys.length, 50)
    assert.ok(keys.data.keys.includes('endpoint_0:global'))
  })
})

// ═══════════════════════════════════════════════════════
// 🤝团建 — 关注活动报名系统性能与季节性分析
// ═══════════════════════════════════════════════════════
describe('🤝团建 — 活动系统性能与季节性视角', () => {
  it('团建组织者可以查看活动报名系统响应时间趋势（正常流程）', () => {
    const { collector, controller } = createTestEnv()

    // 模拟活动报名高峰时段的请求延迟
    const now = Date.now()
    for (let i = 0; i < 20; i++) {
      const isPeak = i >= 8 && i <= 12 // 10点-13点为报名高峰
      collector.recordMetric({
        metricName: 'event_booking_latency',
        value: isPeak ? 800 + Math.round(Math.random() * 200) : 200 + Math.round(Math.random() * 100),
        timestamp: new Date(now - (19 - i) * 3600 * 1000).toISOString(),
      })
    }

    const result = controller.query({ metricName: 'event_booking_latency', window: '24h' })
    assert.equal(result.data.aggregate.count, 20)
    assert.ok(result.data.aggregate.max > 800, '高峰期间延迟应超过800ms')
  })

  it('团建可以分析季节性模式优化活动排期（正常流程 — 季节性分析）', () => {
    const { collector, controller } = createTestEnv()

    // 模拟一周内的报名流量 — 周末高，工作日低
    const baseDate = new Date('2026-06-22T00:00:00Z') // 周一
    for (let d = 0; d < 7; d++) {
      const isWeekend = d >= 5 // 周六日
      const baseValue = isWeekend ? 500 : 150
      for (let h = 0; h < 24; h++) {
        const ts = new Date(baseDate.getTime() + d * 86400000 + h * 3600000)
        const hourlyFactor = (h >= 10 && h <= 12) || (h >= 14 && h <= 17) ? 1.5 : 0.3
        collector.recordMetric({
          metricName: 'event_traffic_volume',
          value: Math.round(baseValue * hourlyFactor),
          timestamp: ts.toISOString(),
        })
      }
    }

    const result = controller.seasonality({ metricName: 'event_traffic_volume' })
    assert.equal(result.data.daily.length, 24)
    assert.equal(result.data.weekly.length, 7)
    // 周末的指数应高于工作日
    const weekdayAvg = result.data.weekly.slice(0, 5).reduce((a: number, b: number) => a + b, 0) / 5
    const weekendAvg = result.data.weekly.slice(5).reduce((a: number, b: number) => a + b, 0) / 2
    assert.ok(weekendAvg > weekdayAvg, '周末流量季节性指数应高于工作日')
  })

  it('团建可以查看跨窗口活动报名趋势用于资源规划（边界场景 — 无活动时段的数据完整性）', () => {
    const { collector, controller } = createTestEnv()

    // 模拟只有个别时段有活动的场景
    const now = new Date()
    collector.recordMetric({
      metricName: 'team_event_signups',
      value: 25,
      timestamp: new Date(now.getTime() - 8 * 3600 * 1000).toISOString(),
    })
    collector.recordMetric({
      metricName: 'team_event_signups',
      value: 40,
      timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    })

    // 跨窗口对比
    const compare = controller.compareWindows({ metricName: 'team_event_signups' })
    assert.equal(compare.data.length, 3)
    compare.data.forEach((w: any) => {
      assert.ok(w.window, '应返回窗口标签')
      assert.ok(w.p95 >= 0, '百分位值应为非负数')
    })

    // 查看可用指标列表
    const keys = controller.listKeys()
    assert.ok(keys.data.keys.includes('team_event_signups:global'))
  })
})
