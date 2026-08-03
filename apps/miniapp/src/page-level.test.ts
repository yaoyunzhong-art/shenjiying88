import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createMiniappActionPlan,
  createMiniappFallbackSnapshot,
  createGuestMemberSession,
  createMemberSession,
  listMiniappActionPlans,
  resolveMiniappActionDecision,
  submitMiniappActionPlan,
  appendMiniappSubmitHistory,
  buildMiniappLedger,
  replayMiniappSubmitHistoryEntry,
  toMiniappBootstrapSnapshot,
  createMiniappReplayRetryPolicy,
} from './market-bootstrap';

/**
 * miniapp (Taro) Page-Level — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证小程序页面级交互：多角色、多种会员等级、预约/领券/登录场景
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 't', marketCode: 'cn-mainland', channel: 'WEB', name: 't ToB', primaryDomain: 't.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/login', ssoEnabled: true }, domainSource: 'default'
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 't', brandCode: 'b', marketCode: 'cn-mainland', channel: 'WEB', name: 'b ToB', primaryDomain: 'b.t.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/b/login', ssoEnabled: true }, domainSource: 'default'
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 't', brandCode: 'b', storeCode: 'store-001', storeName: 'store-001', marketCode: 'cn-mainland', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.b.t.cn-mainland.local', supportedLanguages: ['zh-CN'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'], domainSource: 'default'
    },
    marketProfile: {
      marketCode: 'cn-mainland', marketName: '中国大陆', countryCode: 'CN',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 6, taxLabel: '增值税' },
      network: { networkRegion: 'MAINLAND_CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
      email: { provider: 'ALIYUN_DM', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' },
      social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] }
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
}

// ---- 正例 ----

test('miniapp page: guest blocked from coupon but can attempt login', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const coupon = resolveMiniappActionDecision(snapshot, createGuestMemberSession(), 'coupon-claim');
  const login = resolveMiniappActionDecision(snapshot, createGuestMemberSession(), 'member-login');

  assert.equal(coupon.nextStep, 'LOGIN');
  assert.equal(login.nextStep, 'CHALLENGE');
});

test('miniapp page: member can book directly', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveMiniappActionDecision(snapshot, createMemberSession(), 'booking-submit');

  assert.equal(decision.bootstrapState, 'ready');
  assert.equal(decision.allowed, true);
  assert.equal(decision.nextStep, 'PROCEED');
});

test('miniapp page: SVIP needs challenge for coupon', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveMiniappActionDecision(snapshot, createMemberSession('SVIP'), 'coupon-claim');

  assert.equal(decision.bootstrapState, 'challenge-required');
  assert.equal(decision.allowed, false);
});

test('miniapp page: booking submit outcome for ready session', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);

  assert.equal(outcome.state, 'submitted');
  assert.match(outcome.payloadSummary, /bookingSlot/);
  assert.equal(outcome.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
});

test('miniapp page: coupon claim triggers challenge outcome for SVIP', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim');
  const outcome = submitMiniappActionPlan(plan);

  assert.equal(outcome.state, 'challenge-issued');
  assert.match(outcome.message, /WECHAT_CHALLENGE/);
});

test('miniapp page: history limits to latest 5', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const history = Array.from({ length: 5 }, (_, i) => ({
    receiptCode: `OLD-${i}`,
    action: 'member-login' as const,
    state: 'blocked' as const,
    endpoint: '/old',
    occurredAt: `2026-06-12T0${i}:00:00.000Z`,
    recommendedAction: 'COMPLETE_LOGIN' as const,
    summary: 'old'
  }));
  const next = appendMiniappSubmitHistory(history, outcome);

  assert.equal(next.length, 5);
  assert.equal(next[0]!.receiptCode, 'MINIAPP-BOOKING-SUBMIT-PROCEED');
});

test('miniapp page: ledger replayable for submitted booking', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);

  assert.equal(ledger[0]!.ledgerKey, 'miniapp-ledger:MINIAPP-BOOKING-SUBMIT-PROCEED');
  assert.equal(ledger[0]!.replayable, true);
});

// ---- 反例 ----

test('miniapp page: fallback blocks all actions', () => {
  const fallback = createMiniappFallbackSnapshot();
  const plans = listMiniappActionPlans(fallback, createGuestMemberSession());

  for (const plan of plans) {
    assert.equal(plan.decision.nextStep, 'REFRESH');
    assert.equal(plan.decision.allowed, false);
  }
});

test('miniapp page: guest booking is blocked', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createMiniappActionPlan(snapshot, createGuestMemberSession(), 'booking-submit');
  const outcome = submitMiniappActionPlan(plan);

  assert.equal(outcome.state, 'blocked');
  assert.equal(outcome.nextStep, 'LOGIN');
});

test('miniapp page: replay blocked for unfinished challenge', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const entry = {
    receiptCode: outcome.receiptCode, action: outcome.action, state: outcome.state,
    endpoint: outcome.endpoint, occurredAt: '2026-06-12T10:00:00.000Z',
    recommendedAction: outcome.recommendedAction, summary: outcome.message
  };
  const replay = replayMiniappSubmitHistoryEntry(entry);

  assert.equal(replay.status, 'replay-blocked');
});

// ---- 边界 ----

test('miniapp page: exactly 3 action plans defined', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const plans = listMiniappActionPlans(snapshot, createMemberSession());

  assert.equal(plans.length, 3);
});

test('miniapp page: retry policy for blocked replay has escalation', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const entry = {
    receiptCode: outcome.receiptCode, action: outcome.action, state: outcome.state,
    endpoint: outcome.endpoint, occurredAt: '2026-06-12T10:00:00.000Z',
    recommendedAction: outcome.recommendedAction, summary: outcome.message
  };
  const replay = replayMiniappSubmitHistoryEntry(entry);
  const ledger = buildMiniappLedger([entry]);
  const policy = createMiniappReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.retryable, true);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
  assert.ok(policy.nextBackoffMs > 0);
});

test('miniapp page: guest session has default tier', () => {
  const guest = createGuestMemberSession();
  assert.equal(guest.memberTier, 'GUEST');
  assert.equal(guest.authenticated, false);
  assert.equal(guest.points, 0);
});

test('miniapp page: member session has member tier', () => {
  const member = createMemberSession();
  assert.equal(member.memberTier, 'MEMBER');
  assert.equal(member.authenticated, true);
});

test('miniapp page: SVIP session has premium tier', () => {
  const svip = createMemberSession('SVIP');
  assert.equal(svip.memberTier, 'SVIP');
  assert.equal(svip.authenticated, true);
});
