"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRefundAssignmentAction = exports.TransactionRefundDispatchReason = exports.TransactionRefundEscalationLevel = exports.TransactionRefundRiskLevel = exports.TransactionRefundAgingBucket = exports.TransactionRefundReviewAction = exports.TransactionRefundStatus = void 0;
var TransactionRefundStatus;
(function (TransactionRefundStatus) {
    TransactionRefundStatus["Pending"] = "PENDING";
    TransactionRefundStatus["Rejected"] = "REJECTED";
    TransactionRefundStatus["Completed"] = "COMPLETED";
})(TransactionRefundStatus || (exports.TransactionRefundStatus = TransactionRefundStatus = {}));
var TransactionRefundReviewAction;
(function (TransactionRefundReviewAction) {
    TransactionRefundReviewAction["Approve"] = "APPROVE";
    TransactionRefundReviewAction["Reject"] = "REJECT";
})(TransactionRefundReviewAction || (exports.TransactionRefundReviewAction = TransactionRefundReviewAction = {}));
var TransactionRefundAgingBucket;
(function (TransactionRefundAgingBucket) {
    TransactionRefundAgingBucket["Under1Hour"] = "UNDER_1H";
    TransactionRefundAgingBucket["Hour1To4"] = "H1_TO_H4";
    TransactionRefundAgingBucket["Hour4To24"] = "H4_TO_H24";
    TransactionRefundAgingBucket["Over24Hours"] = "GTE_24H";
})(TransactionRefundAgingBucket || (exports.TransactionRefundAgingBucket = TransactionRefundAgingBucket = {}));
var TransactionRefundRiskLevel;
(function (TransactionRefundRiskLevel) {
    TransactionRefundRiskLevel["Low"] = "LOW";
    TransactionRefundRiskLevel["Medium"] = "MEDIUM";
    TransactionRefundRiskLevel["High"] = "HIGH";
})(TransactionRefundRiskLevel || (exports.TransactionRefundRiskLevel = TransactionRefundRiskLevel = {}));
var TransactionRefundEscalationLevel;
(function (TransactionRefundEscalationLevel) {
    TransactionRefundEscalationLevel["None"] = "NONE";
    TransactionRefundEscalationLevel["TeamLead"] = "TEAM_LEAD";
    TransactionRefundEscalationLevel["OpsManager"] = "OPS_MANAGER";
    TransactionRefundEscalationLevel["Finance"] = "FINANCE";
})(TransactionRefundEscalationLevel || (exports.TransactionRefundEscalationLevel = TransactionRefundEscalationLevel = {}));
var TransactionRefundDispatchReason;
(function (TransactionRefundDispatchReason) {
    TransactionRefundDispatchReason["PendingWithinSla"] = "PENDING_WITHIN_SLA";
    TransactionRefundDispatchReason["ApproachingSlaBreach"] = "APPROACHING_SLA_BREACH";
    TransactionRefundDispatchReason["SlaBreachedOrMediumRisk"] = "SLA_BREACHED_OR_MEDIUM_RISK";
    TransactionRefundDispatchReason["HighAmountOrLongOverdue"] = "HIGH_AMOUNT_OR_LONG_OVERDUE";
})(TransactionRefundDispatchReason || (exports.TransactionRefundDispatchReason = TransactionRefundDispatchReason = {}));
var TransactionRefundAssignmentAction;
(function (TransactionRefundAssignmentAction) {
    TransactionRefundAssignmentAction["Assign"] = "ASSIGN";
    TransactionRefundAssignmentAction["Claim"] = "CLAIM";
})(TransactionRefundAssignmentAction || (exports.TransactionRefundAssignmentAction = TransactionRefundAssignmentAction = {}));
//# sourceMappingURL=transactions.entity.js.map