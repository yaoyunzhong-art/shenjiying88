"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssueBlindboxFromPlanDto = exports.IssueCouponFromPlanDto = exports.ActivateBlindboxPlanDto = exports.ActivateCouponPlanDto = exports.RegisterBlindboxPlanDto = exports.RegisterCouponPlanDto = exports.BlindboxRewardEntryDto = exports.SettlementQueryDto = exports.BlindboxFulfillmentQueryDto = exports.CouponRedemptionQueryDto = exports.PointsLedgerQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
require("reflect-metadata");
const loyalty_entity_1 = require("./loyalty.entity");
/**
 * 积分台账查询 DTO
 */
class PointsLedgerQueryDto {
    orderId;
    memberId;
}
exports.PointsLedgerQueryDto = PointsLedgerQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PointsLedgerQueryDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PointsLedgerQueryDto.prototype, "memberId", void 0);
/**
 * 优惠券核销查询 DTO
 */
class CouponRedemptionQueryDto {
    orderId;
    memberId;
    couponCode;
}
exports.CouponRedemptionQueryDto = CouponRedemptionQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CouponRedemptionQueryDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CouponRedemptionQueryDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CouponRedemptionQueryDto.prototype, "couponCode", void 0);
/**
 * 盲盒履约查询 DTO
 */
class BlindboxFulfillmentQueryDto {
    orderId;
    memberId;
    blindboxPlanId;
}
exports.BlindboxFulfillmentQueryDto = BlindboxFulfillmentQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BlindboxFulfillmentQueryDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BlindboxFulfillmentQueryDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BlindboxFulfillmentQueryDto.prototype, "blindboxPlanId", void 0);
/**
 * 结算查询 DTO
 */
class SettlementQueryDto {
    memberId;
}
exports.SettlementQueryDto = SettlementQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SettlementQueryDto.prototype, "memberId", void 0);
class BlindboxRewardEntryDto {
    sku;
    weight;
    label;
}
exports.BlindboxRewardEntryDto = BlindboxRewardEntryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BlindboxRewardEntryDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], BlindboxRewardEntryDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BlindboxRewardEntryDto.prototype, "label", void 0);
class RegisterCouponPlanDto {
    code;
    title;
    description;
    discountType;
    discountValue;
    minOrderAmount;
    totalQuota;
    perMemberLimit;
    validFrom;
    validUntil;
}
exports.RegisterCouponPlanDto = RegisterCouponPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCouponPlanDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterCouponPlanDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterCouponPlanDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(loyalty_entity_1.CouponDiscountType),
    __metadata("design:type", String)
], RegisterCouponPlanDto.prototype, "discountType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegisterCouponPlanDto.prototype, "discountValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegisterCouponPlanDto.prototype, "minOrderAmount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RegisterCouponPlanDto.prototype, "totalQuota", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RegisterCouponPlanDto.prototype, "perMemberLimit", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], RegisterCouponPlanDto.prototype, "validFrom", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], RegisterCouponPlanDto.prototype, "validUntil", void 0);
class RegisterBlindboxPlanDto {
    blindboxPlanId;
    title;
    description;
    unitPrice;
    totalQuota;
    rewardPool;
    validFrom;
    validUntil;
}
exports.RegisterBlindboxPlanDto = RegisterBlindboxPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterBlindboxPlanDto.prototype, "blindboxPlanId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterBlindboxPlanDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterBlindboxPlanDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RegisterBlindboxPlanDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RegisterBlindboxPlanDto.prototype, "totalQuota", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BlindboxRewardEntryDto),
    __metadata("design:type", Array)
], RegisterBlindboxPlanDto.prototype, "rewardPool", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], RegisterBlindboxPlanDto.prototype, "validFrom", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], RegisterBlindboxPlanDto.prototype, "validUntil", void 0);
class ActivateCouponPlanDto {
    status;
}
exports.ActivateCouponPlanDto = ActivateCouponPlanDto;
__decorate([
    (0, class_validator_1.IsEnum)(loyalty_entity_1.LoyaltyPlanStatus),
    __metadata("design:type", String)
], ActivateCouponPlanDto.prototype, "status", void 0);
class ActivateBlindboxPlanDto {
    status;
}
exports.ActivateBlindboxPlanDto = ActivateBlindboxPlanDto;
__decorate([
    (0, class_validator_1.IsEnum)(loyalty_entity_1.LoyaltyPlanStatus),
    __metadata("design:type", String)
], ActivateBlindboxPlanDto.prototype, "status", void 0);
class IssueCouponFromPlanDto {
    memberId;
    source;
}
exports.IssueCouponFromPlanDto = IssueCouponFromPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssueCouponFromPlanDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueCouponFromPlanDto.prototype, "source", void 0);
class IssueBlindboxFromPlanDto {
    memberId;
    quantity;
}
exports.IssueBlindboxFromPlanDto = IssueBlindboxFromPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssueBlindboxFromPlanDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], IssueBlindboxFromPlanDto.prototype, "quantity", void 0);
//# sourceMappingURL=loyalty.dto.js.map