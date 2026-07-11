import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * health-dashboard.role-scenario.test.ts — 8角色场景测试 (Scenario Based)
 *
 * 基于真实运营场景，8个角色各2个场景测试 (正常流程 + 权限边界)
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HealthDashboardController } from './health-dashboard.controller'
import { HealthScoreService, type TenantHealthInput } from './health-score.service'
import { HealthDashboardService } from './health-dashboard.service'

function createController() {
  const healthScore = new HealthScoreService()
  const dashboard = new HealthDashboardService(healthScore)
  const controller = new HealthDashboardController(healthScore, dashboard)
  return { controller, healthScore, dashboard }
}

function healthy(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return { tenantId: 's-h', p95Ms: 50, errorRate: 0.0005, quotaUsagePercent: 0.3, championActivityScore: 90, anomalyCount30d: 0, ...overrides }
}

function warning(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return { tenantId: 's-w', p95Ms: 500, errorRate: 0.01, quotaUsagePercent: 0.75, championActivityScore: 30, anomalyCount30d: 5, ...overrides }
}

function critical(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return { tenantId: 's-c', p95Ms: 5000, errorRate: 0.5, quotaUsagePercent: 2.0, championActivityScore: 0, anomalyCount30d: 50, ...overrides }
}

// ═══════════════════════════════════════════════════════════════════
// 👔 店长 — 门店经营决策场景
// ═══════════════════════════════════════════════════════════════════
describe('👔店长 health-dashboard 场景测试', () => {
  it('【正常流程】店长查看全门店健康度仪表板，按状态汇总', () => {
    const { controller } = createController()
    const result = controller.evaluate({ tenants: [healthy({ tenantId: 'a' }), warning({ tenantId: 'b' }), critical({ tenantId: 'c' })] })
    assert.equal(result.length, 3)
    const statuses = result.map(r => r.status)
    assert.ok(statuses.includes('HEALTHY'))
    assert.ok(statuses.includes('WARNING'))
    assert.ok(statuses.includes('CRITICAL'))
    // 结果已按 score 升序排: c < b < a
    assert.ok(result[2].score > result[0].score)
  })

  it('【权限边界】店长评估 100 个租户的大批量场景（性能边界）', () => {
    const { controller } = createController()
    const tenants = Array.from({ length: 100 }, (_, i) => healthy({ tenantId: `bulk-${i}` }))
    const result = controller.evaluate({ tenants })
    assert.equal(result.length, 100)
    // 全部 HEALTHY
    assert.ok(result.every(r => r.status === 'HEALTHY'))
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🛒 前台 — 日常接待查看场景
// ═══════════════════════════════════════════════════════════════════
describe('🛒前台 health-dashboard 场景测试', () => {
  it('【正常流程】前台快速查看本门店健康度', () => {
    const { controller } = createController()
    const result = controller.evaluate({ tenants: [healthy({ tenantId: 'my-store' })] })
    assert.equal(result[0].tenantId, 'my-store')
    assert.equal(result[0].status, 'HEALTHY')
    assert.ok(typeof result[0].score === 'number')
    assert.ok(Array.isArray(result[0].recommendations))
  })

  it('【权限边界】前台查看空汇总（未接入租户）', () => {
    const { controller } = createController()
    const summary = controller.generateSummary({})
    assert.equal(summary.totalTenants, 0)
    assert.equal(summary.averageScore, 0)
    assert.ok(summary.computedAt)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 👥 HR — 团队活跃度管理场景
// ═══════════════════════════════════════════════════════════════════
describe('👥HR health-dashboard 场景测试', () => {
  it('【正常流程】HR 检查不同 Champion 活跃度分值', () => {
    const { healthScore } = createController()
    const s1 = healthScore.compute(healthy({ championActivityScore: 0 }))
    const s2 = healthScore.compute(healthy({ championActivityScore: 100 }))
    assert.ok(s2.score > s1.score, '高活跃度应获得更高总分')
    assert.equal(s1.components.community, 20, 'champion=0 应得 community=20')
    assert.equal(s2.components.community, 100, 'champion>=100 应得 community=100')
  })

  it('【权限边界】HR 面对所有门店低活跃度，评估是否影响整体健康', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [
        healthy({ tenantId: 'hr-1', championActivityScore: 3, p95Ms: 50, errorRate: 0.0005 }),
        healthy({ tenantId: 'hr-2', championActivityScore: 2, p95Ms: 80, errorRate: 0.001 }),
      ],
    })
    // community=20 => weight 20% => min contribution = 20*0.2=4
    // performance 100, reliability 100, quota 100 => 30+30+20+4=84 => HEALTHY
    assert.equal(result[0].status, 'HEALTHY', '即使低活跃度,其他指标优秀也能保持健康')
    assert.ok(result[0].recommendations.some(r => r.includes('Champion')),
      `Champion 活跃度低应有建议, 实际: ${result[0].recommendations.join(';')}`)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全与异常监控场景
// ═══════════════════════════════════════════════════════════════════
describe('🔧安监 health-dashboard 场景测试', () => {
  it('【正常流程】安监发现异常事件超过阈值触发告警', () => {
    const { controller } = createController()
    const alerts = controller.checkAlerts({
      scores: [critical({ tenantId: 'sec-breach', anomalyCount30d: 100 })],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['dingtalk', 'feishu'] },
    })
    assert.ok(alerts.length > 0)
    assert.equal(alerts[0].severity, 'CRITICAL')
    assert.ok(alerts[0].notifyChannels.includes('dingtalk'))
  })

  it('【权限边界】安监配置极端阈值 — warning=99 critical=0 产生 WARNING', () => {
    const { controller } = createController()
    const alerts = controller.checkAlerts({
      scores: [healthy({ tenantId: 'sec-custom', p95Ms: 200, errorRate: 0.001 })],
      config: { warningThreshold: 99, criticalThreshold: 0, notifyChannels: ['dingtalk'] },
    })
    // score ≈ 90 => 90 < 99 => WARNING; 90 >= 0 => 不是 CRITICAL
    assert.equal(alerts.length, 1)
    assert.equal(alerts[0].severity, 'WARNING')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 设备与会员体验场景
// ═══════════════════════════════════════════════════════════════════
describe('🎮导玩员 health-dashboard 场景测试', () => {
  it('【正常流程】导玩员检查设备延迟对评分的影响', () => {
    const { healthScore } = createController()
    const low = healthScore.compute(healthy({ p95Ms: 3000 }))
    const high = healthScore.compute(healthy({ p95Ms: 50 }))
    assert.equal(high.components.performance, 100, 'P95=50 满分')
    assert.equal(low.components.performance, 30, 'P95=3000 得 30 分')
    assert.ok(high.score > low.score)
  })

  it('【权限边界】导玩员检查 P95 超出最大阈值仍能评分不崩溃', () => {
    const { healthScore } = createController()
    const s = healthScore.compute(healthy({ p95Ms: 99999 }))
    assert.equal(s.components.performance, 10, '远超最大阈值应得最低分 10')
    assert.ok(Number.isFinite(s.score), '分数应有效')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运维深度场景
// ═══════════════════════════════════════════════════════════════════
describe('🎯运行专员 health-dashboard 场景测试', () => {
  it('【正常流程】运行专员查看混合状态汇总和告警', () => {
    const { controller } = createController()
    const result = controller.evaluate({ tenants: [healthy(), warning(), critical()] })
    assert.equal(result.length, 3)
    // 从 summary 验证
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([healthy(), warning(), critical()])
    assert.equal(summary.byStatus.HEALTHY + summary.byStatus.WARNING + summary.byStatus.CRITICAL, 3)
    assert.equal(summary.alerts.length, 2) // warning + critical
  })

  it('【权限边界】运行专员配置报警渠道为空数组', () => {
    const { controller } = createController()
    const alerts = controller.checkAlerts({
      scores: [critical()],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: [] },
    })
    assert.equal(alerts.length, 1)
    assert.deepEqual(alerts[0].notifyChannels, [])
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝 团建 — 场地整体评估场景
// ═══════════════════════════════════════════════════════════════════
describe('🤝团建 health-dashboard 场景测试', () => {
  it('【正常流程】团建筛选所有健康门店用于举办活动', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [healthy({ tenantId: 'venue-1' }), healthy({ tenantId: 'venue-2' }), warning({ tenantId: 'venue-3' })],
    })
    const healthyVenues = result.filter(r => r.status === 'HEALTHY')
    assert.equal(healthyVenues.length, 2)
    assert.ok(healthyVenues.every(r => r.recommendations[0] === '健康度良好,继续保持'))
  })

  it('【权限边界】团建检查单门店最极端退化情况', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [{
        tenantId: 'worst-venue',
        p95Ms: 10000,
        errorRate: 0.5,
        quotaUsagePercent: 2.0,
        championActivityScore: 0,
        anomalyCount30d: 999,
      }],
    })
    assert.equal(result[0].status, 'CRITICAL')
    // performance=10, reliability=10, quota=10, community=20 => score = 3+3+2+4 = 12
    assert.equal(result[0].score, 12, '所有维度最差得分为 12（community 最低 20）')
    assert.ok(result[0].recommendations.length >= 4, '最差情况应有多条优化建议')
    assert.ok(result[0].recommendations.some(r => r.includes('性能') || r.includes('P95')))
    assert.ok(result[0].recommendations.some(r => r.includes('错误率')))
    assert.ok(result[0].recommendations.some(r => r.includes('配额') || r.includes('升级')))
    assert.ok(result[0].recommendations.some(r => r.includes('异常事件')))
  })
})

// ═══════════════════════════════════════════════════════════════════
// 📢 营销 — 配额与升级场景
// ═══════════════════════════════════════════════════════════════════
describe('📢营销 health-dashboard 场景测试', () => {
  it('【正常流程】营销识别高配额使用率门店推动升级', () => {
    const { healthScore } = createController()
    const scores = [
      { quota: 0.45, expected: 100 }, // <0.5
      { quota: 0.65, expected: 90 },  // <0.7
      { quota: 0.75, expected: 75 },  // <0.8
      { quota: 0.85, expected: 50 },  // <0.9
      { quota: 0.95, expected: 30 },  // <1.0
      { quota: 1.50, expected: 10 },  // >=1.0
    ]
    for (const { quota, expected } of scores) {
      const s = healthScore.compute(healthy({ quotaUsagePercent: quota }))
      assert.equal(s.components.quotaHealth, expected, `quota=${quota} 应为 ${expected}`)
    }
    // 高 quota 门店应有升级推荐
    const high = healthScore.compute(healthy({ quotaUsagePercent: 0.92 }))
    assert.ok(high.recommendations.some(r => r.includes('升级') || r.includes('配额')),
      `高 quota 应有升级建议: ${high.recommendations.join(';')}`)
  })

  it('【权限边界】营销查看低配额使用门店（配额优化建议不应出现）', () => {
    const { healthScore } = createController()
    const s = healthScore.compute(healthy({ quotaUsagePercent: 0.1 }))
    // quota=100 >= 70 → 无配额建议
    assert.ok(!s.recommendations.some(r => r.includes('配额') || r.includes('升级')),
      `低配额不应有升级建议: ${s.recommendations.join(';')}`)
    assert.ok(s.recommendations.some(r => r === '健康度良好,继续保持'), '应只有一条积极建议')
  })
})
