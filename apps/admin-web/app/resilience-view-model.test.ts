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

const HEALTHY_SIGNAL: ObservabilitySignalContract = {
  signal: 'logs',
  status: 'healthy',
  coverage: 99,
  collectionLagSeconds: 5,
  lastCollectedAt: '2026-06-14T08:00:00.000Z',
  owner: 'platform-ops',
  alertRoutes: ['alertmanager/platform-logs'],
  evidence: ['infra/docker/loki/loki-config.yml']
}

const CRITICAL_SIGNAL: ObservabilitySignalContract = {
  signal: 'traces',
  status: 'critical',
  coverage: 45,
  collectionLagSeconds: 300,
  lastCollectedAt: '2026-06-13T22:00:00.000Z',
  owner: 'sre-team',
  alertRoutes: ['alertmanager/platform-primary', 'pagerduty/sre'],
  evidence: ['infra/docker/tempo/tempo-config.yml']
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

const LINEAR_POLICY: RetryPolicyContract = {
  key: 'api-retry',
  capability: 'api-gateway',
  trigger: '5xx',
  maxAttempts: 3,
  backoff: 'linear',
  recoveryAction: 'retry-same',
  escalationTarget: 'ops-oncall-email'
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

const ATTENTION_PLAN: RecoveryPlanContract = {
  resource: 'redis-cluster',
  status: 'attention',
  rtoMinutes: 5,
  rpoMinutes: 1,
  lastDrillAt: '2026-03-01T00:00:00.000Z',
  staleAfterDays: 30,
  dependencies: ['redis-node-1', 'redis-node-2', 'sentinel'],
  runbook: 'docs/runbook.md#redis'
}

const SAMPLE_OVERVIEW: ResilienceOverview = {
  generatedAt: '2026-06-14T08:00:00.000Z',
  observability: {
    totalSignals: 3,
    degradedSignals: 2,
    byStatus: { warning: 1, healthy: 1, critical: 1 },
    averageCoverage: 77,
    maxCollectionLagSeconds: 300,
    signals: [SAMPLE_SIGNAL, HEALTHY_SIGNAL, CRITICAL_SIGNAL]
  },
  retries: {
    totalPolicies: 2,
    byCapability: { 'edge-sync': 1, 'api-gateway': 1 },
    maxAttempts: 6,
    policies: [SAMPLE_POLICY, LINEAR_POLICY]
  },
  recovery: {
    totalPlans: 2,
    attentionRequired: 1,
    staleDrills: 1,
    plans: [SAMPLE_PLAN, ATTENTION_PLAN]
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

  test('buildResilienceHref includes only capability', () => {
    assert.equal(
      buildResilienceHref({ capability: 'api-gateway' }),
      '/resilience?capability=api-gateway'
    )
  })

  test('buildResilienceHref includes only resource', () => {
    assert.equal(
      buildResilienceHref({ resource: 'postgres-primary' }),
      '/resilience?resource=postgres-primary'
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

  test('SIGNAL_TYPE_LABEL covers all signal types', () => {
    assert.equal(SIGNAL_TYPE_LABEL.metrics, '指标')
    assert.equal(SIGNAL_TYPE_LABEL.logs, '日志')
    assert.equal(SIGNAL_TYPE_LABEL.traces, '链路追踪')
  })

  test('summarize helpers compose contextual descriptions', () => {
    assert.ok(summarizeSignal(SAMPLE_SIGNAL).includes('metrics'))
    assert.ok(summarizeSignal(SAMPLE_SIGNAL).includes('88%'))
    assert.ok(summarizeRetryPolicy(SAMPLE_POLICY).includes('edge-sync'))
    assert.ok(summarizeRetryPolicy(SAMPLE_POLICY).includes('6 次'))
    assert.ok(summarizeRecoveryPlan(SAMPLE_PLAN).includes('postgres-primary'))
    assert.ok(summarizeRecoveryPlan(SAMPLE_PLAN).includes('RTO'))
  })

  test('summarizeSignal includes coverage, lag and owner', () => {
    const summary = summarizeSignal(SAMPLE_SIGNAL)
    assert.ok(summary.includes('metrics'))
    assert.ok(summary.includes('88%'))
    assert.ok(summary.includes('92s'))
    assert.ok(summary.includes('platform-ops'))
  })

  test('summarizeSignal handles healthy signal', () => {
    const summary = summarizeSignal(HEALTHY_SIGNAL)
    assert.ok(summary.includes('logs'))
    assert.ok(summary.includes('99%'))
    assert.ok(summary.includes('5s'))
  })

  test('summarizeSignal handles critical signal', () => {
    const summary = summarizeSignal(CRITICAL_SIGNAL)
    assert.ok(summary.includes('traces'))
    assert.ok(summary.includes('45%'))
    assert.ok(summary.includes('300s'))
  })

  test('summarizeRetryPolicy includes backoff type and escalation', () => {
    const summary = summarizeRetryPolicy(SAMPLE_POLICY)
    assert.ok(summary.includes('exponential'))
    assert.ok(summary.includes('ops-oncall-wecom'))
    const linearSummary = summarizeRetryPolicy(LINEAR_POLICY)
    assert.ok(linearSummary.includes('linear'))
    assert.ok(linearSummary.includes('ops-oncall-email'))
  })

  test('summarizeRetryPolicy includes maxAttempts count', () => {
    const summary = summarizeRetryPolicy(SAMPLE_POLICY)
    assert.ok(summary.includes('6'))
    const linearSummary = summarizeRetryPolicy(LINEAR_POLICY)
    assert.ok(linearSummary.includes('3'))
  })

  test('summarizeRecoveryPlan includes RTO/RPO and dependencies count', () => {
    const summary = summarizeRecoveryPlan(SAMPLE_PLAN)
    assert.ok(summary.includes('RTO 30m'))
    assert.ok(summary.includes('RPO 10m'))
    assert.ok(summary.includes('1 项'))
  })

  test('summarizeRecoveryPlan handles attention plan with multiple dependencies', () => {
    const summary = summarizeRecoveryPlan(ATTENTION_PLAN)
    assert.ok(summary.includes('redis-cluster'))
    assert.ok(summary.includes('RTO 5m'))
    assert.ok(summary.includes('RPO 1m'))
    assert.ok(summary.includes('3 项'))
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

  test('isDrillStale returns true for invalid date', () => {
    const invalidPlan: RecoveryPlanContract = {
      ...SAMPLE_PLAN,
      lastDrillAt: 'invalid-date',
      staleAfterDays: 30
    }
    assert.equal(isDrillStale(invalidPlan), true)
  })

  test('isDrillStale returns true when lastDrillAt is empty', () => {
    const emptyDrill: RecoveryPlanContract = {
      ...SAMPLE_PLAN,
      lastDrillAt: '',
      staleAfterDays: 30
    }
    assert.equal(isDrillStale(emptyDrill), true)
  })

  test('isDrillStale handles zero staleAfterDays', () => {
    const neverStale: RecoveryPlanContract = {
      ...SAMPLE_PLAN,
      staleAfterDays: 0
    }
    assert.equal(isDrillStale(neverStale), true)
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
      assert.equal(snapshot.overview.observability.signals.length, 3)
      assert.equal(snapshot.overview.retries.policies[0]?.key, 'edge-sync-retry')
      assert.equal(snapshot.overview.recovery.plans[0]?.resource, 'postgres-primary')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadResilienceOperationsSnapshot API delivery includes all signals', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch
    try {
      const snapshot = await loadResilienceOperationsSnapshot()
      const signalTypes = snapshot.overview.observability.signals.map(s => s.signal)
      assert.ok(signalTypes.includes('metrics'))
      assert.ok(signalTypes.includes('logs'))
      assert.ok(signalTypes.includes('traces'))
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadResilienceOperationsSnapshot API delivery includes degraded count', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 'OK', message: '', data: SAMPLE_OVERVIEW }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch
    try {
      const snapshot = await loadResilienceOperationsSnapshot()
      assert.equal(snapshot.overview.observability.degradedSignals, 2)
      assert.equal(snapshot.overview.recovery.attentionRequired, 1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadResilienceOperationsSnapshot fallback has empty observability', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => { throw new Error('server down') }) as typeof fetch
    try {
      const snapshot = await loadResilienceOperationsSnapshot()
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.deepEqual(snapshot.overview.observability.byStatus, {})
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadResilienceOperationsSnapshot fallback has zero metrics', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => { throw new Error('timeout') }) as typeof fetch
    try {
      const snapshot = await loadResilienceOperationsSnapshot()
      assert.equal(snapshot.overview.observability.averageCoverage, 0)
      assert.equal(snapshot.overview.retries.maxAttempts, 0)
      assert.equal(snapshot.overview.recovery.staleDrills, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
