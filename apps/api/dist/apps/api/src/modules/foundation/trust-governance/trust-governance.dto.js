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
exports.AiReviewDto = exports.MaskPiiDto = exports.ResetQuotaLedgerDto = exports.QuotaLedgerQueryDto = exports.UpsertRateLimitPolicyDto = exports.RateLimitPolicyQueryDto = exports.RateLimitCheckDto = exports.ApprovalLifecycleDto = exports.ApprovalDecisionDto = exports.ApprovalQueryDto = exports.ApprovalTimelineQueryDto = exports.AuditQueryDto = exports.AuditRecordDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AuditRecordDto {
    eventType;
    details;
    tenantId;
    actorId;
    source;
    riskLevel;
}
exports.AuditRecordDto = AuditRecordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditRecordDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AuditRecordDto.prototype, "details", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditRecordDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditRecordDto.prototype, "actorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditRecordDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['low', 'medium', 'high']),
    __metadata("design:type", String)
], AuditRecordDto.prototype, "riskLevel", void 0);
class AuditQueryDto {
    limit;
    tenantId;
    action;
    source;
    requestId;
    actorId;
    approvalTicket;
    riskLevel;
    from;
    to;
}
exports.AuditQueryDto = AuditQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AuditQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "actorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['low', 'medium', 'high']),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "riskLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditQueryDto.prototype, "to", void 0);
class ApprovalTimelineQueryDto {
    limit;
}
exports.ApprovalTimelineQueryDto = ApprovalTimelineQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ApprovalTimelineQueryDto.prototype, "limit", void 0);
class ApprovalQueryDto {
    limit;
    approvalTicket;
    operation;
    resourceType;
    resourceKey;
    requestedBy;
    decidedBy;
    tenantId;
    from;
    to;
    status;
    executed;
    executionStatus;
    hasFailures;
    failureStatus;
    groupBy;
}
exports.ApprovalQueryDto = ApprovalQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ApprovalQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "operation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "resourceKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "decidedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['PENDING', 'APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toBoolean(value)),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApprovalQueryDto.prototype, "executed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "executionStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toBoolean(value)),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApprovalQueryDto.prototype, "hasFailures", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalQueryDto.prototype, "failureStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => toStringArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(['operation', 'resourceType', 'status', 'executionStatus', 'failureStatus', 'requestedBy'], { each: true }),
    __metadata("design:type", Array)
], ApprovalQueryDto.prototype, "groupBy", void 0);
class ApprovalDecisionDto {
    decidedBy;
    expectedVersion;
    decisionNote;
}
exports.ApprovalDecisionDto = ApprovalDecisionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalDecisionDto.prototype, "decidedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ApprovalDecisionDto.prototype, "expectedVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalDecisionDto.prototype, "decisionNote", void 0);
class ApprovalLifecycleDto {
    operatorId;
    expectedVersion;
    reason;
}
exports.ApprovalLifecycleDto = ApprovalLifecycleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalLifecycleDto.prototype, "operatorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ApprovalLifecycleDto.prototype, "expectedVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalLifecycleDto.prototype, "reason", void 0);
class RateLimitCheckDto {
    scopeKey;
    limit;
    windowSeconds;
    blockSeconds;
}
exports.RateLimitCheckDto = RateLimitCheckDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateLimitCheckDto.prototype, "scopeKey", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RateLimitCheckDto.prototype, "limit", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RateLimitCheckDto.prototype, "windowSeconds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RateLimitCheckDto.prototype, "blockSeconds", void 0);
class RateLimitPolicyQueryDto {
    code;
    tenantId;
    brandId;
    storeId;
    integrationAppId;
}
exports.RateLimitPolicyQueryDto = RateLimitPolicyQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateLimitPolicyQueryDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateLimitPolicyQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateLimitPolicyQueryDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateLimitPolicyQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RateLimitPolicyQueryDto.prototype, "integrationAppId", void 0);
class UpsertRateLimitPolicyDto {
    code;
    scopeType;
    tenantId;
    brandId;
    storeId;
    integrationAppId;
    period;
    limit;
    burstLimit;
    dimensionKeys;
    algorithm;
    metadata;
    requestedBy;
    approvalTicket;
    approvalStatus;
}
exports.UpsertRateLimitPolicyDto = UpsertRateLimitPolicyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION']),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "integrationAppId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['MINUTE', 'HOUR', 'DAY', 'MONTH']),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "period", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertRateLimitPolicyDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpsertRateLimitPolicyDto.prototype, "burstLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpsertRateLimitPolicyDto.prototype, "dimensionKeys", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "algorithm", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpsertRateLimitPolicyDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], UpsertRateLimitPolicyDto.prototype, "approvalStatus", void 0);
class QuotaLedgerQueryDto {
    policyCode;
    subjectKey;
    tenantId;
    limit;
}
exports.QuotaLedgerQueryDto = QuotaLedgerQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuotaLedgerQueryDto.prototype, "policyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuotaLedgerQueryDto.prototype, "subjectKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuotaLedgerQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QuotaLedgerQueryDto.prototype, "limit", void 0);
class ResetQuotaLedgerDto {
    policyCode;
    ledgerId;
    subjectKey;
    resetAllActive;
    requestedBy;
    approvalTicket;
    approvalStatus;
}
exports.ResetQuotaLedgerDto = ResetQuotaLedgerDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetQuotaLedgerDto.prototype, "policyCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetQuotaLedgerDto.prototype, "ledgerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetQuotaLedgerDto.prototype, "subjectKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResetQuotaLedgerDto.prototype, "resetAllActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetQuotaLedgerDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetQuotaLedgerDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']),
    __metadata("design:type", String)
], ResetQuotaLedgerDto.prototype, "approvalStatus", void 0);
class MaskPiiDto {
    payload;
}
exports.MaskPiiDto = MaskPiiDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], MaskPiiDto.prototype, "payload", void 0);
class AiReviewDto {
    modelCode;
    tenantId;
    purpose;
    prompt;
    estimatedTokens;
}
exports.AiReviewDto = AiReviewDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiReviewDto.prototype, "modelCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiReviewDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiReviewDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AiReviewDto.prototype, "prompt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AiReviewDto.prototype, "estimatedTokens", void 0);
function toBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
    }
    return value;
}
function toStringArray(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return value;
}
//# sourceMappingURL=trust-governance.dto.js.map