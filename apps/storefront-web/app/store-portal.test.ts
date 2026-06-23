/**
 * store-portal unit tests — storefront-web
 *
 * 覆盖: store portal bootstrap / tenant 上下文 / market 感知 / 降级回退 / 错误状态
 * L1 JMeter 风格: 正例 + 反例 + 边界
 *
 * 使用 market-bootstrap.ts 中的 API 函数模拟 fetch 调用
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { getStorefrontConsumerSnapshot, getStorePortal, getStorefrontLandingSnapshot } from './market-bootstrap';

// ── 正例 ──

test('store-portal: cn-mainland store 从 API 正常解析', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 's-001',
              tenantCode: 'demo-tenant', brandCode: 'demo-brand', storeCode: 's-001',
              storeName: 's-001 门店', marketCode: 'cn-mainland', channel: 'WEB',
              name: 's-001 门店门户',
              primaryDomain: 's-001.demo-brand.demo-tenant.cn-mainland.local',
              supportedLanguages: ['zh-CN'],
              supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
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
            summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 },
            alerts: [], topRisks: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 'demo-tenant', 'demo-brand', 's-001');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.portal.audience, 'TOC');
  assert.equal(snapshot.portal.scopeType, 'STORE');
  assert.equal(snapshot.portal.storeCode, 's-001');
  assert.equal(snapshot.portal.marketCode, 'cn-mainland');
  assert.equal(snapshot.portal.supportedLanguages[0], 'zh-CN');
  assert.equal(snapshot.scope.scopePath, 'cn-mainland / demo-tenant / demo-brand / s-001');
});

test('store-portal: us-default store 返回 en-US 语言', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 's-002',
              tenantCode: 'demo-tenant', brandCode: 'demo-brand', storeCode: 's-002',
              storeName: 's-002 门店', marketCode: 'us-default', channel: 'WEB',
              name: 's-002 门店门户',
              primaryDomain: 's-002.demo-brand.demo-tenant.us-default.local',
              supportedLanguages: ['en-US'],
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
            summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 },
            alerts: [], topRisks: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const portal = await getStorePortal('us-default', 'demo-tenant', 'demo-brand', 's-002');

  assert.equal(portal.marketCode, 'us-default');
  assert.equal(portal.supportedLanguages[0], 'en-US');
  assert.ok(portal.supportedSurfaces.includes('MINIAPP'));
});

test('store-portal: 双市场 landing 快照解析', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      const headers = new Headers(init?.headers);
      const isCn = headers.get('x-market-code') === 'cn-mainland';
      return new Response(
        JSON.stringify({
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001',
              tenantCode: 'demo-tenant', brandCode: 'demo-brand', storeCode: 'store-001',
              storeName: 'store-001 门店',
              marketCode: isCn ? 'cn-mainland' : 'us-default', channel: 'WEB',
              name: 'store-001',
              primaryDomain: `store-001.demo-brand.demo-tenant.${isCn ? 'cn-mainland' : 'us-default'}.local`,
              supportedLanguages: isCn ? ['zh-CN'] : ['en-US'],
              supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP'],
            },
            foundationDependencies: [], foundationContracts: [], regionalOverrides: [],
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
            summary: { approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0, blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0, expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0, attentionRecoveryPlans: 0, staleDrills: 0 },
            alerts: [], topRisks: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const landing = await getStorefrontLandingSnapshot();

  assert.equal(landing.cnStore.portal.marketCode, 'cn-mainland');
  assert.equal(landing.usStore.portal.marketCode, 'us-default');
  assert.equal(landing.cnStore.portal.supportedLanguages[0], 'zh-CN');
  assert.equal(landing.usStore.portal.supportedLanguages[0], 'en-US');
});

// ── 反例 ──

test('store-portal: bootstrap 请求失败时走 fallback', async () => {
  globalThis.fetch = (async () => new Response('Internal Server Error', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 'tenant-fallback', 'brand-fallback', 'store-fallback');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.portal.storeCode, 'store-fallback');
  assert.equal(snapshot.portal.tenantCode, 'tenant-fallback');
  assert.equal(snapshot.portal.marketCode, 'cn-mainland');
});

test('store-portal: 503 Service Unavailable 也走 fallback', async () => {
  globalThis.fetch = (async () => new Response('Service Unavailable', { status: 503 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('us-default', 't-503', 'b-503', 's-503');

  assert.equal(snapshot.deliveryMode, 'fallback');
});

test('store-portal: 网络异常 (TypeError) 也走 fallback', async () => {
  globalThis.fetch = (async () => {
    throw new TypeError('Failed to fetch');
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-err', 'b-err', 's-err');

  assert.equal(snapshot.deliveryMode, 'fallback');
  // fallback 中仍然要保留传入的 storeCode
  assert.equal(snapshot.portal.storeCode, 's-err');
});

// ── 边界 ──

test('store-portal: fallback 包含所有表面通道', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const portal = await getStorePortal('cn-mainland', 't-surf', 'b-surf', 's-surf');

  const surfaces = portal.supportedSurfaces;
  assert.ok(surfaces.includes('OFFICIAL_SITE'));
  assert.ok(surfaces.includes('H5'));
  assert.ok(surfaces.includes('MINIAPP'));
  assert.ok(surfaces.includes('APP'));
  assert.ok(surfaces.includes('PC_CONSOLE'));
  assert.ok(surfaces.includes('PAD_CONSOLE'));
});

test('store-portal: cn 和 us fallback 语言不同', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const cnPortal = await getStorePortal('cn-mainland', 't-lang', 'b-lang', 's-lang');
  const usPortal = await getStorePortal('us-default', 't-lang', 'b-lang', 's-lang');

  assert.deepEqual(cnPortal.supportedLanguages, ['zh-CN']);
  assert.deepEqual(usPortal.supportedLanguages, ['en-US']);
});

test('store-portal: snapshot 包含 scope resolver 与 mismatch strategy', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-meta', 'b-meta', 's-meta');

  assert.ok(typeof snapshot.scope.scopePath === 'string');
  assert.ok(snapshot.scope.scopePath.length > 0);
  assert.ok(typeof snapshot.scope.mismatchStrategy === 'string');
  assert.ok(snapshot.scope.mismatchStrategy.length > 0);
  assert.ok(Array.isArray(snapshot.scope.revalidateOn));
  assert.ok(snapshot.scope.revalidateOn.length > 0);
});

test('store-portal: snapshot 包含 challenge 与 degradation 元数据', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-chal', 'b-chal', 's-chal');

  assert.ok(typeof snapshot.challenge.enforcement === 'string');
  assert.ok(snapshot.challenge.enforcement.length > 0);
  assert.ok(Array.isArray(snapshot.challenge.notes));
  assert.ok(snapshot.challenge.notes.length > 0);
  assert.ok(typeof snapshot.degradation.featureFlagFallback === 'string');
  assert.ok(typeof snapshot.degradation.desensitizationMode === 'string');
  assert.ok(Array.isArray(snapshot.degradation.cacheableCapabilities));
});
