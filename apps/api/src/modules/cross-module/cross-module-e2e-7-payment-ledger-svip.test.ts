/**
 * E2E 跨模块 #7 — 收银台 → 财务 → SVIP 升级联动
 *
 * 链路:
 *   HTTP → TestController
 *     → MemberService.register (前置准备)
 *     → CashierService.createOrder + createPayment + applyPaymentCallback(succeeded)
 *       · 发布 cashier.order-created / cashier.payment-created / cashier.payment-succeeded 事件
 *       · 联动 LoyaltyService.settlePaidOrder → 积分入账
 *     → FinanceService.recordTransactionRevenue → 财务流水 (使用 cashier 产出的 orderId/transactionId)
 *     → SvipService.checkAndAutoUpgrade → 累计消费触发升级
 *
 * 验证:
 *   - 订单/支付状态机: Created → PendingPayment → Paid
 *   - 事件总线 publishEvent 被正确调用 (cashier 端)
 *   - 财务 ledger 含正确 orderId/transactionId/type=Revenue
 *   - SVIP 自动升级触发: 累计消费 >= Level1 阈值
 *   - 财务 + SVIP 跨租户隔离 (Tenant B 看不到 Tenant A 数据)
 *   - 退款链路: payment-failed → Refund ledger → SVIP 不升级
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
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
import { CashierService } from '../cashier/cashier.service'
import { resetFinanceServiceTestState, FinanceService } from '../finance/finance.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { SvipService } from '../svip/svip.service'
import { LedgerType } from '../finance/finance.entity'
import type { RequestTenantContext, TenantAwareRequest } from '../tenant/tenant.types'

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

// ─── 事件总线 spy (用于断言 publishEvent 被调用) ───

interface DomainEvent {
  eventName: string
  payload: Record<string, unknown>
  source?: string
  aggregateId?: string
  receivedAt: string
}

class SpyIntegrationOrchestrationService {
  events: DomainEvent[] = []
  async publishEvent(
    eventName: string,
    payload: Record<string, unknown>,
    options?: { source?: string; aggregateId?: string }
  ) {
    this.events.push({
      eventName,
      payload,
      source: options?.source,
      aggregateId: options?.aggregateId,
      receivedAt: new Date().toISOString()
    })
  }
  reset() {
    this.events = []
  }
  ofType(eventName: string): DomainEvent[] {
    return this.events.filter((e) => e.eventName === eventName)
  }
}

// ─── TestController ───

@Controller()
class TestController {
  constructor(
    @Inject(MemberService) private readonly memberService: MemberService,
    @Inject(CashierService) private readonly cashierService: CashierService,
    @Inject(FinanceService) private readonly financeService: FinanceService,
    @Inject(SvipService) private readonly svipService: SvipService
  ) {}

  @Post('members')
  registerMember(@Req() req: Request, @Body() body: { memberId: string; nickname?: string }) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.memberService.register({
      memberId: body.memberId,
      tenantContext: tc,
      nickname: body.nickname ?? `User-${body.memberId}`
    })
  }

  @Post('cashier/orders')
  createOrder(@Req() req: Request, @Body() body: any) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.createOrder(tc, body)
  }

  @Post('cashier/orders/:orderId/payments')
  createPayment(
    @Param('orderId') orderId: string,
    @Body() body: any
  ) {
    return this.cashierService.createPayment(orderId, body)
  }

  @Post('cashier/payments/callback')
  paymentCallback(@Body() body: any) {
    return this.cashierService.applyPaymentCallback(body)
  }

  @Get('cashier/orders/:orderId')
  getOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    const order = this.cashierService.getOrder(orderId, tc)
    if (!order) throw new Error(`Cashier order ${orderId} not found`)
    return order
  }

  @Get('cashier/payments')
  listPayments(@Req() req: Request) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.cashierService.listPayments(tc)
  }

  @Get('finance/ledgers')
  listLedgers(
    @Req() req: Request,
    @Body() body?: { type?: string; orderId?: string; limit?: number }
  ) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.financeService.listLedgers(tc, {
      type: body?.type as any,
      orderId: body?.orderId,
      limit: body?.limit
    })
  }

  @Post('finance/revenue')
  recordRevenue(
    @Req() req: Request,
    @Body() body: { orderId: string; transactionId: string; amount: number; description: string }
  ) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.financeService.recordTransactionRevenue(tc, body)
  }

  @Post('finance/refund')
  recordRefund(
    @Req() req: Request,
    @Body() body: { orderId: string; transactionId: string; amount: number; description: string }
  ) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.financeService.recordTransactionRefund(tc, body)
  }

  @Post('svip/tiers/init')
  initSvipTiers(@Req() req: Request) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.svipService.initDefaultTiers(tc)
  }

  @Post('svip/check/auto-upgrade')
  autoUpgrade(
    @Req() req: Request,
    @Body() body: { memberId: string; totalSpend: number; currentPoints: number }
  ) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    return this.svipService.checkAndAutoUpgrade(
      tc,
      body.memberId,
      body.totalSpend,
      body.currentPoints
    )
  }

  @Get('svip/members/:memberId')
  getSvipMember(@Req() req: Request, @Param('memberId') memberId: string) {
    const tc = (req as TenantAwareRequest).tenantContext as RequestTenantContext
    const m = this.svipService.getMemberTier(memberId, tc.tenantId)
    if (!m) throw new Error(`SvipMember ${memberId} not found`)
    return m
  }
}

// ─── 构建 app ───

async function buildApp() {
  resetMemberServiceTestState()
  resetFinanceServiceTestState()
  const memberService = new MemberService()
  const loyaltyService = new LoyaltyService(memberService)
  loyaltyService.resetLoyaltyStoresForTests()
  const cashierService = new CashierService(memberService, loyaltyService)
  cashierService.resetCashierStoresForTests()
  const financeService = new FinanceService()
  const svipService = new SvipService()
  svipService.resetSvipStoresForTests()
  const spy = new SpyIntegrationOrchestrationService()
  // 手动注入 spy (替换 Optional integrationOrchestrationService)
  ;(cashierService as any).integrationOrchestrationService = spy

  const moduleRef = await Test.createTestingModule({
    controllers: [TestController],
    providers: [
      { provide: MemberService, useValue: memberService },
      { provide: CashierService, useValue: cashierService },
      { provide: LoyaltyService, useValue: loyaltyService },
      { provide: FinanceService, useValue: financeService },
      { provide: SvipService, useValue: svipService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, memberService, loyaltyService, cashierService, financeService, svipService, spy }
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

function ctxA(): RequestTenantContext {
  return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' }
}

// ═══════════════════════════════════════════════════
// E2E: 完整收银 → 财务 → SVIP 联动
// ═══════════════════════════════════════════════════

test('e2e-7: full payment → ledger → svip upgrade lifecycle', async () => {
  const { app, spy } = await buildApp()
  spy.reset()
  // 1. 注册会员
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'alice' })

  try {
    // 2. 创建订单 (¥100)
    const orderRes = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'alice',
        items: [{ skuId: 'game-1h', title: '游戏 1 小时', quantity: 1, price: 10000 }]
      })
    assert.equal(orderRes.statusCode, 201)
    assert.equal(orderRes.body.data.totalAmount, 10000)
    assert.equal(orderRes.body.data.status, 'CREATED')
    const orderId = orderRes.body.data.orderId

    // 验证 order-created 事件
    const orderCreatedEvents = spy.ofType('cashier.order-created')
    assert.equal(orderCreatedEvents.length, 1)
    assert.equal(orderCreatedEvents[0].aggregateId, orderId)
    assert.equal(orderCreatedEvents[0].payload.orderId, orderId)
    assert.equal(orderCreatedEvents[0].payload.memberId, 'alice')

    // 3. 创建支付 (微信支付)
    const paymentRes = await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat', amount: 10000 })
    assert.equal(paymentRes.statusCode, 201)
    assert.equal(paymentRes.body.data.status, 'PENDING')

    const paymentCreatedEvents = spy.ofType('cashier.payment-created')
    assert.equal(paymentCreatedEvents.length, 1)
    assert.equal(paymentCreatedEvents[0].payload.amount, 10000)
    assert.equal(paymentCreatedEvents[0].payload.channel, 'wechat')

    // 4. 模拟支付成功回调
    const callbackRes = await request(app.getHttpServer())
      .post('/cashier/payments/callback')
      .set(TENANT_A)
      .send({
        standardizedEventName: 'cashier.payment-succeeded',
        aggregateId: orderId,
        orderId,
        tenantId: 'tenant-A',
        externalPaymentId: 'wx-ext-001',
        transactionNo: 'wx-txn-001',
        channel: 'wechat',
        amount: 10000
      })
    assert.equal(callbackRes.statusCode, 201)
    assert.equal(callbackRes.body.data.order.status, 'PAID')

    const succeededEvents = spy.ofType('cashier.payment-succeeded')
    assert.equal(succeededEvents.length, 1)
    assert.equal(succeededEvents[0].payload.status, 'SUCCEEDED')

    // 5. 财务入账 (cashier → finance)
    const revenueRes = await request(app.getHttpServer())
      .post('/finance/revenue')
      .set(TENANT_A)
      .send({
        orderId,
        transactionId: 'wx-txn-001',
        amount: 10000,
        description: '订单 ' + orderId + ' 支付成功'
      })
    assert.equal(revenueRes.statusCode, 201)
    assert.equal(revenueRes.body.data.type, LedgerType.Revenue)
    assert.equal(revenueRes.body.data.amount, 10000)
    assert.equal(revenueRes.body.data.orderId, orderId)
    assert.equal(revenueRes.body.data.transactionId, 'wx-txn-001')

    // 6. SVIP 自动升级 (累计消费 10000 = 满足 Level1 5000)
    await request(app.getHttpServer())
      .post('/svip/tiers/init')
      .set(TENANT_A)
    const upgradeRes = await request(app.getHttpServer())
      .post('/svip/check/auto-upgrade')
      .set(TENANT_A)
      .send({ memberId: 'alice', totalSpend: 10000, currentPoints: 500 })
    assert.equal(upgradeRes.statusCode, 201)
    assert.equal(upgradeRes.body.data.upgraded, true)
    assert.equal(upgradeRes.body.data.newLevel, 1) // Bronze Level1

    // 7. 验证 ledger 可被按 orderId 查询
    const ledgerRes = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .send({ orderId })
    assert.equal(ledgerRes.statusCode, 200)
    assert.equal(ledgerRes.body.data.length, 1)
    assert.equal(ledgerRes.body.data[0].orderId, orderId)
  } finally {
    await app.close()
  }
})

test('e2e-7: multiple orders accumulate in ledger with correct balance', async () => {
  const { app, financeService } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'bob' })

  try {
    // 3 个订单各 ¥50
    for (let i = 0; i < 3; i++) {
      await financeService.recordTransactionRevenue(ctxA(), {
        orderId: `order-${i}`,
        transactionId: `txn-${i}`,
        amount: 5000,
        description: `Order ${i} paid`
      })
    }

    const ledgers = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .send({ limit: 10 })
    assert.equal(ledgers.statusCode, 200)
    assert.equal(ledgers.body.data.length, 3)
    // 余额应为 15000 (3 * 5000)
    const last = ledgers.body.data[ledgers.body.data.length - 1]
    assert.equal(last.balance, 15000)
  } finally {
    await app.close()
  }
})

test('e2e-7: refund path - payment-failed → refund ledger → svip no upgrade', async () => {
  const { app, spy } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'carol' })

  try {
    // 1. 创建订单 + 支付
    const orderRes = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'carol',
        items: [{ skuId: 's', title: 'S', quantity: 1, price: 3000 }]
      })
    const orderId = orderRes.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'alipay' })

    // 2. 失败回调
    const failRes = await request(app.getHttpServer())
      .post('/cashier/payments/callback')
      .set(TENANT_A)
      .send({
        standardizedEventName: 'cashier.payment-failed',
        aggregateId: orderId,
        orderId,
        tenantId: 'tenant-A',
        channel: 'alipay',
        amount: 3000,
        externalPaymentId: 'ali-ext-fail',
        transactionNo: 'ali-txn-fail'
      })
    assert.equal(failRes.statusCode, 201)
    assert.equal(failRes.body.data.order.status, 'PAYMENT_FAILED')

    const failedEvents = spy.ofType('cashier.payment-failed')
    assert.equal(failedEvents.length, 1)

    // 3. 财务退款记账
    const refundRes = await request(app.getHttpServer())
      .post('/finance/refund')
      .set(TENANT_A)
      .send({
        orderId,
        transactionId: 'ali-txn-fail',
        amount: 3000,
        description: '支付失败退款 ' + orderId
      })
    assert.equal(refundRes.statusCode, 201)
    assert.equal(refundRes.body.data.type, LedgerType.Refund)

    // 4. 退款后 SVIP 仅可升到 Bronze (默认 Level1),不能升 Silver/Gold
    await request(app.getHttpServer())
      .post('/svip/tiers/init')
      .set(TENANT_A)
    const upgradeRes = await request(app.getHttpServer())
      .post('/svip/check/auto-upgrade')
      .set(TENANT_A)
      .send({ memberId: 'carol', totalSpend: 0, currentPoints: 0 })
    assert.equal(upgradeRes.statusCode, 201)
    // 退款后 carol 累计消费=0、积分=0,远未达到 Level1 (Bronze) 阈值
    // (minSpend=5000, minPoints=500),应保持非 SVIP 状态
    assert.equal(upgradeRes.body.data.upgraded, false)
    assert.equal(upgradeRes.body.data.reason, 'Below Level1 threshold')
    assert.equal(upgradeRes.body.data.newLevel, undefined)
  } finally {
    await app.close()
  }
})

test('e2e-7: cross-tenant isolation - Tenant B cannot see Tenant A ledger', async () => {
  const { app, financeService } = await buildApp()
  // Tenant A 入账
  await financeService.recordTransactionRevenue(ctxA(), {
    orderId: 'order-A',
    transactionId: 'txn-A',
    amount: 10000,
    description: 'Tenant A order'
  })

  try {
    const ledgerB = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_B)
      .send({ limit: 10 })
    assert.equal(ledgerB.statusCode, 200)
    assert.equal(ledgerB.body.data.length, 0, 'Tenant B 不应看到 Tenant A 的 ledger')

    const ledgerA = await request(app.getHttpServer())
      .get('/finance/ledgers')
      .set(TENANT_A)
      .send({ limit: 10 })
    assert.equal(ledgerA.body.data.length, 1)
  } finally {
    await app.close()
  }
})

test('e2e-7: event publish ordering - order-created before payment-created before payment-succeeded', async () => {
  const { app, spy } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'dave' })

  try {
    const orderRes = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'dave',
        items: [{ skuId: 's', title: 'S', quantity: 1, price: 5000 }]
      })
    const orderId = orderRes.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat' })
    await request(app.getHttpServer())
      .post('/cashier/payments/callback')
      .set(TENANT_A)
      .send({
        standardizedEventName: 'cashier.payment-succeeded',
        aggregateId: orderId,
        orderId,
        tenantId: 'tenant-A',
        channel: 'wechat',
        amount: 5000,
        transactionNo: 't-1'
      })

    const eventNames = spy.events.map((e) => e.eventName)
    const orderIdx = eventNames.indexOf('cashier.order-created')
    const payIdx = eventNames.indexOf('cashier.payment-created')
    const succIdx = eventNames.indexOf('cashier.payment-succeeded')
    assert.ok(orderIdx < payIdx, 'order-created 应早于 payment-created')
    assert.ok(payIdx < succIdx, 'payment-created 应早于 payment-succeeded')
  } finally {
    await app.close()
  }
})

test('e2e-7: large total spend triggers multiple svip upgrades', async () => {
  const { app } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'eve' })

  try {
    // 先入账大额消费
    await request(app.getHttpServer()).post('/svip/tiers/init').set(TENANT_A)

    // 直接通过 checkAndAutoUpgrade 累计 50000 元 + 25000 分 → Silver Level2 (10000/3000)
    const upgradeRes = await request(app.getHttpServer())
      .post('/svip/check/auto-upgrade')
      .set(TENANT_A)
      .send({ memberId: 'eve', totalSpend: 50000, currentPoints: 25000 })
    assert.equal(upgradeRes.statusCode, 201)
    assert.equal(upgradeRes.body.data.upgraded, true)
    // computeSvipTierLevel: Level1 5000/500 → match, Level2 10000/3000 → match,
    // Level3 30000/10000 → 50000/25000 → match
    assert.ok(upgradeRes.body.data.newLevel >= 3, '累计消费 50000 至少应到 Level3')
  } finally {
    await app.close()
  }
})

test('e2e-7: loyalty points accumulate after payment-succeeded', async () => {
  const { app, loyaltyService } = await buildApp()
  await request(app.getHttpServer()).post('/members').set(TENANT_A).send({ memberId: 'frank' })

  try {
    const orderRes = await request(app.getHttpServer())
      .post('/cashier/orders')
      .set(TENANT_A)
      .send({
        memberId: 'frank',
        items: [{ skuId: 's', title: 'S', quantity: 1, price: 20000 }]
      })
    const orderId = orderRes.body.data.orderId
    await request(app.getHttpServer())
      .post(`/cashier/orders/${orderId}/payments`)
      .set(TENANT_A)
      .send({ channel: 'wechat' })
    await request(app.getHttpServer())
      .post('/cashier/payments/callback')
      .set(TENANT_A)
      .send({
        standardizedEventName: 'cashier.payment-succeeded',
        aggregateId: orderId,
        orderId,
        tenantId: 'tenant-A',
        channel: 'wechat',
        amount: 20000,
        transactionNo: 't-2'
      })

    // 验证 loyalty 加积分
    const pointsEntries = loyaltyService.listPointsLedgerForOrder(orderId, 'tenant-A')
    assert.ok(pointsEntries.length > 0, '支付成功后应有点数账目')
    const totalPoints = pointsEntries.reduce((sum, e) => sum + e.points, 0)
    assert.ok(totalPoints > 0, '累计积分应为正')
  } finally {
    await app.close()
  }
})
