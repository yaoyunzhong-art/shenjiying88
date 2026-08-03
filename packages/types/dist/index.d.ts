interface PaginationInput {
    page: number;
    pageSize: number;
}
interface PaginationMeta {
    page: number;
    pageSize: number;
    total: number;
}
interface ApiResult<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}
type FoundationClientApp = 'admin-web' | 'tob-web' | 'storefront-web' | 'miniapp' | 'app';
type BootstrapDeliveryChannel = 'API_BOOTSTRAP' | 'RUNTIME_CHALLENGE';
type BootstrapCacheLayer = 'NONE' | 'MEMORY' | 'SESSION' | 'LOCAL_PERSISTED';
type BootstrapFallbackStrategy = 'FAIL_CLOSED' | 'READONLY_LAST_KNOWN' | 'PUBLIC_LAST_KNOWN';
interface BootstrapCapabilityRule {
    capability: string;
    source: BootstrapDeliveryChannel;
    requiredApps: FoundationClientApp[];
    cacheLayer: BootstrapCacheLayer;
    ttlSeconds?: number;
    notes: string[];
}
interface TenantScopeBootstrapPolicy {
    resolver: string;
    bootstrapRequired: boolean;
    cacheLayer: BootstrapCacheLayer;
    revalidateOn: string[];
    mismatchStrategy: BootstrapFallbackStrategy;
}
interface DesensitizationBootstrapPolicy {
    source: 'API_BOOTSTRAP';
    defaultMode: 'MASKED' | 'HIDDEN_UNTIL_APPROVED' | 'PUBLIC_ONLY';
    notes: string[];
}
interface FeatureFlagBootstrapPolicy {
    source: 'API_BOOTSTRAP';
    cacheLayer: BootstrapCacheLayer;
    ttlSeconds?: number;
    fallbackStrategy: BootstrapFallbackStrategy;
    notes: string[];
}
interface RiskChallengeBootstrapPolicy {
    triggerSource: 'API_BOOTSTRAP';
    cacheLayer: 'NONE' | 'MEMORY';
    enforcement: 'STEP_UP' | 'BLOCKING';
    notes: string[];
}
interface AppBootstrapWiring {
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
interface UnifiedFoundationBootstrapContract {
    version: string;
    bootstrapEndpoint: string;
    deliveredCapabilities: BootstrapCapabilityRule[];
    appProfiles: Record<FoundationClientApp, AppBootstrapWiring>;
}
type FoundationModuleKey = 'identity-access' | 'configuration-governance' | 'integration-orchestration' | 'trust-governance' | 'resilience-operations' | 'runtime-governance';
type FoundationConsumerKey = 'market' | 'portal' | 'workbench' | 'lyt-adapter';
type FoundationAlertCode = 'approvals-pending' | 'approval-execution-failures' | 'high-risk-audits' | 'blocked-rate-limit-ledgers' | 'secret-rotation-attention' | 'observability-degradation' | 'recovery-drill-attention' | 'runtime-governance-backlog' | 'runtime-callback-stalled' | 'lyt-connection-governance-risk';
type FoundationAlertSeverity = 'high' | 'medium' | 'low';
type FoundationAlertAcknowledgementStatus = 'ACKED' | 'MUTED';
interface FoundationAlertAcknowledgement {
    status: FoundationAlertAcknowledgementStatus;
    note: string | null;
    actorId: string | null;
    acknowledgedAt: string | null;
    mutedUntil: string | null;
    updatedAt: string;
}
interface FoundationAlertCatalogItem {
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
interface FoundationAlertCatalogResponse {
    generatedAt: string;
    alerts: FoundationAlertCatalogItem[];
}
type FoundationAlertOperation = 'DRILLDOWN' | 'ACK' | 'MUTE' | 'UNMUTE';
type FoundationAlertMutationKind = 'ACK' | 'MUTE' | 'UNMUTE';
type FoundationAlertTimelineFilter = 'ALL' | FoundationAlertMutationKind;
type FoundationAlertOwnerFilter = 'ALL' | string;
type FoundationAlertTimelineSourceFilter = 'ALL' | string;
interface FoundationAlertTimelineEntry {
    action: FoundationAlertMutationKind;
    note: string | null;
    actorId: string | null;
    mutedUntil: string | null;
    visibleInOverview: boolean;
    createdAt: string;
    source: string | null;
}
interface FoundationAlertOwnerSummary {
    actorId: string;
    count: number;
    lastAction: FoundationAlertMutationKind;
    lastSeenAt: string;
}
interface FoundationAlertTimelineMetrics {
    total: number;
    visibleInOverview: number;
    hiddenFromOverview: number;
    latestMatchedAt: string | null;
}
interface FoundationAlertTimelineSourceSummary {
    source: string;
    count: number;
    latestAt: string | null;
}
interface FoundationAlertTimelineActionSummary {
    action: FoundationAlertMutationKind;
    count: number;
    latestAt: string | null;
}
interface FoundationAlertTimelineDigest {
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
interface FoundationAlertTimelineFilterState {
    action: FoundationAlertTimelineFilter;
    source: FoundationAlertTimelineSourceFilter;
    owner: FoundationAlertOwnerFilter;
}
interface FoundationAlertTimelineActiveFilterChip {
    kind: 'action' | 'source' | 'owner';
    label: string;
    value: string;
}
interface FoundationAlertTimelineShortcutPreset {
    key: 'latest-owner' | 'latest-source' | 'dominant-action' | 'recent-hidden-flow' | 'recent-visible-flow';
    label: string;
    helper: string;
    filters: FoundationAlertTimelineFilterState;
}
interface FoundationAlertTimelineFilterQueryKeys {
    action: string;
    source: string;
    owner: string;
}
interface FoundationAlertLinkedFocusQueryKeys {
    focus: string;
    timeline: FoundationAlertTimelineFilterQueryKeys;
}
interface FoundationAlertRuntimeCallbackStalledEscalationSummary {
    waitCallback: number;
    scheduleReplay: number;
    openManualReview: number;
}
declare function buildFoundationAlertRecentOperationFilterState(entry: FoundationAlertTimelineEntry | null | undefined): FoundationAlertTimelineFilterState;
declare function buildFoundationAlertTimelineFilterStateFromQuery(query: {
    action?: string | null;
    source?: string | null;
    owner?: string | null;
}): FoundationAlertTimelineFilterState;
declare function normalizeFoundationAlertTimelineFilterState(filters: FoundationAlertTimelineFilterState, options: {
    availableOwners?: Array<string | null | undefined>;
    availableSources?: Array<string | null | undefined>;
}): FoundationAlertTimelineFilterState;
declare function buildFoundationAlertTimelineFilterSearchParams(options: {
    search?: string | URLSearchParams;
    queryKeys: FoundationAlertTimelineFilterQueryKeys;
    filters: FoundationAlertTimelineFilterState;
}): URLSearchParams;
declare function buildFoundationAlertTimelineFilterQueryPreview(queryKeys: FoundationAlertTimelineFilterQueryKeys, filters: FoundationAlertTimelineFilterState): string;
declare function resolveFoundationAlertFocusCode(queryFocusCode: string | null | undefined, candidateGroups: Array<Array<{
    code: string;
}> | null | undefined>): string | null;
declare function buildFoundationAlertLinkedFocusContext(context: string, filters?: FoundationAlertTimelineFilterState | null): string;
declare function buildFoundationAlertLinkedFocusSearchParams(options: {
    search?: string | URLSearchParams;
    queryKeys: FoundationAlertLinkedFocusQueryKeys;
    focusCode?: string | null;
    filters?: FoundationAlertTimelineFilterState | null;
}): URLSearchParams;
declare function filterFoundationAlertTimeline(history: FoundationAlertTimelineEntry[] | null | undefined, filter?: FoundationAlertTimelineFilter): FoundationAlertTimelineEntry[];
declare function summarizeFoundationAlertOwners(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertOwnerSummary[];
declare function filterFoundationAlertTimelineByOwner(history: FoundationAlertTimelineEntry[] | null | undefined, ownerFilter?: FoundationAlertOwnerFilter): FoundationAlertTimelineEntry[];
declare function filterFoundationAlertTimelineBySource(history: FoundationAlertTimelineEntry[] | null | undefined, sourceFilter?: FoundationAlertTimelineSourceFilter): FoundationAlertTimelineEntry[];
declare function summarizeFoundationAlertTimelineSources(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineSourceSummary[];
declare function findLatestFoundationAlertTimelineEntry(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineEntry | null;
declare function summarizeFoundationAlertTimelineMetrics(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineMetrics;
declare function summarizeFoundationAlertTimelineDigest(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineDigest;
declare function listFoundationAlertTimelineActiveFilters(filters: FoundationAlertTimelineFilterState): FoundationAlertTimelineActiveFilterChip[];
declare function summarizeFoundationAlertTimelineFilters(filters: FoundationAlertTimelineFilterState): string;
declare function isFoundationAlertTimelineFilterStateEqual(left: FoundationAlertTimelineFilterState, right: FoundationAlertTimelineFilterState): boolean;
declare function buildFoundationAlertTimelineEmptyState(filters: FoundationAlertTimelineFilterState): string;
declare function buildFoundationAlertTimelineShortcutPresets(history: FoundationAlertTimelineEntry[] | null | undefined): FoundationAlertTimelineShortcutPreset[];
interface FoundationAlertRuntimeCallbackStalledDetail {
    total: number;
    timeoutThresholds: Record<RuntimeGovernanceRiskLevel, number>;
    escalationSummary: FoundationAlertRuntimeCallbackStalledEscalationSummary;
    receipts: RuntimeGovernanceCallbackStallDetail[];
}
interface FoundationAlertLytGovernanceAlertGroup {
    severity: 'high' | 'medium' | 'low';
    code: string;
    count: number;
    summary: string;
    affectedStoreIds: string[];
    affectedCapabilities: string[];
    recommendedNextActions: string[];
}
interface FoundationAlertLytConnectionGovernanceRiskDetail {
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
type FoundationAlertDrilldownDetail = Record<string, unknown> | FoundationAlertRuntimeCallbackStalledDetail | FoundationAlertLytConnectionGovernanceRiskDetail;
declare function isFoundationAlertRuntimeCallbackStalledDetail(code: FoundationAlertCode | string, detail: FoundationAlertDrilldownDetail | null | undefined): detail is FoundationAlertRuntimeCallbackStalledDetail;
declare function getFoundationAlertRuntimeCallbackStalledDetail(drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined, code?: FoundationAlertCode | string | null): FoundationAlertRuntimeCallbackStalledDetail | null;
declare function isFoundationAlertLytConnectionGovernanceRiskDetail(code: FoundationAlertCode | string, detail: FoundationAlertDrilldownDetail | null | undefined): detail is FoundationAlertLytConnectionGovernanceRiskDetail;
declare function getFoundationAlertLytConnectionGovernanceRiskDetail(drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined, code?: FoundationAlertCode | string | null): FoundationAlertLytConnectionGovernanceRiskDetail | null;
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
interface FoundationAlertPanelReadState {
    activeMutation: FoundationAlertMutationResponse | null;
    recentTimeline: FoundationAlertTimelineEntry[];
    currentOwner: string;
    currentNote: string;
}
interface FoundationAlertPanelDerivedState extends FoundationAlertPanelReadState {
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
interface FoundationAlertTimelineFilterReadState {
    filterState: FoundationAlertTimelineFilterState;
    activeFilterChips: FoundationAlertTimelineActiveFilterChip[];
    filterSummary: string;
    filterEmptyState: string;
    shortcutPresets: FoundationAlertTimelineShortcutPreset[];
    hasActiveFilters: boolean;
}
type FoundationAlertOptimisticOverviewVisibility = 'hidden (optimistic)' | 'visible (optimistic)' | 'hidden' | 'visible';
interface FoundationAlertOptimisticFeedback {
    title: string;
    description: string;
}
interface FoundationAlertOptimisticReadState {
    overviewVisibility: FoundationAlertOptimisticOverviewVisibility;
    feedback: FoundationAlertOptimisticFeedback | null;
}
interface FoundationAlertQuickSwitchItem {
    code: string;
}
declare function resolveFoundationAlertSelectedCode<TAlert extends {
    code: string;
}>(alerts: readonly TAlert[], options?: {
    preferredCode?: string | null;
    currentCode?: string | null;
}): string;
declare function buildFoundationAlertPanelReadState(options: {
    selectedAlert?: Pick<FoundationOperationsAlert, 'code' | 'recentOperation' | 'acknowledgement'> | null;
    drilldown?: Pick<FoundationAlertDrilldownResponse, 'history' | 'acknowledgement'> | null;
    mutation?: FoundationAlertMutationResponse | null;
}): FoundationAlertPanelReadState;
declare function buildFoundationAlertPanelDerivedState(options: {
    alerts: FoundationAlertCatalogItem[];
    selectedAlertCode?: string | null;
    drilldown?: FoundationAlertDrilldownResponse | null;
    mutation?: FoundationAlertMutationResponse | null;
    filters: FoundationAlertTimelineFilterState;
}): FoundationAlertPanelDerivedState;
declare function buildFoundationAlertTimelineFilterReadState(options: {
    action: FoundationAlertTimelineFilter;
    source: FoundationAlertTimelineSourceFilter;
    owner: FoundationAlertOwnerFilter;
    history?: FoundationAlertTimelineEntry[] | null;
}): FoundationAlertTimelineFilterReadState;
declare function buildFoundationAlertQuickSwitchItems(topRisks: Array<{
    code: string;
}>, alerts: Array<{
    code: string;
}>, limit?: number): FoundationAlertQuickSwitchItem[];
declare function buildFoundationAlertOptimisticReadState(options: {
    pendingMutationAction?: FoundationAlertMutationKind | null;
    visibleInOverview?: boolean | null;
}): FoundationAlertOptimisticReadState;
interface FoundationAlertDrilldownResponse {
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
interface FoundationAlertMutationResponse {
    generatedAt: string;
    code: FoundationAlertCode | string;
    catalog?: FoundationAlertCatalogItem | null;
    acknowledgement?: FoundationAlertAcknowledgement;
    visibleInOverview?: boolean;
    availableActions?: FoundationAlertOperation[];
    history?: FoundationAlertTimelineEntry[];
    availableAlertCodes?: FoundationAlertCode[];
}
declare const runtimeGovernanceClientApps: readonly ["admin-web", "tob-web", "storefront-web", "miniapp", "app", "lyt"];
type RuntimeGovernanceClientApp = (typeof runtimeGovernanceClientApps)[number];
declare const runtimeGovernanceActionKeys: readonly ["approval-execution", "market-profile-resolve", "regional-override-preview", "secret-rotation", "runtime-replay", "webhook-callback", "edge-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
type RuntimeGovernanceActionKey = (typeof runtimeGovernanceActionKeys)[number];
declare const runtimeGovernanceApiActionKeys: readonly ["approval-execution", "secret-rotation", "runtime-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
type RuntimeGovernanceApiActionKey = (typeof runtimeGovernanceApiActionKeys)[number];
declare const adminRuntimeActionKeys: readonly ["approval-execution", "secret-rotation", "runtime-replay"];
type AdminRuntimeActionKey = (typeof adminRuntimeActionKeys)[number];
declare const runtimeGovernanceNextSteps: readonly ["PROCEED", "LOGIN", "CHALLENGE", "REFRESH"];
type RuntimeGovernanceNextStep = (typeof runtimeGovernanceNextSteps)[number];
type RuntimeGovernanceActionState = 'blocked' | 'challenge-issued' | 'submitted' | 'callback-recorded' | 'replay-scheduled';
declare const runtimeGovernanceRiskLevels: readonly ["low", "medium", "high"];
type RuntimeGovernanceRiskLevel = (typeof runtimeGovernanceRiskLevels)[number];
declare const runtimeGovernanceRecommendedActions: readonly ["REFRESH_BOOTSTRAP", "COMPLETE_LOGIN", "COMPLETE_CHALLENGE", "FOLLOW_SUBMIT_CALLBACK"];
type RuntimeGovernanceRecommendedAction = (typeof runtimeGovernanceRecommendedActions)[number];
declare const runtimeGovernanceCallbackStatuses: readonly ["callback-blocked", "callback-recorded"];
type RuntimeGovernanceCallbackStatus = (typeof runtimeGovernanceCallbackStatuses)[number];
declare const runtimeGovernanceCallbackReceiptStatuses: readonly ["callback-blocked", "awaiting-callback", "callback-recorded"];
type RuntimeGovernanceCallbackReceiptStatus = (typeof runtimeGovernanceCallbackReceiptStatuses)[number];
declare const runtimeGovernanceCallbackEvents: readonly ["PREREQUISITE_PENDING", "CHALLENGE_PENDING", "HANDLER_ACCEPTED", "HANDLER_COMPLETED"];
type RuntimeGovernanceCallbackEvent = (typeof runtimeGovernanceCallbackEvents)[number];
declare const runtimeGovernanceCallbackTimeoutThresholds: {
    readonly low: number;
    readonly medium: number;
    readonly high: number;
};
declare const runtimeGovernanceCallbackStallEscalationActions: readonly ["WAIT_CALLBACK", "SCHEDULE_REPLAY", "OPEN_MANUAL_REVIEW"];
type RuntimeGovernanceCallbackStallEscalationAction = (typeof runtimeGovernanceCallbackStallEscalationActions)[number];
declare const runtimeGovernanceReplaySources: readonly ["ADMIN_WEB_RUNTIME", "TOB_WEB_RUNTIME", "STOREFRONT_WEB_RUNTIME", "MINIAPP_RUNTIME", "APP_RUNTIME"];
type RuntimeGovernanceReplaySource = (typeof runtimeGovernanceReplaySources)[number];
interface AdminRuntimeActionPresetContract {
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
declare const adminRuntimeActionPresetContracts: readonly [{
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
declare const adminRuntimeActionPresetContractMap: Record<"approval-execution" | "secret-rotation" | "runtime-replay", AdminRuntimeActionPresetContract>;
declare const runtimeGovernanceReplayEscalationActions: readonly ["REFRESH_TICKET", "WAIT_CALLBACK", "OPEN_MANUAL_REVIEW"];
type RuntimeGovernanceReplayEscalationAction = (typeof runtimeGovernanceReplayEscalationActions)[number];
interface RuntimeGovernanceSubmitRequest {
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
interface RuntimeGovernanceSyncRequest {
    handlerName: string;
    ticketCode: string;
    idempotencyKey: string;
    actorId?: string;
    tenantId?: string;
}
interface RuntimeGovernanceCallbackRequest {
    callbackStatus: RuntimeGovernanceCallbackStatus;
    ackToken: string;
    lastEvent: RuntimeGovernanceCallbackEvent;
    summary: string;
    idempotencyKey: string;
    actorId?: string;
    tenantId?: string;
}
interface RuntimeGovernanceReplayRequest {
    ledgerKey: string;
    requestedFrom: RuntimeGovernanceReplaySource;
    ticketCode: string;
    idempotencyKey: string;
    actorId?: string;
    tenantId?: string;
}
interface RuntimeGovernanceBatchReplayItem extends RuntimeGovernanceReplayRequest {
    receiptCode: string;
}
interface RuntimeGovernanceBatchReplayRequest {
    items: RuntimeGovernanceBatchReplayItem[];
}
interface RuntimeGovernanceBatchReplayResponse {
    generatedAt: string;
    total: number;
    items: Array<{
        receiptCode: string;
        receipt: RuntimeGovernanceReceipt;
    }>;
}
interface RuntimeGovernanceOverviewFilter {
    focus?: 'all' | 'batch-replay' | 'governance-audit';
    state?: RuntimeGovernanceActionState;
    callbackStatus?: RuntimeGovernanceCallbackReceipt['callbackStatus'];
    riskLevel?: RuntimeGovernanceRiskLevel;
    replayable?: boolean;
    stalledOnly?: boolean;
}
interface RuntimeGovernanceTicket {
    ticketCode: string;
    ticketType: 'BLOCK_GUARD' | 'CHALLENGE_GATE' | 'HANDLER_CALLBACK';
    status: 'waiting-prerequisite' | 'pending-challenge' | 'ready-for-handler';
    summary: string;
}
interface RuntimeGovernanceSyncContract {
    handlerName: string;
    syncMode: 'deferred' | 'challenge-gated' | 'callback-followup';
    syncEndpoint: string;
    callbackEndpoint: string;
    idempotencyKey: string;
    ready: boolean;
    summary: string;
}
interface RuntimeGovernanceCallbackReceipt {
    callbackStatus: RuntimeGovernanceCallbackReceiptStatus;
    ackToken: string;
    lastEvent: RuntimeGovernanceCallbackEvent;
    summary: string;
}
interface RuntimeGovernanceLedgerRecord {
    ledgerKey: string;
    replayEndpoint: string;
    replayable: boolean;
    summary: string;
}
interface RuntimeGovernanceReplayPolicy {
    replayEndpoint: string;
    retryable: boolean;
    maxAttempts: number;
    currentAttempt: number;
    nextBackoffMs: number;
    escalationAction: RuntimeGovernanceReplayEscalationAction;
    summary: string;
}
interface RuntimeGovernanceCallbackStallStatus {
    stalled: boolean;
    timeoutMs: number;
    elapsedMs: number;
    exceededMs: number;
    escalationAction: RuntimeGovernanceCallbackStallEscalationAction;
    summary: string;
}
interface RuntimeGovernanceCallbackStallDetail extends RuntimeGovernanceCallbackStallStatus {
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
declare function buildRuntimeGovernanceReplayEndpoint(receiptCode: string): string;
declare function createRuntimeGovernanceReplayPolicy(receiptCode: string, state: RuntimeGovernanceActionState): RuntimeGovernanceReplayPolicy;
declare function advanceRuntimeGovernanceReplayPolicy(policy: Pick<RuntimeGovernanceReplayPolicy, 'currentAttempt' | 'maxAttempts' | 'nextBackoffMs'>): {
    currentAttempt: number;
    retryable: boolean;
    nextBackoffMs: number;
    escalationAction: "WAIT_CALLBACK" | "OPEN_MANUAL_REVIEW";
};
declare function evaluateRuntimeGovernanceCallbackStall(receipt: Pick<RuntimeGovernanceReceipt, 'riskLevel' | 'callback' | 'retry' | 'events'>, options?: {
    now?: string | Date;
    startedAt?: string | Date;
}): RuntimeGovernanceCallbackStallStatus;
declare function buildRuntimeGovernanceCallbackStallDetail(receipt: Pick<RuntimeGovernanceReceipt, 'receiptCode' | 'app' | 'action' | 'riskLevel' | 'sync' | 'callback' | 'ledger' | 'rateLimit' | 'retry' | 'events'>, options?: {
    now?: string | Date;
    startedAt?: string | Date;
}): RuntimeGovernanceCallbackStallDetail;
interface RuntimeGovernanceRateLimitDecision {
    allowed: boolean;
    limit: number;
    remaining: number;
    retryAfterSeconds: number;
    scopeKey: string;
}
interface RuntimeGovernanceEventRecord {
    eventType: string;
    status: 'accepted' | 'duplicate';
    idempotencyKey: string;
    occurredAt: string;
    summary: string;
}
type RuntimeGovernanceApprovalStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED';
interface RuntimeGovernanceApprovalExecutionFailure {
    failureStatus: string | null;
    failureReason: string | null;
    failedAt: string | null;
    failedBy: string | null;
}
interface RuntimeGovernanceApprovalExecution {
    attempts: number;
    executed: boolean;
    executionStatus: string | null;
    executedAt: string | null;
    executedBy: string | null;
    lastFailure: RuntimeGovernanceApprovalExecutionFailure | null;
}
interface RuntimeGovernanceApproval {
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
interface RuntimeGovernanceReceipt {
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
interface RuntimeGovernanceOperationsOverviewSummary {
    backlog: number;
    stalledCallbacks: number;
    highRiskBacklog: number;
    blockedActions: number;
}
interface RuntimeGovernanceOperationsBatchSummary {
    filteredReceipts: number;
    replayableReceipts: number;
    governanceAuditReceipts: number;
    stalledReceipts: number;
    blockedReceipts: number;
    highRiskReceipts: number;
}
interface RuntimeGovernanceOperationsOverview {
    generatedAt: string;
    appliedFilter: RuntimeGovernanceOverviewFilter;
    summary: RuntimeGovernanceOperationsOverviewSummary;
    totalSummary: RuntimeGovernanceOperationsOverviewSummary;
    receipts: RuntimeGovernanceReceipt[];
    stalledReceipts: RuntimeGovernanceCallbackStallDetail[];
    batchSummary: RuntimeGovernanceOperationsBatchSummary;
}
interface FoundationOperationsAlert {
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
interface FoundationOperationsOverviewSummary {
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
interface FoundationOperationsOverviewResponse {
    generatedAt: string;
    summary: FoundationOperationsOverviewSummary;
    alerts: FoundationOperationsAlert[];
    topRisks: FoundationOperationsAlert[];
    modules?: {
        runtimeGovernance?: RuntimeGovernanceOperationsOverview;
        [key: string]: unknown;
    };
}
interface FoundationCapabilityDescriptor {
    key: string;
    name: string;
    responsibilities: string[];
    entrypoints: string[];
    consumers: FoundationConsumerKey[];
    status: 'planned' | 'skeleton' | 'active';
}
interface FoundationModuleDescriptor {
    key: FoundationModuleKey;
    name: string;
    purpose: string;
    inboundContracts: string[];
    outboundContracts: string[];
    capabilities: FoundationCapabilityDescriptor[];
}
interface FoundationConsumerDescriptor {
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
interface FoundationConsumerActionGovernanceExample {
    surface: RuntimeGovernanceClientApp;
    action: RuntimeGovernanceActionKey;
    scenario: string;
    riskLevel: 'low' | 'medium' | 'high';
    bootstrapState: FoundationFrontendBootstrapState;
    nextStep: RuntimeGovernanceNextStep;
    submitState: RuntimeGovernanceActionState;
    requestEndpoint: string;
}
interface FoundationConsumerRuntimeHandoffExample {
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
interface FoundationConsumerRuntimeReceiptExample {
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
interface FoundationConsumerGovernanceAlertLifecycleExample {
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
declare const adminWorkbenchConsumerDescriptor: FoundationConsumerDescriptor;
interface FoundationGovernanceBaseline {
    key: string;
    name: string;
    ownerModule: FoundationModuleKey;
    summary: string;
    controls: string[];
    evidence: string[];
}
interface FoundationBlueprint {
    generatedAt: string;
    docs: string[];
    guardrails: string[];
    frontendBootstrap: UnifiedFoundationBootstrapContract;
    modules: FoundationModuleDescriptor[];
    consumers: FoundationConsumerDescriptor[];
    governanceBaselines: FoundationGovernanceBaseline[];
}
type FoundationOperationsAlertTriageState = 'needs-triage' | 'acknowledged' | 'muted' | 'expired-mute';
type FoundationFrontendBootstrapState = 'bootstrapping' | 'ready' | 'readonly-fallback' | 'challenge-required' | 'scope-mismatch';
type FoundationSupportedClient = 'PC' | 'PAD' | 'H5' | 'MINIAPP' | 'APP';
declare const foundationSupportedClients: readonly ["PC", "PAD", "H5", "MINIAPP", "APP"];
declare const foundationAlertCatalogFallback: FoundationAlertCatalogItem[];
interface MarketProfileContract {
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
interface RegionalConfigOverrideContract {
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
interface MarketBootstrapResponse extends BootstrapFoundationMetadataContract {
    defaultDomesticMarketCode: string;
    defaultInternationalMarketCode: string;
    supportedMarkets: MarketProfileContract[];
}
interface BootstrapFoundationMetadataContract {
    foundationDependencies: FoundationModuleKey[];
    foundationContracts: string[];
}
interface PortalLoginEntryContract {
    label: string;
    loginPath: string;
    ssoEnabled: boolean;
}
interface TobPortalContract {
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
interface StorePortalContract {
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
interface PortalBootstrapResponse extends BootstrapFoundationMetadataContract {
    tenantPortal: TobPortalContract;
    brandPortal: TobPortalContract;
    storePortal: StorePortalContract;
    marketProfile: MarketProfileContract;
    regionalOverrides: RegionalConfigOverrideContract[];
}
interface PortalDomainGovernanceScopeSummaryContract {
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
interface PortalDomainGovernanceSummaryContract {
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
interface DomainGovernanceWorkspaceQuery {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    scopeType?: string;
}
declare function selectDomainGovernanceFocusScope(summary: PortalDomainGovernanceSummaryContract): PortalDomainGovernanceScopeSummaryContract | undefined;
declare function buildDomainGovernanceHref(query?: DomainGovernanceWorkspaceQuery): string;
declare function buildDomainGovernanceWorkspaceHref(summary: PortalDomainGovernanceSummaryContract, marketCode: string): string;
declare function getDomainGovernanceAttentionLabel(summary: PortalDomainGovernanceSummaryContract): '待治理' | '已对齐';
declare function formatDomainGovernanceCountsSummary(summary: PortalDomainGovernanceSummaryContract): string;
declare function formatDomainGovernanceSourceSummary(domainSource: string, summary: PortalDomainGovernanceSummaryContract): string;
interface DomainGovernanceDisplayModel {
    eyebrow: string;
    subtitle: string;
    title: string;
    statusLabel: string;
    summaryText: string;
    renderSections: DomainGovernanceRenderSection[];
    workspaceLabel: string;
    workspaceHref: string;
    ctaLabel: string;
    requiresAttention: boolean;
}
declare const domainGovernanceDisplayCopy: {
    readonly eyebrow: "域名治理工作台";
    readonly subtitle: "统一域名缺口、推荐补选和治理入口展示";
    readonly detailSectionTitle: "治理明细";
    readonly workspaceLabel: "治理入口";
    readonly ctaLabel: "打开域名治理工作台";
    readonly sectionTitles: {
        readonly summary: "治理概览";
        readonly focusScope: "焦点 scope";
        readonly recommendation: "推荐补选";
        readonly timeline: "评估时间";
        readonly workspace: "治理入口";
    };
    readonly itemLabels: {
        readonly source: "域名来源";
        readonly status: "治理状态";
        readonly summary: "治理概览";
        readonly statusSummary: "状态摘要";
        readonly recommendation: "推荐主域名";
        readonly lastEvaluated: "最近评估";
    };
};
type DomainGovernanceRenderItemTone = 'primary' | 'summary' | 'accent';
interface DomainGovernanceRenderItem {
    label: string;
    value: string;
    tone: DomainGovernanceRenderItemTone;
}
interface DomainGovernanceRenderSection {
    title: string;
    items: DomainGovernanceRenderItem[];
}
type DomainGovernanceDisplayPresetKey = 'STOREFRONT_H5' | 'STOREFRONT_PC' | 'TOB_TENANT' | 'TOB_BRAND' | 'APP_NATIVE' | 'MINIAPP_HOME' | 'MINIAPP_MEMBER';
interface DomainGovernanceDisplayPresetContract {
    key: DomainGovernanceDisplayPresetKey;
    accentColor: string;
    titleColor: string;
    subtitleColor: string;
    summaryColor: string;
    detailColor: string;
    borderColor: string;
    buttonBackground: string;
    buttonTextColor: string;
    backgroundAligned: string;
    backgroundAttention: string;
    statusAlignedColor: string;
    statusAlignedBackground: string;
    statusAttentionColor: string;
    statusAttentionBackground: string;
}
interface DomainGovernanceDisplayPreset {
    key: DomainGovernanceDisplayPresetKey;
    accentColor: string;
    titleColor: string;
    subtitleColor: string;
    summaryColor: string;
    detailColor: string;
    borderColor: string;
    buttonBackground: string;
    buttonTextColor: string;
    background: string;
    statusColor: string;
    statusBackground: string;
}
declare function resolveDomainGovernanceRenderItemColor(preset: DomainGovernanceDisplayPreset, tone: DomainGovernanceRenderItemTone): string;
declare const domainGovernanceDisplayPresetContractMap: Record<DomainGovernanceDisplayPresetKey, DomainGovernanceDisplayPresetContract>;
declare function resolveDomainGovernanceDisplayPreset(key: DomainGovernanceDisplayPresetKey, requiresAttention: boolean): DomainGovernanceDisplayPreset;
declare function formatDomainGovernanceFocusScopeLabel(scope?: PortalDomainGovernanceScopeSummaryContract): string;
declare function formatDomainGovernanceFocusScopeSummary(scope?: PortalDomainGovernanceScopeSummaryContract): string;
declare function formatDomainGovernanceRecommendationSummary(scope?: PortalDomainGovernanceScopeSummaryContract): string;
declare function formatDomainGovernanceStatusSummary(summary: PortalDomainGovernanceSummaryContract, statusLabel?: "待治理" | "已对齐"): string;
declare function formatDomainGovernanceLastEvaluatedSummary(summary: PortalDomainGovernanceSummaryContract): string;
declare function buildDomainGovernanceDisplayModel(domainSource: string, summary: PortalDomainGovernanceSummaryContract, workspaceHref: string): DomainGovernanceDisplayModel;
interface WorkbenchNavItemContract {
    key: string;
    label: string;
    href: string;
    description: string;
}
interface RoleWorkbenchContract {
    role: string;
    channel: string;
    title: string;
    description: string;
    marketCodes: string[];
    navItems: WorkbenchNavItemContract[];
}
declare const defaultRoleWorkbenchContracts: RoleWorkbenchContract[];
declare const defaultRoleWorkbenchContractMap: Record<string, RoleWorkbenchContract>;
/**
 * 前端 Workbench 角色 (大写下划线) → 后端 tenant-config 角色 (蛇形)
 *
 * 后端 ROLE_LEVEL_ACCESS 使用小写蛇形:
 *   super_admin / brand_admin / tenant_admin / store_admin / operator / viewer / auditor
 * 前端 defaultRoleWorkbenchContracts 使用大写下划线:
 *   SUPER_ADMIN / BRAND_MANAGER / TENANT_ADMIN / STORE_MANAGER / OPERATIONS / VIEWER / AUDITOR
 * (GUIDE / CASHIER / WAREHOUSE / FINANCE / COACH 等暂未在 tenant-config 中使用)
 */
declare const FRONTEND_TO_BACKEND_ROLE: Record<string, string>;
/** 后端角色枚举 (与后端 ROLE_LEVEL_ACCESS key 对齐) */
type BackendTenantRole = 'super_admin' | 'brand_admin' | 'tenant_admin' | 'store_admin' | 'operator' | 'viewer' | 'auditor';
/** 前端 Workbench 角色 (与 defaultRoleWorkbenchContracts 对齐) */
type FrontendWorkbenchRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'BRAND_MANAGER' | 'STORE_MANAGER' | 'GUIDE' | 'CASHIER' | 'OPERATIONS' | 'FINANCE' | 'WAREHOUSE' | 'COACH';
/** 角色映射工具: 把前端 Workbench role 转成后端 tenant-config role */
declare function mapToBackendRole(frontendRole: string): BackendTenantRole | undefined;
interface TenantContextContract {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
declare const memberLevelContracts: readonly ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
type MemberLevelContract = (typeof memberLevelContracts)[number];
declare const memberStatusContracts: readonly ["ACTIVE", "FROZEN", "EXPIRED", "BLACKLISTED"];
type MemberStatusContract = (typeof memberStatusContracts)[number];
declare const memberLifecycleStageContracts: readonly ["prospect", "newly-paid", "repeat-paid", "vip-active"];
type MemberLifecycleStageContract = (typeof memberLifecycleStageContracts)[number];
declare const memberDataSourceContracts: readonly ["memory", "prisma"];
type MemberDataSourceContract = (typeof memberDataSourceContracts)[number];
declare const memberOperationsActionCodeContracts: readonly ["complete-member-onboarding", "send-post-payment-welcome", "issue-bounce-back-coupon", "recommend-repeat-purchase-bundle", "invite-loyalty-challenge", "assign-vip-concierge", "push-new-arrival-preview", "deliver-channel-follow-up"];
type MemberOperationsActionCodeContract = (typeof memberOperationsActionCodeContracts)[number];
declare const memberOperationsActionChannelContracts: readonly ["coupon", "crm-task", "wechat", "app-push"];
type MemberOperationsActionChannelContract = (typeof memberOperationsActionChannelContracts)[number];
declare const memberOperationsPriorityContracts: readonly ["high", "medium", "low"];
type MemberOperationsPriorityContract = (typeof memberOperationsPriorityContracts)[number];
declare const memberAutomationTriggerCodeContracts: readonly ["payment-success-journey", "newly-paid-bounce-back", "repeat-paid-retention", "vip-service-upgrade", "channel-retouch"];
type MemberAutomationTriggerCodeContract = (typeof memberAutomationTriggerCodeContracts)[number];
declare const memberAutomationTriggerStatusContracts: readonly ["ready", "watch"];
type MemberAutomationTriggerStatusContract = (typeof memberAutomationTriggerStatusContracts)[number];
declare const memberAutomationTriggerSourceContracts: readonly ["payment-success", "lifecycle", "tag"];
type MemberAutomationTriggerSourceContract = (typeof memberAutomationTriggerSourceContracts)[number];
declare const memberOperationsTaskStatusContracts: readonly ["queued", "dispatched", "completed"];
type MemberOperationsTaskStatusContract = (typeof memberOperationsTaskStatusContracts)[number];
declare const memberOperationsExecutionLaneContracts: readonly ["campaign-execution", "member-crm", "promo-conversion"];
type MemberOperationsExecutionLaneContract = (typeof memberOperationsExecutionLaneContracts)[number];
declare const memberOperationsTaskSourceContracts: readonly ["payment-success", "manual-refresh"];
type MemberOperationsTaskSourceContract = (typeof memberOperationsTaskSourceContracts)[number];
declare const memberOperationsReceiptTargetTypeContracts: readonly ["coupon-offer", "crm-follow-up"];
type MemberOperationsReceiptTargetTypeContract = (typeof memberOperationsReceiptTargetTypeContracts)[number];
declare const memberOperationsReceiptStatusContracts: readonly ["completed"];
type MemberOperationsReceiptStatusContract = (typeof memberOperationsReceiptStatusContracts)[number];
declare const memberOperationsRuntimeStateContracts: readonly ["blocked", "challenge-issued", "submitted", "callback-recorded", "replay-scheduled"];
type MemberOperationsRuntimeStateContract = (typeof memberOperationsRuntimeStateContracts)[number];
interface MemberProfileContract {
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
interface LytMemberSnapshotContract {
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
interface MemberOperationsActionContract {
    code: MemberOperationsActionCodeContract;
    label: string;
    reason: string;
    channel: MemberOperationsActionChannelContract;
    priority: MemberOperationsPriorityContract;
}
interface MemberAutomationTriggerContract {
    code: MemberAutomationTriggerCodeContract;
    status: MemberAutomationTriggerStatusContract;
    source: MemberAutomationTriggerSourceContract;
    reason: string;
}
interface MemberOperationsProfileContract {
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
interface MemberOperationsTaskContract {
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
interface MemberOperationsExecutionReceiptContract {
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
interface FoundationBootstrapResponse extends FoundationBlueprint {
    tenantContext: TenantContextContract;
}
interface RegionalLoginPolicyContract {
    defaultLoginPath: string;
    ssoEnabled: boolean;
}
interface WorkbenchBootstrapResponse extends BootstrapFoundationMetadataContract {
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
declare const foundationBootstrapCapabilityRules: BootstrapCapabilityRule[];
declare const foundationAppBootstrapProfiles: Record<FoundationClientApp, AppBootstrapWiring>;
declare const foundationBootstrapContract: UnifiedFoundationBootstrapContract;
declare function getFoundationAppBootstrapWiring(app: FoundationClientApp): AppBootstrapWiring;
type AuditRiskLevel = 'low' | 'medium' | 'high';
interface AuditRecordContract {
    auditId: string;
    eventType: string;
    tenantId?: string;
    actorId?: string;
    source?: string;
    riskLevel: AuditRiskLevel;
    occurredAt: string;
    details: Record<string, unknown>;
}
interface AuditTrailQuery {
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
interface AuditTrailResponse {
    records: AuditRecordContract[];
    total: number;
    query: AuditTrailQuery;
}
interface AuditTrailSummary {
    total: number;
    byAction: Record<string, number>;
    bySource: Record<string, number>;
    byRiskLevel: Record<AuditRiskLevel, number>;
}
declare function buildAuditTrailHref(query?: AuditTrailQuery): string;
declare function buildAuditTrailRecordDetailHref(auditId: string): string;
declare function readAuditTrailRecordDetailParam(raw: unknown): string | null;
type ConfigurationScopeType = 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE';
interface ConfigurationScope {
    scopeType: ConfigurationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
interface ConfigurationConfigEntryRevision {
    version: number;
    changedBy?: string;
    changeReason?: string;
    createdAt: string;
}
interface ConfigurationConfigEntry {
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
interface ConfigurationFeatureFlag {
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
type ConfigurationSecretStatus = 'rotation-due' | 'expired' | 'active' | string;
type ConfigurationCertificateStatus = 'active' | 'expiring-soon' | 'expired' | string;
interface ConfigurationSecretMetadata {
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
interface ConfigurationCertificateMetadata {
    name: string;
    status: ConfigurationCertificateStatus;
    expiresAt: string;
    autoRenew?: boolean;
    issuer?: string;
    fingerprint?: string;
    daysToExpire?: number;
}
interface ConfigurationSnapshot {
    snapshotId: string;
    generatedAt: string;
    scopeChain: ConfigurationScope[];
    context: ConfigurationScope;
    config: Record<string, unknown>;
    featureFlags: ConfigurationFeatureFlag[];
    secrets: ConfigurationSecretMetadata[];
    checksum: string;
}
interface ConfigurationPostureAttention {
    type: 'secret' | 'certificate';
    key: string;
    status: string;
    expiresAt?: string | null;
}
interface ConfigurationPosture {
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
interface ConfigurationGovernanceMetadataEntry {
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
type ConfigurationGovernanceMetadataStatus = 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED' | string;
interface ConfigurationOverview {
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
interface ConfigurationOverviewQuery {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
declare function buildConfigurationHref(query?: ConfigurationOverviewQuery): string;
declare function buildConfigurationOperationDetailHref(operation: string): string;
declare function readConfigurationOperationDetailParam(raw: unknown): string | null;
declare function buildConfigurationSecretDetailHref(name: string): string;
declare function readConfigurationSecretDetailParam(raw: unknown): string | null;
declare function buildConfigurationCertificateDetailHref(name: string): string;
declare function readConfigurationCertificateDetailParam(raw: unknown): string | null;
declare function buildConfigurationFeatureFlagDetailHref(key: string): string;
declare function readConfigurationFeatureFlagDetailParam(raw: unknown): string | null;
declare function buildConfigurationConfigEntryDetailHref(id: string): string;
declare function readConfigurationConfigEntryDetailParam(raw: unknown): string | null;
declare function buildIntegrationOrchestrationSourceDetailHref(source: string): string;
declare function readIntegrationOrchestrationSourceDetailParam(raw: unknown): string | null;
declare function buildIntegrationOrchestrationEventDetailHref(envelopeId: string): string;
declare function readIntegrationOrchestrationEventDetailParam(raw: unknown): string | null;
declare function buildIntegrationOrchestrationIdempotencyDetailHref(key: string): string;
declare function readIntegrationOrchestrationIdempotencyDetailParam(raw: unknown): string | null;
interface IntegrationOrchestrationEventDetail {
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
interface IntegrationOrchestrationIdempotencyDetail {
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
type ObservabilitySignalType = 'metrics' | 'logs' | 'traces';
type ObservabilityStatus = 'healthy' | 'warning' | 'critical';
type RecoveryPlanStatus = 'ready' | 'attention';
interface ObservabilitySignalContract {
    signal: ObservabilitySignalType;
    status: ObservabilityStatus;
    coverage: number;
    collectionLagSeconds: number;
    lastCollectedAt: string;
    owner: string;
    alertRoutes: string[];
    evidence: string[];
}
interface RetryPolicyContract {
    key: string;
    capability: string;
    trigger: string;
    maxAttempts: number;
    backoff: string;
    recoveryAction: string;
    escalationTarget: string;
}
interface RecoveryPlanContract {
    resource: string;
    status: RecoveryPlanStatus;
    rtoMinutes: number;
    rpoMinutes: number;
    lastDrillAt: string;
    staleAfterDays: number;
    dependencies: string[];
    runbook: string;
}
interface ResilienceOverview {
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
interface EdgeReplayStageRequest {
    storeId: string;
    operationCount: number;
}
interface EdgeReplayStageContract {
    status: 'staged';
    storeId: string;
    operationCount: number;
    replayPipeline: string[];
    retryPolicy?: RetryPolicyContract | null;
    observabilityHooks: string[];
    recoveryPlan?: RecoveryPlanContract | null;
}
interface ResilienceQuery {
    capability?: string;
    status?: string;
    resource?: string;
}
declare function buildResilienceHref(query?: ResilienceQuery): string;
declare function buildResilienceSignalDetailHref(signal: string): string;
declare function readResilienceSignalDetailParam(raw: unknown): string | null;
declare function buildResilienceRetryPolicyDetailHref(key: string): string;
declare function readResilienceRetryPolicyDetailParam(raw: unknown): string | null;
declare function buildResilienceRecoveryPlanDetailHref(resource: string): string;
declare function readResilienceRecoveryPlanDetailParam(raw: unknown): string | null;
type RateLimitScopeType = 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'INTEGRATION';
type RateLimitPeriod = 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
type RateLimitAlgorithm = 'FIXED_WINDOW' | 'SLIDING_WINDOW' | 'TOKEN_BUCKET' | string;
type QuotaLedgerStatus = 'healthy' | 'warning' | 'blocked';
interface RateLimitPolicyRecord {
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
interface QuotaLedgerRecord {
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
interface RateLimitWorkspace {
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
interface RateLimitWorkspaceQuery {
    tenantId?: string;
    policyCode?: string;
    subjectKey?: string;
    status?: QuotaLedgerStatus | 'ALL';
}
declare function buildRateLimitsHref(query?: RateLimitWorkspaceQuery): string;
declare function buildRateLimitsPolicyDetailHref(policyId: string): string;
declare function readRateLimitsPolicyDetailParam(raw: unknown): string | null;
declare function buildRateLimitsLedgerDetailHref(ledgerId: string): string;
declare function readRateLimitsLedgerDetailParam(raw: unknown): string | null;
interface IdentityAccessActorContext {
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
interface IdentityAccessTenantContext {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
interface IdentityAccessResolvedContext {
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
interface IdentityAccessAuthorizationDecision {
    status: 'allowed' | 'denied';
    action: string;
    resourceScope: Record<string, string | undefined>;
    actor: IdentityAccessActorContext | null;
    permissionMatched: boolean;
    tenantScopeMatched: boolean;
    enforcedBy: string[];
}
interface IdentityAccessValidationResult {
    status: 'allowed' | 'denied';
    check: 'role' | 'permission' | 'tenant-scope';
    resolved?: IdentityAccessResolvedContext;
    authorization?: IdentityAccessAuthorizationDecision;
    targetTenantId?: string;
}
interface IdentityAccessWorkspaceQuery {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
interface IdentityAccessWorkspace {
    generatedAt: string;
    context: IdentityAccessResolvedContext;
    roleValidation: IdentityAccessValidationResult | null;
    permissionValidation: IdentityAccessValidationResult | null;
    tenantScopeValidation: IdentityAccessValidationResult | null;
}
declare function buildIdentityAccessHref(query?: IdentityAccessWorkspaceQuery): string;
declare function buildIdentityAccessRoleDetailHref(role: string): string;
declare function readIdentityAccessRoleDetailParam(raw: unknown): string | null;
declare function buildIdentityAccessPermissionDetailHref(permission: string): string;
declare function readIdentityAccessPermissionDetailParam(raw: unknown): string | null;
declare function buildIdentityAccessSessionDetailHref(session: string): string;
declare function readIdentityAccessSessionDetailParam(raw: unknown): string | null;
interface FoundationWorkspaceQuery {
    moduleKey?: string;
    consumer?: string;
}
declare function buildFoundationWorkspaceHref(query?: FoundationWorkspaceQuery): string;
declare function buildFoundationModuleDetailHref(moduleKey: string): string;
declare function readFoundationModuleDetailParam(raw: unknown): string | null;
interface IntegrationWebhookSourceContract {
    source: string;
    algorithm: 'hmac-sha256' | string;
    toleranceSeconds: number;
    description: string;
    secretRef: string;
}
interface IntegrationEventEnvelopeContract {
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
interface IntegrationIdempotencyRecordContract {
    key: string;
    source: string;
    eventId: string;
    eventType: string;
    firstSeenAt: string;
    envelopeId: string;
    status: 'accepted' | string;
    payloadChecksum: string;
}
interface IntegrationPublishEventRequest {
    eventName: string;
    source?: string;
    aggregateId?: string;
    idempotencyKey?: string;
    payload: Record<string, unknown>;
}
interface IntegrationPublishEventResponse {
    status: 'accepted' | 'duplicate';
    envelope: IntegrationEventEnvelopeContract;
    persistedEventId: string;
    guarantees: string[];
}
interface IntegrationWebhookIngestRequest {
    eventId?: string;
    eventType?: string;
    signature: string;
    timestamp: string;
    rawBody?: string;
    payload: Record<string, unknown>;
}
interface IntegrationWebhookIngestResponse {
    status: 'accepted' | 'duplicate';
    source: string;
    signatureVerified: boolean;
    idempotency: IntegrationIdempotencyRecordContract;
    envelope?: IntegrationEventEnvelopeContract;
    pipeline: string[];
}
interface IntegrationOrchestrationWorkspaceQuery {
    source?: string;
}
interface IntegrationOrchestrationWorkspace {
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
declare function buildIntegrationOrchestrationHref(query?: IntegrationOrchestrationWorkspaceQuery): string;
/** Agent 会话状态 */
type AgentSessionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
/** Agent 执行状态 */
type AgentExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
/** Agent 工具调用状态 */
type AgentToolCallStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
/** Agent 消息角色 */
type AgentMessageRole = 'system' | 'user' | 'assistant' | 'tool';
/** Agent 运行时配置 */
interface AgentConfig {
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
interface AgentMessage {
    id: string;
    sessionId: string;
    role: AgentMessageRole;
    content: string;
    toolCallId?: string;
    toolCalls?: AgentToolCall[];
    timestamp: string;
}
/** Agent 工具调用 */
interface AgentToolCall {
    id: string;
    name: string;
    input: unknown;
    output?: unknown;
    status: AgentToolCallStatus;
    durationMs?: number;
    error?: string;
}
/** Agent 运行会话 */
interface AgentSession {
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
interface AgentExecution {
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
interface QualityEvaluation {
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
interface CreateSessionRequest {
    configId: string;
    userInput: string;
    maxSteps?: number;
    enableReflection?: boolean;
    createdBy: string;
    tenantId: string;
}
/** Agent 会话执行响应 */
interface SessionExecutionResult {
    session: AgentSession;
    execution: AgentExecution;
    evaluation?: QualityEvaluation;
    timestamp: string;
}
/** 批量 Agent 请求 */
interface BatchAgentRequest {
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
interface BatchAgentResponse {
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
interface AgentStats {
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
type ToolRiskLevel = 'low' | 'medium' | 'high';
interface ToolDefinition {
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
type AgentSessionEvent = {
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
type AgentSessionEventType = AgentSessionEvent['type'];
/** 订单状态 (8 个, 状态机见 apps/api/src/modules/cashier/order-state-machine.ts) */
type OrderStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'FULFILLED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'CANCELED' | 'TIMEOUT';
/** 支付方式 (4 种) */
type PaymentMethod = 'CASH' | 'WECHAT' | 'ALIPAY' | 'CARD';
/** 支付状态 (4 个) */
type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
/** 退款状态 (3 个) */
type RefundStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
/** 订单行 (商品明细) */
interface OrderItem {
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
interface Order {
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
interface Payment {
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
interface Refund {
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
type OrderEvent = {
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
type OrderEventType = OrderEvent['type'];
/** 创建订单输入 */
interface CreateOrderInput {
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
interface CreatePaymentInput {
    orderId: string;
    method: PaymentMethod;
    amountCents: number;
}
/** 创建退款输入 */
interface CreateRefundInput {
    orderId: string;
    paymentId: string;
    amountCents: number;
    reason: string;
}
/** 订单事件 (带 id, 用于 SSE Last-Event-ID 续传) */
type OrderEventWithId = OrderEvent & {
    id: number;
};
/** LLM 服务提供商 */
type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'moonshot' | 'minimax' | 'custom';
/** LLM 配置状态 */
type LLMConfigStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
/** 站点LLM配置 */
interface TenantLLMConfig {
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
interface CreateLLMConfigRequest {
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
interface UpdateLLMConfigRequest {
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
interface LLMStats {
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
interface LLMCallLog {
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
interface ApplyLLMConfigRequest {
    configId: string;
    useCase: string;
    expectedVolume: number;
    businessJustification?: string;
}
/** 全球化地域上下文 */
interface GeoContext {
    country: string;
    province?: string;
    city?: string;
    language: SupportedLanguage;
    currency: SupportedCurrency;
    timezone: string;
    regionCode: string;
}
/** 支持的语言 */
type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'zh-TW' | 'es-ES' | 'fr-FR' | 'de-DE';
/** 支持的货币 */
type SupportedCurrency = 'USD' | 'CNY' | 'JPY' | 'KRW' | 'EUR' | 'GBP' | 'HKD' | 'SGD';

export { type AdminRuntimeActionKey, type AdminRuntimeActionPresetContract, type AgentConfig, type AgentExecution, type AgentExecutionStatus, type AgentMessage, type AgentMessageRole, type AgentSession, type AgentSessionEvent, type AgentSessionEventType, type AgentSessionStatus, type AgentStats, type AgentToolCall, type AgentToolCallStatus, type ApiResult, type AppBootstrapWiring, type ApplyLLMConfigRequest, type AuditRecordContract, type AuditRiskLevel, type AuditTrailQuery, type AuditTrailResponse, type AuditTrailSummary, type BackendTenantRole, type BatchAgentRequest, type BatchAgentResponse, type BootstrapCacheLayer, type BootstrapCapabilityRule, type BootstrapDeliveryChannel, type BootstrapFallbackStrategy, type BootstrapFoundationMetadataContract, type ConfigurationCertificateMetadata, type ConfigurationCertificateStatus, type ConfigurationConfigEntry, type ConfigurationConfigEntryRevision, type ConfigurationFeatureFlag, type ConfigurationGovernanceMetadataEntry, type ConfigurationGovernanceMetadataStatus, type ConfigurationOverview, type ConfigurationOverviewQuery, type ConfigurationPosture, type ConfigurationPostureAttention, type ConfigurationScope, type ConfigurationScopeType, type ConfigurationSecretMetadata, type ConfigurationSecretStatus, type ConfigurationSnapshot, type CreateLLMConfigRequest, type CreateOrderInput, type CreatePaymentInput, type CreateRefundInput, type CreateSessionRequest, type DesensitizationBootstrapPolicy, type DomainGovernanceDisplayModel, type DomainGovernanceDisplayPreset, type DomainGovernanceDisplayPresetContract, type DomainGovernanceDisplayPresetKey, type DomainGovernanceRenderItem, type DomainGovernanceRenderItemTone, type DomainGovernanceRenderSection, type DomainGovernanceWorkspaceQuery, type EdgeReplayStageContract, type EdgeReplayStageRequest, FRONTEND_TO_BACKEND_ROLE, type FeatureFlagBootstrapPolicy, type FoundationAlertAcknowledgement, type FoundationAlertAcknowledgementStatus, type FoundationAlertCatalogItem, type FoundationAlertCatalogResponse, type FoundationAlertCode, type FoundationAlertDrilldownDetail, type FoundationAlertDrilldownResponse, type FoundationAlertLinkedFocusQueryKeys, type FoundationAlertLytConnectionGovernanceRiskDetail, type FoundationAlertLytGovernanceAlertGroup, type FoundationAlertMutationKind, type FoundationAlertMutationResponse, type FoundationAlertOperation, type FoundationAlertOptimisticFeedback, type FoundationAlertOptimisticOverviewVisibility, type FoundationAlertOptimisticReadState, type FoundationAlertOwnerFilter, type FoundationAlertOwnerSummary, type FoundationAlertPanelDerivedState, type FoundationAlertPanelReadState, type FoundationAlertQuickSwitchItem, type FoundationAlertRuntimeCallbackStalledDetail, type FoundationAlertRuntimeCallbackStalledEscalationSummary, type FoundationAlertSeverity, type FoundationAlertTimelineActionSummary, type FoundationAlertTimelineActiveFilterChip, type FoundationAlertTimelineDigest, type FoundationAlertTimelineEntry, type FoundationAlertTimelineFilter, type FoundationAlertTimelineFilterQueryKeys, type FoundationAlertTimelineFilterReadState, type FoundationAlertTimelineFilterState, type FoundationAlertTimelineMetrics, type FoundationAlertTimelineShortcutPreset, type FoundationAlertTimelineSourceFilter, type FoundationAlertTimelineSourceSummary, type FoundationBlueprint, type FoundationBootstrapResponse, type FoundationCapabilityDescriptor, type FoundationClientApp, type FoundationConsumerActionGovernanceExample, type FoundationConsumerDescriptor, type FoundationConsumerGovernanceAlertLifecycleExample, type FoundationConsumerKey, type FoundationConsumerRuntimeHandoffExample, type FoundationConsumerRuntimeReceiptExample, type FoundationFrontendBootstrapState, type FoundationGovernanceBaseline, type FoundationModuleDescriptor, type FoundationModuleKey, type FoundationOperationsAlert, type FoundationOperationsAlertTriageState, type FoundationOperationsOverviewResponse, type FoundationOperationsOverviewSummary, type FoundationSupportedClient, type FoundationWorkspaceQuery, type FrontendWorkbenchRole, type GeoContext, type IdentityAccessActorContext, type IdentityAccessAuthorizationDecision, type IdentityAccessResolvedContext, type IdentityAccessTenantContext, type IdentityAccessValidationResult, type IdentityAccessWorkspace, type IdentityAccessWorkspaceQuery, type IntegrationEventEnvelopeContract, type IntegrationIdempotencyRecordContract, type IntegrationOrchestrationEventDetail, type IntegrationOrchestrationIdempotencyDetail, type IntegrationOrchestrationWorkspace, type IntegrationOrchestrationWorkspaceQuery, type IntegrationPublishEventRequest, type IntegrationPublishEventResponse, type IntegrationWebhookIngestRequest, type IntegrationWebhookIngestResponse, type IntegrationWebhookSourceContract, type LLMCallLog, type LLMConfigStatus, type LLMProvider, type LLMStats, type LytMemberSnapshotContract, type LytStoreCapabilityAccessItem, type LytStoreCapabilityAccessViewResponse, type MarketBootstrapResponse, type MarketProfileContract, type MemberAutomationTriggerCodeContract, type MemberAutomationTriggerContract, type MemberAutomationTriggerSourceContract, type MemberAutomationTriggerStatusContract, type MemberDataSourceContract, type MemberLevelContract, type MemberLifecycleStageContract, type MemberOperationsActionChannelContract, type MemberOperationsActionCodeContract, type MemberOperationsActionContract, type MemberOperationsExecutionLaneContract, type MemberOperationsExecutionReceiptContract, type MemberOperationsPriorityContract, type MemberOperationsProfileContract, type MemberOperationsReceiptStatusContract, type MemberOperationsReceiptTargetTypeContract, type MemberOperationsRuntimeStateContract, type MemberOperationsTaskContract, type MemberOperationsTaskSourceContract, type MemberOperationsTaskStatusContract, type MemberProfileContract, type MemberStatusContract, type ObservabilitySignalContract, type ObservabilitySignalType, type ObservabilityStatus, type Order, type OrderEvent, type OrderEventType, type OrderEventWithId, type OrderItem, type OrderStatus, type PaginationInput, type PaginationMeta, type Payment, type PaymentMethod, type PaymentStatus, type PortalBootstrapResponse, type PortalDomainGovernanceScopeSummaryContract, type PortalDomainGovernanceSummaryContract, type PortalLoginEntryContract, type QualityEvaluation, type QuotaLedgerRecord, type QuotaLedgerStatus, type RateLimitAlgorithm, type RateLimitPeriod, type RateLimitPolicyRecord, type RateLimitScopeType, type RateLimitWorkspace, type RateLimitWorkspaceQuery, type RecoveryPlanContract, type RecoveryPlanStatus, type Refund, type RefundStatus, type RegionalConfigOverrideContract, type RegionalLoginPolicyContract, type ResilienceOverview, type ResilienceQuery, type RetryPolicyContract, type RiskChallengeBootstrapPolicy, type RoleWorkbenchContract, type RuntimeGovernanceActionKey, type RuntimeGovernanceActionState, type RuntimeGovernanceApiActionKey, type RuntimeGovernanceApproval, type RuntimeGovernanceApprovalExecution, type RuntimeGovernanceApprovalExecutionFailure, type RuntimeGovernanceApprovalStatus, type RuntimeGovernanceBatchReplayItem, type RuntimeGovernanceBatchReplayRequest, type RuntimeGovernanceBatchReplayResponse, type RuntimeGovernanceCallbackEvent, type RuntimeGovernanceCallbackReceipt, type RuntimeGovernanceCallbackReceiptStatus, type RuntimeGovernanceCallbackRequest, type RuntimeGovernanceCallbackStallDetail, type RuntimeGovernanceCallbackStallEscalationAction, type RuntimeGovernanceCallbackStallStatus, type RuntimeGovernanceCallbackStatus, type RuntimeGovernanceClientApp, type RuntimeGovernanceEventRecord, type RuntimeGovernanceLedgerRecord, type RuntimeGovernanceNextStep, type RuntimeGovernanceOperationsBatchSummary, type RuntimeGovernanceOperationsOverview, type RuntimeGovernanceOperationsOverviewSummary, type RuntimeGovernanceOverviewFilter, type RuntimeGovernanceRateLimitDecision, type RuntimeGovernanceReceipt, type RuntimeGovernanceRecommendedAction, type RuntimeGovernanceReplayEscalationAction, type RuntimeGovernanceReplayPolicy, type RuntimeGovernanceReplayRequest, type RuntimeGovernanceReplaySource, type RuntimeGovernanceRiskLevel, type RuntimeGovernanceSubmitRequest, type RuntimeGovernanceSyncContract, type RuntimeGovernanceSyncRequest, type RuntimeGovernanceTicket, type SessionExecutionResult, type StorePortalContract, type SupportedCurrency, type SupportedLanguage, type TenantContextContract, type TenantLLMConfig, type TenantScopeBootstrapPolicy, type TobPortalContract, type ToolDefinition, type ToolRiskLevel, type UnifiedFoundationBootstrapContract, type UpdateLLMConfigRequest, type WorkbenchBootstrapResponse, type WorkbenchNavItemContract, adminRuntimeActionKeys, adminRuntimeActionPresetContractMap, adminRuntimeActionPresetContracts, adminWorkbenchConsumerDescriptor, advanceRuntimeGovernanceReplayPolicy, buildAuditTrailHref, buildAuditTrailRecordDetailHref, buildConfigurationCertificateDetailHref, buildConfigurationConfigEntryDetailHref, buildConfigurationFeatureFlagDetailHref, buildConfigurationHref, buildConfigurationOperationDetailHref, buildConfigurationSecretDetailHref, buildDomainGovernanceDisplayModel, buildDomainGovernanceHref, buildDomainGovernanceWorkspaceHref, buildFoundationAlertLinkedFocusContext, buildFoundationAlertLinkedFocusSearchParams, buildFoundationAlertOptimisticReadState, buildFoundationAlertPanelDerivedState, buildFoundationAlertPanelReadState, buildFoundationAlertQuickSwitchItems, buildFoundationAlertRecentOperationFilterState, buildFoundationAlertTimelineEmptyState, buildFoundationAlertTimelineFilterQueryPreview, buildFoundationAlertTimelineFilterReadState, buildFoundationAlertTimelineFilterSearchParams, buildFoundationAlertTimelineFilterStateFromQuery, buildFoundationAlertTimelineShortcutPresets, buildFoundationModuleDetailHref, buildFoundationWorkspaceHref, buildIdentityAccessHref, buildIdentityAccessPermissionDetailHref, buildIdentityAccessRoleDetailHref, buildIdentityAccessSessionDetailHref, buildIntegrationOrchestrationEventDetailHref, buildIntegrationOrchestrationHref, buildIntegrationOrchestrationIdempotencyDetailHref, buildIntegrationOrchestrationSourceDetailHref, buildRateLimitsHref, buildRateLimitsLedgerDetailHref, buildRateLimitsPolicyDetailHref, buildResilienceHref, buildResilienceRecoveryPlanDetailHref, buildResilienceRetryPolicyDetailHref, buildResilienceSignalDetailHref, buildRuntimeGovernanceCallbackStallDetail, buildRuntimeGovernanceReplayEndpoint, createRuntimeGovernanceReplayPolicy, defaultRoleWorkbenchContractMap, defaultRoleWorkbenchContracts, domainGovernanceDisplayCopy, domainGovernanceDisplayPresetContractMap, evaluateRuntimeGovernanceCallbackStall, filterFoundationAlertTimeline, filterFoundationAlertTimelineByOwner, filterFoundationAlertTimelineBySource, findLatestFoundationAlertTimelineEntry, formatDomainGovernanceCountsSummary, formatDomainGovernanceFocusScopeLabel, formatDomainGovernanceFocusScopeSummary, formatDomainGovernanceLastEvaluatedSummary, formatDomainGovernanceRecommendationSummary, formatDomainGovernanceSourceSummary, formatDomainGovernanceStatusSummary, foundationAlertCatalogFallback, foundationAppBootstrapProfiles, foundationBootstrapCapabilityRules, foundationBootstrapContract, foundationSupportedClients, getDomainGovernanceAttentionLabel, getFoundationAlertLytConnectionGovernanceRiskDetail, getFoundationAlertRuntimeCallbackStalledDetail, getFoundationAppBootstrapWiring, isFoundationAlertLytConnectionGovernanceRiskDetail, isFoundationAlertRuntimeCallbackStalledDetail, isFoundationAlertTimelineFilterStateEqual, listFoundationAlertTimelineActiveFilters, mapToBackendRole, memberAutomationTriggerCodeContracts, memberAutomationTriggerSourceContracts, memberAutomationTriggerStatusContracts, memberDataSourceContracts, memberLevelContracts, memberLifecycleStageContracts, memberOperationsActionChannelContracts, memberOperationsActionCodeContracts, memberOperationsExecutionLaneContracts, memberOperationsPriorityContracts, memberOperationsReceiptStatusContracts, memberOperationsReceiptTargetTypeContracts, memberOperationsRuntimeStateContracts, memberOperationsTaskSourceContracts, memberOperationsTaskStatusContracts, memberStatusContracts, normalizeFoundationAlertTimelineFilterState, readAuditTrailRecordDetailParam, readConfigurationCertificateDetailParam, readConfigurationConfigEntryDetailParam, readConfigurationFeatureFlagDetailParam, readConfigurationOperationDetailParam, readConfigurationSecretDetailParam, readFoundationModuleDetailParam, readIdentityAccessPermissionDetailParam, readIdentityAccessRoleDetailParam, readIdentityAccessSessionDetailParam, readIntegrationOrchestrationEventDetailParam, readIntegrationOrchestrationIdempotencyDetailParam, readIntegrationOrchestrationSourceDetailParam, readRateLimitsLedgerDetailParam, readRateLimitsPolicyDetailParam, readResilienceRecoveryPlanDetailParam, readResilienceRetryPolicyDetailParam, readResilienceSignalDetailParam, resolveDomainGovernanceDisplayPreset, resolveDomainGovernanceRenderItemColor, resolveFoundationAlertFocusCode, resolveFoundationAlertSelectedCode, runtimeGovernanceActionKeys, runtimeGovernanceApiActionKeys, runtimeGovernanceCallbackEvents, runtimeGovernanceCallbackReceiptStatuses, runtimeGovernanceCallbackStallEscalationActions, runtimeGovernanceCallbackStatuses, runtimeGovernanceCallbackTimeoutThresholds, runtimeGovernanceClientApps, runtimeGovernanceNextSteps, runtimeGovernanceRecommendedActions, runtimeGovernanceReplayEscalationActions, runtimeGovernanceReplaySources, runtimeGovernanceRiskLevels, selectDomainGovernanceFocusScope, summarizeFoundationAlertOwners, summarizeFoundationAlertTimelineDigest, summarizeFoundationAlertTimelineFilters, summarizeFoundationAlertTimelineMetrics, summarizeFoundationAlertTimelineSources };
