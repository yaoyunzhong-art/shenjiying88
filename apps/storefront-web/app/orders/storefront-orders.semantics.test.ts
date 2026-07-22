import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getStorefrontOrderStatusLabel,
  mapAggregateToOrderDetailView,
  mapBusinessOrderToListView,
} from '../../lib/storefront-orders'

test('列表语义: 部分退款订单不应被折叠成已退款', () => {
  const view = mapBusinessOrderToListView({
    orderId: 'ord-partial',
    orderNo: 'ORD-PARTIAL-001',
    memberId: 'mem-001',
    itemCount: 1,
    totalAmount: 128,
    paidAmount: 128,
    refundedAmount: 50,
    currency: 'CNY',
    status: 'COMPLETED',
    paymentChannel: 'WECHAT_PAY',
    paymentStatus: 'SUCCEEDED',
    refundStatus: 'COMPLETED',
    createdAt: '2026-07-23T00:00:00.000Z',
    updatedAt: '2026-07-23T00:05:00.000Z',
    paidAt: '2026-07-23T00:03:00.000Z',
    refundRequestedAt: '2026-07-23T00:04:00.000Z',
    refundCompletedAt: '2026-07-23T00:05:00.000Z',
  })

  assert.equal(view.status, 'partially_refunded')
  assert.equal(getStorefrontOrderStatusLabel(view.status), '部分退款')
})

test('详情语义: 部分退款订单应保留支付成功并展示部分退款状态', () => {
  const detail = mapAggregateToOrderDetailView({
    order: {
      orderId: 'ord-detail-partial',
      orderNo: 'ORD-DETAIL-001',
      memberId: 'mem-001',
      totalAmount: 128,
      currency: 'CNY',
      status: 'PAID',
      items: [{ skuId: 'sku-001', quantity: 1, price: 128, title: 'Evidence Item' }],
      createdAt: '2026-07-23T00:00:00.000Z',
      updatedAt: '2026-07-23T00:06:00.000Z',
      paidAt: '2026-07-23T00:03:00.000Z',
    },
    payment: {
      paymentId: 'payment-001',
      channel: 'WECHAT_PAY',
      amount: 128,
      status: 'SUCCEEDED',
      completedAt: '2026-07-23T00:03:00.000Z',
    },
    refunds: [
      {
        refundId: 'refund-001',
        refundAmount: 50,
        reason: 'partial-refund',
        status: 'COMPLETED',
        requestedAt: '2026-07-23T00:04:00.000Z',
        completedAt: '2026-07-23T00:05:00.000Z',
      },
    ],
    memberNickname: 'Partial User',
  } as any)

  assert.equal(detail.status, 'partially_refunded')
  assert.equal(detail.statusLabel, '部分退款')
  assert.equal(detail.paymentStatusLabel, '支付成功')
  assert.equal(detail.refundedAmount, 50)
})
