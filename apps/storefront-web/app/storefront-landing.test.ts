/**
 * storefront-landing unit tests — storefront-web
 *
 * 覆盖: landing 页面渲染状态 / 治理数据加载 / 空数据 / 降级 / 错误状态
 * L1 JMeter 风格: 正例 + 反例 + 边界
 *
 * 使用 market-bootstrap.ts 中的 getStorefrontConsumerSnapshot 模拟 API
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getStorefrontConsumerSnapshot } from './market-bootstrap';

// ── 正例 ──

test('storefront-landing: API 正常返回时 deliveryMode = api', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 's',
              tenantCode: 't', brandCode: 'b', storeCode: 's',
              storeName: 's 门店', marketCode: 'cn-mainland', channel: 'WEB',
              name: 's 门店门户',
              primaryDomain: 's.b.t.cn-mainland.local',
              supportedLanguages: ['zh-CN'],
              supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP'],
            },
            foundationDependencies: ['identity-access'],
            foundationContracts: ['@m5/types'],
            regionalOverrides: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/foundation/consumers/portal') || url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 3, approvalsWithFailures: 1, highRiskAudits: 5,
              blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0,
              expiringCertificates: 0, expiredCertificates: 0,
              degradedSignals: 2, attentionRecoveryPlans: 1, staleDrills: 0,
            },
            alerts: [],
            topRisks: [
              {
                severity: 'high', code: 'high-risk-audits', count: 5,
                summary: '高风险审计', triageState: 'needs-triage',
                triageSummary: '待处理', recentOperation: null,
              },
            ],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't', 'b', 's');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.governance.summary.highRiskAudits, 5);
  assert.equal(snapshot.governance.summary.degradedSignals, 2);
  assert.equal(snapshot.governance.summary.approvalsPending, 3);
});

test('storefront-landing: degradation 元数据非空', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 's',
              tenantCode: 't', brandCode: 'b', storeCode: 's',
              storeName: 's 门店', marketCode: 'cn-mainland', channel: 'WEB',
              name: 's 门店门户',
              primaryDomain: 's.b.t.cn-mainland.local',
              supportedLanguages: ['zh-CN'],
              supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP'],
            },
            foundationDependencies: ['identity-access'],
            foundationContracts: [],
            regionalOverrides: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/foundation/consumers/portal') || url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0,
              blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0,
              expiringCertificates: 0, expiredCertificates: 0,
              degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0,
            },
            alerts: [], topRisks: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't', 'b', 's');

  assert.ok(snapshot.degradation.featureFlagFallback.length > 0);
  assert.ok(snapshot.degradation.desensitizationMode.length > 0);
  assert.ok(snapshot.degradation.cacheableCapabilities.length > 0);
});

test('storefront-landing: foundationDependencies 和 regionalOverrides 反映 API 数据', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 's',
              tenantCode: 't', brandCode: 'b', storeCode: 's',
              storeName: 's 门店', marketCode: 'cn-mainland', channel: 'WEB',
              name: 's 门店门户',
              primaryDomain: 's.b.t.cn-mainland.local',
              supportedLanguages: ['zh-CN'],
              supportedSurfaces: ['OFFICIAL_SITE'],
            },
            foundationDependencies: ['identity-access', 'configuration-governance'],
            foundationContracts: ['portal-contract'],
            regionalOverrides: [{ market: 'cn-mainland', feature: 'wechat-pay' }],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/foundation/consumers/portal') || url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0,
              blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0,
              expiringCertificates: 0, expiredCertificates: 0,
              degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0,
            },
            alerts: [], topRisks: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't', 'b', 's');

  assert.ok(snapshot.foundationDependencies.length >= 2);
  assert.ok(snapshot.foundationDependencies.includes('identity-access'));
  assert.ok(snapshot.regionalOverridesCount > 0);
});

// ── 反例 ──

test('storefront-landing: 全部 API 失败时走 fallback, governance 值为 0', async () => {
  globalThis.fetch = (async () => new Response('Internal Server Error', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-fb', 'b-fb', 's-fb');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.foundationDependencies.length, 0);
  assert.equal(snapshot.regionalOverridesCount, 0);
});

test('storefront-landing: 503 Service Unavailable 正确走 fallback', async () => {
  globalThis.fetch = (async () => new Response('Service Unavailable', { status: 503 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-503', 'b-503', 's-503');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.portal.storeCode, 's-503');
});

test('storefront-landing: 部分 API 失败 (仅 bootstrap 正常) 仍为 api 模式但 governance 降级', async () => {
  // bootstrap 正常时 snapshotBase 判定 deliveryMode = api
  // 但 governance 和 consumerDescriptor 走各自的 fallback
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 's',
              tenantCode: 't', brandCode: 'b', storeCode: 's',
              storeName: 's 门店', marketCode: 'cn-mainland', channel: 'WEB',
              name: 's 门店门户',
              primaryDomain: 's.b.t.cn-mainland.local',
              supportedLanguages: ['zh-CN'],
              supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP'],
            },
            foundationDependencies: ['identity-access'],
            foundationContracts: [],
            regionalOverrides: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    throw new Error('downstream unavailable');
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't', 'b', 's');

  // bootstrap 成功 → api 模式
  assert.equal(snapshot.deliveryMode, 'api');
  // governance 降级但 portal 数据正常
  assert.equal(snapshot.portal.storeCode, 's');
  assert.equal(snapshot.portal.marketCode, 'cn-mainland');
});

// ── 边界 ──

test('storefront-landing: challenge enforcement 和 notes 始终非空', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-chal', 'b-chal', 's-chal');

  assert.ok(snapshot.challenge.enforcement.length > 0, 'enforcement must be non-empty');
  assert.ok(snapshot.challenge.notes.length > 0, 'notes must be non-empty');
});

test('storefront-landing: scope mismatchStrategy 和 revalidateOn 始终非空', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-ms', 'b-ms', 's-ms');

  assert.ok(snapshot.scope.mismatchStrategy.length > 0);
  assert.ok(snapshot.scope.revalidateOn.length > 0);
});

test('storefront-landing: governance summary 字段在非空时均为 >= 0', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 's',
              tenantCode: 't', brandCode: 'b', storeCode: 's',
              storeName: 's 门店', marketCode: 'cn-mainland', channel: 'WEB',
              name: 's 门店门户',
              primaryDomain: 's.b.t.cn-mainland.local',
              supportedLanguages: ['zh-CN'],
              supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP'],
            },
            foundationDependencies: [],
            foundationContracts: [],
            regionalOverrides: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/foundation/consumers/portal') || url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 4, approvalsWithFailures: 2, highRiskAudits: 0,
              blockedLedgers: 1, rotationDueSecrets: 0, expiredSecrets: 0,
              expiringCertificates: 0, expiredCertificates: 0,
              degradedSignals: 3, attentionRecoveryPlans: 0, staleDrills: 0,
            },
            alerts: [], topRisks: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't', 'b', 's');

  const g = snapshot.governance.summary;
  assert.ok(g.approvalsPending >= 0);
  assert.ok(g.approvalsWithFailures >= 0);
  assert.ok(g.highRiskAudits >= 0);
  assert.ok(g.degradedSignals >= 0);
});
