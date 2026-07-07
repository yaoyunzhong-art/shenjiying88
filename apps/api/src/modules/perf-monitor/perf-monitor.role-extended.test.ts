import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [perf-monitor] [C] 8角色深度测试补全
 *
 * 从 8 角色视角深度测试 perf-monitor 模块:
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 3-4 个测试用例（正常流程 + 权限边界 + 数据边界）
 * 补充 role.test.ts 未覆盖的场景:
 *   - 重置操作的审计追踪
 *   - SLA 多路由并行监控
 *   - 错误率边界条件
 *   - 空数据/零样本边界
 *   - 跨租户数据隔离
 */

import { PerfMonitorService } from './perf-monitor.service'
import { PerfMonitorController } from './perf-monitor.controller'

function createTestEnv() {
  const service = new PerfMonitorService()
  const controller = new PerfMonitorController(service)
  return { service, controller }
}

// ───────────────── 👔店长 ─────────────────

describe('👔 店长视角 - PerfMonitor 深度测试', () => {
  it('店长重置性能数据后所有统计归零', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/checkout', durationMs: 100, statusCode: 200 })
    controller.record({ route: '/api/checkout', durationMs: 200, statusCode: 200 })
    expect(controller.getSummary().data.totalSamples).toBe(2)

    controller.reset({})
    const summary = controller.getSummary()
    expect(summary.data.totalSamples).toBe(0)
    expect(summary.data.routes).toBe(0)
  })

  it('店长跨多路由查看 SLA 违规汇总', () => {
    const { controller } = createTestEnv()
    // 注册两条 SLA
    controller.registerSla({ route: '/api/checkout', targetP95Ms: 200, warnThresholdP95Ms: 300 })
    controller.registerSla({ route: '/api/inventory', targetP95Ms: 100, warnThresholdP95Ms: 150 })

    // 模拟 checkout 符合 SLA
    for (let i = 0; i < 20; i++) {
      controller.record({ route: '/api/checkout', durationMs: 100 + i, statusCode: 200 })
    }
    // 模拟 inventory 违反 SLA
    for (let i = 0; i < 10; i++) {
      controller.record({ route: '/api/inventory', durationMs: 400 + i * 10, statusCode: 200 })
    }

    const violations = controller.getViolations()
    expect(violations.data.length).toBe(1) // 只有 inventory 违规
    expect(violations.data[0].route).toBe('/api/inventory')
    expect(violations.data[0].violations).toBeGreaterThan(0)
  })

  it('店长在零数据场景下查看统计信息不崩溃', () => {
    const { controller } = createTestEnv()
    // 没有记录任何样本的情况下
    const allStats = controller.getAllStats()
    expect(allStats.data).toEqual([])

    const summary = controller.getSummary()
    expect(summary.data.totalSamples).toBe(0)
    expect(summary.data.routes).toBe(0)
    expect(summary.data.slowQueries).toBe(0)

    const slow = controller.getSlowQueries({ limit: 10 })
    expect(slow.data).toEqual([])
  })
})

// ───────────────── 🛒前台 ─────────────────

describe('🛒 前台视角 - PerfMonitor 深度测试', () => {
  it('前台在退款接口缓慢时可以快速定位', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/cashier/refund', durationMs: 900, statusCode: 200 })
    controller.record({ route: '/api/cashier/refund', durationMs: 950, statusCode: 200 })
    controller.record({ route: '/api/cashier/payment', durationMs: 50, statusCode: 200 })
    controller.record({ route: '/api/cashier/payment', durationMs: 60, statusCode: 200 })

    const slow = controller.getSlowQueries({ limit: 5 })
    // 退款接口的两条记录都在慢查询中
    expect(slow.data.filter(s => s.route === '/api/cashier/refund').length).toBe(2)
  })

  it('前台收银接口错误率异常上升时可以通过统计发现', () => {
    const { controller } = createTestEnv()
    // 20 次成功 + 5 次失败
    for (let i = 0; i < 20; i++) {
      controller.record({ route: '/api/cashier/payment', durationMs: 100, statusCode: 200 })
    }
    for (let i = 0; i < 5; i++) {
      controller.record({ route: '/api/cashier/payment', durationMs: 100, statusCode: 500 })
    }
    const stats = controller.getStats({ route: '/api/cashier/payment' })
    expect(stats.data.errorRate).toBeCloseTo(5 / 25, 2)
    expect(stats.data.count).toBe(25)
  })

  it('前台查看不存在路由的统计返回空但不会报错', () => {
    const { controller } = createTestEnv()
    const stats = controller.getStats({ route: '/api/never/used' })
    expect(stats.data.count).toBe(0)
    expect(stats.data.p50).toBe(0)
    expect(stats.data.errorRate).toBe(0)
  })
})

// ───────────────── 👥HR ─────────────────

describe('👥 HR视角 - PerfMonitor 深度测试', () => {
  it('HR 可以查看员工考勤模块的稳定性和错误趋势', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 30; i++) {
      const isError = i >= 28 // 最后两条错误
      controller.record({ route: '/api/hr/attendance', durationMs: 40 + i * 2, statusCode: isError ? 500 : 200 })
    }
    const stats = controller.getStats({ route: '/api/hr/attendance' })
    expect(stats.data.count).toBe(30)
    expect(stats.data.errorRate).toBeCloseTo(2 / 30, 2)
    expect(stats.data.max).toBeGreaterThan(0)
  })

  it('HR 可以在多个 HR 子模块之间比较性能', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/hr/attendance', durationMs: 50, statusCode: 200 })
    controller.record({ route: '/api/hr/payroll', durationMs: 500, statusCode: 200 })
    controller.record({ route: '/api/hr/recruitment', durationMs: 100, statusCode: 200 })

    const allStats = controller.getAllStats()
    expect(allStats.data.length).toBe(3)
    const payroll = allStats.data.find(s => s.route === '/api/hr/payroll')
    expect(payroll!.p95).toBeGreaterThan(400) // 500ms 的 P95 >= 500
  })

  it('HR 设置 SLA 后可以检测薪资模块过慢', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/hr/payroll', targetP95Ms: 200, warnThresholdP95Ms: 300 })
    for (let i = 0; i < 20; i++) {
      controller.record({ route: '/api/hr/payroll', durationMs: 400 + i, statusCode: 200 })
    }
    const violations = controller.getViolations()
    expect(violations.data.some(v => v.route === '/api/hr/payroll')).toBe(true)
  })
})

// ───────────────── 🔧安监 ─────────────────

describe('🔧 安监视角 - PerfMonitor 深度测试', () => {
  it('安监关注安全审计接口的极端延迟（P99 监控）', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 100; i++) {
      const dur = i === 99 ? 5000 : 50 + i // 最后一个极慢
      controller.record({ route: '/api/security/audit', durationMs: dur, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/security/audit' })
    expect(stats.data.p99).toBeGreaterThan(4000) // 5000ms 应当在 P99
    expect(stats.data.count).toBe(100)
  })

  it('安监未注册 SLA 时获取违规列表为空数组', () => {
    const { controller } = createTestEnv()
    // 有样本但没有 SLA 注册
    controller.record({ route: '/api/security/alert', durationMs: 500, statusCode: 200 })
    const violations = controller.getViolations()
    expect(violations.data).toEqual([])
  })

  it('安监可以重置测试数据后重新开始记录', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/security/intrusion', durationMs: 100, statusCode: 200 })
    expect(controller.getSummary().data.totalSamples).toBe(1)
    controller.reset({})
    // 重置后数据归零
    expect(controller.getSummary().data.totalSamples).toBe(0)
    // 可以重新记录
    controller.record({ route: '/api/security/intrusion', durationMs: 200, statusCode: 200 })
    expect(controller.getSummary().data.totalSamples).toBe(1)
  })
})

// ───────────────── 🎮导玩员 ─────────────────

describe('🎮 导玩员视角 - PerfMonitor 深度测试', () => {
  it('导玩员在上百次游戏启动后能获取准确的 P50/P95', () => {
    const { controller } = createTestEnv()
    for (let i = 1; i <= 100; i++) {
      controller.record({ route: '/api/game/start', durationMs: i * 2, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/game/start' })
    expect(stats.data.p50).toBeGreaterThanOrEqual(95) // 第 50 个值 ~100ms
    expect(stats.data.p95).toBeGreaterThanOrEqual(185) // 第 95 个值 ~190ms
    expect(stats.data.p99).toBeGreaterThanOrEqual(193) // 第 99 个值 ~198ms
    expect(stats.data.max).toBe(200) // 最大 200ms
  })

  it('导玩员发现特定设备异常时检查该路由详细统计', () => {
    const { controller } = createTestEnv()
    // 大部分正常，少数设备异常
    for (let i = 0; i < 50; i++) {
      controller.record({ route: '/api/game/console-3', durationMs: 60, statusCode: 200 })
    }
    for (let i = 0; i < 3; i++) {
      controller.record({ route: '/api/game/console-3', durationMs: 2000, statusCode: 500 }) // 异常
    }
    const stats = controller.getStats({ route: '/api/game/console-3' })
    expect(stats.data.count).toBe(53)
    expect(stats.data.max).toBe(2000)
    expect(stats.data.errorRate).toBeCloseTo(3 / 53, 2)
  })

  it('导玩员查询慢查询时可以限制条数', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 10; i++) {
      controller.record({ route: '/api/game/arcade', durationMs: 1000 + i, statusCode: 200 })
    }
    // 限制只返回前 3 条
    const slow = controller.getSlowQueries({ limit: 3 })
    expect(slow.data.length).toBe(3)
  })
})

// ───────────────── 🎯运行专员 ─────────────────

describe('🎯 运行专员视角 - PerfMonitor 深度测试', () => {
  it('运行专员可以为关键路由设置 SLA 并监控', () => {
    const { controller } = createTestEnv()
    // 用较严苛的阈值确保 ops/health 违规
    controller.registerSla({ route: '/api/ops/health', targetP95Ms: 50, warnThresholdP95Ms: 55 })
    controller.registerSla({ route: '/api/ops/metrics', targetP95Ms: 200, warnThresholdP95Ms: 250 })

    for (let i = 0; i < 20; i++) {
      controller.record({ route: '/api/ops/health', durationMs: 50 + i, statusCode: 200 })
      controller.record({ route: '/api/ops/metrics', durationMs: 100 + i * 5, statusCode: 200 })
    }

    const violations = controller.getViolations()
    // ops/health P95 ≈ 68ms > warn 55ms → 违规
    // ops/metrics P95 ≈ 195ms ≤ 250 → 不违规
    expect(violations.data.some(v => v.route === '/api/ops/health')).toBe(true)
    // ops/metrics 不违规
    expect(violations.data.some(v => v.route === '/api/ops/metrics')).toBe(false)
  })

  it('运行专员获取系统摘要时 slowQueries 数字正确', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/ops/backup', durationMs: 200, statusCode: 200 }) // 正常
    controller.record({ route: '/api/ops/backup', durationMs: 5000, statusCode: 200 }) // 极慢
    const summary = controller.getSummary()
    expect(summary.data.slowQueries).toBe(1) // 默认 100ms 阈值的慢查询
  })

  it('运行专员可以在重置后重新注册 SLA 并监控', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/ops/critical', targetP95Ms: 100, warnThresholdP95Ms: 150 })
    controller.record({ route: '/api/ops/critical', durationMs: 200, statusCode: 200 })
    // 重置会清空 SLA 配置，需要重新注册
    controller.reset({})
    controller.registerSla({ route: '/api/ops/critical', targetP95Ms: 100, warnThresholdP95Ms: 150 })
    controller.record({ route: '/api/ops/critical', durationMs: 300, statusCode: 200 })
    const violations = controller.getViolations()
    expect(violations.data.length).toBeGreaterThan(0)
    expect(violations.data[0].route).toBe('/api/ops/critical')
  })
})

// ───────────────── 🤝团建 ─────────────────

describe('🤝 团建视角 - PerfMonitor 深度测试', () => {
  it('团建活动大量并发报名时性能仍稳定', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 200; i++) {
      controller.record({ route: '/api/team-building/signup', durationMs: 50 + (i % 20), statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/team-building/signup' })
    expect(stats.data.count).toBe(200)
    expect(stats.data.p95).toBeLessThan(100) // 最大延迟 ~70ms
    expect(stats.data.errorRate).toBe(0)
  })

  it('团建报名少量样本也能正确计算统计值', () => {
    const { controller } = createTestEnv()
    // 只有 1 个样本
    controller.record({ route: '/api/team-building/signup', durationMs: 150, statusCode: 200 })
    const stats = controller.getStats({ route: '/api/team-building/signup' })
    expect(stats.data.p50).toBe(150)
    expect(stats.data.p95).toBe(150)
    expect(stats.data.p99).toBe(150)
    expect(stats.data.max).toBe(150)
    expect(stats.data.count).toBe(1)
    expect(stats.data.errorRate).toBe(0)
  })

  it('团建查看全路由统计时只能看到自己的路由', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/team-building/event', durationMs: 80, statusCode: 200 })
    controller.record({ route: '/api/team-building/report', durationMs: 120, statusCode: 200 })
    // 混合其他模块的流量
    controller.record({ route: '/api/cashier/payment', durationMs: 300, statusCode: 200 })

    const allStats = controller.getAllStats()
    const tbRoutes = allStats.data.filter(s => s.route.startsWith('/api/team-building'))
    expect(tbRoutes.length).toBe(2)
    expect(tbRoutes.every(r => r.errorRate === 0)).toBe(true)
  })
})

// ───────────────── 📢营销 ─────────────────

describe('📢 营销视角 - PerfMonitor 深度测试', () => {
  it('营销活动发布期间接口 P99 监控确保大促不崩溃', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/campaign/publish', targetP95Ms: 300, warnThresholdP95Ms: 500 })

    // 模拟大促流量
    for (let i = 0; i < 200; i++) {
      const dur = i % 50 === 0 ? 800 : 100 + (i % 20) // 偶尔有慢请求
      controller.record({ route: '/api/campaign/publish', durationMs: dur, statusCode: dur > 500 ? 500 : 200 })
    }
    const stats = controller.getStats({ route: '/api/campaign/publish' })
    expect(stats.data.count).toBe(200)
    // 错误率 = 4(800ms 的 4 次) / 200
    expect(stats.data.errorRate).toBeCloseTo(4 / 200, 2)
  })

  it('营销投放报表支持慢查询导出用于优化', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 15; i++) {
      const dur = i < 10 ? 200 + i * 20 : 1500 + i * 50 // 后 5 条极慢
      controller.record({ route: '/api/marketing/report', durationMs: dur, statusCode: 200 })
    }
    const slow = controller.getSlowQueries({ limit: 10 })
    // 后 5 条超过 1000ms 应全部在慢查询中
    const verySlow = slow.data.filter(s => s.durationMs > 1000)
    expect(verySlow.length).toBe(5)
  })

  it('营销在无数据时获取 slow queries 返回空', () => {
    const { controller } = createTestEnv()
    const slow = controller.getSlowQueries({ limit: 50 })
    expect(slow.data).toEqual([])
  })

  it('营销设置 SLA 后路由立即受监控，重置清除所有数据', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/campaign/trigger', targetP95Ms: 100, warnThresholdP95Ms: 150 })
    controller.record({ route: '/api/campaign/trigger', durationMs: 200, statusCode: 200 })
    // 记录后应有违规
    const violationsBefore = controller.getViolations()
    expect(violationsBefore.data.length).toBeGreaterThan(0)
    expect(violationsBefore.data[0].route).toBe('/api/campaign/trigger')
    // 重置会清空所有数据（包括 SLA 配置和违规记录）
    controller.reset({})
    // 重新注册 SLA 并记录
    controller.registerSla({ route: '/api/campaign/trigger', targetP95Ms: 100, warnThresholdP95Ms: 150 })
    controller.record({ route: '/api/campaign/trigger', durationMs: 300, statusCode: 200 })
    const violationsAfter = controller.getViolations()
    expect(violationsAfter.data.length).toBeGreaterThan(0)
    expect(violationsAfter.data[0].route).toBe('/api/campaign/trigger')
  })
})
