"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceStatus = exports.InvoiceType = exports.SettlementStatus = exports.AccountStatus = exports.AccountType = exports.LedgerType = void 0;
var LedgerType;
(function (LedgerType) {
    LedgerType["Revenue"] = "REVENUE";
    LedgerType["Expense"] = "EXPENSE";
    LedgerType["Refund"] = "REFUND";
    LedgerType["Adjustment"] = "ADJUSTMENT";
})(LedgerType || (exports.LedgerType = LedgerType = {}));
var AccountType;
(function (AccountType) {
    AccountType["Cash"] = "CASH";
    AccountType["Wechat"] = "WECHAT";
    AccountType["Alipay"] = "ALIPAY";
    AccountType["Bank"] = "BANK";
    AccountType["Other"] = "OTHER";
})(AccountType || (exports.AccountType = AccountType = {}));
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["Active"] = "ACTIVE";
    AccountStatus["Frozen"] = "FROZEN";
    AccountStatus["Closed"] = "CLOSED";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["Pending"] = "PENDING";
    SettlementStatus["Confirmed"] = "CONFIRMED";
    SettlementStatus["Disputed"] = "DISPUTED";
})(SettlementStatus || (exports.SettlementStatus = SettlementStatus = {}));
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["Regular"] = "REGULAR";
    InvoiceType["Vat"] = "VAT";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["Draft"] = "DRAFT";
    InvoiceStatus["Issued"] = "ISSUED";
    InvoiceStatus["Cancelled"] = "CANCELLED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
//# sourceMappingURL=finance.entity.js.map