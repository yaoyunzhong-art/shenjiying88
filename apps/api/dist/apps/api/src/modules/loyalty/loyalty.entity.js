"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoyaltyPlanStatus = exports.CouponDiscountType = exports.BlindboxFulfillmentStatus = exports.CouponRedemptionStatus = exports.LoyaltySettlementStatus = void 0;
var LoyaltySettlementStatus;
(function (LoyaltySettlementStatus) {
    LoyaltySettlementStatus["Succeeded"] = "SUCCEEDED";
    LoyaltySettlementStatus["Failed"] = "FAILED";
})(LoyaltySettlementStatus || (exports.LoyaltySettlementStatus = LoyaltySettlementStatus = {}));
var CouponRedemptionStatus;
(function (CouponRedemptionStatus) {
    CouponRedemptionStatus["Redeemed"] = "REDEEMED";
    CouponRedemptionStatus["Released"] = "RELEASED";
})(CouponRedemptionStatus || (exports.CouponRedemptionStatus = CouponRedemptionStatus = {}));
var BlindboxFulfillmentStatus;
(function (BlindboxFulfillmentStatus) {
    BlindboxFulfillmentStatus["Fulfilled"] = "FULFILLED";
    BlindboxFulfillmentStatus["Skipped"] = "SKIPPED";
    BlindboxFulfillmentStatus["Revoked"] = "REVOKED";
})(BlindboxFulfillmentStatus || (exports.BlindboxFulfillmentStatus = BlindboxFulfillmentStatus = {}));
var CouponDiscountType;
(function (CouponDiscountType) {
    CouponDiscountType["FixedAmount"] = "FIXED_AMOUNT";
    CouponDiscountType["Percentage"] = "PERCENTAGE";
})(CouponDiscountType || (exports.CouponDiscountType = CouponDiscountType = {}));
var LoyaltyPlanStatus;
(function (LoyaltyPlanStatus) {
    LoyaltyPlanStatus["Draft"] = "DRAFT";
    LoyaltyPlanStatus["Active"] = "ACTIVE";
    LoyaltyPlanStatus["Paused"] = "PAUSED";
    LoyaltyPlanStatus["Expired"] = "EXPIRED";
})(LoyaltyPlanStatus || (exports.LoyaltyPlanStatus = LoyaltyPlanStatus = {}));
//# sourceMappingURL=loyalty.entity.js.map