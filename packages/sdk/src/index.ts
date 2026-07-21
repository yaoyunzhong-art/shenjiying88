import { foundationAlertCatalogFallback } from '@m5/types';
import type {
  AppBootstrapWiring,
  AuditRecordContract,
  AuditTrailQuery,
  AuditTrailResponse,
  AuditTrailSummary,
  ConfigurationCertificateMetadata,
  ConfigurationConfigEntry,
  ConfigurationFeatureFlag,
  ConfigurationGovernanceMetadataEntry,
  ConfigurationOverview,
  ConfigurationOverviewQuery,
  ConfigurationSecretMetadata,
  EdgeReplayStageContract,
  EdgeReplayStageRequest,
  FoundationAlertDrilldownResponse,
  FoundationAlertCatalogItem,
  FoundationAlertMutationKind,
  FoundationAlertMutationResponse,
  FoundationConsumerDescriptor,
  FoundationConsumerKey,
  FoundationClientApp,
  FoundationOperationsAlert,
  FoundationOperationsOverviewResponse,
  FoundationOperationsOverviewSummary,
  ApiResult,
  FoundationBootstrapResponse,
  FoundationAlertCatalogResponse,
  MarketBootstrapResponse,
  IdentityAccessResolvedContext,
  IdentityAccessValidationResult,
  IdentityAccessWorkspaceQuery,
  IntegrationEventEnvelopeContract,
  IntegrationIdempotencyRecordContract,
  IntegrationOrchestrationWorkspace,
  IntegrationOrchestrationWorkspaceQuery,
  IntegrationPublishEventRequest,
  IntegrationPublishEventResponse,
  IntegrationWebhookIngestRequest,
  IntegrationWebhookIngestResponse,
  IntegrationWebhookSourceContract,
  ObservabilitySignalContract,
  PortalBootstrapResponse,
  PortalDomainGovernanceSummaryContract,
  QuotaLedgerRecord,
  RateLimitPolicyRecord,
  RateLimitWorkspace,
  RateLimitWorkspaceQuery,
  RecoveryPlanContract,
  ResilienceOverview,
  RetryPolicyContract,
  RuntimeGovernanceActionKey,
  RuntimeGovernanceCallbackRequest,
  RuntimeGovernanceBatchReplayRequest,
  RuntimeGovernanceBatchReplayResponse,
  RuntimeGovernanceClientApp,
  RuntimeGovernanceOverviewFilter,
  RuntimeGovernanceNextStep,
  RuntimeGovernanceReceipt,
  RuntimeGovernanceRecommendedAction,
  RuntimeGovernanceReplayRequest,
  RuntimeGovernanceReplaySource,
  RuntimeGovernanceRiskLevel,
  RuntimeGovernanceSubmitRequest,
  RuntimeGovernanceSyncRequest,
  WorkbenchBootstrapResponse,
  AgentConfig,
  AgentSession,
  AgentExecution,
  SessionExecutionResult,
  CreateSessionRequest,
  BatchAgentRequest,
  BatchAgentResponse,
  QualityEvaluation,
  AgentStats,
  AgentSessionEvent
} from '@m5/types';

// ── Tenant-Config (三级独立配置 · Phase-FP P0) ──

/** 三级工作台代码 (与后端 LEVEL_TO_WORKBENCH 保持一致) */
export type TenantConfigWorkbenchCode = 'W-S' | 'W-T' | 'W-B';

/** 配置级别 */
export type TenantConfigLevel = 'store' | 'tenant' | 'brand';

/** 配置分类 */
export type TenantConfigCategory =
  | 'pos' | 'print' | 'member' | 'marketing' | 'inventory'
  | 'integration' | 'ai' | 'compliance' | 'billing' | 'branding';

/** 配置敏感度 (与后端 tenant-config.entity 保持一致) */
export type TenantConfigSensitivity = 'public' | 'internal' | 'restricted' | 'secret';

/** 配置值类型 */
export type TenantConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'secret';

/** 生效配置 (考虑继承链) */
export interface TenantConfigEffective {
  key: string;
  value: string;
  sourceLevel: TenantConfigLevel;
  inherited: boolean;
  isMasked?: boolean;
  sensitivity?: TenantConfigSensitivity;
}

/** 单条配置实例 (已脱敏) */
export interface TenantConfigItem {
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
export interface TenantConfigItemDefinition {
  key: string;
  category: TenantConfigCategory;
  level: TenantConfigLevel;
  valueType: TenantConfigValueType;
  sensitivity: TenantConfigSensitivity;
  defaultValue?: string | number | boolean | null;
  allowedRoles?: string[];
  required?: boolean;
  validation?: { pattern?: string; min?: number; max?: number; enum?: string[] };
  label: string;
  description?: string;
}

/** 审计日志条目 (与后端 ConfigAuditLog 对齐) */
export interface TenantConfigAuditLog {
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

export interface TenantConfigBatchInput {
  key: string;
  value: string;
  inherits?: boolean;
}

export interface ApiClientOptions {
  baseUrl: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
  token?: string;
  headers?: Record<string, string>;
}

export interface ActorHeaderOptions {
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

export interface FoundationGovernanceReadModel {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  alerts: FoundationAlertCatalogItem[];
  summary: FoundationOperationsOverviewSummary;
  overviewAlerts: FoundationOperationsAlert[];
  topRisks: FoundationOperationsAlert[];
}

export interface FoundationBootstrapWiringMeta {
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

export interface RuntimeGovernancePresetLike {
  action: RuntimeGovernanceActionKey;
  nextStep: RuntimeGovernanceNextStep;
  riskLevel: RuntimeGovernanceRiskLevel;
  requestEndpoint: string;
  payload: Record<string, unknown>;
  recommendedAction: RuntimeGovernanceRecommendedAction;
  handlerName: string;
}

export interface BuildRuntimeGovernanceSubmitRequestOptions<TPreset extends RuntimeGovernancePresetLike> {
  app: RuntimeGovernanceClientApp;
  actorId: string;
  nonce: string;
  preset: TPreset;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export interface BuildRuntimeGovernanceReplayRequestOptions {
  app: FoundationClientApp;
  actorId: string;
  nonce: string;
  requestedFrom: RuntimeGovernanceReplaySource;
  receipt: RuntimeGovernanceReceipt;
  tenantId?: string;
}

export type FoundationGovernanceReadModelClient = Pick<ApiClient, 'getFoundationAlertCatalog' | 'getFoundationOverview'>;
export type RuntimeGovernancePanelClient = Pick<
  ApiClient,
  'submitRuntimeGovernanceAction' | 'getRuntimeGovernanceReceipt' | 'replayRuntimeGovernanceAction'
>;

export interface CreateRuntimeGovernancePanelClientOptions extends Omit<ApiClientOptions, 'baseUrl'> {
  baseUrl?: string;
}

export interface CreateRuntimeGovernancePanelBindingsOptions<TPreset> {
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

export interface FoundationPortalConsumerSnapshotBase {
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

export const emptyFoundationGovernanceOverviewSummary: FoundationOperationsOverviewSummary = {
  approvalsPending: 0,
  approvalsWithFailures: 0,
  highRiskAudits: 0,
  blockedLedgers: 0,
  rotationDueSecrets: 0,
  expiredSecrets: 0,
  expiringCertificates: 0,
  expiredCertificates: 0,
  degradedSignals: 0,
  attentionRecoveryPlans: 0,
  staleDrills: 0,
  runtimeGovernanceBacklog: 0,
  stalledRuntimeCallbacks: 0,
  highRiskRuntimeBacklog: 0,
  runtimeBlockedActions: 0
};

export function createFoundationBootstrapWiringMeta(wiring: AppBootstrapWiring): FoundationBootstrapWiringMeta {
  return {
    scope: {
      resolver: wiring.tenantScope.resolver,
      revalidateOn: [...wiring.tenantScope.revalidateOn],
      mismatchStrategy: wiring.tenantScope.mismatchStrategy
    },
    degradation: {
      featureFlagFallback: wiring.featureFlags.fallbackStrategy,
      desensitizationMode: wiring.desensitization.defaultMode,
      cacheableCapabilities: [...wiring.cacheableCapabilities]
    },
    challenge: {
      enforcement: wiring.riskChallenge.enforcement,
      notes: [...wiring.riskChallenge.notes]
    }
  };
}

export function createFoundationGovernanceReadModelLoader<TArgs extends unknown[]>(
  clientFactory: (...args: TArgs) => FoundationGovernanceReadModelClient,
  init?: RequestInit
) {
  return (...args: TArgs): Promise<FoundationGovernanceReadModel> =>
    loadFoundationGovernanceReadModel(clientFactory(...args), init);
}

export function createRuntimeGovernancePanelClient(options: CreateRuntimeGovernancePanelClientOptions) {
  return new ApiClient({
    ...options,
    baseUrl: options.baseUrl ?? getDefaultApiBaseUrl()
  });
}

export function createRuntimeGovernancePanelBindings<TPreset>({
  client,
  buildSubmitRequest,
  buildReplayRequest,
  submitInit,
  queryInit = { cache: 'no-store' },
  replayInit
}: CreateRuntimeGovernancePanelBindingsOptions<TPreset>) {
  return {
    submitPreset: (preset: TPreset, nonce: string) =>
      client.submitRuntimeGovernanceAction(buildSubmitRequest(preset, nonce), submitInit),
    queryReceipt: (receipt: RuntimeGovernanceReceipt) =>
      client.getRuntimeGovernanceReceipt(receipt.receiptCode, queryInit),
    replayReceipt: (receipt: RuntimeGovernanceReceipt, nonce: string) =>
      client.replayRuntimeGovernanceAction(receipt.receiptCode, buildReplayRequest(receipt, nonce), replayInit)
  };
}

export function createFoundationPortalConsumerSnapshotBase({
  wiring,
  bootstrap,
  consumerDescriptor
}: {
  wiring: AppBootstrapWiring;
  bootstrap: FoundationPortalBootstrapLike | null;
  consumerDescriptor: FoundationConsumerDescriptor | null;
}): FoundationPortalConsumerSnapshotBase {
  const wiringMeta = createFoundationBootstrapWiringMeta(wiring);

  return {
    deliveryMode: bootstrap ? 'api' : 'fallback',
    wiring,
    consumerDescriptor: consumerDescriptor ?? fallbackPortalConsumerDescriptor,
    foundationDependencies: bootstrap?.foundationDependencies ?? [],
    foundationContracts: bootstrap?.foundationContracts ?? [],
    regionalOverridesCount: bootstrap?.regionalOverrides?.length ?? 0,
    scope: wiringMeta.scope,
    degradation: wiringMeta.degradation,
    challenge: wiringMeta.challenge
  };
}

export function buildRuntimeGovernanceSubmitRequest<TPreset extends RuntimeGovernancePresetLike>({
  app,
  actorId,
  nonce,
  preset,
  tenantId,
  brandId,
  storeId,
  marketCode
}: BuildRuntimeGovernanceSubmitRequestOptions<TPreset>): RuntimeGovernanceSubmitRequest {
  return {
    app,
    action: preset.action,
    nextStep: preset.nextStep,
    riskLevel: preset.riskLevel,
    requestEndpoint: preset.requestEndpoint,
    payload: preset.payload,
    payloadSummary: JSON.stringify(preset.payload),
    recommendedAction: preset.recommendedAction,
    handlerName: preset.handlerName,
    idempotencyKey: `${app}:${preset.action}:submit:${nonce}`,
    actorId,
    tenantId,
    brandId,
    storeId,
    marketCode
  };
}

export function buildRuntimeGovernanceReplayRequest({
  app,
  actorId,
  nonce,
  requestedFrom,
  receipt,
  tenantId
}: BuildRuntimeGovernanceReplayRequestOptions): RuntimeGovernanceReplayRequest {
  return {
    ledgerKey: receipt.ledger.ledgerKey,
    requestedFrom,
    ticketCode: receipt.ticket.ticketCode,
    idempotencyKey: `${app}:${receipt.action}:replay:${nonce}`,
    actorId,
    tenantId
  };
}

export const fallbackPortalConsumerDescriptor: FoundationConsumerDescriptor = {
  consumer: 'portal',
  modulePath: 'src/modules/portal',
  dependsOn: [
    'identity-access',
    'configuration-governance',
    'integration-orchestration',
    'trust-governance',
    'resilience-operations'
  ],
  responsibility: '装配 ToB/ToC 门户解析、域名策略、登录入口和通知策略。',
  handoffContracts: [
    '从 identity-access 解析门户身份与组织归属',
    '从 configuration-governance 装配域名/模板/灰度配置',
    '通过 integration-orchestration 接入通知和开放平台网关',
    '由 trust-governance 处理限流、隐私和 AI 治理',
    '遵循 resilience-operations 的恢复预案'
  ],
  recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'],
  governanceTouchpoints: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap', 'feature-flags', 'risk-challenge'],
  highRiskEntrypoints: ['member-login'],
  actionGovernanceExamples: [
    {
      surface: 'miniapp',
      action: 'member-login',
      scenario: '游客态登录先拉起微信登录挑战，再进入会员会话刷新。',
      riskLevel: 'medium',
      bootstrapState: 'challenge-required',
      nextStep: 'CHALLENGE',
      submitState: 'challenge-issued',
      requestEndpoint: '/api/v1/members/session/challenge'
    },
    {
      surface: 'miniapp',
      action: 'booking-submit',
      scenario: '游客态预约提交先收口为登录前置，不允许只靠本地快照放行。',
      riskLevel: 'high',
      bootstrapState: 'scope-mismatch',
      nextStep: 'LOGIN',
      submitState: 'blocked',
      requestEndpoint: '/api/v1/storefront/bookings'
    },
    {
      surface: 'app',
      action: 'payment-submit',
      scenario: 'fallback 快照上的支付提交必须先刷新实时 bootstrap，默认阻断提交。',
      riskLevel: 'high',
      bootstrapState: 'readonly-fallback',
      nextStep: 'REFRESH',
      submitState: 'blocked',
      requestEndpoint: '/api/v1/app/payments/submit'
    }
  ],
  runtimeHandoffExamples: [
    {
      surface: 'miniapp',
      action: 'booking-submit',
      scenario: '预约提交已进入 handler follow-up，后续通过 callback receipt 与 replay 继续闭环。',
      ticketType: 'HANDLER_CALLBACK',
      ticketStatus: 'ready-for-handler',
      handlerName: 'miniapp-booking-submit-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/storefront/handlers/miniapp-booking-submit-handler/sync',
      callbackStatus: 'awaiting-callback',
      callbackEndpoint: '/api/v1/storefront/handlers/miniapp-booking-submit-handler/callbacks/MINIAPP-BOOKING-SUBMIT-PROCEED',
      replayStatus: 'replay-scheduled',
      replayEndpoint: '/api/v1/storefront/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/replay',
      retryEscalationAction: 'WAIT_CALLBACK'
    },
    {
      surface: 'app',
      action: 'payment-submit',
      scenario: '支付挑战未完成时保留 challenge gate，callback 不落最终结果，重放前必须刷新 ticket。',
      ticketType: 'CHALLENGE_GATE',
      ticketStatus: 'pending-challenge',
      handlerName: 'native-payment-submit-handler',
      syncMode: 'challenge-gated',
      syncEndpoint: '/api/v1/app/handlers/native-payment-submit-handler/sync',
      callbackStatus: 'callback-blocked',
      callbackEndpoint: '/api/v1/app/handlers/native-payment-submit-handler/callbacks/APP-PAYMENT-SUBMIT-CHALLENGE',
      replayStatus: 'replay-blocked',
      replayEndpoint: '/api/v1/app/actions/APP-PAYMENT-SUBMIT-CHALLENGE/replay',
      retryEscalationAction: 'REFRESH_TICKET'
    }
  ],
  runtimeReceiptExamples: [
    {
      surface: 'miniapp',
      action: 'booking-submit',
      scenario: '小程序 booking-submit 优先走 runtime governance submit API，成功后直接拿到可回放 receipt。',
      mode: 'api-first-submit',
      receiptState: 'submitted',
      generatedAtSource: 'api',
      requestEndpoint: '/api/v1/storefront/bookings',
      runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
      callbackStatus: 'awaiting-callback',
      replayable: true,
      rateLimitScopeKey: 'miniapp:booking-submit:tenant-demo',
      latestEventType: 'runtime-governance.action.submitted'
    },
    {
      surface: 'miniapp',
      action: 'booking-submit',
      scenario: '小程序离线 fallback 下 replay receipt 会转成本地 replay-scheduled，并把 generatedAt 收口为 local-fallback。',
      mode: 'fallback-replay',
      receiptState: 'replay-scheduled',
      generatedAtSource: 'local-fallback',
      requestEndpoint: '/api/v1/storefront/bookings',
      runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-001/replay',
      callbackStatus: 'awaiting-callback',
      replayable: true,
      rateLimitScopeKey: 'miniapp:booking-submit:tenant-demo',
      latestEventType: 'runtime-governance.receipt.replay.scheduled'
    },
    {
      surface: 'app',
      action: 'member-login',
      scenario: 'App member-login 优先走 runtime governance submit API，返回 submitted receipt 与回放能力。',
      mode: 'api-first-submit',
      receiptState: 'submitted',
      generatedAtSource: 'api',
      requestEndpoint: '/api/v1/app/member/session',
      runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
      callbackStatus: 'awaiting-callback',
      replayable: true,
      rateLimitScopeKey: 'app:member-login:tenant-demo',
      latestEventType: 'runtime-governance.action.submitted'
    }
  ],
  governanceAlertLifecycleExamples: [
    {
      surface: 'miniapp',
      alertCode: 'observability-degradation',
      stage: 'drilldown',
      scenario: '门户 observability 告警会先进入 drilldown 查看 callbackBaseUrl、apiBaseUrl 与当前网络摘要。',
      endpoint: '/foundation/overview/alerts/observability-degradation/drilldown',
      latestHistoryAction: 'ACK',
      acknowledgementStatus: null,
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
    },
    {
      surface: 'miniapp',
      alertCode: 'observability-degradation',
      stage: 'ack',
      scenario: '移动端运营确认告警后会回写 ACKED 状态，但仍保留 overview 可见性。',
      endpoint: '/foundation/overview/alerts/observability-degradation/ack',
      latestHistoryAction: 'ACK',
      acknowledgementStatus: 'ACKED',
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'MUTE']
    },
    {
      surface: 'miniapp',
      alertCode: 'observability-degradation',
      stage: 'mute',
      scenario: '确认短时网络波动后可静默 observability 告警，并从 overview 临时隐藏。',
      endpoint: '/foundation/overview/alerts/observability-degradation/mute',
      latestHistoryAction: 'MUTE',
      acknowledgementStatus: 'MUTED',
      visibleInOverview: false,
      availableActions: ['UNMUTE']
    },
    {
      surface: 'miniapp',
      alertCode: 'observability-degradation',
      stage: 'unmute',
      scenario: '网络恢复后取消静默，恢复 drilldown、ack、mute 操作。',
      endpoint: '/foundation/overview/alerts/observability-degradation/unmute',
      latestHistoryAction: 'UNMUTE',
      acknowledgementStatus: null,
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
    }
  ]
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function buildHeaders(options: ApiClientOptions, headers?: HeadersInit) {
  return {
    ...(options.tenantId ? { 'x-tenant-id': options.tenantId } : {}),
    ...(options.brandId ? { 'x-brand-id': options.brandId } : {}),
    ...(options.storeId ? { 'x-store-id': options.storeId } : {}),
    ...(options.marketCode ? { 'x-market-code': options.marketCode } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers ?? {}),
    ...(headers ?? {})
  };
}

export function buildActorHeaders(options: ActorHeaderOptions): Record<string, string> {
  const roles = Array.from(new Set((options.roles ?? []).map((item) => item.trim()).filter(Boolean)));
  const permissions = Array.from(
    new Set((options.permissions ?? []).map((item) => item.trim()).filter(Boolean)),
  );

  return {
    'x-actor-id': options.actorId,
    ...(options.actorType ? { 'x-actor-type': options.actorType } : {}),
    ...(options.actorName ? { 'x-actor-name': options.actorName } : {}),
    ...(options.tenantId ? { 'x-actor-tenant-id': options.tenantId } : {}),
    ...(options.brandId ? { 'x-actor-brand-id': options.brandId } : {}),
    ...(options.storeId ? { 'x-actor-store-id': options.storeId } : {}),
    ...(roles.length > 0
      ? {
          'x-actor-roles': roles.join(','),
          'x-roles': roles.join(','),
        }
      : {}),
    ...(permissions.length > 0
      ? {
          'x-actor-permissions': permissions.join(','),
          'x-permissions': permissions.join(','),
        }
      : {}),
    ...(options.authenticated !== undefined
      ? { 'x-actor-authenticated': String(options.authenticated) }
      : {}),
  };
}

export function getDefaultApiBaseUrl() {
  return process.env.M5_API_BASE_URL ?? process.env.NEXT_PUBLIC_M5_API_BASE_URL ?? 'http://localhost:3001/api/v1';
}

export function createFoundationAlertClient(options: Omit<ApiClientOptions, 'baseUrl'> & { baseUrl?: string }) {
  return new ApiClient({
    ...options,
    baseUrl: options.baseUrl ?? getDefaultApiBaseUrl()
  });
}

export interface CreateFoundationAlertPanelClientAccessOptions
  extends Omit<ApiClientOptions, 'baseUrl'>,
    CreateFoundationAlertMutationExecutorOptions {
  baseUrl?: string;
  drilldownInit?: RequestInit;
}

export type WebFoundationAlertPanelApp = 'admin-web' | 'tob-web' | 'storefront-web';

export interface CreateWebFoundationAlertPanelClientAccessOptions
  extends Omit<CreateFoundationAlertPanelClientAccessOptions, 'ackNote' | 'muteNote' | 'unmuteNote'> {
  app: WebFoundationAlertPanelApp;
}

export interface CreateFoundationAlertMutationExecutorOptions {
  ackNote: string;
  muteNote: string;
  unmuteNote: string;
  muteDurationMs?: number;
  acknowledgeInit?: RequestInit;
  muteInit?: RequestInit;
  unmuteInit?: RequestInit;
}

export function createFoundationAlertMutationExecutor(
  client: Pick<ApiClient, 'acknowledgeFoundationAlert' | 'muteFoundationAlert' | 'unmuteFoundationAlert'>,
  options: CreateFoundationAlertMutationExecutorOptions
) {
  return async (action: FoundationAlertMutationKind, code: string): Promise<FoundationAlertMutationResponse> => {
    if (action === 'ACK') {
      return client.acknowledgeFoundationAlert(code, { note: options.ackNote }, options.acknowledgeInit);
    }

    if (action === 'MUTE') {
      return client.muteFoundationAlert(
        code,
        {
          note: options.muteNote,
          mutedUntil: new Date(Date.now() + (options.muteDurationMs ?? 2 * 60 * 60 * 1000)).toISOString()
        },
        options.muteInit
      );
    }

    return client.unmuteFoundationAlert(code, { note: options.unmuteNote }, options.unmuteInit);
  };
}

export function createFoundationAlertPanelClientAccess(options: CreateFoundationAlertPanelClientAccessOptions) {
  const {
    drilldownInit,
    ackNote,
    muteNote,
    unmuteNote,
    muteDurationMs,
    acknowledgeInit,
    muteInit,
    unmuteInit,
    ...clientOptions
  } = options;
  const client = createFoundationAlertClient(clientOptions);
  const executeMutation = createFoundationAlertMutationExecutor(client, {
    ackNote,
    muteNote,
    unmuteNote,
    muteDurationMs,
    acknowledgeInit,
    muteInit,
    unmuteInit
  });

  return {
    client,
    loadDrilldown: (code: string) => client.getFoundationAlertDrilldown(code, drilldownInit),
    executeMutation,
    ackAlert: async (code: string) => {
      await executeMutation('ACK', code);
    },
    muteAlert: async (code: string) => {
      await executeMutation('MUTE', code);
    },
    unmuteAlert: async (code: string) => {
      await executeMutation('UNMUTE', code);
    }
  };
}

const webFoundationAlertPanelMutationPresets: Record<
  WebFoundationAlertPanelApp,
  {
    ackNote: string;
    muteNote: string;
    unmuteNote: string;
    muteInit?: RequestInit;
  }
> = {
  'admin-web': {
    ackNote: 'admin web auto triage',
    muteNote: 'admin web temporary mute',
    unmuteNote: 'admin web restore visibility',
    muteInit: { cache: 'no-store' }
  },
  'tob-web': {
    ackNote: 'tob web auto triage',
    muteNote: 'tob web temporary mute',
    unmuteNote: 'tob web restore visibility'
  },
  'storefront-web': {
    ackNote: 'storefront web auto triage',
    muteNote: 'storefront web temporary mute',
    unmuteNote: 'storefront web restore visibility'
  }
};

export function createWebFoundationAlertPanelClientAccess({
  app,
  drilldownInit,
  muteInit,
  ...options
}: CreateWebFoundationAlertPanelClientAccessOptions) {
  const preset = webFoundationAlertPanelMutationPresets[app];

  return createFoundationAlertPanelClientAccess({
    ...options,
    ackNote: preset.ackNote,
    muteNote: preset.muteNote,
    unmuteNote: preset.unmuteNote,
    drilldownInit: drilldownInit ?? { cache: 'no-store' },
    muteInit: muteInit ?? preset.muteInit
  });
}

export async function loadFoundationConsumerDescriptor(
  client: Pick<ApiClient, 'getFoundationConsumer'>,
  consumer: FoundationConsumerKey,
  init: RequestInit = { cache: 'no-store' }
): Promise<FoundationConsumerDescriptor | null> {
  try {
    const descriptor = await client.getFoundationConsumer(consumer, init);
    return 'consumer' in descriptor && descriptor.consumer === consumer ? descriptor : null;
  } catch {
    return null;
  }
}

export async function loadFoundationGovernanceReadModel(
  client: Pick<ApiClient, 'getFoundationAlertCatalog' | 'getFoundationOverview'>,
  init: RequestInit = { cache: 'no-store' }
): Promise<FoundationGovernanceReadModel> {
  const fallbackGeneratedAt = new Date().toISOString();
  const [governanceCatalog, governanceOverview] = await Promise.all([
    client.getFoundationAlertCatalog(init).catch(() => null),
    client.getFoundationOverview(init).catch(() => null)
  ]);

  if (!governanceCatalog && !governanceOverview) {
    return {
      deliveryMode: 'fallback',
      generatedAt: fallbackGeneratedAt,
      alerts: foundationAlertCatalogFallback,
      summary: emptyFoundationGovernanceOverviewSummary,
      overviewAlerts: [],
      topRisks: []
    };
  }

  return {
    deliveryMode: governanceCatalog && governanceOverview ? 'api' : 'fallback',
    generatedAt: governanceOverview?.generatedAt ?? governanceCatalog?.generatedAt ?? fallbackGeneratedAt,
    alerts: governanceCatalog?.alerts ?? foundationAlertCatalogFallback,
    summary: governanceOverview?.summary ?? emptyFoundationGovernanceOverviewSummary,
    overviewAlerts: governanceOverview?.alerts ?? [],
    topRisks: governanceOverview?.topRisks ?? []
  };
}

/**
 * P0-J4: 统一 API 错误类型, 透传后端 i18nKey/code/status
 * 前端可基于 i18nKey 走 i18next, code 走业务分流, status 走 HTTP 兜底
 */
export class ApiError extends Error {
  public readonly code?: string
  public readonly i18nKey?: string

  constructor(
    public readonly status: number,
    message: string,
    code?: string,
    i18nKey?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.i18nKey = i18nKey
  }
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private buildPathWithQuery(path: string, query?: Record<string, string | undefined>) {
    if (!query) {
      return path;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string' && value.length > 0) {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    const response = await fetch(`${normalizeBaseUrl(this.options.baseUrl)}${normalizePath(path)}`, {
      ...init,
      headers: buildHeaders(this.options, init.headers)
    });

    if (!response.ok) {
      // P0-J4 修复: 透传错误体 (含 i18nKey/code/message), 前端可做 i18n 友好化
      // 而非仅抛 'Request failed with status 403' 黑盒
      const errorBody = (await response.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
        i18nKey?: string;
        statusCode?: number;
      }
      throw new ApiError(
        response.status,
        errorBody.message ?? `Request failed with status ${response.status}`,
        errorBody.code,
        errorBody.i18nKey,
      )
    }

    return (await response.json()) as ApiResult<T>;
  }

  async get<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'GET'
    });
  }

  async getData<T>(path: string, init: RequestInit = {}): Promise<T> {
    const result = await this.get<T>(path, init);
    return result.data;
  }

  async postData<T>(path: string, body: unknown, init: RequestInit = {}) {
    const result = await this.request<T>(path, {
      ...init,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {})
      },
      body: JSON.stringify(body)
    });
    return result.data;
  }

  async putData<T>(path: string, body: unknown, init: RequestInit = {}) {
    const result = await this.request<T>(path, {
      ...init,
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {})
      },
      body: JSON.stringify(body)
    });
    return result.data;
  }

  async patchData<T>(path: string, body: unknown, init: RequestInit = {}) {
    const result = await this.request<T>(path, {
      ...init,
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {})
      },
      body: JSON.stringify(body)
    });
    return result.data;
  }

  async deleteData<T>(path: string, init: RequestInit = {}) {
    const result = await this.request<T>(path, {
      ...init,
      method: 'DELETE'
    });
    return result.data;
  }

  async getMarketBootstrap(init: RequestInit = {}) {
    return this.getData<MarketBootstrapResponse>('/markets/bootstrap', init);
  }

  async getFoundationBootstrap(init: RequestInit = {}) {
    return this.getData<FoundationBootstrapResponse>('/foundation/bootstrap', init);
  }

  async getPortalBootstrap(init: RequestInit = {}) {
    return this.getData<PortalBootstrapResponse>('/portals/bootstrap', init);
  }

  async getPortalDomainGovernanceSummary(init: RequestInit = {}) {
    return this.getData<PortalDomainGovernanceSummaryContract>('/portals/domain-governance', init);
  }

  async getWorkbenchBootstrap(init: RequestInit = {}) {
    return this.getData<WorkbenchBootstrapResponse>('/workbenches/bootstrap', init);
  }

  async listAuditRecords(query: AuditTrailQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/trust-governance/audit', {
      tenantId: query.tenantId,
      action: query.action,
      source: query.source,
      requestId: query.requestId,
      actorId: query.actorId,
      approvalTicket: query.approvalTicket,
      purpose: query.purpose,
      riskLevel: query.riskLevel,
      from: query.from,
      to: query.to
    });
    return this.getData<AuditRecordContract[]>(path, init);
  }

  async summarizeAuditRecords(query: AuditTrailQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/trust-governance/audit/summary', {
      tenantId: query.tenantId,
      action: query.action,
      source: query.source,
      requestId: query.requestId,
      actorId: query.actorId,
      approvalTicket: query.approvalTicket,
      riskLevel: query.riskLevel,
      from: query.from,
      to: query.to
    });
    return this.getData<AuditTrailSummary>(path, init);
  }

  async getAuditTrail(query: AuditTrailQuery = {}, init: RequestInit = {}) {
    const [records, summary] = await Promise.all([
      this.listAuditRecords(query, init),
      this.summarizeAuditRecords(query, init).catch(() => undefined)
    ]);
    const trail: AuditTrailResponse = {
      records: records ?? [],
      total: records?.length ?? 0,
      query
    };
    return {
      ...trail,
      summary
    } satisfies AuditTrailResponse & { summary?: AuditTrailSummary };
  }

  async getConfigurationGovernanceOverview(query: ConfigurationOverviewQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/configuration-governance/overview', {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData<ConfigurationOverview>(path, init);
  }

  async listConfigurationFeatureFlags(query: ConfigurationOverviewQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/configuration-governance/feature-flag-records', {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData<ConfigurationFeatureFlag[]>(path, init);
  }

  async listConfigurationConfigEntries(query: {
    namespace?: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
  } = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/configuration-governance/config-entries', {
      namespace: query.namespace,
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId
    });
    return this.getData<ConfigurationConfigEntry[]>(path, init);
  }

  async listConfigurationSecrets(init: RequestInit = {}) {
    return this.getData<ConfigurationSecretMetadata[]>('/foundation/configuration-governance/secrets', init);
  }

  async listConfigurationCertificates(init: RequestInit = {}) {
    return this.getData<ConfigurationCertificateMetadata[]>('/foundation/configuration-governance/certificates', init);
  }

  async getConfigurationManagementMetadata(init: RequestInit = {}) {
    return this.getData<ConfigurationGovernanceMetadataEntry[]>(
      '/foundation/configuration-governance/management-metadata',
      init
    );
  }

  async getConfigurationGovernanceSnapshot(query: ConfigurationOverviewQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/configuration-governance/snapshot', {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData<{
      snapshotId: string;
      generatedAt: string;
      scopeChain: ConfigurationOverview['scopeChain'];
      context: ConfigurationOverview['scopeChain'];
      config: Record<string, unknown>;
      featureFlags: ConfigurationFeatureFlag[];
      secrets: ConfigurationSecretMetadata[];
      checksum: string;
    }>(path, init);
  }

  async getResilienceOperationsOverview(init: RequestInit = {}) {
    return this.getData<ResilienceOverview>('/foundation/resilience-operations/overview', init);
  }

  async listObservabilitySignals(query: { status?: string } = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/resilience-operations/observability', {
      status: query.status
    });
    return this.getData<ObservabilitySignalContract[]>(path, init);
  }

  async listResilienceRetryPolicies(query: { capability?: string } = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/resilience-operations/retry-policies', {
      capability: query.capability
    });
    return this.getData<RetryPolicyContract[]>(path, init);
  }

  async listResilienceRecoveryPlans(query: { status?: string } = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/resilience-operations/recovery-plans', {
      status: query.status
    });
    return this.getData<RecoveryPlanContract[]>(path, init);
  }

  async describeResilienceRecoveryPlan(resource: string, init: RequestInit = {}) {
    return this.getData<{
      status: 'ready' | 'attention';
      resource: string;
      baseline: string[];
      plan: RecoveryPlanContract | null;
    }>(`/foundation/resilience-operations/recovery-plans/${encodeURIComponent(resource)}`, init);
  }

  async stageResilienceEdgeReplay(body: EdgeReplayStageRequest, init: RequestInit = {}) {
    return this.postData<EdgeReplayStageContract>(
      '/foundation/resilience-operations/edge-replay/stage',
      body,
      init
    );
  }

  async listRateLimitPolicies(query: RateLimitWorkspaceQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/trust-governance/rate-limit/policies', {
      tenantId: query.tenantId,
      code: query.policyCode
    });
    return this.getData<RateLimitPolicyRecord[]>(path, init);
  }

  async listQuotaLedgers(query: RateLimitWorkspaceQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/trust-governance/rate-limit/ledgers', {
      tenantId: query.tenantId,
      policyCode: query.policyCode,
      subjectKey: query.subjectKey
    });
    return this.getData<QuotaLedgerRecord[]>(path, init);
  }

  async getRateLimitWorkspace(query: RateLimitWorkspaceQuery = {}, init: RequestInit = {}) {
    const [policies, ledgers] = await Promise.all([
      this.listRateLimitPolicies(query, init),
      this.listQuotaLedgers(query, init).catch(() => [])
    ]);
    const totals = {
      policies: policies?.length ?? 0,
      activePolicies: policies?.filter((policy) => (policy.limit ?? 0) > 0).length ?? 0,
      ledgers: ledgers?.length ?? 0,
      blockedLedgers: 0,
      highConsumptionLedgers: 0
    };
    const byPeriod: Record<string, number> = {};
    const byScope: Record<string, number> = {};
    for (const policy of policies ?? []) {
      const period = String(policy.period ?? 'unknown');
      byPeriod[period] = (byPeriod[period] ?? 0) + 1;
      const scope = String(policy.scopeType ?? 'unknown');
      byScope[scope] = (byScope[scope] ?? 0) + 1;
    }
    for (const ledger of ledgers ?? []) {
      const remaining = ledger.remaining ?? 0;
      if (ledger.metadata?.blockedUntil && Date.parse(String(ledger.metadata.blockedUntil)) > Date.now()) {
        totals.blockedLedgers += 1;
      }
      if (ledger.policy.limit > 0 && remaining > 0 && remaining / ledger.policy.limit < 0.2) {
        totals.highConsumptionLedgers += 1;
      }
    }
    const workspace: RateLimitWorkspace = {
      generatedAt: new Date().toISOString(),
      totals,
      policies: policies ?? [],
      ledgers: ledgers ?? [],
      byPeriod,
      byScope
    };
    return workspace;
  }

  async getIdentityAccessContext(query: IdentityAccessWorkspaceQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/identity-access/context', {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData<IdentityAccessResolvedContext>(path, init);
  }

  async validateIdentityRole(query: IdentityAccessWorkspaceQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/identity-access/validate/role', {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData<IdentityAccessValidationResult>(path, init);
  }

  async validateIdentityPermission(query: IdentityAccessWorkspaceQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/identity-access/validate/permission', {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData<IdentityAccessValidationResult>(path, init);
  }

  async validateIdentityTenantScope(
    targetTenantId: string,
    query: IdentityAccessWorkspaceQuery = {},
    init: RequestInit = {}
  ) {
    const path = this.buildPathWithQuery(`/identity-access/validate/tenant/${encodeURIComponent(targetTenantId)}`, {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData<IdentityAccessValidationResult>(path, init);
  }

  async listIntegrationWebhookSources(init: RequestInit = {}) {
    return this.getData<IntegrationWebhookSourceContract[]>(
      '/foundation/integration-orchestration/webhooks/sources',
      init
    );
  }

  async listIntegrationEventEnvelopes(query: IntegrationOrchestrationWorkspaceQuery = {}, init: RequestInit = {}) {
    const path = this.buildPathWithQuery('/foundation/integration-orchestration/events', {
      source: query.source
    });
    return this.getData<IntegrationEventEnvelopeContract[]>(path, init);
  }

  async listIntegrationIdempotencyRecords(
    query: IntegrationOrchestrationWorkspaceQuery = {},
    init: RequestInit = {}
  ) {
    const path = this.buildPathWithQuery('/foundation/integration-orchestration/idempotency-records', {
      source: query.source
    });
    return this.getData<IntegrationIdempotencyRecordContract[]>(path, init);
  }

  async publishIntegrationEvent(body: IntegrationPublishEventRequest, init: RequestInit = {}) {
    return this.postData<IntegrationPublishEventResponse>(
      '/foundation/integration-orchestration/events',
      body,
      init
    );
  }

  async ingestIntegrationWebhook(
    source: string,
    body: IntegrationWebhookIngestRequest,
    init: RequestInit = {}
  ) {
    return this.postData<IntegrationWebhookIngestResponse>(
      `/foundation/integration-orchestration/webhooks/${encodeURIComponent(source)}/ingest`,
      body,
      init
    );
  }

  async getIntegrationOrchestrationWorkspace(
    query: IntegrationOrchestrationWorkspaceQuery = {},
    init: RequestInit = {}
  ) {
    const [sources, events, idempotencyRecords] = await Promise.all([
      this.listIntegrationWebhookSources(init),
      this.listIntegrationEventEnvelopes(query, init),
      this.listIntegrationIdempotencyRecords(query, init)
    ]);
    const uniqueEventSources = new Set(events.map((item) => item.source)).size;
    const duplicateSensitiveRecords = idempotencyRecords.filter(
      (item) => item.key.startsWith('lyt:') || item.key.startsWith('payment:')
    ).length;
    const workspace: IntegrationOrchestrationWorkspace = {
      generatedAt: new Date().toISOString(),
      sources,
      events,
      idempotencyRecords,
      summary: {
        sources: sources.length,
        events: events.length,
        idempotencyRecords: idempotencyRecords.length,
        uniqueEventSources,
        duplicateSensitiveRecords
      }
    };
    return workspace;
  }

  async getFoundationConsumer(consumer: string, init: RequestInit = {}) {
    return this.getData<FoundationConsumerDescriptor | { availableConsumers: string[] }>(
      `/foundation/consumers/${consumer}`,
      init
    );
  }

  async getFoundationModuleDetail(moduleKey: string, init: RequestInit = {}) {
    return this.getData<{
      generatedAt: string;
      moduleKey: string;
      health?: {
        module: string;
        score: number;
        status: 'healthy' | 'warning' | 'critical';
        indicators: {
          highRiskAudits: number;
          pendingApprovals: number;
          executionFailures: number;
          blockedCount: number;
        };
      };
      detail?: unknown;
      availableModuleKeys?: string[];
    }>(`/foundation/overview/modules/${encodeURIComponent(moduleKey)}`, init);
  }

  async getFoundationAlertCatalog(init: RequestInit = {}) {
    return this.getData<FoundationAlertCatalogResponse>('/foundation/overview/alerts/catalog', init);
  }

  async getFoundationOverview(init: RequestInit = {}, runtimeFilter?: RuntimeGovernanceOverviewFilter) {
    return this.getData<FoundationOperationsOverviewResponse>(
      this.buildPathWithQuery('/foundation/overview', {
        runtimeFocus: runtimeFilter?.focus,
        runtimeState: runtimeFilter?.state,
        runtimeCallbackStatus: runtimeFilter?.callbackStatus,
        runtimeRiskLevel: runtimeFilter?.riskLevel,
        runtimeReplayable:
          typeof runtimeFilter?.replayable === 'boolean' ? String(runtimeFilter.replayable) : undefined,
        runtimeStalledOnly:
          typeof runtimeFilter?.stalledOnly === 'boolean' ? String(runtimeFilter.stalledOnly) : undefined
      }),
      init
    );
  }

  async getFoundationAlertDrilldown(code: string, init: RequestInit = {}) {
    return this.getData<FoundationAlertDrilldownResponse>(`/foundation/overview/alerts/${code}/drilldown`, init);
  }

  async getLytStoreCapabilityAccessView(storeId: string, init: RequestInit = {}) {
    return this.getData<LytStoreCapabilityAccessViewResponse>(`/lyt/connection/${storeId}/access-view`, init);
  }

  async acknowledgeFoundationAlert(code: string, body: { note?: string } = {}, init: RequestInit = {}) {
    return this.postData<FoundationAlertMutationResponse>(`/foundation/overview/alerts/${code}/ack`, body, init);
  }

  async muteFoundationAlert(
    code: string,
    body: { mutedUntil?: string; note?: string } = {},
    init: RequestInit = {}
  ) {
    return this.postData<FoundationAlertMutationResponse>(`/foundation/overview/alerts/${code}/mute`, body, init);
  }

  async unmuteFoundationAlert(code: string, body: { note?: string } = {}, init: RequestInit = {}) {
    return this.postData<FoundationAlertMutationResponse>(`/foundation/overview/alerts/${code}/unmute`, body, init);
  }

  async submitRuntimeGovernanceAction(body: RuntimeGovernanceSubmitRequest, init: RequestInit = {}) {
    return this.postData<RuntimeGovernanceReceipt>('/foundation/runtime-governance/actions', body, init);
  }

  async getRuntimeGovernanceReceipt(receiptCode: string, init: RequestInit = {}) {
    return this.getData<RuntimeGovernanceReceipt>(`/foundation/runtime-governance/actions/${receiptCode}`, init);
  }

  async syncRuntimeGovernanceAction(receiptCode: string, body: RuntimeGovernanceSyncRequest, init: RequestInit = {}) {
    return this.postData<RuntimeGovernanceReceipt>(`/foundation/runtime-governance/actions/${receiptCode}/sync`, body, init);
  }

  async recordRuntimeGovernanceCallback(
    receiptCode: string,
    body: RuntimeGovernanceCallbackRequest,
    init: RequestInit = {}
  ) {
    return this.postData<RuntimeGovernanceReceipt>(`/foundation/runtime-governance/actions/${receiptCode}/callback`, body, init);
  }

  async replayRuntimeGovernanceAction(receiptCode: string, body: RuntimeGovernanceReplayRequest, init: RequestInit = {}) {
    return this.postData<RuntimeGovernanceReceipt>(`/foundation/runtime-governance/actions/${receiptCode}/replay`, body, init);
  }

  async batchReplayRuntimeGovernanceActions(body: RuntimeGovernanceBatchReplayRequest, init: RequestInit = {}) {
    return this.postData<RuntimeGovernanceBatchReplayResponse>(
      '/foundation/runtime-governance/actions/batch-replay',
      body,
      init
    );
  }

  // ── Agent & Knowledge V2 (Phase-23/24 — 后端 entity 镜像) ──

  /** 列出所有 Agent 配置 */
  async listAgentConfigs(init: RequestInit = {}) {
    return this.getData<AgentConfig[]>('/agent/configs', init);
  }

  /** 获取单个 Agent 配置 */
  async getAgentConfig(id: string, init: RequestInit = {}) {
    return this.getData<AgentConfig>(`/agent/configs/${id}`, init);
  }

  /** 创建 Agent 配置 */
  async createAgentConfig(body: AgentConfig, init: RequestInit = {}) {
    return this.postData<AgentConfig>('/agent/configs', body, init);
  }

  /** 更新 Agent 配置 */
  async updateAgentConfig(id: string, body: Partial<AgentConfig>, init: RequestInit = {}) {
    return this.putData<AgentConfig>(`/agent/configs/${id}`, body, init);
  }

  /** 删除 Agent 配置 */
  async deleteAgentConfig(id: string, init: RequestInit = {}) {
    return this.deleteData<{ deleted: boolean }>(`/agent/configs/${id}`, init);
  }

  /** 创建并运行 Agent 会话 */
  async runAgentSession(body: CreateSessionRequest, init: RequestInit = {}) {
    return this.postData<SessionExecutionResult>('/agent/sessions/run', body, init);
  }

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
  async *runAgentSessionStream(
    body: CreateSessionRequest,
    init: RequestInit = {}
  ): AsyncGenerator<AgentSessionEvent, void, undefined> {
    const url = `${normalizeBaseUrl(this.options.baseUrl)}${normalizePath('/agent/sessions/run-stream')}`;
    const response = await fetch(url, {
      ...init,
      method: 'POST',
      headers: buildHeaders(this.options, init.headers),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Stream request failed with status ${response.status}`);
    }
    if (!response.body) {
      throw new Error('Stream response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 事件以 \n\n 分隔,每块多行 `key: value`
        let sepIdx = buffer.indexOf('\n\n');
        while (sepIdx !== -1) {
          const block = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          const dataLine = block
            .split('\n')
            .find((line) => line.startsWith('data: '));
          if (dataLine) {
            const json = dataLine.slice('data: '.length).trim();
            if (json && json !== '[DONE]') {
              try {
                const event = JSON.parse(json);
                yield event;
              } catch {
                // 忽略解析失败的帧
              }
            }
          }
          sepIdx = buffer.indexOf('\n\n');
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /** 批量运行 Agent */
  async batchRunAgent(body: BatchAgentRequest, init: RequestInit = {}) {
    return this.postData<BatchAgentResponse>('/agent/sessions/batch', body, init);
  }

  /** 列出所有 Agent 会话 */
  async listAgentSessions(init: RequestInit = {}) {
    return this.getData<AgentSession[]>('/agent/sessions', init);
  }

  /** 获取单个 Agent 会话 */
  async getAgentSession(id: string, init: RequestInit = {}) {
    return this.getData<AgentSession>(`/agent/sessions/${id}`, init);
  }

  /** 获取会话执行记录 */
  async getAgentExecution(id: string, init: RequestInit = {}) {
    return this.getData<AgentExecution>(`/agent/sessions/${id}/execution`, init);
  }

  /** 获取会话质量评估 */
  async getSessionEvaluation(id: string, init: RequestInit = {}) {
    return this.getData<QualityEvaluation>(`/agent/sessions/${id}/evaluation`, init);
  }

  /** 列出所有质量评估 */
  async listQualityEvaluations(init: RequestInit = {}) {
    return this.getData<QualityEvaluation[]>('/agent/evaluations', init);
  }

  /** 获取 Agent 统计 */
  async getAgentStats(init: RequestInit = {}) {
    return this.getData<AgentStats>('/agent/stats', init);
  }

  /** 列出可用工具(后端返回 unknown,前端按 ToolDefinition 解读) */
  async listAgentTools(init: RequestInit = {}) {
    return this.getData<unknown[]>('/agent/tools', init);
  }

  // ── Tenant-Config (三级独立配置 · Phase-FP P0 集成) ──

  /**
   * GET /tenant-config
   * 按 level / category / keys 过滤当前级别配置项
   */
  async getTenantConfigs(
    query: { level?: TenantConfigLevel; category?: TenantConfigCategory; keys?: string[] } = {},
    init: RequestInit = {}
  ) {
    const path = this.buildPathWithQuery('/tenant-config', {
      level: query.level,
      category: query.category,
      keys: query.keys && query.keys.length > 0 ? query.keys.join(',') : undefined
    });
    return this.getData<{ workbench: string; level: TenantConfigLevel; items: TenantConfigItem[]; total: number }>(path, init);
  }

  /**
   * GET /tenant-config/:key
   * 查询单个配置 (已脱敏)
   */
  async getTenantConfig(key: string, init: RequestInit = {}) {
    return this.getData<TenantConfigItem | null>(`/tenant-config/${encodeURIComponent(key)}`, init);
  }

  /**
   * GET /tenant-config/workbench/:code
   * 工作台视角 (W-S / W-T / W-B),返回考虑继承的生效配置
   */
  async getTenantWorkbenchConfigs(
    code: TenantConfigWorkbenchCode,
    category?: TenantConfigCategory,
    init: RequestInit = {}
  ) {
    const path = this.buildPathWithQuery(`/tenant-config/workbench/${encodeURIComponent(code)}`, {
      category
    });
    return this.getData<{ workbench: string; items: TenantConfigEffective[]; total: number }>(path, init);
  }

  /**
   * GET /tenant-config/meta/definitions
   * 获取所有配置项静态定义 (前端 UI 用)
   */
  async getTenantConfigMeta(init: RequestInit = {}) {
    return this.getData<{ items: TenantConfigItemDefinition[]; total: number }>(
      '/tenant-config/meta/definitions',
      init
    );
  }

  /**
   * POST /tenant-config/batch
   * 批量设置配置 (返回值会带回最新 version)
   */
  async setTenantConfigBatch(items: TenantConfigBatchInput[], init: RequestInit = {}) {
    return this.postData<{ items: TenantConfigItem[]; total: number }>(
      '/tenant-config/batch',
      { items },
      init
    );
  }

  /**
   * POST /tenant-config/rollback
   * 回滚配置到指定版本
   */
  async rollbackTenantConfig(targetVersion: number, configId: string, init: RequestInit = {}) {
    return this.postData<TenantConfigItem>(
      '/tenant-config/rollback',
      { targetVersion, configId },
      init
    );
  }

  /**
   * 列出租户级配置变更审计日志
   *
   * 端点约定: GET /tenant-config/audit-logs?tenantId=...&limit=...
   * (当前后端 service.listAuditLogs 已存在,本方法为前端 SDK 入口;若后端尚未暴露
   * 该 endpoint,会收到 404 并由调用方 try/catch 处理空态。)
   */
  async listTenantConfigAuditLogs(
    tenantId: string,
    limit: number = 100,
    init: RequestInit = {}
  ) {
    const path = this.buildPathWithQuery('/tenant-config/audit-logs', {
      tenantId,
      limit: String(limit)
    });
    return this.getData<TenantConfigAuditLog[]>(path, init);
  }
}

// ── Phase-32: Stream 重连 + Last-Event-ID 续传 ──

/** SSE 订阅状态 */
export type SseSubscribeStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

/** SSE 订阅选项 (Phase-32 扩展) */
export interface SseSubscribeOptions {
  /** Agent 会话请求 */
  body: CreateSessionRequest
  /** 每条事件回调 */
  onEvent: (event: AgentSessionEvent, meta: { id: number; raw: string }) => void
  /** 错误回调 (网络断 / 重试耗尽 / 410) */
  onError?: (err: Error, context: { attempts: number; willRetry: boolean }) => void
  /** 状态变化回调 */
  onStatusChange?: (status: SseSubscribeStatus) => void
  /** 重连配置 */
  reconnect?: {
    /** 是否启用,默认 true */
    enabled?: boolean
    /** 最大重试次数,默认 3 */
    maxRetries?: number
    /** 初始延迟 ms,默认 1000 */
    initialDelayMs?: number
    /** 退避倍数,默认 2 (1s → 2s → 4s) */
    backoffMultiplier?: number
  }
  /** 外部注入的最后事件 id (用于断连后 resume) */
  initialLastEventId?: string
}

/** SSE 订阅句柄 */
export interface SseSubscription {
  /** 主动取消订阅 */
  unsubscribe: () => void
  /** 当前状态 */
  getStatus: () => SseSubscribeStatus
  /** 最近收到的事件 id (用于下次 resume) */
  getLastEventId: () => string | undefined
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
export function subscribeStream(
  client: ApiClient,
  opts: SseSubscribeOptions
): SseSubscription {
  const reconnectConfig = {
    enabled: opts.reconnect?.enabled ?? true,
    maxRetries: opts.reconnect?.maxRetries ?? 3,
    initialDelayMs: opts.reconnect?.initialDelayMs ?? 1000,
    backoffMultiplier: opts.reconnect?.backoffMultiplier ?? 2
  }

  let status: SseSubscribeStatus = 'connecting'
  let lastEventId: string | undefined = opts.initialLastEventId
  let cancelled = false
  let attempt = 0
  let currentAbort: AbortController | null = null

  function setStatus(next: SseSubscribeStatus) {
    if (status === next) return
    status = next
    opts.onStatusChange?.(next)
  }

  function computeDelay(attemptNum: number): number {
    return reconnectConfig.initialDelayMs * Math.pow(reconnectConfig.backoffMultiplier, attemptNum - 1)
  }

  async function runOnce(signal: AbortSignal): Promise<void> {
    const headers: Record<string, string> = {}
    if (lastEventId) {
      headers['Last-Event-ID'] = lastEventId
    }

    const generator = client.runAgentSessionStream(opts.body, { signal, headers })

    for await (const event of generator) {
      // 事件 id 提取: 从 event 自身的 id 字段 (服务端会在 Phase-32 T145 中注入)
      const evAny = event as AgentSessionEvent & { id?: number }
      if (typeof evAny.id === 'number') {
        lastEventId = String(evAny.id)
      }

      // meta.id 透传给 onEvent,便于客户端去重 / 持久化
      opts.onEvent(event, {
        id: typeof evAny.id === 'number' ? evAny.id : -1,
        raw: JSON.stringify(event)
      })
    }
  }

  async function loop(): Promise<void> {
    while (!cancelled) {
      // 已超过最大重试 → 放弃
      if (attempt > reconnectConfig.maxRetries) {
        setStatus('closed')
        const err = new Error(`SSE reconnect exhausted after ${reconnectConfig.maxRetries} attempts`)
        opts.onError?.(err, { attempts: attempt, willRetry: false })
        return
      }

      // 第 N 次尝试前先 backoff
      if (attempt > 0) {
        if (!reconnectConfig.enabled) {
          setStatus('closed')
          return
        }
        setStatus('reconnecting')
        const delay = computeDelay(attempt)
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, delay)
          if (currentAbort) {
            currentAbort.signal.addEventListener('abort', () => {
              clearTimeout(timer)
              resolve()
            })
          }
        })
        if (cancelled) return
      }

      // 执行一次
      attempt += 1
      currentAbort = new AbortController()
      try {
        setStatus(attempt === 1 ? 'connecting' : 'reconnecting')
        await runOnce(currentAbort.signal)
        // 正常完成 (服务端 complete)
        setStatus('closed')
        return
      } catch (err) {
        if (cancelled) return

        const error = err instanceof Error ? err : new Error(String(err))
        const isHttp410 = error.message.includes('410')
        const isAbort = error.name === 'AbortError'

        if (isAbort) {
          // 主动取消
          setStatus('closed')
          return
        }

        if (isHttp410) {
          // 事件过期,不再重试
          setStatus('closed')
          opts.onError?.(error, { attempts: attempt, willRetry: false })
          return
        }

        // 网络错误 → 触发重试
        const willRetry = attempt <= reconnectConfig.maxRetries && reconnectConfig.enabled
        opts.onError?.(error, { attempts: attempt, willRetry })

        if (!willRetry) {
          setStatus('closed')
          return
        }
        // 继续循环 → backoff → 重试
      }
    }
  }

  // 异步启动,不阻塞调用方
  void loop()

  return {
    unsubscribe: () => {
      cancelled = true
      currentAbort?.abort()
      setStatus('closed')
    },
    getStatus: () => status,
    getLastEventId: () => lastEventId
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// P1-3: 共享层收口 — Business API 端点 (checkout/cashier/orders/refunds/payments)
// ═══════════════════════════════════════════════════════════════════════════

export interface BusinessOrderListItem {
  orderId: string;
  orderNo: string;
  memberId: string;
  status: string;
  itemCount?: number;
  totalAmount: number;
  paidAmount: number;
  refundedAmount: number;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
  paymentChannel?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface BusinessOrderListPage {
  items: BusinessOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

function buildBusinessOrderListPath(query?: {
  memberId?: string;
  status?: string;
  paymentStatus?: string;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) {
  if (!query) {
    return '/transactions/orders';
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.set(key, String(value));
    }
  });

  const search = params.toString();
  return search ? `/transactions/orders?${search}` : '/transactions/orders';
}

function normalizeBusinessOrderListResponse(
  payload: BusinessOrderListItem[] | BusinessOrderListPage
): BusinessOrderListPage {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      pageSize: payload.length,
    };
  }

  return payload;
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
export function createBusinessClient(baseUrl?: string) {
  const api = new ApiClient({ baseUrl: baseUrl ?? getDefaultApiBaseUrl() });

  return {
    // ── Checkout (POST /api/v1/transactions/checkout) ──
    checkout: {
      /** 发起结账 */
      start: (body: {
        memberId: string;
        items: Array<{ productId: string; quantity: number; unitPriceCents: number }>;
        paymentChannel: string;
        couponCode?: string;
      }, init?: RequestInit) =>
        api.postData<{ orderId: string; transactionId: string; totalCents: number }>('/transactions/checkout', body, init),
    },

    // ── Orders (GET/POST /api/v1/transactions/orders) ──
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
      }, init?: RequestInit) =>
        api.getData<BusinessOrderListItem[] | BusinessOrderListPage>(
          buildBusinessOrderListPath(query),
          init,
        ).then((payload) => normalizeBusinessOrderListResponse(payload).items),

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
      }, init?: RequestInit) =>
        api.getData<BusinessOrderListItem[] | BusinessOrderListPage>(
          buildBusinessOrderListPath(query),
          init,
        ).then((payload) => normalizeBusinessOrderListResponse(payload)),

      /** 订单详情 */
      get: (orderId: string, init?: RequestInit) =>
        api.getData<{
          orderId: string;
          orderNo: string;
          memberId: string;
          status: string;
          totalAmount: number;
          paidAmount: number;
          refundedAmount: number;
          currency: string;
          items?: Array<{ productId: string; productName: string; quantity: number; unitPriceCents: number }>;
          createdAt: string;
          updatedAt: string;
        }>(`/transactions/orders/${orderId}`, init),

      /** 订单退款记录 */
      listRefunds: (orderId: string, init?: RequestInit) =>
        api.getData<Array<{
          refundId: string;
          amount: number;
          reason: string;
          status: string;
          requestedAt: string;
        }>>(`/transactions/orders/${orderId}/refunds`, init),
    },

    // ── Cashier (GET/POST /api/v1/cashier/*) ──
    cashier: {
      /** 会员查找 (手机号/卡号) */
      lookupMember: (query: string, init?: RequestInit) =>
        api.getData<{
          id: string;
          name: string;
          phone: string;
          memberNo: string;
          tier: string;
          points: number;
          discountRate: number;
        } | null>(`/cashier/members/lookup?q=${encodeURIComponent(query)}`, init),

      /** 会员消费记录 (走 transactions 模块) */
      listMemberTransactions: (memberId: string, init?: RequestInit) =>
        api.getData<Array<{
          orderId: string;
          orderNo: string;
          status: string;
          totalAmount: number;
          currency: string;
          paymentStatus?: string;
          createdAt: string;
        }>>(`/transactions/members/${memberId}`, init),

      /** 商品扫码查询 */
      lookupProduct: (sku: string, init?: RequestInit) =>
        api.getData<{ sku: string; name: string; price: number; category: string } | null>(
          `/cashier/products/${encodeURIComponent(sku)}`, init,
        ),

      /** 支付渠道统计 */
      getChannelStats: (init?: RequestInit) =>
        api.getData<Array<{ channel: string; today: number; month: number }>>('/cashier/stats/channels', init),

      /** 创建订单 (POS) */
      createOrder: (body: {
        clientOrderId: string;
        memberId?: string;
        items: Array<{ productId: string; quantity: number; unitPriceCents: number; discountCents?: number }>;
        discountCents?: number;
        taxCents?: number;
      }, init?: RequestInit) =>
        api.postData('/cashier/orders', body, init),

      /** 提交订单 (DRAFT → PENDING) */
      submitOrder: (orderId: string, init?: RequestInit) =>
        api.postData(`/cashier/orders/${orderId}/submit`, {}, init),

      /** 创建支付 */
      createPayment: (orderId: string, body: {
        method: 'CASH' | 'WECHAT' | 'ALIPAY' | 'CARD';
        amountCents: number;
      }, init?: RequestInit) =>
        api.postData(`/cashier/orders/${orderId}/payments`, body, init),

      /** 创建退款 */
      createRefund: (orderId: string, body: {
        paymentId: string;
        amountCents: number;
        reason: string;
      }, init?: RequestInit) =>
        api.postData(`/cashier/orders/${orderId}/refunds`, body, init),
    },

    // ── Refunds (GET/POST /api/v1/transactions/refunds) ──
    refunds: {
      /** 退款列表 */
      list: (query?: {
        memberId?: string;
        orderId?: string;
        status?: string;
        limit?: number;
      }, init?: RequestInit) =>
        api.getData<Array<{
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
        }>>('/transactions/refunds', {
          ...init,
          headers: {
            'content-type': 'application/json',
            ...(init?.headers ?? {}),
          },
          ...(query ? { body: JSON.stringify(query) } : {}),
        }),

      /** 待处理退款 */
      listPending: (query?: { limit?: number }, init?: RequestInit) =>
        api.getData('/transactions/refunds/pending', {
          ...init,
          headers: {
            'content-type': 'application/json',
            ...(init?.headers ?? {}),
          },
        }),

      /** 退款 dashboard */
      getDashboard: (init?: RequestInit) =>
        api.getData('/transactions/refunds/dashboard', init),

      /** 退款详情 */
      get: (refundId: string, init?: RequestInit) =>
        api.getData<{
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
        }>(`/transactions/refunds/${refundId}`, init),

      /** 审批退款 */
      approve: (refundId: string, body: { operator?: string; note?: string }, init?: RequestInit) =>
        api.postData(`/transactions/refunds/${refundId}/approve`, body, init),

      /** 拒绝退款 */
      reject: (refundId: string, body: { operator?: string; note?: string }, init?: RequestInit) =>
        api.postData(`/transactions/refunds/${refundId}/reject`, body, init),
    },

    // ── Payment Gateway (GET/POST /api/v1/payment-gateway) ──
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
      }, init?: RequestInit) =>
        api.postData('/payment-gateway/pay', body, init),

      /** 查询支付结果 */
      queryPayment: (transactionId: string, init?: RequestInit) =>
        api.getData(`/payment-gateway/pay/${transactionId}`, init),

      /** 发起退款 */
      refund: (body: {
        transactionId: string;
        amount: number;
        reason: string;
      }, init?: RequestInit) =>
        api.postData('/payment-gateway/refund', body, init),

      /** 查询退款状态 */
      queryRefund: (refundId: string, init?: RequestInit) =>
        api.getData(`/payment-gateway/refund/${refundId}`, init),
    },

    // ── Budget (GET/POST /api/v1/finance/budgets) ──
    budget: {
      /** 预算列表 */
      list: (query?: {
        tenantId?: string;
        status?: string;
        category?: string;
      }, init?: RequestInit) =>
        api.getData<Array<{
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
        }>>('/finance/budgets', { ...init, headers: { ...(query ? {
          'x-tenant-id': query.tenantId ?? '',
          'x-status': query.status ?? '',
          'x-category': query.category ?? '',
        } : {}), ...(init?.headers ?? {}) } }),

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
      }, init?: RequestInit) =>
        api.postData<{ id: string; version: number }>('/finance/budgets', body, init),

      /** 提交审批 */
      submitForApproval: (id: string, body: {
        idempotencyKey: string;
        version: number;
      }, init?: RequestInit) =>
        api.postData<{ status: string; version: number }>(`/finance/budgets/${id}/submit`, body, init),

      /** 关闭预算 */
      close: (id: string, body: {
        idempotencyKey: string;
        version: number;
      }, init?: RequestInit) =>
        api.postData<{ status: string; version: number }>(`/finance/budgets/${id}/close`, body, init),

      /** 审批请求列表 */
      listApprovals: (query?: {
        budgetId?: string;
        status?: string;
      }, init?: RequestInit) =>
        api.getData<Array<{
          id: string;
          budgetId: string;
          budgetName: string;
          requester: string;
          amountCents: number;
          reason: string;
          status: 'PENDING' | 'APPROVED' | 'REJECTED';
          version: number;
          createdAt: string;
        }>>('/finance/budgets/approvals', { ...init, headers: { ...(query ? {
          'x-budget-id': query.budgetId ?? '',
          'x-status': query.status ?? '',
        } : {}), ...(init?.headers ?? {}) } }),

      /** 批准审批请求 */
      approveApproval: (approvalId: string, body: {
        idempotencyKey: string;
        version: number;
      }, init?: RequestInit) =>
        api.postData<{ status: string; version: number }>(`/finance/budgets/approvals/${approvalId}/approve`, body, init),

      /** 驳回审批请求 */
      rejectApproval: (approvalId: string, body: {
        idempotencyKey: string;
        version: number;
      }, init?: RequestInit) =>
        api.postData<{ status: string; version: number }>(`/finance/budgets/approvals/${approvalId}/reject`, body, init),
    },

    // ── Promotions (GET/POST /api/v1/marketing/promotions) ──
    promotions: {
      /** 促销列表 */
      list: (query?: {
        tenantId?: string;
        storeId?: string;
        status?: string;
      }, init?: RequestInit) =>
        api.getData<Array<{
          id: string;
          name: string;
          type: string;
          discount: string;
          scope: string;
          start: string;
          end: string;
          budget: number;
          used: number;
          status: 'active' | 'scheduled' | 'ended' | 'draft';
          targetGoal?: string;
          version: number;
          createdAt: string;
          updatedAt: string;
        }>>('/marketing/promotions', { ...init, headers: { ...(query ? {
          'x-tenant-id': query.tenantId ?? '',
          'x-store-id': query.storeId ?? '',
          'x-status': query.status ?? '',
        } : {}), ...(init?.headers ?? {}) } }),

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
      }, init?: RequestInit) =>
        api.postData<{ id: string; version: number }>('/marketing/promotions', body, init),

      /** 发布草稿促销 */
      publish: (id: string, body: {
        idempotencyKey: string;
        version: number;
      }, init?: RequestInit) =>
        api.postData<{ status: string; version: number }>(`/marketing/promotions/${id}/publish`, body, init),

      /** 结束促销 */
      end: (id: string, body: {
        idempotencyKey: string;
        version: number;
      }, init?: RequestInit) =>
        api.postData<{ status: string; version: number }>(`/marketing/promotions/${id}/end`, body, init),
    },

    // ── Convenience: 原始 ApiClient 实例 (用于自定义请求) ──
    raw: api,
  };
}

export type BusinessClient = ReturnType<typeof createBusinessClient>;

/** 计算下次 backoff 延迟 (供测试与 UI 共享)
 *  - attemptNum = 1 → initialDelayMs (第一次重试前)
 *  - attemptNum = 2 → initialDelayMs * multiplier
 *  - attemptNum = 0 → initialDelayMs (视为第一次)
 *  - 等价公式: initialDelayMs * multiplier^max(0, attemptNum-1)
 */
export function computeBackoffDelay(
  attemptNum: number,
  initialDelayMs = 1000,
  backoffMultiplier = 2
): number {
  const safeAttempt = Math.max(0, attemptNum - 1)
  return initialDelayMs * Math.pow(backoffMultiplier, safeAttempt)
}
