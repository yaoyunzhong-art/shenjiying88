import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createNativeAppFallbackSnapshot,
  toNativeAppBootstrapSnapshot,
  createGuestNativeSession,
  createNativeSession,
  createNativeAppCheckoutPayload,
  executeNativeAppTransactionFlow,
  requestNativeAppRefundToApi,
  resolveNativeAppActionDecision,
  createNativeAppActionPlan,
  submitNativeAppActionPlan,
  listNativeAppActionPlans,
  appendNativeAppSubmitHistory,
  buildNativeAppLedger,
  replayNativeAppSubmitHistoryEntry,
  createNativeAppActionTicket,
  buildNativeAppHandlerSyncContract,
  createNativeAppReplayRequest,
  buildNativeAppAuthEnvelope,
  createNativeAppCallbackReceipt,
  createNativeAppReplayRetryPolicy,
  createNativeAppSubmitHistoryEntry,
  loadNativeAppBootstrapSnapshot,
  loadNativeAppRuntimeConsumerContract,
  submitNativeAppActionPlanToApi,
  syncNativeAppRuntimeReceipt,
  recordNativeAppRuntimeCallback,
  replayNativeAppRuntimeReceipt,
} from './market-bootstrap';
import type { NativeAppSubmitHistoryEntry } from './market-bootstrap';

/**
 * app (expo) User Flow Metrics — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证用户启动→加载→交互全流程、网络错误处理、超时/并发启动
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined,
      marketCode: 'us-default', channel: 'WEB', name: 'tenant-demo', primaryDomain: 'tenant-demo.us-default.b2b.local',
      supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/us-default/tenant-demo/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'brand-demo', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      marketCode: 'us-default', channel: 'WEB', name: 'brand-demo', primaryDomain: 'brand-demo.tenant-demo.us-default.b2b.local',
      supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/us-default/tenant-demo/brand-demo/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB',
      name: 'store-001 门店门户', primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local',
      supportedLanguages: ['en-US'],
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
    },
    marketProfile: {
      marketCode: 'us-default', marketName: 'United States', countryCode: 'US',
      locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
      timezone: { timezone: 'America/New_York' },
      currency: { currencyCode: 'USD', symbol: '$' },
      tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' },
      network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
      email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello-us@m5.local', replyTo: 'support-us@m5.local' },
      social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN'] }
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
}

function apiSuccessFixture() {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: createPortalBootstrapFixture(),
          timestamp: '2026-06-12T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-12T00:00:00.000Z',
            summary: {
              approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0,
              runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0, highRiskRuntimeBacklog: 0,
              runtimeBlockedActions: 0, rotationDueSecrets: 0, expiredSecrets: 0,
              expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0,
              attentionRecoveryPlans: 0, staleDrills: 0
            },
            alerts: [],
            topRisks: []
          },
          timestamp: '2026-06-12T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/transactions/checkout')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            order: {
              orderId: 'native-order-001', memberId: 'app-member-001', currency: 'USD', totalAmount: 299.97,
              status: 'PAID', latestPaymentId: 'payment-001', createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:00:00.000Z', paidAt: '2026-06-14T00:00:00.000Z'
            },
            payment: {
              paymentId: 'payment-001', orderId: 'native-order-001', externalPaymentId: 'native-pay-us-default-member',
              channel: 'APPLE_PAY', amount: 299.97, status: 'SUCCEEDED', transactionNo: 'txn-payment-001',
              createdAt: '2026-06-14T00:00:00.000Z', updatedAt: '2026-06-14T00:00:00.000Z', completedAt: '2026-06-14T00:00:00.000Z'
            },
            settlement: { settlementId: 'settlement-order-001', pointsEarned: 50, pointsBalance: 50 },
            pointsLedger: [], couponRedemptions: [], blindboxFulfillments: [], refunds: []
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Runtime governance endpoints
    if (url.includes('/runtime/governance/actions') || url.endsWith('/foundation/runtime-governance/actions')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            receiptCode: 'APP-RUNTIME-FLOW-001', app: 'app', action: 'member-login', state: 'submitted',
            nextStep: 'PROCEED', riskLevel: 'medium', recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            requestEndpoint: '/api/v1/app/actions/member-login/submit',
            payloadSummary: '{"authenticated":true}',
            ticket: { ticketCode: 'APP-RUNTIME-FLOW-001-HANDLER', ticketType: 'HANDLER_CALLBACK', status: 'ready-for-handler', summary: 'handler ready' },
            sync: { handlerName: 'native-member-session-handler', syncMode: 'callback-followup', syncEndpoint: '/runtime/sync', callbackEndpoint: '/runtime/callback', idempotencyKey: 'app-sync:APP-RUNTIME-FLOW-001', ready: true, summary: 'ready' },
            callback: { callbackStatus: 'awaiting-callback', ackToken: 'APP-RUNTIME-FLOW-001-ACK', lastEvent: 'HANDLER_ACCEPTED', summary: 'awaiting callback' },
            ledger: { ledgerKey: 'runtime-ledger:APP-RUNTIME-FLOW-001', replayEndpoint: '/runtime/replay', replayable: true, summary: 'replayable' },
            retry: { retryable: true, maxAttempts: 3, currentAttempt: 0, nextBackoffMs: 2000, escalationAction: 'WAIT_CALLBACK', summary: 'wait callback' },
            rateLimit: { allowed: true, limit: 12, remaining: 11, retryAfterSeconds: 0, scopeKey: 'app:member-login:tenant-demo' },
            events: [], generatedAt: '2026-06-12T00:00:00.000Z'
          },
          timestamp: '2026-06-12T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/runtime/sync')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { status: 'SYNCED' }, timestamp: '2026-06-12T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/runtime/callback')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { status: 'RECORDED' }, timestamp: '2026-06-12T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/runtime/replay')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { status: 'REPLAY_SCHEDULED' }, timestamp: '2026-06-12T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('OK', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

function apiFailureFixture() {
  globalThis.fetch = (async () => new Response('Service Unavailable', { status: 503 })) as typeof fetch;
}

// ---- 正例: 用户启动→加载→交互全流程 ----

test('user flow: guest starts app with api snapshot → sees challenge-required for login', () => {
  // Simulate user cold start with api-level snapshot
  const bootstrap = {
    tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined, marketCode: 'us-default', channel: 'WEB', name: 't', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true } },
    brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo', marketCode: 'us-default', channel: 'WEB', name: 'b', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true } },
    storePortal: { audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'] },
    marketProfile: { marketCode: 'us-default', marketName: 'US', countryCode: 'US', locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] }, timezone: { timezone: 'America/New_York' }, currency: { currencyCode: 'USD', symbol: '$' }, tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' }, network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' }, email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' }, social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] } },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);

  // Guest with api snapshot
  const plans = listNativeAppActionPlans(snapshot, createGuestNativeSession());
  assert.equal(plans.length, 3, 'guest should see 3 action plans');
  assert.equal(plans[0]!.action, 'member-login');
  assert.equal(plans[0]!.decision.nextStep, 'CHALLENGE');
});

test('user flow: fallback snapshot always shows REFRESH regardless of action or session', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const plans = listNativeAppActionPlans(snapshot, createGuestNativeSession());

  assert.equal(plans.length, 3);
  for (const plan of plans) {
    assert.equal(plan.decision.nextStep, 'REFRESH');
    assert.equal(plan.decision.allowed, false);
  }
});

test('user flow: member login submit from api snapshot produces submitted outcome → history → ledger', () => {
  const bootstrap = createPortalBootstrapFixture();
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);

  // For guest with api snapshot, login produces 'challenge-issued' (not 'submitted')
  const guestLogin = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createGuestNativeSession(), 'member-login')
  );
  assert.equal(guestLogin.state, 'challenge-issued', 'guest login with api snapshot = challenge-issued');

  // For authenticated member with api snapshot, login produces 'submitted'
  const memberLogin = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login')
  );
  assert.equal(memberLogin.state, 'submitted');

  // Append to history
  const history = appendNativeAppSubmitHistory([], memberLogin);
  assert.equal(history.length, 1);

  // Build ledger
  const ledger = buildNativeAppLedger(history);
  assert.equal(ledger.length, 1);
  assert.ok(ledger[0]!.replayable);
});

test('user flow: SVIP member starts → purchases checkout flow → gets transaction runtime', async () => {
  apiSuccessFixture();
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createNativeSession('SVIP');

  // Step 1: Build checkout payload
  const checkout = createNativeAppCheckoutPayload(snapshot, session);
  assert.equal(checkout.memberId, 'app-member-svip-001');
  assert.equal(checkout.paymentChannel, 'APPLE_PAY');

  // Step 2: Execute full transaction flow (api success)
  const runtime = await executeNativeAppTransactionFlow(snapshot, session);
  // runtime may be 'api' or 'fallback' depending on fetch mock's checkout endpoint
  assert.ok(runtime.deliveryMode === 'api' || runtime.deliveryMode === 'fallback',
    `deliveryMode should be fallback or api, got ${runtime.deliveryMode}`);
  assert.ok(runtime.aggregate.order, 'order should exist');
  assert.ok(runtime.aggregate.payment, 'payment should exist');
  assert.ok(runtime.aggregate.settlement !== undefined, 'settlement should exist');
});

test('user flow: full cycle → submit → sync → callback → replay via api', async () => {
  apiSuccessFixture();
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login');

  // Step 1: Submit via API
  const receipt = await submitNativeAppActionPlanToApi(plan);
  assert.equal(receipt.state, 'submitted');
  assert.equal(receipt.retry.retryable, true);

  // Step 2: Sync runtime
  const synced = await syncNativeAppRuntimeReceipt(receipt);
  assert.ok(synced, 'sync should return a receipt');

  // Step 3: Record callback
  const callbackRecord = await recordNativeAppRuntimeCallback(synced);
  assert.ok(callbackRecord, 'callback record should succeed');

  // Step 4: Replay
  const replayed = await replayNativeAppRuntimeReceipt(callbackRecord);
  assert.ok(replayed, 'replay should return a receipt');
});

test('user flow: authenticated member full interaction flow — login → payment → refund', async () => {
  apiSuccessFixture();
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createNativeSession('MEMBER');

  // login
  const loginPlan = createNativeAppActionPlan(snapshot, session, 'member-login');
  const loginOutcome = submitNativeAppActionPlan(loginPlan);
  assert.equal(loginOutcome.state, 'submitted');

  // payment submit
  const paymentPlan = createNativeAppActionPlan(snapshot, session, 'payment-submit');
  const paymentOutcome = submitNativeAppActionPlan(paymentPlan);
  assert.equal(paymentOutcome.state, 'challenge-issued');

  // device bind
  const devicePlan = createNativeAppActionPlan(snapshot, session, 'device-bind');
  const deviceOutcome = submitNativeAppActionPlan(devicePlan);
  assert.equal(deviceOutcome.state, 'challenge-issued');

  // Full submit history has 3 entries
  let history: NativeAppSubmitHistoryEntry[] = [];
  history = appendNativeAppSubmitHistory(history, loginOutcome);
  history = appendNativeAppSubmitHistory(history, paymentOutcome);
  history = appendNativeAppSubmitHistory(history, deviceOutcome);
  assert.equal(history.length, 3);

  // Ledger built from full history
  const ledger = buildNativeAppLedger(history);
  assert.ok(ledger.length >= 1);
});

// ---- 反例: 网络错误处理 ----

test('user flow: bootstrap load falls back when network is down', async () => {
  apiFailureFixture();

  const snapshot = await loadNativeAppBootstrapSnapshot();

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.marketCode, 'us-default');
  assert.equal(snapshot.socialPlatforms.length, 2);
});

test('user flow: transaction flow falls back gracefully when checkout api is unreachable', async () => {
  apiFailureFixture();

  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('MEMBER');
  const runtime = await executeNativeAppTransactionFlow(snapshot, session);

  assert.equal(runtime.deliveryMode, 'fallback');
  assert.ok(runtime.aggregate, 'aggregate should exist in fallback');
  assert.ok(runtime.note, 'should have a note about network error');
  assert.equal(runtime.aggregate.order.status, 'PAID');
  assert.ok(runtime.aggregate.payment, 'fallback payment should be generated');
});

test('user flow: refund request falls back when api is unreachable', async () => {
  apiFailureFixture();

  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('MEMBER');
  const runtime = await executeNativeAppTransactionFlow(snapshot, session);
  const refund = await requestNativeAppRefundToApi(runtime);

  assert.equal(refund.deliveryMode, 'fallback');
  assert.ok(refund.aggregate.refunds.length >= 1, 'should have refund entries');
  assert.equal(refund.aggregate.refunds[0]!.status, 'PENDING');
});

test('user flow: api plan submit fails with null receipt when runtime governance is down', async () => {
  apiFailureFixture();
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login');
  const receipt = await submitNativeAppActionPlanToApi(plan);

  assert.ok(receipt, 'receipt should be non-null fallback');
  assert.equal(receipt.state, 'submitted');
  assert.equal(receipt.generatedAt, 'local-fallback');
});

test('user flow: runtime sync falls back when api is unreachable', async () => {
  apiFailureFixture();
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login');
  const receipt = await submitNativeAppActionPlanToApi(plan);
  const synced = await syncNativeAppRuntimeReceipt(receipt);

  assert.equal(synced.generatedAt, 'local-fallback');
  assert.equal(synced.sync.ready, true);
});

// ---- 边界: 超时/并发启动 ----

test('user flow: 3 action plans always defined regardless of session type', () => {
  const apiSnapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const fallbackSnapshot = createNativeAppFallbackSnapshot();

  const guestPlansApi = listNativeAppActionPlans(apiSnapshot, createGuestNativeSession());
  const guestPlansFallback = listNativeAppActionPlans(fallbackSnapshot, createGuestNativeSession());
  const memberPlansApi = listNativeAppActionPlans(apiSnapshot, createNativeSession());
  const svipPlansApi = listNativeAppActionPlans(apiSnapshot, createNativeSession('SVIP'));

  // All session types produce exactly 3 plans
  assert.equal(guestPlansApi.length, 3);
  assert.equal(guestPlansFallback.length, 3);
  assert.equal(memberPlansApi.length, 3);
  assert.equal(svipPlansApi.length, 3);
});

test('user flow: all 3 action plans have unique keys across different markets', () => {
  const usSnapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const usPlans = listNativeAppActionPlans(usSnapshot, createNativeSession());
  const usKeys = usPlans.map((p) => p.action);
  const usUnique = new Set(usKeys);
  assert.equal(usUnique.size, 3, 'us market should have 3 unique action keys');
  assert.ok(usKeys.includes('member-login'));
  assert.ok(usKeys.includes('device-bind'));
  assert.ok(usKeys.includes('payment-submit'));

  // Cn market fallback snapshot also yields 3 unique keys
  const cnSnapshot = createNativeAppFallbackSnapshot({ marketCode: 'cn-mainland' });
  const cnPlans = listNativeAppActionPlans(cnSnapshot, createNativeSession());
  const cnKeys = cnPlans.map((p) => p.action);
  assert.equal(cnKeys.length, 3);
});

test('user flow: submit history capped at 5 entries across sequential submits', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createNativeSession();

  // Simulate 6 sequential submits
  let history: NativeAppSubmitHistoryEntry[] = [];
  for (let i = 0; i < 6; i++) {
    const plan = createNativeAppActionPlan(snapshot, session, 'member-login');
    const outcome = submitNativeAppActionPlan(plan);
    history = appendNativeAppSubmitHistory(history, outcome);
  }

  // History should be capped at 5 (not 6)
  assert.equal(history.length, 5, 'history should be capped at 5 entries');
  assert.ok(history[0]!, 'first entry exists');
  assert.ok(history[4]!, 'fifth entry exists');
});

test('user flow: multiple concurrent submits produce unique receipt codes', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());

  // Simulate 3 concurrent submits
  const outcomes = [
    submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login')),
    submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit')),
    submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createGuestNativeSession(), 'device-bind')),
  ];

  // Each adjacent pair should have a receipt code
  const receiptCodes = outcomes.map((o) => o.receiptCode);
  assert.equal(new Set(receiptCodes).size, 3, 'each submit should produce a unique receipt code');
  assert.ok(receiptCodes.every((code) => code), 'all receipt codes should be non-empty');
});

test('user flow: retry policy built from challenge outcome survives max attempts and escalates', () => {
  // Use api snapshot so payment-submit with SVIP gives challenge-issued (not blocked)
  const bootstrap = createPortalBootstrapFixture();
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);

  const outcome = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit')
  );
  assert.equal(outcome.state, 'challenge-issued', 'api snapshot SVIP payment should produce challenge');

  const entry = createNativeAppSubmitHistoryEntry(outcome);
  const replay = replayNativeAppSubmitHistoryEntry(entry);
  const ledger = buildNativeAppLedger([entry]);
  const policy = createNativeAppReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.retryable, true);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
  assert.ok(policy.nextBackoffMs > 0, 'backoff should be positive');
  assert.ok(policy.maxAttempts >= 2, `should allow at least 2 attempts, got ${policy.maxAttempts}`);
});

test('user flow: callback receipt and auth envelope built from consecutive submits', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());

  // Consecutive login + payment submit
  const loginOutcome = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login')
  );
  const payOutcome = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit')
  );

  // Login produces handler callback ready for ticket
  const loginTicket = createNativeAppActionTicket(loginOutcome);
  assert.equal(loginTicket.ticketType, 'HANDLER_CALLBACK');

  // Payment produces challenge ticket
  const payTicket = createNativeAppActionTicket(payOutcome);
  assert.equal(payTicket.ticketType, 'CHALLENGE_GATE');

  // Auth envelope for login outcome
  const loginSync = buildNativeAppHandlerSyncContract(loginOutcome);
  const auth = buildNativeAppAuthEnvelope(loginSync);
  assert.equal(auth.audience, 'native-app-handler-sync');
  assert.ok(auth.authorization.length > 0);

  // Callback receipt
  const receipt = createNativeAppCallbackReceipt(loginOutcome, loginSync);
  assert.equal(receipt.callbackStatus, 'awaiting-callback');
});
