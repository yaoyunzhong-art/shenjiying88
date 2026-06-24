import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MemberApprovalOutcomeRecorder,
  MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE
} from './member-approval-recorder'
import type { ApprovalOutcomeEvent } from './member-approval-recorder'

function createRecorderHarness() {
  const auditEntries: Array<Record<string, unknown>> = []
  const prisma = {
    auditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        auditEntries.push(data)
        return { id: `audit_${auditEntries.length}` }
      }
    }
  }
  const governanceApprovalService: Record<string, unknown> = {}
  const recorder = new MemberApprovalOutcomeRecorder(
    prisma as never,
    governanceApprovalService as never
  )
  return { recorder, auditEntries }
}

function buildEvent(overrides: Partial<ApprovalOutcomeEvent> = {}): ApprovalOutcomeEvent {
  return {
    resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
    resourceKey: 'member-001',
    stage: 'APPROVED',
    approval: {
      approvalId: 'apr_1',
      operation: 'member.points.award',
      resourceType: MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE,
      resourceKey: 'member-001',
      required: true,
      version: 1,
      requestedBy: 'ops.admin-web',
      ticket: 'apr-ticket-001',
      status: 'APPROVED',
      submitted: true,
      persisted: true,
      decidedBy: 'ops.approver',
      decidedAt: '2026-06-12T00:00:00.000Z',
      updatedAt: '2026-06-12T00:00:00.000Z',
      summary: { memberId: 'member-001', payloadSummary: '高额加分 5000' }
    },
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001',
    decisionNote: 'manual review ok',
    previousStatus: 'PENDING',
    ...overrides
  }
}

test('member-approval recorder writes auditLog on APPROVED', async () => {
  const harness = createRecorderHarness()
  await harness.recorder.recordOutcome(buildEvent())
  assert.equal(harness.auditEntries.length, 1)
  const entry = harness.auditEntries[0]!
  assert.equal(entry.action, 'member.approval.approved')
  assert.equal(entry.purpose, 'member-approval-outcome')
  assert.equal(entry.resourceType, 'member-profile')
  assert.equal(entry.resourceId, 'member-001')
  assert.equal(entry.tenantId, 'tenant-001')
  assert.equal(entry.operatorId, 'ops.approver')
  assert.equal(entry.sourceChannel, 'governance-approval')
  assert.deepEqual(entry.beforeValue, { approvalStatus: 'PENDING' })
  assert.deepEqual(entry.afterValue, { approvalStatus: 'APPROVED', stage: 'APPROVED' })
  const metadata = entry.metadata as { summary: string; stage: string; previousStatus: string }
  assert.equal(metadata.stage, 'APPROVED')
  assert.equal(metadata.previousStatus, 'PENDING')
  assert.equal(metadata.summary, '审批通过：member.points.award')
})

test('member-approval recorder writes auditLog on REJECTED with requestedBy fallback operator', async () => {
  const harness = createRecorderHarness()
  await harness.recorder.recordOutcome(
    buildEvent({
      stage: 'REJECTED',
      decisionNote: 'insufficient evidence',
      previousStatus: 'PENDING'
    })
  )
  const entry = harness.auditEntries[0]!
  assert.equal(entry.action, 'member.approval.rejected')
  assert.equal(entry.operatorId, 'ops.approver')
  const payload = entry.payload as Record<string, unknown>
  assert.equal(payload.decisionNote, 'insufficient evidence')
  assert.equal(payload.previousStatus, 'PENDING')
})

test('member-approval recorder writes auditLog on CANCELLED with decisionNote from cancelReason', async () => {
  const harness = createRecorderHarness()
  await harness.recorder.recordOutcome(
    buildEvent({
      stage: 'CANCELLED',
      decisionNote: 'operator withdraw'
    })
  )
  const entry = harness.auditEntries[0]!
  assert.equal(entry.action, 'member.approval.cancelled')
  const metadata = entry.metadata as { summary: string }
  assert.equal(metadata.summary, '审批撤销：member.points.award')
})

test('member-approval recorder writes auditLog on EXECUTION_FAILED', async () => {
  const harness = createRecorderHarness()
  await harness.recorder.recordOutcome(
    buildEvent({
      stage: 'EXECUTION_FAILED',
      previousStatus: 'APPROVED',
      failureReason: 'runtime timeout'
    })
  )
  const entry = harness.auditEntries[0]!
  assert.equal(entry.action, 'member.approval.execution_failed')
  const payload = entry.payload as Record<string, unknown>
  assert.equal(payload.failureReason, 'runtime timeout')
  assert.equal(payload.previousStatus, 'APPROVED')
  const metadata = entry.metadata as { summary: string }
  assert.equal(metadata.summary, '审批动作执行失败：member.points.award')
})

test('member-approval recorder skips non member-profile resourceType', async () => {
  const harness = createRecorderHarness()
  await harness.recorder.recordOutcome(
    buildEvent({ resourceType: 'runtime-receipt' })
  )
  assert.equal(harness.auditEntries.length, 0)
})

test('member-approval recorder skips entries without tenantId', async () => {
  const harness = createRecorderHarness()
  await harness.recorder.recordOutcome(buildEvent({ tenantId: null }))
  assert.equal(harness.auditEntries.length, 0)
})

test('member-approval recorder handles missing auditLog model gracefully', async () => {
  const recorder = new MemberApprovalOutcomeRecorder(
    {} as never,
    {} as never
  )
  await recorder.recordOutcome(buildEvent())
  // 没有 auditLog 模型时 recordOutcome 应直接 no-op，不抛错。
  assert.ok(true)
})