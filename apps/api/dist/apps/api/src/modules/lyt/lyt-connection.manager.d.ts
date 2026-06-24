import { PrismaService } from '../../prisma/prisma.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
import type { LytResolvedConnection } from './lyt.entity';
export declare class LytConnectionManager {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly fallbackCapabilities;
    private readonly configuredDefaultCapabilities;
    listScopedStores(tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>): Promise<any>;
    private createResolutionChain;
    private computeHealthStatus;
    private findConnectionByResolution;
    getConnectionForStore(storeId: string, tenantContext?: Pick<RequestTenantContext, 'tenantId' | 'brandId'>): Promise<LytResolvedConnection>;
}
//# sourceMappingURL=lyt-connection.manager.d.ts.map