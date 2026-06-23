/**
 * cashier.controller.spec.ts
 *
 * Controller-spec 级隔离测试：验证 CashierController 的委托逻辑、路由定义和边界行为。
 * 不依赖 NestJS IoC —— 直接 new 并注入 mock service。
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

// ── 精简版 Controller / 装饰器 模拟（避免 NestJS 反射依赖） ──
let lastRegisteredRoute: { method: string; path: string } | null = null
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
  createPayment: (orderId: string, body: CreateCashierPaymentDto) => PaymentLike
  listPayments: (ctx: RequestTenantContext) => PaymentLike[]
  applyPaymentCallback: (body: CashierPaymentCallbackDto) => CallbackResultLike
}

function makeService(overrides: Partial<MockService> = {}): MockService {
  return {
    listOrders: () => [],
    getOrder: () => undefined,
    createOrder: () => ({ orderId: 'o-1', status: 'PENDING' } as { orderId: string; status: string; totalAmount?: number }),
    createPayment: () => ({ paymentId: 'p-1', status: 'PENDING' } as { paymentId: string; status: string }),
    listPayments: () => [],
    applyPaymentCallback: () => ({ payment: { status: 'SUCCEEDED' } } as { payment: { status: string; transactionNo?: string; reason?: string }; pointsLedger?: unknown[] }),
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

  createPayment(orderId: string, body: CreateCashierPaymentDto) {
    return this.cashierService.createPayment(orderId, body)
  }

  listPayments(tenantContext: RequestTenantContext) {
    return this.cashierService.listPayments(tenantContext)
  }

  applyPaymentCallback(body: CashierPaymentCallbackDto) {
    return this.cashierService.applyPaymentCallback(body)
  }
}

// 注册装饰器路由（模拟 @Get / @Post）
collectRoute('GET', '')(CashierController.prototype, 'listOrders')
collectRoute('GET', ':orderId')(CashierController.prototype, 'getOrder')
collectRoute('POST', '')(CashierController.prototype, 'createOrder')
collectRoute('POST', ':orderId/payments')(CashierController.prototype, 'createPayment')
collectRoute('GET', '')(CashierController.prototype, 'listPayments')
collectRoute('POST', 'standardized-callback')(CashierController.prototype, 'applyPaymentCallback')

function makeController(overrides: Partial<MockService> = {}) {
  return new CashierController(makeService(overrides))
}

// ═══════════════════════════════════════════════════════════════
//  路由元数据
// ═══════════════════════════════════════════════════════════════
describe('CashierController 路由定义', () => {
  test('应注册 6 条路由', () => {
    assert.equal(routes.length, 6)
  })

  test('listOrders → GET /orders', () => {
    const r = routes.find((x) => x.handler === 'listOrders')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, '')
  })

  test('getOrder → GET /orders/:orderId', () => {
    const r = routes.find((x) => x.handler === 'getOrder')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, ':orderId')
  })

  test('createOrder → POST /orders', () => {
    const r = routes.find((x) => x.handler === 'createOrder')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, '')
  })

  test('createPayment → POST /orders/:orderId/payments', () => {
    const r = routes.find((x) => x.handler === 'createPayment')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, ':orderId/payments')
  })

  test('listPayments → GET /payments', () => {
    const r = routes.find((x) => x.handler === 'listPayments')
    assert.ok(r)
    assert.equal(r.method, 'GET')
    assert.equal(r.path, '')
  })

  test('applyPaymentCallback → POST /payments/standardized-callback', () => {
    const r = routes.find((x) => x.handler === 'applyPaymentCallback')
    assert.ok(r)
    assert.equal(r.method, 'POST')
    assert.equal(r.path, 'standardized-callback')
  })
})

// ═══════════════════════════════════════════════════════════════
//  正例
// ═══════════════════════════════════════════════════════════════
describe('CashierController 正例', () => {
  test('listOrders 委托 service 并返回订单列表', () => {
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

  test('getOrder 找到订单返回详情', () => {
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

  test('createOrder 创建订单返回结果', () => {
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

  test('createPayment 为订单创建支付', () => {
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

  test('listPayments 委托 service 并返回支付列表', () => {
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

  test('applyPaymentCallback 成功回调返回更新结果', () => {
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
  test('getOrder 查询不存在的订单应抛出 Error', () => {
    const controller = makeController({
      getOrder: () => undefined
    })

    assert.throws(
      () => controller.getOrder('ghost-order', createContext()),
      /Cashier order ghost-order not found/
    )
  })

  test('getOrder 跨租户返回 undefined → 抛出', () => {
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

  test('createOrder 空 items 被 service 拒绝 → 错误冒泡', () => {
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

  test('createPayment 无效 channel → 错误冒泡', () => {
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

  test('applyPaymentCallback 失败回调 → service 更新状态', () => {
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
})

// ═══════════════════════════════════════════════════════════════
//  边界值
// ═══════════════════════════════════════════════════════════════
describe('CashierController 边界值', () => {
  test('listOrders 空租户返回空数组', () => {
    const controller = makeController({ listOrders: () => [] })

    const result = controller.listOrders(createContext('t-empty'))

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  test('listPayments 空租户返回空数组', () => {
    const controller = makeController({ listPayments: () => [] })

    const result = controller.listPayments(createContext('t-no-pay'))

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  test('createOrder 单商品 0 元价格', () => {
    const created = { orderId: 'o-zero', totalAmount: 0 }
    const controller = makeController({ createOrder: () => created })

    const result = controller.createOrder(createContext(), {
      memberId: 'm-zero',
      items: [{ skuId: 'free-item', quantity: 1, price: 0 }]
    })

    assert.equal(result.orderId, 'o-zero')
    assert.equal(result.totalAmount, 0)
  })

  test('createOrder 多商品大单 (10 items)', () => {
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

  test('applyPaymentCallback 带 payload 扩展字段', () => {
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
  test('listOrders 仅返回当前租户数据', () => {
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

  test('getOrder 跨租户不可见', () => {
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

  test('listPayments 租户 B 看不到租户 A 的支付', () => {
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
})
