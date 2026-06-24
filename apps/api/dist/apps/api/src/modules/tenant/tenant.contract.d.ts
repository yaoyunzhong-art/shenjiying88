import type { ResolvedActorContext, RequestActorContext, RequestTenantContext, ActorType } from './tenant.types';
/**
 * Contract types for tenant module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */
/** External contract for resolved actor context (cross-module safe subset) */
export interface TenantActorContract {
    actorId: string;
    actorType: ActorType;
    actorName?: string;
    roles: string[];
    permissions: string[];
    authenticated: boolean;
    source: string;
}
/** External contract for tenant resolution result */
export interface TenantResolveContract {
    requestId?: string;
    effectiveTenantId: string;
    effectiveBrandId?: string;
    effectiveStoreId?: string;
    effectiveMarketCode?: string;
    actor: TenantActorContract | null;
    source: string;
}
/** External contract for tenant context summary */
export interface TenantContextContract {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
/** External contract for tenant scope check result */
export interface TenantScopeCheckContract {
    matches: boolean;
    requiredTenantId?: string;
    requiredBrandId?: string;
    requiredStoreId?: string;
    effectiveTenantId: string;
    effectiveBrandId?: string;
    effectiveStoreId?: string;
}
/**
 * Convert internal ResolvedActorContext to cross-module contract.
 * Strips internal governance details and exposes only safe fields.
 */
export declare function toTenantResolveContract(ctx: ResolvedActorContext): TenantResolveContract;
/**
 * Convert internal RequestTenantContext to cross-module contract.
 */
export declare function toTenantContextContract(ctx: RequestTenantContext): TenantContextContract;
/**
 * Convert internal actor to cross-module contract.
 */
export declare function toTenantActorContract(actor: RequestActorContext | null): TenantActorContract | null;
/**
 * Build a scope check contract from resolution result and requirements.
 */
export declare function toTenantScopeCheckContract(ctx: ResolvedActorContext, requiredTenantId?: string, requiredBrandId?: string, requiredStoreId?: string): TenantScopeCheckContract;
/**
 * Convert controller response shape to tenant resolve contract.
 */
export declare function toTenantControllerResponseToContract(response: Record<string, unknown>): TenantResolveContract;
//# sourceMappingURL=tenant.contract.d.ts.map