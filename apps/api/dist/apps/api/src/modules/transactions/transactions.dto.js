"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchTimeoutCloseOrdersDto = exports.ListTransactionOrdersQueryDto = exports.BatchClaimTransactionRefundsDto = exports.BatchAssignTransactionRefundsDto = exports.GetTransactionRefundDashboardQueryDto = exports.ListTransactionRefundsQueryDto = exports.RequestTransactionManualCloseDto = exports.RequestTransactionTimeoutCloseDto = exports.BatchReviewTransactionRefundsDto = exports.ReviewTransactionRefundDto = exports.RequestTransactionRefundDto = exports.CreateTransactionCheckoutDto = void 0;
class CreateTransactionCheckoutDto {
    memberId;
    items;
    paymentChannel;
    currency;
    couponCode;
    blindboxPlanId;
    blindboxQuantity;
    amount;
    externalPaymentId;
}
exports.CreateTransactionCheckoutDto = CreateTransactionCheckoutDto;
class RequestTransactionRefundDto {
    refundAmount;
    reason;
    operator;
}
exports.RequestTransactionRefundDto = RequestTransactionRefundDto;
class ReviewTransactionRefundDto {
    operator;
    note;
}
exports.ReviewTransactionRefundDto = ReviewTransactionRefundDto;
class BatchReviewTransactionRefundsDto extends ReviewTransactionRefundDto {
    refundIds;
}
exports.BatchReviewTransactionRefundsDto = BatchReviewTransactionRefundsDto;
class RequestTransactionTimeoutCloseDto {
    reason;
    operator;
}
exports.RequestTransactionTimeoutCloseDto = RequestTransactionTimeoutCloseDto;
class RequestTransactionManualCloseDto {
    reason;
    operator;
}
exports.RequestTransactionManualCloseDto = RequestTransactionManualCloseDto;
class ListTransactionRefundsQueryDto {
    memberId;
    orderId;
    operator;
    reviewedBy;
    requestedAfter;
    requestedBefore;
    reviewedAfter;
    reviewedBefore;
    status;
    limit;
}
exports.ListTransactionRefundsQueryDto = ListTransactionRefundsQueryDto;
class GetTransactionRefundDashboardQueryDto extends ListTransactionRefundsQueryDto {
    recentReviewLimit;
    priorityQueueLimit;
    dispatchQueueLimit;
    recentEscalationLimit;
    teamLeadThresholdMinutes;
    opsManagerThresholdMinutes;
    financeThresholdMinutes;
    asOfTime;
}
exports.GetTransactionRefundDashboardQueryDto = GetTransactionRefundDashboardQueryDto;
class BatchAssignTransactionRefundsDto extends GetTransactionRefundDashboardQueryDto {
    refundIds;
    suggestedOwner;
    assignee;
    note;
}
exports.BatchAssignTransactionRefundsDto = BatchAssignTransactionRefundsDto;
class BatchClaimTransactionRefundsDto extends GetTransactionRefundDashboardQueryDto {
    refundIds;
    suggestedOwner;
    note;
}
exports.BatchClaimTransactionRefundsDto = BatchClaimTransactionRefundsDto;
class ListTransactionOrdersQueryDto {
    memberId;
    status;
    paymentStatus;
    closeReason;
    hasRefund;
    limit;
}
exports.ListTransactionOrdersQueryDto = ListTransactionOrdersQueryDto;
class BatchTimeoutCloseOrdersDto {
    orderIds;
    memberId;
    beforeTime;
    limit;
}
exports.BatchTimeoutCloseOrdersDto = BatchTimeoutCloseOrdersDto;
//# sourceMappingURL=transactions.dto.js.map