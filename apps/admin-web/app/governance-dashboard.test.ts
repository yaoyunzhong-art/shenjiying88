/**
 * governance-dashboard.test.ts — L1 治理看板测试
 *
 * 测试治理概览数据加载、空状态、错误状态、callback 队列/堆积数、审批管线
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadAdminGovernanceReadModel } from './bootstrap';
import { adminRuntimeOperationsRoute } from './operations-data';

// ---------------------------------------------------------------------------
// 类型模拟
// ---------------------------------------------------------------------------

interface GovernanceSummary {
  approvalsPending: number;
  approvalsWithFailures: number;
  highRiskAudits: number;
  blockedLedgers: number;
  rotationDueSecrets: number;
  expiredSecrets: number;
  expiringCertificates: number;
  expiredCertificates: number;
  degradedSignals: number;
  attentionRecoveryPlans: number;
  staleDrills: number;
  runtimeGovernanceBacklog: number;
  stalledRuntimeCallbacks: number;
  highRiskRuntimeBacklog: number;
  runtimeBlockedActions: number;
}

interface GovernanceAlert {
  code: string;
  severity: 'high' | 'medium' | 'low';
  summary: string;
  triageState: string;
}

interface TopRisk {
  severity: 'high' | 'medium' | 'low';
  code: string;
  count: number;
  summary: string;
  triageState: string;
}

interface GovernanceReadModel {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  summary: GovernanceSummary;
  alerts: GovernanceAlert[];
  topRisks: TopRisk[];
}

// ---------------------------------------------------------------------------
// 治理概览 — 数据加载
// ---------------------------------------------------------------------------

describe('治理概览数据加载', () => {
  it('should load governance read model with fallback mode when API fails', async () => {
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    const governance = await loadAdminGovernanceReadModel();

    assert.equal(governance.deliveryMode, 'fallback');
    assert.ok(typeof governance.generatedAt === 'string');
    assert.ok(governance.generatedAt.length > 0);
  });

  it('should load governance with summary fields all numeric', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 5,
                approvalsWithFailures: 2,
                highRiskAudits: 3,
                blockedLedgers: 1,
                rotationDueSecrets: 0,
                expiredSecrets: 0,
                expiringCertificates: 2,
                expiredCertificates: 0,
                degradedSignals: 2,
                attentionRecoveryPlans: 1,
                staleDrills: 1,
                runtimeGovernanceBacklog: 8,
                stalledRuntimeCallbacks: 3,
                highRiskRuntimeBacklog: 2,
                runtimeBlockedActions: 1
              },
              alerts: [
                { code: 'ALERT-001', severity: 'high', summary: '审批堆积', triageState: 'needs-triage' }
              ],
              topRisks: [
                { severity: 'high', code: 'approvals-pending', count: 5, summary: '待处理审批', triageState: 'needs-triage' }
              ]
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();

    assert.equal(typeof governance.summary.approvalsPending, 'number');
    assert.equal(typeof governance.summary.approvalsWithFailures, 'number');
    assert.equal(typeof governance.summary.highRiskAudits, 'number');
    assert.equal(typeof governance.summary.blockedLedgers, 'number');
    assert.equal(typeof governance.summary.rotationDueSecrets, 'number');
    assert.equal(typeof governance.summary.expiredSecrets, 'number');
    assert.equal(typeof governance.summary.expiringCertificates, 'number');
    assert.equal(typeof governance.summary.expiredCertificates, 'number');
    assert.equal(typeof governance.summary.degradedSignals, 'number');
    assert.equal(typeof governance.summary.attentionRecoveryPlans, 'number');
    assert.equal(typeof governance.summary.staleDrills, 'number');
    assert.equal(typeof governance.summary.runtimeGovernanceBacklog, 'number');
    assert.equal(typeof governance.summary.stalledRuntimeCallbacks, 'number');
    assert.equal(typeof governance.summary.highRiskRuntimeBacklog, 'number');
    assert.equal(typeof governance.summary.runtimeBlockedActions, 'number');
  });

  it('should load governance from API with actual summary values', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T12:00:00.000Z',
              summary: {
                approvalsPending: 5,
                approvalsWithFailures: 2,
                highRiskAudits: 3,
                blockedLedgers: 1,
                rotationDueSecrets: 0,
                expiredSecrets: 0,
                expiringCertificates: 2,
                expiredCertificates: 0,
                degradedSignals: 2,
                attentionRecoveryPlans: 1,
                staleDrills: 1,
                runtimeGovernanceBacklog: 8,
                stalledRuntimeCallbacks: 3,
                highRiskRuntimeBacklog: 2,
                runtimeBlockedActions: 1
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T12:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.summary.approvalsPending, 5);
    assert.equal(governance.summary.approvalsWithFailures, 2);
    assert.equal(governance.summary.highRiskAudits, 3);
    assert.equal(governance.summary.runtimeGovernanceBacklog, 8);
    assert.equal(governance.summary.stalledRuntimeCallbacks, 3);
    assert.equal(governance.generatedAt, '2026-06-23T12:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// 治理概览 — 空状态
// ---------------------------------------------------------------------------

describe('治理概览空状态', () => {
  it('should handle all-zero summary (empty state)', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
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
                staleDrills: 0,
                runtimeGovernanceBacklog: 0,
                stalledRuntimeCallbacks: 0,
                highRiskRuntimeBacklog: 0,
                runtimeBlockedActions: 0
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.summary.approvalsPending, 0);
    assert.equal(governance.summary.highRiskAudits, 0);
    assert.equal(governance.summary.runtimeGovernanceBacklog, 0);
    assert.ok(Array.isArray(governance.alerts));
    assert.ok(Array.isArray(governance.topRisks));
  });

  it('should return fallback empty when API returns no data', async () => {
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.deliveryMode, 'fallback');
    assert.ok(typeof governance.summary === 'object');
    // fallback should never crash
    assert.ok(governance.summary.approvalsPending >= 0);
  });
});

// ---------------------------------------------------------------------------
// 治理概览 — 错误状态
// ---------------------------------------------------------------------------

describe('治理概览错误状态', () => {
  it('should handle 503 Service Unavailable gracefully', async () => {
    globalThis.fetch = (async () => new Response('Service Unavailable', { status: 503 })) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.deliveryMode, 'fallback');
    assert.ok(typeof governance.generatedAt === 'string');
    assert.ok(governance.topRisks.length >= 0);
  });

  it('should handle network error (fetch throws) gracefully', async () => {
    globalThis.fetch = (async () => { throw new Error('ECONNREFUSED'); }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.deliveryMode, 'fallback');
    assert.ok(governance.generatedAt.length > 0);
  });

  it('should handle malformed JSON response', async () => {
    globalThis.fetch = (async () =>
      new Response('not json {{{', { status: 200, headers: { 'content-type': 'application/json' } })
    ) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.deliveryMode, 'fallback');
  });

  it('should handle response with missing summary fields', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {},
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.deliveryMode, 'fallback');
    assert.ok(typeof governance.summary === 'object');
  });
});

// ---------------------------------------------------------------------------
// Callback 队列 / 堆积数
// ---------------------------------------------------------------------------

describe('Callback 队列和堆积数', () => {
  it('should report runtimeGovernanceBacklog correctly', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0,
                blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0,
                expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0,
                attentionRecoveryPlans: 0, staleDrills: 0,
                runtimeGovernanceBacklog: 42,
                stalledRuntimeCallbacks: 7,
                highRiskRuntimeBacklog: 5,
                runtimeBlockedActions: 3
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.summary.runtimeGovernanceBacklog, 42);
    assert.equal(governance.summary.stalledRuntimeCallbacks, 7);
    assert.equal(governance.summary.highRiskRuntimeBacklog, 5);
    assert.equal(governance.summary.runtimeBlockedActions, 3);
  });

  it('should handle high backlog edge case', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 999, approvalsWithFailures: 50, highRiskAudits: 100,
                blockedLedgers: 20, rotationDueSecrets: 10, expiredSecrets: 5,
                expiringCertificates: 8, expiredCertificates: 3, degradedSignals: 12,
                attentionRecoveryPlans: 7, staleDrills: 15,
                runtimeGovernanceBacklog: 9999,
                stalledRuntimeCallbacks: 500,
                highRiskRuntimeBacklog: 300,
                runtimeBlockedActions: 100
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.ok(governance.summary.runtimeGovernanceBacklog >= 0);
    assert.ok(governance.summary.stalledRuntimeCallbacks >= 0);
    assert.ok(governance.summary.runtimeBlockedActions >= 0);
  });

  it('should have stalled callbacks ≤ total backlog', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0,
                blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0,
                expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0,
                attentionRecoveryPlans: 0, staleDrills: 0,
                runtimeGovernanceBacklog: 10,
                stalledRuntimeCallbacks: 3,
                highRiskRuntimeBacklog: 2,
                runtimeBlockedActions: 1
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.ok(governance.summary.stalledRuntimeCallbacks <= governance.summary.runtimeGovernanceBacklog);
    assert.ok(governance.summary.highRiskRuntimeBacklog <= governance.summary.runtimeGovernanceBacklog);
  });
});

// ---------------------------------------------------------------------------
// 审批管线状态
// ---------------------------------------------------------------------------

describe('审批管线状态', () => {
  it('should report approvalsPending and approvalsWithFailures', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 12,
                approvalsWithFailures: 3,
                highRiskAudits: 5,
                blockedLedgers: 2,
                rotationDueSecrets: 0, expiredSecrets: 0,
                expiringCertificates: 0, expiredCertificates: 0,
                degradedSignals: 0, attentionRecoveryPlans: 0,
                staleDrills: 0, runtimeGovernanceBacklog: 0,
                stalledRuntimeCallbacks: 0, highRiskRuntimeBacklog: 0,
                runtimeBlockedActions: 0
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.summary.approvalsPending, 12);
    assert.equal(governance.summary.approvalsWithFailures, 3);
    assert.equal(governance.summary.highRiskAudits, 5);
    assert.equal(governance.summary.blockedLedgers, 2);
  });

  it('should have zero blocked ledgers when everything is clean', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0,
                blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0,
                expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 0,
                attentionRecoveryPlans: 0, staleDrills: 0,
                runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0,
                highRiskRuntimeBacklog: 0, runtimeBlockedActions: 0
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.summary.blockedLedgers, 0);
    assert.equal(governance.summary.rotationDueSecrets, 0);
    assert.equal(governance.summary.expiredSecrets, 0);
    assert.equal(governance.summary.expiredCertificates, 0);
  });

  it('should report secret and certificate health correctly', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0,
                blockedLedgers: 0, rotationDueSecrets: 3, expiredSecrets: 1,
                expiringCertificates: 5, expiredCertificates: 2, degradedSignals: 4,
                attentionRecoveryPlans: 2, staleDrills: 6,
                runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0,
                highRiskRuntimeBacklog: 0, runtimeBlockedActions: 0
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.summary.rotationDueSecrets, 3);
    assert.equal(governance.summary.expiredSecrets, 1);
    assert.equal(governance.summary.expiringCertificates, 5);
    assert.equal(governance.summary.expiredCertificates, 2);
  });

  it('should report degraded signals and recovery plans correctly', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 0, approvalsWithFailures: 0, highRiskAudits: 0,
                blockedLedgers: 0, rotationDueSecrets: 0, expiredSecrets: 0,
                expiringCertificates: 0, expiredCertificates: 0,
                degradedSignals: 7,
                attentionRecoveryPlans: 4,
                staleDrills: 9,
                runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0,
                highRiskRuntimeBacklog: 0, runtimeBlockedActions: 0
              },
              alerts: [],
              topRisks: []
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.equal(governance.summary.degradedSignals, 7);
    assert.equal(governance.summary.attentionRecoveryPlans, 4);
    assert.equal(governance.summary.staleDrills, 9);
  });
});

// ---------------------------------------------------------------------------
// 治理概览 — top risks
// ---------------------------------------------------------------------------

describe('治理概览 Top Risks', () => {
  it('should include top risks array', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 4, approvalsWithFailures: 1, highRiskAudits: 2,
                blockedLedgers: 1, rotationDueSecrets: 0, expiredSecrets: 0,
                expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 1,
                attentionRecoveryPlans: 0, staleDrills: 0,
                runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0,
                highRiskRuntimeBacklog: 0, runtimeBlockedActions: 0
              },
              alerts: [],
              topRisks: [
                { severity: 'high', code: 'approvals-pending', count: 4, summary: '存在待处理审批', triageState: 'needs-triage' },
                { severity: 'medium', code: 'audit-high-risk', count: 2, summary: '高风险审计项', triageState: 'triaging' }
              ]
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    assert.ok(Array.isArray(governance.topRisks));
    assert.ok(governance.topRisks.length >= 2);
    assert.equal(governance.topRisks[0]?.severity, 'high');
    assert.equal(governance.topRisks[1]?.severity, 'medium');
  });

  it('should have each top risk with required fields', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/foundation/overview')) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              generatedAt: '2026-06-23T00:00:00.000Z',
              summary: {
                approvalsPending: 4, approvalsWithFailures: 1, highRiskAudits: 2,
                blockedLedgers: 1, rotationDueSecrets: 0, expiredSecrets: 0,
                expiringCertificates: 0, expiredCertificates: 0, degradedSignals: 1,
                attentionRecoveryPlans: 0, staleDrills: 0,
                runtimeGovernanceBacklog: 0, stalledRuntimeCallbacks: 0,
                highRiskRuntimeBacklog: 0, runtimeBlockedActions: 0
              },
              alerts: [
                { code: 'ALERT-001', severity: 'high', summary: '审批堆积', triageState: 'needs-triage' }
              ],
              topRisks: [
                { severity: 'high', code: 'approvals-pending', count: 4, summary: '存在待处理审批', triageState: 'needs-triage', recentOperation: null },
                { severity: 'medium', code: 'audit-high-risk', count: 2, summary: '高风险审计项', triageState: 'triaging', recentOperation: 'audit-review' },
                { severity: 'low', code: 'drill-stale', count: 1, summary: '演练过期', triageState: 'triaged', recentOperation: 'drill-scheduled' }
              ]
            },
            timestamp: '2026-06-23T00:00:00.000Z'
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response('boom', { status: 500 });
    }) as typeof fetch;

    const governance = await loadAdminGovernanceReadModel();
    for (const risk of governance.topRisks) {
      assert.ok(typeof risk.code === 'string' && risk.code.length > 0);
      assert.ok(typeof risk.severity === 'string');
      assert.ok(typeof risk.count === 'number' && risk.count > 0);
      assert.ok(typeof risk.summary === 'string' && risk.summary.length > 0);
      assert.ok(typeof risk.triageState === 'string');
    }
  });
});

// ---------------------------------------------------------------------------
// 治理与操作中心联动
// ---------------------------------------------------------------------------

describe('治理看板与操作中心联动', () => {
  it('should route to operations from governance context', async () => {
    assert.equal(adminRuntimeOperationsRoute.href, '/operations');
  });
});
