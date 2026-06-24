"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashierPaymentCallbackDto = exports.CreateCashierPaymentDto = exports.CreateCashierOrderDto = exports.CashierOrderItemDto = void 0;
class CashierOrderItemDto {
    skuId;
    title;
    quantity;
    price;
}
exports.CashierOrderItemDto = CashierOrderItemDto;
class CreateCashierOrderDto {
    memberId;
    items;
    currency;
    couponCode;
    blindboxPlanId;
    blindboxQuantity;
}
exports.CreateCashierOrderDto = CreateCashierOrderDto;
class CreateCashierPaymentDto {
    channel;
    amount;
    externalPaymentId;
}
exports.CreateCashierPaymentDto = CreateCashierPaymentDto;
class CashierPaymentCallbackDto {
    standardizedEventName;
    aggregateId;
    orderId;
    tenantId;
    externalPaymentId;
    transactionNo;
    channel;
    amount;
    payload;
}
exports.CashierPaymentCallbackDto = CashierPaymentCallbackDto;
//# sourceMappingURL=cashier.dto.js.map