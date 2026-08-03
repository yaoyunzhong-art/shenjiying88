import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-module #5 — Campaign → Loyalty → Analytics 闭环
 *
 * 链路:
 *   CampaignService(register + evaluate)
 *     → LoyaltyService(settlePaidOrder → coupon redemption)
 *       → AnalyticsService(snapshot + diagnostics)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe
} from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import { AnalyticsService } from '../analytics/analytics.service'
import { CampaignService } from '../campaign/campaign.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp, type BuiltCrossModuleTestApp } from './test-helpers'

@Controller('campaigns')
class TestCampaignController {
  constructor(@Inject(CampaignService) private readonly campaignService: CampaignService) {}

  @Post()
  register(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.registerCampaign({
      tenantContext: tc,
      code: body.code as string,
      title: body.title as string,
      description: body.description as string | undefined,
      triggerEvent: body.triggerEvent as unknown as import('../campaign/campaign.entity').CampaignTrigger,
      conditions: (body.conditions as unknown as Array<import('../campaign/campaign.entity').CampaignCondition>) ?? [],
      actions: body.actions as unknown as Array<import('../campaign/campaign.entity').CampaignAction>,
      priority: body.priority as number | undefined
    })
  }

  @Patch(':planId/status')
  updateStatus(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.updateCampaignStatus(planId, body.status as unknown as import('../campaign/campaign.entity').CampaignStatus, tc.tenantId)
  }

  @Post('evaluate')
  evaluate(@Body() body: Record<string, unknown>) {
    return this.campaignService.evaluateTriggers({
      eventName: body.eventName as string,
      tenantContext: body.tenantContext as RequestTenantContext,
      memberId: body.memberId as string,
      orderId: body.orderId as string | undefined,
      paymentId: body.paymentId as string | undefined,
      orderAmount: body.orderAmount as number | undefined,
      brandId: body.brandId as string | undefined,
      storeId: body.storeId as string | undefined,
      memberLevel: body.memberLevel as string | undefined
    })
  }
}

@Controller('loyalty')
class TestLoyaltyController {
  constructor(@Inject(LoyaltyService) private readonly loyaltyService: LoyaltyService) {}

  @Get('points-ledger')
  listPointsLedger(@Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.listPointsLedger(tc.tenantId)
  }

  @Get('coupon-redemptions')
  listCouponRedemptions(@Req() req: Request) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.listCouponRedemptions(tc.tenantId)
  }
}

@Controller('analytics')
class TestAnalyticsController {
  constructor(@Inject(AnalyticsService) private readonly analyticsService: AnalyticsService) {}

  @Get('snapshot')
  snapshot(@Req() req: Request, @Query() query: { scope: 'TENANT' | 'BRAND' | 'STORE'; brandId?: string; storeId?: string }) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsService.getOperationSnapshot(tc, { scope: query.scope as unknown as import('../analytics/analytics.entity').AnalyticsScope })
  }

  @Get('diagnostics')
  diagnostics(@Req() req: Request, @Query() query: { scope: 'TENANT' | 'BRAND' | 'STORE' }) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsService.getDiagnostics(tc, { scope: query.scope as unknown as import('../analytics/analytics.entity').AnalyticsScope })
  }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-A',
  'x-brand-id': 'brand-A',
  'x-store-id': 'store-A'
}

const TENANT_B = {
  'x-tenant-id': 'tenant-B',
  'x-brand-id': 'brand-B',
  'x-store-id': 'store-B'
}

function tenantContextA() {
  return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }
}

function makeOrder(orderId: string, memberId: string, amount: number) {
  return {
    orderId,
    memberId,
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    storeId: 'store-A',
    brandId: 'brand-A',
    totalAmount: amount,
    items: [],
    createdAt: '2026-06-22T00:00:00.000Z'
  } as unknown as import('../cashier/cashier.entity').CashierOrder
}

function makePayment(paymentId: string, orderId: string, amount: number, success: boolean) {
  return {
    paymentId,
    orderId,
    tenantId: 'tenant-A',
    memberId: 'm-1',
    storeId: 'store-A',
    brandId: 'brand-A',
    amount,
    success,
    method: 'WECHAT_PAY',
    createdAt: '2026-06-22T00:00:00.000Z'
  } as unknown as import('../cashier/cashier.entity').CashierPayment
}

async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  const campaignService = new CampaignService(memberService, loyaltyService)
  const analyticsService = new AnalyticsService(loyaltyService)

  const { app, moduleRef } = await buildCrossModuleTestApp({
    controllers: [TestCampaignController, TestLoyaltyController, TestAnalyticsController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: CampaignService, useValue: campaignService },
      { provide: AnalyticsService, useValue: analyticsService }
    ],
    extraGlobalPipes: [new ValidationPipe({ whitelist: true, transform: true })],
  })

  return { app, moduleRef, memberService, loyaltyService, campaignService, analyticsService }
}

it('e2e xm5: campaign AWARD_POINTS → loyalty settle → analytics snapshot reflects points', async () => {
  const { app, memberService, campaignService, loyaltyService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })

    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM5-POINTS',
        title: 'award points on payment',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'campaign-bonus' } }]
      })
    assert.equal(plan.statusCode, 201)
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const evalRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'o-1',
        paymentId: 'p-1'
      })
    assert.equal(evalRes.body.data.dispatchedActions, 1)

    await loyaltyService.settlePaidOrder(makeOrder('o-1', 'm-1', 100), makePayment('p-1', 'o-1', 100, true))

    const snapshot = await request(app.getHttpServer())
      .get('/analytics/snapshot?scope=TENANT')
      .set(TENANT_A)
    const loyaltyGroup = snapshot.body.data.groups.find((g: { groupKey: string }) => g.groupKey === 'loyalty')
    assert.ok(loyaltyGroup)
    const pointsInMetric = loyaltyGroup.metrics.find((m: { key: string }) => m.key === 'pointsIn')
    assert.ok(pointsInMetric.value > 0)
  } finally {
    await app.close()
  }
})

it('e2e xm5: cross-tenant — analytics reflects tenant isolation', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })
    await loyaltyService.settlePaidOrder(makeOrder('o-a', 'm-1', 50), makePayment('p-a', 'o-a', 50, true))

    const snapA = await request(app.getHttpServer())
      .get('/analytics/snapshot?scope=TENANT')
      .set(TENANT_A)
    const snapB = await request(app.getHttpServer())
      .get('/analytics/snapshot?scope=TENANT')
      .set(TENANT_B)

    const ordersA = snapA.body.data.groups.find((g: { groupKey: string }) => g.groupKey === 'orders')
    const ordersB = snapB.body.data.groups.find((g: { groupKey: string }) => g.groupKey === 'orders')
    const aCount = ordersA.metrics.find((m: { key: string }) => m.key === 'settlementCount').value
    const bCount = ordersB.metrics.find((m: { key: string }) => m.key === 'settlementCount').value
    assert.equal(aCount, 1)
    assert.equal(bCount, 0)
  } finally {
    await app.close()
  }
})

it('e2e xm5: coupon issued via loyalty service is counted in analytics couponRedemptionCount', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })
    const couponPlan = loyaltyService.registerCouponPlan({
      tenantContext: tenantContextA(),
      code: 'XM5-COUPON',
      title: 'coupon for xm5',
      discountType: 'FIXED_AMOUNT' as unknown as import('../loyalty/loyalty.entity').CouponDiscountType,
      discountValue: 20,
      totalQuota: 100,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    loyaltyService.updateCouponPlanStatus(couponPlan.planId, 'ACTIVE' as unknown as import('../loyalty/loyalty.entity').LoyaltyPlanStatus, 'tenant-A')
    await loyaltyService.issueCouponFromPlan({
      tenantContext: tenantContextA(),
      memberId: 'm-1',
      planId: couponPlan.planId,
      source: 'campaign'
    })

    const snap = await request(app.getHttpServer())
      .get('/analytics/snapshot?scope=TENANT')
      .set(TENANT_A)
    const couponCount = snap.body.data.groups
      .find((g: { groupKey: string }) => g.groupKey === 'orders')
      .metrics.find((m: { key: string }) => m.key === 'couponRedemptionCount').value
    assert.equal(couponCount, 1)
  } finally {
    await app.close()
  }
})

it('e2e xm5: high payment failure rate → analytics diagnostics CRITICAL', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })
    for (let i = 0; i < 1; i++) {
      await loyaltyService.settlePaidOrder(
        makeOrder(`o-${i}`, 'm-1', 100),
        makePayment(`p-${i}`, `o-${i}`, 100, true)
      )
    }
    for (let i = 1; i < 5; i++) {
      await loyaltyService.settleFailedOrder(
        makeOrder(`o-${i}`, 'm-1', 100),
        makePayment(`p-${i}`, `o-${i}`, 100, false)
      )
    }

    const res = await request(app.getHttpServer())
      .get('/analytics/diagnostics?scope=TENANT')
      .set(TENANT_A)
    const critical = res.body.data.filter((d: { severity: string }) => d.severity === 'CRITICAL')
    assert.ok(critical.length >= 1)
    const lowSuccess = critical.find((d: { ruleId: string }) => d.ruleId === 'payment-success-rate-low')
    assert.ok(lowSuccess)
    assert.ok(lowSuccess.recommendations.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e xm5: campaign triggers respect brand scope', async () => {
  const { app, memberService, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })

    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM5-BRAND-A',
        title: 'brand A only',
        triggerEvent: 'payment.success',
        conditions: [{ type: 'BRAND_SCOPE', value: ['brand-A'] }],
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'a' } }]
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const matchA = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'o-brand-A',
        brandId: 'brand-A'
      })
    assert.equal(matchA.body.data.matchedCampaigns, 1)

    const matchB = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-B', storeId: 'store-A', marketCode: 'cn-mainland' },
        memberId: 'm-1',
        orderId: 'o-brand-B',
        brandId: 'brand-B'
      })
    assert.equal(matchB.body.data.matchedCampaigns, 0)
  } finally {
    await app.close()
  }
})

it('e2e xm5: idempotency — duplicate evaluate with same planId+memberId+orderId skips', async () => {
  const { app, memberService, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM5-IDEM',
        title: 'idempotency test',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'idem' } }]
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const payload = {
      eventName: 'payment.success',
      tenantContext: tenantContextA(),
      memberId: 'm-1',
      orderId: 'o-idem'
    }
    const first = await request(app.getHttpServer()).post('/campaigns/evaluate').send(payload)
    const second = await request(app.getHttpServer()).post('/campaigns/evaluate').send(payload)
    assert.equal(first.body.data.dispatchedActions, 1)
    assert.equal(second.body.data.dispatchedActions, 0)
    assert.equal(second.body.data.skippedActions, 1)
  } finally {
    await app.close()
  }
})

it('e2e xm5: analytics totals align with loyalty settlements', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })
    for (let i = 0; i < 5; i++) {
      await loyaltyService.settlePaidOrder(
        makeOrder(`o-${i}`, 'm-1', 100),
        makePayment(`p-${i}`, `o-${i}`, 100, true)
      )
    }

    const snap = await request(app.getHttpServer())
      .get('/analytics/snapshot?scope=TENANT')
      .set(TENANT_A)
    const totals = snap.body.data.totals
    const settlementTotal = totals.find((m: { key: string }) => m.key === 'totalSettlements')
    assert.equal(settlementTotal.value, 5)
  } finally {
    await app.close()
  }
})

it('e2e xm5: campaign inactive status does not dispatch', async () => {
  const { app, memberService, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    memberService.register({ memberId: 'm-1', tenantContext: tenantContextA(), nickname: 'Alice' })
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM5-DRAFT',
        title: 'still draft',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'draft' } }]
      })
    assert.equal(plan.body.data.status, 'DRAFT')

    const evalRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'o-draft'
      })
    assert.equal(evalRes.body.data.matchedCampaigns, 0)
  } finally {
    await app.close()
  }
})
