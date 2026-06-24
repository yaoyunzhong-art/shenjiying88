import { FoundationService } from '../foundation/foundation.service';
import { IntegrationOrchestrationService } from '../foundation/integration-orchestration/integration-orchestration.service';
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service';
import { TrustGovernanceService } from '../foundation/trust-governance/trust-governance.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { MemberService } from '../member/member.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CampaignService } from '../campaign/campaign.service';
import type { LytFixtureCompareDto, LytFixtureImportPlanDto, LytFixtureImportPreviewDto, LytWebhookDrillDto, LytWebhookFixtureReplayDto, LytWebhookIngestDto } from './lyt.dto';
import { LytAdapterRegistry } from './lyt-adapter.registry';
import { LytConnectionManager } from './lyt-connection.manager';
import { LytGovernanceQueryService } from './lyt-governance-query.service';
import type { LytAdapterSelectionContract, LytConnectionCapabilityReadinessContract, LytConnectionGovernanceAlertsContract, LytConnectionGovernanceSummaryContract, LytStoreCapabilityAccessViewContract, LytWebhookDrillContract } from './lyt.contract';
import type { RequestTenantContext } from '../tenant/tenant.types';
export declare class LytService {
    private readonly adapterRegistry;
    private readonly foundationService;
    private readonly connectionManager;
    private readonly integrationOrchestrationService;
    private readonly loyaltyService?;
    private readonly memberService?;
    private readonly transactionsService?;
    private readonly runtimeGovernanceService?;
    private readonly governanceQueryService?;
    private readonly trustGovernanceService?;
    private readonly campaignService?;
    private readonly governedCapabilities;
    constructor(adapterRegistry: LytAdapterRegistry, foundationService: FoundationService, connectionManager: LytConnectionManager, integrationOrchestrationService: IntegrationOrchestrationService, loyaltyService?: LoyaltyService | undefined, memberService?: MemberService | undefined, transactionsService?: TransactionsService | undefined, runtimeGovernanceService?: RuntimeGovernanceService | undefined, governanceQueryService?: LytGovernanceQueryService | undefined, trustGovernanceService?: TrustGovernanceService | undefined, campaignService?: CampaignService | undefined);
    private emitAudit;
    private resolveWebhookRuntimeRiskLevel;
    private buildWebhookRuntimePayloadSummary;
    private attachWebhookRuntimeReceipt;
    private syncMemberSnapshotFromStandardizedEvent;
    private syncOrderSnapshotFromStandardizedEvent;
    private triggerSnapshotConsumersFromStandardizedEvent;
    private syncPaymentSnapshotFromStandardizedEvent;
    getAdapter(): ILytAdapter;
    getAdapterSelection(storeId: string, tenantContext?: RequestTenantContext): Promise<LytAdapterSelectionContract>;
    getConnection(storeId: string, tenantContext?: RequestTenantContext): Promise<import("./lyt.entity").LytResolvedConnection>;
    getConnectionCapabilityReadiness(storeId: string, tenantContext?: RequestTenantContext): Promise<LytConnectionCapabilityReadinessContract>;
    getConnectionGovernanceSummary(tenantContext?: RequestTenantContext): Promise<LytConnectionGovernanceSummaryContract>;
    getConnectionGovernanceAlerts(tenantContext?: RequestTenantContext): Promise<LytConnectionGovernanceAlertsContract>;
    getStoreCapabilityAccessView(storeId: string, tenantContext?: RequestTenantContext): Promise<LytStoreCapabilityAccessViewContract>;
    getFixtures(filters?: {
        transport?: string;
        capability?: string;
    }): import("./lyt.contract").LytFixtureCatalogItemContract[];
    getFixtureSummary(filters?: {
        transport?: string;
        capability?: string;
    }): {
        totalFixtures: number;
        readyFixtures: number;
        blockedFixtures: number;
        highRiskBlockedFixtures: number;
        blockedFixtureKeys: string[];
        transportBreakdown: Record<"api" | "webhook", number>;
        capabilityBreakdown: Partial<Record<"payment" | "member" | "order" | "device" | "gate", number>>;
        missingFieldBreakdown: Record<string, number>;
        missingChecklistBreakdown: Record<string, number>;
        recommendedChecklistBreakdown: Record<string, number>;
        recommendedNextActions: string[];
        fixtures: {
            key: string;
            riskLevel: "high" | "medium";
            validationStatus: "ready-for-rehearsal" | "needs-sample-completion";
            missingSampleFields: string[];
            missingChecklistItems: string[];
        }[];
    };
    getFixture(key: string): import("./lyt.contract").LytFixtureCatalogItemContract;
    compareFixtureInput(key: string, input: LytFixtureCompareDto): {
        fixtureKey: import("./lyt-fixture.catalog").LytFixtureKey;
        readiness: string;
        comparedAt: string;
        payload: {
            safeExtraObserved: string[];
            riskyExtraObserved: string[];
            missingRequired: string[];
            missingRecommended: string[];
        };
        headers: {
            safeExtraObserved: string[];
            riskyExtraObserved: string[];
            missingRequired: string[];
            missingRecommended: string[];
        };
        query: {
            safeExtraObserved: string[];
            riskyExtraObserved: string[];
            missingRequired: string[];
            missingRecommended: string[];
        };
        recommendedNextActions: string[];
    };
    previewFixtureImport(key: string, input: LytFixtureImportPreviewDto): {
        fixtureKey: import("./lyt-fixture.catalog").LytFixtureKey;
        previewedAt: string;
        readinessAfterImport: string;
        changedSections: ("headers" | "payload" | "query")[];
        changedKeys: {
            payload: string[];
            headers: string[];
            query: string[];
        };
        nextSamplePayload: {
            [x: string]: unknown;
        };
        nextSampleHeaders: {
            [x: string]: string;
        };
        nextSampleQueryParams: {
            [x: string]: string;
        };
        compareReport: {
            fixtureKey: import("./lyt-fixture.catalog").LytFixtureKey;
            readiness: string;
            comparedAt: string;
            payload: {
                safeExtraObserved: string[];
                riskyExtraObserved: string[];
                missingRequired: string[];
                missingRecommended: string[];
            };
            headers: {
                safeExtraObserved: string[];
                riskyExtraObserved: string[];
                missingRequired: string[];
                missingRecommended: string[];
            };
            query: {
                safeExtraObserved: string[];
                riskyExtraObserved: string[];
                missingRequired: string[];
                missingRecommended: string[];
            };
            recommendedNextActions: string[];
        };
    };
    planFixtureImport(key: string, input: LytFixtureImportPlanDto): {
        fixtureKey: import("./lyt-fixture.catalog").LytFixtureKey;
        plannedAt: string;
        importDecision: string;
        readinessBeforeImport: string;
        readinessAfterImport: string;
        changedSections: ("headers" | "payload" | "query")[];
        recommendedPromotions: string[];
        recommendedNextActions: string[];
        sections: {
            payload: {
                add: string[];
                update: string[];
                safeExtraCandidates: string[];
                riskyExtraCandidates: string[];
                unresolvedRequiredAfterImport: string[];
                unresolvedRecommendedAfterImport: string[];
            };
            headers: {
                add: string[];
                update: string[];
                safeExtraCandidates: string[];
                riskyExtraCandidates: string[];
                unresolvedRequiredAfterImport: string[];
                unresolvedRecommendedAfterImport: string[];
            };
            query: {
                add: string[];
                update: string[];
                safeExtraCandidates: string[];
                riskyExtraCandidates: string[];
                unresolvedRequiredAfterImport: string[];
                unresolvedRecommendedAfterImport: string[];
            };
        };
        preview: {
            fixtureKey: import("./lyt-fixture.catalog").LytFixtureKey;
            previewedAt: string;
            readinessAfterImport: string;
            changedSections: ("headers" | "payload" | "query")[];
            changedKeys: {
                payload: string[];
                headers: string[];
                query: string[];
            };
            nextSamplePayload: {
                [x: string]: unknown;
            };
            nextSampleHeaders: {
                [x: string]: string;
            };
            nextSampleQueryParams: {
                [x: string]: string;
            };
            compareReport: {
                fixtureKey: import("./lyt-fixture.catalog").LytFixtureKey;
                readiness: string;
                comparedAt: string;
                payload: {
                    safeExtraObserved: string[];
                    riskyExtraObserved: string[];
                    missingRequired: string[];
                    missingRecommended: string[];
                };
                headers: {
                    safeExtraObserved: string[];
                    riskyExtraObserved: string[];
                    missingRequired: string[];
                    missingRecommended: string[];
                };
                query: {
                    safeExtraObserved: string[];
                    riskyExtraObserved: string[];
                    missingRequired: string[];
                    missingRecommended: string[];
                };
                recommendedNextActions: string[];
            };
        };
    };
    private buildFixtureSummaryRecommendations;
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
    private getMissingOptionalKeys;
    private classifyExtraObservedKeys;
    private isSafeExtraObservedKey;
    private getChangedKeys;
    private buildImportPlanSection;
    private getRecommendedPromotions;
    private buildImportPlanRecommendations;
    private buildCompareRecommendations;
    replayWebhookFixture(input: LytWebhookFixtureReplayDto): Promise<Record<string, unknown>>;
    drillWebhook(input: LytWebhookDrillDto): Promise<LytWebhookDrillContract>;
    getBootstrap(): {
        adapter: any;
        foundationDependencies: import("@m5/types").FoundationModuleKey[];
        foundationContracts: string[];
        availableAdapters: {
            adapterName: string;
            adapterMode: "mock" | "sandbox" | "real";
        }[];
        selectionStrategy: string;
    };
    acceptWebhook(input: LytWebhookIngestDto): Promise<Record<string, unknown>>;
    /**
     * 获取设备健康汇总
     * 统计各设备类型的在线/离线/维护数量及异常设备数量
     */
    getDeviceHealthSummary(devices: import('./lyt.entity').LytDevice[], thresholdMinutes?: number): import("./lyt.entity").LytDeviceHealthSummary;
}
//# sourceMappingURL=lyt.service.d.ts.map