import assert from 'node:assert/strict'
import test from 'node:test'
import { ResilienceOperationsService } from './resilience-operations.service'

test('contract: resilience operations exposes observability, retry, and recovery overview', () => {
  const service = new ResilienceOperationsService()
  const overview = service.getOperationsOverview() as {
    observability: { totalSignals: number; degradedSignals: number; signals: Array<{ signal: string }> }
    retries: { totalPolicies: number; policies: Array<{ key: string }> }
    recovery: { totalPlans: number; attentionRequired: number; plans: Array<{ resource: string }> }
  }

  assert.equal(overview.observability.totalSignals >= 3, true)
  assert.equal(overview.observability.degradedSignals >= 1, true)
  assert.equal(overview.observability.signals.some((signal) => signal.signal === 'traces'), true)
  assert.equal(overview.retries.totalPolicies >= 3, true)
  assert.equal(overview.retries.policies.some((policy) => policy.key === 'edge-sync-retry'), true)
  assert.equal(overview.recovery.totalPlans >= 3, true)
  assert.equal(overview.recovery.attentionRequired >= 1, true)
  assert.equal(overview.recovery.plans.some((plan) => plan.resource === 'edge-sync-pipeline'), true)
})
