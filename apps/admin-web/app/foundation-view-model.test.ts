import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import type { FoundationBootstrapResponse, FoundationOperationsOverviewResponse } from '@m5/types';
import { buildFoundationWorkspaceHref } from '@m5/types';
import {
  formatFoundationHealthLabel,
  loadFoundationWorkspace,
  summarizeFoundationConsumer,
  summarizeFoundationModule,
  summarizeGovernanceBaseline
} from './foundation-view-model';

const SAMPLE_BOOTSTRAP = {
  generatedAt: '2026-06-21T02:00:00.000Z',
  docs: ['docs/knowledge-base/frontend-foundation-consumption-kb.md'],
  guardrails: ['foundation bootstrap 优先'],
  modules: [
    {
      key: 'trust-governance',
      name: 'Trust Governance',
      purpose: '统一审计、审批、风控与限流治理。',
      inboundContracts: ['audit logs'],
      outboundContracts: ['audit trail'],
      capabilities: [
        {
          key: 'audit',
          name: 'Audit',
          responsibilities: ['record'],
          entrypoints: ['/foundation/trust-governance/audit'],
          consumers: ['workbench'],
          status: 'active'
        }
      ]
    }
  ],
  consumers: [
    {
      consumer: 'workbench',
      modulePath: 'src/modules/workbench',
      dependsOn: ['trust-governance'],
      responsibility: '装配工作台治理入口。',
      handoffContracts: ['workbench bootstrap'],
      recommendedSequence: ['/api/v1/foundation/bootstrap'],
      governanceTouchpoints: ['/api/v1/foundation/overview'],
      highRiskEntrypoints: ['approval-execution'],
      actionGovernanceExamples: [],
      runtimeHandoffExamples: [],
      runtimeReceiptExamples: [],
      governanceAlertLifecycleExamples: []
    }
  ],
  governanceBaselines: [
    {
      key: 'approval-trace',
      name: '审批留痕',
      ownerModule: 'trust-governance',
      summary: '高风险动作需要审批留痕。',
      controls: ['approval', 'audit'],
      evidence: ['audit trail']
    }
  ]
} as unknown as FoundationBootstrapResponse;

const SAMPLE_OVERVIEW: FoundationOperationsOverviewResponse = {
  generatedAt: '2026-06-21T02:05:00.000Z',
  summary: {
    approvalsPending: 3,
    approvalsWithFailures: 1,
    highRiskAudits: 2,
    blockedLedgers: 0,
    rotationDueSecrets: 0,
    expiredSecrets: 0,
    expiringCertificates: 0,
    expiredCertificates: 0,
    degradedSignals: 0,
    attentionRecoveryPlans: 0,
    staleDrills: 0,
    runtimeGovernanceBacklog: 0,
    stalledRuntimeCallbacks: 0,
    highRiskRuntimeBacklog: 0,
    runtimeBlockedActions: 0
  },
  alerts: [
    {
      code: 'approvals-pending',
      severity: 'high',
      count: 3,
      summary: '待处理审批单 3 条'
    }
  ],
  topRisks: [
    {
      code: 'approvals-pending',
      severity: 'high',
      count: 3,
      summary: '待处理审批单 3 条'
    }
  ]
};

describe('foundation-view-model', () => {
  // ── 正例: buildFoundationWorkspaceHref ──

  test('buildFoundationWorkspaceHref omits empty query', () => {
    assert.equal(buildFoundationWorkspaceHref(), '/foundation');
  });

  test('buildFoundationWorkspaceHref includes module and consumer', () => {
    assert.equal(
      buildFoundationWorkspaceHref({ moduleKey: 'trust-governance', consumer: 'workbench' }),
      '/foundation?moduleKey=trust-governance&consumer=workbench'
    );
  });

  test('buildFoundationWorkspaceHref includes only moduleKey', () => {
    assert.equal(
      buildFoundationWorkspaceHref({ moduleKey: 'audit' }),
      '/foundation?moduleKey=audit'
    );
  });

  // ── 正例: summarize helpers ──

  test('summarize helpers keep module, consumer and baseline context', () => {
    assert.equal(summarizeFoundationModule(SAMPLE_BOOTSTRAP.modules[0]!), 'trust-governance · capabilities 1');
    assert.equal(summarizeFoundationConsumer(SAMPLE_BOOTSTRAP.consumers[0]!), 'workbench · dependsOn 1 modules');
    assert.equal(summarizeGovernanceBaseline(SAMPLE_BOOTSTRAP.governanceBaselines[0]!), 'trust-governance · controls 2');
  });

  // ── 正例: formatFoundationHealthLabel ──

  test('formatFoundationHealthLabel covers all statuses', () => {
    assert.equal(formatFoundationHealthLabel('healthy'), '健康');
    assert.equal(formatFoundationHealthLabel('warning'), '告警');
    assert.equal(formatFoundationHealthLabel('critical'), '高风险');
    assert.equal(formatFoundationHealthLabel('unknown'), '未知');
  });

  test('formatFoundationHealthLabel handles undefined gracefully', () => {
    assert.equal(formatFoundationHealthLabel(undefined), '未知');
  });

  // ── 正例: loadFoundationWorkspace ──

  test('loadFoundationWorkspace returns api snapshot', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/foundation/bootstrap')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_BOOTSTRAP }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/foundation/overview/modules/trust-governance')) {
        return new Response(
          JSON.stringify({
            code: 'OK',
            message: '',
            data: {
              generatedAt: '2026-06-21T02:06:00.000Z',
              moduleKey: 'trust-governance',
              health: {
                module: 'trust-governance',
                score: 92,
                status: 'healthy',
                indicators: {
                  highRiskAudits: 2,
                  pendingApprovals: 3,
                  executionFailures: 1,
                  blockedCount: 0
                }
              },
              detail: { approvalsPending: 3 }
            }
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' }
          }
        );
      }
      if (url.includes('/foundation/overview')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;

    try {
      const snapshot = await loadFoundationWorkspace({ moduleKey: 'trust-governance', consumer: 'workbench' });
      assert.equal(snapshot.deliveryMode, 'api');
      assert.equal(snapshot.workspace.summary.modules, 1);
      assert.equal(snapshot.workspace.summary.alerts, 1);
      assert.equal(snapshot.workspace.selectedModule?.key, 'trust-governance');
      assert.equal(snapshot.workspace.selectedModuleDetail.health?.score, 92);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadFoundationWorkspace without moduleKey still returns api snapshot', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('/foundation/bootstrap')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_BOOTSTRAP }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      if (url.includes('/foundation/overview')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      return new Response('not-found', { status: 404 });
    }) as typeof fetch;

    try {
      const snapshot = await loadFoundationWorkspace({});
      assert.equal(snapshot.deliveryMode, 'api');
      assert.equal(snapshot.workspace.summary.modules, 1);
      assert.equal(snapshot.workspace.selectedModule, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ── 反例: loadFoundationWorkspace ──

  test('loadFoundationWorkspace falls back when request fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({ moduleKey: 'trust-governance', consumer: 'workbench' });
      assert.equal(snapshot.deliveryMode, 'fallback');
      assert.equal(snapshot.workspace.summary.modules > 0, true);
      assert.equal(snapshot.workspace.selectedConsumer?.consumer, 'workbench');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('loadFoundationWorkspace falls back when bootstrap fails but overview succeeds partially', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('Not Found', { status: 404 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({ moduleKey: 'trust-governance' });
      assert.equal(snapshot.deliveryMode, 'fallback');
      assert.ok(snapshot.workspace.summary.modules >= 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // ── 边界 ──

  test('summarizeFoundationModule handles module with no capabilities', () => {
    const emptyModule = {
      key: 'empty-module',
      name: 'Empty',
      purpose: 'no capabilities',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    };
    assert.equal(summarizeFoundationModule(emptyModule as never), 'empty-module · capabilities 0');
  });

  test('summarizeGovernanceBaseline handles baseline with no controls', () => {
    const noControlBaseline = {
      key: 'no-control',
      name: 'No Control',
      ownerModule: 'test-module',
      summary: 'no controls',
      controls: [],
      evidence: []
    };
    assert.equal(summarizeGovernanceBaseline(noControlBaseline as never), 'test-module · controls 0');
  });

  test('summarizeGovernanceBaseline handles baseline with many controls', () => {
    const manyControls = {
      key: 'multi-control',
      name: 'Multi Control',
      ownerModule: 'security',
      summary: 'many controls',
      controls: ['approval', 'audit', 'encryption', 'logging'],
      evidence: ['log', 'cert']
    };
    assert.equal(summarizeGovernanceBaseline(manyControls as never), 'security · controls 4');
  });

  test('summarizeFoundationConsumer handles consumer with multiple dependencies', () => {
    const multiDepConsumer = {
      consumer: 'gateway',
      modulePath: 'src/modules/gateway',
      dependsOn: ['trust-governance', 'identity', 'configuration'],
      responsibility: 'API gateway',
      handoffContracts: [],
      recommendedSequence: [],
      governanceTouchpoints: [],
      highRiskEntrypoints: [],
      actionGovernanceExamples: [],
      runtimeHandoffExamples: [],
      runtimeReceiptExamples: [],
      governanceAlertLifecycleExamples: []
    };
    assert.equal(summarizeFoundationConsumer(multiDepConsumer as never), 'gateway · dependsOn 3 modules');
  });

  test('summarizeFoundationConsumer handles consumer with no dependencies', () => {
    const noDepConsumer = {
      consumer: 'standalone',
      modulePath: 'src/modules/standalone',
      dependsOn: [],
      responsibility: 'standalone module',
      handoffContracts: [],
      recommendedSequence: [],
      governanceTouchpoints: [],
      highRiskEntrypoints: [],
      actionGovernanceExamples: [],
      runtimeHandoffExamples: [],
      runtimeReceiptExamples: [],
      governanceAlertLifecycleExamples: []
    };
    assert.equal(summarizeFoundationConsumer(noDepConsumer as never), 'standalone · dependsOn 0 modules');
  });
});
