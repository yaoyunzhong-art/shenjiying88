import { type StorePortal, type TobPortal } from '@m5/domain';
import type { PortalBootstrapResponse } from '@m5/types';
import { FoundationService } from '../foundation/foundation.service';
import { MarketService } from '../market/market.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
export declare class PortalService {
    private readonly marketService;
    private readonly foundationService;
    constructor(marketService: MarketService, foundationService: FoundationService);
    resolveTenantPortal(context: RequestTenantContext): TobPortal;
    resolveBrandPortal(context: RequestTenantContext): TobPortal;
    resolveStorePortal(context: RequestTenantContext): StorePortal;
    getBootstrap(context: RequestTenantContext): PortalBootstrapResponse;
}
//# sourceMappingURL=portal.service.d.ts.map