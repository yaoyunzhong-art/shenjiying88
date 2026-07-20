import { ApiResult, MarketBootstrapResponse, FoundationBootstrapResponse, PortalBootstrapResponse, PortalDomainGovernanceSummaryContract, WorkbenchBootstrapResponse, AuditTrailQuery, AuditRecordContract, AuditTrailSummary, ConfigurationOverviewQuery, ConfigurationOverview, ConfigurationFeatureFlag, ConfigurationConfigEntry, ConfigurationSecretMetadata, ConfigurationCertificateMetadata, ConfigurationGovernanceMetadataEntry, ResilienceOverview, ObservabilitySignalContract, RetryPolicyContract, RecoveryPlanContract, EdgeReplayStageRequest, EdgeReplayStageContract, RateLimitWorkspaceQuery, RateLimitPolicyRecord, QuotaLedgerRecord, RateLimitWorkspace, IdentityAccessWorkspaceQuery, IdentityAccessResolvedContext, IdentityAccessValidationResult, IntegrationWebhookSourceContract, IntegrationOrchestrationWorkspaceQuery, IntegrationEventEnvelopeContract, IntegrationIdempotencyRecordContract, IntegrationPublishEventRequest, IntegrationPublishEventResponse, IntegrationWebhookIngestRequest, IntegrationWebhookIngestResponse, IntegrationOrchestrationWorkspace, FoundationConsumerDescriptor, FoundationAlertCatalogResponse, RuntimeGovernanceOverviewFilter, FoundationOperationsOverviewResponse, FoundationAlertDrilldownResponse, FoundationAlertMutationResponse, RuntimeGovernanceSubmitRequest, RuntimeGovernanceReceipt, RuntimeGovernanceSyncRequest, RuntimeGovernanceCallbackRequest, RuntimeGovernanceReplayRequest, RuntimeGovernanceBatchReplayRequest, RuntimeGovernanceBatchReplayResponse, AgentConfig, CreateSessionRequest, SessionExecutionResult, AgentSessionEvent, BatchAgentRequest, BatchAgentResponse, AgentSession, AgentExecution, QualityEvaluation, AgentStats, FoundationClientApp, RuntimeGovernanceReplaySource, RuntimeGovernanceActionKey, RuntimeGovernanceNextStep, RuntimeGovernanceRiskLevel, RuntimeGovernanceRecommendedAction, RuntimeGovernanceClientApp, FoundationAlertCatalogItem, FoundationOperationsOverviewSummary, FoundationOperationsAlert, AppBootstrapWiring, FoundationAlertMutationKind, FoundationConsumerKey } from '@m5/types';

/** 三级工作台代码 (与后端 LEVEL_TO_WORKBENCH 保持一致) */
type TenantConfigWorkbenchCode = 'W-S' | 'W-T' | 'W-B';
/** 配置级别 */
type TenantConfigLevel = 'store' | 'tenant' | 'brand';
/** 配置分类 */
type TenantConfigCategory = 'pos' | 'print' | 'member' | 'marketing' | 'inventory' | 'integration' | 'ai' | 'compliance' | 'billing' | 'branding';
/** 配置敏感度 (与后端 tenant-config.entity 保持一致) */
type TenantConfigSensitivity = 'public' | 'internal' | 'restricted' | 'secret';
/** 配置值类型 */
type TenantConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'secret';
/** 生效配置 (考虑继承链) */
interface TenantConfigEffective {
    key: string;
    value: string;
    sourceLevel: TenantConfigLevel;
    inherited: boolean;
    isMasked?: boolean;
    sensitivity?: TenantConfigSensitivity;
}
/** 单条配置实例 (已脱敏) */
interface TenantConfigItem {
    id: string;
    key: string;
    value: string;
    category: TenantConfigCategory;
    level: TenantConfigLevel;
    ownerId: string;
    inherits: boolean;
    version: number;
    updatedBy: string;
    updatedAt: string;
    isMasked?: boolean;
}
/** 配置项定义 (来自 BUILTIN_CONFIG_DEFINITIONS) */
interface TenantConfigItemDefinition {
    key: string;
    category: TenantConfigCategory;
    level: TenantConfigLevel;
    valueType: TenantConfigValueType;
    sensitivity: TenantConfigSensitivity;
    defaultValue?: string | number | boolean | null;
    allowedRoles?: string[];
    required?: boolean;
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        enum?: string[];
    };
    label: string;
    description?: string;
}
/** 审计日志条目 (与后端 ConfigAuditLog 对齐) */
interface TenantConfigAuditLog {
    id: string;
    configId: string;
    key: string;
    level: TenantConfigLevel;
    ownerId: string;
    tenantId: string;
    previousValue?: string;
    newValue?: string;
    /**
     * 动作类型 (P0-J4: 扩展联合, 与后端 ConfigAuditLog.action 同步)
     * - create / update / delete / rollback: 业务操作
     * - cross_tenant_brand_passthrough: P0-H8 super_admin/auditor 跨租户 brandId 豁免审计
     */
    action: 'create' | 'update' | 'delete' | 'rollback' | 'cross_tenant_brand_passthrough';
    operator: string;
    operatorRole: string;
    timestamp: string;
    context?: Record<string, unknown>;
}
interface TenantConfigBatchInput {
    key: string;
    value: string;
    inherits?: boolean;
}
interface ApiClientOptions {
    baseUrl: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    token?: string;
    headers?: Record<string, string>;
}
interface ActorHeaderOptions {
    actorId: string;
    actorType?: string;
    actorName?: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    roles?: readonly string[];
    permissions?: readonly string[];
    authenticated?: boolean;
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
declare function buildActorHeaders(options: ActorHeaderOptions): Record<string, string>;
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
/**
 * P0-J4: 统一 API 错误类型, 透传后端 i18nKey/code/status
 * 前端可基于 i18nKey 走 i18next, code 走业务分流, status 走 HTTP 兜底
 */
declare class ApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly i18nKey?: string;
    constructor(status: number, message: string, code?: string, i18nKey?: string);
}
declare class ApiClient {
    private readonly options;
    constructor(options: ApiClientOptions);
    private buildPathWithQuery;
    request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>>;
    get<T>(path: string, init?: RequestInit): Promise<ApiResult<T>>;
    getData<T>(path: string, init?: RequestInit): Promise<T>;
    postData<T>(path: string, body: unknown, init?: RequestInit): Promise<T>;
    putData<T>(path: string, body: unknown, init?: RequestInit): Promise<T>;
    patchData<T>(path: string, body: unknown, init?: RequestInit): Promise<T>;
    deleteData<T>(path: string, init?: RequestInit): Promise<T>;
    getMarketBootstrap(init?: RequestInit): Promise<MarketBootstrapResponse>;
    getFoundationBootstrap(init?: RequestInit): Promise<FoundationBootstrapResponse>;
    getPortalBootstrap(init?: RequestInit): Promise<PortalBootstrapResponse>;
    getPortalDomainGovernanceSummary(init?: RequestInit): Promise<PortalDomainGovernanceSummaryContract>;
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
    /** 列出所有 Agent 配置 */
    listAgentConfigs(init?: RequestInit): Promise<AgentConfig[]>;
    /** 获取单个 Agent 配置 */
    getAgentConfig(id: string, init?: RequestInit): Promise<AgentConfig>;
    /** 创建 Agent 配置 */
    createAgentConfig(body: AgentConfig, init?: RequestInit): Promise<AgentConfig>;
    /** 更新 Agent 配置 */
    updateAgentConfig(id: string, body: Partial<AgentConfig>, init?: RequestInit): Promise<AgentConfig>;
    /** 删除 Agent 配置 */
    deleteAgentConfig(id: string, init?: RequestInit): Promise<{
        deleted: boolean;
    }>;
    /** 创建并运行 Agent 会话 */
    runAgentSession(body: CreateSessionRequest, init?: RequestInit): Promise<SessionExecutionResult>;
    /**
     * 运行 Agent 会话并订阅实时事件流 (Phase-27 SSE)
     *
     * 后端 SSE 端点: POST /agent/sessions/run-stream
     * 返回: text/event-stream,每个事件格式 `data: {AgentSessionEvent JSON}\n\n`
     *
     * 用法:
     * ```ts
     * for await (const ev of client.runAgentSessionStream({ configId, userInput, ... })) {
     *   switch (ev.type) {
     *     case 'step_progress': console.log(`Step ${ev.step}/${ev.maxSteps}`); break;
     *     case 'message_added': appendMessage(ev.message); break;
     *     case 'session_completed': finalize(ev.session, ev.execution); break;
     *   }
     * }
     * ```
     */
    runAgentSessionStream(body: CreateSessionRequest, init?: RequestInit): AsyncGenerator<AgentSessionEvent, void, undefined>;
    /** 批量运行 Agent */
    batchRunAgent(body: BatchAgentRequest, init?: RequestInit): Promise<BatchAgentResponse>;
    /** 列出所有 Agent 会话 */
    listAgentSessions(init?: RequestInit): Promise<AgentSession[]>;
    /** 获取单个 Agent 会话 */
    getAgentSession(id: string, init?: RequestInit): Promise<AgentSession>;
    /** 获取会话执行记录 */
    getAgentExecution(id: string, init?: RequestInit): Promise<AgentExecution>;
    /** 获取会话质量评估 */
    getSessionEvaluation(id: string, init?: RequestInit): Promise<QualityEvaluation>;
    /** 列出所有质量评估 */
    listQualityEvaluations(init?: RequestInit): Promise<QualityEvaluation[]>;
    /** 获取 Agent 统计 */
    getAgentStats(init?: RequestInit): Promise<AgentStats>;
    /** 列出可用工具(后端返回 unknown,前端按 ToolDefinition 解读) */
    listAgentTools(init?: RequestInit): Promise<unknown[]>;
    /**
     * GET /tenant-config
     * 按 level / category / keys 过滤当前级别配置项
     */
    getTenantConfigs(query?: {
        level?: TenantConfigLevel;
        category?: TenantConfigCategory;
        keys?: string[];
    }, init?: RequestInit): Promise<{
        workbench: string;
        level: TenantConfigLevel;
        items: TenantConfigItem[];
        total: number;
    }>;
    /**
     * GET /tenant-config/:key
     * 查询单个配置 (已脱敏)
     */
    getTenantConfig(key: string, init?: RequestInit): Promise<TenantConfigItem | null>;
    /**
     * GET /tenant-config/workbench/:code
     * 工作台视角 (W-S / W-T / W-B),返回考虑继承的生效配置
     */
    getTenantWorkbenchConfigs(code: TenantConfigWorkbenchCode, category?: TenantConfigCategory, init?: RequestInit): Promise<{
        workbench: string;
        items: TenantConfigEffective[];
        total: number;
    }>;
    /**
     * GET /tenant-config/meta/definitions
     * 获取所有配置项静态定义 (前端 UI 用)
     */
    getTenantConfigMeta(init?: RequestInit): Promise<{
        items: TenantConfigItemDefinition[];
        total: number;
    }>;
    /**
     * POST /tenant-config/batch
     * 批量设置配置 (返回值会带回最新 version)
     */
    setTenantConfigBatch(items: TenantConfigBatchInput[], init?: RequestInit): Promise<{
        items: TenantConfigItem[];
        total: number;
    }>;
    /**
     * POST /tenant-config/rollback
     * 回滚配置到指定版本
     */
    rollbackTenantConfig(targetVersion: number, configId: string, init?: RequestInit): Promise<TenantConfigItem>;
    /**
     * 列出租户级配置变更审计日志
     *
     * 端点约定: GET /tenant-config/audit-logs?tenantId=...&limit=...
     * (当前后端 service.listAuditLogs 已存在,本方法为前端 SDK 入口;若后端尚未暴露
     * 该 endpoint,会收到 404 并由调用方 try/catch 处理空态。)
     */
    listTenantConfigAuditLogs(tenantId: string, limit?: number, init?: RequestInit): Promise<TenantConfigAuditLog[]>;
}
/** SSE 订阅状态 */
type SseSubscribeStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';
/** SSE 订阅选项 (Phase-32 扩展) */
interface SseSubscribeOptions {
    /** Agent 会话请求 */
    body: CreateSessionRequest;
    /** 每条事件回调 */
    onEvent: (event: AgentSessionEvent, meta: {
        id: number;
        raw: string;
    }) => void;
    /** 错误回调 (网络断 / 重试耗尽 / 410) */
    onError?: (err: Error, context: {
        attempts: number;
        willRetry: boolean;
    }) => void;
    /** 状态变化回调 */
    onStatusChange?: (status: SseSubscribeStatus) => void;
    /** 重连配置 */
    reconnect?: {
        /** 是否启用,默认 true */
        enabled?: boolean;
        /** 最大重试次数,默认 3 */
        maxRetries?: number;
        /** 初始延迟 ms,默认 1000 */
        initialDelayMs?: number;
        /** 退避倍数,默认 2 (1s → 2s → 4s) */
        backoffMultiplier?: number;
    };
    /** 外部注入的最后事件 id (用于断连后 resume) */
    initialLastEventId?: string;
}
/** SSE 订阅句柄 */
interface SseSubscription {
    /** 主动取消订阅 */
    unsubscribe: () => void;
    /** 当前状态 */
    getStatus: () => SseSubscribeStatus;
    /** 最近收到的事件 id (用于下次 resume) */
    getLastEventId: () => string | undefined;
}
/**
 * 订阅 Agent SSE 流 (Phase-32: 带指数退避 + Last-Event-ID 续传)
 *
 * - 默认 maxRetries=3, backoff = 1s → 2s → 4s
 * - 每次重连自动携带 Last-Event-ID,服务端 replay
 * - 410 Gone (事件过期) 触发 onError 并停止重试
 *
 * 用法:
 * ```ts
 * const sub = subscribeStream(client, {
 *   body: { configId, userInput, ... },
 *   onEvent: (ev) => console.log(ev),
 *   onError: (err) => console.error(err),
 *   reconnect: { maxRetries: 3 }
 * })
 * // 后续可用 sub.getLastEventId() 持久化,重连时传入 initialLastEventId
 * ```
 */
declare function subscribeStream(client: ApiClient, opts: SseSubscribeOptions): SseSubscription;
interface BusinessOrderListItem {
    orderId: string;
    orderNo: string;
    memberId: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    refundedAmount: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}
interface BusinessOrderListPage {
    items: BusinessOrderListItem[];
    total: number;
    page: number;
    pageSize: number;
}
/**
 * 创建统一业务 API 客户端 (cashier/checkout/orders/refunds 面向前端消费)
 *
 * 用法:
 * ```ts
 * const biz = createBusinessClient()
 * const orders = await biz.orders.list()
 * const member = await biz.member.lookup('13800138001')
 * ```
 */
declare function createBusinessClient(baseUrl?: string): {
    checkout: {
        /** 发起结账 */
        start: (body: {
            memberId: string;
            items: Array<{
                productId: string;
                quantity: number;
                unitPriceCents: number;
            }>;
            paymentChannel: string;
            couponCode?: string;
        }, init?: RequestInit) => Promise<{
            orderId: string;
            transactionId: string;
            totalCents: number;
        }>;
    };
    orders: {
        /** 订单列表 */
        list: (query?: {
            memberId?: string;
            status?: string;
            paymentStatus?: string;
            limit?: number;
            fromDate?: string;
            toDate?: string;
            page?: number;
            pageSize?: number;
        }, init?: RequestInit) => Promise<BusinessOrderListItem[]>;
        /** 订单分页列表 */
        listPage: (query?: {
            memberId?: string;
            status?: string;
            paymentStatus?: string;
            limit?: number;
            fromDate?: string;
            toDate?: string;
            page?: number;
            pageSize?: number;
        }, init?: RequestInit) => Promise<BusinessOrderListPage>;
        /** 订单详情 */
        get: (orderId: string, init?: RequestInit) => Promise<{
            orderId: string;
            orderNo: string;
            memberId: string;
            status: string;
            totalAmount: number;
            paidAmount: number;
            refundedAmount: number;
            currency: string;
            items?: Array<{
                productId: string;
                productName: string;
                quantity: number;
                unitPriceCents: number;
            }>;
            createdAt: string;
            updatedAt: string;
        }>;
        /** 订单退款记录 */
        listRefunds: (orderId: string, init?: RequestInit) => Promise<{
            refundId: string;
            amount: number;
            reason: string;
            status: string;
            requestedAt: string;
        }[]>;
    };
    cashier: {
        /** 会员查找 (手机号/卡号) */
        lookupMember: (query: string, init?: RequestInit) => Promise<{
            id: string;
            name: string;
            phone: string;
            memberNo: string;
            tier: string;
            points: number;
            discountRate: number;
        } | null>;
        /** 会员消费记录 (走 transactions 模块) */
        listMemberTransactions: (memberId: string, init?: RequestInit) => Promise<{
            orderId: string;
            orderNo: string;
            status: string;
            totalAmount: number;
            currency: string;
            paymentStatus?: string;
            createdAt: string;
        }[]>;
        /** 商品扫码查询 */
        lookupProduct: (sku: string, init?: RequestInit) => Promise<{
            sku: string;
            name: string;
            price: number;
            category: string;
        } | null>;
        /** 支付渠道统计 */
        getChannelStats: (init?: RequestInit) => Promise<{
            channel: string;
            today: number;
            month: number;
        }[]>;
        /** 创建订单 (POS) */
        createOrder: (body: {
            clientOrderId: string;
            memberId?: string;
            items: Array<{
                productId: string;
                quantity: number;
                unitPriceCents: number;
                discountCents?: number;
            }>;
            discountCents?: number;
            taxCents?: number;
        }, init?: RequestInit) => Promise<unknown>;
        /** 提交订单 (DRAFT → PENDING) */
        submitOrder: (orderId: string, init?: RequestInit) => Promise<unknown>;
        /** 创建支付 */
        createPayment: (orderId: string, body: {
            method: "CASH" | "WECHAT" | "ALIPAY" | "CARD";
            amountCents: number;
        }, init?: RequestInit) => Promise<unknown>;
        /** 创建退款 */
        createRefund: (orderId: string, body: {
            paymentId: string;
            amountCents: number;
            reason: string;
        }, init?: RequestInit) => Promise<unknown>;
    };
    refunds: {
        /** 退款列表 */
        list: (query?: {
            memberId?: string;
            orderId?: string;
            status?: string;
            limit?: number;
        }, init?: RequestInit) => Promise<{
            refundId: string;
            tenantId: string;
            orderId: string;
            paymentId: string;
            memberId: string;
            refundAmount: number;
            reason: string;
            operator?: string;
            status: string;
            requestedAt: string;
            completedAt?: string;
            reviewedAt?: string;
            reviewedBy?: string;
            reviewNote?: string;
        }[]>;
        /** 待处理退款 */
        listPending: (query?: {
            limit?: number;
        }, init?: RequestInit) => Promise<unknown>;
        /** 退款 dashboard */
        getDashboard: (init?: RequestInit) => Promise<unknown>;
        /** 退款详情 */
        get: (refundId: string, init?: RequestInit) => Promise<{
            refundId: string;
            orderId: string;
            paymentId: string;
            memberId: string;
            refundAmount: number;
            reason: string;
            status: string;
            requestedAt: string;
            completedAt?: string;
            reviewedAt?: string;
            reviewedBy?: string;
            reviewNote?: string;
        }>;
        /** 审批退款 */
        approve: (refundId: string, body: {
            operator?: string;
            note?: string;
        }, init?: RequestInit) => Promise<unknown>;
        /** 拒绝退款 */
        reject: (refundId: string, body: {
            operator?: string;
            note?: string;
        }, init?: RequestInit) => Promise<unknown>;
    };
    paymentGateway: {
        /** 发起支付 */
        pay: (body: {
            orderId: string;
            amount: number;
            currency: string;
            provider: string;
            metadata?: Record<string, unknown>;
            locale?: string;
            returnUrl?: string;
            webhookUrl?: string;
        }, init?: RequestInit) => Promise<unknown>;
        /** 查询支付结果 */
        queryPayment: (transactionId: string, init?: RequestInit) => Promise<unknown>;
        /** 发起退款 */
        refund: (body: {
            transactionId: string;
            amount: number;
            reason: string;
        }, init?: RequestInit) => Promise<unknown>;
        /** 查询退款状态 */
        queryRefund: (refundId: string, init?: RequestInit) => Promise<unknown>;
    };
    budget: {
        /** 预算列表 */
        list: (query?: {
            tenantId?: string;
            status?: string;
            category?: string;
        }, init?: RequestInit) => Promise<{
            id: string;
            tenantId: string;
            name: string;
            category: string;
            totalCents: number;
            usedCents: number;
            remainingCents: number;
            currency: string;
            period: string;
            status: string;
            version: number;
            notes: string;
            createdAt: string;
            updatedAt: string;
        }[]>;
        /** 创建预算 */
        create: (body: {
            tenantId: string;
            name: string;
            category: string;
            totalCents: number;
            currency?: string;
            period: string;
            notes?: string;
            idempotencyKey: string;
        }, init?: RequestInit) => Promise<{
            id: string;
            version: number;
        }>;
        /** 提交审批 */
        submitForApproval: (id: string, body: {
            idempotencyKey: string;
            version: number;
        }, init?: RequestInit) => Promise<{
            status: string;
            version: number;
        }>;
        /** 关闭预算 */
        close: (id: string, body: {
            idempotencyKey: string;
            version: number;
        }, init?: RequestInit) => Promise<{
            status: string;
            version: number;
        }>;
        /** 审批请求列表 */
        listApprovals: (query?: {
            budgetId?: string;
            status?: string;
        }, init?: RequestInit) => Promise<{
            id: string;
            budgetId: string;
            budgetName: string;
            requester: string;
            amountCents: number;
            reason: string;
            status: "PENDING" | "APPROVED" | "REJECTED";
            version: number;
            createdAt: string;
        }[]>;
        /** 批准审批请求 */
        approveApproval: (approvalId: string, body: {
            idempotencyKey: string;
            version: number;
        }, init?: RequestInit) => Promise<{
            status: string;
            version: number;
        }>;
        /** 驳回审批请求 */
        rejectApproval: (approvalId: string, body: {
            idempotencyKey: string;
            version: number;
        }, init?: RequestInit) => Promise<{
            status: string;
            version: number;
        }>;
    };
    promotions: {
        /** 促销列表 */
        list: (query?: {
            tenantId?: string;
            storeId?: string;
            status?: string;
        }, init?: RequestInit) => Promise<{
            id: string;
            name: string;
            type: string;
            discount: string;
            scope: string;
            start: string;
            end: string;
            budget: number;
            used: number;
            status: "active" | "scheduled" | "ended" | "draft";
            targetGoal?: string;
            version: number;
            createdAt: string;
            updatedAt: string;
        }[]>;
        /** 创建促销 */
        create: (body: {
            tenantId: string;
            storeId: string;
            name: string;
            type: string;
            discount: string;
            scope: string;
            start: string;
            end: string;
            budget: number;
            targetGoal?: string;
            idempotencyKey: string;
        }, init?: RequestInit) => Promise<{
            id: string;
            version: number;
        }>;
        /** 发布草稿促销 */
        publish: (id: string, body: {
            idempotencyKey: string;
            version: number;
        }, init?: RequestInit) => Promise<{
            status: string;
            version: number;
        }>;
        /** 结束促销 */
        end: (id: string, body: {
            idempotencyKey: string;
            version: number;
        }, init?: RequestInit) => Promise<{
            status: string;
            version: number;
        }>;
    };
    raw: ApiClient;
};
type BusinessClient = ReturnType<typeof createBusinessClient>;
/** 计算下次 backoff 延迟 (供测试与 UI 共享)
 *  - attemptNum = 1 → initialDelayMs (第一次重试前)
 *  - attemptNum = 2 → initialDelayMs * multiplier
 *  - attemptNum = 0 → initialDelayMs (视为第一次)
 *  - 等价公式: initialDelayMs * multiplier^max(0, attemptNum-1)
 */
declare function computeBackoffDelay(attemptNum: number, initialDelayMs?: number, backoffMultiplier?: number): number;

export { type ActorHeaderOptions, ApiClient, type ApiClientOptions, ApiError, type BuildRuntimeGovernanceReplayRequestOptions, type BuildRuntimeGovernanceSubmitRequestOptions, type BusinessClient, type BusinessOrderListItem, type BusinessOrderListPage, type CreateFoundationAlertMutationExecutorOptions, type CreateFoundationAlertPanelClientAccessOptions, type CreateRuntimeGovernancePanelBindingsOptions, type CreateRuntimeGovernancePanelClientOptions, type CreateWebFoundationAlertPanelClientAccessOptions, type FoundationBootstrapWiringMeta, type FoundationGovernanceReadModel, type FoundationGovernanceReadModelClient, type FoundationPortalConsumerSnapshotBase, type LytStoreCapabilityAccessItem, type LytStoreCapabilityAccessViewResponse, type RuntimeGovernancePanelClient, type RuntimeGovernancePresetLike, type SseSubscribeOptions, type SseSubscribeStatus, type SseSubscription, type TenantConfigAuditLog, type TenantConfigBatchInput, type TenantConfigCategory, type TenantConfigEffective, type TenantConfigItem, type TenantConfigItemDefinition, type TenantConfigLevel, type TenantConfigSensitivity, type TenantConfigValueType, type TenantConfigWorkbenchCode, type WebFoundationAlertPanelApp, buildActorHeaders, buildRuntimeGovernanceReplayRequest, buildRuntimeGovernanceSubmitRequest, computeBackoffDelay, createBusinessClient, createFoundationAlertClient, createFoundationAlertMutationExecutor, createFoundationAlertPanelClientAccess, createFoundationBootstrapWiringMeta, createFoundationGovernanceReadModelLoader, createFoundationPortalConsumerSnapshotBase, createRuntimeGovernancePanelBindings, createRuntimeGovernancePanelClient, createWebFoundationAlertPanelClientAccess, emptyFoundationGovernanceOverviewSummary, fallbackPortalConsumerDescriptor, getDefaultApiBaseUrl, loadFoundationConsumerDescriptor, loadFoundationGovernanceReadModel, subscribeStream };
