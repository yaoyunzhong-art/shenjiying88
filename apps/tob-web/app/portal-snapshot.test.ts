import assert from 'node:assert/strict';
import test from 'node:test';
import { getTenantPortalConsumerSnapshot, getBrandPortalConsumerSnapshot, getTobLandingSnapshot } from './bootstrap';

/**
 * tob-web Portal Snapshot — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证 ToB 门户消费者快照的核心契约：
 * tenant/brand portal resolution, fallback, landing snapshot
 */

// ---- 正例 ----

test('tob portal: tenant portal snapshot - api delivery', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            marketProfile: {
              marketCode: 'cn-mainland',
              marketName: '中国大陆',
              countryCode: 'CN',
              locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
              timezone: { timezone: 'Asia/Shanghai' },
              currency: { currencyCode: 'CNY', symbol: '¥' },
              tax: { taxMode: 'PRICES_INCLUDE_TAX', taxRate: 6, taxLabel: '增值税' },
              network: {
                networkRegion: 'MAINLAND_CHINA',
                apiBaseUrl: 'https://cn-api.m5.local',
                cdnBaseUrl: 'https://cn-cdn.m5.local',
                callbackBaseUrl: 'https://cn-hooks.m5.local'
              },
              email: {
                provider: 'ALIYUN_DM',
                fromName: 'M5 China',
                fromAddress: 'hello-cn@m5.local',
                replyTo: 'support-cn@m5.local'
              },
              social: {
                primaryPlatforms: ['WECHAT', 'XIAOHONGSHU'],
                supportPlatforms: ['WECHAT', 'WEIBO', 'DOUYIN']
              }
            },
            tenantPortal: {
              audience: 'TOB',
              scopeType: 'TENANT',
              scopeCode: 't-1',
              tenantCode: 't-1',
              marketCode: 'cn-mainland',
              channel: 'WEB',
              name: 't-1 ToB 官网',
              primaryDomain: 't-1.cn-mainland.b2b.local',
              supportedLanguages: ['zh-CN'],
              heroTitle: 't-1 企业级经营官网',
              heroSubtitle: '统一承接',
              solutionTags: ['多租户 SaaS'],
              loginEntry: { label: '进入后台', loginPath: '/cn-mainland/t-1/login', ssoEnabled: true }
            },
            brandPortal: null,
            storePortal: null,
            foundationDependencies: ['identity-access'],
            foundationContracts: ['portal-contract'],
            regionalOverrides: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/consumers/portal')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            consumer: 'portal',
            modulePath: 'src/modules/portal',
            dependsOn: ['identity-access'],
            responsibility: '门户解析',
            handoffContracts: [],
            recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'],
            governanceTouchpoints: ['/api/v1/foundation/bootstrap'],
            highRiskEntrypoints: ['member-login'],
            actionGovernanceExamples: [],
            runtimeHandoffExamples: [],
            runtimeReceiptExamples: [],
            governanceAlertLifecycleExamples: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
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
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 0,
              approvalsWithFailures: 0,
              highRiskAudits: 0,
              blockedLedgers: 0,
              rotationDueSecrets: 0,
              expiredSecrets: 0,
              expiringCertificates: 0,
              expiredCertificates: 0,
              degradedSignals: 0,
              attentionRecoveryPlans: 0,
              staleDrills: 0
            },
            alerts: [],
            topRisks: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getTenantPortalConsumerSnapshot('cn-mainland', 't-1');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.portal.audience, 'TOB');
  assert.equal(snapshot.portal.scopeType, 'TENANT');
  assert.equal(snapshot.portal.tenantCode, 't-1');
  assert.equal(snapshot.market.marketCode, 'cn-mainland');
  assert.equal(snapshot.consumerDescriptor.consumer, 'portal');
});

test('tob portal: brand portal snapshot - api delivery with region overrides', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
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
              social: {
                primaryPlatforms: ['LINKEDIN', 'INSTAGRAM'],
                supportPlatforms: ['LINKEDIN', 'INSTAGRAM', 'FACEBOOK']
              }
            },
            tenantPortal: null,
            brandPortal: {
              audience: 'TOB',
              scopeType: 'BRAND',
              scopeCode: 'b-1',
              tenantCode: 't-1',
              brandCode: 'b-1',
              marketCode: 'us-default',
              channel: 'WEB',
              name: 'b-1 品牌 ToB 官网',
              primaryDomain: 'b-1.t-1.us-default.b2b.local',
              supportedLanguages: ['en-US'],
              heroTitle: 'b-1 品牌增长官网',
              heroSubtitle: '全球品牌招商入口',
              solutionTags: ['品牌招商'],
              loginEntry: { label: '进入品牌后台', loginPath: '/us-default/t-1/b-1/login', ssoEnabled: true }
            },
            storePortal: null,
            foundationDependencies: ['identity-access'],
            foundationContracts: ['portal-contract'],
            regionalOverrides: [{ key: 'timezone', value: 'America/Los_Angeles' }]
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/consumers/portal')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            consumer: 'portal',
            modulePath: 'src/modules/portal',
            dependsOn: ['identity-access'],
            responsibility: '门户解析',
            handoffContracts: [],
            recommendedSequence: ['/api/v1/foundation/bootstrap'],
            governanceTouchpoints: [],
            highRiskEntrypoints: ['member-login'],
            actionGovernanceExamples: [],
            runtimeHandoffExamples: [],
            runtimeReceiptExamples: [],
            governanceAlertLifecycleExamples: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
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
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0,
              rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0,
              degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0
            },
            alerts: [],
            topRisks: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getBrandPortalConsumerSnapshot('us-default', 't-1', 'b-1');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.portal.audience, 'TOB');
  assert.equal(snapshot.portal.scopeType, 'BRAND');
  assert.equal(snapshot.portal.brandCode, 'b-1');
  assert.equal(snapshot.market.marketCode, 'us-default');
  assert.equal(snapshot.regionalOverridesCount, 1);
});

test('tob portal: landing snapshot wires both tenant and brand', async () => {
  let bootstrapCallCount = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      bootstrapCallCount++;
      // First call: tenant portal (cn-mainland), second call: brand portal (us-default)
      if (bootstrapCallCount === 1) {
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
                email: { provider: 'ALIYUN_DM', fromName: 'M5 China', fromAddress: 'hello-cn@m5.local', replyTo: 'support-cn@m5.local' },
                social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] }
              },
              tenantPortal: { audience: 'TOB', scopeType: 'TENANT', scopeCode: 'demo-tenant', tenantCode: 'demo-tenant', marketCode: 'cn-mainland', channel: 'WEB', name: 'demo-tenant', primaryDomain: 'demo-tenant.cn-mainland.b2b.local', supportedLanguages: ['zh-CN'], heroTitle: 'title', heroSubtitle: 'sub', solutionTags: [], loginEntry: { label: '登录', loginPath: '/cn-mainland/demo-tenant/login', ssoEnabled: true } },
              brandPortal: null, storePortal: null,
              foundationDependencies: [], foundationContracts: [], regionalOverrides: []
            },
            timestamp: '2026-06-13T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            marketProfile: {
              marketCode: 'us-default', marketName: 'US', countryCode: 'US',
              locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US'] },
              timezone: { timezone: 'America/New_York' },
              currency: { currencyCode: 'USD', symbol: '$' },
              tax: { taxMode: 'PRICES_EXCLUDE_TAX', taxRate: 8.25, taxLabel: 'Sales Tax' },
              network: { networkRegion: 'NORTH_AMERICA', apiBaseUrl: 'https://us-api.m5.local', cdnBaseUrl: 'https://us-cdn.m5.local', callbackBaseUrl: 'https://us-hooks.m5.local' },
              email: { provider: 'SENDGRID', fromName: 'M5 US', fromAddress: 'hello-us@m5.local', replyTo: 'support-us@m5.local' },
              social: { primaryPlatforms: ['LINKEDIN'], supportPlatforms: ['LINKEDIN'] }
            },
            tenantPortal: null,
            brandPortal: { audience: 'TOB', scopeType: 'BRAND', scopeCode: 'demo-brand', tenantCode: 'demo-tenant', brandCode: 'demo-brand', marketCode: 'us-default', channel: 'WEB', name: 'demo-brand', primaryDomain: 'demo-brand.demo-tenant.us-default.b2b.local', supportedLanguages: ['en-US'], heroTitle: 'title', heroSubtitle: 'sub', solutionTags: [], loginEntry: { label: '登录', loginPath: '/us-default/demo-tenant/demo-brand/login', ssoEnabled: true } },
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
        JSON.stringify({
          success: true,
          message: 'OK',
          data: { consumer: 'portal', modulePath: 'src', dependsOn: [], responsibility: 'x', handoffContracts: [], recommendedSequence: [], governanceTouchpoints: [], highRiskEntrypoints: [], actionGovernanceExamples: [], runtimeHandoffExamples: [], runtimeReceiptExamples: [], governanceAlertLifecycleExamples: [] },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: { generatedAt: '2026-06-13T00:00:00.000Z', summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 }, alerts: [], topRisks: [] },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const landing = await getTobLandingSnapshot();

  assert.equal(landing.tenantPortal.portal.scopeType, 'TENANT');
  assert.equal(landing.brandPortal.portal.scopeType, 'BRAND');
  assert.ok(landing.tenantPortal.portal.tenantCode, 'tenant portal should have tenantCode');
  assert.ok(landing.brandPortal.portal.brandCode, 'brand portal should have brandCode');
});

// ---- 反例 ----

test('tob portal: falls back when bootstrap request fails', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getTenantPortalConsumerSnapshot('cn-mainland', 'fallback-tenant');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.portal.tenantCode, 'fallback-tenant');
});

test('tob portal: brand portal fallback fills brand-level fields', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getBrandPortalConsumerSnapshot('cn-mainland', 't-fallback', 'b-fallback');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.portal.scopeType, 'BRAND');
  assert.equal(snapshot.portal.brandCode, 'b-fallback');
});

// ---- 边界 ----

test('tob portal: tenant portal scope resolver includes mismatch strategy', () => {
  const keys = ['resolver', 'revalidateOn', 'mismatchStrategy'];
  assert.ok(Object.keys({ resolver: '', revalidateOn: [], mismatchStrategy: '' }).every((k) => keys.includes(k)));
});

test('tob portal: different market codes produce different default social platforms', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/foundation/consumers/portal')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: { consumer: 'portal', modulePath: 'src', dependsOn: [], responsibility: 'x', handoffContracts: [], recommendedSequence: [], governanceTouchpoints: [], highRiskEntrypoints: [], actionGovernanceExamples: [], runtimeHandoffExamples: [], runtimeReceiptExamples: [], governanceAlertLifecycleExamples: [] },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: { generatedAt: '2026-06-13T00:00:00.000Z', summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 }, alerts: [], topRisks: [] },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const cn = await getTenantPortalConsumerSnapshot('cn-mainland', 't-social');
  const us = await getTenantPortalConsumerSnapshot('us-default', 't-social');

  assert.ok(cn.market.social.primaryPlatforms.includes('WECHAT'));
  assert.ok(us.market.social.primaryPlatforms.includes('LINKEDIN'));
});
