import type { TransactionRefundStatus, TransactionRefundRecord, TransactionAggregate, LytOrderSnapshot, LytPaymentSnapshot, MemberTransactionTimelineEntry } from './transactions.entity';
/**
 * Contract types for transactions module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */
/** External contract for transaction refund record (cross-module safe subset) */
export interface TransactionRefundContract {
    refundId: string;
    tenantId: string;
    orderId: string;
    paymentId: string;
    memberId: string;
    refundAmount: number;
    reason: string;
    operator?: string;
    status: TransactionRefundStatus;
    requestedAt: string;
    completedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNote?: string;
}
/** External contract for transaction aggregate summary */
export interface TransactionAggregateContract {
    orderId: string;
    tenantId: string;
    memberId: string;
    orderStatus: string;
    paymentStatus?: string;
    totalAmount: number;
    currency: string;
    paidAmount?: number;
    refundedAmount: number;
    refundStatus?: TransactionRefundStatus;
    refundCount: number;
    couponCode?: string;
    blindboxPlanId?: string;
    createdAt: string;
    updatedAt: string;
}
/** External contract for LYT order snapshot */
export interface LytOrderSnapshotContract {
    snapshotId: string;
    tenantId: string;
    externalOrderId: string;
    orderNo?: string;
    memberId?: string;
    couponCode?: string;
    amount: number;
    discountAmount: number;
    payableAmount: number;
    currency: string;
    status: string;
    paidAt?: string;
    updatedAtFromSource: string;
    source: string;
}
/** External contract for LYT payment snapshot */
export interface LytPaymentSnapshotContract {
    snapshotId: string;
    tenantId: string;
    externalPaymentId: string;
    externalOrderId: string;
    paymentChannel?: string;
    paymentStatus: string;
    amount: number;
    currency: string;
    transactionNo?: string;
    paidAt?: string;
    updatedAtFromSource: string;
    source: string;
}
/** External contract for member transaction timeline entry */
export interface MemberTransactionTimelineContract {
    orderId: string;
    memberId: string;
    status: string;
    paymentStatus?: string;
    totalAmount: number;
    currency: string;
    awardedPoints: number;
    refundedAmount: number;
    refundStatus?: TransactionRefundStatus;
    couponCode?: string;
    blindboxPlanId?: string;
    blindboxStatus?: string;
    closeReason?: string;
    closedBy?: string;
    closeNote?: string;
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
    closedAt?: string;
}
/** Convert internal TransactionRefundRecord to cross-module contract */
export declare function toTransactionRefundContract(refund: TransactionRefundRecord): TransactionRefundContract;
/** Convert internal TransactionAggregate to cross-module contract */
export declare function toTransactionAggregateContract(aggregate: TransactionAggregate): TransactionAggregateContract;
/** Convert internal LytOrderSnapshot to cross-module contract */
export declare function toLytOrderSnapshotContract(snapshot: LytOrderSnapshot): LytOrderSnapshotContract;
/** Convert internal LytPaymentSnapshot to cross-module contract */
export declare function toLytPaymentSnapshotContract(snapshot: LytPaymentSnapshot): LytPaymentSnapshotContract;
/** Convert internal MemberTransactionTimelineEntry to cross-module contract */
export declare function toMemberTransactionTimelineContract(entry: MemberTransactionTimelineEntry): MemberTransactionTimelineContract;
//# sourceMappingURL=transactions.contract.d.ts.map