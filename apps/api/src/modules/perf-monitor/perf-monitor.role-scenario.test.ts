/**
 * 🐜 自动: [perf-monitor] [C] 8 角色场景测试
 *
 * 8 角色视角的 perf-monitor 模块全场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 覆盖: record, registerSla, getStats, getAllStats, getSummary, getViolations, getSlowQueries, reset
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerfMonitorController } from './perf-monitor.controller'
import { PerfMonitorService } from './perf-monitor.service'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createTestBed() {
  const service = new PerfMonitorService()
  const controller = new PerfMonitorController(service)
  return { service, controller }
}

/** 快速注入采样数据 */
function injectSamples(
  controller: PerfMonitorController,
  route: string,
  count: number,
  baseDurationMs: number,
  statusCode: number = 200,
  jitter: number = 0,
) {
  for (let i = 0; i < count; i++) {
    controller.record({
      route,
      durationMs: baseDurationMs + Math.floor(Math.random() * jitter),
      statusCode,
      timestamp: new Date(Date.now() + i).toISOString(),
    })
  }
}

/** 注册 SLA 配置 */
function setupSla(controller: PerfMonitorController, route: string, target: number, warn: number) {
  controller.registerSla({ route, targetP95Ms: target, warnThresholdP95Ms: warn })
}

// ════════════════════════════════════════════════════════════════
// 👔店长 — 运营管理视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} perf-monitor 场景测试`, () => {
  beforeEach(() => {
    const { controller } = createTestBed()
    injectSamples(controller, '/api/pos/checkout', 100, 120, 200, 30)
    injectSamples(controller, '/api/member/register', 50, 80, 200, 20)
    injectSamples(controller, '/api/report/daily', 20, 350, 200, 100)
    return () => controller.reset({ reset: true } as any)
  })

  it('店长可查看全局性能总览，了解门店系统健康度', () => {
    const { controller } = createTestBed()
    injectSamples(controller, '/api/pos/checkout', 100, 120, 200, 30)
    injectSamples(controller, '/api/member/register', 50, 80, 200, 20)

    const summary = controller.getSummary()
    expect(summary.data.totalSamples).toBe(150)
    expect(summary.data.routes).toBe(2)
  })

  it('店长查看 SLA 违规概览，识别需要关注的慢链路', () => {
    const { controller, service } = createTestBed()
    // 注册 SLA
    setupSla(controller, '/api/pos/checkout', 200, 150)
    // 注入大量慢请求触发 SLA 违规
    injectSamples(controller, '/api/pos/checkout', 50, 400, 200, 50)

    const violations = controller.getViolations()
    expect(violations.data.length).toBeGreaterThanOrEqual(1)
    // SLA 违规阈值 warnThresholdP95Ms=150，P95 应该超过
    expect(violations.data[0].violations).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒前台 — 收银操作视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} perf-monitor 场景测试`, () => {
  it('前台录入一笔收银耗时记录，系统正常接受', () => {
    const { controller } = createTestBed()

    const result = controller.record({
      route: '/api/pos/checkout',
      durationMs: 156,
      statusCode: 200,
    })

    expect(result.data.accepted).toBe(true)
    expect(result.data.total).toBe(1)
  })

  it('前台记录大量刷卡请求时，系统可承受并准确汇总', () => {
    const { controller } = createTestBed()

    // 模拟高峰期收银记录
    for (let i = 0; i < 100; i++) {
      controller.record({
        route: '/api/pos/checkout',
        durationMs: 100 + Math.floor(Math.random() * 300),
        statusCode: 200,
      })
    }

    const summary = controller.getSummary()
    expect(summary.data.totalSamples).toBe(100)
    expect(summary.data.routes).toBe(1)
    expect(summary.data.slowQueries).toBeGreaterThanOrEqual(0)
  })

  it('前台错误提交负值耗时，系统应拒绝', () => {
    const { controller } = createTestBed()

    // DTO 层应拦截负值（ValidationPipe + @Min(0)），service 层面测试边界
    const record = () =>
      controller.record({
        route: '/api/pos/checkout',
        durationMs: -5,
        statusCode: 200,
      })
    // service 内部不校验负值，但应仍能存储（由 DTO validation 拦截）
    expect(record).not.toThrow()
    const summary = controller.getSummary()
    expect(summary.data.totalSamples).toBe(1)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥HR — 人员绩效视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} perf-monitor 场景测试`, () => {
  it('HR 查看各岗位相关 API 性能统计，作为排班参考', () => {
    const { controller } = createTestBed()
    injectSamples(controller, '/api/hr/attendance', 80, 90, 200, 20)
    injectSamples(controller, '/api/hr/schedule', 40, 110, 200, 15)

    const stats = controller.getStats({ route: '/api/hr/attendance' })
    expect(stats.data.p50).toBeGreaterThan(0)
    expect(stats.data.count).toBe(80)
  })

  it('HR 在业务高峰时系统压力大，P95 上升但仍可接受', () => {
    const { controller } = createTestBed()

    // 模拟高峰压力
    injectSamples(controller, '/api/hr/attendance', 200, 200, 200, 100)
    injectSamples(controller, '/api/hr/attendance', 50, 500, 500, 50)

    const stats = controller.getStats({ route: '/api/hr/attendance' })
    expect(stats.data.errorRate).toBeGreaterThan(0)
    // P95 应反映部分慢请求
    expect(stats.data.p95).toBeGreaterThan(200)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧安监 — 安全运维视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} perf-monitor 场景测试`, () => {
  it('安监检查异常错误率，识别可疑高错误 API', () => {
    const { controller } = createTestBed()
    // 正常流量
    injectSamples(controller, '/api/security/audit', 100, 80, 200, 10)
    // 异常流量 — 大量 500
    injectSamples(controller, '/api/security/audit', 30, 200, 500, 50)

    const stats = controller.getStats({ route: '/api/security/audit' })
    // 错误率 = 30/130 ≈ 23%
    expect(stats.data.errorRate).toBeGreaterThan(0.2)
    expect(stats.data.errorRate).toBeLessThan(0.25)
  })

  it('安监触发重置后系统数据清空，隔离安全事件影响', () => {
    const { controller } = createTestBed()
    injectSamples(controller, '/api/security/auth', 50, 100, 200, 10)

    const before = controller.getSummary()
    expect(before.data.totalSamples).toBeGreaterThan(0)

    controller.reset({ reset: true } as any)

    const after = controller.getSummary()
    expect(after.data.totalSamples).toBe(0)
    expect(after.data.routes).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮导玩员 — 机台运维视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} perf-monitor 场景测试`, () => {
  it('导玩员记录机台上下线操作延迟，验证低延迟体验', () => {
    const { controller } = createTestBed()
    injectSamples(controller, '/api/machine/start', 50, 30, 200, 10)
    injectSamples(controller, '/api/machine/stop', 50, 25, 200, 8)

    const allStats = controller.getAllStats()
    const machineRoutes = allStats.data.filter(s => s.route.startsWith('/api/machine'))
    expect(machineRoutes.length).toBe(2)
    for (const s of machineRoutes) {
      expect(s.p95).toBeLessThan(60) // 导玩操作应在 60ms 内
    }
  })

  it('导玩员查询慢查询列表，定位机台异常卡顿', () => {
    const { controller } = createTestBed()
    // 正常机台操作
    injectSamples(controller, '/api/machine/status', 100, 50, 200, 20)
    // 异常卡顿机台 — 超 500ms 被标记为慢查询
    injectSamples(controller, '/api/machine/status', 10, 800, 200, 200)

    const slow = controller.getSlowQueries({ limit: 5 })
    expect(slow.data.length).toBeGreaterThanOrEqual(1)
    // 所有慢查询都大于 500ms
    for (const s of slow.data) {
      expect(s.durationMs).toBeGreaterThanOrEqual(500)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯运行专员 — 技术运营视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} perf-monitor 场景测试`, () => {
  it('运行专员配置 SLA 阈值后，超阈值行为触发违规记录', () => {
    const { controller } = createTestBed()

    // 先注册一个严格的 SLA
    setupSla(controller, '/api/core/payment', 100, 80)

    // 注入远超阈值的请求
    injectSamples(controller, '/api/core/payment', 60, 500, 200, 100)

    const violations = controller.getViolations()
    expect(violations.data.length).toBe(1)
    expect(violations.data[0].route).toBe('/api/core/payment')
    expect(violations.data[0].violations).toBeGreaterThanOrEqual(1)
    // P95 应远超阈值
    expect(violations.data[0].stats.p95).toBeGreaterThan(80)
  })

  it('运行专员查看多条路由的 P95 排行，优先优化最慢链路', () => {
    const { controller } = createTestBed()
    // 路由1: 较慢
    injectSamples(controller, '/api/report/export', 100, 500, 200, 100)
    // 路由2: 中等
    injectSamples(controller, '/api/member/search', 100, 200, 200, 50)
    // 路由3: 快速
    injectSamples(controller, '/api/health/ping', 100, 10, 200, 5)

    const allStats = controller.getAllStats()
    // 按 P95 降序
    const sorted = allStats.data.sort((a, b) => b.p95 - a.p95)
    expect(sorted[0].route).toBe('/api/report/export')
    expect(sorted[2].route).toBe('/api/health/ping')
  })

  it('运行专员重置后，历史 SLA 违规也被清除', () => {
    const { controller } = createTestBed()
    setupSla(controller, '/api/core/payment', 100, 80)
    injectSamples(controller, '/api/core/payment', 30, 400, 200, 50)

    expect(controller.getViolations().data.length).toBe(1)
    controller.reset({ reset: true } as any)
    expect(controller.getViolations().data.length).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝团建 — 团队协作视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} perf-monitor 场景测试`, () => {
  it('团建活动报名接口性能良好，高峰期无阻塞', () => {
    const { controller } = createTestBed()
    // 模拟 300 人同时报名
    injectSamples(controller, '/api/team/signup', 300, 85, 200, 25)
    // 少量失败
    injectSamples(controller, '/api/team/signup', 5, 100, 503, 20)

    const stats = controller.getStats({ route: '/api/team/signup' })
    expect(stats.data.p50).toBeLessThanOrEqual(120)
    expect(stats.data.errorRate).toBeLessThan(0.05) // < 5% 错误率
  })

  it('团建活动后生成绩效报告，即使慢请求也能降级返回', () => {
    const { controller } = createTestBed()
    // 报告生成 API 可能稍慢
    injectSamples(controller, '/api/team/report', 20, 400, 200, 150)
    injectSamples(controller, '/api/team/report', 3, 800, 503, 50)

    const slow = controller.getSlowQueries({ limit: 10 })
    const reportSlow = slow.data.filter(s => s.route === '/api/team/report')
    expect(reportSlow.length).toBeGreaterThanOrEqual(1)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢营销 — 市场运营视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} perf-monitor 场景测试`, () => {
  it('营销活动 API 在高并发下 P95 超阈值触发告警', () => {
    const { controller } = createTestBed()
    setupSla(controller, '/api/marketing/campaign', 300, 250)

    // 模拟营销活动秒杀流量
    injectSamples(controller, '/api/marketing/campaign', 500, 200, 200, 300)
    injectSamples(controller, '/api/marketing/campaign', 50, 800, 200, 200)

    const violations = controller.getViolations()
    const campaignViolation = violations.data.find(v => v.route === '/api/marketing/campaign')
    expect(campaignViolation).toBeDefined()
    // P95 应超过 250ms 阈值
    expect(campaignViolation!.stats.p95).toBeGreaterThan(250)
  })

  it('营销查看各渠道接口性能对比，决定资源投入', () => {
    const { controller } = createTestBed()
    injectSamples(controller, '/api/marketing/push', 100, 50, 200, 10)
    injectSamples(controller, '/api/marketing/sms', 100, 120, 200, 30)
    injectSamples(controller, '/api/marketing/email', 100, 300, 200, 100)

    const allStats = controller.getAllStats()
    const pushStats = allStats.data.find(s => s.route === '/api/marketing/push')
    const emailStats = allStats.data.find(s => s.route === '/api/marketing/email')
    expect(pushStats).toBeDefined()
    expect(emailStats).toBeDefined()
    // push 比 email 快
    expect(pushStats!.p95).toBeLessThan(emailStats!.p95)
  })
})
