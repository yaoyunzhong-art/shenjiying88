import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type { Order, Payment, Refund, CreateOrderInput, CreatePaymentInput, CreateRefundInput, OrderItem } from '@m5/types'
import { CashierController } from './cashier.controller'
import { CashierService } from './cashier.service'
import { MemberService } from '../member/member.service'
import { InventoryItemService } from '../inventory/inventory-item.service'
// ── Mock services (lean interface matching real usage) ──
interface MockOrderService {
  create: (input: CreateOrderInput, context: Record<string, string>) => Order
  submit: (id: string, tenantId: string) => Order
  cancel: (id: string, tenantId: string, reason: string) => Order
  fulfill: (id: string, tenantId: string) => Order
  getById: (id: string, tenantId: string) => Order | undefined
  getItems: (id: string, tenantId: string) => OrderItem[]
  list: (filter: Record<string, unknown>, tenantId: string) => { items: Order[]; total: number }
}
interface MockPaymentService {
  create: (input: CreatePaymentInput, context: Record<string, string>) => Payment
  confirm: (providerTxnId: string, tenantId: string) => Payment
}
interface MockRefundService {
  create: (input: CreateRefundInput, context: Record<string, string>) => Refund
  getById: (id: string, tenantId: string) => Refund | undefined
}
function makeBaseOrder(): Order {
  return {
    id: 'ORD-20260627-00001', tenantId: '', memberId: null,
    status: 'DRAFT', subtotalCents: 0, discountCents: 0, taxCents: 0,
    totalCents: 0, paidCents: 0, refundedCents: 0,
    paymentMethod: null, createdBy: '', clientOrderId: '',
    version: 1, metadata: {},
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    paidAt: null, closedAt: null
  }
}
function makeMockOrderService(overrides?: Partial<MockOrderService>): MockOrderService {
  return {
    create: (input, context) => ({
      ...makeBaseOrder(),
      id: 'ORD-20260627-00001',
      status: 'DRAFT',
      clientOrderId: input.clientOrderId,
      memberId: input.memberId ?? null,
      tenantId: context.tenantId
    }),
    submit: (id, _tenantId) => ({ ...makeBaseOrder(), id, status: 'PENDING' as const, tenantId: _tenantId }),
    cancel: (id, _tenantId, reason) => ({ ...makeBaseOrder(), id, status: 'CANCELED' as const, closedAt: new Date().toISOString() }),
    fulfill: (id, _tenantId) => ({ ...makeBaseOrder(), id, status: 'FULFILLED' as const }),
    getById: (id, _tenantId) => ({ ...makeBaseOrder(), id, status: 'PENDING' as const, tenantId: _tenantId }),
    getItems: (_id, _tenantId) => ([{
      id: 'OIT-001', orderId: _id, tenantId: _tenantId, productId: 'sku-1',
      productName: 'Product 1', unitPriceCents: 500, quantity: 2,
      subtotalCents: 1000, discountCents: 0, createdAt: new Date().toISOString()
    }]),
    list: (_filter, _tenantId) => ({ items: [], total: 0 }),
    ...overrides
  }
}
function makeBasePayment(): Payment {
  return {
    id: 'PAY-20260627-00001', tenantId: '', orderId: '',
    method: 'WECHAT', amountCents: 0, status: 'PENDING',
    providerTxnId: null, idempotencyKey: '',
    paidAt: null, failureReason: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
}
function makeMockPaymentService(overrides?: Partial<MockPaymentService>): MockPaymentService {
  return {
    create: (input, context) => ({
      ...makeBasePayment(),
      id: 'PAY-20260627-00001',
      status: 'PENDING',
      orderId: input.orderId,
      method: input.method,
      amountCents: input.amountCents,
      idempotencyKey: `${input.orderId}-${input.method}`
    }),
    confirm: (providerTxnId, _tenantId) => ({ ...makeBasePayment(), id: 'PAY-20260627-00001', status: 'SUCCESS' as const, providerTxnId }),
    ...overrides
  }
}
function makeBaseRefund(): Refund {
  return {
    id: 'RFD-20260627-00001', tenantId: '', orderId: '', paymentId: '',
    amountCents: 0, reason: '', reasonHash: '', status: 'PENDING',
    providerRefundId: null, idempotencyKey: '',
    refundedAt: null, failureReason: null, createdBy: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
}
function makeMockRefundService(overrides?: Partial<MockRefundService>): MockRefundService {
  return {
    create: (input, context) => ({
      ...makeBaseRefund(),
      id: 'RFD-20260627-00001',
      status: 'PENDING',
      orderId: input.orderId,
      paymentId: input.paymentId,
      amountCents: input.amountCents,
      reason: input.reason
    }),
    getById: (id, _tenantId) => ({ ...makeBaseRefund(), id, status: 'PENDING' as const }),
    ...overrides
  }
}
function makeController(
  orderOverrides?: Partial<MockOrderService>,
  paymentOverrides?: Partial<MockPaymentService>,
  refundOverrides?: Partial<MockRefundService>
): CashierController {
  const memberService = new MemberService()
  const inventoryItemService = new InventoryItemService()
  const cashierService = new CashierService(memberService)
  return new CashierController(
    makeMockOrderService(orderOverrides) as never,
    makeMockPaymentService(paymentOverrides) as never,
    makeMockRefundService(refundOverrides) as never,
    cashierService,
    inventoryItemService
  )
}
const HEADERS = {
  'x-tenant-id': 't-cashier-001',
  'x-user-id': 'user-cashier-001'
}
// ═══════════════════════════════════════════════════════════════
//  路由元数据 (Reflect 反射验证 NestJS 装饰器)
// ═══════════════════════════════════════════════════════════════
describe('CashierController 路由元数据', () => {
  it('controller path 应为 cashier', () => {
    const path = Reflect.getMetadata('path', CashierController)
    assert.equal(path, 'cashier')
  })
  it('controller 应应用 TenantGuard', () => {
    const guards = Reflect.getMetadata('__guards__', CashierController) as (Function | undefined)[]
    assert.ok(guards)
    assert.equal(guards.length, 1)
  })
  const routeTests: { method: string; path: string; handler: string; expectedMethod: number }[] = [
    { method: 'POST',  path: 'orders',          handler: 'createOrder',   expectedMethod: 1  },
    { method: 'POST',  path: 'orders/:id/submit',  handler: 'submitOrder',   expectedMethod: 1 },
    { method: 'POST',  path: 'orders/:id/cancel',  handler: 'cancelOrder',   expectedMethod: 1 },
    { method: 'POST',  path: 'orders/:id/fulfill', handler: 'fulfillOrder',  expectedMethod: 1 },
    { method: 'GET',   path: 'orders/:id',      handler: 'getOrder',      expectedMethod: 0  },
    { method: 'GET',   path: 'orders/:id/items', handler: 'getOrderItems', expectedMethod: 0  },
    { method: 'GET',   path: 'orders',          handler: 'listOrders',    expectedMethod: 0  },
    { method: 'POST',  path: 'orders/:id/payments', handler: 'createPayment', expectedMethod: 1 },
    { method: 'POST',  path: 'payments/:id/callback', handler: 'paymentCallback', expectedMethod: 1 },
    { method: 'POST',  path: 'orders/:id/refunds', handler: 'createRefund', expectedMethod: 1 },
    { method: 'GET',   path: 'refunds/:id',     handler: 'getRefund',     expectedMethod: 0  },
  ]
  for (const { method, path, handler, expectedMethod } of routeTests) {
    it(`${method} ${path} → ${handler}`, () => {
      const actualMethod = Reflect.getMetadata('method', CashierController.prototype[handler as keyof CashierController])
      const actualPath = Reflect.getMetadata('path', CashierController.prototype[handler as keyof CashierController])
      assert.equal(actualMethod, expectedMethod, `HTTP method mismatch for ${handler}`)
      assert.equal(actualPath, path, `Path mismatch for ${handler}`)
    })
  }
})
// ═══════════════════════════════════════════════════════════════
//  正例 — 正常流程
// ═══════════════════════════════════════════════════════════════
describe('CashierController 正例', () => {
  it('createOrder — 创建成功返回 order', () => {
    const ctrl = makeController()
    const order = ctrl.createOrder(
      HEADERS['x-tenant-id'],
      HEADERS['x-user-id'],
      { clientOrderId: 'cl-001', memberId: 'mem-001', items: [{ productId: 'sku-a', quantity: 1, unitPriceCents: 100 }] }
    )
    assert.equal(order.id, 'ORD-20260627-00001')
    assert.equal(order.status, 'DRAFT')
  })
  it('submitOrder — 提交草稿返回 PENDING', () => {
    const ctrl = makeController()
    const order = ctrl.submitOrder(HEADERS['x-tenant-id'], 'ord-1')
    assert.equal(order.status, 'PENDING')
  })
  it('cancelOrder — 取消订单返回 CANCELED', () => {
    const ctrl = makeController()
    const order = ctrl.cancelOrder(HEADERS['x-tenant-id'], 'ord-1', { reason: 'customer-request' })
    assert.equal(order.status, 'CANCELED')
  })
  it('fulfillOrder — 履约返回 FULFILLED', () => {
    const ctrl = makeController()
    const order = ctrl.fulfillOrder(HEADERS['x-tenant-id'], 'ord-1')
    assert.equal(order.status, 'FULFILLED')
  })
  it('getOrder — 查询已存在的订单返回详情', () => {
    const ctrl = makeController()
    const order = ctrl.getOrder(HEADERS['x-tenant-id'], 'ord-existing')
    assert.equal(order.id, 'ord-existing')
  })
  it('getOrderItems — 返回订单行列表', () => {
    const ctrl = makeController()
    const items = ctrl.getOrderItems(HEADERS['x-tenant-id'], 'ord-1')
    assert.ok(Array.isArray(items))
    assert.equal(items[0].productId, 'sku-1')
  })
  it('listOrders — 返回分页列表', () => {
    const ctrl = makeController()
    const result = ctrl.listOrders(HEADERS['x-tenant-id'])
    assert.ok(result)
    assert.ok(Array.isArray(result.items))
  })
  it('createPayment — 发起支付返回 PENDING', async () => {
    const ctrl = makeController()
    const payment = await ctrl.createPayment(
      HEADERS['x-tenant-id'],
      HEADERS['x-user-id'],
      'ord-pay',
      { method: 'WECHAT', amountCents: 100 }
    )
    assert.equal(payment.status, 'PENDING')
  })
  it('paymentCallback — 支付回调成功确认', () => {
    const ctrl = makeController()
    const payment = ctrl.paymentCallback(
      HEADERS['x-tenant-id'],
      'pay-001',
      { providerTxnId: 'txn-wechat-001' }
    )
    assert.equal(payment.status, 'SUCCESS')
  })
  it('createRefund — 申请退款返回 PENDING', () => {
    const ctrl = makeController()
    const refund = ctrl.createRefund(
      HEADERS['x-tenant-id'],
      HEADERS['x-user-id'],
      'ord-refund',
      { paymentId: 'pay-001', amountCents: 100, reason: 'quality-issue' }
    )
    assert.equal(refund.status, 'PENDING')
  })
  it('getRefund — 查询退款详情', () => {
    const ctrl = makeController()
    const refund = ctrl.getRefund(HEADERS['x-tenant-id'], 'ref-1')
    assert.equal(refund.id, 'ref-1')
  })
})
// ═══════════════════════════════════════════════════════════════
//  反例 — 异常输入
// ═══════════════════════════════════════════════════════════════
describe('CashierController 反例', () => {
  it('createOrder — 缺少 userId 抛出 BadRequestException', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.createOrder('t-1', '', { clientOrderId: 'idemp-1', memberId: 'm-1', items: [] }),
      /x-user-id/
    )
  })
  it('createPayment — 缺少 userId 抛出 BadRequestException', async () => {
    const ctrl = makeController()
    await assert.rejects(
      ctrl.createPayment('t-1', '', 'ord-1', { method: 'WECHAT', amountCents: 100 }),
      /x-user-id/
    )
  })
  it('createRefund — 缺少 userId 抛出 BadRequestException', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.createRefund('t-1', '', 'ord-1', { paymentId: 'pay-001', amountCents: 50, reason: 'defect' }),
      /x-user-id/
    )
  })
  it('getOrder — 不存在的订单抛出 NotFoundException', () => {
    const ctrl = makeController({ getById: () => undefined as unknown as Order })
    assert.throws(
      () => ctrl.getOrder(HEADERS['x-tenant-id'], 'nonexistent'),
      /not found/
    )
  })
  it('getRefund — 不存在的退款抛出 NotFoundException', () => {
    const ctrl = makeController(undefined, undefined, { getById: () => undefined as unknown as Refund })
    assert.throws(
      () => ctrl.getRefund(HEADERS['x-tenant-id'], 'ghost-refund'),
      /not found/
    )
  })
  it('paymentCallback — 缺少 providerTxnId 抛出 BadRequestException', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.paymentCallback(HEADERS['x-tenant-id'], 'pay-1', {} as { providerTxnId: string }),
      /providerTxnId/
    )
  })
  it('cancelOrder — service 抛出异常冒泡', () => {
    const ctrl = makeController(({
      cancel: () => { throw new Error('Order already fulfilled') }
    }) as unknown as Partial<MockOrderService>)
    assert.throws(
      () => ctrl.cancelOrder(HEADERS['x-tenant-id'], 'ord-fulfilled', { reason: 'test' }),
      /Order already fulfilled/
    )
  })
  it('submitOrder — 非法状态抛出 BadRequest', () => {
    const ctrl = makeController(({
      submit: () => { throw new Error('Cannot submit order in CANCELLED status') }
    }) as unknown as Partial<MockOrderService>)
    assert.throws(
      () => ctrl.submitOrder(HEADERS['x-tenant-id'], 'ord-cancelled'),
      /Cannot submit/
    )
  })
})
// ═══════════════════════════════════════════════════════════════
//  边界值
// ═══════════════════════════════════════════════════════════════
describe('CashierController 边界值', () => {
  it('listOrders — 空 tenant 返回空列表', () => {
    const ctrl = makeController({
      list: () => ({ items: [], total: 0 })
    })
    const result = ctrl.listOrders('t-empty')
    assert.equal(result.total, 0)
    assert.equal(result.items.length, 0)
  })
  it('getOrderItems — 空订单返回 []', () => {
    const ctrl = makeController({
      getItems: () => []
    })
    const items = ctrl.getOrderItems(HEADERS['x-tenant-id'], 'ord-empty')
    assert.ok(Array.isArray(items))
    assert.equal(items.length, 0)
  })
  it('createOrder — 多商品批量 100 项', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ productId: `batch-${i}`, quantity: 1, unitPriceCents: 10 }))
    const ctrl = makeController()
    const order = ctrl.createOrder(HEADERS['x-tenant-id'], HEADERS['x-user-id'], {
      clientOrderId: 'cl-batch',
      memberId: 'mem-batch',
      items
    })
    assert.ok(order.id)
    assert.equal(order.status, 'DRAFT')
  })
  it('cancelOrder — 无理由取消 (空 body)', () => {
    const ctrl = makeController()
    const order = ctrl.cancelOrder(HEADERS['x-tenant-id'], 'ord-1', {})
    assert.equal(order.status, 'CANCELED')
  })
  it('createPayment — 设置 method 和金额', async () => {
    const ctrl = makeController()
    const payment = await ctrl.createPayment(
      HEADERS['x-tenant-id'],
      HEADERS['x-user-id'],
      'ord-1',
      { method: 'ALIPAY', amountCents: 5000 }
    )
    assert.equal(payment.status, 'PENDING')
    assert.equal(payment.method, 'ALIPAY')
  })
  it('createRefund — 大额退款正常创建', () => {
    const ctrl = makeController()
    const refund = ctrl.createRefund(
      HEADERS['x-tenant-id'],
      HEADERS['x-user-id'],
      'ord-1',
      { paymentId: 'pay-001', amountCents: 999999, reason: 'large-amount-test' }
    )
    assert.equal(refund.status, 'PENDING')
  })
  it('listOrders — 带分页参数', () => {
    const ctrl = makeController({
      list: (filter) => {
        const f = filter as Record<string, unknown>
        assert.equal(f.page, 2)
        assert.equal(f.pageSize, 50)
        return { items: [], total: 100 }
      }
    })
    const result = ctrl.listOrders(HEADERS['x-tenant-id'], 'PAID', undefined, undefined, undefined, '2', '50')
    assert.equal((result as Record<string, unknown>).total, 100)
  })
})
// ═══════════════════════════════════════════════════════════════
//  租户隔离
// ═══════════════════════════════════════════════════════════════
describe('CashierController 租户隔离', () => {
  it('createOrder — tenantId 透传至 service', () => {
    let capturedTenantId = ''
    const ctrl = makeController({
      create: (_input, context) => {
        capturedTenantId = context.tenantId
        return makeBaseOrder()
      }
    })
    ctrl.createOrder('t-alpha', 'user-1', { clientOrderId: 'cl-001', memberId: 'm-1', items: [{ productId: 's1', quantity: 1, unitPriceCents: 10 }] })
    assert.equal(capturedTenantId, 't-alpha')
  })
  it('getOrder — 不同 tenant 返回 NotFoundException', () => {
    const ctrl = makeController({
      getById: (id, tenantId) => {
        if (tenantId !== 't-owner') return undefined as unknown as Order
        return { ...makeBaseOrder(), id }
      }
    })
    ctrl.getOrder('t-owner', 'ord-own-able') // should work
    assert.throws(
      () => ctrl.getOrder('t-intruder', 'ord-own-able'),
      /not found/
    )
  })
  it('getRefund — 不同 tenant 返回 NotFoundException', () => {
    const ctrl = makeController(undefined, undefined, {
      getById: (id, tenantId) => {
        if (tenantId !== 't-legit') return undefined as unknown as Refund
        return { ...makeBaseRefund(), id }
      }
    })
    ctrl.getRefund('t-legit', 'ref-legit') // works
    assert.throws(
      () => ctrl.getRefund('t-other', 'ref-legit'),
      /not found/
    )
  })
})
