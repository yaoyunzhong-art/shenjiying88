export interface PaginationInput {
    page: number;
    pageSize: number;
}
export interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
}
export interface ApiResult<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}
export type FoundationClientApp = 'admin-web' | 'tob-web' | 'storefront-web' | 'miniapp' | 'app';
export type BootstrapDeliveryChannel = 'API_BOOTSTRAP' | 'RUNTIME_CHALLENGE';
export type BootstrapCacheLayer = 'NONE' | 'MEMORY' | 'SESSION' | 'LOCAL_PERSISTED';
export type BootstrapFallbackStrategy = 'FAIL_CLOSED' | 'READONLY_LAST_KNOWN' | 'PUBLIC_LAST_KNOWN';
export interface BootstrapCapabilityRule {
    capability: string;
    source: BootstrapDeliveryChannel;
    requiredApps: FoundationClientApp[];
    cacheLayer: BootstrapCacheLayer;
    ttlSeconds?: number;
    notes: string[];
}
export interface TenantScopeBootstrapPolicy {
    resolver: string;
    bootstrapRequired: boolean;
    cacheLayer: BootstrapCacheLayer;
    revalidateOn: string[];
    mismatchStrategy: BootstrapFallbackStrategy;
}
export interface DesensitizationBootstrapPolicy {
    source: 'API_BOOTSTRAP';
    defaultMode: 'MASKED' | 'HIDDEN_UNTIL_APPROVED' | 'PUBLIC_ONLY';
    notes: string[];
}
export interface FeatureFlagBootstrapPolicy {
    source: 'API_BOOTSTRAP';
    cacheLayer: BootstrapCacheLayer;
    ttlSeconds?: number;
    fallbackStrategy: BootstrapFallbackStrategy;
    notes: string[];
}
export interface RiskChallengeBootstrapPolicy {
    triggerSource: 'API_BOOTSTRAP';
    cacheLayer: 'NONE' | 'MEMORY';
    enforcement: 'STEP_UP' | 'BLOCKING';
    notes: string[];
}
export interface AppBootstrapWiring {
    app: FoundationClientApp;
    audience: 'OPERATIONS' | 'MERCHANT' | 'CONSUMER';
    bootstrapFile: string;
    bootstrapEndpoint: string;
    consumes: string[];
    cacheableCapabilities: string[];
    tenantScope: TenantScopeBootstrapPolicy;
    desensitization: DesensitizationBootstrapPolicy;
    featureFlags: FeatureFlagBootstrapPolicy;
    riskChallenge: RiskChallengeBootstrapPolicy;
}
export interface UnifiedFoundationBootstrapContract {
    version: string;
    bootstrapEndpoint: string;
    deliveredCapabilities: BootstrapCapabilityRule[];
    appProfiles: Record<FoundationClientApp, AppBootstrapWiring>;
}
export type FoundationModuleKey = 'identity-access' | 'configuration-governance' | 'integration-orchestration' | 'trust-governance' | 'resilience-operations' | 'runtime-governance';
export type FoundationConsumerKey = 'market' | 'portal' | 'workbench' | 'lyt-adapter';
export type FoundationAlertCode = 'approvals-pending' | 'approval-execution-failures' | 'high-risk-audits' | 'blocked-rate-limit-ledgers' | 'secret-rotation-attention' | 'observability-degradation' | 'recovery-drill-attention' | 'runtime-governance-backlog' | 'runtime-callback-stalled' | 'lyt-connection-governance-risk';
export type FoundationAlertSeverity = 'high' | 'medium' | 'low';
export type FoundationAlertAcknowledgementStatus = 'ACKED' | 'MUTED';
export interface FoundationAlertAcknowledgement {
    status: FoundationAlertAcknowledgementStatus;
    note: string | null;
    actorId: string | null;
    acknowledgedAt: string | null;
    mutedUntil: string | null;
    updatedAt: string;
}
export interface FoundationAlertCatalogItem {
    code: FoundationAlertCode;
    defaultSummary: string;
    severityPolicy: string;
    sourceModules: FoundationModuleKey[];
    drilldownEnabled: boolean;
    acknowledgementEnabled: boolean;
    drilldownPath: string;
    ackPath: string;
    mutePath: string;
    unmutePath: string;
    acknowledgement?: FoundationAlertAcknowledgement | null;
    visibleInOverview?: boolean;
    availableActions?: FoundationAlertOperation[];
    recentOperation?: FoundationAlertTimelineEntry | null;
    triageState?: FoundationOperationsAlertTriageState;
    triageSummary?: string;
}
export interface FoundationAlertCatalogResponse {
    generatedAt: string;
    alerts: FoundationAlertCatalogItem[];
}
export type FoundationAlertOperation = 'DRILLDOWN' | 'ACK' | 'MUTE' | 'UNMUTE';
export type FoundationAlertMutationKind = 'ACK' | 'MUTE' | 'UNMUTE';
export type FoundationAlertTimelineFilter = 'ALL' | FoundationAlertMutationKind;
export type FoundationAlertOwnerFilter = 'ALL' | string;
export type FoundationAlertTimelineSourceFilter = 'ALL' | string;
export interface FoundationAlertTimelineEntry {
    action: FoundationAlertMutationKind;
    note: string | null;
    actorId: string | null;
    mutedUntil: string | null;
    visibleInOverview: boolean;
    createdAt: string;
    source: string | null;
}
export interface FoundationAlertOwnerSummary {
    actorId: string;
    count: number;
    lastAction: FoundationAlertMutationKind;
    lastSeenAt: string;
}
export interface FoundationAlertTimelineMetrics {
    total: number;
    visibleInOverview: number;
    hiddenFromOverview: number;
    latestMatchedAt: string | null;
}
export interface FoundationAlertTimelineSourceSummary {
    source: string;
    count: number;
    latestAt: string | null;
}
export interface FoundationAlertTimelineActionSummary {
    action: FoundationAlertMutationKind;
    count: number;
    latestAt: string | null;
}
export interface FoundationAlertTimelineDigest {
    actions: FoundationAlertTimelineActionSummary[];
    uniqueOwnerCount: number;
    latestActorId: string | null;
    dominantAction: FoundationAlertMutationKind | null;
    latestVisibleAction: FoundationAlertMutationKind | null;
    latestHiddenAction: FoundationAlertMutationKind | null;
    dominantSource: string | null;
    latestSource: string | null;
    latestVisibleSource: string | null;
    latestHiddenSource: string | null;
}
export interface FoundationAlertTimelineFilterState {
    action: FoundationAlertTimelineFilter;
    source: FoundationAlertTimelineSourceFilter;
    owner: FoundationAlertOwnerFilter;
}
export interface FoundationAlertTimelineActiveFilterChip {
    kind: 'action' | 'source' | 'owner';
    label: string;
    value: string;
}
export interface FoundationAlertTimelineShortcutPreset {
    key: 'latest-owner' | 'latest-source' | 'dominant-action' | 'recent-hidden-flow' | 'recent-visible-flow';
    label: string;
    helper: string;
    filters: FoundationAlertTimelineFilterState;
}
export interface FoundationAlertTimelineFilterQueryKeys {
    action: string;
    source: string;
    owner: string;
}
export interface FoundationAlertLinkedFocusQueryKeys {
    focus: string;
    timeline: FoundationAlertTimelineFilterQueryKeys;
}
export interface FoundationAlertRuntimeCallbackStalledEscalationSummary {
    waitCallback: number;
    scheduleReplay: number;
    openManualReview: number;
}
export declare function buildFoundationAlertRecentOperationFilterState(entry: FoundationAlertTimelineEntry | null | undefined): FoundationAlertTimelineFilterState;
export declare function buildFoundationAlertTimelineFilterStateFromQuery(query: {
    action?: string | null;
    source?: string | null;
    owner?: string | null;
}): FoundationAlertTimelineFilterState;
export declare function normalizeFoundationAlertTimelineFilterState(filters: FoundationAlertTimelineFilterState, options: {
    availableOwners?: Array<string | null | undefined>;
    availableSources?: Array<string | null | undefined>;
}): FoundationAlertTimelineFilterState;
export declare function buildFoundationAlertTimelineFilterSearchParams(options: {
    search?: string | URLSearchParams;
    queryKeys: FoundationAlertTimelineFilterQueryKeys;
    filters: FoundationAlertTimelineFilterState;
}): URLSearchParams;
export declare function buildFoundationAlertTimelineFilterQueryPreview(queryKeys: FoundationAlertTimelineFilterQueryKeys, filters: FoundationAlertTimelineFilterState): string;
export declare function resolveFoundationAlertFocusCode(queryFocusCode: string | null | undefined, candidateGroups: Array<Array<{
    code: string;
}> | null | undefined>): string | null;
export declare function buildFoundationAlertLinkedFocusContext(context: string, filters?: FoundationAlertTimelineFilterState | null): string;
export declare function buildFoundationAlertLinkedFocusSearchParams(options: {
    search?: string | URLSearchParams;
    queryKeys: FoundationAlertLinkedFocusQueryKeys;
    focusCode?: string | null;
    filters?: FoundationAlertTimelineFilterState | null;
}): URLSearchParams;
export declare function filterFoundationAlertTimeline(history: FoundationAlertTimelineEntry[] | null | undefined, filter?: FoundationAlertTimelineFilter): FoundationAlertTimelineEntry[];
export declare function summarizeFoundationAlertOwners(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertOwnerSummary[];
export declare function filterFoundationAlertTimelineByOwner(history: FoundationAlertTimelineEntry[] | null | undefined, ownerFilter?: FoundationAlertOwnerFilter): FoundationAlertTimelineEntry[];
export declare function filterFoundationAlertTimelineBySource(history: FoundationAlertTimelineEntry[] | null | undefined, sourceFilter?: FoundationAlertTimelineSourceFilter): FoundationAlertTimelineEntry[];
export declare function summarizeFoundationAlertTimelineSources(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineSourceSummary[];
export declare function findLatestFoundationAlertTimelineEntry(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineEntry | null;
export declare function summarizeFoundationAlertTimelineMetrics(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineMetrics;
export declare function summarizeFoundationAlertTimelineDigest(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineDigest;
export declare function listFoundationAlertTimelineActiveFilters(filters: FoundationAlertTimelineFilterState): FoundationAlertTimelineActiveFilterChip[];
export declare function summarizeFoundationAlertTimelineFilters(filters: FoundationAlertTimelineFilterState): string;
export declare function isFoundationAlertTimelineFilterStateEqual(left: FoundationAlertTimelineFilterState, right: FoundationAlertTimelineFilterState): boolean;
export declare function buildFoundationAlertTimelineEmptyState(filters: FoundationAlertTimelineFilterState): string;
export declare function buildFoundationAlertTimelineShortcutPresets(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineShortcutPreset[];
export interface FoundationAlertRuntimeCallbackStalledDetail {
    total: number;
    timeoutThresholds: Record<RuntimeGovernanceRiskLevel, number>;
    escalationSummary: FoundationAlertRuntimeCallbackStalledEscalationSummary;
    receipts: RuntimeGovernanceCallbackStallDetail[];
}
export interface FoundationAlertLytGovernanceAlertGroup {
    severity: 'high' | 'medium' | 'low';
    code: string;
    count: number;
    summary: string;
    affectedStoreIds: string[];
    affectedCapabilities: string[];
    recommendedNextActions: string[];
}
export interface FoundationAlertLytConnectionGovernanceRiskDetail {
    total: number;
    scope: {
        tenantId?: string;
        brandId?: string;
    };
    alerts: FoundationAlertLytGovernanceAlertGroup[];
    topAlertCodes: string[];
    affectedStoreIds: string[];
    affectedCapabilities: string[];
    recommendedNextActions: string[];
}
export type FoundationAlertDrilldownDetail = Record<string, unknown> | FoundationAlertRuntimeCallbackStalledDetail | FoundationAlertLytConnectionGovernanceRiskDetail;
export declare function isFoundationAlertRuntimeCallbackStalledDetail(code: FoundationAlertCode | string, detail: FoundationAlertDrilldownDetail | null | undefined): detail is FoundationAlertRuntimeCallbackStalledDetail;
export declare function getFoundationAlertRuntimeCallbackStalledDetail(drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined, code?: FoundationAlertCode | string | null): FoundationAlertRuntimeCallbackStalledDetail | null;
export declare function isFoundationAlertLytConnectionGovernanceRiskDetail(code: FoundationAlertCode | string, detail: FoundationAlertDrilldownDetail | null | undefined): detail is FoundationAlertLytConnectionGovernanceRiskDetail;
export declare function getFoundationAlertLytConnectionGovernanceRiskDetail(drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined, code?: FoundationAlertCode | string | null): FoundationAlertLytConnectionGovernanceRiskDetail | null;
export interface LytStoreCapabilityAccessItem {
    capability: string;
    readiness: 'ready' | 'inherited-ready' | 'stale' | 'pending-configuration' | 'not-enabled';
    access: 'enabled' | 'degraded' | 'blocked' | 'hidden';
    reason: string;
}
export interface LytStoreCapabilityAccessViewResponse {
    storeId: string;
    storeCode?: string;
    storeName?: string;
    connectionStatus: 'configured' | 'pending-configuration';
    resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback';
    healthStatus?: 'healthy' | 'stale' | 'pending-configuration';
    accessByCapability: LytStoreCapabilityAccessItem[];
    recommendedNextActions: string[];
}
export interface FoundationAlertPanelReadState {
    activeMutation: FoundationAlertMutationResponse | null;
    recentTimeline: FoundationAlertTimelineEntry[];
    currentOwner: string;
    currentNote: string;
}
export interface FoundationAlertPanelDerivedState extends FoundationAlertPanelReadState {
    selectedAlert: FoundationAlertCatalogItem | null;
    actionFilteredTimeline: FoundationAlertTimelineEntry[];
    runtimeCallbackDrilldown: FoundationAlertRuntimeCallbackStalledDetail | null;
    sourceSummary: FoundationAlertTimelineSourceSummary[];
    sourceFilteredTimeline: FoundationAlertTimelineEntry[];
    ownerSummary: FoundationAlertOwnerSummary[];
    filteredTimeline: FoundationAlertTimelineEntry[];
    latestMatchedTimeline: FoundationAlertTimelineEntry | null;
    timelineMetrics: FoundationAlertTimelineMetrics;
    timelineDigest: FoundationAlertTimelineDigest;
}
export interface FoundationAlertTimelineFilterReadState {
    filterState: FoundationAlertTimelineFilterState;
    activeFilterChips: FoundationAlertTimelineActiveFilterChip[];
    filterSummary: string;
    filterEmptyState: string;
    shortcutPresets: FoundationAlertTimelineShortcutPreset[];
    hasActiveFilters: boolean;
}
export type FoundationAlertOptimisticOverviewVisibility = 'hidden (optimistic)' | 'visible (optimistic)' | 'hidden' | 'visible';
export interface FoundationAlertOptimisticFeedback {
    title: string;
    description: string;
}
export interface FoundationAlertOptimisticReadState {
    overviewVisibility: FoundationAlertOptimisticOverviewVisibility;
    feedback: FoundationAlertOptimisticFeedback | null;
}
export interface FoundationAlertQuickSwitchItem {
    code: string;
}
export declare function resolveFoundationAlertSelectedCode<TAlert extends {
    code: string;
}>(alerts: readonly TAlert[], options?: {
    preferredCode?: string | null;
    currentCode?: string | null;
}): string;
export declare function buildFoundationAlertPanelReadState(options: {
    selectedAlert?: Pick<FoundationOperationsAlert, 'code' | 'recentOperation' | 'acknowledgement'> | null;
    drilldown?: Pick<FoundationAlertDrilldownResponse, 'history' | 'acknowledgement'> | null;
    mutation?: FoundationAlertMutationResponse | null;
}): FoundationAlertPanelReadState;
export declare function buildFoundationAlertPanelDerivedState(options: {
    alerts: FoundationAlertCatalogItem[];
    selectedAlertCode?: string | null;
    drilldown?: FoundationAlertDrilldownResponse | null;
    mutation?: FoundationAlertMutationResponse | null;
    filters: FoundationAlertTimelineFilterState;
}): FoundationAlertPanelDerivedState;
export declare function buildFoundationAlertTimelineFilterReadState(options: {
    action: FoundationAlertTimelineFilter;
    source: FoundationAlertTimelineSourceFilter;
    owner: FoundationAlertOwnerFilter;
    history?: FoundationAlertTimelineEntry[] | null;
}): FoundationAlertTimelineFilterReadState;
export declare function buildFoundationAlertQuickSwitchItems(topRisks: Array<{
    code: string;
}>, alerts: Array<{
    code: string;
}>, limit?: number): FoundationAlertQuickSwitchItem[];
export declare function buildFoundationAlertOptimisticReadState(options: {
    pendingMutationAction?: FoundationAlertMutationKind | null;
    visibleInOverview?: boolean | null;
}): FoundationAlertOptimisticReadState;
export interface FoundationAlertDrilldownResponse {
    generatedAt: string;
    code: FoundationAlertCode | string;
    catalog?: FoundationAlertCatalogItem | null;
    alert?: FoundationOperationsAlert | null;
    acknowledgement?: FoundationAlertAcknowledgement | null;
    visibleInOverview?: boolean;
    availableActions?: FoundationAlertOperation[];
    history?: FoundationAlertTimelineEntry[];
    detail?: FoundationAlertDrilldownDetail;
    availableAlertCodes?: FoundationAlertCode[];
}
export interface FoundationAlertMutationResponse {
    generatedAt: string;
    code: FoundationAlertCode | string;
    catalog?: FoundationAlertCatalogItem | null;
    acknowledgement?: FoundationAlertAcknowledgement;
    visibleInOverview?: boolean;
    availableActions?: FoundationAlertOperation[];
    history?: FoundationAlertTimelineEntry[];
    availableAlertCodes?: FoundationAlertCode[];
}
export declare const runtimeGovernanceClientApps: readonly ["admin-web", "tob-web", "storefront-web", "miniapp", "app", "lyt"];
export type RuntimeGovernanceClientApp = (typeof runtimeGovernanceClientApps)[number];
export declare const runtimeGovernanceActionKeys: readonly ["approval-execution", "market-profile-resolve", "regional-override-preview", "secret-rotation", "runtime-replay", "webhook-callback", "edge-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
export type RuntimeGovernanceActionKey = (typeof runtimeGovernanceActionKeys)[number];
export declare const runtimeGovernanceApiActionKeys: readonly ["approval-execution", "secret-rotation", "runtime-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
export type RuntimeGovernanceApiActionKey = (typeof runtimeGovernanceApiActionKeys)[number];
export declare const adminRuntimeActionKeys: readonly ["approval-execution", "secret-rotation", "runtime-replay"];
export type AdminRuntimeActionKey = (typeof adminRuntimeActionKeys)[number];
export declare const runtimeGovernanceNextSteps: readonly ["PROCEED", "LOGIN", "CHALLENGE", "REFRESH"];
export type RuntimeGovernanceNextStep = (typeof runtimeGovernanceNextSteps)[number];
export type RuntimeGovernanceActionState = 'blocked' | 'challenge-issued' | 'submitted' | 'callback-recorded' | 'replay-scheduled';
export declare const runtimeGovernanceRiskLevels: readonly ["low", "medium", "high"];
export type RuntimeGovernanceRiskLevel = (typeof runtimeGovernanceRiskLevels)[number];
export declare const runtimeGovernanceRecommendedActions: readonly ["REFRESH_BOOTSTRAP", "COMPLETE_LOGIN", "COMPLETE_CHALLENGE", "FOLLOW_SUBMIT_CALLBACK"];
export type RuntimeGovernanceRecommendedAction = (typeof runtimeGovernanceRecommendedActions)[number];
export declare const runtimeGovernanceCallbackStatuses: readonly ["callback-blocked", "callback-recorded"];
export type RuntimeGovernanceCallbackStatus = (typeof runtimeGovernanceCallbackStatuses)[number];
export declare const runtimeGovernanceCallbackReceiptStatuses: readonly ["callback-blocked", "awaiting-callback", "callback-recorded"];
export type RuntimeGovernanceCallbackReceiptStatus = (typeof runtimeGovernanceCallbackReceiptStatuses)[number];
export declare const runtimeGovernanceCallbackEvents: readonly ["PREREQUISITE_PENDING", "CHALLENGE_PENDING", "HANDLER_ACCEPTED", "HANDLER_COMPLETED"];
export type RuntimeGovernanceCallbackEvent = (typeof runtimeGovernanceCallbackEvents)[number];
export declare const runtimeGovernanceCallbackTimeoutThresholds: {
    readonly low: number;
    readonly medium: number;
    readonly high: number;
};
export declare const runtimeGovernanceCallbackStallEscalationActions: readonly ["WAIT_CALLBACK", "SCHEDULE_REPLAY", "OPEN_MANUAL_REVIEW"];
export type RuntimeGovernanceCallbackStallEscalationAction = (typeof runtimeGovernanceCallbackStallEscalationActions)[number];
export declare const runtimeGovernanceReplaySources: readonly ["ADMIN_WEB_RUNTIME", "TOB_WEB_RUNTIME", "STOREFRONT_WEB_RUNTIME", "MINIAPP_RUNTIME", "APP_RUNTIME"];
export type RuntimeGovernanceReplaySource = (typeof runtimeGovernanceReplaySources)[number];
export interface AdminRuntimeActionPresetContract {
    action: AdminRuntimeActionKey;
    label: string;
    scenario: string;
    riskLevel: RuntimeGovernanceRiskLevel;
    nextStep: RuntimeGovernanceNextStep;
    recommendedAction: RuntimeGovernanceRecommendedAction;
    requestEndpoint: string;
    handlerName: string;
    replaySource: Extract<RuntimeGovernanceReplaySource, 'ADMIN_WEB_RUNTIME'>;
    payload: Record<string, unknown>;
}
export declare const adminRuntimeActionPresetContracts: readonly [{
    readonly action: "runtime-replay";
    readonly label: "Runtime Replay";
    readonly scenario: "运营台从 runtime backlog 发起统一 replay，并立即拿到可查询的真实 receipt。";
    readonly riskLevel: "high";
    readonly nextStep: "PROCEED";
    readonly recommendedAction: "FOLLOW_SUBMIT_CALLBACK";
    readonly requestEndpoint: "/api/v1/foundation/runtime-governance/actions";
    readonly handlerName: "admin-runtime-replay-handler";
    readonly replaySource: "ADMIN_WEB_RUNTIME";
    readonly payload: {
        readonly sourceReceiptCode: "ADMIN-WORKBENCH-RUNTIME-REPLAY-001";
        readonly operatorNote: "manual-runtime-follow-up";
    };
}, {
    readonly action: "approval-execution";
    readonly label: "Approval Execution";
    readonly scenario: "总部总控台执行高风险审批前，先走统一 runtime submit，观察 challenge-issued 回执。";
    readonly riskLevel: "high";
    readonly nextStep: "CHALLENGE";
    readonly recommendedAction: "COMPLETE_CHALLENGE";
    readonly requestEndpoint: "/api/v1/workbenches/approvals/execute";
    readonly handlerName: "admin-approval-execution-handler";
    readonly replaySource: "ADMIN_WEB_RUNTIME";
    readonly payload: {
        readonly approvalCode: "APPROVAL-CODE-001";
        readonly challengeProfile: "step-up";
    };
}, {
    readonly action: "secret-rotation";
    readonly label: "Secret Rotation";
    readonly scenario: "密钥轮换在 fallback 场景先走真实 runtime submit，保留 blocked 回执与刷新建议。";
    readonly riskLevel: "high";
    readonly nextStep: "REFRESH";
    readonly recommendedAction: "REFRESH_BOOTSTRAP";
    readonly requestEndpoint: "/api/v1/foundation/configuration-governance/secrets/rotate";
    readonly handlerName: "admin-secret-rotation-handler";
    readonly replaySource: "ADMIN_WEB_RUNTIME";
    readonly payload: {
        readonly secretName: "tenant-demo-openapi-secret";
        readonly targetScope: "tenant";
        readonly rotationReason: "manual-governance-rotation";
    };
}];
export declare const adminRuntimeActionPresetContractMap: Record<"approval-execution" | "secret-rotation" | "runtime-replay", AdminRuntimeActionPresetContract>;
export declare const runtimeGovernanceReplayEscalationActions: readonly ["REFRESH_TICKET", "WAIT_CALLBACK", "OPEN_MANUAL_REVIEW"];
export type RuntimeGovernanceReplayEscalationAction = (typeof runtimeGovernanceReplayEscalationActions)[number];
export interface RuntimeGovernanceSubmitRequest {
    app: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceActionKey;
    nextStep: RuntimeGovernanceNextStep;
    riskLevel: RuntimeGovernanceRiskLevel;
    requestEndpoint: string;
    payload: Record<string, unknown>;
    payloadSummary: string;
    recommendedAction: RuntimeGovernanceRecommendedAction;
    handlerName: string;
    idempotencyKey: string;
    actorId?: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export interface RuntimeGovernanceSyncRequest {
    handlerName: string;
    ticketCode: string;
    idempotencyKey: string;
    actorId?: string;
    tenantId?: string;
}
export interface RuntimeGovernanceCallbackRequest {
    callbackStatus: RuntimeGovernanceCallbackStatus;
    ackToken: string;
    lastEvent: RuntimeGovernanceCallbackEvent;
    summary: string;
    idempotencyKey: string;
    actorId?: string;
    tenantId?: string;
}
export interface RuntimeGovernanceReplayRequest {
    ledgerKey: string;
    requestedFrom: RuntimeGovernanceReplaySource;
    ticketCode: string;
    idempotencyKey: string;
    actorId?: string;
    tenantId?: string;
}
export interface RuntimeGovernanceBatchReplayItem extends RuntimeGovernanceReplayRequest {
    receiptCode: string;
}
export interface RuntimeGovernanceBatchReplayRequest {
    items: RuntimeGovernanceBatchReplayItem[];
}
export interface RuntimeGovernanceBatchReplayResponse {
    generatedAt: string;
    total: number;
    items: Array<{
        receiptCode: string;
        receipt: RuntimeGovernanceReceipt;
    }>;
}
export interface RuntimeGovernanceOverviewFilter {
    focus?: 'all' | 'batch-replay' | 'governance-audit';
    state?: RuntimeGovernanceActionState;
    callbackStatus?: RuntimeGovernanceCallbackReceipt['callbackStatus'];
    riskLevel?: RuntimeGovernanceRiskLevel;
    replayable?: boolean;
    stalledOnly?: boolean;
}
export interface RuntimeGovernanceTicket {
    ticketCode: string;
    ticketType: 'BLOCK_GUARD' | 'CHALLENGE_GATE' | 'HANDLER_CALLBACK';
    status: 'waiting-prerequisite' | 'pending-challenge' | 'ready-for-handler';
    summary: string;
}
export interface RuntimeGovernanceSyncContract {
    handlerName: string;
    syncMode: 'deferred' | 'challenge-gated' | 'callback-followup';
    syncEndpoint: string;
    callbackEndpoint: string;
    idempotencyKey: string;
    ready: boolean;
    summary: string;
}
export interface RuntimeGovernanceCallbackReceipt {
    callbackStatus: RuntimeGovernanceCallbackReceiptStatus;
    ackToken: string;
    lastEvent: RuntimeGovernanceCallbackEvent;
    summary: string;
}
export interface RuntimeGovernanceLedgerRecord {
    ledgerKey: string;
    replayEndpoint: string;
    replayable: boolean;
    summary: string;
}
export interface RuntimeGovernanceReplayPolicy {
    replayEndpoint: string;
    retryable: boolean;
    maxAttempts: number;
    currentAttempt: number;
    nextBackoffMs: number;
    escalationAction: RuntimeGovernanceReplayEscalationAction;
    summary: string;
}
export interface RuntimeGovernanceCallbackStallStatus {
    stalled: boolean;
    timeoutMs: number;
    elapsedMs: number;
    exceededMs: number;
    escalationAction: RuntimeGovernanceCallbackStallEscalationAction;
    summary: string;
}
export interface RuntimeGovernanceCallbackStallDetail extends RuntimeGovernanceCallbackStallStatus {
    receiptCode: string;
    app: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceActionKey;
    riskLevel: RuntimeGovernanceRiskLevel;
    handlerName: string;
    callbackStatus: RuntimeGovernanceCallbackReceiptStatus;
    replayable: boolean;
    scopeKey: string;
    latestEventType: string | null;
}
export declare function buildRuntimeGovernanceReplayEndpoint(receiptCode: string): string;
export declare function createRuntimeGovernanceReplayPolicy(receiptCode: string, state: RuntimeGovernanceActionState): RuntimeGovernanceReplayPolicy;
export declare function advanceRuntimeGovernanceReplayPolicy(policy: Pick<RuntimeGovernanceReplayPolicy, 'currentAttempt' | 'maxAttempts' | 'nextBackoffMs'>): {
    currentAttempt: number;
    retryable: boolean;
    nextBackoffMs: number;
    escalationAction: "WAIT_CALLBACK" | "OPEN_MANUAL_REVIEW";
};
export declare function evaluateRuntimeGovernanceCallbackStall(receipt: Pick<RuntimeGovernanceReceipt, 'riskLevel' | 'callback' | 'retry' | 'events'>, options?: {
    now?: string | Date;
    startedAt?: string | Date;
}): RuntimeGovernanceCallbackStallStatus;
export declare function buildRuntimeGovernanceCallbackStallDetail(receipt: Pick<RuntimeGovernanceReceipt, 'receiptCode' | 'app' | 'action' | 'riskLevel' | 'sync' | 'callback' | 'ledger' | 'rateLimit' | 'retry' | 'events'>, options?: {
    now?: string | Date;
    startedAt?: string | Date;
}): RuntimeGovernanceCallbackStallDetail;
export interface RuntimeGovernanceRateLimitDecision {
    allowed: boolean;
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
    scopeKey: string;
}
export interface RuntimeGovernanceEventRecord {
    eventType: string;
    status: 'accepted' | 'duplicate';
    idempotencyKey: string;
    occurredAt: string;
    summary: string;
}
export type RuntimeGovernanceApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED';
export interface RuntimeGovernanceApprovalExecutionFailure {
    failureStatus: string | null;
    failureReason: string | null;
    failedAt: string | null;
    failedBy: string | null;
}
export interface RuntimeGovernanceApprovalExecution {
    attempts: number;
    executed: boolean;
    executionStatus: string | null;
    executedAt: string | null;
    executedBy: string | null;
    lastFailure: RuntimeGovernanceApprovalExecutionFailure | null;
}
export interface RuntimeGovernanceApproval {
    required: boolean;
    ticket: string | null;
    status: RuntimeGovernanceApprovalStatus;
    requestedBy: string | null;
    decidedBy: string | null;
    decidedAt: string | null;
    updatedAt: string | null;
    execution?: RuntimeGovernanceApprovalExecution;
    summary?: Record<string, unknown> | null;
}
export interface RuntimeGovernanceReceipt {
    receiptCode: string;
    app: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceActionKey;
    state: RuntimeGovernanceActionState;
    nextStep: RuntimeGovernanceNextStep;
    riskLevel: RuntimeGovernanceRiskLevel;
    recommendedAction: RuntimeGovernanceRecommendedAction;
    requestEndpoint: string;
    payloadSummary: string;
    ticket: RuntimeGovernanceTicket;
    sync: RuntimeGovernanceSyncContract;
    callback: RuntimeGovernanceCallbackReceipt;
    ledger: RuntimeGovernanceLedgerRecord;
    retry: RuntimeGovernanceReplayPolicy;
    rateLimit: RuntimeGovernanceRateLimitDecision;
    approval?: RuntimeGovernanceApproval;
    events: RuntimeGovernanceEventRecord[];
    generatedAt: string;
}
export interface RuntimeGovernanceOperationsOverviewSummary {
    backlog: number;
    stalledCallbacks: number;
    highRiskBacklog: number;
    blockedActions: number;
}
export interface RuntimeGovernanceOperationsBatchSummary {
    filteredReceipts: number;
    replayableReceipts: number;
    governanceAuditReceipts: number;
    stalledReceipts: number;
    blockedReceipts: number;
    highRiskReceipts: number;
}
export interface RuntimeGovernanceOperationsOverview {
    generatedAt: string;
    appliedFilter: RuntimeGovernanceOverviewFilter;
    summary: RuntimeGovernanceOperationsOverviewSummary;
    totalSummary: RuntimeGovernanceOperationsOverviewSummary;
    receipts: RuntimeGovernanceReceipt[];
    stalledReceipts: RuntimeGovernanceCallbackStallDetail[];
    batchSummary: RuntimeGovernanceOperationsBatchSummary;
}
export interface FoundationOperationsAlert {
    severity: FoundationAlertSeverity;
    code: FoundationAlertCode;
    count: number;
    summary: string;
    acknowledgement?: FoundationAlertAcknowledgement | null;
    visibleInOverview?: boolean;
    availableActions?: FoundationAlertOperation[];
    recentOperation?: FoundationAlertTimelineEntry | null;
    triageState?: FoundationOperationsAlertTriageState;
    triageSummary?: string;
}
export interface FoundationOperationsOverviewSummary {
    approvalsPending: number;
    approvalsWithFailures: number;
    highRiskAudits: number;
    blockedLedgers: number;
    rotationDueSecrets: number;
    expiredSecrets: number;
    expiringCertificates: number;
    expiredCertificates: number;
    degradedSignals: number;
    attentionRecoveryPlans: number;
    staleDrills: number;
    runtimeGovernanceBacklog: number;
    stalledRuntimeCallbacks: number;
    highRiskRuntimeBacklog: number;
    runtimeBlockedActions: number;
}
export interface FoundationOperationsOverviewResponse {
    generatedAt: string;
    summary: FoundationOperationsOverviewSummary;
    alerts: FoundationOperationsAlert[];
    topRisks: FoundationOperationsAlert[];
    modules?: {
        runtimeGovernance?: RuntimeGovernanceOperationsOverview;
        [key: string]: unknown;
    };
}
export interface FoundationCapabilityDescriptor {
    key: string;
    name: string;
    responsibilities: string[];
    entrypoints: string[];
    consumers: FoundationConsumerKey[];
    status: 'planned' | 'skeleton' | 'active';
}
export interface FoundationModuleDescriptor {
    key: FoundationModuleKey;
    name: string;
    purpose: string;
    inboundContracts: string[];
    outboundContracts: string[];
    capabilities: FoundationCapabilityDescriptor[];
}
export interface FoundationConsumerDescriptor {
    consumer: FoundationConsumerKey;
    modulePath: string;
    dependsOn: FoundationModuleKey[];
    responsibility: string;
    handoffContracts: string[];
    recommendedSequence: string[];
    governanceTouchpoints: string[];
    highRiskEntrypoints: string[];
    actionGovernanceExamples: FoundationConsumerActionGovernanceExample[];
    runtimeHandoffExamples: FoundationConsumerRuntimeHandoffExample[];
    runtimeReceiptExamples: FoundationConsumerRuntimeReceiptExample[];
    governanceAlertLifecycleExamples: FoundationConsumerGovernanceAlertLifecycleExample[];
}
export interface FoundationConsumerActionGovernanceExample {
    surface: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceActionKey;
    scenario: string;
    riskLevel: 'low' | 'medium' | 'high';
    bootstrapState: FoundationFrontendBootstrapState;
    nextStep: RuntimeGovernanceNextStep;
    submitState: RuntimeGovernanceActionState;
    requestEndpoint: string;
}
export interface FoundationConsumerRuntimeHandoffExample {
    surface: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceActionKey;
    scenario: string;
    ticketType: RuntimeGovernanceTicket['ticketType'];
    ticketStatus: RuntimeGovernanceTicket['status'];
    handlerName: string;
    syncMode: RuntimeGovernanceSyncContract['syncMode'];
    syncEndpoint: string;
    callbackStatus: RuntimeGovernanceCallbackReceipt['callbackStatus'];
    callbackEndpoint: string;
    replayStatus: 'replay-scheduled' | 'replay-blocked' | 'replay-skipped';
    replayEndpoint: string;
    retryEscalationAction: RuntimeGovernanceReplayPolicy['escalationAction'];
}
export interface FoundationConsumerRuntimeReceiptExample {
    surface: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceActionKey;
    scenario: string;
    mode: 'api-first-submit' | 'fallback-replay' | 'fallback-callback';
    receiptState: RuntimeGovernanceActionState;
    generatedAtSource: 'api' | 'local-fallback';
    requestEndpoint: string;
    runtimeEndpoint: string;
    callbackStatus: RuntimeGovernanceCallbackReceipt['callbackStatus'];
    replayable: boolean;
    rateLimitScopeKey: string;
    latestEventType: string;
}
export interface FoundationConsumerGovernanceAlertLifecycleExample {
    surface: RuntimeGovernanceClientApp;
    alertCode: FoundationAlertCode;
    stage: 'drilldown' | 'ack' | 'mute' | 'unmute';
    scenario: string;
    endpoint: string;
    latestHistoryAction: FoundationAlertMutationKind;
    acknowledgementStatus: FoundationAlertAcknowledgementStatus | null;
    visibleInOverview: boolean;
    availableActions: FoundationAlertOperation[];
}
export declare const adminWorkbenchConsumerDescriptor: FoundationConsumerDescriptor;
export interface FoundationGovernanceBaseline {
    key: string;
    name: string;
    ownerModule: FoundationModuleKey;
    summary: string;
    controls: string[];
    evidence: string[];
}
export interface FoundationBlueprint {
    generatedAt: string;
    docs: string[];
    guardrails: string[];
    frontendBootstrap: UnifiedFoundationBootstrapContract;
    modules: FoundationModuleDescriptor[];
    consumers: FoundationConsumerDescriptor[];
    governanceBaselines: FoundationGovernanceBaseline[];
}
export type FoundationOperationsAlertTriageState = 'needs-triage' | 'acknowledged' | 'muted' | 'expired-mute';
export type FoundationFrontendBootstrapState = 'bootstrapping' | 'ready' | 'readonly-fallback' | 'challenge-required' | 'scope-mismatch';
export type FoundationSupportedClient = 'PC' | 'PAD' | 'H5' | 'MINIAPP' | 'APP';
export declare const foundationSupportedClients: readonly ["PC", "PAD", "H5", "MINIAPP", "APP"];
export declare const foundationAlertCatalogFallback: FoundationAlertCatalogItem[];
export interface MarketProfileContract {
    marketCode: string;
    marketName: string;
    countryCode: string;
    locale: {
        defaultLanguage: string;
        supportedLanguages: string[];
    };
    timezone: {
        timezone: string;
    };
    currency: {
        currencyCode: string;
        symbol: string;
    };
    tax: {
        taxMode: string;
        taxRate: number;
        taxLabel: string;
    };
    network: {
        networkRegion: string;
        apiBaseUrl: string;
        cdnBaseUrl: string;
        callbackBaseUrl: string;
    };
    email: {
        provider: string;
        fromName: string;
        fromAddress: string;
        replyTo: string;
    };
    social: {
        primaryPlatforms: string[];
        supportPlatforms: string[];
    };
}
export interface RegionalConfigOverrideContract {
    scopeType: string;
    scopeCode: string;
    inheritanceMode: string;
    marketCode: string;
    locale?: {
        defaultLanguage?: string;
        supportedLanguages?: string[];
    };
    timezone?: {
        timezone?: string;
    };
    currency?: {
        currencyCode?: string;
        symbol?: string;
    };
    tax?: {
        taxMode?: string;
        taxRate?: number;
        taxLabel?: string;
    };
    network?: {
        networkRegion?: string;
        apiBaseUrl?: string;
        cdnBaseUrl?: string;
        callbackBaseUrl?: string;
    };
    email?: {
        provider?: string;
        fromName?: string;
        fromAddress?: string;
        replyTo?: string;
    };
    social?: {
        primaryPlatforms?: string[];
        supportPlatforms?: string[];
    };
}
export interface MarketBootstrapResponse extends BootstrapFoundationMetadataContract {
    defaultDomesticMarketCode: string;
    defaultInternationalMarketCode: string;
    supportedMarkets: MarketProfileContract[];
}
export interface BootstrapFoundationMetadataContract {
    foundationDependencies: FoundationModuleKey[];
    foundationContracts: string[];
}
export interface PortalLoginEntryContract {
    label: string;
    loginPath: string;
    ssoEnabled: boolean;
}
export interface TobPortalContract {
    audience: string;
    scopeType: string;
    scopeCode: string;
    tenantCode: string;
    brandCode?: string;
    marketCode: string;
    channel: string;
    name: string;
    primaryDomain: string;
    domainSource: 'custom' | 'default';
    supportedLanguages: string[];
    heroTitle: string;
    heroSubtitle: string;
    solutionTags: string[];
    loginEntry: PortalLoginEntryContract;
}
export interface StorePortalContract {
    audience: string;
    scopeType: string;
    scopeCode: string;
    tenantCode: string;
    brandCode: string;
    storeCode: string;
    storeName: string;
    marketCode: string;
    channel: string;
    name: string;
    primaryDomain: string;
    domainSource: 'custom' | 'default';
    supportedLanguages: string[];
    supportedSurfaces: string[];
}
export interface PortalBootstrapResponse extends BootstrapFoundationMetadataContract {
    tenantPortal: TobPortalContract;
    brandPortal: TobPortalContract;
    storePortal: StorePortalContract;
    marketProfile: MarketProfileContract;
    regionalOverrides: RegionalConfigOverrideContract[];
}
export interface PortalDomainGovernanceScopeSummaryContract {
    scopeType: string;
    tenantId: string;
    brandId?: string;
    storeId?: string;
    activeDomainCount: number;
    missingPrimary: boolean;
    currentPrimaryDomain?: string | null;
    recommendedDomain?: string | null;
    recommendationReason?: string;
}
export interface PortalDomainGovernanceSummaryContract {
    totalMissingPrimaryScopes: number;
    totalActiveWithoutPrimaryDomains: number;
    recommendedReadyScopes: number;
    tenantMissingPrimaryScopes: number;
    brandMissingPrimaryScopes: number;
    storeMissingPrimaryScopes: number;
    requiresAttention: boolean;
    lastEvaluatedAt: string;
    currentScopes: PortalDomainGovernanceScopeSummaryContract[];
}
export interface DomainGovernanceWorkspaceQuery {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    scopeType?: string;
}
export declare function selectDomainGovernanceFocusScope(summary: PortalDomainGovernanceSummaryContract): PortalDomainGovernanceScopeSummaryContract | undefined;
export declare function buildDomainGovernanceHref(query?: DomainGovernanceWorkspaceQuery): string;
export declare function buildDomainGovernanceWorkspaceHref(summary: PortalDomainGovernanceSummaryContract, marketCode: string): string;
export declare function getDomainGovernanceAttentionLabel(summary: PortalDomainGovernanceSummaryContract): '待治理' | '已对齐';
export declare function formatDomainGovernanceCountsSummary(summary: PortalDomainGovernanceSummaryContract): string;
export declare function formatDomainGovernanceSourceSummary(domainSource: string, summary: PortalDomainGovernanceSummaryContract): string;
export interface WorkbenchNavItemContract {
    key: string;
    label: string;
    href: string;
    description: string;
}
export interface RoleWorkbenchContract {
    role: string;
    channel: string;
    title: string;
    description: string;
    marketCodes: string[];
    navItems: WorkbenchNavItemContract[];
}
export declare const defaultRoleWorkbenchContracts: RoleWorkbenchContract[];
export declare const defaultRoleWorkbenchContractMap: Record<string, RoleWorkbenchContract>;
/**
 * 前端 Workbench 角色 (大写下划线) → 后端 tenant-config 角色 (蛇形)
 *
 * 后端 ROLE_LEVEL_ACCESS 使用小写蛇形:
 *   super_admin / brand_admin / tenant_admin / store_admin / operator / viewer / auditor
 * 前端 defaultRoleWorkbenchContracts 使用大写下划线:
 *   SUPER_ADMIN / BRAND_MANAGER / TENANT_ADMIN / STORE_MANAGER / OPERATIONS / VIEWER / AUDITOR
 * (GUIDE / CASHIER / WAREHOUSE / FINANCE / COACH 等暂未在 tenant-config 中使用)
 */
export declare const FRONTEND_TO_BACKEND_ROLE: Record<string, string>;
/** 后端角色枚举 (与后端 ROLE_LEVEL_ACCESS key 对齐) */
export type BackendTenantRole = 'super_admin' | 'brand_admin' | 'tenant_admin' | 'store_admin' | 'operator' | 'viewer' | 'auditor';
/** 前端 Workbench 角色 (与 defaultRoleWorkbenchContracts 对齐) */
export type FrontendWorkbenchRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'BRAND_MANAGER' | 'STORE_MANAGER' | 'GUIDE' | 'CASHIER' | 'OPERATIONS' | 'FINANCE' | 'WAREHOUSE' | 'COACH';
/** 角色映射工具: 把前端 Workbench role 转成后端 tenant-config role */
export declare function mapToBackendRole(frontendRole: string): BackendTenantRole | undefined;
export interface TenantContextContract {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export declare const memberLevelContracts: readonly ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
export type MemberLevelContract = (typeof memberLevelContracts)[number];
export declare const memberStatusContracts: readonly ["ACTIVE", "FROZEN", "EXPIRED", "BLACKLISTED"];
export type MemberStatusContract = (typeof memberStatusContracts)[number];
export declare const memberLifecycleStageContracts: readonly ["prospect", "newly-paid", "repeat-paid", "vip-active"];
export type MemberLifecycleStageContract = (typeof memberLifecycleStageContracts)[number];
export declare const memberDataSourceContracts: readonly ["memory", "prisma"];
export type MemberDataSourceContract = (typeof memberDataSourceContracts)[number];
export declare const memberOperationsActionCodeContracts: readonly ["complete-member-onboarding", "send-post-payment-welcome", "issue-bounce-back-coupon", "recommend-repeat-purchase-bundle", "invite-loyalty-challenge", "assign-vip-concierge", "push-new-arrival-preview", "deliver-channel-follow-up"];
export type MemberOperationsActionCodeContract = (typeof memberOperationsActionCodeContracts)[number];
export declare const memberOperationsActionChannelContracts: readonly ["coupon", "crm-task", "wechat", "app-push"];
export type MemberOperationsActionChannelContract = (typeof memberOperationsActionChannelContracts)[number];
export declare const memberOperationsPriorityContracts: readonly ["high", "medium", "low"];
export type MemberOperationsPriorityContract = (typeof memberOperationsPriorityContracts)[number];
export declare const memberAutomationTriggerCodeContracts: readonly ["payment-success-journey", "newly-paid-bounce-back", "repeat-paid-retention", "vip-service-upgrade", "channel-retouch"];
export type MemberAutomationTriggerCodeContract = (typeof memberAutomationTriggerCodeContracts)[number];
export declare const memberAutomationTriggerStatusContracts: readonly ["ready", "watch"];
export type MemberAutomationTriggerStatusContract = (typeof memberAutomationTriggerStatusContracts)[number];
export declare const memberAutomationTriggerSourceContracts: readonly ["payment-success", "lifecycle", "tag"];
export type MemberAutomationTriggerSourceContract = (typeof memberAutomationTriggerSourceContracts)[number];
export declare const memberOperationsTaskStatusContracts: readonly ["queued", "dispatched", "completed"];
export type MemberOperationsTaskStatusContract = (typeof memberOperationsTaskStatusContracts)[number];
export declare const memberOperationsExecutionLaneContracts: readonly ["campaign-execution", "member-crm", "promo-conversion"];
export type MemberOperationsExecutionLaneContract = (typeof memberOperationsExecutionLaneContracts)[number];
export declare const memberOperationsTaskSourceContracts: readonly ["payment-success", "manual-refresh"];
export type MemberOperationsTaskSourceContract = (typeof memberOperationsTaskSourceContracts)[number];
export declare const memberOperationsReceiptTargetTypeContracts: readonly ["coupon-offer", "crm-follow-up"];
export type MemberOperationsReceiptTargetTypeContract = (typeof memberOperationsReceiptTargetTypeContracts)[number];
export declare const memberOperationsReceiptStatusContracts: readonly ["completed"];
export type MemberOperationsReceiptStatusContract = (typeof memberOperationsReceiptStatusContracts)[number];
export declare const memberOperationsRuntimeStateContracts: readonly ["blocked", "challenge-issued", "submitted", "callback-recorded", "replay-scheduled"];
export type MemberOperationsRuntimeStateContract = (typeof memberOperationsRuntimeStateContracts)[number];
export interface MemberProfileContract {
    memberId: string;
    userId?: string;
    tenantContext: TenantContextContract;
    mobile?: string;
    nickname: string;
    email?: string;
    address?: string;
    notes?: string;
    level: MemberLevelContract;
    status: MemberStatusContract;
    points: number;
    growthValue?: number;
    svipStatus?: string;
    registeredAt: string;
    lastActiveAt?: string;
    lifecycleStage?: MemberLifecycleStageContract;
    tags?: string[];
    lastPaymentAt?: string;
    lastPaymentAmount?: number;
    lastPaymentOrderId?: string;
    lastPaymentChannel?: string;
    source?: MemberDataSourceContract;
    persisted?: boolean;
}
export interface LytMemberSnapshotContract {
    snapshotId: string;
    tenantContext: TenantContextContract;
    memberProfileId?: string;
    externalMemberId: string;
    memberCode?: string;
    mobile?: string;
    nickname?: string;
    levelCode?: string;
    points: number;
    growthValue: number;
    status: string;
    updatedAtFromSource: string;
    rawVersion?: string;
    rawPayload?: Record<string, unknown>;
    source?: MemberDataSourceContract;
}
export interface MemberOperationsActionContract {
    code: MemberOperationsActionCodeContract;
    label: string;
    reason: string;
    channel: MemberOperationsActionChannelContract;
    priority: MemberOperationsPriorityContract;
}
export interface MemberAutomationTriggerContract {
    code: MemberAutomationTriggerCodeContract;
    status: MemberAutomationTriggerStatusContract;
    source: MemberAutomationTriggerSourceContract;
    reason: string;
}
export interface MemberOperationsProfileContract {
    memberId: string;
    tenantContext: TenantContextContract;
    level: MemberLevelContract;
    status: MemberStatusContract;
    lifecycleStage: MemberLifecycleStageContract | 'prospect';
    audienceSegments: string[];
    recommendedActions: MemberOperationsActionContract[];
    automationTriggers: MemberAutomationTriggerContract[];
    lastPaymentAt?: string;
    lastPaymentAmount?: number;
    lastPaymentChannel?: string;
    tags: string[];
    source?: MemberDataSourceContract;
}
export interface MemberOperationsTaskContract {
    taskId: string;
    tenantContext: TenantContextContract;
    memberId: string;
    actionCode: MemberOperationsActionCodeContract;
    title: string;
    reason: string;
    channel: MemberOperationsActionChannelContract;
    priority: MemberOperationsPriorityContract;
    status: MemberOperationsTaskStatusContract;
    executionLane: MemberOperationsExecutionLaneContract;
    source: MemberOperationsTaskSourceContract;
    sourceOrderId?: string;
    sourcePaymentId?: string;
    executionSummary?: string;
    executionTargetId?: string;
    executedAt?: string;
    dedupeKey: string;
    createdAt: string;
    scheduledAt: string;
}
export interface MemberOperationsExecutionReceiptContract {
    executionId: string;
    tenantContext: TenantContextContract;
    memberId: string;
    taskId: string;
    actionCode: MemberOperationsActionCodeContract;
    targetType: MemberOperationsReceiptTargetTypeContract;
    targetId: string;
    status: MemberOperationsReceiptStatusContract;
    summary: string;
    payload: Record<string, unknown>;
    runtimeReceiptCode?: string;
    runtimeState?: MemberOperationsRuntimeStateContract;
    runtimeReplayable?: boolean;
    executedAt: string;
}
export interface FoundationBootstrapResponse extends FoundationBlueprint {
    tenantContext: TenantContextContract;
}
export interface RegionalLoginPolicyContract {
    defaultLoginPath: string;
    ssoEnabled: boolean;
}
export interface WorkbenchBootstrapResponse extends BootstrapFoundationMetadataContract {
    tenantContext: TenantContextContract;
    workbenches: RoleWorkbenchContract[];
    storePortals: StorePortalContract[];
    tenantPortal: TobPortalContract;
    brandPortal: TobPortalContract;
    marketProfile: MarketProfileContract;
    regionalLoginPolicies: RegionalLoginPolicyContract;
    supportedLocales: string[];
    supportedClients: FoundationSupportedClient[];
}
export declare const foundationBootstrapCapabilityRules: BootstrapCapabilityRule[];
export declare const foundationAppBootstrapProfiles: Record<FoundationClientApp, AppBootstrapWiring>;
export declare const foundationBootstrapContract: UnifiedFoundationBootstrapContract;
export declare function getFoundationAppBootstrapWiring(app: FoundationClientApp): AppBootstrapWiring;
export type AuditRiskLevel = 'low' | 'medium' | 'high';
export interface AuditRecordContract {
    auditId: string;
    eventType: string;
    tenantId?: string;
    actorId?: string;
    source?: string;
    riskLevel: AuditRiskLevel;
    occurredAt: string;
    details: Record<string, unknown>;
}
export interface AuditTrailQuery {
    tenantId?: string;
    action?: string;
    source?: string;
    requestId?: string;
    actorId?: string;
    approvalTicket?: string;
    resourceType?: string;
    resourceId?: string;
    purpose?: string;
    riskLevel?: AuditRiskLevel;
    from?: string;
    to?: string;
    limit?: number;
}
export interface AuditTrailResponse {
    records: AuditRecordContract[];
    total: number;
    query: AuditTrailQuery;
}
export interface AuditTrailSummary {
    total: number;
    byAction: Record<string, number>;
    bySource: Record<string, number>;
    byRiskLevel: Record<AuditRiskLevel, number>;
}
export declare function buildAuditTrailHref(query?: AuditTrailQuery): string;
export declare function buildAuditTrailRecordDetailHref(auditId: string): string;
export declare function readAuditTrailRecordDetailParam(raw: unknown): string | null;
export type ConfigurationScopeType = 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE';
export interface ConfigurationScope {
    scopeType: ConfigurationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export interface ConfigurationConfigEntryRevision {
    version: number;
    changedBy?: string;
    changeReason?: string;
    createdAt: string;
}
export interface ConfigurationConfigEntry {
    id: string;
    namespace?: string;
    key: string;
    valueType?: string;
    scopeType: ConfigurationScopeType | string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketProfileId?: string;
    portalSiteId?: string;
    version?: number;
    value?: unknown;
    schemaRef?: string;
    tags?: string[];
    status?: string;
    createdBy?: string;
    latestRevision?: ConfigurationConfigEntryRevision | null;
    updatedAt: string;
}
export interface ConfigurationFeatureFlag {
    key: string;
    name?: string;
    description?: string;
    enabled: boolean;
    reason?: string;
    matchedScope?: ConfigurationScope | null;
    rolloutPercentage?: number;
    subjectKey?: string;
    source?: 'in-memory' | 'persisted' | string;
}
export type ConfigurationSecretStatus = 'rotation-due' | 'expired' | 'active' | string;
export type ConfigurationCertificateStatus = 'active' | 'expiring-soon' | 'expired' | string;
export interface ConfigurationSecretMetadata {
    name: string;
    status?: ConfigurationSecretStatus;
    expiresAt?: string | null;
    consumers?: string[];
    version?: number;
    rotationDueAt?: string | null;
    source?: string;
    rotatedBy?: string | null;
    rotatedAt?: string | null;
}
export interface ConfigurationCertificateMetadata {
    name: string;
    status: ConfigurationCertificateStatus;
    expiresAt: string;
    autoRenew?: boolean;
    issuer?: string;
    fingerprint?: string;
    daysToExpire?: number;
}
export interface ConfigurationSnapshot {
    snapshotId: string;
    generatedAt: string;
    scopeChain: ConfigurationScope[];
    context: ConfigurationScope;
    config: Record<string, unknown>;
    featureFlags: ConfigurationFeatureFlag[];
    secrets: ConfigurationSecretMetadata[];
    checksum: string;
}
export interface ConfigurationPostureAttention {
    type: 'secret' | 'certificate';
    key: string;
    status: string;
    expiresAt?: string | null;
}
export interface ConfigurationPosture {
    generatedAt: string;
    secrets: {
        total: number;
        rotationDue: number;
        expired: number;
        sharedConsumers: number;
    };
    certificates: {
        total: number;
        expiringSoon: number;
        expired: number;
        autoRenewDisabled: number;
    };
    attention: {
        secrets: ConfigurationPostureAttention[];
        certificates: ConfigurationPostureAttention[];
    };
}
export interface ConfigurationGovernanceMetadataEntry {
    operation: string;
    rbac: {
        resource: string;
        action: string;
        requiredRoles: string[];
        requiredPermissions: string[];
    };
    approval: {
        required: boolean;
        approvalId: string | null;
        version: number | null;
        requestedBy: string | null;
        ticket: string | null;
        status: ConfigurationGovernanceMetadataStatus;
        submitted: boolean;
        persisted: boolean;
        decidedBy: string | null;
        decidedAt: string | null;
        updatedAt: string | null;
        execution: {
            attempts: number;
            executed: boolean;
            executionStatus: string | null;
            executedAt: string | null;
            executedBy: string | null;
        };
    };
}
export type ConfigurationGovernanceMetadataStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED' | string;
export interface ConfigurationOverview {
    generatedAt: string;
    approvals?: Record<string, Record<string, number>>;
    audits?: Record<string, Record<string, number>>;
    configuration: {
        entries: {
            total: number;
            active: number;
            namespaces: Record<string, number>;
            items: ConfigurationConfigEntry[];
        };
        featureFlags: {
            total: number;
            enabled: number;
            active: number;
            byStrategy: Record<string, number>;
            items: ConfigurationFeatureFlag[];
        };
        secrets: {
            total: number;
            persisted: number;
            static: number;
            rotationDue: number;
            expired: number;
            items: ConfigurationSecretMetadata[];
        };
        certificates: {
            total: number;
            autoRenew: number;
            expiringSoon: number;
            expired: number;
            items: ConfigurationCertificateMetadata[];
        };
    };
    posture: ConfigurationPosture;
    scopeChain?: ConfigurationScope[];
}
export interface ConfigurationOverviewQuery {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export declare function buildConfigurationHref(query?: ConfigurationOverviewQuery): string;
export declare function buildConfigurationOperationDetailHref(operation: string): string;
export declare function readConfigurationOperationDetailParam(raw: unknown): string | null;
export declare function buildConfigurationSecretDetailHref(name: string): string;
export declare function readConfigurationSecretDetailParam(raw: unknown): string | null;
export declare function buildConfigurationCertificateDetailHref(name: string): string;
export declare function readConfigurationCertificateDetailParam(raw: unknown): string | null;
export declare function buildConfigurationFeatureFlagDetailHref(key: string): string;
export declare function readConfigurationFeatureFlagDetailParam(raw: unknown): string | null;
export declare function buildConfigurationConfigEntryDetailHref(id: string): string;
export declare function readConfigurationConfigEntryDetailParam(raw: unknown): string | null;
export declare function buildIntegrationOrchestrationSourceDetailHref(source: string): string;
export declare function readIntegrationOrchestrationSourceDetailParam(raw: unknown): string | null;
export declare function buildIntegrationOrchestrationEventDetailHref(envelopeId: string): string;
export declare function readIntegrationOrchestrationEventDetailParam(raw: unknown): string | null;
export declare function buildIntegrationOrchestrationIdempotencyDetailHref(key: string): string;
export declare function readIntegrationOrchestrationIdempotencyDetailParam(raw: unknown): string | null;
export interface IntegrationOrchestrationEventDetail {
    deliveryMode: 'api' | 'fallback';
    generatedAt: string;
    envelopeId: string;
    notFound: boolean;
    envelope: IntegrationEventEnvelopeContract | null;
    relatedIdempotencyRecords: IntegrationIdempotencyRecordContract[];
    workspaceHref: string;
    foundationHref: string;
    auditHref: string;
}
export interface IntegrationOrchestrationIdempotencyDetail {
    deliveryMode: 'api' | 'fallback';
    generatedAt: string;
    key: string;
    notFound: boolean;
    record: IntegrationIdempotencyRecordContract | null;
    relatedEvent: IntegrationEventEnvelopeContract | null;
    workspaceHref: string;
    foundationHref: string;
    auditHref: string;
}
export type ObservabilitySignalType = 'metrics' | 'logs' | 'traces';
export type ObservabilityStatus = 'healthy' | 'warning' | 'critical';
export type RecoveryPlanStatus = 'ready' | 'attention';
export interface ObservabilitySignalContract {
    signal: ObservabilitySignalType;
    status: ObservabilityStatus;
    coverage: number;
    collectionLagSeconds: number;
    lastCollectedAt: string;
    owner: string;
    alertRoutes: string[];
    evidence: string[];
}
export interface RetryPolicyContract {
    key: string;
    capability: string;
    trigger: string;
    maxAttempts: number;
    backoff: string;
    recoveryAction: string;
    escalationTarget: string;
}
export interface RecoveryPlanContract {
    resource: string;
    status: RecoveryPlanStatus;
    rtoMinutes: number;
    rpoMinutes: number;
    lastDrillAt: string;
    staleAfterDays: number;
    dependencies: string[];
    runbook: string;
}
export interface ResilienceOverview {
    generatedAt: string;
    observability: {
        totalSignals: number;
        degradedSignals: number;
        byStatus: Record<string, number>;
        averageCoverage: number;
        maxCollectionLagSeconds: number;
        signals: ObservabilitySignalContract[];
    };
    retries: {
        totalPolicies: number;
        byCapability: Record<string, number>;
        maxAttempts: number;
        policies: RetryPolicyContract[];
    };
    recovery: {
        totalPlans: number;
        attentionRequired: number;
        staleDrills: number;
        plans: RecoveryPlanContract[];
    };
}
export interface EdgeReplayStageRequest {
    storeId: string;
    operationCount: number;
}
export interface EdgeReplayStageContract {
    status: 'staged';
    storeId: string;
    operationCount: number;
    replayPipeline: string[];
    retryPolicy?: RetryPolicyContract | null;
    observabilityHooks: string[];
    recoveryPlan?: RecoveryPlanContract | null;
}
export interface ResilienceQuery {
    capability?: string;
    status?: string;
    resource?: string;
}
export declare function buildResilienceHref(query?: ResilienceQuery): string;
export declare function buildResilienceSignalDetailHref(signal: string): string;
export declare function readResilienceSignalDetailParam(raw: unknown): string | null;
export declare function buildResilienceRetryPolicyDetailHref(key: string): string;
export declare function readResilienceRetryPolicyDetailParam(raw: unknown): string | null;
export declare function buildResilienceRecoveryPlanDetailHref(resource: string): string;
export declare function readResilienceRecoveryPlanDetailParam(raw: unknown): string | null;
export type RateLimitScopeType = 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'INTEGRATION';
export type RateLimitPeriod = 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
export type RateLimitAlgorithm = 'FIXED_WINDOW' | 'SLIDING_WINDOW' | 'TOKEN_BUCKET' | string;
export type QuotaLedgerStatus = 'healthy' | 'warning' | 'blocked';
export interface RateLimitPolicyRecord {
    id: string;
    code: string;
    scopeType: RateLimitScopeType | string;
    tenantId?: string | null;
    brandId?: string | null;
    storeId?: string | null;
    integrationAppId?: string | null;
    period: RateLimitPeriod | string;
    limit: number;
    burstLimit?: number | null;
    dimensionKeys?: string[];
    algorithm?: RateLimitAlgorithm;
    metadata?: Record<string, unknown>;
    updatedAt: string;
}
export interface QuotaLedgerRecord {
    id: string;
    subjectKey: string;
    period: RateLimitPeriod | string;
    consumed: number;
    remaining?: number | null;
    resetAt: string;
    metadata?: Record<string, unknown>;
    updatedAt: string;
    policy: {
        id: string;
        code: string;
        limit: number;
        period: RateLimitPeriod | string;
    };
}
export interface RateLimitWorkspace {
    generatedAt: string;
    totals: {
        policies: number;
        activePolicies: number;
        ledgers: number;
        blockedLedgers: number;
        highConsumptionLedgers: number;
    };
    policies: RateLimitPolicyRecord[];
    ledgers: QuotaLedgerRecord[];
    byPeriod: Record<string, number>;
    byScope: Record<string, number>;
}
export interface RateLimitWorkspaceQuery {
    tenantId?: string;
    policyCode?: string;
    subjectKey?: string;
    status?: QuotaLedgerStatus | 'ALL';
}
export declare function buildRateLimitsHref(query?: RateLimitWorkspaceQuery): string;
export declare function buildRateLimitsPolicyDetailHref(policyId: string): string;
export declare function readRateLimitsPolicyDetailParam(raw: unknown): string | null;
export declare function buildRateLimitsLedgerDetailHref(ledgerId: string): string;
export declare function readRateLimitsLedgerDetailParam(raw: unknown): string | null;
export interface IdentityAccessActorContext {
    actorId: string;
    actorType?: string;
    actorName?: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    roles: string[];
    permissions: string[];
    authenticated: boolean;
    source?: string;
}
export interface IdentityAccessTenantContext {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export interface IdentityAccessResolvedContext {
    authenticated: boolean;
    actor: IdentityAccessActorContext | null;
    tenantContext: IdentityAccessTenantContext;
    effectiveTenantId?: string;
    effectiveBrandId?: string;
    effectiveStoreId?: string;
    effectiveMarketCode?: string;
    roles: string[];
    permissions: string[];
}
export interface IdentityAccessAuthorizationDecision {
    status: 'allowed' | 'denied';
    action: string;
    resourceScope: Record<string, string | undefined>;
    actor: IdentityAccessActorContext | null;
    permissionMatched: boolean;
    tenantScopeMatched: boolean;
    enforcedBy: string[];
}
export interface IdentityAccessValidationResult {
    status: 'allowed' | 'denied';
    check: 'role' | 'permission' | 'tenant-scope';
    resolved?: IdentityAccessResolvedContext;
    authorization?: IdentityAccessAuthorizationDecision;
    targetTenantId?: string;
}
export interface IdentityAccessWorkspaceQuery {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
export interface IdentityAccessWorkspace {
    generatedAt: string;
    context: IdentityAccessResolvedContext;
    roleValidation: IdentityAccessValidationResult | null;
    permissionValidation: IdentityAccessValidationResult | null;
    tenantScopeValidation: IdentityAccessValidationResult | null;
}
export declare function buildIdentityAccessHref(query?: IdentityAccessWorkspaceQuery): string;
export declare function buildIdentityAccessRoleDetailHref(role: string): string;
export declare function readIdentityAccessRoleDetailParam(raw: unknown): string | null;
export declare function buildIdentityAccessPermissionDetailHref(permission: string): string;
export declare function readIdentityAccessPermissionDetailParam(raw: unknown): string | null;
export declare function buildIdentityAccessSessionDetailHref(session: string): string;
export declare function readIdentityAccessSessionDetailParam(raw: unknown): string | null;
export interface FoundationWorkspaceQuery {
    moduleKey?: string;
    consumer?: string;
}
export declare function buildFoundationWorkspaceHref(query?: FoundationWorkspaceQuery): string;
export declare function buildFoundationModuleDetailHref(moduleKey: string): string;
export declare function readFoundationModuleDetailParam(raw: unknown): string | null;
export interface IntegrationWebhookSourceContract {
    source: string;
    algorithm: 'hmac-sha256' | string;
    toleranceSeconds: number;
    description: string;
    secretRef: string;
}
export interface IntegrationEventEnvelopeContract {
    envelopeId: string;
    eventName: string;
    source: string;
    aggregateId?: string;
    idempotencyKey: string;
    occurredAt: string;
    receivedAt: string;
    payload: Record<string, unknown>;
    headers: Record<string, string>;
}
export interface IntegrationIdempotencyRecordContract {
    key: string;
    source: string;
    eventId: string;
    eventType: string;
    firstSeenAt: string;
    envelopeId: string;
    status: 'accepted' | string;
    payloadChecksum: string;
}
export interface IntegrationPublishEventRequest {
    eventName: string;
    source?: string;
    aggregateId?: string;
    idempotencyKey?: string;
    payload: Record<string, unknown>;
}
export interface IntegrationPublishEventResponse {
    status: 'accepted' | 'duplicate';
    envelope: IntegrationEventEnvelopeContract;
    persistedEventId: string;
    guarantees: string[];
}
export interface IntegrationWebhookIngestRequest {
    eventId?: string;
    eventType?: string;
    signature: string;
    timestamp: string;
    rawBody?: string;
    payload: Record<string, unknown>;
}
export interface IntegrationWebhookIngestResponse {
    status: 'accepted' | 'duplicate';
    source: string;
    signatureVerified: boolean;
    idempotency: IntegrationIdempotencyRecordContract;
    envelope?: IntegrationEventEnvelopeContract;
    pipeline: string[];
}
export interface IntegrationOrchestrationWorkspaceQuery {
    source?: string;
}
export interface IntegrationOrchestrationWorkspace {
    generatedAt: string;
    sources: IntegrationWebhookSourceContract[];
    events: IntegrationEventEnvelopeContract[];
    idempotencyRecords: IntegrationIdempotencyRecordContract[];
    summary: {
        sources: number;
        events: number;
        idempotencyRecords: number;
        uniqueEventSources: number;
        duplicateSensitiveRecords: number;
    };
}
export declare function buildIntegrationOrchestrationHref(query?: IntegrationOrchestrationWorkspaceQuery): string;
/** Agent 会话状态 */
export type AgentSessionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
/** Agent 执行状态 */
export type AgentExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
/** Agent 工具调用状态 */
export type AgentToolCallStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
/** Agent 消息角色 */
export type AgentMessageRole = 'system' | 'user' | 'assistant' | 'tool';
/** Agent 运行时配置 */
export interface AgentConfig {
    id: string;
    name: string;
    systemPrompt: string;
    model: string;
    maxSteps: number;
    enableReflection: boolean;
    allowedTools: string[];
    timeoutMs: number;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
}
/** Agent 消息 */
export interface AgentMessage {
    id: string;
    sessionId: string;
    role: AgentMessageRole;
    content: string;
    toolCallId?: string;
    toolCalls?: AgentToolCall[];
    timestamp: string;
}
/** Agent 工具调用 */
export interface AgentToolCall {
    id: string;
    name: string;
    input: unknown;
    output?: unknown;
    status: AgentToolCallStatus;
    durationMs?: number;
    error?: string;
}
/** Agent 运行会话 */
export interface AgentSession {
    id: string;
    configId: string;
    status: AgentSessionStatus;
    userInput: string;
    finalOutput?: string;
    currentStep: number;
    maxSteps: number;
    enableReflection: boolean;
    messages: AgentMessage[];
    error?: string;
    startedAt?: string;
    completedAt?: string;
    createdAt: string;
    createdBy: string;
    tenantId: string;
}
/** Agent 执行记录 */
export interface AgentExecution {
    id: string;
    sessionId: string;
    configId: string;
    status: AgentExecutionStatus;
    steps: number;
    totalDurationMs: number;
    llmCalls: number;
    toolCalls: number;
    error?: string;
    startedAt: string;
    completedAt?: string;
    tenantId: string;
}
/** 质量评估结果 */
export interface QualityEvaluation {
    id: string;
    sessionId: string;
    userInput: string;
    agentOutput: string;
    relevanceScore: number;
    accuracyScore: number;
    completenessScore: number;
    safetyScore: number;
    helpfulnessScore: number;
    concisenessScore: number;
    overallScore: number;
    feedback: string;
    evaluatedAt: string;
    evaluatedBy: string;
    tenantId: string;
}
/** 创建 Agent 会话请求 */
export interface CreateSessionRequest {
    configId: string;
    userInput: string;
    maxSteps?: number;
    enableReflection?: boolean;
    createdBy: string;
    tenantId: string;
}
/** Agent 会话执行响应 */
export interface SessionExecutionResult {
    session: AgentSession;
    execution: AgentExecution;
    evaluation?: QualityEvaluation;
    timestamp: string;
}
/** 批量 Agent 请求 */
export interface BatchAgentRequest {
    items: Array<{
        configId: string;
        userInput: string;
        maxSteps?: number;
        enableReflection?: boolean;
    }>;
    createdBy: string;
    tenantId: string;
}
/** 批量 Agent 响应 */
export interface BatchAgentResponse {
    total: number;
    succeeded: number;
    failed: number;
    results: Array<{
        index: number;
        session: AgentSession;
        execution: AgentExecution;
    }>;
    timestamp: string;
}
/** Agent 统计 */
export interface AgentStats {
    totalSessions: number;
    completedSessions: number;
    failedSessions: number;
    runningSessions: number;
    avgSteps: number;
    avgDurationMs: number;
    avgLlmCalls: number;
    avgQualityScore: number;
    tenantId: string;
    timestamp: string;
}
export type ToolRiskLevel = 'low' | 'medium' | 'high';
export interface ToolDefinition {
    name: string;
    description: string;
    category: string;
    riskLevel: ToolRiskLevel;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
/** Agent 会话流事件 — discriminated union */
export type AgentSessionEvent = {
    type: 'session_started';
    session: AgentSession;
    timestamp: string;
} | {
    type: 'message_added';
    message: AgentMessage;
    timestamp: string;
} | {
    type: 'tool_call_started';
    toolCall: AgentToolCall;
    timestamp: string;
} | {
    type: 'tool_call_completed';
    toolCall: AgentToolCall;
    timestamp: string;
} | {
    type: 'step_progress';
    step: number;
    maxSteps: number;
    timestamp: string;
} | {
    type: 'reflection_started';
    step: number;
    timestamp: string;
} | {
    type: 'session_completed';
    session: AgentSession;
    execution: AgentExecution;
    timestamp: string;
} | {
    type: 'session_failed';
    session: AgentSession;
    error: string;
    timestamp: string;
};
/** 事件类型联合 (用于 SDK filter / switch) */
export type AgentSessionEventType = AgentSessionEvent['type'];
/** 订单状态 (8 个, 状态机见 apps/api/src/modules/cashier/order-state-machine.ts) */
export type OrderStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'FULFILLED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'CANCELED' | 'TIMEOUT';
/** 支付方式 (4 种) */
export type PaymentMethod = 'CASH' | 'WECHAT' | 'ALIPAY' | 'CARD';
/** 支付状态 (4 个) */
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
/** 退款状态 (3 个) */
export type RefundStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
/** 订单行 (商品明细) */
export interface OrderItem {
    id: string;
    orderId: string;
    tenantId: string;
    productId: string;
    productName: string;
    unitPriceCents: number;
    quantity: number;
    subtotalCents: number;
    discountCents: number;
    createdAt: string;
}
/** 订单主单 */
export interface Order {
    id: string;
    tenantId: string;
    memberId: string | null;
    status: OrderStatus;
    /** 金额 (整数分, DR-36 决策 4: 绝不用浮点) */
    subtotalCents: number;
    discountCents: number;
    taxCents: number;
    totalCents: number;
    paidCents: number;
    refundedCents: number;
    paymentMethod: PaymentMethod | null;
    createdBy: string;
    clientOrderId: string;
    version: number;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
    closedAt: string | null;
}
/** 支付记录 */
export interface Payment {
    id: string;
    tenantId: string;
    orderId: string;
    method: PaymentMethod;
    amountCents: number;
    status: PaymentStatus;
    providerTxnId: string | null;
    idempotencyKey: string;
    paidAt: string | null;
    failureReason: string | null;
    createdAt: string;
    updatedAt: string;
}
/** 退款记录 */
export interface Refund {
    id: string;
    tenantId: string;
    orderId: string;
    paymentId: string;
    amountCents: number;
    reason: string;
    reasonHash: string;
    status: RefundStatus;
    providerRefundId: string | null;
    idempotencyKey: string;
    refundedAt: string | null;
    failureReason: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
/** 订单事件 (SSE 推送, 8 类型 discriminated union) */
export type OrderEvent = {
    type: 'order_created';
    order: Order;
    timestamp: string;
} | {
    type: 'order_submitted';
    order: Order;
    timestamp: string;
} | {
    type: 'payment_pending';
    order: Order;
    payment: Payment;
    timestamp: string;
} | {
    type: 'order_paid';
    order: Order;
    payment: Payment;
    timestamp: string;
} | {
    type: 'order_fulfilled';
    order: Order;
    timestamp: string;
} | {
    type: 'order_refunded';
    order: Order;
    refund: Refund;
    timestamp: string;
} | {
    type: 'order_timeout';
    order: Order;
    timestamp: string;
} | {
    type: 'order_canceled';
    order: Order;
    reason: string;
    timestamp: string;
};
/** OrderEvent 类型联合 */
export type OrderEventType = OrderEvent['type'];
/** 创建订单输入 */
export interface CreateOrderInput {
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
    metadata?: Record<string, unknown>;
}
/** 创建支付输入 */
export interface CreatePaymentInput {
    orderId: string;
    method: PaymentMethod;
    amountCents: number;
}
/** 创建退款输入 */
export interface CreateRefundInput {
    orderId: string;
    paymentId: string;
    amountCents: number;
    reason: string;
}
/** 订单事件 (带 id, 用于 SSE Last-Event-ID 续传) */
export type OrderEventWithId = OrderEvent & {
    id: number;
};
/** LLM 服务提供商 */
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'moonshot' | 'minimax' | 'custom';
/** LLM 配置状态 */
export type LLMConfigStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
/** 站点LLM配置 */
export interface TenantLLMConfig {
    id: string;
    tenantId: string;
    siteId?: string;
    storeId?: string;
    name: string;
    provider: LLMProvider;
    modelName: string;
    apiEndpoint?: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
    quotaLimit?: number;
    quotaUsed?: number;
    quotaAlertThreshold?: number;
    status: LLMConfigStatus;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
    approvedBy?: string;
}
/** 创建LLM配置请求 */
export interface CreateLLMConfigRequest {
    name: string;
    provider: LLMProvider;
    modelName: string;
    apiEndpoint?: string;
    apiKey: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    quotaLimit?: number;
    quotaAlertThreshold?: number;
    siteId?: string;
    storeId?: string;
}
/** 更新LLM配置请求 */
export interface UpdateLLMConfigRequest {
    name?: string;
    provider?: LLMProvider;
    modelName?: string;
    apiEndpoint?: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    quotaLimit?: number;
    quotaAlertThreshold?: number;
    enabled?: boolean;
}
/** LLM调用统计 */
export interface LLMStats {
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalCost: number;
    currency: string;
    avgLatencyMs: number;
    periodStart: string;
    periodEnd: string;
}
/** LLM调用日志 */
export interface LLMCallLog {
    id: string;
    configId: string;
    tenantId: string;
    sessionId?: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costEstimate: number;
    currency: string;
    latencyMs: number;
    status: 'success' | 'error' | 'timeout';
    errorMessage?: string;
    createdAt: string;
}
/** 接入申请请求 */
export interface ApplyLLMConfigRequest {
    configId: string;
    useCase: string;
    expectedVolume: number;
    businessJustification?: string;
}
/** 全球化地域上下文 */
export interface GeoContext {
    country: string;
    province?: string;
    city?: string;
    language: SupportedLanguage;
    currency: SupportedCurrency;
    timezone: string;
    regionCode: string;
}
/** 支持的语言 */
export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'zh-TW' | 'es-ES' | 'fr-FR' | 'de-DE';
/** 支持的货币 */
export type SupportedCurrency = 'USD' | 'CNY' | 'JPY' | 'KRW' | 'EUR' | 'GBP' | 'HKD' | 'SGD';
//# sourceMappingURL=index.d.ts.map