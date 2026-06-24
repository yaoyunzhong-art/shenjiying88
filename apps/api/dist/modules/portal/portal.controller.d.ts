import type { RequestTenantContext } from '../tenant/tenant.types';
import { PortalService } from './portal.service';
export declare class PortalController {
    private readonly portalService;
    constructor(portalService: PortalService);
    getBootstrap(tenantContext: RequestTenantContext): import("@m5/types").PortalBootstrapResponse;
}
//# sourceMappingURL=portal.controller.d.ts.map