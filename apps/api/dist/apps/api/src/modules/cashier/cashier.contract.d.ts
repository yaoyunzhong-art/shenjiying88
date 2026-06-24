import type { CashierOrder, CashierPayment, CashierOrderItem, CashierOrderStatus, CashierPaymentStatus, CashierOrderCloseReason } from './cashier.entity';
/**
 * Contract types for cashier module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */
/** External contract for cashier order (cross-module safe subset) */
export interface CashierOrderContract {
    orderId: string;
    tenantId: string;
    memberId: string;
    items: CashierOrderItemContract[];
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
    source: string;
}
/** External contract for cashier order item */
export interface CashierOrderItemContract {
    skuId: string;
    title?: string;
    quantity: number;
    price: number;
}
/** External contract for cashier payment */
export interface CashierPaymentContract {
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
/** Convert internal CashierOrder to cross-module contract */
export declare function toCashierOrderContract(order: CashierOrder): CashierOrderContract;
/** Convert internal CashierOrderItem to cross-module contract */
export declare function toCashierOrderItemContract(item: CashierOrderItem): CashierOrderItemContract;
/** Convert internal CashierPayment to cross-module contract */
export declare function toCashierPaymentContract(payment: CashierPayment): CashierPaymentContract;
//# sourceMappingURL=cashier.contract.d.ts.map