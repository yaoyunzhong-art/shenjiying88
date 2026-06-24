"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignConditionType = exports.CampaignActionStatus = exports.CampaignActionKind = exports.CampaignTrigger = exports.CampaignStatus = void 0;
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["Draft"] = "DRAFT";
    CampaignStatus["Scheduled"] = "SCHEDULED";
    CampaignStatus["Active"] = "ACTIVE";
    CampaignStatus["Paused"] = "PAUSED";
    CampaignStatus["Completed"] = "COMPLETED";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
var CampaignTrigger;
(function (CampaignTrigger) {
    CampaignTrigger["PaymentSuccess"] = "payment.success";
    CampaignTrigger["MemberProfileSynced"] = "member.profile-synced";
    CampaignTrigger["OrderCreated"] = "order.created";
    CampaignTrigger["MemberActivityRecurring"] = "member.activity-recurring";
})(CampaignTrigger || (exports.CampaignTrigger = CampaignTrigger = {}));
var CampaignActionKind;
(function (CampaignActionKind) {
    CampaignActionKind["AwardPoints"] = "AWARD_POINTS";
    CampaignActionKind["IssueCoupon"] = "ISSUE_COUPON";
    CampaignActionKind["IssueBlindbox"] = "ISSUE_BLINDBOX";
    CampaignActionKind["RecommendTag"] = "RECOMMEND_TAG";
})(CampaignActionKind || (exports.CampaignActionKind = CampaignActionKind = {}));
var CampaignActionStatus;
(function (CampaignActionStatus) {
    CampaignActionStatus["Pending"] = "PENDING";
    CampaignActionStatus["Dispatched"] = "DISPATCHED";
    CampaignActionStatus["Failed"] = "FAILED";
    CampaignActionStatus["Skipped"] = "SKIPPED";
})(CampaignActionStatus || (exports.CampaignActionStatus = CampaignActionStatus = {}));
var CampaignConditionType;
(function (CampaignConditionType) {
    CampaignConditionType["MinOrderAmount"] = "MIN_ORDER_AMOUNT";
    CampaignConditionType["MemberLevel"] = "MEMBER_LEVEL";
    CampaignConditionType["StoreScope"] = "STORE_SCOPE";
    CampaignConditionType["BrandScope"] = "BRAND_SCOPE";
})(CampaignConditionType || (exports.CampaignConditionType = CampaignConditionType = {}));
//# sourceMappingURL=campaign.entity.js.map