"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiReviewVerdict = exports.AuditRiskLevel = void 0;
/**
 * 审计记录状态
 */
var AuditRiskLevel;
(function (AuditRiskLevel) {
    AuditRiskLevel["Low"] = "low";
    AuditRiskLevel["Medium"] = "medium";
    AuditRiskLevel["High"] = "high";
})(AuditRiskLevel || (exports.AuditRiskLevel = AuditRiskLevel = {}));
/**
 * AI 调用审查裁决
 */
var AiReviewVerdict;
(function (AiReviewVerdict) {
    AiReviewVerdict["Approved"] = "approved";
    AiReviewVerdict["ApprovedWithGuardrails"] = "approved-with-guardrails";
    AiReviewVerdict["ManualReview"] = "manual-review";
})(AiReviewVerdict || (exports.AiReviewVerdict = AiReviewVerdict = {}));
//# sourceMappingURL=trust-governance.entity.js.map