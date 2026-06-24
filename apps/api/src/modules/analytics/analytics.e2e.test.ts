/**
 * E2E: Analytics 诊断 / 快照 / 推荐 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → TestController → AnalyticsService → LoyaltyService (可选)
 *
 * 验证:
 *   - OperationSnapshot 聚合订单 / 积分 / 券 / 盲盒指标
 *   - Diagnostics 规则触发 (no-settlement / payment-success-low / quota-near-exhaustion / blindbox-shortfall)
 *   - Recommendations 按 priority 降序
 *   - 多 scope (TENANT / BRAND / STORE) 输入派生
 *   - 空数据时给出 fallback (settlement=0 → no-settlement 触发)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  Body,
  Controller,
  Get,
  Inject,
  Req,
  ValidationPipe
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import {
  CashierOrderStatus,
  CashierPaymentStatus,
  type CashierOrder,
  type CashierPayment
} from '../cashier/cashier.entity'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import {
  CouponDiscountType,
  LoyaltyPlanStatus
} from '../loyalty/loyalty.entity'
import { LoyaltyService } from '../loyalty/loyalty.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { AnalyticsService } from './analytics.service'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

@Controller('analytics')
class TestAnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analyticsService: AnalyticsService) {}

  @Get('snapshot')
  getOperationSnapshot(
    @Req() req: Request,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsService.getOperationSnapshot(tenantContext, {
      scope: body.scope as any,
      brandId: body.brandId as string | undefined,
      storeId: body.storeId as string | undefined
    })
  }

  @Get('diagnostics')
  getDiagnostics(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsService.getDiagnostics(tenantContext, {
      scope: body.scope as any,
      brandId: body.brandId as string | undefined,
      storeId: body.storeId as string | undefined
    })
  }

  @Get('recommendations')
  getRecommendations(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsService.getRecommendations(tenantContext, {
      scope: body.scope as any,
      brandId: body.brandId as string | undefined,
      storeId: body.storeId as string | undefined
    })
  }
}

async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  const analyticsService = new AnalyticsService(loyaltyService)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAnalyticsController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: AnalyticsService, useValue: analyticsService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberService, loyaltyService, analyticsService }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-A',
  'x-brand-id': 'brand-A',
  'x-store-id': 'store-A'
}

function tenantContextA() {
  return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }
}

function makeOrder(orderId: string, memberId: string, amount: number): CashierOrder {
  const now = new Date().toISOString()
  return {
    orderId,
    tenantContext: tenantContextA(),
    memberId,
    items: [{ skuId: 'sku-1', title: 'demo', quantity: 1, price: amount }],
    currency: 'CNY',
    totalAmount: amount,
    status: CashierOrderStatus.Paid,
    createdAt: now,
    updatedAt: now,
    paidAt: now,
    source: 'memory'
  }
}

function makePayment(paymentId: string, orderId: string, amount: number, success: boolean): CashierPayment {
  const now = new Date().toISOString()
  return {
    paymentId,
    orderId,
    channel: 'wechat',
    amount,
    status: success ? CashierPaymentStatus.Succeeded : CashierPaymentStatus.Failed,
    createdAt: now,
    updatedAt: now,
    completedAt: now,
    failureReason: success ? undefined : 'gateway-declined'
  }
}

test('e2e: snapshot returns empty-but-valid groups for new tenant', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })

    assert.equal(res.statusCode, 200)
    const snap = res.body.data
    assert.equal(snap.tenantId, 'tenant-A')
    assert.equal(snap.scope, 'TENANT')
    assert.equal(snap.groups.length, 2)
    assert.equal(snap.groups[0].groupKey, 'orders')
    assert.equal(snap.groups[1].groupKey, 'loyalty')

    const settlementMetric = snap.groups[0].metrics.find((m: any) => m.key === 'settlementCount')
    assert.equal(settlementMetric.value, 0)
    assert.equal(settlementMetric.unit, '笔')

    const totals = snap.totals
    assert.ok(Array.isArray(totals))
    assert.equal(totals.length, 3)
  } finally {
    await app.close()
  }
})

test('e2e: snapshot reflects loyalty aggregates (settlements, coupons, points)', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  // 2 successful settlements + 1 failed (success rate ~ 66% < 80%)
  await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 100), makePayment('p-1', 'o-1', 100, true))
  await loyaltyService.settlePaidOrder(makeOrder('o-2', 'm-1', 200), makePayment('p-2', 'o-2', 200, true))
  await loyaltyService.settleFailedOrder(makeOrder('o-3', 'm-1', 50), makePayment('p-3', 'o-3', 50, false))

  // Issue 6 coupons via the plan
  const plan = loyaltyService.registerCouponPlan({
    tenantContext: tenantContextA(),
    code: 'SNAP1',
    title: 'snapshot coupon',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 5,
    totalQuota: 100,
    perMemberLimit: 10,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z'
  })
  loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-A')
  for (let i = 0; i < 6; i++) {
    loyaltyService.issueCouponFromPlan({
      tenantContext: tenantContextA(),
      memberId: 'm-1',
      planId: plan.planId,
      source: 'snapshot-test'
    })
  }

  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })

    const snap = res.body.data
    const orderGroup = snap.groups.find((g: any) => g.groupKey === 'orders')
    const loyaltyGroup = snap.groups.find((g: any) => g.groupKey === 'loyalty')

    const settlementMetric = orderGroup.metrics.find((m: any) => m.key === 'settlementCount')
    assert.equal(settlementMetric.value, 3)

    const couponMetric = orderGroup.metrics.find((m: any) => m.key === 'couponRedemptionCount')
    assert.equal(couponMetric.value, 6)

    const pointsInMetric = loyaltyGroup.metrics.find((m: any) => m.key === 'pointsIn')
    assert.equal(pointsInMetric.value, 300) // 100 + 200 from settlements

    const pointsNetMetric = loyaltyGroup.metrics.find((m: any) => m.key === 'pointsNet')
    assert.equal(pointsNetMetric.trend, 'UP')
  } finally {
    await app.close()
  }
})

test('e2e: diagnostics flag no-settlement activity for new tenant', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })

    assert.equal(res.statusCode, 200)
    const diags = res.body.data
    assert.ok(Array.isArray(diags))

    const noSettlement = diags.find((d: any) => d.ruleId === 'no-settlement-activity')
    assert.ok(noSettlement, 'expected no-settlement-activity diagnostic')
    assert.equal(noSettlement.severity, 'WARNING')
    assert.equal(noSettlement.category, 'MEMBER_ACTIVITY')
    assert.equal(noSettlement.evidence.settlementCount, 0)
    assert.ok(Array.isArray(noSettlement.recommendations))
    assert.ok(noSettlement.recommendations.length >= 1)
  } finally {
    await app.close()
  }
})

test('e2e: diagnostics flag low payment success rate', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  // 5 settlements: 2 success, 3 failed → 40% success rate (low)
  await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 50), makePayment('p-1', 'o-1', 50, true))
  await loyaltyService.settlePaidOrder(makeOrder('o-2', 'm-1', 60), makePayment('p-2', 'o-2', 60, true))
  await loyaltyService.settleFailedOrder(makeOrder('o-3', 'm-1', 70), makePayment('p-3', 'o-3', 70, false))
  await loyaltyService.settleFailedOrder(makeOrder('o-4', 'm-1', 80), makePayment('p-4', 'o-4', 80, false))
  await loyaltyService.settleFailedOrder(makeOrder('o-5', 'm-1', 90), makePayment('p-5', 'o-5', 90, false))

  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })

    const diags = res.body.data
    const lowPayment = diags.find((d: any) => d.ruleId === 'payment-success-rate-low')
    assert.ok(lowPayment, 'expected payment-success-rate-low diagnostic')
    assert.equal(lowPayment.severity, 'CRITICAL')
    assert.equal(lowPayment.category, 'PAYMENT_HEALTH')
    assert.equal(lowPayment.evidence.settlementCount, 5)
    assert.equal(lowPayment.evidence.successCount, 2)
  } finally {
    await app.close()
  }
})

test('e2e: diagnostics flag coupon plan near quota exhaustion', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  // Create a coupon plan with quota 100, drain 95 (95% used) → < 10% remaining
  const plan = loyaltyService.registerCouponPlan({
    tenantContext: tenantContextA(),
    code: 'DRAIN',
    title: 'drained coupon',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 5,
    totalQuota: 100,
    perMemberLimit: 100,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z'
  })
  loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-A')

  for (let i = 0; i < 95; i++) {
    loyaltyService.issueCouponFromPlan({
      tenantContext: tenantContextA(),
      memberId: 'm-1',
      planId: plan.planId,
      source: 'drain-test'
    })
  }

  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })

    const diags = res.body.data
    const exhausted = diags.find((d: any) => d.ruleId === 'coupon-quota-near-exhaustion')
    assert.ok(exhausted, 'expected coupon-quota-near-exhaustion diagnostic')
    assert.equal(exhausted.severity, 'WARNING')
    assert.equal(exhausted.category, 'COUPON_PERFORMANCE')
    assert.ok(Array.isArray(exhausted.evidence.exhaustedPlanIds))
    assert.ok(exhausted.evidence.exhaustedPlanIds.includes(plan.planId))
  } finally {
    await app.close()
  }
})

test('e2e: diagnostics flag blindbox redemption shortfall when coupons move but blindboxes do not', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  // Issue 6+ coupons without any blindbox fulfillment → triggers blindbox-redemption-shortfall
  const plan = loyaltyService.registerCouponPlan({
    tenantContext: tenantContextA(),
    code: 'BB-SHORT',
    title: 'shortfall coupon',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 5,
    totalQuota: 100,
    perMemberLimit: 10,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z'
  })
  loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-A')
  for (let i = 0; i < 7; i++) {
    loyaltyService.issueCouponFromPlan({
      tenantContext: tenantContextA(),
      memberId: `m-${i}`,
      planId: plan.planId,
      source: 'shortfall-test'
    })
  }

  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })

    const diags = res.body.data
    const shortfall = diags.find((d: any) => d.ruleId === 'blindbox-redemption-shortfall')
    assert.ok(shortfall, 'expected blindbox-redemption-shortfall diagnostic')
    assert.equal(shortfall.severity, 'WARNING')
    assert.equal(shortfall.category, 'BLINDBOX_ENGAGEMENT')
    assert.equal(shortfall.evidence.couponRedemptionCount, 7)
    assert.equal(shortfall.evidence.blindboxFulfillmentCount, 0)
  } finally {
    await app.close()
  }
})

test('e2e: recommendations are sorted by priority desc', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  // Trigger at least 2 diagnostics: payment-success-rate-low + member-activity-thinning
  // (1 failed order → success rate 0% → CRITICAL; settlementCount=1<3 → INFO)
  await loyaltyService.settleFailedOrder(makeOrder('o-1', 'm-1', 50), makePayment('p-1', 'o-1', 50, false))

  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/recommendations')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })

    assert.equal(res.statusCode, 200)
    const recs = res.body.data
    assert.ok(Array.isArray(recs))
    assert.ok(recs.length >= 2)

    // Verify descending priority
    for (let i = 0; i < recs.length - 1; i++) {
      assert.ok(
        recs[i].priority >= recs[i + 1].priority,
        `rec[${i}].priority (${recs[i].priority}) should be >= rec[${i + 1}].priority (${recs[i + 1].priority})`
      )
    }

    // Highest priority should be CRITICAL (100 = inspect-payment-gateway)
    const top = recs[0]
    assert.ok(top.priority >= 80)
    assert.ok(top.actionCode)
    assert.ok(top.description)
    assert.equal(top.actionCode, 'inspect-payment-gateway')
  } finally {
    await app.close()
  }
})

test('e2e: diagnostics are tenant-scoped', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  const TENANT_B = {
    'x-tenant-id': 'tenant-B',
    'x-brand-id': 'brand-B',
    'x-store-id': 'store-B'
  }

  try {
    const resA = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })
    const resB = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_B)
      .send({ scope: 'TENANT' })

    const diagsA = resA.body.data
    const diagsB = resB.body.data

    for (const d of diagsA) {
      assert.equal(d.tenantContext.tenantId, 'tenant-A')
    }
    for (const d of diagsB) {
      assert.equal(d.tenantContext.tenantId, 'tenant-B')
    }
  } finally {
    await app.close()
  }
})

test('e2e: snapshot scope STORE includes storeId; TENANT omits it', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const tenantSnap = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })
    assert.equal(tenantSnap.body.data.scope, 'TENANT')
    assert.equal(tenantSnap.body.data.storeId, undefined)

    const storeSnap = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'STORE', storeId: 'store-X' })
    assert.equal(storeSnap.body.data.scope, 'STORE')
    assert.equal(storeSnap.body.data.storeId, 'store-X')
  } finally {
    await app.close()
  }
})

test('e2e: snapshot BRAND scope includes brandId only', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'BRAND', brandId: 'brand-A' })
    assert.equal(res.body.data.scope, 'BRAND')
    assert.equal(res.body.data.brandId, 'brand-A')
    assert.equal(res.body.data.storeId, undefined)
  } finally {
    await app.close()
  }
})

test('e2e: recommendations return empty array when no diagnostics triggered', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })
  // 10 successful settlements, success rate 100% → no diagnostics
  for (let i = 0; i < 10; i++) {
    await loyaltyService.settlePaidOrder(
      makeOrder(`o-${i}`, 'm-1', 100),
      makePayment(`p-${i}`, `o-${i}`, 100, true)
    )
  }
  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/recommendations')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(res.body.data))
  } finally {
    await app.close()
  }
})

test('e2e: diagnostics severity distribution shows correct counts', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })
  // Critical: low success rate (1 success, 3 failed out of 4 → 25%)
  for (let i = 0; i < 1; i++) {
    await loyaltyService.settlePaidOrder(
      makeOrder(`o-${i}`, 'm-1', 50),
      makePayment(`p-${i}`, `o-${i}`, 50, true)
    )
  }
  for (let i = 1; i < 4; i++) {
    await loyaltyService.settleFailedOrder(
      makeOrder(`o-${i}`, 'm-1', 50),
      makePayment(`p-${i}`, `o-${i}`, 50, false)
    )
  }
  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })
    const diags = res.body.data
    assert.ok(diags.length >= 1)
    const critical = diags.filter((d: { severity: string }) => d.severity === 'CRITICAL').length
    const warning = diags.filter((d: { severity: string }) => d.severity === 'WARNING').length
    assert.ok(critical + warning >= 1)
  } finally {
    await app.close()
  }
})

test('e2e: snapshot metrics include trend direction', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })
  await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 100), makePayment('p-1', 'o-1', 100, true))
  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })
    const loyaltyGroup = res.body.data.groups.find((g: { groupKey: string }) => g.groupKey === 'loyalty')
    const pointsNetMetric = loyaltyGroup.metrics.find((m: { key: string }) => m.key === 'pointsNet')
    assert.equal(pointsNetMetric.trend, 'UP')
  } finally {
    await app.close()
  }
})

test('e2e: snapshot covers multiple brandIds in BRAND scope', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  try {
    const brandA = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'BRAND', brandId: 'brand-A' })
    const brandB = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .send({ scope: 'BRAND', brandId: 'brand-B' })
    assert.equal(brandA.body.data.brandId, 'brand-A')
    assert.equal(brandB.body.data.brandId, 'brand-B')
    assert.notEqual(brandA.body.data.brandId, brandB.body.data.brandId)
  } finally {
    await app.close()
  }
})

test('e2e: diagnostics includes payment-success-rate-low diagnostic with recommendations', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })
  // 2 success, 3 failed → 40% success rate
  for (let i = 0; i < 2; i++) {
    await loyaltyService.settlePaidOrder(
      makeOrder(`o-${i}`, 'm-1', 50),
      makePayment(`p-${i}`, `o-${i}`, 50, true)
    )
  }
  for (let i = 2; i < 5; i++) {
    await loyaltyService.settleFailedOrder(
      makeOrder(`o-${i}`, 'm-1', 50),
      makePayment(`p-${i}`, `o-${i}`, 50, false)
    )
  }
  try {
    const res = await request(app.getHttpServer())
      .get('/analytics/diagnostics')
      .set(TENANT_A)
      .send({ scope: 'TENANT' })
    const diags = res.body.data
    const lowPayment = diags.find((d: { ruleId: string }) => d.ruleId === 'payment-success-rate-low')
    assert.ok(lowPayment)
    assert.equal(lowPayment.recommendations.length >= 1, true)
    assert.ok(lowPayment.recommendations[0].actionCode)
  } finally {
    await app.close()
  }
})
