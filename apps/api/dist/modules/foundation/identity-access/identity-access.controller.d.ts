import type { RequestActorContext, RequestTenantContext } from '../../tenant/tenant.types';
import { IdentityAccessService } from './identity-access.service';
export declare class IdentityAccessController {
    private readonly identityAccessService;
    constructor(identityAccessService: IdentityAccessService);
    getContext(tenantContext: RequestTenantContext, actorContext?: RequestActorContext): import("../../tenant/tenant.types").ResolvedActorContext;
    validateRole(tenantContext: RequestTenantContext, actorContext?: RequestActorContext): {
        status: string;
        check: string;
        resolved: import("../../tenant/tenant.types").ResolvedActorContext;
    };
    validatePermission(tenantContext: RequestTenantContext, actorContext?: RequestActorContext): {
        status: string;
        check: string;
        authorization: {
            status: string;
            action: string;
            resourceScope: Record<string, string | undefined>;
            actor: RequestActorContext | null;
            permissionMatched: boolean;
            tenantScopeMatched: boolean;
            enforcedBy: string[];
        };
    };
    validateTenantScope(tenantId: string, tenantContext: RequestTenantContext, actorContext?: RequestActorContext): {
        status: string;
        check: string;
        targetTenantId: string;
        authorization: {
            status: string;
            action: string;
            resourceScope: Record<string, string | undefined>;
            actor: RequestActorContext | null;
            permissionMatched: boolean;
            tenantScopeMatched: boolean;
            enforcedBy: string[];
        };
    };
}
//# sourceMappingURL=identity-access.controller.d.ts.map