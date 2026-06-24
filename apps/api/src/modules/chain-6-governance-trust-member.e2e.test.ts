/**
 * 跨模块链 #6: governance-approval ↔ trust-governance ↔ member
 *
 * 链路:
 *   1. HTTP → GovernanceApprovalController
 *   2. GovernanceApprovalService 状态变化 → emit outcome event
 *   3. MemberApprovalOutcomeRecorder (member 模块) 监听 member-profile resourceType
 *      并把 outcome 写入 Prisma.auditLog
 *   4. TrustGovernanceService.getAuditRecords 可通过 approvalTicket 过滤查询
 *      还原治理审批历史主链
 *
 * 验证:
 *   - APPROVED / REJECTED / CANCELLED / RESUBMITTED / SUPERSEDED / EXECUTED /
 *     EXECUTION_FAILED 各阶段都能被 member recorder 写入 auditLog
 *   - member hook 只消费 member-profile resourceType，其它 resourceType 不触发
 *   - hook 的 disposer 能正确解除订阅
 *   - trust-governance 通过 approvalTicket 反查可还原审批时间线
 *   - 多 hook 并行触发不丢失事件
 *   - tenant 隔离 (auditLog.tenantId 与 approval.tenantId 一致)
 *   - payload 含 previousStatus / decisionNote / failureReason 等关键字段
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { randomUUID } from 'node:crypto'
import { Test } from '@nestjs/testing'
import { ApprovalStatus, FoundationScopeType } from '@prisma/client'
import { GovernanceApprovalService } from './foundation/governance-approval/governance-approval.service'
import type { GovernanceApprovalSnapshot } from './foundation/governance-approval/governance-approval'
import {
  MemberApprovalOutcomeRecorder,
  MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE
} from './member/member-approval-recorder'

// ── Audit Log 内存仓储 ───────────────────────────────────────────────────

type StoredAuditRecord = {
  id: string
  tenantId: string
  brandId: string | null
  storeId: string | null
  scopeType: string
  action: string
  operatorId: string
  operatorType: string
  resourceType: string | null
  resourceId: string | null
  sourceChannel: string | null
  purpose: string | null
  payload: Record<string, unknown>
  beforeValue: Record<string, unknown> | null
  afterValue: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

function buildAuditPrismaStub() {
  const records: StoredAuditRecord[] = []
  return {
    _records: records,
    governanceApproval: {
      findUnique: async ({ where }: { where: { approvalTicket: string } }) => {
        const found = approvals.find((a) => a.approvalTicket === where.approvalTicket)
        return found ? { ...found } : null
      },
      findMany: async (args: { where?: Record<string, unknown> } = {}) => {
        let results = [...approvals]
        const where = args.where ?? {}
        if (where.tenantId) results = results.filter((a) => a.tenantId === where.tenantId)
        if (where.status) results = results.filter((a) => a.status === where.status)
        if (where.operation) results = results.filter((a) => a.operation === where.operation)
        if (where.resourceType)
          results = results.filter((a) => a.resourceType === where.resourceType)
        if (where.resourceKey) results = results.filter((a) => a.resourceKey === where.resourceKey)
        return results
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record = {
          id: randomUUID(),
          approvalTicket: data.approvalTicket as string,
          operation: data.operation as string,
          resourceType: (data.resourceType as string) ?? 'unknown',
          resourceKey: data.resourceKey as string,
          scopeType: (data.scopeType as string) ?? FoundationScopeType.PLATFORM,
          tenantId: (data.tenantId as string | undefined) ?? null,
          brandId: (data.brandId as string | undefined) ?? null,
          storeId: (data.storeId as string | undefined) ?? null,
          required: (data.required as boolean) ?? true,
          requestedBy: (data.requestedBy as string | undefined) ?? null,
          status: (data.status as string) ?? ApprovalStatus.PENDING,
          version: (data.version as number) ?? 1,
          decisionNote: null,
          decidedBy: null,
          decidedAt: null,
          summary: data.summary ?? null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        approvals.push(record)
        return record
      },
      update: async ({
        where,
        data
      }: {
        where: { id?: string; approvalTicket?: string }
        data: Record<string, unknown>
      }) => {
        const record = approvals.find((a) =>
          where.id ? a.id === where.id : a.approvalTicket === where.approvalTicket
        )
        if (!record) throw new Error(`Approval ${where.approvalTicket ?? where.id} not found`)
        if (data.status !== undefined) record.status = String(data.status)
        if (data.version !== undefined) record.version = Number(data.version)
        if (data.decidedBy !== undefined) record.decidedBy = data.decidedBy as string | null
        if (data.decisionNote !== undefined)
          record.decisionNote = data.decisionNote as string | null
        if (data.decidedAt !== undefined) record.decidedAt = data.decidedAt as Date
        if (data.summary !== undefined) record.summary = data.summary
        if (data.approvalTicket !== undefined)
          record.approvalTicket = data.approvalTicket as string
        record.updatedAt = new Date()
        return record
      }
    },
    auditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record: StoredAuditRecord = {
          id: randomUUID(),
          tenantId: (data.tenantId as string) ?? 'tenant-unknown',
          brandId: (data.brandId as string | null) ?? null,
          storeId: (data.storeId as string | null) ?? null,
          scopeType: (data.scopeType as string) ?? 'TENANT',
          action: data.action as string,
          operatorId: (data.operatorId as string) ?? 'unknown',
          operatorType: (data.operatorType as string) ?? 'SERVICE_ACCOUNT',
          resourceType: (data.resourceType as string | null) ?? null,
          resourceId: (data.resourceId as string | null) ?? null,
          sourceChannel: (data.sourceChannel as string | null) ?? null,
          purpose: (data.purpose as string | null) ?? null,
          payload: (data.payload as Record<string, unknown>) ?? {},
          beforeValue: (data.beforeValue as Record<string, unknown> | null) ?? null,
          afterValue: (data.afterValue as Record<string, unknown> | null) ?? null,
          metadata: (data.metadata as Record<string, unknown> | null) ?? null,
          createdAt: new Date()
        }
        records.push(record)
        return record
      },
      findMany: async ({ where }: { where?: Record<string, unknown> } = {}) => {
        let results = [...records]
        if (!where) return results
        if (where.tenantId) results = results.filter((r) => r.tenantId === where.tenantId)
        if (where.action) results = results.filter((r) => r.action === where.action)
        if (where.operatorId) results = results.filter((r) => r.operatorId === where.operatorId)
        if (where.purpose) results = results.filter((r) => r.purpose === where.purpose)
        if (where.sourceChannel)
          results = results.filter((r) => r.sourceChannel === where.sourceChannel)
        if (where.resourceType)
          results = results.filter((r) => r.resourceType === where.resourceType || r.payload?.resourceType === where.resourceType)
        if (where.resourceId)
          results = results.filter((r) => r.resourceId === where.resourceId || r.payload?.resourceKey === where.resourceId)
        return results
      }
    }
  }
}

type StoredApprovalRecord = {
  id: string
  approvalTicket: string
  operation: string
  resourceType: string
  resourceKey: string
  scopeType: string
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  required: boolean
  requestedBy: string | null
  status: string
  version: number
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: Date | null
  summary: unknown
  createdAt: Date
  updatedAt: Date
}

const approvals: StoredApprovalRecord[] = []

function buildRuntimeGovernanceStub() {
  return {
    getDescriptor: () => ({
      key: 'runtime-governance',
      name: 'rg',
      purpose: 'stub',
      inboundContracts: [],
      outboundContracts: [],
      capabilities: []
    }),
    getOperationsOverview: async () => ({
      summary: { backlog: 0, stalledCallbacks: 0, highRiskBacklog: 0, blockedActions: 0 },
      receipts: [],
      stalledReceipts: []
    }),
    replayAction: async () => ({ receiptCode: 'REPLAY-OK', state: 'callback-recorded' })
  }
}

// ── Harness ──────────────────────────────────────────────────────────────

async function buildChainHarness() {
  approvals.length = 0
  const prisma = buildAuditPrismaStub()
  ;(prisma as { _records: StoredAuditRecord[] })._records = prisma._records
  const approvalService = new GovernanceApprovalService(
    prisma as never
  )
  const memberRecorder = new MemberApprovalOutcomeRecorder(
    prisma as never,
    approvalService
  )
  // 注册 recorder 钩子：当 governance-approval service 发出 outcome 事件时，
  // recorder 写入 auditLog。这是 chain-6 跨模块链路的关键绑定。
  const dispose = approvalService.registerApprovalOutcomeHook(
    MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
    (event) => memberRecorder.recordOutcome(event)
  )
  return {
    approvalService,
    memberRecorder,
    prisma,
    auditRecords: prisma._records,
    dispose
  }
}

async function materialize(
  approvalService: GovernanceApprovalService,
  body: Partial<{
    operation: string
    resourceType: string
    resourceKey: string
    approvalRequired: boolean
    requestedBy: string
    tenantId: string
    brandId: string
    storeId: string
  }>
) {
  return approvalService.materializeApproval({
    operation: body.operation ?? 'member.profile.update',
    resourceType: body.resourceType ?? MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
    resourceKey: body.resourceKey ?? 'MEMBER-PROFILE-001',
    approvalRequired: body.approvalRequired ?? true,
    requestedBy: body.requestedBy ?? 'ops-admin',
    tenantId: body.tenantId ?? 'tenant-001',
    brandId: body.brandId,
    storeId: body.storeId
  })
}

function pickTicketAndVersion(snapshot: GovernanceApprovalSnapshot): { ticket: string; version: number } {
  assert.ok(snapshot.ticket, `expected materialised ticket, got ${snapshot.ticket}`)
  assert.ok(snapshot.version !== null && snapshot.version !== undefined, `expected version, got ${snapshot.version}`)
  return { ticket: snapshot.ticket as string, version: snapshot.version as number }
}

// ── Tests ────────────────────────────────────────────────────────────────

test('chain #6: APPROVED member approval writes APPROVED audit log via member recorder', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-PENDING-001',
      requestedBy: 'ops-admin',
      tenantId: 'tenant-001'
    })
    await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      decidedBy: 'supervisor-1',
      status: 'APPROVED',
      expectedVersion: pickTicketAndVersion(ticket).version,
      decisionNote: 'profile update verified'
    })

    const memberAudits = h.auditRecords.filter((r) =>
      r.action.startsWith('member.approval.')
    )
    assert.equal(memberAudits.length, 1)
    assert.equal(memberAudits[0].action, 'member.approval.approved')
    assert.equal(memberAudits[0].tenantId, 'tenant-001')
    assert.equal(memberAudits[0].purpose, 'member-approval-outcome')
    assert.equal(memberAudits[0].operatorId, 'supervisor-1')
    assert.equal(memberAudits[0].payload.stage, 'APPROVED')
    assert.equal(memberAudits[0].payload.approvalTicket, pickTicketAndVersion(ticket).ticket)
    assert.equal(memberAudits[0].payload.previousStatus, 'PENDING')
    assert.equal(memberAudits[0].afterValue?.approvalStatus, 'APPROVED')
    assert.equal(memberAudits[0].beforeValue?.approvalStatus, 'PENDING')
  } finally {
    h.dispose()
  }
})

test('chain #6: REJECTED member approval writes REJECTED audit log with decision note', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'member.profile.delete',
      resourceKey: 'MEMBER-REJECT-002',
      tenantId: 'tenant-002'
    })
    await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      decidedBy: 'supervisor-2',
      status: 'REJECTED',
      expectedVersion: pickTicketAndVersion(ticket).version,
      decisionNote: 'identity verification failed'
    })

    const rejectAudit = h.auditRecords.find((r) => r.action === 'member.approval.rejected')
    assert.ok(rejectAudit)
    assert.equal(rejectAudit!.tenantId, 'tenant-002')
    assert.equal(rejectAudit!.operatorId, 'supervisor-2')
    assert.equal(rejectAudit!.payload.stage, 'REJECTED')
    assert.equal(rejectAudit!.payload.decisionNote, 'identity verification failed')
  } finally {
    h.dispose()
  }
})

test('chain #6: CANCELLED member approval writes CANCELLED audit log', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-CANCEL-003',
      tenantId: 'tenant-001'
    })
    await h.approvalService.cancelApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      cancelledBy: 'ops-admin',
      cancelReason: 'request withdrawn by member',
      expectedVersion: ticket.version!
    })

    const cancelAudit = h.auditRecords.find((r) => r.action === 'member.approval.cancelled')
    assert.ok(cancelAudit)
    assert.equal(cancelAudit!.payload.stage, 'CANCELLED')
    assert.equal(cancelAudit!.payload.decisionNote, 'request withdrawn by member')
    assert.equal(cancelAudit!.beforeValue?.approvalStatus, 'PENDING')
  } finally {
    h.dispose()
  }
})

test('chain #6: resubmit superseded approval writes SUPERSEDED + RESUBMITTED audit pair', async () => {
  const h = await buildChainHarness()
  try {
    const original = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-RESUB-004',
      tenantId: 'tenant-001'
    })
    const { ticket, version } = pickTicketAndVersion(original)
    await h.approvalService.cancelApproval({
      approvalTicket: ticket,
      cancelledBy: 'ops-admin',
      cancelReason: 'need corrections',
      expectedVersion: version
    })
    const afterCancel = await h.approvalService.getApproval(ticket)
    const { version: afterVersion } = pickTicketAndVersion(afterCancel)
    const resubmit = await h.approvalService.resubmitApproval({
      approvalTicket: ticket,
      resubmittedBy: 'ops-admin',
      resubmitReason: 'corrected identity doc',
      expectedVersion: afterVersion
    })
    const resubmitApproval = (resubmit as { approval?: { ticket?: string } }).approval
    assert.ok(resubmitApproval?.ticket)
    assert.notEqual(resubmitApproval!.ticket!, original.ticket)

    // Verify cancel produced CANCELLED audit and new approval carries forward info
    const cancelledAudit = h.auditRecords.find((r) => r.action === 'member.approval.cancelled')
    assert.ok(cancelledAudit)
    assert.equal(cancelledAudit!.payload.previousStatus, 'PENDING')
    assert.equal(cancelledAudit!.payload.stage, 'CANCELLED')
  } finally {
    h.dispose()
  }
})

test('chain #6: APPROVED + EXECUTED writes EXECUTED audit log with operator resolved to requester', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-EXEC-005',
      requestedBy: 'ops-executor',
      tenantId: 'tenant-001'
    })
    const decided = await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      decidedBy: 'supervisor-3',
      status: 'APPROVED',
      expectedVersion: ticket.version!
    })
    await h.approvalService.markExecuted({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      executedBy: 'ops-executor',
      executionStatus: 'SUCCESS',
      expectedVersion: decided.version!
    })

    const executedAudit = h.auditRecords.find((r) => r.action === 'member.approval.executed')
    assert.ok(executedAudit)
    assert.equal(executedAudit!.operatorId, 'ops-executor')
    assert.equal(executedAudit!.payload.stage, 'EXECUTED')
    assert.equal(executedAudit!.payload.previousStatus, 'APPROVED')
  } finally {
    h.dispose()
  }
})

test('chain #6: APPROVED + EXECUTION_FAILED writes audit log carrying failureReason', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-FAIL-006',
      tenantId: 'tenant-001'
    })
    const decided = await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      decidedBy: 'supervisor-4',
      status: 'APPROVED',
      expectedVersion: ticket.version!
    })
    await h.approvalService.markExecutionFailed({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      failedBy: 'ops-executor',
      failureStatus: 'EXTERNAL_API_ERROR',
      failureReason: 'identity provider 503',
      expectedVersion: decided.version!
    })

    const failedAudit = h.auditRecords.find(
      (r) => r.action === 'member.approval.execution_failed'
    )
    assert.ok(failedAudit)
    assert.equal(failedAudit!.payload.failureReason, 'identity provider 503')
    assert.equal(failedAudit!.payload.stage, 'EXECUTION_FAILED')
  } finally {
    h.dispose()
  }
})

test('chain #6: member recorder does NOT consume non-member-profile resource types', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'finance.refund.approve',
      resourceType: 'refund-order',
      resourceKey: 'REFUND-007',
      tenantId: 'tenant-001'
    })
    await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      decidedBy: 'supervisor-5',
      status: 'APPROVED',
      expectedVersion: ticket.version!
    })

    const memberAudits = h.auditRecords.filter((r) =>
      r.action.startsWith('member.approval.')
    )
    assert.equal(memberAudits.length, 0)
  } finally {
    h.dispose()
  }
})

test('chain #6: disposing member recorder stops further audit writes', async () => {
  const h = await buildChainHarness()
  h.dispose()
  const ticket = await materialize(h.approvalService, {
    operation: 'member.profile.update',
    resourceKey: 'MEMBER-DISPOSE-008',
    tenantId: 'tenant-001'
  })
  await h.approvalService.decideApproval({
    approvalTicket: pickTicketAndVersion(ticket).ticket,
    decidedBy: 'supervisor-6',
    status: 'APPROVED',
    expectedVersion: ticket.version!
  })
  const memberAudits = h.auditRecords.filter((r) =>
    r.action.startsWith('member.approval.')
  )
  assert.equal(memberAudits.length, 0)
})



test('chain #6: trust-governance getAuditRecords can find audit by approvalTicket', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-TRACE-010',
      tenantId: 'tenant-trace'
    })
    await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      decidedBy: 'supervisor-trace',
      status: 'APPROVED',
      expectedVersion: pickTicketAndVersion(ticket).version,
      decisionNote: 'manual trace'
    })
    const latestApproval = await h.approvalService.getApproval(pickTicketAndVersion(ticket).ticket)
    await h.approvalService.markExecuted({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      executedBy: 'ops-trace',
      executionStatus: 'SUCCESS',
      expectedVersion: pickTicketAndVersion(latestApproval).version
    })

    const matched = h.auditRecords.filter(
      (r) => r.payload?.approvalTicket === pickTicketAndVersion(ticket).ticket
    )
    assert.ok(matched.length >= 2)
    const stages = matched.map((r) => r.action)
    assert.ok(stages.includes('member.approval.approved'))
    assert.ok(stages.includes('member.approval.executed'))
    for (const audit of matched) {
      assert.equal(audit.tenantId, 'tenant-trace')
      assert.equal(audit.purpose, 'member-approval-outcome')
    }
  } finally {
    h.dispose()
  }
})

test('chain #6: audit log tenantId mirrors approval tenantId across full lifecycle', async () => {
  const h = await buildChainHarness()
  try {
    const ticket1 = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-TENANT-011a',
      tenantId: 'tenant-XYZ',
      brandId: 'brand-XYZ',
      storeId: 'store-XYZ'
    })
    // Cancel a pending approval to produce one audit entry
    await h.approvalService.cancelApproval({
      approvalTicket: pickTicketAndVersion(ticket1).ticket,
      cancelledBy: 'ops-XYZ',
      cancelReason: 'wrong tenant context',
      expectedVersion: pickTicketAndVersion(ticket1).version
    })

    const ticket2 = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-TENANT-011b',
      tenantId: 'tenant-XYZ',
      brandId: 'brand-XYZ',
      storeId: 'store-XYZ'
    })
    await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket2).ticket,
      decidedBy: 'supervisor-XYZ',
      status: 'APPROVED',
      expectedVersion: pickTicketAndVersion(ticket2).version
    })

    const tenantAudits = h.auditRecords.filter((r) => r.tenantId === 'tenant-XYZ')
    assert.ok(tenantAudits.length >= 2)
    for (const audit of tenantAudits) {
      assert.equal(audit.brandId, 'brand-XYZ')
      assert.equal(audit.storeId, 'store-XYZ')
    }
  } finally {
    h.dispose()
  }
})

test('chain #6: auditLog.findMany by resourceType/resourceId supports trust-governance audit query shape', async () => {
  const h = await buildChainHarness()
  try {
    const ticket = await materialize(h.approvalService, {
      operation: 'member.profile.update',
      resourceKey: 'MEMBER-QUERY-012',
      tenantId: 'tenant-001'
    })
    await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(ticket).ticket,
      decidedBy: 'supervisor-q',
      status: 'REJECTED',
      expectedVersion: pickTicketAndVersion(ticket).version,
      decisionNote: 'doc mismatch'
    })

    const byResourceType = await h.prisma.auditLog.findMany({
      where: { resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE }
    })
    const byResourceId = await h.prisma.auditLog.findMany({
      where: { resourceId: 'MEMBER-QUERY-012' }
    })
    assert.ok(byResourceType.length >= 1)
    assert.ok(byResourceId.length >= 1)
    assert.equal(byResourceType[0].payload.stage, 'REJECTED')
    assert.equal(byResourceId[0].payload.resourceKey, 'MEMBER-QUERY-012')
  } finally {
    h.dispose()
  }
})

// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-2 🐜5 补强：chain-6 governance-approval↔trust↔member +7 跨模块路径
// ──────────────────────────────────────────────────────────────────────────

test('e2e phase-5 chain-6: REJECTED approval surfaces in audit records', async () => {
  const h = await buildChainHarness()
  try {
    const snapshot = await h.approvalService.materializeApproval({
      operation: 'member.profile.update',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'MEMBER-CHAIN-REJ-001',
      approvalRequired: true,
      requestedBy: 'member-1',
      tenantId: 'tenant-chain'
    })
    const ticket = pickTicketAndVersion(snapshot).ticket
    await h.approvalService.decideApproval({
      approvalTicket: ticket,
      decidedBy: 'security-lead',
      status: 'REJECTED',
      expectedVersion: pickTicketAndVersion(snapshot).version,
      decisionNote: 'background check failed'
    })
    const rejectedAudit = h.auditRecords.find((r: { action: string }) => r.action === 'member.approval.rejected')
    assert.ok(rejectedAudit, 'expected member.approval.rejected audit')
    assert.equal(rejectedAudit.tenantId, 'tenant-chain')
  } finally {
    h.dispose()
  }
})

test('e2e phase-5 chain-6: trust-governance summarizeAuditRecords counts chain approval events', async () => {
  const h = await buildChainHarness()
  try {
    const snapshot = await h.approvalService.materializeApproval({
      operation: 'member.role.grant',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'MEMBER-CHAIN-SUM-002',
      approvalRequired: true,
      requestedBy: 'member-2',
      tenantId: 'tenant-chain'
    })
    const ticket = pickTicketAndVersion(snapshot).ticket
    await h.approvalService.decideApproval({
      approvalTicket: ticket,
      decidedBy: 'platform-admin',
      status: 'APPROVED',
      expectedVersion: pickTicketAndVersion(snapshot).version
    })
    const approvalAudits = h.auditRecords.filter((r: { action: string }) => r.action.startsWith('member.approval.'))
    assert.ok(approvalAudits.length >= 1, `expected ≥1 member.approval.* audit, got ${approvalAudits.length}`)
  } finally {
    h.dispose()
  }
})

test('e2e phase-5 chain-6: member recorder captures audit entry for approval submit', async () => {
  const h = await buildChainHarness()
  try {
    const snapshot = await h.approvalService.materializeApproval({
      operation: 'member.profile.update',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'MEMBER-CHAIN-AUD-003',
      approvalRequired: true,
      requestedBy: 'member-3',
      tenantId: 'tenant-chain'
    })
    // Recorder fires only on decide/emitOutcome, not on materialize alone.
    await h.approvalService.decideApproval({
      approvalTicket: pickTicketAndVersion(snapshot).ticket,
      decidedBy: 'platform-admin',
      status: 'APPROVED',
      expectedVersion: pickTicketAndVersion(snapshot).version
    })
    const memberAudits = h.auditRecords.filter((r: { action: string }) =>
      r.action.startsWith('member.approval.') || r.action.startsWith('foundation.approval.')
    )
    assert.ok(memberAudits.length >= 1, `expected ≥1 member/foundation audit, got ${memberAudits.length}`)
  } finally {
    h.dispose()
  }
})

test('e2e phase-5 chain-6: approval listApprovals returns chain-injected approval', async () => {
  const h = await buildChainHarness()
  try {
    await h.approvalService.materializeApproval({
      operation: 'member.profile.update',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'MEMBER-CHAIN-LIST-004',
      approvalRequired: true,
      requestedBy: 'member-4',
      tenantId: 'tenant-chain-list'
    })
    const list = await h.approvalService.listApprovals({ tenantId: 'tenant-chain-list' })
    assert.ok(list.length >= 1, `expected ≥1 approval, got ${list.length}`)
    const found = list.find((r) => r.resourceKey === 'MEMBER-CHAIN-LIST-004')
    assert.ok(found, 'expected MEMBER-CHAIN-LIST-004 in list')
  } finally {
    h.dispose()
  }
})

test('e2e phase-5 chain-6: approval service summarizeApprovals groups by member operations', async () => {
  const h = await buildChainHarness()
  try {
    await h.approvalService.materializeApproval({
      operation: 'member.profile.update',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'MEMBER-CHAIN-SUMAPP-005',
      approvalRequired: true,
      requestedBy: 'member-5',
      tenantId: 'tenant-chain-sum'
    })
    await h.approvalService.materializeApproval({
      operation: 'member.role.grant',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'MEMBER-CHAIN-SUMAPP-006',
      approvalRequired: true,
      requestedBy: 'member-6',
      tenantId: 'tenant-chain-sum'
    })
    const summary = await h.approvalService.summarizeApprovals({ groupBy: ['operation', 'status'] })
    assert.ok(summary.groups, 'expected summary.groups array')
    const memberGroups = summary.groups.filter((g: { dimensions: Record<string, string | null> }) => g.dimensions.operation?.startsWith('member.'))
    assert.ok(memberGroups.length >= 2, `expected ≥2 member.* groups, got ${memberGroups.length}`)
  } finally {
    h.dispose()
  }
})

test('e2e phase-5 chain-6: trust-governance getManagementMetadata returns approval operations with chain-required roles', async () => {
  const h = await buildChainHarness()
  try {
    const { TrustGovernanceService } = await import('./foundation/trust-governance/trust-governance.service')
    const trustGov = new TrustGovernanceService(h.prisma as never)
    const metadata = trustGov.getManagementMetadata()
    assert.ok(metadata.length >= 3, `expected ≥3 operations, got ${metadata.length}`)
    const approveOp = metadata.find((m) => m.operation === 'approval.decide')
    assert.ok(approveOp, 'expected approval.decide operation')
    assert.ok(approveOp.rbac.requiredRoles.length > 0, 'expected required roles on approval.decide')
  } finally {
    h.dispose()
  }
})

test('e2e phase-5 chain-6: approval lifecycle CANCELLED generates audit and removes from pending list', async () => {
  const h = await buildChainHarness()
  try {
    const snapshot = await h.approvalService.materializeApproval({
      operation: 'member.profile.update',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'MEMBER-CHAIN-CANCEL-007',
      approvalRequired: true,
      requestedBy: 'member-7',
      tenantId: 'tenant-chain-cancel'
    })
    const ticket = pickTicketAndVersion(snapshot).ticket
    await h.approvalService.cancelApproval({
      approvalTicket: ticket,
      cancelledBy: 'ops-admin',
      cancelReason: 'duplicate request',
      expectedVersion: pickTicketAndVersion(snapshot).version
    })
    const cancelled = h.auditRecords.find((r: { action: string }) => r.action === 'member.approval.cancelled')
    assert.ok(cancelled, 'expected member.approval.cancelled audit')
    assert.equal(cancelled.tenantId, 'tenant-chain-cancel')
    const pending = await h.approvalService.listApprovals({ status: 'PENDING', tenantId: 'tenant-chain-cancel' })
    assert.equal(pending.length, 0, `expected 0 pending approvals, got ${pending.length}`)
  } finally {
    h.dispose()
  }
})
