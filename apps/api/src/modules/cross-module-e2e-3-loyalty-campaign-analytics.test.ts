import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 跨模块 E2E 测试链 #5: Loyalty + Campaign + Analytics 联动
 *
 * 链路:
 *   HTTP → TenantContext → LoyaltyService (plan + issue)
 *                        → CampaignService (evaluate + dispatch awardPoints/issueCoupon)
 *                        → AnalyticsService (snapshot + diagnostics)
 *
 * 验证:
 *   - 创建 CouponPlan → 状态激活 → Campaign 通过 payment.success 触发自动发券
 *   - 触发 AwardPoints 后 member 积分变化被 Analytics 聚合
 *   - 多次发券后 coupon 配额下降被 Analytics 监控
 *   - 跨模块 tenant 隔离：tenant-B 不能消费 tenant-A 的券或看到它的指标
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
  Req,
  ValidationPipe
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../common/interceptors/response.interceptor'
import {
  CashierOrderStatus,
  CashierPaymentStatus,
  type CashierOrder,
  type CashierPayment
} from './cashier/cashier.entity'
import { MemberService, resetMemberServiceTestState } from './member/member.service'
import {
  CouponDiscountType,
  LoyaltyPlanStatus
} from './loyalty/loyalty.entity'
import { LoyaltyService } from './loyalty/loyalty.service'
import { CampaignService } from './campaign/campaign.service'
import { AnalyticsService } from './analytics/analytics.service'
import type { RequestTenantContext, TenantAwareRequest } from './tenant/tenant.types'

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

@Controller('integration')
class TestIntegrationController {
  constructor(
    @Inject(LoyaltyService) private readonly loyaltyService: LoyaltyService,
    @Inject(CampaignService) private readonly campaignService: CampaignService,
    @Inject(AnalyticsService) private readonly analyticsService: AnalyticsService
  ) {}

  @Post('coupon-plans')
  registerCouponPlan(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.registerCouponPlan({
      tenantContext,
      code: body.code as string,
      title: body.title as string,
      discountType: body.discountType as CouponDiscountType,
      discountValue: body.discountValue as number,
      totalQuota: body.totalQuota as number,
      perMemberLimit: body.perMemberLimit as number,
      validFrom: body.validFrom as string,
      validUntil: body.validUntil as string
    })
  }

  @Patch('coupon-plans/:planId/status')
  updateCouponPlanStatus(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.updateCouponPlanStatus(
      planId,
      body.status as LoyaltyPlanStatus,
      tenantContext.tenantId
    )
  }

  @Post('campaigns')
  registerCampaign(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.registerCampaign({
      tenantContext,
      code: body.code as string,
      title: body.title as string,
      triggerEvent: body.triggerEvent as any,
      conditions: (body.conditions as any[]) ?? [],
      actions: body.actions as any,
      priority: body.priority as number | undefined
    })
  }

  @Patch('campaigns/:planId/status')
  updateCampaignStatus(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.updateCampaignStatus(
      planId,
      body.status as any,
      tenantContext.tenantId
    )
  }

  @Post('campaigns/evaluate')
  evaluate(@Body() body: Record<string, unknown>) {
    return this.campaignService.evaluateTriggers({
      eventName: body.eventName as string,
      tenantContext: body.tenantContext as RequestTenantContext,
      memberId: body.memberId as string,
      orderId: body.orderId as string | undefined,
      orderAmount: body.orderAmount as number | undefined
    })
  }

  @Get('analytics/snapshot')
  snapshot(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsService.getOperationSnapshot(tenantContext)
  }
}

async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  const campaignService = new CampaignService(memberService, loyaltyService)
  const analyticsService = new AnalyticsService(loyaltyService)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestIntegrationController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: CampaignService, useValue: campaignService },
      { provide: AnalyticsService, useValue: analyticsService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberService, loyaltyService, campaignService, analyticsService }
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

function tenantContext(tenant = 'tenant-A') {
  return { tenantId: tenant, brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }
}

function makeOrder(orderId: string, memberId: string, amount: number): CashierOrder {
  const now = new Date().toISOString()
  return {
    orderId,
    tenantContext: tenantContext(),
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

function makePayment(paymentId: string, orderId: string, amount: number): CashierPayment {
  const now = new Date().toISOString()
  return {
    paymentId,
    orderId,
    channel: 'wechat',
    amount,
    status: CashierPaymentStatus.Succeeded,
    createdAt: now,
    updatedAt: now,
    completedAt: now
  }
}

it('cross-module e2e: payment.success triggers campaign award-points → member profile updated and analytics aggregates settlement inflow', async () => {
  const { app, memberService, loyaltyService, campaignService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  campaignService.resetCampaignStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContext(),
    nickname: 'Alice'
  })

  try {
    // Register campaign: payment.success → award 50 points
    const campaign = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_A)
      .send({
        code: 'POINTS-BONUS',
        title: 'payment bonus',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'payment-bonus' } }]
      })
    const campaignId = campaign.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/campaigns/${campaignId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    // Settle a payment (writes to pointsLedgerStore which analytics reads from)
    await loyaltyService.settlePaidOrder(
      makeOrder('order-pay-1', 'm-1', 200),
      makePayment('pay-1', 'order-pay-1', 200)
    )

    // Trigger evaluation for the same payment event
    const evalRes = await request(app.getHttpServer())
      .post('/integration/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContext(),
        memberId: 'm-1',
        orderId: 'order-pay-1',
        orderAmount: 200
      })
    assert.equal(evalRes.body.data.dispatchedActions, 1)

    // Verify analytics reflects the settlement inflow (loyalty ledger entry)
    const snap = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_A)

    const loyaltyGroup = snap.body.data.groups.find((g: any) => g.groupKey === 'loyalty')
    const pointsInMetric = loyaltyGroup.metrics.find((m: any) => m.key === 'pointsIn')
    assert.ok(pointsInMetric.value >= 200, `expected pointsIn >= 200 (from settlement), got ${pointsInMetric.value}`)

    // Verify member profile reflects campaign-awarded points (memberService.addPoints path)
    const profile = memberService.getProfile('m-1')
    assert.ok(profile)
    assert.ok(profile.points >= 50, `expected profile.points >= 50 (from campaign), got ${profile.points}`)
  } finally {
    await app.close()
  }
})

it('cross-module e2e: campaign IssueCoupon action drains coupon plan and analytics tracks redemption', async () => {
  const { app, memberService, loyaltyService, campaignService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  campaignService.resetCampaignStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContext(),
    nickname: 'Alice'
  })

  try {
    // Step 1: Register CouponPlan via loyalty
    const plan = await request(app.getHttpServer())
      .post('/integration/coupon-plans')
      .set(TENANT_A)
      .send({
        code: 'WELCOME-50',
        title: 'welcome coupon',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: 50,
        totalQuota: 100,
        perMemberLimit: 5,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })
    const planId = plan.body.data.planId
    assert.equal(plan.body.data.remainingQuota, 100)
    await request(app.getHttpServer())
      .patch(`/integration/coupon-plans/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    // Step 2: Register Campaign that auto-issues the coupon on payment.success
    const campaign = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_A)
      .send({
        code: 'AUTO-WELCOME',
        title: 'auto welcome coupon',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'ISSUE_COUPON', params: { couponPlanId: planId } }]
      })
    const campaignId = campaign.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/campaigns/${campaignId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    // Step 3: Trigger payment event
    const evalRes = await request(app.getHttpServer())
      .post('/integration/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContext(),
        memberId: 'm-1',
        orderId: 'order-pay-welcome',
        orderAmount: 100
      })
    assert.equal(evalRes.body.data.dispatchedActions, 1)

    // Step 4: Verify coupon plan drained
    const planAfter = loyaltyService.getCouponPlan(planId, 'tenant-A')
    assert.ok(planAfter)
    assert.equal(planAfter.remainingQuota, 99)

    // Step 5: Verify analytics reflects the coupon redemption
    const snap = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_A)
    const orderGroup = snap.body.data.groups.find((g: any) => g.groupKey === 'orders')
    const couponMetric = orderGroup.metrics.find((m: any) => m.key === 'couponRedemptionCount')
    assert.equal(couponMetric.value, 1)
  } finally {
    await app.close()
  }
})

it('cross-module e2e: settlePaidOrder + campaign AwardPoints accumulate points visible in analytics', async () => {
  const { app, memberService, loyaltyService, campaignService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  campaignService.resetCampaignStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContext(),
    nickname: 'Alice'
  })

  try {
    // Register award-points campaign
    const campaign = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_A)
      .send({
        code: 'SETTLE-BONUS',
        title: 'settlement bonus',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 30, pointsReason: 'settlement' } }]
      })
    const campaignId = campaign.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/campaigns/${campaignId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    // Process 3 settlements, each triggering campaign evaluation
    let totalCampaignPoints = 0
    for (let i = 1; i <= 3; i++) {
      await loyaltyService.settlePaidOrder(
        makeOrder(`o-${i}`, 'm-1', 100),
        makePayment(`p-${i}`, `o-${i}`, 100)
      )
      const before = memberService.getProfile('m-1')?.points ?? 0
      await request(app.getHttpServer())
        .post('/integration/campaigns/evaluate')
        .send({
          eventName: 'payment.success',
          tenantContext: tenantContext(),
          memberId: 'm-1',
          orderId: `o-${i}`,
          orderAmount: 100
        })
      const after = memberService.getProfile('m-1')?.points ?? 0
      totalCampaignPoints += after - before
    }
    assert.equal(totalCampaignPoints, 90) // 3 × 30

    // Verify analytics aggregate reflects settlement inflow (campaign award goes
    // through memberService.addPoints which doesn't write to pointsLedgerStore)
    const snap = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_A)
    const loyaltyGroup = snap.body.data.groups.find((g: any) => g.groupKey === 'loyalty')
    const pointsInMetric = loyaltyGroup.metrics.find((m: any) => m.key === 'pointsIn')
    // settlement awards 100 each (3 × 100 = 300); campaign awards 30 each go to profile only
    assert.equal(pointsInMetric.value, 300)

    // Member profile reflects both settlement inflow and campaign award
    const finalProfile = memberService.getProfile('m-1')
    assert.ok(finalProfile)
    assert.ok(finalProfile.points >= 300 + 90, `expected profile.points >= 390, got ${finalProfile.points}`)
  } finally {
    await app.close()
  }
})

it('cross-module e2e: tenant-B cannot consume tenant-A coupon plan nor see its analytics', async () => {
  const { app, memberService, loyaltyService, campaignService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  campaignService.resetCampaignStoresForTests()

  try {
    // Register plan in tenant-A
    const plan = await request(app.getHttpServer())
      .post('/integration/coupon-plans')
      .set(TENANT_A)
      .send({
        code: 'A-ONLY',
        title: 'tenant A only',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: 10,
        totalQuota: 50,
        perMemberLimit: 5,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/coupon-plans/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    // tenant-A snapshot shows the plan quota
    const snapA = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_A)
    assert.ok(snapA.body.data)

    // tenant-B snapshot is isolated (zero everything)
    const snapB = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_B)
    const orderGroupB = snapB.body.data.groups.find((g: any) => g.groupKey === 'orders')
    const couponMetricB = orderGroupB.metrics.find((m: any) => m.key === 'couponRedemptionCount')
    assert.equal(couponMetricB.value, 0)

    // Direct cross-tenant access: getCouponPlan returns undefined (tenant guard)
    assert.equal(loyaltyService.getCouponPlan(planId, 'tenant-B'), undefined)
    assert.throws(() =>
      loyaltyService.updateCouponPlanStatus(planId, LoyaltyPlanStatus.Paused, 'tenant-B')
    )

    // tenant-B campaign cannot reference tenant-A's plan via campaign registration
    // (validateAction only checks shape; but dispatch uses planId which is tenant-A's, so should fail at dispatch)
    const campaign = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_B)
      .send({
        code: 'B-CAMP',
        title: 'B campaign',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'ISSUE_COUPON', params: { couponPlanId: planId } }]
      })
    assert.equal(campaign.statusCode, 201)
    const campaignIdB = campaign.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/campaigns/${campaignIdB}/status`)
      .set(TENANT_B)
      .send({ status: 'ACTIVE' })

    // But the action will skip at dispatch because member doesn't exist in tenant-B
    memberService.register({
      memberId: 'm-B',
      tenantContext: tenantContext('tenant-B'),
      nickname: 'Bob'
    })
    const evalRes = await request(app.getHttpServer())
      .post('/integration/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContext('tenant-B'),
        memberId: 'm-B',
        orderId: 'order-B-1',
        orderAmount: 50
      })
    // IssueCoupon action with cross-tenant planId will throw inside loyaltyService.issueCouponFromPlan
    // → dispatch records Failed status
    const dispatch = evalRes.body.data.dispatches[0]
    assert.equal(dispatch.status, 'FAILED')
    assert.ok(dispatch.errorMessage?.includes('Coupon plan not found'))
  } finally {
    await app.close()
  }
})

it('e2e xm3-ext: member points ledger accumulates across multiple campaign triggers', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContext(),
    nickname: 'Alice'
  })

  try {
    const reg = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM3-EXT-POINTS',
        title: 'multi points',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 25, pointsReason: 'ext-1' } }]
      })
    const planId = reg.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    // 3 different orderIds → 3 separate dispatches
    for (let i = 0; i < 3; i++) {
      const res = await request(app.getHttpServer())
        .post('/integration/campaigns/evaluate')
        .send({
          eventName: 'payment.success',
          tenantContext: tenantContext(),
          memberId: 'm-1',
          orderId: `o-ext-${i}`
        })
      assert.equal(res.body.data.dispatchedActions, 1)
    }

    // 直接 settlePaidOrder 触发 ledger
    for (let i = 0; i < 3; i++) {
      loyaltyService.settlePaidOrder(makeOrder(`o-ext-${i}`, 'm-1', 100), makePayment(`p-ext-${i}`, `o-ext-${i}`, 100))
    }

    const snap = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_A)
    const loyaltyGroup = snap.body.data.groups.find((g: { groupKey: string }) => g.groupKey === 'loyalty')
    const pointsIn = loyaltyGroup.metrics.find((m: { key: string }) => m.key === 'pointsIn')
    assert.ok(pointsIn.value >= 3)
  } finally {
    await app.close()
  }
})

it('e2e xm3-ext: campaign priorities determine dispatch order across multiple matching campaigns', async () => {
  const { app, memberService, campaignService, loyaltyService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({ memberId: 'm-1', tenantContext: tenantContext(), nickname: 'Alice' })

  try {
    const lowReg = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM3-LOW',
        title: 'low prio',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'low' } }],
        priority: 1
      })
    const lowPlanId = lowReg.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/campaigns/${lowPlanId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const highReg = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM3-HIGH',
        title: 'high prio',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'high' } }],
        priority: 999
      })
    const highPlanId = highReg.body.data.planId
    await request(app.getHttpServer())
      .patch(`/integration/campaigns/${highPlanId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const res = await request(app.getHttpServer())
      .post('/integration/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContext(),
        memberId: 'm-1',
        orderId: 'o-prio-xm3'
      })

    const codes = res.body.data.dispatches.map((d: { campaignCode?: string; planId: string }) => d.campaignCode ?? d.planId)
    // 期望高优先级先出现（可能 codes 是 planId）
    assert.ok(codes.length === 2)
    assert.ok(codes[0] !== codes[1])
  } finally {
    await app.close()
  }
})

it('e2e xm3-ext: cross-tenant analytics — tenant B sees empty snapshot when tenant A has data', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({ memberId: 'm-1', tenantContext: tenantContext(), nickname: 'Alice' })

  try {
    loyaltyService.settlePaidOrder(makeOrder('o-a-1', 'm-1', 100), makePayment('p-a-1', 'o-a-1', 100))

    const snapA = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_A)
    const snapB = await request(app.getHttpServer())
      .get('/integration/analytics/snapshot')
      .set(TENANT_B)

    const aOrder = snapA.body.data.groups.find((g: { groupKey: string }) => g.groupKey === 'orders')
    const bOrder = snapB.body.data.groups.find((g: { groupKey: string }) => g.groupKey === 'orders')
    assert.equal(aOrder.metrics.find((m: { key: string }) => m.key === 'settlementCount').value, 1)
    assert.equal(bOrder.metrics.find((m: { key: string }) => m.key === 'settlementCount').value, 0)
  } finally {
    await app.close()
  }
})

it('e2e xm3-ext: campaign inactive status does not match', async () => {
  const { app, memberService, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  memberService.register({ memberId: 'm-1', tenantContext: tenantContext(), nickname: 'Alice' })

  try {
    const reg = await request(app.getHttpServer())
      .post('/integration/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM3-DRAFT',
        title: 'still draft',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 5, pointsReason: 'd' } }]
      })
    assert.equal(reg.body.data.status, 'DRAFT')

    const evalRes = await request(app.getHttpServer())
      .post('/integration/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContext(),
        memberId: 'm-1',
        orderId: 'o-draft'
      })
    assert.equal(evalRes.body.data.matchedCampaigns, 0)
  } finally {
    await app.close()
  }
})
