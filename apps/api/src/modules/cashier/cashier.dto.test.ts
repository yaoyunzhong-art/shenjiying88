import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  CashierPaymentCallbackDto,
  CashierOrderItemDto,
  CreateCashierOrderDto,
  CreateCashierPaymentDto
} from './cashier.dto'

// ──────────── CashierOrderItemDto ────────────
describe('CashierOrderItemDto', () => {
  test('构造单个订单项，所有必填字段可赋值', () => {
    const item = Object.assign(new CashierOrderItemDto(), {
      skuId: 'SKU-A001',
      quantity: 3,
      price: 49.9,
      title: '台球1小时'
    })

    assert.equal(item.skuId, 'SKU-A001')
    assert.equal(item.quantity, 3)
    assert.equal(item.price, 49.9)
    assert.equal(item.title, '台球1小时')
  })

  test('订单项 title 为可选字段，省略也不抛错', () => {
    const item = Object.assign(new CashierOrderItemDto(), {
      skuId: 'SKU-B002',
      quantity: 1,
      price: 10
    })

    assert.equal(item.skuId, 'SKU-B002')
    assert.equal(item.title, undefined)
  })

  test('quantity 为 0 时的订单项（边界：白送商品/赠品）', () => {
    const item = Object.assign(new CashierOrderItemDto(), {
      skuId: 'SKU-FREE',
      quantity: 0,
      price: 0,
      title: '赠品'
    })

    assert.equal(item.quantity, 0)
    assert.equal(item.price, 0)
    assert.equal(item.skuId, 'SKU-FREE')
  })

  test('price 为负数时 DTO 仍然接受（由 service 层做业务校验）', () => {
    const item = Object.assign(new CashierOrderItemDto(), {
      skuId: 'SKU-REFUND',
      quantity: 1,
      price: -99,
      title: '退款抵扣'
    })

    assert.equal(item.price, -99)
    // DTO 层仅做数据承载，不做业务规则校验
  })
})

// ──────────── CreateCashierOrderDto ────────────
describe('CreateCashierOrderDto', () => {
  test('标准创单 DTO：必填 memberId + items', () => {
    const dto = Object.assign(new CreateCashierOrderDto(), {
      memberId: 'member-1',
      items: [
        Object.assign(new CashierOrderItemDto(), { skuId: 'sku-1', quantity: 1, price: 99 })
      ]
    })

    assert.equal(dto.memberId, 'member-1')
    assert.equal(dto.items.length, 1)
    assert.equal(dto.items[0].skuId, 'sku-1')
  })

  test('创单 DTO 接受可选货币参数', () => {
    const dto = Object.assign(new CreateCashierOrderDto(), {
      memberId: 'member-2',
      items: [
        Object.assign(new CashierOrderItemDto(), { skuId: 'sku-2', quantity: 1, price: 50 })
      ],
      currency: 'HKD'
    })

    assert.equal(dto.currency, 'HKD')
  })

  test('创单 DTO 带优惠券码 couponCode', () => {
    const dto = Object.assign(new CreateCashierOrderDto(), {
      memberId: 'member-3',
      items: [
        Object.assign(new CashierOrderItemDto(), { skuId: 'sku-3', quantity: 1, price: 200 })
      ],
      couponCode: 'SUMMER2026'
    })

    assert.equal(dto.couponCode, 'SUMMER2026')
  })

  test('创单 DTO 带盲盒参数 blindboxPlanId + blindboxQuantity', () => {
    const dto = Object.assign(new CreateCashierOrderDto(), {
      memberId: 'member-4',
      items: [
        Object.assign(new CashierOrderItemDto(), { skuId: 'sku-blindbox', quantity: 1, price: 30 })
      ],
      blindboxPlanId: 'bb-bronze',
      blindboxQuantity: 3
    })

    assert.equal(dto.blindboxPlanId, 'bb-bronze')
    assert.equal(dto.blindboxQuantity, 3)
  })

  test('创单 DTO items 为空数组时的边界（service 层应拒单）', () => {
    const dto = Object.assign(new CreateCashierOrderDto(), {
      memberId: 'member-5',
      items: []
    })

    assert.equal(dto.items.length, 0)
    // DTO 不做业务校验，service 层负责拒绝空订单
  })

  test('创单 DTO 多件商品 item 计算小计字段完整性', () => {
    const items = [
      Object.assign(new CashierOrderItemDto(), { skuId: 'sku-a', quantity: 2, price: 50 }),
      Object.assign(new CashierOrderItemDto(), { skuId: 'sku-b', quantity: 1, price: 200 }),
      Object.assign(new CashierOrderItemDto(), { skuId: 'sku-c', quantity: 5, price: 20 })
    ]

    const dto = Object.assign(new CreateCashierOrderDto(), {
      memberId: 'member-6',
      items
    })

    assert.equal(dto.items.length, 3)
    const computedTotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0)
    assert.equal(computedTotal, 2 * 50 + 1 * 200 + 5 * 20)
  })
})

// ──────────── CreateCashierPaymentDto ────────────
describe('CreateCashierPaymentDto', () => {
  test('创建支付 DTO：必填 channel', () => {
    const dto = Object.assign(new CreateCashierPaymentDto(), {
      channel: 'wechat-pay'
    })

    assert.equal(dto.channel, 'wechat-pay')
  })

  test('创建支付 DTO 带 externalPaymentId', () => {
    const dto = Object.assign(new CreateCashierPaymentDto(), {
      channel: 'alipay',
      externalPaymentId: 'ext-alipay-001'
    })

    assert.equal(dto.externalPaymentId, 'ext-alipay-001')
  })

  test('创建支付 DTO 指定 amount 覆盖 order total', () => {
    const dto = Object.assign(new CreateCashierPaymentDto(), {
      channel: 'bank-transfer',
      amount: 499.99
    })

    assert.equal(dto.amount, 499.99)
  })

  test('创建支付 DTO 仅 channel 不填 amount（由 service 取 order total）', () => {
    const dto = Object.assign(new CreateCashierPaymentDto(), {
      channel: 'card'
    })

    assert.equal(dto.channel, 'card')
    assert.equal(dto.amount, undefined)
    assert.equal(dto.externalPaymentId, undefined)
  })

  test('创建支付 DTO channel 为自定义内部支付方式', () => {
    const dto = Object.assign(new CreateCashierPaymentDto(), {
      channel: 'internal-transfer',
      amount: 0
    })

    assert.equal(dto.channel, 'internal-transfer')
    assert.equal(dto.amount, 0)
  })
})

// ──────────── CashierPaymentCallbackDto ────────────
describe('CashierPaymentCallbackDto', () => {
  test('支付成功回调 DTO', () => {
    const dto = Object.assign(new CashierPaymentCallbackDto(), {
      standardizedEventName: 'cashier.payment-succeeded' as const,
      aggregateId: 'agg-order-1',
      orderId: 'order-1',
      tenantId: 'tenant-1',
      externalPaymentId: 'ext-wx-123',
      transactionNo: 'txn-45678',
      channel: 'wechat-pay',
      amount: 100
    })

    assert.equal(dto.standardizedEventName, 'cashier.payment-succeeded')
    assert.equal(dto.aggregateId, 'agg-order-1')
    assert.equal(dto.orderId, 'order-1')
    assert.equal(dto.tenantId, 'tenant-1')
    assert.equal(dto.externalPaymentId, 'ext-wx-123')
    assert.equal(dto.transactionNo, 'txn-45678')
    assert.equal(dto.channel, 'wechat-pay')
    assert.equal(dto.amount, 100)
  })

  test('支付失败回调 DTO', () => {
    const dto = Object.assign(new CashierPaymentCallbackDto(), {
      standardizedEventName: 'cashier.payment-failed' as const,
      aggregateId: 'agg-order-2',
      orderId: 'order-2',
      tenantId: 'tenant-1',
      externalPaymentId: 'ext-wx-fail',
      transactionNo: 'txn-fail-001'
    })

    assert.equal(dto.standardizedEventName, 'cashier.payment-failed')
    assert.equal(dto.orderId, 'order-2')
  })

  test('支付回调 DTO 必填字段校验：无 tenantId 也能创建 DTO（由 service 做校验）', () => {
    const dto = Object.assign(new CashierPaymentCallbackDto(), {
      standardizedEventName: 'cashier.payment-succeeded' as const,
      aggregateId: 'agg-3',
      orderId: 'order-3',
      tenantId: ''
    })

    assert.equal(dto.tenantId, '')
    assert.equal(dto.standardizedEventName, 'cashier.payment-succeeded')
  })

  test('支付回调 DTO 带扩展 payload', () => {
    const payload = { remark: '用户备注', discountApplied: true, couponId: 'CPN-001' }
    const dto = Object.assign(new CashierPaymentCallbackDto(), {
      standardizedEventName: 'cashier.payment-succeeded' as const,
      aggregateId: 'agg-4',
      orderId: 'order-4',
      tenantId: 'tenant-1',
      payload
    })

    assert.deepEqual(dto.payload, payload)
    assert.equal(dto.payload?.couponId, 'CPN-001')
  })

  test('支付回调 DTO 事件名只能为 payment-succeeded 或 payment-failed', () => {
    // DTO 类型约束了 standardizedEventName 只能是两个值之一
    const successDto = Object.assign(new CashierPaymentCallbackDto(), {
      standardizedEventName: 'cashier.payment-succeeded' as const,
      aggregateId: 'agg-5',
      orderId: 'order-5',
      tenantId: 'tenant-1'
    })
    const failDto = Object.assign(new CashierPaymentCallbackDto(), {
      standardizedEventName: 'cashier.payment-failed' as const,
      aggregateId: 'agg-6',
      orderId: 'order-6',
      tenantId: 'tenant-1'
    })

    assert.equal(successDto.standardizedEventName, 'cashier.payment-succeeded')
    assert.equal(failDto.standardizedEventName, 'cashier.payment-failed')
    assert.notEqual(successDto.standardizedEventName, failDto.standardizedEventName)
  })
})
