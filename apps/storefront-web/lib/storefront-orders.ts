import { createBusinessClient, type BusinessOrderListItem } from '@m5/sdk';
import { getPaymentMethodLabel, type StorefrontTransactionAggregate } from './storefront-transactions';

export type StorefrontOrderListStatusFilter = 'ALL' | 'PENDING' | 'PAID' | 'REFUNDED';
export type StorefrontOrderPaymentFilter = 'ALL' | 'WECHAT_PAY' | 'ALIPAY' | 'CASH' | 'MEMBER_CARD';
export type StorefrontOrderViewStatus = 'pending_payment' | 'paid' | 'refunded' | 'cancelled';

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
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface StorefrontOrderDetailView {
  orderId: string;
  orderNo: string;
  memberId: string;
  statusLabel: string;
  statusTone: 'warning' | 'info' | 'success' | 'error' | 'default';
  currency: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  paymentChannelLabel: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  closeReason?: string;
  memberNickname?: string;
  items: Array<{
    skuId: string;
    title: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
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
  if (normalized === 'REFUNDED' || normalized === 'REFUND_PENDING') {
    return 'refunded';
  }
  if (normalized === 'PAID' || normalized === 'SUCCEEDED' || normalized === 'FULFILLED') {
    return 'paid';
  }
  if (normalized === 'CLOSED' || normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'cancelled';
  }
  return 'pending_payment';
}

export function getStorefrontOrderStatusLabel(status: StorefrontOrderViewStatus): string {
  switch (status) {
    case 'paid':
      return '已支付';
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
    status: normalizeListStatus(order.status),
    paymentChannel: order.paymentChannel,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    paidAt: order.paidAt,
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

  return order.status === 'refunded';
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

export async function loadStorefrontOrders() {
  const payload = await createBusinessClient().orders.listPage({
    page: 1,
    pageSize: 100,
  }, { cache: 'no-store' });

  return payload.items.map(mapBusinessOrderToListView);
}

export function mapAggregateToOrderDetailView(
  aggregate: StorefrontTransactionAggregate,
): StorefrontOrderDetailView {
  const completedRefunds = aggregate.refunds.filter((refund) => refund.status === 'COMPLETED');
  const refundedAmount = completedRefunds.reduce((sum, refund) => sum + refund.refundAmount, 0);
  const normalizedStatus = normalizeListStatus(
    refundedAmount > 0 ? 'REFUNDED' : aggregate.order.status,
  );
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
    statusLabel: getStorefrontOrderStatusLabel(normalizedStatus),
    statusTone: getStorefrontOrderStatusVariant(normalizedStatus),
    currency: aggregate.order.currency,
    totalAmount: aggregate.order.totalAmount,
    paidAmount: aggregate.payment?.amount ?? (normalizedStatus === 'paid' ? aggregate.order.totalAmount : 0),
    refundedAmount,
    paymentChannelLabel: getStorefrontOrderPaymentLabel(aggregate.payment?.channel),
    createdAt: aggregate.order.createdAt,
    updatedAt: aggregate.order.updatedAt,
    paidAt: aggregate.payment?.completedAt ?? aggregate.order.paidAt,
    closeReason: aggregate.order.closeReason,
    memberNickname: aggregate.memberNickname,
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
