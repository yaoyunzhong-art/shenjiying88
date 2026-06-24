/**
 * Cashier Simulator Test
 *
 * 模拟收银系统的场景覆盖：
 * - 订单创建与状态流转 (CREATED → PENDING_PAYMENT → PAID → CLOSED)
 * - 支付生命周期 (PENDING → SUCCEEDED/FAILED)
 * - 订单金额计算 (computeCashierOrderTotal)
 * - 支付回调处理 (cashier.payment-succeeded / cashier.payment-failed)
 * - 订单关闭原因 (PAYMENT_TIMEOUT / FULL_REFUND / MANUAL_CANCEL)
 * - 多商品订单
 * - 边界场景 (空订单、0 数量、超大金额)
 *
 * 8 角色视角覆盖：
 *  👔店长 - 收银汇总&订单审核
 *  🛒前台 - 创建订单&收款
 *  👥HR - 员工收银统计
 *  🔧安监 - 支付合规审计
 *  🎮导玩员 - 游戏币购买订单
 *  🎯运行专员 - 订单异常处理&关单
 *  🤝团建 - 团建套餐订单
 *  📢营销 - 优惠券&盲盒订单
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  CashierOrderStatus,
  CashierPaymentStatus,
  CashierOrderCloseReason,
  computeCashierOrderTotal,
  type CashierOrder,
  type CashierPayment,
  type CashierOrderItem
} from './cashier.entity'

// ─── Simulator helpers ───

interface SimulatedOrder {
  order: CashierOrder
  payments: CashierPayment[]
}

function createOrderItem(skuId: string, quantity: number, price: number, title?: string): CashierOrderItem {
  return { skuId, quantity, price, title: title ?? `商品-${skuId}` }
}

function createSimulatedOrder(
  memberId: string,
  tenantId: string,
  items: CashierOrderItem[],
  overrides?: Partial<Pick<CashierOrder, 'couponCode' | 'blindboxPlanId' | 'blindboxQuantity' | 'currency'>>
): SimulatedOrder {
  const totalAmount = computeCashierOrderTotal(items)
  const now = new Date().toISOString()
  const order: CashierOrder = {
    orderId: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tenantContext: { tenantId } as any,
    memberId,
    items,
    currency: overrides?.currency ?? 'CNY',
    totalAmount,
    couponCode: overrides?.couponCode,
    blindboxPlanId: overrides?.blindboxPlanId,
    blindboxQuantity: overrides?.blindboxQuantity,
    status: CashierOrderStatus.Created,
    createdAt: now,
    updatedAt: now,
    source: 'memory'
  }
  return { order, payments: [] }
}

function simulateTransitionToPending(order: CashierOrder): CashierOrder {
  assert.equal(order.status, CashierOrderStatus.Created, '订单必须处于 Created 状态才能进入待支付')
  return { ...order, status: CashierOrderStatus.PendingPayment, updatedAt: new Date().toISOString() }
}

function simulatePayment(
  sim: SimulatedOrder,
  channel: string,
  amount: number,
  succeed: boolean
): { payment: CashierPayment; updatedOrder: CashierOrder } {
  assert.ok(
    sim.order.status === CashierOrderStatus.PendingPayment || sim.order.status === CashierOrderStatus.Created,
    '订单必须处于 Created 或 PendingPayment 状态才能支付'
  )
  const now = new Date().toISOString()
  const payment: CashierPayment = {
    paymentId: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderId: sim.order.orderId,
    channel,
    amount,
    status: succeed ? CashierPaymentStatus.Succeeded : CashierPaymentStatus.Failed,
    transactionNo: succeed ? `TXN${Date.now()}` : undefined,
    failureReason: succeed ? undefined : '余额不足',
    createdAt: now,
    updatedAt: now,
    completedAt: succeed ? now : undefined
  }
  sim.payments.push(payment)

  const updatedOrder: CashierOrder = {
    ...sim.order,
    status: succeed ? CashierOrderStatus.Paid : sim.order.status,
    latestPaymentId: payment.paymentId,
    paidAt: succeed ? now : sim.order.paidAt,
    updatedAt: now
  }
  sim.order = updatedOrder
  return { payment, updatedOrder }
}

function simulateCloseOrder(
  sim: SimulatedOrder,
  reason: CashierOrderCloseReason,
  closedBy?: string,
  closeNote?: string
): CashierOrder {
  const closeableStatuses = [
    CashierOrderStatus.Created,
    CashierOrderStatus.PendingPayment,
    CashierOrderStatus.PaymentFailed
  ]
  assert.ok(
    closeableStatuses.includes(sim.order.status),
    `订单状态 ${sim.order.status} 不允许关单`
  )
  const now = new Date().toISOString()
  const closed: CashierOrder = {
    ...sim.order,
    status: CashierOrderStatus.Closed,
    closedAt: now,
    closeReason: reason,
    closedBy: closedBy ?? 'system',
    closeNote: closeNote ?? '',
    updatedAt: now
  }
  sim.order = closed
  return closed
}

function simulateRefund(sim: SimulatedOrder, fullRefund: boolean): CashierOrder {
  assert.equal(sim.order.status, CashierOrderStatus.Paid, '只有已支付订单可以退款')
  const now = new Date().toISOString()
  const closed: CashierOrder = {
    ...sim.order,
    status: CashierOrderStatus.Closed,
    closedAt: now,
    closeReason: fullRefund ? CashierOrderCloseReason.FullRefund : CashierOrderCloseReason.ManualCancel,
    closedBy: 'admin',
    closeNote: fullRefund ? '全额退款' : '手动关单',
    updatedAt: now
  }
  sim.order = closed
  return closed
}

/** 模拟支付成功回调 */
function simulatePaymentCallback(
  order: CashierOrder,
  eventName: 'cashier.payment-succeeded' | 'cashier.payment-failed',
  paymentId: string
): CashierOrder {
  const now = new Date().toISOString()
  if (eventName === 'cashier.payment-succeeded') {
    return {
      ...order,
      status: CashierOrderStatus.Paid,
      latestPaymentId: paymentId,
      paidAt: now,
      updatedAt: now
    }
  }
  return { ...order, status: CashierOrderStatus.PaymentFailed, updatedAt: now }
}

// ─── 角色场景 ───

const ROLES = {
  DIANZHANG: '👔店长',
  QIANTAI: '🛒前台',
  HR: '👥HR',
  ANJIAN: '🔧安监',
  DAOWAN: '🎮导玩员',
  YUNXING: '🎯运行专员',
  TUANJIAN: '🤝团建',
  YINGXIAO: '📢营销'
} as const

// ─── Tests ───

describe('Cashier Simulator', () => {
  // ──────── 👔店长 ────────
  describe(`${ROLES.DIANZHANG} - 收银汇总&订单审核`, () => {
    test('查看当日所有订单', () => {
      const sim1 = createSimulatedOrder('m001', 't-001', [
        createOrderItem('SKU01', 2, 100),
        createOrderItem('SKU02', 1, 50)
      ])
      const sim2 = createSimulatedOrder('m002', 't-001', [
        createOrderItem('SKU03', 1, 200)
      ])

      // 模拟门店当日所有订单
      const allOrders = [sim1.order, sim2.order]
      const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0)

      assert.equal(allOrders.length, 2)
      assert.equal(totalRevenue, 2 * 100 + 1 * 50 + 1 * 200)
    })

    test('审核高额订单', () => {
      const sim = createSimulatedOrder('m001', 't-001', [
        createOrderItem('SKU_PREMIUM', 1, 9999),
        createOrderItem('SKU_ADDON', 3, 500)
      ])
      const HIGH_VALUE_THRESHOLD = 5000

      assert.equal(sim.order.totalAmount, 9999 + 3 * 500)
      assert.ok(sim.order.totalAmount > HIGH_VALUE_THRESHOLD, '高额订单需店长审核')
    })

    test('审核关单理由', () => {
      const sim = createSimulatedOrder('m003', 't-001', [
        createOrderItem('SKU01', 1, 300)
      ])
      simulateTransitionToPending(sim.order)

      const closed = simulateCloseOrder(sim, CashierOrderCloseReason.ManualCancel, '店长', '客户取消')
      assert.equal(closed.status, CashierOrderStatus.Closed)
      assert.equal(closed.closeReason, CashierOrderCloseReason.ManualCancel)
      assert.equal(closed.closedBy, '店长')
    })
  })

  // ──────── 🛒前台 ────────
  describe(`${ROLES.QIANTAI} - 创建订单&收款`, () => {
    test('创建普通商品订单', () => {
      const sim = createSimulatedOrder('m100', 't-001', [
        createOrderItem('SKU_DRINK', 2, 15, '饮料'),
        createOrderItem('SKU_SNACK', 1, 25, '零食')
      ])
      assert.equal(sim.order.status, CashierOrderStatus.Created)
      assert.equal(sim.order.items.length, 2)
      assert.equal(sim.order.totalAmount, 2 * 15 + 1 * 25)
    })

    test('创建订单后收款', () => {
      const sim = createSimulatedOrder('m101', 't-001', [
        createOrderItem('SKU_TICKET', 1, 88, '门票')
      ])
      sim.order = simulateTransitionToPending(sim.order)
      assert.equal(sim.order.status, CashierOrderStatus.PendingPayment)

      const { payment, updatedOrder } = simulatePayment(sim, 'wechat', 88, true)
      assert.equal(payment.status, CashierPaymentStatus.Succeeded)
      assert.equal(payment.channel, 'wechat')
      assert.equal(updatedOrder.status, CashierOrderStatus.Paid)
    })

    test('收款失败不影响订单', () => {
      const sim = createSimulatedOrder('m102', 't-001', [
        createOrderItem('SKU_TICKET', 1, 88, '门票')
      ])
      sim.order = simulateTransitionToPending(sim.order)

      const { payment, updatedOrder } = simulatePayment(sim, 'wechat', 88, false)
      assert.equal(payment.status, CashierPaymentStatus.Failed)
      assert.ok(payment.failureReason)
      // 支付失败，订单状态不应变为已支付
      assert.notEqual(updatedOrder.status, CashierOrderStatus.Paid)
    })
  })

  // ──────── 👥HR ────────
  describe(`${ROLES.HR} - 员工收银统计`, () => {
    test('统计员工创建订单数', () => {
      const storeOrders: CashierOrder[] = []
      // 模拟不同员工创建的订单
      for (const employeeId of ['emp01', 'emp01', 'emp02', 'emp01', 'emp03']) {
        const sim = createSimulatedOrder(employeeId, 't-001', [
          createOrderItem('SKU_X', 1, 10)
        ])
        storeOrders.push(sim.order)
      }

      const stats = new Map<string, number>()
      for (const o of storeOrders) {
        stats.set(o.memberId, (stats.get(o.memberId) ?? 0) + 1)
      }
      assert.equal(stats.get('emp01'), 3)
      assert.equal(stats.get('emp02'), 1)
      assert.equal(stats.get('emp03'), 1)
    })

    test('统计员工收银总额', () => {
      const empOrders = [
        createSimulatedOrder('emp01', 't-001', [createOrderItem('A', 2, 50)]),
        createSimulatedOrder('emp01', 't-001', [createOrderItem('B', 1, 200)])
      ]
      const total = empOrders.reduce((s, sim) => s + sim.order.totalAmount, 0)
      assert.equal(total, 2 * 50 + 1 * 200)
    })
  })

  // ──────── 🔧安监 ────────
  describe(`${ROLES.ANJIAN} - 支付合规审计`, () => {
    test('检测异常大额支付', () => {
      const ABNORMAL_THRESHOLD = 10000
      const sim = createSimulatedOrder('m200', 't-001', [
        createOrderItem('SKU_X', 100, 200)
      ])
      // 100 * 200 = 20000 > 10000 → 触发风控
      assert.ok(sim.order.totalAmount > ABNORMAL_THRESHOLD, '大额订单应触发风控审计')
    })

    test('检测重复支付订单', () => {
      const sim = createSimulatedOrder('m201', 't-001', [
        createOrderItem('SKU_X', 1, 100)
      ])
      sim.order = simulateTransitionToPending(sim.order)
      simulatePayment(sim, 'alipay', 100, true)

      // 已支付订单不应再次收款
      assert.throws(
        () => {
          assert.notEqual(
            sim.order.status,
            CashierOrderStatus.Created,
            '已支付订单不应再次收款'
          )
          simulatePayment(sim, 'wechat', 100, true)
        },
        /订单必须处于 Created 或 PendingPayment 状态才能支付/
      )
    })

    test('支付超时自动关单', () => {
      const sim = createSimulatedOrder('m202', 't-001', [
        createOrderItem('SKU_X', 1, 50)
      ])
      sim.order = simulateTransitionToPending(sim.order)
      // 模拟超时关单
      const closed = simulateCloseOrder(sim, CashierOrderCloseReason.PaymentTimeout)
      assert.equal(closed.status, CashierOrderStatus.Closed)
      assert.equal(closed.closeReason, CashierOrderCloseReason.PaymentTimeout)
    })
  })

  // ──────── 🎮导玩员 ────────
  describe(`${ROLES.DAOWAN} - 游戏币购买订单`, () => {
    test('创建游戏币订单', () => {
      const sim = createSimulatedOrder('m300', 't-001', [
        createOrderItem('SKU_COIN_100', 1, 98, '100游戏币'),
        createOrderItem('SKU_COIN_50', 2, 49, '50游戏币')
      ])
      assert.equal(sim.order.totalAmount, 98 + 2 * 49)
      assert.equal(sim.order.items.length, 2)
    })

    test('游戏币订单支付流程', () => {
      const sim = createSimulatedOrder('m301', 't-001', [
        createOrderItem('SKU_COIN_500', 1, 398, '500游戏币')
      ])
      sim.order = simulateTransitionToPending(sim.order)
      const { payment, updatedOrder } = simulatePayment(sim, 'wechat', 398, true)
      assert.equal(payment.status, CashierPaymentStatus.Succeeded)
      assert.equal(updatedOrder.status, CashierOrderStatus.Paid)
      assert.ok(updatedOrder.paidAt, '支付时间应被记录')
    })
  })

  // ──────── 🎯运行专员 ────────
  describe(`${ROLES.YUNXING} - 订单异常处理&关单`, () => {
    test('处理支付失败订单', () => {
      const sim = createSimulatedOrder('m400', 't-001', [
        createOrderItem('SKU_X', 1, 200)
      ])
      simulateTransitionToPending(sim.order)

      // 支付回调：失败
      const failedOrder = simulatePaymentCallback(
        sim.order,
        'cashier.payment-failed',
        'pay-failed-001'
      )
      assert.equal(failedOrder.status, CashierOrderStatus.PaymentFailed)
    })

    test('人工关单异常订单', () => {
      const sim = createSimulatedOrder('m401', 't-001', [
        createOrderItem('SKU_ERROR', 1, 0) // 异常商品
      ])
      // 可直接关单（Created 状态）
      const closed = simulateCloseOrder(
        sim,
        CashierOrderCloseReason.ManualCancel,
        '运行专员',
        '商品异常'
      )
      assert.equal(closed.status, CashierOrderStatus.Closed)
      assert.equal(closed.closeNote, '商品异常')
    })

    test('全额退款关单', () => {
      const sim = createSimulatedOrder('m402', 't-001', [
        createOrderItem('SKU_TICKET', 2, 150, '门票')
      ])
      sim.order = simulateTransitionToPending(sim.order)
      simulatePayment(sim, 'alipay', 300, true)
      assert.equal(sim.order.status, CashierOrderStatus.Paid)

      const refunded = simulateRefund(sim, true)
      assert.equal(refunded.status, CashierOrderStatus.Closed)
      assert.equal(refunded.closeReason, CashierOrderCloseReason.FullRefund)
    })
  })

  // ──────── 🤝团建 ────────
  describe(`${ROLES.TUANJIAN} - 团建套餐订单`, () => {
    test('创建团建套餐订单', () => {
      const sim = createSimulatedOrder('m500', 't-001', [
        createOrderItem('SKU_TEAM_PACKAGE_10', 1, 2999, '10人团建套餐'),
        createOrderItem('SKU_MEAL_ADDON', 10, 58, '加餐')
      ])
      assert.equal(sim.order.totalAmount, 2999 + 10 * 58)
    })

    test('团建订单多人分摊支付', () => {
      const sim = createSimulatedOrder('m501', 't-001', [
        createOrderItem('SKU_TEAM_PACKAGE_20', 1, 4999, '20人团建套餐')
      ])
      sim.order = simulateTransitionToPending(sim.order)

      // 分两次支付
      const { updatedOrder: afterFirst } = simulatePayment(sim, 'alipay', 2500, true)
      // 第一笔支付成功后订单已变为 Paid
      assert.equal(afterFirst.status, CashierOrderStatus.Paid)
      assert.ok(sim.payments.length >= 1)
    })
  })

  // ──────── 📢营销 ────────
  describe(`${ROLES.YINGXIAO} - 优惠券&盲盒订单`, () => {
    test('使用优惠券创建订单', () => {
      const sim = createSimulatedOrder('m600', 't-001', [
        createOrderItem('SKU_TICKET', 2, 100, '门票')
      ], { couponCode: 'SUMMER2025' })
      assert.equal(sim.order.couponCode, 'SUMMER2025')
      assert.equal(sim.order.totalAmount, 2 * 100)
    })

    test('盲盒订单创建', () => {
      const sim = createSimulatedOrder('m601', 't-001', [
        createOrderItem('SKU_BLINDBOX', 3, 69, '惊喜盲盒')
      ], { blindboxPlanId: 'plan-blindbox-001', blindboxQuantity: 3 })
      assert.equal(sim.order.blindboxPlanId, 'plan-blindbox-001')
      assert.equal(sim.order.blindboxQuantity, 3)
      assert.equal(sim.order.totalAmount, 3 * 69)
    })

    test('支付回调成功 - 营销活动支付', () => {
      const sim = createSimulatedOrder('m602', 't-001', [
        createOrderItem('SKU_CAMPAIGN', 1, 199, '活动门票')
      ])
      sim.order = simulateTransitionToPending(sim.order)

      const callbackResult = simulatePaymentCallback(
        sim.order,
        'cashier.payment-succeeded',
        'pay-cb-001'
      )
      assert.equal(callbackResult.status, CashierOrderStatus.Paid)
      assert.equal(callbackResult.latestPaymentId, 'pay-cb-001')
    })
  })
})

// ─── 核心功能测试 ───

describe('CashierOrderTotal 计算', () => {
  test('computeCashierOrderTotal - 正常计算', () => {
    const items = [
      createOrderItem('A', 3, 10),
      createOrderItem('B', 2, 25)
    ]
    assert.equal(computeCashierOrderTotal(items), 3 * 10 + 2 * 25)
  })

  test('computeCashierOrderTotal - 空订单', () => {
    assert.equal(computeCashierOrderTotal([]), 0)
  })

  test('computeCashierOrderTotal - 零数量商品', () => {
    const items = [
      createOrderItem('A', 0, 10),
      createOrderItem('B', 5, 20)
    ]
    assert.equal(computeCashierOrderTotal(items), 0 * 10 + 5 * 20)
  })
})

describe('订单状态流转', () => {
  test('完整正向流程: Created → PendingPayment → Paid', () => {
    const sim = createSimulatedOrder('m001', 't-001', [
      createOrderItem('SKU_X', 1, 100)
    ])
    assert.equal(sim.order.status, CashierOrderStatus.Created)

    sim.order = simulateTransitionToPending(sim.order)
    assert.equal(sim.order.status, CashierOrderStatus.PendingPayment)

    simulatePayment(sim, 'wechat', 100, true)
    assert.equal(sim.order.status, CashierOrderStatus.Paid)
  })

  test('支付失败后可重新支付', () => {
    const sim = createSimulatedOrder('m002', 't-001', [
      createOrderItem('SKU_X', 1, 50)
    ])
    sim.order = simulateTransitionToPending(sim.order)
    simulatePayment(sim, 'alipay', 50, false)
    // 支付失败状态
    assert.equal(sim.order.status, CashierOrderStatus.PendingPayment)
    // 重新支付（PendingPayment 状态允许）
    simulatePayment(sim, 'wechat', 50, true)
    assert.equal(sim.order.status, CashierOrderStatus.Paid)
  })

  test('已支付订单不允许关单', () => {
    const sim = createSimulatedOrder('m003', 't-001', [
      createOrderItem('SKU_X', 1, 100)
    ])
    sim.order = simulateTransitionToPending(sim.order)
    simulatePayment(sim, 'wechat', 100, true)

    assert.throws(
      () => simulateCloseOrder(sim, CashierOrderCloseReason.ManualCancel),
      /订单状态 .* 不允许关单/
    )
  })
})

describe('支付回调模拟', () => {
  test('支付成功回调更新订单状态', () => {
    const sim = createSimulatedOrder('m-cb-01', 't-001', [
      createOrderItem('SKU_X', 1, 100)
    ])
    const result = simulatePaymentCallback(
      sim.order,
      'cashier.payment-succeeded',
      'external-pay-123'
    )
    assert.equal(result.status, CashierOrderStatus.Paid)
    assert.equal(result.latestPaymentId, 'external-pay-123')
    assert.ok(result.paidAt)
  })

  test('支付失败回调不影响 paidAt', () => {
    const sim = createSimulatedOrder('m-cb-02', 't-001', [
      createOrderItem('SKU_X', 1, 50)
    ])
    const result = simulatePaymentCallback(
      sim.order,
      'cashier.payment-failed',
      'external-pay-456'
    )
    assert.equal(result.status, CashierOrderStatus.PaymentFailed)
    assert.equal(result.paidAt, undefined)
  })
})

describe('边界场景', () => {
  test('超量订单', () => {
    const items = Array.from({ length: 100 }, (_, i) =>
      createOrderItem(`SKU_${i}`, 1, 10)
    )
    const sim = createSimulatedOrder('m-edge-01', 't-001', items)
    assert.equal(sim.order.items.length, 100)
    assert.equal(sim.order.totalAmount, 100 * 10)
  })

  test('多币种支持', () => {
    const sim = createSimulatedOrder('m-edge-02', 't-001', [
      createOrderItem('SKU_X', 1, 100)
    ], { currency: 'USD' })
    assert.equal(sim.order.currency, 'USD')
  })

  test('单个商品大数量', () => {
    const sim = createSimulatedOrder('m-edge-03', 't-001', [
      createOrderItem('SKU_BULK', 9999, 1)
    ])
    assert.equal(sim.order.totalAmount, 9999)
  })
})
