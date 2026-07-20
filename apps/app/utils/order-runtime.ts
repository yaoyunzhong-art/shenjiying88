import type {
  NativeAppTransactionRefund,
} from '../market-bootstrap';
import type {
  OrderDetailRouteParams,
  OrderRuntimeRouteParams,
} from './order-route';
import type { PaymentChannel } from './payment-channel';

export type OrderScreenStatus = 'PENDING' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED' | 'CANCELLED';

type RuntimeRouteParams = OrderRuntimeRouteParams | OrderDetailRouteParams | undefined;

export interface OrderRuntimeMergeTarget {
  orderId: string;
  orderNo: string;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  status: OrderScreenStatus;
  createdAt: string;
  paidAt?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
  paymentChannel?: PaymentChannel;
}

export interface AggregateRefundState {
  latestRefund?: NativeAppTransactionRefund;
  refundStatus?: 'PENDING' | 'REFUNDED';
}

export function resolveOrderScreenStatus(
  status?: string,
  fallback: OrderScreenStatus = 'PENDING',
): OrderScreenStatus {
  switch (status) {
    case 'PAID':
      return 'PAID';
    case 'PENDING':
    case 'PENDING_PAYMENT':
      return 'PENDING';
    case 'REFUNDED':
      return 'REFUNDED';
    case 'REFUND_PENDING':
    case 'REFUNDING':
      return 'REFUND_PENDING';
    case 'CANCELLED':
    case 'CLOSED':
      return 'CANCELLED';
    default:
      return fallback;
  }
}

export function getOrderScreenStatusRank(status?: OrderScreenStatus) {
  switch (status) {
    case 'PENDING':
      return 1;
    case 'PAID':
      return 2;
    case 'REFUND_PENDING':
      return 3;
    case 'REFUNDED':
      return 4;
    case 'CANCELLED':
      return 5;
    default:
      return 0;
  }
}

export function resolveRouteOrderScreenStatus(
  routeParams?: RuntimeRouteParams,
): OrderScreenStatus | undefined {
  if (routeParams?.refundStatus === 'REFUNDED') {
    return 'REFUNDED';
  }
  if (routeParams?.refundStatus === 'PENDING') {
    return 'REFUND_PENDING';
  }
  if (routeParams?.paymentStatus === 'PAID') {
    return 'PAID';
  }
  return undefined;
}

export function shouldPromoteOrderScreenStatus(
  currentStatus: OrderScreenStatus | undefined,
  runtimeStatus: OrderScreenStatus | undefined,
) {
  if (!runtimeStatus || currentStatus === 'CANCELLED') {
    return false;
  }
  return getOrderScreenStatusRank(runtimeStatus) > getOrderScreenStatusRank(currentStatus);
}

export function getLatestRelevantRefund(
  refunds: NativeAppTransactionRefund[] | undefined,
) {
  if (!refunds?.length) {
    return undefined;
  }

  return [...refunds]
    .filter((refund) => refund.status !== 'REJECTED')
    .sort((left, right) => (
      new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime()
    ))[0];
}

export function deriveAggregateRefundState(
  refunds: NativeAppTransactionRefund[] | undefined,
): AggregateRefundState {
  const latestRefund = getLatestRelevantRefund(refunds);
  if (!latestRefund) {
    return {};
  }

  const refundStatus = ['REFUNDED', 'COMPLETED', 'SUCCEEDED'].includes(latestRefund.status)
    ? 'REFUNDED'
    : 'PENDING';

  return {
    latestRefund,
    refundStatus,
  };
}

export function mergeRuntimeOrderIntoTarget<T extends OrderRuntimeMergeTarget>(
  order: T,
  routeParams?: RuntimeRouteParams,
): T {
  if (!routeParams?.orderId || routeParams.orderId !== order.orderId) {
    return order;
  }

  let nextOrder = { ...order };
  const runtimeStatus = resolveRouteOrderScreenStatus(routeParams);
  const promotesRuntimeStatus = shouldPromoteOrderScreenStatus(order.status, runtimeStatus);

  if (routeParams.paymentStatus === 'PAID') {
    const canHydratePaymentFields =
      promotesRuntimeStatus ||
      order.status === 'PAID' ||
      order.status === 'REFUND_PENDING' ||
      order.status === 'REFUNDED';

    if (promotesRuntimeStatus) {
      nextOrder.status = 'PAID';
      nextOrder.totalAmount = routeParams.paymentAmount ?? nextOrder.totalAmount;
    }

    if (canHydratePaymentFields) {
      nextOrder.paidAmount = order.paidAmount > 0
        ? order.paidAmount
        : routeParams.paymentAmount ?? order.totalAmount;
      nextOrder.paidAt = order.paidAt ?? routeParams.paymentPaidAt;
      nextOrder.paymentChannel = order.paymentChannel ?? routeParams.paymentChannel;
      if (nextOrder.totalAmount <= 0 && routeParams.paymentAmount) {
        nextOrder.totalAmount = routeParams.paymentAmount;
      }
    }
  }

  if (routeParams.refundStatus === 'PENDING') {
    const canHydrateRefundFields = promotesRuntimeStatus || order.status === 'REFUND_PENDING';
    if (promotesRuntimeStatus) {
      nextOrder.status = 'REFUND_PENDING';
    }

    if (canHydrateRefundFields) {
      nextOrder.refundedAmount = order.refundedAmount > 0
        ? order.refundedAmount
        : routeParams.refundRequestedAmount ?? order.paidAmount ?? order.totalAmount;
      nextOrder.refundRequestedAt = order.refundRequestedAt ?? routeParams.refundRequestedAt;
    }
  }

  if (routeParams.refundStatus === 'REFUNDED') {
    const canHydrateRefundFields = promotesRuntimeStatus || order.status === 'REFUNDED';
    if (promotesRuntimeStatus) {
      nextOrder.status = 'REFUNDED';
    }

    if (canHydrateRefundFields) {
      nextOrder.refundedAmount = order.refundedAmount > 0
        ? order.refundedAmount
        : routeParams.refundRequestedAmount ?? order.paidAmount ?? order.totalAmount;
      nextOrder.refundRequestedAt = order.refundRequestedAt ?? routeParams.refundRequestedAt;
      nextOrder.refundCompletedAt = order.refundCompletedAt ?? routeParams.refundCompletedAt;
    }
  }

  return nextOrder;
}
