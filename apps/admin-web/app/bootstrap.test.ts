import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdminWorkbenchConsumerSnapshot, getRoleWorkbench, loadAdminGovernanceReadModel } from './bootstrap';
import { adminRuntimeOperationsRoute } from './operations-data';

test('admin web bootstrap: loads governance read model when only overview endpoint is available', async () => {
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
              approvalsPending: 4,
              approvalsWithFailures: 1,
              highRiskAudits: 2,
              blockedLedgers: 1,
              rotationDueSecrets: 0,
              expiredSecrets: 0,
              expiringCertificates: 0,
              expiredCertificates: 0,
              degradedSignals: 1,
              attentionRecoveryPlans: 0,
              staleDrills: 0,
              runtimeGovernanceBacklog: 0,
              stalledRuntimeCallbacks: 0,
              highRiskRuntimeBacklog: 0,
              runtimeBlockedActions: 0
            },
            alerts: [],
            topRisks: [
              {
                severity: 'high',
                code: 'approvals-pending',
                count: 4,
                summary: '存在待处理审批',
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

  const governance = await loadAdminGovernanceReadModel();

  assert.equal(governance.generatedAt, '2026-06-13T00:00:00.000Z');
  assert.equal(governance.deliveryMode, 'fallback');
  assert.equal(governance.summary.approvalsPending, 4);
  assert.equal(governance.topRisks[0]?.code, 'approvals-pending');
  assert.equal(governance.alerts.length > 0, true);
});

test('admin web bootstrap: loads workbench consumer descriptor into snapshot', async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith('/workbenches/bootstrap')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            tenantContext: { tenantId: 'tenant-demo', brandId: 'brand-demo', storeId: 'store-001', marketCode: 'cn-mainland' },
            workbenches: [
              {
                role: 'SUPER_ADMIN',
                channel: 'PC',
                title: '总部总控台',
                description: '平台级租户、审计、安全和全局基础设施入口。',
                marketCodes: ['cn-mainland', 'us-default'],
                navItems: [{ key: 'tenants', label: '租户管理', href: '/workbench/super_admin', description: '租户开通、关停和能力授权' }]
              }
            ],
            storePortals: [],
            tenantPortal: {
              audience: 'TOB',
              scopeType: 'TENANT',
              scopeCode: 'tenant-demo',
              tenantCode: 'tenant-demo',
              marketCode: 'cn-mainland',
              channel: 'WEB',
              name: 'tenant-demo ToB 官网',
              primaryDomain: 'tenant-demo.cn-mainland.b2b.local',
              supportedLanguages: ['zh-CN'],
              heroTitle: 'tenant-demo 企业级经营门户',
              heroSubtitle: '...',
              solutionTags: [],
              loginEntry: { label: '进入租户后台', loginPath: '/cn-mainland/tenant-demo/login', ssoEnabled: true }
            },
            brandPortal: {
              audience: 'TOB',
              scopeType: 'BRAND',
              scopeCode: 'brand-demo',
              tenantCode: 'tenant-demo',
              brandCode: 'brand-demo',
              marketCode: 'cn-mainland',
              channel: 'WEB',
              name: 'brand-demo 品牌 ToB 官网',
              primaryDomain: 'brand-demo.tenant-demo.cn-mainland.b2b.local',
              supportedLanguages: ['zh-CN'],
              heroTitle: 'brand-demo 品牌经营官网',
              heroSubtitle: '...',
              solutionTags: [],
              loginEntry: { label: '进入品牌后台', loginPath: '/cn-mainland/tenant-demo/brand-demo/login', ssoEnabled: true }
            },
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
            regionalLoginPolicies: { defaultLoginPath: '/cn-mainland/tenant-demo/login', ssoEnabled: true },
            supportedLocales: ['zh-CN'],
            supportedClients: ['PC', 'PAD', 'H5', 'MINIAPP', 'APP'],
            foundationDependencies: ['identity-access', 'configuration-governance'],
            foundationContracts: ['contract-a']
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/foundation/consumers/workbench')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            consumer: 'workbench',
            modulePath: 'src/modules/workbench',
            dependsOn: [
              'identity-access',
              'configuration-governance',
              'integration-orchestration',
              'trust-governance',
              'resilience-operations'
            ],
            responsibility: '装配 PC/PAD 工作台导航、权限边界、离线场景和运营治理入口。',
            handoffContracts: ['由 identity-access 输出角色、策略和租户范围'],
            recommendedSequence: [
              '/api/v1/foundation/bootstrap',
              '/api/v1/workbenches/bootstrap',
              '/api/v1/foundation/overview/alerts/catalog'
            ],
            governanceTouchpoints: [
              '/api/v1/foundation/bootstrap',
              '/api/v1/workbenches/bootstrap',
              '/api/v1/foundation/overview/alerts/catalog'
            ],
            highRiskEntrypoints: ['approval-execution', 'secret-rotation', 'runtime-replay'],
            actionGovernanceExamples: [
              {
                surface: 'admin-web',
                action: 'approval-execution',
                scenario: '总部总控台执行高风险审批前必须完成 step-up challenge，禁止前端直接跳过挑战放行动作。',
                riskLevel: 'high',
                bootstrapState: 'challenge-required',
                nextStep: 'CHALLENGE',
                submitState: 'challenge-issued',
                requestEndpoint: '/api/v1/workbenches/approvals/execute'
              }
            ],
            runtimeHandoffExamples: [],
            runtimeReceiptExamples: [],
            governanceAlertLifecycleExamples: []
          },
          timestamp: '2026-06-13T00:00:00.000Z'
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getAdminWorkbenchConsumerSnapshot();

  assert.equal(snapshot.consumerDescriptor.consumer, 'workbench');
  assert.equal(snapshot.consumerDescriptor.highRiskEntrypoints.includes('runtime-replay'), true);
  assert.deepEqual(snapshot.consumerDescriptor.recommendedSequence, [
    '/api/v1/foundation/bootstrap',
    '/api/v1/workbenches/bootstrap',
    '/api/v1/foundation/overview/alerts/catalog'
  ]);
  assert.ok(snapshot.consumerDescriptor.highRiskEntrypoints.includes('approval-execution'));
  assert.equal(snapshot.workbenches[0]?.navItems[0]?.href, '/workbench/super_admin');
  assert.equal(adminRuntimeOperationsRoute.href, '/operations');
});

test('admin web bootstrap: resolves legacy hyphen workbench routes', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const workbench = await getRoleWorkbench('super-admin');

  assert.equal(workbench?.role, 'SUPER_ADMIN');
  assert.equal(workbench?.navItems[0]?.href, '/workbench/super_admin');
});

test('admin web bootstrap: resolves all 10 role workbenches via legacy hyphen form', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  for (const role of [
    'super-admin',
    'tenant-admin',
    'brand-manager',
    'store-manager',
    'guide',
    'cashier',
    'operations',
    'finance',
    'warehouse',
    'coach'
  ]) {
    const workbench = await getRoleWorkbench(role);
    assert.ok(workbench, `${role} should resolve to a workbench contract`);
    assert.equal(
      workbench?.role,
      role.replace(/-/g, '_').toUpperCase(),
      `${role} should map to the uppercased underscore form`
    );
    assert.ok(workbench?.navItems.length, `${role} should have at least one navItem`);
  }
});

test('admin web bootstrap: returns undefined for unknown workbench role', async () => {
  globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

  const unknown = await getRoleWorkbench('unknown-role-xyz');
  assert.equal(unknown, undefined);
});
