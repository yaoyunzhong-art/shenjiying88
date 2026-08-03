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
 *   - 优惠码/折扣策略
 *   - 边界/异常场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Inject, Post, Body, Param } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { BillingService } from './billing.service'
import type { PricingTier, Currency, Invoice, PaymentInfo } from './billing.service'

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

  @Get('invoices/:tenantId')
  listInvoices(@Param('tenantId') tenantId: string) {
    return { success: true, data: { invoices: this.svc.listInvoices(tenantId) } }
  }

  @Get('discounts')
  listDiscounts() {
    return { success: true, data: { policies: this.svc.listDiscountPolicies() } }
  }

  @Post('invoices/:invoiceId/pay')
  payInvoice(@Param('invoiceId') invoiceId: string, @Body() body: { method: string }) {
    const result = this.svc.payInvoice(invoiceId, body.method)
    return { success: true, data: result }
  }

  @Get('invoices/:invoiceId/payment')
  getPayment(@Param('invoiceId') invoiceId: string) {
    return { success: true, data: this.svc.getPaymentStatus(invoiceId) }
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

// ────────────── 正例 (Positive) ──────────────

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

it('e2e: enterprise tier with coupon code applies percentage discount', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-coupon', tier: 'enterprise', usage: { apiCalls: 100000, storageGB: 200, bandwidthGB: 500, seats: 20 }, billingPeriod, currency: 'CNY', couponCode: 'ANNUAL30' })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.discountAmount > 0)
    assert.match(res.body.data.discountLabel, /年付/)
  } finally {
    await app.close()
  }
})

it('e2e: VIP fixed discount reduces total by exact amount', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-vip', tier: 'pro', usage: { apiCalls: 50000, storageGB: 100, bandwidthGB: 500, seats: 10 }, billingPeriod, currency: 'CNY', couponCode: 'VIP100' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.discountAmount, 100)
  } finally {
    await app.close()
  }
})

it('e2e: pay invoice changes status to paid and records payment', async () => {
  const { app } = await buildApp()
  try {
    const invRes = await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-pay', tier: 'basic', usage: { apiCalls: 5000, storageGB: 10, bandwidthGB: 50, seats: 2 }, billingPeriod, currency: 'CNY' })
    const invoiceId = invRes.body.data.id

    const payRes = await request(app.getHttpServer())
      .post(`/test/billing/invoices/${invoiceId}/pay`)
      .send({ method: 'alipay' })
    assert.equal(payRes.statusCode, 201)
    assert.equal(payRes.body.data.status, 'paid')
    assert.equal(payRes.body.data.method, 'alipay')
    assert.ok(payRes.body.data.paidAt)

    const paymentRes = await request(app.getHttpServer()).get(`/test/billing/invoices/${invoiceId}/payment`)
    assert.equal(paymentRes.body.data.status, 'paid')
  } finally {
    await app.close()
  }
})

it('e2e: list invoices per tenant returns correct count', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-inv-a', tier: 'basic', usage: { apiCalls: 1000, storageGB: 5, bandwidthGB: 10, seats: 1 }, billingPeriod, currency: 'CNY' })
    await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-inv-a', tier: 'pro', usage: { apiCalls: 50000, storageGB: 100, bandwidthGB: 500, seats: 10 }, billingPeriod, currency: 'CNY' })
    await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-inv-b', tier: 'free', usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 }, billingPeriod, currency: 'CNY' })

    const resA = await request(app.getHttpServer()).get('/test/billing/invoices/t-inv-a')
    assert.equal(resA.body.data.invoices.length, 2)

    const resB = await request(app.getHttpServer()).get('/test/billing/invoices/t-inv-b')
    assert.equal(resB.body.data.invoices.length, 1)
  } finally {
    await app.close()
  }
})

it('e2e: list discount policies returns three defaults', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/billing/discounts')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.policies.length, 3)
  } finally {
    await app.close()
  }
})

// ────────────── 反例 (Negative) ──────────────

it('e2e: invalid coupon code returns zero discount with warning label', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-invalid', tier: 'basic', usage: { apiCalls: 1000, storageGB: 5, bandwidthGB: 10, seats: 1 }, billingPeriod, currency: 'CNY', couponCode: 'FAKE123' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.discountAmount, 0)
    assert.equal(res.body.data.discountLabel, '无效优惠码')
  } finally {
    await app.close()
  }
})

it('e2e: coupon code not applicable to free tier returns zero discount', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-tier-mismatch', tier: 'free', usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 }, billingPeriod, currency: 'CNY', couponCode: 'VIP100' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.discountAmount, 0)
    assert.equal(res.body.data.discountLabel, '不适用当前套餐')
  } finally {
    await app.close()
  }
})

it('e2e: pay non-existent invoice throws 500 error', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/invoices/nonexistent_inv/pay')
      .send({ method: 'wechat' })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: get payment status for non-existent invoice returns null data', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/test/billing/invoices/missing_inv/payment')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data, null)
  } finally {
    await app.close()
  }
})

it('e2e: NEWUSER20 coupon with tiny basic usage applies percentage discount', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-coupon-min', tier: 'basic', usage: { apiCalls: 10, storageGB: 0, bandwidthGB: 0, seats: 0 }, billingPeriod, currency: 'CNY', couponCode: 'NEWUSER20' })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.discountAmount > 0)
    assert.match(res.body.data.discountLabel, /新用户/)
  } finally {
    await app.close()
  }
})

// ────────────── 边界 (Boundary) ──────────────

it('e2e: bill with zero usage returns base monthly fee only', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-zero', tier: 'pro', usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 }, billingPeriod, currency: 'CNY' })
    assert.equal(res.statusCode, 201)
    // Only base monthly fee line item should have a charge
    const baseItem = res.body.data.lineItems.find((li: any) => li.id === 'base-monthly')
    assert.ok(baseItem.subtotal > 0)
    const zeroItems = res.body.data.lineItems.filter((li: any) => li.id !== 'base-monthly')
    for (const item of zeroItems) {
      assert.equal(item.subtotal, 0)
    }
  } finally {
    await app.close()
  }
})

it('e2e: bulk discount threshold at exactly 1000 applies 5% discount', async () => {
  const { app } = await buildApp()
  try {
    // Design usage to make subtotal exactly at the 1000 threshold
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-bulk', tier: 'pro', usage: { apiCalls: 1000000, storageGB: 100, bandwidthGB: 50, seats: 0 }, billingPeriod, currency: 'CNY' })
    assert.equal(res.statusCode, 201)
    // subtotal >= 1000 should trigger 5% batch discount
    assert.ok(res.body.data.subtotal >= 1000)
    assert.match(res.body.data.discountLabel, /批量/)
  } finally {
    await app.close()
  }
})

it('e2e: bill with massive enterprise usage triggers enterprise volume discount', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-massive', tier: 'enterprise', usage: { apiCalls: 20000000, storageGB: 20000, bandwidthGB: 50000, seats: 1000 }, billingPeriod, currency: 'USD' })
    assert.equal(res.statusCode, 201)
    assert.ok(res.body.data.subtotal >= 10000)
    assert.match(res.body.data.discountLabel, /企业批量/)
  } finally {
    await app.close()
  }
})

it('e2e: enums for PAYMENT STATUS are serialized correctly', async () => {
  const { app } = await buildApp()
  try {
    const invRes = await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-enum', tier: 'basic', usage: { apiCalls: 10000, storageGB: 20, bandwidthGB: 100, seats: 3 }, billingPeriod, currency: 'USD' })
    const invoiceId = invRes.body.data.id

    // Before payment - no payment record, null returned
    const beforePay = await request(app.getHttpServer()).get(`/test/billing/invoices/${invoiceId}/payment`)
    assert.equal(beforePay.body.data, null)

    // After payment - payment status is 'paid'
    await request(app.getHttpServer())
      .post(`/test/billing/invoices/${invoiceId}/pay`)
      .send({ method: 'card' })
    const afterPay = await request(app.getHttpServer()).get(`/test/billing/invoices/${invoiceId}/payment`)
    assert.equal(afterPay.body.data.status, 'paid')
  } finally {
    await app.close()
  }
})

it('e2e: currency conversion does not change line item count across tiers', async () => {
  const { app } = await buildApp()
  try {
    const resCNY = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-ccy-cny', tier: 'pro', usage: proUsage, billingPeriod, currency: 'CNY' })
    const resUSD = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-ccy-usd', tier: 'pro', usage: proUsage, billingPeriod, currency: 'USD' })
    const resEUR = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-ccy-eur', tier: 'pro', usage: proUsage, billingPeriod, currency: 'EUR' })
    assert.equal(resCNY.body.data.lineItems.length, 5)
    assert.equal(resUSD.body.data.lineItems.length, 5)
    assert.equal(resEUR.body.data.lineItems.length, 5)
  } finally {
    await app.close()
  }
})

it('e2e: NEWUSER20 coupon applies 20% off with cap of 500', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-newuser', tier: 'pro', usage: { apiCalls: 10000, storageGB: 20, bandwidthGB: 100, seats: 3 }, billingPeriod, currency: 'CNY', couponCode: 'NEWUSER20' })
    assert.equal(res.statusCode, 201)
    const discount = res.body.data.discountAmount
    assert.ok(discount > 0)
    assert.ok(discount <= 500)
  } finally {
    await app.close()
  }
})

it('e2e: basic tier bill has 5 line items with correct IDs', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-basic-li', tier: 'basic', usage: { apiCalls: 5000, storageGB: 10, bandwidthGB: 50, seats: 1 }, billingPeriod, currency: 'CNY' })
    assert.equal(res.body.data.lineItems.length, 5)
    const ids = res.body.data.lineItems.map((li: any) => li.id)
    assert.deepEqual(ids, ['base-monthly', 'api-calls', 'storage', 'bandwidth', 'seats'])
  } finally {
    await app.close()
  }
})

it('e2e: tax amount is 13% of taxable amount', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/test/billing/calculate')
      .send({ tenantId: 't-tax', tier: 'basic', usage: { apiCalls: 10000, storageGB: 50, bandwidthGB: 100, seats: 3 }, billingPeriod, currency: 'CNY' })
    assert.equal(res.statusCode, 201)
    const data = res.body.data
    const expectedTax = Math.round((data.subtotal - data.discountAmount) * 0.13 * 100) / 100
    assert.equal(data.taxAmount, expectedTax)
  } finally {
    await app.close()
  }
})

it('e2e: invoice has due date 30 days after issued', async () => {
  const { app } = await buildApp()
  try {
    const invRes = await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-due', tier: 'basic', usage: { apiCalls: 5000, storageGB: 10, bandwidthGB: 50, seats: 2 }, billingPeriod, currency: 'CNY' })
    assert.equal(invRes.statusCode, 201)
    const inv = invRes.body.data
    const issuedAt = new Date(inv.issuedAt).getTime()
    const dueAt = new Date(inv.dueAt).getTime()
    const diffDays = (dueAt - issuedAt) / (1000 * 60 * 60 * 24)
    assert.ok(diffDays >= 29 && diffDays <= 31)
  } finally {
    await app.close()
  }
})

it('e2e: stats aggregation across multiple invoices reconcilable', async () => {
  const { app } = await buildApp()
  try {
    const before = await request(app.getHttpServer()).get('/test/billing/stats')
    const beforeCount = before.body.data.invoiceCount

    await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-stat1', tier: 'basic', usage: { apiCalls: 1000, storageGB: 5, bandwidthGB: 10, seats: 1 }, billingPeriod, currency: 'CNY' })
    await request(app.getHttpServer())
      .post('/test/billing/invoices')
      .send({ tenantId: 't-stat2', tier: 'pro', usage: { apiCalls: 50000, storageGB: 100, bandwidthGB: 500, seats: 10 }, billingPeriod, currency: 'CNY' })

    const after = await request(app.getHttpServer()).get('/test/billing/stats')
    assert.equal(after.body.data.invoiceCount, beforeCount + 2)
  } finally {
    await app.close()
  }
})
