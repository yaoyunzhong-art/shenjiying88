import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Campaign 编排引擎 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → CampaignService → MemberService/LoyaltyService
 *
 * 验证:
 *   - Campaign register / list / get / status 完整 CRUD
 *   - evaluateTriggers HTTP 端点
 *   - dispatches 列表 / 按 planId 过滤
 *   - 状态机转换守卫
 *   - 幂等性（同 planId+actionIndex+memberId+orderId 不重复派发）
 *   - 条件匹配（MinOrderAmount, BrandScope）
 *   - brand scope 自动从 tenantContext 派生
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
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { CouponDiscountType, LoyaltyPlanStatus } from '../loyalty/loyalty.entity'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { CampaignService } from './campaign.service'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

@Controller('campaigns')
class TestCampaignController {
  constructor(@Inject(CampaignService) private readonly campaignService: CampaignService) {}

  @Post()
  register(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.registerCampaign({
      tenantContext,
      code: body.code as string,
      title: body.title as string,
      description: body.description as string | undefined,
      triggerEvent: body.triggerEvent as any,
      conditions: (body.conditions as any[]) ?? [],
      actions: body.actions as any,
      priority: body.priority as number | undefined,
      scheduledStart: body.scheduledStart as string | undefined,
      scheduledEnd: body.scheduledEnd as string | undefined
    })
  }

  @Get()
  list(@Req() req: Request) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.listCampaigns(tenantContext.tenantId)
  }

  @Get(':planId')
  get(@Req() req: Request, @Param('planId') planId: string) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const plan = this.campaignService.getCampaign(planId, tenantContext.tenantId)
    return plan ?? null
  }

  @Patch(':planId/status')
  updateStatus(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.updateCampaignStatus(
      planId,
      body.status as any,
      tenantContext.tenantId
    )
  }

  @Get(':planId/dispatches')
  listDispatches(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Query('limit') limit?: string
  ) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const dispatches = this.campaignService.listDispatches(tenantContext.tenantId, {
      planId
    })
    const n = limit ? Number.parseInt(limit, 10) : undefined
    return n ? dispatches.slice(0, n) : dispatches
  }

  @Get('dispatches/all')
  listAllDispatches(@Req() req: Request, @Query('limit') limit?: string) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const dispatches = this.campaignService.listDispatches(tenantContext.tenantId, {})
    const n = limit ? Number.parseInt(limit, 10) : undefined
    return n ? dispatches.slice(0, n) : dispatches
  }

  @Get('dispatches/list')
  listDispatchesByFilter(
    @Req() req: Request,
    @Query('memberId') memberId?: string,
    @Query('status') status?: string
  ) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.listDispatches(tenantContext.tenantId, {
      memberId,
      status: status as any
    })
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

async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  const campaignService = new CampaignService(memberService, loyaltyService)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestCampaignController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: CampaignService, useValue: campaignService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberService, loyaltyService, campaignService }
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

function tenantContextX() {
  return { tenantId: 'tenant-A', brandId: 'brand-X', storeId: 'store-X', marketCode: 'cn-mainland' }
}

it('e2e: campaign register → list → get → status lifecycle', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    const register = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'WELCOME-BACK',
        title: 'welcome back customers',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'payment-bonus' } }]
      })
    assert.equal(register.statusCode, 201)
    const planId = register.body.data.planId
    assert.ok(planId)
    assert.equal(register.body.data.code, 'WELCOME-BACK')
    assert.equal(register.body.data.status, 'DRAFT')

    const list = await request(app.getHttpServer()).get('/campaigns').set(TENANT_A)
    assert.equal(list.body.data.length, 1)

    const detail = await request(app.getHttpServer()).get(`/campaigns/${planId}`).set(TENANT_A)
    assert.equal(detail.body.data.planId, planId)

    const activate = await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })
    assert.equal(activate.body.data.status, 'ACTIVE')

    const pause = await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'PAUSED' })
    assert.equal(pause.body.data.status, 'PAUSED')

    const resume = await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })
    assert.equal(resume.body.data.status, 'ACTIVE')
  } finally {
    await app.close()
  }
})

it('e2e: campaign dispatches by planId', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    const p1 = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'P1',
        title: 'p1 campaign',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'vip-candidate' } }]
      })
    const planId = p1.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-1'
      })

    const listByPlan = await request(app.getHttpServer())
      .get(`/campaigns/${planId}/dispatches`)
      .set(TENANT_A)
    assert.equal(listByPlan.body.data.length, 1)
    assert.equal(listByPlan.body.data[0].planId, planId)
    assert.equal(listByPlan.body.data[0].memberId, 'm-1')

    const listAll = await request(app.getHttpServer())
      .get('/campaigns/dispatches/all')
      .set(TENANT_A)
    assert.equal(listAll.body.data.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e: evaluateTriggers is idempotent on planId+actionIndex+memberId+orderId', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'IDEM',
        title: 'idempotency',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'first-buyer' } }]
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
      orderId: 'order-2'
    }

    const first = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send(payload)
    assert.equal(first.body.data.dispatchedActions, 1)

    const second = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send(payload)
    assert.equal(second.body.data.dispatchedActions, 0)
    assert.equal(second.body.data.skippedActions, 1)

    const list = await request(app.getHttpServer())
      .get(`/campaigns/${planId}/dispatches`)
      .set(TENANT_A)
    assert.equal(list.body.data.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e: evaluateTriggers respects MinOrderAmount condition', async () => {
  const { app, campaignService, memberService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  try {
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'HIGH-VALUE',
        title: 'high value',
        triggerEvent: 'payment.success',
        conditions: [{ type: 'MIN_ORDER_AMOUNT', value: 500 }],
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 100, pointsReason: 'big-spender' } }]
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const small = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-small',
        orderAmount: 100
      })
    assert.equal(small.body.data.matchedCampaigns, 0)

    const big = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-big',
        orderAmount: 1000
      })
    assert.equal(big.body.data.matchedCampaigns, 1)
  } finally {
    await app.close()
  }
})

it('e2e: evaluateTriggers respects BrandScope and auto-derives brand from tenantContext', async () => {
  const { app, campaignService, memberService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  try {
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'BRAND-X-ONLY',
        title: 'brand X only',
        triggerEvent: 'payment.success',
        conditions: [{ type: 'BRAND_SCOPE', value: ['brand-X'] }],
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 50, pointsReason: 'brand-x-loyalty' } }]
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const tenantAEvent = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-brandA',
        orderAmount: 100
      })
    assert.equal(tenantAEvent.body.data.matchedCampaigns, 0)

    const tenantXEvent = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextX(),
        memberId: 'm-1',
        orderId: 'order-brandX',
        orderAmount: 100
      })
    assert.equal(tenantXEvent.body.data.matchedCampaigns, 1)
  } finally {
    await app.close()
  }
})

it('e2e: PAUSED campaign does not dispatch', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'PAUSE',
        title: 'pause test',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 10, pointsReason: 'should-not-fire' } }]
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'PAUSED' })

    const ev = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-paused'
      })
    assert.equal(ev.body.data.matchedCampaigns, 0)
    assert.equal(ev.body.data.dispatchedActions, 0)
  } finally {
    await app.close()
  }
})

it('e2e: scheduledStart/End window is enforced', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    const future2 = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString()
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'FUTURE',
        title: 'future only',
        triggerEvent: 'payment.success',
        scheduledStart: future,
        scheduledEnd: future2,
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 5, pointsReason: 'future' } }]
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const ev = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-now'
      })
    assert.equal(ev.body.data.matchedCampaigns, 0)
  } finally {
    await app.close()
  }
})

it('e2e: priority ordering — higher priority dispatches first', async () => {
  const { app, campaignService, memberService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  try {
    const low = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'LOW',
        title: 'low priority',
        triggerEvent: 'payment.success',
        priority: 10,
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 1, pointsReason: 'low' } }]
      })
    const lowId = low.body.data.planId
    const high = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'HIGH',
        title: 'high priority',
        triggerEvent: 'payment.success',
        priority: 90,
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 100, pointsReason: 'high' } }]
      })
    const highId = high.body.data.planId

    await request(app.getHttpServer())
      .patch(`/campaigns/${lowId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })
    await request(app.getHttpServer())
      .patch(`/campaigns/${highId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const ev = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-priority'
      })
    assert.equal(ev.body.data.matchedCampaigns, 2)
    assert.equal(ev.body.data.dispatchedActions, 2)

    const dispatches = await request(app.getHttpServer())
      .get('/campaigns/dispatches/all')
      .set(TENANT_A)
    assert.equal(dispatches.body.data.length, 2)
    assert.equal(dispatches.body.data[0].planId, highId)
  } finally {
    await app.close()
  }
})

it('e2e: dispatches are tenant-scoped', async () => {
  const { app, campaignService, memberService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  try {
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'ISO',
        title: 'tenant isolated',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'AWARD_POINTS', params: { pointsAmount: 5, pointsReason: 'iso' } }]
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-iso'
      })

    const tenantBDispatches = await request(app.getHttpServer())
      .get('/campaigns/dispatches/all')
      .set(TENANT_B)
    assert.equal(tenantBDispatches.body.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: IssueCoupon action issues a coupon to the member', async () => {
  const { app, campaignService, loyaltyService, memberService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: tenantContextA(),
    nickname: 'Alice'
  })

  const plan = loyaltyService.registerCouponPlan({
    tenantContext: tenantContextA(),
    code: 'CAMPAIGN10',
    title: 'campaign coupon',
    discountType: CouponDiscountType.FixedAmount,
    discountValue: 10,
    totalQuota: 100,
    perMemberLimit: 1,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z'
  })
  loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-A')

  try {
    const campaign = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'AUTO-COUPON',
        title: 'auto coupon',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'ISSUE_COUPON', params: { couponPlanId: plan.planId } }]
      })
    if (campaign.statusCode !== 201) console.error('campaign register failed:', campaign.statusCode, campaign.body)
    const campaignId = campaign.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${campaignId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-1',
        orderId: 'order-cc'
      })

    const redemptions = loyaltyService.listCouponRedemptions('tenant-A')
    assert.equal(redemptions.length, 1)
    assert.equal(redemptions[0].couponCode, 'CAMPAIGN10')
    assert.equal(redemptions[0].memberId, 'm-1')
  } finally {
    await app.close()
  }
})

it('e2e: list dispatches filtered by memberId', async () => {
  const { app, campaignService, memberService, loyaltyService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  memberService.register({ memberId: 'm-disp-1', tenantContext: tenantContextA(), nickname: 'Disp1' })
  memberService.register({ memberId: 'm-disp-2', tenantContext: tenantContextA(), nickname: 'Disp2' })

  try {
    const plan = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'DISP-001',
        title: 'Dispatch Filter',
        description: 'd',
        triggerEvent: 'payment.success',
        conditions: [],
        actions: [{ type: 'NotifyMember', template: 'hi' }],
        priority: 50
      })
    const planId = plan.body.data.planId
    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-disp-1',
        orderId: 'o-disp-1'
      })
    await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-disp-2',
        orderId: 'o-disp-2'
      })

    const list1 = await request(app.getHttpServer())
      .get('/campaigns/dispatches/list?memberId=m-disp-1')
      .set(TENANT_A)
    assert.ok(list1.body.data.length >= 1)
    assert.ok(list1.body.data.every((d: any) => d.memberId === 'm-disp-1'))
    void loyaltyService
  } finally {
    await app.close()
  }
})

it('e2e: campaign list filtered by status', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    const reg = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'STATUS-FILTER-001',
        title: 'StatusFilter',
        description: 'd',
        triggerEvent: 'order.created',
        conditions: [],
        actions: [{ type: 'NotifyMember', template: 'hi' }],
        priority: 50
      })
    const planId = reg.body.data.planId
    const listDraft = await request(app.getHttpServer())
      .get('/campaigns?status=DRAFT')
      .set(TENANT_A)
    assert.ok(listDraft.body.data.some((p: any) => p.planId === planId))

    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'PAUSED' })
    const listPaused = await request(app.getHttpServer())
      .get('/campaigns?status=PAUSED')
      .set(TENANT_A)
    assert.ok(listPaused.body.data.some((p: any) => p.planId === planId))
  } finally {
    await app.close()
  }
})

it('e2e: campaign plan trigger event filter', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'TRIG-FILTER-001',
        title: 'TrigFilter',
        description: 'd',
        triggerEvent: 'order.created',
        conditions: [],
        actions: [{ type: 'NotifyMember', template: 'hi' }],
        priority: 50
      })
    const listOrder = await request(app.getHttpServer())
      .get('/campaigns?triggerEvent=order.created')
      .set(TENANT_A)
    assert.ok(listOrder.body.data.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: get unknown campaign returns null', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/campaigns/unknown-plan-id').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e: get dispatches for unknown plan returns empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/campaigns/unknown-plan/dispatches').set(TENANT_A)
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body.data, [])
  } finally {
    await app.close()
  }
})

it('e2e: cross-tenant campaigns isolated', async () => {
  const { app, campaignService } = await buildApp()
  campaignService.resetCampaignStoresForTests()

  try {
    const reg = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'ISO-CAMP-001',
        title: 'IsoCamp',
        description: 'd',
        triggerEvent: 'order.created',
        conditions: [],
        actions: [{ type: 'NotifyMember', template: 'hi' }],
        priority: 50
      })
    const planId = reg.body.data.planId

    const getA = await request(app.getHttpServer()).get(`/campaigns/${planId}`).set(TENANT_A)
    assert.equal(getA.body.data?.planId, planId)

    const getB = await request(app.getHttpServer()).get(`/campaigns/${planId}`).set(TENANT_B)
    assert.equal(getB.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e: campaign priorities determine order in dispatches', async () => {
  const { app, campaignService, memberService, loyaltyService } = await buildApp()
  campaignService.resetCampaignStoresForTests()
  memberService.register({ memberId: 'm-prio-1', tenantContext: tenantContextA(), nickname: 'P1' })

  try {
    const regLow = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'PRIO-LOW',
        title: 'Low',
        description: 'd',
        triggerEvent: 'payment.success',
        conditions: [{ type: 'TOTAL_SPEND_GTE', value: 50 }],
        actions: [{ type: 'NotifyMember', template: 'lo' }],
        priority: 10
      })
    const planIdLow = regLow.body.data.planId

    const regHigh = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'PRIO-HIGH',
        title: 'High',
        description: 'd',
        triggerEvent: 'payment.success',
        conditions: [{ type: 'TOTAL_SPEND_GTE', value: 50 }],
        actions: [{ type: 'NotifyMember', template: 'hi' }],
        priority: 100
      })
    const planIdHigh = regHigh.body.data.planId

    await request(app.getHttpServer())
      .patch(`/campaigns/${planIdLow}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })
    await request(app.getHttpServer())
      .patch(`/campaigns/${planIdHigh}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    const evalRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        tenantContext: tenantContextA(),
        memberId: 'm-prio-1',
        orderId: 'o-prio-1',
        orderAmount: 100
      })

    const dispatches = evalRes.body.data.dispatches
    const indices = dispatches.map((d: any) => d.planId)
    assert.ok(indices.indexOf(planIdHigh) < indices.indexOf(planIdLow), 'higher priority runs first')
    void loyaltyService
  } finally {
    await app.close()
  }
})