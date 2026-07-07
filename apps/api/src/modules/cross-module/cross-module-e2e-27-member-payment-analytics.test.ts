import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-module #27 — Member Payment Activity → Analytics Snapshot 闭环
 *
 * 链路:
 *   MemberService.register
 *     → MemberService.recordPaymentActivity
 *       → MarketingMetricsService 聚合
 *         → Analytics snapshot marketing group/totals
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
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import { AnalyticsController } from '../analytics/analytics.controller'
import { AnalyticsService } from '../analytics/analytics.service'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp } from './test-helpers'

@Controller()
class TestMemberPaymentAnalyticsController {
  constructor(
    @Inject(MemberService) private readonly memberService: MemberService,
    @Inject(AnalyticsController) private readonly analyticsController: AnalyticsController
  ) {}

  @Post('members/register')
  registerMember(@Req() req: Request, @Body() body: { memberId: string; nickname: string }) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.memberService.register({
      memberId: body.memberId,
      tenantContext,
      nickname: body.nickname
    })
  }

  @Post('members/:memberId/payment-activity')
  async recordPaymentActivity(
    @Req() req: Request,
    @Param('memberId') memberId: string,
    @Body()
    body: {
      orderId: string
      amount: number
      paidAt?: string
      channel?: string
      source?: 'cashier' | 'lyt-snapshot'
    }
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.memberService.recordPaymentActivity({
      memberId,
      tenantContext,
      orderId: body.orderId,
      amount: body.amount,
      paidAt: body.paidAt,
      channel: body.channel,
      source: body.source
    })
  }

  @Get('analytics/snapshot')
  getOperationSnapshot(
    @Req() req: Request,
    @Query() query: { scope?: 'TENANT' | 'BRAND' | 'STORE'; brandId?: string; storeId?: string }
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsController.getOperationSnapshot(tenantContext, query as any)
  }
}

function unwrap<T>(response: { body?: { data?: T } }): T {
  return response.body?.data as T
}

function metricValue(
  snapshot: { groups: Array<{ groupKey: string; metrics: Array<{ key: string; value: number }> }> },
  groupKey: string,
  key: string
): number | undefined {
  return snapshot.groups
    .find((group) => group.groupKey === groupKey)
    ?.metrics.find((metric) => metric.key === key)
    ?.value
}

function totalValue(
  snapshot: { totals: Array<{ key: string; value: number }> },
  key: string
): number | undefined {
  return snapshot.totals.find((metric) => metric.key === key)?.value
}

async function buildApp() {
  resetMemberServiceTestState()
  const marketingMetricsService = new MarketingMetricsService()
  const memberService = new MemberService(undefined, undefined, marketingMetricsService)
  const analyticsService = new AnalyticsService(undefined, marketingMetricsService)
  const analyticsController = new AnalyticsController(analyticsService)

  const { app } = await buildCrossModuleTestApp({
    controllers: [TestMemberPaymentAnalyticsController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: AnalyticsController, useValue: analyticsController },
    ],
    extraGlobalPipes: [new ValidationPipe({ whitelist: true, transform: true })],
  })

  return { app }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-member-a',
  'x-brand-id': 'brand-member-a',
  'x-store-id': 'store-member-a',
}

const TENANT_B = {
  'x-tenant-id': 'tenant-member-b',
  'x-brand-id': 'brand-member-b',
  'x-store-id': 'store-member-b',
}

it('e2e xm27: member payment activity writes coupon and notification metrics into analytics snapshot', async () => {
  const { app } = await buildApp()

  try {
    const registerRes = await request(app.getHttpServer())
      .post('/members/register')
      .set(TENANT_A)
      .send({
        memberId: 'member-payment-001',
        nickname: 'Sleep Mode User'
      })
    assert.equal(registerRes.statusCode, 201)
    assert.equal(unwrap<any>(registerRes).memberId, 'member-payment-001')

    const paymentRes = await request(app.getHttpServer())
      .post('/members/member-payment-001/payment-activity')
      .set(TENANT_A)
      .send({
        orderId: 'order-payment-001',
        amount: 288,
        paidAt: '2026-07-02T22:00:00.000Z',
        channel: 'wechat-pay',
        source: 'lyt-snapshot'
      })
    assert.equal(paymentRes.statusCode, 201)

    const paymentData = unwrap<any>(paymentRes)
    assert.equal(paymentData.memberId, 'member-payment-001')
    assert.equal(paymentData.lifecycleStage, 'repeat-paid')

    const snapshotRes = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .query({ scope: 'TENANT' })
    assert.equal(snapshotRes.statusCode, 200)

    const snapshot = unwrap<any>(snapshotRes)
    assert.equal(metricValue(snapshot, 'marketing', 'couponIssuedTotal'), 1)
    assert.equal(metricValue(snapshot, 'marketing', 'notificationDispatchTotal'), 3)
    assert.equal(metricValue(snapshot, 'marketing', 'couponRedemptionTotal'), 0)
    assert.equal(totalValue(snapshot, 'totalCouponsIssued'), 1)
    assert.equal(totalValue(snapshot, 'totalNotifications'), 3)
    assert.equal(totalValue(snapshot, 'totalMarketingRedemptions'), 0)
    assert.ok(!JSON.stringify(snapshot).includes('member-payment-001'))
    assert.equal((snapshot as any).memberId, undefined)
    assert.equal((snapshot as any).mobile, undefined)
  } finally {
    await app.close()
  }
})

it('e2e xm27: member payment analytics snapshot keeps tenant isolation', async () => {
  const { app } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/members/register')
      .set(TENANT_A)
      .send({
        memberId: 'member-payment-iso-001',
        nickname: 'Tenant A User'
      })

    await request(app.getHttpServer())
      .post('/members/member-payment-iso-001/payment-activity')
      .set(TENANT_A)
      .send({
        orderId: 'order-payment-iso-001',
        amount: 288,
        paidAt: '2026-07-02T22:05:00.000Z',
        channel: 'wechat-pay',
        source: 'lyt-snapshot'
      })

    const snapARes = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .query({ scope: 'TENANT' })
    const snapBRes = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_B)
      .query({ scope: 'TENANT' })

    const snapA = unwrap<any>(snapARes)
    const snapB = unwrap<any>(snapBRes)
    assert.equal(metricValue(snapA, 'marketing', 'couponIssuedTotal'), 1)
    assert.equal(metricValue(snapA, 'marketing', 'notificationDispatchTotal'), 3)
    assert.equal(metricValue(snapB, 'marketing', 'couponIssuedTotal'), 0)
    assert.equal(metricValue(snapB, 'marketing', 'notificationDispatchTotal'), 0)
    assert.equal(totalValue(snapB, 'totalCouponsIssued'), 0)
    assert.equal(totalValue(snapB, 'totalNotifications'), 0)
  } finally {
    await app.close()
  }
})
