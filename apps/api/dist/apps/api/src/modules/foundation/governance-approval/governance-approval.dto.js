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
exports.GovernanceApprovalExecutionFailureDto = exports.GovernanceApprovalExecutionDto = exports.GovernanceApprovalResubmitDto = exports.GovernanceApprovalCancelDto = exports.GovernanceApprovalDecisionDto = exports.GovernanceApprovalQueryDto = exports.MaterializeGovernanceApprovalDto = void 0;
const class_validator_1 = require("class-validator");
require("reflect-metadata");
/**
 * 治理审批物化 DTO
 */
class MaterializeGovernanceApprovalDto {
    operation;
    resourceType;
    resourceKey;
    scopeType;
    tenantId;
    brandId;
    storeId;
    requestedBy;
    approvalTicket;
    approvalStatus;
}
exports.MaterializeGovernanceApprovalDto = MaterializeGovernanceApprovalDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "operation", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "resourceKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED']),
    __metadata("design:type", String)
], MaterializeGovernanceApprovalDto.prototype, "approvalStatus", void 0);
/**
 * 审批查询 DTO
 */
class GovernanceApprovalQueryDto {
    limit;
    approvalTicket;
    operation;
    resourceType;
    resourceKey;
    requestedBy;
    decidedBy;
    status;
    tenantId;
    from;
    to;
    executionStatus;
    failureStatus;
}
exports.GovernanceApprovalQueryDto = GovernanceApprovalQueryDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GovernanceApprovalQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "operation", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "resourceType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "resourceKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "requestedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "decidedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "to", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "executionStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalQueryDto.prototype, "failureStatus", void 0);
/**
 * 审批决策 DTO
 */
class GovernanceApprovalDecisionDto {
    approvalTicket;
    decidedBy;
    decisionNote;
    expectedVersion;
    status;
}
exports.GovernanceApprovalDecisionDto = GovernanceApprovalDecisionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalDecisionDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalDecisionDto.prototype, "decidedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalDecisionDto.prototype, "decisionNote", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GovernanceApprovalDecisionDto.prototype, "expectedVersion", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['APPROVED', 'REJECTED']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalDecisionDto.prototype, "status", void 0);
/**
 * 审批取消 DTO
 */
class GovernanceApprovalCancelDto {
    approvalTicket;
    cancelledBy;
    cancelReason;
    expectedVersion;
}
exports.GovernanceApprovalCancelDto = GovernanceApprovalCancelDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalCancelDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalCancelDto.prototype, "cancelledBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalCancelDto.prototype, "cancelReason", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GovernanceApprovalCancelDto.prototype, "expectedVersion", void 0);
/**
 * 审批重新提交 DTO
 */
class GovernanceApprovalResubmitDto {
    approvalTicket;
    resubmittedBy;
    resubmitReason;
    expectedVersion;
}
exports.GovernanceApprovalResubmitDto = GovernanceApprovalResubmitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalResubmitDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalResubmitDto.prototype, "resubmittedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GovernanceApprovalResubmitDto.prototype, "resubmitReason", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GovernanceApprovalResubmitDto.prototype, "expectedVersion", void 0);
/**
 * 审批执行 DTO
 */
class GovernanceApprovalExecutionDto {
    approvalTicket;
    executedBy;
    executionStatus;
    expectedVersion;
}
exports.GovernanceApprovalExecutionDto = GovernanceApprovalExecutionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalExecutionDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalExecutionDto.prototype, "executedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalExecutionDto.prototype, "executionStatus", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GovernanceApprovalExecutionDto.prototype, "expectedVersion", void 0);
/**
 * 审批执行失败 DTO
 */
class GovernanceApprovalExecutionFailureDto {
    approvalTicket;
    failedBy;
    failureStatus;
    failureReason;
    expectedVersion;
}
exports.GovernanceApprovalExecutionFailureDto = GovernanceApprovalExecutionFailureDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalExecutionFailureDto.prototype, "approvalTicket", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalExecutionFailureDto.prototype, "failedBy", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalExecutionFailureDto.prototype, "failureStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GovernanceApprovalExecutionFailureDto.prototype, "failureReason", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GovernanceApprovalExecutionFailureDto.prototype, "expectedVersion", void 0);
//# sourceMappingURL=governance-approval.dto.js.map