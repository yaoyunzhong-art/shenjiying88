import { test } from 'node:test';
import assert from 'node:assert/strict';
import type {
  ObservabilitySignalContract,
  RecoveryPlanContract,
  ResilienceOverview,
  RetryPolicyContract
} from '@m5/types';
import {
  loadResilienceSignalDetail,
  loadResilienceRetryPolicyDetail,
  loadResilienceRecoveryPlanDetail
} from './resilience-detail-view-model';

const SAMPLE_SIGNAL: ObservabilitySignalContract = {
  signal: 'metrics',
  status: 'warning',
  coverage: 88,
  collectionLagSeconds: 92,
  lastCollectedAt: '2026-06-12T09:58:00.000Z',
  owner: 'platform-ops',
  alertRoutes: ['alertmanager/platform-primary'],
  evidence: ['infra/docker/prometheus/prometheus.yml']
};

const SAMPLE_POLICY: RetryPolicyContract = {
  key: 'edge-sync-retry',
  capability: 'edge-sync',
  trigger: 'timeout',
  maxAttempts: 6,
  backoff: 'exponential',
  recoveryAction: 'reconcile',
  escalationTarget: 'ops-oncall-wecom'
};

const SAMPLE_PLAN: RecoveryPlanContract = {
  resource: 'postgres-primary',
  status: 'ready',
  rtoMinutes: 30,
  rpoMinutes: 10,
  lastDrillAt: '2026-05-28T02:00:00.000Z',
  staleAfterDays: 45,
  dependencies: ['postgres-backup'],
  runbook: 'docs/runbook.md#db'
};

const SAMPLE_OVERVIEW: ResilienceOverview = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  observability: {
    totalSignals: 1,
    degradedSignals: 1,
    byStatus: { warning: 1 },
    averageCoverage: 88,
    maxCollectionLagSeconds: 92,
    signals: [SAMPLE_SIGNAL]
  },
  retries: {
    totalPolicies: 1,
    byCapability: { 'edge-sync': 1 },
    maxAttempts: 6,
    policies: [SAMPLE_POLICY]
  },
  recovery: {
    totalPlans: 1,
    attentionRequired: 0,
    staleDrills: 0,
    plans: [SAMPLE_PLAN]
  }
};

function envelope(payload: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ code: 'OK', message: '', data: payload }),
    text: async () => JSON.stringify({ code: 'OK', message: '', data: payload })
  } as Response;
}

function mockOverviewFetch(overview: ResilienceOverview) {
  return (async () => envelope(overview)) as typeof fetch;
}

function mockFetchReject() {
  return (async () => {
    throw new Error('network down');
  }) as typeof fetch;
}

test('resilience-detail-view-model: signal detail returns matched record', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewFetch(SAMPLE_OVERVIEW);
  try {
    const snapshot = await loadResilienceSignalDetail('metrics', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.signal, 'metrics');
    assert.equal(snapshot.record?.owner, 'platform-ops');
    assert.equal(snapshot.signalHref, '/resilience/signals/metrics');
    assert.match(snapshot.auditHref, /purpose=resilience-signal/);
    assert.match(snapshot.foundationHref, /moduleKey=resilience-operations/);
    assert.equal(snapshot.workspaceHref, '/resilience');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resilience-detail-view-model: signal detail flags notFound when signal missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewFetch(SAMPLE_OVERVIEW);
  try {
    const snapshot = await loadResilienceSignalDetail('unknown-signal', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resilience-detail-view-model: retry policy detail returns matched record', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewFetch(SAMPLE_OVERVIEW);
  try {
    const snapshot = await loadResilienceRetryPolicyDetail('edge-sync-retry', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.key, 'edge-sync-retry');
    assert.equal(snapshot.record?.maxAttempts, 6);
    assert.equal(snapshot.retryPolicyHref, '/resilience/retries/edge-sync-retry');
    assert.match(snapshot.auditHref, /purpose=resilience-retry/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resilience-detail-view-model: retry policy detail flags notFound when key missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewFetch(SAMPLE_OVERVIEW);
  try {
    const snapshot = await loadResilienceRetryPolicyDetail('not-in-overview', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resilience-detail-view-model: recovery plan detail returns matched record', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewFetch(SAMPLE_OVERVIEW);
  try {
    const snapshot = await loadResilienceRecoveryPlanDetail('postgres-primary', {}, {});
    assert.equal(snapshot.notFound, false);
    assert.equal(snapshot.record?.resource, 'postgres-primary');
    assert.equal(snapshot.record?.rtoMinutes, 30);
    assert.equal(snapshot.recoveryPlanHref, '/resilience/recovery/postgres-primary');
    assert.match(snapshot.auditHref, /purpose=resilience-recovery/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resilience-detail-view-model: recovery plan detail flags notFound when resource missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockOverviewFetch(SAMPLE_OVERVIEW);
  try {
    const snapshot = await loadResilienceRecoveryPlanDetail('unknown-resource', {}, {});
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.record, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resilience-detail-view-model: all three loaders fall back to empty workspace on fetch failure', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchReject();
  try {
    const signal = await loadResilienceSignalDetail('metrics', {}, {});
    assert.equal(signal.deliveryMode, 'fallback');
    assert.equal(signal.notFound, true);
    assert.equal(signal.record, null);

    const retry = await loadResilienceRetryPolicyDetail('edge-sync-retry', {}, {});
    assert.equal(retry.deliveryMode, 'fallback');
    assert.equal(retry.notFound, true);
    assert.equal(retry.record, null);

    const recovery = await loadResilienceRecoveryPlanDetail('postgres-primary', {}, {});
    assert.equal(recovery.deliveryMode, 'fallback');
    assert.equal(recovery.notFound, true);
    assert.equal(recovery.record, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
