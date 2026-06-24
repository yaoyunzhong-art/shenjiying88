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
exports.RegisterSecretDto = exports.PersistFeatureFlagDto = exports.UpsertConfigEntryDto = exports.CertificateQueryDto = exports.ConfigEntryQueryDto = exports.RotateSecretDto = exports.FeatureFlagQueryDto = exports.ConfigurationScopeDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ConfigurationScopeDto {
    tenantId;
    brandId;
    storeId;
    marketCode;
}
exports.ConfigurationScopeDto = ConfigurationScopeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigurationScopeDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigurationScopeDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigurationScopeDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigurationScopeDto.prototype, "marketCode", void 0);
class FeatureFlagQueryDto extends ConfigurationScopeDto {
    subjectKey;
}
exports.FeatureFlagQueryDto = FeatureFlagQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FeatureFlagQueryDto.prototype, "subjectKey", void 0);
class RotateSecretDto {
    rotatedBy;
    requestedBy;
    approvalTicket;
    approvalStatus;
}
exports.RotateSecretDto = RotateSecretDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RotateSecretDto.prototype, "rotatedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RotateSecretDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RotateSecretDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], RotateSecretDto.prototype, "approvalStatus", void 0);
class ConfigEntryQueryDto extends ConfigurationScopeDto {
    namespace;
    key;
}
exports.ConfigEntryQueryDto = ConfigEntryQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigEntryQueryDto.prototype, "namespace", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConfigEntryQueryDto.prototype, "key", void 0);
class CertificateQueryDto extends ConfigurationScopeDto {
    name;
    status;
    expiringWithinDays;
}
exports.CertificateQueryDto = CertificateQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CertificateQueryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'expiring-soon', 'expired']),
    __metadata("design:type", String)
], CertificateQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    __metadata("design:type", Number)
], CertificateQueryDto.prototype, "expiringWithinDays", void 0);
class UpsertConfigEntryDto extends ConfigurationScopeDto {
    namespace;
    key;
    valueType;
    scopeType;
    value;
    marketProfileId;
    portalSiteId;
    schemaRef;
    tags;
    status;
    changedBy;
    changeReason;
    requestedBy;
    approvalTicket;
    approvalStatus;
}
exports.UpsertConfigEntryDto = UpsertConfigEntryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "namespace", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['JSON', 'STRING', 'NUMBER', 'BOOLEAN']),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "valueType", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION']),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsDefined)(),
    __metadata("design:type", Object)
], UpsertConfigEntryDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "marketProfileId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "portalSiteId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "schemaRef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpsertConfigEntryDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "changedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "changeReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], UpsertConfigEntryDto.prototype, "approvalStatus", void 0);
class PersistFeatureFlagDto extends ConfigurationScopeDto {
    key;
    name;
    scopeType;
    status;
    strategy;
    enabled;
    percentage;
    allowList;
    conditions;
    marketProfileId;
    description;
    note;
    startsAt;
    endsAt;
    requestedBy;
    approvalTicket;
    approvalStatus;
}
exports.PersistFeatureFlagDto = PersistFeatureFlagDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION']),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['ALL', 'PERCENTAGE', 'ALLOW_LIST', 'SCOPE_MATCH']),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "strategy", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PersistFeatureFlagDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PersistFeatureFlagDto.prototype, "percentage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(100),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PersistFeatureFlagDto.prototype, "allowList", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PersistFeatureFlagDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "marketProfileId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], PersistFeatureFlagDto.prototype, "approvalStatus", void 0);
class RegisterSecretDto extends ConfigurationScopeDto {
    key;
    type;
    scopeType;
    provider;
    integrationAppId;
    reference;
    value;
    algorithm;
    scopes;
    consumers;
    expiresAt;
    rotatedBy;
    requestedBy;
    approvalTicket;
    approvalStatus;
}
exports.RegisterSecretDto = RegisterSecretDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['api-key', 'webhook-signing', 'certificate']),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION']),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['DATABASE', 'VAULT', 'KMS', 'EXTERNAL']),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "integrationAppId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "reference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "algorithm", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterSecretDto.prototype, "scopes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegisterSecretDto.prototype, "consumers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "expiresAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "rotatedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], RegisterSecretDto.prototype, "approvalStatus", void 0);
//# sourceMappingURL=configuration-governance.dto.js.map