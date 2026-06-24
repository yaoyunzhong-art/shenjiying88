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
type FoundationAlertCode = 'approvals-pending' | 'approval-execution-failures' | 'high-risk-audits' | 'blocked-rate-limit-ledgers' | 'secret-rotation-attention' | 'observability-degradation' | 'recovery-drill-attention' | 'runtime-governance-backlog' | 'runtime-callback-stalled';
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
type FoundationAlertDrilldownDetail = Record<string, unknown> | FoundationAlertRuntimeCallbackStalledDetail;
declare function isFoundationAlertRuntimeCallbackStalledDetail(code: FoundationAlertCode | string, detail: FoundationAlertDrilldownDetail | null | undefined): detail is FoundationAlertRuntimeCallbackStalledDetail;
declare function getFoundationAlertRuntimeCallbackStalledDetail(drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined, code?: FoundationAlertCode | string | null): FoundationAlertRuntimeCallbackStalledDetail | null;
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
declare const runtimeGovernanceClientApps: readonly ["admin-web", "tob-web", "storefront-web", "miniapp", "app"];
type RuntimeGovernanceClientApp = (typeof runtimeGovernanceClientApps)[number];
declare const runtimeGovernanceActionKeys: readonly ["approval-execution", "market-profile-resolve", "regional-override-preview", "secret-rotation", "runtime-replay", "webhook-callback", "edge-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
type RuntimeGovernanceActionKey = (typeof runtimeGovernanceActionKeys)[number];
declare const runtimeGovernanceApiActionKeys: readonly ["approval-execution", "secret-rotation", "runtime-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
type RuntimeGovernanceApiActionKey = (typeof runtimeGovernanceApiActionKeys)[number];
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
    events: RuntimeGovernanceEventRecord[];
    generatedAt: string;
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
interface TenantContextContract {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
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

export { type ApiResult, type AppBootstrapWiring, type BootstrapCacheLayer, type BootstrapCapabilityRule, type BootstrapDeliveryChannel, type BootstrapFallbackStrategy, type BootstrapFoundationMetadataContract, type DesensitizationBootstrapPolicy, type FeatureFlagBootstrapPolicy, type FoundationAlertAcknowledgement, type FoundationAlertAcknowledgementStatus, type FoundationAlertCatalogItem, type FoundationAlertCatalogResponse, type FoundationAlertCode, type FoundationAlertDrilldownDetail, type FoundationAlertDrilldownResponse, type FoundationAlertLinkedFocusQueryKeys, type FoundationAlertMutationKind, type FoundationAlertMutationResponse, type FoundationAlertOperation, type FoundationAlertOptimisticFeedback, type FoundationAlertOptimisticOverviewVisibility, type FoundationAlertOptimisticReadState, type FoundationAlertOwnerFilter, type FoundationAlertOwnerSummary, type FoundationAlertPanelDerivedState, type FoundationAlertPanelReadState, type FoundationAlertQuickSwitchItem, type FoundationAlertRuntimeCallbackStalledDetail, type FoundationAlertRuntimeCallbackStalledEscalationSummary, type FoundationAlertSeverity, type FoundationAlertTimelineActionSummary, type FoundationAlertTimelineActiveFilterChip, type FoundationAlertTimelineDigest, type FoundationAlertTimelineEntry, type FoundationAlertTimelineFilter, type FoundationAlertTimelineFilterQueryKeys, type FoundationAlertTimelineFilterReadState, type FoundationAlertTimelineFilterState, type FoundationAlertTimelineMetrics, type FoundationAlertTimelineShortcutPreset, type FoundationAlertTimelineSourceFilter, type FoundationAlertTimelineSourceSummary, type FoundationBlueprint, type FoundationBootstrapResponse, type FoundationCapabilityDescriptor, type FoundationClientApp, type FoundationConsumerActionGovernanceExample, type FoundationConsumerDescriptor, type FoundationConsumerGovernanceAlertLifecycleExample, type FoundationConsumerKey, type FoundationConsumerRuntimeHandoffExample, type FoundationConsumerRuntimeReceiptExample, type FoundationFrontendBootstrapState, type FoundationGovernanceBaseline, type FoundationModuleDescriptor, type FoundationModuleKey, type FoundationOperationsAlert, type FoundationOperationsAlertTriageState, type FoundationOperationsOverviewResponse, type FoundationOperationsOverviewSummary, type FoundationSupportedClient, type MarketBootstrapResponse, type MarketProfileContract, type PaginationInput, type PaginationMeta, type PortalBootstrapResponse, type PortalLoginEntryContract, type RegionalConfigOverrideContract, type RegionalLoginPolicyContract, type RiskChallengeBootstrapPolicy, type RoleWorkbenchContract, type RuntimeGovernanceActionKey, type RuntimeGovernanceActionState, type RuntimeGovernanceApiActionKey, type RuntimeGovernanceCallbackEvent, type RuntimeGovernanceCallbackReceipt, type RuntimeGovernanceCallbackReceiptStatus, type RuntimeGovernanceCallbackRequest, type RuntimeGovernanceCallbackStallDetail, type RuntimeGovernanceCallbackStallEscalationAction, type RuntimeGovernanceCallbackStallStatus, type RuntimeGovernanceCallbackStatus, type RuntimeGovernanceClientApp, type RuntimeGovernanceEventRecord, type RuntimeGovernanceLedgerRecord, type RuntimeGovernanceNextStep, type RuntimeGovernanceRateLimitDecision, type RuntimeGovernanceReceipt, type RuntimeGovernanceRecommendedAction, type RuntimeGovernanceReplayEscalationAction, type RuntimeGovernanceReplayPolicy, type RuntimeGovernanceReplayRequest, type RuntimeGovernanceReplaySource, type RuntimeGovernanceRiskLevel, type RuntimeGovernanceSubmitRequest, type RuntimeGovernanceSyncContract, type RuntimeGovernanceSyncRequest, type RuntimeGovernanceTicket, type StorePortalContract, type TenantContextContract, type TenantScopeBootstrapPolicy, type TobPortalContract, type UnifiedFoundationBootstrapContract, type WorkbenchBootstrapResponse, type WorkbenchNavItemContract, advanceRuntimeGovernanceReplayPolicy, buildFoundationAlertLinkedFocusContext, buildFoundationAlertLinkedFocusSearchParams, buildFoundationAlertOptimisticReadState, buildFoundationAlertPanelDerivedState, buildFoundationAlertPanelReadState, buildFoundationAlertQuickSwitchItems, buildFoundationAlertRecentOperationFilterState, buildFoundationAlertTimelineEmptyState, buildFoundationAlertTimelineFilterQueryPreview, buildFoundationAlertTimelineFilterReadState, buildFoundationAlertTimelineFilterSearchParams, buildFoundationAlertTimelineFilterStateFromQuery, buildFoundationAlertTimelineShortcutPresets, buildRuntimeGovernanceCallbackStallDetail, buildRuntimeGovernanceReplayEndpoint, createRuntimeGovernanceReplayPolicy, evaluateRuntimeGovernanceCallbackStall, filterFoundationAlertTimeline, filterFoundationAlertTimelineByOwner, filterFoundationAlertTimelineBySource, findLatestFoundationAlertTimelineEntry, foundationAlertCatalogFallback, foundationAppBootstrapProfiles, foundationBootstrapCapabilityRules, foundationBootstrapContract, foundationSupportedClients, getFoundationAlertRuntimeCallbackStalledDetail, getFoundationAppBootstrapWiring, isFoundationAlertRuntimeCallbackStalledDetail, isFoundationAlertTimelineFilterStateEqual, listFoundationAlertTimelineActiveFilters, normalizeFoundationAlertTimelineFilterState, resolveFoundationAlertFocusCode, resolveFoundationAlertSelectedCode, runtimeGovernanceActionKeys, runtimeGovernanceApiActionKeys, runtimeGovernanceCallbackEvents, runtimeGovernanceCallbackReceiptStatuses, runtimeGovernanceCallbackStallEscalationActions, runtimeGovernanceCallbackStatuses, runtimeGovernanceCallbackTimeoutThresholds, runtimeGovernanceClientApps, runtimeGovernanceNextSteps, runtimeGovernanceRecommendedActions, runtimeGovernanceReplayEscalationActions, runtimeGovernanceReplaySources, runtimeGovernanceRiskLevels, summarizeFoundationAlertOwners, summarizeFoundationAlertTimelineDigest, summarizeFoundationAlertTimelineFilters, summarizeFoundationAlertTimelineMetrics, summarizeFoundationAlertTimelineSources };
