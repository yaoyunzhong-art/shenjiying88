import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  NativeAppOrderListItem,
  NativeAppTransactionAggregate,
} from '../market-bootstrap';
import {
  buildRuntimeFallbackOrderDetail,
  buildRuntimeFallbackOrderSummary,
  mapApiOrderToSummaryView,
  resolveCashierLinkedOrderViewState,
  resolveOrderDetailViewState,
  type OrderDetailViewModel,
} from './order-view';

function createBaseOrder(overrides?: Partial<OrderDetailViewModel>): OrderDetailViewModel {
  return {
    orderId: 'order-001',
    orderNo: 'ORD20260721001',
    totalAmount: 156,
    paidAmount: 156,
    refundedAmount: 0,
    currency: 'CNY',
    status: 'PAID',
    createdAt: '2026-07-21T01:00:00.000Z',
    paidAt: '2026-07-21T01:05:00.000Z',
    paymentChannel: 'WECHAT_PAY',
    itemCount: 2,
    memberId: 'member-001',
    memberNickname: '测试会员',
    items: [
      { skuId: 'sku-001', title: '拿铁', quantity: 1, price: 32 },
      { skuId: 'sku-002', title: '蛋糕', quantity: 1, price: 124 },
    ],
    pointsEarned: 156,
    ...overrides,
  };
}

function createAggregate(overrides?: Partial<NativeAppTransactionAggregate>): NativeAppTransactionAggregate {
  return {
    memberNickname: '接口会员',
    order: {
      orderId: 'order-001',
      orderNo: 'ORDAPI20260721001',
      memberId: 'member-api-001',
      items: [
        { skuId: 'sku-api-001', title: '燕麦拿铁', quantity: 2, price: 39 },
      ],
      currency: 'CNY',
      totalAmount: 188,
      status: 'PAID',
      latestPaymentId: 'payment-001',
      createdAt: '2026-07-21T02:00:00.000Z',
      updatedAt: '2026-07-21T02:10:00.000Z',
      paidAt: '2026-07-21T02:08:00.000Z',
    },
    payment: {
      paymentId: 'payment-001',
      orderId: 'order-001',
      channel: 'alipay',
      amount: 188,
      status: 'SUCCEEDED',
      createdAt: '2026-07-21T02:00:00.000Z',
      updatedAt: '2026-07-21T02:08:00.000Z',
      completedAt: '2026-07-21T02:08:00.000Z',
    },
    settlement: {
      settlementId: 'settlement-001',
      pointsEarned: 188,
      pointsBalance: 188,
    },
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: [],
    ...overrides,
  };
}

test('mapApiOrderToSummaryView normalizes status and payment channel', () => {
  const apiOrder: NativeAppOrderListItem = {
    orderId: 'order-002',
    orderNo: 'ORDAPI20260721002',
    memberId: 'member-002',
    status: 'REFUNDING',
    itemCount: 3,
    totalAmount: 120,
    paidAmount: 120,
    refundedAmount: 18,
    refundRequestedAt: '2026-07-21T03:00:00.000Z',
    paymentChannel: 'wechat-pay',
    currency: 'CNY',
    createdAt: '2026-07-21T02:50:00.000Z',
    updatedAt: '2026-07-21T03:00:00.000Z',
    paidAt: '2026-07-21T02:55:00.000Z',
  };

  const view = mapApiOrderToSummaryView(apiOrder);

  assert.equal(view.status, 'REFUND_PENDING');
  assert.equal(view.paymentChannel, 'WECHAT_PAY');
  assert.equal(view.refundedAmount, 18);
});

test('buildRuntimeFallbackOrderSummary preserves refunded timestamps', () => {
  const view = buildRuntimeFallbackOrderSummary({
    orderId: 'order-runtime-001',
    orderNo: 'ORDRUNTIME20260721001',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 66,
    refundRequestedAt: '2026-07-21T04:00:00.000Z',
    refundCompletedAt: '2026-07-21T04:06:00.000Z',
    paymentChannel: 'ALIPAY',
  });

  assert.equal(view?.status, 'REFUNDED');
  assert.equal(view?.refundedAmount, 66);
  assert.equal(view?.refundRequestedAt, '2026-07-21T04:00:00.000Z');
  assert.equal(view?.refundCompletedAt, '2026-07-21T04:06:00.000Z');
  assert.equal(view?.paymentChannel, 'ALIPAY');
});

test('buildRuntimeFallbackOrderDetail derives paid detail state from route params', () => {
  const view = buildRuntimeFallbackOrderDetail({
    orderId: 'order-detail-runtime-001',
    orderNo: 'ORDDETAIL20260721001',
    paymentStatus: 'PAID',
    paymentAmount: 128,
    paymentPaidAt: '2026-07-21T04:30:00.000Z',
    paymentChannel: 'cash',
  }, {
    paymentChannel: 'WECHAT_PAY',
    itemCount: 0,
    items: [],
  });

  assert.equal(view.orderId, 'order-detail-runtime-001');
  assert.equal(view.orderNo, 'ORDDETAIL20260721001');
  assert.equal(view.status, 'PAID');
  assert.equal(view.totalAmount, 128);
  assert.equal(view.paidAmount, 128);
  assert.equal(view.paymentChannel, 'CASH');
  assert.equal(view.paidAt, '2026-07-21T04:30:00.000Z');
});

test('buildRuntimeFallbackOrderDetail keeps refunded timestamps and default member info', () => {
  const view = buildRuntimeFallbackOrderDetail({
    orderId: 'order-detail-runtime-002',
    orderNo: 'ORDDETAIL20260721002',
    refundStatus: 'REFUNDED',
    refundRequestedAmount: 66,
    refundRequestedAt: '2026-07-21T04:35:00.000Z',
    refundCompletedAt: '2026-07-21T04:42:00.000Z',
  });

  assert.equal(view.status, 'REFUNDED');
  assert.equal(view.refundedAmount, 66);
  assert.equal(view.refundRequestedAt, '2026-07-21T04:35:00.000Z');
  assert.equal(view.refundCompletedAt, '2026-07-21T04:42:00.000Z');
  assert.equal(view.memberId, 'member-unknown');
  assert.equal(view.memberNickname, '未知会员');
});

test('resolveCashierLinkedOrderViewState falls back to route values without aggregate', () => {
  const state = resolveCashierLinkedOrderViewState({
    fallbackOrderId: 'order-route-001',
    fallbackOrderNo: 'ORDROUTE20260721001',
    fallbackAmount: 66.8,
    fallbackChannel: 'CASH',
  });

  assert.equal(state.orderId, 'order-route-001');
  assert.equal(state.orderNo, 'ORDROUTE20260721001');
  assert.equal(state.collectibleAmount, 66.8);
  assert.equal(state.refundableAmount, 66.8);
  assert.equal(state.paymentChannel, 'CASH');
  assert.equal(state.hasHydratedAggregate, false);
});

test('resolveCashierLinkedOrderViewState uses aggregate refundable snapshot when hydrated', () => {
  const state = resolveCashierLinkedOrderViewState({
    aggregate: createAggregate({
      refunds: [
        {
          refundId: 'refund-pending-001',
          orderId: 'order-001',
          paymentId: 'payment-001',
          memberId: 'member-api-001',
          refundAmount: 30,
          reason: '审核中',
          status: 'PENDING',
          requestedAt: '2026-07-21T03:00:00.000Z',
        },
        {
          refundId: 'refund-rejected-001',
          orderId: 'order-001',
          paymentId: 'payment-001',
          memberId: 'member-api-001',
          refundAmount: 10,
          reason: '驳回',
          status: 'REJECTED',
          requestedAt: '2026-07-21T03:05:00.000Z',
        },
      ],
    }),
  });

  assert.equal(state.orderNo, 'ORDAPI20260721001');
  assert.equal(state.collectibleAmount, 188);
  assert.equal(state.reservedRefundAmount, 30);
  assert.equal(state.refundableAmount, 158);
  assert.equal(state.paymentChannel, 'ALIPAY');
  assert.equal(state.hasHydratedAggregate, true);
});

test('resolveOrderDetailViewState promotes route payment over pending base order', () => {
  const state = resolveOrderDetailViewState(
    createBaseOrder({
      orderId: 'order-003',
      orderNo: 'ORD20260721003',
      status: 'PENDING',
      totalAmount: 89.5,
      paidAmount: 0,
      pointsEarned: 0,
      paidAt: undefined,
    }),
    null,
    {
      orderId: 'order-003',
      orderNo: 'ORD20260721003',
      paymentStatus: 'PAID',
      paymentAmount: 89.5,
      paymentPaidAt: '2026-07-21T05:10:00.000Z',
      paymentChannel: 'CASH',
    },
  );

  assert.equal(state.order.status, 'PAID');
  assert.equal(state.order.paidAmount, 89.5);
  assert.equal(state.order.paymentChannel, 'CASH');
  assert.equal(state.order.paidAt, '2026-07-21T05:10:00.000Z');
});

test('resolveOrderDetailViewState prefers aggregate refunded result over stale pending route params', () => {
  const state = resolveOrderDetailViewState(
    createBaseOrder(),
    createAggregate({
      refunds: [{
        refundId: 'refund-001',
        orderId: 'order-001',
        paymentId: 'payment-001',
        memberId: 'member-api-001',
        refundAmount: 80,
        reason: '门店退款完成',
        status: 'COMPLETED',
        requestedAt: '2026-07-21T06:00:00.000Z',
        completedAt: '2026-07-21T06:08:00.000Z',
      }],
    }),
    {
      orderId: 'order-001',
      refundStatus: 'PENDING',
      refundRequestedAmount: 20,
      refundReason: '旧回带原因',
      refundRequestedAt: '2026-07-21T05:59:00.000Z',
    },
  );

  assert.equal(state.order.status, 'REFUNDED');
  assert.equal(state.order.orderNo, 'ORDAPI20260721001');
  assert.equal(state.order.paymentChannel, 'ALIPAY');
  assert.equal(state.effectiveRefundStatus, 'REFUNDED');
  assert.equal(state.effectiveRefundAmount, 80);
  assert.equal(state.effectiveRefundReason, '门店退款完成');
  assert.equal(state.effectiveRefundCompletedAt, '2026-07-21T06:08:00.000Z');
});

test('resolveOrderDetailViewState ignores rejected aggregate refunds and keeps paid state', () => {
  const state = resolveOrderDetailViewState(
    createBaseOrder(),
    createAggregate({
      refunds: [{
        refundId: 'refund-rejected-001',
        orderId: 'order-001',
        paymentId: 'payment-001',
        memberId: 'member-api-001',
        refundAmount: 80,
        reason: '审核驳回',
        status: 'REJECTED',
        requestedAt: '2026-07-21T06:00:00.000Z',
      }],
    }),
    {
      orderId: 'order-001',
      paymentStatus: 'PAID',
      paymentAmount: 156,
      paymentPaidAt: '2026-07-21T01:05:00.000Z',
      paymentChannel: 'WECHAT_PAY',
    },
  );

  assert.equal(state.order.status, 'PAID');
  assert.equal(state.order.refundedAmount, 0);
  assert.equal(state.effectiveRefundStatus, undefined);
  assert.equal(state.effectiveRefundAmount, undefined);
});

test('resolveOrderDetailViewState prefers aggregate payment fields over stale route payment fallback', () => {
  const state = resolveOrderDetailViewState(
    createBaseOrder({
      status: 'PENDING',
      totalAmount: 99,
      paidAmount: 0,
      paidAt: undefined,
      paymentChannel: 'CASH',
      pointsEarned: 0,
    }),
    createAggregate(),
    {
      orderId: 'order-001',
      orderNo: 'ORD-STALE-001',
      paymentStatus: 'PAID',
      paymentAmount: 66,
      paymentPaidAt: '2026-07-21T01:30:00.000Z',
      paymentChannel: 'CASH',
    },
  );

  assert.equal(state.order.status, 'PAID');
  assert.equal(state.order.orderNo, 'ORDAPI20260721001');
  assert.equal(state.order.totalAmount, 188);
  assert.equal(state.order.paidAmount, 188);
  assert.equal(state.order.paymentChannel, 'ALIPAY');
  assert.equal(state.order.paidAt, '2026-07-21T02:08:00.000Z');
  assert.equal(state.order.pointsEarned, 188);
});
