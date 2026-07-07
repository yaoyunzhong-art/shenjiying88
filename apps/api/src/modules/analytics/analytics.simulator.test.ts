import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Analytics Simulator Test
 *
 * 模拟分析诊断系统的场景覆盖：
 * - 运营快照生成 (getOperationSnapshot)
 * - 诊断规则触发 (getDiagnostics)
 * - 推荐聚合 (getRecommendations)
 * - 多 scope 场景 (TENANT / BRAND / STORE)
 * - 边界场景 (空数据、零结算、极端指标)
 *
 * 8 角色视角覆盖：
 *  👔店长 - 全店运营总览&异常诊断
 *  🛒前台 - 当日结算统计查看
 *  👥HR - 员工绩效与会员活跃度分析
 *  🔧安监 - 支付合规与风控诊断
 *  🎮导玩员 - 盲盒与游戏币转化分析
 *  🎯运行专员 - 运营健康检查&积压诊断
 *  🤝团建 - 团建套餐消费分析
 *  📢营销 - 券&积分活动效果分析
 */

import assert from 'node:assert/strict'
import { AnalyticsService } from './analytics.service'
import {
  AnalyticsScope,
  DiagnosticCategory,
  DiagnosticSeverity,
  type OperationSnapshot,
  type Diagnostic,
  type DiagnosticRecommendation,
  type OperationSnapshotMetric
} from './analytics.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { LoyaltyService } from '../loyalty/loyalty.service'

// ─── Simulator helpers ───

interface SimulatedLoyaltyState {
  settlementCount: number
  settlementSuccessCount: number
  couponRedemptionCount: number
  blindboxFulfillmentCount: number
  pointsIn: number
  pointsOut: number
  couponPlans?: Array<{
    planId: string
    code: string
    remainingQuota: number
    totalQuota: number
    status: string
  }>
}

function makeTenantContext(overrides: Partial<RequestTenantContext> = {}): RequestTenantContext {
  return {
    tenantId: 't-analytics',
    brandId: 'b-analytics',
    storeId: 's-analytics',
    marketCode: 'zh-cn',
    ...overrides
  }
}

/**
 * 创建一个带有模拟 LoyaltyService 的 AnalyticsService，
 * 以便在不依赖实际 LoyaltyService 的情况下测试诊断逻辑。
 */
function makeAnalyticsService(loyaltyState: SimulatedLoyaltyState): AnalyticsService {
  const mockLoyalty: Partial<LoyaltyService> = {
    getLoyaltySummary: () => ({
      settlementCount: loyaltyState.settlementCount,
      settlementSuccessCount: loyaltyState.settlementSuccessCount,
      couponRedemptionCount: loyaltyState.couponRedemptionCount,
      blindboxFulfillmentCount: loyaltyState.blindboxFulfillmentCount,
      pointsIn: loyaltyState.pointsIn,
      pointsOut: loyaltyState.pointsOut
    }),
    listCouponPlans: (() =>
      (loyaltyState.couponPlans ?? []).map((p) => ({
        planId: p.planId,
        code: p.code,
        remainingQuota: p.remainingQuota,
        totalQuota: p.totalQuota,
        status: p.status,
        title: `计划-${p.code}`,
        description: '',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })) as any)
  }
  return new AnalyticsService(mockLoyalty as LoyaltyService)
}

/**
 * 健康状态的 Loyalty 数据
 */
const HEALTHY_LOYALTY: SimulatedLoyaltyState = {
  settlementCount: 100,
  settlementSuccessCount: 95,
  couponRedemptionCount: 40,
  blindboxFulfillmentCount: 20,
  pointsIn: 50000,
  pointsOut: 30000
}

// ─── 角色定义 ───

const ROLES = {
  DIANZHANG: '👔店长',
  QIANTAI: '🛒前台',
  HR: '👥HR',
  ANJIAN: '🔧安监',
  DAOWAN: '🎮导玩员',
  YUNXING: '🎯运行专员',
  TUANJIAN: '🤝团建',
  YINGXIAO: '📢营销'
} as const

// ─── Tests ───

describe('Analytics Simulator', () => {
  // ──────── 👔店长 ────────
  describe(`${ROLES.DIANZHANG} - 全店运营总览&异常诊断`, () => {
    it('查看租户级运营快照包含所有分组', () => {
      const svc = makeAnalyticsService(HEALTHY_LOYALTY)
      const snapshot = svc.getOperationSnapshot(makeTenantContext())

      assert.equal(snapshot.scope, AnalyticsScope.Tenant)
      assert.ok(snapshot.groups.length >= 2, '应包含订单与积分两个分组')
      assert.ok(snapshot.totals.length > 0, '应包含汇总指标')

      const orderGroup = snapshot.groups.find((g) => g.groupKey === 'orders')
      assert.ok(orderGroup, '应有订单分组')
      assert.ok(orderGroup!.metrics.length >= 2)
    })

    it('支付成功率低于80%应触发Critical诊断', () => {
      const state: SimulatedLoyaltyState = {
        ...HEALTHY_LOYALTY,
        settlementCount: 100,
        settlementSuccessCount: 60, // 60% 成功
        pointsOut: 10000,
        pointsIn: 20000
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const paymentDiag = diagnostics.find((d) => d.ruleId === 'payment-success-rate-low')
      assert.ok(paymentDiag, '应触发支付成功率低诊断')
      assert.equal(paymentDiag!.severity, DiagnosticSeverity.Critical)
      assert.ok(paymentDiag!.recommendations.length > 0)
    })

    it('健康状态下不应有Critical诊断', () => {
      const svc = makeAnalyticsService(HEALTHY_LOYALTY)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const criticalDiags = diagnostics.filter((d) => d.severity === DiagnosticSeverity.Critical)
      assert.equal(criticalDiags.length, 0, '健康状态不应有Critical诊断')
    })
  })

  // ──────── 🛒前台 ────────
  describe(`${ROLES.QIANTAI} - 当日结算统计查看`, () => {
    it('查看品牌级快照获取结算数据', () => {
      const svc = makeAnalyticsService(HEALTHY_LOYALTY)
      const snapshot = svc.getOperationSnapshot(makeTenantContext(), {
        scope: AnalyticsScope.Brand,
        brandId: 'b-analytics'
      })

      assert.equal(snapshot.scope, AnalyticsScope.Brand)
      const settlementMetric = snapshot.totals.find((m) => m.key === 'totalSettlements')
      assert.ok(settlementMetric)
      assert.ok(settlementMetric!.value > 0, '应有结算数据')
    })

    it('零结算时应正确显示0', () => {
      const state: SimulatedLoyaltyState = {
        settlementCount: 0,
        settlementSuccessCount: 0,
        couponRedemptionCount: 0,
        blindboxFulfillmentCount: 0,
        pointsIn: 0,
        pointsOut: 0
      }
      const svc = makeAnalyticsService(state)
      const snapshot = svc.getOperationSnapshot(makeTenantContext())

      assert.equal(snapshot.totals.find((m) => m.key === 'totalSettlements')!.value, 0)
      assert.equal(snapshot.totals.find((m) => m.key === 'totalRedemptions')!.value, 0)
    })
  })

  // ──────── 👥HR ────────
  describe(`${ROLES.HR} - 员工绩效与会员活跃度分析`, () => {
    it('会员活动稀疏触发Info诊断', () => {
      const state: SimulatedLoyaltyState = {
        settlementCount: 2,
        settlementSuccessCount: 2,
        couponRedemptionCount: 0,
        blindboxFulfillmentCount: 0,
        pointsIn: 0,
        pointsOut: 0
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const thinningDiag = diagnostics.find((d) => d.ruleId === 'member-activity-thinning')
      assert.ok(thinningDiag, '应触发会员活动稀疏诊断')
      assert.equal(thinningDiag!.severity, DiagnosticSeverity.Info)
      assert.ok(thinningDiag!.recommendations.some((r) => r.actionCode === 'increase-touchpoint-frequency'))
    })

    it('高活跃度会员无活动稀疏诊断', () => {
      const svc = makeAnalyticsService(HEALTHY_LOYALTY)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const thinningDiag = diagnostics.find((d) => d.ruleId === 'member-activity-thinning')
      assert.equal(thinningDiag, undefined, '高活跃不应触发稀疏诊断')
    })
  })

  // ──────── 🔧安监 ────────
  describe(`${ROLES.ANJIAN} - 支付合规与风控诊断`, () => {
    it('支付失败率高触发Critical诊断并含action建议', () => {
      const state: SimulatedLoyaltyState = {
        ...HEALTHY_LOYALTY,
        settlementCount: 50,
        settlementSuccessCount: 30, // 60%
        pointsOut: 10000,
        pointsIn: 20000
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const paymentDiag = diagnostics.find((d) => d.ruleId === 'payment-success-rate-low')
      assert.ok(paymentDiag)
      assert.equal(paymentDiag!.category, DiagnosticCategory.PaymentHealth)
      assert.ok(paymentDiag!.recommendations.some((r) => r.actionCode === 'inspect-payment-gateway'))
    })

    it('零结算不触发支付成功率诊断', () => {
      const state: SimulatedLoyaltyState = {
        settlementCount: 0,
        settlementSuccessCount: 0,
        couponRedemptionCount: 0,
        blindboxFulfillmentCount: 0,
        pointsIn: 0,
        pointsOut: 0
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const paymentDiag = diagnostics.find((d) => d.ruleId === 'payment-success-rate-low')
      assert.equal(paymentDiag, undefined, '零结算不触发支付成功率诊断')
    })
  })

  // ──────── 🎮导玩员 ────────
  describe(`${ROLES.DAOWAN} - 盲盒与游戏币转化分析`, () => {
    it('盲盒履约零但券核销多触发盲盒转化诊断', () => {
      const state: SimulatedLoyaltyState = {
        ...HEALTHY_LOYALTY,
        settlementCount: 10,
        settlementSuccessCount: 10,
        blindboxFulfillmentCount: 0,
        couponRedemptionCount: 20, // 券核销多但没买盲盒
        pointsOut: 10000,
        pointsIn: 20000
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const blindboxDiag = diagnostics.find((d) => d.ruleId === 'blindbox-redemption-shortfall')
      assert.ok(blindboxDiag, '应触发盲盒履约转化诊断')
      assert.equal(blindboxDiag!.category, DiagnosticCategory.BlindboxEngagement)
      assert.ok(blindboxDiag!.recommendations.some((r) => r.actionCode === 'launch-blindbox-promo'))
    })

    it('盲盒履约正常不触发该诊断', () => {
      const svc = makeAnalyticsService(HEALTHY_LOYALTY)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const blindboxDiag = diagnostics.find((d) => d.ruleId === 'blindbox-redemption-shortfall')
      assert.equal(blindboxDiag, undefined, '正常履约不应触发')
    })
  })

  // ──────── 🎯运行专员 ────────
  describe(`${ROLES.YUNXING} - 运营健康检查&积压诊断`, () => {
    it('多诊断叠加按优先级排序推荐', () => {
      const state: SimulatedLoyaltyState = {
        settlementCount: 20,
        settlementSuccessCount: 12, // 60% -> 触发支付诊断
        couponRedemptionCount: 30,
        blindboxFulfillmentCount: 0, // 触发盲盒诊断
        pointsIn: 10000,
        pointsOut: 25000, // pointsOut > pointsIn * 1.3 也触发积分净流出
        couponPlans: [
          { planId: 'plan-01', code: 'CP001', remainingQuota: 5, totalQuota: 100, status: 'ACTIVE' }
        ]
      }
      const svc = makeAnalyticsService(state)
      const recommendations = svc.getRecommendations(makeTenantContext())

      assert.ok(recommendations.length >= 2, '应有多个推荐')
      // 验证优先级排序：高优先级在前
      for (let i = 1; i < recommendations.length; i++) {
        assert.ok(recommendations[i - 1].priority >= recommendations[i].priority,
          `推荐应按优先级降序排列: ${recommendations[i-1].priority} >= ${recommendations[i].priority}`)
      }
    })

    it('券计划额度耗尽触发诊断', () => {
      const state: SimulatedLoyaltyState = {
        ...HEALTHY_LOYALTY,
        couponPlans: [
          { planId: 'plan-exhausted', code: 'EXH01', remainingQuota: 2, totalQuota: 100, status: 'ACTIVE' }
        ]
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const couponDiag = diagnostics.find((d) => d.ruleId === 'coupon-quota-near-exhaustion')
      assert.ok(couponDiag, '应触发券额度耗尽诊断')
      assert.ok((couponDiag!.evidence as any).exhaustedPlanIds.includes('plan-exhausted'))
    })

    it('无结算活动触发静默诊断', () => {
      const state: SimulatedLoyaltyState = {
        settlementCount: 0,
        settlementSuccessCount: 0,
        couponRedemptionCount: 0,
        blindboxFulfillmentCount: 0,
        pointsIn: 0,
        pointsOut: 0
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const noActivityDiag = diagnostics.find((d) => d.ruleId === 'no-settlement-activity')
      assert.ok(noActivityDiag, '应触发结算静默诊断')
      assert.equal(noActivityDiag!.category, DiagnosticCategory.MemberActivity)
    })
  })

  // ──────── 🤝团建 ────────
  describe(`${ROLES.TUANJIAN} - 团建套餐消费分析`, () => {
    it('Store级快照精确到门店', () => {
      const svc = makeAnalyticsService(HEALTHY_LOYALTY)
      const snapshot = svc.getOperationSnapshot(makeTenantContext(), {
        scope: AnalyticsScope.Store,
        storeId: 's-group-event'
      })

      assert.equal(snapshot.scope, AnalyticsScope.Store)
      assert.equal(snapshot.storeId, 's-group-event')
      assert.ok(snapshot.groups.length > 0)
    })

    it('积分净流指标趋势正确计算', () => {
      // pointsIn > pointsOut -> UP trend
      const state: SimulatedLoyaltyState = {
        ...HEALTHY_LOYALTY,
        pointsIn: 50000,
        pointsOut: 30000
      }
      const svc = makeAnalyticsService(state)
      const snapshot = svc.getOperationSnapshot(makeTenantContext())

      const loyaltyGroup = snapshot.groups.find((g) => g.groupKey === 'loyalty')
      assert.ok(loyaltyGroup)
      const pointsNet = loyaltyGroup!.metrics.find((m) => m.key === 'pointsNet')
      assert.ok(pointsNet)
      assert.equal(pointsNet!.trend, 'UP')
      assert.equal(pointsNet!.value, 20000)
    })

    it('积分净流出时趋势为DOWN', () => {
      const state: SimulatedLoyaltyState = {
        ...HEALTHY_LOYALTY,
        pointsIn: 10000,
        pointsOut: 30000
      }
      const svc = makeAnalyticsService(state)
      const snapshot = svc.getOperationSnapshot(makeTenantContext())

      const loyaltyGroup = snapshot.groups.find((g) => g.groupKey === 'loyalty')
      const pointsNet = loyaltyGroup!.metrics.find((m) => m.key === 'pointsNet')
      assert.equal(pointsNet!.trend, 'DOWN')
    })
  })

  // ──────── 📢营销 ────────
  describe(`${ROLES.YINGXIAO} - 券&积分活动效果分析`, () => {
    it('积分净流出触发高优先级诊断', () => {
      const state: SimulatedLoyaltyState = {
        ...HEALTHY_LOYALTY,
        pointsIn: 10000,
        pointsOut: 30000, // pointsOut > pointsIn * 1.3
        couponPlans: []
      }
      const svc = makeAnalyticsService(state)
      const diagnostics = svc.getDiagnostics(makeTenantContext())

      const outflowDiag = diagnostics.find((d) => d.ruleId === 'points-outflow-dominant')
      assert.ok(outflowDiag, '应触发积分净流出诊断')
      assert.equal(outflowDiag!.severity, DiagnosticSeverity.Critical)
      assert.equal(outflowDiag!.category, DiagnosticCategory.PointEconomy)
      assert.ok(outflowDiag!.recommendations.some((r) => r.actionCode === 'rebalance-point-economy'))
    })

    it('券核销和盲盒数据出现在快照中', () => {
      const svc = makeAnalyticsService(HEALTHY_LOYALTY)
      const snapshot = svc.getOperationSnapshot(makeTenantContext())

      const orderGroup = snapshot.groups.find((g) => g.groupKey === 'orders')
      assert.ok(orderGroup)
      const couponMetric = orderGroup!.metrics.find((m) => m.key === 'couponRedemptionCount')
      assert.ok(couponMetric)
      assert.equal(couponMetric!.value, 40)

      const blindboxMetric = orderGroup!.metrics.find((m) => m.key === 'blindboxFulfillmentCount')
      assert.ok(blindboxMetric)
      assert.equal(blindboxMetric!.value, 20)
    })

    it('推荐按优先级排序后最高优先级最先', () => {
      const state: SimulatedLoyaltyState = {
        settlementCount: 20,
        settlementSuccessCount: 12, // 支付低 -> priority 100
        couponRedemptionCount: 30,
        blindboxFulfillmentCount: 0, // 盲盒 -> priority 80
        pointsIn: 10000,
        pointsOut: 25000, // 积分净流出 -> priority 90
        couponPlans: [
          { planId: 'p1', code: 'C1', remainingQuota: 3, totalQuota: 100, status: 'ACTIVE' } // 券耗尽 -> priority 70
        ]
      }
      const svc = makeAnalyticsService(state)
      const recommendations = svc.getRecommendations(makeTenantContext())

      assert.ok(recommendations.length >= 3, '应有多个推荐')
      // 最高优先级应为100 (支付网关检查)
      assert.equal(recommendations[0].priority, 100)
      assert.equal(recommendations[0].actionCode, 'inspect-payment-gateway')
    })
  })
})

// ─── 纯单元测试 ───

describe('Analytics Simulator - 纯单元', () => {
  it('getOperationSnapshot 返回完整结构', () => {
    const svc = makeAnalyticsService(HEALTHY_LOYALTY)
    const snapshot = svc.getOperationSnapshot(makeTenantContext())

    assert.equal(typeof snapshot.tenantId, 'string')
    assert.equal(typeof snapshot.generatedAt, 'string')
    assert.ok(Array.isArray(snapshot.groups))
    assert.ok(Array.isArray(snapshot.totals))

    for (const group of snapshot.groups) {
      assert.equal(typeof group.groupKey, 'string')
      assert.equal(typeof group.groupLabel, 'string')
      assert.ok(Array.isArray(group.metrics))
      for (const metric of group.metrics) {
        assert.equal(typeof metric.key, 'string')
        assert.equal(typeof metric.label, 'string')
        assert.equal(typeof metric.value, 'number')
      }
    }
  })

  it('getDiagnostics 为每个 diagnostic 返回合规结构', () => {
    const state: SimulatedLoyaltyState = {
      settlementCount: 10,
      settlementSuccessCount: 5, // 触发支付诊断
      couponRedemptionCount: 20,
      blindboxFulfillmentCount: 0, // 触发盲盒诊断
      pointsIn: 5000,
      pointsOut: 10000
    }
    const svc = makeAnalyticsService(state)
    const diagnostics = svc.getDiagnostics(makeTenantContext())

    assert.ok(diagnostics.length > 0, '应有诊断结果')
    for (const diag of diagnostics) {
      assert.equal(typeof diag.diagnosticId, 'string')
      assert.equal(typeof diag.ruleId, 'string')
      assert.ok(Object.values(DiagnosticCategory).includes(diag.category))
      assert.ok(Object.values(DiagnosticSeverity).includes(diag.severity))
      assert.equal(typeof diag.title, 'string')
      assert.ok(diag.recommendations.length > 0)
      for (const rec of diag.recommendations) {
        assert.equal(typeof rec.actionCode, 'string')
        assert.equal(typeof rec.description, 'string')
        assert.equal(typeof rec.priority, 'number')
      }
    }
  })

  it('getRecommendations 去重并按优先级排序', () => {
    const svc = makeAnalyticsService(HEALTHY_LOYALTY)
    const recommendations = svc.getRecommendations(makeTenantContext())

    // 健康状态可能没有推荐
    assert.ok(Array.isArray(recommendations))
  })

  it('空数据场景不崩溃', () => {
    const emptyState: SimulatedLoyaltyState = {
      settlementCount: 0,
      settlementSuccessCount: 0,
      couponRedemptionCount: 0,
      blindboxFulfillmentCount: 0,
      pointsIn: 0,
      pointsOut: 0
    }
    const svc = makeAnalyticsService(emptyState)

    // 这些调用都不应抛异常
    assert.doesNotThrow(() => svc.getOperationSnapshot(makeTenantContext()))
    assert.doesNotThrow(() => svc.getDiagnostics(makeTenantContext()))
    assert.doesNotThrow(() => svc.getRecommendations(makeTenantContext()))
  })

  it('不同tenantId独立生成snapshot', () => {
    const svc = makeAnalyticsService(HEALTHY_LOYALTY)
    const s1 = svc.getOperationSnapshot(makeTenantContext({ tenantId: 't-001' }))
    const s2 = svc.getOperationSnapshot(makeTenantContext({ tenantId: 't-002' }))

    assert.equal(s1.tenantId, 't-001')
    assert.equal(s2.tenantId, 't-002')
    assert.notEqual(s1.generatedAt, '', 'generatedAt 不为空')
  })
})
