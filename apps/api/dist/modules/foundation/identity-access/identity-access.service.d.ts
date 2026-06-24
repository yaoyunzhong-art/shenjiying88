import type { RequestActorContext, RequestTenantContext, ResolvedActorContext, TenantScopeRequirement } from '../../tenant/tenant.types';
import type { FoundationModuleDescriptor } from '../foundation.types';
export declare class IdentityAccessService {
    private normalizeList;
    private normalizeActorContext;
    resolveActorContext(tenantContext: RequestTenantContext, actorContext?: RequestActorContext): ResolvedActorContext;
    hasAnyRole(actorContext: RequestActorContext | undefined, requiredRoles?: string[]): boolean;
    hasAllPermissions(actorContext: RequestActorContext | undefined, requiredPermissions?: string[]): boolean;
    isPrivilegedActor(actorContext?: RequestActorContext): boolean;
    validateTenantScope(tenantContext: RequestTenantContext, actorContext: RequestActorContext | undefined, requiredScope: TenantScopeRequirement): boolean;
    authorizeAction(action: string, resourceScope: Record<string, string | undefined>, tenantContext?: RequestTenantContext, actorContext?: RequestActorContext): {
        status: string;
        action: string;
        resourceScope: Record<string, string | undefined>;
        actor: RequestActorContext | null;
        permissionMatched: boolean;
        tenantScopeMatched: boolean;
        enforcedBy: string[];
    };
    getDescriptor(): FoundationModuleDescriptor;
}
//# sourceMappingURL=identity-access.service.d.ts.map