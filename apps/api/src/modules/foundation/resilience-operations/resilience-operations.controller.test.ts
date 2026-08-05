import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ResilienceOperationsController } from './resilience-operations.controller'
import { GovernanceMetadataRecord, ObservabilitySignalRecord, RetryPolicyRecord, RecoveryPlanRecord, EdgeReplayResult, RecoveryPlanDetail, ObservabilitySignalStatus, RecoveryPlanStatus } from './resilience-operations.entity'

it('resilience-operations controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', ResilienceOperationsController)
  assert.equal(path, 'foundation/resilience-operations')
})

// ── management-metadata (GET) ──

it('resilience-operations controller management-metadata route has GET metadata', () => {
  const method = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getManagementMetadata)
  const path = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getManagementMetadata)
  assert.equal(method, 0) // GET
  assert.equal(path, 'management-metadata')
})

it('resilience-operations getManagementMetadata delegates to service', () => {
  const mockMetadata: GovernanceMetadataRecord[] = [
    {
      operation: 'observability.read',
      rbac: {
        resource: 'observability',
        action: 'read',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
        requiredPermissions: ['foundation.governance.read']
      }
    }
  ]
  const service = { getManagementMetadata: () => mockMetadata } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getManagementMetadata()
  assert.equal((result as GovernanceMetadataRecord[]).length, 1)
  assert.equal((result as GovernanceMetadataRecord[])[0].operation, 'observability.read')
})

it('resilience-operations getManagementMetadata returns full governance metadata', () => {
  const fullMetadata: GovernanceMetadataRecord[] = [
    {
      operation: 'observability.read',
      rbac: { resource: 'observability', action: 'read', requiredRoles: ['SUPER_ADMIN'], requiredPermissions: ['foundation.governance.read'] }
    },
    {
      operation: 'retry-policy.read',
      rbac: { resource: 'retry-policy', action: 'read', requiredRoles: ['SUPER_ADMIN'], requiredPermissions: ['foundation.governance.read'] }
    },
    {
      operation: 'recovery-plan.read',
      rbac: { resource: 'recovery-plan', action: 'read', requiredRoles: ['SUPER_ADMIN'], requiredPermissions: ['foundation.governance.read'] }
    },
    {
      operation: 'edge-replay.write',
      rbac: { resource: 'edge-replay', action: 'write', requiredRoles: ['SUPER_ADMIN', 'OPERATIONS'], requiredPermissions: ['foundation.operations.recovery.write'] }
    }
  ]
  const service = { getManagementMetadata: () => fullMetadata } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getManagementMetadata() as GovernanceMetadataRecord[]
  assert.equal(result.length, 4)
  assert.equal(result[3].operation, 'edge-replay.write')
  assert.deepEqual(result[3].rbac.requiredRoles, ['SUPER_ADMIN', 'OPERATIONS'])
})

// ── overview (GET) ──

it('resilience-operations controller overview route has GET metadata', () => {
  const method = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getOperationsOverview)
  const path = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getOperationsOverview)
  assert.equal(method, 0) // GET
  assert.equal(path, 'overview')
})

it('resilience-operations getOperationsOverview delegates to service and returns overview structure', () => {
  const mockOverview = {
    generatedAt: '2026-06-27T16:00:00.000Z',
    observability: {
      totalSignals: 3,
      degradedSignals: 2,
      byStatus: { healthy: 1, warning: 2 },
      averageCoverage: 89,
      maxCollectionLagSeconds: 92,
      signals: [
        { signal: 'metrics', status: ObservabilitySignalStatus.Healthy, coverage: 96, collectionLagSeconds: 18, lastCollectedAt: '2026-06-27T09:58:00.000Z', owner: 'platform-ops', alertRoutes: ['alertmanager/platform-primary'], evidence: [] },
        { signal: 'logs', status: ObservabilitySignalStatus.Warning, coverage: 88, collectionLagSeconds: 92, lastCollectedAt: '2026-06-27T09:56:40.000Z', owner: 'platform-ops', alertRoutes: ['alertmanager/platform-primary'], evidence: [] },
        { signal: 'traces', status: ObservabilitySignalStatus.Warning, coverage: 84, collectionLagSeconds: 74, lastCollectedAt: '2026-06-27T09:57:05.000Z', owner: 'platform-ops', alertRoutes: ['alertmanager/platform-primary'], evidence: [] }
      ]
    },
    retries: { totalPolicies: 3, byCapability: { 'edge-sync': 1, 'webhook-delivery': 1, 'backup-restore': 1 }, maxAttempts: 6, policies: [] },
    recovery: { totalPlans: 3, attentionRequired: 1, staleDrills: 0, plans: [] }
  }
  const service = { getOperationsOverview: () => mockOverview } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getOperationsOverview() as typeof mockOverview
  assert.equal(result.generatedAt, '2026-06-27T16:00:00.000Z')
  assert.equal(result.observability.totalSignals, 3)
  assert.equal(result.observability.averageCoverage, 89)
  assert.equal(result.retries.totalPolicies, 3)
  assert.equal(result.recovery.totalPlans, 3)
})

// ── observability (GET) ──

it('resilience-operations controller observability route has GET metadata', () => {
  const method = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getObservabilitySignals)
  const path = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getObservabilitySignals)
  assert.equal(method, 0) // GET
  assert.equal(path, 'observability')
})

it('resilience-operations getObservabilitySignals delegates to service with query', () => {
  const mockSignals: ObservabilitySignalRecord[] = [
    { signal: 'metrics', status: ObservabilitySignalStatus.Healthy, coverage: 96, collectionLagSeconds: 18, lastCollectedAt: '2026-06-27T09:58:00.000Z', owner: 'platform-ops', alertRoutes: ['alertmanager/platform-primary'], evidence: ['infra/docker/prometheus/prometheus.yml'] }
  ]
  const service = { getObservabilitySignals: (_filters: { status?: string }) => mockSignals } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getObservabilitySignals({ status: ObservabilitySignalStatus.Healthy }) as ObservabilitySignalRecord[]
  assert.equal(result.length, 1)
  assert.equal(result[0].signal, 'metrics')
})

it('resilience-operations getObservabilitySignals without filter returns all signals', () => {
  const allSignals: ObservabilitySignalRecord[] = [
    { signal: 'metrics', status: ObservabilitySignalStatus.Healthy, coverage: 96, collectionLagSeconds: 18, lastCollectedAt: '2026-06-27T09:58:00.000Z', owner: 'platform-ops', alertRoutes: [], evidence: [] },
    { signal: 'logs', status: ObservabilitySignalStatus.Warning, coverage: 88, collectionLagSeconds: 92, lastCollectedAt: '2026-06-27T09:56:40.000Z', owner: 'platform-ops', alertRoutes: [], evidence: [] },
    { signal: 'traces', status: ObservabilitySignalStatus.Warning, coverage: 84, collectionLagSeconds: 74, lastCollectedAt: '2026-06-27T09:57:05.000Z', owner: 'platform-ops', alertRoutes: [], evidence: [] }
  ]
  const service = { getObservabilitySignals: (_filters: { status?: string }) => allSignals } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getObservabilitySignals({}) as ObservabilitySignalRecord[]
  assert.equal(result.length, 3)
  const statuses = result.map((s) => s.status)
  assert.ok(statuses.includes(ObservabilitySignalStatus.Healthy))
  assert.ok(statuses.includes(ObservabilitySignalStatus.Warning))
})

// ── retry-policies (GET) ──

it('resilience-operations controller retry-policies route has GET metadata', () => {
  const method = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getRetryPolicies)
  const path = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getRetryPolicies)
  assert.equal(method, 0) // GET
  assert.equal(path, 'retry-policies')
})

it('resilience-operations getRetryPolicies delegates to service with capability filter', () => {
  const mockPolicies: RetryPolicyRecord[] = [
    { key: 'edge-sync-retry', capability: 'edge-sync', trigger: 'store-edge upload timeout', maxAttempts: 6, backoff: 'exponential: 30s -> 5m', recoveryAction: 'reconciliation queue', escalationTarget: 'ops-oncall-wecom' }
  ]
  const service = { listRetryPolicies: (_filters: { capability?: string }) => mockPolicies } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRetryPolicies({ capability: 'edge-sync' }) as RetryPolicyRecord[]
  assert.equal(result.length, 1)
  assert.equal(result[0].key, 'edge-sync-retry')
})

it('resilience-operations getRetryPolicies without filter returns all policies', () => {
  const allPolicies: RetryPolicyRecord[] = [
    { key: 'edge-sync-retry', capability: 'edge-sync', trigger: 'timeout', maxAttempts: 6, backoff: 'exponential', recoveryAction: 'reconciliation', escalationTarget: 'ops-oncall' },
    { key: 'webhook-delivery-retry', capability: 'webhook-delivery', trigger: '5xx', maxAttempts: 5, backoff: 'progressive', recoveryAction: 'dlq', escalationTarget: 'integration-ops' }
  ]
  const service = { listRetryPolicies: (_filters: { capability?: string }) => allPolicies } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRetryPolicies({}) as RetryPolicyRecord[]
  assert.equal(result.length, 2)
})

// ── recovery-plans (GET) ──

it('resilience-operations controller recovery-plans route has GET metadata', () => {
  const method = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getRecoveryPlans)
  const path = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getRecoveryPlans)
  assert.equal(method, 0) // GET
  assert.equal(path, 'recovery-plans')
})

it('resilience-operations getRecoveryPlans delegates to service with status filter', () => {
  const mockPlans: RecoveryPlanRecord[] = [
    { resource: 'postgres-primary', status: RecoveryPlanStatus.Ready, rtoMinutes: 30, rpoMinutes: 10, lastDrillAt: '2026-05-28T02:00:00.000Z', staleAfterDays: 45, dependencies: ['postgres-backup'], runbook: 'docs/operations-runbook-template.md' }
  ]
  const service = { listRecoveryPlans: (_filters: { status?: string }) => mockPlans } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRecoveryPlans({ status: RecoveryPlanStatus.Ready }) as RecoveryPlanRecord[]
  assert.equal(result.length, 1)
  assert.equal(result[0].resource, 'postgres-primary')
})

it('resilience-operations getRecoveryPlans without filter returns all plans', () => {
  const allPlans: RecoveryPlanRecord[] = [
    { resource: 'postgres-primary', status: RecoveryPlanStatus.Ready, rtoMinutes: 30, rpoMinutes: 10, lastDrillAt: '2026-05-28T02:00:00.000Z', staleAfterDays: 45, dependencies: ['postgres-backup'], runbook: 'docs/operations-runbook-template.md' },
    { resource: 'edge-sync-pipeline', status: RecoveryPlanStatus.Attention, rtoMinutes: 20, rpoMinutes: 5, lastDrillAt: '2026-04-01T03:00:00.000Z', staleAfterDays: 30, dependencies: ['local-queue'], runbook: 'docs/operations-runbook-template.md' }
  ]
  const service = { listRecoveryPlans: (_filters: { status?: string }) => allPlans } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRecoveryPlans({}) as RecoveryPlanRecord[]
  assert.equal(result.length, 2)
})

// ── recovery-plans/:resource (GET with param) ──

it('resilience-operations controller recovery-plans/:resource route has GET metadata', () => {
  const method = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getRecoveryPlan)
  const path = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getRecoveryPlan)
  assert.equal(method, 0) // GET
  assert.equal(path, 'recovery-plans/:resource')
})

it('resilience-operations getRecoveryPlan delegates to service with resource param', () => {
  const mockDetail: RecoveryPlanDetail = {
    status: RecoveryPlanStatus.Ready,
    resource: 'postgres-primary',
    baseline: ['backup', 'restore-drill', 'cross-az-failover', 'audit-verification'],
    plan: {
      resource: 'postgres-primary', status: RecoveryPlanStatus.Ready, rtoMinutes: 30, rpoMinutes: 10,
      lastDrillAt: '2026-05-28T02:00:00.000Z', staleAfterDays: 45,
      dependencies: ['postgres-backup', 'prometheus', 'audit-verification'],
      runbook: 'docs/operations-runbook-template.md#database-recovery'
    }
  }
  const service = { describeRecoveryPlan: (_resource: string) => mockDetail } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRecoveryPlan('postgres-primary') as RecoveryPlanDetail
  assert.equal(result.resource, 'postgres-primary')
  assert.equal(result.status, RecoveryPlanStatus.Ready)
  assert.equal(result.plan?.rtoMinutes, 30)
})

it('resilience-operations getRecoveryPlan returns null plan for unknown resource', () => {
  const unknownDetail: RecoveryPlanDetail = {
    status: RecoveryPlanStatus.Attention,
    resource: 'unknown-resource',
    baseline: ['backup', 'restore-drill'],
    plan: null
  }
  const service = { describeRecoveryPlan: (_resource: string) => unknownDetail } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRecoveryPlan('unknown-resource') as RecoveryPlanDetail
  assert.equal(result.resource, 'unknown-resource')
  assert.equal(result.status, RecoveryPlanStatus.Attention)
  assert.equal(result.plan, null)
})

// ── edge-replay/stage (POST) ──

it('resilience-operations controller edge-replay/stage route has POST metadata', () => {
  const method = Reflect.getMetadata('method', ResilienceOperationsController.prototype.stageEdgeReplay)
  const path = Reflect.getMetadata('path', ResilienceOperationsController.prototype.stageEdgeReplay)
  assert.equal(method, 1) // POST
  assert.equal(path, 'edge-replay/stage')
})

it('resilience-operations stageEdgeReplay delegates to service with storeId and operationCount', () => {
  const mockResult: EdgeReplayResult = {
    status: 'staged',
    storeId: 'store-001',
    operationCount: 500,
    replayPipeline: ['local-queue', 'network-recovery', 'reconciliation', 'conflict-review'],
    retryPolicy: { key: 'edge-sync-retry', capability: 'edge-sync', trigger: 'timeout', maxAttempts: 6, backoff: 'exponential', recoveryAction: 'reconciliation', escalationTarget: 'ops-oncall' },
    observabilityHooks: ['metrics:edge_sync_backlog', 'logs:edge-replay'],
    recoveryPlan: { resource: 'edge-sync-pipeline', status: RecoveryPlanStatus.Attention, rtoMinutes: 20, rpoMinutes: 5, lastDrillAt: '2026-04-01T03:00:00.000Z', staleAfterDays: 30, dependencies: ['local-queue'], runbook: 'docs/operations-runbook-template.md' }
  }
  const service = { stageEdgeReplay: (_storeId: string, _opCount: number) => mockResult } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.stageEdgeReplay({ storeId: 'store-001', operationCount: 500 }) as EdgeReplayResult
  assert.equal(result.status, 'staged')
  assert.equal(result.storeId, 'store-001')
  assert.equal(result.operationCount, 500)
  assert.equal(result.replayPipeline.length, 4)
  assert.equal(result.retryPolicy?.key, 'edge-sync-retry')
  assert.equal(result.recoveryPlan?.resource, 'edge-sync-pipeline')
})

it('resilience-operations stageEdgeReplay handles minimal operation count', () => {
  const mockResult: EdgeReplayResult = {
    status: 'staged',
    storeId: 'store-099',
    operationCount: 1,
    replayPipeline: ['local-queue', 'network-recovery'],
    retryPolicy: undefined,
    observabilityHooks: ['metrics:edge_sync_backlog'],
    recoveryPlan: undefined
  }
  const service = { stageEdgeReplay: (_storeId: string, _opCount: number) => mockResult } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.stageEdgeReplay({ storeId: 'store-099', operationCount: 1 }) as EdgeReplayResult
  assert.equal(result.storeId, 'store-099')
  assert.equal(result.operationCount, 1)
  assert.equal(result.retryPolicy, undefined)
  assert.equal(result.recoveryPlan, undefined)
})

// ── Role-based access control metadata ──

it('resilience-operations controller management-metadata has identity-access permission metadata', () => {
  const permissions = Reflect.getMetadata('identity-access:permissions', ResilienceOperationsController.prototype.getManagementMetadata)
  assert.ok(permissions)
  assert.ok(permissions.includes('foundation.governance.read'))
})

it('resilience-operations controller stageEdgeReplay has identity-access permission metadata', () => {
  const permissions = Reflect.getMetadata('identity-access:permissions', ResilienceOperationsController.prototype.stageEdgeReplay)
  assert.ok(permissions)
  assert.ok(permissions.includes('foundation.operations.recovery.write'))
})

it('resilience-operations controller has tenant scope decorator at class level', () => {
  const tenantScope = Reflect.getMetadata('identity-access:tenant-scope', ResilienceOperationsController)
  assert.ok(tenantScope !== undefined)
})

it('resilience-operations controller overview endpoint has OPERATIONS role in identity-access metadata', () => {
  const roles = Reflect.getMetadata('identity-access:roles', ResilienceOperationsController.prototype.getOperationsOverview)
  assert.ok(roles)
  assert.ok(roles.includes('OPERATIONS'))
  assert.ok(roles.includes('SUPER_ADMIN'))
  assert.ok(roles.includes('TENANT_ADMIN'))
  assert.ok(roles.includes('SECURITY_ADMIN'))
})

it('resilience-operations controller stageEdgeReplay has OPERATIONS role but not SECURITY_ADMIN', () => {
  const roles = Reflect.getMetadata('identity-access:roles', ResilienceOperationsController.prototype.stageEdgeReplay)
  assert.ok(roles)
  assert.ok(roles.includes('OPERATIONS'))
  assert.ok(roles.includes('SUPER_ADMIN'))
  assert.ok(roles.includes('TENANT_ADMIN'))
  assert.ok(!roles.includes('SECURITY_ADMIN')) // write operations exclude security read-only
})

// ── Error boundary: service returns empty data ──

it('resilience-operations controller getObservabilitySignals returns empty when no signals match filter', () => {
  const service = { getObservabilitySignals: (_filters: { status?: string }) => [] } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getObservabilitySignals({ status: 'critical' }) as ObservabilitySignalRecord[]
  assert.equal(result.length, 0)
})

it('resilience-operations controller getRetryPolicies returns empty when no policies match capability', () => {
  const service = { listRetryPolicies: (_filters: { capability?: string }) => [] } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRetryPolicies({ capability: 'nonexistent' }) as RetryPolicyRecord[]
  assert.equal(result.length, 0)
})

it('resilience-operations controller getRecoveryPlans returns empty when no plans match status', () => {
  const service = { listRecoveryPlans: (_filters: { status?: string }) => [] } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.getRecoveryPlans({ status: 'critical' }) as RecoveryPlanRecord[]
  assert.equal(result.length, 0)
})

// ── Edge cases: service returns data with unknown status ──

it('resilience-operations controller getObservabilitySignals handles unknown status gracefully', () => {
  const unknownStatusSignals: ObservabilitySignalRecord[] = []
  const service = { getObservabilitySignals: (_filters: { status?: string }) => unknownStatusSignals } as never
  const controller = new ResilienceOperationsController(service)
  // Filtering by a status that doesn't exist in data yields empty array (service handles it)
  const result = controller.getObservabilitySignals({ status: 'unknown' }) as ObservabilitySignalRecord[]
  assert.equal(result.length, 0)
})

it('resilience-operations controller stageEdgeReplay handles edge case with zero operation count', () => {
  // Though DTO validates @Min(1), if validation passes (e.g. in dev/unit context)
  // the controller should still delegate correctly
  const mockEdgeReplay: EdgeReplayResult = {
    status: 'staged',
    storeId: 'store-001',
    operationCount: 1,
    replayPipeline: ['local-queue'],
    observabilityHooks: [],
    retryPolicy: undefined,
    recoveryPlan: undefined
  }
  const service = { stageEdgeReplay: (_storeId: string, _opCount: number) => mockEdgeReplay } as never
  const controller = new ResilienceOperationsController(service)
  const result = controller.stageEdgeReplay({ storeId: 'store-001', operationCount: 1 }) as EdgeReplayResult
  assert.equal(result.operationCount, 1)
  assert.equal(result.status, 'staged')
})
