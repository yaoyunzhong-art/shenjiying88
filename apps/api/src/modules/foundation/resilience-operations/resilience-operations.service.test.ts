import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ResilienceOperationsService } from './resilience-operations.service'

describe('ResilienceOperationsService', () => {
  const service = new ResilienceOperationsService()

  describe('getObservabilitySignals', () => {
    test('returns all three signals when no filter is provided', () => {
      const signals = service.getObservabilitySignals()
      assert.equal(signals.length, 3)
      const signalNames = signals.map((s) => s.signal).sort()
      assert.deepEqual(signalNames, ['logs', 'metrics', 'traces'])
    })

    test('filters by status when provided', () => {
      const healthy = service.getObservabilitySignals({ status: 'healthy' })
      assert.equal(healthy.length, 1)
      assert.equal(healthy[0]!.signal, 'metrics')

      const warnings = service.getObservabilitySignals({ status: 'warning' })
      assert.equal(warnings.length, 2)
      warnings.forEach((s) => assert.equal(s.status, 'warning'))
    })

    test('returns empty array for unknown status', () => {
      const result = service.getObservabilitySignals({ status: 'critical' })
      assert.equal(result.length, 0)
    })

    test('each signal has required fields', () => {
      const signals = service.getObservabilitySignals()
      for (const s of signals) {
        assert.ok(s.signal)
        assert.ok(s.status)
        assert.ok(typeof s.coverage === 'number')
        assert.ok(typeof s.collectionLagSeconds === 'number')
        assert.ok(s.lastCollectedAt)
        assert.ok(s.owner)
        assert.ok(Array.isArray(s.alertRoutes))
        assert.ok(Array.isArray(s.evidence))
      }
    })
  })

  describe('listRetryPolicies', () => {
    test('returns all three policies when no filter is provided', () => {
      const policies = service.listRetryPolicies()
      assert.equal(policies.length, 3)
    })

    test('filters by capability', () => {
      const edgePolicies = service.listRetryPolicies({ capability: 'edge-sync' })
      assert.equal(edgePolicies.length, 1)
      assert.equal(edgePolicies[0]!.key, 'edge-sync-retry')
    })

    test('returns empty when capability does not match', () => {
      const result = service.listRetryPolicies({ capability: 'nonexistent' })
      assert.equal(result.length, 0)
    })

    test('each policy has required fields', () => {
      const policies = service.listRetryPolicies()
      for (const p of policies) {
        assert.ok(p.key)
        assert.ok(p.capability)
        assert.ok(p.trigger)
        assert.ok(typeof p.maxAttempts === 'number')
        assert.ok(p.backoff)
        assert.ok(p.recoveryAction)
        assert.ok(p.escalationTarget)
      }
    })
  })

  describe('listRecoveryPlans', () => {
    test('returns all three plans when no filter is provided', () => {
      const plans = service.listRecoveryPlans()
      assert.equal(plans.length, 3)
    })

    test('filters by status', () => {
      const ready = service.listRecoveryPlans({ status: 'ready' })
      assert.equal(ready.length, 2)
      ready.forEach((p) => assert.equal(p.status, 'ready'))

      const attention = service.listRecoveryPlans({ status: 'attention' })
      assert.equal(attention.length, 1)
      assert.equal(attention[0]!.resource, 'edge-sync-pipeline')
    })

    test('each plan has required fields', () => {
      const plans = service.listRecoveryPlans()
      for (const p of plans) {
        assert.ok(p.resource)
        assert.ok(p.status)
        assert.ok(typeof p.rtoMinutes === 'number')
        assert.ok(typeof p.rpoMinutes === 'number')
        assert.ok(p.lastDrillAt)
        assert.ok(typeof p.staleAfterDays === 'number')
        assert.ok(Array.isArray(p.dependencies))
        assert.ok(p.runbook)
      }
    })
  })

  describe('describeRecoveryPlan', () => {
    test('returns plan details for known resource', () => {
      const result = service.describeRecoveryPlan('postgres-primary')
      assert.equal(result.status, 'ready')
      assert.equal(result.resource, 'postgres-primary')
      assert.ok(result.plan)
      assert.ok(result.plan?.rtoMinutes)
    })

    test('returns attention status for unknown resource', () => {
      const result = service.describeRecoveryPlan('unknown-resource')
      assert.equal(result.status, 'attention')
      assert.equal(result.resource, 'unknown-resource')
      assert.equal(result.plan, null)
    })

    test('baseline includes expected recovery steps', () => {
      const result = service.describeRecoveryPlan('observability-stack')
      assert.ok(result.baseline.includes('backup'))
      assert.ok(result.baseline.includes('restore-drill'))
    })
  })

  describe('stageEdgeReplay', () => {
    test('returns staged replay with storeId and operationCount', () => {
      const result = service.stageEdgeReplay('store-42', 128)
      assert.equal(result.status, 'staged')
      assert.equal(result.storeId, 'store-42')
      assert.equal(result.operationCount, 128)
    })

    test('includes replay pipeline steps in order', () => {
      const result = service.stageEdgeReplay('store-1', 1)
      assert.deepEqual(result.replayPipeline, [
        'local-queue',
        'network-recovery',
        'reconciliation',
        'conflict-review'
      ])
    })

    test('attaches edge-sync retry policy', () => {
      const result = service.stageEdgeReplay('store-1', 5)
      assert.ok(result.retryPolicy)
      assert.equal(result.retryPolicy?.key, 'edge-sync-retry')
    })

    test('attaches edge-sync-pipeline recovery plan', () => {
      const result = service.stageEdgeReplay('store-1', 10)
      assert.ok(result.recoveryPlan)
      assert.equal(result.recoveryPlan?.resource, 'edge-sync-pipeline')
    })

    test('includes observability hooks', () => {
      const result = service.stageEdgeReplay('store-1', 3)
      assert.ok(Array.isArray(result.observabilityHooks))
      assert.ok(result.observabilityHooks.some((h) => h.includes('metrics')))
      assert.ok(result.observabilityHooks.some((h) => h.includes('logs')))
      assert.ok(result.observabilityHooks.some((h) => h.includes('traces')))
    })
  })

  describe('getManagementMetadata', () => {
    test('returns four governance metadata entries', () => {
      const metadata = service.getManagementMetadata()
      assert.equal(metadata.length, 4)
    })

    test('each entry has operation and rbac fields', () => {
      const metadata = service.getManagementMetadata()
      for (const entry of metadata) {
        assert.ok(entry.operation)
        assert.ok(entry.rbac)
        assert.ok(entry.rbac.resource)
        assert.ok(entry.rbac.action)
        assert.ok(Array.isArray(entry.rbac.requiredRoles))
        assert.ok(Array.isArray(entry.rbac.requiredPermissions))
      }
    })

    test('includes read operations for observability, retry-policy, and recovery-plan', () => {
      const metadata = service.getManagementMetadata()
      const readOps = metadata.filter((m) => m.rbac.action === 'read')
      assert.equal(readOps.length, 3)
    })

    test('includes write operation for edge-replay', () => {
      const metadata = service.getManagementMetadata()
      const writeOps = metadata.filter((m) => m.rbac.action === 'write')
      assert.equal(writeOps.length, 1)
      assert.equal(writeOps[0]!.rbac.resource, 'edge-replay')
    })
  })

  describe('getOperationsOverview', () => {
    test('returns overview with generatedAt timestamp', () => {
      const overview = service.getOperationsOverview()
      assert.ok(overview.generatedAt)
      assert.ok(Date.parse(overview.generatedAt) > 0)
    })

    test('observability section has required aggregates', () => {
      const overview = service.getOperationsOverview()
      assert.equal(overview.observability.totalSignals, 3)
      assert.equal(overview.observability.degradedSignals, 2)
      assert.ok(typeof overview.observability.averageCoverage === 'number')
      assert.ok(typeof overview.observability.maxCollectionLagSeconds === 'number')
      assert.ok(Array.isArray(overview.observability.signals))
    })

    test('retries section has required aggregates', () => {
      const overview = service.getOperationsOverview()
      assert.equal(overview.retries.totalPolicies, 3)
      assert.ok(typeof overview.retries.maxAttempts === 'number')
      assert.ok(Array.isArray(overview.retries.policies))
    })

    test('recovery section identifies stale drills', () => {
      const overview = service.getOperationsOverview()
      assert.equal(overview.recovery.totalPlans, 3)
      assert.equal(overview.recovery.attentionRequired, 1)
      // edge-sync-pipeline last drill 2026-04-01, stale after 30 days -> stale
      assert.equal(overview.recovery.staleDrills, 1)
    })

    test('byStatus maps are populated', () => {
      const overview = service.getOperationsOverview()
      assert.ok(overview.observability.byStatus)
      assert.ok(overview.retries.byCapability)
    })
  })

  describe('getGovernanceBaselines', () => {
    test('returns three governance baselines', () => {
      const baselines = service.getGovernanceBaselines()
      assert.equal(baselines.length, 3)
    })

    test('each baseline has required fields', () => {
      const baselines = service.getGovernanceBaselines()
      for (const b of baselines) {
        assert.ok(b.key)
        assert.ok(b.name)
        assert.ok(b.ownerModule)
        assert.ok(b.summary)
        assert.ok(Array.isArray(b.controls))
        assert.ok(Array.isArray(b.evidence))
        assert.ok(b.controls.length > 0)
      }
    })

    test('all baselines belong to resilience-operations module', () => {
      const baselines = service.getGovernanceBaselines()
      baselines.forEach((b) => assert.equal(b.ownerModule, 'resilience-operations'))
    })
  })

  describe('getDescriptor', () => {
    test('returns descriptor with correct module key', () => {
      const descriptor = service.getDescriptor()
      assert.equal(descriptor.key, 'resilience-operations')
      assert.equal(descriptor.name, 'Resilience Operations Module')
    })

    test('has three capabilities', () => {
      const descriptor = service.getDescriptor()
      assert.equal(descriptor.capabilities.length, 3)
    })

    test('each capability has required fields', () => {
      const descriptor = service.getDescriptor()
      for (const cap of descriptor.capabilities) {
        assert.ok(cap.key)
        assert.ok(cap.name)
        assert.ok(Array.isArray(cap.responsibilities))
        assert.ok(Array.isArray(cap.entrypoints))
        assert.ok(Array.isArray(cap.consumers))
        assert.ok(cap.status)
      }
    })

    test('edge-sync capability is active', () => {
      const descriptor = service.getDescriptor()
      const edgeSync = descriptor.capabilities.find((c) => c.key === 'edge-sync')
      assert.ok(edgeSync)
      assert.equal(edgeSync?.status, 'active')
    })
  })
})
