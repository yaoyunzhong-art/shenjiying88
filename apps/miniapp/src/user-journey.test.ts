import assert from 'node:assert/strict';
import test from 'node:test';
import { describe } from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createMiniappFallbackSnapshot,
  toMiniappBootstrapSnapshot,
  createGuestMemberSession,
  createMemberSession,
  createMiniappRuntimeConsumerContract,
  loadMiniappBootstrapSnapshot,
  loadMiniappRuntimeConsumerContract,
  loadMiniappMemberRuntimeSnapshot,
  resolveMiniappActionDecision,
  createMiniappActionPlan,
  listMiniappActionPlans,
  submitMiniappActionPlan,
  appendMiniappSubmitHistory,
  buildMiniappLedger,
  replayMiniappSubmitHistoryEntry,
  createMiniappSubmitHistoryEntry,
  createMiniappActionTicket,
  buildMiniappHandlerSyncContract,
  createMiniappCallbackReceipt,
  buildMiniappAuthEnvelope,
  createMiniappReplayRetryPolicy,
} from './market-bootstrap';
import type {
  MiniappActionKey,
  MiniappActionPlan,
  MiniappSubmitOutcome,
  MiniappSubmitHistoryEntry,
} from './market-bootstrap';

/**
 * miniapp (Taro) User Journey — L1 用户旅程冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证小程序完整用户旅程：页面导航生命周期 → 会员中心渲染 → 首页引导启动 → 错误边界
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB',
      scopeType: 'TENANT',
      scopeCode: 't',
      tenantCode: 't',
      brandCode: undefined,
      marketCode: 'cn-mainland',
      channel: 'WEB',
      name: 't ToB',
      primaryDomain: 't.cn-mainland.b2b.local',
      supportedLanguages: ['zh-CN'],
      heroTitle: 'title',
      heroSubtitle: '',
      solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/cn-mainland/t/login', ssoEnabled: true },
    },
    brandPortal: {
      audience: 'TOB',
      scopeType: 'BRAND',
      scopeCode: 'b',
      tenantCode: 't',
      brandCode: 'b',
      marketCode: 'cn-mainland',
      channel: 'WEB',
      name: 'b ToB',
      primaryDomain: 'b.t.cn-mainland.b2b.local',
      supportedLanguages: ['zh-CN'],
      heroTitle: 'title',
      heroSubtitle: '',
      solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/cn-mainland/t/b/login', ssoEnabled: true },
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
      name: 'store-001',
      primaryDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
      supportedLanguages: ['zh-CN'],
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
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
        callbackBaseUrl: 'https://cn-hooks.m5.local',
      },
      email: {
        provider: 'ALIYUN_DM',
        fromName: 'M5',
        fromAddress: 'h@m5.local',
        replyTo: 's@m5.local',
      },
      social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] },
    },
    regionalOverrides: [],
    foundationDependencies: [],
    foundationContracts: [],
  };
}

// ---- 正例 ----

describe('miniapp user journey: page navigation lifecycle — 正例', () => {
  test('miniapp user journey: bootstrap snapshot defaults to cn-mainland fallback', () => {
    const snapshot = createMiniappFallbackSnapshot();

    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.marketCode, 'cn-mainland');
    assert.equal(snapshot.defaultLanguage, 'zh-CN');
    assert.equal(snapshot.timezone, 'Asia/Shanghai');
    assert.deepEqual(snapshot.socialPlatforms, ['WECHAT', 'XIAOHONGSHU']);
    assert.equal(snapshot.sharePolicy, 'DOMESTIC_SOCIAL_FIRST');
  });

  test('miniapp user journey: api bootstrap delivers correct market config', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.marketCode, 'cn-mainland');
    assert.equal(snapshot.defaultLanguage, 'zh-CN');
    assert.equal(snapshot.sharePolicy, 'DOMESTIC_SOCIAL_FIRST');
    assert.equal(snapshot.primaryDomain, 'store-001.brand-demo.tenant-demo.cn-mainland.local');
  });

  test('miniapp user journey: runtime consumer contract binds to cn-mainland scope', () => {
    const contract = createMiniappRuntimeConsumerContract(createMiniappFallbackSnapshot());

    assert.equal(contract.scope.scopePath, 'cn-mainland / tenant-demo / brand-demo / store-001');
    assert.equal(contract.scope.mismatchStrategy, 'FAIL_CLOSED');
    assert.equal(contract.degradation.featureFlagFallback, 'READONLY_LAST_KNOWN');
    assert.equal(contract.challenge.enforcement, 'STEP_UP');
    assert.ok(contract.governance.alerts.length > 0, 'should have fallback governance alerts');
  });

  test('miniapp user journey: bootstrap snapshot for another market code reflects correct locale', () => {
    const jpSnapshot = createMiniappFallbackSnapshot({ marketCode: 'jp-tokyo' });

    assert.equal(jpSnapshot.marketCode, 'jp-tokyo');
    assert.equal(jpSnapshot.defaultLanguage, 'en-US');
    assert.equal(jpSnapshot.timezone, 'America/New_York'); // fallback default when not cn-mainland
    assert.equal(jpSnapshot.sharePolicy, 'GLOBAL_CONTENT_FIRST');
    assert.deepEqual(jpSnapshot.socialPlatforms, ['INSTAGRAM', 'X']);
  });

  test('miniapp user journey: bootstrap snapshot with explicit context overrides defaults', () => {
    const customSnapshot = createMiniappFallbackSnapshot({
      tenantId: 'tenant-custom',
      brandId: 'brand-custom',
      storeId: 'store-999',
      marketCode: 'us-east',
    });

    assert.equal(customSnapshot.marketCode, 'us-east');
    assert.equal(
      customSnapshot.primaryDomain,
      'store-999.brand-custom.tenant-custom.us-east.local',
    );
    assert.deepEqual(customSnapshot.supportedSurfaces, [
      'OFFICIAL_SITE',
      'H5',
      'MINIAPP',
      'APP',
      'PC_CONSOLE',
      'PAD_CONSOLE',
    ]);
  });
});

describe('miniapp user journey: member center rendering — 正例', () => {
  test('miniapp user journey: guest session has no identity', () => {
    const session = createGuestMemberSession();

    assert.equal(session.authenticated, false);
    assert.equal(session.memberTier, 'GUEST');
    assert.equal(session.points, 0);
    assert.equal(session.couponCount, 0);
    assert.equal(session.memberId, undefined);
    assert.equal(session.nickname, undefined);
    assert.equal(session.sessionToken, undefined);
  });

  test('miniapp user journey: member session has identity and points', () => {
    const session = createMemberSession('MEMBER');

    assert.equal(session.authenticated, true);
    assert.equal(session.memberTier, 'MEMBER');
    assert.ok(session.points > 0, 'member should have points');
    assert.ok(session.couponCount > 0, 'member should have coupons');
    assert.equal(session.memberId, 'wx-open-member-001');
    assert.equal(session.nickname, '微信会员_001');
  });

  test('miniapp user journey: SVIP session has higher tier indicators', () => {
    const session = createMemberSession('SVIP');

    assert.equal(session.authenticated, true);
    assert.equal(session.memberTier, 'SVIP');
    assert.equal(session.memberId, 'wx-open-svip-001');
    assert.equal(session.nickname, '微信会员_SVIP_001');
    assert.ok(session.points > 1000, 'SVIP should have >1000 points');
  });

  test('miniapp user journey: member runtime snapshot has fallback profile for non-authenticated session', async () => {
    const runtime = await loadMiniappMemberRuntimeSnapshot();

    // Even without API fixture, should return sensible fallback
    assert.equal(runtime.deliveryMode, 'fallback');
    assert.equal(runtime.session.authenticated, false);
    assert.equal(runtime.session.memberTier, 'GUEST');
    assert.equal(runtime.profile, null);
    assert.equal(runtime.sessionVerified, false);
    assert.ok(runtime.note.includes('回退'), 'should mention fallback in note');
  });
});

describe('miniapp user journey: index page bootstrap — 正例', () => {
  test('miniapp user journey: action plans include login, coupon, booking for member', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const session = createMemberSession('MEMBER');
    const plans = listMiniappActionPlans(snapshot, session);

    assert.equal(plans.length, 3);
    const keys = plans.map((p) => p.action);
    assert.ok(keys.includes('member-login'), 'should include login');
    assert.ok(keys.includes('coupon-claim'), 'should include coupon-claim');
    assert.ok(keys.includes('booking-submit'), 'should include booking-submit');
  });

  test('miniapp user journey: booking-submit is allowed for member', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const decision = resolveMiniappActionDecision(
      snapshot,
      createMemberSession('MEMBER'),
      'booking-submit',
    );

    assert.equal(decision.bootstrapState, 'ready');
    assert.equal(decision.allowed, true);
    assert.equal(decision.nextStep, 'PROCEED');
  });

  test('miniapp user journey: member-login for guest issues challenge', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const decision = resolveMiniappActionDecision(
      snapshot,
      createGuestMemberSession(),
      'member-login',
    );

    assert.equal(decision.bootstrapState, 'challenge-required');
    assert.equal(decision.allowed, false);
    assert.equal(decision.nextStep, 'CHALLENGE');
  });

  test('miniapp user journey: submit booking generates business receipt', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const plan = createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit');
    const outcome = submitMiniappActionPlan(plan);

    assert.equal(outcome.state, 'submitted');
    assert.equal(outcome.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
    assert.match(outcome.payloadSummary, /bookingSlot/);
  });
});

// ---- 反例 ----

describe('miniapp user journey: error boundaries — 反例', () => {
  test('miniapp user journey: fallback snapshot blocks all actions from index', () => {
    const fallback = createMiniappFallbackSnapshot();
    const plans = listMiniappActionPlans(fallback, createGuestMemberSession());

    for (const plan of plans) {
      assert.equal(plan.decision.allowed, false);
      assert.equal(plan.decision.bootstrapState, 'readonly-fallback');
      assert.equal(plan.decision.nextStep, 'REFRESH');
    }
  });

  test('miniapp user journey: guest booking is blocked requires login', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const plan = createMiniappActionPlan(snapshot, createGuestMemberSession(), 'booking-submit');
    const outcome = submitMiniappActionPlan(plan);

    assert.equal(outcome.state, 'blocked');
    assert.equal(outcome.nextStep, 'LOGIN');
  });

  test('miniapp user journey: coupon-claim for SVIP issues challenge', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
    const outcome = submitMiniappActionPlan(plan);

    assert.equal(outcome.state, 'challenge-issued');
    assert.match(outcome.message, /WECHAT_CHALLENGE/);
    assert.equal(outcome.nextStep, 'CHALLENGE');
  });

  test('miniapp user journey: replay blocked for challenge outcomes', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'),
    );
    const entry = createMiniappSubmitHistoryEntry(outcome);
    const replay = replayMiniappSubmitHistoryEntry(entry);

    assert.equal(replay.status, 'replay-blocked');
  });

  test('miniapp user journey: bootstrap load falls back on server error', async () => {
    globalThis.fetch = (async () => new Response('Server Error', { status: 500 })) as typeof fetch;

    const snapshot = await loadMiniappBootstrapSnapshot();

    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.marketCode, 'cn-mainland');
  });

  test('miniapp user journey: runtime consumer contract falls back when api down', async () => {
    globalThis.fetch = (async () =>
      new Response('Service Unavailable', { status: 503 })) as typeof fetch;

    const contract = await loadMiniappRuntimeConsumerContract();

    assert.equal(contract.snapshot.deliveryMode, 'fallback');
    assert.equal(contract.governance.deliveryMode, 'fallback');
    assert.ok(contract.governance.alerts.length > 0, 'should have fallback alerts');
  });
});

// ---- 边界 ----

describe('miniapp user journey: boundary cases — 边界', () => {
  test('miniapp user journey: action plan has all required fields', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const plan = createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit');

    const planFields: (keyof MiniappActionPlan)[] = [
      'action',
      'label',
      'decision',
      'riskLevel',
      'channel',
      'draftSummary',
      'checklist',
      'requestPreview',
    ];
    for (const f of planFields) {
      assert.ok(plan[f] !== undefined, `field ${f} should exist`);
    }
    assert.ok(
      plan.checklist.length >= 2,
      `checklist should have >=2 items, got ${plan.checklist.length}`,
    );
    assert.ok(
      plan.requestPreview.endpoint.startsWith('/api/v1/'),
      'endpoint should be miniapp api',
    );
  });

  test('miniapp user journey: submit history entry has 7 required fields', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit'),
    );
    const entry = createMiniappSubmitHistoryEntry(outcome, '2026-06-13T00:00:00.000Z');

    const fields: (keyof MiniappSubmitHistoryEntry)[] = [
      'receiptCode',
      'action',
      'state',
      'endpoint',
      'occurredAt',
      'recommendedAction',
      'summary',
    ];
    for (const f of fields) {
      assert.ok(entry[f] !== undefined, `field ${f} should exist`);
    }
  });

  test('miniapp user journey: history capped at 5 entries', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit'),
    );
    const oldEntries: MiniappSubmitHistoryEntry[] = Array.from({ length: 5 }, (_, i) => ({
      receiptCode: `OLD-${i}`,
      action: 'member-login' as MiniappActionKey,
      state: 'blocked' as MiniappSubmitOutcome['state'],
      endpoint: '/old',
      occurredAt: `2026-06-12T0${i}:00:00.000Z`,
      recommendedAction: 'COMPLETE_LOGIN' as MiniappSubmitOutcome['recommendedAction'],
      summary: 'old entry',
    }));
    const next = appendMiniappSubmitHistory(oldEntries, outcome);

    assert.equal(next.length, 5);
    assert.equal(next[0]!.receiptCode, 'MINIAPP-BOOKING-SUBMIT-PROCEED');
  });

  test('miniapp user journey: ledger key uses miniapp prefix and is replayable after submit', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit'),
    );
    const history = appendMiniappSubmitHistory([], outcome);
    const ledger = buildMiniappLedger(history);

    assert.equal(ledger.length, 1);
    assert.ok(ledger[0]!.ledgerKey.startsWith('miniapp-ledger:'));
    assert.equal(ledger[0]!.replayable, true);
    assert.ok(ledger[0]!.replayEndpoint.includes('/replay'));
  });

  test('miniapp user journey: ticket type varies by outcome state', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

    // Submitted booking -> handler callback ticket
    const bookingOutcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit'),
    );
    const bookingTicket = createMiniappActionTicket(bookingOutcome);
    assert.equal(bookingTicket.ticketType, 'HANDLER_CALLBACK');
    assert.equal(bookingTicket.status, 'ready-for-handler');

    // Challenge-issued coupon claim -> challenge gate ticket
    const couponOutcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'),
    );
    const couponTicket = createMiniappActionTicket(couponOutcome);
    assert.equal(couponTicket.ticketType, 'CHALLENGE_GATE');
    assert.equal(couponTicket.status, 'pending-challenge');
  });

  test('miniapp user journey: auth envelope for miniapp has correct scheme and signed headers', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit'),
    );
    const sync = buildMiniappHandlerSyncContract(outcome);
    const auth = buildMiniappAuthEnvelope(sync);

    assert.equal(auth.audience, 'miniapp-handler-sync');
    assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
    assert.ok(auth.authorization.includes('MINIAPP-BOOKING-SUBMIT-PROCEED-HANDLER'));
    assert.ok(auth.signedHeaders.includes('x-m5-ticket-code'));
    assert.ok(auth.signedHeaders.includes('x-m5-idempotency-key'));
    assert.ok(auth.signedHeaders.includes('x-m5-receipt-code'));
  });

  test('miniapp user journey: callback receipt for submitted booking tracks handler acceptance', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('MEMBER'), 'booking-submit'),
    );
    const sync = buildMiniappHandlerSyncContract(outcome);
    const receipt = createMiniappCallbackReceipt(outcome, sync);

    assert.equal(receipt.callbackStatus, 'awaiting-callback');
    assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
    assert.ok(receipt.ackToken.includes('MINIAPP-BOOKING-SUBMIT-PROCEED'));
    assert.ok(receipt.callbackEndpoint.includes('/callback'));
  });

  test('miniapp user journey: retry policy resets with REFRESH_TICKET for replay-blocked entries', () => {
    const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitMiniappActionPlan(
      createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'),
    );
    const entry = createMiniappSubmitHistoryEntry(outcome);
    const replay = replayMiniappSubmitHistoryEntry(entry);
    const ledger = buildMiniappLedger([entry]);
    const policy = createMiniappReplayRetryPolicy(ledger[0]!, replay);

    assert.equal(policy.retryable, true);
    assert.equal(policy.escalationAction, 'REFRESH_TICKET');
    assert.ok(policy.maxAttempts >= 2, `maxAttempts >= 2, got ${policy.maxAttempts}`);
    assert.equal(policy.currentAttempt, 0);
  });

  test('miniapp user journey: member runtime snapshot includes session and profile for authenticated member', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      // GET /members/persistent → return a list of member profiles
      if (url.endsWith('/members/persistent')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: [
              {
                memberId: 'wx-open-member-001',
                nickname: '微信会员_001',
                mobile: '13800138000',
                level: 'GOLD',
                status: 'ACTIVE',
                points: 1580,
                growthValue: 3200,
                svipStatus: 'ACTIVE',
                registeredAt: '2025-01-01T00:00:00.000Z',
                lastActiveAt: '2026-06-23T00:00:00.000Z',
                source: 'prisma',
                persisted: true,
              },
            ],
            timestamp: '2026-06-23T00:00:00.000Z',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      // POST /members/login → login the member
      if (url.endsWith('/members/login')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              member: {
                memberId: 'wx-open-member-001',
                nickname: '微信会员_001',
                mobile: '13800138000',
                level: 'GOLD',
                status: 'ACTIVE',
                points: 1580,
                growthValue: 3200,
                svipStatus: 'ACTIVE',
                registeredAt: '2025-01-01T00:00:00.000Z',
                lastActiveAt: '2026-06-23T00:00:00.000Z',
                source: 'prisma',
                persisted: true,
              },
              session: {
                authenticated: true,
                memberTier: 'SVIP',
                couponCount: 5,
                points: 1580,
                sessionToken: 'wx-session-token-001',
                expiresAt: '2026-06-24T01:00:00.000Z',
              },
            },
            timestamp: '2026-06-23T00:00:00.000Z',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      // GET /members/sessions/<token> → verify session
      if (url.includes('/members/sessions/')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              verified: true,
              memberId: 'wx-open-member-001',
            },
            timestamp: '2026-06-23T00:00:00.000Z',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      return new Response('OK', { status: 200 });
    }) as typeof fetch;

    const runtime = await loadMiniappMemberRuntimeSnapshot();

    assert.equal(runtime.deliveryMode, 'api');
    assert.equal(runtime.session.authenticated, true);
    assert.equal(runtime.session.memberTier, 'SVIP');
    assert.ok(runtime.profile !== null, 'should have profile');
    assert.equal(runtime.profile!.level, 'GOLD');
    assert.equal(runtime.sessionVerified, true);
  });
});
