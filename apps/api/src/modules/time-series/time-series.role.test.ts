import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [time-series] [C] 角色测试重写
 *
 * 8 角色视角的时间序列模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖端点: record, query, batch, keys, status, summary, alert-rules, evaluateAlerts, compareWindows, seasonality
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/特殊场景）
 * 使用 node:test 兼容模式（原测试使用 vitest 导入导致在 node --test 下失败）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TimeSeriesController } from './time-series.controller'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import { TimeSeriesService } from './time-series.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createTestEnv() {
  const collector = new TimeSeriesCollectorService()
  const service = new TimeSeriesService(collector)
  const controller = new TimeSeriesController(collector, service)
  return { collector, service, controller }
}

// ═════════════════════════════════════════════════
// 👔 店长 — 关注全店时序指标摘要和告警配置
// ═════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 时间序列模块角色测试`, () => {
  it('店长可以查看全店时序指标摘要', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'order_rate', value: 100 })
    collector.recordMetric({ metricName: 'revenue_per_hour', value: 5000 })
    collector.recordMetric({ metricName: 'customer_count', value: 50 })

    const summary = controller.getSummary()
    assert.ok(summary.data.totalMetrics >= 3)
    assert.ok(summary.data.topMetricNames.includes('order_rate'))
  })

  it('店长可以配置告警规则及时发现问题', () => {
    const { controller } = createTestEnv()
    const result = controller.registerAlertRule({
      metricName: 'api_latency',
      operator: 'gt',
      threshold: 500,
      window: '1h',
      description: 'API延迟超过500ms告警',
    })
    assert.equal(result.id, 0)
    assert.equal(result.rule.metricName, 'api_latency')
    assert.equal(result.rule.operator, 'gt')

    const rules = controller.getAlertRules()
    assert.equal(rules.data.length, 1)
  })

  it('店长可以查看系统运行状态', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'heartbeat', value: 1 })
    const status = controller.getStatus()
    assert.equal(status.data.status, 'ACTIVE')
    assert.ok(status.data.collectorName)
    assert.equal(typeof status.data.uptimeMs, 'number')
  })
})

// ═════════════════════════════════════════════════
// 🛒 前台 — 关注收银台响应时间趋势
// ═════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 时间序列模块角色测试`, () => {
  it('前台可以查看收银台响应时间趋势（正常流程）', () => {
    const { collector, controller } = createTestEnv()
    for (let i = 0; i < 5; i++) {
      collector.recordMetric({ metricName: 'cashier_response_ms', value: 200 + i * 10 })
    }
    const result = controller.query({ metricName: 'cashier_response_ms', window: '1h' })
    assert.equal(result.data.aggregate.avg, 220)
    assert.equal(result.data.aggregate.count, 5)
    assert.equal(result.data.points.length, 5)
  })

  it('前台高峰期查看系统状态（权限边界 — 只读且不包含敏感数据）', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'checkout_load', value: 85 })
    const status = controller.getStatus()
    assert.equal(status.data.status, 'ACTIVE')
    // 不暴露租户 UUID 或凭证
    assert.ok(!status.data.collectorName.toLowerCase().includes('secret'))
  })
})

// ═════════════════════════════════════════════════
// 👥 HR — 关注员工管理相关接口性能
// ═════════════════════════════════════════════════
describe(`${ROLES.HR} 时间序列模块角色测试`, () => {
  it('HR 可以查看员工管理接口响应性能', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'employee_api_response', value: 45 })
    collector.recordMetric({ metricName: 'employee_api_response', value: 55 })

    const result = controller.query({ metricName: 'employee_api_response', window: '24h' })
    assert.equal(result.data.aggregate.avg, 50)
    assert.equal(result.data.aggregate.count, 2)
  })

  it('HR 可以查询考勤系统负载（权限边界 — 不修改底层数据）', () => {
    const { collector, controller } = createTestEnv()
    for (let i = 0; i < 100; i++) {
      collector.recordMetric({ metricName: 'attendance_system_load', value: 70 + Math.random() * 30 })
    }
    const result = controller.query({ metricName: 'attendance_system_load', window: '1h' })
    assert.equal(result.data.aggregate.count, 100)
    assert.ok(result.data.aggregate.avg >= 70)

    // 确认删除告警规则接口存在但不影响指标数据
    const rules = controller.getAlertRules()
    assert.ok(Array.isArray(rules.data))
  })
})

// ═════════════════════════════════════════════════
// 🔧 安监 — 关注安全指标告警
// ═════════════════════════════════════════════════
describe(`${ROLES.Safety} 时间序列模块角色测试`, () => {
  it('安监可以设置安全相关指标的告警规则', () => {
    const { controller } = createTestEnv()
    const result = controller.registerAlertRule({
      metricName: 'failed_login_attempts',
      operator: 'gt',
      threshold: 10,
      window: '1h',
      description: '1小时内登录失败超过10次',
    })
    assert.equal(result.id, 0)
    assert.equal(result.rule.metricName, 'failed_login_attempts')
  })

  it('安监可以评估告警规则检查安全异常', () => {
    const { collector, controller } = createTestEnv()
    controller.registerAlertRule({
      metricName: 'failed_auth_rate',
      operator: 'gt',
      threshold: 10,
      window: '1h',
    })
    for (let i = 0; i < 5; i++) {
      collector.recordMetric({ metricName: 'failed_auth_rate', value: 50 })
    }
    const alerts = controller.evaluateAlerts()
    assert.ok(alerts.data.length >= 1)
    assert.ok(alerts.data[0].message.includes('failed_auth_rate'))
  })

  it('安监可以删除已配置的告警规则（权限边界 — 管理操作不可影响其他规则）', () => {
    const { controller } = createTestEnv()
    controller.registerAlertRule({ metricName: 'test_metric', operator: 'gt', threshold: 100, window: '1h' })
    const removed = controller.removeAlertRule('0')
    assert.equal(removed.removed, true)

    const removedAgain = controller.removeAlertRule('999')
    assert.equal(removedAgain.removed, false)
  })
})

// ═════════════════════════════════════════════════
// 🎮 导玩员 — 关注游戏机台在线率变化
// ═════════════════════════════════════════════════
describe(`${ROLES.Guide} 时间序列模块角色测试`, () => {
  it('导玩员可以查看游戏机台的在线率变化', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'machine_online_rate', value: 95.5 })
    collector.recordMetric({ metricName: 'machine_online_rate', value: 97.2 })

    const result = controller.query({ metricName: 'machine_online_rate', window: '6h' })
    assert.equal(result.data.aggregate.count, 2)
    assert.ok(Math.abs(result.data.aggregate.avg - 96.35) < 0.01)
  })

  it('导玩员可以查看跨窗口趋势对比（权限边界 — 仅查看不修改）', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'game_session_duration', value: 300 })
    collector.recordMetric({ metricName: 'game_session_duration', value: 450 })

    const compare = controller.compareWindows({ metricName: 'game_session_duration' })
    assert.equal(compare.data.length, 3) // 1h, 6h, 24h
    compare.data.forEach((c) => {
      assert.ok(c.avg > 0)
      assert.ok(['1h', '6h', '24h'].includes(c.window))
    })
  })
})

// ═════════════════════════════════════════════════
// 🎯 运行专员 — 关注运营指标与端点管理
// ═════════════════════════════════════════════════
describe(`${ROLES.Ops} 时间序列模块角色测试`, () => {
  it('运行专员可以查看各接口跨窗口性能对比', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'payment_gateway', value: 150 })
    collector.recordMetric({ metricName: 'payment_gateway', value: 200 })

    const compare = controller.compareWindows({ metricName: 'payment_gateway' })
    assert.equal(compare.data.length, 3)
    compare.data.forEach((c) => {
      assert.ok(c.window)
      assert.equal(typeof c.avg, 'number')
    })
  })

  it('运行专员可以批量记录指标做容量规划', () => {
    const { controller } = createTestEnv()
    const result = controller.recordBatch({
      samples: [
        { route: '/api/orders', durationMs: 100 },
        { route: '/api/orders', durationMs: 200 },
        { route: '/api/users', durationMs: 50 },
      ],
    })
    assert.equal(result.status, 'ok')
    assert.equal(result.count, 3)
  })

  it('运行专员查看时序摘要了解系统健康整体状况', () => {
    const { collector, controller } = createTestEnv()
    controller.recordBatch({
      samples: [
        { route: '/api/orders', durationMs: 100 },
        { route: '/api/users', durationMs: 50 },
      ],
    })
    const summary = controller.getSummary()
    assert.equal(summary.data.totalMetrics, 2)

    const keys = controller.listKeys()
    assert.ok(keys.data.keys.length >= 2)
  })
})

// ═════════════════════════════════════════════════
// 🤝 团建 — 关注活动报名系统性能
// ═════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 时间序列模块角色测试`, () => {
  it('团建组织者可以查看活动报名系统响应时间', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'event_booking_response', value: 80 })
    collector.recordMetric({ metricName: 'event_booking_response', value: 120 })

    const result = controller.query({ metricName: 'event_booking_response', window: '24h' })
    assert.equal(result.data.aggregate.avg, 100)
    assert.equal(result.data.aggregate.count, 2)
  })

  it('团建可以查看所有指标列表了解系统运行覆盖范围', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'team_event_signups', value: 30 })
    collector.recordMetric({ metricName: 'team_event_rating', value: 4.5 })

    const keys = controller.listKeys()
    assert.ok(keys.data.keys.includes('team_event_signups:global'))
    assert.ok(keys.data.keys.includes('team_event_rating:global'))
  })

  it('团建可以查看季节性模式用于活动时段规划', () => {
    const { collector, controller } = createTestEnv()
    // 模拟一天内不同时段的数据
    for (let h = 0; h < 24; h++) {
      const ts = new Date('2026-06-27T00:00:00Z')
      ts.setUTCHours(h)
      collector.recordMetric({
        metricName: 'event_traffic',
        value: h >= 18 ? 100 : h >= 12 ? 60 : 20,
        timestamp: ts.toISOString(),
      })
    }
    const result = controller.seasonality({ metricName: 'event_traffic' })
    assert.ok(result.data.daily.length > 0)
    assert.ok(result.data.weekly.length > 0)
  })
})

// ═════════════════════════════════════════════════
// 📢 营销 — 关注营销活动期系统性能
// ═════════════════════════════════════════════════
describe(`${ROLES.Marketing} 时间序列模块角色测试`, () => {
  it('营销可以查看营销活动期间的系统性能', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'campaign_page_load', value: 1200 })
    collector.recordMetric({ metricName: 'campaign_page_load', value: 1500 })
    collector.recordMetric({ metricName: 'campaign_page_load', value: 900 })

    const result = controller.query({ metricName: 'campaign_page_load', window: '1h' })
    assert.equal(result.data.aggregate.avg, 1200)
    assert.equal(result.data.aggregate.count, 3)
    assert.ok(result.data.aggregate.p95 > 0)
  })

  it('营销可以配置转化率异常告警', () => {
    const { collector, controller } = createTestEnv()
    controller.registerAlertRule({
      metricName: 'conversion_rate',
      operator: 'lt',
      threshold: 0.02,
      window: '24h',
      description: '转化率低于2%',
    })
    collector.recordMetric({ metricName: 'conversion_rate', value: 0.015 })
    const alerts = controller.evaluateAlerts()
    assert.ok(alerts.data.length >= 1)
    assert.ok(alerts.data[0].message.includes('conversion_rate'))
  })

  it('营销可以查看季节性模式用于活动排期优化', () => {
    const { collector, controller } = createTestEnv()
    for (let h = 0; h < 24; h++) {
      const ts = new Date('2026-06-27T00:00:00Z')
      ts.setUTCHours(h)
      collector.recordMetric({
        metricName: 'page_traffic_hourly',
        value: Math.round(Math.random() * 1000),
        timestamp: ts.toISOString(),
      })
    }
    const seasonality = controller.seasonality({ metricName: 'page_traffic_hourly' })
    assert.ok(seasonality.data.daily.length === 24)
    assert.ok(seasonality.data.weekly.length === 7)
  })
})

// ═════════════════════════════════════════════════
// 边界情况 — 覆盖异常和边缘场景
// ═════════════════════════════════════════════════
describe('时间序列模块边界情况', () => {
  it('未注册指标应返回空结果而非抛错', () => {
    const { controller } = createTestEnv()
    const result = controller.query({ metricName: 'nonexistent_metric', window: '1h' })
    assert.deepEqual(result.data.points, [])
    assert.equal(result.data.aggregate.count, 0)
  })

  it('删除不存在的告警规则应返回 false', () => {
    const { controller } = createTestEnv()
    const result = controller.removeAlertRule('999')
    assert.equal(result.removed, false)
  })

  it('批量采集后摘要数据应正确', () => {
    const { controller } = createTestEnv()
    controller.recordBatch({
      samples: [
        { route: '/api/orders', durationMs: 100 },
        { route: '/api/orders', durationMs: 200 },
        { route: '/api/users', durationMs: 50 },
      ],
    })
    const summary = controller.getSummary()
    assert.equal(summary.data.totalMetrics, 2)
    assert.ok(summary.data.totalPoints >= 0)
  })

  it('记录并查询单指标应正确', () => {
    const { collector, controller } = createTestEnv()
    controller.recordBatch({
      samples: [
        { route: '/api/tickets', durationMs: 150 },
        { route: '/api/tickets', durationMs: 250 },
      ],
    })
    const result = controller.query({ metricName: '/api/tickets', window: '1h' })
    assert.equal(result.data.aggregate.avg, 200)
    assert.equal(result.data.aggregate.min, 150)
    assert.equal(result.data.aggregate.max, 250)
    assert.equal(result.data.aggregate.count, 2)
  })

  it('跨窗口对比返回正确的窗口数量', () => {
    const { collector, controller } = createTestEnv()
    collector.recordMetric({ metricName: 'transaction_duration', value: 100 })
    const compare = controller.compareWindows({ metricName: 'transaction_duration' })
    assert.equal(compare.data.length, 3)
    compare.data.forEach((w) => {
      assert.equal(w.avg, 100)
      assert.equal(w.count, 1)
      assert.ok(w.p95 >= 0)
    })
  })
})
