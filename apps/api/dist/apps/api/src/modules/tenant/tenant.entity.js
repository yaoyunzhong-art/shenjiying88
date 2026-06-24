"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActorTypes = exports.DEFAULT_MARKET_CODE = exports.DEFAULT_TENANT_ID = void 0;
exports.createDefaultTenantContext = createDefaultTenantContext;
exports.createEmptyResolvedActorContext = createEmptyResolvedActorContext;
exports.resolveEffectiveTenantId = resolveEffectiveTenantId;
exports.resolveEffectiveBrandId = resolveEffectiveBrandId;
exports.resolveEffectiveStoreId = resolveEffectiveStoreId;
exports.resolveEffectiveMarketCode = resolveEffectiveMarketCode;
exports.isActorAuthenticated = isActorAuthenticated;
exports.actorSummary = actorSummary;
exports.matchesTenantScope = matchesTenantScope;
/**
 * 默认租户 ID
 */
exports.DEFAULT_TENANT_ID = 'tenant-demo';
/**
 * 默认市场代码
 */
exports.DEFAULT_MARKET_CODE = 'default';
/**
 * 演员类型枚举值
 */
exports.ActorTypes = {
    PlatformUser: 'platform-user',
    TenantUser: 'tenant-user',
    BrandUser: 'brand-user',
    StoreUser: 'store-user',
    EmployeeUser: 'employee-user',
    ServiceAccount: 'service-account'
};
/**
 * 构造默认的请求租户上下文
 */
function createDefaultTenantContext(overrides) {
    return {
        tenantId: exports.DEFAULT_TENANT_ID,
        marketCode: exports.DEFAULT_MARKET_CODE,
        ...overrides
    };
}
/**
 * 构造默认的已解析演员上下文
 */
function createEmptyResolvedActorContext(overrides) {
    return {
        authenticated: false,
        actor: null,
        tenantContext: createDefaultTenantContext(),
        effectiveTenantId: exports.DEFAULT_TENANT_ID,
        effectiveMarketCode: exports.DEFAULT_MARKET_CODE,
        roles: [],
        permissions: [],
        ...overrides
    };
}
/**
 * 确定有效的租户 ID：actor > tenant > 默认
 */
function resolveEffectiveTenantId(actorContext, tenantContext) {
    return actorContext?.tenantId ?? tenantContext?.tenantId ?? exports.DEFAULT_TENANT_ID;
}
/**
 * 确定有效的品牌 ID：actor > tenant
 */
function resolveEffectiveBrandId(actorContext, tenantContext) {
    return actorContext?.brandId ?? tenantContext?.brandId;
}
/**
 * 确定有效的门店 ID：actor > tenant
 */
function resolveEffectiveStoreId(actorContext, tenantContext) {
    return actorContext?.storeId ?? tenantContext?.storeId;
}
/**
 * 确定有效的市场代码：从 tenantContext 取
 */
function resolveEffectiveMarketCode(tenantContext) {
    return tenantContext?.marketCode ?? exports.DEFAULT_MARKET_CODE;
}
/**
 * 检查演员是否已认证
 */
function isActorAuthenticated(actorContext) {
    return actorContext?.authenticated ?? false;
}
/**
 * 将演员上下文格式化为摘要信息
 */
function actorSummary(actorContext) {
    if (!actorContext)
        return null;
    const parts = [];
    if (actorContext.actorName)
        parts.push(actorContext.actorName);
    if (actorContext.actorType)
        parts.push(`[${actorContext.actorType}]`);
    if (actorContext.roles.length > 0)
        parts.push(`roles:${actorContext.roles.join(',')}`);
    return parts.join(' ') || actorContext.actorId;
}
/**
 * 判断租户作用域是否匹配
 */
function matchesTenantScope(ctx, requirement) {
    if (!requirement)
        return true;
    if (requirement.tenantId && ctx.effectiveTenantId !== requirement.tenantId)
        return false;
    if (requirement.brandId && ctx.effectiveBrandId !== requirement.brandId)
        return false;
    if (requirement.storeId && ctx.effectiveStoreId !== requirement.storeId)
        return false;
    return true;
}
//# sourceMappingURL=tenant.entity.js.map