export declare class CashierOrderItemDto {
    skuId: string;
    title?: string;
    quantity: number;
    price: number;
}
export declare class CreateCashierOrderDto {
    memberId: string;
    items: CashierOrderItemDto[];
    currency?: string;
    couponCode?: string;
    blindboxPlanId?: string;
    blindboxQuantity?: number;
}
export declare class CreateCashierPaymentDto {
    channel: string;
    amount?: number;
    externalPaymentId?: string;
}
export declare class CashierPaymentCallbackDto {
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
//# sourceMappingURL=cashier.dto.d.ts.map