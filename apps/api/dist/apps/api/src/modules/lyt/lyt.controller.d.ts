import type { RequestTenantContext } from '../tenant/tenant.types';
import type { LytFixtureImportPlanDto, LytFixtureImportPreviewDto, LytFixtureCompareDto, LytWebhookDrillDto, LytWebhookFixtureReplayDto, LytWebhookIngestDto } from './lyt.dto';
import { LytService } from './lyt.service';
import type { LytDevice } from './lyt.entity';
export declare class LytController {
    private readonly lytService;
    constructor(lytService: LytService);
    getFixtures(transport?: string, capability?: string): import("./lyt.contract").LytFixtureCatalogItemContract[];
    getFixtureSummary(transport?: string, capability?: string): {
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
    compareFixture(key: string, body: LytFixtureCompareDto): {
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
    importFixturePreview(key: string, body: LytFixtureImportPreviewDto): {
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
    importFixturePlan(key: string, body: LytFixtureImportPlanDto): {
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
    getConnection(storeId: string, tenantContext: RequestTenantContext | undefined): Promise<import("./lyt.entity").LytResolvedConnection>;
    getConnectionCapabilityReadiness(storeId: string, tenantContext: RequestTenantContext | undefined): Promise<import("./lyt.contract").LytConnectionCapabilityReadinessContract>;
    getStoreCapabilityAccessView(storeId: string, tenantContext: RequestTenantContext | undefined): Promise<import("./lyt.contract").LytStoreCapabilityAccessViewContract>;
    getAdapterSelection(storeId: string, tenantContext: RequestTenantContext | undefined): Promise<import("./lyt.contract").LytAdapterSelectionContract>;
    getConnectionGovernanceSummary(tenantContext: RequestTenantContext | undefined): Promise<import("./lyt.contract").LytConnectionGovernanceSummaryContract>;
    getConnectionGovernanceAlerts(tenantContext: RequestTenantContext | undefined): Promise<import("./lyt.contract").LytConnectionGovernanceAlertsContract>;
    getDeviceStatus(deviceId: string): Promise<any>;
    getDeviceHealthSummary(body: {
        devices: LytDevice[];
        thresholdMinutes?: number;
    }): import("./lyt.entity").LytDeviceHealthSummary;
    acceptWebhook(body: LytWebhookIngestDto): Promise<Record<string, unknown>>;
    drillWebhook(body: LytWebhookDrillDto): Promise<import("./lyt.contract").LytWebhookDrillContract>;
    replayWebhookFixture(body: LytWebhookFixtureReplayDto): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=lyt.controller.d.ts.map