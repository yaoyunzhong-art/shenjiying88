import { createBusinessClient, getDefaultApiBaseUrl, type BusinessOrderListItem } from '@m5/sdk';
import {
  buildStorefrontScopeHeaders,
  getPaymentMethodLabel,
  resolveStorefrontScope,
  type StorefrontScope,
  type StorefrontTransactionAggregate,
} from './storefront-transactions';

export type StorefrontOrderListStatusFilter =
  'ALL' | 'PENDING' | 'PAID' | 'REFUNDING' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'CANCELLED';
export type StorefrontOrderPaymentFilter = 'ALL' | 'WECHAT_PAY' | 'ALIPAY' | 'CASH' | 'MEMBER_CARD';
export type StorefrontOrderViewStatus =
  'pending_payment' | 'paid' | 'refunding' | 'partially_refunded' | 'refunded' | 'cancelled';

export interface StorefrontOrderListViewItem {
  id: string;
  orderNo: string;
  memberId: string;
  itemCount: number;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  currency: string;
  status: StorefrontOrderViewStatus;
  paymentChannel?: string;
  paymentStatus?: string;
  refundStatus?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
}

export interface StorefrontOrderDetailView {
  orderId: string;
  orderNo: string;
  memberId: string;
  status: StorefrontOrderViewStatus;
  statusLabel: string;
  statusTone: 'warning' | 'info' | 'success' | 'error' | 'default';
  currency: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  paymentChannelLabel: string;
  paymentStatusLabel: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  closeReason?: string;
  memberNickname?: string;
  refundStatusLabel?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
  items: Array<{
    skuId: string;
    title: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  refundPaymentId?: string;
  refunds: Array<{
    refundId: string;
    amount: number;
    reason: string;
    status: string;
    requestedAt: string;
    completedAt?: string;
  }>;
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

function deriveOrderViewStatus(input: {
  status?: string;
  paymentStatus?: string;
  refundStatus?: string;
  refundedAmount?: number;
  paidAmount?: number;
  totalAmount?: number;
}): StorefrontOrderViewStatus {
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

  return normalizeListStatus(input.status);
}

export function getStorefrontOrderStatusLabel(status: StorefrontOrderViewStatus): string {
  switch (status) {
    case 'paid':
      return '已支付';
    case 'refunding':
      return '退款处理中';
    case 'partially_refunded':
      return '部分退款';
    case 'refunded':
      return '已退款';
    case 'cancelled':
      return '已取消';
    case 'pending_payment':
    default:
      return '待支付';
  }
}

export function getStorefrontOrderStatusVariant(
  status: StorefrontOrderViewStatus,
): 'warning' | 'info' | 'success' | 'error' | 'default' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'refunding':
      return 'info';
    case 'partially_refunded':
      return 'info';
    case 'refunded':
      return 'error';
    case 'cancelled':
      return 'default';
    case 'pending_payment':
    default:
      return 'warning';
  }
}

export function formatStorefrontOrderCurrency(amount: number, currency = 'CNY'): string {
  const prefix = currency === 'CNY' ? '¥' : `${currency} `;
  return `${prefix}${amount.toFixed(2)}`;
}

export function formatStorefrontOrderDateTime(date?: string): string {
  if (!date) {
    return '-';
  }

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export function getStorefrontOrderPaymentLabel(paymentChannel?: string): string {
  return getPaymentMethodLabel(paymentChannel);
}

export function getStorefrontPaymentStatusLabel(status?: string): string {
  switch ((status ?? '').toUpperCase()) {
    case 'SUCCEEDED':
      return '支付成功';
    case 'FAILED':
      return '支付失败';
    case 'PENDING':
      return '支付中';
    case 'EXPIRED':
      return '支付已过期';
    default:
      return status ? `支付${status}` : '待确认';
  }
}

export function getStorefrontRefundStatusLabel(status?: string): string {
  switch ((status ?? '').toUpperCase()) {
    case 'PENDING':
      return '待审核';
    case 'APPROVED':
      return '已通过';
    case 'REJECTED':
      return '已拒绝';
    case 'COMPLETED':
      return '已完成';
    case 'FAILED':
      return '退款失败';
    default:
      return status ? `退款${status}` : '-';
  }
}

export function mapBusinessOrderToListView(
  order: BusinessOrderListItem,
): StorefrontOrderListViewItem {
  return {
    id: order.orderId,
    orderNo: order.orderNo,
    memberId: order.memberId,
    itemCount: order.itemCount ?? 0,
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount,
    refundedAmount: order.refundedAmount,
    currency: order.currency,
    status: deriveOrderViewStatus({
      status: order.status,
      paymentStatus: order.paymentStatus,
      refundStatus: order.refundStatus,
      refundedAmount: order.refundedAmount,
      paidAmount: order.paidAmount,
      totalAmount: order.totalAmount,
    }),
    paymentChannel: order.paymentChannel,
    paymentStatus: order.paymentStatus,
    refundStatus: order.refundStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt,
    refundRequestedAt: order.refundRequestedAt,
    refundCompletedAt: order.refundCompletedAt,
  };
}

export function matchesStorefrontOrderStatusFilter(
  order: StorefrontOrderListViewItem,
  filter: StorefrontOrderListStatusFilter,
): boolean {
  if (filter === 'ALL') {
    return true;
  }

  if (filter === 'PENDING') {
    return order.status === 'pending_payment';
  }

  if (filter === 'PAID') {
    return order.status === 'paid';
  }

  if (filter === 'REFUNDING') {
    return order.status === 'refunding';
  }

  if (filter === 'PARTIALLY_REFUNDED') {
    return order.status === 'partially_refunded';
  }

  if (filter === 'REFUNDED') {
    return order.status === 'refunded';
  }

  return order.status === 'cancelled';
}

export function matchesStorefrontOrderPaymentFilter(
  order: StorefrontOrderListViewItem,
  filter: StorefrontOrderPaymentFilter,
): boolean {
  if (filter === 'ALL') {
    return true;
  }
  return order.paymentChannel === filter;
}

export async function loadStorefrontOrders(scope?: StorefrontScope) {
  const resolvedScope = resolveStorefrontScope(scope);
  const payload = await createBusinessClient(getDefaultApiBaseUrl()).orders.listPage(
    {
      page: 1,
      pageSize: 100,
    },
    {
      cache: 'no-store',
      headers: buildStorefrontScopeHeaders(resolvedScope),
    },
  );

  return payload.items.map(mapBusinessOrderToListView);
}

export function mapAggregateToOrderDetailView(
  aggregate: StorefrontTransactionAggregate,
): StorefrontOrderDetailView {
  const completedRefunds = aggregate.refunds.filter((refund) => refund.status === 'COMPLETED');
  const refundedAmount = completedRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0);
  const latestRefund = aggregate.refunds.at(-1);
  const paidAmount = aggregate.payment?.amount ?? (aggregate.order.paidAt ? aggregate.order.totalAmount : 0);
  const normalizedStatus = deriveOrderViewStatus({
    status: aggregate.order.status,
    paymentStatus: aggregate.payment?.status,
    refundStatus: latestRefund?.status,
    refundedAmount,
    paidAmount,
    totalAmount: aggregate.order.totalAmount,
  });
  const items = (aggregate.order.items ?? []).map((item) => ({
    skuId: item.skuId,
    title: item.title ?? item.skuId,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }));

  return {
    orderId: aggregate.order.orderId,
    orderNo: aggregate.order.orderNo ?? aggregate.order.orderId,
    memberId: aggregate.order.memberId,
    status: normalizedStatus,
    statusLabel: getStorefrontOrderStatusLabel(normalizedStatus),
    statusTone: getStorefrontOrderStatusVariant(normalizedStatus),
    currency: aggregate.order.currency,
    totalAmount: aggregate.order.totalAmount,
    paidAmount,
    refundedAmount,
    paymentChannelLabel: getStorefrontOrderPaymentLabel(aggregate.payment?.channel),
    paymentStatusLabel: getStorefrontPaymentStatusLabel(aggregate.payment?.status),
    createdAt: aggregate.order.createdAt,
    updatedAt: aggregate.order.updatedAt,
    paidAt: aggregate.payment?.completedAt ?? aggregate.order.paidAt,
    closeReason: aggregate.order.closeReason,
    memberNickname: aggregate.memberNickname,
    refundPaymentId: aggregate.payment?.paymentId,
    refundStatusLabel: completedRefunds.length > 0
      ? getStorefrontRefundStatusLabel('COMPLETED')
      : getStorefrontRefundStatusLabel(latestRefund?.status),
    refundRequestedAt: latestRefund?.requestedAt,
    refundCompletedAt: completedRefunds.at(-1)?.completedAt,
    items,
    refunds: aggregate.refunds.map((refund) => ({
      refundId: refund.refundId,
      amount: refund.refundAmount,
      reason: refund.reason,
      status: refund.status,
      requestedAt: refund.requestedAt,
      completedAt: refund.completedAt,
    })),
  };
}
