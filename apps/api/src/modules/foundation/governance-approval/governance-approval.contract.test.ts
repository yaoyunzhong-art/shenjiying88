import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ApprovalStatus, FoundationScopeType } from '@prisma/client'
import { materializeGovernanceApproval, GovernanceApprovalSnapshot, decideGovernanceApproval, cancelGovernanceApproval, resubmitGovernanceApproval, markGovernanceApprovalExecuted, markGovernanceApprovalExecutionFailed, getGovernanceApprovalByTicket, listGovernanceApprovals, summarizeGovernanceApprovals } from './governance-approval'

type GovernanceApprovalRecord = {
  id: string
  approvalTicket: string | null
  operation: string
  resourceType: string
  resourceKey: string
  scopeType: FoundationScopeType
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  required: boolean
  requestedBy: string | null
  status: ApprovalStatus
  version: number
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: Date | null
  summary: unknown
  createdAt: Date
  updatedAt: Date
}

function createPrismaMock() {
  const records: GovernanceApprovalRecord[] = []

  const prisma = {
    governanceApproval: {
      findUnique: async ({ where }: { where: { approvalTicket?: string; id?: string } }) => {
        if (where.approvalTicket) {
          return records.find((r) => r.approvalTicket === where.approvalTicket) ?? null
        }
        if (where.id) {
          return records.find((r) => r.id === where.id) ?? null
        }
        return null
      },
      findMany: async (args: { where?: Record<string, unknown>; orderBy?: unknown[]; take?: number }) => {
        let filtered = [...records]

        if (args?.where) {
          const w = args.where as Record<string, unknown>
          if (w.approvalTicket) filtered = filtered.filter((r) => r.approvalTicket === w.approvalTicket)
          if (w.operation) filtered = filtered.filter((r) => r.operation === w.operation)
          if (w.resourceType) filtered = filtered.filter((r) => r.resourceType === w.resourceType)
          if (w.resourceKey) filtered = filtered.filter((r) => r.resourceKey === w.resourceKey)
          if (w.requestedBy) filtered = filtered.filter((r) => r.requestedBy === w.requestedBy)
          if (w.decidedBy) filtered = filtered.filter((r) => r.decidedBy === w.decidedBy)
          if (w.tenantId) filtered = filtered.filter((r) => r.tenantId === w.tenantId)
          if (w.status) filtered = filtered.filter((r) => r.status === w.status)
        }

        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        if (args?.take) filtered = filtered.slice(0, args.take as number)
        return filtered
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date()
        const record: GovernanceApprovalRecord = {
          id: `apr_${records.length + 1}`,
          approvalTicket: (data.approvalTicket as string) ?? null,
          operation: data.operation as string,
          resourceType: data.resourceType as string,
          resourceKey: data.resourceKey as string,
          scopeType: (data.scopeType as FoundationScopeType) ?? FoundationScopeType.PLATFORM,
          tenantId: (data.tenantId as string) ?? null,
          brandId: (data.brandId as string) ?? null,
          storeId: (data.storeId as string) ?? null,
          required: (data.required as boolean) ?? false,
          requestedBy: (data.requestedBy as string) ?? null,
          status: (data.status as ApprovalStatus) ?? ApprovalStatus.PENDING,
          version: (data.version as number) ?? 1,
          decisionNote: (data.decisionNote as string) ?? null,
          decidedBy: null,
          decidedAt: null,
          summary: data.summary ?? null,
          createdAt: now,
          updatedAt: now
        }
        records.push(record)
        return record
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = records.findIndex((r) => r.id === where.id)
        if (idx === -1) throw new Error(`Record ${where.id} not found`)
        const existing = records[idx]!
        const now = new Date()
        const updated: GovernanceApprovalRecord = {
          ...existing,
          approvalTicket: (data.approvalTicket as string) ?? existing.approvalTicket,
          operation: (data.operation as string) ?? existing.operation,
          resourceType: (data.resourceType as string) ?? existing.resourceType,
          resourceKey: (data.resourceKey as string) ?? existing.resourceKey,
          status: (data.status as ApprovalStatus) ?? existing.status,
          version: (data.version as number) ?? existing.version,
          decidedBy: data.decidedBy !== undefined ? (data.decidedBy as string | null) : existing.decidedBy,
          decisionNote: data.decisionNote !== undefined ? (data.decisionNote as string | null) : existing.decisionNote,
          decidedAt: data.decidedAt !== undefined ? (data.decidedAt as Date | null) : existing.decidedAt,
          summary: data.summary !== undefined ? data.summary : existing.summary,
          updatedAt: now
        }
        records[idx] = updated
        return updated
      }
    }
  }

  return { prisma, records }
}

describe('governance-approval contract: materialize lifecycle', () => {
  it('materialize creates a new approval record when not required and no ticket', async () => {
    const { prisma, records } = createPrismaMock()
    const result = await materializeGovernanceApproval(prisma as never, {
      operation: 'create-store',
      resourceType: 'store',
      resourceKey: 'store-001',
      approvalRequired: false
    })

    assert.equal(result.persisted, false)
    assert.equal(result.required, false)
    assert.equal(result.status, 'NOT_REQUIRED')
    assert.equal(result.ticket, null)
    assert.equal(records.length, 0)
  })

  it('materialize persists approval when required', async () => {
    const { prisma, records } = createPrismaMock()
    const result = await materializeGovernanceApproval(prisma as never, {
      operation: 'delete-brand',
      resourceType: 'brand',
      resourceKey: 'brand-042',
      scopeType: 'TENANT',
      tenantId: 't-001',
      approvalRequired: true,
      requestedBy: 'admin-user'
    })

    assert.equal(result.persisted, true)
    assert.equal(result.required, true)
    assert.equal(result.status, 'PENDING')
    assert.equal(result.requestedBy, 'admin-user')
    assert.ok(result.ticket?.startsWith('APR-DELETEBR'))
    assert.equal(records.length, 1)
    assert.equal(records[0]?.version, 1)
  })

  it('materialize returns same record on re-materialize with same status', async () => {
    const { prisma, records } = createPrismaMock()

    const first = await materializeGovernanceApproval(prisma as never, {
      operation: 'update-store',
      resourceType: 'store',
      resourceKey: 'store-099',
      approvalRequired: true,
      requestedBy: 'user-a',
      approvalTicket: 'APR-UPDATES-XYZ001'
    })

    // Re-materialize with same status — version stays same (PENDING → PENDING)
    const second = await materializeGovernanceApproval(prisma as never, {
      operation: 'update-store',
      resourceType: 'store',
      resourceKey: 'store-099',
      approvalRequired: true,
      requestedBy: 'user-b',
      approvalTicket: 'APR-UPDATES-XYZ001'
    })

    assert.equal(first.version, 1)
    assert.equal(second.version, 1)
    assert.equal(records.length, 1)
    assert.equal(records[0]?.version, 1)
    // Same status means no version bump; requestedBy is set on create only
    assert.equal(second.requestedBy, 'user-a')
    assert.equal(second.persisted, true)
  })

  it('materialize binds by approvalTicket for idempotency — only one record', async () => {
    const { prisma, records } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'publish',
      resourceType: 'document',
      resourceKey: 'doc-1',
      approvalRequired: true,
      approvalTicket: 'APR-PUBLISH-DOC0001'
    })

    // Same ticket, same binding — updates existing, no duplicate
    const result = await materializeGovernanceApproval(prisma as never, {
      operation: 'publish',
      resourceType: 'document',
      resourceKey: 'doc-1',
      approvalRequired: true,
      approvalTicket: 'APR-PUBLISH-DOC0001'
    })

    assert.equal(result.ticket, 'APR-PUBLISH-DOC0001')
    assert.equal(records.length, 1)
    assert.equal(result.persisted, true)
  })

  it('materialize generates internal ticket when approval is required without explicit ticket', async () => {
    const { prisma, records } = createPrismaMock()
    const result = await materializeGovernanceApproval(prisma as never, {
      operation: 'audit-log',
      resourceType: 'log',
      resourceKey: 'log-001',
      approvalRequired: true
    })

    assert.equal(result.persisted, true)
    assert.ok(result.ticket?.startsWith('APR-AUDITLOG'))
    assert.equal(records.length, 1)
  })
})

describe('governance-approval contract: decide', () => {
  it('decide sets APPROVED status', async () => {
    const { prisma, records } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'create',
      resourceType: 'store',
      resourceKey: 's-1',
      approvalRequired: true,
      requestedBy: 'requester',
      approvalTicket: 'APR-CREATE-STORE01'
    })

    assert.equal(records[0]?.status, 'PENDING')

    const decided = await decideGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-CREATE-STORE01',
      decidedBy: 'approver-1',
      decisionNote: 'Looks good',
      status: 'APPROVED'
    })

    assert.equal(decided.status, 'APPROVED')
    assert.equal(decided.decidedBy, 'approver-1')
    assert.ok(decided.decidedAt)
    assert.equal(records[0]?.version, 2)
    assert.equal(records[0]?.status, 'APPROVED')
  })

  it('decide sets REJECTED status', async () => {
    const { prisma, records } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'delete',
      resourceType: 'brand',
      resourceKey: 'b-7',
      approvalRequired: true,
      approvalTicket: 'APR-DELETE-BRAND07'
    })

    const decided = await decideGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-DELETE-BRAND07',
      decidedBy: 'approver-2',
      decisionNote: 'Denied',
      status: 'REJECTED'
    })

    assert.equal(decided.status, 'REJECTED')
    assert.equal(records[0]?.version, 2)
  })

  it('decide throws when ticket not found', async () => {
    const { prisma } = createPrismaMock()

    await assert.rejects(
      decideGovernanceApproval(prisma as never, {
        approvalTicket: 'APR-NONEXISTENT',
        decidedBy: 'approver',
        status: 'APPROVED'
      }),
      (err: Error) => err.message.includes('not found')
    )
  })

  it('decide throws on version mismatch', async () => {
    const { prisma } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'update',
      resourceType: 'store',
      resourceKey: 's-5',
      approvalRequired: true,
      approvalTicket: 'APR-UPDATE-STORE05'
    })

    await assert.rejects(
      decideGovernanceApproval(prisma as never, {
        approvalTicket: 'APR-UPDATE-STORE05',
        decidedBy: 'approver',
        status: 'APPROVED',
        expectedVersion: 99
      }),
      (err: Error) => err.message.includes('version')
    )
  })
})

describe('governance-approval contract: cancel', () => {
  it('cancel sets CANCELLED status', async () => {
    const { prisma, records } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'update',
      resourceType: 'store',
      resourceKey: 's-99',
      approvalRequired: true,
      approvalTicket: 'APR-UPDATE-STORE99'
    })

    const cancelled = await cancelGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-UPDATE-STORE99',
      cancelledBy: 'user-x',
      cancelReason: 'No longer needed'
    })

    assert.equal(cancelled.status, 'CANCELLED')
    assert.equal(cancelled.decidedBy, 'user-x')
    assert.equal(records[0]?.status, 'CANCELLED')
    assert.equal(records[0]?.version, 2)
  })

  it('cancel throws when status is not PENDING', async () => {
    const { prisma } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'create',
      resourceType: 'store',
      resourceKey: 's-888',
      approvalRequired: true,
      approvalTicket: 'APR-CREATE-ST888'
    })

    await decideGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-CREATE-ST888',
      decidedBy: 'approver',
      status: 'APPROVED'
    })

    await assert.rejects(
      cancelGovernanceApproval(prisma as never, {
        approvalTicket: 'APR-CREATE-ST888',
        cancelledBy: 'user-x'
      }),
      (err: Error) => err.message.includes('cancelled')
    )
  })
})

describe('governance-approval contract: resubmit', () => {
  it('resubmit creates a new PENDING approval from a REJECTED one', async () => {
    const { prisma, records } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'create',
      resourceType: 'store',
      resourceKey: 's-55',
      approvalRequired: true,
      approvalTicket: 'APR-CREATE-RESUB55'
    })

    await decideGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-CREATE-RESUB55',
      decidedBy: 'approver',
      status: 'REJECTED'
    })

    const resubmitted = await resubmitGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-CREATE-RESUB55',
      resubmittedBy: 'requester',
      resubmitReason: 'Revised the request'
    })

    assert.equal(resubmitted.supersededTicket, 'APR-CREATE-RESUB55')
    assert.equal(resubmitted.approval.status, 'PENDING')
    assert.equal(resubmitted.approval.version, 1)
    assert.equal(records.length, 2)

    const original = records.find((r) => r.approvalTicket === 'APR-CREATE-RESUB55')
    assert.equal(original?.status, 'SUPERSEDED')
  })
})

describe('governance-approval contract: execution', () => {
  it('markExecuted sets execution summary on approved approval', async () => {
    const { prisma, records } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'publish',
      resourceType: 'document',
      resourceKey: 'doc-ex',
      approvalRequired: true,
      approvalTicket: 'APR-PUBLISH-DOCEX'
    })

    await decideGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-PUBLISH-DOCEX',
      decidedBy: 'approver',
      status: 'APPROVED'
    })

    const executed = await markGovernanceApprovalExecuted(prisma as never, {
      approvalTicket: 'APR-PUBLISH-DOCEX',
      executedBy: 'worker-1',
      executionStatus: 'SUCCESS'
    })

    assert.equal(executed.execution?.executed, true)
    assert.equal(executed.execution?.executionStatus, 'SUCCESS')
    assert.equal(executed.execution?.executedBy, 'worker-1')
    assert.equal(executed.execution?.attempts, 1)
    assert.equal(records[0]?.version, 3)
  })

  it('markExecutionFailed sets failure summary', async () => {
    const { prisma } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'sync',
      resourceType: 'integration',
      resourceKey: 'int-fail',
      approvalRequired: true,
      approvalTicket: 'APR-SYNC-INFAIL'
    })

    await decideGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-SYNC-INFAIL',
      decidedBy: 'approver',
      status: 'APPROVED'
    })

    const failed = await markGovernanceApprovalExecutionFailed(prisma as never, {
      approvalTicket: 'APR-SYNC-INFAIL',
      failedBy: 'worker-1',
      failureStatus: 'NETWORK_ERROR',
      failureReason: 'Connection refused'
    })

    assert.equal(failed.execution?.executed, false)
    assert.equal(failed.execution?.lastFailure?.failureStatus, 'NETWORK_ERROR')
    assert.equal(failed.execution?.lastFailure?.failureReason, 'Connection refused')
    assert.equal(failed.execution?.lastFailure?.failedBy, 'worker-1')
    assert.equal(failed.execution?.attempts, 1)
  })
})

describe('governance-approval contract: query', () => {
  it('getApprovalByTicket retrieves existing approval', async () => {
    const { prisma } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'update',
      resourceType: 'store',
      resourceKey: 's-qry',
      approvalRequired: true,
      approvalTicket: 'APR-UPDATE-QUERY01'
    })

    const detail = await getGovernanceApprovalByTicket(prisma as never, 'APR-UPDATE-QUERY01')
    assert.equal(detail.ticket, 'APR-UPDATE-QUERY01')
    assert.equal(detail.operation, 'update')
    assert.equal(detail.status, 'PENDING')
  })

  it('getApprovalByTicket throws for missing ticket', async () => {
    const { prisma } = createPrismaMock()

    await assert.rejects(
      getGovernanceApprovalByTicket(prisma as never, 'APR-MISSING-TICKET'),
      (err: Error) => err.message.includes('not found')
    )
  })

  it('listGovernanceApprovals returns all approvals', async () => {
    const { prisma } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'create', resourceType: 'store', resourceKey: 's-a', approvalRequired: true, approvalTicket: 'APR-CREATE-LISTA'
    })
    await materializeGovernanceApproval(prisma as never, {
      operation: 'delete', resourceType: 'brand', resourceKey: 'b-a', approvalRequired: true, approvalTicket: 'APR-DELETE-LISTB'
    })
    await materializeGovernanceApproval(prisma as never, {
      operation: 'update', resourceType: 'store', resourceKey: 's-c', approvalRequired: true, approvalTicket: 'APR-UPDATE-LISTC'
    })

    const list = await listGovernanceApprovals(prisma as never, { limit: 10 })
    assert.equal(list.length, 3)
  })

  it('listGovernanceApprovals filters by operation', async () => {
    const { prisma } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'create', resourceType: 'store', resourceKey: 's-f1', approvalRequired: true, approvalTicket: 'APR-CREATE-FILT1'
    })
    await materializeGovernanceApproval(prisma as never, {
      operation: 'delete', resourceType: 'store', resourceKey: 's-f2', approvalRequired: true, approvalTicket: 'APR-DELETE-FILT2'
    })

    const list = await listGovernanceApprovals(prisma as never, { operation: 'create' })
    assert.equal(list.length, 1)
    assert.equal(list[0]?.operation, 'create')
  })

  it('summarizeGovernanceApprovals returns metrics', async () => {
    const { prisma } = createPrismaMock()

    await materializeGovernanceApproval(prisma as never, {
      operation: 'create', resourceType: 'store', resourceKey: 's-sum1', approvalRequired: true, approvalTicket: 'APR-CREATE-SUM1'
    })
    await materializeGovernanceApproval(prisma as never, {
      operation: 'delete', resourceType: 'brand', resourceKey: 'b-sum1', approvalRequired: true, approvalTicket: 'APR-DELETE-SUM2'
    })

    await decideGovernanceApproval(prisma as never, {
      approvalTicket: 'APR-CREATE-SUM1', decidedBy: 'approver', status: 'APPROVED'
    })

    const summary = await summarizeGovernanceApprovals(prisma as never, {})
    assert.equal(summary.total, 2)
    assert.equal(summary.statuses.PENDING, 1)
    assert.equal(summary.statuses.APPROVED, 1)
  })
})
