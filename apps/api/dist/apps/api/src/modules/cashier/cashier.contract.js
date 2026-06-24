"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCashierOrderContract = toCashierOrderContract;
exports.toCashierOrderItemContract = toCashierOrderItemContract;
exports.toCashierPaymentContract = toCashierPaymentContract;
/** Convert internal CashierOrder to cross-module contract */
function toCashierOrderContract(order) {
    return {
        orderId: order.orderId,
        tenantId: order.tenantContext.tenantId,
        memberId: order.memberId,
        items: order.items.map(toCashierOrderItemContract),
        currency: order.currency,
        totalAmount: order.totalAmount,
        couponCode: order.couponCode,
        blindboxPlanId: order.blindboxPlanId,
        blindboxQuantity: order.blindboxQuantity,
        status: order.status,
        latestPaymentId: order.latestPaymentId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        paidAt: order.paidAt,
        closedAt: order.closedAt,
        closeReason: order.closeReason,
        closedBy: order.closedBy,
        closeNote: order.closeNote,
        source: order.source,
    };
}
/** Convert internal CashierOrderItem to cross-module contract */
function toCashierOrderItemContract(item) {
    return {
        skuId: item.skuId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
    };
}
/** Convert internal CashierPayment to cross-module contract */
function toCashierPaymentContract(payment) {
    return {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        externalPaymentId: payment.externalPaymentId,
        channel: payment.channel,
        amount: payment.amount,
        status: payment.status,
        transactionNo: payment.transactionNo,
        sourceEventName: payment.sourceEventName,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        completedAt: payment.completedAt,
    };
}
//# sourceMappingURL=cashier.contract.js.map