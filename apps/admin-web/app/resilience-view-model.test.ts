import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  type ObservabilitySignalContract,
  type RecoveryPlanContract,
  type ResilienceOverview,
  type RetryPolicyContract,
  buildResilienceHref
} from '@m5/types'
import {
  RECOVERY_PLAN_STATUS_LABEL,
  RECOVERY_PLAN_STATUS_VARIANT,
  SIGNAL_STATUS_LABEL,
  SIGNAL_STATUS_VARIANT,
  SIGNAL_TYPE_LABEL,
  isDrillStale,
  loadResilienceOperationsSnapshot,
  summarizeRecoveryPlan,
  summarizeRetryPolicy,
  summarizeSignal
} from './resilience-view-model'

const SAMPLE_SIGNAL: ObservabilitySignalContract = {
  signal: 'metrics',
  status: 'warning',
  coverage: 88,
  collectionLagSeconds: 92,
  lastCollectedAt: '2026-06-12T09:58:00.000Z',
  owner: 'platform-ops',
  alertRoutes: ['alertmanager/platform-primary'],
  evidence: ['infra/docker/prometheus/prometheus.yml']
}

const SAMPLE_POLICY: RetryPolicyContract = {
  key: 'edge-sync-retry',
  capability: 'edge-sync',
  trigger: 'timeout',
  maxAttempts: 6,
  backoff: 'exponential',
  recoveryAction: 'reconcile',
  escalationTarget: 'ops-oncall-wecom'
}

const SAMPLE_PLAN: RecoveryPlanContract = {
  resource: 'postgres-primary',
  status: 'ready',
  rtoMinutes: 30,
  rpoMinutes: 10,
  lastDrillAt: '2026-05-28T02:00:00.000Z',
  staleAfterDays: 45,
  dependencies: ['postgres-backup'],
  runbook: 'docs/runbook.md#db'
}

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
}

describe('resilience-view-model', () => {
  test('buildResilienceHref omits empty query', () => {
    assert.equal(buildResilienceHref(), '/resilience')
  })

  test('buildResilienceHref includes capability/status/resource', () => {
    assert.equal(
      buildResilienceHref({ capability: 'edge-sync', status: 'attention', resource: 'pg' }),
      '/resilience?capability=edge-sync&status=attention&resource=pg'
    )
  })

  test('label/variant maps cover healthy/warning/critical/ready/attention', () => {
    assert.equal(SIGNAL_STATUS_LABEL.healthy, '健康')
    assert.equal(SIGNAL_STATUS_LABEL.warning, '告警')
    assert.equal(SIGNAL_STATUS_LABEL.critical, '故障')
    assert.equal(SIGNAL_STATUS_VARIANT.healthy, 'success')
    assert.equal(SIGNAL_STATUS_VARIANT.warning, 'warning')
    assert.equal(SIGNAL_STATUS_VARIANT.critical, 'danger')
    assert.equal(RECOVERY_PLAN_STATUS_LABEL.ready, '就绪')
    assert.equal(RECOVERY_PLAN_STATUS_LABEL.attention, '需关注')
    assert.equal(RECOVERY_PLAN_STATUS_VARIANT.ready, 'success')
    assert.equal(RECOVERY_PLAN_STATUS_VARIANT.attention, 'warning')
    assert.equal(SIGNAL_TYPE_LABEL.metrics, '指标')
  })

  test('summarize helpers compose contextual descriptions', () => {
    assert.ok(summarizeSignal(SAMPLE_SIGNAL).includes('metrics'))
    assert.ok(summarizeSignal(SAMPLE_SIGNAL).includes('88%'))
    assert.ok(summarizeRetryPolicy(SAMPLE_POLICY).includes('edge-sync'))
    assert.ok(summarizeRetryPolicy(SAMPLE_POLICY).includes('6 次'))
    assert.ok(summarizeRecoveryPlan(SAMPLE_PLAN).includes('postgres-primary'))
    assert.ok(summarizeRecoveryPlan(SAMPLE_PLAN).includes('RTO'))
  })

  test('isDrillStale respects staleAfterDays threshold', () => {
    const nowEarly = Date.parse('2026-08-01T00:00:00.000Z')
    const nowLate = Date.parse('2026-09-15T00:00:00.000Z')
    const stalePlan: RecoveryPlanContract = {
      ...SAMPLE_PLAN,
      lastDrillAt: '2026-04-01T00:00:00.000Z',
      staleAfterDays: 30
    }
    const freshPlan: RecoveryPlanContract = {
      ...SAMPLE_PLAN,
      lastDrillAt: '2026-07-15T00:00:00.000Z',
      staleAfterDays: 30
    }
    assert.equal(isDrillStale(stalePlan, nowEarly), true)
    assert.equal(isDrillStale(freshPlan, nowEarly), false)
    assert.equal(isDrillStale(freshPlan, nowLate), true)
  })

  test('loadResilienceOperationsSnapshot returns fallback when fetch fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch
    try {
      const snapshot = await loadResilienceOperationsSnapshot()
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.equal(snapshot.overview.observability.totalSignals, 0)
      assert.equal(snapshot.overview.retries.totalPolicies, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadResilienceOperationsSnapshot returns API delivery when SDK returns overview', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch
    try {
      const snapshot = await loadResilienceOperationsSnapshot()
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.overview.observability.signals.length, 1)
      assert.equal(snapshot.overview.retries.policies[0]?.key, 'edge-sync-retry')
      assert.equal(snapshot.overview.recovery.plans[0]?.resource, 'postgres-primary')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
