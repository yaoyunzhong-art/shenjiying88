import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cross-module #28 — Campaign Evaluate → Analytics Snapshot 闭环
 *
 * 链路:
 *   Campaign register/activate/evaluate
 *     → CampaignService
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
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import { AnalyticsController } from '../analytics/analytics.controller'
import { AnalyticsService } from '../analytics/analytics.service'
import { CampaignController } from '../campaign/campaign.controller'
import { CampaignService } from '../campaign/campaign.service'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp } from './test-helpers'

@Controller()
class TestCampaignAnalyticsController {
  constructor(
    @Inject(CampaignController) private readonly campaignController: CampaignController,
    @Inject(AnalyticsController) private readonly analyticsController: AnalyticsController
  ) {}

  @Post('campaigns')
  registerCampaign(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignController.registerCampaign(tenantContext, body as unknown as import('../campaign/campaign.dto').RegisterCampaignDto)
  }

  @Patch('campaigns/:planId/status')
  updateCampaignStatus(
    @Req() req: Request,
    @Param('planId') planId: string,
    @Body() body: { status: string }
  ) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignController.updateCampaignStatus(tenantContext, planId, body as unknown as import('../campaign/campaign.dto').UpdateCampaignStatusDto)
  }

  @Post('campaigns/evaluate')
  evaluateCampaign(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.campaignController.evaluateTriggers(tenantContext, body as unknown as import('../campaign/campaign.dto').EvaluateCampaignDto)
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

async function buildApp() {
  const marketingMetricsService = new MarketingMetricsService()
  const campaignService = new CampaignService(undefined, undefined, marketingMetricsService)
  campaignService.resetCampaignStoresForTests()
  const campaignController = new CampaignController(campaignService)
  const analyticsService = new AnalyticsService(undefined, marketingMetricsService)
  const analyticsController = new AnalyticsController(analyticsService)

  const { app } = await buildCrossModuleTestApp({
    controllers: [TestCampaignAnalyticsController],
    providers: [
      { provide: CampaignController, useValue: campaignController },
      { provide: AnalyticsController, useValue: analyticsController },
    ],
    extraGlobalPipes: [new ValidationPipe({ whitelist: true, transform: true })],
  })

  return { app }
}

const TENANT_A = {
  'x-tenant-id': 'tenant-campaign-a',
  'x-brand-id': 'brand-campaign-a',
  'x-store-id': 'store-campaign-a',
}

const TENANT_B = {
  'x-tenant-id': 'tenant-campaign-b',
  'x-brand-id': 'brand-campaign-b',
  'x-store-id': 'store-campaign-b',
}

it('e2e xm28: campaign evaluate writes trigger and dispatch metrics into analytics snapshot', async () => {
  const { app } = await buildApp()

  try {
    const registerRes = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM28-CAMPAIGN',
        title: 'campaign analytics metrics',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'campaign-analytics' } }]
      })
    assert.equal(registerRes.statusCode, 201)
    const planId = unwrap<any>(registerRes).planId

    const activateRes = await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })
    assert.equal(activateRes.statusCode, 200)

    const evaluateRes = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'member-campaign-001',
        orderId: 'order-campaign-001'
      })
    assert.equal(evaluateRes.statusCode, 201)
    assert.equal(unwrap<any>(evaluateRes).matchedCampaigns, 1)
    assert.equal(unwrap<any>(evaluateRes).dispatchedActions, 1)

    const snapshotRes = await request(app.getHttpServer())
      .get('/analytics/snapshot')
      .set(TENANT_A)
      .query({ scope: 'TENANT' })
    assert.equal(snapshotRes.statusCode, 200)

    const snapshot = unwrap<any>(snapshotRes)
    assert.equal(metricValue(snapshot, 'marketing', 'campaignTriggerTotal'), 1)
    assert.equal(metricValue(snapshot, 'marketing', 'campaignDispatchedTotal'), 1)
    assert.equal(metricValue(snapshot, 'marketing', 'couponIssuedTotal'), 0)
    assert.ok(!JSON.stringify(snapshot).includes('member-campaign-001'))
  } finally {
    await app.close()
  }
})

it('e2e xm28: campaign analytics snapshot keeps tenant isolation', async () => {
  const { app } = await buildApp()

  try {
    const registerRes = await request(app.getHttpServer())
      .post('/campaigns')
      .set(TENANT_A)
      .send({
        code: 'XM28-ISO',
        title: 'campaign analytics isolation',
        triggerEvent: 'payment.success',
        actions: [{ kind: 'RECOMMEND_TAG', params: { tagCode: 'campaign-isolation' } }]
      })
    const planId = unwrap<any>(registerRes).planId

    await request(app.getHttpServer())
      .patch(`/campaigns/${planId}/status`)
      .set(TENANT_A)
      .send({ status: 'ACTIVE' })

    await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set(TENANT_A)
      .send({
        eventName: 'payment.success',
        memberId: 'member-campaign-iso',
        orderId: 'order-campaign-iso'
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
    assert.equal(metricValue(snapA, 'marketing', 'campaignTriggerTotal'), 1)
    assert.equal(metricValue(snapA, 'marketing', 'campaignDispatchedTotal'), 1)
    assert.equal(metricValue(snapB, 'marketing', 'campaignTriggerTotal'), 0)
    assert.equal(metricValue(snapB, 'marketing', 'campaignDispatchedTotal'), 0)
  } finally {
    await app.close()
  }
})
