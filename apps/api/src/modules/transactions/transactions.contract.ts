import type {
  TransactionRefundStatus,
  TransactionRefundRecord,
  TransactionAggregate,
  LytOrderSnapshot,
  LytPaymentSnapshot,
  MemberTransactionTimelineEntry,
} from './transactions.entity'

/**
 * Contract types for transactions module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** External contract for transaction refund record (cross-module safe subset) */
export interface TransactionRefundContract {
  refundId: string
  tenantId: string
  orderId: string
  paymentId: string
  memberId: string
  refundAmount: number
  reason: string
  operator?: string
  status: TransactionRefundStatus
  requestedAt: string
  completedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNote?: string
}

/** External contract for transaction aggregate summary */
export interface TransactionAggregateContract {
  orderId: string
  tenantId: string
  memberId: string
  orderStatus: string
  paymentStatus?: string
  totalAmount: number
  currency: string
  paidAmount?: number
  refundedAmount: number
  refundStatus?: TransactionRefundStatus
  refundCount: number
  couponCode?: string
  blindboxPlanId?: string
  createdAt: string
  updatedAt: string
}

/** External contract for LYT order snapshot */
export interface LytOrderSnapshotContract {
  snapshotId: string
  tenantId: string
  externalOrderId: string
  orderNo?: string
  memberId?: string
  couponCode?: string
  amount: number
  discountAmount: number
  payableAmount: number
  currency: string
  status: string
  paidAt?: string
  updatedAtFromSource: string
  source: string
}

/** External contract for LYT payment snapshot */
export interface LytPaymentSnapshotContract {
  snapshotId: string
  tenantId: string
  externalPaymentId: string
  externalOrderId: string
  paymentChannel?: string
  paymentStatus: string
  amount: number
  currency: string
  transactionNo?: string
  paidAt?: string
  updatedAtFromSource: string
  source: string
}

/** External contract for member transaction timeline entry */
export interface MemberTransactionTimelineContract {
  orderId: string
  memberId: string
  status: string
  paymentStatus?: string
  totalAmount: number
  currency: string
  awardedPoints: number
  refundedAmount: number
  refundStatus?: TransactionRefundStatus
  couponCode?: string
  blindboxPlanId?: string
  blindboxStatus?: string
  closeReason?: string
  closedBy?: string
  closeNote?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  closedAt?: string
}

/** Convert internal TransactionRefundRecord to cross-module contract */
export function toTransactionRefundContract(
  refund: TransactionRefundRecord,
): TransactionRefundContract {
  return {
    refundId: refund.refundId,
    tenantId: refund.tenantContext.tenantId,
    orderId: refund.orderId,
    paymentId: refund.paymentId,
    memberId: refund.memberId,
    refundAmount: refund.refundAmount,
    reason: refund.reason,
    operator: refund.operator,
    status: refund.status,
    requestedAt: refund.requestedAt,
    completedAt: refund.completedAt,
    reviewedAt: refund.reviewedAt,
    reviewedBy: refund.reviewedBy,
    reviewNote: refund.reviewNote,
  }
}

/** Convert internal TransactionAggregate to cross-module contract */
export function toTransactionAggregateContract(
  aggregate: TransactionAggregate,
): TransactionAggregateContract {
  const refundedAmount = aggregate.refunds
    .filter((r) => r.status === ('COMPLETED' as TransactionRefundStatus))
    .reduce((sum, r) => sum + r.refundAmount, 0)

  return {
    orderId: aggregate.order.orderId,
    tenantId: aggregate.order.tenantContext.tenantId,
    memberId: aggregate.order.memberId,
    orderStatus: aggregate.order.status,
    paymentStatus: aggregate.payment?.status,
    totalAmount: aggregate.order.totalAmount,
    currency: aggregate.order.currency,
    paidAmount: aggregate.payment?.amount,
    refundedAmount,
    refundStatus: aggregate.refunds[0]?.status,
    refundCount: aggregate.refunds.length,
    couponCode: aggregate.order.couponCode,
    blindboxPlanId: aggregate.order.blindboxPlanId,
    createdAt: aggregate.order.createdAt,
    updatedAt: aggregate.order.updatedAt,
  }
}

/** Convert internal LytOrderSnapshot to cross-module contract */
export function toLytOrderSnapshotContract(
  snapshot: LytOrderSnapshot,
): LytOrderSnapshotContract {
  return {
    snapshotId: snapshot.snapshotId,
    tenantId: snapshot.tenantContext.tenantId,
    externalOrderId: snapshot.externalOrderId,
    orderNo: snapshot.orderNo,
    memberId: snapshot.memberId,
    couponCode: snapshot.couponCode,
    amount: snapshot.amount,
    discountAmount: snapshot.discountAmount,
    payableAmount: snapshot.payableAmount,
    currency: snapshot.currency,
    status: snapshot.status,
    paidAt: snapshot.paidAt,
    updatedAtFromSource: snapshot.updatedAtFromSource,
    source: snapshot.source ?? 'memory',
  }
}

/** Convert internal LytPaymentSnapshot to cross-module contract */
export function toLytPaymentSnapshotContract(
  snapshot: LytPaymentSnapshot,
): LytPaymentSnapshotContract {
  return {
    snapshotId: snapshot.snapshotId,
    tenantId: snapshot.tenantContext.tenantId,
    externalPaymentId: snapshot.externalPaymentId,
    externalOrderId: snapshot.externalOrderId,
    paymentChannel: snapshot.paymentChannel,
    paymentStatus: snapshot.paymentStatus,
    amount: snapshot.amount,
    currency: snapshot.currency,
    transactionNo: snapshot.transactionNo,
    paidAt: snapshot.paidAt,
    updatedAtFromSource: snapshot.updatedAtFromSource,
    source: snapshot.source ?? 'memory',
  }
}

/** Convert internal MemberTransactionTimelineEntry to cross-module contract */
export function toMemberTransactionTimelineContract(
  entry: MemberTransactionTimelineEntry,
): MemberTransactionTimelineContract {
  return {
    orderId: entry.orderId,
    memberId: entry.memberId,
    status: entry.status,
    paymentStatus: entry.paymentStatus,
    totalAmount: entry.totalAmount,
    currency: entry.currency,
    awardedPoints: entry.awardedPoints,
    refundedAmount: entry.refundedAmount,
    refundStatus: entry.refundStatus,
    couponCode: entry.couponCode,
    blindboxPlanId: entry.blindboxPlanId,
    blindboxStatus: entry.blindboxStatus,
    closeReason: entry.closeReason,
    closedBy: entry.closedBy,
    closeNote: entry.closeNote,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    paidAt: entry.paidAt,
    closedAt: entry.closedAt,
  }
}
