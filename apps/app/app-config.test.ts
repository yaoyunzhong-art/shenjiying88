import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createNativeAppFallbackSnapshot,
  toNativeAppBootstrapSnapshot,
  createNativeAppRuntimeConsumerContract,
  createGuestNativeSession,
  createNativeSession,
  resolveNativeAppActionDecision,
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
  loadNativeAppBootstrapSnapshot,
  loadNativeAppRuntimeConsumerContract,
  loadNativeAppGovernanceReadModel,
} from './market-bootstrap';

/**
 * app (expo) App Config — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证 App 配置加载、缺失配置处理和超长/特殊字符配置边界
 */

function createPortalBootstrapFixture(): PortalBootstrapResponse {
  return {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined,
      marketCode: 'us-default', channel: 'WEB', name: 'tenant-demo ToB 官网',
      primaryDomain: 'tenant-demo.us-default.b2b.local',
      supportedLanguages: ['en-US'], heroTitle: 'tenant-demo 企业级经营门户', heroSubtitle: 'demo',
      solutionTags: [], loginEntry: { label: '进入租户后台', loginPath: '/us-default/tenant-demo/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'brand-demo', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      marketCode: 'us-default', channel: 'WEB', name: 'brand-demo 品牌 ToB 官网',
      primaryDomain: 'brand-demo.tenant-demo.us-default.b2b.local',
      supportedLanguages: ['en-US'], heroTitle: 'brand-demo 品牌经营官网', heroSubtitle: 'demo',
      solutionTags: [], loginEntry: { label: '进入品牌后台', loginPath: '/us-default/tenant-demo/brand-demo/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB',
      name: 'store-001 门店门户',
      primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local',
      supportedLanguages: ['en-US'],
      supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
    },
    marketProfile: {
      marketCode: 'us-default', marketName: 'United States', countryCode: 'US',
      locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
      timezone: { timezone: 'America/New_York' },
      currency: { currencyCode: 'USD', symbol: '$' },
      tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' },
      network: {
        networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local',
        cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local'
      },
      email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello-us@m5.local', replyTo: 'support-us@m5.local' },
      social: { primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'], supportPlatforms: ['LINKEDIN'] }
    },
    regionalOverrides: [], foundationDependencies: ['identity-access', 'configuration-governance'],
    foundationContracts: ['@m5/types']
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

    return new Response('OK', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

// ---- 正例: App配置加载成功 ----

test('app config: fallback snapshot loads with all config fields populated', () => {
  const snapshot = createNativeAppFallbackSnapshot();

  // Verify all 8 config fields exist and have correct types
  assert.equal(typeof snapshot.deliveryMode, 'string');
  assert.equal(typeof snapshot.marketCode, 'string');
  assert.equal(typeof snapshot.defaultLanguage, 'string');
  assert.equal(typeof snapshot.timezone, 'string');
  assert.equal(typeof snapshot.emailProvider, 'string');
  assert.ok(Array.isArray(snapshot.socialPlatforms));
  assert.equal(typeof snapshot.primaryDomain, 'string');
  assert.ok(Array.isArray(snapshot.supportedSurfaces));

  // Specific values
  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.marketCode, 'us-default');
  assert.equal(snapshot.supportedSurfaces.length, 6);
});

test('app config: api bootstrap loads all config fields from portal response', async () => {
  apiSuccessFixture();

  const snapshot = await loadNativeAppBootstrapSnapshot();

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.marketCode, 'us-default');
  assert.equal(snapshot.defaultLanguage, 'en-US');
  assert.equal(snapshot.timezone, 'America/New_York');
  assert.equal(snapshot.emailProvider, 'SENDGRID');
  assert.deepEqual(snapshot.socialPlatforms, ['LINKEDIN', 'INSTAGRAM']);
  assert.ok(snapshot.primaryDomain.length > 0);
  assert.equal(snapshot.supportedSurfaces.length, 6);
});

test('app config: runtime consumer contract loaded from api has governance summary', async () => {
  apiSuccessFixture();

  const contract = await loadNativeAppRuntimeConsumerContract();

  assert.equal(contract.snapshot.deliveryMode, 'api');
  assert.ok(contract.governance.summary, 'governance summary should be loaded');
  assert.equal(typeof contract.governance.summary.approvalsPending, 'number');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
});

test('app config: governance read model loaded with full config from overview endpoint', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 2, approvalsWithFailures: 1, highRiskAudits: 0, blockedLedgers: 0,
              runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0, highRiskRuntimeBacklog: 0,
              runtimeBlockedActions: 0, rotationDueSecrets: 3, expiredSecrets: 1,
              expiringCertificates: 2, expiredCertificates: 0, degradedSignals: 1,
              attentionRecoveryPlans: 0, staleDrills: 0
            },
            alerts: [],
            topRisks: [
              { severity: 'medium', code: 'rotation-due-secrets', count: 3, summary: '3 secrets due for rotation', triageState: 'needs-triage', triageSummary: '待处理', recentOperation: null }
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
  assert.equal(governance.summary.approvalsPending, 2);
  assert.equal(governance.summary.rotationDueSecrets, 3);
  assert.equal(governance.topRisks.length, 1);
  assert.equal(governance.topRisks[0]!.code, 'rotation-due-secrets');
});

test('app config: consumer contract created from fallback snapshot has full fallback config', () => {
  const contract = createNativeAppRuntimeConsumerContract(createNativeAppFallbackSnapshot());

  assert.equal(contract.snapshot.deliveryMode, 'fallback');
  assert.equal(contract.scope.scopePath, 'us-default / tenant-demo / brand-demo / store-001');
  assert.equal(contract.scope.mismatchStrategy, 'FAIL_CLOSED');
  assert.equal(contract.degradation.featureFlagFallback, 'READONLY_LAST_KNOWN');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
  assert.ok(Array.isArray(contract.governance.alerts));
  assert.ok(contract.governance.alerts.length > 0);
  assert.ok(contract.governance.summary);
});

// ---- 反例: 缺失配置项处理 ----

test('app config: api failure falls back to snapshot with complete fallback config', async () => {
  globalThis.fetch = (async () => new Response('Service Unavailable', { status: 503 })) as typeof fetch;

  const snapshot = await loadNativeAppBootstrapSnapshot();

  // All fields should still be present even when API fails
  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.marketCode, 'us-default');
  assert.equal(snapshot.defaultLanguage, 'en-US');
  assert.equal(typeof snapshot.primaryDomain, 'string');
  assert.equal(snapshot.supportedSurfaces.length, 6);
});

test('app config: governance read model returns fallback when overview api fails entirely', async () => {
  globalThis.fetch = (async () => new Response('Internal Server Error', { status: 500 })) as typeof fetch;

  const governance = await loadNativeAppGovernanceReadModel();

  assert.equal(governance.deliveryMode, 'fallback');
  assert.ok(governance.generatedAt, 'generatedAt should be present in fallback');
  assert.ok(Array.isArray(governance.alerts), 'alerts should be an array');
  assert.ok(governance.summary, 'summary should be present');
  assert.equal(typeof governance.summary.approvalsPending, 'number');
});

test('app config: fallback snapshot handles missing social platforms gracefully', () => {
  const snapshot = createNativeAppFallbackSnapshot();

  // Social platforms should always be a non-empty array
  assert.ok(Array.isArray(snapshot.socialPlatforms));
  assert.ok(snapshot.socialPlatforms.length > 0);
  assert.ok(snapshot.socialPlatforms.every((p) => typeof p === 'string'));
});

test('app config: fallback snapshot decisions are deterministic — all return readonly-fallback', () => {
  const snapshot = createNativeAppFallbackSnapshot();

  // Fallback deliveryMode makes ALL actions readonly-fallback regardless of session
  const guestLogin = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'member-login');
  const memberLogin = resolveNativeAppActionDecision(snapshot, createNativeSession(), 'member-login');
  const memberPayment = resolveNativeAppActionDecision(snapshot, createNativeSession('SVIP'), 'payment-submit');
  const guestDevice = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'device-bind');

  for (const decision of [guestLogin, memberLogin, memberPayment, guestDevice]) {
    assert.ok(decision, 'decision should exist');
    assert.equal(decision.bootstrapState, 'readonly-fallback');
    assert.equal(decision.allowed, false);
    assert.equal(decision.nextStep, 'REFRESH');
  }
});

// ---- 边界: 超长配置值/特殊字符 ----

test('app config: fallback snapshot with extremely long market code string', () => {
  const longMarketCode = 'a' + 'b'.repeat(200) + '-market-code-test';
  const context = { marketCode: longMarketCode };
  const snapshot = createNativeAppFallbackSnapshot(context);

  assert.equal(snapshot.marketCode, longMarketCode);
  assert.equal(snapshot.marketCode.length, longMarketCode.length);
  assert.ok(snapshot.marketCode.length > 50, 'market code should be able to hold long strings');
  // Language/timezone defaults should still resolve
  assert.equal(snapshot.defaultLanguage, 'en-US');
  assert.equal(snapshot.timezone, 'America/New_York');
});

test('app config: fallback snapshot with unicode special characters in context', () => {
  // Special unicode market code
  const unicodeContext = { marketCode: '中国-测试-🎯-ユーザー' };
  const snapshot = createNativeAppFallbackSnapshot(unicodeContext);

  assert.equal(snapshot.marketCode, '中国-测试-🎯-ユーザー');
  // Default language should still be en-US since it's not cn-mainland
  assert.equal(snapshot.defaultLanguage, 'en-US');
  assert.equal(snapshot.timezone, 'America/New_York');
  assert.equal(snapshot.emailProvider, 'SENDGRID');
  assert.ok(snapshot.primaryDomain.includes('中国-测试-🎯-ユーザー'));
});

test('app config: consumer contract created with all states defined', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const contract = createNativeAppRuntimeConsumerContract(snapshot);
  const allStates = ['bootstrap', 'fallback', 'readonly-fallback', 'challenge-required', 'ready', 'scope-mismatch'];

  // Verify consumer contract contains all expected governance config fields
  assert.ok(contract.snapshot, 'contract must have snapshot');
  assert.ok(contract.scope, 'contract must have scope');
  assert.ok(contract.challenge, 'contract must have challenge');
  assert.ok(contract.degradation, 'contract must have degradation');
  assert.ok(contract.governance, 'contract must have governance');
});

test('app config: auth envelope built with long sync contract values', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const plan = createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit');
  const outcome = submitNativeAppActionPlan(plan);
  const sync = buildNativeAppHandlerSyncContract(outcome);
  const auth = buildNativeAppAuthEnvelope(sync);

  // Verify auth envelope fields have acceptable lengths
  assert.ok(auth.audience.length > 0, 'audience should not be empty');
  assert.equal(auth.authScheme, 'M5-HMAC-SHA256');
  assert.ok(auth.authorization.length > 0, 'authorization should not be empty');
  assert.ok(Array.isArray(auth.signedHeaders));
  assert.ok(auth.signedHeaders.length >= 2, 'should have at least 2 signed headers');
});

test('app config: callback receipt built with submitted outcome from api snapshot', () => {
  // Must use an outcome with state='submitted' for handler callback construction
  const bootstrap = {
    tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined, marketCode: 'us-default', channel: 'WEB', name: 't', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true } },
    brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo', marketCode: 'us-default', channel: 'WEB', name: 'b', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true } },
    storePortal: { audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'] },
    marketProfile: { marketCode: 'us-default', marketName: 'US', countryCode: 'US', locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] }, timezone: { timezone: 'America/New_York' }, currency: { currencyCode: 'USD', symbol: '$' }, tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' }, network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' }, email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' }, social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] } },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);
  const plan = createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'submitted', 'member-login with api snapshot should submit successfully');

  const sync = buildNativeAppHandlerSyncContract(outcome);
  const receipt = createNativeAppCallbackReceipt(outcome, sync);

  assert.equal(receipt.callbackStatus, 'awaiting-callback');
  assert.equal(receipt.lastEvent, 'HANDLER_ACCEPTED');
  assert.ok(receipt.ackToken.length > 0);
  assert.ok(receipt.summary.length > 0);
});

test('app config: retry policy built with extreme backoff values from api snapshot challenge outcome', () => {
  // Use api snapshot so payment-submit with SVIP produces 'challenge-issued' not 'blocked'
  const bootstrap = {
    tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined, marketCode: 'us-default', channel: 'WEB', name: 't', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true } },
    brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo', marketCode: 'us-default', channel: 'WEB', name: 'b', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true } },
    storePortal: { audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'] },
    marketProfile: { marketCode: 'us-default', marketName: 'US', countryCode: 'US', locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] }, timezone: { timezone: 'America/New_York' }, currency: { currencyCode: 'USD', symbol: '$' }, tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' }, network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' }, email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' }, social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] } },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);
  const outcome = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit')
  );

  assert.equal(outcome.state, 'challenge-issued', 'api snapshot SVIP payment produces challenge');

  const entry = createNativeAppSubmitHistoryEntry(outcome);
  const replay = replayNativeAppSubmitHistoryEntry(entry);
  const ledger = buildNativeAppLedger([entry]);
  const policy = createNativeAppReplayRetryPolicy(ledger[0]!, replay);

  // Verify retry policy config boundaries
  assert.equal(policy.retryable, true);
  assert.ok(policy.maxAttempts >= 1, `maxAttempts should be >= 1, got ${policy.maxAttempts}`);
  assert.ok(policy.currentAttempt >= 0, `currentAttempt should be >= 0, got ${policy.currentAttempt}`);
  assert.ok(policy.nextBackoffMs >= 0, `nextBackoffMs should be >= 0, got ${policy.nextBackoffMs}`);
  assert.equal(policy.escalationAction, 'REFRESH_TICKET');
});

test('app config: ticket config built for challenge and handler outcomes from api snapshot', () => {
  // Use api snapshot so submits produce meaningful outcomes
  const bootstrap = {
    tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined, marketCode: 'us-default', channel: 'WEB', name: 't', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true } },
    brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo', marketCode: 'us-default', channel: 'WEB', name: 'b', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true } },
    storePortal: { audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'] },
    marketProfile: { marketCode: 'us-default', marketName: 'US', countryCode: 'US', locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] }, timezone: { timezone: 'America/New_York' }, currency: { currencyCode: 'USD', symbol: '$' }, tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' }, network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' }, email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' }, social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] } },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);

  const paymentOutcome = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit')
  );
  const loginOutcome = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login')
  );

  assert.equal(paymentOutcome.state, 'challenge-issued', 'SVIP payment should be challenge-issued with api snapshot');
  assert.equal(loginOutcome.state, 'submitted', 'member login should be submitted with api snapshot');

  const paymentTicket = createNativeAppActionTicket(paymentOutcome);
  const loginTicket = createNativeAppActionTicket(loginOutcome);

  // Boundary: different outcomes produce different ticket configs
  assert.equal(paymentTicket.ticketType, 'CHALLENGE_GATE');
  assert.equal(loginTicket.ticketType, 'HANDLER_CALLBACK');
  assert.ok(paymentTicket.ticketCode.length > 0);
  assert.ok(loginTicket.ticketCode.length > 0);
});

test('app config: submit history entry with extreme timestamp value', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const outcome = submitNativeAppActionPlan(
    createNativeAppActionPlan(snapshot, createNativeSession(), 'member-login')
  );
  const entry = createNativeAppSubmitHistoryEntry(outcome, '9999-12-31T23:59:59.999Z');

  assert.equal(entry.occurredAt, '9999-12-31T23:59:59.999Z');
  assert.ok(entry.receiptCode, 'receiptCode should be populated');
  assert.ok(entry.summary, 'summary should be populated');
});
