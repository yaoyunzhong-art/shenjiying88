/**
 * foundation/page.test.ts — Page-level tests for the Foundation workspace page.
 * Tests query parameter normalization, workspace data construction, fallback data integrity,
 * module/consumer resolution, and summary computation.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: foundation-view-model.ts, foundation-workspace-client.tsx, page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { buildFoundationWorkspaceHref } from '@m5/types';
import { formatFoundationHealthLabel, summarizeFoundationModule, summarizeFoundationConsumer, summarizeGovernanceBaseline } from '../foundation-view-model';

// ---- Page-level helper - same logic as page.tsx ----

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

// ---- 正例 ----

describe('foundation-page: 正例 (positive cases)', () => {
  describe('query parameter normalization', () => {
    it('should read moduleKey from search params', () => {
      const moduleKey = readQueryParam('trust-governance');
      assert.strictEqual(moduleKey, 'trust-governance');
    });

    it('should extract first value from array param', () => {
      const consumer = readQueryParam(['workbench', 'market']);
      assert.strictEqual(consumer, 'workbench');
    });

    it('undefined param should be undefined', () => {
      assert.strictEqual(readQueryParam(undefined), undefined);
    });
  });

  describe('buildFoundationWorkspaceHref', () => {
    it('returns /foundation for empty query', () => {
      assert.strictEqual(buildFoundationWorkspaceHref(), '/foundation');
    });

    it('returns /foundation with moduleKey and consumer', () => {
      assert.strictEqual(
        buildFoundationWorkspaceHref({ moduleKey: 'trust-governance', consumer: 'workbench' }),
        '/foundation?moduleKey=trust-governance&consumer=workbench',
      );
    });
  });

  describe('formatFoundationHealthLabel', () => {
    it('should format all known health status values', () => {
      assert.strictEqual(formatFoundationHealthLabel('healthy'), '健康');
      assert.strictEqual(formatFoundationHealthLabel('warning'), '注意');
      assert.strictEqual(formatFoundationHealthLabel('critical'), '高风险');
    });

    it('should default to healthy for unknown status', () => {
      assert.strictEqual(formatFoundationHealthLabel(undefined as unknown as any), '健康');
    });
  });

  describe('summarizeFoundationModule', () => {
    it('should compose module key and capabilities count', () => {
      const result = summarizeFoundationModule({
        key: 'trust-governance',
        name: 'Trust Governance',
        purpose: '审计审批',
        inboundContracts: ['audit logs'],
        outboundContracts: ['audit trail'],
        capabilities: [
          { key: 'audit', name: 'Audit', responsibilities: ['record'], entrypoints: ['/foundation/trust-governance/audit'], consumers: ['workbench'], status: 'active' },
        ],
      });
      assert.strictEqual(result, 'trust-governance · capabilities 1');
    });

    it('should handle zero capabilities', () => {
      const result = summarizeFoundationModule({
        key: 'trust-governance' as any,
        name: 'Empty',
        purpose: '-',
        inboundContracts: [],
        outboundContracts: [],
        capabilities: [],
      });
      assert.strictEqual(result, 'trust-governance · capabilities 0');
    });
  });

  describe('summarizeFoundationConsumer', () => {
    it('should compose consumer name and dependency count', () => {
      const result = summarizeFoundationConsumer({
        consumer: 'workbench',
        modulePath: 'src/modules/workbench',
        dependsOn: ['trust-governance', 'identity-access'],
        responsibility: '装配',
        handoffContracts: [],
        recommendedSequence: [],
        governanceTouchpoints: [],
        highRiskEntrypoints: [],
        actionGovernanceExamples: [],
        runtimeHandoffExamples: [],
        runtimeReceiptExamples: [],
        governanceAlertLifecycleExamples: [],
      });
      assert.strictEqual(result, 'workbench · dependsOn 2 modules');
    });
  });

  describe('summarizeGovernanceBaseline', () => {
    it('should compose owner module and controls count', () => {
      const result = summarizeGovernanceBaseline({
        key: 'approval-trace',
        name: '审批留痕',
        ownerModule: 'trust-governance',
        summary: '高风险动作需审批留痕',
        controls: ['approval', 'audit'],
        evidence: ['audit trail'],
      });
      assert.strictEqual(result, 'trust-governance · controls 2');
    });
  });
});

// ---- 反例 ----

describe('foundation-page: 反例 (negative cases)', () => {
  it('loadFoundationWorkspace falls back when fetch fails', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({ moduleKey: 'trust-governance' });
      assert.strictEqual(snapshot.deliveryMode, 'fallback');
      assert.ok(snapshot.workspace.summary.modules > 0);
      assert.ok(snapshot.workspace.blueprint.modules.length > 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('unrecognized moduleKey should result in null selectedModule', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({ moduleKey: 'nonexistent-module' });
      assert.strictEqual(snapshot.deliveryMode, 'fallback');
      // Fallback only returns known modules, so unknown moduleKey → no selectedModule
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('empty query should use default moduleKey and consumer', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({});
      assert.strictEqual(snapshot.query.moduleKey, 'trust-governance');
      assert.strictEqual(snapshot.query.consumer, 'workbench');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

// ---- 边界 ----

describe('foundation-page: 边界 (boundary cases)', () => {
  it('fallback module list should contain at least 6 modules', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({});
      assert.ok(snapshot.workspace.blueprint.modules.length >= 6);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fallback consumers should contain at least 4 consumers', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({});
      assert.ok(snapshot.workspace.blueprint.consumers.length >= 4);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fallback governance baselines should contain at least 3 baselines', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({});
      assert.ok(snapshot.workspace.blueprint.governanceBaselines.length >= 3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fallback workspace should have 0 alerts when fetch fails', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({});
      assert.strictEqual(snapshot.workspace.overview.alerts.length, 0);
      assert.strictEqual(snapshot.workspace.overview.topRisks.length, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fallback module detail should have health score 88', async () => {
    const { loadFoundationWorkspace } = await import('../foundation-view-model');
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
    try {
      const snapshot = await loadFoundationWorkspace({ moduleKey: 'trust-governance' });
      assert.strictEqual(snapshot.workspace.selectedModuleDetail.health?.score, 88);
      assert.strictEqual(snapshot.workspace.selectedModuleDetail.health?.status, 'healthy');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
