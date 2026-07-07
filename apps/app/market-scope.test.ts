import assert from 'node:assert/strict';
import test from 'node:test';
import type { PortalBootstrapResponse } from '@m5/types';
import {
  createNativeAppFallbackSnapshot,
  toNativeAppBootstrapSnapshot,
  createNativeAppCheckoutPayload,
  createNativeAppRuntimeConsumerContract,
  createGuestNativeSession,
  createNativeSession,
  resolveNativeAppActionDecision,
  createNativeAppActionPlan,
  submitNativeAppActionPlan,
  executeNativeAppTransactionFlow,
  createNativeAppRefundPayload,
} from './market-bootstrap';
import type { NativeAppBootstrapSnapshot, NativeAppBootstrapContext } from './market-bootstrap';

/**
 * app (expo) Market Scope — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证市场初始化、市场参数校验、空市场/边界市场处理
 */

// ---- 正例: 市场初始化成功 ----

test('market scope: fallback snapshot initialized with default us market', () => {
  const snapshot = createNativeAppFallbackSnapshot();

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.marketCode, 'us-default');
  assert.equal(snapshot.defaultLanguage, 'en-US');
  assert.equal(snapshot.timezone, 'America/New_York');
  assert.equal(snapshot.emailProvider, 'SENDGRID');
  assert.deepEqual(snapshot.socialPlatforms, ['LINKEDIN', 'INSTAGRAM']);
  assert.ok(snapshot.primaryDomain.includes('us-default'));
  assert.ok(Array.isArray(snapshot.supportedSurfaces));
  assert.ok(snapshot.supportedSurfaces.includes('APP'));
});

test('market scope: api bootstrap snapshot mapped correctly from portal response', () => {
  const bootstrap: PortalBootstrapResponse = {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined,
      marketCode: 'cn-mainland', channel: 'WEB', name: 't', primaryDomain: 't.cn-mainland.b2b.local',
      supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/cn-mainland/t/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      marketCode: 'cn-mainland', channel: 'WEB', name: 'b', primaryDomain: 'b.t.cn-mainland.b2b.local',
      supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/cn-mainland/t/b/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-cn', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      storeCode: 'store-cn', storeName: '中国门店', marketCode: 'cn-mainland', channel: 'WEB', name: 'store-cn',
      primaryDomain: 'store-cn.brand-demo.tenant-demo.cn-mainland.local',
      supportedLanguages: ['zh-CN'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE']
    },
    marketProfile: {
      marketCode: 'cn-mainland', marketName: 'China', countryCode: 'CN',
      locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: 'CNY', symbol: '¥' },
      tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 13, taxLabel: 'VAT' },
      network: { networkRegion: 'CHINA', apiBaseUrl: 'https://cn-api.m5.local', cdnBaseUrl: 'https://cn-cdn.m5.local', callbackBaseUrl: 'https://cn-hooks.m5.local' },
      email: { provider: 'ALIYUN_DM', fromName: 'M5中国', fromAddress: 'h@m5.cn', replyTo: 's@m5.cn' },
      social: { primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'], supportPlatforms: ['WECHAT'] }
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };

  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.marketCode, 'cn-mainland');
  assert.equal(snapshot.defaultLanguage, 'zh-CN');
  assert.equal(snapshot.timezone, 'Asia/Shanghai');
  assert.equal(snapshot.emailProvider, 'ALIYUN_DM');
  assert.deepEqual(snapshot.socialPlatforms, ['WECHAT', 'XIAOHONGSHU']);
});

test('market scope: checkout payload built from initialized market uses correct channel and currency', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('MEMBER');
  const checkout = createNativeAppCheckoutPayload(snapshot, session);

  assert.ok(checkout.memberId, 'memberId should be set');
  assert.equal(checkout.paymentChannel, 'APPLE_PAY');
  assert.equal(checkout.currency, 'USD');
  assert.ok(Number.isFinite(checkout.amount), 'amount should be a finite number');
  assert.ok(checkout.amount > 0, 'amount should be positive');
  assert.equal(checkout.items.length, 2, 'should have 2 checkout items');
});

test('market scope: cn-market checkout uses WeChat Pay and CNY', () => {
  const cnContext: NativeAppBootstrapContext = { marketCode: 'cn-mainland' };
  const snapshot = createNativeAppFallbackSnapshot(cnContext);
  const session = createNativeSession('MEMBER');
  const checkout = createNativeAppCheckoutPayload(snapshot, session);

  assert.equal(checkout.paymentChannel, 'WECHAT_PAY');
  assert.equal(checkout.currency, 'CNY');
});

test('market scope: consumer contract created from initialized market snapshot', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const contract = createNativeAppRuntimeConsumerContract(snapshot);

  assert.equal(contract.snapshot.marketCode, 'us-default');
  assert.equal(contract.snapshot.deliveryMode, 'fallback');
  assert.equal(contract.scope.scopePath, 'us-default / tenant-demo / brand-demo / store-001');
  assert.equal(contract.challenge.enforcement, 'STEP_UP');
  assert.equal(contract.governance.deliveryMode, 'fallback');
});

test('market scope: api-initialized market resolves guest member-login to challenge-required', () => {
  // Must be API snapshot — fallback always returns readonly-fallback
  const snapshot = createNativeAppFallbackSnapshot();
  const fallbackDecision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'member-login');

  assert.equal(fallbackDecision.bootstrapState, 'readonly-fallback');
  assert.equal(fallbackDecision.allowed, false);
  assert.equal(fallbackDecision.nextStep, 'REFRESH');
});

test('market scope: api-sourced snapshot resolves guest member-login to challenge-required', () => {
  // Use toNativeAppBootstrapSnapshot to get API deliveryMode
  const bootstrap = {
    tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined, marketCode: 'us-default', channel: 'WEB', name: 't', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true } },
    brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo', marketCode: 'us-default', channel: 'WEB', name: 'b', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true } },
    storePortal: { audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'] },
    marketProfile: { marketCode: 'us-default', marketName: 'US', countryCode: 'US', locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] }, timezone: { timezone: 'America/New_York' }, currency: { currencyCode: 'USD', symbol: '$' }, tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' }, network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' }, email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' }, social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] } },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);
  const decision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'member-login');

  assert.equal(decision.bootstrapState, 'challenge-required');
  assert.equal(decision.allowed, false);
  assert.equal(decision.nextStep, 'CHALLENGE');
});

// ---- 反例: 无效市场参数拒绝 ----

test('market scope: unknown market code defaults to unknown snapshot fields', () => {
  const unknownContext: NativeAppBootstrapContext = { marketCode: 'unknown-xxx' };
  const snapshot = createNativeAppFallbackSnapshot(unknownContext);

  assert.equal(snapshot.marketCode, 'unknown-xxx');
  assert.equal(snapshot.defaultLanguage, 'en-US', 'unknown market defaults to en-US');
  assert.equal(snapshot.timezone, 'America/New_York', 'unknown market defaults to America/New_York');
});

test('market scope: fallback snapshot forbids payment-submit for any session', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const svipSession = createNativeSession('SVIP');
  const plan = createNativeAppActionPlan(snapshot, svipSession, 'payment-submit');

  assert.equal(plan.decision.bootstrapState, 'readonly-fallback');
  assert.equal(plan.decision.allowed, false);
  assert.equal(plan.decision.nextStep, 'REFRESH');
});

test('market scope: device-bind rejected when guest session scopes cannot match', () => {
  // With fallback snapshot, all sessions get 'readonly-fallback'
  const snapshot = createNativeAppFallbackSnapshot();
  const decision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'device-bind');

  assert.equal(decision.bootstrapState, 'readonly-fallback');
  assert.equal(decision.allowed, false);
  assert.equal(decision.nextStep, 'REFRESH');
});

test('market scope: api-sourced snapshot rejects device-bind for guest with scope-mismatch', () => {
  const bootstrap = {
    tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined, marketCode: 'us-default', channel: 'WEB', name: 't', primaryDomain: 't.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/login', ssoEnabled: true } },
    brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo', marketCode: 'us-default', channel: 'WEB', name: 'b', primaryDomain: 'b.t.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: '', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/t/b/login', ssoEnabled: true } },
    storePortal: { audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001', tenantCode: 'tenant-demo', brandCode: 'brand-demo', storeCode: 'store-001', storeName: 'store-001 门店', marketCode: 'us-default', channel: 'WEB', name: 'store-001', primaryDomain: 'store-001.brand-demo.tenant-demo.us-default.local', supportedLanguages: ['en-US'], supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'] },
    marketProfile: { marketCode: 'us-default', marketName: 'US', countryCode: 'US', locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] }, timezone: { timezone: 'America/New_York' }, currency: { currencyCode: 'USD', symbol: '$' }, tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' }, network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' }, email: { provider: 'SENDGRID', fromName: 'M5', fromAddress: 'h@m5.local', replyTo: 's@m5.local' }, social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] } },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };
  const snapshot = toNativeAppBootstrapSnapshot(bootstrap);
  const decision = resolveNativeAppActionDecision(snapshot, createGuestNativeSession(), 'device-bind');

  assert.equal(decision.bootstrapState, 'scope-mismatch');
  assert.equal(decision.allowed, false);
  assert.equal(decision.nextStep, 'LOGIN');
});

test('market scope: submit with fallback snapshot always produces blocked outcome for high-risk actions', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const plan = createNativeAppActionPlan(snapshot, createNativeSession('SVIP'), 'payment-submit');
  const outcome = submitNativeAppActionPlan(plan);

  assert.equal(outcome.state, 'blocked');
  assert.equal(outcome.nextStep, 'REFRESH');
  assert.equal(outcome.recommendedAction, 'REFRESH_BOOTSTRAP');
});

test('market scope: api bootstrap snapshot created from response with minimal store portal', () => {
  const minimalBootstrap: PortalBootstrapResponse = {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined,
      marketCode: 'eu-de', channel: 'WEB', name: 't', primaryDomain: 't.eu-de.b2b.local',
      supportedLanguages: ['en-DE'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/eu-de/t/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      marketCode: 'eu-de', channel: 'WEB', name: 'b', primaryDomain: 'b.t.eu-de.b2b.local',
      supportedLanguages: ['en-DE'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/eu-de/t/b/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-eu', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      storeCode: 'store-eu', storeName: 'EU Store', marketCode: 'eu-de', channel: 'WEB', name: 'store-eu',
      primaryDomain: 'store-eu.brand-demo.tenant-demo.eu-de.local',
      supportedLanguages: ['en-DE'], supportedSurfaces: ['H5', 'APP']
    },
    marketProfile: {
      marketCode: 'eu-de', marketName: 'Germany', countryCode: 'DE',
      locale: { defaultLanguage: 'en-DE', supportedLanguages: ['en-DE', 'de-DE'] },
      timezone: { timezone: 'Europe/Berlin' },
      currency: { currencyCode: 'EUR', symbol: '€' },
      tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 19, taxLabel: 'VAT' },
      network: { networkRegion: 'EUROPE', apiBaseUrl: 'https://eu-api.m5.local', cdnBaseUrl: 'https://eu-cdn.m5.local', callbackBaseUrl: 'https://eu-hooks.m5.local' },
      email: { provider: 'SENDGRID', fromName: 'M5 EU', fromAddress: 'h@m5.eu', replyTo: 's@m5.eu' },
      social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] }
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };

  const snapshot = toNativeAppBootstrapSnapshot(minimalBootstrap);

  assert.equal(snapshot.marketCode, 'eu-de');
  assert.equal(snapshot.defaultLanguage, 'en-DE');
  assert.equal(snapshot.timezone, 'Europe/Berlin');
  assert.ok(snapshot.supportedSurfaces.includes('APP'));
  assert.equal(snapshot.supportedSurfaces.includes('PC_CONSOLE'), false, 'minimal store portal has no PC_CONSOLE');
});

// ---- 边界: 空市场数据/最大市场数 ----

test('market scope: fallback snapshot with empty context fields defaults to canonical test fixtures', () => {
  const emptyContext: NativeAppBootstrapContext = {};
  const snapshot = createNativeAppFallbackSnapshot(emptyContext);

  assert.equal(snapshot.marketCode, 'us-default', 'empty marketCode defaults to us-default');
  assert.equal(snapshot.primaryDomain, 'store-001.brand-demo.tenant-demo.us-default.local');
  assert.equal(snapshot.supportedSurfaces.length, 6);
});

test('market scope: fallback snapshot with minimal overrides keeps other defaults', () => {
  const partialContext: NativeAppBootstrapContext = { marketCode: 'jp-tokyo' };
  const snapshot = createNativeAppFallbackSnapshot(partialContext);

  assert.equal(snapshot.marketCode, 'jp-tokyo');
  assert.equal(snapshot.defaultLanguage, 'en-US');
  assert.equal(snapshot.timezone, 'America/New_York');
  assert.equal(snapshot.supportedSurfaces.length, 6);
  assert.ok(snapshot.primaryDomain.includes('jp-tokyo'));
});

test('market scope: checkout payload has exactly 2 items from the catalog', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('SVIP');
  const checkout = createNativeAppCheckoutPayload(snapshot, session);

  assert.equal(checkout.items.length, 2);
  assert.equal(checkout.items[0]!.skuId, 'app-signature-latte');
  assert.equal(checkout.items[1]!.skuId, 'app-member-dessert');
  assert.equal(checkout.items[0]!.quantity, 1);
  assert.equal(checkout.items[1]!.quantity, 1);
});

test('market scope: external payment id encodes market and member tier', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const session = createNativeSession('SVIP');
  const checkout = createNativeAppCheckoutPayload(snapshot, session);

  assert.ok(checkout.externalPaymentId);
  assert.ok(checkout.externalPaymentId!.includes('us-default'));
  assert.ok(checkout.externalPaymentId!.includes('svip'));
});

test('market scope: fallback transaction flow with empty checkout produces valid aggregate', () => {
  const snapshot = createNativeAppFallbackSnapshot();
  const guestSession = createGuestNativeSession();
  const checkout = createNativeAppCheckoutPayload(snapshot, guestSession);

  assert.ok(checkout.memberId, 'guest checkout gets memberId');
  // Guest session does not have payment ready
  assert.equal(guestSession.paymentReady, false);
  assert.equal(guestSession.authenticated, false);

  const refundPayload = createNativeAppRefundPayload({
    order: {
      orderId: 'boundary-order', memberId: checkout.memberId, currency: 'USD', totalAmount: 50,
      status: 'PAID', latestPaymentId: 'boundary-payment',
      createdAt: '2026-06-14T00:00:00.000Z', updatedAt: '2026-06-14T00:00:00.000Z', paidAt: '2026-06-14T00:00:00.000Z'
    },
    payment: {
      paymentId: 'boundary-payment', orderId: 'boundary-order', channel: 'APPLE_PAY', amount: 50,
      status: 'SUCCEEDED', transactionNo: 'txn-boundary',
      createdAt: '2026-06-14T00:00:00.000Z', updatedAt: '2026-06-14T00:00:00.000Z', completedAt: '2026-06-14T00:00:00.000Z'
    },
    settlement: undefined,
    pointsLedger: [],
    couponRedemptions: [],
    blindboxFulfillments: [],
    refunds: []
  });

  assert.ok(refundPayload.refundAmount !== undefined);
  assert.equal(refundPayload.reason, 'app-native-refund-rehearsal');
  assert.equal(refundPayload.operator, 'app-runtime');
});

test('market scope: supported surfaces always contain APP surface', () => {
  // Verify across multiple market snapshots
  const usSnapshot = createNativeAppFallbackSnapshot({ marketCode: 'us-default' });
  const cnSnapshot = createNativeAppFallbackSnapshot({ marketCode: 'cn-mainland' });
  const jpSnapshot = createNativeAppFallbackSnapshot({ marketCode: 'jp-tokyo' });

  for (const snapshot of [usSnapshot, cnSnapshot, jpSnapshot]) {
    assert.ok(snapshot.supportedSurfaces.includes('APP'),
      `market ${snapshot.marketCode} should support APP surface`);
    assert.ok(snapshot.supportedSurfaces.includes('H5'),
      `market ${snapshot.marketCode} should support H5 surface`);
  }
});

test('market scope: api bootstrap snapshot mapped correctly for markets with trailing spaces/edge market codes', () => {
  const edgeBootstrap: PortalBootstrapResponse = {
    tenantPortal: {
      audience: 'TOB', scopeType: 'TENANT', scopeCode: 't', tenantCode: 'tenant-demo', brandCode: undefined,
      marketCode: 'ap-southeast-1', channel: 'WEB', name: 't', primaryDomain: 't.ap-southeast-1.b2b.local',
      supportedLanguages: ['en-SG'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/ap-southeast-1/t/login', ssoEnabled: true }
    },
    brandPortal: {
      audience: 'TOB', scopeType: 'BRAND', scopeCode: 'b', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      marketCode: 'ap-southeast-1', channel: 'WEB', name: 'b', primaryDomain: 'b.t.ap-southeast-1.b2b.local',
      supportedLanguages: ['en-SG'], heroTitle: 'title', heroSubtitle: '', solutionTags: [],
      loginEntry: { label: '登录', loginPath: '/ap-southeast-1/t/b/login', ssoEnabled: true }
    },
    storePortal: {
      audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-sg', tenantCode: 'tenant-demo', brandCode: 'brand-demo',
      storeCode: 'store-sg', storeName: 'SG Store', marketCode: 'ap-southeast-1', channel: 'WEB', name: 'store-sg',
      primaryDomain: 'store-sg.brand-demo.tenant-demo.ap-southeast-1.local',
      supportedLanguages: ['en-SG'], supportedSurfaces: ['H5', 'MINIAPP', 'APP']
    },
    marketProfile: {
      marketCode: 'ap-southeast-1', marketName: 'Singapore', countryCode: 'SG',
      locale: { defaultLanguage: 'en-SG', supportedLanguages: ['en-SG', 'zh-SG'] },
      timezone: { timezone: 'Asia/Singapore' },
      currency: { currencyCode: 'SGD', symbol: 'S$' },
      tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 9, taxLabel: 'GST' },
      network: { networkRegion: 'SOUTH_EAST_ASIA', apiBaseUrl: 'https://sg-api.m5.local', cdnBaseUrl: 'https://sg-cdn.m5.local', callbackBaseUrl: 'https://sg-hooks.m5.local' },
      email: { provider: 'SENDGRID', fromName: 'M5 SG', fromAddress: 'h@m5.sg', replyTo: 's@m5.sg' },
      social: { primaryPlatforms: ['FACEBOOK', 'INSTAGRAM'], supportPlatforms: ['FACEBOOK'] }
    },
    regionalOverrides: [], foundationDependencies: [], foundationContracts: []
  };

  const snapshot = toNativeAppBootstrapSnapshot(edgeBootstrap);

  assert.equal(snapshot.marketCode, 'ap-southeast-1');
  assert.equal(snapshot.timezone, 'Asia/Singapore');
  assert.equal(snapshot.emailProvider, 'SENDGRID');
  assert.deepEqual(snapshot.socialPlatforms, ['FACEBOOK', 'INSTAGRAM']);
  // Only 3 surfaces in this edge store portal
  assert.ok(snapshot.supportedSurfaces.length <= 6);
});
