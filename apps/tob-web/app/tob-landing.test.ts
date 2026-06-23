import assert from 'node:assert/strict';
import test from 'node:test';
import { getTenantPortal, getBrandPortal } from './bootstrap';

/**
 * tob-web Portal Resolution — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证 getTenantPortal / getBrandPortal 的解析和回退逻辑
 */

// ---- 正例 ----

test('tob resolution: getTenantPortal returns portal+market on api success', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
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
            tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 'test-t', tenantCode: 'test-t', marketCode: 'cn-mainland', channel: 'WEB', name: 'test-t', primaryDomain: 'test-t.cn-mainland.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: 'sub', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/test-t/login', ssoEnabled: true } },
            brandPortal: null, storePortal: null,
            foundationDependencies: [], foundationContracts: [], regionalOverrides: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/consumers/portal')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { consumer: 'portal', modulePath: 'src', dependsOn: [], responsibility: 'x', handoffContracts: [], recommendedSequence: [], governanceTouchpoints: [], highRiskEntrypoints: [], actionGovernanceExamples: [], runtimeHandoffExamples: [], runtimeReceiptExamples: [], governanceAlertLifecycleExamples: [] }, timestamp: '2026-06-13T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { generatedAt: '2026-06-13T00:00:00.000Z', summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 }, alerts: [], topRisks: [] }, timestamp: '2026-06-13T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const { portal, market } = await getTenantPortal('cn-mainland', 'test-t');

  assert.equal(portal.tenantCode, 'test-t');
  assert.equal(portal.audience, 'TOB');
  assert.equal(market.marketCode, 'cn-mainland');
  assert.ok(portal.loginEntry.ssoEnabled);
});

test('tob resolution: getBrandPortal returns brand-level portal+market', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
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
            tenantPortal: null,
            brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'test-b', tenantCode: 'test-t', brandCode: 'test-b', marketCode: 'us-default', channel: 'WEB', name: 'test-b', primaryDomain: 'test-b.test-t.us-default.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: 'sub', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/test-t/test-b/login', ssoEnabled: true } },
            storePortal: null,
            foundationDependencies: [], foundationContracts: [], regionalOverrides: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/consumers/portal')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { consumer: 'portal', modulePath: 'src', dependsOn: [], responsibility: 'x', handoffContracts: [], recommendedSequence: [], governanceTouchpoints: [], highRiskEntrypoints: [], actionGovernanceExamples: [], runtimeHandoffExamples: [], runtimeReceiptExamples: [], governanceAlertLifecycleExamples: [] }, timestamp: '2026-06-13T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { generatedAt: '2026-06-13T00:00:00.000Z', summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 }, alerts: [], topRisks: [] }, timestamp: '2026-06-13T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const { portal, market } = await getBrandPortal('us-default', 'test-t', 'test-b');

  assert.equal(portal.brandCode, 'test-b');
  assert.equal(portal.audience, 'TOB');
  assert.equal(market.marketCode, 'us-default');
  assert.equal(market.currency.currencyCode, 'USD');
});

// ---- 反例 ----

test('tob resolution: tenant portal returns fallback on all failures', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 503 })) as typeof fetch;

  const { portal, market } = await getTenantPortal('cn-mainland', 'error-tenant');

  assert.equal(portal.tenantCode, 'error-tenant');
  assert.ok(market.social.primaryPlatforms.length > 0);
});

// ---- 边界 ----

test('tob resolution: login entry always has sso enabled', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/foundation/consumers/portal')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { consumer: 'portal', modulePath: 'src', dependsOn: [], responsibility: 'x', handoffContracts: [], recommendedSequence: [], governanceTouchpoints: [], highRiskEntrypoints: [], actionGovernanceExamples: [], runtimeHandoffExamples: [], runtimeReceiptExamples: [], governanceAlertLifecycleExamples: [] }, timestamp: '2026-06-13T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({ success: true, message: 'OK', data: { generatedAt: '2026-06-13T00:00:00.000Z', summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 }, alerts: [], topRisks: [] }, timestamp: '2026-06-13T00:00:00.000Z' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  // API bootstrap fails → fallback
  const { portal } = await getTenantPortal('cn-mainland', 'sso-test');

  assert.equal(portal.loginEntry.ssoEnabled, true);
});
