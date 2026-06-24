"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTenantResolveContract = toTenantResolveContract;
exports.toTenantContextContract = toTenantContextContract;
exports.toTenantActorContract = toTenantActorContract;
exports.toTenantScopeCheckContract = toTenantScopeCheckContract;
exports.toTenantControllerResponseToContract = toTenantControllerResponseToContract;
/**
 * Convert internal ResolvedActorContext to cross-module contract.
 * Strips internal governance details and exposes only safe fields.
 */
function toTenantResolveContract(ctx) {
    const actor = ctx.actor
        ? {
            actorId: ctx.actor.actorId,
            actorType: ctx.actor.actorType,
            actorName: ctx.actor.actorName,
            roles: ctx.actor.roles,
            permissions: ctx.actor.permissions,
            authenticated: ctx.actor.authenticated,
            source: ctx.actor.source
        }
        : null;
    return {
        effectiveTenantId: ctx.effectiveTenantId,
        effectiveBrandId: ctx.effectiveBrandId,
        effectiveStoreId: ctx.effectiveStoreId,
        effectiveMarketCode: ctx.effectiveMarketCode,
        actor,
        source: 'tenant-module'
    };
}
/**
 * Convert internal RequestTenantContext to cross-module contract.
 */
function toTenantContextContract(ctx) {
    return {
        tenantId: ctx.tenantId,
        brandId: ctx.brandId,
        storeId: ctx.storeId,
        marketCode: ctx.marketCode
    };
}
/**
 * Convert internal actor to cross-module contract.
 */
function toTenantActorContract(actor) {
    if (!actor)
        return null;
    return {
        actorId: actor.actorId,
        actorType: actor.actorType,
        actorName: actor.actorName,
        roles: actor.roles,
        permissions: actor.permissions,
        authenticated: actor.authenticated,
        source: actor.source
    };
}
/**
 * Build a scope check contract from resolution result and requirements.
 */
function toTenantScopeCheckContract(ctx, requiredTenantId, requiredBrandId, requiredStoreId) {
    const matches = (!requiredTenantId || ctx.effectiveTenantId === requiredTenantId) &&
        (!requiredBrandId || ctx.effectiveBrandId === requiredBrandId) &&
        (!requiredStoreId || ctx.effectiveStoreId === requiredStoreId);
    return {
        matches,
        requiredTenantId,
        requiredBrandId,
        requiredStoreId,
        effectiveTenantId: ctx.effectiveTenantId,
        effectiveBrandId: ctx.effectiveBrandId,
        effectiveStoreId: ctx.effectiveStoreId
    };
}
/**
 * Convert controller response shape to tenant resolve contract.
 */
function toTenantControllerResponseToContract(response) {
    return {
        requestId: response.requestId,
        effectiveTenantId: response.effectiveTenantId,
        effectiveBrandId: response.effectiveBrandId,
        effectiveStoreId: response.effectiveStoreId,
        effectiveMarketCode: response.effectiveMarketCode,
        actor: response.actor
            ? toTenantActorContract(response.actor)
            : null,
        source: response.source ?? 'tenant-module'
    };
}
//# sourceMappingURL=tenant.contract.js.map