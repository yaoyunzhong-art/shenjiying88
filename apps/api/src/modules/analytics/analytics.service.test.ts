import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService } from '../member/member.service'
import {
  AnalyticsScope,
  DiagnosticCategory,
  DiagnosticSeverity
} from './analytics.entity'
import { AnalyticsService } from './analytics.service'

const tenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
  storeId: 'store-001'
}

function createHarness() {
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  loyaltyService.resetLoyaltyStoresForTests()
  const analyticsService = new AnalyticsService(loyaltyService)
  return { memberService, loyaltyService, analyticsService }
}

function ensureMember(harness: ReturnType<typeof createHarness>, memberId = 'm-1', brandId = 'brand-001') {
  if (!harness.memberService.getProfile(memberId)) {
    harness.memberService.register({
      memberId,
      tenantContext: { tenantId: 'tenant-001', brandId, storeId: 'store-001' },
      nickname: memberId
    })
  }
}

function buildLytOrder(orderId: string, brandId = 'brand-001') {
  return {
    snapshotId: `snap-${orderId}`,
    tenantContext: { tenantId: 'tenant-001', brandId, storeId: 'store-001' },
    externalOrderId: orderId,
    orderNo: orderId,
    memberId: 'm-1',
    amount: 100,
    discountAmount: 0,
    payableAmount: 100,
    currency: 'CNY',
    status: 'PAID',
    updatedAtFromSource: new Date().toISOString()
  } as any
}

function buildLytPayment(orderId: string, paymentId: string, brandId = 'brand-001') {
  return {
    snapshotId: `snap-pay-${paymentId}`,
    tenantContext: { tenantId: 'tenant-001', brandId, storeId: 'store-001' },
    externalPaymentId: paymentId,
    externalOrderId: orderId,
    paymentChannel: 'WECHAT_PAY',
    paymentStatus: 'SUCCEEDED',
    amount: 100,
    currency: 'CNY',
    paidAt: new Date().toISOString(),
    updatedAtFromSource: new Date().toISOString()
  } as any
}

describe('AnalyticsService', () => {
  test('getOperationSnapshot returns zeroed snapshot when loyalty is empty', () => {
    const { analyticsService } = createHarness()
    const snapshot = analyticsService.getOperationSnapshot(tenantContext)
    assert.equal(snapshot.tenantId, 'tenant-001')
    assert.equal(snapshot.scope, AnalyticsScope.Tenant)
    assert.equal(snapshot.groups.length, 2)
    assert.equal(snapshot.groups[0]?.groupKey, 'orders')
    assert.equal(snapshot.groups[1]?.groupKey, 'loyalty')
    const settlementCount = snapshot.groups[0]?.metrics.find((m) => m.key === 'settlementCount')
    assert.equal(settlementCount?.value, 0)
    assert.equal(settlementCount?.unit, '笔')
  })

  test('getOperationSnapshot aggregates settlePaidOrder counts', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)
    await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-001'), buildLytPayment('order-001', 'pay-001'))
    await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-002'), buildLytPayment('order-002', 'pay-002'))
    await loyaltyService.settleFailedOrderFromSnapshots(buildLytOrder('order-003'), buildLytPayment('order-003', 'pay-003'))

    const snapshot = analyticsService.getOperationSnapshot(tenantContext)
    const settlementCount = snapshot.groups[0]?.metrics.find((m) => m.key === 'settlementCount')
    assert.equal(settlementCount?.value, 3)
    const successRate = snapshot.groups[0]?.metrics.find((m) => m.key === 'settlementSuccessRate')
    assert.equal(successRate?.value, 66.7)
    const pointsIn = snapshot.groups[1]?.metrics.find((m) => m.key === 'pointsIn')
    assert.ok((pointsIn?.value ?? 0) > 0)
  })

  test('getOperationSnapshot filters by brandId when supplied', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness, 'm-1', 'brand-001')
    ensureMember(harness, 'm-1', 'brand-002')
    await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-001', 'brand-001'), buildLytPayment('order-001', 'pay-001'))
    await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-002', 'brand-002'), buildLytPayment('order-002', 'pay-002'))

    const tenant = analyticsService.getOperationSnapshot(tenantContext, { scope: AnalyticsScope.Tenant })
    assert.equal(tenant.totals.find((m) => m.key === 'totalSettlements')?.value, 2)
    const brand = analyticsService.getOperationSnapshot(tenantContext, {
      scope: AnalyticsScope.Brand,
      brandId: 'brand-002'
    })
    assert.equal(brand.totals.find((m) => m.key === 'totalSettlements')?.value, 1)
  })

  test('getDiagnostics flags low payment success rate', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)
    for (let i = 0; i < 5; i += 1) {
      await loyaltyService.settlePaidOrderFromSnapshots(
        buildLytOrder(`o-ok-${i}`),
        buildLytPayment(`o-ok-${i}`, `p-ok-${i}`)
      )
    }
    for (let i = 0; i < 5; i += 1) {
      await loyaltyService.settleFailedOrderFromSnapshots(
        buildLytOrder(`o-fail-${i}`),
        buildLytPayment(`o-fail-${i}`, `p-fail-${i}`)
      )
    }
    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const paymentDiagnostic = diagnostics.find((d) => d.ruleId.startsWith('payment-success-rate-low'))
    assert.ok(paymentDiagnostic)
    assert.equal(paymentDiagnostic?.severity, DiagnosticSeverity.Critical)
    assert.equal(paymentDiagnostic?.category, DiagnosticCategory.PaymentHealth)
    assert.equal(paymentDiagnostic?.recommendations[0]?.actionCode, 'inspect-payment-gateway')
  })

  test('getDiagnostics flags no-settlement-activity for empty tenants', () => {
    const { analyticsService } = createHarness()
    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const silence = diagnostics.find((d) => d.ruleId.startsWith('no-settlement-activity'))
    assert.ok(silence)
    assert.equal(silence?.severity, DiagnosticSeverity.Warning)
    assert.equal(silence?.recommendations[0]?.suggestedCampaignKind, 'RE_ENGAGEMENT')
  })

  test('getDiagnostics flags blindbox shortfall when coupons move but blindboxes do not', () => {
    const { analyticsService, loyaltyService } = createHarness()
    const plan = loyaltyService.registerCouponPlan({
      tenantContext,
      code: 'CAMP',
      title: 'test coupon',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 10,
      totalQuota: 100,
      perMemberLimit: 5,
      validFrom: new Date(Date.now() - 1000).toISOString(),
      validUntil: new Date(Date.now() + 1000 * 60 * 60).toISOString()
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE' as any, tenantContext.tenantId)
    for (let i = 0; i < 6; i += 1) {
      loyaltyService.issueCouponFromPlan({
        tenantContext,
        memberId: `m-${i}`,
        planId: plan.planId
      })
    }
    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const shortfall = diagnostics.find((d) => d.ruleId.startsWith('blindbox-redemption-shortfall'))
    assert.ok(shortfall)
    assert.equal(shortfall?.recommendations[0]?.suggestedCampaignKind, 'BLINDBOX_PROMO')
  })

  test('getDiagnostics flags coupon quota exhaustion when a plan is below 10%', () => {
    const { analyticsService, loyaltyService } = createHarness()
    const plan = loyaltyService.registerCouponPlan({
      tenantContext,
      code: 'TIGHT',
      title: 'tight coupon',
      discountType: 'FIXED_AMOUNT' as any,
      discountValue: 10,
      totalQuota: 10,
      perMemberLimit: 10,
      validFrom: new Date(Date.now() - 1000).toISOString(),
      validUntil: new Date(Date.now() + 1000 * 60 * 60).toISOString()
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, 'ACTIVE' as any, tenantContext.tenantId)
    for (let i = 0; i < 10; i += 1) {
      loyaltyService.issueCouponFromPlan({
        tenantContext,
        memberId: `m-${i}`,
        planId: plan.planId
      })
    }
    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const quota = diagnostics.find((d) => d.ruleId.startsWith('coupon-quota-near-exhaustion'))
    assert.ok(quota)
  })

  test('getRecommendations merges and sorts diagnostics by priority', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)
    await loyaltyService.settleFailedOrderFromSnapshots(
      buildLytOrder('o-fail-0'),
      buildLytPayment('o-fail-0', 'p-fail-0')
    )
    const recommendations = analyticsService.getRecommendations(tenantContext)
    assert.ok(recommendations.length >= 2)
    for (let i = 1; i < recommendations.length; i += 1) {
      assert.ok(
        (recommendations[i - 1]?.priority ?? 0) >= (recommendations[i]?.priority ?? 0),
        `Recommendations not sorted: ${i - 1} < ${i}`
      )
    }
  })

  test('getDiagnostics returns no payment failure diagnostic when success rate is 100%', async () => {
    const harness = createHarness()
    const { analyticsService, loyaltyService } = harness
    ensureMember(harness)
    await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-001'), buildLytPayment('order-001', 'pay-001'))
    await loyaltyService.settlePaidOrderFromSnapshots(buildLytOrder('order-002'), buildLytPayment('order-002', 'pay-002'))
    const diagnostics = analyticsService.getDiagnostics(tenantContext)
    const paymentDiagnostic = diagnostics.find((d) => d.ruleId.startsWith('payment-success-rate-low'))
    assert.equal(paymentDiagnostic, undefined)
    const silence = diagnostics.find((d) => d.ruleId.startsWith('no-settlement-activity'))
    assert.equal(silence, undefined)
  })

  test('getOperationSnapshot no-ops gracefully when LoyaltyService is not injected', () => {
    const analyticsService = new AnalyticsService(undefined)
    const snapshot = analyticsService.getOperationSnapshot(tenantContext)
    assert.equal(snapshot.totals.find((m) => m.key === 'totalSettlements')?.value, 0)
  })
})
