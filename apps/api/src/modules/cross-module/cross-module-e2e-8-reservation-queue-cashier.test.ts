import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E 跨模块 #8 — 预约 → 排队 → 收银 → 完成 全链路
 *
 * 链路:
 *   1. ReservationService.create (Pending)
 *   2. ReservationService.confirm (Confirmed)
 *   3. QueueService.create (Waiting)
 *   4. QueueService.complete
 *   5. ReservationService.startProgress (InProgress)
 *   6. CashierService.createOrder + createPayment + applyPaymentCallback(succeeded)
 *   7. ReservationService.complete (Completed)
 *
 * 验证:
 *   - 跨模块状态机流转正确
 *   - 排队序号生成 (B001/B002 per tenant+type)
 *   - estimated wait 随队列增长
 *   - 跨租户隔离
 *   - 取消路径一致性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Inject, Param, Post, Req } from '@nestjs/common'
import request from 'supertest'
import type { Request } from 'express'
import { CashierService } from '../cashier/cashier.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { QueueService } from '../queue/queue.service'
import { QueueType, QueueStatus } from '../queue/queue.entity'
import {
  ReservationService,
} from '../reservation/reservation.service'
import {
  ReservationStatus,
  ReservationType
} from '../reservation/reservation.entity'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'
import { buildCrossModuleTestApp } from './test-helpers'

// ─── TestController ───

@Controller()
class TestController {
  constructor(
    @Inject(MemberService) private readonly memberService: MemberService,
    @Inject(ReservationService) private readonly reservationService: ReservationService,
    @Inject(QueueService) private readonly queueService: QueueService,
    @Inject(CashierService) private readonly cashierService: CashierService
  ) {}

  @Post('members')
  register(@Req() req: Request, @Body() body: { memberId: string; nickname?: string }) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.memberService.register({
      memberId: body.memberId,
      tenantContext: tc,
      nickname: body.nickname ?? `U-${body.memberId}`
    })
  }

  @Post('reservations')
  createReservation(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.reservationService.create({
      tenantId: tc.tenantId,
      type: body.type as ReservationType,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      userId: body.memberId,
      userName: body.userName ?? body.memberId,
      startTime: body.startTime,
      endTime: body.endTime,
      duration: body.duration ?? 60,
      price: body.price ?? 0,
      deposit: body.deposit ?? 0
    })
  }

  @Post('reservations/:id/confirm')
  confirmReservation(@Req() req: Request, @Param('id') id: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.reservationService.confirm(id, tc.tenantId)
  }

  @Post('reservations/:id/start-progress')
  startProgress(@Req() req: Request, @Param('id') id: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.reservationService.startProgress(id, tc.tenantId)
  }

  @Post('reservations/:id/complete')
  completeReservation(@Req() req: Request, @Param('id') id: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.reservationService.complete(id, tc.tenantId)
  }

  @Post('reservations/:id/cancel')
  cancelReservation(@Req() req: Request, @Param('id') id: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.reservationService.cancel(id, tc.tenantId)
  }

  @Post('queues/join')
  joinQueue(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.queueService.create({
      tenantId: tc.tenantId,
      type: body.type ?? QueueType.Waiting,
      userId: body.memberId,
      userName: body.userName ?? body.memberId,
      partySize: body.partySize ?? 1,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      remark: body.remark
    })
  }

  @Post('queues/:id/complete')
  completeQueue(@Req() req: Request, @Param('id') id: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.queueService.complete(id, tc.tenantId)
  }

  @Post('queues/:id/start-service')
  startService(@Req() req: Request, @Param('id') id: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.queueService.startService(id, tc.tenantId)
  }

  @Post('queues/call-next')
  callNextQueue(@Req() req: Request, @Body() body: { resourceId: string }) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.queueService.callNext(body.resourceId, tc.tenantId)
  }

  @Post('queues/:id/cancel')
  cancelQueue(@Req() req: Request, @Param('id') id: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.queueService.cancel(id, tc.tenantId)
  }

  @Post('cashier/orders')
  createOrder(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.createOrder(tc, body)
  }

  @Post('cashier/orders/:orderId/payments')
  createPayment(@Param('orderId') orderId: string, @Body() body: any) {
    return this.cashierService.createPayment(orderId, body)
  }

  @Post('cashier/payments/callback')
  paymentCallback(@Body() body: any) {
    return this.cashierService.applyPaymentCallback(body)
  }
}

// ─── 构建 app ───

async function buildApp() {
  resetMemberServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  loyaltyService.resetLoyaltyStoresForTests?.()
  const cashierService = new CashierService(memberService, loyaltyService)
  cashierService.resetCashierStoresForTests()
  const reservationService = new ReservationService()
  reservationService.resetStoreForTests()
  const queueService = new QueueService()
  queueService.resetQueueStoresForTests()

  const { app, moduleRef } = await buildCrossModuleTestApp({
    controllers: [TestController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: ReservationService, useValue: reservationService },
      { provide: QueueService, useValue: queueService },
      { provide: CashierService, useValue: cashierService }
    ],
  })
  return { app, moduleRef, memberService, reservationService, queueService, cashierService }
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

function futureTime(offsetMin: number): string {
  return new Date(Date.now() + offsetMin * 60 * 1000).toISOString()
}

// ═══════════════════════════════════════════════════

it('e2e-8: full reservation → queue → service → payment → complete lifecycle', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'grace' })

  try {
    // 1. 预约
    const reservationRes = await request(app.getHttpServer())
      .post('/reservations')
      .set(TENANT_A)
      .send({
        memberId: 'grace',
        resourceId: 'room-101',
        resourceName: '包间 101',
        type: ReservationType.Venue,
        startTime: futureTime(120),
        endTime: futureTime(180),
        duration: 60,
        price: 20000
      })
    assert.equal(reservationRes.statusCode, 201)
    assert.equal(reservationRes.body.data.status, ReservationStatus.Pending)
    const reservationId = reservationRes.body.data.id
    assert.equal(reservationRes.body.data.resourceId, 'room-101')

    // 2. 确认
    const confirmRes = await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/confirm`)
      .set(TENANT_A)
    assert.equal(confirmRes.statusCode, 201)
    assert.equal(confirmRes.body.data.status, ReservationStatus.Confirmed)

    // 3. 到店取号
    const queueRes = await request(app.getHttpServer())
      .post('/queues/join')
      .set(TENANT_A)
      .send({
        type: QueueType.Waiting,
        memberId: 'grace',
        userName: 'Grace',
        resourceId: 'room-101',
        resourceName: '包间 101',
        partySize: 4,
        remark: '生日聚会'
      })
    assert.equal(queueRes.statusCode, 201)
    assert.match(queueRes.body.data.queueNumber, /^B\d{3}$/)
    assert.equal(queueRes.body.data.type, QueueType.Waiting)

    // 4. 叫号 (Waiting → Called)
    const callNextRes = await request(app.getHttpServer())
      .post('/queues/call-next')
      .set(TENANT_A)
      .send({ resourceId: 'room-101' })
    assert.equal(callNextRes.statusCode, 201)
    assert.equal(callNextRes.body.data.status, QueueStatus.Called)
    const calledId = callNextRes.body.data.id

    // 4b. 开始服务 (Called → Serving)
    const startServiceRes = await request(app.getHttpServer())
      .post(`/queues/${calledId}/start-service`)
      .set(TENANT_A)
    assert.equal(startServiceRes.statusCode, 201)
    assert.equal(startServiceRes.body.data.status, QueueStatus.Serving)

    // 4c. 完成排队 (Serving → Completed)
    const completeQueueRes = await request(app.getHttpServer())
      .post(`/queues/${calledId}/complete`)
      .set(TENANT_A)
    assert.equal(completeQueueRes.statusCode, 201)
    assert.equal(completeQueueRes.body.data.status, QueueStatus.Completed)

    // 5. 预约进入 InProgress
    const startRes = await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/start-progress`)
      .set(TENANT_A)
    assert.equal(startRes.statusCode, 201)
    assert.equal(startRes.body.data.status, ReservationStatus.InProgress)

    // 6. 下单消费 (¥200)
    const orderRes = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'grace',
        items: [{ skuId: 'venue-hour', title: '包间 1 小时', quantity: 2, price: 10000 }]
      })
    assert.equal(orderRes.statusCode, 201)
    assert.equal(orderRes.body.data.totalAmount, 20000)
    const orderId = orderRes.body.data.orderId

    // 7. 支付
    const paymentRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 20000 })
    assert.equal(paymentRes.statusCode, 201)

    // 8. 支付成功回调
    const callbackRes = await request(app.getHttpServer())
      .post('/cashier/payments/callback')
      .set(TENANT_A)
      .send({
        standardizedEventName: 'cashier.payment-succeeded',
        aggregateId: orderId,
        orderId,
        tenantId: 'tenant-A',
        channel: 'wechat',
        amount: 20000,
        transactionNo: 'txn-flow-001'
      })
    assert.equal(callbackRes.statusCode, 201)
    assert.equal(callbackRes.body.data.order.status, 'PAID')

    // 9. 预约完成
    const completeRes = await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/complete`)
      .set(TENANT_A)
    assert.equal(completeRes.statusCode, 201)
    assert.equal(completeRes.body.data.status, ReservationStatus.Completed)
  } finally {
    await app.close()
  }
})

it('e2e-8: queue number increment per tenant+type', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'h1' })
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'h2' })
  await request(app.getHttpServer()).post('/members').set(TENANT_B).send({ memberId: 'h3' })

  try {
    const q1 = await request(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'h1' })
    const q2 = await request(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'h2' })
    const q3 = await request(app.getHttpServer()).post('/queues/join').set(TENANT_B).send({ memberId: 'h3' })

    assert.equal(q1.body.data.queueNumber, 'B001')
    assert.equal(q2.body.data.queueNumber, 'B002')
    assert.equal(q3.body.data.queueNumber, 'B001', 'Tenant B 独立计数')
  } finally {
    await app.close()
  }
})

it('e2e-8: cancel reservation + cancel queue keeps data consistent', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'ivy' })

  try {
    const resRes = await request(app.getHttpServer())
      .post('/reservations')
      .set(TENANT_A)
      .send({
        memberId: 'ivy',
        resourceId: 'm-201',
        resourceName: 'M-201',
        type: ReservationType.Service,
        startTime: futureTime(30),
        endTime: futureTime(90),
        duration: 60,
        price: 0
      })
    const reservationId = resRes.body.data.id

    const qRes = await request(app.getHttpServer())
      .post('/queues/join')
      .set(TENANT_A)
      .send({ memberId: 'ivy', resourceId: 'm-201' })
    const queueId = qRes.body.data.id

    const cancelRes = await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/cancel`)
      .set(TENANT_A)
    assert.equal(cancelRes.statusCode, 201)
    assert.equal(cancelRes.body.data.status, ReservationStatus.Cancelled)

    const qCancelRes = await request(app.getHttpServer())
      .post(`/queues/${queueId}/cancel`)
      .set(TENANT_A)
    assert.equal(qCancelRes.statusCode, 201)
    assert.equal(qCancelRes.body.data.status, QueueStatus.Cancelled)
  } finally {
    await app.close()
  }
})

it('e2e-8: cannot start progress without CONFIRMED status', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'jack' })

  try {
    const resRes = await request(app.getHttpServer())
      .post('/reservations')
      .set(TENANT_A)
      .send({
        memberId: 'jack',
        resourceId: 'r-1',
        resourceName: 'R-1',
        type: ReservationType.Equipment,
        startTime: futureTime(60),
        endTime: futureTime(120),
        duration: 60,
        price: 0
      })
    const id = resRes.body.data.id

    const startRes = await request(app.getHttpServer())
      .post(`/reservations/${id}/start-progress`)
      .set(TENANT_A)
    assert.equal(startRes.statusCode, 500, 'PENDING 状态不能 startProgress')
  } finally {
    await app.close()
  }
})

it('e2e-8: cross-tenant isolation - Tenant B cannot confirm Tenant A reservation', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'lily' })

  try {
    const resRes = await request(app.getHttpServer())
      .post('/reservations')
      .set(TENANT_A)
      .send({
        memberId: 'lily',
        resourceId: 'r-A',
        resourceName: 'R-A',
        type: ReservationType.Venue,
        startTime: futureTime(60),
        endTime: futureTime(120),
        duration: 60,
        price: 0
      })
    const reservationId = resRes.body.data.id

    const tenantBConfirm = await request(app.getHttpServer())
      .post(`/reservations/${reservationId}/confirm`)
      .set(TENANT_B)
    assert.equal(tenantBConfirm.statusCode, 500, 'Tenant B 不能 confirm Tenant A 预约')
  } finally {
    await app.close()
  }
})

it('e2e-8: estimated wait time accumulates per queue (5min/person)', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'm1' })
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'm2' })
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'm3' })

  try {
    const q1 = await request(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'm1' })
    const q2 = await request(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'm2' })
    const q3 = await request(app.getHttpServer()).post('/queues/join').set(TENANT_A).send({ memberId: 'm3' })

    assert.equal(q1.body.data.estimatedWaitMin, 0)
    assert.equal(q2.body.data.estimatedWaitMin, 5)
    assert.equal(q3.body.data.estimatedWaitMin, 10)
  } finally {
    await app.close()
  }
})

it('e2e-8: reservation conflict detection - same resource + overlapping time', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'n1' })
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'n2' })

  try {
    const start = futureTime(60)
    const end = futureTime(120)

    // 第一个预约 confirm
    const r1 = await request(app.getHttpServer())
      .post('/reservations')
      .set(TENANT_A)
      .send({
        memberId: 'n1',
        resourceId: 'conflict-room',
        resourceName: 'R',
        type: ReservationType.Venue,
        startTime: start,
        endTime: end,
        duration: 60,
        price: 0
      })
    assert.equal(r1.statusCode, 201)
    await request(app.getHttpServer()).post(`/reservations/${r1.body.data.id}/confirm`).set(TENANT_A)

    // 第二个预约同资源同时段 → conflict
    const r2 = await request(app.getHttpServer())
      .post('/reservations')
      .set(TENANT_A)
      .send({
        memberId: 'n2',
        resourceId: 'conflict-room',
        resourceName: 'R',
        type: ReservationType.Venue,
        startTime: start,
        endTime: end,
        duration: 60,
        price: 0
      })
    // conflict 检测在 confirm 时抛错 (create 不检查)
    assert.equal(r2.statusCode, 201, 'create 阶段允许')
    const r2Confirm = await request(app.getHttpServer())
      .post(`/reservations/${r2.body.data.id}/confirm`)
      .set(TENANT_A)
    assert.equal(r2Confirm.statusCode, 500, 'confirm 阶段检测到同时段冲突')
  } finally {
    await app.close()
  }
})
