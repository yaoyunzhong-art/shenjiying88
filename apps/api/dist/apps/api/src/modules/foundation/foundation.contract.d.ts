import type { FoundationBlueprint, FoundationConsumerDescriptor, FoundationModuleDescriptor, FoundationGovernanceBaseline, FoundationOperationsAlert, FoundationAlertCatalogItem } from '@m5/types';
/**
 * Contract types for foundation module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */
/** Contract for a foundation module descriptor (cross-module safe subset) */
export interface FoundationModuleContract {
    key: string;
    name: string;
    purpose: string;
    capabilities: Array<{
        key: string;
        name: string;
        entrypoints: string[];
        consumers: string[];
        status: string;
    }>;
}
/** Contract for a foundation consumer descriptor (cross-module safe subset) */
export interface FoundationConsumerContract {
    consumer: string;
    modulePath: string;
    dependsOn: string[];
    responsibility: string;
    governanceTouchpoints: string[];
    highRiskEntrypoints: string[];
}
/** Contract for a foundation governance baseline */
export interface FoundationGovernanceBaselineContract {
    key: string;
    name: string;
    ownerModule: string;
    summary: string;
    controls: string[];
    evidence: string[];
}
/** Contract for the foundation bootstrap response */
export interface FoundationBootstrapContract {
    generatedAt: string;
    docCount: number;
    guardrails: string[];
    frontendBootstrapUrl: string | null;
    moduleCount: number;
    moduleNames: string[];
    moduleStatuses: Record<string, string>;
    consumerCount: number;
    consumerNames: string[];
    baselineCount: number;
}
/** Contract for a single operations alert */
export interface FoundationOperationsAlertContract {
    severity: 'low' | 'medium' | 'high';
    code: string;
    count: number;
    summary: string;
}
/** Contract for operations overview summary */
export interface FoundationOperationsOverviewContract {
    generatedAt: string;
    approvalCounts: {
        approvalsPending: number;
        approvalsWithFailures: number;
    };
    auditCounts: {
        highRiskAudits: number;
    };
    rateLimitCounts: {
        blockedLedgers: number;
    };
    secretCounts: {
        rotationDue: number;
        expired: number;
        expiringCertificates: number;
        expiredCertificates: number;
    };
    observabilityCounts: {
        degradedSignals: number;
    };
    recoveryCounts: {
        attentionRequired: number;
        staleDrills: number;
    };
    runtimeGovernanceCounts: {
        backlog: number;
        stalledCallbacks: number;
        highRiskBacklog: number;
        blockedActions: number;
    };
    lytGovernanceCounts: {
        alertGroups: number;
        affectedStores: number;
    };
    alerts: FoundationOperationsAlertContract[];
    alertCount: number;
    highRiskAlertCount: number;
}
/** Contract for a single consumer dependency response */
export interface FoundationConsumerDependencyContract {
    consumer: string;
    modulePath: string;
    dependsOn: string[];
    responsibility: string;
    governanceTouchpoints: string[];
    highRiskEntrypoints: string[];
    found: boolean;
}
/** Contract for module catalog response */
export interface FoundationModuleCatalogContract {
    moduleCount: number;
    moduleNames: string[];
    modules: FoundationModuleContract[];
}
export declare function toFoundationModuleContract(descriptor: FoundationModuleDescriptor): FoundationModuleContract;
export declare function toFoundationConsumerContract(descriptor: FoundationConsumerDescriptor): FoundationConsumerContract;
export declare function toFoundationGovernanceBaselineContract(baseline: FoundationGovernanceBaseline): FoundationGovernanceBaselineContract;
export declare function toFoundationBootstrapContract(blueprint: FoundationBlueprint): FoundationBootstrapContract;
export declare function toFoundationOperationsOverviewContract(input: {
    generatedAt: string;
    summary: Record<string, number>;
    alerts: FoundationOperationsAlert[];
}): FoundationOperationsOverviewContract;
export declare function toFoundationOperationsAlertContract(alert: FoundationOperationsAlert): FoundationOperationsAlertContract;
export declare function toFoundationConsumerDependencyContract(input: {
    consumer: FoundationConsumerDescriptor | undefined;
    consumerKey: string;
    allConsumerNames: string[];
}): FoundationConsumerDependencyContract;
export declare function toFoundationModuleCatalogContract(modules: FoundationModuleDescriptor[]): FoundationModuleCatalogContract;
/**
 * Build a FoundationAlertCatalogItem contract for cross-module consumption.
 * Strips path fields that are runtime-dependent.
 */
export declare function toFoundationAlertCatalogItemContract(item: FoundationAlertCatalogItem): {
    code: string;
    defaultSummary: string;
    severityPolicy: string;
    sourceModules: string[];
    drilldownEnabled: boolean;
    acknowledgementEnabled: boolean;
};
//# sourceMappingURL=foundation.contract.d.ts.map