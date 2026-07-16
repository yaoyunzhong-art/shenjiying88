import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Billing 计费结算 HTTP 链路
 *
 * 链路:
 *   HTTP → TestBillingController → BillingService
 *
 * 验证:
 *   - 账单计算与阶梯折扣
 *   - 发票生成与支付
 *   - 计费统计
 *   - 跨租户计费结果不同
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Body, Param } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { BillingService } from './billing.service'
import type { PricingTier, Currency } from './billing.service'

@Controller('test/billing')
class TestBillingController {
  constructor(
    @Inject(BillingService) private readonly svc: BillingService,
  ) {}

  @Post('calculate')
  calculate(@Body() body: { tenantId: string; tier: PricingTier; usage: { apiCalls: number; storageGB: number; bandwidthGB: number; seats: number }; billingPeriod: { start: string; end: string }; currency: Currency; couponCode?: string }) {
    const result = this.svc.calculateBill({
      tenantId: body.tenantId,
      tier: body.tier,
      usage: body.usage,
      billingPeriod: body.billingPeriod,
      currency: body.currency,
      couponCode: body.couponCode,
    })
    return { success: true, data: result }
  }

  @Post('invoices')
  generateInvoice(@Body() body: { tenantId: string; tier: PricingTier; usage: { apiCalls: number; storageGB: number; bandwidthGB: number; seats: number }; billingPeriod: { start: string; end: string }; currency: Currency; couponCode?: string }) {
    const bill = this.svc.calculateBill({
      tenantId: body.tenantId,
      tier: body.tier,
      usage: body.usage,
      billingPeriod: body.billingPeriod,
      currency: body.currency,
      couponCode: body.couponCode,
    })
    const inv = this.svc.generateInvoice(bill)
    return { success: true, data: inv }
  }

  @Get('stats')
  stats() {
    return { success: true, data: this.svc.getBillingStats() }
  }
}

async function buildApp() {
  const billingService = new BillingService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestBillingController],
    providers: [
      { provide: BillingService, useValue: billingService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, billingService }
}

const proUsage = {
  apiCalls: 50000,
  storageGB: 100,
  bandwidthGB: 500,
  seats: 10,
}

const billingPeriod = {
  start: '2026-07-01T00:00:00Z',
  end: '2026-07-31T23:59:59Z',
}

it('e2e: calculate pro-tier bill returns correct line items and total', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't1', tier: 'pro', usage: proUsage, billingPeriod, currency: 'CNY' })
    assert.equal(res.statusCode, 201)
    const data = res.body.data
    assert.equal(data.tenantId, 't1')
    assert.equal(data.tier, 'pro')
    assert.equal(data.currency, 'CNY')
    assert.equal(data.lineItems.length, 5)
    assert.ok(data.subtotal > 0)
    assert.ok(data.total > 0)
    assert.equal(data.discountLabel, '无折扣')
  } finally {
    await app.close()
  }
})

it('e2e: generate invoice then verify stats updated', async () => {
  const { app } = await buildApp()
  try {
    const invRes = await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't2', tier: 'basic', usage: { apiCalls: 10000, storageGB: 20, bandwidthGB: 100, seats: 3 }, billingPeriod, currency: 'USD' })
    assert.equal(invRes.statusCode, 201)
    assert.ok(invRes.body.data.invoiceNo)
    assert.equal(invRes.body.data.status, 'draft')
    assert.equal(invRes.body.data.currency, 'USD')

    const statsRes = await request(app.getHttpServer()).get('/test/billing/stats')
    assert.equal(statsRes.body.data.invoiceCount, 1)
    assert.ok(statsRes.body.data.totalInvoiced > 0)
  } finally {
    await app.close()
  }
})

it('e2e: volume discount applies at high amount', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't3', tier: 'enterprise', usage: { apiCalls: 2000000, storageGB: 1000, bandwidthGB: 5000, seats: 100 }, billingPeriod, currency: 'CNY' })
    assert.equal(res.body.data.discountAmount > 0, true)
    assert.match(res.body.data.discountLabel, /批量/)
  } finally {
    await app.close()
  }
})

it('e2e: different tenants get independent billing results', async () => {
  const { app } = await buildApp()
  try {
    const a = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-a', tier: 'pro', usage: proUsage, billingPeriod, currency: 'CNY' })
    const b = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-b', tier: 'basic', usage: { apiCalls: 1000, storageGB: 5, bandwidthGB: 10, seats: 1 }, billingPeriod, currency: 'CNY' })
    assert.ok(a.body.data.subtotal > b.body.data.subtotal)
    assert.equal(a.body.data.tenantId, 't-a')
    assert.equal(b.body.data.tenantId, 't-b')
  } finally {
    await app.close()
  }
})

it('e2e: free tier bill has zero total', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-free', tier: 'free', usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 }, billingPeriod, currency: 'CNY' })
    assert.equal(res.body.data.total, 0)
    assert.equal(res.body.data.subtotal, 0)
  } finally {
    await app.close()
  }
})
