import type { FoundationGovernanceBaseline, FoundationModuleDescriptor } from '../foundation.types';
import type { ObservabilitySignalRecord, RetryPolicyRecord, RecoveryPlanRecord, GovernanceMetadataRecord, EdgeReplayResult, OperationsOverview, RecoveryPlanDetail } from './resilience-operations.entity';
export declare class ResilienceOperationsService {
    private readonly observabilitySignals;
    private readonly retryPolicies;
    private readonly recoveryPlans;
    getManagementMetadata(): GovernanceMetadataRecord[];
    stageEdgeReplay(storeId: string, operationCount: number): EdgeReplayResult;
    describeRecoveryPlan(resource: string): RecoveryPlanDetail;
    getObservabilitySignals(filters?: {
        status?: string;
    }): ObservabilitySignalRecord[];
    listRetryPolicies(filters?: {
        capability?: string;
    }): RetryPolicyRecord[];
    listRecoveryPlans(filters?: {
        status?: string;
    }): RecoveryPlanRecord[];
    getOperationsOverview(): OperationsOverview;
    getGovernanceBaselines(): FoundationGovernanceBaseline[];
    getDescriptor(): FoundationModuleDescriptor;
    private buildGovernanceMetadata;
}
//# sourceMappingURL=resilience-operations.service.d.ts.map