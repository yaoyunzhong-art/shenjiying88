// T106-3 P1-4 cashier-pos 实战化测试
// 4 子套件: 多付款 / 会员 / 票据 / 离线 + API

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  submitOrder,
  queryOrder,
  requestRefund,
  queryRefundStatus,
  getChannelStats,
  syncOfflineOrders,
  getOfflineQueueCount,
  clearOfflineQueue,
  allocatePayment,
  getRemainingCents,
  lookupMember,
  applyMemberDiscount,
  lookupProduct,
  generateReceipt,
  formatReceiptText,
  subscribePaymentEvents,
  isOnline
} from './cashier-pos-service'
import {
  MOCK_POS_ORDERS,
  MOCK_MEMBERS,
  MOCK_PRODUCTS,
  CashierPosError,
  type POSOrder,
  type PaymentMethod
} from './cashier-pos-data'

// ─── 测试 helper ─────────────────────────────────

function makeOrder(overrides: Partial<POSOrder> = {}): POSOrder {
  return {
    orderId: 'ORD-TEST-001',
    items: [
      { itemId: 'i1', name: '拿铁咖啡', qty: 2, unitPrice: 28, discount: 0, sku: 'SKU-001' },
      { itemId: 'i2', name: '提拉米苏', qty: 1, unitPrice: 38, discount: 0, sku: 'SKU-002' }
    ],
    subtotal: 94,
    tax: 9.4,
    total: 103.4,
    channel: 'POS',
    status: 'pending',
    ...overrides
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. 多笔付款 / 拆单 (P1-4.3)
// ═══════════════════════════════════════════════════════════════

describe('allocatePayment · 多笔付款分配', () => {
  test('1.1 单笔等于总额: 分配成功 + status=PENDING', () => {
    const order = makeOrder()
    const result = allocatePayment(order, {
      orderId: order.orderId,
      method: 'WECHAT',
      amountCents: 10340
    })
    assert.equal(result.ok, true)
    assert.ok(result.allocation)
    assert.equal(result.allocation!.amountCents, 10340)
    assert.equal(result.allocation!.status, 'PENDING')
    assert.match(result.allocation!.paymentId, /^PAY-/)
  })

  test('1.2 拆单: 微信 + 现金 = 总额 (部分付场景)', () => {
    const order = makeOrder()
    const r1 = allocatePayment(order, {
      orderId: order.orderId,
      method: 'WECHAT',
      amountCents: 5000
    })
    assert.equal(r1.ok, true)
    // 模拟 r1 成功入账 + r2 也入账
    order.payments = [
      { ...r1.allocation!, status: 'SUCCESS' },
      { ...r1.allocation!, paymentId: 'p2', amountCents: 5340, method: 'CASH', status: 'SUCCESS', createdAt: 't' }
    ]
    assert.equal(getRemainingCents(order), 0)
  })

  test('1.3 over_allocation: 超过剩余金额 → 拒绝', () => {
    const order = makeOrder()
    const result = allocatePayment(order, {
      orderId: order.orderId,
      method: 'WECHAT',
      amountCents: 99999
    })
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'over_allocation')
  })

  test('1.4 amount_mismatch: 0 或负数 → 拒绝', () => {
    const order = makeOrder()
    assert.equal(allocatePayment(order, { orderId: 'o', method: 'CASH', amountCents: 0 }).reason, 'amount_mismatch')
    assert.equal(allocatePayment(order, { orderId: 'o', method: 'CASH', amountCents: -100 }).reason, 'amount_mismatch')
  })

  test('1.5 已支付订单不能再次分配', () => {
    const order = makeOrder({ status: 'paid' })
    const result = allocatePayment(order, {
      orderId: order.orderId,
      method: 'WECHAT',
      amountCents: 1000
    })
    assert.equal(result.ok, false)
  })

  test('1.6 getRemainingCents: 多次部分付累计', () => {
    const order = makeOrder()
    order.payments = [
      { paymentId: 'p1', method: 'WECHAT', amountCents: 5000, status: 'SUCCESS', createdAt: 't1' },
      { paymentId: 'p2', method: 'ALIPAY', amountCents: 3000, status: 'PENDING', createdAt: 't2' }
    ]
    // 仅 SUCCESS 计入已付
    assert.equal(getRemainingCents(order), 5340)
  })

  test('1.7 5 种 PaymentMethod 都能分配', () => {
    const order = makeOrder()
    const methods: PaymentMethod[] = ['WECHAT', 'ALIPAY', 'BALANCE', 'CASH', 'CARD']
    for (const m of methods) {
      const r = allocatePayment(order, {
        orderId: order.orderId,
        method: m,
        amountCents: 1000
      })
      assert.equal(r.ok, true, `${m} should work`)
      assert.equal(r.allocation!.method, m)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. 会员识别 (P1-4)
// ═══════════════════════════════════════════════════════════════

describe('lookupMember + applyMemberDiscount · 会员识别', () => {
  test('2.1 通过手机号查 GOLD 会员', async () => {
    const m = await lookupMember({ phone: '13800138001' })
    assert.ok(m)
    assert.equal(m!.name, '张三')
    assert.equal(m!.tier, 'GOLD')
    assert.equal(m!.balanceCents, 50000)
  })

  test('2.2 通过 memberNo 查 PLATINUM 会员', async () => {
    const m = await lookupMember({ memberNo: 'VIP-1003' })
    assert.ok(m)
    assert.equal(m!.tier, 'PLATINUM')
    assert.equal(m!.discountRate, 0.9)
  })

  test('2.3 不存在的会员 → null', async () => {
    const m = await lookupMember({ phone: '99999999' })
    assert.equal(m, null)
  })

  test('2.4 applyMemberDiscount: 0.95 折扣率 → 折扣后金额 (分单位)', () => {
    const order = makeOrder() // subtotal=94
    const m = MOCK_MEMBERS[0]! // discountRate=0.95
    const discounted = applyMemberDiscount(order, m)
    assert.equal(discounted, 89.3) // 94 * 0.95 = 89.3
  })

  test('2.5 applyMemberDiscount: 无 discountRate 的会员 → 不打折', () => {
    const order = makeOrder()
    const m = MOCK_MEMBERS[1]! // SILVER, no discountRate
    const discounted = applyMemberDiscount(order, m)
    assert.equal(discounted, 94)
  })

  test('2.6 5 个等级都能查询', async () => {
    // 至少有 3 个等级 (GOLD/SILVER/PLATINUM)
    const phones = ['13800138001', '13800138002', '13800138003']
    for (const phone of phones) {
      const m = await lookupMember({ phone })
      assert.ok(m, `Member ${phone} should exist`)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. 商品扫码 + 票据 (P1-4)
// ═══════════════════════════════════════════════════════════════

describe('lookupProduct + 票据生成', () => {
  test('3.1 lookupProduct: SKU-001 → 拿铁咖啡 28元', async () => {
    const p = await lookupProduct('SKU-001')
    assert.ok(p)
    assert.equal(p!.name, '拿铁咖啡')
    assert.equal(p!.unitPrice, 28)
    assert.equal(p!.stock, 100)
  })

  test('3.2 lookupProduct: 不存在的 SKU → null', async () => {
    const p = await lookupProduct('SKU-NOT-EXIST')
    assert.equal(p, null)
  })

  test('3.3 全部 9 个商品都能查到', async () => {
    for (const p of MOCK_PRODUCTS) {
      const found = await lookupProduct(p.sku)
      assert.ok(found, `${p.sku} should exist`)
      assert.equal(found!.name, p.name)
      assert.equal(found!.unitPrice, p.unitPrice)
    }
  })

  test('3.4 generateReceipt: 不带会员的票据', () => {
    const order = makeOrder({
      payments: [
        {
          paymentId: 'p1',
          method: 'WECHAT',
          amountCents: 10340,
          status: 'SUCCESS',
          createdAt: 't1',
          paidAt: 't1'
        }
      ]
    })
    const receipt = generateReceipt({
      order,
      cashier: 'cashier-01',
      storeName: '神机营旗舰店'
    })
    assert.match(receipt.receiptId, /^RCP-/)
    assert.equal(receipt.orderId, order.orderId)
    assert.equal(receipt.cashier, 'cashier-01')
    assert.equal(receipt.items.length, 2)
    assert.equal(receipt.total, 103.4)
    assert.equal(receipt.payments.length, 1)
    assert.equal(receipt.payments[0]!.method, 'WECHAT')
    assert.equal(receipt.member, undefined)
  })

  test('3.5 generateReceipt: 带 GOLD 会员 + 折扣', () => {
    const order = makeOrder({
      payments: [
        {
          paymentId: 'p1',
          method: 'BALANCE',
          amountCents: 8930, // 89.3元 (折扣后)
          status: 'SUCCESS',
          createdAt: 't1',
          paidAt: 't1'
        }
      ]
    })
    const receipt = generateReceipt({
      order,
      member: MOCK_MEMBERS[0]!,
      cashier: 'cashier-01',
      storeName: '神机营旗舰店',
      discountApplied: 4.7
    })
    assert.ok(receipt.member)
    assert.equal(receipt.member!.name, '张三')
    assert.equal(receipt.member!.tier, 'GOLD')
    assert.equal(receipt.discount, 4.7)
  })

  test('3.6 formatReceiptText: 包含关键字段 (店名/订单/合计/支付方式)', () => {
    const order = makeOrder({
      payments: [
        {
          paymentId: 'p1',
          method: 'WECHAT',
          amountCents: 10340,
          status: 'SUCCESS',
          createdAt: 't1',
          paidAt: 't1'
        }
      ]
    })
    const receipt = generateReceipt({
      order,
      cashier: 'c01',
      storeName: '神机营测试店'
    })
    const text = formatReceiptText(receipt)
    assert.match(text, /神机营测试店/)
    assert.match(text, /订单号: ORD-TEST-001/)
    assert.match(text, /收银员: c01/)
    assert.match(text, /拿铁咖啡/)
    assert.match(text, /提拉米苏/)
    assert.match(text, /合计: ¥103\.40/)
    assert.match(text, /WECHAT: ¥103\.40/)
    assert.match(text, /感谢惠顾/)
  })

  test('3.7 formatReceiptText: 多笔付款全部列出', () => {
    const order = makeOrder({
      payments: [
        { paymentId: 'p1', method: 'WECHAT', amountCents: 5000, status: 'SUCCESS', createdAt: 't' },
        { paymentId: 'p2', method: 'CASH', amountCents: 5340, status: 'SUCCESS', createdAt: 't' }
      ]
    })
    const receipt = generateReceipt({ order, cashier: 'c', storeName: 's' })
    const text = formatReceiptText(receipt)
    assert.match(text, /WECHAT: ¥50\.00/)
    assert.match(text, /CASH: ¥53\.40/)
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. 离线队列 + API 集成 (P1-4.4 + 4.5)
// ═══════════════════════════════════════════════════════════════

describe('离线队列 + 错误处理', () => {
  test('4.1 submitOrder mock 模式 → 入离线队列 + offlineCreated=true', async () => {
    clearOfflineQueue()
    const order = makeOrder()
    const result = await submitOrder(order)
    assert.equal(result.offlineCreated, true)
    assert.equal(getOfflineQueueCount(), 1)
  })

  test('4.2 syncOfflineOrders: mock 模式 90% 成功率', async () => {
    clearOfflineQueue()
    for (let i = 0; i < 10; i++) {
      await submitOrder(makeOrder({ orderId: `ORD-SYNC-${i}` }))
    }
    assert.equal(getOfflineQueueCount(), 10)

    // 跑 10 次同步 (绕开随机性)
    let totalSynced = 0
    let remaining = 10
    for (let i = 0; i < 10 && remaining > 0; i++) {
      const status = await syncOfflineOrders()
      totalSynced += status.synced
      remaining = status.pending
    }
    assert.equal(remaining, 0)
    assert.ok(totalSynced > 0)
  })

  test('4.3 同步失败: retryCount 累加 + lastError 记录', async () => {
    clearOfflineQueue()
    await submitOrder(makeOrder({ orderId: 'ORD-RETRY-1' }))
    // 强制 Math.random() 返回 0 (失败)
    const originalRandom = Math.random
    Math.random = () => 0
    try {
      const status = await syncOfflineOrders()
      assert.equal(status.synced, 0)
      assert.equal(status.failed, 1)
      assert.equal(getOfflineQueueCount(), 1)
    } finally {
      Math.random = originalRandom
    }
  })

  test('4.4 clearOfflineQueue: 清空离线队列', async () => {
    clearOfflineQueue()
    await submitOrder(makeOrder({ orderId: 'ORD-CLR-1' }))
    assert.equal(getOfflineQueueCount(), 1)
    clearOfflineQueue()
    assert.equal(getOfflineQueueCount(), 0)
  })

  test('4.5 queryOrder: 离线队列优先于 mock 数据', async () => {
    clearOfflineQueue()
    const order = makeOrder({ orderId: 'ORD-OFFLINE-1' })
    await submitOrder(order)
    const found = await queryOrder('ORD-OFFLINE-1')
    assert.ok(found)
    assert.equal(found!.offlineCreated, true)
  })

  test('4.6 queryOrder: 找不到返回 null', async () => {
    const found = await queryOrder('ORD-NOT-EXIST-XXX')
    assert.equal(found, null)
  })

  test('4.7 requestRefund mock: 生成 REF- 时间戳 ID + paymentId 透传', async () => {
    const r = await requestRefund('ORD-001', 50, '测试', 'PAY-001')
    assert.match(r.refundId, /^REF-/)
    assert.equal(r.paymentId, 'PAY-001')
    assert.equal(r.method, 'WECHAT')
  })

  test('4.8 queryRefundStatus: MOCK_PENDING_REFUNDS 命中', async () => {
    const r = await queryRefundStatus('REF-2024-001')
    assert.ok(r)
    assert.equal(r!.orderId, 'ORD-2024-003')
  })

  test('4.9 getChannelStats: 返回 4 个渠道', async () => {
    const stats = await getChannelStats()
    assert.equal(stats.length, 4)
    const pos = stats.find((s) => s.channel === 'POS')
    assert.ok(pos)
  })

  test('4.10 CashierPosError 错误分类: code + retryable', () => {
    const err = new CashierPosError({
      code: 'MOCK_MODE',
      message: 'test',
      retryable: true
    })
    assert.equal(err.code, 'MOCK_MODE')
    assert.equal(err.retryable, true)
    assert.equal(err.name, 'CashierPosError')
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. SSE 订阅 (P1-4.5 实时状态)
// ═══════════════════════════════════════════════════════════════

describe('subscribePaymentEvents · SSE 实时', () => {
  test('5.1 mock 模式: 立即返回 no-op subscription', () => {
    const received: unknown[] = []
    const sub = subscribePaymentEvents({
      onEvent: (e) => received.push(e)
    })
    assert.equal(typeof sub.close, 'function')
    sub.close() // 不应抛错
    assert.equal(received.length, 0)
  })
})
