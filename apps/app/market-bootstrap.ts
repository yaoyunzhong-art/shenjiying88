import {
  ApiClient,
  buildActorHeaders,
  getDefaultApiBaseUrl,
  loadFoundationGovernanceReadModel,
} from '@m5/sdk';
import {
  advanceRuntimeGovernanceReplayPolicy,
  buildDomainGovernanceWorkspaceHref,
  type FoundationAlertDrilldownResponse,
  type FoundationAlertMutationResponse,
  foundationAlertCatalogFallback,
  getFoundationAppBootstrapWiring,
  type AppBootstrapWiring,
  type FoundationAlertCatalogItem,
  type FoundationOperationsAlert,
  type FoundationOperationsOverviewSummary,
  type FoundationFrontendBootstrapState,
  type PortalDomainGovernanceSummaryContract,
  type PortalBootstrapResponse,
  type RuntimeGovernanceReceipt
} from '@m5/types';

export interface NativeAppBootstrapSnapshot {
  deliveryMode: 'api' | 'fallback';
  marketCode: string;
  defaultLanguage: string;
  timezone: string;
  emailProvider: string;
  socialPlatforms: string[];
  primaryDomain: string;
  supportedSurfaces: string[];
  domainSource: string;
  domainGovernance: PortalDomainGovernanceSummaryContract;
  domainGovernanceWorkspaceHref: string;
}

export interface NativeAppBootstrapContext {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export type NativeAppActionKey = 'member-login' | 'device-bind' | 'payment-submit';

export interface NativeAppSession {
  authenticated: boolean;
  memberTier: 'GUEST' | 'MEMBER' | 'SVIP';
  paymentReady: boolean;
  memberId?: string;
  nickname?: string;
}

export interface NativeAppCheckoutItem {
  skuId: string;
  title?: string;
  quantity: number;
  price: number;
}

export interface NativeAppCheckoutPayload {
  memberId: string;
  items: NativeAppCheckoutItem[];
  paymentChannel: string;
  currency?: string;
  amount?: number;
  externalPaymentId?: string;
}

export interface NativeAppPaymentCallbackPayload {
  standardizedEventName: 'cashier.payment-succeeded' | 'cashier.payment-failed';
  aggregateId: string;
  orderId: string;
  paymentId?: string;
  tenantId: string;
  externalPaymentId?: string;
  transactionNo?: string;
  channel?: string;
  amount?: number;
  status?: string;
  paidAt?: string;
  payload?: Record<string, unknown>;
}

export interface NativeAppRefundPayload {
  refundAmount?: number;
  reason: string;
  operator?: string;
}

export interface NativeAppOrderPaymentSubmitPayload {
  amount: number;
  paymentChannel: string;
  externalPaymentId?: string;
  paidAt?: string;
  source?: string;
}

export interface NativeAppTransactionOrderItem {
  skuId: string;
  title?: string;
  quantity: number;
  price: number;
}

export interface NativeAppTransactionOrder {
  orderId: string;
  orderNo: string;
  memberId: string;
  items?: NativeAppTransactionOrderItem[];
  currency: string;
  totalAmount: number;
  status: string;
  latestPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  closedAt?: string;
  closeReason?: string;
}

export interface NativeAppTransactionPayment {
  paymentId: string;
  orderId: string;
  externalPaymentId?: string;
  channel: string;
  amount: number;
  status: string;
  transactionNo?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface NativeAppTransactionRefund {
  refundId: string;
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
}

export interface NativeAppTransactionAggregate {
  order: NativeAppTransactionOrder;
  memberNickname?: string;
  payment?: NativeAppTransactionPayment;
  settlement?: {
    settlementId?: string;
    pointsEarned?: number;
    pointsBalance?: number;
  };
  pointsLedger: Array<Record<string, unknown>>;
  couponRedemptions: Array<Record<string, unknown>>;
  blindboxFulfillments: Array<Record<string, unknown>>;
  refunds: NativeAppTransactionRefund[];
}

export interface NativeAppOrderListItem {
  orderId: string;
  orderNo: string;
  memberId: string;
  status: string;
  itemCount: number;
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

export interface NativeAppOrderListQuery {
  memberId?: string;
  status?: string;
  paymentStatus?: string;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface NativeAppOrderListPage {
  items: NativeAppOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NativeAppTransactionRuntimeSnapshot {
  deliveryMode: 'api' | 'fallback';
  aggregate: NativeAppTransactionAggregate | null;
  checkoutPayload: NativeAppCheckoutPayload;
  paymentCallback?: NativeAppPaymentCallbackPayload;
  refundPayload?: NativeAppRefundPayload;
  note: string;
}

export interface NativeAppActionDecision {
  bootstrapState: FoundationFrontendBootstrapState;
  allowed: boolean;
  title: string;
  helper: string;
  nextStep: 'PROCEED' | 'LOGIN' | 'CHALLENGE' | 'REFRESH';
}

export interface NativeAppLoginDraft {
  marketCode: string;
  memberTier: NativeAppSession['memberTier'];
  authenticated: boolean;
}

export interface NativeAppDeviceBindDraft {
  marketCode: string;
  deviceFingerprint: string;
  memberTier: NativeAppSession['memberTier'];
  paymentReady: boolean;
}

export interface NativeAppPaymentSubmitDraft {
  marketCode: string;
  orderNo: string;
  memberTier: NativeAppSession['memberTier'];
  paymentReady: boolean;
}

export type NativeAppActionDraft = NativeAppLoginDraft | NativeAppDeviceBindDraft | NativeAppPaymentSubmitDraft;

export interface NativeAppActionRequestPreview {
  endpoint: string;
  method: 'POST';
  payload: NativeAppActionDraft;
}

export interface NativeAppActionPlan {
  action: NativeAppActionKey;
  label: string;
  decision: NativeAppActionDecision;
  riskLevel: 'low' | 'medium' | 'high';
  channel:
    | 'NATIVE_LOGIN'
    | 'DEVICE_TRUST'
    | 'PAYMENT_RISK'
    | 'MEMBER_RUNTIME'
    | 'BOOTSTRAP_REFRESH';
  draftSummary: string;
  checklist: string[];
  requestPreview: NativeAppActionRequestPreview;
}

export interface NativeAppSubmitOutcome {
  action: NativeAppActionKey;
  state: 'blocked' | 'challenge-issued' | 'submitted';
  endpoint: string;
  message: string;
  nextStep: NativeAppActionDecision['nextStep'];
  payloadSummary: string;
  receiptCode: string;
  recommendedAction: 'REFRESH_BOOTSTRAP' | 'COMPLETE_LOGIN' | 'COMPLETE_CHALLENGE' | 'FOLLOW_SUBMIT_CALLBACK';
}

export interface NativeAppSubmitHistoryEntry {
  receiptCode: string;
  action: NativeAppActionKey;
  state: NativeAppSubmitOutcome['state'];
  endpoint: string;
  occurredAt: string;
  recommendedAction: NativeAppSubmitOutcome['recommendedAction'];
  summary: string;
}

export interface NativeAppLedgerRecord {
  receiptCode: string;
  ledgerKey: string;
  action: NativeAppActionKey;
  state: NativeAppSubmitOutcome['state'];
  replayEndpoint: string;
  replayable: boolean;
  recommendedAction: NativeAppSubmitOutcome['recommendedAction'];
  summary: string;
}

export interface NativeAppReplayOutcome {
  receiptCode: string;
  status: 'replay-scheduled' | 'replay-blocked' | 'replay-skipped';
  replayEndpoint: string;
  message: string;
}

export interface NativeAppActionTicket {
  receiptCode: string;
  ticketCode: string;
  ticketType: 'BLOCK_GUARD' | 'CHALLENGE_GATE' | 'HANDLER_CALLBACK';
  status: 'waiting-prerequisite' | 'pending-challenge' | 'ready-for-handler';
  summary: string;
}

export interface NativeAppHandlerSyncContract {
  receiptCode: string;
  handlerName: 'native-member-session-handler' | 'native-device-bind-handler' | 'native-payment-submit-handler';
  syncMode: 'deferred' | 'challenge-gated' | 'callback-followup';
  syncEndpoint: string;
  callbackEndpoint: string;
  idempotencyKey: string;
  ticketCode: string;
  ready: boolean;
  summary: string;
}

export interface NativeAppReplayRequest {
  receiptCode: string;
  ledgerKey: string;
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  body: {
    receiptCode: string;
    action: NativeAppActionKey;
    replayMode: 'LEDGER_REPLAY';
    requestedFrom: 'APP_RUNTIME';
    ticketCode: string;
  };
}

export interface NativeAppAuthEnvelope {
  receiptCode: string;
  audience: 'native-app-handler-sync';
  authScheme: 'M5-HMAC-SHA256';
  authorization: string;
  signedHeaders: string[];
  expiresAt: string;
  nonce: string;
}

export interface NativeAppCallbackReceipt {
  receiptCode: string;
  callbackEndpoint: string;
  callbackStatus: 'callback-blocked' | 'awaiting-callback' | 'callback-recorded';
  ackToken: string;
  lastEvent: 'PREREQUISITE_PENDING' | 'CHALLENGE_PENDING' | 'HANDLER_ACCEPTED';
  summary: string;
}

export interface NativeAppReplayRetryPolicy {
  receiptCode: string;
  replayEndpoint: string;
  retryable: boolean;
  maxAttempts: number;
  currentAttempt: number;
  nextBackoffMs: number;
  escalationAction: 'REFRESH_TICKET' | 'WAIT_CALLBACK' | 'OPEN_MANUAL_REVIEW';
  summary: string;
}

export interface NativeAppRuntimeConsumerContract {
  wiring: AppBootstrapWiring;
  snapshot: NativeAppBootstrapSnapshot;
  scope: {
    scopePath: string;
    resolver: string;
    mismatchStrategy: string;
    revalidateOn: string[];
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
  governance: {
    deliveryMode: 'api' | 'fallback';
    generatedAt: string;
    alerts: FoundationAlertCatalogItem[];
    summary: FoundationOperationsOverviewSummary;
    topRisks: FoundationOperationsAlert[];
  };
}

export interface NativeAppGovernanceReadModel {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  alerts: FoundationAlertCatalogItem[];
  summary: FoundationOperationsOverviewSummary;
  topRisks: FoundationOperationsAlert[];
}

const defaultNativeAppContext: Required<NativeAppBootstrapContext> = {
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'us-default'
};

const nativeAppBootstrapActor = {
  actorId: 'native-app-bootstrap-operator',
  actorType: 'employee-user',
  actorName: 'Native App Bootstrap Operator',
  roles: ['OPERATIONS'],
  permissions: [
    'foundation.governance.read',
    'foundation.runtime-governance.read',
    'foundation.runtime-governance.write',
  ],
  authenticated: true,
} as const;

const emptyGovernanceOverviewSummary: FoundationOperationsOverviewSummary = {
  approvalsPending: 0,
  approvalsWithFailures: 0,
  highRiskAudits: 0,
  blockedLedgers: 0,
  runtimeGovernanceBacklog: 0,
  stalledRuntimeCallbacks: 0,
  highRiskRuntimeBacklog: 0,
  runtimeBlockedActions: 0,
  rotationDueSecrets: 0,
  expiredSecrets: 0,
  expiringCertificates: 0,
  expiredCertificates: 0,
  degradedSignals: 0,
  attentionRecoveryPlans: 0,
  staleDrills: 0
};

const nativeAppCheckoutCatalog: NativeAppCheckoutItem[] = [
  {
    skuId: 'app-signature-latte',
    title: 'Signature Latte',
    quantity: 1,
    price: 32
  },
  {
    skuId: 'app-member-dessert',
    title: 'Member Dessert',
    quantity: 1,
    price: 18
  }
];

function createFallbackDomainGovernanceSummary(): PortalDomainGovernanceSummaryContract {
  return {
    totalMissingPrimaryScopes: 0,
    totalActiveWithoutPrimaryDomains: 0,
    recommendedReadyScopes: 0,
    tenantMissingPrimaryScopes: 0,
    brandMissingPrimaryScopes: 0,
    storeMissingPrimaryScopes: 0,
    requiresAttention: false,
    lastEvaluatedAt: '1970-01-01T00:00:00.000Z',
    currentScopes: []
  };
}

export function createNativeAppFallbackSnapshot(
  context: NativeAppBootstrapContext = defaultNativeAppContext
): NativeAppBootstrapSnapshot {
  const resolvedContext = { ...defaultNativeAppContext, ...context };

  return {
    deliveryMode: 'fallback',
    marketCode: resolvedContext.marketCode,
    defaultLanguage: resolvedContext.marketCode === 'cn-mainland' ? 'zh-CN' : 'en-US',
    timezone: resolvedContext.marketCode === 'cn-mainland' ? 'Asia/Shanghai' : 'America/New_York',
    emailProvider: resolvedContext.marketCode === 'cn-mainland' ? 'ALIYUN_DM' : 'SENDGRID',
    socialPlatforms: resolvedContext.marketCode === 'cn-mainland' ? ['WECHAT', 'XIAOHONGSHU'] : ['LINKEDIN', 'INSTAGRAM'],
    primaryDomain: `${resolvedContext.storeId}.${resolvedContext.brandId}.${resolvedContext.tenantId}.${resolvedContext.marketCode}.local`,
    supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
    domainSource: 'default',
    domainGovernance: createFallbackDomainGovernanceSummary(),
    domainGovernanceWorkspaceHref: buildDomainGovernanceWorkspaceHref(
      createFallbackDomainGovernanceSummary(),
      resolvedContext.marketCode,
    ),
  };
}

export function toNativeAppBootstrapSnapshot(
  bootstrap: PortalBootstrapResponse,
  domainGovernance: PortalDomainGovernanceSummaryContract = createFallbackDomainGovernanceSummary()
): NativeAppBootstrapSnapshot {
  return {
    deliveryMode: 'api',
    marketCode: bootstrap.marketProfile.marketCode,
    defaultLanguage: bootstrap.marketProfile.locale.defaultLanguage,
    timezone: bootstrap.marketProfile.timezone.timezone,
    emailProvider: bootstrap.marketProfile.email.provider,
    socialPlatforms: bootstrap.marketProfile.social.primaryPlatforms,
    primaryDomain: bootstrap.storePortal.primaryDomain,
    supportedSurfaces: bootstrap.storePortal.supportedSurfaces,
    domainSource: bootstrap.storePortal.domainSource ?? 'default',
    domainGovernance,
    domainGovernanceWorkspaceHref: buildDomainGovernanceWorkspaceHref(
      domainGovernance,
      bootstrap.marketProfile.marketCode,
    ),
  };
}

function createNativeAppBootstrapClient(context: NativeAppBootstrapContext = defaultNativeAppContext) {
  const resolvedContext = { ...defaultNativeAppContext, ...context };

  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: resolvedContext.tenantId,
    brandId: resolvedContext.brandId,
    storeId: resolvedContext.storeId,
    marketCode: resolvedContext.marketCode,
    headers: buildActorHeaders({
      ...nativeAppBootstrapActor,
      tenantId: resolvedContext.tenantId,
      brandId: resolvedContext.brandId,
      storeId: resolvedContext.storeId,
    })
  });
}

export async function loadNativeAppBootstrapSnapshot(
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<NativeAppBootstrapSnapshot> {
  try {
    const client = createNativeAppBootstrapClient(context);
    const [bootstrap, domainGovernance] = await Promise.all([
      client.getPortalBootstrap(),
      client
        .getPortalDomainGovernanceSummary({ cache: 'no-store' })
        .catch(() => createFallbackDomainGovernanceSummary())
    ]);
    return toNativeAppBootstrapSnapshot(bootstrap, domainGovernance);
  } catch {
    return createNativeAppFallbackSnapshot(context);
  }
}

export const appMarketBootstrap = createNativeAppFallbackSnapshot();

export const nativeAppBootstrap = getFoundationAppBootstrapWiring('app');

export async function refreshNativeAppGovernanceAlerts(
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<{ generatedAt: string; alerts: FoundationAlertCatalogItem[] }> {
  const governance = await loadNativeAppGovernanceReadModel(context);

  return {
    generatedAt: governance.generatedAt,
    alerts: governance.alerts
  };
}

export async function loadNativeAppGovernanceReadModel(
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<NativeAppGovernanceReadModel> {
  const governance = await loadFoundationGovernanceReadModel(createNativeAppBootstrapClient(context));
  return {
    deliveryMode: governance.deliveryMode,
    generatedAt: governance.generatedAt,
    alerts: governance.alerts,
    summary: governance.summary,
    topRisks: governance.topRisks
  };
}

export async function loadNativeAppAlertDrilldown(
  code: FoundationAlertCatalogItem['code'],
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<FoundationAlertDrilldownResponse> {
  try {
    return await createNativeAppBootstrapClient(context).getFoundationAlertDrilldown(code, { cache: 'no-store' });
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      history: [],
      detail: {
        mode: 'fallback',
        summary: `当前无法读取 ${code} 的真实 drilldown，保留目录级别展示。`
      }
    };
  }
}

export async function acknowledgeNativeAppGovernanceAlert(
  code: FoundationAlertCatalogItem['code'],
  note = 'app-acknowledged',
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<FoundationAlertMutationResponse> {
  try {
    return await createNativeAppBootstrapClient(context).acknowledgeFoundationAlert(code, { note });
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      acknowledgement: {
        status: 'ACKED',
        note,
        actorId: 'app-fallback',
        acknowledgedAt: '2026-06-13T00:00:00.000Z',
        mutedUntil: null,
        updatedAt: '2026-06-13T00:00:00.000Z'
      },
      history: [
        {
          action: 'ACK',
          note,
          actorId: 'app-fallback',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:00:00.000Z',
          source: 'app-fallback'
        }
      ]
    };
  }
}

export async function muteNativeAppGovernanceAlert(
  code: FoundationAlertCatalogItem['code'],
  input: { note?: string; mutedUntil?: string } = {},
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<FoundationAlertMutationResponse> {
  const resolvedInput = {
    note: input.note ?? 'app-muted',
    mutedUntil: input.mutedUntil ?? '2026-06-14T00:00:00.000Z'
  };

  try {
    return await createNativeAppBootstrapClient(context).muteFoundationAlert(code, resolvedInput);
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      acknowledgement: {
        status: 'MUTED',
        note: resolvedInput.note,
        actorId: 'app-fallback',
        acknowledgedAt: '2026-06-13T00:00:00.000Z',
        mutedUntil: resolvedInput.mutedUntil,
        updatedAt: '2026-06-13T00:00:00.000Z'
      },
      history: [
        {
          action: 'MUTE',
          note: resolvedInput.note,
          actorId: 'app-fallback',
          mutedUntil: resolvedInput.mutedUntil,
          visibleInOverview: false,
          createdAt: '2026-06-13T00:00:00.000Z',
          source: 'app-fallback'
        }
      ]
    };
  }
}

export async function unmuteNativeAppGovernanceAlert(
  code: FoundationAlertCatalogItem['code'],
  note = 'app-unmuted',
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<FoundationAlertMutationResponse> {
  try {
    return await createNativeAppBootstrapClient(context).unmuteFoundationAlert(code, { note });
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      acknowledgement: {
        status: 'ACKED',
        note,
        actorId: 'app-fallback',
        acknowledgedAt: '2026-06-13T00:00:00.000Z',
        mutedUntil: null,
        updatedAt: '2026-06-13T00:00:00.000Z'
      },
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
      history: [
        {
          action: 'UNMUTE',
          note,
          actorId: 'app-fallback',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:00:00.000Z',
          source: 'app-fallback'
        }
      ]
    };
  }
}

export function createNativeAppRuntimeConsumerContract(
  snapshot: NativeAppBootstrapSnapshot,
  context: NativeAppBootstrapContext = defaultNativeAppContext,
  governance?:
    | {
        generatedAt: string;
        alerts: FoundationAlertCatalogItem[];
        summary: FoundationOperationsOverviewSummary;
        topRisks: FoundationOperationsAlert[];
      }
    | null
): NativeAppRuntimeConsumerContract {
  const resolvedContext = { ...defaultNativeAppContext, ...context };

  return {
    wiring: nativeAppBootstrap,
    snapshot,
    scope: {
      scopePath: `${resolvedContext.marketCode} / ${resolvedContext.tenantId} / ${resolvedContext.brandId} / ${resolvedContext.storeId}`,
      resolver: nativeAppBootstrap.tenantScope.resolver,
      mismatchStrategy: nativeAppBootstrap.tenantScope.mismatchStrategy,
      revalidateOn: nativeAppBootstrap.tenantScope.revalidateOn
    },
    degradation: {
      featureFlagFallback: nativeAppBootstrap.featureFlags.fallbackStrategy,
      desensitizationMode: nativeAppBootstrap.desensitization.defaultMode,
      cacheableCapabilities: nativeAppBootstrap.cacheableCapabilities
    },
    challenge: {
      enforcement: nativeAppBootstrap.riskChallenge.enforcement,
      notes: nativeAppBootstrap.riskChallenge.notes
    },
    governance: {
      deliveryMode: governance ? 'api' : 'fallback',
      generatedAt: governance?.generatedAt ?? 'local-fallback',
      alerts: governance?.alerts ?? foundationAlertCatalogFallback,
      summary: governance?.summary ?? emptyGovernanceOverviewSummary,
      topRisks: governance?.topRisks ?? []
    }
  };
}

export async function loadNativeAppRuntimeConsumerContract(
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<NativeAppRuntimeConsumerContract> {
  const [snapshot, governance] = await Promise.all([
    loadNativeAppBootstrapSnapshot(context),
    loadNativeAppGovernanceReadModel(context)
  ]);

  return createNativeAppRuntimeConsumerContract(snapshot, context, {
    generatedAt: governance.generatedAt,
    alerts: governance.alerts,
    summary: governance.summary,
    topRisks: governance.topRisks
  });
}

export function createGuestNativeSession(): NativeAppSession {
  return {
    authenticated: false,
    memberTier: 'GUEST',
    paymentReady: false
  };
}

export function createNativeSession(memberTier: 'MEMBER' | 'SVIP' = 'MEMBER'): NativeAppSession {
  return {
    authenticated: true,
    memberTier,
    paymentReady: true,
    memberId: memberTier === 'SVIP' ? 'app-member-svip-001' : 'app-member-001',
    nickname: memberTier === 'SVIP' ? 'App SVIP Member' : 'App Member'
  };
}

function resolveNativeAppCurrency(snapshot: NativeAppBootstrapSnapshot) {
  return snapshot.marketCode === 'cn-mainland' ? 'CNY' : 'USD'
}

function computeNativeAppCheckoutAmount(items: NativeAppCheckoutItem[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
}

export function createNativeAppCheckoutPayload(
  snapshot: NativeAppBootstrapSnapshot,
  session: NativeAppSession
): NativeAppCheckoutPayload {
  const items = nativeAppCheckoutCatalog.map((item) => ({ ...item }))

  return {
    memberId: session.memberId ?? `app-${snapshot.marketCode}-${session.memberTier.toLowerCase()}`,
    items,
    paymentChannel: snapshot.marketCode === 'cn-mainland' ? 'WECHAT_PAY' : 'APPLE_PAY',
    currency: resolveNativeAppCurrency(snapshot),
    amount: computeNativeAppCheckoutAmount(items),
    externalPaymentId: `native-pay-${snapshot.marketCode}-${session.memberTier.toLowerCase()}`
  }
}

export function createNativeAppRefundPayload(
  aggregate: NativeAppTransactionAggregate
): NativeAppRefundPayload {
  const paymentAmount = aggregate.payment?.amount ?? aggregate.order.totalAmount
  const reservedAmount = aggregate.refunds
    .filter((refund) => refund.status !== 'REJECTED')
    .reduce((sum, refund) => sum + refund.refundAmount, 0)
  const refundableAmount = Math.max(0, paymentAmount - reservedAmount)

  return {
    refundAmount: refundableAmount > 0 ? Math.min(refundableAmount, paymentAmount) : undefined,
    reason: 'app-native-refund-rehearsal',
    operator: 'app-runtime'
  }
}

function createNativeAppTransactionFallbackSnapshot(
  checkoutPayload: NativeAppCheckoutPayload,
  note: string
): NativeAppTransactionRuntimeSnapshot {
  const now = '2026-06-14T00:00:00.000Z'
  const orderId = `app-order-${checkoutPayload.memberId}`
  const paymentId = `app-payment-${checkoutPayload.memberId}`

  return {
    deliveryMode: 'fallback',
    aggregate: {
      order: {
        orderId,
        orderNo: `ON${now.replace(/[-:TZ]/g, '').slice(0,14)}`,
        memberId: checkoutPayload.memberId,
        currency: checkoutPayload.currency ?? 'USD',
        totalAmount: checkoutPayload.amount ?? computeNativeAppCheckoutAmount(checkoutPayload.items),
        status: 'PAID',
        latestPaymentId: paymentId,
        createdAt: now,
        updatedAt: now,
        paidAt: now
      },
      payment: {
        paymentId,
        orderId,
        externalPaymentId: checkoutPayload.externalPaymentId,
        channel: checkoutPayload.paymentChannel,
        amount: checkoutPayload.amount ?? computeNativeAppCheckoutAmount(checkoutPayload.items),
        status: 'SUCCEEDED',
        transactionNo: `fallback-${paymentId}`,
        createdAt: now,
        updatedAt: now,
        completedAt: now
      },
      settlement: {
        settlementId: `settlement-${orderId}`,
        pointsEarned: 50,
        pointsBalance: 50
      },
      pointsLedger: [],
      couponRedemptions: [],
      blindboxFulfillments: [],
      refunds: []
    },
    checkoutPayload,
    paymentCallback: {
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: paymentId,
      orderId,
      tenantId: defaultNativeAppContext.tenantId,
      externalPaymentId: checkoutPayload.externalPaymentId,
      transactionNo: `fallback-${paymentId}`,
      channel: checkoutPayload.paymentChannel,
      amount: checkoutPayload.amount,
      payload: {
        source: 'app-fallback'
      }
    },
    note
  }
}

export async function executeNativeAppTransactionFlow(
  snapshot: NativeAppBootstrapSnapshot,
  session: NativeAppSession,
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<NativeAppTransactionRuntimeSnapshot> {
  const client = createNativeAppBootstrapClient(context)
  const checkoutPayload = createNativeAppCheckoutPayload(snapshot, session)

  try {
    const createdAggregate = await client.postData<NativeAppTransactionAggregate>(
      '/transactions/checkout',
      checkoutPayload,
      { cache: 'no-store' }
    )

    if (!createdAggregate.payment) {
      return {
        deliveryMode: 'api',
        aggregate: createdAggregate,
        checkoutPayload,
        note: '已创建真实交易聚合，但尚未生成支付单。'
      }
    }

    const paymentCallback: NativeAppPaymentCallbackPayload = {
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: createdAggregate.payment.paymentId,
      orderId: createdAggregate.order.orderId,
      tenantId: context.tenantId ?? defaultNativeAppContext.tenantId,
      externalPaymentId: createdAggregate.payment.externalPaymentId,
      transactionNo: createdAggregate.payment.transactionNo ?? `native-txn-${createdAggregate.payment.paymentId}`,
      channel: createdAggregate.payment.channel,
      amount: createdAggregate.payment.amount,
      payload: {
        source: 'app-runtime',
        marketCode: snapshot.marketCode
      }
    }

    await client.postData<NativeAppTransactionAggregate>(
      '/transactions/payments/standardized-callback',
      paymentCallback,
      { cache: 'no-store' }
    )

    const refreshedAggregate = await client.getData<NativeAppTransactionAggregate>(
      `/transactions/orders/${createdAggregate.order.orderId}`,
      { cache: 'no-store' }
    )

    return {
      deliveryMode: 'api',
      aggregate: refreshedAggregate,
      checkoutPayload,
      paymentCallback,
      note: `已完成真实 checkout、支付回写与订单聚合刷新，订单 ${refreshedAggregate.order.orderId} 已可继续退款。`
    }
  } catch {
    return createNativeAppTransactionFallbackSnapshot(
      checkoutPayload,
      '真实交易接口当前不可达，App 端回退到本地支付成功演示聚合。'
    )
  }
}

export async function requestNativeAppRefundToApi(
  runtime: NativeAppTransactionRuntimeSnapshot,
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<NativeAppTransactionRuntimeSnapshot> {
  if (!runtime.aggregate) {
    return runtime
  }

  const refundPayload = createNativeAppRefundPayload(runtime.aggregate)

  try {
    const refundedAggregate = await submitNativeAppOrderRefund(
      runtime.aggregate.order.orderId,
      refundPayload,
      context,
    )

    return {
      deliveryMode: 'api',
      aggregate: refundedAggregate,
      checkoutPayload: runtime.checkoutPayload,
      paymentCallback: runtime.paymentCallback,
      refundPayload,
      note: `已向真实交易链路提交退款申请，当前订单 ${runtime.aggregate.order.orderId} 已进入退款队列。`
    }
  } catch {
    const fallbackRefund: NativeAppTransactionRefund = {
      refundId: `fallback-refund-${runtime.aggregate.order.orderId}`,
      orderId: runtime.aggregate.order.orderId,
      paymentId: runtime.aggregate.payment?.paymentId ?? 'fallback-payment',
      memberId: runtime.aggregate.order.memberId,
      refundAmount: refundPayload.refundAmount ?? runtime.aggregate.order.totalAmount,
      reason: refundPayload.reason,
      operator: refundPayload.operator,
      status: 'PENDING',
      requestedAt: '2026-06-14T00:05:00.000Z'
    }

    return {
      deliveryMode: 'fallback',
      aggregate: {
        ...runtime.aggregate,
        refunds: [fallbackRefund, ...runtime.aggregate.refunds]
      },
      checkoutPayload: runtime.checkoutPayload,
      paymentCallback: runtime.paymentCallback,
      refundPayload,
      note: '真实退款接口当前不可达，App 端回退为本地待审退款演示。'
    }
  }
}

function createNativeAppOrderPaymentFallbackAggregate(
  orderId: string,
  paymentPayload: NativeAppOrderPaymentSubmitPayload,
  existingAggregate?: NativeAppTransactionAggregate,
): NativeAppTransactionAggregate {
  const paidAt = paymentPayload.paidAt ?? new Date().toISOString()
  const paymentId = existingAggregate?.payment?.paymentId ?? `fallback-payment-${orderId}`
  const fallbackOrderNo =
    existingAggregate?.order.orderNo
    ?? `ORD${paidAt.slice(0, 10).replaceAll('-', '')}001`

  return {
    order: {
      orderId,
      orderNo: fallbackOrderNo,
      memberId: existingAggregate?.order.memberId ?? `fallback-member-${orderId}`,
      currency: existingAggregate?.order.currency ?? 'CNY',
      totalAmount: paymentPayload.amount,
      status: 'PAID',
      latestPaymentId: paymentId,
      createdAt: existingAggregate?.order.createdAt ?? paidAt,
      updatedAt: paidAt,
      paidAt,
    },
    payment: {
      paymentId,
      orderId,
      externalPaymentId: paymentPayload.externalPaymentId ?? existingAggregate?.payment?.externalPaymentId,
      channel: paymentPayload.paymentChannel,
      amount: paymentPayload.amount,
      status: 'SUCCEEDED',
      transactionNo: existingAggregate?.payment?.transactionNo ?? `fallback-${paymentId}`,
      createdAt: existingAggregate?.payment?.createdAt ?? paidAt,
      updatedAt: paidAt,
      completedAt: paidAt,
    },
    settlement: existingAggregate?.settlement ?? {
      settlementId: `fallback-settlement-${orderId}`,
      pointsEarned: Math.round(paymentPayload.amount),
      pointsBalance: Math.round(paymentPayload.amount),
    },
    pointsLedger: existingAggregate?.pointsLedger ?? [],
    couponRedemptions: existingAggregate?.couponRedemptions ?? [],
    blindboxFulfillments: existingAggregate?.blindboxFulfillments ?? [],
    refunds: existingAggregate?.refunds ?? [],
  }
}

export async function submitNativeAppOrderPayment(
  orderId: string,
  paymentPayload: NativeAppOrderPaymentSubmitPayload,
  context: NativeAppBootstrapContext = defaultNativeAppContext,
): Promise<NativeAppTransactionAggregate> {
  const client = createNativeAppBootstrapClient(context)

  try {
    const existingAggregate = await client.getData<NativeAppTransactionAggregate>(
      `/transactions/orders/${orderId}`,
      { cache: 'no-store' },
    )

    if (!existingAggregate.payment?.paymentId) {
      return createNativeAppOrderPaymentFallbackAggregate(orderId, paymentPayload, existingAggregate)
    }

    const paidAt = paymentPayload.paidAt ?? new Date().toISOString()
    const paymentCallback: NativeAppPaymentCallbackPayload = {
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: existingAggregate.payment.paymentId,
      paymentId: existingAggregate.payment.paymentId,
      orderId,
      tenantId: context.tenantId ?? defaultNativeAppContext.tenantId,
      externalPaymentId: paymentPayload.externalPaymentId ?? existingAggregate.payment.externalPaymentId,
      transactionNo: existingAggregate.payment.transactionNo ?? `native-txn-${existingAggregate.payment.paymentId}`,
      channel: paymentPayload.paymentChannel,
      amount: paymentPayload.amount,
      status: 'SUCCEEDED',
      paidAt,
      payload: {
        source: paymentPayload.source ?? 'app-cashier',
      },
    }

    await client.postData<NativeAppTransactionAggregate>(
      '/transactions/payments/standardized-callback',
      paymentCallback,
      { cache: 'no-store' },
    )

    return client.getData<NativeAppTransactionAggregate>(
      `/transactions/orders/${orderId}`,
      { cache: 'no-store' },
    )
  } catch {
    return createNativeAppOrderPaymentFallbackAggregate(orderId, paymentPayload)
  }
}

export async function getNativeAppOrderTransaction(
  orderId: string,
  context: NativeAppBootstrapContext = defaultNativeAppContext,
): Promise<NativeAppTransactionAggregate> {
  const client = createNativeAppBootstrapClient(context)
  return client.getData<NativeAppTransactionAggregate>(
    `/transactions/orders/${orderId}`,
    { cache: 'no-store' },
  )
}

function buildNativeAppOrderListPath(query?: NativeAppOrderListQuery): string {
  if (!query) {
    return '/transactions/orders'
  }

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      params.set(key, String(value))
    }
  })

  const search = params.toString()
  return search ? `/transactions/orders?${search}` : '/transactions/orders'
}

function normalizeNativeAppOrderListPage(
  payload: NativeAppOrderListItem[] | NativeAppOrderListPage,
): NativeAppOrderListPage {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      pageSize: payload.length,
    }
  }

  return payload
}

export async function listNativeAppOrdersPage(
  query?: NativeAppOrderListQuery,
  context: NativeAppBootstrapContext = defaultNativeAppContext,
): Promise<NativeAppOrderListPage> {
  const client = createNativeAppBootstrapClient(context)
  const result = await client.getData<NativeAppOrderListItem[] | NativeAppOrderListPage>(
    buildNativeAppOrderListPath(query),
    {
      cache: 'no-store',
      headers: query ? {
        'x-query-params': JSON.stringify(query),
      } : undefined,
    },
  )

  return normalizeNativeAppOrderListPage(result)
}

export async function listNativeAppOrders(
  query?: NativeAppOrderListQuery,
  context: NativeAppBootstrapContext = defaultNativeAppContext,
): Promise<NativeAppOrderListItem[]> {
  const result = await listNativeAppOrdersPage(query, context)
  return result.items
}

export async function submitNativeAppOrderRefund(
  orderId: string,
  refundPayload: NativeAppRefundPayload,
  context: NativeAppBootstrapContext = defaultNativeAppContext,
): Promise<NativeAppTransactionAggregate> {
  const client = createNativeAppBootstrapClient(context)
  return client.postData<NativeAppTransactionAggregate>(
    `/transactions/orders/${orderId}/refunds`,
    refundPayload,
    { cache: 'no-store' },
  )
}

export function resolveNativeAppBootstrapState(
  snapshot: NativeAppBootstrapSnapshot,
  session: NativeAppSession,
  action: NativeAppActionKey
): FoundationFrontendBootstrapState {
  if (snapshot.deliveryMode === 'fallback') {
    return 'readonly-fallback';
  }

  if (!session.authenticated) {
    return action === 'member-login' ? 'challenge-required' : 'scope-mismatch';
  }

  if (action === 'payment-submit' || action === 'device-bind') {
    return 'challenge-required';
  }

  return 'ready';
}

export function resolveNativeAppActionDecision(
  snapshot: NativeAppBootstrapSnapshot,
  session: NativeAppSession,
  action: NativeAppActionKey
): NativeAppActionDecision {
  const bootstrapState = resolveNativeAppBootstrapState(snapshot, session, action);

  if (bootstrapState === 'readonly-fallback') {
    return {
      bootstrapState,
      allowed: false,
      title: '当前为移动端只读降级态',
      helper: 'App fallback 快照只能承接只读壳层，支付、设备绑定、会员登录等动作必须等待实时 bootstrap 恢复。',
      nextStep: 'REFRESH'
    };
  }

  if (!session.authenticated) {
    return {
      bootstrapState,
      allowed: false,
      title: action === 'member-login' ? '需要先发起登录挑战' : '请先完成会员登录',
      helper:
        action === 'member-login'
          ? '登录进入 challenge-required 后，才能继续拉起会员与设备链路。'
          : '支付前校验与设备绑定必须依赖实时会员会话，游客态不能继续。',
      nextStep: action === 'member-login' ? 'CHALLENGE' : 'LOGIN'
    };
  }

  if (action === 'payment-submit') {
    return {
      bootstrapState,
      allowed: false,
      title: '支付前需要设备与风控双重校验',
      helper: 'App 端支付前校验属于高风险动作，必须进入 challenge-required 再继续提交。',
      nextStep: 'CHALLENGE'
    };
  }

  if (action === 'device-bind') {
    return {
      bootstrapState,
      allowed: false,
      title: '设备绑定需要阶梯式挑战',
      helper: '设备绑定、账号找回等动作统一走原生挑战链路，不能由本地快照直接放行。',
      nextStep: 'CHALLENGE'
    };
  }

  return {
    bootstrapState,
    allowed: true,
    title: '会员链路可继续',
    helper: `当前会员层级为 ${session.memberTier}，可以进入会员中心与服务入口。`,
    nextStep: 'PROCEED'
  };
}

export function createNativeAppActionPlan(
  snapshot: NativeAppBootstrapSnapshot,
  session: NativeAppSession,
  action: NativeAppActionKey
): NativeAppActionPlan {
  const decision = resolveNativeAppActionDecision(snapshot, session, action);

  if (action === 'member-login') {
    return {
      action,
      label: '会员登录',
      decision,
      riskLevel: 'medium',
      channel:
        decision.nextStep === 'REFRESH'
          ? 'BOOTSTRAP_REFRESH'
          : decision.nextStep === 'CHALLENGE'
            ? 'NATIVE_LOGIN'
            : 'MEMBER_RUNTIME',
      draftSummary: `按 ${snapshot.marketCode} 市场和 ${snapshot.emailProvider} 通道准备 App 会员会话刷新。`,
      checklist: ['校验设备会话与门店上下文', '拉起原生登录挑战', '刷新会员会话、支付能力与设备信任态'],
      requestPreview: {
        endpoint: '/api/v1/members/session/challenge/native',
        method: 'POST',
        payload: {
          marketCode: snapshot.marketCode,
          memberTier: session.memberTier,
          authenticated: session.authenticated
        }
      }
    };
  }

  if (action === 'device-bind') {
    return {
      action,
      label: '设备绑定',
      decision,
      riskLevel: 'high',
      channel:
        decision.nextStep === 'REFRESH'
          ? 'BOOTSTRAP_REFRESH'
          : decision.nextStep === 'LOGIN'
            ? 'NATIVE_LOGIN'
            : decision.nextStep === 'CHALLENGE'
              ? 'DEVICE_TRUST'
              : 'MEMBER_RUNTIME',
      draftSummary: `准备绑定门店设备，当前会员层级 ${session.memberTier}，支付能力 ${
        session.paymentReady ? '已就绪' : '未就绪'
      }。`,
      checklist: ['确认会员已登录', '校验设备指纹与信任状态', '完成挑战后刷新设备绑定结果'],
      requestPreview: {
        endpoint: '/api/v1/app/devices/bind',
        method: 'POST',
        payload: {
          marketCode: snapshot.marketCode,
          deviceFingerprint: 'ios-device-demo',
          memberTier: session.memberTier,
          paymentReady: session.paymentReady
        }
      }
    };
  }

  return {
    action,
    label: '支付提交',
    decision,
    riskLevel: 'high',
    channel:
      decision.nextStep === 'REFRESH'
        ? 'BOOTSTRAP_REFRESH'
        : decision.nextStep === 'LOGIN'
          ? 'NATIVE_LOGIN'
          : decision.nextStep === 'CHALLENGE'
            ? 'PAYMENT_RISK'
            : 'MEMBER_RUNTIME',
    draftSummary: `准备提交 App 支付单，当前会员层级 ${session.memberTier}，支付能力 ${
      session.paymentReady ? '已就绪' : '未就绪'
    }。`,
    checklist: ['确认会员会话、门店与订单上下文', '完成设备信任与支付风控校验', '挑战通过后再提交支付请求'],
    requestPreview: {
      endpoint: '/api/v1/app/payments/submit',
      method: 'POST',
      payload: {
        marketCode: snapshot.marketCode,
        orderNo: 'PAY-20260612-0001',
        memberTier: session.memberTier,
        paymentReady: session.paymentReady
      }
    }
  };
}

export function listNativeAppActionPlans(
  snapshot: NativeAppBootstrapSnapshot,
  session: NativeAppSession
): NativeAppActionPlan[] {
  return [
    createNativeAppActionPlan(snapshot, session, 'member-login'),
    createNativeAppActionPlan(snapshot, session, 'device-bind'),
    createNativeAppActionPlan(snapshot, session, 'payment-submit')
  ];
}

export function submitNativeAppActionPlan(plan: NativeAppActionPlan): NativeAppSubmitOutcome {
  const payloadSummary = JSON.stringify(plan.requestPreview.payload);
  const receiptCode = `NATIVE-${plan.action.toUpperCase()}-${plan.decision.nextStep}`;

  if (plan.decision.nextStep === 'REFRESH' || plan.decision.nextStep === 'LOGIN') {
    return {
      action: plan.action,
      state: 'blocked',
      endpoint: plan.requestPreview.endpoint,
      message:
        plan.decision.nextStep === 'REFRESH'
          ? '当前动作被只读降级阻断，需先刷新实时 bootstrap。'
          : '当前动作被游客态阻断，需先完成会员登录。',
      nextStep: plan.decision.nextStep,
      payloadSummary,
      receiptCode,
      recommendedAction: plan.decision.nextStep === 'REFRESH' ? 'REFRESH_BOOTSTRAP' : 'COMPLETE_LOGIN'
    };
  }

  if (plan.decision.nextStep === 'CHALLENGE') {
    return {
      action: plan.action,
      state: 'challenge-issued',
      endpoint: plan.requestPreview.endpoint,
      message: `已为 ${plan.label} 拉起 ${plan.channel} 挑战，挑战通过后可继续提交。`,
      nextStep: plan.decision.nextStep,
      payloadSummary,
      receiptCode,
      recommendedAction: 'COMPLETE_CHALLENGE'
    };
  }

  return {
    action: plan.action,
    state: 'submitted',
    endpoint: plan.requestPreview.endpoint,
    message: `${plan.label} 已进入模拟提交队列，后续可接真实 submit handler。`,
    nextStep: plan.decision.nextStep,
    payloadSummary,
    receiptCode,
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK'
  };
}

export function createNativeAppSubmitHistoryEntry(
  outcome: NativeAppSubmitOutcome,
  occurredAt = '2026-06-12T00:00:00.000Z'
): NativeAppSubmitHistoryEntry {
  return {
    receiptCode: outcome.receiptCode,
    action: outcome.action,
    state: outcome.state,
    endpoint: outcome.endpoint,
    occurredAt,
    recommendedAction: outcome.recommendedAction,
    summary: `${outcome.action} -> ${outcome.state} -> ${outcome.recommendedAction}`
  };
}

export function appendNativeAppSubmitHistory(
  history: NativeAppSubmitHistoryEntry[],
  outcome: NativeAppSubmitOutcome
): NativeAppSubmitHistoryEntry[] {
  return [createNativeAppSubmitHistoryEntry(outcome), ...history].slice(0, 5);
}

export function buildNativeAppLedger(history: NativeAppSubmitHistoryEntry[]): NativeAppLedgerRecord[] {
  return history.map((entry) => ({
    receiptCode: entry.receiptCode,
    ledgerKey: `native-ledger:${entry.receiptCode}`,
    action: entry.action,
    state: entry.state,
    replayEndpoint: `/api/v1/app/actions/${entry.receiptCode}/replay`,
    replayable: entry.state === 'submitted',
    recommendedAction: entry.recommendedAction,
    summary: entry.summary
  }));
}

export function replayNativeAppSubmitHistoryEntry(entry: NativeAppSubmitHistoryEntry): NativeAppReplayOutcome {
  const replayEndpoint = `/api/v1/app/actions/${entry.receiptCode}/replay`;

  if (entry.state === 'blocked') {
    return {
      receiptCode: entry.receiptCode,
      status: 'replay-skipped',
      replayEndpoint,
      message: '该记录仍处于阻断态，需先完成建议动作后才能回放。'
    };
  }

  if (entry.state === 'challenge-issued') {
    return {
      receiptCode: entry.receiptCode,
      status: 'replay-blocked',
      replayEndpoint,
      message: '该记录仍等待挑战完成，挑战通过后才允许进入回放。'
    };
  }

  return {
    receiptCode: entry.receiptCode,
    status: 'replay-scheduled',
    replayEndpoint,
    message: '已将该记录加入模拟回放队列，后续可接服务端 ledger replay。'
  };
}

export function createNativeAppActionTicket(outcome: NativeAppSubmitOutcome): NativeAppActionTicket {
  if (outcome.state === 'blocked') {
    return {
      receiptCode: outcome.receiptCode,
      ticketCode: `${outcome.receiptCode}-BLOCK`,
      ticketType: 'BLOCK_GUARD',
      status: 'waiting-prerequisite',
      summary: `${outcome.action} 仍缺少前置条件，需先执行 ${outcome.recommendedAction}。`
    };
  }

  if (outcome.state === 'challenge-issued') {
    return {
      receiptCode: outcome.receiptCode,
      ticketCode: `${outcome.receiptCode}-CHALLENGE`,
      ticketType: 'CHALLENGE_GATE',
      status: 'pending-challenge',
      summary: `${outcome.action} 已签发挑战票据，挑战完成后才可继续 sync handler。`
    };
  }

  return {
    receiptCode: outcome.receiptCode,
    ticketCode: `${outcome.receiptCode}-HANDLER`,
    ticketType: 'HANDLER_CALLBACK',
    status: 'ready-for-handler',
    summary: `${outcome.action} 已具备 handler sync 前提，可继续等待服务端回调。`
  };
}

export function buildNativeAppHandlerSyncContract(outcome: NativeAppSubmitOutcome): NativeAppHandlerSyncContract {
  const ticket = createNativeAppActionTicket(outcome);
  const handlerName =
    outcome.action === 'member-login'
      ? 'native-member-session-handler'
      : outcome.action === 'device-bind'
        ? 'native-device-bind-handler'
        : 'native-payment-submit-handler';

  return {
    receiptCode: outcome.receiptCode,
    handlerName,
    syncMode:
      outcome.state === 'blocked' ? 'deferred' : outcome.state === 'challenge-issued' ? 'challenge-gated' : 'callback-followup',
    syncEndpoint: `/api/v1/app/handlers/${handlerName}/sync`,
    callbackEndpoint: `/api/v1/app/handlers/${handlerName}/callbacks/${outcome.receiptCode}`,
    idempotencyKey: `app-sync:${outcome.receiptCode}`,
    ticketCode: ticket.ticketCode,
    ready: outcome.state === 'submitted',
    summary:
      outcome.state === 'submitted'
        ? `${handlerName} 已可按回执同步服务端状态。`
        : `${handlerName} 仍等待 ${outcome.recommendedAction} 后再进入同步。`
  };
}

export function createNativeAppReplayRequest(record: NativeAppLedgerRecord): NativeAppReplayRequest {
  return {
    receiptCode: record.receiptCode,
    ledgerKey: record.ledgerKey,
    endpoint: record.replayEndpoint,
    method: 'POST',
    headers: {
      'x-m5-ledger-key': record.ledgerKey,
      'x-m5-receipt-code': record.receiptCode
    },
    body: {
      receiptCode: record.receiptCode,
      action: record.action,
      replayMode: 'LEDGER_REPLAY',
      requestedFrom: 'APP_RUNTIME',
      ticketCode: `${record.receiptCode}-${record.replayable ? 'HANDLER' : 'REVIEW'}`
    }
  };
}

export function buildNativeAppAuthEnvelope(sync: NativeAppHandlerSyncContract): NativeAppAuthEnvelope {
  return {
    receiptCode: sync.receiptCode,
    audience: 'native-app-handler-sync',
    authScheme: 'M5-HMAC-SHA256',
    authorization: `M5 ${sync.ticketCode}.${sync.idempotencyKey}`,
    signedHeaders: ['x-m5-ticket-code', 'x-m5-idempotency-key', 'x-m5-receipt-code', 'x-m5-nonce', 'x-m5-timestamp'],
    expiresAt: '2026-06-12T00:05:00.000Z',
    nonce: `nonce:${sync.receiptCode}`
  };
}

export function createNativeAppCallbackReceipt(
  outcome: NativeAppSubmitOutcome,
  sync: NativeAppHandlerSyncContract
): NativeAppCallbackReceipt {
  if (outcome.state === 'blocked') {
    return {
      receiptCode: outcome.receiptCode,
      callbackEndpoint: sync.callbackEndpoint,
      callbackStatus: 'callback-blocked',
      ackToken: `${outcome.receiptCode}-ACK-BLOCKED`,
      lastEvent: 'PREREQUISITE_PENDING',
      summary: '当前仍缺少前置条件，服务端 callback 只记录阻断原因。'
    };
  }

  if (outcome.state === 'challenge-issued') {
    return {
      receiptCode: outcome.receiptCode,
      callbackEndpoint: sync.callbackEndpoint,
      callbackStatus: 'callback-blocked',
      ackToken: `${outcome.receiptCode}-ACK-CHALLENGE`,
      lastEvent: 'CHALLENGE_PENDING',
      summary: '当前仍等待挑战完成，服务端 callback 暂不落最终提交结果。'
    };
  }

  return {
    receiptCode: outcome.receiptCode,
    callbackEndpoint: sync.callbackEndpoint,
    callbackStatus: 'awaiting-callback',
    ackToken: `${outcome.receiptCode}-ACK-HANDLER`,
    lastEvent: 'HANDLER_ACCEPTED',
    summary: 'handler 已接受同步请求，等待服务端回写最终 callback receipt。'
  };
}

export function createNativeAppReplayRetryPolicy(
  record: NativeAppLedgerRecord,
  replayOutcome: NativeAppReplayOutcome
): NativeAppReplayRetryPolicy {
  if (replayOutcome.status === 'replay-scheduled') {
    return {
      receiptCode: record.receiptCode,
      replayEndpoint: record.replayEndpoint,
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 1,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: '当前已进入第一次重放，优先等待服务端 callback 再决定是否继续重试。'
    };
  }

  if (replayOutcome.status === 'replay-blocked') {
    return {
      receiptCode: record.receiptCode,
      replayEndpoint: record.replayEndpoint,
      retryable: true,
      maxAttempts: 2,
      currentAttempt: 0,
      nextBackoffMs: 5000,
      escalationAction: 'REFRESH_TICKET',
      summary: '当前仍等待挑战票据完成，需先刷新 ticket 再进入重放。'
    };
  }
  return {
    receiptCode: record.receiptCode,
    replayEndpoint: record.replayEndpoint,
    retryable: false,
    maxAttempts: 1,
    currentAttempt: 0,
    nextBackoffMs: 0,
    escalationAction: 'OPEN_MANUAL_REVIEW',
    summary: '当前记录仍被前置条件阻断，应转人工复核而非继续自动重放。'
  };
}

function createNativeAppRuntimeReceiptFallback(
  plan: NativeAppActionPlan,
  outcome: NativeAppSubmitOutcome
): RuntimeGovernanceReceipt {
  const ticket = createNativeAppActionTicket(outcome);
  const sync = buildNativeAppHandlerSyncContract(outcome);
  const callback = createNativeAppCallbackReceipt(outcome, sync);
  const historyEntry = createNativeAppSubmitHistoryEntry(outcome);
  const ledger = buildNativeAppLedger([historyEntry])[0]!;
  const replayOutcome = replayNativeAppSubmitHistoryEntry(historyEntry);
  const retry = createNativeAppReplayRetryPolicy(ledger, replayOutcome);

  return {
    receiptCode: outcome.receiptCode,
    app: 'app',
    action: outcome.action,
    state:
      outcome.state === 'submitted'
        ? 'submitted'
        : outcome.state === 'challenge-issued'
          ? 'challenge-issued'
          : 'blocked',
    nextStep: outcome.nextStep,
    riskLevel: plan.riskLevel,
    recommendedAction: outcome.recommendedAction,
    requestEndpoint: plan.requestPreview.endpoint,
    payloadSummary: outcome.payloadSummary,
    ticket,
    sync: {
      handlerName: sync.handlerName,
      syncMode: sync.syncMode,
      syncEndpoint: sync.syncEndpoint,
      callbackEndpoint: sync.callbackEndpoint,
      idempotencyKey: sync.idempotencyKey,
      ready: sync.ready,
      summary: sync.summary
    },
    callback: {
      callbackStatus: callback.callbackStatus,
      ackToken: callback.ackToken,
      lastEvent: callback.lastEvent,
      summary: callback.summary
    },
    ledger: {
      ledgerKey: ledger.ledgerKey,
      replayEndpoint: ledger.replayEndpoint,
      replayable: ledger.replayable,
      summary: ledger.summary
    },
    retry: {
      replayEndpoint: retry.replayEndpoint,
      retryable: retry.retryable,
      maxAttempts: retry.maxAttempts,
      currentAttempt: retry.currentAttempt,
      nextBackoffMs: retry.nextBackoffMs,
      escalationAction: retry.escalationAction,
      summary: retry.summary
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: `app:${outcome.action}:tenant-demo`
    },
    events: [
      {
        eventType: 'runtime-governance.action.submitted',
        status: 'accepted',
        idempotencyKey: sync.idempotencyKey,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: `${outcome.action} 使用 fallback receipt 返回本地演示结果。`
      }
    ],
    generatedAt: 'local-fallback'
  };
}

export async function submitNativeAppActionPlanToApi(
  plan: NativeAppActionPlan,
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<RuntimeGovernanceReceipt> {
  const outcome = submitNativeAppActionPlan(plan);
  const sync = buildNativeAppHandlerSyncContract(outcome);

  try {
    return await createNativeAppBootstrapClient(context).submitRuntimeGovernanceAction({
      app: 'app',
      action: plan.action,
      nextStep: outcome.nextStep,
      riskLevel: plan.riskLevel,
      requestEndpoint: plan.requestPreview.endpoint,
      payload: plan.requestPreview.payload as unknown as Record<string, unknown>,
      payloadSummary: outcome.payloadSummary,
      recommendedAction: outcome.recommendedAction,
      handlerName: sync.handlerName,
      idempotencyKey: sync.idempotencyKey
    });
  } catch {
    return createNativeAppRuntimeReceiptFallback(plan, outcome);
  }
}

export async function loadNativeAppRuntimeReceipt(
  receiptCode: string,
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<RuntimeGovernanceReceipt | null> {
  try {
    return await createNativeAppBootstrapClient(context).getRuntimeGovernanceReceipt(receiptCode);
  } catch {
    return null;
  }
}

function createNativeAppRuntimeSyncFallback(receipt: RuntimeGovernanceReceipt): RuntimeGovernanceReceipt {
  return {
    ...receipt,
    sync: {
      ...receipt.sync,
      ready: receipt.ticket.status === 'ready-for-handler',
      summary:
        receipt.ticket.status === 'ready-for-handler'
          ? `${receipt.sync.handlerName} 已记录 fallback sync，请等待 callback。`
          : `${receipt.sync.handlerName} 当前仍待前置条件完成。`
    },
    callback:
      receipt.ticket.status === 'ready-for-handler'
        ? {
            ...receipt.callback,
            callbackStatus: 'awaiting-callback',
            lastEvent: 'HANDLER_ACCEPTED',
            summary: 'fallback 已记录 sync，请等待 callback。'
          }
        : receipt.callback,
    events: [
      ...receipt.events,
      {
        eventType: 'runtime-governance.handler.sync.requested',
        status: 'accepted',
        idempotencyKey: receipt.sync.idempotencyKey,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: 'fallback 已记录 handler sync。'
      }
    ],
    generatedAt: 'local-fallback'
  };
}

export async function syncNativeAppRuntimeReceipt(
  receipt: RuntimeGovernanceReceipt,
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<RuntimeGovernanceReceipt> {
  try {
    return await createNativeAppBootstrapClient(context).syncRuntimeGovernanceAction(receipt.receiptCode, {
      handlerName: receipt.sync.handlerName,
      ticketCode: receipt.ticket.ticketCode,
      idempotencyKey: receipt.sync.idempotencyKey
    });
  } catch {
    return createNativeAppRuntimeSyncFallback(receipt);
  }
}

function createNativeAppRuntimeCallbackFallback(receipt: RuntimeGovernanceReceipt): RuntimeGovernanceReceipt {
  return {
    ...receipt,
    state: 'callback-recorded',
    callback: {
      ...receipt.callback,
      callbackStatus: 'callback-recorded',
      lastEvent: 'HANDLER_COMPLETED',
      summary: 'fallback 已记录 handler callback。'
    },
    ledger: {
      ...receipt.ledger,
      replayable: true,
      summary: 'callback 已记录，可进入 replay。'
    },
    retry: {
      ...receipt.retry,
      retryable: false,
      nextBackoffMs: 0,
      summary: 'callback 已完成，当前无需继续自动重试。'
    },
    events: [
      ...receipt.events,
      {
        eventType: 'runtime-governance.handler.callback.recorded',
        status: 'accepted',
        idempotencyKey: `${receipt.sync.idempotencyKey}:callback`,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: 'fallback 已记录 callback。'
      }
    ],
    generatedAt: 'local-fallback'
  };
}

export async function recordNativeAppRuntimeCallback(
  receipt: RuntimeGovernanceReceipt,
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<RuntimeGovernanceReceipt> {
  try {
    return await createNativeAppBootstrapClient(context).recordRuntimeGovernanceCallback(receipt.receiptCode, {
      callbackStatus: 'callback-recorded',
      ackToken: receipt.callback.ackToken,
      lastEvent: 'HANDLER_COMPLETED',
      summary: `${receipt.action} handler callback recorded`,
      idempotencyKey: `${receipt.sync.idempotencyKey}:callback`
    });
  } catch {
    return createNativeAppRuntimeCallbackFallback(receipt);
  }
}

function createNativeAppRuntimeReplayFallback(receipt: RuntimeGovernanceReceipt): RuntimeGovernanceReceipt {
  const nextRetry = advanceRuntimeGovernanceReplayPolicy(receipt.retry);

  return {
    ...receipt,
    state: receipt.ledger.replayable ? 'replay-scheduled' : receipt.state,
    ledger: {
      ...receipt.ledger,
      replayable: false,
      summary: receipt.ledger.replayable ? 'fallback 已将当前回执加入本地 replay 队列。' : receipt.ledger.summary
    },
    retry: {
      ...receipt.retry,
      ...nextRetry,
      summary: nextRetry.retryable ? 'fallback 已记录一次 replay，请等待下一次状态刷新。' : 'fallback replay 已达上限，转人工复核。'
    },
    events: [
      ...receipt.events,
      {
        eventType: 'runtime-governance.replay.scheduled',
        status: 'accepted',
        idempotencyKey: `app-replay:${receipt.receiptCode}:${nextRetry.currentAttempt}`,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: receipt.ledger.replayable ? 'fallback 触发本地 replay。' : 'fallback replay 被跳过。'
      }
    ],
    generatedAt: 'local-fallback'
  };
}

export async function replayNativeAppRuntimeReceipt(
  receipt: RuntimeGovernanceReceipt,
  context: NativeAppBootstrapContext = defaultNativeAppContext
): Promise<RuntimeGovernanceReceipt> {
  try {
    return await createNativeAppBootstrapClient(context).replayRuntimeGovernanceAction(receipt.receiptCode, {
      ledgerKey: receipt.ledger.ledgerKey,
      requestedFrom: 'APP_RUNTIME',
      ticketCode: receipt.ticket.ticketCode,
      idempotencyKey: `app-replay:${receipt.receiptCode}:${receipt.retry.currentAttempt + 1}`
    });
  } catch {
    return createNativeAppRuntimeReplayFallback(receipt);
  }
}
