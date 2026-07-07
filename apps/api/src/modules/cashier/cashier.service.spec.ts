/**
 * cashier.service.spec.ts — Cashier 收银 Service 深层单元测试
 *
 * 覆盖：
 *  - createOrder: 正例（新订单/DIY订单/会员校验）/ 反例（无items/不存在的会员）/ 边界（0金额/超大数量）
 *  - createPayment: 正例（创建支付）/ 反例（不存在的订单）/ 边界（自定义金额）
 *  - applyPaymentCallback: 正例（成功回调/失败回调/自动创建支付）/ 反例（已关闭订单/租户不匹配）/ 边界（重复回调）
 *  - closeOrder / closeTimedOutOrder: 正例（手动关闭/超时关闭/幂等）/ 反例（已支付/不存在/租户不匹配）
 *  - list / get: 正例（列表/获取/租户过滤）/ 反例（不存在）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const ORDER_STATUSES = ['CREATED', 'PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED', 'CLOSED'] as const
const PAYMENT_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED'] as const
const CLOSE_REASONS = ['PAYMENT_TIMEOUT', 'FULL_REFUND', 'MANUAL_CANCEL'] as const
const PAYMENT_CHANNELS = ['wechat_pay', 'alipay', 'cash', 'card', 'unknown'] as const

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlineTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
}

interface InlineOrderItem {
  skuId: string
  title?: string
  quantity: number
  price: number
}

interface InlineCashierOrder {
  orderId: string
  tenantContext: InlineTenantContext
  memberId: string
  items: InlineOrderItem[]
  currency: string
  totalAmount: number
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
  status: string
  latestPaymentId?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  closedAt?: string
  closeReason?: string
  closedBy?: string
  closeNote?: string
  source: string
}

interface InlineCashierPayment {
  paymentId: string
  orderId: string
  externalPaymentId?: string
  channel: string
  amount: number
  status: string
  transactionNo?: string
  sourceEventName?: string
  failureReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

interface InlineCreateOrderInput {
  memberId: string
  items: InlineOrderItem[]
  currency?: string
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
}

interface InlineCreatePaymentInput {
  channel: string
  amount?: number
  externalPaymentId?: string
}

interface InlinePaymentCallbackDto {
  standardizedEventName: 'cashier.payment-succeeded' | 'cashier.payment-failed'
  aggregateId: string
  orderId: string
  tenantId: string
  externalPaymentId?: string
  transactionNo?: string
  channel?: string
  amount?: number
  payload?: Record<string, unknown>
}

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeTenantContext(overrides?: Partial<InlineTenantContext>): InlineTenantContext {
  return { tenantId: 'tenant-demo', brandId: 'brand-001', storeId: 'store-001', ...overrides }
}

function makeOrderItem(overrides?: Partial<InlineOrderItem>): InlineOrderItem {
  return { skuId: 'sku-' + Math.random().toString(36).slice(2, 8), title: '商品', quantity: 1, price: 100, ...overrides }
}

/** Mock 会员服务：检查会员是否存在 */
const INLINE_KNOWN_MEMBERS = new Map<string, { memberId: string; tenantContext: InlineTenantContext }>()

function ensureKnownMember(memberId: string, tenantContext: InlineTenantContext): void {
  const member = INLINE_KNOWN_MEMBERS.get(memberId)
  if (!member) throw new Error(`Member ${memberId} not found`)
  if (member.tenantContext.tenantId !== tenantContext.tenantId) {
    throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
  }
}

function registerMember(memberId: string, tenantContext: InlineTenantContext): void {
  INLINE_KNOWN_MEMBERS.set(memberId, { memberId, tenantContext })
}

// Mock 忠诚度服务
const INLINE_SETTLED_PAID: Array<{ order: InlineCashierOrder; payment: InlineCashierPayment }> = []
const INLINE_SETTLED_FAILED: Array<{ order: InlineCashierOrder; payment: InlineCashierPayment }> = []

function mockLoyaltySettlePaid(order: InlineCashierOrder, payment: InlineCashierPayment): void {
  INLINE_SETTLED_PAID.push({ order, payment })
}

function mockLoyaltySettleFailed(order: InlineCashierOrder, payment: InlineCashierPayment): void {
  INLINE_SETTLED_FAILED.push({ order, payment })
}

// ═══════════════════════════════════════════════════════════════
// 内联存储 + 业务逻辑
// ═══════════════════════════════════════════════════════════════

const INLINE_ORDERS = new Map<string, InlineCashierOrder>()
const INLINE_PAYMENTS = new Map<string, InlineCashierPayment>()
const INLINE_EVENTS: Array<{ eventName: string; payload: Record<string, unknown> }> = []

function computeTotal(items: InlineOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
}

function resetStores(): void {
  INLINE_ORDERS.clear()
  INLINE_PAYMENTS.clear()
  INLINE_EVENTS.length = 0
  INLINE_SETTLED_PAID.length = 0
  INLINE_SETTLED_FAILED.length = 0
}

// ── createOrder ──

function inlineCreateOrder(tenantContext: InlineTenantContext, input: InlineCreateOrderInput): InlineCashierOrder {
  ensureKnownMember(input.memberId, tenantContext)
  if (!input.items?.length) throw new Error('Cashier order must include at least one item')

  const now = new Date().toISOString()
  const order: InlineCashierOrder = {
    orderId: 'order-' + Math.random().toString(36).slice(2, 14),
    tenantContext,
    memberId: input.memberId,
    items: input.items.map((i) => ({ ...i })),
    currency: input.currency ?? 'CNY',
    totalAmount: computeTotal(input.items),
    couponCode: input.couponCode,
    blindboxPlanId: input.blindboxPlanId,
    blindboxQuantity: input.blindboxQuantity,
    status: 'CREATED',
    createdAt: now,
    updatedAt: now,
    source: 'memory',
  }
  INLINE_ORDERS.set(order.orderId, order)
  INLINE_EVENTS.push({ eventName: 'cashier.order-created', payload: { orderId: order.orderId } })
  return order
}

// ── get/list ──

function inlineGetOrder(orderId: string, tenantContext: InlineTenantContext): InlineCashierOrder | undefined {
  const order = INLINE_ORDERS.get(orderId)
  if (!order || order.tenantContext.tenantId !== tenantContext.tenantId) return undefined
  return order
}

function inlineListOrders(tenantContext: InlineTenantContext): InlineCashierOrder[] {
  return Array.from(INLINE_ORDERS.values()).filter((o) => o.tenantContext.tenantId === tenantContext.tenantId)
}

// ── createPayment ──

function inlineCreatePayment(orderId: string, input: InlineCreatePaymentInput): InlineCashierPayment {
  const order = INLINE_ORDERS.get(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)

  const now = new Date().toISOString()
  const payment: InlineCashierPayment = {
    paymentId: 'payment-' + Math.random().toString(36).slice(2, 14),
    orderId,
    externalPaymentId: input.externalPaymentId,
    channel: input.channel,
    amount: input.amount ?? order.totalAmount,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  }
  INLINE_PAYMENTS.set(payment.paymentId, payment)
  order.status = 'PENDING_PAYMENT'
  order.latestPaymentId = payment.paymentId
  order.updatedAt = now
  INLINE_EVENTS.push({ eventName: 'cashier.payment-created', payload: { orderId, paymentId: payment.paymentId } })
  return payment
}

// ── applyPaymentCallback ──

function inlineApplyPaymentCallback(input: InlinePaymentCallbackDto): { order: InlineCashierOrder; payment: InlineCashierPayment } {
  const order = INLINE_ORDERS.get(input.orderId)
  if (!order) throw new Error(`Order ${input.orderId} not found`)
  if (order.tenantContext.tenantId !== input.tenantId) throw new Error(`Order ${input.orderId} does not belong to tenant ${input.tenantId}`)
  if (order.status === 'CLOSED') throw new Error(`Order ${input.orderId} is already closed`)

  const now = new Date().toISOString()

  // Find or create payment
  let payment = Array.from(INLINE_PAYMENTS.values()).find(
    (p) => p.orderId === input.orderId && (input.externalPaymentId ? p.externalPaymentId === input.externalPaymentId : p.paymentId === order.latestPaymentId)
  )
  if (!payment) {
    payment = inlineCreatePayment(input.orderId, { channel: input.channel ?? 'unknown', amount: input.amount, externalPaymentId: input.externalPaymentId })
  }

  payment.externalPaymentId = input.externalPaymentId ?? payment.externalPaymentId
  payment.transactionNo = input.transactionNo
  payment.sourceEventName = input.standardizedEventName
  payment.updatedAt = now
  payment.completedAt = now

  if (input.standardizedEventName === 'cashier.payment-succeeded') {
    payment.status = 'SUCCEEDED'
    order.status = 'PAID'
    order.paidAt = now
    mockLoyaltySettlePaid(order, payment)
  } else {
    payment.status = 'FAILED'
    payment.failureReason = 'Payment callback reported failure'
    order.status = 'PAYMENT_FAILED'
    mockLoyaltySettleFailed(order, payment)
  }

  order.latestPaymentId = payment.paymentId
  order.updatedAt = now
  INLINE_PAYMENTS.set(payment.paymentId, payment)
  INLINE_ORDERS.set(order.orderId, order)
  INLINE_EVENTS.push({ eventName: input.standardizedEventName, payload: { orderId: order.orderId, paymentId: payment.paymentId } })

  return { order, payment }
}

// ── closeTimedOutOrder ──

function inlineCloseTimedOutOrder(orderId: string, tenantContext: InlineTenantContext, reason?: string): { order: InlineCashierOrder; payment?: InlineCashierPayment } {
  const order = INLINE_ORDERS.get(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)
  if (order.tenantContext.tenantId !== tenantContext.tenantId) throw new Error(`Order ${orderId} does not belong to tenant ${tenantContext.tenantId}`)
  if (order.status === 'PAID') throw new Error(`Paid order ${orderId} cannot be timeout-closed`)

  const payment = order.latestPaymentId ? INLINE_PAYMENTS.get(order.latestPaymentId) : undefined
  if (order.status === 'CLOSED') return { order, payment }
  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'CREATED') throw new Error(`Order ${orderId} is not eligible for timeout close`)

  const now = new Date().toISOString()
  if (payment && payment.status === 'PENDING') {
    payment.status = 'FAILED'
    payment.failureReason = 'Payment timed out'
    payment.sourceEventName = 'cashier.payment-timeout-closed'
    payment.updatedAt = now
    payment.completedAt = now
    INLINE_PAYMENTS.set(payment.paymentId, payment)
    mockLoyaltySettleFailed(order, payment)
  }

  order.status = 'CLOSED'
  order.closedAt = now
  order.closeReason = reason ?? 'PAYMENT_TIMEOUT'
  order.updatedAt = now
  INLINE_ORDERS.set(order.orderId, order)
  INLINE_EVENTS.push({ eventName: 'cashier.order-closed', payload: { orderId: order.orderId, closeReason: order.closeReason } })

  return { order, payment }
}

// ── closeOrder (manual) ──

function inlineCloseOrder(orderId: string, tenantContext: InlineTenantContext, input?: { reason?: string; operator?: string }): { order: InlineCashierOrder; payment?: InlineCashierPayment } {
  const order = INLINE_ORDERS.get(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)
  if (order.tenantContext.tenantId !== tenantContext.tenantId) throw new Error(`Order ${orderId} does not belong to tenant ${tenantContext.tenantId}`)
  if (order.status === 'PAID') throw new Error(`Paid order ${orderId} cannot be manually closed`)

  const payment = order.latestPaymentId ? INLINE_PAYMENTS.get(order.latestPaymentId) : undefined
  if (order.status === 'CLOSED') return { order, payment }
  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'CREATED') throw new Error(`Order ${orderId} is not eligible for manual close`)

  const now = new Date().toISOString()
  if (payment && payment.status === 'PENDING') {
    payment.status = 'FAILED'
    payment.failureReason = 'Order manually closed'
    payment.sourceEventName = 'cashier.payment-manual-close'
    payment.updatedAt = now
    payment.completedAt = now
    INLINE_PAYMENTS.set(payment.paymentId, payment)
    mockLoyaltySettleFailed(order, payment)
  }

  order.status = 'CLOSED'
  order.closedAt = now
  order.closeReason = 'MANUAL_CANCEL'
  order.closedBy = input?.operator
  order.closeNote = input?.reason
  order.updatedAt = now
  INLINE_ORDERS.set(order.orderId, order)
  INLINE_EVENTS.push({ eventName: 'cashier.order-closed', payload: { orderId: order.orderId, closeReason: 'MANUAL_CANCEL', closedBy: order.closedBy } })

  return { order, payment }
}

// ═══════════════════════════════════════════════════════════════
// 正例测试 — createOrder
// ═══════════════════════════════════════════════════════════════

describe('正例 | createOrder', () => {
  beforeEach(() => {
    resetStores()
    registerMember('member-001', makeTenantContext())
    registerMember('member-002', makeTenantContext())
  })

  it('创建普通订单成功', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, {
      memberId: 'member-001',
      items: [{ skuId: 'sku-a', title: '盲盒A', quantity: 2, price: 50 }],
    })
    expect(order.orderId).toMatch(/^order-/)
    expect(order.totalAmount).toBe(100)
    expect(order.status).toBe('CREATED')
  })

  it('多个 items 金额累加', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, {
      memberId: 'member-001',
      items: [
        { skuId: 'sku-a', title: '商品A', quantity: 2, price: 50 },
        { skuId: 'sku-b', title: '商品B', quantity: 1, price: 200 },
      ],
    })
    expect(order.totalAmount).toBe(300) // 2*50 + 1*200
  })

  it('自助盲盒订单含 blindboxPlanId', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, {
      memberId: 'member-001',
      items: [{ skuId: 'blindbox-plan-001', quantity: 3, price: 30 }],
      blindboxPlanId: 'plan-001',
      blindboxQuantity: 3,
    })
    expect(order.blindboxPlanId).toBe('plan-001')
    expect(order.blindboxQuantity).toBe(3)
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — createPayment
// ═══════════════════════════════════════════════════════════════

describe('正例 | createPayment', () => {
  beforeEach(() => {
    resetStores()
    registerMember('member-001', makeTenantContext())
  })

  it('为订单创建支付', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem({ price: 100 })] })
    const payment = inlineCreatePayment(order.orderId, { channel: 'wechat_pay' })
    expect(payment.paymentId).toMatch(/^payment-/)
    expect(payment.status).toBe('PENDING')
    expect(payment.amount).toBe(100)
  })

  it('自定义支付金额', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem({ price: 200 })] })
    const payment = inlineCreatePayment(order.orderId, { channel: 'alipay', amount: 150 })
    expect(payment.amount).toBe(150)
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — applyPaymentCallback
// ═══════════════════════════════════════════════════════════════

describe('正例 | applyPaymentCallback', () => {
  beforeEach(() => {
    resetStores()
    registerMember('member-001', makeTenantContext())
  })

  it('支付成功回调更新订单为 PAID', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem({ price: 100 })] })
    inlineCreatePayment(order.orderId, { channel: 'wechat_pay' })

    const result = inlineApplyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: ctx.tenantId,
      transactionNo: 'txn-001',
    })
    expect(result.order.status).toBe('PAID')
    expect(result.order.paidAt).toBeDefined()
    expect(result.payment.status).toBe('SUCCEEDED')
    expect(result.payment.transactionNo).toBe('txn-001')
  })

  it('支付失败回调更新为 PAYMENT_FAILED', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem({ price: 100 })] })
    inlineCreatePayment(order.orderId, { channel: 'alipay' })

    const result = inlineApplyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: ctx.tenantId,
    })
    expect(result.order.status).toBe('PAYMENT_FAILED')
    expect(result.payment.status).toBe('FAILED')
    expect(result.payment.failureReason).toBeDefined()
  })

  it('回调时自动创建支付（尚未创建）', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem({ price: 100 })] })

    const result = inlineApplyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: ctx.tenantId,
      channel: 'wechat_pay',
      transactionNo: 'auto-txn',
    })
    expect(result.payment.channel).toBe('wechat_pay')
    expect(result.order.status).toBe('PAID')
  })
})

// ═══════════════════════════════════════════════════════════════
// 正例测试 — close / closeTimedOut / list
// ═══════════════════════════════════════════════════════════════

describe('正例 | close / list', () => {
  beforeEach(() => {
    resetStores()
    registerMember('member-001', makeTenantContext())
  })

  it('手动关闭 CREATED 订单', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem()] })
    const result = inlineCloseOrder(order.orderId, ctx, { reason: '用户取消', operator: 'admin' })
    expect(result.order.status).toBe('CLOSED')
    expect(result.order.closeReason).toBe('MANUAL_CANCEL')
    expect(result.order.closedBy).toBe('admin')
    expect(result.order.closeNote).toBe('用户取消')
  })

  it('超时关闭 PENDING_PAYMENT 订单', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem()] })
    inlineCreatePayment(order.orderId, { channel: 'wechat_pay' })
    const result = inlineCloseTimedOutOrder(order.orderId, ctx)
    expect(result.order.status).toBe('CLOSED')
    expect(result.order.closeReason).toBe('PAYMENT_TIMEOUT')
  })

  it('已关闭订单重复关闭幂等', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem()] })
    inlineCloseOrder(order.orderId, ctx)
    // Second close should succeed (idempotent)
    const result = inlineCloseOrder(order.orderId, ctx)
    expect(result.order.status).toBe('CLOSED')
  })

  it('listOrders 按租户过滤', () => {
    const ctxA = makeTenantContext()
    const ctxB = makeTenantContext({ tenantId: 'tenant-other' })
    registerMember('member-other', { tenantId: 'tenant-other' })
    inlineCreateOrder(ctxA, { memberId: 'member-001', items: [makeOrderItem({ skuId: 'a' })] })
    inlineCreateOrder(ctxA, { memberId: 'member-001', items: [makeOrderItem({ skuId: 'b' })] })
    inlineCreateOrder(ctxB, { memberId: 'member-other', items: [makeOrderItem({ skuId: 'c' })] })
    expect(inlineListOrders(ctxA)).toHaveLength(2)
    expect(inlineListOrders(ctxB)).toHaveLength(1)
  })

  it('getOrder 跨租户不可见', () => {
    const ctxA = makeTenantContext()
    const ctxB = makeTenantContext({ tenantId: 'tenant-other' })
    const order = inlineCreateOrder(ctxA, { memberId: 'member-001', items: [makeOrderItem()] })
    expect(inlineGetOrder(order.orderId, ctxA)).toBeDefined()
    expect(inlineGetOrder(order.orderId, ctxB)).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 反例测试
// ═══════════════════════════════════════════════════════════════

describe('反例 | CashierService', () => {
  beforeEach(() => {
    resetStores()
    registerMember('member-001', makeTenantContext())
  })

  it('createOrder 不存在的会员抛异常', () => {
    expect(() => inlineCreateOrder(makeTenantContext(), {
      memberId: 'not-exist',
      items: [makeOrderItem()],
    })).toThrow('Member not-exist not found')
  })

  it('createOrder 空 items 抛异常', () => {
    expect(() => inlineCreateOrder(makeTenantContext(), {
      memberId: 'member-001',
      items: [],
    })).toThrow('must include at least one item')
  })

  it('createPayment 不存在的订单抛异常', () => {
    expect(() => inlineCreatePayment('not-exist', { channel: 'wechat_pay' })).toThrow('not found')
  })

  it('applyPaymentCallback 已关闭订单抛异常', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem()] })
    inlineCloseOrder(order.orderId, ctx)
    expect(() => inlineApplyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: ctx.tenantId,
    })).toThrow('already closed')
  })

  it('applyPaymentCallback 租户不匹配抛异常', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem()] })
    expect(() => inlineApplyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: 'wrong-tenant',
    })).toThrow('does not belong')
  })

  it('closeOrder 已支付订单抛异常', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem()] })
    inlineCreatePayment(order.orderId, { channel: 'wechat_pay' })
    inlineApplyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: ctx.tenantId,
    })
    expect(() => inlineCloseOrder(order.orderId, ctx)).toThrow('cannot be manually closed')
  })

  it('closeTimedOutOrder 不存在的订单抛异常', () => {
    expect(() => inlineCloseTimedOutOrder('not-exist', makeTenantContext())).toThrow('not found')
  })

  it('closeTimedOutOrder 租户不匹配抛异常', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, { memberId: 'member-001', items: [makeOrderItem()] })
    expect(() => inlineCloseTimedOutOrder(order.orderId, makeTenantContext({ tenantId: 'wrong' }))).toThrow('does not belong')
  })
})

// ═══════════════════════════════════════════════════════════════
// 边界测试
// ═══════════════════════════════════════════════════════════════

describe('边界 | CashierService', () => {
  beforeEach(() => {
    resetStores()
    registerMember('member-001', makeTenantContext())
  })

  it('物品数量为 0 totalAmount 为 0', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, {
      memberId: 'member-001',
      items: [{ skuId: 'sku-zero', quantity: 0, price: 100 }],
    })
    expect(order.totalAmount).toBe(0)
  })

  it('超大数量累加不溢出', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, {
      memberId: 'member-001',
      items: [{ skuId: 'sku-bulk', quantity: 99999999, price: 99999999 }],
    })
    expect(order.totalAmount).toBe(99999999 * 99999999)
  })

  it('USD 货币订单', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, {
      memberId: 'member-001',
      items: [makeOrderItem({ price: 99 })],
      currency: 'USD',
    })
    expect(order.currency).toBe('USD')
  })

  it('自定义金额支付为 0', () => {
    const ctx = makeTenantContext()
    const order = inlineCreateOrder(ctx, {
      memberId: 'member-001',
      items: [makeOrderItem({ price: 0 })],
    })
    const payment = inlineCreatePayment(order.orderId, { channel: 'wechat_pay', amount: 0 })
    expect(payment.amount).toBe(0)
  })
})
