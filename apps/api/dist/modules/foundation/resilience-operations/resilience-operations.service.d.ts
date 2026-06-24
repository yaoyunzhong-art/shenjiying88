import type { FoundationGovernanceBaseline, FoundationModuleDescriptor } from '../foundation.types';
interface ObservabilitySignalRecord {
    signal: 'metrics' | 'logs' | 'traces';
    status: 'healthy' | 'warning' | 'critical';
    coverage: number;
    collectionLagSeconds: number;
    lastCollectedAt: string;
    owner: string;
    alertRoutes: string[];
    evidence: string[];
}
interface RetryPolicyRecord {
    key: string;
    capability: string;
    trigger: string;
    maxAttempts: number;
    backoff: string;
    recoveryAction: string;
    escalationTarget: string;
}
interface RecoveryPlanRecord {
    resource: string;
    status: 'ready' | 'attention';
    rtoMinutes: number;
    rpoMinutes: number;
    lastDrillAt: string;
    staleAfterDays: number;
    dependencies: string[];
    runbook: string;
}
export declare class ResilienceOperationsService {
    private readonly observabilitySignals;
    private readonly retryPolicies;
    private readonly recoveryPlans;
    getManagementMetadata(): {
        operation: string;
        rbac: {
            resource: string;
            action: string;
            requiredRoles: string[];
            requiredPermissions: string[];
        };
    }[];
    stageEdgeReplay(storeId: string, operationCount: number): {
        status: string;
        storeId: string;
        operationCount: number;
        replayPipeline: string[];
        retryPolicy: RetryPolicyRecord | undefined;
        observabilityHooks: string[];
        recoveryPlan: RecoveryPlanRecord | undefined;
    };
    describeRecoveryPlan(resource: string): {
        status: "ready" | "attention";
        resource: string;
        baseline: string[];
        plan: RecoveryPlanRecord | null;
    };
    getObservabilitySignals(filters?: {
        status?: string;
    }): ObservabilitySignalRecord[];
    listRetryPolicies(filters?: {
        capability?: string;
    }): RetryPolicyRecord[];
    listRecoveryPlans(filters?: {
        status?: string;
    }): RecoveryPlanRecord[];
    getOperationsOverview(): {
        generatedAt: string;
        observability: {
            totalSignals: number;
            degradedSignals: number;
            byStatus: Record<string, number>;
            averageCoverage: number;
            maxCollectionLagSeconds: number;
            signals: ObservabilitySignalRecord[];
        };
        retries: {
            totalPolicies: number;
            byCapability: Record<string, number>;
            maxAttempts: number;
            policies: RetryPolicyRecord[];
        };
        recovery: {
            totalPlans: number;
            attentionRequired: number;
            staleDrills: number;
            plans: RecoveryPlanRecord[];
        };
    };
    getGovernanceBaselines(): FoundationGovernanceBaseline[];
    getDescriptor(): FoundationModuleDescriptor;
    private buildGovernanceMetadata;
}
export {};
//# sourceMappingURL=resilience-operations.service.d.ts.map