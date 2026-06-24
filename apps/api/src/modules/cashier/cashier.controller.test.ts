import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

// 用 require 动态加载绕过 esbuild decorator 限制
const { CashierController } = require('./cashier.controller')
const { CashierOrderStatus, CashierPaymentStatus } = require('./cashier.entity')

// ── 辅助工厂 ──
function createContext(tenantId = 'tenant-cashier', brandId = 'brand-cashier') {
  return { tenantId, brandId }
}

 
type AnyFn = (...args: any[]) => any
interface MockServiceOverrides {
  listOrders?: AnyFn
  getOrder?: AnyFn
  createOrder?: AnyFn
  createPayment?: AnyFn
  listPayments?: AnyFn
  applyPaymentCallback?: AnyFn
}

function makeController(overrides: MockServiceOverrides = {}) {
  const service = {
    listOrders: overrides.listOrders ?? (() => []),
    getOrder: overrides.getOrder ?? (() => undefined),
    createOrder: overrides.createOrder ?? (async () => ({})),
    createPayment: overrides.createPayment ?? (async () => ({})),
    listPayments: overrides.listPayments ?? (() => []),
    applyPaymentCallback:
      overrides.applyPaymentCallback ??
      (async () => ({ order: {}, payment: {} }))
  }
  return new CashierController(service as any)
}

// ── 路由元数据 ──
describe('CashierController 路由元数据', () => {
  test('controller metadata path is cashier', () => {
    const path = Reflect.getMetadata('path', CashierController)
    assert.equal(path, 'cashier')
  })

  test('listOrders GET orders', () => {
    const method = Reflect.getMetadata('method', CashierController.prototype.listOrders)
    const path = Reflect.getMetadata('path', CashierController.prototype.listOrders)
    assert.equal(method, 0)
    assert.equal(path, 'orders')
  })

  test('getOrder GET orders/:orderId', () => {
    const method = Reflect.getMetadata('method', CashierController.prototype.getOrder)
    const path = Reflect.getMetadata('path', CashierController.prototype.getOrder)
    assert.equal(method, 0)
    assert.equal(path, 'orders/:orderId')
  })

  test('createOrder POST orders', () => {
    const method = Reflect.getMetadata('method', CashierController.prototype.createOrder)
    const path = Reflect.getMetadata('path', CashierController.prototype.createOrder)
    assert.equal(method, 1)
    assert.equal(path, 'orders')
  })

  test('createPayment POST orders/:orderId/payments', () => {
    const method = Reflect.getMetadata('method', CashierController.prototype.createPayment)
    const path = Reflect.getMetadata('path', CashierController.prototype.createPayment)
    assert.equal(method, 1)
    assert.equal(path, 'orders/:orderId/payments')
  })

  test('listPayments GET payments', () => {
    const method = Reflect.getMetadata('method', CashierController.prototype.listPayments)
    const path = Reflect.getMetadata('path', CashierController.prototype.listPayments)
    assert.equal(method, 0)
    assert.equal(path, 'payments')
  })

  test('applyPaymentCallback POST payments/standardized-callback', () => {
    const method = Reflect.getMetadata('method', CashierController.prototype.applyPaymentCallback)
    const path = Reflect.getMetadata('path', CashierController.prototype.applyPaymentCallback)
    assert.equal(method, 1)
    assert.equal(path, 'payments/standardized-callback')
  })
})

// ── 正例测试 ──
describe('CashierController 正例', () => {
  test('createOrder 委托 service 并返回订单', async () => {
    const orderId = 'order-1'
    const controller = makeController({
      createOrder: async () => ({
        orderId,
        memberId: 'm-01',
        items: [{ skuId: 'sku-1', title: '台球', quantity: 1, price: 50 }],
        totalAmount: 50,
        currency: 'CNY',
        status: CashierOrderStatus.Created,
        tenantContext: createContext(),
        source: 'memory'
      })
    })

    const result = await controller.createOrder(createContext(), {
      memberId: 'm-01',
      items: [{ skuId: 'sku-1', title: '台球', quantity: 1, price: 50 }]
    })

    assert.equal(result.orderId, orderId)
    assert.equal(result.memberId, 'm-01')
    assert.equal(result.status, CashierOrderStatus.Created)
    assert.equal(result.totalAmount, 50)
    assert.equal(result.currency, 'CNY')
    assert.equal(result.items.length, 1)
  })

  test('listOrders 委托 service 返回订单列表', () => {
    const mockOrders = [
      {
        orderId: 'o-1',
        memberId: 'm-01',
        items: [],
        totalAmount: 0,
        currency: 'CNY',
        status: CashierOrderStatus.Created,
        tenantContext: createContext(),
        source: 'memory',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        orderId: 'o-2',
        memberId: 'm-02',
        items: [],
        totalAmount: 100,
        currency: 'CNY',
        status: CashierOrderStatus.Paid,
        tenantContext: createContext(),
        source: 'memory',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    const controller = makeController({ listOrders: () => mockOrders })

    const result = controller.listOrders(createContext())

    assert.equal(result.length, 2)
    assert.equal(result[0].orderId, 'o-1')
    assert.equal(result[1].orderId, 'o-2')
  })

  test('getOrder 找到有效订单返回', () => {
    const mockOrder = {
      orderId: 'o-3',
      memberId: 'm-03',
      items: [{ skuId: 'sku-3', title: '饮料', quantity: 2, price: 15 }],
      totalAmount: 30,
      currency: 'CNY',
      status: CashierOrderStatus.PendingPayment,
      tenantContext: createContext(),
      source: 'memory',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const controller = makeController({ getOrder: () => mockOrder })

    const result = controller.getOrder('o-3', createContext())

    assert.ok(result)
    assert.equal(result.orderId, 'o-3')
    assert.equal(result.totalAmount, 30)
  })

  test('createPayment 委托 service 创建支付', async () => {
    const payment = {
      paymentId: 'pay-1',
      orderId: 'o-1',
      channel: 'wechat-pay',
      amount: 50,
      status: CashierPaymentStatus.Pending,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const controller = makeController({ createPayment: async () => payment })

    const result = await controller.createPayment('o-1', {
      channel: 'wechat-pay',
      amount: 50
    })

    assert.equal(result.paymentId, 'pay-1')
    assert.equal(result.channel, 'wechat-pay')
    assert.equal(result.status, CashierPaymentStatus.Pending)
  })

  test('listPayments 委托 service 返回支付列表', () => {
    const mockPayments = [
      {
        paymentId: 'p-1',
        orderId: 'o-1',
        channel: 'wechat-pay',
        amount: 50,
        status: CashierPaymentStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        paymentId: 'p-2',
        orderId: 'o-2',
        channel: 'alipay',
        amount: 100,
        status: CashierPaymentStatus.Succeeded,
        transactionNo: 'txn-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    const controller = makeController({ listPayments: () => mockPayments })

    const result = controller.listPayments(createContext())

    assert.equal(result.length, 2)
    assert.equal(result[0].paymentId, 'p-1')
    assert.equal(result[1].status, CashierPaymentStatus.Succeeded)
  })

  test('applyPaymentCallback 支付成功回调更新订单和支付状态', async () => {
    const paidOrder = {
      orderId: 'o-4',
      memberId: 'm-01',
      items: [],
      totalAmount: 200,
      currency: 'CNY',
      status: CashierOrderStatus.Paid,
      tenantContext: createContext(),
      source: 'memory',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const successPayment = {
      paymentId: 'p-3',
      orderId: 'o-4',
      channel: 'wechat-pay',
      amount: 200,
      status: CashierPaymentStatus.Succeeded,
      transactionNo: 'txn-success',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    }
    const controller = makeController({
      applyPaymentCallback: async () => ({ order: paidOrder, payment: successPayment })
    })

    const result = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: 'o-4',
      orderId: 'o-4',
      tenantId: 'tenant-cashier',
      externalPaymentId: 'ext-ok'
    })

    assert.equal(result.order.status, CashierOrderStatus.Paid)
    assert.equal(result.payment.status, CashierPaymentStatus.Succeeded)
    assert.equal(result.payment.transactionNo, 'txn-success')
  })
})

// ── 反例测试 ──
describe('CashierController 反例', () => {
  test('getOrder 找不到订单抛出错误', () => {
    const controller = makeController()

    assert.throws(
      () => controller.getOrder('nonexistent', createContext()),
      /Cashier order nonexistent not found/
    )
  })

  test('getOrder 找不到订单，service 返回 undefined', () => {
    const controller = makeController({ getOrder: () => undefined })

    assert.throws(
      () => controller.getOrder('ghost-order', createContext()),
      /Cashier order ghost-order not found/
    )
  })
})

// ── 边界值测试 ──
describe('CashierController 边界值', () => {
  test('listOrders 空列表返回空数组', () => {
    const controller = makeController({ listOrders: () => [] })

    const result = controller.listOrders(createContext())

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  test('listPayments 空列表返回空数组', () => {
    const controller = makeController({ listPayments: () => [] })

    const result = controller.listPayments(createContext())

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  test('createOrder 传入多商品订单正常', async () => {
    const itemsCount = 10
    const items = Array.from({ length: itemsCount }, (_, i) => ({
      skuId: `sku-${i}`,
      title: `商品${i}`,
      quantity: 1,
      price: 10
    }))
    let capturedItems: typeof items | undefined
    const controller = makeController({
      createOrder: async (_ctx: any, body: any) => {
        capturedItems = body.items
        return {
          orderId: 'o-bulk',
          memberId: 'm-bulk',
          items: body.items,
          totalAmount: body.items.reduce((s: number, it: any) => s + it.price, 0),
          currency: 'CNY',
          status: CashierOrderStatus.Created,
          tenantContext: createContext(),
          source: 'memory'
        }
      }
    })

    const result = await controller.createOrder(createContext(), {
      memberId: 'm-bulk',
      items
    })

    assert.equal(result.items.length, itemsCount)
    assert.equal(result.totalAmount, itemsCount * 10)
    assert.ok(capturedItems)
    assert.equal(capturedItems!.length, itemsCount)
  })

  test('createPayment 金额为 0 的支付正常创建', async () => {
    const controller = makeController({
      createPayment: async (_oid: string, body: any) => ({
        paymentId: 'pay-zero',
        orderId: 'o-zero',
        channel: body.channel,
        amount: body.amount,
        status: CashierPaymentStatus.Pending,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })

    const result = await controller.createPayment('o-zero', {
      channel: 'internal-transfer',
      amount: 0
    })

    assert.equal(result.amount, 0)
    assert.equal(result.status, CashierPaymentStatus.Pending)
  })

  test('createOrder 默认货币为 CNY', async () => {
    let capturedBody: any
    const controller = makeController({
      createOrder: async (_ctx: any, body: any) => {
        capturedBody = body
        return {
          orderId: 'o-cny-default',
          memberId: body.memberId,
          items: body.items,
          totalAmount: 100,
          currency: 'CNY',
          status: CashierOrderStatus.Created,
          tenantContext: createContext(),
          source: 'memory'
        }
      }
    })

    const result = await controller.createOrder(createContext(), {
      memberId: 'm-test',
      items: [{ skuId: 'sku-1', quantity: 1, price: 100 }]
    })

    assert.equal(result.currency, 'CNY')
    assert.ok(capturedBody!.items.length > 0)
  })
})

// ── 支付回调边界 ──
describe('CashierController 支付回调边界', () => {
  test('applyPaymentCallback 支付失败回调更新支付状态', async () => {
    const failedOrder = {
      orderId: 'o-5',
      memberId: 'm-01',
      items: [],
      totalAmount: 150,
      currency: 'CNY',
      status: CashierOrderStatus.PaymentFailed,
      tenantContext: createContext(),
      source: 'memory',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const failedPayment = {
      paymentId: 'p-5',
      orderId: 'o-5',
      channel: 'card',
      amount: 150,
      status: CashierPaymentStatus.Failed,
      failureReason: 'Payment callback reported failure',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    const controller = makeController({
      applyPaymentCallback: async () => ({ order: failedOrder, payment: failedPayment })
    })

    const result = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: 'o-5',
      orderId: 'o-5',
      tenantId: 'tenant-cashier',
      externalPaymentId: 'ext-fail'
    })

    assert.equal(result.order.status, CashierOrderStatus.PaymentFailed)
    assert.equal(result.payment.status, CashierPaymentStatus.Failed)
    assert.ok(result.payment.failureReason)
  })
})
