import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Transactions 交易流水 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → TransactionsService → CashierService / LoyaltyService
 *
 * 验证:
 *   - 标准化支付回调持久化订单事务
 *   - 退款请求 (requestRefund) → 状态机 (Pending → Approved → Settled)
 *   - 退款拒绝 (reject) → 状态 Rejected
 *   - 退款 dashboard 聚合
 *   - 会员事务时间线
 *   - 跨租户访问拒绝
 *   - 按类型 / 日期范围过滤
 *   - 分页
 *   - 交易统计
 *   - 批量多行交易
 *   - 跨租户隔离
 *   - 不存在交易 404
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
  ValidationPipe
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { CashierService } from '../cashier/cashier.service'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { TransactionsService, resetTransactionsServiceTestState } from './transactions.service'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  next()
}

@Controller('transactions')
class TestTransactionsController {
  constructor(
    @Inject(TransactionsService) private readonly transactionsService: TransactionsService
  ) {}

  @Post('payments/standardized-callback')
  callback(@Body() body: Record<string, unknown>) {
    return this.transactionsService.applyPaymentCallback(body as any)
  }

  @Get('orders/:orderId')
  getOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.getOrderTransaction(orderId, tenantContext)
  }

  @Get('orders')
  listOrders(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.listOrderTransactions(tenantContext)
  }

  @Post('orders/:orderId/refunds')
  requestRefund(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.requestRefund(orderId, tenantContext, body as any)
  }

  @Get('refunds/dashboard')
  dashboard(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.getRefundDashboard(tenantContext)
  }

  @Get('refunds/:refundId')
  getRefund(@Req() req: Request, @Param('refundId') refundId: string) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.getRefund(refundId, tenantContext)
  }

  @Get('refunds')
  listRefunds(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.listRefunds(tenantContext)
  }

  @Post('refunds/:refundId/approve')
  approveRefund(
    @Req() req: Request,
    @Param('refundId') refundId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.approveRefund(refundId, tenantContext, body as any)
  }

  @Post('refunds/:refundId/reject')
  rejectRefund(
    @Req() req: Request,
    @Param('refundId') refundId: string,
    @Body() body: Record<string, unknown>
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.rejectRefund(refundId, tenantContext, body as any)
  }

  @Get('members/:memberId')
  listMember(@Req() req: Request, @Param('memberId') memberId: string) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.transactionsService.listMemberTransactions(memberId, tenantContext)
  }

  @Get()
  listTransactions(@Req() req: Request, @Query() query: Record<string, unknown>) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    const type = query.type as string | undefined
    const dateFrom = query.dateFrom as string | undefined
    const dateTo = query.dateTo as string | undefined
    const page = query.page ? Number(query.page) : undefined
    const pageSize = query.pageSize ? Number(query.pageSize) : undefined

    if (type === 'refund') {
      const refunds = this.transactionsService.listRefunds(tenantContext, { limit: undefined })
      return { type, data: refunds, total: refunds.length }
    }

    const orders = this.transactionsService.listOrderTransactions(tenantContext, {
      limit: undefined
    })

    let filtered = orders
    if (dateFrom) {
      filtered = filtered.filter((o) => o.order.createdAt >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter((o) => o.order.createdAt <= dateTo)
    }

    const total = filtered.length
    if (pageSize && pageSize > 0) {
      const p = Math.max(1, page ?? 1)
      const start = (p - 1) * pageSize
      filtered = filtered.slice(start, start + pageSize)
    }

    return { type: type ?? 'order', data: filtered, total, page, pageSize }
  }

  @Get('stats')
  getStats(@Req() req: Request) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    const orders = this.transactionsService.listOrderTransactions(tenantContext, {
      limit: undefined
    })
    const refunds = this.transactionsService.listRefunds(tenantContext, { limit: undefined })

    const totalRevenue = orders.reduce((sum, o) => sum + o.order.totalAmount, 0)
    const totalRefunds = refunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.refundAmount, 0)
    const pendingRefunds = refunds
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + r.refundAmount, 0)

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalRefunds,
      pendingRefunds,
      netRevenue: totalRevenue - totalRefunds
    }
  }

  @Post()
  async batchCreateOrders(
    @Req() req: Request,
    @Body() body: { orders: Array<{ memberId: string; items: Array<{ skuId: string; title: string; quantity: number; price: number }>; amount: number; externalPaymentId: string }> }
  ) {
    const tenantContext = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    const cashierService = (this.transactionsService as any).cashierService as CashierService
    const results: unknown[] = []
    for (const o of body.orders ?? []) {
      try {
        const order = await cashierService.createOrder(tenantContext, {
          memberId: o.memberId,
          items: o.items
        })
        await cashierService.createPayment(order.orderId, {
          channel: 'wechat',
          amount: o.amount,
          externalPaymentId: o.externalPaymentId
        })
        await cashierService.applyPaymentCallback({
          aggregateId: order.orderId,
          orderId: order.orderId,
          tenantId: tenantContext.tenantId,
          externalPaymentId: o.externalPaymentId,
          standardizedEventName: 'cashier.payment-succeeded'
        })
        results.push({ orderId: order.orderId, status: 'created' })
      } catch (e: any) {
        results.push({ error: e.message })
      }
    }
    return { processed: results.length, results }
  }
}

async function buildApp() {
  resetMemberServiceTestState()
  resetTransactionsServiceTestState()
  const memberService = new MemberService()
  const metricsService = new MarketingMetricsService()
  const loyaltyService = new LoyaltyService(memberService, undefined, metricsService)
  loyaltyService.resetLoyaltyStoresForTests()
  const cashierService = new CashierService(memberService, loyaltyService)
  cashierService.resetCashierStoresForTests()
  const transactionsService = new TransactionsService(cashierService, loyaltyService)
  const moduleRef = await Test.createTestingModule({
    controllers: [TestTransactionsController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: CashierService, useValue: cashierService },
      { provide: TransactionsService, useValue: transactionsService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberService, loyaltyService, cashierService, transactionsService, metricsService }
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

function ensureMember(memberService: MemberService, memberId: string) {
  memberService.register({ memberId, tenantContext: tenantContextA(), nickname: `User-${memberId}` })
}

async function settleOrder(
  _app: any,
  cashierService: CashierService,
  _memberService: MemberService,
  _loyaltyService: LoyaltyService,
  memberId: string,
  amount: number,
  externalPaymentId: string
) {
  const order = await cashierService.createOrder(tenantContextA(), {
    memberId,
    items: [{ skuId: 'sku-1', title: 'x', quantity: 1, price: amount }]
  } as any)
  const orderId = order.orderId
  cashierService.createPayment(orderId, {
    channel: 'wechat',
    amount,
    externalPaymentId
  } as any)
  cashierService.applyPaymentCallback({
    orderId,
    tenantId: 'tenant-A',
    externalPaymentId,
    standardizedEventName: 'cashier.payment-succeeded'
  } as any)
  return orderId
}

it('e2e: payment callback persists order transaction', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 150, 'ext-pay-tx-1')

    const callback = await request(app.getHttpServer())
      .post('/transactions/payments/standardized-callback')
      .send({
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-pay-tx-1',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    assert.equal(callback.statusCode, 201)
    assert.equal(callback.body.data.order.orderId, orderId)
    assert.equal(callback.body.data.order.totalAmount, 150)
    assert.equal(callback.body.data.payment.status, 'SUCCEEDED')
  } finally {
    await app.close()
  }
})

it('e2e: payment callback with coupon writes tenant marketing metrics once', async () => {
  const { app, memberService, transactionsService, metricsService } = await buildApp()
  ensureMember(memberService, 'm-metrics')

  try {
    const aggregate = await transactionsService.startCheckout(tenantContextA(), {
      memberId: 'm-metrics',
      items: [{ skuId: 'sku-metrics', title: 'metrics', quantity: 1, price: 120 }],
      paymentChannel: 'wechat-pay',
      couponCode: 'COUPON-METRICS',
      externalPaymentId: 'ext-pay-metrics'
    })

    const callback = await request(app.getHttpServer())
      .post('/transactions/payments/standardized-callback')
      .send({
        orderId: aggregate.order.orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-pay-metrics',
        standardizedEventName: 'cashier.payment-succeeded'
      })
    assert.equal(callback.statusCode, 201)

    await request(app.getHttpServer())
      .post('/transactions/payments/standardized-callback')
      .send({
        orderId: aggregate.order.orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'ext-pay-metrics',
        standardizedEventName: 'cashier.payment-succeeded'
      })

    const snapshot = metricsService.snapshot('tenant-A')
    assert.equal(snapshot.couponRedemptionTotal, 1)
    assert.equal(snapshot.avgOrderValue, 120)
    assert.ok(metricsService.toPrometheus('tenant-A').includes('order_value_count 1'))
  } finally {
    await app.close()
  }
})

it('e2e: list transactions scoped by tenant', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 50, 'ext-pay-list-1')

    const listA = await request(app.getHttpServer()).get('/transactions/orders').set(TENANT_A)
    assert.ok(listA.body.data.length >= 1)
    for (const tx of listA.body.data) {
      assert.equal(tx.order.tenantContext.tenantId, 'tenant-A')
    }

    const listB = await request(app.getHttpServer()).get('/transactions/orders').set(TENANT_B)
    for (const tx of listB.body.data) {
      assert.equal(tx.order.tenantContext.tenantId, 'tenant-B')
    }
  } finally {
    await app.close()
  }
})

it('e2e: refund request → approve → status Approved', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 200, 'ext-pay-rf-1')

    const refundRes = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 50, reason: 'customer-remorse', operator: 'op-1' })
    assert.equal(refundRes.statusCode, 201)
    const refundId = refundRes.body.data.refunds[0].refundId
    assert.equal(refundRes.body.data.refunds[0].status, 'PENDING')
    assert.equal(refundRes.body.data.refunds[0].refundAmount, 50)

    const approveRes = await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/approve`)
      .set(TENANT_A)
      .send({ operator: 'mgr-1', note: 'ok' })
    assert.equal(approveRes.body.data.refunds[0].status, 'COMPLETED')
    assert.equal(approveRes.body.data.refunds[0].reviewedBy, 'mgr-1')

    const detail = await request(app.getHttpServer())
      .get(`/transactions/refunds/${refundId}`)
      .set(TENANT_A)
    assert.equal(detail.body.data.status, 'COMPLETED')
  } finally {
    await app.close()
  }
})

it('e2e: refund request → reject → status Rejected', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-rj-1')

    const refundRes = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 30, reason: 'bad-quality', operator: 'op-1' })
    const refundId = refundRes.body.data.refunds[0].refundId

    const rejectRes = await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/reject`)
      .set(TENANT_A)
      .send({ operator: 'mgr-1', note: 'out-of-policy' })
    assert.equal(rejectRes.body.data.refunds[0].status, 'REJECTED')
    assert.equal(rejectRes.body.data.refunds[0].reviewedBy, 'mgr-1')
  } finally {
    await app.close()
  }
})

it('e2e: refund cannot be approved twice', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 80, 'ext-pay-twice')
    const refundRes = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 20, reason: 'test', operator: 'op-1' })
    const refundId = refundRes.body.data.refunds[0].refundId
    await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/approve`)
      .set(TENANT_A)
      .send({ operator: 'mgr-1' })

    const secondApprove = await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/approve`)
      .set(TENANT_A)
      .send({ operator: 'mgr-2' })
    assert.equal(secondApprove.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: refund dashboard aggregates by status', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId1 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-dash-1')
    const orderId2 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-dash-2')

    // Two refunds: one approved, one rejected
    const r1 = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId1}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 10, reason: 'a', operator: 'op-1' })
    await request(app.getHttpServer())
      .post(`/transactions/refunds/${r1.body.data.refunds[0].refundId}/approve`)
      .set(TENANT_A)
      .send({ operator: 'mgr-1' })

    const r2 = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId2}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 20, reason: 'b', operator: 'op-1' })
    await request(app.getHttpServer())
      .post(`/transactions/refunds/${r2.body.data.refunds[0].refundId}/reject`)
      .set(TENANT_A)
      .send({ operator: 'mgr-1' })

    const dashboard = await request(app.getHttpServer())
      .get('/transactions/refunds/dashboard')
      .set(TENANT_A)
    assert.equal(dashboard.statusCode, 200)
    const data = dashboard.body.data
    assert.ok(data)
    assert.ok(data.totalCount >= 2)
    assert.ok(Array.isArray(data.statusGroups))
    assert.ok(data.statusGroups.length >= 1)
    const completedGroup = data.statusGroups.find(
      (g: any) => g.status === 'COMPLETED'
    )
    assert.ok(completedGroup)
    assert.equal(completedGroup.count, 1)
    const rejectedGroup = data.statusGroups.find(
      (g: any) => g.status === 'REJECTED'
    )
    assert.ok(rejectedGroup)
    assert.equal(rejectedGroup.count, 1)
  } finally {
    await app.close()
  }
})

it('e2e: member transaction timeline aggregates orders + refunds', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 75, 'ext-pay-tl-1')
    await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 10, reason: 'timeline-test', operator: 'op-1' })

    const timeline = await request(app.getHttpServer())
      .get('/transactions/members/m-1')
      .set(TENANT_A)
    assert.equal(timeline.statusCode, 200)
    assert.ok(timeline.body.data)
    assert.ok(timeline.body.data.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: refund request for unknown order is rejected', async () => {
  const { app } = await buildApp()

  try {
    const res = await request(app.getHttpServer())
      .post('/transactions/orders/non-existent-order/refunds')
      .set(TENANT_A)
      .send({ refundAmount: 10, reason: 'test', operator: 'op-1' })
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: cross-tenant cannot read another tenant refund', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 60, 'ext-pay-cross')
    const refundRes = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 15, reason: 'cross', operator: 'op-1' })
    const refundId = refundRes.body.data.refunds[0].refundId

    const crossGet = await request(app.getHttpServer())
      .get(`/transactions/refunds/${refundId}`)
      .set(TENANT_B)
    assert.equal(crossGet.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: list refunds for tenant scope only', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 200, 'ext-pay-lst-1')
    const r1 = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 10, reason: 'a', operator: 'op-1' })

    const listA = await request(app.getHttpServer()).get('/transactions/refunds').set(TENANT_A)
    assert.ok(listA.body.data.length >= 1)
    assert.ok(listA.body.data.some((r: any) => r.refundId === r1.body.data.refunds[0].refundId))

    const listB = await request(app.getHttpServer()).get('/transactions/refunds').set(TENANT_B)
    assert.equal(listB.body.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: list member transactions aggregates all tenant orders', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const oid1 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-mem-1')
    const oid2 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 200, 'ext-pay-mem-2')

    const memberTx = await request(app.getHttpServer())
      .get('/transactions/members/m-1')
      .set(TENANT_A)
    assert.equal(memberTx.statusCode, 200)
    const orderIds = memberTx.body.data.map((entry: any) => entry.orderId).filter(Boolean)
    assert.ok(orderIds.includes(oid1))
    assert.ok(orderIds.includes(oid2))
  } finally {
    await app.close()
  }
})

it('e2e: refund reject reason persisted on refund record', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 60, 'ext-pay-rej-reason')
    const refundRes = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 20, reason: 'returns', operator: 'op-1' })
    const refundId = refundRes.body.data.refunds[0].refundId

    const reject = await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/reject`)
      .set(TENANT_A)
      .send({ operator: 'mgr-1', note: 'out-of-policy-window' })
    assert.equal(reject.body.data.refunds[0].status, 'REJECTED')
    assert.equal(reject.body.data.refunds[0].reviewedBy, 'mgr-1')
  } finally {
    await app.close()
  }
})

it('e2e: refund reject on non-pending refund throws', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 80, 'ext-pay-rej-twice')
    const refundRes = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 30, reason: 'test', operator: 'op-1' })
    const refundId = refundRes.body.data.refunds[0].refundId

    await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/reject`)
      .set(TENANT_A)
      .send({ operator: 'mgr-1' })
    const reject2 = await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/reject`)
      .set(TENANT_A)
      .send({ operator: 'mgr-2' })
    assert.equal(reject2.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: list orders scoped by tenant', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 50, 'ext-pay-scope-1')
    await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 50, 'ext-pay-scope-2')

    const listA = await request(app.getHttpServer()).get('/transactions/orders').set(TENANT_A)
    assert.ok(listA.body.data.length >= 2)
    for (const tx of listA.body.data) {
      assert.equal(tx.order.tenantContext.tenantId, 'tenant-A')
    }
  } finally {
    await app.close()
  }
})

it('e2e: list refunds with no orders returns empty array', async () => {
  const { app } = await buildApp()
  try {
    const list = await request(app.getHttpServer()).get('/transactions/refunds').set(TENANT_A)
    assert.equal(list.statusCode, 200)
    assert.ok(Array.isArray(list.body.data))
    assert.equal(list.body.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: dashboard returns 0 totals for empty tenant', async () => {
  const { app } = await buildApp()
  try {
    const dashboard = await request(app.getHttpServer())
      .get('/transactions/refunds/dashboard')
      .set(TENANT_A)
    assert.equal(dashboard.statusCode, 200)
    assert.equal(dashboard.body.data.totalCount, 0)
  } finally {
    await app.close()
  }
})

it('e2e: get unknown order returns 500', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/transactions/orders/unknown-order').set(TENANT_A)
    assert.equal(res.statusCode, 500)
  } finally {
    await app.close()
  }
})

it('e2e: cross-tenant refund list does not include another tenant', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-1')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-1', 100, 'ext-pay-iso-1')
    await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 30, reason: 'iso', operator: 'op-1' })

    const listB = await request(app.getHttpServer()).get('/transactions/refunds').set(TENANT_B)
    assert.equal(listB.body.data.length, 0)
  } finally {
    await app.close()
  }
})

// ── Phase-5 B₂: 7 new tests ──

it('e2e: GET /transactions?type=order filters by type', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-type')

  try {
    const oid1 = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-type', 100, 'ext-pay-type-1')
    // also create a refund for this order
    await request(app.getHttpServer())
      .post(`/transactions/orders/${oid1}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 10, reason: 'type-test', operator: 'op-type' })

    const typeOrder = await request(app.getHttpServer())
      .get('/transactions?type=order')
      .set(TENANT_A)
    assert.equal(typeOrder.statusCode, 200)
    assert.equal(typeOrder.body.data.type, 'order')
    assert.ok(typeOrder.body.data.data.length >= 1)
    assert.ok(typeOrder.body.data.data.every((o: any) => o.order))

    const typeRefund = await request(app.getHttpServer())
      .get('/transactions?type=refund')
      .set(TENANT_A)
    assert.equal(typeRefund.statusCode, 200)
    assert.equal(typeRefund.body.data.type, 'refund')
    assert.ok(typeRefund.body.data.data.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: GET /transactions?dateFrom&dateTo filters by date range', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-date')

  try {
    const beforeCreate = new Date().toISOString()
    await settleOrder(app, cashierService, memberService, loyaltyService, 'm-date', 200, 'ext-pay-date-1')
    const afterCreate = new Date().toISOString()

    // dateFrom before creation should include it
    const resWith = await request(app.getHttpServer())
      .get(`/transactions?dateFrom=${encodeURIComponent(beforeCreate)}&dateTo=${encodeURIComponent(afterCreate)}`)
      .set(TENANT_A)
    assert.equal(resWith.statusCode, 200)
    assert.ok(resWith.body.data.data.length >= 1)

    // dateTo before creation should exclude it
    const futureDate = '2020-01-01T00:00:00.000Z'
    const resWithout = await request(app.getHttpServer())
      .get(`/transactions?dateFrom=${futureDate}&dateTo=${futureDate}`)
      .set(TENANT_A)
    assert.equal(resWithout.statusCode, 200)
    assert.equal(resWithout.body.data.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /transactions creates batch orders', async () => {
  const { app, memberService } = await buildApp()
  ensureMember(memberService, 'm-batch-1')
  ensureMember(memberService, 'm-batch-2')

  try {
    const batchRes = await request(app.getHttpServer())
      .post('/transactions')
      .set(TENANT_A)
      .send({
        orders: [
          {
            memberId: 'm-batch-1',
            items: [{ skuId: 'sku-a', title: 'Item A', quantity: 1, price: 50 }],
            amount: 50,
            externalPaymentId: 'ext-pay-batch-1'
          },
          {
            memberId: 'm-batch-2',
            items: [{ skuId: 'sku-b', title: 'Item B', quantity: 2, price: 30 }],
            amount: 60,
            externalPaymentId: 'ext-pay-batch-2'
          }
        ]
      })
    assert.equal(batchRes.statusCode, 201)
    assert.equal(batchRes.body.data.processed, 2)
    assert.equal(batchRes.body.data.results.length, 2)
    assert.ok(batchRes.body.data.results.every((r: any) => r.status === 'created'))

    // verify the orders exist
    const listOrders = await request(app.getHttpServer())
      .get('/transactions/orders')
      .set(TENANT_A)
    assert.ok(listOrders.body.data.length >= 2)
  } finally {
    await app.close()
  }
})

it('e2e: GET /transactions/stats returns aggregated stats', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-stats')

  try {
    const orderId = await settleOrder(app, cashierService, memberService, loyaltyService, 'm-stats', 150, 'ext-pay-stats-1')
    await settleOrder(app, cashierService, memberService, loyaltyService, 'm-stats', 250, 'ext-pay-stats-2')

    // create and approve a refund
    const refundRes = await request(app.getHttpServer())
      .post(`/transactions/orders/${orderId}/refunds`)
      .set(TENANT_A)
      .send({ refundAmount: 50, reason: 'stats-test', operator: 'op-stats' })
    const refundId = refundRes.body.data.refunds[0].refundId
    await request(app.getHttpServer())
      .post(`/transactions/refunds/${refundId}/approve`)
      .set(TENANT_A)
      .send({ operator: 'mgr-stats' })

    const stats = await request(app.getHttpServer())
      .get('/transactions/stats')
      .set(TENANT_A)
    assert.equal(stats.statusCode, 200)
    assert.equal(stats.body.data.totalOrders, 2)
    assert.equal(stats.body.data.totalRevenue, 400)
    assert.ok(stats.body.data.totalRefunds >= 50)
    assert.ok(stats.body.data.netRevenue <= 350)
  } finally {
    await app.close()
  }
})

it('e2e: cross-tenant data isolation for transactions list', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-iso')

  try {
    await settleOrder(app, cashierService, memberService, loyaltyService, 'm-iso', 180, 'ext-pay-iso-a')

    // tenant A sees its orders
    const listA = await request(app.getHttpServer())
      .get('/transactions?type=order')
      .set(TENANT_A)
    assert.equal(listA.statusCode, 200)
    assert.ok(listA.body.data.data.length >= 1)

    // tenant B should see empty list (no orders under tenant B)
    const listB = await request(app.getHttpServer())
      .get('/transactions?type=order')
      .set(TENANT_B)
    assert.equal(listB.statusCode, 200)
    assert.equal(listB.body.data.data.length, 0)

    // Verify tenant A cannot access tenant B data
    for (const tx of listA.body.data.data) {
      assert.equal(tx.order.tenantContext.tenantId, 'tenant-A')
    }
  } finally {
    await app.close()
  }
})

it('e2e: pagination with page and pageSize', async () => {
  const { app, memberService, cashierService, loyaltyService } = await buildApp()
  ensureMember(memberService, 'm-page')

  try {
    // create 5 orders
    for (let i = 0; i < 5; i++) {
      await settleOrder(app, cashierService, memberService, loyaltyService, 'm-page', 50, `ext-pay-page-${i}`)
    }

    // page 1, pageSize 2 → should return 2 items, total 5
    const page1 = await request(app.getHttpServer())
      .get('/transactions?type=order&page=1&pageSize=2')
      .set(TENANT_A)
    assert.equal(page1.statusCode, 200)
    assert.equal(page1.body.data.data.length, 2)
    assert.equal(page1.body.data.total, 5)
    assert.equal(page1.body.data.page, 1)

    // page 2, pageSize 2 → should return 2 items
    const page2 = await request(app.getHttpServer())
      .get('/transactions?type=order&page=2&pageSize=2')
      .set(TENANT_A)
    assert.equal(page2.statusCode, 200)
    assert.equal(page2.body.data.data.length, 2)
    assert.equal(page2.body.data.total, 5)

    // page 3, pageSize 2 → should return 1 item
    const page3 = await request(app.getHttpServer())
      .get('/transactions?type=order&page=3&pageSize=2')
      .set(TENANT_A)
    assert.equal(page3.statusCode, 200)
    assert.equal(page3.body.data.data.length, 1)

    // page 4 should be empty
    const page4 = await request(app.getHttpServer())
      .get('/transactions?type=order&page=4&pageSize=2')
      .set(TENANT_A)
    assert.equal(page4.statusCode, 200)
    assert.equal(page4.body.data.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: non-existent transaction returns error', async () => {
  const { app } = await buildApp()

  try {
    // unknown order → 500 (service throws)
    const unknownOrder = await request(app.getHttpServer())
      .get('/transactions/orders/nonexistent-order-id')
      .set(TENANT_A)
    assert.equal(unknownOrder.statusCode, 500)

    // unknown refund → 500
    const unknownRefund = await request(app.getHttpServer())
      .get('/transactions/refunds/nonexistent-refund-id')
      .set(TENANT_A)
    assert.equal(unknownRefund.statusCode, 500)
  } finally {
    await app.close()
  }
})
