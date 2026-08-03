import assert from 'node:assert/strict';
import test from 'node:test';
import type { NativeAppTransactionAggregate } from '../market-bootstrap';
import {
  buildOrderDetailBackToOrdersRouteParams,
  buildOrderDetailRouteParams,
  buildOrderDetailPaymentRouteParams,
  buildOrderDetailRefundRouteParams,
  buildOrdersRuntimeRouteParams,
  buildPaymentRouteParams,
  buildRefundRouteParams,
  getAggregateOrderFinancialSnapshot,
} from './order-finance';

function createAggregate(overrides?: Partial<NativeAppTransactionAggregate>): NativeAppTransactionAggregate {
  return {
    memberNickname: '测试会员',
    order: {
      orderId: 'order-001',
      orderNo: 'ORD20260720001',
      memberId: 'member-001',
      currency: 'CNY',
      totalAmount: 156,
      status: 'PAID',
      latestPaymentId: 'payment-001',
      createdAt: '2026-07-20T01:00:00.000Z',
      updatedAt: '2026-07-20T01:05:00.000Z',
      paidAt: '2026-07-20T01:05:00.000Z',
    },
    payment: {
      paymentId: 'payment-001',
      orderId: 'order-001',
      channel: 'wechat-pay',
      amount: 156,
      status: 'SUCCEEDED',
      createdAt: '2026-07-20T01:00:00.000Z',
      updatedAt: '2026-07-20T01:05:00.000Z',
      completedAt: '2026-07-20T01:05:00.000Z',
    },
    settlement: {
      settlementId: 'settlement-001',
      pointsEarned: 156,
      pointsBalance: 156,
    },
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: [],
    ...overrides,
  };
}

test('getAggregateOrderFinancialSnapshot excludes rejected refunds from reserved amount', () => {
  const snapshot = getAggregateOrderFinancialSnapshot(createAggregate({
    refunds: [
      {
        refundId: 'refund-001',
        orderId: 'order-001',
        paymentId: 'payment-001',
        memberId: 'member-001',
        refundAmount: 30,
        reason: '审核中',
        status: 'PENDING',
        requestedAt: '2026-07-20T02:00:00.000Z',
      },
      {
        refundId: 'refund-002',
        orderId: 'order-001',
        paymentId: 'payment-001',
        memberId: 'member-001',
        refundAmount: 20,
        reason: '驳回',
        status: 'REJECTED',
        requestedAt: '2026-07-20T02:10:00.000Z',
      },
    ],
  }));

  assert.equal(snapshot.paidAmount, 156);
  assert.equal(snapshot.reservedRefundAmount, 30);
  assert.equal(snapshot.refundableAmount, 126);
});

test('buildOrderDetailPaymentRouteParams prefers aggregate order values', () => {
  const params = buildOrderDetailPaymentRouteParams({
    orderId: 'order-001',
    orderNo: 'ORD-FALLBACK',
    aggregate: createAggregate(),
    paymentAmount: 88,
    paymentPaidAt: '2026-07-20T03:00:00.000Z',
    paymentChannel: 'ALIPAY',
  });

  assert.equal(params.orderNo, 'ORD20260720001');
  assert.equal(params.paymentAmount, 156);
  assert.equal(params.paymentPaidAt, '2026-07-20T01:05:00.000Z');
  assert.equal(params.paymentChannel, 'WECHAT_PAY');
});

test('buildPaymentRouteParams prefers linked order snapshot and normalizes channel', () => {
  const params = buildPaymentRouteParams({
    order: {
      orderId: 'order-009',
      orderNo: 'ORD20260720009',
      totalAmount: 299,
    },
    amount: 88,
    paymentChannel: 'ali-pay',
  });

  assert.deepEqual(params, {
    orderId: 'order-009',
    orderNo: 'ORD20260720009',
    amount: 299,
    paymentChannel: 'ALIPAY',
  });
});

test('buildOrderDetailRefundRouteParams infers refunded from completed fallback time', () => {
  const params = buildOrderDetailRefundRouteParams({
    orderId: 'order-001',
    orderNo: 'ORD20260720001',
    refundRequestedAmount: 66,
    refundReason: '线下退款',
    fallbackPaymentChannel: 'ALIPAY',
    fallbackRequestedAt: '2026-07-20T04:00:00.000Z',
    fallbackCompletedAt: '2026-07-20T04:08:00.000Z',
  });

  assert.equal(params.refundStatus, 'REFUNDED');
  assert.equal(params.refundRequestedAmount, 66);
  assert.equal(params.paymentChannel, 'ALIPAY');
  assert.equal(params.refundCompletedAt, '2026-07-20T04:08:00.000Z');
});

test('buildRefundRouteParams keeps refund reason while reusing linked order snapshot', () => {
  const params = buildRefundRouteParams({
    order: {
      orderId: 'order-010',
      orderNo: 'ORD20260720010',
      totalAmount: 128,
      paymentChannel: 'WECHAT_PAY',
    },
    reason: '顾客取消',
  });

  assert.deepEqual(params, {
    orderId: 'order-010',
    orderNo: 'ORD20260720010',
    amount: 128,
    reason: '顾客取消',
    paymentChannel: 'WECHAT_PAY',
  });
});

test('buildOrderDetailRouteParams carries payment and refund fields for refunded order summary', () => {
  const params = buildOrderDetailRouteParams({
    order: {
      orderId: 'order-011',
      orderNo: 'ORD20260720011',
      status: 'REFUNDED',
      totalAmount: 188,
      paidAmount: 188,
      refundedAmount: 66,
      paidAt: '2026-07-20T06:00:00.000Z',
      refundRequestedAt: '2026-07-20T06:10:00.000Z',
      refundCompletedAt: '2026-07-20T06:15:00.000Z',
      paymentChannel: 'ALIPAY',
    },
  });

  assert.deepEqual(params, {
    orderId: 'order-011',
    orderNo: 'ORD20260720011',
    paymentStatus: 'PAID',
    paymentAmount: 188,
    paymentPaidAt: '2026-07-20T06:00:00.000Z',
    paymentChannel: 'ALIPAY',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 66,
    refundRequestedAt: '2026-07-20T06:10:00.000Z',
    refundCompletedAt: '2026-07-20T06:15:00.000Z',
  });
});

test('buildOrdersRuntimeRouteParams returns normalized pending refund payload', () => {
  const params = buildOrdersRuntimeRouteParams({
    orderId: 'order-001',
    orderNo: 'ORD20260720001',
    totalAmount: 156,
    paidAt: '2026-07-20T01:05:00.000Z',
    paymentChannel: 'WECHAT_PAY',
    status: 'REFUND_PENDING',
    refundRequestedAmount: 45,
    refundReason: '待审核',
    refundRequestedAt: '2026-07-20T05:00:00.000Z',
  });

  assert.equal(params.paymentStatus, 'PAID');
  assert.equal(params.refundStatus, 'PENDING');
  assert.equal(params.refundRequestedAmount, 45);
  assert.equal(params.paymentChannel, 'WECHAT_PAY');
});

test('buildOrdersRuntimeRouteParams prefers linked order snapshot and normalizes channel', () => {
  const params = buildOrdersRuntimeRouteParams({
    order: {
      orderId: 'order-009',
      orderNo: 'ORD20260720009',
      totalAmount: 299,
      paymentChannel: 'wechat-pay',
    },
    totalAmount: 88,
    paidAt: '2026-07-20T08:00:00.000Z',
    paymentChannel: 'ALIPAY',
    status: 'PAID',
  });

  assert.deepEqual(params, {
    orderId: 'order-009',
    orderNo: 'ORD20260720009',
    paymentStatus: 'PAID',
    paymentAmount: 299,
    paymentPaidAt: '2026-07-20T08:00:00.000Z',
    paymentChannel: 'WECHAT_PAY',
  });
});

test('buildOrderDetailBackToOrdersRouteParams returns refunded payload from effective refund state', () => {
  const params = buildOrderDetailBackToOrdersRouteParams({
    order: {
      orderId: 'order-012',
      orderNo: 'ORD20260720012',
      status: 'REFUNDED',
      totalAmount: 199,
      paidAmount: 199,
      refundedAmount: 66,
      paidAt: '2026-07-20T09:00:00.000Z',
      refundRequestedAt: '2026-07-20T09:10:00.000Z',
      refundCompletedAt: '2026-07-20T09:18:00.000Z',
      paymentChannel: 'ALIPAY',
    },
    routeParams: {
      orderId: 'order-012',
      refundStatus: 'PENDING',
      refundRequestedAmount: 20,
      refundReason: '旧回带',
    },
    effectiveRefundStatus: 'REFUNDED',
    effectiveRefundAmount: 66,
    effectiveRefundReason: '门店退款完成',
    effectiveRefundRequestedAt: '2026-07-20T09:10:00.000Z',
    effectiveRefundCompletedAt: '2026-07-20T09:18:00.000Z',
  });

  assert.deepEqual(params, {
    orderId: 'order-012',
    orderNo: 'ORD20260720012',
    paymentStatus: 'PAID',
    paymentAmount: 199,
    paymentPaidAt: '2026-07-20T09:00:00.000Z',
    paymentChannel: 'ALIPAY',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 66,
    refundReason: '门店退款完成',
    refundRequestedAt: '2026-07-20T09:10:00.000Z',
    refundCompletedAt: '2026-07-20T09:18:00.000Z',
  });
});

test('buildOrderDetailBackToOrdersRouteParams returns undefined when no runtime handoff is needed', () => {
  const params = buildOrderDetailBackToOrdersRouteParams({
    order: {
      orderId: 'order-013',
      orderNo: 'ORD20260720013',
      status: 'PENDING',
      totalAmount: 88,
      paidAmount: 0,
      refundedAmount: 0,
      paymentChannel: 'WECHAT_PAY',
    },
  });

  assert.equal(params, undefined);
});
