import assert from 'node:assert/strict';
import test from 'node:test';
import { describe } from 'node:test';
import type { PortalBootstrapResponse, RuntimeGovernanceReceipt } from '@m5/types';
import {
  createNativeAppFallbackSnapshot,
  toNativeAppBootstrapSnapshot,
  createGuestNativeSession,
  createNativeSession,
  createNativeAppRuntimeConsumerContract,
  loadNativeAppBootstrapSnapshot,
  loadNativeAppRuntimeConsumerContract,
  executeNativeAppTransactionFlow,
  requestNativeAppRefundToApi,
  resolveNativeAppActionDecision,
  createNativeAppActionPlan,
  createNativeAppCheckoutPayload,
  listNativeAppActionPlans,
  submitNativeAppActionPlan,
  appendNativeAppSubmitHistory,
  buildNativeAppLedger,
  replayNativeAppSubmitHistoryEntry,
  createNativeAppSubmitHistoryEntry,
  createNativeAppActionTicket,
  buildNativeAppHandlerSyncContract,
  createNativeAppCallbackReceipt,
  buildNativeAppAuthEnvelope,
  createNativeAppReplayRetryPolicy,
  loadNativeAppGovernanceReadModel,
} from './market-bootstrap';
import type {
  NativeAppBootstrapSnapshot,
  NativeAppSession,
  NativeAppActionKey,
  NativeAppBootstrapContext,
  NativeAppSubmitOutcome,
  NativeAppSubmitHistoryEntry,
  NativeAppReplayOutcome,
  NativeAppActionPlan,
  NativeAppTransactionRuntimeSnapshot,
} from './market-bootstrap';

/**
 * app (expo) User Journey — L1 用户旅程冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证原生 App 完整用户旅程：引导启动 → 市场初始化 → 会话管理 → 交易流 → 错误恢复
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

function apiSuccessFixture() {
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
              approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0,
              runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0, highRiskRuntimeBacklog: 0,
              runtimeBlockedActions: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0,
              expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0
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

    if (url.includes('/transactions/payments/standardized-callback')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: { status: 'RECORDED' },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/transactions/orders/')) {
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

    if (url.includes('/refunds')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            order: {
              orderId: 'native-order-001', memberId: 'app-member-001', currency: 'USD', totalAmount: 299.97,
              status: 'REFUNDING', latestPaymentId: 'payment-001', createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:00:00.000Z', paidAt: '2026-06-14T00:00:00.000Z'
            },
            payment: {
              paymentId: 'payment-001', orderId: 'native-order-001', externalPaymentId: 'native-pay-us-default-member',
              channel: 'APPLE_PAY', amount: 299.97, status: 'SUCCEEDED', transactionNo: 'txn-payment-001',
              createdAt: '2026-06-14T00:00:00.000Z', updatedAt: '2026-06-14T00:00:00.000Z', completedAt: '2026-06-14T00:00:00.000Z'
            },
            settlement: { settlementId: 'settlement-order-001', pointsEarned: 50, pointsBalance: 50 },
            pointsLedger: [], couponRedemptions: [], blindboxFulfillments: [],
            refunds: [{
              refundId: 'refund-order-001', orderId: 'native-order-001', paymentId: 'payment-001',
              memberId: 'app-member-001', refundAmount: 299.97, reason: 'app-native-refund-rehearsal',
              operator: 'app-runtime', status: 'PENDING', requestedAt: '2026-06-14T00:05:00.000Z'
            }]
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // governance runtime receipts
    if (url.includes('/runtime/governance/receipts')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            receiptCode: 'NATIVE-BOOTSTRAP-RECEIPT',
            action: 'member-login', state: 'challenge-issued',
            requestEndpoint: '/api/v1/app/actions/member-login/submit',
            nextStep: 'CHALLENGE', recommendedAction: 'COMPLETE_LOGIN',
            riskLevel: 'medium',
            events: [
              { eventType: 'runtime-governance.action.submitted', status: 'accepted', idempotencyKey: 'ik-1', occurredAt: '2026-06-14T00:00:00.000Z', summary: 'action submitted' }
            ],
            sync: {
              handlerName: 'native-app-member-session-handler', syncMode: 'callback-followup',
              syncEndpoint: '/runtime/sync', callbackEndpoint: '/runtime/callback',
              idempotencyKey: 'ik-sync', ticketCode: 'ticket-001', ready: true,
              summary: 'handler sync ready'
            },
            callback: {
              callbackStatus: 'awaiting-callback', ackToken: 'ack-001',
              lastEvent: 'HANDLER_ACCEPTED', summary: 'awaiting callback record'
            },
            ledger: {
              receiptCode: 'NATIVE-BOOTSTRAP-RECEIPT', ledgerKey: 'native-ledger:NATIVE-BOOTSTRAP-RECEIPT',
              action: 'member-login', state: 'challenge-issued',
              replayEndpoint: '/runtime/replay', replayable: true,
              recommendedAction: 'COMPLETE_LOGIN', summary: 'ledger entry'
            },
            ticket: {
              receiptCode: 'NATIVE-BOOTSTRAP-RECEIPT', ticketCode: 'ticket-001',
              ticketType: 'CHALLENGE_GATE', status: 'pending-challenge',
              summary: 'challenge gate ticket'
            },
            retry: {
              retryable: true, maxAttempts: 3, currentAttempt: 1, nextBackoffMs: 5000,
              escalationAction: 'REFRESH_TICKET', summary: 'retry policy active'
            },
            generatedAt: '2026-06-14T00:00:00.000Z'
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/runtime/sync')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: { status: 'SYNCED' },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/runtime/callback')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: { status: 'RECORDED' },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/runtime/replay')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: { status: 'REPLAY_SCHEDULED' },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/alerts/drilldown') || url.includes('/drilldown')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            code: 'approvals-pending', generatedAt: '2026-06-14T00:00:00.000Z',
            alert: { code: 'approvals-pending', severity: 'medium', summary: '2 pending approvals' },
            visibleInOverview: true, availableActions: ['acknowledge'],
            history: [{ action: 'generated', createdAt: '2026-06-14T00:00:00.000Z', actorId: 'system' }],
            detail: { pendingCount: 2 }
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/alerts/')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            code: 'approvals-pending', visibleInOverview: false,
            acknowledgement: { status: 'ACKNOWLEDGED', note: 'acknowledged', actorId: 'system' },
            availableActions: ['unmute'],
            history: [{ action: 'acknowledged', createdAt: '2026-06-14T00:00:00.000Z', actorId: 'system' }]
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('OK', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

function apiFailureFixture() {
  globalThis.fetch = (async () => new Response('Service Unavailable', { status: 503 })) as typeof fetch;
}

// ---- 正例 ----

describe('app journey: bootstrap sequence — 正例', () => {

  test('app journey: fallback snapshot is delivered during cold start', () => {
    const snapshot = createNativeAppFallbackSnapshot();

    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.marketCode, 'us-default');
    assert.equal(snapshot.defaultLanguage, 'en-US');
    assert.equal(snapshot.emailProvider, 'SENDGRID');
    assert.deepEqual(snapshot.socialPlatforms, ['LINKEDIN', 'INSTAGRAM']);
    assert.equal(snapshot.primaryDomain, 'store-001.brand-demo.tenant-demo.us-default.local');
    assert.deepEqual(snapshot.supportedSurfaces, ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']);
  });

  test('app journey: api bootstrap delivered with correct market profile', async () => {
    apiSuccessFixture();

    const snapshot = await loadNativeAppBootstrapSnapshot();

    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.marketCode, 'us-default');
    assert.equal(snapshot.defaultLanguage, 'en-US');
    assert.equal(snapshot.timezone, 'America/New_York');
    assert.equal(snapshot.emailProvider, 'SENDGRID');
  });

  test('app journey: runtime consumer contract has proper binding on bootstrap delivery', async () => {
    apiSuccessFixture();

    const contract = await loadNativeAppRuntimeConsumerContract();

    assert.equal(contract.snapshot.deliveryMode, 'api');
    assert.equal(contract.snapshot.marketCode, 'us-default');
    assert.equal(contract.scope.scopePath, 'us-default / tenant-demo / brand-demo / store-001');
    assert.equal(contract.challenge.enforcement, 'STEP_UP');
    assert.equal(contract.governance.deliveryMode, 'api');
  });

  test('app journey: refresh governance alerts returns alert catalog with generated timestamp and overview summary', async () => {
    apiSuccessFixture();

    const governance = await loadNativeAppGovernanceReadModel();

    assert.ok(governance.generatedAt, 'should have generatedAt');
    assert.equal(Array.isArray(governance.alerts), true);
    assert.ok(governance.summary, 'should have summary object');
    assert.equal(typeof governance.summary.approvalsPending, 'number');
  });

});

describe('app journey: market initialization — 正例', () => {

  test('app journey: market initialization produces valid checkout payload for SVIP', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const session = createNativeSession('SVIP');
    const checkout = createNativeAppCheckoutPayload(snapshot, session);

    assert.ok(checkout.memberId, 'should have memberId');
    assert.equal(checkout.paymentChannel, 'APPLE_PAY');
    assert.equal(checkout.currency, 'USD');
    assert.ok(checkout.amount !== undefined && checkout.amount > 0, 'amount should be positive');
    assert.ok(checkout.items.length >= 2, 'should have at least 2 checkout items');
  });

  test('app journey: guest checkout payload generated with fallback member id', () => {
    const snapshot = createNativeAppFallbackSnapshot();
    const session = createGuestNativeSession();
    const checkout = createNativeAppCheckoutPayload(snapshot, session);

    assert.equal(checkout.memberId, 'app-us-default-guest');
    assert.equal(checkout.paymentChannel, 'APPLE_PAY');
  });

  test('app journey: checkout payload for cn-mainland uses WeChat Pay and CNY', () => {
    const cnSnapshot = createNativeAppFallbackSnapshot({ marketCode: 'cn-mainland' });
    const session = createGuestNativeSession();
    const checkout = createNativeAppCheckoutPayload(cnSnapshot, session);

    assert.equal(checkout.paymentChannel, 'WECHAT_PAY');
    assert.equal(checkout.currency, 'CNY');
  });

});

describe('app journey: session management — 正例', () => {

  test('app journey: guest session has no identity', () => {
    const session = createGuestNativeSession();

    assert.equal(session.authenticated, false);
    assert.equal(session.memberTier, 'GUEST');
    assert.equal(session.paymentReady, false);
    assert.equal(session.memberId, undefined);
    assert.equal(session.nickname, undefined);
  });

  test('app journey: native member session has identity and payment ready', () => {
    const session = createNativeSession('MEMBER');

    assert.equal(session.authenticated, true);
    assert.equal(session.memberTier, 'MEMBER');
    assert.equal(session.paymentReady, true);
    assert.equal(session.memberId, 'app-member-001');
    assert.equal(session.nickname, 'App Member');
  });

  test('app journey: SVIP session has privileged identity', () => {
    const session = createNativeSession('SVIP');

    assert.equal(session.authenticated, true);
    assert.equal(session.memberTier, 'SVIP');
    assert.equal(session.memberId, 'app-member-svip-001');
    assert.equal(session.nickname, 'App SVIP Member');
  });

  test('app journey: guest upgrade to member changes bootstrap state', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());

    const guestLoginDecision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'member-login');
    const memberLoginDecision = resolveNativeAppActionDecision(snapshot, createNativeSession('MEMBER'), 'member-login');

    assert.equal(guestLoginDecision.bootstrapState, 'challenge-required');
    assert.equal(guestLoginDecision.allowed, false);
    assert.equal(memberLoginDecision.bootstrapState, 'ready');
    assert.equal(memberLoginDecision.allowed, true);
  });

});

// ---- 反例 ----

describe('app journey: error recovery — 反例', () => {

  test('app journey: fallback snapshot on api failure', async () => {
    apiFailureFixture();

    const snapshot = await loadNativeAppBootstrapSnapshot();

    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.marketCode, 'us-default');
  });

  test('app journey: any payment submit via fallback snapshot is blocked', () => {
    const snapshot = createNativeAppFallbackSnapshot();
    const session = createNativeSession('SVIP');
    const plan = createNativeAppActionPlan(snapshot, session, 'payment-submit');

    assert.equal(plan.decision.bootstrapState, 'readonly-fallback');
    assert.equal(plan.decision.allowed, false);
    assert.equal(plan.decision.nextStep, 'REFRESH');
  });

  test('app journey: device-bind blocked for guest', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const plan = createNativeAppActionPlan(snapshot, createGuestNativeSession(), 'device-bind');
    const outcome = submitNativeAppActionPlan(plan);

    assert.equal(outcome.state, 'blocked');
    assert.equal(outcome.nextStep, 'LOGIN');
  });

  test('app journey: payment-submit challenge-issued for authenticated member', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const plan = createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit');
    const outcome = submitNativeAppActionPlan(plan);

    assert.equal(outcome.state, 'challenge-issued');
    assert.equal(outcome.nextStep, 'CHALLENGE');
    assert.equal(outcome.state, 'challenge-issued');
  });

  test('app journey: transaction flow falls back when api is unreachable', async () => {
    apiFailureFixture();

    const snapshot = createNativeAppFallbackSnapshot();
    const session = createNativeSession('MEMBER');
    const runtime = await executeNativeAppTransactionFlow(snapshot, session);

    assert.equal(runtime.deliveryMode, 'fallback');
    assert.ok(runtime.aggregate, 'should have aggregate in fallback');
    assert.equal(runtime.aggregate.order.status, 'PAID');
    assert.ok(runtime.note.includes('不可达'), 'should mention api unavailability');
  });

  test('app journey: refund request falls back when api is unreachable', async () => {
    apiFailureFixture();

    const snapshot = createNativeAppFallbackSnapshot();
    const session = createNativeSession('MEMBER');
    const runtime = await executeNativeAppTransactionFlow(snapshot, session);
    const refunded = await requestNativeAppRefundToApi(runtime);

    assert.equal(refunded.deliveryMode, 'fallback');
    assert.ok(refunded.aggregate.refunds.length >= 1, 'should have at least one refund');
    assert.equal(refunded.aggregate.refunds[0]!.status, 'PENDING');
  });

});

// ---- 边界 ----

describe('app journey: boundary cases — 边界', () => {

  test('app journey: action plans list all 3 keys for api bootstrap', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const session = createNativeSession('SVIP');
    const plans = listNativeAppActionPlans(snapshot, session);

    assert.equal(plans.length, 3);
    const keys = plans.map((p) => p.action);
    assert.ok(keys.includes('member-login'));
    assert.ok(keys.includes('device-bind'));
    assert.ok(keys.includes('payment-submit'));
  });

  test('app journey: all 3 fallback plans forced to REFRESH', () => {
    const snapshot = createNativeAppFallbackSnapshot();
    const session = createGuestNativeSession();
    const plans = listNativeAppActionPlans(snapshot, session);

    assert.equal(plans.length, 3);
    for (const plan of plans) {
      assert.equal(plan.decision.nextStep, 'REFRESH');
      assert.equal(plan.decision.allowed, false);
    }
  });

  test('app journey: ledger replayable for successfully submitted action', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const plan = createNativeAppActionPlan(snapshot, createNativeSession('MEMBER'), 'member-login');
    const outcome = submitNativeAppActionPlan(plan);
    const history = appendNativeAppSubmitHistory([], outcome);
    const ledger = buildNativeAppLedger(history);

    assert.equal(ledger.length, 1);
    assert.ok(ledger[0]!.ledgerKey.startsWith('native-ledger:'));
    assert.equal(ledger[0]!.replayable, true);
  });

  test('app journey: replay blocked for challenge-pending outcomes', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitNativeAppActionPlan(
      createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit')
    );
    const entry = createNativeAppSubmitHistoryEntry(outcome);
    const replay = replayNativeAppSubmitHistoryEntry(entry);

    assert.equal(replay.status, 'replay-blocked');
    assert.equal(replay.status, 'replay-blocked');
  });

  test('app journey: retry policy uses REFRESH_TICKET for challenge outcomes', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitNativeAppActionPlan(
      createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit')
    );
    const entry = createNativeAppSubmitHistoryEntry(outcome);
    const replay = replayNativeAppSubmitHistoryEntry(entry);
    const ledger = buildNativeAppLedger([entry]);
    const policy = createNativeAppReplayRetryPolicy(ledger[0]!, replay);

    assert.equal(policy.retryable, true);
    assert.equal(policy.escalationAction, 'REFRESH_TICKET');
    assert.ok(policy.maxAttempts >= 2, `maxAttempts should be >= 2, got ${policy.maxAttempts}`);
  });

  test('app journey: submit history capped at 5 entries', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitNativeAppActionPlan(
      createNativeAppActionPlan(snapshot, createNativeSession('MEMBER'), 'member-login')
    );
    // Fill history with 5 old entries first
    const oldEntries: NativeAppSubmitHistoryEntry[] = Array.from({ length: 5 }, (_, i) => ({
      receiptCode: `OLD-${i}`,
      action: 'member-login' as NativeAppActionKey,
      state: 'blocked' as NativeAppSubmitOutcome['state'],
      endpoint: '/old',
      occurredAt: `2026-06-12T0${i}:00:00.000Z`,
      recommendedAction: 'COMPLETE_LOGIN' as NativeAppSubmitOutcome['recommendedAction'],
      summary: 'old entry'
    }));
    const next = appendNativeAppSubmitHistory(oldEntries, outcome);

    assert.equal(next.length, 5);
    assert.equal(next[0]!.receiptCode, 'NATIVE-MEMBER-LOGIN-PROCEED');
  });

  test('app journey: auth envelope has native audience and scheme', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitNativeAppActionPlan(
      createNativeAppActionPlan(snapshot, createNativeSession('MEMBER'), 'member-login')
    );
    const sync = buildNativeAppHandlerSyncContract(outcome);
    const auth = buildNativeAppAuthEnvelope(sync);

    assert.equal(auth.audience, 'native-app-handler-sync');
    assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
    assert.ok(auth.authorization.includes('NATIVE-MEMBER-LOGIN-PROCEED-HANDLER'));
    assert.ok(auth.signedHeaders.includes('x-m5-nonce'));
    assert.ok(auth.signedHeaders.includes('x-m5-timestamp'));
  });

  test('app journey: callback receipt for submitted login tracks handler', () => {
    const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
    const outcome = submitNativeAppActionPlan(
      createNativeAppActionPlan(snapshot, createNativeSession('MEMBER'), 'member-login')
    );
    const sync = buildNativeAppHandlerSyncContract(outcome);
    const receipt = createNativeAppCallbackReceipt(outcome, sync);

    assert.equal(receipt.callbackStatus, 'awaiting-callback');
    assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
    assert.ok(receipt.ackToken.includes('NATIVE-MEMBER-LOGIN-PROCEED'));
    assert.ok(receipt.callbackEndpoint.includes('/callback'));
  });

});
