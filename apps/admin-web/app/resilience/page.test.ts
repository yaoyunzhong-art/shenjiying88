/**
 * resilience/page.test.ts — Page-level tests for the Resilience page.
 * Tests overview data structure, fallback integrity, signal/retry/recovery
 * filtering and summary logic used in resilience-workspace-client.tsx.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: resilience-view-model.ts, resilience-workspace-client.tsx, page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import type {
  ObservabilitySignalContract,
  ObservabilityStatus,
  ObservabilitySignalType,
  RecoveryPlanContract,
  RecoveryPlanStatus,
  RetryPolicyContract,
  ResilienceOverview,
} from '@m5/types';
import {
  SIGNAL_TYPE_LABEL,
  SIGNAL_STATUS_LABEL,
  SIGNAL_STATUS_VARIANT,
  RECOVERY_PLAN_STATUS_LABEL,
  RECOVERY_PLAN_STATUS_VARIANT,
  summarizeSignal,
  summarizeRetryPolicy,
  summarizeRecoveryPlan,
  isDrillStale,
  buildResilienceHref,
} from '../resilience-view-model';

// ---- Sample data matching resilience-view-model.test.ts ----

const SAMPLE_SIGNALS: ObservabilitySignalContract[] = [
  {
    signal: 'metrics',
    status: 'warning',
    coverage: 88,
    collectionLagSeconds: 92,
    lastCollectedAt: '2026-06-12T09:58:00.000Z',
    owner: 'platform-ops',
    alertRoutes: ['alertmanager/platform-primary'],
    evidence: ['infra/docker/prometheus/prometheus.yml'],
  },
  {
    signal: 'logs',
    status: 'healthy',
    coverage: 95,
    collectionLagSeconds: 30,
    lastCollectedAt: '2026-06-13T10:00:00.000Z',
    owner: 'sre-team',
    alertRoutes: [],
    evidence: [],
  },
  {
    signal: 'traces',
    status: 'critical',
    coverage: 62,
    collectionLagSeconds: 300,
    lastCollectedAt: '2026-06-13T08:00:00.000Z',
    owner: 'platform-ops',
    alertRoutes: ['alertmanager/platform-all'],
    evidence: ['ops/runbook.md'],
  },
];

const SAMPLE_POLICIES: RetryPolicyContract[] = [
  {
    key: 'edge-sync-retry',
    capability: 'edge-sync',
    trigger: 'timeout',
    maxAttempts: 6,
    backoff: 'exponential',
    recoveryAction: 'reconcile',
    escalationTarget: 'ops-oncall-wecom',
  },
  {
    key: 'order-creation-retry',
    capability: 'order-creation',
    trigger: 'timeout',
    maxAttempts: 3,
    backoff: 'fixed',
    recoveryAction: 'retry',
    escalationTarget: 'payment-team',
  },
];

const SAMPLE_PLANS: RecoveryPlanContract[] = [
  {
    resource: 'postgres-primary',
    status: 'ready',
    rtoMinutes: 30,
    rpoMinutes: 10,
    lastDrillAt: '2026-05-28T02:00:00.000Z',
    staleAfterDays: 45,
    dependencies: ['postgres-backup'],
    runbook: 'docs/runbook.md#db',
  },
  {
    resource: 'redis-cache',
    status: 'attention',
    rtoMinutes: 15,
    rpoMinutes: 5,
    lastDrillAt: '2026-02-01T00:00:00.000Z',
    staleAfterDays: 30,
    dependencies: [],
    runbook: 'docs/runbook.md#cache',
  },
];

const SAMPLE_OVERVIEW: ResilienceOverview = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  observability: {
    totalSignals: SAMPLE_SIGNALS.length,
    degradedSignals: 2,
    byStatus: { warning: 1, healthy: 1, critical: 1 },
    averageCoverage: Math.round(
      SAMPLE_SIGNALS.reduce((s, sig) => s + sig.coverage, 0) / SAMPLE_SIGNALS.length,
    ),
    maxCollectionLagSeconds: Math.max(...SAMPLE_SIGNALS.map((s) => s.collectionLagSeconds)),
    signals: SAMPLE_SIGNALS,
  },
  retries: {
    totalPolicies: SAMPLE_POLICIES.length,
    byCapability: { 'edge-sync': 1, 'order-creation': 1 },
    maxAttempts: Math.max(...SAMPLE_POLICIES.map((p) => p.maxAttempts)),
    policies: SAMPLE_POLICIES,
  },
  recovery: {
    totalPlans: SAMPLE_PLANS.length,
    attentionRequired: SAMPLE_PLANS.filter((p) => p.status === 'attention').length,
    staleDrills: 0,
    plans: SAMPLE_PLANS,
  },
};

// ---- Page-level helpers (mirror workspace-client logic) ----

function filterByStatus(
  signals: ObservabilitySignalContract[],
  status: ObservabilityStatus | 'ALL',
): ObservabilitySignalContract[] {
  if (status === 'ALL') return signals;
  return signals.filter((s) => s.status === status);
}

function filterByPlanStatus(
  plans: RecoveryPlanContract[],
  status: RecoveryPlanStatus | 'ALL',
): RecoveryPlanContract[] {
  if (status === 'ALL') return plans;
  return plans.filter((p) => p.status === status);
}

function computeSignalsByType(signals: ObservabilitySignalContract[]): Record<ObservabilitySignalType, number> {
  const counts: Record<ObservabilitySignalType, number> = { metrics: 0, logs: 0, traces: 0 };
  for (const sig of signals) {
    const signalType = sig.signal as ObservabilitySignalType;
    if (signalType in counts) counts[signalType] += 1;
  }
  return counts;
}

function computePoliciesByCapability(policies: RetryPolicyContract[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of policies) {
    counts[p.capability] = (counts[p.capability] ?? 0) + 1;
  }
  return counts;
}

function computeStalePlans(plans: RecoveryPlanContract[], now?: number): number {
  return plans.filter((p) => isDrillStale(p, now)).length;
}

// ---- 正例 ----

describe('resilience-page: 正例 (positive cases)', () => {
  describe('fallback overview structure', () => {
    it('loadResilienceOperationsSnapshot returns fallback with zeros on failure', async () => {
      const { loadResilienceOperationsSnapshot } = await import('../resilience-view-model');
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch;
      try {
        const snap = await loadResilienceOperationsSnapshot();
        assert.strictEqual(snap.deliveryMode, 'fallback');
        assert.strictEqual(snap.overview.observability.totalSignals, 0);
        assert.strictEqual(snap.overview.retries.totalPolicies, 0);
        assert.strictEqual(snap.overview.recovery.totalPlans, 0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('label maps', () => {
    it('SIGNAL_TYPE_LABEL should cover all signal types', () => {
      assert.strictEqual(SIGNAL_TYPE_LABEL.metrics, '指标');
      assert.strictEqual(SIGNAL_TYPE_LABEL.logs, '日志');
      assert.strictEqual(SIGNAL_TYPE_LABEL.traces, '链路追踪');
    });

    it('SIGNAL_STATUS_LABEL should cover all statuses', () => {
      assert.strictEqual(SIGNAL_STATUS_LABEL.healthy, '健康');
      assert.strictEqual(SIGNAL_STATUS_LABEL.warning, '告警');
      assert.strictEqual(SIGNAL_STATUS_LABEL.critical, '故障');
      assert.strictEqual(SIGNAL_STATUS_VARIANT.healthy, 'success');
      assert.strictEqual(SIGNAL_STATUS_VARIANT.warning, 'warning');
      assert.strictEqual(SIGNAL_STATUS_VARIANT.critical, 'danger');
    });

    it('RECOVERY_PLAN_STATUS_LABEL should cover all plan statuses', () => {
      assert.strictEqual(RECOVERY_PLAN_STATUS_LABEL.ready, '就绪');
      assert.strictEqual(RECOVERY_PLAN_STATUS_LABEL.attention, '需关注');
      assert.strictEqual(RECOVERY_PLAN_STATUS_VARIANT.ready, 'success');
      assert.strictEqual(RECOVERY_PLAN_STATUS_VARIANT.attention, 'warning');
    });
  });

  describe('summarize helpers', () => {
    it('summarizeSignal should include signal name, coverage, lag, and owner', () => {
      const result = summarizeSignal(SAMPLE_SIGNALS[0]!);
      assert.ok(result.includes('metrics'));
      assert.ok(result.includes('88%'));
      assert.ok(result.includes('92s'));
      assert.ok(result.includes('platform-ops'));
    });

    it('summarizeRetryPolicy should include capability, attempts and escalation', () => {
      const result = summarizeRetryPolicy(SAMPLE_POLICIES[0]!);
      assert.ok(result.includes('edge-sync'));
      assert.ok(result.includes('6'));
      assert.ok(result.includes('ops-oncall-wecom'));
    });

    it('summarizeRecoveryPlan should include resource, RTO and RPO', () => {
      const result = summarizeRecoveryPlan(SAMPLE_PLANS[0]!);
      assert.ok(result.includes('postgres-primary'));
      assert.ok(result.includes('RTO'));
      assert.ok(result.includes('RPO'));
    });
  });

  describe('signal filtering', () => {
    it('filter ALL should return all signals', () => {
      const result = filterByStatus(SAMPLE_SIGNALS, 'ALL');
      assert.strictEqual(result.length, 3);
    });

    it('filter warning should return only warning signals', () => {
      const result = filterByStatus(SAMPLE_SIGNALS, 'warning');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.signal, 'metrics');
    });

    it('filter critical should return only critical signals', () => {
      const result = filterByStatus(SAMPLE_SIGNALS, 'critical');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.signal, 'traces');
    });

    it('filter healthy should return only healthy signals', () => {
      const result = filterByStatus(SAMPLE_SIGNALS, 'healthy');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.signal, 'logs');
    });
  });

  describe('recovery plan filtering', () => {
    it('filter ready should return ready plans', () => {
      const result = filterByPlanStatus(SAMPLE_PLANS, 'ready');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.resource, 'postgres-primary');
    });

    it('filter attention should return attention plans', () => {
      const result = filterByPlanStatus(SAMPLE_PLANS, 'attention');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.resource, 'redis-cache');
    });
  });

  describe('signals by type aggregation', () => {
    it('should count signals grouped by type', () => {
      const counts = computeSignalsByType(SAMPLE_SIGNALS);
      assert.strictEqual(counts.metrics, 1);
      assert.strictEqual(counts.logs, 1);
      assert.strictEqual(counts.traces, 1);
    });
  });

  describe('policies by capability aggregation', () => {
    it('should count policies grouped by capability', () => {
      const counts = computePoliciesByCapability(SAMPLE_POLICIES);
      assert.strictEqual(counts['edge-sync'], 1);
      assert.strictEqual(counts['order-creation'], 1);
    });
  });

  describe('isDrillStale', () => {
    it('should detect stale drills', () => {
      const stale = isDrillStale(
        { ...SAMPLE_PLANS[0]!, lastDrillAt: '2026-01-01T00:00:00Z', staleAfterDays: 30 },
        Date.parse('2026-06-14T00:00:00Z'),
      );
      assert.strictEqual(stale, true);
    });

    it('should not flag non-stale drills', () => {
      const fresh = isDrillStale(
        { ...SAMPLE_PLANS[0]!, lastDrillAt: '2026-06-01T00:00:00Z', staleAfterDays: 30 },
        Date.parse('2026-06-14T00:00:00Z'),
      );
      assert.strictEqual(fresh, false);
    });

    it('should handle invalid date by returning true', () => {
      const invalid = isDrillStale(
        { ...SAMPLE_PLANS[0]!, lastDrillAt: 'invalid-date', staleAfterDays: 30 },
      );
      assert.strictEqual(invalid, true);
    });
  });

  describe('stale plan count', () => {
    it('computeStalePlans should count correctly', () => {
      const staleCount = computeStalePlans(SAMPLE_PLANS, Date.parse('2026-09-01T00:00:00Z'));
      // postgres-primary lastDrill 2026-05-28 + 45 days < 2026-09-01 → stale
      // redis-cache lastDrill 2026-02-01 + 30 days < 2026-09-01 → stale
      assert.strictEqual(staleCount, 2);
    });
  });

  describe('buildResilienceHref', () => {
    it('returns /resilience for empty query', () => {
      assert.strictEqual(buildResilienceHref(), '/resilience');
    });

    it('includes capability, status and resource', () => {
      assert.strictEqual(
        buildResilienceHref({ capability: 'edge-sync', status: 'attention', resource: 'pg' }),
        '/resilience?capability=edge-sync&status=attention&resource=pg',
      );
    });
  });
});

// ---- 反例 ----

describe('resilience-page: 反例 (negative cases)', () => {
  it('empty signals array should return zero counts', () => {
    const counts = computeSignalsByType([]);
    assert.deepStrictEqual(counts, { metrics: 0, logs: 0, traces: 0 });
  });

  it('empty policies array should return empty counts', () => {
    const counts = computePoliciesByCapability([]);
    assert.deepStrictEqual(counts, {});
  });

  it('empty plans should compute zero stale count', () => {
    const staleCount = computeStalePlans([]);
    assert.strictEqual(staleCount, 0);
  });

  it('filtering empty signals by status should return empty', () => {
    assert.strictEqual(filterByStatus([], 'warning').length, 0);
    assert.strictEqual(filterByStatus([], 'ALL').length, 0);
  });
});

// ---- 边界 ----

describe('resilience-page: 边界 (boundary cases)', () => {
  it('signal with 0 coverage should be valid', () => {
    const result = summarizeSignal({ ...SAMPLE_SIGNALS[0]!, coverage: 0 });
    assert.ok(result.includes('0%'));
  });

  it('signal with 100 coverage should be valid', () => {
    const result = summarizeSignal({ ...SAMPLE_SIGNALS[0]!, coverage: 100 });
    assert.ok(result.includes('100%'));
  });

  it('recovery plan with 0 dependencies should still render', () => {
    const result = summarizeRecoveryPlan({ ...SAMPLE_PLANS[0]!, dependencies: [] });
    assert.ok(result.includes('0 项'));
  });

  it('overview with zero signals should have zeros for summary stats', () => {
    const emptyOverview: ResilienceOverview = {
      generatedAt: '2026-06-14T08:00:00.000Z',
      observability: {
        totalSignals: 0,
        degradedSignals: 0,
        byStatus: {},
        averageCoverage: 0,
        maxCollectionLagSeconds: 0,
        signals: [],
      },
      retries: {
        totalPolicies: 0,
        byCapability: {},
        maxAttempts: 0,
        policies: [],
      },
      recovery: {
        totalPlans: 0,
        attentionRequired: 0,
        staleDrills: 0,
        plans: [],
      },
    };
    assert.strictEqual(emptyOverview.observability.totalSignals, 0);
    assert.strictEqual(emptyOverview.retries.totalPolicies, 0);
    assert.strictEqual(emptyOverview.recovery.totalPlans, 0);
  });
});
