import type { RequestTenantContext } from '../tenant/tenant.types';
export interface BootstrapHealthResponse {
    status: 'ok';
    uptime: number;
    phase: 'scaffold';
}
export interface BootstrapMetadataResponse {
    tenantContext: RequestTenantContext;
    foundationDependencies: string[];
    phase: 'scaffold';
}
export declare class BootstrapService {
    /**
     * Returns bootstrap health with uptime.
     * Delegated from BootstrapController.getHealth().
     */
    getHealth(): BootstrapHealthResponse;
    /**
     * Returns bootstrap metadata for the given tenant context.
     * Delegated from BootstrapController.getBootstrapMetadata().
     */
    getBootstrapMetadata(tenantContext: RequestTenantContext): BootstrapMetadataResponse;
}
//# sourceMappingURL=bootstrap.service.d.ts.map