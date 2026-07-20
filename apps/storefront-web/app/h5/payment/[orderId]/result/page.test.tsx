/**
 * h5/payment/[orderId]/result/page.test.tsx — 支付结果页测试
 * 验证: 真实订单状态映射、结果展示文案、操作按钮配置
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  RESULT_DISPLAY,
  getPaymentResultActions,
  mapAggregateToResultStatus,
  type StorefrontTransactionAggregate,
} from '../../../../../lib/storefront-transactions';

function createAggregate(status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired'): StorefrontTransactionAggregate {
  const base: StorefrontTransactionAggregate = {
    order: {
      orderId: 'order-001',
      orderNo: 'ORD20260720001',
      memberId: 'sf-member-13800138000',
      currency: 'CNY',
      totalAmount: 88,
      status: 'PENDING_PAYMENT',
      createdAt: '2026-07-20T10:00:00.000Z',
      updatedAt: '2026-07-20T10:00:00.000Z',
    },
    payment: {
      paymentId: 'payment-001',
      orderId: 'order-001',
      channel: 'WECHAT_PAY',
      amount: 88,
      status: 'PENDING',
      createdAt: '2026-07-20T10:00:00.000Z',
      updatedAt: '2026-07-20T10:00:00.000Z',
    },
    refunds: [],
  };

  switch (status) {
    case 'paid':
      return {
        ...base,
        order: { ...base.order, status: 'PAID', paidAt: '2026-07-20T10:05:00.000Z' },
        payment: { ...base.payment!, status: 'SUCCEEDED', completedAt: '2026-07-20T10:05:00.000Z' },
      };
    case 'failed':
      return {
        ...base,
        order: { ...base.order, status: 'PAYMENT_FAILED' },
        payment: { ...base.payment!, status: 'FAILED' },
      };
    case 'refunded':
      return {
        ...base,
        order: { ...base.order, status: 'PAID', paidAt: '2026-07-20T10:05:00.000Z' },
        payment: { ...base.payment!, status: 'SUCCEEDED', completedAt: '2026-07-20T10:05:00.000Z' },
        refunds: [
          {
            refundId: 'refund-001',
            orderId: 'order-001',
            paymentId: 'payment-001',
            memberId: 'sf-member-13800138000',
            refundAmount: 88,
            reason: '测试退款',
            status: 'COMPLETED',
            requestedAt: '2026-07-20T10:06:00.000Z',
            completedAt: '2026-07-20T10:08:00.000Z',
          },
        ],
      };
    case 'expired':
      return {
        ...base,
        order: {
          ...base.order,
          status: 'CLOSED',
          closeReason: 'PAYMENT_TIMEOUT',
          createdAt: '2026-07-20T08:00:00.000Z',
        },
      };
    case 'pending':
    default:
      return base;
  }
}

describe('PaymentResultPage helper - 结果映射', () => {
  it('paid 状态映射为 success', () => {
    assert.equal(mapAggregateToResultStatus(createAggregate('paid')), 'success');
  });

  it('failed 状态映射为 failed', () => {
    assert.equal(mapAggregateToResultStatus(createAggregate('failed')), 'failed');
  });

  it('expired 状态映射为 failed', () => {
    assert.equal(mapAggregateToResultStatus(createAggregate('expired')), 'failed');
  });

  it('pending 状态映射为 pending', () => {
    assert.equal(mapAggregateToResultStatus(createAggregate('pending')), 'pending');
  });

  it('refunded 状态仍映射为 success，避免误导成支付失败', () => {
    assert.equal(mapAggregateToResultStatus(createAggregate('refunded')), 'success');
  });
});

describe('PaymentResultPage helper - 文案展示', () => {
  it('success 文案完整', () => {
    assert.equal(RESULT_DISPLAY.success.icon, '✅');
    assert.equal(RESULT_DISPLAY.success.title, '支付成功');
    assert.equal(RESULT_DISPLAY.success.subtitle, '感谢您的支付，订单已确认');
  });

  it('failed 文案完整', () => {
    assert.equal(RESULT_DISPLAY.failed.icon, '❌');
    assert.equal(RESULT_DISPLAY.failed.title, '支付失败');
    assert.equal(RESULT_DISPLAY.failed.subtitle, '支付未完成，请稍后重试');
  });

  it('pending 文案完整', () => {
    assert.equal(RESULT_DISPLAY.pending.icon, '⏳');
    assert.equal(RESULT_DISPLAY.pending.title, '支付处理中');
    assert.equal(RESULT_DISPLAY.pending.subtitle, '正在等待支付结果确认');
  });
});

describe('PaymentResultPage helper - 操作按钮', () => {
  it('success 状态提供查看订单和返回首页', () => {
    const actions = getPaymentResultActions('success', 'order-001');
    assert.deepEqual(actions, [
      { label: '查看订单', href: '/h5/orders', variant: 'primary' },
      { label: '返回首页', href: '/h5', variant: 'secondary' },
    ]);
  });

  it('failed 状态提供重新支付', () => {
    const actions = getPaymentResultActions('failed', 'order-002');
    assert.deepEqual(actions, [
      { label: '重新支付', href: '/h5/payment/order-002', variant: 'primary' },
      { label: '返回首页', href: '/h5', variant: 'secondary' },
    ]);
  });

  it('pending 状态提供返回支付页与继续浏览', () => {
    const actions = getPaymentResultActions('pending', 'order-003');
    assert.deepEqual(actions, [
      { label: '返回支付页面', variant: 'secondary', action: 'back' },
      { label: '先逛逛其他', href: '/h5', variant: 'ghost' },
    ]);
  });
});
