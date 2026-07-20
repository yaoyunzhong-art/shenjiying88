import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrderMemberSection,
  buildOrderPaymentSection,
  buildOrderRefundSection,
  buildOrderStatusSection,
  type OrderDetailSection,
} from './order-detail-sections';
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
    items: [],
    pointsEarned: 156,
    ...overrides,
  };
}

function getRow(section: OrderDetailSection, label: string) {
  return section.rows.find((row) => row.label === label);
}

test('buildOrderStatusSection returns localized status row and paid timestamp', () => {
  const section = buildOrderStatusSection(createOrder({
    status: 'REFUND_PENDING',
  }));

  assert.equal(section.title, '订单状态');
  assert.equal(getRow(section, '订单状态')?.value, '退款审核中');
  assert.equal(getRow(section, '订单状态')?.valueTone, 'info');
  assert.ok(getRow(section, '支付时间')?.value.includes('2026'));
});

test('buildOrderRefundSection returns refunded rows with success tone', () => {
  const section = buildOrderRefundSection({
    effectiveRefundStatus: 'REFUNDED',
    effectiveRefundAmount: 66,
    effectiveRefundReason: '门店退款完成',
    effectiveRefundRequestedAt: '2026-07-21T02:00:00.000Z',
    effectiveRefundCompletedAt: '2026-07-21T02:08:00.000Z',
  });

  assert.equal(section?.title, '退款结果');
  assert.equal(getRow(section!, '退款状态')?.value, '已退款');
  assert.equal(getRow(section!, '退款状态')?.valueTone, 'success');
  assert.equal(getRow(section!, '退款金额')?.value, '¥66.00');
  assert.ok(getRow(section!, '完成时间')?.value.includes('2026'));
});

test('buildOrderPaymentSection normalizes channel and points rows', () => {
  const section = buildOrderPaymentSection(createOrder({
    paymentChannel: 'ALIPAY',
    pointsEarned: 188,
    totalAmount: 188,
  }));

  assert.equal(section.title, '支付信息');
  assert.equal(getRow(section, '支付方式')?.value, '支付宝');
  assert.equal(getRow(section, '支付金额')?.value, '¥188.00');
  assert.equal(getRow(section, '获得积分')?.value, '+188');
  assert.equal(getRow(section, '获得积分')?.valueTone, 'warning');
});

test('buildOrderMemberSection returns member rows', () => {
  const section = buildOrderMemberSection(createOrder({
    memberId: 'member-api-001',
    memberNickname: '接口会员一号',
  }));

  assert.equal(section.title, '会员信息');
  assert.equal(getRow(section, '会员ID')?.value, 'member-api-001');
  assert.equal(getRow(section, '会员昵称')?.value, '接口会员一号');
});
