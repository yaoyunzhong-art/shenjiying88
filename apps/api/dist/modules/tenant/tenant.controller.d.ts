import { TenantAwareRequest } from './tenant.types';
export declare class TenantController {
    resolveTenant(req: TenantAwareRequest): {
        requestId: string | undefined;
        effectiveTenantId: string;
        effectiveBrandId: string | undefined;
        effectiveStoreId: string | undefined;
        effectiveMarketCode: string | undefined;
        actor: {
            actorId: string;
            actorType: import("./tenant.types").ActorType;
            actorName: string | undefined;
            roles: string[];
            permissions: string[];
            authenticated: boolean;
        } | null;
        source: string;
    };
}
//# sourceMappingURL=tenant.controller.d.ts.map