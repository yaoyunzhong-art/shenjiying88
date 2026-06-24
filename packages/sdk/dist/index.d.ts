import { ApiResult, MarketBootstrapResponse, FoundationBootstrapResponse, PortalBootstrapResponse, WorkbenchBootstrapResponse, AuditTrailQuery, AuditRecordContract, AuditTrailSummary, ConfigurationOverviewQuery, ConfigurationOverview, ConfigurationFeatureFlag, ConfigurationConfigEntry, ConfigurationSecretMetadata, ConfigurationCertificateMetadata, ConfigurationGovernanceMetadataEntry, ResilienceOverview, ObservabilitySignalContract, RetryPolicyContract, RecoveryPlanContract, EdgeReplayStageRequest, EdgeReplayStageContract, RateLimitWorkspaceQuery, RateLimitPolicyRecord, QuotaLedgerRecord, RateLimitWorkspace, IdentityAccessWorkspaceQuery, IdentityAccessResolvedContext, IdentityAccessValidationResult, IntegrationWebhookSourceContract, IntegrationOrchestrationWorkspaceQuery, IntegrationEventEnvelopeContract, IntegrationIdempotencyRecordContract, IntegrationPublishEventRequest, IntegrationPublishEventResponse, IntegrationWebhookIngestRequest, IntegrationWebhookIngestResponse, IntegrationOrchestrationWorkspace, FoundationConsumerDescriptor, FoundationAlertCatalogResponse, RuntimeGovernanceOverviewFilter, FoundationOperationsOverviewResponse, FoundationAlertDrilldownResponse, FoundationAlertMutationResponse, RuntimeGovernanceSubmitRequest, RuntimeGovernanceReceipt, RuntimeGovernanceSyncRequest, RuntimeGovernanceCallbackRequest, RuntimeGovernanceReplayRequest, RuntimeGovernanceBatchReplayRequest, RuntimeGovernanceBatchReplayResponse, FoundationClientApp, RuntimeGovernanceReplaySource, RuntimeGovernanceActionKey, RuntimeGovernanceNextStep, RuntimeGovernanceRiskLevel, RuntimeGovernanceRecommendedAction, RuntimeGovernanceClientApp, FoundationAlertCatalogItem, FoundationOperationsOverviewSummary, FoundationOperationsAlert, AppBootstrapWiring, FoundationAlertMutationKind, FoundationConsumerKey } from '@m5/types';

interface ApiClientOptions {
    baseUrl: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    token?: string;
    headers?: Record<string, string>;
}
interface FoundationGovernanceReadModel {
    deliveryMode: 'api' | 'fallback';
    generatedAt: string;
    alerts: FoundationAlertCatalogItem[];
    summary: FoundationOperationsOverviewSummary;
    overviewAlerts: FoundationOperationsAlert[];
    topRisks: FoundationOperationsAlert[];
}
interface FoundationBootstrapWiringMeta {
    scope: {
        resolver: string;
        revalidateOn: string[];
        mismatchStrategy: string;
    };
    degradation: {
        featureFlagFallback: string;
        desensitizationMode: string;
        cacheableCapabilities: string[];
    };
    challenge: {
        enforcement: string;
        notes: string[];
    };
}
interface LytStoreCapabilityAccessItem {
    capability: string;
    readiness: 'ready' | 'inherited-ready' | 'stale' | 'pending-configuration' | 'not-enabled';
    access: 'enabled' | 'degraded' | 'blocked' | 'hidden';
    reason: string;
}
interface LytStoreCapabilityAccessViewResponse {
    storeId: string;
    storeCode?: string;
    storeName?: string;
    connectionStatus: 'configured' | 'pending-configuration';
    resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback';
    healthStatus?: 'healthy' | 'stale' | 'pending-configuration';
    accessByCapability: LytStoreCapabilityAccessItem[];
    recommendedNextActions: string[];
}
interface RuntimeGovernancePresetLike {
    action: RuntimeGovernanceActionKey;
    nextStep: RuntimeGovernanceNextStep;
    riskLevel: RuntimeGovernanceRiskLevel;
    requestEndpoint: string;
    payload: Record<string, unknown>;
    recommendedAction: RuntimeGovernanceRecommendedAction;
    handlerName: string;
}
interface BuildRuntimeGovernanceSubmitRequestOptions<TPreset extends RuntimeGovernancePresetLike> {
    app: RuntimeGovernanceClientApp;
    actorId: string;
    nonce: string;
    preset: TPreset;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
interface BuildRuntimeGovernanceReplayRequestOptions {
    app: FoundationClientApp;
    actorId: string;
    nonce: string;
    requestedFrom: RuntimeGovernanceReplaySource;
    receipt: RuntimeGovernanceReceipt;
    tenantId?: string;
}
type FoundationGovernanceReadModelClient = Pick<ApiClient, 'getFoundationAlertCatalog' | 'getFoundationOverview'>;
type RuntimeGovernancePanelClient = Pick<ApiClient, 'submitRuntimeGovernanceAction' | 'getRuntimeGovernanceReceipt' | 'replayRuntimeGovernanceAction'>;
interface CreateRuntimeGovernancePanelClientOptions extends Omit<ApiClientOptions, 'baseUrl'> {
    baseUrl?: string;
}
interface CreateRuntimeGovernancePanelBindingsOptions<TPreset> {
    client: RuntimeGovernancePanelClient;
    buildSubmitRequest: (preset: TPreset, nonce: string) => RuntimeGovernanceSubmitRequest;
    buildReplayRequest: (receipt: RuntimeGovernanceReceipt, nonce: string) => RuntimeGovernanceReplayRequest;
    submitInit?: RequestInit;
    queryInit?: RequestInit;
    replayInit?: RequestInit;
}
interface FoundationPortalBootstrapLike {
    foundationDependencies?: string[];
    foundationContracts?: string[];
    regionalOverrides?: unknown[];
}
interface FoundationPortalConsumerSnapshotBase {
    deliveryMode: 'api' | 'fallback';
    wiring: AppBootstrapWiring;
    consumerDescriptor: FoundationConsumerDescriptor;
    foundationDependencies: string[];
    foundationContracts: string[];
    regionalOverridesCount: number;
    scope: FoundationBootstrapWiringMeta['scope'];
    degradation: FoundationBootstrapWiringMeta['degradation'];
    challenge: FoundationBootstrapWiringMeta['challenge'];
}
declare const emptyFoundationGovernanceOverviewSummary: FoundationOperationsOverviewSummary;
declare function createFoundationBootstrapWiringMeta(wiring: AppBootstrapWiring): FoundationBootstrapWiringMeta;
declare function createFoundationGovernanceReadModelLoader<TArgs extends unknown[]>(clientFactory: (...args: TArgs) => FoundationGovernanceReadModelClient, init?: RequestInit): (...args: TArgs) => Promise<FoundationGovernanceReadModel>;
declare function createRuntimeGovernancePanelClient(options: CreateRuntimeGovernancePanelClientOptions): ApiClient;
declare function createRuntimeGovernancePanelBindings<TPreset>({ client, buildSubmitRequest, buildReplayRequest, submitInit, queryInit, replayInit }: CreateRuntimeGovernancePanelBindingsOptions<TPreset>): {
    submitPreset: (preset: TPreset, nonce: string) => Promise<RuntimeGovernanceReceipt>;
    queryReceipt: (receipt: RuntimeGovernanceReceipt) => Promise<RuntimeGovernanceReceipt>;
    replayReceipt: (receipt: RuntimeGovernanceReceipt, nonce: string) => Promise<RuntimeGovernanceReceipt>;
};
declare function createFoundationPortalConsumerSnapshotBase({ wiring, bootstrap, consumerDescriptor }: {
    wiring: AppBootstrapWiring;
    bootstrap: FoundationPortalBootstrapLike | null;
    consumerDescriptor: FoundationConsumerDescriptor | null;
}): FoundationPortalConsumerSnapshotBase;
declare function buildRuntimeGovernanceSubmitRequest<TPreset extends RuntimeGovernancePresetLike>({ app, actorId, nonce, preset, tenantId, brandId, storeId, marketCode }: BuildRuntimeGovernanceSubmitRequestOptions<TPreset>): RuntimeGovernanceSubmitRequest;
declare function buildRuntimeGovernanceReplayRequest({ app, actorId, nonce, requestedFrom, receipt, tenantId }: BuildRuntimeGovernanceReplayRequestOptions): RuntimeGovernanceReplayRequest;
declare const fallbackPortalConsumerDescriptor: FoundationConsumerDescriptor;
declare function getDefaultApiBaseUrl(): string;
declare function createFoundationAlertClient(options: Omit<ApiClientOptions, 'baseUrl'> & {
    baseUrl?: string;
}): ApiClient;
interface CreateFoundationAlertPanelClientAccessOptions extends Omit<ApiClientOptions, 'baseUrl'>, CreateFoundationAlertMutationExecutorOptions {
    baseUrl?: string;
    drilldownInit?: RequestInit;
}
type WebFoundationAlertPanelApp = 'admin-web' | 'tob-web' | 'storefront-web';
interface CreateWebFoundationAlertPanelClientAccessOptions extends Omit<CreateFoundationAlertPanelClientAccessOptions, 'ackNote' | 'muteNote' | 'unmuteNote'> {
    app: WebFoundationAlertPanelApp;
}
interface CreateFoundationAlertMutationExecutorOptions {
    ackNote: string;
    muteNote: string;
    unmuteNote: string;
    muteDurationMs?: number;
    acknowledgeInit?: RequestInit;
    muteInit?: RequestInit;
    unmuteInit?: RequestInit;
}
declare function createFoundationAlertMutationExecutor(client: Pick<ApiClient, 'acknowledgeFoundationAlert' | 'muteFoundationAlert' | 'unmuteFoundationAlert'>, options: CreateFoundationAlertMutationExecutorOptions): (action: FoundationAlertMutationKind, code: string) => Promise<FoundationAlertMutationResponse>;
declare function createFoundationAlertPanelClientAccess(options: CreateFoundationAlertPanelClientAccessOptions): {
    client: ApiClient;
    loadDrilldown: (code: string) => Promise<FoundationAlertDrilldownResponse>;
    executeMutation: (action: FoundationAlertMutationKind, code: string) => Promise<FoundationAlertMutationResponse>;
    ackAlert: (code: string) => Promise<void>;
    muteAlert: (code: string) => Promise<void>;
    unmuteAlert: (code: string) => Promise<void>;
};
declare function createWebFoundationAlertPanelClientAccess({ app, drilldownInit, muteInit, ...options }: CreateWebFoundationAlertPanelClientAccessOptions): {
    client: ApiClient;
    loadDrilldown: (code: string) => Promise<FoundationAlertDrilldownResponse>;
    executeMutation: (action: FoundationAlertMutationKind, code: string) => Promise<FoundationAlertMutationResponse>;
    ackAlert: (code: string) => Promise<void>;
    muteAlert: (code: string) => Promise<void>;
    unmuteAlert: (code: string) => Promise<void>;
};
declare function loadFoundationConsumerDescriptor(client: Pick<ApiClient, 'getFoundationConsumer'>, consumer: FoundationConsumerKey, init?: RequestInit): Promise<FoundationConsumerDescriptor | null>;
declare function loadFoundationGovernanceReadModel(client: Pick<ApiClient, 'getFoundationAlertCatalog' | 'getFoundationOverview'>, init?: RequestInit): Promise<FoundationGovernanceReadModel>;
declare class ApiClient {
    private readonly options;
    constructor(options: ApiClientOptions);
    private buildPathWithQuery;
    request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>>;
    get<T>(path: string, init?: RequestInit): Promise<ApiResult<T>>;
    getData<T>(path: string, init?: RequestInit): Promise<T>;
    postData<T>(path: string, body: unknown, init?: RequestInit): Promise<T>;
    getMarketBootstrap(init?: RequestInit): Promise<MarketBootstrapResponse>;
    getFoundationBootstrap(init?: RequestInit): Promise<FoundationBootstrapResponse>;
    getPortalBootstrap(init?: RequestInit): Promise<PortalBootstrapResponse>;
    getWorkbenchBootstrap(init?: RequestInit): Promise<WorkbenchBootstrapResponse>;
    listAuditRecords(query?: AuditTrailQuery, init?: RequestInit): Promise<AuditRecordContract[]>;
    summarizeAuditRecords(query?: AuditTrailQuery, init?: RequestInit): Promise<AuditTrailSummary>;
    getAuditTrail(query?: AuditTrailQuery, init?: RequestInit): Promise<{
        summary: AuditTrailSummary | undefined;
        records: AuditRecordContract[];
        total: number;
        query: AuditTrailQuery;
    }>;
    getConfigurationGovernanceOverview(query?: ConfigurationOverviewQuery, init?: RequestInit): Promise<ConfigurationOverview>;
    listConfigurationFeatureFlags(query?: ConfigurationOverviewQuery, init?: RequestInit): Promise<ConfigurationFeatureFlag[]>;
    listConfigurationConfigEntries(query?: {
        namespace?: string;
        tenantId?: string;
        brandId?: string;
        storeId?: string;
    }, init?: RequestInit): Promise<ConfigurationConfigEntry[]>;
    listConfigurationSecrets(init?: RequestInit): Promise<ConfigurationSecretMetadata[]>;
    listConfigurationCertificates(init?: RequestInit): Promise<ConfigurationCertificateMetadata[]>;
    getConfigurationManagementMetadata(init?: RequestInit): Promise<ConfigurationGovernanceMetadataEntry[]>;
    getConfigurationGovernanceSnapshot(query?: ConfigurationOverviewQuery, init?: RequestInit): Promise<{
        snapshotId: string;
        generatedAt: string;
        scopeChain: ConfigurationOverview["scopeChain"];
        context: ConfigurationOverview["scopeChain"];
        config: Record<string, unknown>;
        featureFlags: ConfigurationFeatureFlag[];
        secrets: ConfigurationSecretMetadata[];
        checksum: string;
    }>;
    getResilienceOperationsOverview(init?: RequestInit): Promise<ResilienceOverview>;
    listObservabilitySignals(query?: {
        status?: string;
    }, init?: RequestInit): Promise<ObservabilitySignalContract[]>;
    listResilienceRetryPolicies(query?: {
        capability?: string;
    }, init?: RequestInit): Promise<RetryPolicyContract[]>;
    listResilienceRecoveryPlans(query?: {
        status?: string;
    }, init?: RequestInit): Promise<RecoveryPlanContract[]>;
    describeResilienceRecoveryPlan(resource: string, init?: RequestInit): Promise<{
        status: "ready" | "attention";
        resource: string;
        baseline: string[];
        plan: RecoveryPlanContract | null;
    }>;
    stageResilienceEdgeReplay(body: EdgeReplayStageRequest, init?: RequestInit): Promise<EdgeReplayStageContract>;
    listRateLimitPolicies(query?: RateLimitWorkspaceQuery, init?: RequestInit): Promise<RateLimitPolicyRecord[]>;
    listQuotaLedgers(query?: RateLimitWorkspaceQuery, init?: RequestInit): Promise<QuotaLedgerRecord[]>;
    getRateLimitWorkspace(query?: RateLimitWorkspaceQuery, init?: RequestInit): Promise<RateLimitWorkspace>;
    getIdentityAccessContext(query?: IdentityAccessWorkspaceQuery, init?: RequestInit): Promise<IdentityAccessResolvedContext>;
    validateIdentityRole(query?: IdentityAccessWorkspaceQuery, init?: RequestInit): Promise<IdentityAccessValidationResult>;
    validateIdentityPermission(query?: IdentityAccessWorkspaceQuery, init?: RequestInit): Promise<IdentityAccessValidationResult>;
    validateIdentityTenantScope(targetTenantId: string, query?: IdentityAccessWorkspaceQuery, init?: RequestInit): Promise<IdentityAccessValidationResult>;
    listIntegrationWebhookSources(init?: RequestInit): Promise<IntegrationWebhookSourceContract[]>;
    listIntegrationEventEnvelopes(query?: IntegrationOrchestrationWorkspaceQuery, init?: RequestInit): Promise<IntegrationEventEnvelopeContract[]>;
    listIntegrationIdempotencyRecords(query?: IntegrationOrchestrationWorkspaceQuery, init?: RequestInit): Promise<IntegrationIdempotencyRecordContract[]>;
    publishIntegrationEvent(body: IntegrationPublishEventRequest, init?: RequestInit): Promise<IntegrationPublishEventResponse>;
    ingestIntegrationWebhook(source: string, body: IntegrationWebhookIngestRequest, init?: RequestInit): Promise<IntegrationWebhookIngestResponse>;
    getIntegrationOrchestrationWorkspace(query?: IntegrationOrchestrationWorkspaceQuery, init?: RequestInit): Promise<IntegrationOrchestrationWorkspace>;
    getFoundationConsumer(consumer: string, init?: RequestInit): Promise<FoundationConsumerDescriptor | {
        availableConsumers: string[];
    }>;
    getFoundationModuleDetail(moduleKey: string, init?: RequestInit): Promise<{
        generatedAt: string;
        moduleKey: string;
        health?: {
            module: string;
            score: number;
            status: "healthy" | "warning" | "critical";
            indicators: {
                highRiskAudits: number;
                pendingApprovals: number;
                executionFailures: number;
                blockedCount: number;
            };
        };
        detail?: unknown;
        availableModuleKeys?: string[];
    }>;
    getFoundationAlertCatalog(init?: RequestInit): Promise<FoundationAlertCatalogResponse>;
    getFoundationOverview(init?: RequestInit, runtimeFilter?: RuntimeGovernanceOverviewFilter): Promise<FoundationOperationsOverviewResponse>;
    getFoundationAlertDrilldown(code: string, init?: RequestInit): Promise<FoundationAlertDrilldownResponse>;
    getLytStoreCapabilityAccessView(storeId: string, init?: RequestInit): Promise<LytStoreCapabilityAccessViewResponse>;
    acknowledgeFoundationAlert(code: string, body?: {
        note?: string;
    }, init?: RequestInit): Promise<FoundationAlertMutationResponse>;
    muteFoundationAlert(code: string, body?: {
        mutedUntil?: string;
        note?: string;
    }, init?: RequestInit): Promise<FoundationAlertMutationResponse>;
    unmuteFoundationAlert(code: string, body?: {
        note?: string;
    }, init?: RequestInit): Promise<FoundationAlertMutationResponse>;
    submitRuntimeGovernanceAction(body: RuntimeGovernanceSubmitRequest, init?: RequestInit): Promise<RuntimeGovernanceReceipt>;
    getRuntimeGovernanceReceipt(receiptCode: string, init?: RequestInit): Promise<RuntimeGovernanceReceipt>;
    syncRuntimeGovernanceAction(receiptCode: string, body: RuntimeGovernanceSyncRequest, init?: RequestInit): Promise<RuntimeGovernanceReceipt>;
    recordRuntimeGovernanceCallback(receiptCode: string, body: RuntimeGovernanceCallbackRequest, init?: RequestInit): Promise<RuntimeGovernanceReceipt>;
    replayRuntimeGovernanceAction(receiptCode: string, body: RuntimeGovernanceReplayRequest, init?: RequestInit): Promise<RuntimeGovernanceReceipt>;
    batchReplayRuntimeGovernanceActions(body: RuntimeGovernanceBatchReplayRequest, init?: RequestInit): Promise<RuntimeGovernanceBatchReplayResponse>;
}

export { ApiClient, type ApiClientOptions, type BuildRuntimeGovernanceReplayRequestOptions, type BuildRuntimeGovernanceSubmitRequestOptions, type CreateFoundationAlertMutationExecutorOptions, type CreateFoundationAlertPanelClientAccessOptions, type CreateRuntimeGovernancePanelBindingsOptions, type CreateRuntimeGovernancePanelClientOptions, type CreateWebFoundationAlertPanelClientAccessOptions, type FoundationBootstrapWiringMeta, type FoundationGovernanceReadModel, type FoundationGovernanceReadModelClient, type FoundationPortalConsumerSnapshotBase, type LytStoreCapabilityAccessItem, type LytStoreCapabilityAccessViewResponse, type RuntimeGovernancePanelClient, type RuntimeGovernancePresetLike, type WebFoundationAlertPanelApp, buildRuntimeGovernanceReplayRequest, buildRuntimeGovernanceSubmitRequest, createFoundationAlertClient, createFoundationAlertMutationExecutor, createFoundationAlertPanelClientAccess, createFoundationBootstrapWiringMeta, createFoundationGovernanceReadModelLoader, createFoundationPortalConsumerSnapshotBase, createRuntimeGovernancePanelBindings, createRuntimeGovernancePanelClient, createWebFoundationAlertPanelClientAccess, emptyFoundationGovernanceOverviewSummary, fallbackPortalConsumerDescriptor, getDefaultApiBaseUrl, loadFoundationConsumerDescriptor, loadFoundationGovernanceReadModel };
