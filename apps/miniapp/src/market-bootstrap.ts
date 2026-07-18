import { ApiClient, getDefaultApiBaseUrl, loadFoundationGovernanceReadModel } from '@m5/sdk';
import {
  advanceRuntimeGovernanceReplayPolicy,
  type FoundationAlertDrilldownResponse,
  type FoundationAlertMutationResponse,
  foundationAlertCatalogFallback,
  getFoundationAppBootstrapWiring,
  type AppBootstrapWiring,
  type FoundationAlertCatalogItem,
  type FoundationOperationsAlert,
  type FoundationOperationsOverviewSummary,
  type FoundationFrontendBootstrapState,
  type PortalBootstrapResponse,
  type RuntimeGovernanceReceipt,
} from '@m5/types';

export interface MiniappBootstrapSnapshot {
  deliveryMode: 'api' | 'fallback';
  marketCode: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  socialPlatforms: string[];
  sharePolicy: 'DOMESTIC_SOCIAL_FIRST' | 'GLOBAL_CONTENT_FIRST';
  primaryDomain: string;
  supportedSurfaces: string[];
  domainSource: string;
}

export interface MiniappBootstrapContext {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export type MiniappActionKey = 'member-login' | 'coupon-claim' | 'booking-submit';

export interface MiniappMemberSession {
  authenticated: boolean;
  memberTier: 'GUEST' | 'MEMBER' | 'SVIP';
  points: number;
  couponCount: number;
  memberId?: string;
  nickname?: string;
  mobile?: string;
  sessionToken?: string;
  expiresAt?: string;
  profileSource?: 'fallback' | 'memory' | 'prisma';
  deliveryMode?: 'api' | 'fallback';
}

export interface MiniappMemberProfileSnapshot {
  memberId: string;
  nickname: string;
  mobile?: string;
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  status: 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'BLACKLISTED';
  points: number;
  growthValue?: number;
  svipStatus?: string;
  registeredAt: string;
  lastActiveAt?: string;
  source?: 'memory' | 'prisma';
  persisted?: boolean;
}

export interface MiniappMemberRuntimeSnapshot {
  deliveryMode: 'api' | 'fallback';
  session: MiniappMemberSession;
  profile: MiniappMemberProfileSnapshot | null;
  availableMembers: MiniappMemberProfileSnapshot[];
  sessionVerified: boolean;
  note: string;
}

export interface MiniappActionDecision {
  bootstrapState: FoundationFrontendBootstrapState;
  allowed: boolean;
  title: string;
  helper: string;
  nextStep: 'PROCEED' | 'LOGIN' | 'CHALLENGE' | 'REFRESH';
}

export interface MiniappLoginDraft {
  marketCode: string;
  memberTier: MiniappMemberSession['memberTier'];
  authenticated: boolean;
}

export interface MiniappCouponClaimDraft {
  marketCode: string;
  couponTemplateCode: string;
  memberTier: MiniappMemberSession['memberTier'];
  couponCount: number;
}

export interface MiniappBookingSubmitDraft {
  marketCode: string;
  storeDomain: string;
  memberTier: MiniappMemberSession['memberTier'];
  bookingSlot: string;
}

export type MiniappActionDraft =
  | MiniappLoginDraft
  | MiniappCouponClaimDraft
  | MiniappBookingSubmitDraft;

export interface MiniappActionRequestPreview {
  endpoint: string;
  method: 'POST';
  payload: MiniappActionDraft;
}

export interface MiniappActionPlan {
  action: MiniappActionKey;
  label: string;
  decision: MiniappActionDecision;
  riskLevel: 'low' | 'medium' | 'high';
  channel: 'WECHAT_LOGIN' | 'WECHAT_CHALLENGE' | 'MEMBER_RUNTIME' | 'BOOTSTRAP_REFRESH';
  draftSummary: string;
  checklist: string[];
  requestPreview: MiniappActionRequestPreview;
}

export interface MiniappSubmitOutcome {
  action: MiniappActionKey;
  state: 'blocked' | 'challenge-issued' | 'submitted';
  endpoint: string;
  message: string;
  nextStep: MiniappActionDecision['nextStep'];
  payloadSummary: string;
  receiptCode: string;
  recommendedAction:
    | 'REFRESH_BOOTSTRAP'
    | 'COMPLETE_LOGIN'
    | 'COMPLETE_CHALLENGE'
    | 'FOLLOW_SUBMIT_CALLBACK';
}

export interface MiniappSubmitHistoryEntry {
  receiptCode: string;
  action: MiniappActionKey;
  state: MiniappSubmitOutcome['state'];
  endpoint: string;
  occurredAt: string;
  recommendedAction: MiniappSubmitOutcome['recommendedAction'];
  summary: string;
}

export interface MiniappLedgerRecord {
  receiptCode: string;
  ledgerKey: string;
  action: MiniappActionKey;
  state: MiniappSubmitOutcome['state'];
  replayEndpoint: string;
  replayable: boolean;
  recommendedAction: MiniappSubmitOutcome['recommendedAction'];
  summary: string;
}

export interface MiniappReplayOutcome {
  receiptCode: string;
  status: 'replay-scheduled' | 'replay-blocked' | 'replay-skipped';
  replayEndpoint: string;
  message: string;
}

export interface MiniappActionTicket {
  receiptCode: string;
  ticketCode: string;
  ticketType: 'BLOCK_GUARD' | 'CHALLENGE_GATE' | 'HANDLER_CALLBACK';
  status: 'waiting-prerequisite' | 'pending-challenge' | 'ready-for-handler';
  summary: string;
}

export interface MiniappHandlerSyncContract {
  receiptCode: string;
  handlerName:
    | 'miniapp-member-session-handler'
    | 'miniapp-coupon-claim-handler'
    | 'miniapp-booking-submit-handler';
  syncMode: 'deferred' | 'challenge-gated' | 'callback-followup';
  syncEndpoint: string;
  callbackEndpoint: string;
  idempotencyKey: string;
  ticketCode: string;
  ready: boolean;
  summary: string;
}

export interface MiniappReplayRequest {
  receiptCode: string;
  ledgerKey: string;
  endpoint: string;
  method: 'POST';
  headers: Record<string, string>;
  body: {
    receiptCode: string;
    action: MiniappActionKey;
    replayMode: 'LEDGER_REPLAY';
    requestedFrom: 'MINIAPP_RUNTIME';
    ticketCode: string;
  };
}

export interface MiniappAuthEnvelope {
  receiptCode: string;
  audience: 'miniapp-handler-sync';
  authScheme: 'M5-HMAC-SHA256';
  authorization: string;
  signedHeaders: string[];
  expiresAt: string;
  nonce: string;
}

export interface MiniappCallbackReceipt {
  receiptCode: string;
  callbackEndpoint: string;
  callbackStatus: 'callback-blocked' | 'awaiting-callback' | 'callback-recorded';
  ackToken: string;
  lastEvent: 'PREREQUISITE_PENDING' | 'CHALLENGE_PENDING' | 'HANDLER_ACCEPTED';
  summary: string;
}

export interface MiniappReplayRetryPolicy {
  receiptCode: string;
  replayEndpoint: string;
  retryable: boolean;
  maxAttempts: number;
  currentAttempt: number;
  nextBackoffMs: number;
  escalationAction: 'REFRESH_TICKET' | 'WAIT_CALLBACK' | 'OPEN_MANUAL_REVIEW';
  summary: string;
}

export interface MiniappRuntimeConsumerContract {
  wiring: AppBootstrapWiring;
  snapshot: MiniappBootstrapSnapshot;
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

export interface MiniappGovernanceReadModel {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  alerts: FoundationAlertCatalogItem[];
  summary: FoundationOperationsOverviewSummary;
  topRisks: FoundationOperationsAlert[];
}

interface MiniappMemberLoginResult {
  member: MiniappMemberProfileSnapshot;
  session: {
    sessionToken: string;
    memberId: string;
    userId: string;
    tenantId: string;
    brandId?: string;
    storeId?: string;
    issuedAt: string;
    expiresAt: string;
    authenticated: boolean;
  };
}

const defaultMiniappContext: Required<MiniappBootstrapContext> = {
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland',
};

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
  staleDrills: 0,
};

function resolveMiniappFallbackMarketPreset(marketCode: string): {
  defaultLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  socialPlatforms: string[];
  sharePolicy: MiniappBootstrapSnapshot['sharePolicy'];
} {
  if (marketCode === 'cn-mainland') {
    return {
      defaultLanguage: 'zh-CN',
      supportedLanguages: ['zh-CN', 'en-US'],
      timezone: 'Asia/Shanghai',
      socialPlatforms: ['WECHAT', 'XIAOHONGSHU'],
      sharePolicy: 'DOMESTIC_SOCIAL_FIRST',
    };
  }

  return {
    defaultLanguage: 'en-US',
    supportedLanguages: ['en-US'],
    timezone: 'America/New_York',
    socialPlatforms: ['INSTAGRAM', 'X'],
    sharePolicy: 'GLOBAL_CONTENT_FIRST',
  };
}

export function createMiniappFallbackSnapshot(
  context: MiniappBootstrapContext = defaultMiniappContext,
): MiniappBootstrapSnapshot {
  const resolvedContext = { ...defaultMiniappContext, ...context };
  const marketPreset = resolveMiniappFallbackMarketPreset(resolvedContext.marketCode);

  return {
    deliveryMode: 'fallback',
    marketCode: resolvedContext.marketCode,
    defaultLanguage: marketPreset.defaultLanguage,
    supportedLanguages: marketPreset.supportedLanguages,
    timezone: marketPreset.timezone,
    socialPlatforms: marketPreset.socialPlatforms,
    sharePolicy: marketPreset.sharePolicy,
    primaryDomain: `${resolvedContext.storeId}.${resolvedContext.brandId}.${resolvedContext.tenantId}.${resolvedContext.marketCode}.local`,
    supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
    domainSource: 'default',
  };
}

export function toMiniappBootstrapSnapshot(
  bootstrap: PortalBootstrapResponse,
): MiniappBootstrapSnapshot {
  return {
    deliveryMode: 'api',
    marketCode: bootstrap.marketProfile.marketCode,
    defaultLanguage: bootstrap.marketProfile.locale.defaultLanguage,
    supportedLanguages: bootstrap.storePortal.supportedLanguages,
    timezone: bootstrap.marketProfile.timezone.timezone,
    socialPlatforms: bootstrap.marketProfile.social.primaryPlatforms,
    sharePolicy:
      bootstrap.marketProfile.marketCode === 'cn-mainland'
        ? 'DOMESTIC_SOCIAL_FIRST'
        : 'GLOBAL_CONTENT_FIRST',
    primaryDomain: bootstrap.storePortal.primaryDomain,
    supportedSurfaces: bootstrap.storePortal.supportedSurfaces,
    domainSource: bootstrap.storePortal.domainSource ?? 'default',
  };
}

export function formatMiniappLocaleSummary(snapshot: MiniappBootstrapSnapshot): string {
  return `默认 ${snapshot.defaultLanguage}，支持 ${snapshot.supportedLanguages.join(' / ')}`;
}

export function formatMiniappSharePolicySummary(snapshot: MiniappBootstrapSnapshot): string {
  return snapshot.sharePolicy === 'DOMESTIC_SOCIAL_FIRST'
    ? '国内社交优先，优先分发到微信 / 小红书生态。'
    : '全球内容优先，优先分发到 Instagram / X 等全球渠道。';
}

function createMiniappBootstrapClient(context: MiniappBootstrapContext = defaultMiniappContext) {
  const resolvedContext = { ...defaultMiniappContext, ...context };

  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: resolvedContext.tenantId,
    brandId: resolvedContext.brandId,
    storeId: resolvedContext.storeId,
    marketCode: resolvedContext.marketCode,
  });
}

export async function loadMiniappBootstrapSnapshot(
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<MiniappBootstrapSnapshot> {
  try {
    const bootstrap = await createMiniappBootstrapClient(context).getPortalBootstrap();
    return toMiniappBootstrapSnapshot(bootstrap);
  } catch {
    return createMiniappFallbackSnapshot(context);
  }
}

export const miniappMarketBootstrap = createMiniappFallbackSnapshot();

export const miniappBootstrap = getFoundationAppBootstrapWiring('miniapp');

export async function refreshMiniappGovernanceAlerts(
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<{ generatedAt: string; alerts: FoundationAlertCatalogItem[] }> {
  const governance = await loadMiniappGovernanceReadModel(context);

  return {
    generatedAt: governance.generatedAt,
    alerts: governance.alerts,
  };
}

export async function loadMiniappGovernanceReadModel(
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<MiniappGovernanceReadModel> {
  const governance = await loadFoundationGovernanceReadModel(createMiniappBootstrapClient(context));
  return {
    deliveryMode: governance.deliveryMode,
    generatedAt: governance.generatedAt,
    alerts: governance.alerts,
    summary: governance.summary,
    topRisks: governance.topRisks,
  };
}

export async function loadMiniappAlertDrilldown(
  code: FoundationAlertCatalogItem['code'],
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<FoundationAlertDrilldownResponse> {
  try {
    return await createMiniappBootstrapClient(context).getFoundationAlertDrilldown(code, {
      cache: 'no-store',
    });
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      history: [],
      detail: {
        mode: 'fallback',
        summary: `当前无法读取 ${code} 的真实 drilldown，保留目录级别展示。`,
      },
    };
  }
}

export async function acknowledgeMiniappGovernanceAlert(
  code: FoundationAlertCatalogItem['code'],
  note = 'miniapp-acknowledged',
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<FoundationAlertMutationResponse> {
  try {
    return await createMiniappBootstrapClient(context).acknowledgeFoundationAlert(code, { note });
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      acknowledgement: {
        status: 'ACKED',
        note,
        actorId: 'miniapp-fallback',
        acknowledgedAt: '2026-06-13T00:00:00.000Z',
        mutedUntil: null,
        updatedAt: '2026-06-13T00:00:00.000Z',
      },
      history: [
        {
          action: 'ACK',
          note,
          actorId: 'miniapp-fallback',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:00:00.000Z',
          source: 'miniapp-fallback',
        },
      ],
    };
  }
}

export async function muteMiniappGovernanceAlert(
  code: FoundationAlertCatalogItem['code'],
  input: { note?: string; mutedUntil?: string } = {},
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<FoundationAlertMutationResponse> {
  const resolvedInput = {
    note: input.note ?? 'miniapp-muted',
    mutedUntil: input.mutedUntil ?? '2026-06-14T00:00:00.000Z',
  };

  try {
    return await createMiniappBootstrapClient(context).muteFoundationAlert(code, resolvedInput);
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      acknowledgement: {
        status: 'MUTED',
        note: resolvedInput.note,
        actorId: 'miniapp-fallback',
        acknowledgedAt: '2026-06-13T00:00:00.000Z',
        mutedUntil: resolvedInput.mutedUntil,
        updatedAt: '2026-06-13T00:00:00.000Z',
      },
      history: [
        {
          action: 'MUTE',
          note: resolvedInput.note,
          actorId: 'miniapp-fallback',
          mutedUntil: resolvedInput.mutedUntil,
          visibleInOverview: false,
          createdAt: '2026-06-13T00:00:00.000Z',
          source: 'miniapp-fallback',
        },
      ],
    };
  }
}

export async function unmuteMiniappGovernanceAlert(
  code: FoundationAlertCatalogItem['code'],
  note = 'miniapp-unmuted',
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<FoundationAlertMutationResponse> {
  try {
    return await createMiniappBootstrapClient(context).unmuteFoundationAlert(code, { note });
  } catch {
    return {
      generatedAt: 'fallback',
      code,
      acknowledgement: {
        status: 'ACKED',
        note,
        actorId: 'miniapp-fallback',
        acknowledgedAt: '2026-06-13T00:00:00.000Z',
        mutedUntil: null,
        updatedAt: '2026-06-13T00:00:00.000Z',
      },
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
      history: [
        {
          action: 'UNMUTE',
          note,
          actorId: 'miniapp-fallback',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:00:00.000Z',
          source: 'miniapp-fallback',
        },
      ],
    };
  }
}

export function createMiniappRuntimeConsumerContract(
  snapshot: MiniappBootstrapSnapshot,
  context: MiniappBootstrapContext = defaultMiniappContext,
  governance?: {
    deliveryMode: 'api' | 'fallback';
    generatedAt: string;
    alerts: FoundationAlertCatalogItem[];
    summary: FoundationOperationsOverviewSummary;
    topRisks: FoundationOperationsAlert[];
  } | null,
): MiniappRuntimeConsumerContract {
  const resolvedContext = { ...defaultMiniappContext, ...context };

  return {
    wiring: miniappBootstrap,
    snapshot,
    scope: {
      scopePath: `${resolvedContext.marketCode} / ${resolvedContext.tenantId} / ${resolvedContext.brandId} / ${resolvedContext.storeId}`,
      resolver: miniappBootstrap.tenantScope.resolver,
      mismatchStrategy: miniappBootstrap.tenantScope.mismatchStrategy,
      revalidateOn: miniappBootstrap.tenantScope.revalidateOn,
    },
    degradation: {
      featureFlagFallback: miniappBootstrap.featureFlags.fallbackStrategy,
      desensitizationMode: miniappBootstrap.desensitization.defaultMode,
      cacheableCapabilities: miniappBootstrap.cacheableCapabilities,
    },
    challenge: {
      enforcement: miniappBootstrap.riskChallenge.enforcement,
      notes: miniappBootstrap.riskChallenge.notes,
    },
    governance: {
      deliveryMode: governance?.deliveryMode ?? 'fallback',
      generatedAt: governance?.generatedAt ?? 'local-fallback',
      alerts: governance?.alerts ?? foundationAlertCatalogFallback,
      summary: governance?.summary ?? emptyGovernanceOverviewSummary,
      topRisks: governance?.topRisks ?? [],
    },
  };
}

export async function loadMiniappRuntimeConsumerContract(
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<MiniappRuntimeConsumerContract> {
  const [snapshot, governance] = await Promise.all([
    loadMiniappBootstrapSnapshot(context),
    loadMiniappGovernanceReadModel(context),
  ]);

  return createMiniappRuntimeConsumerContract(snapshot, context, {
    deliveryMode: governance.deliveryMode,
    generatedAt: governance.generatedAt,
    alerts: governance.alerts,
    summary: governance.summary,
    topRisks: governance.topRisks,
  });
}

export function createGuestMemberSession(): MiniappMemberSession {
  return {
    authenticated: false,
    memberTier: 'GUEST',
    points: 0,
    couponCount: 0,
    profileSource: 'fallback',
    deliveryMode: 'fallback',
  };
}

export function createMemberSession(
  memberTier: 'MEMBER' | 'SVIP' = 'MEMBER',
): MiniappMemberSession {
  return {
    authenticated: true,
    memberTier,
    memberId: memberTier === 'SVIP' ? 'wx-open-svip-001' : 'wx-open-member-001',
    nickname: memberTier === 'SVIP' ? '微信会员_SVIP_001' : '微信会员_001',
    points: memberTier === 'SVIP' ? 1280 : 320,
    couponCount: memberTier === 'SVIP' ? 6 : 2,
    profileSource: 'fallback',
    deliveryMode: 'fallback',
  };
}

function resolveMiniappMemberTier(
  profile: MiniappMemberProfileSnapshot,
): MiniappMemberSession['memberTier'] {
  if (profile.svipStatus === 'ACTIVE') {
    return 'SVIP';
  }

  return profile.status === 'ACTIVE' ? 'MEMBER' : 'GUEST';
}

function estimateMiniappCouponCount(profile: MiniappMemberProfileSnapshot): number {
  if (profile.svipStatus === 'ACTIVE') {
    return 6;
  }
  if (profile.points >= 50000) {
    return 4;
  }
  if (profile.points >= 2000) {
    return 2;
  }
  return 1;
}

export function toMiniappMemberSessionFromProfile(
  profile: MiniappMemberProfileSnapshot,
  session?: MiniappMemberLoginResult['session'],
): MiniappMemberSession {
  return {
    authenticated: session?.authenticated ?? false,
    memberTier: resolveMiniappMemberTier(profile),
    points: profile.points,
    couponCount: estimateMiniappCouponCount(profile),
    memberId: profile.memberId,
    nickname: profile.nickname,
    mobile: profile.mobile,
    sessionToken: session?.sessionToken,
    expiresAt: session?.expiresAt,
    profileSource: profile.source ?? 'memory',
    deliveryMode: 'api',
  };
}

export async function loadMiniappMemberRuntimeSnapshot(
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<MiniappMemberRuntimeSnapshot> {
  const client = createMiniappBootstrapClient(context);

  try {
    const availableMembers = await client.getData<MiniappMemberProfileSnapshot[]>(
      '/members/persistent',
      {
        cache: 'no-store',
      },
    );

    if (availableMembers.length === 0) {
      return {
        deliveryMode: 'api',
        session: {
          ...createGuestMemberSession(),
          deliveryMode: 'api',
        },
        profile: null,
        availableMembers,
        sessionVerified: false,
        note: '当前租户暂无持久化会员，会员中心暂以游客态展示。',
      };
    }

    const profile = availableMembers.find((item) => item.mobile) ?? availableMembers[0]!;

    if (!profile.mobile) {
      return {
        deliveryMode: 'api',
        session: toMiniappMemberSessionFromProfile(profile),
        profile,
        availableMembers,
        sessionVerified: false,
        note: '已读取真实会员档案，但该会员缺少手机号，暂无法自动建立登录会话。',
      };
    }

    const loginResult = await client.postData<MiniappMemberLoginResult>(
      '/members/login',
      { mobile: profile.mobile },
      { cache: 'no-store' },
    );

    try {
      await client.getData(`/members/sessions/${loginResult.session.sessionToken}`, {
        cache: 'no-store',
      });
    } catch {
      return {
        deliveryMode: 'api',
        session: toMiniappMemberSessionFromProfile(loginResult.member, loginResult.session),
        profile: loginResult.member,
        availableMembers,
        sessionVerified: false,
        note: '已读取真实会员档案并创建登录态，但会话校验暂未通过，当前先按本地同步结果展示。',
      };
    }

    return {
      deliveryMode: 'api',
      session: toMiniappMemberSessionFromProfile(loginResult.member, loginResult.session),
      profile: loginResult.member,
      availableMembers,
      sessionVerified: true,
      note: '已接通真实会员档案与登录态，小程序会员中心优先展示持久化会员数据。',
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      session: createGuestMemberSession(),
      profile: null,
      availableMembers: [],
      sessionVerified: false,
      note: '当前无法读取真实会员档案，会员中心回退到本地游客态演示。',
    };
  }
}

export function resolveMiniappBootstrapState(
  snapshot: MiniappBootstrapSnapshot,
  session: MiniappMemberSession,
  action: MiniappActionKey,
): FoundationFrontendBootstrapState {
  if (snapshot.deliveryMode === 'fallback') {
    return 'readonly-fallback';
  }

  if (!session.authenticated) {
    return action === 'member-login' ? 'challenge-required' : 'scope-mismatch';
  }

  if (action === 'coupon-claim') {
    return 'challenge-required';
  }

  return 'ready';
}

export function resolveMiniappActionDecision(
  snapshot: MiniappBootstrapSnapshot,
  session: MiniappMemberSession,
  action: MiniappActionKey,
): MiniappActionDecision {
  const bootstrapState = resolveMiniappBootstrapState(snapshot, session, action);

  if (bootstrapState === 'readonly-fallback') {
    return {
      bootstrapState,
      allowed: false,
      title: '当前为只读降级快照',
      helper: '移动端 fallback 只允许展示门店与市场信息，登录、预约、领券等动作需等待 API 恢复。',
      nextStep: 'REFRESH',
    };
  }

  if (!session.authenticated) {
    return {
      bootstrapState,
      allowed: false,
      title: action === 'member-login' ? '需要先拉起微信登录挑战' : '请先完成会员登录',
      helper:
        action === 'member-login'
          ? '登录动作进入 challenge-required 状态后，才能继续进入会员、积分和券权益链路。'
          : '预约与领券都依赖实时会员会话，当前不能只靠本地快照放行。',
      nextStep: action === 'member-login' ? 'CHALLENGE' : 'LOGIN',
    };
  }

  if (action === 'coupon-claim') {
    return {
      bootstrapState,
      allowed: false,
      title: '领券前需要实时风控挑战',
      helper: '小程序端的领券、拼团、裂变在命中风控时必须先走微信生态内挑战。',
      nextStep: 'CHALLENGE',
    };
  }

  return {
    bootstrapState,
    allowed: true,
    title: action === 'booking-submit' ? '预约动作可继续' : '会员中心可继续',
    helper:
      action === 'booking-submit'
        ? '当前会话已具备实时 bootstrap，可进入预约提交流程。'
        : `当前会员层级为 ${session.memberTier}，可继续查看积分、券包与 SVIP 权益。`,
    nextStep: 'PROCEED',
  };
}

export function createMiniappActionPlan(
  snapshot: MiniappBootstrapSnapshot,
  session: MiniappMemberSession,
  action: MiniappActionKey,
): MiniappActionPlan {
  const decision = resolveMiniappActionDecision(snapshot, session, action);

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
            ? 'WECHAT_LOGIN'
            : 'MEMBER_RUNTIME',
      draftSummary: `按 ${snapshot.marketCode} 市场的 ${formatMiniappLocaleSummary(snapshot)} 准备会员会话刷新。`,
      checklist: ['校验租户/品牌/门店上下文', '拉起微信登录或静默授权', '刷新会员会话与积分权益'],
      requestPreview: {
        endpoint: '/api/v1/members/session/challenge',
        method: 'POST',
        payload: {
          marketCode: snapshot.marketCode,
          memberTier: session.memberTier,
          authenticated: session.authenticated,
        },
      },
    };
  }

  if (action === 'coupon-claim') {
    return {
      action,
      label: '领券请求',
      decision,
      riskLevel: 'high',
      channel:
        decision.nextStep === 'REFRESH'
          ? 'BOOTSTRAP_REFRESH'
          : decision.nextStep === 'LOGIN'
            ? 'WECHAT_LOGIN'
            : decision.nextStep === 'CHALLENGE'
              ? 'WECHAT_CHALLENGE'
              : 'MEMBER_RUNTIME',
      draftSummary: `基于 ${session.memberTier} 会员态校验券权益，当前券包数量 ${session.couponCount}，分享策略为 ${formatMiniappSharePolicySummary(snapshot)}`,
      checklist: ['确认会员已登录', '拉取实时券模板与活动批次', '命中风控时先完成微信生态挑战'],
      requestPreview: {
        endpoint: '/api/v1/storefront/coupons/claim',
        method: 'POST',
        payload: {
          marketCode: snapshot.marketCode,
          couponTemplateCode: 'NEW_MEMBER_GIFT',
          memberTier: session.memberTier,
          couponCount: session.couponCount,
        },
      },
    };
  }

  return {
    action,
    label: '预约提交',
    decision,
    riskLevel: decision.allowed ? 'medium' : 'high',
    channel:
      decision.nextStep === 'REFRESH'
        ? 'BOOTSTRAP_REFRESH'
        : decision.nextStep === 'LOGIN'
          ? 'WECHAT_LOGIN'
          : decision.nextStep === 'CHALLENGE'
            ? 'WECHAT_CHALLENGE'
            : 'MEMBER_RUNTIME',
    draftSummary: `按 ${snapshot.primaryDomain} 门店上下文提交预约，当前会员积分 ${session.points}。`,
    checklist: [
      '确认门店营业时间与预约时间窗',
      '校验会员会话与联系人信息',
      '提交前刷新实时 bootstrap 与库存结果',
    ],
    requestPreview: {
      endpoint: '/api/v1/storefront/bookings',
      method: 'POST',
      payload: {
        marketCode: snapshot.marketCode,
        storeDomain: snapshot.primaryDomain,
        memberTier: session.memberTier,
        bookingSlot: '2026-06-12T10:00:00+08:00',
      },
    },
  };
}

export function listMiniappActionPlans(
  snapshot: MiniappBootstrapSnapshot,
  session: MiniappMemberSession,
): MiniappActionPlan[] {
  return [
    createMiniappActionPlan(snapshot, session, 'member-login'),
    createMiniappActionPlan(snapshot, session, 'booking-submit'),
    createMiniappActionPlan(snapshot, session, 'coupon-claim'),
  ];
}

export function submitMiniappActionPlan(plan: MiniappActionPlan): MiniappSubmitOutcome {
  const payloadSummary = JSON.stringify(plan.requestPreview.payload);
  const receiptCode = `MINIAPP-${plan.action.toUpperCase()}-${plan.decision.nextStep}`;

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
      recommendedAction:
        plan.decision.nextStep === 'REFRESH' ? 'REFRESH_BOOTSTRAP' : 'COMPLETE_LOGIN',
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
      recommendedAction: 'COMPLETE_CHALLENGE',
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
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
  };
}

export function createMiniappSubmitHistoryEntry(
  outcome: MiniappSubmitOutcome,
  occurredAt = '2026-06-12T00:00:00.000Z',
): MiniappSubmitHistoryEntry {
  return {
    receiptCode: outcome.receiptCode,
    action: outcome.action,
    state: outcome.state,
    endpoint: outcome.endpoint,
    occurredAt,
    recommendedAction: outcome.recommendedAction,
    summary: `${outcome.action} -> ${outcome.state} -> ${outcome.recommendedAction}`,
  };
}

export function appendMiniappSubmitHistory(
  history: MiniappSubmitHistoryEntry[],
  outcome: MiniappSubmitOutcome,
): MiniappSubmitHistoryEntry[] {
  return [createMiniappSubmitHistoryEntry(outcome), ...history].slice(0, 5);
}

export function buildMiniappLedger(history: MiniappSubmitHistoryEntry[]): MiniappLedgerRecord[] {
  return history.map((entry) => ({
    receiptCode: entry.receiptCode,
    ledgerKey: `miniapp-ledger:${entry.receiptCode}`,
    action: entry.action,
    state: entry.state,
    replayEndpoint: `/api/v1/storefront/actions/${entry.receiptCode}/replay`,
    replayable: entry.state === 'submitted',
    recommendedAction: entry.recommendedAction,
    summary: entry.summary,
  }));
}

export function replayMiniappSubmitHistoryEntry(
  entry: MiniappSubmitHistoryEntry,
): MiniappReplayOutcome {
  const replayEndpoint = `/api/v1/storefront/actions/${entry.receiptCode}/replay`;

  if (entry.state === 'blocked') {
    return {
      receiptCode: entry.receiptCode,
      status: 'replay-skipped',
      replayEndpoint,
      message: '该记录仍处于阻断态，需先完成建议动作后才能回放。',
    };
  }

  if (entry.state === 'challenge-issued') {
    return {
      receiptCode: entry.receiptCode,
      status: 'replay-blocked',
      replayEndpoint,
      message: '该记录仍等待挑战完成，挑战通过后才允许进入回放。',
    };
  }

  return {
    receiptCode: entry.receiptCode,
    status: 'replay-scheduled',
    replayEndpoint,
    message: '已将该记录加入模拟回放队列，后续可接服务端 ledger replay。',
  };
}

export function createMiniappActionTicket(outcome: MiniappSubmitOutcome): MiniappActionTicket {
  if (outcome.state === 'blocked') {
    return {
      receiptCode: outcome.receiptCode,
      ticketCode: `${outcome.receiptCode}-BLOCK`,
      ticketType: 'BLOCK_GUARD',
      status: 'waiting-prerequisite',
      summary: `${outcome.action} 仍缺少前置条件，需先执行 ${outcome.recommendedAction}。`,
    };
  }

  if (outcome.state === 'challenge-issued') {
    return {
      receiptCode: outcome.receiptCode,
      ticketCode: `${outcome.receiptCode}-CHALLENGE`,
      ticketType: 'CHALLENGE_GATE',
      status: 'pending-challenge',
      summary: `${outcome.action} 已签发挑战票据，挑战完成后才可继续 sync handler。`,
    };
  }

  return {
    receiptCode: outcome.receiptCode,
    ticketCode: `${outcome.receiptCode}-HANDLER`,
    ticketType: 'HANDLER_CALLBACK',
    status: 'ready-for-handler',
    summary: `${outcome.action} 已具备 handler sync 前提，可继续等待服务端回调。`,
  };
}

export function buildMiniappHandlerSyncContract(
  outcome: MiniappSubmitOutcome,
): MiniappHandlerSyncContract {
  const ticket = createMiniappActionTicket(outcome);
  const handlerName =
    outcome.action === 'member-login'
      ? 'miniapp-member-session-handler'
      : outcome.action === 'coupon-claim'
        ? 'miniapp-coupon-claim-handler'
        : 'miniapp-booking-submit-handler';

  return {
    receiptCode: outcome.receiptCode,
    handlerName,
    syncMode:
      outcome.state === 'blocked'
        ? 'deferred'
        : outcome.state === 'challenge-issued'
          ? 'challenge-gated'
          : 'callback-followup',
    syncEndpoint: `/api/v1/storefront/handlers/${handlerName}/sync`,
    callbackEndpoint: `/api/v1/storefront/handlers/${handlerName}/callbacks/${outcome.receiptCode}`,
    idempotencyKey: `miniapp-sync:${outcome.receiptCode}`,
    ticketCode: ticket.ticketCode,
    ready: outcome.state === 'submitted',
    summary:
      outcome.state === 'submitted'
        ? `${handlerName} 已可按回执同步服务端状态。`
        : `${handlerName} 仍等待 ${outcome.recommendedAction} 后再进入同步。`,
  };
}

export function createMiniappReplayRequest(record: MiniappLedgerRecord): MiniappReplayRequest {
  return {
    receiptCode: record.receiptCode,
    ledgerKey: record.ledgerKey,
    endpoint: record.replayEndpoint,
    method: 'POST',
    headers: {
      'x-m5-ledger-key': record.ledgerKey,
      'x-m5-receipt-code': record.receiptCode,
    },
    body: {
      receiptCode: record.receiptCode,
      action: record.action,
      replayMode: 'LEDGER_REPLAY',
      requestedFrom: 'MINIAPP_RUNTIME',
      ticketCode: `${record.receiptCode}-${record.replayable ? 'HANDLER' : 'REVIEW'}`,
    },
  };
}

export function buildMiniappAuthEnvelope(sync: MiniappHandlerSyncContract): MiniappAuthEnvelope {
  return {
    receiptCode: sync.receiptCode,
    audience: 'miniapp-handler-sync',
    authScheme: 'M5-HMAC-SHA256',
    authorization: `M5 ${sync.ticketCode}.${sync.idempotencyKey}`,
    signedHeaders: ['x-m5-ticket-code', 'x-m5-idempotency-key', 'x-m5-receipt-code'],
    expiresAt: '2026-06-12T00:05:00.000Z',
    nonce: `nonce:${sync.receiptCode}`,
  };
}

export function createMiniappCallbackReceipt(
  outcome: MiniappSubmitOutcome,
  sync: MiniappHandlerSyncContract,
): MiniappCallbackReceipt {
  if (outcome.state === 'blocked') {
    return {
      receiptCode: outcome.receiptCode,
      callbackEndpoint: sync.callbackEndpoint,
      callbackStatus: 'callback-blocked',
      ackToken: `${outcome.receiptCode}-ACK-BLOCKED`,
      lastEvent: 'PREREQUISITE_PENDING',
      summary: '当前仍缺少前置条件，服务端 callback 只记录阻断原因。',
    };
  }

  if (outcome.state === 'challenge-issued') {
    return {
      receiptCode: outcome.receiptCode,
      callbackEndpoint: sync.callbackEndpoint,
      callbackStatus: 'callback-blocked',
      ackToken: `${outcome.receiptCode}-ACK-CHALLENGE`,
      lastEvent: 'CHALLENGE_PENDING',
      summary: '当前仍等待挑战完成，服务端 callback 暂不落最终提交结果。',
    };
  }

  return {
    receiptCode: outcome.receiptCode,
    callbackEndpoint: sync.callbackEndpoint,
    callbackStatus: 'awaiting-callback',
    ackToken: `${outcome.receiptCode}-ACK-HANDLER`,
    lastEvent: 'HANDLER_ACCEPTED',
    summary: 'handler 已接受同步请求，等待服务端回写最终 callback receipt。',
  };
}

export function createMiniappReplayRetryPolicy(
  record: MiniappLedgerRecord,
  replayOutcome: MiniappReplayOutcome,
): MiniappReplayRetryPolicy {
  if (replayOutcome.status === 'replay-scheduled') {
    return {
      receiptCode: record.receiptCode,
      replayEndpoint: record.replayEndpoint,
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 1,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: '当前已进入第一次重放，优先等待服务端 callback 再决定是否继续重试。',
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
      summary: '当前仍等待挑战票据完成，需先刷新 ticket 再进入重放。',
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
    summary: '当前记录仍被前置条件阻断，应转人工复核而非继续自动重放。',
  };
}
function createMiniappRuntimeReceiptFallback(
  plan: MiniappActionPlan,
  outcome: MiniappSubmitOutcome,
): RuntimeGovernanceReceipt {
  const ticket = createMiniappActionTicket(outcome);
  const sync = buildMiniappHandlerSyncContract(outcome);
  const callback = createMiniappCallbackReceipt(outcome, sync);
  const historyEntry = createMiniappSubmitHistoryEntry(outcome);
  const ledger = buildMiniappLedger([historyEntry])[0]!;
  const replayOutcome = replayMiniappSubmitHistoryEntry(historyEntry);
  const retry = createMiniappReplayRetryPolicy(ledger, replayOutcome);

  return {
    receiptCode: outcome.receiptCode,
    app: 'miniapp',
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
      summary: sync.summary,
    },
    callback: {
      callbackStatus: callback.callbackStatus,
      ackToken: callback.ackToken,
      lastEvent: callback.lastEvent,
      summary: callback.summary,
    },
    ledger: {
      ledgerKey: ledger.ledgerKey,
      replayEndpoint: ledger.replayEndpoint,
      replayable: ledger.replayable,
      summary: ledger.summary,
    },
    retry: {
      replayEndpoint: retry.replayEndpoint,
      retryable: retry.retryable,
      maxAttempts: retry.maxAttempts,
      currentAttempt: retry.currentAttempt,
      nextBackoffMs: retry.nextBackoffMs,
      escalationAction: retry.escalationAction,
      summary: retry.summary,
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: `miniapp:${outcome.action}:tenant-demo`,
    },
    events: [
      {
        eventType: 'runtime-governance.action.submitted',
        status: 'accepted',
        idempotencyKey: sync.idempotencyKey,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: `${outcome.action} 使用 fallback receipt 返回本地演示结果。`,
      },
    ],
    generatedAt: 'local-fallback',
  };
}

export async function submitMiniappActionPlanToApi(
  plan: MiniappActionPlan,
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<RuntimeGovernanceReceipt> {
  const outcome = submitMiniappActionPlan(plan);
  const sync = buildMiniappHandlerSyncContract(outcome);

  try {
    return await createMiniappBootstrapClient(context).submitRuntimeGovernanceAction({
      app: 'miniapp',
      action: plan.action,
      nextStep: outcome.nextStep,
      riskLevel: plan.riskLevel,
      requestEndpoint: plan.requestPreview.endpoint,
      payload: plan.requestPreview.payload as unknown as Record<string, unknown>,
      payloadSummary: outcome.payloadSummary,
      recommendedAction: outcome.recommendedAction,
      handlerName: sync.handlerName,
      idempotencyKey: sync.idempotencyKey,
    });
  } catch {
    return createMiniappRuntimeReceiptFallback(plan, outcome);
  }
}

export async function loadMiniappRuntimeReceipt(
  receiptCode: string,
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<RuntimeGovernanceReceipt | null> {
  try {
    return await createMiniappBootstrapClient(context).getRuntimeGovernanceReceipt(receiptCode);
  } catch {
    return null;
  }
}

function createMiniappRuntimeSyncFallback(
  receipt: RuntimeGovernanceReceipt,
): RuntimeGovernanceReceipt {
  return {
    ...receipt,
    sync: {
      ...receipt.sync,
      ready: receipt.ticket.status === 'ready-for-handler',
      summary:
        receipt.ticket.status === 'ready-for-handler'
          ? `${receipt.sync.handlerName} 已记录 fallback sync，请等待 callback。`
          : `${receipt.sync.handlerName} 当前仍待前置条件完成。`,
    },
    callback:
      receipt.ticket.status === 'ready-for-handler'
        ? {
            ...receipt.callback,
            callbackStatus: 'awaiting-callback',
            lastEvent: 'HANDLER_ACCEPTED',
            summary: 'fallback 已记录 sync，请等待 callback。',
          }
        : receipt.callback,
    events: [
      ...receipt.events,
      {
        eventType: 'runtime-governance.handler.sync.requested',
        status: 'accepted',
        idempotencyKey: receipt.sync.idempotencyKey,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: 'fallback 已记录 handler sync。',
      },
    ],
    generatedAt: 'local-fallback',
  };
}

export async function syncMiniappRuntimeReceipt(
  receipt: RuntimeGovernanceReceipt,
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<RuntimeGovernanceReceipt> {
  try {
    return await createMiniappBootstrapClient(context).syncRuntimeGovernanceAction(
      receipt.receiptCode,
      {
        handlerName: receipt.sync.handlerName,
        ticketCode: receipt.ticket.ticketCode,
        idempotencyKey: receipt.sync.idempotencyKey,
      },
    );
  } catch {
    return createMiniappRuntimeSyncFallback(receipt);
  }
}

function createMiniappRuntimeCallbackFallback(
  receipt: RuntimeGovernanceReceipt,
): RuntimeGovernanceReceipt {
  return {
    ...receipt,
    state: 'callback-recorded',
    callback: {
      ...receipt.callback,
      callbackStatus: 'callback-recorded',
      lastEvent: 'HANDLER_COMPLETED',
      summary: 'fallback 已记录 handler callback。',
    },
    ledger: {
      ...receipt.ledger,
      replayable: true,
      summary: 'callback 已记录，可进入 replay。',
    },
    retry: {
      ...receipt.retry,
      retryable: false,
      nextBackoffMs: 0,
      summary: 'callback 已完成，当前无需继续自动重试。',
    },
    events: [
      ...receipt.events,
      {
        eventType: 'runtime-governance.handler.callback.recorded',
        status: 'accepted',
        idempotencyKey: `${receipt.sync.idempotencyKey}:callback`,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: 'fallback 已记录 callback。',
      },
    ],
    generatedAt: 'local-fallback',
  };
}

export async function recordMiniappRuntimeCallback(
  receipt: RuntimeGovernanceReceipt,
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<RuntimeGovernanceReceipt> {
  try {
    return await createMiniappBootstrapClient(context).recordRuntimeGovernanceCallback(
      receipt.receiptCode,
      {
        callbackStatus: 'callback-recorded',
        ackToken: receipt.callback.ackToken,
        lastEvent: 'HANDLER_COMPLETED',
        summary: `${receipt.action} handler callback recorded`,
        idempotencyKey: `${receipt.sync.idempotencyKey}:callback`,
      },
    );
  } catch {
    return createMiniappRuntimeCallbackFallback(receipt);
  }
}

function createMiniappRuntimeReplayFallback(
  receipt: RuntimeGovernanceReceipt,
): RuntimeGovernanceReceipt {
  const nextRetry = advanceRuntimeGovernanceReplayPolicy(receipt.retry);

  return {
    ...receipt,
    state: receipt.ledger.replayable ? 'replay-scheduled' : receipt.state,
    ledger: {
      ...receipt.ledger,
      replayable: false,
      summary: receipt.ledger.replayable
        ? 'fallback 已将当前回执加入本地 replay 队列。'
        : receipt.ledger.summary,
    },
    retry: {
      ...receipt.retry,
      ...nextRetry,
      summary: nextRetry.retryable
        ? 'fallback 已记录一次 replay，请等待下一次状态刷新。'
        : 'fallback replay 已达上限，转人工复核。',
    },
    events: [
      ...receipt.events,
      {
        eventType: 'runtime-governance.replay.scheduled',
        status: 'accepted',
        idempotencyKey: `miniapp-replay:${receipt.receiptCode}:${nextRetry.currentAttempt}`,
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: receipt.ledger.replayable
          ? 'fallback 触发本地 replay。'
          : 'fallback replay 被跳过。',
      },
    ],
    generatedAt: 'local-fallback',
  };
}

export async function replayMiniappRuntimeReceipt(
  receipt: RuntimeGovernanceReceipt,
  context: MiniappBootstrapContext = defaultMiniappContext,
): Promise<RuntimeGovernanceReceipt> {
  try {
    return await createMiniappBootstrapClient(context).replayRuntimeGovernanceAction(
      receipt.receiptCode,
      {
        ledgerKey: receipt.ledger.ledgerKey,
        requestedFrom: 'MINIAPP_RUNTIME',
        ticketCode: receipt.ticket.ticketCode,
        idempotencyKey: `miniapp-replay:${receipt.receiptCode}:${receipt.retry.currentAttempt + 1}`,
      },
    );
  } catch {
    return createMiniappRuntimeReplayFallback(receipt);
  }
}
