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
exports.AuthenticationStatusResponseDto = exports.IdentityAccessDescriptorResponseDto = exports.ResolvedActorContextResponseDto = exports.AuthorizationDecisionResponseDto = exports.ValidatePermissionDto = exports.ValidateRoleDto = exports.ValidateTenantScopeDto = exports.AuthorizeActionDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * Identity Access 模块 DTO 类型定义
 *
 * identity-access 是认证/授权/租户隔离的统一入口模块。
 * 绝大多数路由通过 @Param / @TenantContext / @CurrentActor 等参数装饰器绑定路由参数，
 * 少数需要在请求体中显式传递的载荷由此文件定义。
 */
// ── Authorization Request DTOs ──
/**
 * 授权判定请求体
 */
class AuthorizeActionDto {
    action;
    tenantId;
    brandId;
    storeId;
}
exports.AuthorizeActionDto = AuthorizeActionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizeActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizeActionDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizeActionDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizeActionDto.prototype, "storeId", void 0);
/**
 * 租户作用域校验请求体
 */
class ValidateTenantScopeDto {
    tenantId;
    brandId;
    storeId;
}
exports.ValidateTenantScopeDto = ValidateTenantScopeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidateTenantScopeDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidateTenantScopeDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ValidateTenantScopeDto.prototype, "storeId", void 0);
/**
 * 角色校验请求体
 */
class ValidateRoleDto {
    roles;
}
exports.ValidateRoleDto = ValidateRoleDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ValidateRoleDto.prototype, "roles", void 0);
/**
 * 权限校验请求体
 */
class ValidatePermissionDto {
    permissions;
}
exports.ValidatePermissionDto = ValidatePermissionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ValidatePermissionDto.prototype, "permissions", void 0);
// ── Response DTOs ──
/**
 * 授权判定结果响应
 */
class AuthorizationDecisionResponseDto {
    status;
    action;
    tenantId;
    brandId;
    storeId;
    permissionMatched;
    tenantScopeMatched;
}
exports.AuthorizationDecisionResponseDto = AuthorizationDecisionResponseDto;
__decorate([
    (0, class_validator_1.IsIn)(['allowed', 'denied']),
    __metadata("design:type", String)
], AuthorizationDecisionResponseDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizationDecisionResponseDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizationDecisionResponseDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizationDecisionResponseDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthorizationDecisionResponseDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AuthorizationDecisionResponseDto.prototype, "permissionMatched", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AuthorizationDecisionResponseDto.prototype, "tenantScopeMatched", void 0);
/**
 * 解析后的 Actor 上下文响应（去类型化，纯运行时校验）
 */
class ResolvedActorContextResponseDto {
    authenticated;
    actor;
    tenantContext;
    effectiveTenantId;
    effectiveBrandId;
    effectiveStoreId;
    effectiveMarketCode;
    roles;
    permissions;
}
exports.ResolvedActorContextResponseDto = ResolvedActorContextResponseDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolvedActorContextResponseDto.prototype, "authenticated", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ResolvedActorContextResponseDto.prototype, "actor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ResolvedActorContextResponseDto.prototype, "tenantContext", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolvedActorContextResponseDto.prototype, "effectiveTenantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolvedActorContextResponseDto.prototype, "effectiveBrandId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolvedActorContextResponseDto.prototype, "effectiveStoreId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolvedActorContextResponseDto.prototype, "effectiveMarketCode", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ResolvedActorContextResponseDto.prototype, "roles", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ResolvedActorContextResponseDto.prototype, "permissions", void 0);
/**
 * 模块描述符响应
 */
class IdentityAccessDescriptorResponseDto {
    key;
    name;
    purpose;
    inboundContracts;
    outboundContracts;
}
exports.IdentityAccessDescriptorResponseDto = IdentityAccessDescriptorResponseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IdentityAccessDescriptorResponseDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IdentityAccessDescriptorResponseDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IdentityAccessDescriptorResponseDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], IdentityAccessDescriptorResponseDto.prototype, "inboundContracts", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], IdentityAccessDescriptorResponseDto.prototype, "outboundContracts", void 0);
/**
 * 认证状态检查响应
 */
class AuthenticationStatusResponseDto {
    authenticated;
    actorId;
    actorType;
    roles;
    permissions;
}
exports.AuthenticationStatusResponseDto = AuthenticationStatusResponseDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AuthenticationStatusResponseDto.prototype, "authenticated", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthenticationStatusResponseDto.prototype, "actorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuthenticationStatusResponseDto.prototype, "actorType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AuthenticationStatusResponseDto.prototype, "roles", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AuthenticationStatusResponseDto.prototype, "permissions", void 0);
//# sourceMappingURL=identity-access.dto.js.map