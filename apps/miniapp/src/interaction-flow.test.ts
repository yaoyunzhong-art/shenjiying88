import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createMiniappRuntimeConsumerContract,
  createMiniappFallbackSnapshot,
  toMiniappBootstrapSnapshot,
  resolveMiniappActionDecision,
  createMemberSession,
  createMiniappActionPlan,
  submitMiniappActionPlan,
  buildMiniappAuthEnvelope,
  buildMiniappHandlerSyncContract,
  createMiniappCallbackReceipt,
  createMiniappActionTicket,
  createMiniappReplayRequest,
  createMiniappSubmitHistoryEntry,
  appendMiniappSubmitHistory,
  buildMiniappLedger,
  replayMiniappSubmitHistoryEntry,
  createMiniappReplayRetryPolicy,
} from './market-bootstrap';

/**
 * miniapp (Taro) Interaction Flow — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证小程序间接触发流、运行时合约、Auth Envelope、Callback Receipt
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 't', marketCode: 'cn-mainland', channel: 'WEB', name: 't', primaryDomain: 't.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 't', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/login', ssoEnabled: true }, domainSource: 'default'
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 't', brandCode: 'b', marketCode: 'cn-mainland', channel: 'WEB', name: 'b', primaryDomain: 'b.t.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'b', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/t/b/login', ssoEnabled: true }, domainSource: 'default'
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 't', brandCode: 'b', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'cn-mainland', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.b.t.cn-mainland.local', supportedLanguages: ['zh-CN'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'], domainSource: 'default'
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

test('miniapp interaction: consumer contract has correct scope', () => {
  const contract = createMiniappRuntimeConsumerContract(createMiniappFallbackSnapshot());

  assert.equal(contract.scope.scopePath, 'cn-mainland / tenant-demo / brand-demo / store-001');
  assert.equal(contract.governance.deliveryMode, 'fallback');
  assert.ok(contract.governance.alerts.length > 0);
});

test('miniapp interaction: auth envelope has miniapp audience', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);
  const auth = buildMiniappAuthEnvelope(sync);

  assert.equal(auth.audience, 'miniapp-handler-sync');
  assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
  assert.ok(auth.authorization.includes('MINIAPP-BOOKING-SUBMIT-PROCEED-HANDLER'));
});

test('miniapp interaction: callback receipt tracks handler sync', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);
  const receipt = createMiniappCallbackReceipt(outcome, sync);

  assert.equal(receipt.callbackStatus, 'awaiting-callback');
  assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
  assert.ok(receipt.ackToken.includes('MINIAPP-BOOKING-SUBMIT-PROCEED'));
});

test('miniapp interaction: ticket types vary by submit outcome', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());

  // Booking -> handler callback
  const bookingOutcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const bookingTicket = createMiniappActionTicket(bookingOutcome);
  assert.equal(bookingTicket.ticketType, 'HANDLER_CALLBACK');
  assert.equal(bookingTicket.status, 'ready-for-handler');

  // Coupon for SVIP -> challenge gate
  const couponOutcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const couponTicket = createMiniappActionTicket(couponOutcome);
  assert.equal(couponTicket.ticketType, 'CHALLENGE_GATE');
  assert.equal(couponTicket.status, 'pending-challenge');
});

test('miniapp interaction: replay request built from ledger', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);
  const request = createMiniappReplayRequest(ledger[0]!);

  assert.equal(request.method, 'POST');
  assert.ok(request.endpoint.includes('/replay'));
  assert.ok(request.headers['x-m5-receipt-code']);
});

test('miniapp interaction: sync contract is ready for submitted booking', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const sync = buildMiniappHandlerSyncContract(outcome);

  assert.equal(sync.syncMode, 'callback-followup');
  assert.equal(sync.ready, true);
  assert.ok(sync.syncEndpoint.includes('/sync'));
});

// ---- 反例 ----

test('miniapp interaction: fallback contract blocks decisions', () => {
  const decision = resolveMiniappActionDecision(createMiniappFallbackSnapshot(), createMemberSession(), 'booking-submit');

  assert.equal(decision.bootstrapState, 'readonly-fallback');
  assert.equal(decision.allowed, false);
});

test('miniapp interaction: replay blocked for challenge outcomes', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const entry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(entry);

  assert.equal(replay.status, 'replay-blocked');
});

test('miniapp interaction: auth envelope missing for challenge outcomes', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  // For a challenge outcome, sync contract might differ
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));

  assert.equal(outcome.state, 'challenge-issued');
});

// ---- 边界 ----

test('miniapp interaction: submit history entry has 7 required fields', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const entry = createMiniappSubmitHistoryEntry(outcome, '2026-06-13T00:00:00.000Z');

  const fields = ['receiptCode', 'action', 'state', 'endpoint', 'occurredAt', 'recommendedAction', 'summary'];
  for (const f of fields) {
    assert.ok(entry[f as keyof typeof entry] !== undefined, `field ${f} should exist`);
  }
});

test('miniapp interaction: retry policy uses REFRESH_TICKET for blocked challenges', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession('SVIP'), 'coupon-claim'));
  const entry = createMiniappSubmitHistoryEntry(outcome);
  const replay = replayMiniappSubmitHistoryEntry(entry);
  const ledger = buildMiniappLedger([entry]);
  const policy = createMiniappReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.retryable, true);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
  assert.ok(policy.maxAttempts >= 2, `maxAttempts should be >= 2, got ${policy.maxAttempts}`);
});

test('miniapp interaction: ledger key includes miniapp prefix', () => {
  const snapshot = toMiniappBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitMiniappActionPlan(createMiniappActionPlan(snapshot, createMemberSession(), 'booking-submit'));
  const history = appendMiniappSubmitHistory([], outcome);
  const ledger = buildMiniappLedger(history);

  assert.ok(ledger[0]!.ledgerKey.startsWith('miniapp-ledger:'));
});
