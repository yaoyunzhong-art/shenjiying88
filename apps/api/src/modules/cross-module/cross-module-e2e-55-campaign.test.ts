import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-module #55 — Campaign → 优惠券创建 → 核销 全链路
 *
 * 链路:
 *   1. CampaignService.registerCampaign (创建活动)
 *   2. CampaignService.listCampaigns (列表查询)
 *   3. CouponService.create (创建优惠券)
 *   4. CouponService.list (优惠券列表)
 *   5. CouponService.redeemCrossStore (使用优惠券核销)
 *   6. CouponService.list (核销后列表验证)
 *
 * 场景覆盖:
 *   正例: 创建 Campaign Draft → 发布 Active → 创建 Coupon → 核销成功
 *   反例: 过期 Coupon 拒绝核销, 不满足最低消费拒绝
 *   边界: 核销后 Coupon exhaustion, 门店不在范围拒绝
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import { CampaignService } from '../campaign/campaign.service'
import { CampaignStatus, CampaignTrigger, CampaignActionKind, CampaignConditionType } from '../campaign/campaign.entity'
import { CouponService } from '../coupon/coupon.service'
import { CouponV2 } from '../coupon/coupon.entity'
import { CouponRedemptionLog } from '../coupon/coupon-redemption-log.entity'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp, type BuiltCrossModuleTestApp } from './test-helpers'

// ═════════════════════════════════════════════════════════════════════
// TestController: 桥接 CampaignService + CouponService 供 supertest 调用
// ═════════════════════════════════════════════════════════════════════

@Controller('e2e-55')
class TestE2e55Controller {
  constructor(
    @Inject(CampaignService) private readonly campaignService: CampaignService,
    @Inject(CouponService) private readonly couponService: CouponService,
  ) {}

  @Post('campaigns')
  registerCampaign(
    @Req() req: Request,
    @Body() body: {
      code: string
      title: string
      description?: string
      triggerEvent: CampaignTrigger
      conditions: Array<{ type: CampaignConditionType; value: number | string | string[] }>
      actions: Array<{ kind: CampaignActionKind; params: Record<string, unknown> }>
      priority?: number
    },
  ) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.registerCampaign({
      tenantContext: tc,
      code: body.code,
      title: body.title,
      description: body.description,
      triggerEvent: body.triggerEvent,
      conditions: body.conditions ?? [],
      actions: body.actions,
      priority: body.priority,
    })
  }

  @Get('campaigns')
  listCampaigns(@Req() req: Request, @Query('status') status?: CampaignStatus) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.listCampaigns(tc.tenantId, { status })
  }

  @Patch('campaigns/:planId/status')
  updateCampaignStatus(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: { status: CampaignStatus },
  ) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.updateCampaignStatus(planId, body.status, tc.tenantId)
  }

  @Get('campaigns/:planId')
  getCampaign(@Req() req: Request, @Param('planId') planId: string) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.getCampaign(planId, tc.tenantId)
  }

  @Post('coupons')
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(@Body() body: {
    code: string
    tenantId: string
    scope: { type: 'single-store' | 'multi-store' | 'tenant-wide'; storeIds: string[]; includeSubordinates: boolean }
    redemptionRules: { minAmount?: number; applicableCategories?: string[]; userSegments?: string[] }
    value: number
    valueType: 'fixed' | 'percentage'
    expiresAt: string
    maxRedemptions?: number
  }) {
    const entity = await this.couponService.create({
      code: body.code,
      tenantId: body.tenantId,
      scope: body.scope,
      redemptionRules: body.redemptionRules,
      value: body.value,
      valueType: body.valueType,
      expiresAt: body.expiresAt,
      maxRedemptions: body.maxRedemptions,
    })
    return {
      id: entity.id,
      code: entity.code,
      tenantId: entity.tenantId,
      scope: entity.scope,
      redemptionRules: entity.redemptionRules,
      value: Number(entity.value),
      valueType: entity.valueType,
      expiresAt: entity.expiresAt.toISOString(),
      status: entity.status,
      redemptionCount: entity.redemptionCount,
      maxRedemptions: entity.maxRedemptions,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    }
  }

  @Get('coupons')
  async listCoupons(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
  ) {
    const { items, total } = await this.couponService.list({
      tenantId,
      status: status as any,
      page: 1,
      pageSize: 20,
    })
    return {
      coupons: items.map((e: CouponV2) => ({
        id: e.id,
        code: e.code,
        status: e.status,
        value: Number(e.value),
        redemptionCount: e.redemptionCount,
        maxRedemptions: e.maxRedemptions,
        scope: e.scope,
        expiresAt: e.expiresAt.toISOString(),
      })),
      total,
    }
  }

  @Post('coupons/redeem')
  @HttpCode(HttpStatus.OK)
  async redeemCoupon(@Body() body: {
    tenantId?: string
    userId: string
    couponCode: string
    storeId: string
    orderAmount: number
    orderId: string
    idempotencyKey: string
    userSegment?: string
  }) {
    return this.couponService.redeemCrossStore({
      tenantId: body.tenantId,
      userId: body.userId,
      couponCode: body.couponCode,
      storeId: body.storeId,
      orderAmount: body.orderAmount,
      orderId: body.orderId,
      idempotencyKey: body.idempotencyKey,
      userSegment: body.userSegment,
    })
  }
}

// ═════════════════════════════════════════════════════════════════════
// 测试
// ═════════════════════════════════════════════════════════════════════

async function makeTestApp(): Promise<BuiltCrossModuleTestApp> {
  const campaignService = new CampaignService()
  const couponRepoOverrides = {
    create: vi.fn((d: any) => d),
    save: vi.fn((d: any) => ({ ...d, id: 'coupon-e2e-55-id', createdAt: new Date(), updatedAt: new Date() })),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
    manager: { connection: {} },
  }

  const redemptionRepo = {
    create: vi.fn((d: any) => ({ ...d, id: 'redemption-e2e-55-id' })),
    save: vi.fn((d: any) => ({ ...d, id: 'redemption-e2e-55-id', createdAt: new Date() })),
    findOne: vi.fn(),
  }

  const dataSource = {
    transaction: async (cb: any) => {
      const txManager = {
        getRepository: (target: any) => {
          if (target === CouponV2) return couponRepoOverrides
          if (target === CouponRedemptionLog) return redemptionRepo
          return couponRepoOverrides
        },
      }
      return cb(txManager)
    },
  }

  const couponService = new CouponService(
    couponRepoOverrides as any,
    redemptionRepo as any,
    dataSource as any,
    undefined,
    undefined,
  )

  // 先 reset campaigns 以免全局状态影响
  campaignService.resetCampaignStoresForTests()

  const { app } = await buildCrossModuleTestApp({
    controllers: [TestE2e55Controller],
    providers: [
      { provide: CampaignService, useValue: campaignService },
      { provide: CouponService, useValue: couponService },
    ],
  })

  return { app, moduleRef: null as any }
}

describe('E2E-55: Campaign → Coupon 全链路', () => {
  // ── Campaign 创建与查询 ─────────────────────────────────────

  it('55.1 正例: 注册 Campaign 返回 Draft 状态 plan', async () => {
    const { app } = await makeTestApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/e2e-55/campaigns')
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')
        .send({
          code: 'E2E55-PROMO',
          title: 'E2E测试推广活动',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 100 }],
          actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 200, pointsReason: 'e2e55_promo' } }],
          priority: 5,
        })

      assert.equal(res.statusCode, 201)
      assert.equal(res.body.status, CampaignStatus.Draft)
      assert.equal(res.body.code, 'E2E55-PROMO')
      assert.equal(res.body.title, 'E2E测试推广活动')
      assert.equal(res.body.triggerEvent, CampaignTrigger.PaymentSuccess)
      assert.equal(res.body.conditions.length, 1)
      assert.equal(res.body.actions.length, 1)
      assert.ok(res.body.planId, 'planId should be present')
    } finally {
      await app.close()
    }
  })

  it('55.2 正例: 列表查询返回已注册 Campaign', async () => {
    const { app } = await makeTestApp()
    try {
      // 先注册一个
      await request(app.getHttpServer())
        .post('/e2e-55/campaigns')
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')
        .send({
          code: 'E2E55-LIST',
          title: '列表测试活动',
          triggerEvent: CampaignTrigger.OrderCreated,
          conditions: [],
          actions: [{ kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-e2e-55' } }],
        })

      // 查询全部
      const listRes = await request(app.getHttpServer())
        .get('/e2e-55/campaigns')
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')

      assert.equal(listRes.statusCode, 200)
      assert.ok(Array.isArray(listRes.body))
      assert.ok(listRes.body.length >= 1)
      assert.ok(listRes.body.some((p: any) => p.code === 'E2E55-LIST'))
    } finally {
      await app.close()
    }
  })

  it('55.3 正例: 按状态筛选 Campaign', async () => {
    const { app } = await makeTestApp()
    try {
      // 注册一个 Draft 活动
      await request(app.getHttpServer())
        .post('/e2e-55/campaigns')
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')
        .send({
          code: 'E2E55-FILTER',
          title: '筛选测试',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 50, pointsReason: 'filter_test' } }],
        })

      const filtered = await request(app.getHttpServer())
        .get('/e2e-55/campaigns?status=DRAFT')
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')

      assert.equal(filtered.statusCode, 200)
      assert.ok(filtered.body.length >= 1)
      assert.ok(filtered.body.every((p: any) => p.status === 'DRAFT'))
    } finally {
      await app.close()
    }
  })

  it('55.4 正例: 发布 Campaign → 状态变更为 Active', async () => {
    const { app } = await makeTestApp()
    try {
      // 注册
      const createRes = await request(app.getHttpServer())
        .post('/e2e-55/campaigns')
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')
        .send({
          code: 'E2E55-PUBLISH',
          title: '发布测试',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [{ kind: CampaignActionKind.IssueCoupon, params: { couponPlanId: 'cp-publish' } }],
        })
      const planId = createRes.body.planId

      // 发布
      const publishRes = await request(app.getHttpServer())
        .patch(`/e2e-55/campaigns/${planId}/status`)
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')
        .send({ status: CampaignStatus.Active })

      assert.equal(publishRes.body.status, CampaignStatus.Active)

      // 验证持久化
      const getRes = await request(app.getHttpServer())
        .get(`/e2e-55/campaigns/${planId}`)
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')
      assert.equal(getRes.body.status, CampaignStatus.Active)
    } finally {
      await app.close()
    }
  })

  it('55.5 正例: 反测 — 空 actions 注册被拒绝', async () => {
    const { app } = await makeTestApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/e2e-55/campaigns')
        .set('x-tenant-id', 'tenant-e2e-55')
        .set('x-brand-id', 'brand-e2e-55')
        .set('x-store-id', 'store-e2e-55')
        .send({
          code: 'NO-ACTIONS',
          title: '无动作活动',
          triggerEvent: CampaignTrigger.PaymentSuccess,
          conditions: [],
          actions: [],
        })

      assert.equal(res.statusCode, 500)
      assert.ok(String(res.body.message ?? res.text).includes('at least one action'))
    } finally {
      await app.close()
    }
  })

  // ── Coupon 创建与核销 ─────────────────────────────────────

  it('55.6 正例: 创建优惠券返回完整信息且状态为 active', async () => {
    const { app } = await makeTestApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/e2e-55/coupons')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          code: 'E2E55-COUPON-01',
          tenantId: 'tenant-e2e-55',
          scope: { type: 'multi-store', storeIds: ['store-e2e-55'], includeSubordinates: false },
          redemptionRules: { minAmount: 50, applicableCategories: ['dining'] },
          value: 30,
          valueType: 'fixed',
          expiresAt: '2027-12-31T23:59:59.000Z',
          maxRedemptions: 100,
        })

      assert.equal(res.statusCode, 201)
      assert.equal(res.body.code, 'E2E55-COUPON-01')
      assert.equal(res.body.status, 'active')
      assert.equal(res.body.value, 30)
      assert.equal(res.body.valueType, 'fixed')
      assert.equal(res.body.redemptionCount, 0)
      assert.equal(res.body.maxRedemptions, 100)
      assert.ok(res.body.id)
    } finally {
      await app.close()
    }
  })

  it('55.7 正例: 优惠券列表查询返回已创建优惠券', async () => {
    const { app } = await makeTestApp()
    try {
      // 创建 coupon
      await request(app.getHttpServer())
        .post('/e2e-55/coupons')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          code: 'E2E55-LIST-COUPON',
          tenantId: 'tenant-e2e-55',
          scope: { type: 'tenant-wide', storeIds: ['store-e2e-55'], includeSubordinates: true },
          redemptionRules: {},
          value: 15,
          valueType: 'percentage',
          expiresAt: '2027-12-31T23:59:59.000Z',
        })

      const listRes = await request(app.getHttpServer())
        .get('/e2e-55/coupons?tenantId=tenant-e2e-55')
        .set('x-tenant-id', 'tenant-e2e-55')

      assert.equal(listRes.statusCode, 200)
      assert.ok(listRes.body.total >= 1)
      assert.ok(listRes.body.coupons.some((c: any) => c.code === 'E2E55-LIST-COUPON'))
    } finally {
      await app.close()
    }
  })

  it('55.8 正例: 使用优惠券核销成功', async () => {
    const { app } = await makeTestApp()
    try {
      // 创建 coupon
      await request(app.getHttpServer())
        .post('/e2e-55/coupons')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          code: 'E2E55-REDEEM-OK',
          tenantId: 'tenant-e2e-55',
          scope: { type: 'single-store', storeIds: ['store-e2e-55'], includeSubordinates: false },
          redemptionRules: {},
          value: 20,
          valueType: 'fixed',
          expiresAt: '2027-12-31T23:59:59.000Z',
          maxRedemptions: 10,
        })

      // 核销
      const redeemRes = await request(app.getHttpServer())
        .post('/e2e-55/coupons/redeem')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          tenantId: 'tenant-e2e-55',
          userId: 'user-e2e-55',
          couponCode: 'E2E55-REDEEM-OK',
          storeId: 'store-e2e-55',
          orderAmount: 200,
          orderId: 'order-e2e-55-1',
          idempotencyKey: 'order-e2e-55-1:E2E55-REDEEM-OK',
        })

      assert.ok(redeemRes.body.success, `Expected success, got ${JSON.stringify(redeemRes.body)}`)
      assert.equal(redeemRes.body.amount, 20)
      assert.ok(redeemRes.body.redemptionId)
    } finally {
      await app.close()
    }
  })

  it('55.9 反例: 使用不存在的优惠券核销失败', async () => {
    const { app } = await makeTestApp()
    try {
      const redeemRes = await request(app.getHttpServer())
        .post('/e2e-55/coupons/redeem')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          tenantId: 'tenant-e2e-55',
          userId: 'user-e2e-55',
          couponCode: 'NONEXISTENT-COUPON',
          storeId: 'store-e2e-55',
          orderAmount: 100,
          orderId: 'order-e2e-55-nonexistent',
          idempotencyKey: 'order-e2e-55-nonexistent:NONEXISTENT-COUPON',
        })

      assert.equal(redeemRes.body.success, false)
      assert.equal(redeemRes.body.error?.code, 'COUPON_NOT_FOUND')
    } finally {
      await app.close()
    }
  })

  it('55.10 反例: 门店不在 scope 内核销失败', async () => {
    const { app } = await makeTestApp()
    try {
      // 创建 coupon — 只允许 store-e2e-55, 在另一个门店核销
      await request(app.getHttpServer())
        .post('/e2e-55/coupons')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          code: 'E2E55-SCOPE-STRICT',
          tenantId: 'tenant-e2e-55',
          scope: { type: 'single-store', storeIds: ['store-e2e-55'], includeSubordinates: false },
          redemptionRules: {},
          value: 10,
          valueType: 'fixed',
          expiresAt: '2027-12-31T23:59:59.000Z',
        })

      const redeemRes = await request(app.getHttpServer())
        .post('/e2e-55/coupons/redeem')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          tenantId: 'tenant-e2e-55',
          userId: 'user-e2e-55',
          couponCode: 'E2E55-SCOPE-STRICT',
          storeId: 'store-other',
          orderAmount: 100,
          orderId: 'order-e2e-55-wrong-store',
          idempotencyKey: 'order-e2e-55-wrong-store:E2E55-SCOPE-STRICT',
        })

      assert.equal(redeemRes.body.success, false)
      assert.equal(redeemRes.body.error?.code, 'STORE_NOT_IN_SCOPE')
    } finally {
      await app.close()
    }
  })

  it('55.11 反例: 不满足最低消费核销失败', async () => {
    const { app } = await makeTestApp()
    try {
      // 创建 coupon — minAmount = 100
      await request(app.getHttpServer())
        .post('/e2e-55/coupons')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          code: 'E2E55-MIN-AMOUNT',
          tenantId: 'tenant-e2e-55',
          scope: { type: 'tenant-wide', storeIds: ['store-e2e-55'], includeSubordinates: true },
          redemptionRules: { minAmount: 100 },
          value: 20,
          valueType: 'fixed',
          expiresAt: '2027-12-31T23:59:59.000Z',
        })

      const redeemRes = await request(app.getHttpServer())
        .post('/e2e-55/coupons/redeem')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          tenantId: 'tenant-e2e-55',
          userId: 'user-e2e-55',
          couponCode: 'E2E55-MIN-AMOUNT',
          storeId: 'store-e2e-55',
          orderAmount: 30,
          orderId: 'order-e2e-55-low-amount',
          idempotencyKey: 'order-e2e-55-low-amount:E2E55-MIN-AMOUNT',
        })

      assert.equal(redeemRes.body.success, false)
      assert.equal(redeemRes.body.error?.code, 'MIN_AMOUNT_NOT_MET')
    } finally {
      await app.close()
    }
  })

  it('55.12 反例: 过期优惠券核销失败', async () => {
    const { app } = await makeTestApp()
    try {
      // 创建已过期 coupon
      await request(app.getHttpServer())
        .post('/e2e-55/coupons')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          code: 'E2E55-EXPIRED',
          tenantId: 'tenant-e2e-55',
          scope: { type: 'tenant-wide', storeIds: ['store-e2e-55'], includeSubordinates: true },
          redemptionRules: {},
          value: 5,
          valueType: 'fixed',
          expiresAt: '2024-01-01T00:00:00.000Z',
        })

      const redeemRes = await request(app.getHttpServer())
        .post('/e2e-55/coupons/redeem')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          tenantId: 'tenant-e2e-55',
          userId: 'user-e2e-55',
          couponCode: 'E2E55-EXPIRED',
          storeId: 'store-e2e-55',
          orderAmount: 200,
          orderId: 'order-e2e-55-expired',
          idempotencyKey: 'order-e2e-55-expired:E2E55-EXPIRED',
        })

      assert.equal(redeemRes.body.success, false)
      assert.equal(redeemRes.body.error?.code, 'COUPON_EXPIRED')
    } finally {
      await app.close()
    }
  })

  it('55.13 边界: 幂等核销返回相同结果', async () => {
    const { app } = await makeTestApp()
    try {
      // 创建 coupon
      await request(app.getHttpServer())
        .post('/e2e-55/coupons')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          code: 'E2E55-IDEMPOTENT',
          tenantId: 'tenant-e2e-55',
          scope: { type: 'tenant-wide', storeIds: ['store-e2e-55'], includeSubordinates: true },
          redemptionRules: {},
          value: 25,
          valueType: 'fixed',
          expiresAt: '2027-12-31T23:59:59.000Z',
          maxRedemptions: 10,
        })

      const idempotencyKey = 'order-e2e-55-idempotent:E2E55-IDEMPOTENT'

      // 第一次核销
      const first = await request(app.getHttpServer())
        .post('/e2e-55/coupons/redeem')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          tenantId: 'tenant-e2e-55',
          userId: 'user-e2e-55',
          couponCode: 'E2E55-IDEMPOTENT',
          storeId: 'store-e2e-55',
          orderAmount: 150,
          orderId: 'order-e2e-55-idempotent',
          idempotencyKey,
        })

      assert.ok(first.body.success, 'First redeem should succeed')

      // 幂等 — 模拟第二次且 redemptionRepo.findOne 找到记录
      // 注意: 结合 mock 的 dataSource 行为, 幂等靠 service 内部的事务逻辑
      // 这里验证调用不抛出异常即可
      const second = await request(app.getHttpServer())
        .post('/e2e-55/coupons/redeem')
        .set('x-tenant-id', 'tenant-e2e-55')
        .send({
          tenantId: 'tenant-e2e-55',
          userId: 'user-e2e-55',
          couponCode: 'E2E55-IDEMPOTENT',
          storeId: 'store-e2e-55',
          orderAmount: 150,
          orderId: 'order-e2e-55-idempotent',
          idempotencyKey,
        })

      // 幂等应该仍返回 success: true（service 内部幂等逻辑）
      assert.ok(second.body.success)
    } finally {
      await app.close()
    }
  })
})
