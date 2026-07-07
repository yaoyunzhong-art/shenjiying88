/**
 * health-dashboard.service.spec.ts — 健康度仪表板纯函数式测试
 * 不 import 生产 Service，纯内联逻辑
 */
import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'

// ─── 枚举 + 类型定义 ──────────────────────────────────────────────

type TenantStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL'

interface TenantHealthInput {
  tenantId: string
  p95Ms: number
  errorRate: number
  quotaUsagePercent: number
  championActivityScore: number
  anomalyCount30d: number
}

interface TenantHealthScore {
  tenantId: string
  score: number
  components: { performance: number; reliability: number; quotaHealth: number; community: number }
  status: TenantStatus
  recommendations: string[]
  computedAt: string
}

interface DashboardSummary {
  totalTenants: number
  byStatus: Record<'HEALTHY' | 'WARNING' | 'CRITICAL', number>
  averageScore: number
  topIssues: Array<{ issue: string; count: number }>
  alerts: Array<{ tenantId: string; severity: string; message: string }>
  computedAt: string
}

interface AlertConfig {
  warningThreshold: number
  criticalThreshold: number
  notifyChannels: Array<'email' | 'feishu' | 'dingtalk'>
}

// ─── mock 数据工厂 ──────────────────────────────────────────────

function makeInput(overrides: Partial<TenantHealthInput> = {}): TenantHealthInput {
  return {
    tenantId: `tenant-${Math.random().toString(36).slice(2, 6)}`,
    p95Ms: 150,
    errorRate: 0.002,
    quotaUsagePercent: 0.6,
    championActivityScore: 60,
    anomalyCount30d: 3,
    ...overrides,
  }
}

// ─── 内联纯函数 ─────────────────────────────────────────────────

function scorePerformance(p95Ms: number): number {
  if (p95Ms <= 100) return 100
  if (p95Ms <= 200) return 90
  if (p95Ms <= 500) return 70
  if (p95Ms <= 1000) return 50
  if (p95Ms <= 3000) return 30
  return 10
}

function scoreReliability(errorRate: number): number {
  if (errorRate < 0.001) return 100
  if (errorRate < 0.005) return 90
  if (errorRate < 0.01) return 75
  if (errorRate < 0.05) return 50
  if (errorRate < 0.1) return 30
  return 10
}

function scoreQuota(usagePercent: number): number {
  if (usagePercent < 0.5) return 100
  if (usagePercent < 0.7) return 90
  if (usagePercent < 0.8) return 75
  if (usagePercent < 0.9) return 50
  if (usagePercent < 1.0) return 30
  return 10
}

function scoreCommunity(championActivityScore: number): number {
  if (championActivityScore >= 100) return 100
  if (championActivityScore >= 50) return 80
  if (championActivityScore >= 20) return 60
  if (championActivityScore >= 5) return 40
  return 20
}

function computeHealthScore(input: TenantHealthInput): TenantHealthScore {
  const performance = scorePerformance(input.p95Ms)
  const reliability = scoreReliability(input.errorRate)
  const quotaHealth = scoreQuota(input.quotaUsagePercent)
  const community = scoreCommunity(input.championActivityScore)

  const score = Math.round(performance * 0.3 + reliability * 0.3 + quotaHealth * 0.2 + community * 0.2)

  const status: TenantStatus = score >= 80 ? 'HEALTHY' : score >= 60 ? 'WARNING' : 'CRITICAL'

  const recommendations: string[] = []
  if (performance < 70) recommendations.push(`性能不达标: P95=${input.p95Ms}ms`)
  if (reliability < 70) recommendations.push(`错误率偏高: ${(input.errorRate * 100).toFixed(2)}%`)
  if (quotaHealth < 70) recommendations.push('配额使用率高,考虑升级套餐')
  if (community < 60) recommendations.push(`Champion 活跃度低: score=${input.championActivityScore}`)
  if (input.anomalyCount30d > 10) recommendations.push(`30天内异常事件 ${input.anomalyCount30d} 次`)
  if (recommendations.length === 0) recommendations.push('健康度良好,继续保持')

  return {
    tenantId: input.tenantId,
    score,
    components: { performance, reliability, quotaHealth, community },
    status,
    recommendations,
    computedAt: new Date().toISOString(),
  }
}

function computeBatch(inputs: TenantHealthInput[]): TenantHealthScore[] {
  return inputs.map(i => computeHealthScore(i)).sort((a, b) => a.score - b.score)
}

function generateSummary(scores: TenantHealthScore[]): DashboardSummary {
  const byStatus = { HEALTHY: 0, WARNING: 0, CRITICAL: 0 }
  let totalScore = 0
  for (const s of scores) {
    byStatus[s.status]++
    totalScore += s.score
  }
  const averageScore = scores.length > 0 ? totalScore / scores.length : 0

  const issueCounts = new Map<string, number>()
  for (const s of scores) {
    for (const rec of s.recommendations) {
      if (rec === '健康度良好,继续保持') continue
      const key = rec.slice(0, 20)
      issueCounts.set(key, (issueCounts.get(key) ?? 0) + 1)
    }
  }
  const topIssues = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count }))

  const alerts = scores
    .filter(s => s.status !== 'HEALTHY')
    .map(s => ({
      tenantId: s.tenantId,
      severity: s.status,
      message: `${s.tenantId} 健康度 ${s.score} (${s.status})`,
    }))

  return {
    totalTenants: scores.length,
    byStatus,
    averageScore,
    topIssues,
    alerts,
    computedAt: new Date().toISOString(),
  }
}

function checkAlerts(
  scores: TenantHealthScore[],
  config: AlertConfig,
): Array<{ tenantId: string; severity: string; message: string; notifyChannels: string[] }> {
  const alerts: Array<{ tenantId: string; severity: string; message: string; notifyChannels: string[] }> = []
  for (const s of scores) {
    if (s.score < config.criticalThreshold) {
      alerts.push({
        tenantId: s.tenantId,
        severity: 'CRITICAL',
        message: `租户 ${s.tenantId} 健康度 ${s.score} < ${config.criticalThreshold}`,
        notifyChannels: config.notifyChannels,
      })
    } else if (s.score < config.warningThreshold) {
      alerts.push({
        tenantId: s.tenantId,
        severity: 'WARNING',
        message: `租户 ${s.tenantId} 健康度 ${s.score} < ${config.warningThreshold}`,
        notifyChannels: ['email'],
      })
    }
  }
  return alerts
}

function toGrafana(summary: DashboardSummary): string {
  const lines: string[] = []
  lines.push('# HELP tenant_health_score_avg Average tenant health score')
  lines.push('# TYPE tenant_health_score_avg gauge')
  lines.push(`tenant_health_score_avg ${summary.averageScore.toFixed(2)}`)

  for (const status of ['HEALTHY', 'WARNING', 'CRITICAL'] as const) {
    lines.push(`# HELP tenant_by_status_${status.toLowerCase()} Tenants by status`)
    lines.push(`# TYPE tenant_by_status_${status.toLowerCase()} gauge`)
    lines.push(`tenant_by_status_${status.toLowerCase()} ${summary.byStatus[status]}`)
  }
  return lines.join('\n')
}

// ─── 测试 ─────────────────────────────────────────────────────

describe('health-dashboard.service.spec: scorePerformance', () => {
  it('[1] P95 ≤ 100 → 100', () => {
    assert.equal(scorePerformance(50), 100)
    assert.equal(scorePerformance(100), 100)
  })

  it('[2] P95 101-200 → 90', () => {
    assert.equal(scorePerformance(150), 90)
    assert.equal(scorePerformance(200), 90)
  })

  it('[3] P95 201-500 → 70', () => {
    assert.equal(scorePerformance(300), 70)
    assert.equal(scorePerformance(500), 70)
  })

  it('[4] P95 501-1000 → 50', () => {
    assert.equal(scorePerformance(750), 50)
  })

  it('[5] P95 1001-3000 → 30', () => {
    assert.equal(scorePerformance(2000), 30)
  })

  it('[6] P95 > 3000 → 10', () => {
    assert.equal(scorePerformance(5000), 10)
  })
})

describe('health-dashboard.service.spec: scoreReliability', () => {
  it('[7] errorRate < 0.001 → 100', () => {
    assert.equal(scoreReliability(0.0005), 100)
  })

  it('[8] errorRate 介于 0.001-0.005 → 90', () => {
    assert.equal(scoreReliability(0.003), 90)
  })

  it('[9] errorRate ≥ 0.005 → 75', () => {
    assert.equal(scoreReliability(0.008), 75)
  })

  it('[10] errorRate ≥ 0.05 → 30 (因为 0.05 < 0.1)', () => {
    assert.equal(scoreReliability(0.05), 30)
  })

  it('[11] errorRate 介于 0.05-0.1 → 30', () => {
    assert.equal(scoreReliability(0.08), 30)
  })

  it('[12] errorRate ≥ 0.1 → 10', () => {
    assert.equal(scoreReliability(0.1), 10)
    assert.equal(scoreReliability(0.2), 10)
  })
})

describe('health-dashboard.service.spec: scoreQuota', () => {
  it('[13] usage < 50% → 100', () => assert.equal(scoreQuota(0.3), 100))
  it('[14] usage < 70% → 90', () => assert.equal(scoreQuota(0.6), 90))
  it('[15] usage < 80% → 75', () => assert.equal(scoreQuota(0.75), 75))
  it('[16] usage < 90% → 50', () => assert.equal(scoreQuota(0.85), 50))
  it('[17] usage < 100% → 30', () => assert.equal(scoreQuota(0.95), 30))
  it('[18] usage ≥ 100% → 10', () => assert.equal(scoreQuota(1.0), 10))
  it('[19] usage > 100% → 10', () => assert.equal(scoreQuota(1.2), 10))
})

describe('health-dashboard.service.spec: scoreCommunity', () => {
  it('[20] score ≥ 100 → 100', () => assert.equal(scoreCommunity(120), 100))
  it('[21] score ≥ 50 → 80', () => assert.equal(scoreCommunity(75), 80))
  it('[22] score ≥ 20 → 60', () => assert.equal(scoreCommunity(30), 60))
  it('[23] score ≥ 5 → 40', () => assert.equal(scoreCommunity(10), 40))
  it('[24] score < 5 → 20', () => assert.equal(scoreCommunity(3), 20))
})

describe('health-dashboard.service.spec: computeHealthScore', () => {
  it('[25] 正常输入 → HEALTHY 90+', () => {
    const result = computeHealthScore(makeInput({ p95Ms: 50, errorRate: 0.0005, quotaUsagePercent: 0.3, championActivityScore: 100 }))
    assert.equal(result.status, 'HEALTHY')
    assert.ok(result.score >= 90)
    assert.ok(result.recommendations.includes('健康度良好,继续保持'))
  })

  it('[26] 性能差 → WARNING 带性能建议', () => {
    const result = computeHealthScore(makeInput({ p95Ms: 3000, errorRate: 0.0005, quotaUsagePercent: 0.3, championActivityScore: 100 }))
    assert.equal(result.status, 'WARNING')
    assert.ok(result.recommendations.some(r => r.includes('P95')))
  })

  it('[27] 全指标差 → CRITICAL 60以下', () => {
    const result = computeHealthScore(makeInput({ p95Ms: 5000, errorRate: 0.2, quotaUsagePercent: 1.5, championActivityScore: 0 }))
    assert.equal(result.status, 'CRITICAL')
    assert.ok(result.score < 60)
  })

  it('[28] anomalyCount30d > 10 → 稳定性建议', () => {
    const result = computeHealthScore(makeInput({ p95Ms: 50, errorRate: 0.0005, quotaUsagePercent: 0.3, championActivityScore: 100, anomalyCount30d: 15 }))
    assert.ok(result.recommendations.some(r => r.includes('异常事件')))
  })

  it('[29] computedAt 是有效 ISO', () => {
    const result = computeHealthScore(makeInput())
    assert.ok(!Number.isNaN(Date.parse(result.computedAt)))
  })

  it('[30] components 字段完整', () => {
    const result = computeHealthScore(makeInput())
    assert.ok(typeof result.components.performance === 'number')
    assert.ok(typeof result.components.reliability === 'number')
    assert.ok(typeof result.components.quotaHealth === 'number')
    assert.ok(typeof result.components.community === 'number')
  })
})

describe('health-dashboard.service.spec: computeBatch', () => {
  it('[31] 批量排序: 分数升序 (差在前)', () => {
    const inputs = [
      makeInput({ tenantId: 'a', p95Ms: 5000, errorRate: 0.2 }),
      makeInput({ tenantId: 'b', p95Ms: 50, errorRate: 0.0005 }),
    ]
    const results = computeBatch(inputs)
    assert.equal(results[0].score, Math.min(results[0].score, results[1].score))
    assert.equal(results[0].tenantId, 'a')
  })

  it('[32] 空列表返回空', () => {
    assert.equal(computeBatch([]).length, 0)
  })
})

describe('health-dashboard.service.spec: generateSummary', () => {
  it('[33] 汇总统计正确', () => {
    const scores = [
      computeHealthScore(makeInput({ tenantId: 't1', p95Ms: 50, errorRate: 0.0005 })),
      computeHealthScore(makeInput({ tenantId: 't2', p95Ms: 3000, errorRate: 0.01 })),
    ]
    const summary = generateSummary(scores)
    assert.equal(summary.totalTenants, 2)
    assert.equal(summary.byStatus.HEALTHY + summary.byStatus.WARNING + summary.byStatus.CRITICAL, 2)
    assert.ok(summary.averageScore > 0)
  })

  it('[34] 空输入 → 平局分0', () => {
    const summary = generateSummary([])
    assert.equal(summary.totalTenants, 0)
    assert.equal(summary.averageScore, 0)
  })

  it('[35] 告警列表: 非 HEALTHY 生成告警', () => {
    const scores = [
      computeHealthScore(makeInput({ tenantId: 't1', p95Ms: 50 })),
      computeHealthScore(makeInput({ tenantId: 't2', p95Ms: 5000 })),
    ]
    const summary = generateSummary(scores)
    assert.ok(summary.alerts.length >= 1)
    assert.ok(summary.alerts.some(a => a.tenantId === 't2'))
  })
})

describe('health-dashboard.service.spec: checkAlerts', () => {
  const config: AlertConfig = { warningThreshold: 80, criticalThreshold: 60, notifyChannels: ['email', 'feishu'] }

  it('[36] 健康 → 无告警', () => {
    const score = computeHealthScore(makeInput({ p95Ms: 50, errorRate: 0.0005 }))
    assert.equal(checkAlerts([score], config).length, 0)
  })

  it('[37] WARNING 范围 → WARNING 告警', () => {
    const score = computeHealthScore(makeInput({ p95Ms: 500, errorRate: 0.03 }))
    const alerts = checkAlerts([score], config)
    assert.ok(alerts.length >= 1)
    if (score.score < 80) {
      assert.ok(alerts.some(a => a.severity === 'WARNING' || a.severity === 'CRITICAL'))
    }
  })

  it('[38] CRITICAL 范围 → CRITICAL 告警', () => {
    const score = computeHealthScore(makeInput({ p95Ms: 5000, errorRate: 0.2 }))
    const alerts = checkAlerts([score], config)
    assert.ok(alerts.length >= 1)
    if (score.score < 60) {
      assert.ok(alerts.some(a => a.severity === 'CRITICAL'))
    }
  })
})

describe('health-dashboard.service.spec: toGrafana', () => {
  it('[39] Grafana 格式输出', () => {
    const summary = generateSummary([
      computeHealthScore(makeInput()),
    ])
    const grafana = toGrafana(summary)
    assert.ok(grafana.includes('tenant_health_score_avg'))
    assert.ok(grafana.includes('tenant_by_status_healthy'))
    assert.ok(grafana.includes('tenant_by_status_warning'))
    assert.ok(grafana.includes('tenant_by_status_critical'))
    assert.ok(grafana.includes('# HELP'))
    assert.ok(grafana.includes('# TYPE'))
  })
})
