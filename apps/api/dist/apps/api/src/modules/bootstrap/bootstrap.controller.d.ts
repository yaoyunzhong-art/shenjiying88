import type { RequestTenantContext } from '../tenant/tenant.types';
export declare class BootstrapController {
    getBootstrapMetadata(tenantContext: RequestTenantContext): {
        tenantContext: RequestTenantContext;
        foundationDependencies: import("@m5/types").FoundationModuleKey[];
        phase: string;
    };
    getHealth(): {
        status: string;
        uptime: number;
        phase: string;
    };
}
//# sourceMappingURL=bootstrap.controller.d.ts.map