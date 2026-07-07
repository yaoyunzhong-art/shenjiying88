import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  appendNativeAppSubmitHistory,
  buildNativeAppAuthEnvelope,
  buildNativeAppLedger,
  buildNativeAppHandlerSyncContract,
  createNativeAppCallbackReceipt,
  createNativeAppActionTicket,
  createNativeAppReplayRequest,
  createNativeAppRuntimeConsumerContract,
  createNativeAppReplayRetryPolicy,
  createNativeAppSubmitHistoryEntry,
  createNativeAppActionPlan,
  createNativeAppCheckoutPayload,
  createGuestNativeSession,
  createNativeSession,
  createNativeAppFallbackSnapshot,
  createNativeAppRefundPayload,
  executeNativeAppTransactionFlow,
  listNativeAppActionPlans,
  loadNativeAppRuntimeConsumerContract,
  loadNativeAppRuntimeReceipt,
  loadNativeAppBootstrapSnapshot,
  acknowledgeNativeAppGovernanceAlert,
  loadNativeAppAlertDrilldown,
  recordNativeAppRuntimeCallback,
  loadNativeAppGovernanceReadModel,
  muteNativeAppGovernanceAlert,
  requestNativeAppRefundToApi,
  unmuteNativeAppGovernanceAlert,
  refreshNativeAppGovernanceAlerts,
  replayNativeAppRuntimeReceipt,
  replayNativeAppSubmitHistoryEntry,
  resolveNativeAppActionDecision,
  syncNativeAppRuntimeReceipt,
  submitNativeAppActionPlanToApi,
  submitNativeAppActionPlan,
  toNativeAppBootstrapSnapshot
} from './market-bootstrap';
import type { NativeAppPaymentSubmitDraft } from './market-bootstrap';

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB',
      scopeType: 'TENANT',
      scopeCode: 'tenant-demo',
      tenantCode: 'tenant-demo',
      brandCode: undefined,
      marketCode: 'us-default',
      channel: 'WEB',
      name: 'tenant-demo ToB 官网',
      primaryDomain: 'tenant-demo.us-default.b2b.local',
      supportedLanguages: ['en-US'],
      heroTitle: 'tenant-demo 企业级经营门户',
      heroSubtitle: 'demo',
      solutionTags: [],
      loginEntry: { label: '进入租户后台', loginPath: '/us-default/tenant-demo/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB',
      scopeType: 'BRAND',
      scopeCode: 'brand-demo',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      marketCode: 'us-default',
      channel: 'WEB',
      name: 'brand-demo 品牌 ToB 官网',
      primaryDomain: 'brand-demo.tenant-demo.us-default.b2b.local',
      supportedLanguages: ['en-US'],
      heroTitle: 'brand-demo 品牌经营官网',
      heroSubtitle: 'demo',
      solutionTags: [],
      loginEntry: { label: '进入品牌后台', loginPath: '/us-default/tenant-demo/brand-demo/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC',
      scopeType: 'STORE',
      scopeCode: 'store-001',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001',
      storeName: 'store-001 门店',
      marketCode: 'us-default',
      channel: 'WEB',
      name: 'store-001 门店门户',
      primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local',
      supportedLanguages: ['en-US'],
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
    },
    marketProfile: {
      marketCode: 'us-default',
      marketName: 'United States',
      countryCode: 'US',
      locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
      timezone: { timezone: 'America/New_York' },
      currency: { currencyCode: 'USD', symbol: '$' },
      tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' },
      network: {
        networkRegion: 'NORTH_AMERICA',
        apiBaseUrl: 'https://us-api.m5.local',
        cdnBaseUrl: 'https://us-cdn.m5.local',
        callbackBaseUrl: 'https://us-hooks.m5.local'
      },
      email: {
        provider: 'SENDGRID',
        fromName: 'M5 US',
        fromAddress: 'hello-us@m5.local',
        replyTo: 'support-us@m5.local'
      },
      social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN'] }
    },
    regionalOverrides: [],
    foundationDependencies: ['identity-access', 'configuration-governance'],
    foundationContracts: ['@m5/types']
  };
}

test('native app bootstrap: fallback snapshot stays aligned to app defaults', () => {
  assert.deepEqual(createNativeAppFallbackSnapshot(), {
    deliveryMode: 'fallback',
    marketCode: 'us-default',
    defaultLanguage: 'en-US',
    timezone: 'America/New_York',
    emailProvider: 'SENDGRID',
    socialPlatforms: ['LINKEDIN', 'INSTAGRAM'],
    primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local',
    supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
  });
});

test('native app bootstrap: maps portal bootstrap into runtime snapshot', () => {
  assert.deepEqual(toNativeAppBootstrapSnapshot(createPortalBootstrapFixture()), {
    deliveryMode: 'api',
    marketCode: 'us-default',
    defaultLanguage: 'en-US',
    timezone: 'America/New_York',
    emailProvider: 'SENDGRID',
    socialPlatforms: ['LINKEDIN', 'INSTAGRAM'],
    primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local',
    supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
  });
});

test('native app bootstrap: creates runtime consumer contract with fallback governance defaults', () => {
  const contract = createNativeAppRuntimeConsumerContract(createNativeAppFallbackSnapshot());

  assert.equal(contract.scope.scopePath, 'us-default / tenant-demo / brand-demo / store-001');
  assert.equal(contract.scope.mismatchStrategy, 'FAIL_CLOSED');
  assert.equal(contract.degradation.featureFlagFallback, 'READONLY_LAST_KNOWN');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
  assert.equal(contract.governance.deliveryMode, 'fallback');
  assert.equal(contract.governance.alerts.length > 0, true);
  assert.equal(contract.governance.summary.approvalsPending, 0);
  assert.equal(contract.governance.topRisks.length, 0);
});

test('native app bootstrap: falls back when portal bootstrap request fails', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await loadNativeAppBootstrapSnapshot();

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.marketCode, 'us-default');
});

test('native app bootstrap: loads runtime consumer contract from api and governance catalog', async () => {
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
              approvalsPending: 1,
              approvalsWithFailures: 2,
              highRiskAudits: 3,
              blockedLedgers: 0,
              rotationDueSecrets: 0,
              expiredSecrets: 0,
              expiringCertificates: 1,
              expiredCertificates: 0,
              degradedSignals: 2,
              attentionRecoveryPlans: 1,
              staleDrills: 0
            },
            alerts: [],
            topRisks: [
              {
                severity: 'high',
                code: 'approval-execution-failures',
                count: 2,
                summary: '存在执行失败且待人工确认的审批单',
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
              code: 'approval-execution-failures',
              defaultSummary: '存在执行失败且待人工确认的审批单',
              severityPolicy: 'demo',
              sourceModules: ['configuration-governance'],
              drilldownEnabled: true,
              acknowledgementEnabled: true,
              drilldownPath: '/foundation/overview/alerts/approval-execution-failures/drilldown',
              ackPath: '/foundation/overview/alerts/approval-execution-failures/ack',
              mutePath: '/foundation/overview/alerts/approval-execution-failures/mute'
            }
          ]
        },
        timestamp: '2026-06-12T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const contract = await loadNativeAppRuntimeConsumerContract();

  assert.equal(contract.snapshot.deliveryMode, 'api');
  assert.equal(contract.scope.scopePath, 'us-default / tenant-demo / brand-demo / store-001');
  assert.equal(contract.governance.deliveryMode, 'api');
  assert.deepEqual(contract.governance.alerts.map((item) => item.code), ['approval-execution-failures']);
  assert.equal(contract.governance.summary.approvalsWithFailures, 2);
  assert.equal(contract.governance.topRisks[0]?.code, 'approval-execution-failures');
});

test('native app bootstrap: loads governance read model when only overview endpoint is available', async () => {
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
              approvalsPending: 1,
              approvalsWithFailures: 4,
              highRiskAudits: 3,
              blockedLedgers: 1,
              rotationDueSecrets: 0,
              expiredSecrets: 0,
              expiringCertificates: 0,
              expiredCertificates: 0,
              degradedSignals: 2,
              attentionRecoveryPlans: 1,
              staleDrills: 0
            },
            alerts: [],
            topRisks: [
              {
                severity: 'high',
                code: 'approval-execution-failures',
                count: 4,
                summary: '存在执行失败的审批单',
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

  const governance = await loadNativeAppGovernanceReadModel();

  assert.equal(governance.generatedAt, '2026-06-13T00:00:00.000Z');
  assert.equal(governance.deliveryMode, 'fallback');
  assert.equal(governance.summary.approvalsWithFailures, 4);
  assert.equal(governance.topRisks[0]?.code, 'approval-execution-failures');
  assert.equal(governance.alerts.length > 0, true);
});

test('native app bootstrap: exposes runtime consumer contract with scope and governance fallback', () => {
  const contract = createNativeAppRuntimeConsumerContract(createNativeAppFallbackSnapshot());

  assert.equal(contract.scope.scopePath, 'us-default / tenant-demo / brand-demo / store-001');
  assert.equal(contract.scope.mismatchStrategy, 'FAIL_CLOSED');
  assert.equal(contract.degradation.featureFlagFallback, 'READONLY_LAST_KNOWN');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
  assert.equal(contract.governance.deliveryMode, 'fallback');
  assert.match(contract.governance.alerts[0]?.code ?? '', /approvals-pending/);
});

test('native app bootstrap: blocks high-risk actions while using fallback snapshot', () => {
  const decision = resolveNativeAppActionDecision(
    createNativeAppFallbackSnapshot(),
    createNativeSession(),
    'payment-submit'
  );

  assert.equal(decision.bootstrapState, 'readonly-fallback');
  assert.equal(decision.allowed, false);
  assert.equal(decision.nextStep, 'REFRESH');
});

test('native app bootstrap: requires login before payment or device actions', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());

  const paymentDecision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'payment-submit');
  const loginDecision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'member-login');

  assert.equal(paymentDecision.bootstrapState, 'scope-mismatch');
  assert.equal(paymentDecision.nextStep, 'LOGIN');
  assert.equal(loginDecision.bootstrapState, 'challenge-required');
  assert.equal(loginDecision.nextStep, 'CHALLENGE');
});

test('native app bootstrap: forces challenge before payment and device bind for authenticated members', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createNativeSession('SVIP');

  const paymentDecision = resolveNativeAppActionDecision(snapshot, session, 'payment-submit');
  const deviceDecision = resolveNativeAppActionDecision(snapshot, session, 'device-bind');

  assert.equal(paymentDecision.bootstrapState, 'challenge-required');
  assert.equal(paymentDecision.allowed, false);
  assert.equal(deviceDecision.bootstrapState, 'challenge-required');
  assert.equal(deviceDecision.allowed, false);
});

test('native app bootstrap: builds payment execution plan with risk channel', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const session = createNativeSession('SVIP');
  const plan = createNativeAppActionPlan(snapshot, session, 'payment-submit');

  assert.equal(plan.label, '支付提交');
  assert.equal(plan.channel, 'PAYMENT_RISK');
  assert.equal(plan.decision.nextStep, 'CHALLENGE');
  assert.equal(plan.checklist.includes('完成设备信任与支付风控校验'), true);
  assert.equal(plan.requestPreview.endpoint, '/api/v1/app/payments/submit');
  assert.equal((plan.requestPreview.payload as NativeAppPaymentSubmitDraft).orderNo, 'PAY-20260612-0001');
});

test('native app bootstrap: lists governed plans with refresh fallback channel', () => {
  const plans = listNativeAppActionPlans(createNativeAppFallbackSnapshot(), createGuestNativeSession());

  assert.equal(plans.length, 3);
  assert.equal(plans.every((plan) => plan.decision.nextStep === 'REFRESH'), true);
  assert.equal(plans.every((plan) => plan.channel === 'BOOTSTRAP_REFRESH'), true);
});

test('native app bootstrap: blocks submit outcome when login is required', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createGuestNativeSession(), 'device-bind');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'blocked');
  assert.equal(outcome.nextStep, 'LOGIN');
  assert.equal(outcome.endpoint, '/api/v1/app/devices/bind');
});

test('native app bootstrap: issues challenge outcome for payment submit', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'challenge-issued');
  assert.equal(outcome.nextStep, 'CHALLENGE');
  assert.match(outcome.message, /PAYMENT_RISK/);
});

test('native app bootstrap: submits login outcome when action is ready', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'submitted');
  assert.equal(outcome.nextStep, 'PROCEED');
  assert.match(outcome.payloadSummary, /authenticated/);
  assert.equal(outcome.recommendedAction, 'FOLLOW_SUBMIT_CALLBACK');
});

test('native app bootstrap: creates submit history entry with receipt and summary', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const entry = createNativeAppSubmitHistoryEntry(outcome, '2026-06-12T10:00:00.000Z');

  assert.equal(entry.receiptCode, 'NATIVE-MEMBER-LOGIN-PROCEED');
  assert.equal(entry.occurredAt, '2026-06-12T10:00:00.000Z');
  assert.match(entry.summary, /FOLLOW_SUBMIT_CALLBACK/);
});

test('native app bootstrap: prepends submit history and keeps latest five entries', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const history = Array.from({ length: 5 }, (_, index) => ({
    receiptCode: `OLD-${index}`,
    action: 'member-login' as const,
    state: 'blocked' as const,
    endpoint: '/old',
    occurredAt: `2026-06-12T0${index}:00:00.000Z`,
    recommendedAction: 'COMPLETE_LOGIN' as const,
    summary: 'old'
  }));

  const nextHistory = appendNativeAppSubmitHistory(history, outcome);

  assert.equal(nextHistory.length, 5);
  assert.equal(nextHistory[0]?.receiptCode, 'NATIVE-MEMBER-LOGIN-PROCEED');
  assert.equal(nextHistory[4]?.receiptCode, 'OLD-3');
});

test('native app bootstrap: builds replayable ledger record for submitted history', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const history = appendNativeAppSubmitHistory([], outcome);
  const ledger = buildNativeAppLedger(history);

  assert.equal(ledger[0]?.ledgerKey, 'native-ledger:NATIVE-MEMBER-LOGIN-PROCEED');
  assert.equal(ledger[0]?.replayable, true);
  assert.equal(ledger[0]?.replayEndpoint, '/api/v1/app/actions/NATIVE-MEMBER-LOGIN-PROCEED/replay');
});

test('native app bootstrap: blocks replay when challenge is unfinished', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const historyEntry = createNativeAppSubmitHistoryEntry(outcome);
  const replay = replayNativeAppSubmitHistoryEntry(historyEntry);

  assert.equal(replay.status, 'replay-blocked');
  assert.equal(replay.replayEndpoint, '/api/v1/app/actions/NATIVE-PAYMENT-SUBMIT-CHALLENGE/replay');
});

test('native app bootstrap: schedules replay for submitted login history', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const historyEntry = createNativeAppSubmitHistoryEntry(outcome);
  const replay = replayNativeAppSubmitHistoryEntry(historyEntry);

  assert.equal(replay.status, 'replay-scheduled');
  assert.match(replay.message, /ledger replay/);
});

test('native app bootstrap: builds challenge ticket for payment outcome', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const ticket = createNativeAppActionTicket(outcome);

  assert.equal(ticket.ticketType, 'CHALLENGE_GATE');
  assert.equal(ticket.status, 'pending-challenge');
  assert.equal(ticket.ticketCode, 'NATIVE-PAYMENT-SUBMIT-CHALLENGE-CHALLENGE');
});

test('native app bootstrap: builds handler sync contract for submitted login outcome', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const sync = buildNativeAppHandlerSyncContract(outcome);

  assert.equal(sync.handlerName, 'native-member-session-handler');
  assert.equal(sync.syncMode, 'callback-followup');
  assert.equal(sync.ready, true);
  assert.equal(sync.syncEndpoint, '/api/v1/app/handlers/native-member-session-handler/sync');
});

test('native app bootstrap: builds replay request from ledger record', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const history = appendNativeAppSubmitHistory([], outcome);
  const ledger = buildNativeAppLedger(history);
  const request = createNativeAppReplayRequest(ledger[0]!);

  assert.equal(request.method, 'POST');
  assert.equal(request.endpoint, '/api/v1/app/actions/NATIVE-MEMBER-LOGIN-PROCEED/replay');
  assert.equal(request.headers['x-m5-receipt-code'], 'NATIVE-MEMBER-LOGIN-PROCEED');
  assert.equal(request.body.ticketCode, 'NATIVE-MEMBER-LOGIN-PROCEED-HANDLER');
});

test('native app bootstrap: builds auth envelope from handler sync contract', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const sync = buildNativeAppHandlerSyncContract(outcome);
  const auth = buildNativeAppAuthEnvelope(sync);

  assert.equal(auth.audience, 'native-app-handler-sync');
  assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
  assert.equal(auth.authorization, 'M5 NATIVE-MEMBER-LOGIN-PROCEED-HANDLER.app-sync:NATIVE-MEMBER-LOGIN-PROCEED');
});

test('native app bootstrap: builds callback receipt for submitted outcome', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login'));
  const sync = buildNativeAppHandlerSyncContract(outcome);
  const receipt = createNativeAppCallbackReceipt(outcome, sync);

  assert.equal(receipt.callbackStatus, 'awaiting-callback');
  assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
  assert.equal(receipt.ackToken, 'NATIVE-MEMBER-LOGIN-PROCEED-ACK-HANDLER');
});

test('native app bootstrap: builds retry policy for blocked replay', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const outcome = submitNativeAppActionPlan(createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit'));
  const entry = createNativeAppSubmitHistoryEntry(outcome);
  const replay = replayNativeAppSubmitHistoryEntry(entry);
  const ledger = buildNativeAppLedger([entry]);
  const policy = createNativeAppReplayRetryPolicy(ledger[0]!, replay);

  assert.equal(policy.retryable, true);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
  assert.equal(policy.nextBackoffMs, 5000);
});

test('native app bootstrap: submits action plan through runtime governance api first', async () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const plan = createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login');

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/foundation/runtime-governance/actions') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            receiptCode: 'APP-RUNTIME-001',
            app: 'app',
            action: 'member-login',
            state: 'submitted',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            requestEndpoint: '/api/v1/app/member/session',
            payloadSummary: '{"authenticated":true}',
            ticket: {
              ticketCode: 'APP-RUNTIME-001-HANDLER',
              ticketType: 'HANDLER_CALLBACK',
              status: 'ready-for-handler',
              summary: 'handler ready'
            },
            sync: {
              handlerName: 'native-member-session-handler',
              syncMode: 'callback-followup',
              syncEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-RUNTIME-001/sync',
              callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-RUNTIME-001/callback',
              idempotencyKey: 'app-sync:APP-RUNTIME-001',
              ready: true,
              summary: 'ready'
            },
            callback: {
              callbackStatus: 'awaiting-callback',
              ackToken: 'APP-RUNTIME-001-ACK',
              lastEvent: 'HANDLER_ACCEPTED',
              summary: 'awaiting callback'
            },
            ledger: {
              ledgerKey: 'runtime-ledger:APP-RUNTIME-001',
              replayEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-RUNTIME-001/replay',
              replayable: true,
              summary: 'replayable'
            },
            retry: {
              replayEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-RUNTIME-001/replay',
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
              scopeKey: 'app:member-login:tenant-demo'
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

  const receipt = await submitNativeAppActionPlanToApi(plan);

  assert.equal(receipt.receiptCode, 'APP-RUNTIME-001');
  assert.equal(receipt.generatedAt, '2026-06-12T00:00:00.000Z');
  assert.equal(receipt.ledger.replayable, true);
});

test('native app bootstrap: builds checkout and refund payloads for real commerce flow', () => {
  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const checkout = createNativeAppCheckoutPayload(snapshot, createNativeSession('SVIP'));

  assert.equal(checkout.memberId, 'app-member-svip-001');
  assert.equal(checkout.paymentChannel, 'APPLE_PAY');
  assert.equal(checkout.items.length, 2);
  assert.equal(checkout.amount, 50);

  const refund = createNativeAppRefundPayload({
    order: {
      orderId: 'order-001',
      memberId: 'app-member-svip-001',
      currency: 'USD',
      totalAmount: 50,
      status: 'PAID',
      createdAt: '2026-06-14T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z'
    },
    payment: {
      paymentId: 'payment-001',
      orderId: 'order-001',
      channel: 'APPLE_PAY',
      amount: 50,
      status: 'SUCCEEDED',
      createdAt: '2026-06-14T00:00:00.000Z',
      updatedAt: '2026-06-14T00:00:00.000Z'
    },
    settlement: undefined,
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: []
  });

  assert.equal(refund.refundAmount, 50);
  assert.equal(refund.reason, 'app-native-refund-rehearsal');
});

test('native app bootstrap: executes real transaction flow and requests refund from api', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/transactions/checkout') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: {
              orderId: 'order-app-001',
              memberId: 'app-member-001',
              currency: 'USD',
              totalAmount: 50,
              status: 'PENDING_PAYMENT',
              latestPaymentId: 'payment-app-001',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:00:00.000Z'
            },
            payment: {
              paymentId: 'payment-app-001',
              orderId: 'order-app-001',
              channel: 'APPLE_PAY',
              amount: 50,
              status: 'PENDING',
              externalPaymentId: 'native-pay-us-default-member',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:00:00.000Z'
            },
            settlement: undefined,
            pointsLedger: [],
            couponRedemptions: [],
            blindboxFulfillments: [],
            refunds: []
          },
          timestamp: '2026-06-14T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/transactions/payments/standardized-callback') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: {
              orderId: 'order-app-001',
              memberId: 'app-member-001',
              currency: 'USD',
              totalAmount: 50,
              status: 'PAID',
              latestPaymentId: 'payment-app-001',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:01:00.000Z',
              paidAt: '2026-06-14T00:01:00.000Z'
            },
            payment: {
              paymentId: 'payment-app-001',
              orderId: 'order-app-001',
              channel: 'APPLE_PAY',
              amount: 50,
              status: 'SUCCEEDED',
              transactionNo: 'txn-app-001',
              externalPaymentId: 'native-pay-us-default-member',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:01:00.000Z',
              completedAt: '2026-06-14T00:01:00.000Z'
            },
            settlement: {
              settlementId: 'settlement-001',
              pointsEarned: 50,
              pointsBalance: 50
            },
            pointsLedger: [{ ledgerId: 'points-001' }],
            couponRedemptions: [],
            blindboxFulfillments: [],
            refunds: []
          },
          timestamp: '2026-06-14T00:01:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/transactions/orders/order-app-001') && (!init?.method || init.method === 'GET')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: {
              orderId: 'order-app-001',
              memberId: 'app-member-001',
              currency: 'USD',
              totalAmount: 50,
              status: 'PAID',
              latestPaymentId: 'payment-app-001',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:01:00.000Z',
              paidAt: '2026-06-14T00:01:00.000Z'
            },
            payment: {
              paymentId: 'payment-app-001',
              orderId: 'order-app-001',
              channel: 'APPLE_PAY',
              amount: 50,
              status: 'SUCCEEDED',
              transactionNo: 'txn-app-001',
              externalPaymentId: 'native-pay-us-default-member',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:01:00.000Z',
              completedAt: '2026-06-14T00:01:00.000Z'
            },
            settlement: {
              settlementId: 'settlement-001',
              pointsEarned: 50,
              pointsBalance: 50
            },
            pointsLedger: [{ ledgerId: 'points-001' }],
            couponRedemptions: [],
            blindboxFulfillments: [],
            refunds: []
          },
          timestamp: '2026-06-14T00:01:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/transactions/orders/order-app-001/refunds') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            order: {
              orderId: 'order-app-001',
              memberId: 'app-member-001',
              currency: 'USD',
              totalAmount: 50,
              status: 'PAID',
              latestPaymentId: 'payment-app-001',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:02:00.000Z',
              paidAt: '2026-06-14T00:01:00.000Z'
            },
            payment: {
              paymentId: 'payment-app-001',
              orderId: 'order-app-001',
              channel: 'APPLE_PAY',
              amount: 50,
              status: 'SUCCEEDED',
              transactionNo: 'txn-app-001',
              externalPaymentId: 'native-pay-us-default-member',
              createdAt: '2026-06-14T00:00:00.000Z',
              updatedAt: '2026-06-14T00:01:00.000Z',
              completedAt: '2026-06-14T00:01:00.000Z'
            },
            settlement: {
              settlementId: 'settlement-001',
              pointsEarned: 50,
              pointsBalance: 50
            },
            pointsLedger: [{ ledgerId: 'points-001' }],
            couponRedemptions: [],
            blindboxFulfillments: [],
            refunds: [
              {
                refundId: 'refund-app-001',
                orderId: 'order-app-001',
                paymentId: 'payment-app-001',
                memberId: 'app-member-001',
                refundAmount: 50,
                reason: 'app-native-refund-rehearsal',
                operator: 'app-runtime',
                status: 'PENDING',
                requestedAt: '2026-06-14T00:02:00.000Z'
              }
            ]
          },
          timestamp: '2026-06-14T00:02:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    throw new Error(`unexpected url: ${url}`);
  }) as typeof fetch;

  const snapshot = toNativeAppBootstrapSnapshot(createPortalBootstrapFixture());
  const transaction = await executeNativeAppTransactionFlow(snapshot, createNativeSession());

  assert.equal(transaction.deliveryMode, 'api');
  assert.equal(transaction.aggregate?.order.status, 'PAID');
  assert.equal(transaction.aggregate?.payment?.status, 'SUCCEEDED');
  assert.equal(transaction.aggregate?.pointsLedger.length, 1);

  const refunded = await requestNativeAppRefundToApi(transaction);

  assert.equal(refunded.deliveryMode, 'api');
  assert.equal(refunded.aggregate?.refunds[0]?.status, 'PENDING');
  assert.equal(refunded.refundPayload?.reason, 'app-native-refund-rehearsal');
});

test('native app bootstrap: refreshes and replays runtime receipt with fallback support', async () => {
  globalThis.fetch = (async () => {
    throw new Error('offline');
  }) as typeof fetch;

  const replayed = await replayNativeAppRuntimeReceipt({
    receiptCode: 'APP-FALLBACK-001',
    app: 'app',
    action: 'member-login',
    state: 'submitted',
    nextStep: 'PROCEED',
    riskLevel: 'medium',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/app/member/session',
    payloadSummary: '{"authenticated":true}',
    ticket: {
      ticketCode: 'APP-FALLBACK-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'handler ready'
    },
    sync: {
      handlerName: 'native-member-session-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-001/callback',
      idempotencyKey: 'app-sync:APP-FALLBACK-001',
      ready: true,
      summary: 'ready'
    },
    callback: {
      callbackStatus: 'awaiting-callback',
      ackToken: 'APP-FALLBACK-001-ACK',
      lastEvent: 'HANDLER_ACCEPTED',
      summary: 'awaiting callback'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:APP-FALLBACK-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-001/replay',
      replayable: true,
      summary: 'replayable'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-001/replay',
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
      scopeKey: 'app:member-login:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-12T00:00:00.000Z'
  });
  const refreshed = await loadNativeAppRuntimeReceipt('APP-FALLBACK-001');

  assert.equal(replayed.state, 'replay-scheduled');
  assert.equal(replayed.retry.currentAttempt, 1);
  assert.equal(replayed.generatedAt, 'local-fallback');
  assert.equal(refreshed, null);
});

test('native app bootstrap: refreshes governance alerts catalog from api first', async () => {
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

  const catalog = await refreshNativeAppGovernanceAlerts();

  assert.equal(catalog.generatedAt, '2026-06-13T00:00:00.000Z');
  assert.deepEqual(catalog.alerts.map((item) => item.code), ['runtime-governance-backlog']);
  assert.equal(catalog.alerts[0]?.recentOperation?.action, 'ACK');
});

test('native app bootstrap: syncs and records callback for runtime receipt with fallback support', async () => {
  globalThis.fetch = (async () => {
    throw new Error('offline');
  }) as typeof fetch;

  const receipt = {
    receiptCode: 'APP-FALLBACK-002',
    app: 'app' as const,
    action: 'member-login' as const,
    state: 'submitted' as const,
    nextStep: 'PROCEED' as const,
    riskLevel: 'medium' as const,
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK' as const,
    requestEndpoint: '/api/v1/app/member/session',
    payloadSummary: '{"authenticated":true}',
    ticket: {
      ticketCode: 'APP-FALLBACK-002-HANDLER',
      ticketType: 'HANDLER_CALLBACK' as const,
      status: 'ready-for-handler' as const,
      summary: 'handler ready'
    },
    sync: {
      handlerName: 'native-member-session-handler' as const,
      syncMode: 'callback-followup' as const,
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-002/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-002/callback',
      idempotencyKey: 'app-sync:APP-FALLBACK-002',
      ready: true,
      summary: 'ready'
    },
    callback: {
      callbackStatus: 'awaiting-callback' as const,
      ackToken: 'APP-FALLBACK-002-ACK',
      lastEvent: 'HANDLER_ACCEPTED' as const,
      summary: 'awaiting callback'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:APP-FALLBACK-002',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-002/replay',
      replayable: true,
      summary: 'replayable'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-002/replay',
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
      scopeKey: 'app:member-login:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-12T00:00:00.000Z'
  };

  const synced = await syncNativeAppRuntimeReceipt(receipt);
  const callbacked = await recordNativeAppRuntimeCallback(synced);

  assert.equal(synced.callback.callbackStatus, 'awaiting-callback');
  assert.equal(synced.events.at(-1)?.eventType, 'runtime-governance.handler.sync.requested');
  assert.equal(callbacked.state, 'callback-recorded');
  assert.equal(callbacked.ledger.replayable, true);
  assert.equal(callbacked.events.at(-1)?.eventType, 'runtime-governance.handler.callback.recorded');
});

test('native app bootstrap: loads alert drilldown and acknowledgement flows', async () => {
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
                note: 'app-ack',
                actorId: 'ops-user',
                mutedUntil: null,
                visibleInOverview: true,
                createdAt: '2026-06-13T00:05:00.000Z',
                source: 'foundation-alerts'
              }
            ],
            acknowledgement: {
              status: 'ACKED',
              note: 'app-ack',
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
                note: 'app-muted',
                actorId: 'ops-user',
                mutedUntil: '2026-06-14T00:00:00.000Z',
                visibleInOverview: false,
                createdAt: '2026-06-13T00:10:00.000Z',
                source: 'foundation-alerts'
              }
            ],
            acknowledgement: {
              status: 'MUTED',
              note: 'app-muted',
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
                note: 'app-unmuted',
                actorId: 'ops-user',
                mutedUntil: null,
                visibleInOverview: true,
                createdAt: '2026-06-13T00:15:00.000Z',
                source: 'foundation-alerts'
              }
            ],
            acknowledgement: {
              status: 'ACKED',
              note: 'app-unmuted',
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

  const drilldown = await loadNativeAppAlertDrilldown('observability-degradation');
  const ack = await acknowledgeNativeAppGovernanceAlert('observability-degradation', 'app-ack');
  const mute = await muteNativeAppGovernanceAlert('observability-degradation');
  const unmute = await unmuteNativeAppGovernanceAlert('observability-degradation');

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
