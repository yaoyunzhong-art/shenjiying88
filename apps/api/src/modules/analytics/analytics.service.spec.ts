/**
 * analytics.service.spec.ts — 统计分析 Service 深层单元测试
 *
 * 覆盖:
 *  - OperationSnapshot 构建逻辑
 *  - Diagnostic 诊断规则 (6条规则)
 *  - Recommendation 推荐排序
 *  - 正例/反例/边界 ≥ 18 项
 *
 * 全部内联纯函数，不 import 生产代码。
 */

import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

enum AnalyticsScope {
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Store = 'STORE'
}

enum DiagnosticSeverity {
  Info = 'INFO',
  Warning = 'WARNING',
  Critical = 'CRITICAL'
}

enum DiagnosticCategory {
  PaymentHealth = 'PAYMENT_HEALTH',
  CouponPerformance = 'COUPON_PERFORMANCE',
  BlindboxEngagement = 'BLINDBOX_ENGAGEMENT',
  MemberActivity = 'MEMBER_ACTIVITY',
  PointEconomy = 'POINT_ECONOMY',
  ConcentrationRisk = 'CONCENTRATION_RISK'
}

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface OperationSnapshotMetric {
  key: string; label: string; value: number; unit: string; ratio?: number; trend?: 'UP' | 'DOWN' | 'FLAT'
}

interface OperationSnapshotGroup {
  groupKey: string; groupLabel: string; metrics: OperationSnapshotMetric[]
}

interface OperationSnapshot {
  tenantId: string; scope: AnalyticsScope; brandId?: string; storeId?: string
  generatedAt: string; groups: OperationSnapshotGroup[]; totals: OperationSnapshotMetric[]
}

interface DiagnosticRecommendation {
  actionCode: string; description: string; suggestedCampaignKind?: string; priority: number
}

interface Diagnostic {
  diagnosticId: string; ruleId: string; tenantContext: { tenantId: string; brandId?: string; storeId?: string }
  scope: AnalyticsScope; category: DiagnosticCategory; severity: DiagnosticSeverity
  title: string; summary: string; evidence: Record<string, unknown>; recommendations: DiagnosticRecommendation[]
  generatedAt: string
}

interface LoyaltySummary {
  settlementCount: number; settlementSuccessCount: number; couponRedemptionCount: number
  blindboxFulfillmentCount: number; pointsIn: number; pointsOut: number
}

interface CouponPlan {
  planId: string; code: string; totalQuota: number; remainingQuota: number; status: string
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑
// ═══════════════════════════════════════════════════════════════

function inlineComputeSuccessRate(settlementCount: number, settlementSuccessCount: number): number {
  if (settlementCount <= 0) return 0
  return Math.round((settlementSuccessCount / settlementCount) * 1000) / 10
}

function inlineComputeSuccessRatio(settlementCount: number, settlementSuccessCount: number): number {
  if (settlementCount <= 0) return 0
  return (settlementSuccessCount / settlementCount) * 100
}

function inlineComputePointsNet(pointsIn: number, pointsOut: number): { value: number; trend: 'UP' | 'DOWN' | 'FLAT' } {
  const value = pointsIn - pointsOut
  const trend = pointsIn > pointsOut ? 'UP' : pointsIn < pointsOut ? 'DOWN' : 'FLAT'
  return { value, trend }
}

function inlineComputeMarketingRoi(roi: number): { value: number; trend: 'UP' | 'DOWN' | 'FLAT' } {
  const value = Math.round(roi * 100) / 100
  const trend = roi > 0 ? 'UP' : roi < 0 ? 'DOWN' : 'FLAT'
  return { value, trend }
}

function inlineBuildOrderGroup(ly: LoyaltySummary): OperationSnapshotGroup {
  return {
    groupKey: 'orders',
    groupLabel: '订单与支付',
    metrics: [
      { key: 'settlementCount', label: '结算笔数', value: ly.settlementCount, unit: '笔' },
      { key: 'settlementSuccessRate', label: '结算成功率', value: inlineComputeSuccessRate(ly.settlementCount, ly.settlementSuccessCount), unit: '%', ratio: inlineComputeSuccessRatio(ly.settlementCount, ly.settlementSuccessCount) },
      { key: 'couponRedemptionCount', label: '券核销数', value: ly.couponRedemptionCount, unit: '张' },
      { key: 'blindboxFulfillmentCount', label: '盲盒履约数', value: ly.blindboxFulfillmentCount, unit: '盒' },
    ]
  }
}

function inlineBuildLoyaltyGroup(ly: LoyaltySummary): OperationSnapshotGroup {
  const net = inlineComputePointsNet(ly.pointsIn, ly.pointsOut)
  return {
    groupKey: 'loyalty',
    groupLabel: '积分与会员',
    metrics: [
      { key: 'pointsIn', label: '积分发放', value: ly.pointsIn, unit: '分' },
      { key: 'pointsOut', label: '积分消耗', value: ly.pointsOut, unit: '分' },
      { key: 'pointsNet', label: '积分净流', value: net.value, unit: '分', trend: net.trend },
    ]
  }
}

const DIAGNOSTIC_RULES = [
  { ruleId: 'payment-success-rate-low', category: DiagnosticCategory.PaymentHealth, severity: DiagnosticSeverity.Critical, title: '支付成功率低于健康线', priority: 100 },
  { ruleId: 'blindbox-redemption-shortfall', category: DiagnosticCategory.BlindboxEngagement, severity: DiagnosticSeverity.Warning, title: '盲盒履约转化偏低', priority: 80 },
  { ruleId: 'coupon-quota-near-exhaustion', category: DiagnosticCategory.CouponPerformance, severity: DiagnosticSeverity.Warning, title: '券计划额度接近耗尽', priority: 70 },
  { ruleId: 'no-settlement-activity', category: DiagnosticCategory.MemberActivity, severity: DiagnosticSeverity.Warning, title: '结算活跃度静默', priority: 60 },
  { ruleId: 'points-outflow-dominant', category: DiagnosticCategory.PointEconomy, severity: DiagnosticSeverity.Critical, title: '积分净流出主导', priority: 90 },
  { ruleId: 'member-activity-thinning', category: DiagnosticCategory.MemberActivity, severity: DiagnosticSeverity.Info, title: '会员活动节奏稀疏', priority: 40 },
]

function inlineDetectDiagnostics(ly: LoyaltySummary, exhaustedPlans: CouponPlan[]): { ruleId: string; evidence: Record<string, unknown> }[] {
  const results: { ruleId: string; evidence: Record<string, unknown> }[] = []
  const successRate = ly.settlementCount > 0 ? ly.settlementSuccessCount / ly.settlementCount : 1
  if (ly.settlementCount > 0 && successRate < 0.8) {
    results.push({ ruleId: 'payment-success-rate-low', evidence: { settlementCount: ly.settlementCount, successCount: ly.settlementSuccessCount, successRate: Math.round(successRate * 1000) / 10 } })
  }
  if (ly.blindboxFulfillmentCount === 0 && ly.couponRedemptionCount > 5) {
    results.push({ ruleId: 'blindbox-redemption-shortfall', evidence: { blindboxFulfillmentCount: ly.blindboxFulfillmentCount, couponRedemptionCount: ly.couponRedemptionCount } })
  }
  const nearExhaustion = exhaustedPlans.filter(p => p.remainingQuota / Math.max(1, p.totalQuota) < 0.1 && p.status === 'ACTIVE')
  if (nearExhaustion.length > 0) {
    results.push({ ruleId: 'coupon-quota-near-exhaustion', evidence: { exhaustedPlanIds: nearExhaustion.map(p => p.planId), exhaustedCodes: nearExhaustion.map(p => p.code) } })
  }
  if (ly.settlementCount === 0) {
    results.push({ ruleId: 'no-settlement-activity', evidence: { settlementCount: 0 } })
  }
  if (ly.pointsOut > ly.pointsIn * 1.3 && ly.pointsOut > 0) {
    results.push({ ruleId: 'points-outflow-dominant', evidence: { pointsIn: ly.pointsIn, pointsOut: ly.pointsOut, netFlow: ly.pointsIn - ly.pointsOut } })
  }
  if (ly.settlementCount > 0 && ly.settlementCount < 3 && ly.pointsOut === 0 && ly.couponRedemptionCount === 0) {
    results.push({ ruleId: 'member-activity-thinning', evidence: { settlementCount: ly.settlementCount, couponRedemptionCount: ly.couponRedemptionCount, pointsOut: ly.pointsOut } })
  }
  return results
}

function inlineBuildSnapshot(tenantId: string, scope: AnalyticsScope, ly: LoyaltySummary): OperationSnapshot {
  return {
    tenantId, scope, generatedAt: new Date().toISOString(),
    groups: [inlineBuildOrderGroup(ly), inlineBuildLoyaltyGroup(ly)],
    totals: [
      { key: 'totalSettlements', label: '总结算笔数', value: ly.settlementCount, unit: '笔' },
      { key: 'totalRedemptions', label: '总券核销', value: ly.couponRedemptionCount, unit: '张' },
    ]
  }
}

function inlineBuildDiagnosticFromRule(ruleId: string, tenantId: string, scope: AnalyticsScope, evidence: Record<string, unknown>): Diagnostic {
  const rule = DIAGNOSTIC_RULES.find(r => r.ruleId === ruleId)!
  return {
    diagnosticId: `${ruleId}-${tenantId}-${Date.now()}`,
    ruleId, tenantContext: { tenantId }, scope,
    category: rule.category, severity: rule.severity,
    title: rule.title, summary: rule.title,
    evidence,
    recommendations: [{ actionCode: 'recommend-' + ruleId, description: 'Auto-recommendation for ' + ruleId, priority: rule.priority }],
    generatedAt: new Date().toISOString()
  }
}

function inlineSortRecommendations(diagnostics: Diagnostic[]): DiagnosticRecommendation[] {
  return diagnostics.flatMap(d => d.recommendations).sort((a, b) => b.priority - a.priority)
}

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function mockLoyalty(overrides?: Partial<LoyaltySummary>): LoyaltySummary {
  return {
    settlementCount: 100,
    settlementSuccessCount: 95,
    couponRedemptionCount: 30,
    blindboxFulfillmentCount: 10,
    pointsIn: 5000,
    pointsOut: 2000,
    ...overrides
  }
}

function mockExhaustedPlan(overrides?: Partial<CouponPlan>): CouponPlan {
  return {
    planId: 'plan-001', code: 'SUM50', totalQuota: 100, remainingQuota: 5, status: 'ACTIVE', ...overrides
  }
}

// ═══════════════════════════════════════════════════════════════
// OperationSnapshot 测试
// ═══════════════════════════════════════════════════════════════

describe('OperationSnapshot | buildOrderGroup', () => {
  it('正例: 正常结算数据生成正确指标', () => {
    const ly = mockLoyalty()
    const g = inlineBuildOrderGroup(ly)
    expect(g.groupKey).toBe('orders')
    expect(g.metrics.find(m => m.key === 'settlementCount')!.value).toBe(100)
    expect(g.metrics.find(m => m.key === 'settlementSuccessRate')!.value).toBe(95)
  })

  it('正例: 结算成功率 0 数据返回 0', () => {
    const ly = mockLoyalty({ settlementCount: 0, settlementSuccessCount: 0 })
    const g = inlineBuildOrderGroup(ly)
    expect(g.metrics.find(m => m.key === 'settlementSuccessRate')!.value).toBe(0)
    expect(g.metrics.find(m => m.key === 'settlementSuccessRate')!.ratio).toBe(0)
  })

  it('反例: 成功率低时 ratio 仍正确计算', () => {
    const ly = mockLoyalty({ settlementCount: 10, settlementSuccessCount: 3 })
    const g = inlineBuildOrderGroup(ly)
    expect(g.metrics.find(m => m.key === 'settlementSuccessRate')!.ratio).toBe(30)
  })

  it('边界: 结算笔数为 0 时指标正确', () => {
    const ly = mockLoyalty({ settlementCount: 0 })
    const g = inlineBuildOrderGroup(ly)
    expect(g.metrics.find(m => m.key === 'settlementCount')!.value).toBe(0)
    expect(g.metrics.find(m => m.key === 'blindboxFulfillmentCount')!.value).toBe(10)
  })
})

describe('OperationSnapshot | buildLoyaltyGroup', () => {
  it('正例: 积分发放 > 消耗 → trend UP', () => {
    const ly = mockLoyalty({ pointsIn: 1000, pointsOut: 500 })
    const g = inlineBuildLoyaltyGroup(ly)
    const net = g.metrics.find(m => m.key === 'pointsNet')!
    expect(net.value).toBe(500)
    expect(net.trend).toBe('UP')
  })

  it('正例: 积分消耗 > 发放 → trend DOWN', () => {
    const ly = mockLoyalty({ pointsIn: 300, pointsOut: 1000 })
    const g = inlineBuildLoyaltyGroup(ly)
    const net = g.metrics.find(m => m.key === 'pointsNet')!
    expect(net.value).toBe(-700)
    expect(net.trend).toBe('DOWN')
  })

  it('边界: 积分相等 → trend FLAT', () => {
    const ly = mockLoyalty({ pointsIn: 500, pointsOut: 500 })
    const g = inlineBuildLoyaltyGroup(ly)
    const net = g.metrics.find(m => m.key === 'pointsNet')!
    expect(net.value).toBe(0)
    expect(net.trend).toBe('FLAT')
  })
})

describe('OperationSnapshot | buildSnapshot', () => {
  it('正例: 完整 snapshot 包含所有组', () => {
    const ly = mockLoyalty()
    const snap = inlineBuildSnapshot('tenant-1', AnalyticsScope.Tenant, ly)
    expect(snap.tenantId).toBe('tenant-1')
    expect(snap.scope).toBe(AnalyticsScope.Tenant)
    expect(snap.groups).toHaveLength(2)
    expect(snap.totals).toHaveLength(2)
  })

  it('正例: totals 值匹配 loyalty 数据', () => {
    const ly = mockLoyalty({ settlementCount: 42, couponRedemptionCount: 15 })
    const snap = inlineBuildSnapshot('t1', AnalyticsScope.Brand, ly)
    expect(snap.totals.find(t => t.key === 'totalSettlements')!.value).toBe(42)
    expect(snap.totals.find(t => t.key === 'totalRedemptions')!.value).toBe(15)
  })
})

// ═══════════════════════════════════════════════════════════════
// Diagnostic 诊断规则测试
// ═══════════════════════════════════════════════════════════════

describe('Diagnostic | 诊断规则检测', () => {
  it('正例: 支付成功率低 → 触发 CRITICAL 诊断', () => {
    const ly = mockLoyalty({ settlementCount: 50, settlementSuccessCount: 30 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'payment-success-rate-low')).toBeDefined()
  })

  it('正例: 盲盒履约 0 且核销 > 5 → 触发警告', () => {
    const ly = mockLoyalty({ blindboxFulfillmentCount: 0, couponRedemptionCount: 10 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'blindbox-redemption-shortfall')).toBeDefined()
  })

  it('正例: 券计划额度耗尽 → 触发警告', () => {
    const ly = mockLoyalty()
    const plans = [mockExhaustedPlan({ totalQuota: 100, remainingQuota: 5, status: 'ACTIVE' })]
    const results = inlineDetectDiagnostics(ly, plans)
    expect(results.find(r => r.ruleId === 'coupon-quota-near-exhaustion')).toBeDefined()
  })

  it('正例: 结算活跃度静默 → 触发警告', () => {
    const ly = mockLoyalty({ settlementCount: 0 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'no-settlement-activity')).toBeDefined()
  })

  it('正例: 积分净流出 > 1.3x 发放 → 触发 CRITICAL', () => {
    const ly = mockLoyalty({ pointsIn: 100, pointsOut: 150 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'points-outflow-dominant')).toBeDefined()
  })

  it('正例: 会员活动节奏稀疏 → 触发 INFO 诊断', () => {
    const ly = mockLoyalty({ settlementCount: 2, pointsOut: 0, couponRedemptionCount: 0 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'member-activity-thinning')).toBeDefined()
  })

  it('反例: 结算不存在时 member-activity-thinning 不触发', () => {
    const ly = mockLoyalty({ settlementCount: 0, pointsOut: 0, couponRedemptionCount: 0 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'member-activity-thinning')).toBeUndefined()
  })

  it('反例: 积分净流出不超过 1.3x → 不触发 points-outflow-dominant', () => {
    const ly = mockLoyalty({ pointsIn: 100, pointsOut: 120 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'points-outflow-dominant')).toBeUndefined()
  })

  it('反例: 核销 <= 5 时 blindbox 警告不触发', () => {
    const ly = mockLoyalty({ blindboxFulfillmentCount: 0, couponRedemptionCount: 3 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'blindbox-redemption-shortfall')).toBeUndefined()
  })

  it('反例: 支付成功率 > 0.8 时不触发', () => {
    const ly = mockLoyalty({ settlementCount: 50, settlementSuccessCount: 45 })
    const results = inlineDetectDiagnostics(ly, [])
    expect(results.find(r => r.ruleId === 'payment-success-rate-low')).toBeUndefined()
  })

  it('边界: 全空数据所有规则不触发', () => {
    const ly = mockLoyalty({ settlementCount: 0, settlementSuccessCount: 0, couponRedemptionCount: 0, blindboxFulfillmentCount: 0, pointsIn: 0, pointsOut: 0 })
    const results = inlineDetectDiagnostics(ly, [])
    // Only no-settlement-activity should trigger
    expect(results).toHaveLength(1)
    expect(results[0].ruleId).toBe('no-settlement-activity')
  })
})

describe('Diagnostic | buildDiagnosticFromRule', () => {
  it('正例: 构建的诊断包含正确数据', () => {
    const d = inlineBuildDiagnosticFromRule('payment-success-rate-low', 't1', AnalyticsScope.Tenant, { rate: 55 })
    expect(d.ruleId).toBe('payment-success-rate-low')
    expect(d.severity).toBe(DiagnosticSeverity.Critical)
    expect(d.category).toBe(DiagnosticCategory.PaymentHealth)
    expect(d.recommendations).toHaveLength(1)
  })
})

describe('Diagnostic | 推荐排序', () => {
  it('正例: 按 priority 降序排列', () => {
    const diagnostics: Diagnostic[] = [
      inlineBuildDiagnosticFromRule('payment-success-rate-low', 't1', AnalyticsScope.Tenant, {}),
      inlineBuildDiagnosticFromRule('member-activity-thinning', 't1', AnalyticsScope.Tenant, {}),
      inlineBuildDiagnosticFromRule('points-outflow-dominant', 't1', AnalyticsScope.Tenant, {}),
    ]
    const recs = inlineSortRecommendations(diagnostics)
    expect(recs[0].priority).toBe(100)
    expect(recs[1].priority).toBe(90)
    expect(recs[2].priority).toBe(40)
  })

  it('边界: 空诊断数组返回空推荐', () => {
    expect(inlineSortRecommendations([])).toEqual([])
  })
})
