import type { RequestTenantContext } from '../tenant/tenant.types';
import { GetDiagnosticsDto, GetOperationSnapshotDto, GetRecommendationsDto } from './analytics.dto';
import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOperationSnapshot(tenantContext: RequestTenantContext, body: GetOperationSnapshotDto): import("./analytics.entity").OperationSnapshot;
    getDiagnostics(tenantContext: RequestTenantContext, body: GetDiagnosticsDto): import("./analytics.entity").Diagnostic[];
    getRecommendations(tenantContext: RequestTenantContext, body: GetRecommendationsDto): import("./analytics.entity").DiagnosticRecommendation[];
}
//# sourceMappingURL=analytics.controller.d.ts.map