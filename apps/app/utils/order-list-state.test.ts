import assert from 'node:assert/strict';
import test from 'node:test';
import type { OrderSummaryViewModel } from './order-view';
import {
  buildOrderListQuery,
  filterOrderListByStatus,
  mergePagedOrders,
} from './order-list-state';

function createOrderSummary(overrides?: Partial<OrderSummaryViewModel>): OrderSummaryViewModel {
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
    ...overrides,
  };
}

test('buildOrderListQuery maps refunded filter and date range', () => {
  (globalThis as {
    __mockOrderListNow?: string;
  }).__mockOrderListNow = '2026-07-21T12:00:00.000Z';

  try {
    const query = buildOrderListQuery('REFUNDED', 'LAST_7_DAYS', 3, 20);

    assert.deepEqual(query, {
      status: 'REFUNDED',
      page: 3,
      pageSize: 20,
      fromDate: '2026-07-15T12:00:00.000Z',
      toDate: '2026-07-21T12:00:00.000Z',
    });
  } finally {
    delete (globalThis as {
      __mockOrderListNow?: string;
    }).__mockOrderListNow;
  }
});

test('mergePagedOrders replaces duplicated orders and preserves append order', () => {
  const merged = mergePagedOrders(
    [
      createOrderSummary({
        orderId: 'order-001',
        orderNo: 'ORD20260721001',
        totalAmount: 156,
      }),
      createOrderSummary({
        orderId: 'order-002',
        orderNo: 'ORD20260721002',
        totalAmount: 88,
        paidAmount: 0,
        status: 'PENDING',
      }),
    ],
    [
      createOrderSummary({
        orderId: 'order-002',
        orderNo: 'ORD20260721002-R',
        totalAmount: 99,
        paidAmount: 99,
        status: 'PAID',
      }),
      createOrderSummary({
        orderId: 'order-003',
        orderNo: 'ORD20260721003',
        totalAmount: 66,
        paidAmount: 66,
      }),
    ],
  );

  assert.deepEqual(merged.map((order) => order.orderId), ['order-001', 'order-002', 'order-003']);
  assert.equal(merged[1]?.orderNo, 'ORD20260721002-R');
  assert.equal(merged[1]?.totalAmount, 99);
  assert.equal(merged[2]?.orderNo, 'ORD20260721003');
});

test('filterOrderListByStatus includes refund pending orders in refunded tab', () => {
  const orders = [
    createOrderSummary({ orderId: 'order-001', status: 'PAID' }),
    createOrderSummary({ orderId: 'order-002', status: 'REFUND_PENDING', refundedAmount: 20 }),
    createOrderSummary({ orderId: 'order-003', status: 'REFUNDED', refundedAmount: 30 }),
  ];

  const refundedOrders = filterOrderListByStatus(orders, 'REFUNDED');
  const allOrders = filterOrderListByStatus(orders, 'ALL');

  assert.deepEqual(refundedOrders.map((order) => order.orderId), ['order-002', 'order-003']);
  assert.equal(allOrders, orders);
});
