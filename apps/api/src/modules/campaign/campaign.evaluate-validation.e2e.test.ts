import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Post, Req, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { CampaignController } from './campaign.controller'
import { EvaluateCampaignDto } from './campaign.dto'
import { CampaignService } from './campaign.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-eval',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-eval',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-eval',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

async function buildApp() {
  campaignServiceRef = new CampaignService()
  campaignServiceRef.resetCampaignStoresForTests()
  campaignControllerRef = new CampaignController(campaignServiceRef)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestCampaignEvaluateController]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  return { app }
}

let campaignServiceRef: CampaignService
let campaignControllerRef: CampaignController

@Controller('campaigns')
class TestCampaignEvaluateController {
  @Post('evaluate')
  evaluate(@Req() req: Request, @Body() body: EvaluateCampaignDto) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return campaignControllerRef.evaluateTriggers(tenantContext, body)
  }
}

it('e2e: campaign evaluate rejects invalid payload without eventName', async () => {
  const { app } = await buildApp()

  try {
    const response = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set('x-tenant-id', 'tenant-eval')
      .send({
        memberId: 'member-001',
        orderAmount: 128
      })

    assert.equal(response.statusCode, 400)
  } finally {
    await app.close()
  }
})

it('e2e: campaign evaluate accepts dto payload and derives brand/store from tenant context', async () => {
  const { app } = await buildApp()

  try {
    const response = await request(app.getHttpServer())
      .post('/campaigns/evaluate')
      .set('x-tenant-id', 'tenant-eval')
      .set('x-brand-id', 'brand-header')
      .set('x-store-id', 'store-header')
      .send({
        eventName: 'payment.success',
        memberId: 'member-001',
        orderId: 'order-001',
        orderAmount: '288'
      })

    assert.equal(response.statusCode, 201)
    assert.equal(response.body.data.matchedCampaigns, 0)
    assert.equal(response.body.data.dispatchedActions, 0)
    assert.deepEqual(response.body.data.dispatches, [])
  } finally {
    await app.close()
  }
})
