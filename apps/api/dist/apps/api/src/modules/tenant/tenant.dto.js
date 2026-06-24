"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextSetDto = exports.TenantActorDto = exports.TenantResolveResponseDto = exports.TenantResolveQueryDto = void 0;
require("reflect-metadata");
/**
 * 租户上下文解析请求 DTO
 */
class TenantResolveQueryDto {
    /** 是否启用详细输出模式 */
    verbose;
    /** 请求作用域 */
    scope;
}
exports.TenantResolveQueryDto = TenantResolveQueryDto;
/**
 * 租户上下文解析响应 DTO
 */
class TenantResolveResponseDto {
    /** 请求 ID */
    requestId;
    /** 有效的租户 ID */
    effectiveTenantId;
    /** 有效的品牌 ID */
    effectiveBrandId;
    /** 有效的门店 ID */
    effectiveStoreId;
    /** 有效的市场代码 */
    effectiveMarketCode;
    /** 演员信息 */
    actor;
    /** 数据来源 */
    source;
}
exports.TenantResolveResponseDto = TenantResolveResponseDto;
/**
 * 演员信息 DTO
 */
class TenantActorDto {
    /** 演员 ID */
    actorId;
    /** 演员类型 */
    actorType;
    /** 演员名称 */
    actorName;
    /** 角色列表 */
    roles;
    /** 权限列表 */
    permissions;
    /** 是否已认证 */
    authenticated;
}
exports.TenantActorDto = TenantActorDto;
/**
 * 租户上下文设置请求 DTO
 */
class TenantContextSetDto {
    /** 租户 ID */
    tenantId;
    /** 品牌 ID */
    brandId;
    /** 门店 ID */
    storeId;
    /** 市场代码 */
    marketCode;
}
exports.TenantContextSetDto = TenantContextSetDto;
//# sourceMappingURL=tenant.dto.js.map