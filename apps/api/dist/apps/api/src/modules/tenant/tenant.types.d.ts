import type { Request } from 'express';
export type ActorType = 'platform-user' | 'tenant-user' | 'brand-user' | 'store-user' | 'employee-user' | 'service-account';
export interface RequestTenantContext {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export interface RequestActorContext {
    actorId: string;
    actorType: ActorType;
    actorName?: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    roles: string[];
    permissions: string[];
    authenticated: boolean;
    source: 'headers';
}
export interface TenantScopeRequirement {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
}
export interface RequestRateLimitDecision {
    applied: boolean;
    scopeKey?: string;
    allowed?: boolean;
    limit?: number;
    remaining?: number;
    retryAfterSeconds?: number;
    state?: Record<string, unknown>;
}
export interface RequestGovernanceContext {
    requestId: string;
    startedAt: number;
    rateLimit?: RequestRateLimitDecision;
}
export interface ResolvedActorContext {
    authenticated: boolean;
    actor: RequestActorContext | null;
    tenantContext: RequestTenantContext;
    effectiveTenantId: string;
    effectiveBrandId?: string;
    effectiveStoreId?: string;
    effectiveMarketCode: string;
    roles: string[];
    permissions: string[];
}
export interface TenantAwareRequest extends Request {
    tenantContext: RequestTenantContext;
    actorContext?: RequestActorContext;
    governanceContext?: RequestGovernanceContext;
}
//# sourceMappingURL=tenant.types.d.ts.map