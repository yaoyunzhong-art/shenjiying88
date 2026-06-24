"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTransactionRefundContract = toTransactionRefundContract;
exports.toTransactionAggregateContract = toTransactionAggregateContract;
exports.toLytOrderSnapshotContract = toLytOrderSnapshotContract;
exports.toLytPaymentSnapshotContract = toLytPaymentSnapshotContract;
exports.toMemberTransactionTimelineContract = toMemberTransactionTimelineContract;
/** Convert internal TransactionRefundRecord to cross-module contract */
function toTransactionRefundContract(refund) {
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
    };
}
/** Convert internal TransactionAggregate to cross-module contract */
function toTransactionAggregateContract(aggregate) {
    const refundedAmount = aggregate.refunds
        .filter((r) => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + r.refundAmount, 0);
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
    };
}
/** Convert internal LytOrderSnapshot to cross-module contract */
function toLytOrderSnapshotContract(snapshot) {
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
    };
}
/** Convert internal LytPaymentSnapshot to cross-module contract */
function toLytPaymentSnapshotContract(snapshot) {
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
    };
}
/** Convert internal MemberTransactionTimelineEntry to cross-module contract */
function toMemberTransactionTimelineContract(entry) {
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
    };
}
//# sourceMappingURL=transactions.contract.js.map