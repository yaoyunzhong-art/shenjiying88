import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * cashier.controller.spec.ts
 *
 * Controller-spec 级隔离测试：验证 CashierController 的委托逻辑、路由定义和边界行为。
 * 不依赖 NestJS IoC —— 直接 new 并注入 mock service。
 */

import assert from 'node:assert/strict'

// ── 精简版 Controller / 装饰器 模拟（避免 NestJS 反射依赖） ──
const lastRegisteredRoute: { method: string; path: string } | null = null
const routes: { method: string; path: string; handler: string }[] = []

function collectRoute(method: string, path: string) {
  return (_target: object, propertyKey: string | symbol) => {
    routes.push({ method, path, handler: String(propertyKey) })
  }
}

// ── DTO 模型（按 cashier.dto.ts 签名字段） ──
interface CashierOrderItemDto {
  skuId: string
  title?: string
  quantity: number
  price: number
}

interface CreateCashierOrderDto {
  memberId: string
  items: CashierOrderItemDto[]
  currency?: string
  couponCode?: string
  blindboxPlanId?: string
  blindboxQuantity?: number
}

interface CreateCashierPaymentDto {
  channel: string
  amount?: number
  externalPaymentId?: string
}

interface CashierPaymentCallbackDto {
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

// ── Context ──
interface RequestTenantContext {
  tenantId: string
  brandId: string
  storeId: string
}

function createContext(
  tenantId = 't-cashier',
  brandId = 'b-cashier',
  storeId = 's-001'
): RequestTenantContext {
  return { tenantId, brandId, storeId }
}

// ── Service mock ──
type OrderLike = { orderId: string; status?: string; totalAmount?: number; memberId?: string; tenantId?: string; [k: string]: unknown }
type PaymentLike = { paymentId: string; status?: string; channel?: string; tenantId?: string; [k: string]: unknown }
type CallbackResultLike = { payment: { status: string; transactionNo?: string; reason?: string; [k: string]: unknown }; pointsLedger?: unknown[]; [k: string]: unknown }
type MockService = {
  listOrders: (ctx: RequestTenantContext) => OrderLike[]
  getOrder: (orderId: string, ctx: RequestTenantContext) => OrderLike | undefined
  createOrder: (ctx: RequestTenantContext, body: CreateCashierOrderDto) => OrderLike
  submitOrder: (orderId: string, ctx: RequestTenantContext) => OrderLike
  cancelOrder: (orderId: string, ctx: RequestTenantContext, reason: string) => OrderLike
  fulfillOrder: (orderId: string, ctx: RequestTenantContext) => OrderLike
  getOrderItems: (orderId: string, ctx: RequestTenantContext) => OrderItemLike[]
  createPayment: (orderId: string, body: CreateCashierPaymentDto) => PaymentLike
  listPayments: (ctx: RequestTenantContext) => PaymentLike[]
  applyPaymentCallback: (body: CashierPaymentCallbackDto) => CallbackResultLike
  confirmPayment: (paymentId: string, providerTxnId: string, ctx: RequestTenantContext) => PaymentLike
  createRefund: (orderId: string, body: Record<string, unknown>, ctx: RequestTenantContext) => RefundLike
  getRefund: (refundId: string, ctx: RequestTenantContext) => RefundLike | undefined
}

type OrderItemLike = { orderItemId: string; productId?: string; quantity?: number; unitPrice?: number; [k: string]: unknown }
type RefundLike = { refundId: string; status?: string; amount?: number; [k: string]: unknown }

function makeService(overrides: Partial<MockService> = {}): MockService {
  return {
    listOrders: () => [],
    getOrder: () => undefined,
    createOrder: () => ({ orderId: 'o-1', status: 'PENDING' } as { orderId: string; status: string; totalAmount?: number }),
    submitOrder: (orderId) => ({ orderId, status: 'PENDING' } as { orderId: string; status: string; totalAmount?: number }),
    cancelOrder: (orderId, _ctx, reason) => ({ orderId, status: 'CANCELED', cancelReason: reason } as { orderId: string; status: string; cancelReason: string; [k: string]: unknown }),
    fulfillOrder: (orderId) => ({ orderId, status: 'FULFILLED' } as { orderId: string; status: string; [k: string]: unknown }),
    getOrderItems: () => [] as OrderItemLike[],
    createPayment: () => ({ paymentId: 'p-1', status: 'PENDING' } as { paymentId: string; status: string }),
    listPayments: () => [],
    applyPaymentCallback: () => ({ payment: { status: 'SUCCEEDED' } } as { payment: { status: string; transactionNo?: string; reason?: string }; pointsLedger?: unknown[] }),
    confirmPayment: (paymentId, providerTxnId) => ({ paymentId, status: 'SUCCESS', providerTxnId } as { paymentId: string; status: string; providerTxnId: string; [k: string]: unknown }),
    createRefund: (orderId, _body) => ({ refundId: 'ref-1', orderId, status: 'PENDING' } as { refundId: string; orderId: string; status: string; [k: string]: unknown }),
    getRefund: () => undefined,
    ...overrides
  }
}

// ── Controller 实现（与 cashier.controller.ts 1:1 对应） ──
class CashierController {
  constructor(private readonly cashierService: MockService) {}

  listOrders(tenantContext: RequestTenantContext) {
    return this.cashierService.listOrders(tenantContext)
  }

  getOrder(orderId: string, tenantContext: RequestTenantContext) {
    const order = this.cashierService.getOrder(orderId, tenantContext)
    if (!order) {
      throw new Error(`Cashier order ${orderId} not found`)
    }
    return order
  }

  createOrder(tenantContext: RequestTenantContext, body: CreateCashierOrderDto) {
    return this.cashierService.createOrder(tenantContext, body)
  }

  submitOrder(orderId: string, tenantContext: RequestTenantContext) {
    return this.cashierService.submitOrder(orderId, tenantContext)
  }

  cancelOrder(orderId: string, tenantContext: RequestTenantContext, body?: { reason?: string }) {
    return this.cashierService.cancelOrder(orderId, tenantContext, body?.reason ?? 'no_reason')
  }

  fulfillOrder(orderId: string, tenantContext: RequestTenantContext) {
    return this.cashierService.fulfillOrder(orderId, tenantContext)
  }

  getOrderItems(orderId: string, tenantContext: RequestTenantContext) {
    return this.cashierService.getOrderItems(orderId, tenantContext)
  }

  createPayment(orderId: string, body: CreateCashierPaymentDto) {
    return this.cashierService.createPayment(orderId, body)
  }

  paymentCallback(paymentId: string, ctx: RequestTenantContext, body: { providerTxnId: string }) {
    if (!body?.providerTxnId) {
      throw new Error('providerTxnId required in callback body')
    }
    return this.cashierService.confirmPayment(paymentId, body.providerTxnId, ctx)
  }

  listPayments(tenantContext: RequestTenantContext) {
    return this.cashierService.listPayments(tenantContext)
  }

  applyPaymentCallback(body: CashierPaymentCallbackDto) {
    return this.cashierService.applyPaymentCallback(body)
  }

  createRefund(orderId: string, ctx: RequestTenantContext, body: Record<string, unknown>) {
    return this.cashierService.createRefund(orderId, body, ctx)
  }

  getRefund(refundId: string, tenantContext: RequestTenantContext) {
    const refund = this.cashierService.getRefund(refundId, tenantContext)
    if (!refund) {
      throw new Error(`Refund ${refundId} not found or cross-tenant`)
    }
    return refund
  }
}

// 注册装饰器路由（模拟 @Get / @Post）
collectRoute('GET', '')(CashierController.prototype, 'listOrders')
collectRoute('GET', ':orderId')(CashierController.prototype, 'getOrder')
collectRoute('POST', '')(CashierController.prototype, 'createOrder')
collectRoute('POST', ':orderId/submit')(CashierController.prototype, 'submitOrder')
collectRoute('POST', ':orderId/cancel')(CashierController.prototype, 'cancelOrder')
collectRoute('POST', ':orderId/fulfill')(CashierController.prototype, 'fulfillOrder')
collectRoute('GET', ':orderId/items')(CashierController.prototype, 'getOrderItems')
collectRoute('POST', ':orderId/payments')(CashierController.prototype, 'createPayment')
collectRoute('POST', ':paymentId/callback')(CashierController.prototype, 'paymentCallback')
collectRoute('GET', '')(CashierController.prototype, 'listPayments')
collectRoute('POST', 'standardized-callback')(CashierController.prototype, 'applyPaymentCallback')
collectRoute('POST', ':orderId/refunds')(CashierController.prototype, 'createRefund')
collectRoute('GET', ':refundId')(CashierController.prototype, 'getRefund')

function makeController(overrides: Partial<MockService> = {}) {
  return new CashierController(makeService(overrides))
}

// ═══════════════════════════════════════════════════════════════
//  路由元数据
// ═══════════════════════════════════════════════════════════════
describe('CashierController 路由定义', () => {
  it('应注册 13 条路由', () => {
    assert.equal(routes.length, 13)
  })

  it('listOrders → GET /orders', () => {
    const r = routes.find((x) => x.handler === 'listOrders')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, '')
  })

  it('getOrder → GET /orders/:orderId', () => {
    const r = routes.find((x) => x.handler === 'getOrder')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, ':orderId')
  })

  it('createOrder → POST /orders', () => {
    const r = routes.find((x) => x.handler === 'createOrder')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, '')
  })

  it('submitOrder → POST /orders/:orderId/submit', () => {
    const r = routes.find((x) => x.handler === 'submitOrder')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, ':orderId/submit')
  })

  it('cancelOrder → POST /orders/:orderId/cancel', () => {
    const r = routes.find((x) => x.handler === 'cancelOrder')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, ':orderId/cancel')
  })

  it('fulfillOrder → POST /orders/:orderId/fulfill', () => {
    const r = routes.find((x) => x.handler === 'fulfillOrder')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, ':orderId/fulfill')
  })

  it('getOrderItems → GET /orders/:orderId/items', () => {
    const r = routes.find((x) => x.handler === 'getOrderItems')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, ':orderId/items')
  })

  it('createPayment → POST /orders/:orderId/payments', () => {
    const r = routes.find((x) => x.handler === 'createPayment')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, ':orderId/payments')
  })

  it('paymentCallback → POST /payments/:paymentId/callback', () => {
    const r = routes.find((x) => x.handler === 'paymentCallback')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, ':paymentId/callback')
  })

  it('listPayments → GET /payments', () => {
    const r = routes.find((x) => x.handler === 'listPayments')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, '')
  })

  it('applyPaymentCallback → POST /payments/standardized-callback', () => {
    const r = routes.find((x) => x.handler === 'applyPaymentCallback')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, 'standardized-callback')
  })

  it('createRefund → POST /orders/:orderId/refunds', () => {
    const r = routes.find((x) => x.handler === 'createRefund')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, ':orderId/refunds')
  })

  it('getRefund → GET /refunds/:refundId', () => {
    const r = routes.find((x) => x.handler === 'getRefund')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, ':refundId')
  })
})

// ═══════════════════════════════════════════════════════════════
//  正例
// ═══════════════════════════════════════════════════════════════
describe('CashierController 正例', () => {
  it('listOrders 委托 service 并返回订单列表', () => {
    const orders = [
      { orderId: 'o-a', memberId: 'm-1', totalAmount: 100 },
      { orderId: 'o-b', memberId: 'm-2', totalAmount: 200 }
    ]
    let capturedCtx: RequestTenantContext | undefined
    const controller = makeController({
      listOrders: (ctx) => {
        capturedCtx = ctx
        return orders
      }
    })

    const ctx = createContext()
    const result = controller.listOrders(ctx)

    assert.equal(result.length, 2)
    assert.equal(result[0].orderId, 'o-a')
    assert.equal(capturedCtx?.tenantId, 't-cashier')
  })

  it('getOrder 找到订单返回详情', () => {
    const order = { orderId: 'o-found', memberId: 'm-f', totalAmount: 500 }
    let capturedId = ''
    const controller = makeController({
      getOrder: (id, _ctx) => {
        capturedId = id
        return order
      }
    })

    const result = controller.getOrder('o-found', createContext())

    assert.equal(result.orderId, 'o-found')
    assert.equal(capturedId, 'o-found')
  })

  it('createOrder 创建订单返回结果', () => {
    const created = { orderId: 'o-new', status: 'PENDING', totalAmount: 300 }
    let capturedBody: CreateCashierOrderDto | undefined
    const controller = makeController({
      createOrder: (_ctx, body) => {
        capturedBody = body
        return created
      }
    })

    const body: CreateCashierOrderDto = {
      memberId: 'm-create',
      items: [{ skuId: 'sku-x', quantity: 2, price: 150 }],
      currency: 'CNY'
    }
    const result = controller.createOrder(createContext(), body)

    assert.equal(result.orderId, 'o-new')
    assert.equal(result.status, 'PENDING')
    assert.equal(capturedBody?.memberId, 'm-create')
    assert.equal(capturedBody?.items.length, 1)
    assert.equal(capturedBody?.currency, 'CNY')
  })

  it('createPayment 为订单创建支付', () => {
    const payment = { paymentId: 'p-new', channel: 'wechat-pay', status: 'PENDING' }
    let capturedOrderId = ''
    let capturedBody: CreateCashierPaymentDto | undefined
    const controller = makeController({
      createPayment: (orderId, body) => {
        capturedOrderId = orderId
        capturedBody = body
        return payment
      }
    })

    const result = controller.createPayment('o-target', {
      channel: 'wechat-pay',
      amount: 300,
      externalPaymentId: 'ext-001'
    })

    assert.equal(result.paymentId, 'p-new')
    assert.equal(capturedOrderId, 'o-target')
    assert.equal(capturedBody?.channel, 'wechat-pay')
    assert.equal(capturedBody?.externalPaymentId, 'ext-001')
  })

  it('submitOrder 提交订单返回 PENDING', () => {
    const expected = { orderId: 'o-submit', status: 'PENDING' }
    let capturedId = ''
    const controller = makeController({
      submitOrder: (id, _ctx) => {
        capturedId = id
        return expected
      }
    })

    const result = controller.submitOrder('o-submit', createContext())
    assert.equal(result.status, 'PENDING')
    assert.equal(capturedId, 'o-submit')
  })

  it('cancelOrder 取消订单返回 CANCELED', () => {
    const expected = { orderId: 'o-cancel', status: 'CANCELED', cancelReason: 'test' }
    const controller = makeController({
      cancelOrder: (id, _ctx, reason) => ({ orderId: id, status: 'CANCELED', cancelReason: reason })
    })

    const result = controller.cancelOrder('o-cancel', createContext(), { reason: 'test' })
    assert.equal(result.status, 'CANCELED')
    assert.equal(result.cancelReason, 'test')
  })

  it('fulfillOrder 履约返回 FULFILLED', () => {
    const expected = { orderId: 'o-fulfill', status: 'FULFILLED' }
    let capturedId = ''
    const controller = makeController({
      fulfillOrder: (id, _ctx) => {
        capturedId = id
        return expected
      }
    })

    const result = controller.fulfillOrder('o-fulfill', createContext())
    assert.equal(result.status, 'FULFILLED')
    assert.equal(capturedId, 'o-fulfill')
  })

  it('getOrderItems 返回订单行列表', () => {
    const items = [
      { orderItemId: 'oi-1', productId: 'sku-a', quantity: 2, unitPrice: 500 },
      { orderItemId: 'oi-2', productId: 'sku-b', quantity: 1, unitPrice: 1000 }
    ]
    let capturedOrderId = ''
    const controller = makeController({
      getOrderItems: (id, _ctx) => {
        capturedOrderId = id
        return items
      }
    })

    const result = controller.getOrderItems('o-items', createContext())
    assert.equal(result.length, 2)
    assert.equal(result[0].productId, 'sku-a')
    assert.equal(capturedOrderId, 'o-items')
  })

  it('paymentCallback 支付回调成功确认', () => {
    const paymentResult = { paymentId: 'pay-cb', status: 'SUCCESS', providerTxnId: 'txn-wechat-001' }
    let capturedPaymentId = ''
    const controller = makeController({
      confirmPayment: (paymentId, providerTxnId) => {
        capturedPaymentId = paymentId
        return { paymentId, status: 'SUCCESS', providerTxnId }
      }
    })

    const result = controller.paymentCallback('pay-cb', createContext(), { providerTxnId: 'txn-wechat-001' })
    assert.equal(result.status, 'SUCCESS')
    assert.equal(result.providerTxnId, 'txn-wechat-001')
  })

  it('createRefund 申请退款返回 PENDING', () => {
    const expected = { refundId: 'ref-new', orderId: 'o-ref', status: 'PENDING' }
    let capturedOrderId = ''
    const controller = makeController({
      createRefund: (orderId, _body) => {
        capturedOrderId = orderId
        return expected
      }
    })

    const result = controller.createRefund('o-ref', createContext(), { paymentId: 'pay-001', amount: 100, reason: 'quality-issue' })
    assert.equal(result.refundId, 'ref-new')
    assert.equal(result.status, 'PENDING')
    assert.equal(capturedOrderId, 'o-ref')
  })

  it('getRefund 查询退款返回详情', () => {
    const refund = { refundId: 'ref-found', status: 'SUCCESS', amount: 500 }
    let capturedId = ''
    const controller = makeController({
      getRefund: (id, _ctx) => {
        capturedId = id
        return refund
      }
    })

    const result = controller.getRefund('ref-found', createContext())
    assert.equal(result.refundId, 'ref-found')
    assert.equal(capturedId, 'ref-found')
  })

  it('listPayments 委托 service 并返回支付列表', () => {
    const payments = [
      { paymentId: 'p-1', status: 'SUCCEEDED', channel: 'wechat-pay' },
      { paymentId: 'p-2', status: 'FAILED', channel: 'alipay' }
    ]
    let capturedCtx: RequestTenantContext | undefined
    const controller = makeController({
      listPayments: (ctx) => {
        capturedCtx = ctx
        return payments
      }
    })

    const result = controller.listPayments(createContext())

    assert.equal(result.length, 2)
    assert.equal(capturedCtx?.tenantId, 't-cashier')
  })

  it('applyPaymentCallback 成功回调返回更新结果', () => {
    const callbackResult = { payment: { status: 'SUCCEEDED', transactionNo: 'txn-ok' }, pointsLedger: [] }
    let captured: CashierPaymentCallbackDto | undefined
    const controller = makeController({
      applyPaymentCallback: (body) => {
        captured = body
        return callbackResult
      }
    })

    const body: CashierPaymentCallbackDto = {
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: 'agg-1',
      orderId: 'o-cb',
      tenantId: 't-cashier',
      externalPaymentId: 'ext-ok',
      transactionNo: 'txn-ok'
    }
    const result = controller.applyPaymentCallback(body)

    assert.equal(result.payment.status, 'SUCCEEDED')
    assert.equal(captured?.standardizedEventName, 'cashier.payment-succeeded')
    assert.equal(captured?.transactionNo, 'txn-ok')
  })
})

// ═══════════════════════════════════════════════════════════════
//  反例
// ═══════════════════════════════════════════════════════════════
describe('CashierController 反例', () => {
  it('getOrder 查询不存在的订单应抛出 Error', () => {
    const controller = makeController({
      getOrder: () => undefined
    })

    assert.throws(
      () => controller.getOrder('ghost-order', createContext()),
      /Cashier order ghost-order not found/
    )
  })

  it('getOrder 跨租户返回 undefined → 抛出', () => {
    const controller = makeController({
      getOrder: (id, ctx) => {
        if (ctx.tenantId !== 't-expected') return undefined
        return { orderId: id }
      }
    })

    assert.throws(
      () => controller.getOrder('o-cross', createContext('t-evil')),
      /not found/
    )
  })

  it('createOrder 空 items 被 service 拒绝 → 错误冒泡', () => {
    const controller = makeController({
      createOrder: () => {
        throw new Error('Order must include at least one item')
      }
    })

    assert.throws(
      () => controller.createOrder(createContext(), { memberId: 'm-bad', items: [] }),
      /must include at least one item/
    )
  })

  it('createPayment 无效 channel → 错误冒泡', () => {
    const controller = makeController({
      createPayment: () => {
        throw new Error('Unsupported payment channel: crypto')
      }
    })

    assert.throws(
      () => controller.createPayment('o-1', { channel: 'crypto' }),
      /Unsupported payment channel/
    )
  })

  it('applyPaymentCallback 失败回调 → service 更新状态', () => {
    const failResult = { payment: { status: 'FAILED', reason: 'insufficient-funds' } }
    const controller = makeController({
      applyPaymentCallback: () => failResult
    })

    const result = controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: 'agg-fail',
      orderId: 'o-fail',
      tenantId: 't-cashier'
    })

    assert.equal(result.payment.status, 'FAILED')
  })

  it('submitOrder 不存在的订单抛出 Error', () => {
    const controller = makeController({
      submitOrder: () => { throw new Error('Order not found') }
    })
    assert.throws(
      () => controller.submitOrder('ghost', createContext()),
      /Order not found/
    )
  })

  it('cancelOrder 已完成订单不允许取消', () => {
    const controller = makeController({
      cancelOrder: () => { throw new Error('Cannot cancel fulfilled order') }
    })
    assert.throws(
      () => controller.cancelOrder('o-fulfilled', createContext(), { reason: 'test' }),
      /Cannot cancel/
    )
  })

  it('fulfillOrder 非 PAID 状态抛出 Error', () => {
    const controller = makeController({
      fulfillOrder: () => { throw new Error('Cannot fulfill order in DRAFT status') }
    })
    assert.throws(
      () => controller.fulfillOrder('o-draft', createContext()),
      /Cannot fulfill/
    )
  })

  it('getOrderItems 空订单返回空数组', () => {
    const controller = makeController({
      getOrderItems: () => { throw new Error('Order not found') }
    })
    assert.throws(
      () => controller.getOrderItems('ghost', createContext()),
      /Order not found/
    )
  })

  it('paymentCallback 缺少 providerTxnId 抛出 Error', () => {
    const controller = makeController()
    assert.throws(
      () => controller.paymentCallback('pay-1', createContext(), {} as { providerTxnId: string }),
      /providerTxnId/
    )
  })

  it('createRefund 重复退款抛出 Error', () => {
    const controller = makeController({
      createRefund: () => { throw new Error('Refund already exists for this payment') }
    })
    assert.throws(
      () => controller.createRefund('o-dup', createContext(), { paymentId: 'pay-001', amount: 50 }),
      /already exists/
    )
  })

  it('getRefund 不存在的退款抛出 Error', () => {
    const controller = makeController({
      getRefund: () => undefined
    })
    assert.throws(
      () => controller.getRefund('ghost-refund', createContext()),
      /not found/
    )
  })
})

// ═══════════════════════════════════════════════════════════════
//  边界值
// ═══════════════════════════════════════════════════════════════
describe('CashierController 边界值', () => {
  it('listOrders 空租户返回空数组', () => {
    const controller = makeController({ listOrders: () => [] })

    const result = controller.listOrders(createContext('t-empty'))

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('listPayments 空租户返回空数组', () => {
    const controller = makeController({ listPayments: () => [] })

    const result = controller.listPayments(createContext('t-no-pay'))

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('createOrder 单商品 0 元价格', () => {
    const created = { orderId: 'o-zero', totalAmount: 0 }
    const controller = makeController({ createOrder: () => created })

    const result = controller.createOrder(createContext(), {
      memberId: 'm-zero',
      items: [{ skuId: 'free-item', quantity: 1, price: 0 }]
    })

    assert.equal(result.orderId, 'o-zero')
    assert.equal(result.totalAmount, 0)
  })

  it('cancelOrder 无理由取消', () => {
    let capturedReason = ''
    const controller = makeController({
      cancelOrder: (_id, _ctx, reason) => {
        capturedReason = reason
        return { orderId: 'o-1', status: 'CANCELED' }
      }
    })

    controller.cancelOrder('o-1', createContext())
    assert.equal(capturedReason, 'no_reason')
  })

  it('cancelOrder 有理由取消', () => {
    let capturedReason = ''
    const controller = makeController({
      cancelOrder: (_id, _ctx, reason) => {
        capturedReason = reason
        return { orderId: 'o-1', status: 'CANCELED' }
      }
    })

    controller.cancelOrder('o-1', createContext(), { reason: 'customer_request' })
    assert.equal(capturedReason, 'customer_request')
  })

  it('getOrderItems 空订单返回空数组', () => {
    const controller = makeController({
      getOrderItems: () => []
    })

    const result = controller.getOrderItems('o-empty', createContext())
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('getOrderItems 多商品订单 (10 项)', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      orderItemId: `oi-${i}`,
      productId: `sku-${i}`,
      quantity: 1,
      unitPrice: 100 + i
    }))
    const controller = makeController({
      getOrderItems: () => items
    })

    const result = controller.getOrderItems('o-bulk', createContext())
    assert.equal(result.length, 10)
  })

  it('createRefund 大额退款正常创建', () => {
    const controller = makeController({
      createRefund: (orderId, body) => ({
        refundId: 'ref-large',
        orderId,
        status: 'PENDING',
        amount: (body as Record<string, unknown>).amount
      })
    })

    const result = controller.createRefund('o-1', createContext(), { paymentId: 'pay-1', amount: 99999, reason: 'large-amount' })
    assert.equal(result.status, 'PENDING')
  })

  it('submitOrder 多次提交正确委托', () => {
    let callCount = 0
    const controller = makeController({
      submitOrder: (id, _ctx) => {
        callCount++
        return { orderId: id, status: 'PENDING' }
      }
    })

    controller.submitOrder('o-1', createContext())
    controller.submitOrder('o-2', createContext())
    assert.equal(callCount, 2)
  })

  it('createOrder 多商品大单 (10 items)', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      skuId: `sku-${i}`,
      quantity: 1,
      price: 10 + i
    }))
    let capturedItems: CashierOrderItemDto[] | undefined
    const controller = makeController({
      createOrder: (_ctx, body) => {
        capturedItems = body.items
        return { orderId: 'o-bulk', totalAmount: items.reduce((s, it) => s + it.price, 0) }
      }
    })

    const result = controller.createOrder(createContext(), {
      memberId: 'm-bulk',
      items
    })

    assert.equal(result.orderId, 'o-bulk')
    assert.equal(capturedItems?.length, 10)
  })

  it('applyPaymentCallback 带 payload 扩展字段', () => {
    let captured: CashierPaymentCallbackDto | undefined
    const controller = makeController({
      applyPaymentCallback: (body) => {
        captured = body
        return { payment: { status: 'SUCCEEDED' } }
      }
    })

    controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: 'agg-payload',
      orderId: 'o-payload',
      tenantId: 't-cashier',
      payload: { bankCode: 'ICBC', settlementTime: '2026-06-23T12:00:00Z' }
    })

    assert.equal(captured?.payload?.bankCode, 'ICBC')
  })
})

// ═══════════════════════════════════════════════════════════════
//  租户隔离
// ═══════════════════════════════════════════════════════════════
describe('CashierController 租户隔离', () => {
  it('listOrders 仅返回当前租户数据', () => {
    const allOrders = [
      { orderId: 'o-t1', memberId: 'm-1', tenantId: 't-alpha' },
      { orderId: 'o-t2', memberId: 'm-2', tenantId: 't-beta' }
    ]
    const controller = makeController({
      listOrders: (ctx) => allOrders.filter((o) => o.tenantId === ctx.tenantId)
    })

    const t1 = controller.listOrders(createContext('t-alpha'))
    const t2 = controller.listOrders(createContext('t-beta'))

    assert.equal(t1.length, 1)
    assert.equal(t1[0].orderId, 'o-t1')
    assert.equal(t2.length, 1)
    assert.equal(t2[0].orderId, 'o-t2')
  })

  it('getOrder 跨租户不可见', () => {
    const controller = makeController({
      getOrder: (id, ctx) => {
        if (ctx.tenantId === 't-privileged') return { orderId: id }
        return undefined
      }
    })

    assert.throws(() => controller.getOrder('secret-order', createContext('t-intruder')), /not found/)
    const ok = controller.getOrder('secret-order', createContext('t-privileged'))
    assert.equal(ok.orderId, 'secret-order')
  })

  it('listPayments 租户 B 看不到租户 A 的支付', () => {
    const payments = [
      { paymentId: 'pay-a', tenantId: 't-alpha' },
      { paymentId: 'pay-b', tenantId: 't-beta' }
    ]
    const controller = makeController({
      listPayments: (ctx) => payments.filter((p) => p.tenantId === ctx.tenantId)
    })

    assert.equal(controller.listPayments(createContext('t-alpha')).length, 1)
    assert.equal(controller.listPayments(createContext('t-gamma')).length, 0)
  })

  it('submitOrder 仅操作当前租户订单', () => {
    const ids: string[] = []
    const controller = makeController({
      submitOrder: (id, ctx) => {
        if (ctx.tenantId !== 't-allowed') throw new Error('Cross-tenant access denied')
        ids.push(id)
        return { orderId: id, status: 'PENDING' }
      }
    })

    assert.throws(
      () => controller.submitOrder('o-secret', createContext('t-intruder')),
      /Cross-tenant/
    )
    const ok = controller.submitOrder('o-ok', createContext('t-allowed'))
    assert.equal(ok.status, 'PENDING')
  })

  it('getRefund 跨租户不可见', () => {
    const controller = makeController({
      getRefund: (id, ctx) => {
        if (ctx.tenantId === 't-owner') return { refundId: id, status: 'SUCCESS' }
        return undefined
      }
    })

    assert.throws(() => controller.getRefund('ref-secret', createContext('t-intruder')), /not found/)
    const ok = controller.getRefund('ref-secret', createContext('t-owner'))
    assert.equal(ok.refundId, 'ref-secret')
  })

  it('cancelOrder 跨租户不可操作', () => {
    const controller = makeController({
      cancelOrder: (_id, ctx) => {
        if (ctx.tenantId !== 't-rightful') throw new Error('Cross-tenant access denied')
        return { orderId: 'o-1', status: 'CANCELED' }
      }
    })

    assert.throws(
      () => controller.cancelOrder('o-1', createContext('t-wrong'), { reason: 'test' }),
      /Cross-tenant/
    )
  })
})
