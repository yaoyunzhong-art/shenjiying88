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
exports.WorkbenchActionReplayDto = exports.WorkbenchHandlerCallbackDto = exports.WorkbenchHandlerSyncDto = exports.WorkbenchRuntimeReplaySubmitDto = exports.WorkbenchSecretRotationDto = exports.WorkbenchApprovalExecuteDto = exports.CapabilityBatchCheckDto = exports.CapabilityCheckDto = exports.WorkbenchBootstrapRequestDto = exports.TenantContextDto = exports.WorkbenchQueryDto = exports.NavItemQueryDto = exports.RoleMenuAccessCheckDto = exports.RoleBootstrapConfigQueryDto = void 0;
require("reflect-metadata");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const types_1 = require("@m5/types");
/** 角色引导配置查询 DTO */
class RoleBootstrapConfigQueryDto {
    role;
}
exports.RoleBootstrapConfigQueryDto = RoleBootstrapConfigQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RoleBootstrapConfigQueryDto.prototype, "role", void 0);
/** 角色菜单越权检查 DTO */
class RoleMenuAccessCheckDto {
    actorRole;
    targetMenuRole;
}
exports.RoleMenuAccessCheckDto = RoleMenuAccessCheckDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RoleMenuAccessCheckDto.prototype, "actorRole", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RoleMenuAccessCheckDto.prototype, "targetMenuRole", void 0);
/**
 * 导航项查询 DTO
 */
class NavItemQueryDto {
    role;
    channel;
    marketCode;
    capability;
}
exports.NavItemQueryDto = NavItemQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NavItemQueryDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NavItemQueryDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NavItemQueryDto.prototype, "marketCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], NavItemQueryDto.prototype, "capability", void 0);
/**
 * 工作台列表查询 DTO
 */
class WorkbenchQueryDto {
    role;
    channel;
    initialized;
}
exports.WorkbenchQueryDto = WorkbenchQueryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WorkbenchQueryDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WorkbenchQueryDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], WorkbenchQueryDto.prototype, "initialized", void 0);
/**
 * 租户上下文 DTO
 */
class TenantContextDto {
    tenantId;
    brandId;
    storeId;
    marketCode;
}
exports.TenantContextDto = TenantContextDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TenantContextDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TenantContextDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TenantContextDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TenantContextDto.prototype, "marketCode", void 0);
/**
 * Bootstrap 请求 DTO
 */
class WorkbenchBootstrapRequestDto {
    tenantContext;
}
exports.WorkbenchBootstrapRequestDto = WorkbenchBootstrapRequestDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TenantContextDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", TenantContextDto)
], WorkbenchBootstrapRequestDto.prototype, "tenantContext", void 0);
/**
 * 角色能力检查 DTO
 */
class CapabilityCheckDto {
    role;
    capability;
}
exports.CapabilityCheckDto = CapabilityCheckDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CapabilityCheckDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CapabilityCheckDto.prototype, "capability", void 0);
/**
 * 角色能力批量检查 DTO
 */
class CapabilityBatchCheckDto {
    role;
    capabilities;
}
exports.CapabilityBatchCheckDto = CapabilityBatchCheckDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CapabilityBatchCheckDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CapabilityBatchCheckDto.prototype, "capabilities", void 0);
class WorkbenchApprovalExecuteDto {
    approvalCode;
    idempotencyKey;
    operatorNote;
    challengeProfile;
    payload;
}
exports.WorkbenchApprovalExecuteDto = WorkbenchApprovalExecuteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchApprovalExecuteDto.prototype, "approvalCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchApprovalExecuteDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WorkbenchApprovalExecuteDto.prototype, "operatorNote", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WorkbenchApprovalExecuteDto.prototype, "challengeProfile", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], WorkbenchApprovalExecuteDto.prototype, "payload", void 0);
class WorkbenchSecretRotationDto {
    secretName;
    idempotencyKey;
    rotationReason;
    targetScope;
    payload;
}
exports.WorkbenchSecretRotationDto = WorkbenchSecretRotationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchSecretRotationDto.prototype, "secretName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchSecretRotationDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WorkbenchSecretRotationDto.prototype, "rotationReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WorkbenchSecretRotationDto.prototype, "targetScope", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], WorkbenchSecretRotationDto.prototype, "payload", void 0);
class WorkbenchRuntimeReplaySubmitDto {
    sourceReceiptCode;
    idempotencyKey;
    operatorNote;
    payload;
}
exports.WorkbenchRuntimeReplaySubmitDto = WorkbenchRuntimeReplaySubmitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchRuntimeReplaySubmitDto.prototype, "sourceReceiptCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchRuntimeReplaySubmitDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WorkbenchRuntimeReplaySubmitDto.prototype, "operatorNote", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], WorkbenchRuntimeReplaySubmitDto.prototype, "payload", void 0);
class WorkbenchHandlerSyncDto {
    ticketCode;
    idempotencyKey;
}
exports.WorkbenchHandlerSyncDto = WorkbenchHandlerSyncDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchHandlerSyncDto.prototype, "ticketCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchHandlerSyncDto.prototype, "idempotencyKey", void 0);
class WorkbenchHandlerCallbackDto {
    callbackStatus;
    ackToken;
    lastEvent;
    summary;
    idempotencyKey;
}
exports.WorkbenchHandlerCallbackDto = WorkbenchHandlerCallbackDto;
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceCallbackStatuses),
    __metadata("design:type", String)
], WorkbenchHandlerCallbackDto.prototype, "callbackStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchHandlerCallbackDto.prototype, "ackToken", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceCallbackEvents),
    __metadata("design:type", String)
], WorkbenchHandlerCallbackDto.prototype, "lastEvent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchHandlerCallbackDto.prototype, "summary", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchHandlerCallbackDto.prototype, "idempotencyKey", void 0);
class WorkbenchActionReplayDto {
    ledgerKey;
    requestedFrom;
    ticketCode;
    idempotencyKey;
}
exports.WorkbenchActionReplayDto = WorkbenchActionReplayDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchActionReplayDto.prototype, "ledgerKey", void 0);
__decorate([
    (0, class_validator_1.IsIn)(types_1.runtimeGovernanceReplaySources),
    __metadata("design:type", String)
], WorkbenchActionReplayDto.prototype, "requestedFrom", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchActionReplayDto.prototype, "ticketCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WorkbenchActionReplayDto.prototype, "idempotencyKey", void 0);
//# sourceMappingURL=workbench.dto.js.map