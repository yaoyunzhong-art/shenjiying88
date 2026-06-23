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
export type FoundationAlertCode = 'approvals-pending' | 'approval-execution-failures' | 'high-risk-audits' | 'blocked-rate-limit-ledgers' | 'secret-rotation-attention' | 'observability-degradation' | 'recovery-drill-attention' | 'runtime-governance-backlog' | 'runtime-callback-stalled';
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
export type FoundationAlertDrilldownDetail = Record<string, unknown> | FoundationAlertRuntimeCallbackStalledDetail;
export declare function isFoundationAlertRuntimeCallbackStalledDetail(code: FoundationAlertCode | string, detail: FoundationAlertDrilldownDetail | null | undefined): detail is FoundationAlertRuntimeCallbackStalledDetail;
export declare function getFoundationAlertRuntimeCallbackStalledDetail(drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined, code?: FoundationAlertCode | string | null): FoundationAlertRuntimeCallbackStalledDetail | null;
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
export declare const runtimeGovernanceClientApps: readonly ["admin-web", "tob-web", "storefront-web", "miniapp", "app"];
export type RuntimeGovernanceClientApp = (typeof runtimeGovernanceClientApps)[number];
export declare const runtimeGovernanceActionKeys: readonly ["approval-execution", "market-profile-resolve", "regional-override-preview", "secret-rotation", "runtime-replay", "webhook-callback", "edge-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
export type RuntimeGovernanceActionKey = (typeof runtimeGovernanceActionKeys)[number];
export declare const runtimeGovernanceApiActionKeys: readonly ["approval-execution", "secret-rotation", "runtime-replay", "member-login", "coupon-claim", "booking-submit", "device-bind", "payment-submit"];
export type RuntimeGovernanceApiActionKey = (typeof runtimeGovernanceApiActionKeys)[number];
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
    events: RuntimeGovernanceEventRecord[];
    generatedAt: string;
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
export interface TenantContextContract {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
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
//# sourceMappingURL=index.d.ts.map