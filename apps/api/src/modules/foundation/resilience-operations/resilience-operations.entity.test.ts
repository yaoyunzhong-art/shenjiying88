import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  ObservabilitySignalStatus,
  RecoveryPlanStatus,
  type ObservabilitySignalRecord,
  type ObservabilitySignalType,
  type RetryPolicyRecord,
  type RecoveryPlanRecord,
  type GovernanceMetadataRecord,
  type EdgeReplayResult,
  type ObservabilityOverview,
  type RetryPolicyOverview,
  type RecoveryPlanOverview,
  type OperationsOverview,
  type RecoveryPlanDetail
} from './resilience-operations.entity'

describe('resilience-operations entity - ObservabilitySignalStatus', () => {
  test('Healthy 等于 "healthy"', () => {
    assert.equal(ObservabilitySignalStatus.Healthy, 'healthy')
  })

  test('Warning 等于 "warning"', () => {
    assert.equal(ObservabilitySignalStatus.Warning, 'warning')
  })

  test('Critical 等于 "critical"', () => {
    assert.equal(ObservabilitySignalStatus.Critical, 'critical')
  })
})

describe('resilience-operations entity - RecoveryPlanStatus', () => {
  test('Ready 等于 "ready"', () => {
    assert.equal(RecoveryPlanStatus.Ready, 'ready')
  })

  test('Attention 等于 "attention"', () => {
    assert.equal(RecoveryPlanStatus.Attention, 'attention')
  })
})

describe('resilience-operations entity - ObservabilitySignalRecord type', () => {
  test('符合 ObservabilitySignalRecord 结构 - metrics', () => {
    const record: ObservabilitySignalRecord = {
      signal: 'metrics',
      status: ObservabilitySignalStatus.Healthy,
      coverage: 96,
      collectionLagSeconds: 18,
      lastCollectedAt: '2026-06-12T09:58:00.000Z',
      owner: 'platform-ops',
      alertRoutes: ['alertmanager/platform-primary'],
      evidence: ['infra/docker/prometheus/prometheus.yml']
    }
    assert.equal(record.signal, 'metrics')
    assert.equal(record.status, 'healthy')
    assert.equal(record.coverage, 96)
    assert.equal(record.collectionLagSeconds, 18)
    assert.ok(record.alertRoutes.includes('alertmanager/platform-primary'))
    assert.ok(record.evidence.length > 0)
  })

  test('符合 ObservabilitySignalRecord 结构 - traces critical', () => {
    const record: ObservabilitySignalRecord = {
      signal: 'traces',
      status: ObservabilitySignalStatus.Critical,
      coverage: 60,
      collectionLagSeconds: 300,
      lastCollectedAt: '2026-06-12T09:55:00.000Z',
      owner: 'platform-ops',
      alertRoutes: ['alertmanager/platform-primary', 'ops-oncall-wecom'],
      evidence: ['infra/docker/otel-collector/config.yml']
    }
    assert.equal(record.signal, 'traces')
    assert.equal(record.status, 'critical')
    assert.equal(record.collectionLagSeconds, 300)
    assert.equal(record.alertRoutes.length, 2)
  })

  test('ObservabilitySignalType 只接受合法值', () => {
    const validSignals: ObservabilitySignalType[] = ['metrics', 'logs', 'traces']
    assert.equal(validSignals.length, 3)
    validSignals.forEach((signal) => {
      assert.ok(['metrics', 'logs', 'traces'].includes(signal))
    })
  })
})

describe('resilience-operations entity - RetryPolicyRecord type', () => {
  test('符合 RetryPolicyRecord 结构', () => {
    const policy: RetryPolicyRecord = {
      key: 'edge-sync-retry',
      capability: 'edge-sync',
      trigger: 'store-edge upload timeout or weak network',
      maxAttempts: 6,
      backoff: 'exponential: 30s -> 5m',
      recoveryAction: 'switch to reconciliation queue and conflict review',
      escalationTarget: 'ops-oncall-wecom'
    }
    assert.equal(policy.key, 'edge-sync-retry')
    assert.equal(policy.capability, 'edge-sync')
    assert.equal(policy.maxAttempts, 6)
    assert.ok(policy.backoff.startsWith('exponential'))
    assert.ok(policy.recoveryAction.length > 0)
    assert.ok(policy.escalationTarget.length > 0)
  })

  test('RetryPolicyRecord - webhook 投递策略', () => {
    const policy: RetryPolicyRecord = {
      key: 'webhook-delivery-retry',
      capability: 'webhook-delivery',
      trigger: 'delivery failed or downstream 5xx',
      maxAttempts: 5,
      backoff: 'progressive: 15s -> 10m',
      recoveryAction: 'move to dead-letter queue with replay token',
      escalationTarget: 'integration-ops'
    }
    assert.equal(policy.maxAttempts, 5)
    assert.ok(policy.recoveryAction.includes('dead-letter'))
  })
})

describe('resilience-operations entity - RecoveryPlanRecord type', () => {
  test('符合 RecoveryPlanRecord 结构', () => {
    const plan: RecoveryPlanRecord = {
      resource: 'postgres-primary',
      status: RecoveryPlanStatus.Ready,
      rtoMinutes: 30,
      rpoMinutes: 10,
      lastDrillAt: '2026-05-28T02:00:00.000Z',
      staleAfterDays: 45,
      dependencies: ['postgres-backup', 'prometheus', 'audit-verification'],
      runbook: 'docs/operations-runbook-template.md#database-recovery'
    }
    assert.equal(plan.resource, 'postgres-primary')
    assert.equal(plan.status, 'ready')
    assert.equal(plan.rtoMinutes, 30)
    assert.equal(plan.rpoMinutes, 10)
    assert.ok(plan.dependencies.length >= 3)
    assert.ok(plan.runbook.startsWith('docs/'))
  })

  test('RecoveryPlanRecord - attention 状态与过期天数', () => {
    const plan: RecoveryPlanRecord = {
      resource: 'edge-sync-pipeline',
      status: RecoveryPlanStatus.Attention,
      rtoMinutes: 20,
      rpoMinutes: 5,
      lastDrillAt: '2026-04-01T03:00:00.000Z',
      staleAfterDays: 30,
      dependencies: ['local-queue', 'reconciliation-service'],
      runbook: 'docs/operations-runbook-template.md#edge-replay'
    }
    assert.equal(plan.status, 'attention')
    assert.equal(plan.staleAfterDays, 30)
    // 检查过期逻辑
    const lastDrill = Date.parse(plan.lastDrillAt)
    const staleAt = lastDrill + plan.staleAfterDays * 24 * 60 * 60 * 1000
    assert.ok(staleAt < Date.now(), 'edge-sync-pipeline 演练应已过期')
  })
})

describe('resilience-operations entity - GovernanceMetadataRecord type', () => {
  test('符合 GovernanceMetadataRecord 结构', () => {
    const meta: GovernanceMetadataRecord = {
      operation: 'observability.read',
      rbac: {
        resource: 'observability',
        action: 'read',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'],
        requiredPermissions: ['foundation.governance.read']
      }
    }
    assert.equal(meta.operation, 'observability.read')
    assert.equal(meta.rbac.resource, 'observability')
    assert.equal(meta.rbac.action, 'read')
    assert.ok(meta.rbac.requiredRoles.includes('SUPER_ADMIN'))
    assert.ok(meta.rbac.requiredPermissions.includes('foundation.governance.read'))
  })

  test('GovernanceMetadataRecord - write 操作', () => {
    const meta: GovernanceMetadataRecord = {
      operation: 'edge-replay.write',
      rbac: {
        resource: 'edge-replay',
        action: 'write',
        requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
        requiredPermissions: ['foundation.operations.recovery.write']
      }
    }
    assert.equal(meta.rbac.action, 'write')
    assert.equal(meta.rbac.requiredRoles.length, 3)
    assert.ok(!meta.rbac.requiredRoles.includes('SECURITY_ADMIN'))
  })
})

describe('resilience-operations entity - EdgeReplayResult type', () => {
  test('符合 EdgeReplayResult 结构', () => {
    const result: EdgeReplayResult = {
      status: 'staged',
      storeId: 'store-001',
      operationCount: 150,
      replayPipeline: ['local-queue', 'network-recovery', 'reconciliation', 'conflict-review'],
      retryPolicy: {
        key: 'edge-sync-retry',
        capability: 'edge-sync',
        trigger: 'store-edge upload timeout',
        maxAttempts: 6,
        backoff: 'exponential: 30s -> 5m',
        recoveryAction: 'switch to reconciliation queue',
        escalationTarget: 'ops-oncall-wecom'
      },
      observabilityHooks: ['metrics:edge_sync_backlog', 'logs:edge-replay'],
      recoveryPlan: {
        resource: 'edge-sync-pipeline',
        status: RecoveryPlanStatus.Attention,
        rtoMinutes: 20,
        rpoMinutes: 5,
        lastDrillAt: '2026-04-01T03:00:00.000Z',
        staleAfterDays: 30,
        dependencies: ['local-queue', 'reconciliation-service'],
        runbook: 'docs/operations-runbook-template.md#edge-replay'
      }
    }
    assert.equal(result.status, 'staged')
    assert.equal(result.storeId, 'store-001')
    assert.equal(result.operationCount, 150)
    assert.equal(result.replayPipeline.length, 4)
    assert.ok(result.retryPolicy)
    assert.ok(result.recoveryPlan)
  })

  test('EdgeReplayResult - 无匹配策略和计划', () => {
    const result: EdgeReplayResult = {
      status: 'staged',
      storeId: 'store-unknown',
      operationCount: 1,
      replayPipeline: ['local-queue'],
      observabilityHooks: []
    }
    assert.equal(result.retryPolicy, undefined)
    assert.equal(result.recoveryPlan, undefined)
    assert.equal(result.observabilityHooks.length, 0)
  })
})

describe('resilience-operations entity - 概览类型', () => {
  test('符合 ObservabilityOverview 结构', () => {
    const overview: ObservabilityOverview = {
      totalSignals: 3,
      degradedSignals: 2,
      byStatus: { healthy: 1, warning: 2 },
      averageCoverage: 89,
      maxCollectionLagSeconds: 92,
      signals: [
        {
          signal: 'metrics',
          status: ObservabilitySignalStatus.Healthy,
          coverage: 96,
          collectionLagSeconds: 18,
          lastCollectedAt: '2026-06-12T09:58:00.000Z',
          owner: 'platform-ops',
          alertRoutes: [],
          evidence: []
        }
      ]
    }
    assert.equal(overview.totalSignals, 3)
    assert.equal(overview.degradedSignals, 2)
    assert.equal(overview.averageCoverage, 89)
    assert.equal(overview.maxCollectionLagSeconds, 92)
  })

  test('符合 RetryPolicyOverview 结构', () => {
    const overview: RetryPolicyOverview = {
      totalPolicies: 3,
      byCapability: { 'edge-sync': 1, 'webhook-delivery': 1, 'backup-restore': 1 },
      maxAttempts: 6,
      policies: []
    }
    assert.equal(overview.totalPolicies, 3)
    assert.equal(overview.maxAttempts, 6)
    assert.equal(Object.keys(overview.byCapability).length, 3)
  })

  test('符合 RecoveryPlanOverview 结构', () => {
    const overview: RecoveryPlanOverview = {
      totalPlans: 3,
      attentionRequired: 1,
      staleDrills: 1,
      plans: []
    }
    assert.equal(overview.totalPlans, 3)
    assert.equal(overview.attentionRequired, 1)
    assert.equal(overview.staleDrills, 1)
  })

  test('符合 OperationsOverview 完整结构', () => {
    const overview: OperationsOverview = {
      generatedAt: '2026-06-23T03:46:00.000Z',
      observability: {
        totalSignals: 3,
        degradedSignals: 2,
        byStatus: { healthy: 1, warning: 2 },
        averageCoverage: 89,
        maxCollectionLagSeconds: 92,
        signals: []
      },
      retries: {
        totalPolicies: 3,
        byCapability: { 'edge-sync': 1, 'webhook-delivery': 1, 'backup-restore': 1 },
        maxAttempts: 6,
        policies: []
      },
      recovery: {
        totalPlans: 3,
        attentionRequired: 1,
        staleDrills: 1,
        plans: []
      }
    }
    assert.ok(typeof overview.generatedAt === 'string')
    assert.equal(overview.observability.totalSignals, 3)
    assert.equal(overview.retries.totalPolicies, 3)
    assert.equal(overview.recovery.totalPlans, 3)
    // 验证跨维度关联一致性
    assert.ok(overview.observability.degradedSignals <= overview.observability.totalSignals)
    assert.ok(overview.recovery.attentionRequired <= overview.recovery.totalPlans)
    assert.ok(overview.recovery.staleDrills <= overview.recovery.totalPlans)
  })
})

describe('resilience-operations entity - RecoveryPlanDetail type', () => {
  test('符合 RecoveryPlanDetail 结构 - 有匹配计划', () => {
    const detail: RecoveryPlanDetail = {
      status: RecoveryPlanStatus.Ready,
      resource: 'postgres-primary',
      baseline: ['backup', 'restore-drill', 'cross-az-failover', 'audit-verification'],
      plan: {
        resource: 'postgres-primary',
        status: RecoveryPlanStatus.Ready,
        rtoMinutes: 30,
        rpoMinutes: 10,
        lastDrillAt: '2026-05-28T02:00:00.000Z',
        staleAfterDays: 45,
        dependencies: ['postgres-backup', 'prometheus'],
        runbook: 'docs/operations-runbook-template.md#database-recovery'
      }
    }
    assert.equal(detail.resource, 'postgres-primary')
    assert.equal(detail.baseline.length, 4)
    assert.ok(detail.plan)
    assert.equal(detail.plan.rtoMinutes, 30)
  })

  test('符合 RecoveryPlanDetail 结构 - 无匹配计划', () => {
    const detail: RecoveryPlanDetail = {
      status: RecoveryPlanStatus.Attention,
      resource: 'unknown-resource',
      baseline: ['backup', 'restore-drill'],
      plan: null
    }
    assert.equal(detail.status, 'attention')
    assert.equal(detail.plan, null)
    assert.ok(detail.baseline.includes('backup'))
  })
})
