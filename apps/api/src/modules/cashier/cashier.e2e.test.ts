import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Cashier 收银台 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext 中间件 → TestController → CashierService → MemberService / LoyaltyService
 *
 * 验证:
 *   - 订单 CRUD (create/get/list)
 *   - 订单创建校验 (member 必须存在 / items 非空 / tenant 一致)
 *   - 支付创建 + 状态机 (Created → PendingPayment → Paid / PaymentFailed)
 *   - 标准化支付回调 (succeeded → settlePaidOrder 联动 loyalty points / coupons)
 *   - 标准化支付回调 (failed → settleFailedOrder)
 *   - 订单关闭 (manual close / timeout close / 已支付订单不可关闭)
 *   - 跨租户访问拒绝
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
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { CashierService } from './cashier.service'
function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}
@Controller('cashier')
class TestCashierController {
  constructor(
    @Inject(MemberService) private readonly memberService: MemberService,
    @Inject(LoyaltyService) private readonly loyaltyService: LoyaltyService,
    @Inject(CashierService) private readonly cashierService: CashierService
  ) {}
  @Get('orders')
  listOrders(@Req() req: Request) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.listOrders(tenantContext)
  }
  @Get('orders/:orderId')
  getOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    const order = this.cashierService.getOrder(orderId, tenantContext)
    if (!order) throw new Error(`Cashier order ${orderId} not found`)
    return order
  }
  @Post('orders')
  createOrder(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.createOrder(tenantContext, body as any)
  }
  @Post('orders/:orderId/payments')
  createPayment(
    @Req() _req: Request,
    @Param('orderId') orderId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.cashierService.createPayment(orderId, body as any)
  }
  @Get('payments')
  listPayments(@Req() req: Request) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.listPayments(tenantContext)
  }
  @Post('payments/standardized-callback')
  applyPaymentCallback(@Body() body: Record<string, unknown>) {
    return this.cashierService.applyPaymentCallback(body as any)
  }
  @Post('orders/:orderId/manual-close')
  manualClose(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.closeOrder(orderId, tenantContext, body as any)
  }
  @Post('orders/:orderId/timeout-close')
  timeoutClose(@Req() req: Request, @Param('orderId') orderId: string) {
    const tenantContext = (req as unknown as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.closeTimedOutOrder(orderId, tenantContext)
  }
}
async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  loyaltyService.resetLoyaltyStoresForTests()
  const cashierService = new CashierService(memberService, loyaltyService)
  cashierService.resetCashierStoresForTests()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestCashierController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: CashierService, useValue: cashierService }
    ]
  }).compile()
  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberService, loyaltyService, cashierService }
}
const TENANT_A = {
  'x-tenant-id': 'tenant-A',
  'x-brand-id': 'brand-A',
  'x-store-id': 'store-A'
}
const TENANT_B = {
  'x-tenant-id': 'tenant-B',
  'x-brand-id': 'brand-B',
  'x-store-id': 'store-B'
}
function tenantContextA() {
  return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }
}
function ensureMember(memberService: MemberService, memberId: string, ctx = tenantContextA()) {
  memberService.register({ memberId, tenantContext: ctx, nickname: `User-${memberId}` })
}
it('e2e: order create → get → list lifecycle with computed total', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const create = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [
          { skuId: 'sku-1', title: 'item-a', quantity: 2, price: 50 },
          { skuId: 'sku-2', title: 'item-b', quantity: 1, price: 30 }
        ]
      })
    assert.equal(create.statusCode, 201)
    const orderId = create.body.data.orderId
    assert.equal(create.body.data.totalAmount, 130) // 2*50 + 1*30
    assert.equal(create.body.data.status, 'CREATED')
    const detail = await request(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_A)
    assert.equal(detail.body.data.orderId, orderId)
    assert.equal(detail.body.data.totalAmount, 130)
    const list = await request(app.getHttpServer()).get('/cashier/orders').set(TENANT_A)
    assert.equal(list.body.data.length, 1)
  } finally {
    await app.close()
  }
})
it('e2e: order creation rejects unknown member', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-does-not-exist',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 10 }]
      })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})
it('e2e: order creation rejects empty items', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const res = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-1', items: [] })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})
it('e2e: payment creation transitions order to PendingPayment', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 100 }]
      })
    const orderId = order.body.data.orderId
    const payRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 100, externalPaymentId: 'ext-pay-1' })
    assert.equal(payRes.statusCode, 201)
    assert.equal(payRes.body.data.status, 'PENDING')
    const orderDetail = await request(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_A)
    assert.equal(orderDetail.body.data.status, 'PENDING_PAYMENT')
    assert.equal(orderDetail.body.data.latestPaymentId, payRes.body.data.paymentId)
  } finally {
    await app.close()
  }
})
it('e2e: standardized payment callback (succeeded) → order Paid + loyalty settlePaidOrder', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 200 }]
      })
    const orderId = order.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 200, externalPaymentId: 'ext-pay-2' })
    const cbRes = await request(app.getHttpServer())
      .post('/cashier/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-pay-2',
        channel: 'wechat',
        amount: 200,
        transactionNo: 'tx-001',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    assert.equal(cbRes.statusCode, 201)
    assert.equal(cbRes.body.data.order.status, 'PAID')
    assert.equal(cbRes.body.data.payment.status, 'SUCCEEDED')
    const orderDetail = await request(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_A)
    assert.equal(orderDetail.body.data.status, 'PAID')
    // Loyalty service should have awarded points via settlePaidOrder
    const summary = loyaltyService.getLoyaltySummary({ tenantId: 'tenant-A' })
    assert.ok(summary.pointsIn >= 200, `expected pointsIn >= 200 from settlement, got ${summary.pointsIn}`)
  } finally {
    await app.close()
  }
})
it('e2e: standardized payment callback (failed) → order PaymentFailed + loyalty settleFailedOrder', async () => {
  const { app, memberService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 50 }]
      })
    const orderId = order.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 50, externalPaymentId: 'ext-pay-fail' })
    const cbRes = await request(app.getHttpServer())
      .post('/cashier/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-pay-fail',
        channel: 'wechat',
        amount: 50,
        transactionNo: 'tx-fail',
        standardizedEventName: 'cashier.payment-failed'
      })
    assert.equal(cbRes.body.data.order.status, 'PAYMENT_FAILED')
    assert.equal(cbRes.body.data.payment.status, 'FAILED')
    // Loyalty service should have recorded failed settlement (no points awarded)
    const summary = loyaltyService.getLoyaltySummary({ tenantId: 'tenant-A' })
    assert.equal(summary.pointsIn, 0)
  } finally {
    await app.close()
  }
})
it('e2e: manual close transitions PendingPayment → Closed', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 75 }]
      })
    const orderId = order.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'alipay', amount: 75 })
    const closeRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/manual-close`)
      .set(TENANT_A)
      .send({ operator: 'op-1', reason: 'customer-request' })
    assert.equal(closeRes.body.data.order.status, 'CLOSED')
    assert.equal(closeRes.body.data.order.closeReason, 'MANUAL_CANCEL')
    assert.equal(closeRes.body.data.order.closedBy, 'op-1')
  } finally {
    await app.close()
  }
})
it('e2e: cannot close a Paid order', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 30 }]
      })
    const orderId = order.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-pay-cant-close' })
    await request(app.getHttpServer())
      .post('/cashier/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-pay-cant-close',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    const closeRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/manual-close`)
      .set(TENANT_A)
      .send({ operator: 'op-1', reason: 'should-fail' })
    assert.equal(closeRes.statusCode, 500)
  } finally {
    await app.close()
  }
})
it('e2e: timeout close transitions Created → Closed with PaymentTimeout reason', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 20 }]
      })
    const orderId = order.body.data.orderId
    const closeRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/timeout-close`)
      .set(TENANT_A)
    assert.equal(closeRes.body.data.order.status, 'CLOSED')
    assert.equal(closeRes.body.data.order.closeReason, 'PAYMENT_TIMEOUT')
  } finally {
    await app.close()
  }
})
it('e2e: orders and payments are tenant-scoped', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1', tenantContextA())
  ensureMember(memberService, 'm-B', { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn-mainland' })
  try {
    const orderA = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 10 }]
      })
    const orderAId = orderA.body.data.orderId
    const orderB = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_B)
      .send({
        memberId: 'm-B',
        items: [{ skuId: 'sku-2', title: 'y', quantity: 1, price: 20 }]
      })
    const orderBId = orderB.body.data.orderId
    const listA = await request(app.getHttpServer()).get('/cashier/orders').set(TENANT_A)
    assert.equal(listA.body.data.length, 1)
    assert.equal(listA.body.data[0].orderId, orderAId)
    const listB = await request(app.getHttpServer()).get('/cashier/orders').set(TENANT_B)
    assert.equal(listB.body.data.length, 1)
    assert.equal(listB.body.data[0].orderId, orderBId)
    // Cross-tenant access: tenant-B cannot read tenant-A's order
    const crossGet = await request(app.getHttpServer()).get(`/cashier/orders/${orderAId}`).set(TENANT_B)
    assert.equal(crossGet.statusCode, 500)
  } finally {
    await app.close()
  }
})
it('e2e: standardized payment callback rejects cross-tenant order', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1', tenantContextA())
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: 10 }]
      })
    const orderId = order.body.data.orderId
    const cbRes = await request(app.getHttpServer())
      .post('/cashier/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-B', // wrong tenant
        externalPaymentId: 'ext-pay-cross',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    assert.equal(cbRes.statusCode, 500)
  } finally {
    await app.close()
  }
})
it('e2e: list payments returns all tenant payments', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  ensureMember(memberService, 'm-2')
  try {
    const o1 = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 30 }] })
    const o2 = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-2', items: [{ skuId: 'sku-1', title: 'b', quantity: 1, price: 50 }] })
    await request(app.getHttpServer())
      .post(`/cashier/orders/${o1.body.data.orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-pay-list-1' })
    await request(app.getHttpServer())
      .post(`/cashier/orders/${o2.body.data.orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'alipay', amount: 50, externalPaymentId: 'ext-pay-list-2' })
    const list = await request(app.getHttpServer()).get('/cashier/payments').set(TENANT_A)
    assert.ok(list.body.data.length >= 2)
    const channels = list.body.data.map((p: any) => p.channel)
    assert.ok(channels.includes('wechat'))
    assert.ok(channels.includes('alipay'))
  } finally {
    await app.close()
  }
})
it('e2e: list payments isolated by tenant', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const o1 = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 30 }] })
    await request(app.getHttpServer())
      .post(`/cashier/orders/${o1.body.data.orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-pay-iso' })
    const listB = await request(app.getHttpServer()).get('/cashier/payments').set(TENANT_B)
    assert.equal(listB.body.data.length, 0)
  } finally {
    await app.close()
  }
})
it('e2e: order total computed from items', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'm-1',
        items: [
          { skuId: 'sku-1', title: 'a', quantity: 2, price: 30 },
          { skuId: 'sku-2', title: 'b', quantity: 3, price: 15 }
        ]
      })
    assert.equal(order.body.data.totalAmount, 2 * 30 + 3 * 15)
  } finally {
    await app.close()
  }
})
it('e2e: get order returns 500 for unknown orderId', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/cashier/orders/unknown-id').set(TENANT_A)
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})
it('e2e: create payment for unknown order throws', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/cashier/orders/unknown-order/payments')
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 30, externalPaymentId: 'ext-no-order' })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})
it('e2e: order status lifecycle Created → PaymentPending → Paid', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 80 }] })
    const orderId = order.body.data.orderId
    assert.equal(order.body.data.status, 'CREATED')
    const payment = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 80, externalPaymentId: 'ext-lifecycle' })
    assert.equal(payment.body.data.status, 'PENDING')
    const cb = await request(app.getHttpServer())
      .post('/cashier/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-lifecycle',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    assert.equal(cb.body.data.order.status, 'PAID')
    assert.equal(cb.body.data.payment.status, 'SUCCEEDED')
  } finally {
    await app.close()
  }
})
it('e2e: multiple payment channels supported', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const channels = ['wechat', 'alipay', 'unionpay', 'cash']
    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i]
      const order = await request(app.getHttpServer())
        .post('/cashier/orders')
        .set(TENANT_A)
        .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 10 }] })
      const oid = order.body.data.orderId
      const pay = await request(app.getHttpServer())
        .post(`/cashier/orders/${oid}/payments`)
        .set(TENANT_A)
        .send({ channel: ch, amount: 10, externalPaymentId: `ext-multi-${i}` })
      assert.equal(pay.body.data.channel, ch)
    }
  } finally {
    await app.close()
  }
})
it('e2e: duplicate callback for same payment is idempotent', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 40 }] })
    const orderId = order.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 40, externalPaymentId: 'ext-idem' })
    const cb1 = await request(app.getHttpServer())
      .post('/cashier/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-idem',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    assert.equal(cb1.body.data.payment.status, 'SUCCEEDED')
    const cb2 = await request(app.getHttpServer())
      .post('/cashier/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-idem',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    assert.equal(cb2.statusCode, 201)
    assert.equal(cb2.body.data.payment.status, 'SUCCEEDED')
  } finally {
    await app.close()
  }
})
it('e2e: order close with timeout reason transitions to CLOSED', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 15 }] })
    const orderId = order.body.data.orderId
    const closeRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/timeout-close`)
      .set(TENANT_A)
      .send({ operator: 'system', reason: 'PAYMENT_TIMEOUT' })
    assert.equal(closeRes.body.data.order.status, 'CLOSED')
    assert.equal(closeRes.body.data.order.closeReason, 'PAYMENT_TIMEOUT')
  } finally {
    await app.close()
  }
})
it('e2e: get order from different tenant returns 500', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-1')
  try {
    const order = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({ memberId: 'm-1', items: [{ skuId: 'sku-1', title: 'a', quantity: 1, price: 10 }] })
    const orderId = order.body.data.orderId
    const get = await request(app.getHttpServer()).get(`/cashier/orders/${orderId}`).set(TENANT_B)
    assert.equal(get.statusCode, 500)
  } finally {
    await app.close()
  }
})
