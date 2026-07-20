import type {
  NativeAppTransactionAggregate,
  NativeAppTransactionRefund,
} from '../market-bootstrap';
import type {
  OrderDetailRouteParams,
  OrderRuntimeRouteParams,
  PaymentRouteParams,
  RefundRouteParams,
} from './order-route';
import {
  deriveAggregateRefundState,
  getLatestRelevantRefund,
  type OrderRuntimeMergeTarget,
} from './order-runtime';
import {
  normalizePaymentChannel,
  type PaymentChannel,
} from './payment-channel';

export interface AggregateOrderFinancialSnapshot {
  totalAmount: number;
  paidAmount: number;
  reservedRefundAmount: number;
  refundableAmount: number;
  latestRefund?: NativeAppTransactionRefund;
  refundStatus?: 'PENDING' | 'REFUNDED';
  paymentChannel?: PaymentChannel;
}

interface RouteLinkedOrderSnapshot {
  orderId?: string;
  orderNo?: string;
  totalAmount?: number;
  paymentChannel?: string;
}

interface BuildPaymentRouteParamsInput {
  order?: RouteLinkedOrderSnapshot;
  orderId?: string;
  orderNo?: string;
  amount?: number;
  paymentChannel?: string;
}

interface BuildRefundRouteParamsInput extends BuildPaymentRouteParamsInput {
  reason?: string;
}

interface BuildPaymentDetailParamsInput {
  orderId: string;
  orderNo?: string;
  aggregate?: NativeAppTransactionAggregate | null;
  paymentAmount: number;
  paymentPaidAt: string;
  paymentChannel?: PaymentChannel;
}

interface BuildRefundDetailParamsInput {
  orderId: string;
  orderNo?: string;
  aggregate?: NativeAppTransactionAggregate | null;
  refundRequestedAmount: number;
  refundReason?: string;
  fallbackPaymentChannel?: PaymentChannel;
  fallbackRequestedAt?: string;
  fallbackCompletedAt?: string;
}

type OrderDetailLinkedOrderSnapshot = Pick<
  OrderRuntimeMergeTarget,
  | 'orderId'
  | 'orderNo'
  | 'status'
  | 'totalAmount'
  | 'paidAmount'
  | 'refundedAmount'
  | 'paidAt'
  | 'refundRequestedAt'
  | 'refundCompletedAt'
  | 'paymentChannel'
>;

interface BuildOrderDetailRouteParamsInput {
  order: OrderDetailLinkedOrderSnapshot;
}

interface BuildOrdersRuntimeParamsInput {
  order?: RouteLinkedOrderSnapshot;
  orderId?: string;
  orderNo?: string;
  totalAmount?: number;
  paidAt?: string;
  paymentChannel?: string;
  refundRequestedAmount?: number;
  refundReason?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
  status: 'PAID' | 'REFUND_PENDING' | 'REFUNDED';
}

interface BuildOrderDetailBackToOrdersParamsInput {
  order: OrderDetailLinkedOrderSnapshot;
  routeParams?: OrderDetailRouteParams;
  effectiveRefundStatus?: 'PENDING' | 'REFUNDED';
  effectiveRefundAmount?: number;
  effectiveRefundReason?: string;
  effectiveRefundRequestedAt?: string;
  effectiveRefundCompletedAt?: string;
}

export function getAggregateOrderTotalAmount(
  aggregate?: NativeAppTransactionAggregate | null,
  fallbackAmount = 0,
) {
  return aggregate?.payment?.amount
    ?? aggregate?.order.totalAmount
    ?? fallbackAmount;
}

export function getAggregateOrderPaidAmount(
  aggregate?: NativeAppTransactionAggregate | null,
  fallbackAmount = 0,
) {
  return aggregate?.payment?.amount
    ?? aggregate?.order.totalAmount
    ?? fallbackAmount;
}

export function getAggregateOrderPaymentChannel(
  aggregate?: NativeAppTransactionAggregate | null,
  fallbackChannel?: PaymentChannel,
) {
  return normalizePaymentChannel(aggregate?.payment?.channel) ?? fallbackChannel;
}

export function getReservedRefundAmount(
  refunds: NativeAppTransactionRefund[] | undefined,
) {
  return (refunds ?? [])
    .filter((refund) => refund.status !== 'REJECTED')
    .reduce((sum, refund) => sum + refund.refundAmount, 0);
}

export function getAggregateOrderFinancialSnapshot(
  aggregate?: NativeAppTransactionAggregate | null,
  fallbackAmount = 0,
  fallbackChannel?: PaymentChannel,
): AggregateOrderFinancialSnapshot {
  const totalAmount = getAggregateOrderTotalAmount(aggregate, fallbackAmount);
  const paidAmount = getAggregateOrderPaidAmount(aggregate, fallbackAmount);
  const reservedRefundAmount = getReservedRefundAmount(aggregate?.refunds);
  const refundableAmount = Math.max(0, paidAmount - reservedRefundAmount);
  const latestRefund = getLatestRelevantRefund(aggregate?.refunds);
  const { refundStatus } = deriveAggregateRefundState(aggregate?.refunds);

  return {
    totalAmount,
    paidAmount,
    reservedRefundAmount,
    refundableAmount,
    latestRefund,
    refundStatus,
    paymentChannel: getAggregateOrderPaymentChannel(aggregate, fallbackChannel),
  };
}

export function buildPaymentRouteParams(
  input: BuildPaymentRouteParamsInput,
): PaymentRouteParams {
  return {
    orderId: input.order?.orderId ?? input.orderId,
    orderNo: input.order?.orderNo ?? input.orderNo,
    amount: input.order?.totalAmount ?? input.amount,
    paymentChannel: normalizePaymentChannel(input.order?.paymentChannel ?? input.paymentChannel),
  };
}

export function buildRefundRouteParams(
  input: BuildRefundRouteParamsInput,
): RefundRouteParams {
  return {
    ...buildPaymentRouteParams(input),
    reason: input.reason,
  };
}

export function buildOrderDetailRouteParams(
  input: BuildOrderDetailRouteParamsInput,
): OrderDetailRouteParams {
  const paymentAmount = input.order.paidAmount || input.order.totalAmount;
  const refundAmount = input.order.refundedAmount || paymentAmount;
  const baseParams: OrderDetailRouteParams = {
    orderId: input.order.orderId,
    orderNo: input.order.orderNo,
  };

  if (
    input.order.status === 'PAID'
    || input.order.status === 'REFUND_PENDING'
    || input.order.status === 'REFUNDED'
  ) {
    baseParams.paymentStatus = 'PAID';
    baseParams.paymentAmount = paymentAmount;
    baseParams.paymentPaidAt = input.order.paidAt;
    baseParams.paymentChannel = input.order.paymentChannel;
  }

  if (input.order.status === 'REFUND_PENDING') {
    baseParams.refundStatus = 'PENDING';
    baseParams.refundRequestedAmount = refundAmount;
    baseParams.refundRequestedAt = input.order.refundRequestedAt;
  }

  if (input.order.status === 'REFUNDED') {
    baseParams.refundStatus = 'REFUNDED';
    baseParams.refundRequestedAmount = refundAmount;
    baseParams.refundRequestedAt = input.order.refundRequestedAt;
    baseParams.refundCompletedAt = input.order.refundCompletedAt;
  }

  return baseParams;
}

export function buildOrderDetailPaymentRouteParams(
  input: BuildPaymentDetailParamsInput,
): OrderDetailRouteParams {
  const snapshot = getAggregateOrderFinancialSnapshot(
    input.aggregate,
    input.paymentAmount,
    input.paymentChannel,
  );
  return {
    orderId: input.orderId,
    orderNo: input.aggregate?.order.orderNo ?? input.orderNo,
    paymentStatus: 'PAID',
    paymentAmount: snapshot.paidAmount || input.paymentAmount,
    paymentPaidAt: input.aggregate?.order.paidAt ?? input.aggregate?.payment?.completedAt ?? input.paymentPaidAt,
    paymentChannel: snapshot.paymentChannel ?? input.paymentChannel,
  };
}

export function buildOrderDetailRefundRouteParams(
  input: BuildRefundDetailParamsInput,
): OrderDetailRouteParams {
  const snapshot = getAggregateOrderFinancialSnapshot(
    input.aggregate,
    input.refundRequestedAmount,
    input.fallbackPaymentChannel,
  );
  const latestRefund = snapshot.latestRefund;
  const refundStatus = snapshot.refundStatus
    ?? (latestRefund?.completedAt || input.fallbackCompletedAt ? 'REFUNDED' : 'PENDING');

  return {
    orderId: input.orderId,
    orderNo: input.aggregate?.order.orderNo ?? input.orderNo,
    paymentStatus: 'PAID',
    paymentAmount: snapshot.paidAmount || snapshot.totalAmount || input.refundRequestedAmount,
    paymentPaidAt: input.aggregate?.order.paidAt ?? input.aggregate?.payment?.completedAt,
    paymentChannel: snapshot.paymentChannel ?? input.fallbackPaymentChannel,
    refundStatus,
    refundRequestedAmount: latestRefund?.refundAmount ?? input.refundRequestedAmount,
    refundReason: latestRefund?.reason ?? input.refundReason,
    refundRequestedAt: latestRefund?.requestedAt ?? input.fallbackRequestedAt,
    refundCompletedAt: latestRefund?.completedAt ?? input.fallbackCompletedAt,
  };
}

export function buildOrdersRuntimeRouteParams(
  input: BuildOrdersRuntimeParamsInput,
): OrderRuntimeRouteParams {
  const baseParams: OrderRuntimeRouteParams = {
    orderId: input.order?.orderId ?? input.orderId,
    orderNo: input.order?.orderNo ?? input.orderNo,
  };
  const paymentAmount = input.order?.totalAmount ?? input.totalAmount;
  const paymentChannel = normalizePaymentChannel(input.order?.paymentChannel ?? input.paymentChannel);

  if (input.status === 'PAID') {
    return {
      ...baseParams,
      paymentStatus: 'PAID',
      paymentAmount,
      paymentPaidAt: input.paidAt,
      paymentChannel,
    };
  }

  if (input.status === 'REFUND_PENDING') {
    return {
      ...baseParams,
      paymentStatus: 'PAID',
      paymentAmount,
      paymentPaidAt: input.paidAt,
      paymentChannel,
      refundStatus: 'PENDING',
      refundRequestedAmount: input.refundRequestedAmount,
      refundReason: input.refundReason,
      refundRequestedAt: input.refundRequestedAt,
    };
  }

  return {
    ...baseParams,
    paymentStatus: 'PAID',
    paymentAmount,
    paymentPaidAt: input.paidAt,
    paymentChannel,
    refundStatus: 'REFUNDED',
    refundRequestedAmount: input.refundRequestedAmount,
    refundReason: input.refundReason,
    refundRequestedAt: input.refundRequestedAt,
    refundCompletedAt: input.refundCompletedAt,
  };
}

export function buildOrderDetailBackToOrdersRouteParams(
  input: BuildOrderDetailBackToOrdersParamsInput,
): OrderRuntimeRouteParams | undefined {
  if (
    input.effectiveRefundStatus === 'PENDING'
    && typeof input.effectiveRefundAmount === 'number'
  ) {
    return buildOrdersRuntimeRouteParams({
      order: input.order,
      paidAt: input.order.paidAt,
      status: 'REFUND_PENDING',
      refundRequestedAmount: input.effectiveRefundAmount,
      refundReason: input.effectiveRefundReason,
      refundRequestedAt: input.effectiveRefundRequestedAt,
    });
  }

  if (
    input.effectiveRefundStatus === 'REFUNDED'
    && typeof input.effectiveRefundAmount === 'number'
  ) {
    return buildOrdersRuntimeRouteParams({
      order: input.order,
      paidAt: input.order.paidAt,
      status: 'REFUNDED',
      refundRequestedAmount: input.effectiveRefundAmount,
      refundReason: input.effectiveRefundReason,
      refundRequestedAt: input.effectiveRefundRequestedAt,
      refundCompletedAt: input.effectiveRefundCompletedAt,
    });
  }

  if (input.routeParams?.paymentStatus === 'PAID') {
    return buildOrdersRuntimeRouteParams({
      order: input.order,
      totalAmount: input.routeParams.paymentAmount ?? input.order.totalAmount,
      paidAt: input.routeParams.paymentPaidAt ?? input.order.paidAt,
      paymentChannel: input.routeParams.paymentChannel ?? input.order.paymentChannel,
      status: 'PAID',
    });
  }

  return undefined;
}
