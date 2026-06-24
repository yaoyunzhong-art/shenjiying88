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
exports.PortalQueryDto = exports.UpdatePortalDto = exports.CreatePortalDto = exports.PortalLoginEntryDto = void 0;
const class_validator_1 = require("class-validator");
const domain_1 = require("@m5/domain");
/**
 * 门户登录入口 DTO
 */
class PortalLoginEntryDto {
    label;
    loginPath;
    ssoEnabled;
}
exports.PortalLoginEntryDto = PortalLoginEntryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PortalLoginEntryDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PortalLoginEntryDto.prototype, "loginPath", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PortalLoginEntryDto.prototype, "ssoEnabled", void 0);
/**
 * 创建门户请求 DTO
 */
class CreatePortalDto {
    tenantId;
    brandId;
    storeId;
    audience;
    scopeType;
    scopeCode;
    marketCode;
    channel;
    name;
    primaryDomain;
    supportedLanguages;
    heroTitle;
    heroSubtitle;
    solutionTags;
    loginEntry;
    supportedSurfaces;
    storeName;
}
exports.CreatePortalDto = CreatePortalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_1.PortalAudience),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "audience", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_1.PortalScopeType),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "scopeCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "marketCode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_1.PortalChannel),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "primaryDomain", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(domain_1.LanguageCode, { each: true }),
    __metadata("design:type", Array)
], CreatePortalDto.prototype, "supportedLanguages", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "heroTitle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "heroSubtitle", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreatePortalDto.prototype, "solutionTags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", PortalLoginEntryDto)
], CreatePortalDto.prototype, "loginEntry", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(domain_1.StorefrontSurface, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreatePortalDto.prototype, "supportedSurfaces", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePortalDto.prototype, "storeName", void 0);
/**
 * 更新门户请求 DTO
 */
class UpdatePortalDto {
    name;
    primaryDomain;
    supportedLanguages;
    heroTitle;
    heroSubtitle;
    solutionTags;
    loginEntry;
    supportedSurfaces;
    storeName;
}
exports.UpdatePortalDto = UpdatePortalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePortalDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePortalDto.prototype, "primaryDomain", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(domain_1.LanguageCode, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdatePortalDto.prototype, "supportedLanguages", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePortalDto.prototype, "heroTitle", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePortalDto.prototype, "heroSubtitle", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdatePortalDto.prototype, "solutionTags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", PortalLoginEntryDto)
], UpdatePortalDto.prototype, "loginEntry", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(domain_1.StorefrontSurface, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdatePortalDto.prototype, "supportedSurfaces", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePortalDto.prototype, "storeName", void 0);
/**
 * 门户查询参数 DTO
 */
class PortalQueryDto {
    tenantId;
    brandId;
    storeId;
    audience;
    scopeType;
    marketCode;
}
exports.PortalQueryDto = PortalQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PortalQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PortalQueryDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PortalQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_1.PortalAudience),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PortalQueryDto.prototype, "audience", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(domain_1.PortalScopeType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PortalQueryDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PortalQueryDto.prototype, "marketCode", void 0);
//# sourceMappingURL=portal.dto.js.map