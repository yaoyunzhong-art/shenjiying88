import type { RequestTenantContext } from '../tenant/tenant.types';
import { WorkbenchService } from './workbench.service';
export declare class WorkbenchController {
    private readonly workbenchService;
    constructor(workbenchService: WorkbenchService);
    getBootstrap(tenantContext: RequestTenantContext): import("@m5/types").WorkbenchBootstrapResponse;
}
//# sourceMappingURL=workbench.controller.d.ts.map