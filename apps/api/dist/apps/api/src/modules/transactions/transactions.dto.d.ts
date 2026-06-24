import { CashierOrderItemDto } from '../cashier/cashier.dto';
export declare class CreateTransactionCheckoutDto {
    memberId: string;
    items: CashierOrderItemDto[];
    paymentChannel: string;
    currency?: string;
    couponCode?: string;
    blindboxPlanId?: string;
    blindboxQuantity?: number;
    amount?: number;
    externalPaymentId?: string;
}
export declare class RequestTransactionRefundDto {
    refundAmount?: number;
    reason: string;
    operator?: string;
}
export declare class ReviewTransactionRefundDto {
    operator?: string;
    note?: string;
}
export declare class BatchReviewTransactionRefundsDto extends ReviewTransactionRefundDto {
    refundIds?: string[];
}
export declare class RequestTransactionTimeoutCloseDto {
    reason?: string;
    operator?: string;
}
export declare class RequestTransactionManualCloseDto {
    reason?: string;
    operator?: string;
}
export declare class ListTransactionRefundsQueryDto {
    memberId?: string;
    orderId?: string;
    operator?: string;
    reviewedBy?: string;
    requestedAfter?: string;
    requestedBefore?: string;
    reviewedAfter?: string;
    reviewedBefore?: string;
    status?: string;
    limit?: number;
}
export declare class GetTransactionRefundDashboardQueryDto extends ListTransactionRefundsQueryDto {
    recentReviewLimit?: number;
    priorityQueueLimit?: number;
    dispatchQueueLimit?: number;
    recentEscalationLimit?: number;
    teamLeadThresholdMinutes?: number;
    opsManagerThresholdMinutes?: number;
    financeThresholdMinutes?: number;
    asOfTime?: string;
}
export declare class BatchAssignTransactionRefundsDto extends GetTransactionRefundDashboardQueryDto {
    refundIds?: string[];
    suggestedOwner?: string;
    assignee: string;
    operator?: string;
    note?: string;
}
export declare class BatchClaimTransactionRefundsDto extends GetTransactionRefundDashboardQueryDto {
    refundIds?: string[];
    suggestedOwner?: string;
    operator: string;
    note?: string;
}
export declare class ListTransactionOrdersQueryDto {
    memberId?: string;
    status?: string;
    paymentStatus?: string;
    closeReason?: string;
    hasRefund?: boolean;
    limit?: number;
}
export declare class BatchTimeoutCloseOrdersDto {
    orderIds?: string[];
    memberId?: string;
    beforeTime?: string;
    limit?: number;
}
//# sourceMappingURL=transactions.dto.d.ts.map