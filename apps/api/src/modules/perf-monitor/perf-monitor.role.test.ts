import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 角色测试: 从 8 角色视角测试 perf-monitor
// 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
import { PerfMonitorService } from './perf-monitor.service'
import { PerfMonitorController } from './perf-monitor.controller'

function createTestEnv() {
  const service = new PerfMonitorService()
  const controller = new PerfMonitorController(service)
  return { service, controller }
}

describe('👔 店长视角 - PerfMonitor', () => {
  it('店长可以查看全店各模块 P95 性能概况', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/cashier/checkout', durationMs: 150, statusCode: 200 })
    controller.record({ route: '/api/cashier/checkout', durationMs: 300, statusCode: 200 })
    controller.record({ route: '/api/inventory/stock', durationMs: 45, statusCode: 200 })

    const allStats = controller.getAllStats()
    expect(allStats.data.length).toBe(2)

    const checkoutStats = allStats.data.find(s => s.route === '/api/cashier/checkout')
    expect(checkoutStats).toBeDefined()
    expect(checkoutStats!.p95).toBeGreaterThan(0)
  })

  it('店长希望了解 SLA 合规情况，避免顾客体验下降', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/cashier/checkout', targetP95Ms: 200, warnThresholdP95Ms: 250 })
    // Simulate slow checkout
    for (let i = 0; i < 30; i++) {
      controller.record({ route: '/api/cashier/checkout', durationMs: 300 + (i % 5) * 50, statusCode: 200 })
    }
    const violations = controller.getViolations()
    expect(violations.data.length).toBeGreaterThan(0)
    expect(violations.data[0].violations).toBeGreaterThan(0)
  })
})

describe('🛒 前台视角 - PerfMonitor', () => {
  it('前台收银系统响应应在 500ms 以内', () => {
    const { service } = createTestEnv()
    service.registerSla({ route: '/api/cashier/payment', targetP95Ms: 400, warnThresholdP95Ms: 500 })
    for (let i = 0; i < 20; i++) {
      service.record({ route: '/api/cashier/payment', durationMs: 100 + i * 10, statusCode: 200, timestamp: '' })
    }
    const stats = service.getStatsForRoute('/api/cashier/payment')
    expect(stats.p95).toBeLessThanOrEqual(400)
    expect(stats.max).toBeGreaterThan(0)
  })

  it('前台可以查看当日慢交易汇总', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/cashier/payment', durationMs: 120, statusCode: 200 })
    controller.record({ route: '/api/cashier/refund', durationMs: 800, statusCode: 200 }) // slow
    controller.record({ route: '/api/cashier/checkout', durationMs: 1500, statusCode: 200 }) // slow

    const slow = controller.getSlowQueries({ limit: 20 })
    expect(slow.data.length).toBe(2)
    expect(slow.data.some(s => s.route === '/api/cashier/refund')).toBe(true)
  })
})

describe('👥 HR视角 - PerfMonitor', () => {
  it('HR 关心员工操作系统的整体稳定性和响应速度', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 10; i++) {
      controller.record({ route: '/api/hr/attendance', durationMs: 50 + i * 5, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/hr/attendance' })
    expect(stats.data.count).toBe(10)
    expect(stats.data.errorRate).toBe(0)
  })

  it('HR 系统若出现高错误率应及时上报', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 5; i++) {
      controller.record({ route: '/api/hr/payroll', durationMs: 100, statusCode: 500 }) // all errors
    }
    const stats = controller.getStats({ route: '/api/hr/payroll' })
    expect(stats.data.errorRate).toBe(1)
    expect(stats.data.count).toBe(5)
  })
})

describe('🔧 安监视角 - PerfMonitor', () => {
  it('安监需要监控安全相关接口的延迟，确保实时告警', () => {
    const { controller } = createTestEnv()
    // Use a generous threshold so fast requests don't trigger violations
    controller.registerSla({ route: '/api/security/alert', targetP95Ms: 200, warnThresholdP95Ms: 300 })
    for (let i = 0; i < 20; i++) {
      controller.record({ route: '/api/security/alert', durationMs: i * 5, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/security/alert' })
    expect(stats.data.p95).toBeLessThanOrEqual(200) // fast enough within threshold
    expect(stats.data.count).toBe(20)
  })

  it('安监安全告警接口 P95 不能超过 500ms', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/security/alert', targetP95Ms: 500, warnThresholdP95Ms: 600 })
    for (let i = 0; i < 30; i++) {
      controller.record({ route: '/api/security/alert', durationMs: 50 + i * 2, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/security/alert' })
    expect(stats.data.p95).toBeLessThanOrEqual(110)
    expect(stats.data.count).toBe(30)
  })
})

describe('🎮 导玩员视角 - PerfMonitor', () => {
  it('导玩员需要确保娱乐设备接口响应流畅', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 50; i++) {
      controller.record({ route: '/api/game/start', durationMs: 30 + i, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/game/start' })
    expect(stats.data.p50).toBeLessThan(100)
    expect(stats.data.count).toBe(50)
  })

  it('导玩员会关注设备异常导致的 P95 飙升', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/game/console', targetP95Ms: 200, warnThresholdP95Ms: 250 })
    for (let i = 0; i < 20; i++) {
      controller.record({ route: '/api/game/console', durationMs: 1000 + i, statusCode: 200 }) // very slow
    }
    const violations = controller.getViolations()
    expect(violations.data[0].violations).toBeGreaterThan(0)
  })
})

describe('🎯 运行专员视角 - PerfMonitor', () => {
  it('运行专员可以获取系统性能总览大屏', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/ops/monitor', durationMs: 200, statusCode: 200 })
    controller.record({ route: '/api/ops/monitor', durationMs: 300, statusCode: 200 })
    controller.record({ route: '/api/ops/backup', durationMs: 1500, statusCode: 200 })

    const summary = controller.getSummary()
    expect(summary.data.totalSamples).toBe(3)
    expect(summary.data.routes).toBe(2)
  })

  it('运行专员可以导出全路由性能统计数据', () => {
    const { controller } = createTestEnv()
    controller.record({ route: '/api/ops/health', durationMs: 50, statusCode: 200 })
    controller.record({ route: '/api/ops/backup', durationMs: 800, statusCode: 200 })
    const allStats = controller.getAllStats()
    expect(allStats.data.length).toBe(2)
    // Stats should have correct shape
    for (const stat of allStats.data) {
      expect(stat.p50).toBeGreaterThanOrEqual(0)
      expect(stat.p95).toBeGreaterThanOrEqual(stat.p50)
      expect(stat.p99).toBeGreaterThanOrEqual(stat.p95)
    }
  })
})

describe('🤝 团建视角 - PerfMonitor', () => {
  it('团建活动报名接口需要稳定', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 100; i++) {
      controller.record({ route: '/api/team-building/signup', durationMs: 100, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/team-building/signup' })
    expect(stats.data.count).toBe(100)
    expect(stats.data.errorRate).toBe(0)
    expect(stats.data.p50).toBe(100)
  })

  it('团建报名高峰期的性能不能降级（200 并发模拟）', () => {
    const { service } = createTestEnv()
    for (let i = 0; i < 200; i++) {
      service.record({ route: '/api/team-building/signup', durationMs: 80 + (i % 20) * 2, statusCode: i < 198 ? 200 : 500, timestamp: '' })
    }
    const stats = service.getStatsForRoute('/api/team-building/signup')
    expect(stats.count).toBe(200)
    expect(stats.errorRate).toBeLessThanOrEqual(0.01) // 正常流程错误率应极低
    expect(stats.p95).toBeGreaterThan(0)
  })
})

describe('📢 营销视角 - PerfMonitor', () => {
  it('营销活动接口的 P95 应在可接受范围内以保证用户体验', () => {
    const { controller } = createTestEnv()
    controller.registerSla({ route: '/api/campaign/publish', targetP95Ms: 300, warnThresholdP95Ms: 350 })
    for (let i = 0; i < 30; i++) {
      controller.record({ route: '/api/campaign/publish', durationMs: 50 + i * 5, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/campaign/publish' })
    expect(stats.data.p95).toBeLessThanOrEqual(300)
  })

  it('营销投放报表接口响应应在 1s 以内', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 20; i++) {
      controller.record({ route: '/api/marketing/report', durationMs: 200 + i * 30, statusCode: 200 })
    }
    const stats = controller.getStats({ route: '/api/marketing/report' })
    expect(stats.data.p95).toBeLessThan(1000)
    expect(stats.data.max).toBeGreaterThan(0)
  })
})
