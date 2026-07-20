import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultMockOrderDetail,
  resolveOrderDetailBaseOrder,
} from './order-detail-state';

test('resolveOrderDetailBaseOrder returns shared mock detail for known order', () => {
  const order = resolveOrderDetailBaseOrder({ orderId: 'order-002' });

  assert.equal(order.orderId, 'order-002');
  assert.equal(order.orderNo, 'ORD20260612002');
  assert.equal(order.status, 'PENDING');
  assert.equal(order.memberNickname, '李四');
  assert.equal(order.items[0]?.skuId, 'SKU101');
});

test('resolveOrderDetailBaseOrder builds shared runtime fallback for unknown order', () => {
  const order = resolveOrderDetailBaseOrder({
    orderId: 'order-runtime-004',
    orderNo: 'ORDRUNTIME20260721004',
    paymentStatus: 'PAID',
    paymentAmount: 88.8,
    paymentPaidAt: '2026-07-21T09:30:00.000Z',
    paymentChannel: 'cash',
  });

  assert.equal(order.orderId, 'order-runtime-004');
  assert.equal(order.orderNo, 'ORDRUNTIME20260721004');
  assert.equal(order.status, 'PAID');
  assert.equal(order.totalAmount, 88.8);
  assert.equal(order.paymentChannel, 'CASH');
  assert.equal(order.memberNickname, '未知会员');
  assert.deepEqual(order.items, []);
});

test('defaultMockOrderDetail exposes order-001 baseline fallback route seed', () => {
  assert.equal(defaultMockOrderDetail.orderId, 'order-001');
  assert.equal(defaultMockOrderDetail.orderNo, 'ORD20260612001');
});
