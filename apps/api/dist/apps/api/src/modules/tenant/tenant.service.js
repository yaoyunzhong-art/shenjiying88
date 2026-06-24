"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
/**
 * 多租户上下文解析服务。
 *
 * 合并规则：
 *  - effectiveTenantId: actor > tenant > 默认 'tenant-demo'
 *  - effectiveBrandId / effectiveStoreId: actor > tenant
 *  - effectiveMarketCode: 直接从 tenantContext 取
 */
class TenantService {
    resolveTenantContext(tenantContext, actorContext, _governanceContext) {
        const effectiveTenantId = actorContext?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo';
        const effectiveBrandId = actorContext?.brandId ?? tenantContext?.brandId;
        const effectiveStoreId = actorContext?.storeId ?? tenantContext?.storeId;
        const effectiveMarketCode = tenantContext?.marketCode ?? 'default';
        const actor = actorContext ?? null;
        const isAuthenticated = actor?.authenticated ?? false;
        return {
            authenticated: isAuthenticated,
            actor: actor
                ? {
                    actorId: actor.actorId,
                    actorType: actor.actorType,
                    actorName: actor.actorName ?? undefined,
                    tenantId: actor.tenantId ?? undefined,
                    brandId: actor.brandId ?? undefined,
                    storeId: actor.storeId ?? undefined,
                    roles: actor.roles ?? [],
                    permissions: actor.permissions ?? [],
                    authenticated: actor.authenticated,
                    source: actor.source
                }
                : null,
            tenantContext,
            effectiveTenantId,
            effectiveBrandId,
            effectiveStoreId,
            effectiveMarketCode,
            roles: actorContext?.roles ?? [],
            permissions: actorContext?.permissions ?? []
        };
    }
}
exports.TenantService = TenantService;
//# sourceMappingURL=tenant.service.js.map