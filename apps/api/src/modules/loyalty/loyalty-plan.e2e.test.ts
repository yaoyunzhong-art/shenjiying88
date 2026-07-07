import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Loyalty Coupon/Blindbox 计划 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → Test 包装 Controller → LoyaltyService → in-memory store
 *
 * 验证:
 *   - Coupon plan register / list / get / status 完整 CRUD
 *   - Blindbox plan register / list / get / status 完整 CRUD
 *   - Issue 端点的 quota / perMemberLimit / 状态守卫
 *   - Tenant scope 隔离
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
import { MemberService } from '../member/member.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { LoyaltyService } from './loyalty.service'
import { BlindboxProbabilityOverviewQueryDto } from './loyalty.dto'

import { BlindboxRewardTier, CouponDiscountType, LoyaltyPlanStatus } from './loyalty.entity'
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

@Controller('loyalty')
class TestLoyaltyController {
  constructor(@Inject(LoyaltyService) private readonly loyaltyService: LoyaltyService) {}

  @Post('coupon-plans')
  registerCouponPlan(
    @Req() req: Request,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.registerCouponPlan({
      tenantContext,
      code: body.code as string,
      title: body.title as string,
      description: body.description as string | undefined,
      discountType: body.discountType as CouponDiscountType,
      discountValue: body.discountValue as number,
      minOrderAmount: body.minOrderAmount as number | undefined,
      totalQuota: body.totalQuota as number,
      perMemberLimit: body.perMemberLimit as number,
      validFrom: body.validFrom as string,
      validUntil: body.validUntil as string
    })
  }

  @Get('coupon-plans')
  listCouponPlans(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.listCouponPlans(tenantContext.tenantId)
  }

  @Get('coupon-plans/:planId')
  getCouponPlan(@Req() req: Request, @Param('planId') planId: string) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.getCouponPlan(planId, tenantContext.tenantId)
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

  @Post('coupon-plans/:planId/issue')
  issueCoupon(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.issueCouponFromPlan({
      tenantContext,
      memberId: body.memberId as string,
      planId,
      source: body.source as string | undefined
    })
  }

  @Post('blindbox-plans')
  registerBlindboxPlan(
    @Req() req: Request,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.registerBlindboxPlan({
      tenantContext,
      blindboxPlanId: body.blindboxPlanId as string,
      title: body.title as string,
      description: body.description as string | undefined,
      unitPrice: body.unitPrice as number,
      totalQuota: body.totalQuota as number,
      rewardPool: body.rewardPool as Array<{ sku: string; weight: number; label: string; tier?: BlindboxRewardTier }>,
      caseGuarantee: body.caseGuarantee as {
        caseSize: number
        guaranteedTier: BlindboxRewardTier
        distinctRewards?: boolean
      } | undefined,
      validFrom: body.validFrom as string,
      validUntil: body.validUntil as string
    })
  }

  @Get('blindbox-plans')
  listBlindboxPlans(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.listBlindboxPlans(tenantContext.tenantId)
  }

  @Get('blindbox-plans/:blindboxPlanId/probability')
  getBlindboxProbabilityOverview(
    @Req() req: Request,
    @Param('blindboxPlanId') blindboxPlanId: string,
    @Query() query: BlindboxProbabilityOverviewQueryDto
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.getBlindboxProbabilityOverview(blindboxPlanId, tenantContext.tenantId, query)
  }

  @Patch('blindbox-plans/:blindboxPlanId/status')
  updateBlindboxPlanStatus(
    @Req() req: Request,
    @Param('blindboxPlanId') blindboxPlanId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.updateBlindboxPlanStatus(
      blindboxPlanId,
      body.status as LoyaltyPlanStatus,
      tenantContext.tenantId
    )
  }

  @Post('blindbox-plans/:blindboxPlanId/issue')
  async issueBlindbox(
    @Req() req: Request,
    @Param('blindboxPlanId') blindboxPlanId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.issueBlindboxFromPlanAtomically({
      tenantContext,
      memberId: body.memberId as string,
      planId: blindboxPlanId,
      quantity: body.quantity as number | undefined
    })
  }

  @Get('blindbox-fulfillments')
  listBlindboxFulfillments(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.listBlindboxFulfillments(tenantContext.tenantId)
  }

  @Get('blindbox-draw-records')
  listBlindboxDrawRecords(
    @Req() req: Request,
    @Query() query: Record<string, string | undefined>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.listBlindboxDrawAuditLogPage(tenantContext.tenantId, {
      memberId: query.memberId,
      planId: query.planId,
      blindboxPlanId: query.blindboxPlanId,
      offset: query.offset ? Number(query.offset) : undefined,
      limit: query.limit ? Number(query.limit) : undefined
    })
  }

  @Get('blindbox-draw-records/integrity')
  getBlindboxDrawRecordIntegrity(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.getBlindboxDrawAuditIntegrityReport(tenantContext.tenantId)
  }

  @Get('blindbox-members/:memberId/overview')
  getBlindboxMemberOverview(@Req() req: Request, @Param('memberId') memberId: string) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.loyaltyService.getBlindboxMemberOverview(tenantContext.tenantId, memberId)
  }
}

async function buildApp() {
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestLoyaltyController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: LoyaltyService, useValue: loyaltyService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberService, loyaltyService }
}

const TENANT_A_HEADERS = {
  'x-tenant-id': 'tenant-A',
  'x-brand-id': 'brand-A',
  'x-store-id': 'store-A'
}

const TENANT_B_HEADERS = {
  'x-tenant-id': 'tenant-B',
  'x-brand-id': 'brand-B',
  'x-store-id': 'store-B'
}

it('e2e: coupon plan register → list → get → status happy path', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const register = await request(app.getHttpServer())
      .post('/loyalty/coupon-plans')
      .set(TENANT_A_HEADERS)
      .send({
        code: 'WELCOME10',
        title: 'welcome',
        description: 'new customer',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: 10,
        minOrderAmount: 50,
        totalQuota: 100,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })
    assert.equal(register.statusCode, 201)
    const planId = register.body.data.planId
    assert.ok(planId)
    assert.equal(register.body.data.code, 'WELCOME10')
    assert.equal(register.body.data.status, LoyaltyPlanStatus.Draft)
    assert.equal(register.body.data.remainingQuota, 100)

    const list = await request(app.getHttpServer())
      .get('/loyalty/coupon-plans')
      .set(TENANT_A_HEADERS)
    assert.equal(list.body.data.length, 1)
    assert.equal(list.body.data[0].planId, planId)

    const detail = await request(app.getHttpServer())
      .get(`/loyalty/coupon-plans/${planId}`)
      .set(TENANT_A_HEADERS)
    assert.equal(detail.body.data.title, 'welcome')

    const activate = await request(app.getHttpServer())
      .patch(`/loyalty/coupon-plans/${planId}/status`)
      .set(TENANT_A_HEADERS)
      .send({ status: LoyaltyPlanStatus.Active })
    assert.equal(activate.body.data.status, LoyaltyPlanStatus.Active)
  } finally {
    await app.close()
  }
})

it('e2e: coupon plan register rejects negative discountValue', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    await assert.rejects(
      async () => {
        loyaltyService.registerCouponPlan({
          tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
          code: 'NEG',
          title: 'negative',
          discountType: CouponDiscountType.FixedAmount,
          discountValue: -1,
          totalQuota: 1,
          perMemberLimit: 1,
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2026-12-31T23:59:59.000Z'
        })
      }
    )
  } finally {
    await app.close()
  }
})

it('e2e: coupon plan register returns 400 for invalid discountValue over HTTP', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const register = await request(app.getHttpServer())
      .post('/loyalty/coupon-plans')
      .set(TENANT_A_HEADERS)
      .send({
        code: 'NEG-HTTP',
        title: 'negative-http',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: -1,
        totalQuota: 1,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })

    assert.equal(register.statusCode, 400)
    assert.match(register.body.message, /Coupon discountValue must be positive/i)
  } finally {
    await app.close()
  }
})

it('e2e: coupon plan register rejects empty rewardPool for blindbox and similar business rules', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    await assert.rejects(
      async () => {
        loyaltyService.registerBlindboxPlan({
          tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
          blindboxPlanId: 'NO-POOL',
          title: 'no pool',
          unitPrice: 0,
          totalQuota: 1,
          rewardPool: [],
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2026-12-31T23:59:59.000Z'
        })
      }
    )
  } finally {
    await app.close()
  }
})

it('e2e: blindbox register rejects distinct case guarantee when reward pool lacks enough unique skus', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    await assert.rejects(
      async () => {
        loyaltyService.registerBlindboxPlan({
          tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
          blindboxPlanId: 'NO-DISTINCT-CASE',
          title: 'invalid distinct case',
          unitPrice: 99,
          totalQuota: 12,
          rewardPool: [
            { sku: 'sku-s1', weight: 14, label: 'standard-1', tier: BlindboxRewardTier.Standard },
            { sku: 'sku-s2', weight: 14, label: 'standard-2', tier: BlindboxRewardTier.Standard },
            { sku: 'sku-s3', weight: 14, label: 'standard-3', tier: BlindboxRewardTier.Standard },
            { sku: 'sku-s4', weight: 14, label: 'standard-4', tier: BlindboxRewardTier.Standard },
            { sku: 'sku-s5', weight: 14, label: 'standard-5', tier: BlindboxRewardTier.Standard },
            { sku: 'sku-hot-1', weight: 20, label: 'hot-1', tier: BlindboxRewardTier.Hot },
            { sku: 'sku-hidden', weight: 8, label: 'hidden', tier: BlindboxRewardTier.Hidden },
            { sku: 'sku-super', weight: 2, label: 'super', tier: BlindboxRewardTier.SuperHidden }
          ],
          caseGuarantee: {
            caseSize: 12,
            guaranteedTier: BlindboxRewardTier.Hidden,
            distinctRewards: true
          },
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2026-12-31T23:59:59.000Z'
        })
      },
      /distinct sku count 8 cannot satisfy case guarantee size 12/i
    )
  } finally {
    await app.close()
  }
})

it('e2e: blindbox register rejects invalid official four-tier probability distribution', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    await assert.rejects(
      async () => {
        loyaltyService.registerBlindboxPlan({
          tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
          blindboxPlanId: 'BAD-PROBABILITY',
          title: 'bad probability',
          unitPrice: 99,
          totalQuota: 12,
          rewardPool: [
            { sku: 'sku-standard', weight: 60, label: 'standard', tier: BlindboxRewardTier.Standard },
            { sku: 'sku-hot', weight: 20, label: 'hot', tier: BlindboxRewardTier.Hot },
            { sku: 'sku-hidden', weight: 10, label: 'hidden', tier: BlindboxRewardTier.Hidden },
            { sku: 'sku-super', weight: 10, label: 'super', tier: BlindboxRewardTier.SuperHidden }
          ],
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2026-12-31T23:59:59.000Z'
        })
      },
      /official four-tier probability mismatch/i
    )
  } finally {
    await app.close()
  }
})

it('e2e: blindbox register returns 400 for invalid official four-tier probability distribution over HTTP', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const register = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans')
      .set(TENANT_A_HEADERS)
      .send({
        blindboxPlanId: 'BAD-PROBABILITY-HTTP',
        title: 'bad probability http',
        unitPrice: 99,
        totalQuota: 12,
        rewardPool: [
          { sku: 'sku-standard', weight: 60, label: 'standard', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-hot', weight: 20, label: 'hot', tier: BlindboxRewardTier.Hot },
          { sku: 'sku-hidden', weight: 10, label: 'hidden', tier: BlindboxRewardTier.Hidden },
          { sku: 'sku-super', weight: 10, label: 'super', tier: BlindboxRewardTier.SuperHidden }
        ],
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })

    assert.equal(register.statusCode, 400)
    assert.match(register.body.message, /official four-tier probability mismatch/i)
  } finally {
    await app.close()
  }
})

it('e2e: blindbox probability overview honors historyOffset and historyLimit query', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-bb-history',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'History'
  })

  try {
    const plan = loyaltyService.registerBlindboxPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      blindboxPlanId: 'BB-HISTORY',
      title: 'history box',
      unitPrice: 49,
      totalQuota: 5,
      rewardPool: [{ sku: 'sku-std', weight: 1, label: 'standard', tier: BlindboxRewardTier.Standard }],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    loyaltyService.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, 'tenant-A')

    const firstIssue = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans/BB-HISTORY/issue')
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-bb-history', quantity: 1 })
    assert.equal(firstIssue.statusCode, 201)

    const secondIssue = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans/BB-HISTORY/issue')
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-bb-history', quantity: 1 })
    assert.equal(secondIssue.statusCode, 201)

    const thirdIssue = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans/BB-HISTORY/issue')
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-bb-history', quantity: 1 })
    assert.equal(thirdIssue.statusCode, 201)

    const probability = await request(app.getHttpServer())
      .get('/loyalty/blindbox-plans/BB-HISTORY/probability')
      .query({ historyOffset: 1, historyLimit: 1 })
      .set(TENANT_A_HEADERS)
    assert.equal(probability.statusCode, 200)
    assert.equal(probability.body.data.recentDrawRecordTotal, 3)
    assert.equal(probability.body.data.historyLimitApplied, 1)
    assert.equal(probability.body.data.hasMoreRecentDrawRecords, true)
    assert.equal(probability.body.data.recentDrawRecords.length, 1)
    assert.equal(probability.body.data.recentDrawRecords[0].auditLogId, secondIssue.body.data.auditLogId)
    assert.notEqual(probability.body.data.recentDrawRecords[0].auditLogId, thirdIssue.body.data.auditLogId)
    assert.notEqual(probability.body.data.recentDrawRecords[0].auditLogId, firstIssue.body.data.auditLogId)
  } finally {
    await app.close()
  }
})

it('e2e: coupon issue decrements quota and enforces perMemberLimit', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-1',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'Alice'
  })

  try {
    const plan = loyaltyService.registerCouponPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      code: 'FIRST10',
      title: 'first coupon',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 10,
      totalQuota: 5,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-A')

    const issue1 = await request(app.getHttpServer())
      .post(`/loyalty/coupon-plans/${plan.planId}/issue`)
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-1' })
    assert.equal(issue1.statusCode, 201)
    assert.equal(issue1.body.data.couponCode, 'FIRST10')

    const after1 = loyaltyService.getCouponPlan(plan.planId, 'tenant-A')
    assert.equal(after1?.remainingQuota, 4)

    await assert.rejects(async () =>
      loyaltyService.issueCouponFromPlan({
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
        memberId: 'm-1',
        planId: plan.planId
      })
    )
  } finally {
    await app.close()
  }
})

it('e2e: coupon issue rejects when plan is not ACTIVE', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-2',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'Bob'
  })

  try {
    const plan = loyaltyService.registerCouponPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      code: 'DRAFT1',
      title: 'still draft',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 5,
      totalQuota: 1,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    await assert.rejects(async () =>
      loyaltyService.issueCouponFromPlan({
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
        memberId: 'm-2',
        planId: plan.planId
      })
    )
  } finally {
    await app.close()
  }
})

it('e2e: coupon plans are tenant-scoped (no cross-tenant leak)', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    await request(app.getHttpServer())
      .post('/loyalty/coupon-plans')
      .set(TENANT_A_HEADERS)
      .send({
        code: 'A-ONLY',
        title: 'A only',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: 5,
        totalQuota: 1,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })

    const listA = await request(app.getHttpServer())
      .get('/loyalty/coupon-plans')
      .set(TENANT_A_HEADERS)
    assert.equal(listA.body.data.length, 1)

    const listB = await request(app.getHttpServer())
      .get('/loyalty/coupon-plans')
      .set(TENANT_B_HEADERS)
    assert.equal(listB.body.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: blindbox plan register → list → get → status', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const register = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans')
      .set(TENANT_A_HEADERS)
      .send({
        blindboxPlanId: 'BB-LIMITED',
        title: 'limited',
        description: 'dragon-boat',
        unitPrice: 99,
        totalQuota: 50,
        rewardPool: [
          { sku: 'sku-a', weight: 70, label: 'small', tier: BlindboxRewardTier.Standard },
          { sku: 'sku-b', weight: 20, label: 'mid', tier: BlindboxRewardTier.Hot },
          { sku: 'sku-c', weight: 8, label: 'large', tier: BlindboxRewardTier.Hidden },
          { sku: 'sku-d', weight: 2, label: 'super', tier: BlindboxRewardTier.SuperHidden }
        ],
        caseGuarantee: {
          caseSize: 12,
          guaranteedTier: BlindboxRewardTier.Hidden,
          distinctRewards: false
        },
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z'
      })
    assert.equal(register.statusCode, 201)
    assert.equal(register.body.data.status, LoyaltyPlanStatus.Draft)
    assert.equal(register.body.data.probabilityDisclosure.length, 4)
    assert.deepEqual(register.body.data.probabilityDisclosure, [
      { tier: BlindboxRewardTier.Standard, weight: 70, probabilityPct: 70 },
      { tier: BlindboxRewardTier.Hot, weight: 20, probabilityPct: 20 },
      { tier: BlindboxRewardTier.Hidden, weight: 8, probabilityPct: 8 },
      { tier: BlindboxRewardTier.SuperHidden, weight: 2, probabilityPct: 2 }
    ])
    assert.equal(register.body.data.caseGuarantee.caseSize, 12)

    const list = await request(app.getHttpServer())
      .get('/loyalty/blindbox-plans')
      .set(TENANT_A_HEADERS)
    assert.equal(list.body.data.length, 1)
    assert.equal(list.body.data[0].blindboxPlanId, 'BB-LIMITED')
    assert.equal(list.body.data[0].probabilityDisclosure[0].tier, BlindboxRewardTier.Standard)

    const activate = await request(app.getHttpServer())
      .patch('/loyalty/blindbox-plans/BB-LIMITED/status')
      .set(TENANT_A_HEADERS)
      .send({ status: LoyaltyPlanStatus.Active })
    assert.equal(activate.body.data.status, LoyaltyPlanStatus.Active)

    const probability = await request(app.getHttpServer())
      .get('/loyalty/blindbox-plans/BB-LIMITED/probability')
      .set(TENANT_A_HEADERS)
    assert.equal(probability.statusCode, 200)
    assert.equal(probability.body.data.blindboxPlanId, 'BB-LIMITED')
    assert.equal(probability.body.data.recentDrawRecordTotal, 0)
    assert.equal(probability.body.data.historyLimitApplied, 10)
    assert.equal(probability.body.data.hasMoreRecentDrawRecords, false)
    assert.equal(probability.body.data.probabilityDisclosure.length, 4)
    assert.equal(probability.body.data.recentDrawRecords.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: blindbox issue returns reward and decrements quota', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-bb',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'Charlie'
  })

  try {
    const plan = loyaltyService.registerBlindboxPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      blindboxPlanId: 'BB-001',
      title: 'one box',
      unitPrice: 0,
      totalQuota: 5,
      rewardPool: [{ sku: 'sku-x', weight: 1, label: 'only' }],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    loyaltyService.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, 'tenant-A')

    const issue = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans/BB-001/issue')
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-bb', quantity: 1 })
    assert.equal(issue.statusCode, 201)
    assert.equal(issue.body.data.rewardSku, 'sku-x')
    assert.equal(issue.body.data.rewards.length, 1)
    assert.equal(issue.body.data.rewards[0].sku, 'sku-x')
    assert.equal(issue.body.data.quotaExecutionMode, 'IN_MEMORY_FALLBACK')
    assert.ok(issue.body.data.auditLogId)

    const fulfillments = await request(app.getHttpServer())
      .get('/loyalty/blindbox-fulfillments')
      .set(TENANT_A_HEADERS)
    assert.equal(fulfillments.body.data.length, 1)
    assert.equal(fulfillments.body.data[0].blindboxPlanId, 'BB-001')
    assert.equal(fulfillments.body.data[0].rewards.length, 1)
    assert.equal(fulfillments.body.data[0].quotaExecutionMode, 'IN_MEMORY_FALLBACK')
  } finally {
    await app.close()
  }
})

it('e2e: blindbox issue applies case guarantee for full box quantity', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-bb-case',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'Case'
  })

  const originalRandom = Math.random
  Math.random = () => 0
  try {
    loyaltyService.registerBlindboxPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      blindboxPlanId: 'BB-CASE-001',
      title: 'case box',
      unitPrice: 199,
      totalQuota: 24,
      rewardPool: [
        { sku: 'sku-s1', weight: 7, label: 'standard-1', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s2', weight: 7, label: 'standard-2', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s3', weight: 7, label: 'standard-3', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s4', weight: 7, label: 'standard-4', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s5', weight: 7, label: 'standard-5', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s6', weight: 7, label: 'standard-6', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s7', weight: 7, label: 'standard-7', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s8', weight: 7, label: 'standard-8', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s9', weight: 7, label: 'standard-9', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-s10', weight: 7, label: 'standard-10', tier: BlindboxRewardTier.Standard },
        { sku: 'sku-hot-1', weight: 10, label: 'hot-1', tier: BlindboxRewardTier.Hot },
        { sku: 'sku-hot-2', weight: 10, label: 'hot-2', tier: BlindboxRewardTier.Hot },
        { sku: 'sku-hidden', weight: 8, label: 'hidden', tier: BlindboxRewardTier.Hidden },
        { sku: 'sku-super', weight: 2, label: 'super', tier: BlindboxRewardTier.SuperHidden }
      ],
      caseGuarantee: {
        caseSize: 12,
        guaranteedTier: BlindboxRewardTier.Hidden,
        distinctRewards: true
      },
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    loyaltyService.updateBlindboxPlanStatus('BB-CASE-001', LoyaltyPlanStatus.Active, 'tenant-A')

    const issue = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans/BB-CASE-001/issue')
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-bb-case', quantity: 12 })

    assert.equal(issue.statusCode, 201)
    assert.equal(issue.body.data.quantity, 12)
    assert.equal(issue.body.data.rewards.length, 12)
    assert.equal(issue.body.data.guaranteeApplied, true)
    assert.equal(issue.body.data.quotaExecutionMode, 'IN_MEMORY_FALLBACK')
    assert.ok(issue.body.data.auditLogId)
    assert.ok(issue.body.data.rewards.some((reward: { tier: BlindboxRewardTier }) => reward.tier === BlindboxRewardTier.Hidden))
    assert.equal(new Set(issue.body.data.rewards.map((reward: { sku: string }) => reward.sku)).size, 12)

    const drawRecords = await request(app.getHttpServer())
      .get('/loyalty/blindbox-draw-records')
      .query({ memberId: 'm-bb-case', offset: 0, limit: 10 })
      .set(TENANT_A_HEADERS)
    assert.equal(drawRecords.statusCode, 200)
    assert.equal(drawRecords.body.data.total, 1)
    assert.equal(drawRecords.body.data.items.length, 1)
    assert.equal(drawRecords.body.data.items[0].quantity, 12)
    assert.equal(drawRecords.body.data.items[0].quotaBefore, 24)
    assert.equal(drawRecords.body.data.items[0].quotaAfter, 12)
    assert.equal(drawRecords.body.data.items[0].quotaExecutionMode, 'IN_MEMORY_FALLBACK')
    assert.equal(drawRecords.body.data.hasMore, false)
    assert.ok(drawRecords.body.data.items[0].auditHash)
    assert.equal(drawRecords.body.data.items[0].previousHash, undefined)

    const memberOverview = await request(app.getHttpServer())
      .get('/loyalty/blindbox-members/m-bb-case/overview')
      .set(TENANT_A_HEADERS)
    assert.equal(memberOverview.statusCode, 200)
    assert.equal(memberOverview.body.data.memberId, 'm-bb-case')
    assert.equal(memberOverview.body.data.totalFulfillments, 1)
    assert.equal(memberOverview.body.data.totalDrawQuantity, 12)
    assert.equal(memberOverview.body.data.guaranteeHitCount, 1)
    assert.equal(memberOverview.body.data.totalSpentQuota, 12)
    assert.equal(memberOverview.body.data.latestBlindboxPlanId, 'BB-CASE-001')

    const integrity = await request(app.getHttpServer())
      .get('/loyalty/blindbox-draw-records/integrity')
      .set(TENANT_A_HEADERS)
    assert.equal(integrity.statusCode, 200)
    assert.equal(integrity.body.data.valid, true)
    assert.equal(integrity.body.data.totalLogs, 1)
    assert.equal(integrity.body.data.lastAuditLogId, drawRecords.body.data.items[0].auditLogId)
    assert.equal(integrity.body.data.lastHash, drawRecords.body.data.items[0].auditHash)

    const probability = await request(app.getHttpServer())
      .get('/loyalty/blindbox-plans/BB-CASE-001/probability')
      .set(TENANT_A_HEADERS)
    assert.equal(probability.statusCode, 200)
    assert.equal(probability.body.data.recentDrawRecordTotal, 1)
    assert.equal(probability.body.data.historyLimitApplied, 10)
    assert.equal(probability.body.data.hasMoreRecentDrawRecords, false)
    assert.equal(probability.body.data.recentDrawRecords.length, 1)
    assert.equal(probability.body.data.recentDrawRecords[0].auditLogId, drawRecords.body.data.items[0].auditLogId)
    assert.equal(probability.body.data.recentDrawRecords[0].auditHash, drawRecords.body.data.items[0].auditHash)
  } finally {
    Math.random = originalRandom
    await app.close()
  }
})

it('e2e: blindbox issue rejects when not ACTIVE', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-bb2',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'David'
  })

  try {
    const plan = loyaltyService.registerBlindboxPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      blindboxPlanId: 'BB-DRAFT',
      title: 'still draft',
      unitPrice: 0,
      totalQuota: 1,
      rewardPool: [{ sku: 'sku-1', weight: 1, label: 'x' }],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    await assert.rejects(async () =>
      loyaltyService.issueBlindboxFromPlan({
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
        memberId: 'm-bb2',
        planId: plan.blindboxPlanId
      })
    )
  } finally {
    await app.close()
  }
})

it('e2e: blindbox quota exhaustion after issuance', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  for (let i = 0; i < 3; i += 1) {
    memberService.register({
      memberId: `m-bb-${i}`,
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      nickname: `B${i}`
    })
  }

  try {
    const plan = loyaltyService.registerBlindboxPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      blindboxPlanId: 'BB-LOW',
      title: 'low quota',
      unitPrice: 0,
      totalQuota: 2,
      rewardPool: [{ sku: 'sku-1', weight: 1, label: 'x' }],
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })
    loyaltyService.updateBlindboxPlanStatus(plan.blindboxPlanId, LoyaltyPlanStatus.Active, 'tenant-A')

    await loyaltyService.issueBlindboxFromPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      memberId: 'm-bb-0',
      planId: plan.blindboxPlanId
    })
    await loyaltyService.issueBlindboxFromPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      memberId: 'm-bb-1',
      planId: plan.blindboxPlanId
    })

    await assert.rejects(async () =>
      loyaltyService.issueBlindboxFromPlan({
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
        memberId: 'm-bb-2',
        planId: plan.blindboxPlanId
      })
    )
  } finally {
    await app.close()
  }
})

it('e2e: coupon plan status lifecycle ACTIVE → PAUSED → ACTIVE', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const plan = loyaltyService.registerCouponPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      code: 'LIFECYCLE',
      title: 'lifecycle',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 5,
      totalQuota: 10,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z'
    })

    const toActive = loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-A')
    assert.equal(toActive.status, LoyaltyPlanStatus.Active)

    const toPaused = loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Paused, 'tenant-A')
    assert.equal(toPaused.status, LoyaltyPlanStatus.Paused)

    const toActive2 = loyaltyService.updateCouponPlanStatus(plan.planId, LoyaltyPlanStatus.Active, 'tenant-A')
    assert.equal(toActive2.status, LoyaltyPlanStatus.Active)
  } finally {
    await app.close()
  }
})

it('e2e: end-to-end settlePaidOrder → coupon issue → points ledger', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-pay',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'Pay'
  })

  try {
    await loyaltyService.settlePaidOrderFromSnapshots(
      {
        snapshotId: 'snap-001',
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
        externalOrderId: 'order-pay-001',
        memberId: 'm-pay',
        amount: 100,
        discountAmount: 0,
        payableAmount: 100,
        currency: 'CNY',
        status: 'PAID',
        updatedAtFromSource: new Date().toISOString()
      },
      {
        snapshotId: 'snap-pay-001',
        tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
        externalPaymentId: 'pay-001',
        externalOrderId: 'order-pay-001',
        paymentChannel: 'WECHAT_PAY',
        paymentStatus: 'SUCCEEDED',
        amount: 100,
        currency: 'CNY',
        paidAt: new Date().toISOString(),
        updatedAtFromSource: new Date().toISOString()
      }
    )

    const settlements = await request(app.getHttpServer())
      .get('/loyalty/settlements')
      .set(TENANT_A_HEADERS)
    // (Settlements endpoint is not exposed via TestLoyaltyController; verify via service)
    const allSettlements = loyaltyService.listSettlements('tenant-A')
    assert.equal(allSettlements.length, 1)
    assert.equal(allSettlements[0].memberId, 'm-pay')
    assert.equal(allSettlements[0].status, 'SUCCEEDED')

    const ledger = loyaltyService.listPointsLedger('tenant-A')
    assert.equal(ledger.length, 1)
    assert.equal(ledger[0].points, 100)

    void settlements
  } finally {
    await app.close()
  }
})

it('e2e: list points ledger via service method (no HTTP route exposed in e2e harness)', async () => {
  const { loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-pts-ledger-service-1',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'A'
  })

  try {
    await loyaltyService.settlePaidOrder(
      { orderId: 'order-points-ledger-1', memberId: 'm-pts-ledger-service-1', totalAmount: 100, tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }, items: [], currency: 'CNY', status: 'PAID', createdAt: new Date().toISOString() } as any,
      { orderId: 'order-points-ledger-1', amount: 100, status: 'SUCCEEDED', channel: 'wechat', externalPaymentId: 'ext-pts-ledger', createdAt: new Date().toISOString() } as any
    )

    const ledgerA = loyaltyService.listPointsLedger('tenant-A')
    assert.ok(ledgerA.length >= 1)

    const ledgerB = loyaltyService.listPointsLedger('tenant-B')
    assert.equal(ledgerB.length, 0)
  } finally {
    // no app to close (not used)
  }
})

it('e2e: list settlements returns all paid order settlements', async () => {
  const { app, loyaltyService, memberService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-settlements-A',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'A'
  })
  memberService.register({
    memberId: 'm-settlements-B',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'B'
  })

  try {
    await loyaltyService.settlePaidOrder(
      { orderId: 'o-list-1', memberId: 'm-settlements-A', totalAmount: 50, tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }, items: [], currency: 'CNY', status: 'PAID', createdAt: new Date().toISOString() } as any,
      { orderId: 'o-list-1', amount: 50, status: 'SUCCEEDED', channel: 'wechat', externalPaymentId: 'ext-list-1', createdAt: new Date().toISOString() } as any
    )
    await loyaltyService.settlePaidOrder(
      { orderId: 'o-list-2', memberId: 'm-settlements-B', totalAmount: 70, tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }, items: [], currency: 'CNY', status: 'PAID', createdAt: new Date().toISOString() } as any,
      { orderId: 'o-list-2', amount: 70, status: 'SUCCEEDED', channel: 'alipay', externalPaymentId: 'ext-list-2', createdAt: new Date().toISOString() } as any
    )

    const settlements = loyaltyService.listSettlements('tenant-A')
    assert.ok(settlements.length >= 2)
  } finally {
    await app.close()
  }
})

it('e2e: get coupon plan returns undefined for unknown plan', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/loyalty/coupon-plans/unknown-plan-id').set(TENANT_A_HEADERS)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data, undefined)
  } finally {
    await app.close()
  }
})

it('e2e: blindbox plan route does not support single fetch in e2e harness', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/loyalty/blindbox-plans/unknown-plan-id').set(TENANT_A_HEADERS)
    assert.equal(res.statusCode, 404)
  } finally {
    await app.close()
  }
})

it('e2e: coupon plan status updated via PATCH', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  try {
    const reg = await request(app.getHttpServer())
      .post('/loyalty/coupon-plans')
      .set(TENANT_A_HEADERS)
      .send({
        code: 'PATCH-001',
        title: 'PatchTest',
        description: 'd',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: 5,
        minOrderAmount: 0,
        totalQuota: 100,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z'
      })
    assert.equal(reg.statusCode, 201)
    const planId = reg.body.data.planId

    const patch = await request(app.getHttpServer())
      .patch(`/loyalty/coupon-plans/${planId}/status`)
      .set(TENANT_A_HEADERS)
      .send({ status: 'PAUSED' })
    assert.equal(patch.body.data.status, LoyaltyPlanStatus.Paused)
  } finally {
    await app.close()
  }
})

it('e2e: blindbox plan status updated via PATCH', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  try {
    const reg = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans')
      .set(TENANT_A_HEADERS)
      .send({
        blindboxPlanId: 'PATCH-BB-001',
        title: 'PatchTestBB',
        description: 'd',
        unitPrice: 50,
        totalQuota: 100,
        rewardPool: [
          { sku: 'A', weight: 1, label: 'A' },
          { sku: 'B', weight: 1, label: 'B' },
          { sku: 'C', weight: 1, label: 'C' }
        ],
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z'
      })
    assert.equal(reg.statusCode, 201)
    const planId = reg.body.data.blindboxPlanId ?? reg.body.data.planId

    const patch = await request(app.getHttpServer())
      .patch(`/loyalty/blindbox-plans/${planId}/status`)
      .set(TENANT_A_HEADERS)
      .send({ status: 'PAUSED' })
    assert.equal(patch.body.data.status, LoyaltyPlanStatus.Paused)
  } finally {
    await app.close()
  }
})

it('e2e: coupon plan not issued when status is PAUSED', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-paused-coupon',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'A'
  })

  try {
    const reg = await request(app.getHttpServer())
      .post('/loyalty/coupon-plans')
      .set(TENANT_A_HEADERS)
      .send({
        code: 'PAUSED-001',
        title: 'Paused',
        description: 'd',
        discountType: CouponDiscountType.FixedAmount,
        discountValue: 5,
        minOrderAmount: 0,
        totalQuota: 100,
        perMemberLimit: 1,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z'
      })
    const planId = reg.body.data.planId
    await request(app.getHttpServer())
      .patch(`/loyalty/coupon-plans/${planId}/status`)
      .set(TENANT_A_HEADERS)
      .send({ status: 'PAUSED' })

    const issue = await request(app.getHttpServer())
      .post(`/loyalty/coupon-plans/${planId}/issue`)
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-paused-coupon', source: 'TEST' })
    assert.equal(issue.statusCode, 409)
    assert.match(issue.body.message, /Coupon plan is not active/i)
  } finally {
    await app.close()
  }
})

it('e2e: blindbox issue creates a fulfillment', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  memberService.register({
    memberId: 'm-bb-issue-1',
    tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
    nickname: 'A'
  })

  try {
    const reg = await request(app.getHttpServer())
      .post('/loyalty/blindbox-plans')
      .set(TENANT_A_HEADERS)
      .send({
        blindboxPlanId: 'BB-ISSUE-001',
        title: 'IssueTest',
        description: 'd',
        unitPrice: 30,
        totalQuota: 5,
        rewardPool: [
          { sku: 'A', weight: 1, label: 'A' },
          { sku: 'B', weight: 1, label: 'B' }
        ],
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z'
      })
    const planId = reg.body.data.blindboxPlanId ?? reg.body.data.planId

    const activate = await request(app.getHttpServer())
      .patch(`/loyalty/blindbox-plans/${planId}/status`)
      .set(TENANT_A_HEADERS)
      .send({ status: LoyaltyPlanStatus.Active })
    assert.equal(activate.statusCode, 200)

    const issue1 = await request(app.getHttpServer())
      .post(`/loyalty/blindbox-plans/${planId}/issue`)
      .set(TENANT_A_HEADERS)
      .send({ memberId: 'm-bb-issue-1', quantity: 1 })
    assert.equal(issue1.statusCode, 201)
  } finally {
    await app.close()
  }
})

it('e2e: coupon plan status update returns 404 for unknown plan', async () => {
  const { app, loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()

  try {
    const patch = await request(app.getHttpServer())
      .patch('/loyalty/coupon-plans/unknown-plan/status')
      .set(TENANT_A_HEADERS)
      .send({ status: 'ACTIVE' })

    assert.equal(patch.statusCode, 404)
    assert.match(patch.body.message, /Coupon plan not found/i)
  } finally {
    await app.close()
  }
})

it('e2e: cross-tenant coupon plan isolation via service', async () => {
  const { loyaltyService } = await buildApp()
  loyaltyService.resetLoyaltyStoresForTests()
  try {
    const created = await loyaltyService.registerCouponPlan({
      tenantContext: { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' },
      code: 'ISO-SVC-001',
      title: 'IsoSvcTest',
      description: 'd',
      discountType: CouponDiscountType.FixedAmount,
      discountValue: 5,
      minOrderAmount: 0,
      totalQuota: 100,
      perMemberLimit: 1,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z'
    } as any)
    const planId = created.planId

    const getA = loyaltyService.getCouponPlan(planId, 'tenant-A')
    assert.ok(getA)

    const getB = loyaltyService.getCouponPlan(planId, 'tenant-B')
    assert.equal(getB, undefined)
  } finally {
    // no app to close
  }
})
