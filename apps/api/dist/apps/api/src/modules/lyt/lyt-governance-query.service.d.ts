import type { LytConnectionCapabilityReadinessContract, LytConnectionGovernanceAlertsContract, LytConnectionGovernanceSummaryContract, LytStoreCapabilityAccessViewContract } from './lyt.contract';
import { LytConnectionManager } from './lyt-connection.manager';
import type { RequestTenantContext } from '../tenant/tenant.types';
export declare class LytGovernanceQueryService {
    private readonly connectionManager;
    private readonly governedCapabilities;
    constructor(connectionManager: LytConnectionManager);
    getConnectionCapabilityReadiness(storeId: string, tenantContext?: RequestTenantContext): Promise<LytConnectionCapabilityReadinessContract>;
    getConnectionGovernanceSummary(tenantContext?: RequestTenantContext): Promise<LytConnectionGovernanceSummaryContract>;
    getConnectionGovernanceAlerts(tenantContext?: RequestTenantContext): Promise<LytConnectionGovernanceAlertsContract>;
    getStoreCapabilityAccessView(storeId: string, tenantContext?: RequestTenantContext): Promise<LytStoreCapabilityAccessViewContract>;
    private findStoreRecord;
    private getScopedReadinessList;
    private buildConnectionCapabilityReadiness;
    private resolveCapabilityReadiness;
    private buildCapabilityReadinessRecommendations;
    private buildGovernanceSummaryRecommendations;
    private buildGovernanceStoreGroups;
    private buildGovernanceSummaryStoreItem;
    private getStoreAlertCodes;
    private getStoreGovernanceRiskLevel;
    private getStoreIssueActions;
    private buildStoreFocusTrail;
    private buildGovernanceAlerts;
    private collectAffectedCapabilities;
    private collectEnabledCapabilities;
    private mapReadinessToCapabilityAccess;
    private getCapabilityAccessReason;
}
//# sourceMappingURL=lyt-governance-query.service.d.ts.map