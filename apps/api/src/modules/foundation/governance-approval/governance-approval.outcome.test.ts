import assert from 'node:assert/strict'
import test from 'node:test'
import { ApprovalStatus, FoundationScopeType } from '@prisma/client'
import {
  GovernanceApprovalService
} from './governance-approval.service'
import { RuntimeGovernanceService } from '../runtime-governance/runtime-governance.service'

type OutcomeRecord = {
  resourceType: string
  stage: string
  approvalStatus: string
  approvalTicket: string | null
  previousStatus: string | undefined
  resourceKey: string
  operation: string
  decisionNote: string | null
  failureReason: string | null
}

function createOutcomeHarness() {
  const outcomes: OutcomeRecord[] = []
  const approvals: Array<{
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
  }> = []

  const prisma = {
    governanceApproval: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: `apr_${approvals.length + 1}`,
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
          createdAt: new Date(),
          updatedAt: new Date()
        }
        approvals.push(record)
        return record
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const index = approvals.findIndex((record) => record.id === where.id)
        if (index === -1) {
          throw new Error('not found')
        }
        const existing = approvals[index]!
        const updated = {
          ...existing,
          approvalTicket: (data.approvalTicket as string) ?? existing.approvalTicket,
          status: (data.status as ApprovalStatus) ?? existing.status,
          version: (data.version as number) ?? existing.version,
          decisionNote: data.decisionNote !== undefined ? (data.decisionNote as string | null) : existing.decisionNote,
          decidedBy: data.decidedBy !== undefined ? (data.decidedBy as string | null) : existing.decidedBy,
          decidedAt: data.decidedAt !== undefined ? (data.decidedAt as Date | null) : existing.decidedAt,
          summary: data.summary !== undefined ? data.summary : existing.summary,
          updatedAt: new Date()
        }
        approvals[index] = updated
        return updated
      },
      findUnique: async ({ where }: { where: { id?: string; approvalTicket?: string } }) => {
        if (where.approvalTicket) {
          return approvals.find((record) => record.approvalTicket === where.approvalTicket) ?? null
        }
        if (where.id) {
          return approvals.find((record) => record.id === where.id) ?? null
        }
        return null
      }
    },
    domainEvent: {
      findMany: async () => []
    }
  }

  const integrationOrchestrationService = {
    publishEvent: async () => ({ status: 'accepted' as const, eventId: 'evt_stub' })
  }
  const trustGovernanceService = {
    evaluateRateLimit: async () => ({
      scopeKey: 'noop',
      limit: 0,
      blockSeconds: 0,
      windowSeconds: 0,
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0
    }),
    recordAudit: async () => ({ auditId: 'audit_stub', eventType: 'noop' })
  }
  const runtimeGovernanceService = new RuntimeGovernanceService(
    prisma as never,
    integrationOrchestrationService as never,
    trustGovernanceService as never
  )

  const governanceApprovalService = new GovernanceApprovalService(
    prisma as never,
  )

  return { governanceApprovalService, prisma, outcomes }
}

async function materializeMemberApproval(service: GovernanceApprovalService) {
  return service.materializeApproval({
    operation: 'member.points.award',
    resourceType: 'member-profile',
    resourceKey: 'member-001',
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001',
    requestedBy: 'ops.admin-web',
    approvalRequired: true,
    requestPayload: { points: 5000 },
    summary: { memberId: 'member-001', payloadSummary: '高额加分 5000' }
  })
}

test('governance-approval service materialize + decide APPROVED', async () => {
  const harness = createOutcomeHarness()
  const pending = await materializeMemberApproval(harness.governanceApprovalService)
  const ticket = pending.ticket ?? ''
  const decided = await harness.governanceApprovalService.decideApproval({
    approvalTicket: ticket,
    decidedBy: 'ops.approver',
    status: 'APPROVED',
    decisionNote: 'manual review ok'
  })
  assert.equal(decided.status, 'APPROVED')
})

test('governance-approval service materialize + decide REJECTED', async () => {
  const harness = createOutcomeHarness()
  const pending = await materializeMemberApproval(harness.governanceApprovalService)
  const decided = await harness.governanceApprovalService.decideApproval({
    approvalTicket: pending.ticket ?? '',
    decidedBy: 'ops.approver',
    status: 'REJECTED',
    decisionNote: 'no proof'
  })
  assert.equal(decided.status, 'REJECTED')
})

test('governance-approval service materialize + cancel', async () => {
  const harness = createOutcomeHarness()
  const pending = await materializeMemberApproval(harness.governanceApprovalService)
  const cancelled = await harness.governanceApprovalService.cancelApproval({
    approvalTicket: pending.ticket ?? '',
    cancelledBy: 'ops.admin-web',
    cancelReason: 'withdraw'
  })
  assert.equal(cancelled.status, 'CANCELLED')
})

test('governance-approval service EXECUTED and EXECUTION_FAILED status flow', async () => {
  const harness = createOutcomeHarness()
  const pending = await materializeMemberApproval(harness.governanceApprovalService)
  const ticket = pending.ticket ?? ''
  await harness.governanceApprovalService.decideApproval({
    approvalTicket: ticket,
    decidedBy: 'ops.approver',
    status: 'APPROVED'
  })
  const executed = await harness.governanceApprovalService.markExecuted({
    approvalTicket: ticket,
    executedBy: 'admin-runtime',
    executionStatus: 'runtime-replay-scheduled'
  })
  assert.equal(executed.status, 'EXECUTED')

  await harness.governanceApprovalService.markExecutionFailed({
    approvalTicket: ticket,
    failedBy: 'admin-runtime',
    failureStatus: 'runtime-replay-error',
    failureReason: 'timeout'
  })
  assert.equal((await harness.governanceApprovalService.getApproval(ticket)).status, 'EXECUTION_FAILED')
})

test('governance-approval service handles non-member resource type', async () => {
  const harness = createOutcomeHarness()
  const result = await harness.governanceApprovalService.materializeApproval({
    operation: 'foundation.runtime-governance.replay',
    resourceType: 'runtime-receipt',
    resourceKey: 'receipt-001',
    tenantId: 'tenant-001',
    requestedBy: 'ops.admin-web',
    approvalRequired: true,
    requestPayload: { foo: 'bar' }
  })
  assert.ok(result.ticket)
})
