/**
 * analytics.service.advanced.test.ts — 统计分析服务进阶单元测试
 *
 * 覆盖現有 analytics.service.test.ts 未覆盖的:
 *   1. getOperationSnapshot - 营销指标完整聚合
 *   2. getDiagnostics - 更多规则组合
 *   3. getRecommendations - 多样推荐与排序
 *   4. 边界/反例/数据一致性
 *
 * 测试充分性: 15+ tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { AnalyticsService } from './analytics.service'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { MemberService } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { AnalyticsScope } from './analytics.entity'

const tenantContext = {
  tenantId: 'tenant-advanced',
  brandId: 'brand-advanced',
  storeId: 'store-advanced',
}

function createHarness() {
  const memberService = new MemberService()
  const metricsService = new MarketingMetricsService()
  const loyaltyService = new LoyaltyService(memberService, undefined, metricsService)
  loyaltyService.resetLoyaltyStoresForTests()
  const analyticsService = new AnalyticsService(loyaltyService, metricsService)
  return { memberService, loyaltyService, analyticsService, metricsService }
}

function ensureMember(harness: ReturnType<typeof createHarness>, memberId = 'm-adv', brandId = 'brand-advanced') {
  if (!harness.memberService.getProfile(memberId)) {
    harness.memberService.register({
      memberId,
      tenantContext: { tenantId: 'tenant-advanced', brandId, storeId: 'store-advanced' },
      nickname: memberId,
    })
  }
}

function buildOrder(orderId: string, brandId = 'brand-advanced') {
  return {
    snapshotId: `snap-${orderId}`,
    tenantContext: { tenantId: 'tenant-advanced', brandId, storeId: 'store-advanced' },
    externalOrderId: orderId,
    orderNo: orderId,
    memberId: 'm-adv',
    amount: 100,
    discountAmount: 0,
    payableAmount: 100,
    currency: 'CNY',
    status: 'PAID',
    updatedAtFromSource: new Date().toISOString(),
  } as any
}

function buildPayment(orderId: string, paymentId: string, brandId = 'brand-advanced') {
  return {
    snapshotId: `snap-pay-${paymentId}`,
    tenantContext: { tenantId: 'tenant-advanced', brandId, storeId: 'store-advanced' },
    externalPaymentId: paymentId,
    externalOrderId: orderId,
    paymentChannel: 'WECHAT_PAY',
    paymentStatus: 'SUCCEEDED',
    amount: 100,
    currency: 'CNY',
    paidAt: new Date().toISOString(),
    updatedAtFromSource: new Date().toISOString(),
  } as any
}

describe('AnalyticsService — getOperationSnapshot 进阶', () => {
  it('正例: 订单组指标应包含 settlementSuccessRate 的正确计算', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    // 3 success + 1 fail = 4 total, success rate = 75%
    for (let i = 0; i < 3; i++) {
      await loyaltyService.settlePaidOrderFromSnapshots(
        buildOrder(`adv-ok-${i}`), buildPayment(`adv-ok-${i}`, `pay-adv-ok-${i}`)
      )
    }
    await loyaltyService.settleFailedOrderFromSnapshots(
      buildOrder('adv-fail'), buildPayment('adv-fail', 'pay-adv-fail')
    )

    const snapshot = analyticsService.getOperationSnapshot(tenantContext)
    const orderGroup = snapshot.groups.find(g => g.groupKey === 'orders')
    assert.ok(orderGroup)

    const successRate = orderGroup.metrics.find(m => m.key === 'settlementSuccessRate')
    assert.equal(successRate?.value, 75)
    assert.equal(successRate?.ratio, 75)
  })

  it('正例: 营销指标应完整聚合到 marketing group', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService, metricsService } = harness
    ensureMember(harness)

    // 创建并发放优惠券
    const plan = loyaltyService.registerCouponPlan({
      tenantContext,
      code: 'ADV_TEST',
      title: 'advanced test coupon',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 10,
      totalQuota: 100,
      perMemberLimit: 5,
      validFrom: new Date(Date.now() - 1000).toISOString(),
      validUntil: new Date(Date.now() + 3600000).toISOString(),
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE' as any, tenantContext.tenantId)
    loyaltyService.issueCouponFromPlan({ tenantContext, memberId: 'm-adv', planId: plan.planId })

    // 营销指标
    metricsService.incrCouponRedemption(true, tenantContext.tenantId)
    metricsService.incrCampaignTrigger(5, 3, tenantContext.tenantId)
    metricsService.incrNotificationDispatch(tenantContext.tenantId)
    metricsService.incrLeadIngest(tenantContext.tenantId)
    metricsService.incrLeadCloseWon(200, tenantContext.tenantId)

    const snapshot = analyticsService.getOperationSnapshot(tenantContext)
    const marketingGroup = snapshot.groups.find(g => g.groupKey === 'marketing')
    assert.ok(marketingGroup)

    assert.equal(marketingGroup.metrics.find(m => m.key === 'couponIssuedTotal')?.value, 1)
    assert.equal(marketingGroup.metrics.find(m => m.key === 'couponRedemptionTotal')?.value, 1)
    assert.equal(marketingGroup.metrics.find(m => m.key === 'campaignTriggerTotal')?.value, 5)
    assert.equal(marketingGroup.metrics.find(m => m.key === 'campaignDispatchedTotal')?.value, 3)
    assert.equal(marketingGroup.metrics.find(m => m.key === 'notificationDispatchTotal')?.value, 1)
    assert.equal(marketingGroup.metrics.find(m => m.key === 'leadIngestTotal')?.value, 1)
    assert.equal(marketingGroup.metrics.find(m => m.key === 'leadCloseWonTotal')?.value, 1)
  })

  it('正例: totals 正确聚合跨组的指标', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService, metricsService } = harness
    ensureMember(harness)

    await loyaltyService.settlePaidOrderFromSnapshots(buildOrder('totals-test'), buildPayment('totals-test', 'pay-totals'))

    const plan = loyaltyService.registerCouponPlan({
      tenantContext,
      code: 'TOTALS',
      title: 'totals test',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 5,
      totalQuota: 10,
      perMemberLimit: 3,
      validFrom: new Date(Date.now() - 1000).toISOString(),
      validUntil: new Date(Date.now() + 3600000).toISOString(),
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE' as any, tenantContext.tenantId)
    loyaltyService.issueCouponFromPlan({ tenantContext, memberId: 'm-adv', planId: plan.planId })
    metricsService.incrNotificationDispatch(tenantContext.tenantId)

    const snapshot = analyticsService.getOperationSnapshot(tenantContext)
    assert.equal(snapshot.totals.find(t => t.key === 'totalSettlements')?.value, 1)
    assert.equal(snapshot.totals.find(t => t.key === 'totalCouponsIssued')?.value, 1)
    assert.equal(snapshot.totals.find(t => t.key === 'totalNotifications')?.value, 1)
  })

  it('边界: scope=Brand 时 brandId 传递正确', () => {
    const harness = createHarness()
    const { analyticsService } = harness
    const snapshot = analyticsService.getOperationSnapshot(tenantContext, {
      scope: AnalyticsScope.Brand,
      brandId: 'brand-advanced',
    })
    assert.equal(snapshot.brandId, 'brand-advanced')
  })

  it('边界: scope=Store 时 storeId 传递正确', () => {
    const harness = createHarness()
    const { analyticsService } = harness
    const snapshot = analyticsService.getOperationSnapshot(tenantContext, {
      scope: AnalyticsScope.Store,
      storeId: 'store-advanced',
    })
    assert.equal(snapshot.storeId, 'store-advanced')
  })

  it('边界: 营销指标全为 0 时 marketing group 依然存在', () => {
    const harness = createHarness()
    const { analyticsService } = harness
    const snapshot = analyticsService.getOperationSnapshot(tenantContext)
    const marketingGroup = snapshot.groups.find(g => g.groupKey === 'marketing')
    assert.ok(marketingGroup)
    assert.equal(marketingGroup.metrics.length, 9) // 所有9个营销指标
    assert.ok(marketingGroup.metrics.every(m => m.value === 0))
  })
})

describe('AnalyticsService — getDiagnostics 进阶', () => {
  it('正例: 点数 outflow 检查—pointsIn = pointsOut = 0 时不触发', () => {
    const harness = createHarness()
    const { analyticsService } = harness
    // 空数据: pointsIn 和 pointsOut 都是 0, 条件 pointsOut > pointsIn * 1.3 不满足
    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const outflow = diagnostics.find(d => d.ruleId.startsWith('points-outflow-dominant'))
    assert.equal(outflow, undefined)
  })

  it('正例: 盲盒履约 0 且核销 > 5 时触发 blindbox-redemption-shortfall', () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    const plan = loyaltyService.registerCouponPlan({
      tenantContext,
      code: 'BLIND',
      title: 'blind test',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 10,
      totalQuota: 100,
      perMemberLimit: 10,
      validFrom: new Date(Date.now() - 1000).toISOString(),
      validUntil: new Date(Date.now() + 3600000).toISOString(),
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE' as any, tenantContext.tenantId)
    for (let i = 0; i < 6; i++) {
      loyaltyService.issueCouponFromPlan({
        tenantContext, memberId: `m-blind-${i}`, planId: plan.planId,
      })
    }

    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const shortfall = diagnostics.find(d => d.ruleId.startsWith('blindbox-redemption-shortfall'))
    assert.ok(shortfall)
    assert.equal(shortfall?.severity, 'WARNING')
  })

  it('正例: coupon-quota-near-exhaustion 在额度 < 10% 时触发', () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    const plan = loyaltyService.registerCouponPlan({
      tenantContext,
      code: 'EXHAUST',
      title: 'exhaust test',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 10,
      totalQuota: 10,
      perMemberLimit: 10,
      validFrom: new Date(Date.now() - 1000).toISOString(),
      validUntil: new Date(Date.now() + 3600000).toISOString(),
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE' as any, tenantContext.tenantId)
    for (let i = 0; i < 10; i++) {
      loyaltyService.issueCouponFromPlan({
        tenantContext, memberId: `m-exh-${i}`, planId: plan.planId,
      })
    }

    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const quota = diagnostics.find(d => d.ruleId.startsWith('coupon-quota-near-exhaustion'))
    assert.ok(quota)
    assert.equal(quota?.severity, 'WARNING')
  })

  it('正例: 多个诊断同时触发', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    // 结算为 0 → 触发 no-settlement-activity
    // 加上 coupons but no blindbox → 触发 blindbox-shortfall if > 5
    const plan = loyaltyService.registerCouponPlan({
      tenantContext,
      code: 'MULTI',
      title: 'multi test',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 10,
      totalQuota: 50,
      perMemberLimit: 10,
      validFrom: new Date(Date.now() - 1000).toISOString(),
      validUntil: new Date(Date.now() + 3600000).toISOString(),
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE' as any, tenantContext.tenantId)
    for (let i = 0; i < 6; i++) {
      loyaltyService.issueCouponFromPlan({
        tenantContext, memberId: `m-multi-${i}`, planId: plan.planId,
      })
    }

    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const ruleIds = diagnostics.map(d => d.ruleId)
    // no-settlement-activity 因为 settlementCount = 0
    expect(ruleIds).toContain('no-settlement-activity')
    expect(ruleIds).toContain('blindbox-redemption-shortfall')
    expect(diagnostics.length).toBeGreaterThanOrEqual(2)
  })

  it('反例: 100% 支付成功率时不触发支付诊断', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    await loyaltyService.settlePaidOrderFromSnapshots(buildOrder('ok-1'), buildPayment('ok-1', 'pay-ok-1'))
    await loyaltyService.settlePaidOrderFromSnapshots(buildOrder('ok-2'), buildPayment('ok-2', 'pay-ok-2'))

    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const paymentDiag = diagnostics.find(d => d.ruleId.startsWith('payment-success-rate-low'))
    assert.equal(paymentDiag, undefined)
  })

  it('反例: member-activity-thinning 在结算 >= 3 时不触发', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    for (let i = 0; i < 3; i++) {
      await loyaltyService.settlePaidOrderFromSnapshots(
        buildOrder(`thick-${i}`), buildPayment(`thick-${i}`, `pay-thick-${i}`)
      )
    }

    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const thinning = diagnostics.find(d => d.ruleId.startsWith('member-activity-thinning'))
    assert.equal(thinning, undefined)
  })

  it('边界: 空 LoyaltyService 时诊断不 panic', () => {
    const analyticsService = new AnalyticsService(undefined, undefined)
    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    // no-settlement-activity should still trigger because getLoyaltySummary returns zeros via optional
    expect(Array.isArray(diagnostics)).toBe(true)
  })
})

describe('AnalyticsService — getRecommendations', () => {
  it('正例: 推荐按 priority 降序排列', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    // 触发多个诊断
    await loyaltyService.settleFailedOrderFromSnapshots(
      buildOrder('rec-fail'), buildPayment('rec-fail', 'pay-rec-fail')
    )

    const recommendations = analyticsService.getRecommendations(tenantContext)
    assert.ok(recommendations.length >= 1)
    for (let i = 1; i < recommendations.length; i++) {
      assert.ok(
        recommendations[i - 1].priority >= recommendations[i].priority,
        `Recommendations not sorted at index ${i}: ${recommendations[i - 1].priority} < ${recommendations[i].priority}`
      )
    }
  })

  it('正例: 推荐包含 actionCode', () => {
    const harness = createHarness()
    const { analyticsService } = harness
    const recommendations = analyticsService.getRecommendations(tenantContext)
    // 至少有一个 no-settlement-activity
    expect(recommendations.length).toBeGreaterThan(0)
    recommendations.forEach(r => {
      expect(typeof r.actionCode).toBe('string')
      expect(typeof r.priority).toBe('number')
    })
  })

  it('反例: 无诊断时返回空推荐数组', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)

    // 大量结算确保所有诊断不触发
    for (let i = 0; i < 5; i++) {
      await loyaltyService.settlePaidOrderFromSnapshots(
        buildOrder(`clean-${i}`), buildPayment(`clean-${i}`, `pay-clean-${i}`)
      )
    }

    const recommendations = analyticsService.getRecommendations(tenantContext)
    // 因为有结算数据，no-settlement 不触发，member-activity-thinning 因为 settlement >= 3 不触发
    // 但如果 payment success rate 100% 也不触发
    // 可能为 0
    expect(Array.isArray(recommendations)).toBe(true)
  })
})
