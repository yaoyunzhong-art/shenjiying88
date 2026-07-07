import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createNativeAppRuntimeConsumerContract,
  createNativeAppFallbackSnapshot,
  toNativeAppBootstrapSnapshot,
  resolveNativeAppActionDecision,
  createNativeSession,
  createGuestNativeSession,
  createNativeAppActionPlan,
  submitNativeAppActionPlan,
  buildNativeAppAuthEnvelope,
  buildNativeAppHandlerSyncContract,
  createNativeAppCallbackReceipt,
  createNativeAppActionTicket,
  createNativeAppReplayRequest,
  createNativeAppSubmitHistoryEntry,
  appendNativeAppSubmitHistory,
  buildNativeAppLedger,
  replayNativeAppSubmitHistoryEntry,
  createNativeAppReplayRetryPolicy,
} from './market-bootstrap';
import type { PortalBootstrapResponse } from '@m5/types';

/**
 * app (expo) Contract Validation — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证原生 App 运行时合约、Auth Envelope、Callback Receipt、Ticket、Ledger
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 't', marketCode: 'us-default', channel: 'WEB', name: 't', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 't', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 't', brandCode: 'b', marketCode: 'us-default', channel: 'WEB', name: 'b', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'b', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 't', brandCode: 'b', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.b.t.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
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

test('app contract: consumer contract has scope and governance', () => {
  const contract = createNativeAppRuntimeConsumerContract(createNativeAppFallbackSnapshot());

  assert.equal(contract.scope.scopePath, 'us-default / tenant-demo / brand-demo / store-001');
  assert.equal(contract.governance.deliveryMode, 'fallback');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
});

test('app contract: auth envelope has correct scheme', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const sync = buildNativeAppHandlerSyncContract(outcome);
  const auth = buildNativeAppAuthEnvelope(sync);

  assert.equal(auth.audience, 'native-app-handler-sync');
  assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
  assert.ok(auth.authorization.includes('NATIVE-MEMBER-LOGIN-PROCEED-HANDLER'));
});

test('app contract: callback receipt has awaiting status', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const sync = buildNativeAppHandlerSyncContract(outcome);
  const receipt = createNativeAppCallbackReceipt(outcome, sync);

  assert.equal(receipt.callbackStatus, 'awaiting-callback');
  assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
});

test('app contract: ticket reflects submit outcome', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());

  // Payment with SVIP -> challenge
  const paymentOutcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const paymentTicket = createNativeAppActionTicket(paymentOutcome);
  assert.equal(paymentTicket.ticketType, 'CHALLENGE_GATE');
  assert.equal(paymentTicket.status, 'pending-challenge');

  // Login as member -> handler callback
  const loginOutcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const loginTicket = createNativeAppActionTicket(loginOutcome);
  assert.equal(loginTicket.ticketType, 'HANDLER_CALLBACK');
  assert.equal(loginTicket.status, 'ready-for-handler');
});

test('app contract: replay request has correct headers', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const history = appendNativeAppSubmitHistory([], outcome);
  const ledger = buildNativeAppLedger(history);
  const request = createNativeAppReplayRequest(ledger[0]!);

  assert.equal(request.method, 'POST');
  assert.ok(request.headers['x-m5-receipt-code']);
  assert.ok(request.body.ticketCode);
});

// ---- 反例 ----

test('app contract: fallback contract blocks all high-risk decisions', () => {
  const decision = resolveNativeAppActionDecision(createNativeAppFallbackSnapshot(), createNativeSession(), 'payment-submit');

  assert.equal(decision.bootstrapState, 'readonly-fallback');
  assert.equal(decision.allowed, false);
});

test('app contract: guest session rejects device-bind', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const decision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'device-bind');

  assert.equal(decision.bootstrapState, 'scope-mismatch');
});

test('app contract: replay blocked for challenge-issued outcomes', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const entry = createNativeAppSubmitHistoryEntry(outcome);
  const replay = replayNativeAppSubmitHistoryEntry(entry);

  assert.equal(replay.status, 'replay-blocked');
});

// ---- 边界 ----

test('app contract: submit history entry has all required fields', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const entry = createNativeAppSubmitHistoryEntry(outcome, '2026-06-13T00:00:00.000Z');

  assert.ok(entry.receiptCode);
  assert.ok(entry.action);
  assert.ok(entry.state);
  assert.ok(entry.endpoint);
  assert.ok(entry.occurredAt);
  assert.ok(entry.recommendedAction);
  assert.ok(entry.summary);
});

test('app contract: retry policy respects max attempts', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const entry = createNativeAppSubmitHistoryEntry(outcome);
  const replay = replayNativeAppSubmitHistoryEntry(entry);
  const ledger = buildNativeAppLedger([entry]);
  const policy = createNativeAppReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.currentAttempt, 0);
  assert.ok(policy.maxAttempts >= 2, `maxAttempts should be >= 2, got ${policy.maxAttempts}`);
  assert.ok(policy.nextBackoffMs > 0);
});

test('app contract: delegate sync contract has handler name', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const sync = buildNativeAppHandlerSyncContract(outcome);

  assert.equal(sync.syncMode, 'callback-followup');
  assert.equal(sync.ready, true);
  assert.ok(sync.handlerName.includes('member'));
});
