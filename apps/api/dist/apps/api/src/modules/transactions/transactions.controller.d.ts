import { CashierPaymentCallbackDto } from '../cashier/cashier.dto';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { BatchAssignTransactionRefundsDto, BatchClaimTransactionRefundsDto, BatchReviewTransactionRefundsDto, BatchTimeoutCloseOrdersDto, CreateTransactionCheckoutDto, GetTransactionRefundDashboardQueryDto, ListTransactionOrdersQueryDto, ListTransactionRefundsQueryDto, RequestTransactionManualCloseDto, RequestTransactionRefundDto, RequestTransactionTimeoutCloseDto, ReviewTransactionRefundDto } from './transactions.dto';
import { TransactionsService } from './transactions.service';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    startCheckout(tenantContext: RequestTenantContext, body: CreateTransactionCheckoutDto): Promise<import("./transactions.entity").TransactionAggregate>;
    applyPaymentCallback(body: CashierPaymentCallbackDto): Promise<import("./transactions.entity").TransactionAggregate>;
    getOrderTransaction(orderId: string, tenantContext: RequestTenantContext): import("./transactions.entity").TransactionAggregate;
    listOrderTransactions(tenantContext: RequestTenantContext, query?: ListTransactionOrdersQueryDto): import("./transactions.entity").TransactionAggregate[];
    listLytOrderSnapshots(tenantContext: RequestTenantContext): Promise<import("./transactions.entity").LytOrderSnapshot[]>;
    getLytOrderSnapshot(externalOrderId: string, tenantContext: RequestTenantContext): Promise<import("./transactions.entity").LytOrderSnapshot | undefined>;
    listLytPaymentSnapshots(tenantContext: RequestTenantContext): Promise<import("./transactions.entity").LytPaymentSnapshot[]>;
    getLytPaymentSnapshot(externalPaymentId: string, tenantContext: RequestTenantContext): Promise<import("./transactions.entity").LytPaymentSnapshot | undefined>;
    timeoutCloseOrder(orderId: string, tenantContext: RequestTenantContext, body: RequestTransactionTimeoutCloseDto): Promise<import("./transactions.entity").TransactionAggregate>;
    batchTimeoutCloseOrders(tenantContext: RequestTenantContext, body: BatchTimeoutCloseOrdersDto): Promise<import("./transactions.entity").TransactionBatchTimeoutCloseResult>;
    manualCloseOrder(orderId: string, tenantContext: RequestTenantContext, body: RequestTransactionManualCloseDto): Promise<import("./transactions.entity").TransactionAggregate>;
    listOrderRefunds(orderId: string, tenantContext: RequestTenantContext): import("./transactions.entity").TransactionRefundRecord[];
    listRefunds(tenantContext: RequestTenantContext, query?: ListTransactionRefundsQueryDto): import("./transactions.entity").TransactionRefundRecord[];
    listPendingRefunds(tenantContext: RequestTenantContext, query?: ListTransactionRefundsQueryDto): import("./transactions.entity").TransactionRefundRecord[];
    getRefundDashboard(tenantContext: RequestTenantContext, query?: GetTransactionRefundDashboardQueryDto): import("./transactions.entity").TransactionRefundDashboard;
    getRefund(refundId: string, tenantContext: RequestTenantContext): import("./transactions.entity").TransactionRefundRecord;
    requestRefund(orderId: string, tenantContext: RequestTenantContext, body: RequestTransactionRefundDto): Promise<import("./transactions.entity").TransactionAggregate>;
    approveRefund(refundId: string, tenantContext: RequestTenantContext, body: ReviewTransactionRefundDto): Promise<import("./transactions.entity").TransactionAggregate>;
    rejectRefund(refundId: string, tenantContext: RequestTenantContext, body: ReviewTransactionRefundDto): import("./transactions.entity").TransactionAggregate;
    batchApproveRefunds(tenantContext: RequestTenantContext, body: BatchReviewTransactionRefundsDto): Promise<import("./transactions.entity").TransactionBatchRefundReviewResult>;
    batchRejectRefunds(tenantContext: RequestTenantContext, body: BatchReviewTransactionRefundsDto): import("./transactions.entity").TransactionBatchRefundReviewResult;
    batchAssignRefunds(tenantContext: RequestTenantContext, body: BatchAssignTransactionRefundsDto): import("./transactions.entity").TransactionBatchRefundAssignmentResult;
    batchClaimRefunds(tenantContext: RequestTenantContext, body: BatchClaimTransactionRefundsDto): import("./transactions.entity").TransactionBatchRefundAssignmentResult;
    listMemberTransactions(memberId: string, tenantContext: RequestTenantContext): import("./transactions.entity").MemberTransactionTimelineEntry[];
    listMemberRefunds(memberId: string, tenantContext: RequestTenantContext, query: ListTransactionRefundsQueryDto): import("./transactions.entity").TransactionRefundRecord[];
}
//# sourceMappingURL=transactions.controller.d.ts.map