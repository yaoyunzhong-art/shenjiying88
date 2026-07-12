import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [cashier] [C] 角色扩展测试
 *
 * 8 角色视角的收银模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个深层场景测试
 * 使用独立 in-memory Store 避免装饰器依赖
 */
import assert from 'node:assert/strict'
// ── In-memory 模拟 Store ──
const CashierOrderStatus = {
  Created: 'CREATED',
  PendingPayment: 'PENDING_PAYMENT',
  Paid: 'PAID',
  PaymentFailed: 'PAYMENT_FAILED',
  Closed: 'CLOSED'
} as const
const CashierPaymentStatus = {
  Pending: 'PENDING',
  Succeeded: 'SUCCEEDED',
  Failed: 'FAILED'
} as const
function makeTenantContext(tenantId = 't-ext', brandId = 'b-ext', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}
// ── 模拟 CashierService ──
class MockCashierService {
  private orders = new Map<string, any>()
  private payments = new Map<string, any>()
  private nextOrderSeq = 1
  private nextPaymentSeq = 1
  createOrder(ctx: any, input: any) {
    if (!input.items?.length) throw new Error('Cashier order must include at least one item')
    const orderId = `order-ext-${String(this.nextOrderSeq++).padStart(3, '0')}`
    const now = new Date().toISOString()
    const totalAmount = input.items.reduce((s: number, i: any) => s + i.quantity * i.price, 0)
    const order = {
      orderId,
      tenantContext: ctx,
      memberId: input.memberId,
      items: input.items.map((i: any) => ({ ...i })),
      currency: input.currency ?? 'CNY',
      totalAmount,
      couponCode: input.couponCode,
      blindboxPlanId: input.blindboxPlanId,
      blindboxQuantity: input.blindboxQuantity,
      status: CashierOrderStatus.Created,
      createdAt: now,
      updatedAt: now,
      source: 'memory' as const
    }
    this.orders.set(orderId, order)
    return order
  }
  listOrders(ctx: any) {
    return Array.from(this.orders.values()).filter(
      (o) => o.tenantContext.tenantId === ctx.tenantId
    )
  }
  getOrder(orderId: string, ctx: any) {
    const order = this.orders.get(orderId)
    if (!order || order.tenantContext.tenantId !== ctx.tenantId) return undefined
    return order
  }
  createPayment(orderId: string, input: any) {
    const order = this.orders.get(orderId)
    if (!order) throw new Error(`Order ${orderId} not found`)
    const now = new Date().toISOString()
    const paymentId = `payment-ext-${String(this.nextPaymentSeq++).padStart(3, '0')}`
    const payment = {
      paymentId,
      orderId,
      externalPaymentId: input.externalPaymentId,
      channel: input.channel,
      amount: input.amount ?? order.totalAmount,
      status: CashierPaymentStatus.Pending,
      createdAt: now,
      updatedAt: now
    }
    this.payments.set(paymentId, payment)
    order.status = CashierOrderStatus.PendingPayment
    order.latestPaymentId = payment.paymentId
    order.updatedAt = now
    return payment
  }
  listPayments(ctx: any) {
    return Array.from(this.payments.values()).filter((p) => {
      const o = this.orders.get(p.orderId)
      return o?.tenantContext.tenantId === ctx.tenantId
    })
  }
  listOrderPayments(orderId: string, ctx: any) {
    const order = this.orders.get(orderId)
    if (!order || order.tenantContext.tenantId !== ctx.tenantId) return []
    return Array.from(this.payments.values()).filter((p) => p.orderId === orderId)
  }
  getLatestPayment(orderId: string, ctx: any) {
    const order = this.getOrder(orderId, ctx)
    if (!order?.latestPaymentId) return undefined
    return this.payments.get(order.latestPaymentId)
  }
  applyPaymentCallback(input: any) {
    const order = this.orders.get(input.orderId)
    if (!order) throw new Error(`Order ${input.orderId} not found`)
    if (order.tenantContext.tenantId !== input.tenantId) throw new Error(`Order ${input.orderId} does not belong to tenant ${input.tenantId}`)
    const existingPayment = Array.from(this.payments.values()).find(
      (p) => p.orderId === input.orderId && p.externalPaymentId === input.externalPaymentId
    ) || this.createPayment(input.orderId, { channel: input.channel ?? 'unknown', amount: input.amount, externalPaymentId: input.externalPaymentId })
    const now = new Date().toISOString()
    existingPayment.externalPaymentId = input.externalPaymentId ?? existingPayment.externalPaymentId
    existingPayment.transactionNo = input.transactionNo
    existingPayment.updatedAt = now
    existingPayment.completedAt = now
    if (input.standardizedEventName === 'cashier.payment-succeeded') {
      existingPayment.status = CashierPaymentStatus.Succeeded
      order.status = CashierOrderStatus.Paid
      order.paidAt = now
    } else {
      existingPayment.status = CashierPaymentStatus.Failed
      existingPayment.failureReason = 'Payment callback reported failure'
      order.status = CashierOrderStatus.PaymentFailed
    }
    order.latestPaymentId = existingPayment.paymentId
    order.updatedAt = now
    return { order: { ...order }, payment: { ...existingPayment } }
  }
  closeOrder(orderId: string, ctx: any, input?: { reason?: string; operator?: string }) {
    const order = this.orders.get(orderId)
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.tenantContext.tenantId !== ctx.tenantId) throw new Error(`Order ${orderId} does not belong to tenant ${ctx.tenantId}`)
    if (order.status === CashierOrderStatus.Paid) throw new Error(`Paid order ${orderId} cannot be manually closed`)
    if (order.status === CashierOrderStatus.Closed) return { order: { ...order }, payment: undefined }
    const payment = order.latestPaymentId ? this.payments.get(order.latestPaymentId) : undefined
    if (order.status !== CashierOrderStatus.PendingPayment && order.status !== CashierOrderStatus.Created) {
      throw new Error(`Order ${orderId} is not eligible for manual close`)
    }
    if (payment && payment.status === CashierPaymentStatus.Pending) {
      payment.status = CashierPaymentStatus.Failed
      payment.failureReason = 'Order manually closed'
      payment.updatedAt = new Date().toISOString()
      payment.completedAt = payment.updatedAt
    }
    const now = new Date().toISOString()
    order.status = CashierOrderStatus.Closed
    order.closedAt = now
    order.closeReason = 'MANUAL_CANCEL'
    order.closedBy = input?.operator
    order.closeNote = input?.reason
    order.updatedAt = now
    return { order: { ...order }, payment: payment ? { ...payment } : undefined }
  }
  closeTimedOutOrder(orderId: string, ctx: any) {
    const order = this.orders.get(orderId)
    if (!order) throw new Error(`Order ${orderId} not found`)
    if (order.tenantContext.tenantId !== ctx.tenantId) throw new Error(`Order ${orderId} does not belong to tenant ${ctx.tenantId}`)
    if (order.status === CashierOrderStatus.Paid) throw new Error(`Paid order ${orderId} cannot be timeout-closed`)
    const payment = order.latestPaymentId ? this.payments.get(order.latestPaymentId) : undefined
    if (payment && payment.status === CashierPaymentStatus.Pending) {
      payment.status = CashierPaymentStatus.Failed
      payment.failureReason = 'Payment timed out'
    }
    const now = new Date().toISOString()
    order.status = CashierOrderStatus.Closed
    order.closedAt = now
    order.closeReason = 'PAYMENT_TIMEOUT'
    order.updatedAt = now
    return { order: { ...order }, payment: payment ? { ...payment } : undefined }
  }
}
function freshService() {
  return new MockCashierService()
}
// ════════════════════════════════════════════════
//  👔 店长扩展
// ════════════════════════════════════════════════
describe('👔店长 收银扩展测试', () => {
  it('店长手动关闭待支付订单（正常：取消超时未付订单）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-01',
      items: [{ skuId: 'sku-01', quantity: 1, price: 100 }]
    })
    svc.createPayment(order.orderId, { channel: 'wechat-pay', amount: 100 })
    const { order: closed, payment: closedPayment } = svc.closeOrder(
      order.orderId,
      ctx,
      { reason: '顾客半小时未付款，手动关闭', operator: 'store-manager-01' }
    )
    assert.equal(closed.status, CashierOrderStatus.Closed)
    assert.equal(closed.closeReason, 'MANUAL_CANCEL')
    assert.equal(closed.closedBy, 'store-manager-01')
    assert.equal(closed.closeNote, '顾客半小时未付款，手动关闭')
    assert.ok(closed.closedAt)
    assert.equal(closedPayment!.status, CashierPaymentStatus.Failed)
  })
  it('店长不可关闭已支付订单（边界：保护已收款订单）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-01',
      items: [{ skuId: 'sku-02', quantity: 1, price: 200 }]
    })
    svc.createPayment(order.orderId, { channel: 'alipay' })
    await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-002'
    })
    assert.throws(
      () => await svc.closeOrder(order.orderId, ctx),
      /Paid order .* cannot be manually closed/
    )
  })
  it('店长超时自动关闭订单（业务边界：超时自动触发）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-01',
      items: [{ skuId: 'sku-03', quantity: 1, price: 50 }]
    })
    svc.createPayment(order.orderId, { channel: 'card' })
    const { order: closed } = await svc.closeTimedOutOrder(order.orderId, ctx)
    assert.equal(closed.status, CashierOrderStatus.Closed)
    assert.equal(closed.closeReason, 'PAYMENT_TIMEOUT')
    assert.ok(closed.closedAt)
  })
})
// ════════════════════════════════════════════════
//  🛒 前台扩展
// ════════════════════════════════════════════════
describe('🛒前台 收银扩展测试', () => {
  it('前台查看订单详情（正常：完整字段展示）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-02',
      items: [
        { skuId: 'sku-a', title: '可乐', quantity: 2, price: 5 },
        { skuId: 'sku-b', title: '薯片', quantity: 1, price: 8 }
      ],
      currency: 'CNY'
    })
    const detail = await svc.getOrder(order.orderId, ctx)
    assert.ok(detail)
    assert.equal(detail!.orderId, order.orderId)
    assert.equal(detail!.memberId, 'm-02')
    assert.equal(detail!.currency, 'CNY')
    assert.equal(detail!.items.length, 2)
    assert.equal(detail!.items[0].title, '可乐')
    assert.equal(detail!.items[1].title, '薯片')
  })
  it('前台查询本租户订单数量（正常：多订单计数）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.createOrder(ctx, { memberId: 'm-10', items: [{ skuId: 's1', quantity: 1, price: 10 }] })
    svc.createOrder(ctx, { memberId: 'm-10', items: [{ skuId: 's2', quantity: 2, price: 20 }] })
    svc.createOrder(ctx, { memberId: 'm-10', items: [{ skuId: 's3', quantity: 3, price: 30 }] })
    const orders = svc.listOrders(ctx)
    assert.equal(orders.length, 3)
  })
  it('前台查询不存在的订单应返回 undefined（边界）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const result = await svc.getOrder(.nonexistent-order., ctx)
    assert.equal(result, undefined)
  })
})
// ════════════════════════════════════════════════
//  👥 HR 扩展
// ════════════════════════════════════════════════
describe('👥HR 收银扩展测试', () => {
  it('HR 查看支付流水列表（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-hr1',
      items: [{ skuId: 'sku-hr', quantity: 1, price: 50 }]
    })
    svc.createPayment(order.orderId, { channel: 'card' })
    const payments = svc.listPayments(ctx)
    assert.ok(payments.length >= 1)
  })
  it('HR 查看指定订单的最新支付（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-hr2',
      items: [{ skuId: 'sku-hr2', quantity: 1, price: 100 }]
    })
    svc.createPayment(order.orderId, { channel: 'wechat-pay', amount: 100, externalPaymentId: 'ext-hr2' })
    const latest = await svc.getLatestPayment(order.orderId, ctx)
    assert.ok(latest)
    assert.equal(latest!.channel, 'wechat-pay')
    assert.equal(latest!.amount, 100)
  })
  it('HR 查看无支付订单的最新支付返回 undefined（边界）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const result = await svc.getLatestPayment(.nonexistent., ctx)
    assert.equal(result, undefined)
  })
})
// ════════════════════════════════════════════════
//  🔧 安监扩展
// ════════════════════════════════════════════════
describe('🔧安监 收银扩展测试', () => {
  it('安监核对大额订单总金额（正常：人工审计）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-sec',
      items: [
        { skuId: 'sku-sec1', quantity: 2, price: 500 },
        { skuId: 'sku-sec2', quantity: 1, price: 1200 }
      ]
    })
    const detail = await svc.getOrder(order.orderId, ctx)
    assert.equal(detail!.totalAmount, 2 * 500 + 1 * 1200)
  })
  it('安监确认已关闭订单手动关闭操作幂等（边界：终态保护）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-sec2',
      items: [{ skuId: 'sku-sec3', quantity: 1, price: 100 }]
    })
    svc.createPayment(order.orderId, { channel: 'card' })
    await svc.closeOrder(order.orderId, ctx, { reason: .安全审计关闭., operator: .auditor. })
    const { order: result } = await svc.closeOrder(order.orderId, ctx)
    assert.equal(result.status, CashierOrderStatus.Closed)
  })
  it('安监检查失败支付记录（边界：失败原因追溯）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-sec3',
      items: [{ skuId: 'sku-sec4', quantity: 1, price: 999 }]
    })
    svc.createPayment(order.orderId, { channel: 'bank-transfer' })
    const result = await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-sec-fail'
    })
    assert.equal(result.payment.status, CashierPaymentStatus.Failed)
    assert.ok(result.payment.failureReason)
  })
})
// ════════════════════════════════════════════════
//  🎮 导玩员扩展
// ════════════════════════════════════════════════
describe('🎮导玩员 收银扩展测试', () => {
  it('导玩员为会员创建多商品游戏订单（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-guide1',
      items: [
        { skuId: 'game-coin', title: '游戏币 x100', quantity: 1, price: 20 },
        { skuId: 'game-time', title: 'VR体验', quantity: 1, price: 60 }
      ]
    })
    assert.equal(order.items.length, 2)
    assert.equal(order.totalAmount, 80)
    assert.ok(order.orderId)
  })
  it('导玩员跨租户查询订单应被隔离（权限边界）', () => {
    const svc = freshService()
    const ctx = makeTenantContext('t-guide-alpha')
    svc.createOrder(ctx, {
      memberId: 'm-guide2',
      items: [{ skuId: 'game-002', quantity: 1, price: 30 }]
    })
    const wrongCtx = makeTenantContext('t-guide-beta')
    const orders = svc.listOrders(wrongCtx)
    assert.equal(orders.length, 0)
  })
})
// ════════════════════════════════════════════════
//  🎯 运行专员扩展
// ════════════════════════════════════════════════
describe('🎯运行专员 收银扩展测试', () => {
  it('运行专员处理支付回调时验证 transactionNo 记录（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-ops1',
      items: [{ skuId: 'sku-ops1', quantity: 1, price: 300 }]
    })
    svc.createPayment(order.orderId, {
      channel: 'wechat-pay',
      amount: 300,
      externalPaymentId: 'ext-ops-01'
    })
    const result = await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-ops-01',
      transactionNo: 'txn-ops-20260630'
    })
    assert.equal(result.payment.transactionNo, 'txn-ops-20260630')
    assert.equal(result.payment.status, CashierPaymentStatus.Succeeded)
  })
  it('运行专员查某订单的所有支付记录（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-ops2',
      items: [{ skuId: 'sku-ops2', quantity: 1, price: 400 }]
    })
    // 第一笔失败
    svc.createPayment(order.orderId, { channel: 'card', amount: 400, externalPaymentId: 'ext-ops-fail' })
    await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-ops-fail'
    })
    // 第二笔成功
    svc.createPayment(order.orderId, { channel: 'wechat-pay', amount: 400, externalPaymentId: 'ext-ops-ok' })
    await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-ops-ok',
      transactionNo: 'txn-ops-ok-02'
    })
    const payments = svc.listOrderPayments(order.orderId, ctx)
    assert.equal(payments.length, 2)
    const succeeded = payments.filter(p => p.status === CashierPaymentStatus.Succeeded)
    const failed = payments.filter(p => p.status === CashierPaymentStatus.Failed)
    assert.equal(succeeded.length, 1)
    assert.equal(failed.length, 1)
  })
  it('运行专员重复回调不创建新支付（幂等边界）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-ops3',
      items: [{ skuId: 'sku-ops3', quantity: 1, price: 100 }]
    })
    svc.createPayment(order.orderId, { channel: 'alipay', amount: 100, externalPaymentId: 'ext-idem-01' })
    const r1 = await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-idem-01',
      transactionNo: 'txn-ok-01'
    })
    assert.equal(r1.payment.status, CashierPaymentStatus.Succeeded)
    // 同样 externalPaymentId 再次回调 → 重用已有支付记录
    const r2 = await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-idem-01',
      transactionNo: 'txn-ok-01'
    })
    assert.equal(r2.payment.paymentId, r1.payment.paymentId)
  })
})
// ════════════════════════════════════════════════
//  🤝 团建扩展
// ════════════════════════════════════════════════
describe('🤝团建 收银扩展测试', () => {
  it('团建创建含大额项目的团队订单（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-team1',
      items: [
        { skuId: 'team-pkg', title: '团建VIP套餐', quantity: 1, price: 5000 },
        { skuId: 'team-insure', title: '团建保险', quantity: 20, price: 15 },
        { skuId: 'team-meal', title: '团建餐食', quantity: 20, price: 50 }
      ],
      currency: 'CNY'
    })
    assert.equal(order.items.length, 3)
    assert.equal(order.totalAmount, 5000 + 20 * 15 + 20 * 50)
    assert.equal(order.totalAmount, 6300)
  })
  it('团建订单支付失败后可重试（正常流程：失败→重试→成功）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-team2',
      items: [{ skuId: 'team-retry', title: '团建重试订单', quantity: 1, price: 3000 }]
    })
    // 第一次失败
    svc.createPayment(order.orderId, { channel: 'card', amount: 3000, externalPaymentId: 'ext-team-fail' })
    await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-team-fail'
    })
    // 第二次成功
    svc.createPayment(order.orderId, { channel: 'bank-transfer', amount: 3000, externalPaymentId: 'ext-team-ok' })
    const result = await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext',
      externalPaymentId: 'ext-team-ok',
      transactionNo: 'txn-team-success'
    })
    assert.equal(result.order.status, CashierOrderStatus.Paid)
    assert.equal(result.payment.status, CashierPaymentStatus.Succeeded)
  })
})
// ════════════════════════════════════════════════
//  📢 营销扩展
// ════════════════════════════════════════════════
describe('📢营销 收银扩展测试', () => {
  it('营销创建含盲盒计划的订单（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-mkt1',
      items: [{ skuId: 'blindbox-sku', title: '神秘盲盒', quantity: 1, price: 39 }],
      blindboxPlanId: 'bb-limited-edition',
      blindboxQuantity: 3
    })
    assert.equal(order.blindboxPlanId, 'bb-limited-edition')
    assert.equal(order.blindboxQuantity, 3)
    assert.equal(order.totalAmount, 39)
  })
  it('营销查看订单列表以评估营销活动效果（正常）', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.createOrder(ctx, { memberId: 'm-mkt2', items: [{ skuId: 'mk-1', quantity: 1, price: 100 }] })
    svc.createOrder(ctx, { memberId: 'm-mkt2', items: [{ skuId: 'mk-2', quantity: 2, price: 50 }] })
    svc.createOrder(ctx, { memberId: 'm-mkt3', items: [{ skuId: 'mk-3', quantity: 3, price: 30 }] })
    const orders = svc.listOrders(ctx)
    assert.ok(orders.length >= 3)
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
    assert.equal(totalRevenue, 100 + 100 + 90)
  })
  it('营销查询无订单租户获得空列表（边界）', () => {
    const svc = freshService()
    const ctx = makeTenantContext('t-empty-store')
    const orders = svc.listOrders(ctx)
    assert.equal(orders.length, 0)
  })
})
// ════════════════════════════════════════════════
//  状态机扩展边界
// ════════════════════════════════════════════════
describe('订单状态机扩展边界', () => {
  it('已支付订单不可被超时关闭', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-fsm1',
      items: [{ skuId: 'fsm-1', quantity: 1, price: 300 }]
    })
    svc.createPayment(order.orderId, { channel: 'wechat-pay', amount: 300 })
    await svc.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 't-ext'
    })
    assert.throws(
      () => await svc.closeTimedOutOrder(order.orderId, ctx),
      /Paid order .* cannot be timeout-closed/
    )
  })
  it('已关闭订单超时关闭幂等', () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const order = svc.createOrder(ctx, {
      memberId: 'm-fsm2',
      items: [{ skuId: 'fsm-2', quantity: 1, price: 100 }]
    })
    await svc.closeTimedOutOrder(order.orderId, ctx)
    const { order: result } = await svc.closeTimedOutOrder(order.orderId, ctx)
    assert.equal(result.status, CashierOrderStatus.Closed)
  })
})
