import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-module #26 — Marketing → Analytics Snapshot 闭环
 *
 * 链路:
 *   Marketing coupon issue/redeem
 *     → MarketingMetricsService 聚合
 *       → Analytics snapshot marketing group/totals
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import { AnalyticsController } from '../analytics/analytics.controller'
import { AnalyticsService } from '../analytics/analytics.service'
import { MarketingController } from '../marketing/marketing.controller'
import { CouponAdapter } from '../marketing/datasources/coupon.adapter'
import { RFMAdapter } from '../marketing/datasources/rfm.adapter'
import { CouponIssuer } from '../marketing/coupon-issuer'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import type { CouponIssueRequest } from '../marketing/marketing.entity'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp } from './test-helpers'

@Controller()
class TestMarketingAnalyticsController {
  constructor(
    @Inject(MarketingController) private readonly marketingController: MarketingController,
    @Inject(AnalyticsController) private readonly analyticsController: AnalyticsController
  ) {}

  @Post('marketing/coupon/issue')
  issueCoupon(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.marketingController.issueCoupon(body as unknown as CouponIssueRequest, req)
  }

  @Post('marketing/coupon/redeem')
  redeemCoupon(@Body() body: { tenantId: string; recordId: string }, @Req() req: Request) {
    return this.marketingController.redeemCoupon(body, req)
  }

  @Get('analytics/snapshot')
  getOperationSnapshot(
    @Req() req: Request,
    @Query() query: { scope?: 'TENANT' | 'BRAND' | 'STORE'; brandId?: string; storeId?: string }
  ) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.analyticsController.getOperationSnapshot(tenantContext, query as unknown as import('../analytics/analytics.dto').GetOperationSnapshotDto)
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
  const couponIssuer = new CouponIssuer(new CouponAdapter(), new RFMAdapter())
  const marketingMetricsService = new MarketingMetricsService()
  const mockObj = {} as Record<string, unknown>
  const marketingController = new MarketingController(
    mockObj as unknown as never,
    mockObj as unknown as never,
    couponIssuer,
    mockObj as unknown as never,
    mockObj as unknown as never,
    mockObj as unknown as never,
    mockObj as unknown as never,
    mockObj as unknown as never,
    marketingMetricsService
  )
  const analyticsService = new AnalyticsService(undefined, marketingMetricsService)
  const analyticsController = new AnalyticsController(analyticsService)

  const { app } = await buildCrossModuleTestApp({
    controllers: [TestMarketingAnalyticsController],
    providers: [
      { provide: MarketingController, useValue: marketingController },
      { provide: AnalyticsController, useValue: analyticsController },
    ],
    extraGlobalPipes: [new ValidationPipe({ whitelist: true, transform: true })],
  })

  return { app, marketingMetricsService }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-marketing-a',
  'x-brand-id': 'brand-marketing-a',
  'x-store-id': 'store-marketing-a',
}

const TENANT_B = {
  'x-tenant-id': 'tenant-marketing-b',
  'x-brand-id': 'brand-marketing-b',
  'x-store-id': 'store-marketing-b',
}

it('e2e xm26: marketing coupon issue + redeem is visible in analytics snapshot without PII', async () => {
  const { app } = await buildApp()

  try {
    const issueRes = await request(app.getHttpServer())
      .post('/marketing/coupon/issue')
      .set(TENANT_A)
      .send({
        tenantId: 'tenant-marketing-a',
        memberId: 'member-private-001',
        campaignId: 'campaign-xm26',
        couponSegment: 'WELCOME_OFFER',
        expiryDays: 7,
      })
    assert.equal(issueRes.statusCode, 201)

    const issueData = unwrap<any>(issueRes)
    assert.equal(issueData.success, true)
    assert.ok(issueData.record?.id)

    const redeemRes = await request(app.getHttpServer())
      .post('/marketing/coupon/redeem')
      .set(TENANT_A)
      .send({
        tenantId: 'tenant-marketing-a',
        recordId: issueData.record.id,
      })
    assert.equal(redeemRes.statusCode, 201)
    assert.equal(unwrap<any>(redeemRes).success, true)

    const snapshotRes = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .query({ scope: 'TENANT' })
    assert.equal(snapshotRes.statusCode, 200)

    const snapshot = unwrap<any>(snapshotRes)
    assert.equal(metricValue(snapshot, 'marketing', 'couponIssuedTotal'), 1)
    assert.equal(metricValue(snapshot, 'marketing', 'couponRedemptionTotal'), 1)
    assert.equal(totalValue(snapshot, 'totalCouponsIssued'), 1)
    assert.equal(totalValue(snapshot, 'totalMarketingRedemptions'), 1)
    assert.ok(!JSON.stringify(snapshot).includes('member-private-001'))
    assert.equal((snapshot as Record<string, unknown>).memberId, undefined)
    assert.equal((snapshot as Record<string, unknown>).memberPhone, undefined)
  } finally {
    await app.close()
  }
})

it('e2e xm26: marketing analytics snapshot keeps tenant isolation', async () => {
  const { app } = await buildApp()

  try {
    await request(app.getHttpServer())
      .post('/marketing/coupon/issue')
      .set(TENANT_A)
      .send({
        tenantId: 'tenant-marketing-a',
        memberId: 'member-isolation-001',
        campaignId: 'campaign-isolation',
        couponSegment: 'WELCOME_OFFER',
        expiryDays: 7,
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
    assert.equal(metricValue(snapB, 'marketing', 'couponIssuedTotal'), 0)
    assert.equal(totalValue(snapA, 'totalCouponsIssued'), 1)
    assert.equal(totalValue(snapB, 'totalCouponsIssued'), 0)
    assert.equal(totalValue(snapB, 'totalMarketingRedemptions'), 0)
  } finally {
    await app.close()
  }
})
