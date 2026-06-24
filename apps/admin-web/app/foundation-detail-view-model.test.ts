import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFoundationModuleDetailHref, readFoundationModuleDetailParam } from '@m5/types';
import {
  formatFoundationIndicator,
  loadFoundationModuleDetail,
  summarizeFoundationModuleDetail
} from './foundation-detail-view-model';

function envelope(payload: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ code: 'OK', message: '', data: payload }),
    text: async () => JSON.stringify({ code: 'OK', message: '', data: payload })
  } as Response;
}

const SAMPLE_MODULE_DETAIL = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  moduleKey: 'trust-governance',
  health: {
    module: 'trust-governance',
    score: 92,
    status: 'healthy',
    indicators: {
      highRiskAudits: 1,
      pendingApprovals: 2,
      executionFailures: 0,
      blockedCount: 0
    }
  },
  detail: { source: 'api' }
};

const SAMPLE_BOOTSTRAP = {
  generatedAt: '2026-06-14T08:00:00.000Z',
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
    },
    {
      key: 'identity-access',
      name: 'Identity Access',
      purpose: '统一 actor / 角色 / 权限校验。',
      inboundContracts: ['x-actor-*'],
      outboundContracts: ['identity result'],
      capabilities: []
    }
  ],
  consumers: [
    {
      consumer: 'workbench',
      modulePath: 'src/modules/workbench',
      dependsOn: ['trust-governance', 'identity-access'],
      responsibility: '装配工作台治理入口。',
      handoffContracts: ['workbench bootstrap'],
      recommendedSequence: ['/api/v1/foundation/bootstrap'],
      governanceTouchpoints: ['/api/v1/foundation/overview'],
      highRiskEntrypoints: [],
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
};

const SAMPLE_OVERVIEW = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  summary: {
    approvalsPending: 2,
    approvalsWithFailures: 0,
    highRiskAudits: 1,
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
  alerts: [],
  topRisks: []
};

function mockFoundationFetch() {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/foundation/bootstrap')) {
      return envelope(SAMPLE_BOOTSTRAP);
    }
    if (url.includes('/foundation/overview')) {
      return envelope(SAMPLE_OVERVIEW);
    }
    if (url.includes('/foundation/module/')) {
      return envelope(SAMPLE_MODULE_DETAIL);
    }
    return envelope({ code: 'NOT_FOUND', message: 'unknown endpoint', data: null });
  }) as typeof fetch;
}

function mockFetchReject() {
  return (async () => {
    throw new Error('network down');
  }) as typeof fetch;
}

test('types: foundation module detail href encodes and decodes module keys safely', () => {
  assert.equal(
    buildFoundationModuleDetailHref('trust-governance'),
    '/foundation/modules/trust-governance'
  );
  assert.equal(
    buildFoundationModuleDetailHref('module/sub:1'),
    '/foundation/modules/module%2Fsub%3A1'
  );

  assert.equal(readFoundationModuleDetailParam('trust-governance'), 'trust-governance');
  assert.equal(readFoundationModuleDetailParam(['trust-governance', 'extra']), 'trust-governance');
  assert.equal(readFoundationModuleDetailParam('module%2Fsub%3A1'), 'module/sub:1');
  assert.equal(readFoundationModuleDetailParam(undefined), null);
  assert.equal(readFoundationModuleDetailParam([]), null);
});

test('foundation-detail-view-model: module detail returns matched module with consumers and baselines', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFoundationFetch();
  try {
    const snapshot = await loadFoundationModuleDetail('trust-governance', {}, {});
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.module?.key, 'trust-governance');
    assert.equal(snapshot.healthLabel, '健康');
    assert.equal(snapshot.moduleHref, '/foundation/modules/trust-governance');
    assert.equal(snapshot.workspaceHref, '/foundation?moduleKey=trust-governance&consumer=workbench');
    assert.match(snapshot.auditHref, /source=foundation/);
    assert.match(snapshot.auditHref, /purpose=foundation-module/);
    assert.equal(snapshot.consumers.length, 1);
    assert.equal(snapshot.consumers[0]?.consumer, 'workbench');
    assert.equal(snapshot.baselines.length, 1);
    assert.equal(snapshot.baselines[0]?.key, 'approval-trace');
    const summary = summarizeFoundationModuleDetail(snapshot);
    assert.match(summary, /Trust Governance/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('foundation-detail-view-model: module detail flags notFound when module missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFoundationFetch();
  try {
    const snapshot = await loadFoundationModuleDetail('unknown-module', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.module, null);
    assert.equal(snapshot.consumers.length, 0);
    assert.equal(snapshot.baselines.length, 0);
    assert.equal(snapshot.moduleHref, '/foundation/modules/unknown-module');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('foundation-detail-view-model: module detail falls back to empty workspace on fetch failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReject();
  try {
    const snapshot = await loadFoundationModuleDetail('trust-governance', {}, {});
    assert.equal(snapshot.deliveryMode, 'fallback');
    // Fallback seed includes the requested module key, so notFound=false via fallback.
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.module?.key, 'trust-governance');
    assert.equal(snapshot.healthLabel, '健康');
    assert.equal(snapshot.moduleHref, '/foundation/modules/trust-governance');
    assert.match(snapshot.auditHref, /source=foundation/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('foundation-detail-view-model: module detail with unknown key still flags notFound under fallback', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReject();
  try {
    const snapshot = await loadFoundationModuleDetail('not-seeded-module', {}, {});
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.module, null);
    assert.equal(snapshot.moduleHref, '/foundation/modules/not-seeded-module');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('foundation-detail-view-model: formatFoundationIndicator returns zeroed snapshot when detail missing', () => {
  const indicators = formatFoundationIndicator(null);
  assert.deepEqual(indicators, {
    highRiskAudits: 0,
    pendingApprovals: 0,
    executionFailures: 0,
    blockedCount: 0
  });
});

test('foundation-detail-view-model: formatFoundationIndicator returns detail indicators when present', () => {
  const indicators = formatFoundationIndicator(SAMPLE_MODULE_DETAIL as never);
  assert.equal(indicators.highRiskAudits, 1);
  assert.equal(indicators.pendingApprovals, 2);
  assert.equal(indicators.executionFailures, 0);
  assert.equal(indicators.blockedCount, 0);
});
