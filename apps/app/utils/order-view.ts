import type {
  NativeAppOrderListItem,
  NativeAppTransactionAggregate,
  NativeAppTransactionOrderItem,
} from '../market-bootstrap';
import type {
  OrderDetailRouteParams,
  OrderRuntimeRouteParams,
} from './order-route';
import {
  getAggregateOrderFinancialSnapshot,
} from './order-finance';
import {
  deriveAggregateRefundState,
  resolveOrderScreenStatus,
  resolveRouteOrderScreenStatus,
  shouldPromoteOrderScreenStatus,
  type OrderRuntimeMergeTarget,
} from './order-runtime';
import {
  normalizePaymentChannel,
  type PaymentChannel,
} from './payment-channel';

export interface OrderSummaryViewModel extends OrderRuntimeMergeTarget {
  currency: string;
  itemCount: number;
}

export interface OrderDetailViewModel extends OrderSummaryViewModel {
  memberId: string;
  memberNickname: string;
  items: NativeAppTransactionOrderItem[];
  pointsEarned: number;
}

export interface ResolvedOrderDetailViewState {
  order: OrderDetailViewModel;
  effectiveRefundStatus?: 'PENDING' | 'REFUNDED';
  effectiveRefundAmount?: number;
  effectiveRefundReason?: string;
  effectiveRefundRequestedAt?: string;
  effectiveRefundCompletedAt?: string;
}

export interface CashierLinkedOrderViewState {
  orderId: string;
  orderNo: string;
  totalAmount: number;
  paidAmount: number;
  collectibleAmount: number;
  reservedRefundAmount: number;
  refundableAmount: number;
  paymentChannel?: PaymentChannel;
  hasHydratedAggregate: boolean;
}

interface BuildRuntimeFallbackOrderDetailOptions {
  currency?: string;
  createdAt?: string;
  itemCount?: number;
  paymentChannel?: PaymentChannel;
  memberId?: string;
  memberNickname?: string;
  items?: NativeAppTransactionOrderItem[];
  pointsEarned?: number;
}

export function mapApiOrderToSummaryView(
  order: NativeAppOrderListItem,
): OrderSummaryViewModel {
  return {
    orderId: order.orderId,
    orderNo: order.orderNo,
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount,
    refundedAmount: order.refundedAmount,
    currency: order.currency,
    status: resolveOrderScreenStatus(order.status),
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    refundRequestedAt: order.refundRequestedAt,
    refundCompletedAt: order.refundCompletedAt,
    paymentChannel: normalizePaymentChannel(order.paymentChannel),
    itemCount: order.itemCount,
  };
}

export function buildRuntimeFallbackOrderSummary(
  routeParams?: OrderRuntimeRouteParams,
  options?: {
    currency?: string;
    createdAt?: string;
    itemCount?: number;
  },
): OrderSummaryViewModel | undefined {
  if (!routeParams?.orderId) {
    return undefined;
  }

  const runtimeStatus = resolveRouteOrderScreenStatus(routeParams) ?? 'PENDING';
  const runtimeTotalAmount = routeParams.paymentAmount ?? routeParams.refundRequestedAmount ?? 0;
  const runtimePaidAmount = routeParams.paymentStatus === 'PAID' || routeParams.refundStatus
    ? routeParams.paymentAmount ?? routeParams.refundRequestedAmount ?? 0
    : 0;
  const runtimeRefundedAmount = routeParams.refundStatus
    ? routeParams.refundRequestedAmount ?? 0
    : 0;

  return {
    orderId: routeParams.orderId,
    orderNo: routeParams.orderNo ?? routeParams.orderId,
    totalAmount: runtimeTotalAmount,
    paidAmount: runtimePaidAmount,
    refundedAmount: runtimeRefundedAmount,
    currency: options?.currency ?? 'CNY',
    status: runtimeStatus,
    createdAt: options?.createdAt
      ?? routeParams.paymentPaidAt
      ?? routeParams.refundRequestedAt
      ?? new Date().toISOString(),
    paidAt: routeParams.paymentPaidAt,
    refundRequestedAt: routeParams.refundRequestedAt,
    refundCompletedAt: routeParams.refundCompletedAt,
    paymentChannel: routeParams.paymentChannel,
    itemCount: options?.itemCount ?? 0,
  };
}

export function buildRuntimeFallbackOrderDetail(
  routeParams?: OrderDetailRouteParams,
  options?: BuildRuntimeFallbackOrderDetailOptions,
): OrderDetailViewModel {
  const summary = buildRuntimeFallbackOrderSummary(routeParams, {
    currency: options?.currency,
    createdAt: options?.createdAt,
    itemCount: options?.itemCount,
  });

  return {
    orderId: summary?.orderId ?? routeParams?.orderId ?? 'N/A',
    orderNo: summary?.orderNo ?? routeParams?.orderNo ?? routeParams?.orderId ?? '',
    totalAmount: summary?.totalAmount ?? routeParams?.paymentAmount ?? routeParams?.refundRequestedAmount ?? 0,
    paidAmount: summary?.paidAmount ?? 0,
    refundedAmount: summary?.refundedAmount ?? 0,
    currency: summary?.currency ?? options?.currency ?? 'CNY',
    status: summary?.status ?? 'PENDING',
    createdAt: summary?.createdAt ?? options?.createdAt ?? '1970-01-01T00:00:00.000Z',
    paidAt: summary?.paidAt,
    refundRequestedAt: summary?.refundRequestedAt,
    refundCompletedAt: summary?.refundCompletedAt,
    paymentChannel: summary?.paymentChannel ?? options?.paymentChannel,
    itemCount: summary?.itemCount ?? options?.itemCount ?? 0,
    memberId: options?.memberId ?? 'member-unknown',
    memberNickname: options?.memberNickname ?? '未知会员',
    items: options?.items ?? [],
    pointsEarned: options?.pointsEarned ?? (routeParams?.paymentAmount ? Math.round(routeParams.paymentAmount) : 0),
  };
}

export function resolveOrderDetailViewState(
  baseOrder: OrderDetailViewModel,
  aggregate?: NativeAppTransactionAggregate | null,
  routeParams?: OrderDetailRouteParams,
): ResolvedOrderDetailViewState {
  const { latestRefund: latestAggregateRefund, refundStatus: aggregateRefundStatus } = deriveAggregateRefundState(
    aggregate?.refunds,
  );
  const financialSnapshot = getAggregateOrderFinancialSnapshot(
    aggregate,
    routeParams?.paymentAmount ?? routeParams?.refundRequestedAmount ?? baseOrder.totalAmount,
    routeParams?.paymentChannel ?? baseOrder.paymentChannel,
  );
  const aggregateOrderStatus = latestAggregateRefund
    ? (aggregateRefundStatus === 'REFUNDED' ? 'REFUNDED' : 'REFUND_PENDING')
    : resolveOrderScreenStatus(aggregate?.order.status, baseOrder.status);
  const routeOrderStatus = resolveRouteOrderScreenStatus(routeParams);
  const promotedByRoute = shouldPromoteOrderScreenStatus(aggregateOrderStatus, routeOrderStatus);
  const effectiveOrderStatus = promotedByRoute && routeOrderStatus
    ? routeOrderStatus
    : aggregateOrderStatus;
  const effectiveRefundStatus = promotedByRoute && routeParams?.refundStatus
    ? routeParams.refundStatus
    : aggregateRefundStatus ?? routeParams?.refundStatus;
  const effectiveRefundAmount = latestAggregateRefund?.refundAmount ?? routeParams?.refundRequestedAmount;
  const effectiveRefundReason = latestAggregateRefund?.reason ?? routeParams?.refundReason;
  const effectiveRefundRequestedAt = latestAggregateRefund?.requestedAt ?? routeParams?.refundRequestedAt;
  const effectiveRefundCompletedAt = latestAggregateRefund?.completedAt ?? routeParams?.refundCompletedAt;
  const aggregateItems = aggregate?.order.items;
  const order: OrderDetailViewModel = {
    ...baseOrder,
    orderId: aggregate?.order.orderId ?? routeParams?.orderId ?? baseOrder.orderId,
    orderNo: aggregate?.order.orderNo ?? routeParams?.orderNo ?? baseOrder.orderNo,
    totalAmount: promotedByRoute && routeParams?.paymentStatus === 'PAID'
      ? routeParams.paymentAmount
        ?? financialSnapshot.paidAmount
        ?? financialSnapshot.totalAmount
        ?? baseOrder.totalAmount
      : financialSnapshot.paidAmount
        ?? financialSnapshot.totalAmount
        ?? routeParams?.paymentAmount
        ?? baseOrder.totalAmount,
    paidAmount: financialSnapshot.paidAmount
      || (effectiveOrderStatus === 'PENDING'
        ? 0
        : routeParams?.paymentAmount ?? baseOrder.paidAmount ?? baseOrder.totalAmount),
    refundedAmount: effectiveRefundAmount ?? baseOrder.refundedAmount,
    createdAt: aggregate?.order.createdAt ?? baseOrder.createdAt,
    paidAt: aggregate?.order.paidAt
      ?? aggregate?.payment?.completedAt
      ?? routeParams?.paymentPaidAt
      ?? baseOrder.paidAt,
    refundRequestedAt: effectiveRefundRequestedAt ?? baseOrder.refundRequestedAt,
    refundCompletedAt: effectiveRefundCompletedAt ?? baseOrder.refundCompletedAt,
    paymentChannel: financialSnapshot.paymentChannel ?? baseOrder.paymentChannel,
    itemCount: aggregateItems?.length
      ? aggregateItems.reduce((sum, item) => sum + item.quantity, 0)
      : baseOrder.itemCount,
    memberId: aggregate?.order.memberId ?? baseOrder.memberId,
    memberNickname: aggregate?.memberNickname ?? baseOrder.memberNickname,
    items: aggregateItems?.length ? aggregateItems : baseOrder.items,
    currency: aggregate?.order.currency ?? baseOrder.currency,
    pointsEarned: aggregate?.settlement?.pointsEarned
      ?? (routeParams?.paymentAmount ? Math.round(routeParams.paymentAmount) : baseOrder.pointsEarned),
    status: effectiveOrderStatus,
  };

  return {
    order,
    effectiveRefundStatus,
    effectiveRefundAmount,
    effectiveRefundReason,
    effectiveRefundRequestedAt,
    effectiveRefundCompletedAt,
  };
}

export function resolveCashierLinkedOrderViewState(input: {
  aggregate?: NativeAppTransactionAggregate | null;
  fallbackOrderId?: string;
  fallbackOrderNo?: string;
  fallbackAmount?: number;
  fallbackChannel?: PaymentChannel;
}): CashierLinkedOrderViewState {
  const snapshot = getAggregateOrderFinancialSnapshot(
    input.aggregate,
    input.fallbackAmount ?? 0,
    input.fallbackChannel,
  );
  const collectibleAmount = snapshot.paidAmount || snapshot.totalAmount;
  const hasHydratedAggregate = Boolean(input.aggregate);

  return {
    orderId: input.aggregate?.order.orderId ?? input.fallbackOrderId ?? 'N/A',
    orderNo: input.aggregate?.order.orderNo ?? input.fallbackOrderNo ?? 'N/A',
    totalAmount: snapshot.totalAmount,
    paidAmount: snapshot.paidAmount,
    collectibleAmount,
    reservedRefundAmount: hasHydratedAggregate ? snapshot.reservedRefundAmount : 0,
    refundableAmount: hasHydratedAggregate ? snapshot.refundableAmount : collectibleAmount,
    paymentChannel: snapshot.paymentChannel,
    hasHydratedAggregate,
  };
}
