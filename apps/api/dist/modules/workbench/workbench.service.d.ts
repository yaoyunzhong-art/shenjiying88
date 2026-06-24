import { type RoleWorkbench } from '@m5/domain';
import { type WorkbenchBootstrapResponse } from '@m5/types';
import { FoundationService } from '../foundation/foundation.service';
import { MarketService } from '../market/market.service';
import { PortalService } from '../portal/portal.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
export declare class WorkbenchService {
    private readonly marketService;
    private readonly portalService;
    private readonly foundationService;
    constructor(marketService: MarketService, portalService: PortalService, foundationService: FoundationService);
    getRoleWorkbenches(): RoleWorkbench[];
    getBootstrap(context: RequestTenantContext): WorkbenchBootstrapResponse;
}
//# sourceMappingURL=workbench.service.d.ts.map