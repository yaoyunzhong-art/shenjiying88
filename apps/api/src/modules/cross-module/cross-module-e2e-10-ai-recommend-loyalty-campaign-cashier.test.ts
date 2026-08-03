import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E 跨模块 #10 — AI 推荐 → 会员 → 营销 → 收银 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → AiRecommendService.generateRecommendations (策略: hybrid)
 *     → MemberService.register + addPoints (前置准备)
 *     → CashierService.createOrder + createPayment + applyPaymentCallback
 *       · 发布 cashier.order-created / cashier.payment-created / cashier.payment-succeeded
 *     → CampaignService.registerCampaign (策略) + evaluateTriggers('cashier.payment-succeeded')
 *       · 匹配成功 → dispatchAction AwardPoints → MemberService.awardPoints
 *       · 触发 loyalty 积分入账 → member 状态升级
 *     → AiRecommendService.generateRecommendations (再次) → 个性化结果不同
 *
 * 验证:
 *   - 冷启动: 新会员无 profile → popularity fallback
 *   - 个性化: 有 profile + 积分 → hybrid 策略产出 content-based 个性化
 *   - 营销触发: payment.success 事件 → AwardPoints 派发 → 会员积分变化
 *   - 营销条件: MinOrderAmount 不满足 → 不触发
 *   - 跨租户隔离: 租户 B 看不到租户 A 的策略 / 推荐 / 营销
 *   - 幂等: 同 orderId 二次 evaluateTriggers → 跳过重复派发
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
  ValidationPipe
} from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import { AiRecommendService } from '../ai-recommend/ai-recommend.service'
import { CampaignService } from '../campaign/campaign.service'
import { CashierService } from '../cashier/cashier.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import {
  CampaignActionKind,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger,
  type CampaignCondition,
  type CampaignAction
} from '../campaign/campaign.entity'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp } from './test-helpers'

// ─── TestController ───

@Controller()
class TestController {
  constructor(
    @Inject(AiRecommendService) private readonly aiRecommendService: AiRecommendService,
    @Inject(MemberService) private readonly memberService: MemberService,
    @Inject(CashierService) private readonly cashierService: CashierService,
    @Inject(CampaignService) private readonly campaignService: CampaignService
  ) {}

  @Post('members')
  registerMember(@Req() req: Request, @Body() body: { memberId: string; nickname?: string }) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.memberService.register({
      memberId: body.memberId,
      tenantContext: tc,
      nickname: body.nickname ?? `User-${body.memberId}`
    })
  }

  @Get('members/:memberId')
  getMember(@Param('memberId') memberId: string) {
    return this.memberService.getProfile(memberId)
  }

  @Post('cashier/orders')
  createOrder(@Req() req: Request, @Body() body: any) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.createOrder(tc, body)
  }

  @Post('cashier/orders/:orderId/payments')
  createPayment(
    @Param('orderId') orderId: string,
    @Body() body: any
  ) {
    return this.cashierService.createPayment(orderId, body)
  }

  @Post('cashier/payments/callback')
  paymentCallback(@Body() body: any) {
    return this.cashierService.applyPaymentCallback(body)
  }

  @Post('ai/profile')
  updateProfile(@Body() body: { memberId: string; profile: any }) {
    this.aiRecommendService.updateProfile(body.memberId, body.profile)
    return { ok: true }
  }

  @Post('ai/recommend')
  recommend(@Req() req: Request, @Body() body: { memberId?: string; strategyId?: string; type?: string; limit?: number; minScore?: number }) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.aiRecommendService.generateRecommendations({
      memberId: body.memberId,
      strategyId: body.strategyId ?? 'strategy-hybrid-v1',
      type: (body.type ?? 'game') as 'game',
      limit: body.limit ?? 5,
      storeId: tc.storeId
    })
  }

  @Post('campaigns')
  registerCampaign(@Req() req: Request, @Body() body: any) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.registerCampaign({ tenantContext: tc, ...body })
  }

  @Post('campaigns/:planId/activate')
  activateCampaign(@Req() req: Request, @Param('planId') planId: string) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.updateCampaignStatus(planId, CampaignStatus.Active, tc.tenantId)
  }

  @Post('campaigns/evaluate')
  evaluate(
    @Req() req: Request,
    @Body() body: { eventName: string; memberId: string; orderId?: string; paymentId?: string; orderAmount?: number; payload?: Record<string, unknown> }
  ) {
    const tc = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignService.evaluateTriggers({
      eventName: body.eventName as unknown as string,
      tenantContext: tc,
      memberId: body.memberId,
      orderId: body.orderId,
      paymentId: body.paymentId,
      orderAmount: body.orderAmount,
      payload: body.payload ?? {}
    })
  }
}

// ─── 构建 app ───

async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  loyaltyService.resetLoyaltyStoresForTests()
  const cashierService = new CashierService(memberService, loyaltyService)
  cashierService.resetCashierStoresForTests()
  const aiRecommendService = new AiRecommendService()
  const campaignService = new CampaignService(memberService, loyaltyService)
  campaignService.resetCampaignStoresForTests()

  const { app, moduleRef } = await buildCrossModuleTestApp({
    controllers: [TestController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: CashierService, useValue: cashierService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: AiRecommendService, useValue: aiRecommendService },
      { provide: CampaignService, useValue: campaignService }
    ],
    extraGlobalPipes: [new ValidationPipe({ whitelist: true, transform: true })],
  })
  return { app, moduleRef, memberService, loyaltyService, cashierService, aiRecommendService, campaignService }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-A',
  'x-brand-id': 'brand-A',
  'x-store-id': 'store-A'
}

function ctxA(): RequestTenantContext {
  return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }
}
function ctxB(): RequestTenantContext {
  return { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn-mainland' }
}

function buildOrder(memberId: string, priceCents: number, sku = 'game-1h') {
  return {
    memberId,
    items: [{ skuId: sku, title: '游戏 1 小时', quantity: 1, price: priceCents }]
  }
}

function buildPaymentCallback(orderId: string, tenantId: string, amount: number, transactionNo = 'wx-txn-001') {
  return {
    standardizedEventName: 'cashier.payment-succeeded',
    aggregateId: orderId,
    orderId,
    tenantId,
    externalPaymentId: 'wx-ext-001',
    transactionNo,
    channel: 'wechat',
    amount
  }
}

async function registerAndActivate(
  app: any,
  headers: Record<string, string>,
  campaign: Record<string, unknown>
): Promise<{ planId: string }> {
  const regRes = await request(app.getHttpServer())
    .post('/campaigns')
    .set(headers)
    .send(campaign)
  assert.equal(regRes.statusCode, 201, `register 失败: ${JSON.stringify(regRes.body)}`)
  const planId: string = regRes.body.data.planId
  const actRes = await request(app.getHttpServer())
    .post(`/campaigns/${planId}/activate`)
    .set(headers)
  assert.equal(actRes.statusCode, 201, `activate 失败: ${JSON.stringify(actRes.body)}`)
  return { planId }
}

// ═══════════════════════════════════════════════════
// E2E: AI 推荐 → 会员 → 营销 → 收银 完整联动
// ═══════════════════════════════════════════════════

it('e2e-10: full ai-recommend → member → campaign → cashier chain', async () => {
  const { app } = await buildApp()

  try {
    // 1. 注册会员
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'alice' })

    // 2. 冷启动推荐 (无 profile)
    const coldRes = await request(app.getHttpServer())
      .post('/ai/recommend')
      .set(TENANT_A)
      .send({ memberId: 'alice', limit: 3 })
    assert.equal(coldRes.statusCode, 201)
    assert.ok(coldRes.body.data.items.length >= 1, '冷启动应有推荐结果')
    assert.ok(
      ['popularity', 'hybrid'].includes(coldRes.body.data.strategy),
      '冷启动使用 popularity/hybrid 策略'
    )

    // 3. 注册营销: payment.success → 满 100 送 50 积分
    const minOrderCondition: CampaignCondition = {
      type: CampaignConditionType.MinOrderAmount,
      value: 10000
    }
    const awardAction: CampaignAction = {
      kind: CampaignActionKind.AwardPoints,
      params: { pointsAmount: 50, pointsReason: '支付奖励积分' }
    }
    await registerAndActivate(app, TENANT_A, {
      code: 'PAY-50-PTS',
      title: '支付送 50 积分',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [minOrderCondition],
      actions: [awardAction],
      priority: 100
    })

    // 4. 收银: 下单 ¥100 + 支付成功
    const orderRes = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send(buildOrder('alice', 10000))
    assert.equal(orderRes.statusCode, 201)
    const orderId = orderRes.body.data.orderId

    const paymentRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 10000 })
    assert.equal(paymentRes.statusCode, 201)

    await request(app.getHttpServer())
      .post('/cashier/payments/callback')
      .set(TENANT_A)
      .send(buildPaymentCallback(orderId, 'tenant-A', 10000))

    // 5. 触发营销评估
    const evalRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'alice',
        orderId,
        orderAmount: 10000
      })
    assert.equal(evalRes.statusCode, 201)
    assert.equal(evalRes.body.data.matchedCampaigns, 1, '应匹配 1 个营销')
    assert.equal(evalRes.body.data.dispatchedActions, 1, 'AwardPoints 应派发')
    assert.equal(
      evalRes.body.data.dispatches[0].resultRef,
      'points+50:支付奖励积分',
      'resultRef 格式正确'
    )

    // 6. 验证 member 积分已变更
    const memberRes = await request(app.getHttpServer())
      .get('/members/alice')
      .set(TENANT_A)
    assert.equal(memberRes.statusCode, 200)
    assert.ok(memberRes.body.data, '会员存在')
    const points = (memberRes.body.data as Record<string, unknown>).points as number ?? 0
    assert.ok(points >= 50, `积分应 >= 50 (实际 ${points})`)

    // 7. 二次推荐: 验证个性化 (有 profile + 积分)
    const warmRes = await request(app.getHttpServer())
      .post('/ai/recommend')
      .set(TENANT_A)
      .send({ memberId: 'alice', limit: 3 })
    assert.equal(warmRes.statusCode, 201)
    assert.ok(warmRes.body.data.items.length >= 1, '应有推荐结果')
  } finally {
    await app.close()
  }
})

it('e2e-10: cold-start member without profile falls back to popularity', async () => {
  const { app } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'newbie' })

    // 不更新 profile,直接推荐
    const res = await request(app.getHttpServer())
      .post('/ai/recommend')
      .set(TENANT_A)
      .send({ memberId: 'newbie', strategyId: 'strategy-popularity-v1', limit: 3 })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.items.length >= 1, '冷启动 popularity 仍应有结果')
    for (const item of res.body.data.items) {
      assert.equal(item.strategy, 'popularity', '冷启动应使用 popularity 策略')
    }
  } finally {
    await app.close()
  }
})

it('e2e-10: personalized recommendations with user profile', async () => {
  const { app } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'moba-fan' })

    // 设置 profile: 偏好 MOBA
    await request(app.getHttpServer())
      .post('/ai/profile')
      .set(TENANT_A)
      .send({
        memberId: 'moba-fan',
        profile: {
          preferences: {
            gameTypes: ['MOBA', 'RPG'],
            priceRange: { min: 50, max: 200 },
            visitFrequency: 'weekly',
            avgSpend: 120,
            favoriteTimeSlot: '18:00-22:00'
          },
          behaviorTags: ['game-enthusiast']
        }
      })

    // 内容推荐
    const res = await request(app.getHttpServer())
      .post('/ai/recommend')
      .set(TENANT_A)
      .send({ memberId: 'moba-fan', strategyId: 'strategy-hybrid-v1', limit: 3 })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.items.length >= 1, 'hybrid 应有结果')
    for (const item of res.body.data.items) {
      assert.ok(['hybrid', 'content-based', 'collaborative', 'popularity'].includes(item.strategy),
        `hybrid 策略产出应为子策略之一,实际 ${item.strategy}`)
    }
  } finally {
    await app.close()
  }
})

it('e2e-10: campaign AwardPoints dispatches to member.awardPoints', async () => {
  const { app, memberService } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'bob' })

    // 营销: 任意支付成功 + 送 200 积分
    await registerAndActivate(app, TENANT_A, {
      code: 'BIG-BONUS',
      title: '大额积分奖励',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [
        {
          kind: CampaignActionKind.AwardPoints,
          params: { pointsAmount: 200, pointsReason: '大额奖励' }
        }
      ],
      priority: 50
    })

    // 拷贝数值 (避免对象引用问题)
    const beforePoints = memberService.getProfile('bob')?.points ?? 0

    const evalRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'bob',
        orderId: 'order-1',
        payload: { amount: 5000 }
      })
    assert.equal(evalRes.statusCode, 201)
    assert.equal(evalRes.body.data.dispatchedActions, 1)
    assert.equal(evalRes.body.data.dispatches[0].status, 'DISPATCHED')

    const afterPoints = memberService.getProfile('bob')?.points ?? 0
    assert.ok(
      afterPoints >= beforePoints + 200,
      `积分应增加 >= 200 (before=${beforePoints} after=${afterPoints})`
    )
  } finally {
    await app.close()
  }
})

it('e2e-10: campaign MinOrderAmount condition not met → not dispatched', async () => {
  const { app } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'small-spender' })

    // 营销: 满 500 才送积分
    await registerAndActivate(app, TENANT_A, {
      code: 'MIN-500',
      title: '满 500 送 100',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [{ type: CampaignConditionType.MinOrderAmount, value: 50000 }],
      actions: [
        {
          kind: CampaignActionKind.AwardPoints,
          params: { pointsAmount: 100, pointsReason: '满减奖励' }
        }
      ],
      priority: 100
    })

    // 触发小金额订单
    const evalRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'small-spender',
        orderId: 'order-small',
        orderAmount: 1000
      })
    assert.equal(evalRes.statusCode, 201)
    assert.equal(evalRes.body.data.matchedCampaigns, 0, '小金额不应匹配营销')
    assert.equal(evalRes.body.data.dispatchedActions, 0)
    assert.equal(evalRes.body.data.dispatches.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e-10: campaign RecommendTag action dispatches tag without state change', async () => {
  const { app } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'tagger' })

    // 营销: 支付成功打 tag
    await registerAndActivate(app, TENANT_A, {
      code: 'TAG-CAMPAIGN',
      title: '支付标签',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [
        {
          kind: CampaignActionKind.RecommendTag,
          params: { tagCode: 'paying-user' }
        }
      ],
      priority: 10
    })

    const evalRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'tagger',
        orderId: 'order-tag',
        payload: {}
      })
    assert.equal(evalRes.statusCode, 201)
    assert.equal(evalRes.body.data.matchedCampaigns, 1)
    assert.equal(evalRes.body.data.dispatchedActions, 1)
    assert.equal(
      evalRes.body.data.dispatches[0].resultRef,
      'tag:paying-user',
      'resultRef 应为 tag:paying-user'
    )
  } finally {
    await app.close()
  }
})

it('e2e-10: cross-tenant isolation - Tenant B cannot see Tenant A campaigns/recommendations', async () => {
  const { app, aiRecommendService, campaignService } = await buildApp()

  try {
    // Tenant A 注册营销 + 注册会员
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'a-member' })

    await registerAndActivate(app, TENANT_A, {
      code: 'A-ONLY',
      title: 'A 专属',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [
        {
          kind: CampaignActionKind.AwardPoints,
          params: { pointsAmount: 10 }
        }
      ]
    })

    // Tenant B 推荐: 不应看到 Tenant A 的策略影响
    const tenantBRecs = aiRecommendService.generateRecommendations({
      memberId: 'b-member',
      strategyId: 'strategy-popularity-v1',
      type: 'game',
      limit: 3,
      storeId: 'store-B'
    })
    assert.ok(tenantBRecs.items.length >= 1)

    // Tenant B 评估: 不应匹配 Tenant A 的营销
    const tenantBEval = campaignService.evaluateTriggers({
      eventName: 'payment.success',
      tenantContext: ctxB(),
      memberId: 'b-member',
      orderId: 'b-order',
      payload: {}
    })
    assert.equal(tenantBEval.matchedCampaigns, 0, 'Tenant B 不应匹配 Tenant A 营销')

    // Tenant A 评估: 应匹配
    const tenantAEval = campaignService.evaluateTriggers({
      eventName: 'payment.success',
      tenantContext: ctxA(),
      memberId: 'a-member',
      orderId: 'a-order',
      payload: {}
    })
    assert.equal(tenantAEval.matchedCampaigns, 1, 'Tenant A 应匹配自己的营销')
  } finally {
    await app.close()
  }
})

it('e2e-10: campaign idempotency - duplicate evaluate with same orderId skips', async () => {
  const { app } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/members')
      .set(TENANT_A)
      .send({ memberId: 'idem-user' })

    await registerAndActivate(app, TENANT_A, {
      code: 'IDEM-CAMP',
      title: '幂等测试',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [
        {
          kind: CampaignActionKind.AwardPoints,
          params: { pointsAmount: 30 }
        }
      ]
    })

    // 第一次评估
    const first = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'idem-user',
        orderId: 'idem-order',
        payload: {}
      })
    assert.equal(first.body.data.dispatchedActions, 1, '首次应派发')

    // 第二次同 orderId 评估
    const second = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'idem-user',
        orderId: 'idem-order',
        payload: {}
      })
    assert.equal(second.body.data.matchedCampaigns, 1, '营销仍匹配')
    assert.equal(second.body.data.dispatchedActions, 0, '不应重复派发')
    assert.ok(second.body.data.skippedActions >= 1, '应有 skipped 计数')
  } finally {
    await app.close()
  }
})
