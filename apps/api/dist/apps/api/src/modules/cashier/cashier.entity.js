"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashierPaymentStatus = exports.CashierOrderCloseReason = exports.CashierOrderStatus = void 0;
exports.computeCashierOrderTotal = computeCashierOrderTotal;
var CashierOrderStatus;
(function (CashierOrderStatus) {
    CashierOrderStatus["Created"] = "CREATED";
    CashierOrderStatus["PendingPayment"] = "PENDING_PAYMENT";
    CashierOrderStatus["Paid"] = "PAID";
    CashierOrderStatus["PaymentFailed"] = "PAYMENT_FAILED";
    CashierOrderStatus["Closed"] = "CLOSED";
})(CashierOrderStatus || (exports.CashierOrderStatus = CashierOrderStatus = {}));
var CashierOrderCloseReason;
(function (CashierOrderCloseReason) {
    CashierOrderCloseReason["PaymentTimeout"] = "PAYMENT_TIMEOUT";
    CashierOrderCloseReason["FullRefund"] = "FULL_REFUND";
    CashierOrderCloseReason["ManualCancel"] = "MANUAL_CANCEL";
})(CashierOrderCloseReason || (exports.CashierOrderCloseReason = CashierOrderCloseReason = {}));
var CashierPaymentStatus;
(function (CashierPaymentStatus) {
    CashierPaymentStatus["Pending"] = "PENDING";
    CashierPaymentStatus["Succeeded"] = "SUCCEEDED";
    CashierPaymentStatus["Failed"] = "FAILED";
})(CashierPaymentStatus || (exports.CashierPaymentStatus = CashierPaymentStatus = {}));
function computeCashierOrderTotal(items) {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}
//# sourceMappingURL=cashier.entity.js.map