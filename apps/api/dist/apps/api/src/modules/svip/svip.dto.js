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
exports.SvipTierQueryDto = exports.SvipMemberQueryDto = exports.UseSvipBenefitDto = exports.SvipUpgradeDto = exports.SvipBenefitDto = exports.CreateSvipMemberDto = exports.SvipTierDto = void 0;
const class_validator_1 = require("class-validator");
require("reflect-metadata");
const svip_entity_1 = require("./svip.entity");
/**
 * SVIP 等级 DTO
 */
class SvipTierDto {
    id;
    name;
    level;
    minSpendAmount;
    minPoints;
    benefits;
    icon;
    color;
}
exports.SvipTierDto = SvipTierDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SvipTierDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SvipTierDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], SvipTierDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SvipTierDto.prototype, "minSpendAmount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SvipTierDto.prototype, "minPoints", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SvipTierDto.prototype, "benefits", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SvipTierDto.prototype, "icon", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SvipTierDto.prototype, "color", void 0);
/**
 * 创建 SVIP 会员 DTO
 */
class CreateSvipMemberDto {
    memberId;
    tierId;
    totalSpend;
    currentPoints;
    joinedAt;
    expiresAt;
    autoRenew;
    brandId;
    storeId;
}
exports.CreateSvipMemberDto = CreateSvipMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSvipMemberDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSvipMemberDto.prototype, "tierId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSvipMemberDto.prototype, "totalSpend", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSvipMemberDto.prototype, "currentPoints", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSvipMemberDto.prototype, "joinedAt", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    __metadata("design:type", String)
], CreateSvipMemberDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSvipMemberDto.prototype, "autoRenew", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSvipMemberDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSvipMemberDto.prototype, "storeId", void 0);
/**
 * SVIP 权益 DTO
 */
class SvipBenefitDto {
    id;
    tierId;
    benefitType;
    benefitValue;
    description;
    isActive;
}
exports.SvipBenefitDto = SvipBenefitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SvipBenefitDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SvipBenefitDto.prototype, "tierId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(svip_entity_1.SvipBenefitType),
    __metadata("design:type", String)
], SvipBenefitDto.prototype, "benefitType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SvipBenefitDto.prototype, "benefitValue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SvipBenefitDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SvipBenefitDto.prototype, "isActive", void 0);
/**
 * SVIP 升降级 DTO
 */
class SvipUpgradeDto {
    memberId;
    targetTierLevel;
    totalSpend;
    currentPoints;
    reason;
}
exports.SvipUpgradeDto = SvipUpgradeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SvipUpgradeDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SvipUpgradeDto.prototype, "targetTierLevel", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SvipUpgradeDto.prototype, "totalSpend", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SvipUpgradeDto.prototype, "currentPoints", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SvipUpgradeDto.prototype, "reason", void 0);
/**
 * SVIP 权益使用 DTO
 */
class UseSvipBenefitDto {
    memberId;
    benefitType;
    referenceOrderId;
    referencePaymentId;
}
exports.UseSvipBenefitDto = UseSvipBenefitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UseSvipBenefitDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(svip_entity_1.SvipBenefitType),
    __metadata("design:type", String)
], UseSvipBenefitDto.prototype, "benefitType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UseSvipBenefitDto.prototype, "referenceOrderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UseSvipBenefitDto.prototype, "referencePaymentId", void 0);
/**
 * SVIP 会员查询 DTO
 */
class SvipMemberQueryDto {
    memberId;
    status;
    tierLevel;
}
exports.SvipMemberQueryDto = SvipMemberQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SvipMemberQueryDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(svip_entity_1.SvipMemberStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SvipMemberQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], SvipMemberQueryDto.prototype, "tierLevel", void 0);
/**
 * SVIP 等级查询 DTO
 */
class SvipTierQueryDto {
    level;
}
exports.SvipTierQueryDto = SvipTierQueryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], SvipTierQueryDto.prototype, "level", void 0);
//# sourceMappingURL=svip.dto.js.map