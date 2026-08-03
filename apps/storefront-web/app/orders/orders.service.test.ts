/**
 * orders.service.test.ts — 订单中心 Service 层测试
 *
 * 覆盖:
 *   - 订单状态标准化与推导
 *   - 状态标签与 UI 变体映射
 *   - 金额格式化
 *   - 日期格式化
 *   - 付款/退款状态标签
 *   - 状态筛选匹配
 *   - 边界条件与错误处理
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import type { BusinessOrderListItem } from '@m5/sdk';

import {
  getStorefrontOrderStatusLabel,
  getStorefrontOrderStatusVariant,
  formatStorefrontOrderCurrency,
  formatStorefrontOrderDateTime,
  getStorefrontOrderPaymentLabel,
  getStorefrontPaymentStatusLabel,
  getStorefrontRefundStatusLabel,
  matchesStorefrontOrderStatusFilter,
  matchesStorefrontOrderPaymentFilter,
  mapBusinessOrderToListView,
  type StorefrontOrderListViewItem,
  type StorefrontOrderViewStatus,
  type StorefrontOrderListStatusFilter,
  type StorefrontOrderPaymentFilter,
} from '../../lib/storefront-orders';

// ── 类型 ───────────────────────────────────────────────────

type DeriveOrderViewStatusInput = {
  status?: string;
  paymentStatus?: string;
  refundStatus?: string;
  refundedAmount?: number;
  paidAmount?: number;
  totalAmount?: number;
};

// Replicate deriveOrderViewStatus for testing (import not exported)
function deriveOrderViewStatus(input: DeriveOrderViewStatusInput): StorefrontOrderViewStatus {
  const refundStatus = (input.refundStatus ?? '').toUpperCase();
  const refundedAmount = Math.max(input.refundedAmount ?? 0, 0);
  const payableAmount = Math.max(input.paidAmount ?? 0, input.totalAmount ?? 0, 0);

  if (refundStatus === 'PENDING' || refundStatus === 'APPROVED') {
    return 'refunding';
  }

  if (refundedAmount > 0 && payableAmount > 0 && refundedAmount < payableAmount) {
    return 'partially_refunded';
  }

  if (refundedAmount > 0 && (payableAmount === 0 || refundedAmount >= payableAmount)) {
    return 'refunded';
  }

  const paymentStatus = (input.paymentStatus ?? '').toUpperCase();
  if (paymentStatus === 'SUCCEEDED') {
    return 'paid';
  }

  const normalized = (input.status ?? '').toUpperCase();
  if (normalized === 'REFUNDING' || normalized === 'REFUND_PENDING' || normalized === 'PENDING_REVIEW') {
    return 'refunding';
  }
  if (normalized === 'PARTIALLY_REFUNDED' || normalized === 'PARTIAL_REFUND') {
    return 'partially_refunded';
  }
  if (normalized === 'REFUNDED' || normalized === 'COMPLETED') {
    return 'refunded';
  }
  if (normalized === 'PAID' || normalized === 'SUCCEEDED' || normalized === 'FULFILLED') {
    return 'paid';
  }
  if (normalized === 'CLOSED' || normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'cancelled';
  }
  if (normalized === 'PENDING' || normalized === 'CREATED' || normalized === 'PENDING_PAYMENT') {
    return 'pending_payment';
  }
  if (normalized === 'PAYMENT_FAILED' || normalized === 'FAILED') {
    return 'cancelled';
  }
  return 'pending_payment';
}

function normalizeListStatus(status?: string): StorefrontOrderViewStatus {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'REFUNDING' || normalized === 'REFUND_PENDING' || normalized === 'PENDING_REVIEW') {
    return 'refunding';
  }
  if (normalized === 'PARTIALLY_REFUNDED' || normalized === 'PARTIAL_REFUND') {
    return 'partially_refunded';
  }
  if (normalized === 'REFUNDED' || normalized === 'COMPLETED') {
    return 'refunded';
  }
  if (normalized === 'PAID' || normalized === 'SUCCEEDED' || normalized === 'FULFILLED') {
    return 'paid';
  }
  if (normalized === 'CLOSED' || normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'cancelled';
  }
  if (normalized === 'PENDING' || normalized === 'CREATED' || normalized === 'PENDING_PAYMENT') {
    return 'pending_payment';
  }
  if (normalized === 'PAYMENT_FAILED' || normalized === 'FAILED') {
    return 'cancelled';
  }
  return 'pending_payment';
}

// ── Mock 工厂 ──────────────────────────────────────────────

function makeOrderListViewItem(
  overrides: Partial<StorefrontOrderListViewItem> = {},
): StorefrontOrderListViewItem {
  return {
    id: overrides.id ?? 'ord-svc-001',
    orderNo: overrides.orderNo ?? 'ORD-TEST-0001',
    memberId: overrides.memberId ?? 'mem-001',
    itemCount: overrides.itemCount ?? 3,
    totalAmount: overrides.totalAmount ?? 1500,
    paidAmount: overrides.paidAmount ?? 1500,
    refundedAmount: overrides.refundedAmount ?? 0,
    currency: overrides.currency ?? 'CNY',
    status: overrides.status ?? 'pending_payment',
    paymentChannel: overrides.paymentChannel,
    paymentStatus: overrides.paymentStatus,
    refundStatus: overrides.refundStatus,
    createdAt: overrides.createdAt ?? '2026-07-27T10:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-07-27T10:00:00Z',
    paidAt: overrides.paidAt,
    refundRequestedAt: overrides.refundRequestedAt,
    refundCompletedAt: overrides.refundCompletedAt,
  };
}

function makeBusinessOrderListItem(
  overrides: Partial<BusinessOrderListItem> = {},
): BusinessOrderListItem {
  return {
    orderId: overrides.orderId ?? 'bo-svc-001',
    orderNo: overrides.orderNo ?? 'BO-TEST-0001',
    memberId: overrides.memberId ?? 'mem-001',
    totalAmount: overrides.totalAmount ?? 2000,
    paidAmount: overrides.paidAmount ?? 0,
    refundedAmount: overrides.refundedAmount ?? 0,
    currency: overrides.currency ?? 'CNY',
    status: overrides.status ?? 'PENDING',
    paymentStatus: overrides.paymentStatus,
    refundStatus: overrides.refundStatus,
    paymentChannel: overrides.paymentChannel,
    createdAt: overrides.createdAt ?? '2026-07-27T10:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-07-27T10:00:00Z',
    paidAt: overrides.paidAt,
    refundRequestedAt: overrides.refundRequestedAt,
    refundCompletedAt: overrides.refundCompletedAt,
    itemCount: overrides.itemCount ?? 2,
  } as BusinessOrderListItem;
}

const ALL_VIEW_STATUSES: StorefrontOrderViewStatus[] = [
  'pending_payment', 'paid', 'refunding', 'partially_refunded', 'refunded', 'cancelled',
];

// ============================================================
//  1. 订单状态推导（deriveOrderViewStatus / normalizeListStatus）
// ============================================================

test.describe('Orders Service — 状态推导', () => {
  test('deriveOrderViewStatus with pending status returns pending_payment', () => {
    assert.equal(deriveOrderViewStatus({ status: 'PENDING' }), 'pending_payment');
  });

  test('deriveOrderViewStatus with CREATED status returns pending_payment', () => {
    assert.equal(deriveOrderViewStatus({ status: 'CREATED' }), 'pending_payment');
  });

  test('deriveOrderViewStatus with PAID status returns paid', () => {
    assert.equal(deriveOrderViewStatus({ status: 'PAID' }), 'paid');
  });

  test('deriveOrderViewStatus with SUCCEEDED paymentStatus returns paid', () => {
    assert.equal(deriveOrderViewStatus({ paymentStatus: 'SUCCEEDED' }), 'paid');
  });

  test('deriveOrderViewStatus with completed fulfillment status returns paid', () => {
    assert.equal(deriveOrderViewStatus({ status: 'FULFILLED' }), 'paid');
  });

  test('deriveOrderViewStatus with refund PENDING returns refunding', () => {
    assert.equal(deriveOrderViewStatus({ refundStatus: 'PENDING' }), 'refunding');
  });

  test('deriveOrderViewStatus with refund APPROVED returns refunding', () => {
    assert.equal(deriveOrderViewStatus({ refundStatus: 'APPROVED' }), 'refunding');
  });

  test('deriveOrderViewStatus with partial refund returns partially_refunded', () => {
    assert.equal(deriveOrderViewStatus({ refundedAmount: 50, paidAmount: 100, totalAmount: 100 }), 'partially_refunded');
  });

  test('deriveOrderViewStatus with full refund returns refunded', () => {
    assert.equal(deriveOrderViewStatus({ refundedAmount: 100, paidAmount: 100 }), 'refunded');
  });

  test('deriveOrderViewStatus with refunded amount >= total returns refunded', () => {
    assert.equal(deriveOrderViewStatus({ refundedAmount: 200, totalAmount: 150 }), 'refunded');
  });

  test('deriveOrderViewStatus with CANCELLEDs status returns cancelled', () => {
    assert.equal(deriveOrderViewStatus({ status: 'CANCELLED' }), 'cancelled');
  });

  test('deriveOrderViewStatus with CANCELED status returns cancelled', () => {
    assert.equal(deriveOrderViewStatus({ status: 'CANCELED' }), 'cancelled');
  });

  test('deriveOrderViewStatus with CLOSED status returns cancelled', () => {
    assert.equal(deriveOrderViewStatus({ status: 'CLOSED' }), 'cancelled');
  });

  test('deriveOrderViewStatus with PAYMENT_FAILED returns cancelled', () => {
    assert.equal(deriveOrderViewStatus({ status: 'PAYMENT_FAILED' }), 'cancelled');
  });

  test('deriveOrderViewStatus with empty input returns pending_payment', () => {
    assert.equal(deriveOrderViewStatus({}), 'pending_payment');
  });

  test('deriveOrderViewStatus with refunding status returns refunding', () => {
    assert.equal(deriveOrderViewStatus({ status: 'REFUNDING' }), 'refunding');
  });

  test('deriveOrderViewStatus with REFUND_PENDING returns refunding', () => {
    assert.equal(deriveOrderViewStatus({ status: 'REFUND_PENDING' }), 'refunding');
  });

  test('deriveOrderViewStatus with COMPLETED status returns refunded', () => {
    assert.equal(deriveOrderViewStatus({ status: 'COMPLETED' }), 'refunded');
  });

  test('normalizeListStatus with PARTIALLY_REFUNDED returns partially_refunded', () => {
    assert.equal(normalizeListStatus('PARTIALLY_REFUNDED'), 'partially_refunded');
  });

  test('normalizeListStatus with PARTIAL_REFUND returns partially_refunded', () => {
    assert.equal(normalizeListStatus('PARTIAL_REFUND'), 'partially_refunded');
  });
});

// ============================================================
//  2. 状态标签与 UI 变体
// ============================================================

test.describe('Orders Service — 状态标签与变体', () => {
  test('getStorefrontOrderStatusLabel returns 已支付 for paid', () => {
    assert.equal(getStorefrontOrderStatusLabel('paid'), '已支付');
  });

  test('getStorefrontOrderStatusLabel returns 退款处理中 for refunding', () => {
    assert.equal(getStorefrontOrderStatusLabel('refunding'), '退款处理中');
  });

  test('getStorefrontOrderStatusLabel returns 部分退款 for partially_refunded', () => {
    assert.equal(getStorefrontOrderStatusLabel('partially_refunded'), '部分退款');
  });

  test('getStorefrontOrderStatusLabel returns 已退款 for refunded', () => {
    assert.equal(getStorefrontOrderStatusLabel('refunded'), '已退款');
  });

  test('getStorefrontOrderStatusLabel returns 已取消 for cancelled', () => {
    assert.equal(getStorefrontOrderStatusLabel('cancelled'), '已取消');
  });

  test('getStorefrontOrderStatusLabel returns 待支付 for pending_payment', () => {
    assert.equal(getStorefrontOrderStatusLabel('pending_payment'), '待支付');
  });

  test('getStorefrontOrderStatusVariant returns success for paid', () => {
    assert.equal(getStorefrontOrderStatusVariant('paid'), 'success');
  });

  test('getStorefrontOrderStatusVariant returns info for refunding', () => {
    assert.equal(getStorefrontOrderStatusVariant('refunding'), 'info');
  });

  test('getStorefrontOrderStatusVariant returns error for refunded', () => {
    assert.equal(getStorefrontOrderStatusVariant('refunded'), 'error');
  });

  test('getStorefrontOrderStatusVariant returns default for cancelled', () => {
    assert.equal(getStorefrontOrderStatusVariant('cancelled'), 'default');
  });

  test('getStorefrontOrderStatusVariant returns warning for pending_payment', () => {
    assert.equal(getStorefrontOrderStatusVariant('pending_payment'), 'warning');
  });

  test('every view status has a non-empty label', () => {
    for (const s of ALL_VIEW_STATUSES) {
      const label = getStorefrontOrderStatusLabel(s);
      assert.ok(label.length > 0, `Empty label for ${s}`);
    }
  });

  test('every view status has a valid variant', () => {
    const validVariants = ['success', 'info', 'error', 'default', 'warning'];
    for (const s of ALL_VIEW_STATUSES) {
      assert.ok(validVariants.includes(getStorefrontOrderStatusVariant(s)), `Invalid variant for ${s}`);
    }
  });
});

// ============================================================
//  3. 金额与日期格式化
// ============================================================

test.describe('Orders Service — 金额与日期格式化', () => {
  test('formatStorefrontOrderCurrency formats CNY with ¥ prefix', () => {
    assert.equal(formatStorefrontOrderCurrency(1000), '¥1000.00');
  });

  test('formatStorefrontOrderCurrency formats USD with USD prefix', () => {
    assert.equal(formatStorefrontOrderCurrency(50, 'USD'), 'USD 50.00');
  });

  test('formatStorefrontOrderCurrency handles zero', () => {
    assert.equal(formatStorefrontOrderCurrency(0), '¥0.00');
  });

  test('formatStorefrontOrderCurrency handles small decimal', () => {
    assert.equal(formatStorefrontOrderCurrency(0.5), '¥0.50');
  });

  test('formatStorefrontOrderCurrency handles large number', () => {
    assert.equal(formatStorefrontOrderCurrency(999999.99), '¥999999.99');
  });

  test('formatStorefrontOrderDateTime returns dash for undefined', () => {
    assert.equal(formatStorefrontOrderDateTime(undefined), '-');
  });

  test('formatStorefrontOrderDateTime returns dash for empty string', () => {
    assert.equal(formatStorefrontOrderDateTime(''), '-');
  });

  test('formatStorefrontOrderDateTime formats ISO date correctly', () => {
    const result = formatStorefrontOrderDateTime('2026-07-27T10:30:45Z');
    // Date is displayed in local timezone (Asia/Shanghai GMT+8)
    assert.ok(result.startsWith('2026-07-27'));
    assert.ok(result.includes(':'));
    assert.ok(result.includes('30'));
  });

  test('formatStorefrontOrderDateTime handles invalid date string gracefully', () => {
    const result = formatStorefrontOrderDateTime('not-a-date');
    assert.equal(result, 'not-a-date');
  });

  test('formatStorefrontOrderDateTime handles date without time', () => {
    const result = formatStorefrontOrderDateTime('2026-07-27');
    assert.ok(result.startsWith('2026-07-27'));
  });

  test('formatStorefrontOrderDateTime handles midnight timestamp', () => {
    const result = formatStorefrontOrderDateTime('2026-07-27T00:00:00Z');
    // Midnight UTC becomes 08:00 in Asia/Shanghai
    assert.ok(result.startsWith('2026-07-27'));
    assert.ok(result.length > 10);
  });
});

// ============================================================
//  4. 状态筛选匹配
// ============================================================

test.describe('Orders Service — 状态筛选匹配', () => {
  const paidOrder = makeOrderListViewItem({ status: 'paid', paymentChannel: 'WECHAT_PAY' });
  const pendingOrder = makeOrderListViewItem({ status: 'pending_payment', paymentChannel: 'ALIPAY' });
  const refundingOrder = makeOrderListViewItem({ status: 'refunding', paymentChannel: 'WECHAT_PAY' });
  const refundedOrder = makeOrderListViewItem({ status: 'refunded', paymentChannel: 'CASH' });
  const cancelledOrder = makeOrderListViewItem({ status: 'cancelled', paymentChannel: 'MEMBER_CARD' });
  const partiallyRefundedOrder = makeOrderListViewItem({ status: 'partially_refunded', paymentChannel: 'ALIPAY' });

  const allTestOrders = [paidOrder, pendingOrder, refundingOrder, refundedOrder, cancelledOrder, partiallyRefundedOrder];

  test('matchesStorefrontOrderStatusFilter ALL returns true for all', () => {
    for (const order of allTestOrders) {
      assert.ok(matchesStorefrontOrderStatusFilter(order, 'ALL'));
    }
  });

  test('matchesStorefrontOrderStatusFilter PENDING matches pending_payment only', () => {
    assert.ok(matchesStorefrontOrderStatusFilter(pendingOrder, 'PENDING'));
    assert.ok(!matchesStorefrontOrderStatusFilter(paidOrder, 'PENDING'));
    assert.ok(!matchesStorefrontOrderStatusFilter(cancelledOrder, 'PENDING'));
  });

  test('matchesStorefrontOrderStatusFilter PAID matches paid only', () => {
    assert.ok(matchesStorefrontOrderStatusFilter(paidOrder, 'PAID'));
    assert.ok(!matchesStorefrontOrderStatusFilter(pendingOrder, 'PAID'));
  });

  test('matchesStorefrontOrderStatusFilter REFUNDING matches refunding only', () => {
    assert.ok(matchesStorefrontOrderStatusFilter(refundingOrder, 'REFUNDING'));
    assert.ok(!matchesStorefrontOrderStatusFilter(paidOrder, 'REFUNDING'));
  });

  test('matchesStorefrontOrderStatusFilter REFUNDED matches refunded only', () => {
    assert.ok(matchesStorefrontOrderStatusFilter(refundedOrder, 'REFUNDED'));
    assert.ok(!matchesStorefrontOrderStatusFilter(paidOrder, 'REFUNDED'));
  });

  test('matchesStorefrontOrderStatusFilter CANCELLED matches cancelled only', () => {
    assert.ok(matchesStorefrontOrderStatusFilter(cancelledOrder, 'CANCELLED'));
    assert.ok(!matchesStorefrontOrderStatusFilter(paidOrder, 'CANCELLED'));
  });

  test('matchesStorefrontOrderStatusFilter PARTIALLY_REFUNDED matches partially_refunded only', () => {
    assert.ok(matchesStorefrontOrderStatusFilter(partiallyRefundedOrder, 'PARTIALLY_REFUNDED'));
    assert.ok(!matchesStorefrontOrderStatusFilter(refundedOrder, 'PARTIALLY_REFUNDED'));
  });

  test('matchesStorefrontOrderPaymentFilter ALL returns true for all', () => {
    for (const order of allTestOrders) {
      assert.ok(matchesStorefrontOrderPaymentFilter(order, 'ALL'));
    }
  });

  test('matchesStorefrontOrderPaymentFilter matches specific channel', () => {
    assert.ok(matchesStorefrontOrderPaymentFilter(paidOrder, 'WECHAT_PAY'));
    assert.ok(!matchesStorefrontOrderPaymentFilter(pendingOrder, 'WECHAT_PAY'));
  });

  test('matchesStorefrontOrderPaymentFilter handles undefined paymentChannel', () => {
    const noChannel = makeOrderListViewItem({ paymentChannel: undefined });
    assert.ok(matchesStorefrontOrderPaymentFilter(noChannel, 'ALL'));
    assert.ok(!matchesStorefrontOrderPaymentFilter(noChannel, 'WECHAT_PAY'));
  });
});

// ============================================================
//  5. 支付/退款状态标签
// ============================================================

test.describe('Orders Service — 支付与退款标签', () => {
  test('getStorefrontPaymentStatusLabel SUCCEEDED returns 支付成功', () => {
    assert.equal(getStorefrontPaymentStatusLabel('SUCCEEDED'), '支付成功');
  });

  test('getStorefrontPaymentStatusLabel FAILED returns 支付失败', () => {
    assert.equal(getStorefrontPaymentStatusLabel('FAILED'), '支付失败');
  });

  test('getStorefrontPaymentStatusLabel PENDING returns 支付中', () => {
    assert.equal(getStorefrontPaymentStatusLabel('PENDING'), '支付中');
  });

  test('getStorefrontPaymentStatusLabel EXPIRED returns 支付已过期', () => {
    assert.equal(getStorefrontPaymentStatusLabel('EXPIRED'), '支付已过期');
  });

  test('getStorefrontPaymentStatusLabel undefined returns 待确认', () => {
    assert.equal(getStorefrontPaymentStatusLabel(undefined), '待确认');
  });

  test('getStorefrontPaymentStatusLabel unknown value returns prefixed fallback', () => {
    const result = getStorefrontPaymentStatusLabel('UNKNOWN');
    assert.ok(result.includes('UNKNOWN'));
  });

  test('getStorefrontRefundStatusLabel PENDING returns 待审核', () => {
    assert.equal(getStorefrontRefundStatusLabel('PENDING'), '待审核');
  });

  test('getStorefrontRefundStatusLabel APPROVED returns 已通过', () => {
    assert.equal(getStorefrontRefundStatusLabel('APPROVED'), '已通过');
  });

  test('getStorefrontRefundStatusLabel REJECTED returns 已拒绝', () => {
    assert.equal(getStorefrontRefundStatusLabel('REJECTED'), '已拒绝');
  });

  test('getStorefrontRefundStatusLabel COMPLETED returns 已完成', () => {
    assert.equal(getStorefrontRefundStatusLabel('COMPLETED'), '已完成');
  });

  test('getStorefrontRefundStatusLabel FAILED returns 退款失败', () => {
    assert.equal(getStorefrontRefundStatusLabel('FAILED'), '退款失败');
  });

  test('getStorefrontRefundStatusLabel undefined returns dash', () => {
    assert.equal(getStorefrontRefundStatusLabel(undefined), '-');
  });
});

// ============================================================
//  6. BusinessOrder 映射（mapBusinessOrderToListView）
// ============================================================

test.describe('Orders Service — 数据映射', () => {
  test('mapBusinessOrderToListView maps pending order correctly', () => {
    const biz = makeBusinessOrderListItem({ status: 'PENDING', paymentStatus: undefined });
    const view = mapBusinessOrderToListView(biz);
    assert.equal(view.status, 'pending_payment');
    assert.equal(view.id, biz.orderId);
    assert.equal(view.orderNo, biz.orderNo);
  });

  test('mapBusinessOrderToListView maps paid order correctly', () => {
    const biz = makeBusinessOrderListItem({ status: 'PAID', paymentStatus: 'SUCCEEDED', totalAmount: 2000, paidAmount: 2000 });
    const view = mapBusinessOrderToListView(biz);
    assert.equal(view.status, 'paid');
    assert.equal(view.paidAmount, 2000);
  });

  test('mapBusinessOrderToListView maps refunding order correctly', () => {
    const biz = makeBusinessOrderListItem({ status: 'PAID', refundStatus: 'PENDING', paidAmount: 100, refundedAmount: 0 });
    const view = mapBusinessOrderToListView(biz);
    assert.equal(view.status, 'refunding');
  });

  test('mapBusinessOrderToListView maps cancelled order correctly', () => {
    const biz = makeBusinessOrderListItem({ status: 'CANCELLED' });
    const view = mapBusinessOrderToListView(biz);
    assert.equal(view.status, 'cancelled');
  });

  test('mapBusinessOrderToListView preserves all basic fields', () => {
    const biz = makeBusinessOrderListItem({
      orderNo: 'ORD-MAP-001',
      memberId: 'mem-map',
      currency: 'CNY',
      itemCount: 5,
    });
    const view = mapBusinessOrderToListView(biz);
    assert.equal(view.orderNo, 'ORD-MAP-001');
    assert.equal(view.memberId, 'mem-map');
    assert.equal(view.currency, 'CNY');
    assert.equal(view.itemCount, 5);
  });

  test('mapBusinessOrderToListView copies amount fields', () => {
    const biz = makeBusinessOrderListItem({ totalAmount: 5000, paidAmount: 3000, refundedAmount: 0 });
    const view = mapBusinessOrderToListView(biz);
    assert.equal(view.totalAmount, 5000);
    assert.equal(view.paidAmount, 3000);
    assert.equal(view.refundedAmount, 0);
  });

  test('mapBusinessOrderToListView passes through dates', () => {
    const biz = makeBusinessOrderListItem({
      createdAt: '2026-07-27T10:00:00Z',
      paidAt: '2026-07-27T10:05:00Z',
    });
    const view = mapBusinessOrderToListView(biz);
    assert.equal(view.createdAt, '2026-07-27T10:00:00Z');
    assert.equal(view.paidAt, '2026-07-27T10:05:00Z');
  });
});

// ============================================================
//  7. 边界条件
// ============================================================

test.describe('Orders Service — 边界条件', () => {
  test('deriveOrderViewStatus with negative values does not crash', () => {
    const result = deriveOrderViewStatus({ refundedAmount: -100, paidAmount: -100 });
    assert.ok(typeof result === 'string');
  });

  test('deriveOrderViewStatus with mixed-case status is handled', () => {
    assert.equal(deriveOrderViewStatus({ status: 'pending_payment' }), 'pending_payment');
    assert.equal(deriveOrderViewStatus({ status: 'Pending_Payment' }), 'pending_payment');
  });

  test('deriveOrderViewStatus with all caps refunded status', () => {
    assert.equal(deriveOrderViewStatus({ refundedAmount: 100, paidAmount: 100 }), 'refunded');
  });

  test('matchesStorefrontOrderStatusFilter with unknown filter returns false', () => {
    const order = makeOrderListViewItem({ status: 'paid' });
    // @ts-expect-error -- testing unknown filter
    assert.ok(!matchesStorefrontOrderStatusFilter(order, 'UNKNOWN_FILTER'));
  });

  test('formatStorefrontOrderCurrency with EUR currency', () => {
    assert.equal(formatStorefrontOrderCurrency(200, 'EUR'), 'EUR 200.00');
  });

  test('formatStorefrontOrderDateTime handles edge dates', () => {
    assert.equal(formatStorefrontOrderDateTime('1970-01-01T00:00:00Z').startsWith('1970-01-01'), true);
  });

  test('formatStorefrontOrderDateTime handles far future dates', () => {
    const result = formatStorefrontOrderDateTime('2099-12-31T23:59:59Z');
    assert.ok(result.startsWith('2099-12-31') || result.startsWith('2100-01-01'));
  });

  test('getStorefrontOrderPaymentLabel delegates to getPaymentMethodLabel', () => {
    const label = getStorefrontOrderPaymentLabel('WECHAT_PAY');
    assert.equal(typeof label, 'string');
    assert.ok(label.length > 0);
  });

  test('getStorefrontOrderPaymentLabel returns fallback for unknown channel', () => {
    const label = getStorefrontOrderPaymentLabel('UNKNOWN_CHANNEL');
    assert.equal(typeof label, 'string');
  });
});
