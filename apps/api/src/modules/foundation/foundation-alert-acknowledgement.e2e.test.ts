import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { FoundationService } from './foundation.service'

function buildIdentityAccessStub() {
  return {
    getDescriptor: () => ({
      key: 'identity-access',
      name: 'Identity Access Module',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    })
  }
}

function buildIntegrationStub(key: string) {
  return {
    getDescriptor: () => ({
      key,
      name: key,
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      observability: { degradedSignals: 0, byStatus: {} },
      recovery: { attentionRequired: 0, staleDrills: 0 }
    })
  }
}

function buildRuntimeGovernanceStub(input?: {
  summary?: {
    backlog?: number
    stalledCallbacks?: number
    highRiskBacklog?: number
    blockedActions?: number
  }
  receipts?: unknown[]
  stalledReceipts?: unknown[]
}) {
  return {
    getDescriptor: () => ({
      key: 'runtime-governance',
      name: 'runtime-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      generatedAt: '2026-06-13T00:00:00.000Z',
      summary: {
        backlog: input?.summary?.backlog ?? 0,
        stalledCallbacks: input?.summary?.stalledCallbacks ?? 0,
        highRiskBacklog: input?.summary?.highRiskBacklog ?? 0,
        blockedActions: input?.summary?.blockedActions ?? 0
      },
      receipts: input?.receipts ?? [],
      stalledReceipts: input?.stalledReceipts ?? []
    })
  }
}

test('e2e: foundation overview filters muted alerts and annotates acknowledgement', async () => {
  const now = Date.now()
  const future = new Date(now + 60 * 60 * 1000)

  const prisma = {
    foundationAlertAcknowledgement: {
      findMany: async () => [
        {
          code: 'secret-rotation-attention',
          status: 'MUTED',
          note: 'ops muted',
          actorId: 'ops-admin',
          acknowledgedAt: new Date(now - 1000),
          mutedUntil: future,
          updatedAt: new Date(now - 500)
        }
      ]
    }
  }

  const trustGovernanceService = {
    getDescriptor: () => ({
      key: 'trust-governance',
      name: 'trust-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 1 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      rateLimit: { ledgers: { blocked: 0 } }
    })
  }

  const configurationGovernanceService = {
    getDescriptor: () => ({
      key: 'configuration-governance',
      name: 'configuration-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      configuration: {
        secrets: { rotationDue: 2, expired: 0 },
        certificates: { expiringSoon: 0, expired: 0 }
      }
    })
  }

  const service = new FoundationService(
    buildIdentityAccessStub() as never,
    configurationGovernanceService as never,
    buildIntegrationStub('integration-orchestration') as never,
    trustGovernanceService as never,
    buildIntegrationStub('resilience-operations') as never,
    buildIntegrationStub('runtime-governance') as never,
    prisma as never
  )

  const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo' })
  assert.equal(Array.isArray(overview.alerts), true)
  assert.equal(overview.alerts.some((alert) => alert.code === 'secret-rotation-attention'), false)
  assert.equal(overview.alerts.some((alert) => alert.code === 'approvals-pending'), true)
})

test('e2e: foundation overview carries triage and recent operation for visible alerts', async () => {
  const now = new Date('2026-06-13T00:05:00.000Z')

  const prisma = {
    foundationAlertAcknowledgement: {
      findMany: async () => [
        {
          code: 'approvals-pending',
          status: 'ACKED',
          note: 'already handled',
          actorId: 'ops-admin',
          acknowledgedAt: new Date(now.getTime() - 1000),
          mutedUntil: null,
          updatedAt: now
        }
      ]
    },
    auditLog: {
      findMany: async () => [
        {
          action: 'foundation.operations.alerts.ack',
          resourceId: 'approvals-pending',
          operatorId: 'ops-admin',
          sourceChannel: 'foundation-alerts',
          payload: {
            note: 'already handled',
            visibleInOverview: true
          },
          createdAt: now
        }
      ]
    }
  }

  const trustGovernanceService = {
    getDescriptor: () => ({
      key: 'trust-governance',
      name: 'trust-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 3 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      rateLimit: { ledgers: { blocked: 0 } }
    })
  }

  const configurationGovernanceService = {
    getDescriptor: () => ({
      key: 'configuration-governance',
      name: 'configuration-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      configuration: {
        secrets: { rotationDue: 0, expired: 0 },
        certificates: { expiringSoon: 0, expired: 0 }
      }
    })
  }

  const service = new FoundationService(
    buildIdentityAccessStub() as never,
    configurationGovernanceService as never,
    buildIntegrationStub('integration-orchestration') as never,
    trustGovernanceService as never,
    buildIntegrationStub('resilience-operations') as never,
    buildIntegrationStub('runtime-governance') as never,
    prisma as never
  )

  const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo' })
  const approvalsPending = overview.alerts.find((alert) => alert.code === 'approvals-pending')

  assert.equal(approvalsPending?.acknowledgement?.status, 'ACKED')
  assert.equal(approvalsPending?.visibleInOverview, true)
  assert.equal(approvalsPending?.recentOperation?.action, 'ACK')
  assert.equal(approvalsPending?.recentOperation?.actorId, 'ops-admin')
  assert.equal(approvalsPending?.triageState, 'acknowledged')
  assert.equal(approvalsPending?.triageSummary?.includes('已确认'), true)
  assert.equal(overview.topRisks[0]?.code, 'approvals-pending')
  assert.equal(overview.topRisks[0]?.recentOperation?.actorId, 'ops-admin')
})

test('e2e: foundation alert catalog carries recent operation summary', async () => {
  const now = new Date('2026-06-13T00:05:00.000Z')
  const future = new Date(now.getTime() + 60 * 60 * 1000)

  const prisma = {
    foundationAlertAcknowledgement: {
      findMany: async () => [
        {
          code: 'secret-rotation-attention',
          status: 'MUTED',
          note: 'ops muted',
          actorId: 'ops-admin',
          acknowledgedAt: new Date(now.getTime() - 1000),
          mutedUntil: future,
          updatedAt: now
        }
      ]
    },
    auditLog: {
      findMany: async () => [
        {
          action: 'foundation.operations.alerts.mute',
          resourceId: 'secret-rotation-attention',
          operatorId: 'ops-admin',
          sourceChannel: 'foundation-alerts',
          payload: {
            note: 'ops muted',
            mutedUntil: future.toISOString(),
            visibleInOverview: false
          },
          createdAt: now
        }
      ]
    }
  }

  const trustGovernanceService = {
    getDescriptor: () => ({
      key: 'trust-governance',
      name: 'trust-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      rateLimit: { ledgers: { blocked: 0 } }
    })
  }

  const configurationGovernanceService = {
    getDescriptor: () => ({
      key: 'configuration-governance',
      name: 'configuration-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      configuration: {
        secrets: { rotationDue: 1, expired: 0 },
        certificates: { expiringSoon: 0, expired: 0 }
      }
    })
  }

  const service = new FoundationService(
    buildIdentityAccessStub() as never,
    configurationGovernanceService as never,
    buildIntegrationStub('integration-orchestration') as never,
    trustGovernanceService as never,
    buildIntegrationStub('resilience-operations') as never,
    buildIntegrationStub('runtime-governance') as never,
    prisma as never
  )

  const catalog = await service.getOperationsAlertsCatalog({ tenantId: 'tenant-demo' })
  const secretRotation = catalog.alerts.find((item) => item.code === 'secret-rotation-attention')

  assert.equal(secretRotation?.acknowledgement?.status, 'MUTED')
  assert.equal(secretRotation?.recentOperation?.action, 'MUTE')
  assert.equal(secretRotation?.recentOperation?.actorId, 'ops-admin')
  assert.equal(['muted', 'expired-mute'].includes(secretRotation?.triageState ?? ''), true)
  assert.equal(
    (secretRotation?.triageSummary?.includes('已静默') ?? false) ||
      (secretRotation?.triageSummary?.includes('静默已到期') ?? false),
    true
  )
})

test('e2e: foundation alert drilldown keeps muted alert context for operations follow-up', async () => {
  const now = Date.now()
  const future = new Date(now + 60 * 60 * 1000)

  const prisma = {
    foundationAlertAcknowledgement: {
      findMany: async ({ where }: { where?: { code?: { in?: string[] } } } = {}) => {
        const codes = where?.code?.in ?? []
        return codes.includes('secret-rotation-attention')
          ? [
              {
                code: 'secret-rotation-attention',
                status: 'MUTED',
                note: 'ops muted',
                actorId: 'ops-admin',
                acknowledgedAt: new Date(now - 1000),
                mutedUntil: future,
                updatedAt: new Date(now - 500)
              }
            ]
          : []
      }
    },
    auditLog: {
      findMany: async () => [
        {
          action: 'foundation.operations.alerts.mute',
          operatorId: 'ops-admin',
          sourceChannel: 'foundation-alerts',
          payload: {
            note: 'ops muted',
            mutedUntil: future.toISOString(),
            visibleInOverview: false
          },
          createdAt: new Date(now - 500)
        }
      ]
    }
  }

  const trustGovernanceService = {
    getDescriptor: () => ({
      key: 'trust-governance',
      name: 'trust-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      rateLimit: { ledgers: { blocked: 0 } }
    }),
    listGovernanceApprovals: async () => [],
    getAuditRecords: async () => [],
    listQuotaLedgers: async () => []
  }

  const configurationGovernanceService = {
    getDescriptor: () => ({
      key: 'configuration-governance',
      name: 'configuration-governance',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      configuration: {
        secrets: { rotationDue: 2, expired: 0 },
        certificates: { expiringSoon: 0, expired: 0 }
      }
    }),
    getSecretMetadata: async () => [{ status: 'rotation-due', expiresAt: new Date(now + 24 * 60 * 60 * 1000).toISOString() }],
    getCertificateMetadata: async () => []
  }

  const service = new FoundationService(
    buildIdentityAccessStub() as never,
    configurationGovernanceService as never,
    buildIntegrationStub('integration-orchestration') as never,
    trustGovernanceService as never,
    buildIntegrationStub('resilience-operations') as never,
    buildIntegrationStub('runtime-governance') as never,
    prisma as never
  )

  const drilldown = await service.getOperationsAlertDrilldown('secret-rotation-attention', { tenantId: 'tenant-demo' })
  assert.equal(drilldown.code, 'secret-rotation-attention')
  assert.equal(drilldown.visibleInOverview, false)
  assert.equal(drilldown.alert?.count, 2)
  assert.equal(drilldown.acknowledgement?.status, 'MUTED')
  assert.equal(drilldown.catalog?.acknowledgementEnabled, true)
  assert.equal(drilldown.availableActions?.includes('UNMUTE'), true)
  assert.equal(drilldown.history?.[0]?.action, 'MUTE')
})

test('e2e: foundation alert mutation returns persisted history timeline', async () => {
  const now = new Date('2026-06-13T00:05:00.000Z')
  const auditLogs: Array<Record<string, unknown>> = []
  const acknowledgements = new Map<string, Record<string, unknown>>()

  const prisma = {
    foundationAlertAcknowledgement: {
      upsert: async ({
        where,
        create,
        update
      }: {
        where: { tenantId_code: { tenantId: string; code: string } }
        create: Record<string, unknown>
        update: Record<string, unknown>
      }) => {
        const key = `${where.tenantId_code.tenantId}:${where.tenantId_code.code}`
        const next = {
          id: key,
          ...(acknowledgements.get(key) ?? create),
          ...update,
          createdAt: acknowledgements.get(key)?.createdAt ?? now,
          updatedAt: now
        }
        acknowledgements.set(key, next)
        return next
      },
      findMany: async () => Array.from(acknowledgements.values())
    },
    auditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const persisted = { ...data, createdAt: now }
        auditLogs.unshift(persisted)
        return persisted
      },
      findMany: async () => auditLogs
    }
  }

  const service = new FoundationService(
    buildIdentityAccessStub() as never,
    {
      getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] })
    } as never,
    buildIntegrationStub('integration-orchestration') as never,
    {
      getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] })
    } as never,
    buildIntegrationStub('resilience-operations') as never,
    buildIntegrationStub('runtime-governance') as never,
    prisma as never
  )

  const mutation = await service.acknowledgeOperationsAlert(
    'observability-degradation',
    { tenantId: 'tenant-demo' },
    { actorId: 'ops-admin' } as never,
    'handled'
  )

  assert.equal(mutation.acknowledgement?.status, 'ACKED')
  assert.equal(mutation.history?.length, 1)
  assert.equal(mutation.history?.[0]?.action, 'ACK')
  assert.equal(mutation.history?.[0]?.actorId, 'ops-admin')
})

test('e2e: foundation overview surfaces runtime governance alerts and module health', async () => {
  const service = new FoundationService(
    buildIdentityAccessStub() as never,
    {
      getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
      getOperationsOverview: async () => ({
        approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
        audits: { byRiskLevel: { high: 0 } },
        configuration: {
          secrets: { rotationDue: 0, expired: 0 },
          certificates: { expiringSoon: 0, expired: 0 }
        }
      })
    } as never,
    buildIntegrationStub('integration-orchestration') as never,
    {
      getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
      getOperationsOverview: async () => ({
        approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
        audits: { byRiskLevel: { high: 0 } },
        rateLimit: { ledgers: { blocked: 0 } }
      })
    } as never,
    buildIntegrationStub('resilience-operations') as never,
    buildRuntimeGovernanceStub({
      summary: {
        backlog: 3,
        stalledCallbacks: 1,
        highRiskBacklog: 1,
        blockedActions: 1
      },
      receipts: [
        {
          receiptCode: 'RUNTIME-001',
          riskLevel: 'high',
          state: 'submitted',
          callback: { callbackStatus: 'awaiting-callback' }
        }
      ]
    }) as never,
    {
      foundationAlertAcknowledgement: { findMany: async () => [] },
      auditLog: { findMany: async () => [] }
    } as never
  )

  const overview = await service.getOperationsOverview({ tenantId: 'tenant-demo' })
  assert.equal(overview.summary.runtimeGovernanceBacklog, 3)
  assert.equal(overview.summary.stalledRuntimeCallbacks, 1)
  assert.equal(overview.alerts.some((alert) => alert.code === 'runtime-governance-backlog'), true)
  assert.equal(overview.alerts.some((alert) => alert.code === 'runtime-callback-stalled'), true)
  assert.equal(overview.moduleHealth.runtimeGovernance.status, 'critical')
})

test('e2e: foundation runtime callback stalled drilldown returns timeout thresholds and escalation detail', async () => {
  const service = new FoundationService(
    buildIdentityAccessStub() as never,
    {
      getDescriptor: () => ({ key: 'configuration-governance', name: 'cfg', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
      getOperationsOverview: async () => ({
        approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
        audits: { byRiskLevel: { high: 0 } },
        configuration: {
          secrets: { rotationDue: 0, expired: 0 },
          certificates: { expiringSoon: 0, expired: 0 }
        }
      })
    } as never,
    buildIntegrationStub('integration-orchestration') as never,
    {
      getDescriptor: () => ({ key: 'trust-governance', name: 'trust', purpose: 'stub', inboundContracts: [], outboundContracts: [], capabilities: [] }),
      getOperationsOverview: async () => ({
        approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
        audits: { byRiskLevel: { high: 0 } },
        rateLimit: { ledgers: { blocked: 0 } }
      })
    } as never,
    buildIntegrationStub('resilience-operations') as never,
    buildRuntimeGovernanceStub({
      summary: {
        backlog: 3,
        stalledCallbacks: 2,
        highRiskBacklog: 1,
        blockedActions: 0
      },
      stalledReceipts: [
        {
          receiptCode: 'RUNTIME-001',
          app: 'miniapp',
          action: 'booking-submit',
          riskLevel: 'high',
          handlerName: 'miniapp-booking-submit-handler',
          callbackStatus: 'awaiting-callback',
          replayable: true,
          scopeKey: 'miniapp:booking-submit:tenant-demo',
          latestEventType: 'runtime-governance.handler.sync.requested',
          stalled: true,
          timeoutMs: 300000,
          elapsedMs: 420000,
          exceededMs: 120000,
          escalationAction: 'SCHEDULE_REPLAY',
          summary: 'callback 超时未回写，建议进入 replay 补偿。'
        },
        {
          receiptCode: 'RUNTIME-002',
          app: 'app',
          action: 'member-login',
          riskLevel: 'medium',
          handlerName: 'native-member-session-handler',
          callbackStatus: 'awaiting-callback',
          replayable: false,
          scopeKey: 'app:member-login:tenant-demo',
          latestEventType: 'runtime-governance.handler.sync.requested',
          stalled: true,
          timeoutMs: 600000,
          elapsedMs: 780000,
          exceededMs: 180000,
          escalationAction: 'OPEN_MANUAL_REVIEW',
          summary: 'callback 超时且已无自动重试空间，建议转人工复核。'
        }
      ]
    }) as never,
    {
      foundationAlertAcknowledgement: { findMany: async () => [] },
      auditLog: { findMany: async () => [] }
    } as never
  )

  const drilldown = await service.getOperationsAlertDrilldown('runtime-callback-stalled', { tenantId: 'tenant-demo' })
  assert.equal(drilldown.code, 'runtime-callback-stalled')
  assert.equal(drilldown.alert?.count, 2)
  assert.deepEqual((drilldown.detail as { timeoutThresholds: Record<string, number> }).timeoutThresholds, {
    low: 900000,
    medium: 600000,
    high: 300000
  })
  assert.deepEqual((drilldown.detail as { escalationSummary: Record<string, number> }).escalationSummary, {
    waitCallback: 0,
    scheduleReplay: 1,
    openManualReview: 1
  })
  assert.deepEqual(
    ((drilldown.detail as { receipts: Array<Record<string, unknown>> }).receipts[0] ?? null) && {
      receiptCode: (drilldown.detail as { receipts: Array<Record<string, unknown>> }).receipts[0]?.receiptCode,
      escalationAction: (drilldown.detail as { receipts: Array<Record<string, unknown>> }).receipts[0]?.escalationAction,
      exceededMs: (drilldown.detail as { receipts: Array<Record<string, unknown>> }).receipts[0]?.exceededMs
    },
    {
      receiptCode: 'RUNTIME-001',
      escalationAction: 'SCHEDULE_REPLAY',
      exceededMs: 120000
    }
  )
})
