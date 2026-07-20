import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrderDetailItemRows,
} from './order-detail-items';
import type { OrderDetailViewModel } from './order-view';

function createOrder(overrides?: Partial<OrderDetailViewModel>): OrderDetailViewModel {
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
      { skuId: 'sku-001', title: '拿铁', quantity: 2, price: 32 },
      { skuId: 'sku-002', title: '蛋糕', quantity: 1, price: 124 },
    ],
    pointsEarned: 156,
    ...overrides,
  };
}

test('buildOrderDetailItemRows returns localized sku, price, quantity and divider state', () => {
  const rows = buildOrderDetailItemRows(createOrder());

  assert.deepEqual(rows, [
    {
      key: 'sku-001',
      title: '拿铁',
      skuLabel: 'SKU: sku-001',
      priceLabel: '¥32.00',
      quantityLabel: 'x2',
      showDivider: true,
    },
    {
      key: 'sku-002',
      title: '蛋糕',
      skuLabel: 'SKU: sku-002',
      priceLabel: '¥124.00',
      quantityLabel: 'x1',
      showDivider: false,
    },
  ]);
});

test('buildOrderDetailItemRows respects order currency', () => {
  const rows = buildOrderDetailItemRows(createOrder({
    currency: 'USD',
    items: [
      { skuId: 'sku-usd-001', title: 'Cold Brew', quantity: 3, price: 19.9 },
    ],
  }));

  assert.equal(rows[0]?.priceLabel, '$19.90');
  assert.equal(rows[0]?.quantityLabel, 'x3');
  assert.equal(rows[0]?.showDivider, false);
});
