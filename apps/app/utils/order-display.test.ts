import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatOrderCurrencyAmount,
  formatOrderDateTime,
  getOrderRefundDisplay,
  getOrderStatusLabel,
} from './order-display';

test('getOrderStatusLabel maps refund pending status to localized label', () => {
  assert.equal(getOrderStatusLabel('REFUND_PENDING'), '退款审核中');
  assert.equal(getOrderStatusLabel('PAID'), '已完成');
});

test('formatOrderCurrencyAmount formats localized currencies', () => {
  assert.equal(formatOrderCurrencyAmount(88.5), '¥88.50');
  assert.equal(formatOrderCurrencyAmount(19.9, 'USD'), '$19.90');
});

test('getOrderRefundDisplay returns correct copy for pending and refunded states', () => {
  assert.deepEqual(getOrderRefundDisplay('PENDING'), {
    sectionTitle: '退款进度',
    statusLabel: '退款审核中',
    amountLabel: '申请金额',
  });

  assert.deepEqual(getOrderRefundDisplay('REFUNDED'), {
    sectionTitle: '退款结果',
    statusLabel: '已退款',
    amountLabel: '退款金额',
  });
});

test('formatOrderDateTime returns zh-CN formatted timestamp', () => {
  const formatted = formatOrderDateTime('2026-07-21T08:09:00.000Z');

  assert.ok(formatted.includes('2026'), '应包含年份');
  assert.ok(/08|8/.test(formatted), '应包含小时信息');
  assert.ok(/09|9/.test(formatted), '应包含分钟信息');
});
