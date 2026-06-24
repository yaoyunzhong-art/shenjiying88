import { LoyaltyService } from '../loyalty/loyalty.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { AnalyticsScope, type Diagnostic, type DiagnosticRecommendation, type OperationSnapshot } from './analytics.entity';
export declare class AnalyticsService {
    private readonly loyaltyService?;
    constructor(loyaltyService?: LoyaltyService | undefined);
    getOperationSnapshot(tenantContext: RequestTenantContext, options?: {
        scope?: AnalyticsScope;
        brandId?: string;
        storeId?: string;
    }): OperationSnapshot;
    getDiagnostics(tenantContext: RequestTenantContext, options?: {
        scope?: AnalyticsScope;
        brandId?: string;
        storeId?: string;
    }): Diagnostic[];
    getRecommendations(tenantContext: RequestTenantContext, options?: {
        scope?: AnalyticsScope;
        brandId?: string;
        storeId?: string;
    }): DiagnosticRecommendation[];
    private resolveInputs;
    private buildDiagnostic;
}
//# sourceMappingURL=analytics.service.d.ts.map