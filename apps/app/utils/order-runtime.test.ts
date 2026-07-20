import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deriveAggregateRefundState,
  mergeRuntimeOrderIntoTarget,
  resolveRouteOrderScreenStatus,
  shouldPromoteOrderScreenStatus,
  type OrderRuntimeMergeTarget,
} from './order-runtime';

function createOrder(overrides?: Partial<OrderRuntimeMergeTarget>): OrderRuntimeMergeTarget {
  return {
    orderId: 'order-001',
    orderNo: 'ORD20260720001',
    totalAmount: 156,
    paidAmount: 156,
    refundedAmount: 0,
    status: 'PAID',
    createdAt: '2026-07-20T01:00:00.000Z',
    paidAt: '2026-07-20T01:05:00.000Z',
    paymentChannel: 'WECHAT_PAY',
    ...overrides,
  };
}

test('route refund status priority is refunded > pending > paid', () => {
  assert.equal(resolveRouteOrderScreenStatus({ orderId: 'order-001', refundStatus: 'REFUNDED' }), 'REFUNDED');
  assert.equal(resolveRouteOrderScreenStatus({ orderId: 'order-001', refundStatus: 'PENDING' }), 'REFUND_PENDING');
  assert.equal(resolveRouteOrderScreenStatus({ orderId: 'order-001', paymentStatus: 'PAID' }), 'PAID');
});

test('runtime status only promotes forward and never demotes refunded', () => {
  assert.equal(shouldPromoteOrderScreenStatus('REFUNDED', 'PAID'), false);
  assert.equal(shouldPromoteOrderScreenStatus('REFUND_PENDING', 'PAID'), false);
  assert.equal(shouldPromoteOrderScreenStatus('PAID', 'REFUND_PENDING'), true);
});

test('deriveAggregateRefundState ignores rejected refunds', () => {
  const result = deriveAggregateRefundState([
    {
      refundId: 'refund-rejected-001',
      orderId: 'order-001',
      paymentId: 'payment-001',
      memberId: 'member-001',
      refundAmount: 66,
      reason: '审核驳回',
      status: 'REJECTED',
      requestedAt: '2026-07-20T05:10:00.000Z',
    },
    {
      refundId: 'refund-complete-001',
      orderId: 'order-001',
      paymentId: 'payment-001',
      memberId: 'member-001',
      refundAmount: 45,
      reason: '门店已退',
      status: 'COMPLETED',
      requestedAt: '2026-07-20T05:00:00.000Z',
      completedAt: '2026-07-20T05:16:00.000Z',
    },
  ]);

  assert.equal(result.refundStatus, 'REFUNDED');
  assert.equal(result.latestRefund?.refundId, 'refund-complete-001');
});

test('mergeRuntimeOrderIntoTarget keeps real refunded state over stale paid route params', () => {
  const order = createOrder({
    status: 'REFUNDED',
    refundedAmount: 45,
    refundRequestedAt: '2026-07-20T05:00:00.000Z',
    refundCompletedAt: '2026-07-20T05:16:00.000Z',
  });

  const result = mergeRuntimeOrderIntoTarget(order, {
    orderId: 'order-001',
    paymentStatus: 'PAID',
    paymentAmount: 188,
    paymentPaidAt: '2026-07-20T04:00:00.000Z',
    paymentChannel: 'ALIPAY',
  });

  assert.equal(result.status, 'REFUNDED');
  assert.equal(result.refundedAmount, 45);
  assert.equal(result.paymentChannel, 'WECHAT_PAY');
});

test('mergeRuntimeOrderIntoTarget promotes pending refund when api has not caught up', () => {
  const result = mergeRuntimeOrderIntoTarget(createOrder(), {
    orderId: 'order-001',
    refundStatus: 'PENDING',
    refundRequestedAmount: 88.5,
    refundRequestedAt: '2026-07-20T06:00:00.000Z',
  });

  assert.equal(result.status, 'REFUND_PENDING');
  assert.equal(result.refundedAmount, 88.5);
  assert.equal(result.refundRequestedAt, '2026-07-20T06:00:00.000Z');
});
