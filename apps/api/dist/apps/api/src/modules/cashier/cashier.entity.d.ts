import type { RequestTenantContext } from '../tenant/tenant.types';
export declare enum CashierOrderStatus {
    Created = "CREATED",
    PendingPayment = "PENDING_PAYMENT",
    Paid = "PAID",
    PaymentFailed = "PAYMENT_FAILED",
    Closed = "CLOSED"
}
export declare enum CashierOrderCloseReason {
    PaymentTimeout = "PAYMENT_TIMEOUT",
    FullRefund = "FULL_REFUND",
    ManualCancel = "MANUAL_CANCEL"
}
export declare enum CashierPaymentStatus {
    Pending = "PENDING",
    Succeeded = "SUCCEEDED",
    Failed = "FAILED"
}
export interface CashierOrderItem {
    skuId: string;
    title?: string;
    quantity: number;
    price: number;
}
export interface CashierOrder {
    orderId: string;
    tenantContext: RequestTenantContext;
    memberId: string;
    items: CashierOrderItem[];
    currency: string;
    totalAmount: number;
    couponCode?: string;
    blindboxPlanId?: string;
    blindboxQuantity?: number;
    status: CashierOrderStatus;
    latestPaymentId?: string;
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
    closedAt?: string;
    closeReason?: CashierOrderCloseReason;
    closedBy?: string;
    closeNote?: string;
    source: 'memory';
}
export interface CashierPayment {
    paymentId: string;
    orderId: string;
    externalPaymentId?: string;
    channel: string;
    amount: number;
    status: CashierPaymentStatus;
    transactionNo?: string;
    sourceEventName?: string;
    failureReason?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}
export interface CashierPaymentCallback {
    standardizedEventName: 'cashier.payment-succeeded' | 'cashier.payment-failed';
    aggregateId: string;
    orderId: string;
    tenantId: string;
    externalPaymentId?: string;
    transactionNo?: string;
    channel?: string;
    amount?: number;
    payload?: Record<string, unknown>;
}
export declare function computeCashierOrderTotal(items: CashierOrderItem[]): number;
//# sourceMappingURL=cashier.entity.d.ts.map