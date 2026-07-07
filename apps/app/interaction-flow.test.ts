import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNativeAppActionPlan,
  createNativeAppFallbackSnapshot,
  createGuestNativeSession,
  createNativeSession,
  listNativeAppActionPlans,
  resolveNativeAppActionDecision,
  submitNativeAppActionPlan,
  appendNativeAppSubmitHistory,
  buildNativeAppLedger,
  replayNativeAppSubmitHistoryEntry,
  createNativeAppReplayRetryPolicy,
  toNativeAppBootstrapSnapshot,
} from './market-bootstrap';
import type { PortalBootstrapResponse } from '@m5/types';

/**
 * app (expo) Interaction Flow — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证原生 App 交互流程：多角色场景、状态转换、回放策略
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 't', brandCode: undefined, marketCode: 'us-default', channel: 'WEB', name: 't ToB', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 't', brandCode: 'b', marketCode: 'us-default', channel: 'WEB', name: 'b ToB', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 't', brandCode: 'b', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001 门店门户', primaryDomain: 'store-001.b.t.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
    },
    marketProfile: {
      marketCode: 'us-default', marketName: 'US', countryCode: 'US',
      locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
      timezone: { timezone: 'America/New_York' },
      currency: { currencyCode: 'USD', symbol: '$' },
      tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' },
      network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
      email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' },
      social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] }
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
}

// ---- 正例 ----

test('app interaction: guest can perform login only', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const guestDecision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'member-login');
  const paymentDecision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'payment-submit');

  assert.equal(guestDecision.bootstrapState, 'challenge-required');
  assert.equal(paymentDecision.bootstrapState, 'scope-mismatch');
  assert.equal(paymentDecision.nextStep, 'LOGIN');
});

test('app interaction: member can login without challenge', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveNativeAppActionDecision(snapshot, createNativeSession(), 'member-login');

  assert.equal(decision.bootstrapState, 'ready');
  assert.equal(decision.allowed, true);
  assert.equal(decision.nextStep, 'PROCEED');
});

test('app interaction: SVIP needs challenge for payment', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveNativeAppActionDecision(snapshot, createNativeSession('SVIP'), 'payment-submit');

  assert.equal(decision.bootstrapState, 'challenge-required');
  assert.equal(decision.allowed, false);
});

test('app interaction: submit succeeds for ready member-login', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'submitted');
  assert.equal(outcome.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
});

test('app interaction: submit blocks device-bind for guest', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createGuestNativeSession(), 'device-bind');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'blocked');
  assert.equal(outcome.nextStep, 'LOGIN');
});

test('app interaction: history keeps latest 5 entries', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const history = Array.from({ length: 5 }, (_, i) => ({
    receiptCode: `OLD-${i}`,
    action: 'member-login' as const,
    state: 'blocked' as const,
    endpoint: '/old',
    occurredAt: `2026-06-12T0${i}:00:00.000Z`,
    recommendedAction: 'COMPLETE_LOGIN' as const,
    summary: 'old'
  }));

  const next = appendNativeAppSubmitHistory(history, outcome);
  assert.equal(next.length, 5);
  assert.equal(next[0]!.receiptCode, 'NATIVE-MEMBER-LOGIN-PROCEED');
  assert.equal(next[4]!.receiptCode, 'OLD-3');
});

test('app interaction: ledger built from submit history', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const history = appendNativeAppSubmitHistory([], outcome);
  const ledger = buildNativeAppLedger(history);

  assert.equal(ledger.length, 1);
  assert.ok(ledger[0]!.replayable);
  assert.equal(ledger[0]!.ledgerKey, 'native-ledger:NATIVE-MEMBER-LOGIN-PROCEED');
});

// ---- 反例 ----

test('app interaction: fallback blocks all actions', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const plans = listNativeAppActionPlans(snapshot, createGuestNativeSession());

  for (const plan of plans) {
    assert.equal(plan.decision.nextStep, 'REFRESH');
    assert.equal(plan.decision.allowed, false);
  }
});

test('app interaction: payment submit blocked by challenge for SVIP', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));

  assert.equal(outcome.state, 'challenge-issued');
});

test('app interaction: replay blocked when challenge unfinished', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const entry = { receiptCode: outcome.receiptCode, action: outcome.action, state: outcome.state, endpoint: outcome.endpoint, occurredAt: '2026-06-12T10:00:00.000Z', recommendedAction: outcome.recommendedAction, summary: outcome.message };

  const replay = replayNativeAppSubmitHistoryEntry(entry);
  assert.equal(replay.status, 'replay-blocked');
});

// ---- 边界 ----

test('app interaction: exactly 3 action plans defined', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plans = listNativeAppActionPlans(snapshot, createNativeSession());

  assert.equal(plans.length, 3);
});

test('app interaction: all plans have unique actions', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plans = listNativeAppActionPlans(snapshot, createNativeSession());
  const actions = plans.map((p) => p.action);
  const unique = new Set(actions);

  assert.equal(unique.size, plans.length);
});

test('app interaction: retry policy escalates to REFRESH_TICKET for blocked', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const entry = { receiptCode: outcome.receiptCode, action: outcome.action, state: outcome.state, endpoint: outcome.endpoint, occurredAt: '2026-06-12T10:00:00.000Z', recommendedAction: outcome.recommendedAction, summary: outcome.message };
  const replay = replayNativeAppSubmitHistoryEntry(entry);
  const ledger = buildNativeAppLedger([entry]);
  const policy = createNativeAppReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.retryable, true);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
});
