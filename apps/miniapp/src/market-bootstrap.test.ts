import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  appendMiniappSubmitHistory,
  buildMiniappAuthEnvelope,
  buildMiniappLedger,
  buildMiniappHandlerSyncContract,
  createMiniappCallbackReceipt,
  createMiniappActionTicket,
  createMiniappReplayRequest,
  createMiniappRuntimeConsumerContract,
  createMiniappReplayRetryPolicy,
  createMiniappSubmitHistoryEntry,
  createMiniappActionPlan,
  createGuestMemberSession,
  createMemberSession,
  createMiniappFallbackSnapshot,
  loadMiniappMemberRuntimeSnapshot,
  listMiniappActionPlans,
  loadMiniappRuntimeConsumerContract,
  loadMiniappRuntimeReceipt,
  toMiniappMemberSessionFromProfile,
  loadMiniappBootstrapSnapshot,
  acknowledgeMiniappGovernanceAlert,
  loadMiniappAlertDrilldown,
  recordMiniappRuntimeCallback,
  loadMiniappGovernanceReadModel,
  muteMiniappGovernanceAlert,
  unmuteMiniappGovernanceAlert,
  refreshMiniappGovernanceAlerts,
  replayMiniappRuntimeReceipt,
  replayMiniappSubmitHistoryEntry,
  resolveMiniappActionDecision,
  syncMiniappRuntimeReceipt,
  submitMiniappActionPlanToApi,
  submitMiniappActionPlan,
  formatMiniappLocaleSummary,
  formatMiniappSharePolicySummary,
  toMiniappBootstrapSnapshot
} from './market-bootstrap';
import type { MiniappBookingSubmitDraft } from './market-bootstrap';

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB',
      scopeType: 'TENANT',
      scopeCode: 'tenant-demo',
      tenantCode: 'tenant-demo',
      brandCode: undefined,
      marketCode: 'cn-mainland',
      channel: 'WEB',
      name: 'tenant-demo ToB 官网',
      primaryDomain: 'tenant-demo.cn-mainland.b2b.local',
      supportedLanguages: ['zh-CN'],
      heroTitle: 'tenant-demo 企业级经营门户',
      heroSubtitle: 'demo',
      solutionTags: [],
      loginEntry: { label: '进入租户后台', loginPath: '/cn-mainland/tenant-demo/login', ssoEnabled: true }, domainSource: 'default'
    },
    brandPortal: {
      audience: 'TOB',
      scopeType: 'BRAND',
      scopeCode: 'brand-demo',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      marketCode: 'cn-mainland',
      channel: 'WEB',
      name: 'brand-demo 品牌 ToB 官网',
      primaryDomain: 'brand-demo.tenant-demo.cn-mainland.b2b.local',
      supportedLanguages: ['zh-CN'],
      heroTitle: 'brand-demo 品牌经营官网',
      heroSubtitle: 'demo',
      solutionTags: [],
      loginEntry: { label: '进入品牌后台', loginPath: '/cn-mainland/tenant-demo/brand-demo/login', ssoEnabled: true }, domainSource: 'default'
    },
    storePortal: {
      audience: 'TOC',
      scopeType: 'STORE',
      scopeCode: 'store-001',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001',
      storeName: 'store-001 门店',
      marketCode: 'cn-mainland',
      channel: 'WEB',
      name: 'store-001 门店门户',
      primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
      supportedLanguages: ['zh-CN'],
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'], domainSource: 'default'
    },
    marketProfile: {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      countryCode: 'CN',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 6, taxLabel: '增值税' },
      network: {
        networkRegion: 'MAINLAND_CHINA',
        apiBaseUrl: 'https://cn-api.m5.local',
        cdnBaseUrl: 'https://cn-cdn.m5.local',
        callbackBaseUrl: 'https://cn-hooks.m5.local'
      },
      email: {
        provider: 'ALIYUN_DM',
        fromName: 'M5 China',
        fromAddress: 'hello-cn@m5.local',
        replyTo: 'support-cn@m5.local'
      },
      social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT'] }
    },
    regionalOverrides: [],
    foundationDependencies: ['identity-access', 'configuration-governance'],
    foundationContracts: ['@m5/types']
  };
}

function createDomainGovernanceFixture() {
  return {
    totalMissingPrimaryScopes: 1,
    totalActiveWithoutPrimaryDomains: 2,
    recommendedReadyScopes: 1,
    tenantMissingPrimaryScopes: 0,
    brandMissingPrimaryScopes: 0,
    storeMissingPrimaryScopes: 1,
    requiresAttention: true,
    lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
    currentScopes: [
      {
        scopeType: 'STORE',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        activeDomainCount: 2,
        missingPrimary: true,
        currentPrimaryDomain: null,
        recommendedDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
        recommendationReason: '优先选择 active_ssl'
      }
    ]
  };
}

test('miniapp bootstrap: fallback snapshot stays aligned to store portal defaults', () => {
  assert.deepEqual(createMiniappFallbackSnapshot(), {
    deliveryMode: 'fallback',
    marketCode: 'cn-mainland',
    defaultLanguage: 'zh-CN',
    supportedLanguages: ['zh-CN', 'en-US'],
    timezone: 'Asia/Shanghai',
    socialPlatforms: ['WECHAT', 'XIAOHONGSHU'],
    sharePolicy: 'DOMESTIC_SOCIAL_FIRST',
    primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
    supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
    domainSource: 'default',
    domainGovernance: {
      totalMissingPrimaryScopes: 0,
      totalActiveWithoutPrimaryDomains: 0,
      recommendedReadyScopes: 0,
      tenantMissingPrimaryScopes: 0,
      brandMissingPrimaryScopes: 0,
      storeMissingPrimaryScopes: 0,
      requiresAttention: false,
      lastEvaluatedAt: '1970-01-01T00:00:00.000Z',
      currentScopes: []
    }
  });
});

test('miniapp bootstrap: maps portal bootstrap into runtime snapshot', () => {
  assert.deepEqual(toMiniappBootstrapSnapshot(createPortalBootstrapFixture(), createDomainGovernanceFixture()), {
    deliveryMode: 'api',
    marketCode: 'cn-mainland',
    defaultLanguage: 'zh-CN',
    supportedLanguages: ['zh-CN'],
    timezone: 'Asia/Shanghai',
    socialPlatforms: ['WECHAT', 'XIAOHONGSHU'],
    sharePolicy: 'DOMESTIC_SOCIAL_FIRST',
    primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
    supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
    domainSource: 'default',
    domainGovernance: createDomainGovernanceFixture()
  });
});

test('miniapp bootstrap: formats locale summary with default and supported languages', () => {
  assert.equal(
    formatMiniappLocaleSummary(createMiniappFallbackSnapshot()),
    '默认 zh-CN，支持 zh-CN / en-US',
  );
});

test('miniapp bootstrap: formats domestic share policy summary for miniapp page', () => {
  assert.equal(
    formatMiniappSharePolicySummary(createMiniappFallbackSnapshot()),
    '国内社交优先，优先分发到微信 / 小红书生态。',
  );
});

test('miniapp bootstrap: maps persistent member profile into api session view', () => {
  const session = toMiniappMemberSessionFromProfile({
    memberId: 'member-001',
    nickname: '真实会员',
    mobile: '13800000000',
    level: 'DIAMOND',
    status: 'ACTIVE',
    points: 68000,
    svipStatus: 'ACTIVE',
    registeredAt: '2026-06-12T00:00:00.000Z',
    source: 'prisma',
    persisted: true
  });

  assert.equal(session.memberTier, 'SVIP');
  assert.equal(session.points, 68000);
  assert.equal(session.couponCount, 6);
  assert.equal(session.deliveryMode, 'api');
});

test('miniapp bootstrap: creates runtime consumer contract with fallback governance defaults', () => {
  const contract = createMiniappRuntimeConsumerContract(createMiniappFallbackSnapshot());

  assert.equal(contract.scope.scopePath, 'cn-mainland / tenant-demo / brand-demo / store-001');
  assert.equal(contract.scope.mismatchStrategy, 'FAIL_CLOSED');
  assert.equal(contract.degradation.featureFlagFallback, 'READONLY_LAST_KNOWN');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
  assert.equal(contract.governance.deliveryMode, 'fallback');
  assert.equal(contract.governance.alerts.length > 0, true);
  assert.equal(contract.governance.summary.approvalsPending, 0);
  assert.equal(contract.governance.topRisks.length, 0);
});

test('miniapp bootstrap: falls back when portal bootstrap request fails', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await loadMiniappBootstrapSnapshot();

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.marketCode, 'cn-mainland');
});

test('miniapp bootstrap: non-cn fallback snapshot uses global preset', () => {
  assert.deepEqual(
    createMiniappFallbackSnapshot({
      tenantId: 'tenant-global',
      brandId: 'brand-global',
      storeId: 'store-global',
      marketCode: 'jp-tokyo',
    }),
    {
      deliveryMode: 'fallback',
      marketCode: 'jp-tokyo',
      defaultLanguage: 'en-US',
      supportedLanguages: ['en-US'],
      timezone: 'America/New_York',
      socialPlatforms: ['INSTAGRAM', 'X'],
      sharePolicy: 'GLOBAL_CONTENT_FIRST',
      primaryDomain: 'store-global.brand-global.tenant-global.jp-tokyo.local',
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
      domainSource: 'default',
      domainGovernance: {
        totalMissingPrimaryScopes: 0,
        totalActiveWithoutPrimaryDomains: 0,
        recommendedReadyScopes: 0,
        tenantMissingPrimaryScopes: 0,
        brandMissingPrimaryScopes: 0,
        storeMissingPrimaryScopes: 0,
        requiresAttention: false,
        lastEvaluatedAt: '1970-01-01T00:00:00.000Z',
        currentScopes: []
      },
    },
  );
});

test('miniapp bootstrap: loads real member runtime snapshot when member api is available', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/members/persistent')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              memberId: 'member-001',
              nickname: '真实会员',
              mobile: '13800000000',
              level: 'DIAMOND',
              status: 'ACTIVE',
              points: 68000,
              growthValue: 70000,
              svipStatus: 'ACTIVE',
              registeredAt: '2026-06-12T00:00:00.000Z',
              lastActiveAt: '2026-06-14T00:00:00.000Z',
              source: 'prisma',
              persisted: true
            }
          ],
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    if (url.endsWith('/portals/domain-governance')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: createDomainGovernanceFixture(),
          timestamp: '2026-07-18T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    if (url.endsWith('/members/login')) {
      assert.equal(init?.method, 'POST')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            member: {
              memberId: 'member-001',
              nickname: '真实会员',
              mobile: '13800000000',
              level: 'DIAMOND',
              status: 'ACTIVE',
              points: 68000,
              growthValue: 70000,
              svipStatus: 'ACTIVE',
              registeredAt: '2026-06-12T00:00:00.000Z',
              lastActiveAt: '2026-06-14T00:00:00.000Z',
              source: 'prisma',
              persisted: true
            },
            session: {
              sessionToken: 'miniapp-session-token',
              memberId: 'member-001',
              userId: 'user-001',
              tenantId: 'tenant-demo',
              brandId: 'brand-demo',
              storeId: 'store-001',
              issuedAt: '2026-06-14T00:00:00.000Z',
              expiresAt: '2026-06-21T00:00:00.000Z',
              authenticated: true
            }
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    if (url.includes('/members/sessions/miniapp-session-token')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            sessionToken: 'miniapp-session-token',
            memberId: 'member-001',
            userId: 'user-001',
            tenantId: 'tenant-demo',
            brandId: 'brand-demo',
            storeId: 'store-001',
            issuedAt: '2026-06-14T00:00:00.000Z',
            expiresAt: '2026-06-21T00:00:00.000Z',
            authenticated: true
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    return new Response('not found', { status: 404 })
  }) as typeof fetch

  const runtime = await loadMiniappMemberRuntimeSnapshot()

  assert.equal(runtime.deliveryMode, 'api')
  assert.equal(runtime.session.authenticated, true)
  assert.equal(runtime.session.memberTier, 'SVIP')
  assert.equal(runtime.sessionVerified, true)
  assert.equal(runtime.profile?.memberId, 'member-001')
})

test('miniapp bootstrap: member runtime snapshot falls back when api is unavailable', async () => {
  globalThis.fetch = (async () => {
    throw new Error('member api unavailable')
  }) as typeof fetch

  const runtime = await loadMiniappMemberRuntimeSnapshot()

  assert.equal(runtime.deliveryMode, 'fallback')
  assert.equal(runtime.session.authenticated, false)
  assert.equal(runtime.profile, null)
})

test('miniapp bootstrap: loads runtime consumer contract from api and governance catalog', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: createPortalBootstrapFixture(),
          timestamp: '2026-06-12T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            generatedAt: '2026-06-12T00:00:00.000Z',
            summary: {
              approvalsPending: 2,
              approvalsWithFailures: 1,
              highRiskAudits: 3,
              blockedLedgers: 0,
              rotationDueSecrets: 1,
              expiredSecrets: 0,
              expiringCertificates: 0,
              expiredCertificates: 0,
              degradedSignals: 4,
              attentionRecoveryPlans: 1,
              staleDrills: 0
            },
            alerts: [],
            topRisks: [
              {
                severity: 'high',
                code: 'high-risk-audits',
                count: 3,
                summary: '存在高风险治理审计事件',
                triageState: 'needs-triage',
                triageSummary: '待处理，尚无最近运维动作',
                recentOperation: null
              }
            ]
          },
          timestamp: '2026-06-12T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          generatedAt: '2026-06-12T00:00:00.000Z',
          alerts: [
            {
              code: 'high-risk-audits',
              defaultSummary: '存在高风险治理审计事件',
              severityPolicy: 'demo',
              sourceModules: ['trust-governance'],
              drilldownEnabled: true,
              acknowledgementEnabled: true,
              drilldownPath: '/foundation/overview/alerts/high-risk-audits/drilldown',
              ackPath: '/foundation/overview/alerts/high-risk-audits/ack',
              mutePath: '/foundation/overview/alerts/high-risk-audits/mute'
            }
          ]
        },
        timestamp: '2026-06-12T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const contract = await loadMiniappRuntimeConsumerContract();

  assert.equal(contract.snapshot.deliveryMode, 'api');
  assert.equal(contract.scope.scopePath, 'cn-mainland / tenant-demo / brand-demo / store-001');
  assert.equal(contract.governance.deliveryMode, 'api');
  assert.deepEqual(contract.governance.alerts.map((item) => item.code), ['high-risk-audits']);
  assert.equal(contract.governance.summary.highRiskAudits, 3);
  assert.equal(contract.governance.topRisks[0]?.code, 'high-risk-audits');
});

test('miniapp bootstrap: loads governance read model when only overview endpoint is available', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 5,
              approvalsWithFailures: 1,
              highRiskAudits: 2,
              blockedLedgers: 1,
              rotationDueSecrets: 0,
              expiredSecrets: 0,
              expiringCertificates: 0,
              expiredCertificates: 0,
              degradedSignals: 1,
              attentionRecoveryPlans: 0,
              staleDrills: 0
            },
            alerts: [],
            topRisks: [
              {
                severity: 'high',
                code: 'approvals-pending',
                count: 5,
                summary: '存在待处理审批',
                triageState: 'needs-triage',
                triageSummary: '待处理，尚无最近运维动作',
                recentOperation: null
              }
            ]
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const governance = await loadMiniappGovernanceReadModel();

  assert.equal(governance.generatedAt, '2026-06-13T00:00:00.000Z');
  assert.equal(governance.deliveryMode, 'fallback');
  assert.equal(governance.summary.approvalsPending, 5);
  assert.equal(governance.topRisks[0]?.code, 'approvals-pending');
  assert.equal(governance.alerts.length > 0, true);
});

test('miniapp bootstrap: exposes runtime consumer contract with scope and governance fallback', () => {
  const contract = createMiniappRuntimeConsumerContract(createMiniappFallbackSnapshot());

  assert.equal(contract.scope.scopePath, 'cn-mainland / tenant-demo / brand-demo / store-001');
  assert.equal(contract.scope.mismatchStrategy, 'FAIL_CLOSED');
  assert.equal(contract.degradation.featureFlagFallback, 'READONLY_LAST_KNOWN');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
  assert.equal(contract.governance.deliveryMode, 'fallback');
  assert.match(contract.governance.alerts[0]?.code ?? '', /approvals-pending/);
});

test('miniapp bootstrap: blocks sensitive actions while using fallback snapshot', () => {
  const decision = resolveMiniappActionDecision(
    createMiniappFallbackSnapshot(),
    createMemberSession(),
    'booking-submit'
  );

  assert.equal(decision.bootstrapState, 'readonly-fallback');
  assert.equal(decision.allowed, false);
  assert.equal(decision.nextStep, 'REFRESH');
});

test('miniapp bootstrap: requires login before coupon or booking actions', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

  const couponDecision = resolveMiniappActionDecision(snapshot, createGuestMemberSession(), 'coupon-claim');
  const loginDecision = resolveMiniappActionDecision(snapshot, createGuestMemberSession(), 'member-login');

  assert.equal(couponDecision.bootstrapState, 'scope-mismatch');
  assert.equal(couponDecision.nextStep, 'LOGIN');
  assert.equal(loginDecision.bootstrapState, 'challenge-required');
  assert.equal(loginDecision.nextStep, 'CHALLENGE');
});

test('miniapp bootstrap: forces challenge before coupon but allows booking for authenticated members', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createMemberSession('SVIP');

  const couponDecision = resolveMiniappActionDecision(snapshot, session, 'coupon-claim');
  const bookingDecision = resolveMiniappActionDecision(snapshot, session, 'booking-submit');

  assert.equal(couponDecision.bootstrapState, 'challenge-required');
  assert.equal(couponDecision.allowed, false);
  assert.equal(bookingDecision.bootstrapState, 'ready');
  assert.equal(bookingDecision.allowed, true);
});

test('miniapp bootstrap: builds executable booking plan for authenticated member', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createMemberSession();
  const plan = createMiniappActionPlan(snapshot, session, 'booking-submit');

  assert.equal(plan.label, '预约提交');
  assert.equal(plan.channel, 'MEMBER_RUNTIME');
  assert.equal(plan.decision.nextStep, 'PROCEED');
  assert.equal(plan.checklist.includes('确认门店营业时间与预约时间窗'), true);
  assert.equal(plan.requestPreview.endpoint, '/api/v1/storefront/bookings');
  assert.equal((plan.requestPreview.payload as MiniappBookingSubmitDraft).bookingSlot, '2026-06-12T10:00:00+08:00');
});

test('miniapp bootstrap: member-login draft summary carries locale policy context', () => {
  const snapshot = createMiniappFallbackSnapshot();
  const plan = createMiniappActionPlan(snapshot, createGuestMemberSession(), 'member-login');

  assert.match(plan.draftSummary, /默认 zh-CN，支持 zh-CN \/ en-US/);
});

test('miniapp bootstrap: coupon draft summary carries share policy context', () => {
  const snapshot = createMiniappFallbackSnapshot();
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');

  assert.match(plan.draftSummary, /国内社交优先/);
});

test('miniapp bootstrap: lists governed plans with refresh fallback channel', () => {
  const plans = listMiniappActionPlans(createMiniappFallbackSnapshot(), createGuestMemberSession());

  assert.equal(plans.length, 3);
  assert.equal(plans.every((plan) => plan.decision.nextStep === 'REFRESH'), true);
  assert.equal(plans.every((plan) => plan.channel === 'BOOTSTRAP_REFRESH'), true);
});

test('miniapp bootstrap: blocks submit outcome when login is required', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createGuestMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);

  assert.equal(outcome.state, 'blocked');
  assert.equal(outcome.nextStep, 'LOGIN');
  assert.equal(outcome.endpoint, '/api/v1/storefront/bookings');
});

test('miniapp bootstrap: issues challenge outcome for coupon claim', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const outcome = submitMiniappActionPlan(plan);

  assert.equal(outcome.state, 'challenge-issued');
  assert.equal(outcome.nextStep, 'CHALLENGE');
  assert.match(outcome.message, /WECHAT_CHALLENGE/);
});

test('miniapp bootstrap: submits booking outcome for ready session', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);

  assert.equal(outcome.state, 'submitted');
  assert.equal(outcome.nextStep, 'PROCEED');
  assert.match(outcome.payloadSummary, /bookingSlot/);
  assert.equal(outcome.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
});

test('miniapp bootstrap: creates submit history entry with receipt and summary', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const entry = createMiniappSubmitHistoryEntry(outcome, '2026-06-12T10:00:00.000Z');

  assert.equal(entry.receiptCode, 'MINIAPP-BOOKING-SUBMIT-PROCEED');
  assert.equal(entry.occurredAt, '2026-06-12T10:00:00.000Z');
  assert.match(entry.summary, /FOLLOW_SUBMIT_CALLBACK/);
});

test('miniapp bootstrap: prepends submit history and keeps latest five entries', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const history = Array.from({ length: 5 }, (_, index) => ({
    receiptCode: `OLD-${index}`,
    action: 'member-login' as const,
    state: 'blocked' as const,
    endpoint: '/old',
    occurredAt: `2026-06-12T0${index}:00:00.000Z`,
    recommendedAction: 'COMPLETE_LOGIN' as const,
    summary: 'old'
  }));

  const nextHistory = appendMiniappSubmitHistory(history, outcome);

  assert.equal(nextHistory.length, 5);
  assert.equal(nextHistory[0]?.receiptCode, 'MINIAPP-BOOKING-SUBMIT-PROCEED');
  assert.equal(nextHistory[4]?.receiptCode, 'OLD-3');
});

test('miniapp bootstrap: builds replayable ledger record for submitted history', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);

  assert.equal(ledger[0]?.ledgerKey, 'miniapp-ledger:MINIAPP-BOOKING-SUBMIT-PROCEED');
  assert.equal(ledger[0]?.replayable, true);
  assert.equal(ledger[0]?.replayEndpoint, '/api/v1/storefront/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/replay');
});

test('miniapp bootstrap: blocks replay when challenge is unfinished', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const historyEntry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(historyEntry);

  assert.equal(replay.status, 'replay-blocked');
  assert.equal(replay.replayEndpoint, '/api/v1/storefront/actions/MINIAPP-COUPON-CLAIM-CHALLENGE/replay');
});

test('miniapp bootstrap: schedules replay for submitted booking history', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const historyEntry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(historyEntry);

  assert.equal(replay.status, 'replay-scheduled');
  assert.match(replay.message, /ledger replay/);
});

test('miniapp bootstrap: builds challenge ticket for coupon outcome', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const ticket = createMiniappActionTicket(outcome);

  assert.equal(ticket.ticketType, 'CHALLENGE_GATE');
  assert.equal(ticket.status, 'pending-challenge');
  assert.equal(ticket.ticketCode, 'MINIAPP-COUPON-CLAIM-CHALLENGE-CHALLENGE');
});

test('miniapp bootstrap: builds handler sync contract for submitted booking outcome', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);

  assert.equal(sync.handlerName, 'miniapp-booking-submit-handler');
  assert.equal(sync.syncMode, 'callback-followup');
  assert.equal(sync.ready, true);
  assert.equal(sync.syncEndpoint, '/api/v1/storefront/handlers/miniapp-booking-submit-handler/sync');
});

test('miniapp bootstrap: builds replay request from ledger record', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);
  const request = createMiniappReplayRequest(ledger[0]!);

  assert.equal(request.method, 'POST');
  assert.equal(request.endpoint, '/api/v1/storefront/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/replay');
  assert.equal(request.headers['x-m5-receipt-code'], 'MINIAPP-BOOKING-SUBMIT-PROCEED');
  assert.equal(request.body.ticketCode, 'MINIAPP-BOOKING-SUBMIT-PROCEED-HANDLER');
});

test('miniapp bootstrap: builds auth envelope from handler sync contract', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);
  const auth = buildMiniappAuthEnvelope(sync);

  assert.equal(auth.audience, 'miniapp-handler-sync');
  assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
  assert.equal(auth.authorization, 'M5 MINIAPP-BOOKING-SUBMIT-PROCEED-HANDLER.miniapp-sync:MINIAPP-BOOKING-SUBMIT-PROCEED');
});

test('miniapp bootstrap: builds callback receipt for submitted outcome', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);
  const receipt = createMiniappCallbackReceipt(outcome, sync);

  assert.equal(receipt.callbackStatus, 'awaiting-callback');
  assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
  assert.equal(receipt.ackToken, 'MINIAPP-BOOKING-SUBMIT-PROCEED-ACK-HANDLER');
});

test('miniapp bootstrap: builds retry policy for blocked replay', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const entry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(entry);
  const ledger = buildMiniappLedger([entry]);
  const policy = createMiniappReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.retryable, true);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
  assert.equal(policy.nextBackoffMs, 5000);
});

test('miniapp bootstrap: submits action plan through runtime governance api first', async () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/foundation/runtime-governance/actions') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            receiptCode: 'MINIAPP-RUNTIME-001',
            app: 'miniapp',
            action: 'booking-submit',
            state: 'submitted',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            requestEndpoint: '/api/v1/storefront/bookings',
            payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
            ticket: {
              ticketCode: 'MINIAPP-RUNTIME-001-HANDLER',
              ticketType: 'HANDLER_CALLBACK',
              status: 'ready-for-handler',
              summary: 'handler ready'
            },
            sync: {
              handlerName: 'miniapp-booking-submit-handler',
              syncMode: 'callback-followup',
              syncEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-RUNTIME-001/sync',
              callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-RUNTIME-001/callback',
              idempotencyKey: 'miniapp-sync:MINIAPP-RUNTIME-001',
              ready: true,
              summary: 'ready'
            },
            callback: {
              callbackStatus: 'awaiting-callback',
              ackToken: 'MINIAPP-RUNTIME-001-ACK',
              lastEvent: 'HANDLER_ACCEPTED',
              summary: 'awaiting callback'
            },
            ledger: {
              ledgerKey: 'runtime-ledger:MINIAPP-RUNTIME-001',
              replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-RUNTIME-001/replay',
              replayable: true,
              summary: 'replayable'
            },
            retry: {
              replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-RUNTIME-001/replay',
              retryable: true,
              maxAttempts: 3,
              currentAttempt: 0,
              nextBackoffMs: 2000,
              escalationAction: 'WAIT_CALLBACK',
              summary: 'wait callback'
            },
            rateLimit: {
              allowed: true,
              limit: 12,
              remaining: 11,
              retryAfterSeconds: 0,
              scopeKey: 'miniapp:booking-submit:tenant-demo'
            },
            events: [],
            generatedAt: '2026-06-12T00:00:00.000Z'
          },
          timestamp: '2026-06-12T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    throw new Error(`unexpected url: ${url}`);
  }) as typeof fetch;

  const receipt = await submitMiniappActionPlanToApi(plan);

  assert.equal(receipt.receiptCode, 'MINIAPP-RUNTIME-001');
  assert.equal(receipt.generatedAt, '2026-06-12T00:00:00.000Z');
  assert.equal(receipt.ledger.replayable, true);
});

test('miniapp bootstrap: refreshes and replays runtime receipt with fallback support', async () => {
  globalThis.fetch = (async () => {
    throw new Error('offline');
  }) as typeof fetch;

  const replayed = await replayMiniappRuntimeReceipt({
    receiptCode: 'MINIAPP-FALLBACK-001',
    app: 'miniapp',
    action: 'booking-submit',
    state: 'submitted',
    nextStep: 'PROCEED',
    riskLevel: 'medium',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/storefront/bookings',
    payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
    ticket: {
      ticketCode: 'MINIAPP-FALLBACK-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'handler ready'
    },
    sync: {
      handlerName: 'miniapp-booking-submit-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-001/callback',
      idempotencyKey: 'miniapp-sync:MINIAPP-FALLBACK-001',
      ready: true,
      summary: 'ready'
    },
    callback: {
      callbackStatus: 'awaiting-callback',
      ackToken: 'MINIAPP-FALLBACK-001-ACK',
      lastEvent: 'HANDLER_ACCEPTED',
      summary: 'awaiting callback'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:MINIAPP-FALLBACK-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-001/replay',
      replayable: true,
      summary: 'replayable'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-001/replay',
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: 'wait callback'
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: 'miniapp:booking-submit:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-12T00:00:00.000Z'
  });
  const refreshed = await loadMiniappRuntimeReceipt('MINIAPP-FALLBACK-001');

  assert.equal(replayed.state, 'replay-scheduled');
  assert.equal(replayed.retry.currentAttempt, 1);
  assert.equal(replayed.generatedAt, 'local-fallback');
  assert.equal(refreshed, null);
});

test('miniapp bootstrap: refreshes governance alerts catalog from api first', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    assert.match(url, /foundation\/overview\/alerts\/catalog/);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          generatedAt: '2026-06-13T00:00:00.000Z',
          alerts: [
            {
              code: 'runtime-governance-backlog',
              defaultSummary: 'runtime governance backlog',
              severityPolicy: 'ops',
              sourceModules: ['runtime-governance'],
              drilldownEnabled: true,
              acknowledgementEnabled: true,
              drilldownPath: '/foundation/overview/alerts/runtime-governance-backlog/drilldown',
              ackPath: '/foundation/overview/alerts/runtime-governance-backlog/ack',
              mutePath: '/foundation/overview/alerts/runtime-governance-backlog/mute',
              unmutePath: '/foundation/overview/alerts/runtime-governance-backlog/unmute',
              visibleInOverview: true,
              recentOperation: {
                action: 'ACK',
                note: 'handled',
                actorId: 'ops-user',
                mutedUntil: null,
                visibleInOverview: true,
                createdAt: '2026-06-13T00:00:00.000Z',
                source: 'foundation-alerts'
              }
            }
          ]
        },
        timestamp: '2026-06-13T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const catalog = await refreshMiniappGovernanceAlerts();

  assert.equal(catalog.generatedAt, '2026-06-13T00:00:00.000Z');
  assert.deepEqual(catalog.alerts.map((item) => item.code), ['runtime-governance-backlog']);
  assert.equal(catalog.alerts[0]?.recentOperation?.action, 'ACK');
});

test('miniapp bootstrap: syncs and records callback for runtime receipt with fallback support', async () => {
  globalThis.fetch = (async () => {
    throw new Error('offline');
  }) as typeof fetch;

  const receipt = {
    receiptCode: 'MINIAPP-FALLBACK-002',
    app: 'miniapp' as const,
    action: 'booking-submit' as const,
    state: 'submitted' as const,
    nextStep: 'PROCEED' as const,
    riskLevel: 'medium' as const,
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK' as const,
    requestEndpoint: '/api/v1/storefront/bookings',
    payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
    ticket: {
      ticketCode: 'MINIAPP-FALLBACK-002-HANDLER',
      ticketType: 'HANDLER_CALLBACK' as const,
      status: 'ready-for-handler' as const,
      summary: 'handler ready'
    },
    sync: {
      handlerName: 'miniapp-booking-submit-handler' as const,
      syncMode: 'callback-followup' as const,
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-002/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-002/callback',
      idempotencyKey: 'miniapp-sync:MINIAPP-FALLBACK-002',
      ready: true,
      summary: 'ready'
    },
    callback: {
      callbackStatus: 'awaiting-callback' as const,
      ackToken: 'MINIAPP-FALLBACK-002-ACK',
      lastEvent: 'HANDLER_ACCEPTED' as const,
      summary: 'awaiting callback'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:MINIAPP-FALLBACK-002',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-002/replay',
      replayable: true,
      summary: 'replayable'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-002/replay',
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK' as const,
      summary: 'wait callback'
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: 'miniapp:booking-submit:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-12T00:00:00.000Z'
  };

  const synced = await syncMiniappRuntimeReceipt(receipt);
  const callbacked = await recordMiniappRuntimeCallback(synced);

  assert.equal(synced.callback.callbackStatus, 'awaiting-callback');
  assert.equal(synced.events.at(-1)?.eventType, 'runtime-governance.handler.sync.requested');
  assert.equal(callbacked.state, 'callback-recorded');
  assert.equal(callbacked.ledger.replayable, true);
  assert.equal(callbacked.events.at(-1)?.eventType, 'runtime-governance.handler.callback.recorded');
});

test('miniapp bootstrap: loads alert drilldown and acknowledgement flows', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/foundation/overview/alerts/observability-degradation/drilldown')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            code: 'observability-degradation',
            history: [
              {
                action: 'ACK',
                note: 'handled',
                actorId: 'ops-user',
                mutedUntil: null,
                visibleInOverview: true,
                createdAt: '2026-06-13T00:00:00.000Z',
                source: 'foundation-alerts'
              }
            ],
            alert: {
              severity: 'high',
              code: 'observability-degradation',
              count: 3,
              summary: 'signal degraded',
              acknowledgement: null
            },
            detail: { total: 3 }
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview/alerts/observability-degradation/ack') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:05:00.000Z',
            code: 'observability-degradation',
            history: [
              {
                action: 'ACK',
                note: 'miniapp-ack',
                actorId: 'ops-user',
                mutedUntil: null,
                visibleInOverview: true,
                createdAt: '2026-06-13T00:05:00.000Z',
                source: 'foundation-alerts'
              }
            ],
            acknowledgement: {
              status: 'ACKED',
              note: 'miniapp-ack',
              actorId: 'ops-user',
              acknowledgedAt: '2026-06-13T00:05:00.000Z',
              mutedUntil: null,
              updatedAt: '2026-06-13T00:05:00.000Z'
            }
          },
          timestamp: '2026-06-13T00:05:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview/alerts/observability-degradation/mute') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:10:00.000Z',
            code: 'observability-degradation',
            history: [
              {
                action: 'MUTE',
                note: 'miniapp-muted',
                actorId: 'ops-user',
                mutedUntil: '2026-06-14T00:00:00.000Z',
                visibleInOverview: false,
                createdAt: '2026-06-13T00:10:00.000Z',
                source: 'foundation-alerts'
              }
            ],
            acknowledgement: {
              status: 'MUTED',
              note: 'miniapp-muted',
              actorId: 'ops-user',
              acknowledgedAt: '2026-06-13T00:10:00.000Z',
              mutedUntil: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-13T00:10:00.000Z'
            }
          },
          timestamp: '2026-06-13T00:10:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview/alerts/observability-degradation/unmute')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:15:00.000Z',
            code: 'observability-degradation',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
            history: [
              {
                action: 'UNMUTE',
                note: 'miniapp-unmuted',
                actorId: 'ops-user',
                mutedUntil: null,
                visibleInOverview: true,
                createdAt: '2026-06-13T00:15:00.000Z',
                source: 'foundation-alerts'
              }
            ],
            acknowledgement: {
              status: 'ACKED',
              note: 'miniapp-unmuted',
              actorId: 'ops-user',
              acknowledgedAt: '2026-06-13T00:15:00.000Z',
              mutedUntil: null,
              updatedAt: '2026-06-13T00:15:00.000Z'
            }
          },
          timestamp: '2026-06-13T00:15:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    throw new Error(`unexpected url: ${url}`);
  }) as typeof fetch;

  const drilldown = await loadMiniappAlertDrilldown('observability-degradation');
  const ack = await acknowledgeMiniappGovernanceAlert('observability-degradation', 'miniapp-ack');
  const mute = await muteMiniappGovernanceAlert('observability-degradation');
  const unmute = await unmuteMiniappGovernanceAlert('observability-degradation');

  assert.equal(drilldown.code, 'observability-degradation');
  assert.equal(drilldown.alert?.severity, 'high');
  assert.equal(drilldown.history?.[0]?.action, 'ACK');
  assert.equal(ack.acknowledgement?.status, 'ACKED');
  assert.equal(ack.history?.length, 1);
  assert.equal(mute.acknowledgement?.status, 'MUTED');
  assert.equal(mute.history?.[0]?.action, 'MUTE');
  assert.equal(unmute.visibleInOverview, true);
  assert.equal(unmute.availableActions?.includes('MUTE'), true);
  assert.equal(unmute.history?.[0]?.action, 'UNMUTE');
});
