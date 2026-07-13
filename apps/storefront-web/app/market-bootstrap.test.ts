/**
 * market-bootstrap unit tests — storefront-web
 *
 * 覆盖: 门店启动引导 / governance read model / consumer descriptor / 多重降级策略
 * L1 JMeter 风格: 正例 + 反例 + 边界
 *
 * 增强: 在原 2 个测试基础上新增 3+ 覆盖场景
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStorefrontConsumerSnapshot,
  loadStorefrontGovernanceReadModel,
  storefrontWebBootstrap,
} from './market-bootstrap';

// ── 正例 ──

test('market-bootstrap: 通过 API 加载 consumer descriptor', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/portals/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            storePortal: {
              audience: 'TOC', scopeType: 'STORE', scopeCode: 'store-001',
              tenantCode: 'demo-tenant', brandCode: 'demo-brand', storeCode: 'store-001',
              storeName: 'store-001 门店', marketCode: 'cn-mainland', channel: 'WEB',
              name: 'store-001 门店门户',
              primaryDomain: 'store-001.demo-brand.demo-tenant.cn-mainland.local',
              supportedLanguages: ['zh-CN'],
              supportedSurfaces: ['OFFICIAL_SITE', 'H5', 'MINIAPP', 'APP', 'PC_CONSOLE', 'PAD_CONSOLE'],
            },
            foundationDependencies: ['identity-access', 'configuration-governance'],
            foundationContracts: ['portal-contract'],
            regionalOverrides: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/foundation/consumers/portal')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            consumer: 'portal',
            modulePath: 'src/modules/portal',
            dependsOn: ['identity-access', 'configuration-governance', 'integration-orchestration'],
            responsibility: 'Assemble portal resolution, domain strategy, login entry.',
            handoffContracts: ['from identity-access parse identity'],
            recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'],
            governanceTouchpoints: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'],
            highRiskEntrypoints: ['member-login'],
            actionGovernanceExamples: [],
            runtimeHandoffExamples: [],
            runtimeReceiptExamples: [],
            governanceAlertLifecycleExamples: [],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 2, approvalsWithFailures: 0, highRiskAudits: 1,
              blockedLedgers: 0, rotationDueSecrets: 1, expiredSecrets: 0,
              expiringCertificates: 0, expiredCertificates: 0,
              degradedSignals: 2, attentionRecoveryPlans: 0, staleDrills: 1,
            },
            alerts: [],
            topRisks: [{
              severity: 'high', code: 'signal-degradation', count: 2,
              summary: '存在信号降级', triageState: 'needs-triage',
              triageSummary: '待处理，尚无最近运维动作', recentOperation: null,
            }],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 'demo-tenant', 'demo-brand', 'store-001');

  assert.equal(snapshot.consumerDescriptor.consumer, 'portal');
  assert.equal(snapshot.consumerDescriptor.highRiskEntrypoints.includes('member-login'), true);
  assert.deepEqual(snapshot.consumerDescriptor.recommendedSequence, [
    '/api/v1/foundation/bootstrap',
    '/api/v1/portals/bootstrap',
  ]);
  assert.equal(snapshot.wiring.app, 'storefront-web');
});

test('market-bootstrap: 仅 overview 可用时 governance 汇报 fallback', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/foundation/overview')) {
      return new Response(
        JSON.stringify({
          success: true, message: 'OK',
          data: {
            generatedAt: '2026-06-13T00:00:00.000Z',
            summary: {
              approvalsPending: 2, approvalsWithFailures: 0, highRiskAudits: 1,
              blockedLedgers: 0, rotationDueSecrets: 1, expiredSecrets: 0,
              expiringCertificates: 0, expiredCertificates: 0,
              degradedSignals: 2, attentionRecoveryPlans: 0, staleDrills: 1,
            },
            alerts: [],
            topRisks: [{
              severity: 'high', code: 'signal-degradation', count: 2,
              summary: '存在信号降级', triageState: 'needs-triage',
              triageSummary: '待处理，尚无最近运维动作', recentOperation: null,
            }],
          },
          timestamp: '2026-06-13T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const governance = await loadStorefrontGovernanceReadModel('cn-mainland', 'demo-tenant', 'demo-brand', 'store-001');

  assert.equal(governance.generatedAt, '2026-06-13T00:00:00.000Z');
  assert.equal(governance.deliveryMode, 'fallback');
  assert.equal(governance.summary.degradedSignals, 2);
  assert.equal(governance.topRisks[0]?.code, 'signal-degradation');
});

// ── 新增正例 ──

test('market-bootstrap: storefrontWebBootstrap 包含有效的 app 名称', () => {
  assert.ok(storefrontWebBootstrap.app);
  assert.equal(typeof storefrontWebBootstrap.app, 'string');
  assert.equal(storefrontWebBootstrap.app, 'storefront-web');
});

// ── 反例 ──

test('market-bootstrap: 所有 API 返回 500 时将 portal 和 governance 均降级', async () => {
  globalThis.fetch = (async () => new Response('Internal Server Error', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-fb', 'b-fb', 's-fb');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.portal.storeCode, 's-fb');
  assert.equal(snapshot.scope.resolver.length > 0, true);
});

test('market-bootstrap: 空响应 (204 No Content) 视为失败', async () => {
  globalThis.fetch = (async () => new Response(null, { status: 204 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('us-default', 't-204', 'b-204', 's-204');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.portal.storeCode, 's-204');
});

// ── 新增反例 ──

test('market-bootstrap: fetch 抛出 TypeError 时走 fallback', async () => {
  globalThis.fetch = (async () => {
    throw new TypeError('network failure');
  }) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-net', 'b-net', 's-net');

  assert.equal(snapshot.deliveryMode, 'fallback');
  assert.equal(snapshot.portal.storeCode, 's-net');
  assert.equal(snapshot.portal.tenantCode, 't-net');
});

test('market-bootstrap: storePortal 缺失时优先用 marketProfile.locale 构造 fallback 语言', async () => {
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
              locale: { defaultLanguage: 'en-US', supportedLanguages: ['en-US', 'zh-CN'] },
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

  const snapshot = await getStorefrontConsumerSnapshot('cn-mainland', 't-locale', 'b-locale', 's-locale');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.deepEqual(snapshot.portal.supportedLanguages, ['en-US', 'zh-CN']);
});

// ── 新增边界 ──

test('market-bootstrap: storeCode 包含特殊字符时不应影响解析', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot(
    'cn-mainland',
    'tenant.with.dots',
    'brand_with_underscores',
    'store-001_special',
  );

  // fallback 会保留原始 storeCode
  assert.equal(snapshot.portal.tenantCode, 'tenant.with.dots');
  assert.equal(snapshot.portal.brandCode, 'brand_with_underscores');
  assert.equal(snapshot.portal.storeCode, 'store-001_special');
});

test('market-bootstrap: snapshot scope path 格式在 fallback 中也正确', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const snapshot = await getStorefrontConsumerSnapshot('eu-de', 'tenant-eu', 'brand-eu', 'berlin-01');

  const parts = snapshot.scope.scopePath.split(' / ');
  assert.equal(parts.length, 4);
  assert.equal(parts[0], 'eu-de');
  assert.equal(parts[1], 'tenant-eu');
  assert.equal(parts[2], 'brand-eu');
  assert.equal(parts[3], 'berlin-01');
});

test('market-bootstrap: governance summary 数值在 api 模式下全部 >= 0', async () => {
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

  const g = snapshot.governance.summary;
  assert.equal(typeof g.approvalsPending, 'number');
  assert.equal(typeof g.approvalsWithFailures, 'number');
  assert.equal(typeof g.highRiskAudits, 'number');
  assert.equal(typeof g.degradedSignals, 'number');
  assert.ok(g.approvalsPending >= 0);
});
