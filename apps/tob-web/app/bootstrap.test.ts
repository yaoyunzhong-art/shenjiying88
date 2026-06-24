import assert from 'node:assert/strict';
import test from 'node:test';
import { getTenantPortalConsumerSnapshot, loadTobGovernanceReadModel } from './bootstrap';

test('tob web bootstrap: loads governance read model when only overview endpoint is available', async () => {
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
              approvalsWithFailures: 3,
              highRiskAudits: 2,
              blockedLedgers: 0,
              rotationDueSecrets: 1,
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
                count: 3,
                summary: '存在执行失败审批',
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

  const governance = await loadTobGovernanceReadModel('cn-mainland', 'demo-tenant');

  assert.equal(governance.generatedAt, '2026-06-13T00:00:00.000Z');
  assert.equal(governance.deliveryMode, 'fallback');
  assert.equal(governance.summary.approvalsWithFailures, 3);
  assert.equal(governance.topRisks[0]?.code, 'approval-execution-failures');
  assert.equal(governance.alerts.length > 0, true);
});

test('tob web bootstrap: loads portal consumer descriptor into snapshot', async () => {
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
              scopeCode: 'demo-tenant',
              tenantCode: 'demo-tenant',
              marketCode: 'cn-mainland',
              channel: 'WEB',
              name: 'demo-tenant ToB 官网',
              primaryDomain: 'demo-tenant.cn-mainland.b2b.local',
              supportedLanguages: ['zh-CN'],
              heroTitle: 'demo-tenant 企业级经营官网',
              heroSubtitle: '统一承接租户解决方案、渠道合作、门店网络能力展示与后台登录入口。',
              solutionTags: ['多租户 SaaS'],
              loginEntry: { label: '进入租户后台', loginPath: '/cn-mainland/demo-tenant/login', ssoEnabled: true }
            },
            brandPortal: null,
            storePortal: null,
            foundationDependencies: ['identity-access', 'configuration-governance'],
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
            dependsOn: [
              'identity-access',
              'configuration-governance',
              'integration-orchestration',
              'trust-governance',
              'resilience-operations'
            ],
            responsibility: '装配 ToB/ToC 门户解析、域名策略、登录入口和通知策略。',
            handoffContracts: ['从 identity-access 解析门户身份与组织归属'],
            recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'],
            governanceTouchpoints: [
              '/api/v1/foundation/bootstrap',
              '/api/v1/portals/bootstrap',
              'feature-flags',
              'risk-challenge'
            ],
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

    return new Response('boom', { status: 500 });
  }) as typeof fetch;

  const snapshot = await getTenantPortalConsumerSnapshot('cn-mainland', 'demo-tenant');

  assert.equal(snapshot.consumerDescriptor.consumer, 'portal');
  assert.equal(snapshot.consumerDescriptor.highRiskEntrypoints.includes('member-login'), true);
  assert.deepEqual(snapshot.consumerDescriptor.recommendedSequence, [
    '/api/v1/foundation/bootstrap',
    '/api/v1/portals/bootstrap'
  ]);
});
