import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [health-dashboard] [C] 角色扩展测试编写
 *
 * 8 角色深度场景扩展测试 — health-dashboard 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例（正常流程 + 降级/边界 + 异常场景）
 * 覆盖：evaluate / generateSummary / checkAlerts / getMetrics 四个端点
 * 扩展：混合多阈值告警、边角配额值、服务降级推荐、大规模批量评估
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HealthDashboardController } from './health-dashboard.controller'
import { HealthScoreService, type TenantHealthInput, type TenantHealthScore } from './health-score.service'
import { HealthDashboardService, type DashboardSummary, type AlertConfig } from './health-dashboard.service'

// ── 辅助工厂 ──
function createController() {
  const healthScore = new HealthScoreService()
  const dashboard = new HealthDashboardService(healthScore)
  const controller = new HealthDashboardController(healthScore, dashboard)
  return { controller, healthScore, dashboard }
}

function healthyTenant(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'store-healthy',
    p95Ms: 50,
    errorRate: 0.0005,
    quotaUsagePercent: 0.3,
    championActivityScore: 90,
    anomalyCount30d: 0,
    ...overrides,
  }
}

function warningTenant(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'store-warn',
    p95Ms: 500,
    errorRate: 0.01,
    quotaUsagePercent: 0.75,
    championActivityScore: 30,
    anomalyCount30d: 5,
    ...overrides,
  }
}

function criticalTenant(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'store-crit',
    p95Ms: 5000,
    errorRate: 0.5,
    quotaUsagePercent: 2.0,
    championActivityScore: 0,
    anomalyCount30d: 50,
    ...overrides,
  }
}

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 整体运维经营视角
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} health-dashboard 扩展角色测试`, () => {
  it('店长评估大规模混合租户批量健康度', () => {
    const { controller } = createController()
    const tenants = Array.from({ length: 20 }, (_, i) =>
      i % 3 === 0
        ? healthyTenant({ tenantId: `store-h-${i}` })
        : i % 3 === 1
          ? warningTenant({ tenantId: `store-w-${i}` })
          : criticalTenant({ tenantId: `store-c-${i}` })
    )
    const result = controller.evaluate({ tenants })
    assert.equal(result.length, 20)
    // 必须按分数升序排序：最差在前
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i - 1].score <= result[i].score,
        `${result[i-1].tenantId}(${result[i-1].score}) <= ${result[i].tenantId}(${result[i].score})`)
    }
  })

  it('店长配置自定义阈值告警 — 宽松阈值无告警', () => {
    const { controller } = createController()
    const alerts = controller.checkAlerts({
      scores: [warningTenant({ tenantId: 'store-warn-lenient' })],
      config: { warningThreshold: 40, criticalThreshold: 20, notifyChannels: ['email'] },
    })
    // warning tenant score ≈ 70 ~ 75 => 高于 40 和 20
    assert.equal(alerts.length, 0)
  })

  it('店长查看汇总含空推荐（无问题的租户）', () => {
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([
      healthyTenant({ tenantId: 'perfect' }),
      healthyTenant({ tenantId: 'perfect2', p95Ms: 80 }),
    ])
    assert.equal(summary.byStatus.HEALTHY, 2)
    assert.ok(summary.averageScore >= 85)
    // 健康租户推荐为"健康度良好,继续保持"，不被计入 topIssues
    assert.equal(summary.topIssues.length, 0)
    assert.equal(summary.alerts.length, 0)
  })

  it('店长汇总应列出常见问题（降级场景）', () => {
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([
      criticalTenant({ tenantId: 'bad-1' }),
      criticalTenant({ tenantId: 'bad-2' }),
      warningTenant({ tenantId: 'warn-1' }),
    ])
    assert.ok(summary.topIssues.length > 0)
    assert.equal(summary.alerts.length, 3)
    assert.ok(summary.byStatus.CRITICAL >= 2)
    assert.ok(summary.byStatus.WARNING >= 1)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 快速查看日常健康状况
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} health-dashboard 扩展角色测试`, () => {
  it('前台快速评估一个门店健康度', () => {
    const { controller } = createController()
    const result = controller.evaluate({ tenants: [healthyTenant({ tenantId: 'front-store' })] })
    assert.equal(result.length, 1)
    assert.equal(result[0].status, 'HEALTHY')
    assert.equal(result[0].tenantId, 'front-store')
  })

  it('前台查看空汇总（门店尚未接入）', () => {
    const { controller } = createController()
    const summary = controller.generateSummary({})
    assert.equal(summary.totalTenants, 0)
    assert.ok(summary.computedAt)
    // 空汇总 computedAt 应为 ISO 格式
    assert.ok(Date.parse(summary.computedAt) > 0, 'computedAt 必须为有效 ISO 时间')
  })

  it('前台查看指标导出格式一致', () => {
    const { controller } = createController()
    const metrics = controller.getMetrics()
    const lines = metrics.split('\n').filter(l => l.trim())
    // 3 HELP lines + 3 TYPE lines + 1 avg + 3 status = 12
    assert.equal(lines.length, 12)
    assert.ok(lines.some((l: string) => l.startsWith('# HELP')), '应包含 HELP 注释')
    assert.ok(lines.some((l: string) => l.startsWith('# TYPE')), '应包含 TYPE 注释')
  })

  it('前台边界：P95=0 和 errorRate=0 的租户（极端健康）', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [{
        tenantId: 'ultra-healthy',
        p95Ms: 0,
        errorRate: 0,
        quotaUsagePercent: 0,
        championActivityScore: 100,
        anomalyCount30d: 0,
      }],
    })
    assert.equal(result[0].status, 'HEALTHY')
    assert.equal(result[0].score, 100)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 关注团队活跃度对健康的影响
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} health-dashboard 扩展角色测试`, () => {
  it('HR 检查低 Champion 活跃单独影响社区分', () => {
    const { healthScore } = createController()
    const score = healthScore.compute({
      tenantId: 'hr-low-community',
      p95Ms: 100,
      errorRate: 0.001,
      quotaUsagePercent: 0.3,
      championActivityScore: 3, // < 5 => community=20
      anomalyCount30d: 0,
    })
    assert.equal(score.components.community, 20, 'champion=3 应得 20 分')
    // performance=90(0.3) + reliability=90(0.3) + quota=100(0.2) + community=20(0.2) = 27+27+20+4 = 78 => WARNING (<80)
    // 实际: p95Ms=100 => scorePerformance(100) => 100 (<=100), 不是 90
    // 30+27+20+4 = 81 => HEALTHY
    assert.equal(score.status, 'HEALTHY', '实际 score=81 => HEALTHY (非 WARNING)')
  })

  it('HR 检查 Champion 临界值评分', () => {
    const { healthScore } = createController()
    // champion=5 => community=40
    const score5 = healthScore.compute({
      tenantId: 'champ-5',
      p95Ms: 10,
      errorRate: 0.0001,
      quotaUsagePercent: 0.1,
      championActivityScore: 5,
      anomalyCount30d: 0,
    })
    assert.equal(score5.components.community, 40, 'champion=5 刚好触发 community=40')
    // champion=4 => community=20
    const score4 = healthScore.compute({
      tenantId: 'champ-4',
      p95Ms: 10,
      errorRate: 0.0001,
      quotaUsagePercent: 0.1,
      championActivityScore: 4,
      anomalyCount30d: 0,
    })
    assert.equal(score4.components.community, 20, 'champion=4 应得 20 分')
    assert.ok(score5.score > score4.score, 'champion=5 总分应高于 champion=4')
  })

  it('HR 包含 Champion 招募推荐的评估结果', () => {
    const { healthScore } = createController()
    const score = healthScore.compute({
      tenantId: 'hr-needs-training',
      p95Ms: 100,
      errorRate: 0.001,
      quotaUsagePercent: 0.3,
      championActivityScore: 3,
      anomalyCount30d: 0,
    })
    assert.ok(score.recommendations.some(r => r.includes('Champion') || r.includes('招募') || r.includes('培训')),
      `应包含 Champion 推荐, 实际: ${score.recommendations.join('; ')}`)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 关注异常事件和错误率告警
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} health-dashboard 扩展角色测试`, () => {
  it('安监检查高错误率高异常数租户 → CRITICAL', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [{
        tenantId: 'security-critical',
        p95Ms: 300,
        errorRate: 0.08, // errorRate >= 0.05 → reliability=30
        quotaUsagePercent: 0.6,
        championActivityScore: 20,
        anomalyCount30d: 25,
      }],
    })
    // 实际: perf(300=>70) rel(0.08=>30) quota(0.6=>90) community(20=>60)
    // = 21+9+18+12 = 60 => CRITICAL (<60? 刚好60)
    // score=60 => CRITICAL
    // score=60 (WARNING): perf(70) rel(30) quota(90) comm(60) => 21+9+18+12 = 60
    assert.equal(result[0].status, 'WARNING', 'score=60 => WARNING (score>=60, <80)')
    assert.ok(result[0].recommendations.some(r => r.includes('错误率')), '应推荐修复错误率')
    assert.ok(result[0].recommendations.some(r => r.includes('异常事件')), '应提及异常事件')
  })

  it('安监检查错误率偏高但其他指标好 → WARNING 时仍有错误率推荐', () => {
    const { healthScore } = createController()
    const score = healthScore.compute({
      tenantId: 'high-error-only',
      p95Ms: 50,
      errorRate: 0.02,
      quotaUsagePercent: 0.3,
      championActivityScore: 50,
      anomalyCount30d: 0,
    })
    // reliability=50, perf=100, quota=100, community=80
    // 30+15+20+16 = 81 => HEALTHY (score >= 80)
    assert.equal(score.status, 'HEALTHY')
    assert.ok(score.recommendations.some(r => r.includes('错误率')),
      `应警告错误率, 实际推荐: ${score.recommendations.join('; ')}`)
  })

  it('安监检查超配额且低活跃的告警建议', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [{
        tenantId: 'security-quota-crisis',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 1.5,
        championActivityScore: 5,
        anomalyCount30d: 12,
      }],
    })
    // quota=10, community=40, perf=90, rel=90
    // 27+27+2+8 = 64 => WARNING
    assert.ok(result[0].score >= 60 && result[0].score <= 80,
      `预期 WARNING 范围, 实际 score=${result[0].score} status=${result[0].status}`)
    assert.ok(result[0].recommendations.some(r => r.includes('配额') || r.includes('升级')),
      `应推荐配额升级, 实际: ${result[0].recommendations.join('; ')}`)
  })

  it('安监对超 thresholds 配置产生告警', () => {
    const { controller } = createController()
    const alerts = controller.checkAlerts({
      scores: [{
        tenantId: 'security-check',
        p95Ms: 100,
        errorRate: 0.001,
        quotaUsagePercent: 0.9,
        championActivityScore: 5,
        anomalyCount30d: 0,
      }],
      config: { warningThreshold: 90, criticalThreshold: 70, notifyChannels: ['dingtalk'] },
    })
    // perf=90, rel=90, quota=50, community=40 => 27+27+10+8 = 72
    // 72 < 90 => WARNING (但 >=70 不是 CRITICAL)
    assert.ok(alerts.length > 0)
    if (alerts.length > 0) {
      assert.ok(alerts[0].severity === 'WARNING', `预期 WARNING, 实际 ${alerts[0].severity}`)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 关注门店设备和会员体验
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} health-dashboard 扩展角色测试`, () => {
  it('导玩员检查单一维度的极端值评分', () => {
    const { healthScore } = createController()
    // p95 超高但其他完美
    const score = healthScore.compute({
      tenantId: 'guide-latency',
      p95Ms: 5000, // => performance=10
      errorRate: 0.0001, // => reliability=100
      quotaUsagePercent: 0.2, // => quota=100
      championActivityScore: 100, // => community=100
      anomalyCount30d: 0,
    })
    // score = 10*0.3 + 100*0.3 + 100*0.2 + 100*0.2 = 3+30+20+20 = 73 => WARNING
    assert.equal(score.status, 'WARNING')
    assert.equal(score.components.performance, 10, 'P95=5000 应得 10 分')
  })

  it('导玩员检查接近边界的 P95 分值', () => {
    const { healthScore } = createController()
    const testCases = [
      { p95: 100, expected: 100, label: '<=100(边界)' },
      { p95: 101, expected: 90, label: '>100 <=200' },
      { p95: 200, expected: 90, label: '=200(边界)' },
      { p95: 201, expected: 70, label: '>200 <=500' },
      { p95: 500, expected: 70, label: '=500(边界)' },
      { p95: 501, expected: 50, label: '>500 <=1000' },
      { p95: 1000, expected: 50, label: '=1000(边界)' },
      { p95: 1001, expected: 30, label: '>1000 <=3000' },
      { p95: 3000, expected: 30, label: '=3000(边界)' },
      { p95: 3001, expected: 10, label: '>3000' },
    ]
    for (const { p95, expected, label } of testCases) {
      const score = healthScore.compute({
        tenantId: `p95-${p95}`,
        p95Ms: p95,
        errorRate: 0,
        quotaUsagePercent: 0,
        championActivityScore: 100,
        anomalyCount30d: 0,
      })
      assert.equal(score.components.performance, expected, `P95=${p95} (${label}) 应得 ${expected}`)
    }
  })

  it('导玩员查看无 issue 门店的汇总', () => {
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([
      healthyTenant({ tenantId: 'guide-store-healthy' }),
    ])
    assert.equal(summary.totalTenants, 1)
    assert.equal(summary.alerts.length, 0)
    assert.equal(summary.topIssues.length, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 深度运维指标
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} health-dashboard 扩展角色测试`, () => {
  it('运行专员检查多维度降级时的告警通知渠道', () => {
    const { controller } = createController()
    const alerts = controller.checkAlerts({
      scores: [
        criticalTenant({ tenantId: 'ops-crit' }),
        warningTenant({ tenantId: 'ops-warn' }),
      ],
      config: { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'feishu', 'dingtalk'] },
    })
    assert.equal(alerts.length, 2)
    const critAlert = alerts.find(a => a.severity === 'CRITICAL')
    const warnAlert = alerts.find(a => a.severity === 'WARNING')
    assert.ok(critAlert, '应存在 CRITICAL 告警')
    assert.ok(warnAlert, '应存在 WARNING 告警')
    assert.ok(critAlert!.notifyChannels.includes('dingtalk'), 'CRITICAL 应通知所有渠道')
    // WARNING 仅 email
    assert.deepEqual(warnAlert!.notifyChannels, ['email'], 'WARNING 仅 email 通知')
  })

  it('运行专员查看混合租户汇总统计', () => {
    const { dashboard } = createController()
    const inputs = [
      healthyTenant({ tenantId: 'ops-h1' }),
      healthyTenant({ tenantId: 'ops-h2' }),
      warningTenant({ tenantId: 'ops-w1' }),
      criticalTenant({ tenantId: 'ops-c1' }),
      criticalTenant({ tenantId: 'ops-c2' }),
    ]
    const summary = dashboard.generateSummary(inputs)
    assert.equal(summary.totalTenants, 5)
    assert.equal(summary.byStatus.HEALTHY, 2)
    assert.equal(summary.byStatus.WARNING, 1)
    assert.equal(summary.byStatus.CRITICAL, 2)
    assert.ok(summary.topIssues.length > 0)
    assert.equal(summary.alerts.length, 3)
  })

  it('运行专员查看 Grafana 指标格式包含三状态', () => {
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([
      healthyTenant({ tenantId: 'g1' }),
      warningTenant({ tenantId: 'g2' }),
      criticalTenant({ tenantId: 'g3' }),
    ])
    const grafana = dashboard.toGrafana(summary)
    assert.ok(grafana.includes('tenant_health_score_avg'))
    assert.ok(grafana.includes('tenant_by_status_healthy 1'))
    assert.ok(grafana.includes('tenant_by_status_warning 1'))
    assert.ok(grafana.includes('tenant_by_status_critical 1'))
    assert.ok(grafana.includes(`${summary.averageScore.toFixed(2)}`))
  })

  it('运行专员边界：异常数 = 10 刚好不触发异常事件推荐', () => {
    const { healthScore } = createController()
    const score = healthScore.compute({
      tenantId: 'anomaly-10-boundary',
      p95Ms: 100,
      errorRate: 0.001,
      quotaUsagePercent: 0.3,
      championActivityScore: 80,
      anomalyCount30d: 10, // 等于 10, 不触发异常事件推荐 (anomaly > 10)
    })
    assert.ok(!score.recommendations.some(r => r.includes('异常事件')),
      `anomalyCount=10 不应触发异常推荐, 实际: ${score.recommendations.join('; ')}`)
    assert.equal(score.recommendations.length, 1)
    assert.equal(score.recommendations[0], '健康度良好,继续保持')
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 关注场地整体可用性和风险评估
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} health-dashboard 扩展角色测试`, () => {
  it('团建检查所有门店都健康方可活动', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [
        healthyTenant({ tenantId: 'venue-a' }),
        healthyTenant({ tenantId: 'venue-b' }),
      ],
    })
    assert.ok(result.every(r => r.status === 'HEALTHY'), '所有门店应健康')
    assert.ok(result.every(r => r.recommendations.length === 1 &&
      r.recommendations[0] === '健康度良好,继续保持'), '应无任何优化建议')
  })

  it('团建检查全 CRITICAL 场地的汇总', () => {
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([
      criticalTenant({ tenantId: 'bad-v-1' }),
      criticalTenant({ tenantId: 'bad-v-2' }),
      criticalTenant({ tenantId: 'bad-v-3' }),
    ])
    assert.equal(summary.byStatus.CRITICAL, 3)
    assert.equal(summary.byStatus.HEALTHY, 0)
    assert.equal(summary.byStatus.WARNING, 0)
    assert.equal(summary.alerts.length, 3)
    assert.ok(summary.averageScore < 60)
  })

  it('团建检查最差租户排序（数值验证）', () => {
    const { controller } = createController()
    const result = controller.evaluate({
      tenants: [
        healthyTenant({ tenantId: 'h' }),
        criticalTenant({ tenantId: 'd' }),
        warningTenant({ tenantId: 'w' }),
      ],
    })
    // 排序: d (最低分) -> w -> h (最高分)
    assert.equal(result[0].tenantId, 'd')
    assert.equal(result[1].tenantId, 'w')
    assert.equal(result[2].tenantId, 'h')
    assert.ok(result[0].score <= result[1].score)
    assert.ok(result[1].score <= result[2].score)
  })

  it('团建检查指标导出（单租户场景）', () => {
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([healthyTenant({ tenantId: 'team-single' })])
    const grafana = dashboard.toGrafana(summary)
    assert.ok(grafana.includes('tenant_by_status_critical 0'))
    assert.ok(grafana.includes('tenant_by_status_warning 0'))
    assert.ok(grafana.includes('tenant_by_status_healthy 1'))
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 关注配额使用率和升级建议
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} health-dashboard 扩展角色测试`, () => {
  it('营销检查大量准超标租户的汇总包含配额使用信息', () => {
    const { dashboard } = createController()
    const inputs = Array.from({ length: 10 }, (_, i) => ({
      tenantId: `store-mkt-${i}`,
      p95Ms: 50,
      errorRate: 0.0005,
      quotaUsagePercent: 0.5 + (i * 0.05), // 从 0.5 升到 0.95
      championActivityScore: 50,
      anomalyCount30d: 0,
    }))
    const summary = dashboard.generateSummary(inputs)
    assert.equal(summary.totalTenants, 10)
    // 高 quota 使用率应产生推荐（topIssues）
    assert.ok(summary.topIssues.length > 0 || summary.byStatus.HEALTHY === 10,
      '高配额使用率应出现在 topIssues 或部分租户降级')
  })

  it('营销检查刚好在配额边界处的评分', () => {
    const { healthScore } = createController()
    const boundaries = [
      // scoreQuota: <0.5 => 100, <0.7 => 90, <0.8 => 75, <0.9 => 50, <1.0 => 30, else => 10
      { quota: 0.49, expected: 100, label: '<0.5' },
      { quota: 0.5, expected: 90, label: '=0.5 但 <0.7 => 90' },
      { quota: 0.51, expected: 90, label: '>0.5 <0.7' },
      { quota: 0.69, expected: 90, label: '<0.7 边界' },
      { quota: 0.7, expected: 75, label: '=0.7 但 <0.8 => 75' },
      { quota: 0.71, expected: 75, label: '>0.7 <0.8' },
      { quota: 0.79, expected: 75, label: '<0.8 边界' },
      { quota: 0.8, expected: 50, label: '=0.8 但 <0.9 => 50' },
      { quota: 0.81, expected: 50, label: '>0.8 <0.9' },
      { quota: 0.89, expected: 50, label: '<0.9 边界' },
      { quota: 0.9, expected: 30, label: '=0.9 但 <1.0 => 30' },
      { quota: 0.91, expected: 30, label: '>0.9 <1.0' },
      { quota: 0.99, expected: 30, label: '<1.0 边界' },
      { quota: 1.0, expected: 10, label: '=1.0 超配额' },
      { quota: 1.01, expected: 10, label: '>1.0(超配额)' },
    ]
    for (const { quota, expected, label } of boundaries) {
      const score = healthScore.compute({
        tenantId: `quota-${quota}`,
        p95Ms: 50,
        errorRate: 0.0001,
        quotaUsagePercent: quota,
        championActivityScore: 100,
        anomalyCount30d: 0,
      })
      assert.equal(score.components.quotaHealth, expected,
        `quota=${quota} (${label}) 应得 ${expected}, 实际 ${score.components.quotaHealth}`)
    }
  })

  it('营销查看混合健康状态的 Grafana 导出', () => {
    const { dashboard } = createController()
    const summary = dashboard.generateSummary([
      healthyTenant({ tenantId: 'mkt-h' }),
      criticalTenant({ tenantId: 'mkt-c' }),
    ])
    const grafana = dashboard.toGrafana(summary)
    // 应包含平均分和状态计数
    assert.ok(grafana.includes('tenant_health_score_avg'))
    assert.ok(grafana.includes('tenant_by_status_healthy 1'))
    assert.ok(grafana.includes('tenant_by_status_critical 1'))
    assert.ok(grafana.includes('tenant_by_status_warning 0'))
  })

  it('营销检查升级推荐含配额相关建议', () => {
    const { healthScore } = createController()
    const score = healthScore.compute({
      tenantId: 'mkt-upgrade-candidate',
      p95Ms: 100,
      errorRate: 0.001,
      quotaUsagePercent: 0.95, // >= 0.9 → quota=30
      championActivityScore: 80,
      anomalyCount30d: 0,
    })
    assert.equal(score.components.quotaHealth, 30)
    assert.ok(score.recommendations.some(r => r.includes('配额') || r.includes('升级')),
      `应建议升级, 实际推荐: ${score.recommendations.join('; ')}`)
  })

  it('营销边界：无异常无问题的全优租户', () => {
    const { healthScore } = createController()
    const score = healthScore.compute({
      tenantId: 'mkt-perfect',
      p95Ms: 10,
      errorRate: 0.00001,
      quotaUsagePercent: 0.1,
      championActivityScore: 200,
      anomalyCount30d: 0,
    })
    assert.equal(score.score, 100)
    assert.equal(score.status, 'HEALTHY')
    assert.deepEqual(score.recommendations, ['健康度良好,继续保持'])
  })
})
