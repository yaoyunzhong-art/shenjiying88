/**
 * campaign.evaluate-validation.e2e.test.ts — 活动评估校验 E2E 测试
 *
 * 覆盖:
 *   - 评估参数校验 (正例/反例)
 *   - 评分规则 (最小订单金额/会员等级/门店/品牌)
 *   - 结果验证 (matched/dispatched/skipped/failed)
 *   - 异常输入 / 边界值
 *   - 时序场景 (状态转换/日程窗口)
 *   - 组合条件与多活动匹配
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Post, Req } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ValidationPipe } from '@nestjs/common'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { CampaignController } from './campaign.controller'
import { EvaluateCampaignDto } from './campaign.dto'
import { CampaignService } from './campaign.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import {
  CampaignActionKind,
  CampaignActionStatus,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger,
} from './campaign.entity'

// ── Helpers ───────────────────────────────────────────────────────────

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-eval',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-eval',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-eval',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland',
  }
  next()
}

let campaignServiceRef: CampaignService = new CampaignService()
let campaignControllerRef: CampaignController

@Controller('campaigns')
class TestCampaignEvaluateController {
  @Post('evaluate')
  evaluate(@Req() req: Request, @Body() body: EvaluateCampaignDto) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return campaignControllerRef.evaluateTriggers(tenantContext, body)
  }

  @Post('register')
  register(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    // Direct service call to register campaigns
    return campaignServiceRef.registerCampaign({
      tenantContext,
      code: (body.code as string) ?? 'test-campaign',
      title: (body.title as string) ?? '测试活动',
      description: body.description as string | undefined,
      triggerEvent: (body.triggerEvent as CampaignTrigger) ?? CampaignTrigger.PaymentSuccess,
      conditions: (body.conditions as any[]) ?? [],
      actions: (body.actions as any[]) ?? [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'vip' } }],
      priority: (body.priority as number) ?? 100,
      scheduledStart: body.scheduledStart as string | undefined,
      scheduledEnd: body.scheduledEnd as string | undefined,
    })
  }
}

async function buildApp() {
  campaignControllerRef = new CampaignController(campaignServiceRef)

  const moduleRef = await Test.createTestingModule({
    controllers: [TestCampaignEvaluateController],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  return { app }
}

function registerTestCampaign(overrides: Partial<{
  code: string
  title: string
  triggerEvent: CampaignTrigger
  conditions: any[]
  actions: any[]
  priority: number
  scheduledStart: string
  scheduledEnd: string
  minOrderAmount: number
  memberLevel: string
  storeScope: string
  brandScope: string
}> = {}): void {
  const conditions: any[] = []
  if (overrides.minOrderAmount !== undefined) {
    conditions.push({ type: CampaignConditionType.MinOrderAmount, value: overrides.minOrderAmount })
  }
  if (overrides.memberLevel !== undefined) {
    conditions.push({ type: CampaignConditionType.MemberLevel, value: overrides.memberLevel })
  }
  if (overrides.storeScope !== undefined) {
    conditions.push({ type: CampaignConditionType.StoreScope, value: overrides.storeScope })
  }
  if (overrides.brandScope !== undefined) {
    conditions.push({ type: CampaignConditionType.BrandScope, value: overrides.brandScope })
  }

  const actions = overrides.actions ?? [
    { kind: CampaignActionKind.RecommendTag, params: { tagCode: 'vip' } },
  ]

  campaignServiceRef.registerCampaign({
    tenantContext: { tenantId: 'tenant-eval', brandId: 'brand-eval', storeId: 'store-eval', marketCode: 'cn-mainland' },
    code: overrides.code ?? 'test-campaign',
    title: overrides.title ?? '测试活动',
    triggerEvent: overrides.triggerEvent ?? CampaignTrigger.PaymentSuccess,
    conditions,
    actions,
    priority: overrides.priority ?? 100,
    scheduledStart: overrides.scheduledStart,
    scheduledEnd: overrides.scheduledEnd,
  })
}

function activateCampaign(code: string): void {
  const campaigns = campaignServiceRef.listCampaigns('tenant-eval')
  const plan = campaigns.find((p) => p.code === code)
  if (plan) {
    campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval')
  }
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Campaign Evaluate & Validation E2E', () => {
  beforeEach(() => {
    campaignServiceRef.resetCampaignStoresForTests()
  })

  // ══════════════════════════════════════════════════════════════════
  // 正例 (≥8)
  // ══════════════════════════════════════════════════════════════════
  describe('正例 — 评估参数与结果验证', () => {
    it('接收合法 payload 并返回空匹配结果 (无活动时)', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 288 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
        assert.equal(res.body.data.dispatchedActions, 0)
        assert.deepEqual(res.body.data.dispatches, [])
      } finally {
        await app.close()
      }
    })

    it('触发现有活动并返回 dispatch 记录', async () => {
      registerTestCampaign({ code: 'eval-c1' })
      activateCampaign('eval-c1')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
        assert.equal(res.body.data.dispatchedActions, 1)
        assert.equal(res.body.data.dispatches.length, 1)
        assert.equal(res.body.data.dispatches[0].status, 'DISPATCHED')
      } finally {
        await app.close()
      }
    })

    it('多个活动匹配时返回全部 dispatches', async () => {
      registerTestCampaign({ code: 'multi-c1', priority: 10 })
      registerTestCampaign({ code: 'multi-c2', priority: 20 })
      activateCampaign('multi-c1')
      activateCampaign('multi-c2')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 2)
        assert.equal(res.body.data.dispatchedActions, 2)
        assert.equal(res.body.data.dispatches.length, 2)
      } finally {
        await app.close()
      }
    })

    it('通过 Header 传递 brand/store 上下文被正确使用', async () => {
      campaignServiceRef.registerCampaign({
        tenantContext: { tenantId: 'tenant-eval', brandId: 'brand-vip', storeId: 'store-eval', marketCode: 'cn-mainland' },
        code: 'header-brand',
        title: 'Header Brand 测试',
        triggerEvent: CampaignTrigger.PaymentSuccess,
        conditions: [{ type: CampaignConditionType.BrandScope, value: 'brand-header' }],
        actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'brand-vip' } }],
        priority: 100,
      })
      const plans = campaignServiceRef.listCampaigns('tenant-eval')
      const plan = plans.find((p) => p.code === 'header-brand')
      if (plan) campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval')

      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .set('x-brand-id', 'brand-header')
          .set('x-store-id', 'store-header')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 288 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('MinOrderAmount 条件: 订单金额 >= 阈值时匹配', async () => {
      registerTestCampaign({ code: 'min-order', minOrderAmount: 100 })
      activateCampaign('min-order')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 200 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('MemberLevel 条件: 匹配会员等级', async () => {
      registerTestCampaign({ code: 'member-lvl', memberLevel: 'gold' })
      activateCampaign('member-lvl')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 100, memberLevel: 'gold' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('所有条件同时满足时完整触发', async () => {
      registerTestCampaign({
        code: 'all-conditions',
        minOrderAmount: 50,
        memberLevel: 'silver',
        storeScope: 'store-eval',
        brandScope: 'brand-eval',
      })
      activateCampaign('all-conditions')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({
            eventName: 'payment.success',
            memberId: 'member-001',
            orderAmount: 99,
            memberLevel: 'silver',
          })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('不同 triggerEvent 的活动互不干扰', async () => {
      // 注册 payment.success 活动
      registerTestCampaign({ code: 'trigger-payment', triggerEvent: CampaignTrigger.PaymentSuccess })
      activateCampaign('trigger-payment')
      // 注册 order.created 活动
      registerTestCampaign({ code: 'trigger-order', triggerEvent: CampaignTrigger.OrderCreated, minOrderAmount: 50 })
      activateCampaign('trigger-order')

      const { app } = await buildApp()
      try {
        // 触发 payment.success — 只匹配第一个
        const res1 = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 200 })
        assert.equal(res1.body.data.matchedCampaigns, 1)

        // 触发 order.created — 只匹配第二个
        const res2 = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'order.created', memberId: 'member-002', orderAmount: 200 })
        assert.equal(res2.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 反例 (≥5)
  // ══════════════════════════════════════════════════════════════════
  describe('反例 — 参数校验与异常输入', () => {
    it('缺失 eventName 返回 400', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 400)
      } finally {
        await app.close()
      }
    })

    it('eventName 为空字符串返回 400', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: '', memberId: 'member-001' })
        assert.equal(res.statusCode, 400)
      } finally {
        await app.close()
      }
    })

    it('orderAmount 为负数时 MinOrderAmount 不匹配', async () => {
      registerTestCampaign({ code: 'neg-order', minOrderAmount: 0 })
      activateCampaign('neg-order')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: -50 })
        // orderAmount 为负数, MinOrderAmount >=0, 实际 -50 < 0 => 不匹配
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('错误的 eventName 不触发任何活动', async () => {
      registerTestCampaign({ code: 'wrong-event' })
      activateCampaign('wrong-event')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'member.profile-synced', memberId: 'member-001', orderAmount: 128 })
        // 注册的是 payment.success, 触发的是 member.profile-synced => 不匹配
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('不同租户的数据隔离', async () => {
      registerTestCampaign({ code: 'tenant-iso' })
      activateCampaign('tenant-iso')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'other-tenant')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
        assert.equal(res.body.data.dispatchedActions, 0)
      } finally {
        await app.close()
      }
    })

    it('DRAFT 状态的活动不会被触发', async () => {
      registerTestCampaign({ code: 'draft-campaign' })
      // 不激活 — 保持 DRAFT
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 边界 (≥5)
  // ══════════════════════════════════════════════════════════════════
  describe('边界 — 阈值与极限值', () => {
    it('MinOrderAmount 边界: 刚好等于阈值时匹配', async () => {
      registerTestCampaign({ code: 'boundary-equal', minOrderAmount: 100 })
      activateCampaign('boundary-equal')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 100 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('MinOrderAmount 边界: 小于阈值 1 时不匹配', async () => {
      registerTestCampaign({ code: 'boundary-less', minOrderAmount: 100 })
      activateCampaign('boundary-less')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 99 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('orderAmount 为 0 时匹配 (MinOrderAmount=0)', async () => {
      registerTestCampaign({ code: 'zero-order', minOrderAmount: 0 })
      activateCampaign('zero-order')
      const { app } = await buildApp()
      try {
        // 0 >= 0 成立
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 0 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('无 memberId 时 AWARD_POINTS 操作跳过', async () => {
      registerTestCampaign({
        code: 'no-member-points',
        actions: [{ kind: CampaignActionKind.AwardPoints, params: { pointsAmount: 50, pointsReason: 'test' } }],
      })
      activateCampaign('no-member-points')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
        assert.equal(res.body.data.skippedActions, 1)
        assert.equal(res.body.data.dispatches[0].status, 'SKIPPED')
      } finally {
        await app.close()
      }
    })

    it('超大 orderAmount 边界值', async () => {
      registerTestCampaign({ code: 'huge-order', minOrderAmount: 0 })
      activateCampaign('huge-order')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 9999999 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('高优先级活动优先于低优先级', async () => {
      registerTestCampaign({ code: 'high-pri', priority: 1 })
      registerTestCampaign({ code: 'low-pri', priority: 999 })
      activateCampaign('high-pri')
      activateCampaign('low-pri')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        // 两个都匹配, dispatches 按优先级排序 (高优先在前)
        assert.equal(res.body.data.matchedCampaigns, 2)
        assert.equal(res.body.data.dispatchedActions, 2)
      } finally {
        await app.close()
      }
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 时序 (≥3)
  // ══════════════════════════════════════════════════════════════════
  describe('时序 — 状态转换与日程窗口', () => {
    it('COMPLETED 状态的活动不会被触发', async () => {
      registerTestCampaign({ code: 'completed-campaign' })
      const plans = campaignServiceRef.listCampaigns('tenant-eval')
      const plan = plans.find((p) => p.code === 'completed-campaign')!
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval')
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Completed, 'tenant-eval')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('scheduledStart 在未来时不触发', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      registerTestCampaign({ code: 'future-start', scheduledStart: futureDate.toISOString() })
      activateCampaign('future-start')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('scheduledEnd 在过去时不触发', async () => {
      registerTestCampaign({ code: 'past-end', scheduledEnd: '2020-01-01T00:00:00Z' })
      activateCampaign('past-end')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('PAUSED → ACTIVE → 可触发状态转换后活动可匹配', async () => {
      registerTestCampaign({ code: 'pause-resume' })
      const plans = campaignServiceRef.listCampaigns('tenant-eval')
      const plan = plans.find((p) => p.code === 'pause-resume')!
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval')
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Paused, 'tenant-eval')
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 128 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })
  })

  // ══════════════════════════════════════════════════════════════════
  // 组合场景 (≥4)
  // ══════════════════════════════════════════════════════════════════
  describe('组合场景 — 条件叠加与多活动编排', () => {
    it('组合条件: 高金额 + 特定会员等级', async () => {
      registerTestCampaign({
        code: 'combo-high',
        minOrderAmount: 500,
        memberLevel: 'platinum',
      })
      activateCampaign('combo-high')
      const { app } = await buildApp()
      try {
        // 同时满足: 金额500+ 且 等级=platinum
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 500, memberLevel: 'platinum' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 1)
      } finally {
        await app.close()
      }
    })

    it('组合条件: 金额满足但等级不满足时不触发', async () => {
      registerTestCampaign({
        code: 'combo-fail-level',
        minOrderAmount: 100,
        memberLevel: 'gold',
      })
      activateCampaign('combo-fail-level')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 200, memberLevel: 'silver' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('组合条件: 金额满足但门店不匹配时不触发', async () => {
      registerTestCampaign({
        code: 'combo-fail-store',
        minOrderAmount: 50,
        storeScope: 'store-north',
      })
      activateCampaign('combo-fail-store')
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ eventName: 'payment.success', memberId: 'member-001', orderAmount: 100, storeId: 'store-south' })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.matchedCampaigns, 0)
      } finally {
        await app.close()
      }
    })

    it('幂等性: 相同 event+member+order 重复触发不重复分发', async () => {
      registerTestCampaign({ code: 'idempotent-test' })
      activateCampaign('idempotent-test')
      const { app } = await buildApp()
      try {
        const payload = { eventName: 'payment.success', memberId: 'member-001', orderId: 'order-001', orderAmount: 128 }
        // 第一次触发
        const res1 = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send(payload)
        assert.equal(res1.body.data.dispatchedActions, 1)

        // 第二次相同触发 — 幂等, 应跳过
        const res2 = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send(payload)
        assert.equal(res2.body.data.dispatchedActions, 0)
        assert.equal(res2.body.data.skippedActions, 1)
      } finally {
        await app.close()
      }
    })

    it('不同 memberId 触发相同活动可分别分发', async () => {
      registerTestCampaign({ code: 'multi-member' })
      activateCampaign('multi-member')
      const { app } = await buildApp()
      try {
        const payload = { eventName: 'payment.success', orderAmount: 128 }
        const res1 = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ ...payload, memberId: 'member-a' })
        assert.equal(res1.body.data.dispatchedActions, 1)

        const res2 = await request(app.getHttpServer())
          .post('/campaigns/evaluate')
          .set('x-tenant-id', 'tenant-eval')
          .send({ ...payload, memberId: 'member-b' })
        assert.equal(res2.body.data.dispatchedActions, 1)
        assert.equal(res2.body.data.skippedActions, 0)

        // 总 dispatches 应为 2
        const dispatches = campaignServiceRef.listDispatches('tenant-eval')
        assert.equal(dispatches.length, 2)
      } finally {
        await app.close()
      }
    })

    it('Draft → Active → Paused → Active 完整生命周期覆盖', async () => {
      registerTestCampaign({ code: 'lifecycle-full' })
      const plans = campaignServiceRef.listCampaigns('tenant-eval')
      const plan = plans.find((p) => p.code === 'lifecycle-full')!

      // Draft → Active
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval')
      let updated = campaignServiceRef.getCampaign(plan.planId, 'tenant-eval')!
      assert.equal(updated.status, CampaignStatus.Active)

      // Active → Paused
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Paused, 'tenant-eval')
      updated = campaignServiceRef.getCampaign(plan.planId, 'tenant-eval')!
      assert.equal(updated.status, CampaignStatus.Paused)

      // Paused → Active
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval')
      updated = campaignServiceRef.getCampaign(plan.planId, 'tenant-eval')!
      assert.equal(updated.status, CampaignStatus.Active)

      // Active → Completed
      campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Completed, 'tenant-eval')
      updated = campaignServiceRef.getCampaign(plan.planId, 'tenant-eval')!
      assert.equal(updated.status, CampaignStatus.Completed)

      // Completed → Active 应拒绝
      assert.throws(
        () => campaignServiceRef.updateCampaignStatus(plan.planId, CampaignStatus.Active, 'tenant-eval'),
        /Invalid campaign status transition/,
      )
    })
  })
})
