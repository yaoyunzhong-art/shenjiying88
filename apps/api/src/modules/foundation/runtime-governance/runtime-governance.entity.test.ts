/**
 * 🐜 自动: [runtime-governance] [D] entity 测试补全
 *
 * 验证 entity 文件中导出的类型可通过类型系统正确推断。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import type {
  RuntimeGovernanceReceipt,
  RuntimeGovernanceActionState,
  RuntimeGovernanceTicket,
  RuntimeGovernanceSyncContract,
  RuntimeGovernanceCallbackReceipt,
  RuntimeGovernanceLedgerRecord,
  RuntimeGovernanceReplayPolicy,
  RuntimeGovernanceRateLimitDecision,
  RuntimeGovernanceApproval,
  RuntimeGovernanceEventRecord,
  RuntimeGovernanceSubmitRequest,
  RuntimeGovernanceSyncRequest,
  RuntimeGovernanceCallbackRequest,
  RuntimeGovernanceReplayRequest,
  RuntimeGovernanceCallbackStallDetail,
  RuntimeGovernanceOperationsOverview,
  RuntimeGovernanceOperationsOverviewSummary,
  RuntimeGovernanceOverviewFilter
} from './runtime-governance.entity'

describe('runtime-governance entity type exports', () => {
  test('RuntimeGovernanceReceipt 类型可被构造', () => {
    const receipt: RuntimeGovernanceReceipt = {
      receiptCode: 'test-001',
      app: 'admin-web',
      action: 'runtime-replay',
      state: 'submitted' as RuntimeGovernanceActionState,
      nextStep: 'PROCEED' as const,
      riskLevel: 'medium' as const,
      recommendedAction: 'FOLLOW_SUBMIT_CALLBACK' as const,
      requestEndpoint: '/api/test',
      payloadSummary: '{}',
      ticket: {} as RuntimeGovernanceTicket,
      sync: {} as RuntimeGovernanceSyncContract,
      callback: {} as RuntimeGovernanceCallbackReceipt,
      ledger: {} as RuntimeGovernanceLedgerRecord,
      retry: {} as RuntimeGovernanceReplayPolicy,
      rateLimit: {} as RuntimeGovernanceRateLimitDecision,
      events: [],
      generatedAt: new Date().toISOString()
    }
    assert.ok(receipt)
    assert.equal(receipt.receiptCode, 'test-001')
  })

  test('RuntimeGovernanceReceipt state 枚举值被正确推断', () => {
    const states: RuntimeGovernanceActionState[] = ['submitted', 'blocked', 'challenge-issued', 'callback-recorded', 'replay-scheduled']
    assert.ok(states.length === 5)
  })

  test('RuntimeGovernanceApproval 类型可被构造', () => {
    const approval: RuntimeGovernanceApproval = {
      required: true,
      ticket: 'APR-001',
      status: 'PENDING',
      requestedBy: 'actor-001',
      decidedBy: null,
      decidedAt: null,
      updatedAt: new Date().toISOString()
    }
    assert.ok(approval)
    assert.equal(approval.required, true)
    assert.equal(approval.status, 'PENDING')
  })

  test('RuntimeGovernanceEventRecord 类型可被构造', () => {
    const event: RuntimeGovernanceEventRecord = {
      eventType: 'runtime-governance.action.submitted',
      status: 'accepted',
      idempotencyKey: 'ik-001',
      occurredAt: new Date().toISOString(),
      summary: 'action submitted'
    }
    assert.ok(event)
    assert.equal(event.eventType, 'runtime-governance.action.submitted')
  })

  test('RuntimeGovernanceSubmitRequest 类型可被构造', () => {
    const req: RuntimeGovernanceSubmitRequest = {
      app: 'admin-web',
      action: 'runtime-replay',
      nextStep: 'PROCEED' as const,
      riskLevel: 'low' as const,
      requestEndpoint: '/api/test',
      payloadSummary: '{}',
      recommendedAction: 'FOLLOW_SUBMIT_CALLBACK' as const,
      handlerName: 'test-handler',
      idempotencyKey: 'submit:001',
      payload: {}
    }
    assert.ok(req)
    assert.equal(req.app, 'admin-web')
  })

  test('RuntimeGovernanceSyncRequest 类型可被构造', () => {
    const req: RuntimeGovernanceSyncRequest = {
      handlerName: 'test-handler',
      ticketCode: 'T-001',
      idempotencyKey: 'sync:001'
    }
    assert.equal(req.handlerName, 'test-handler')
  })

  test('RuntimeGovernanceCallbackRequest 类型可被构造', () => {
    const req: RuntimeGovernanceCallbackRequest = {
      callbackStatus: 'callback-recorded',
      ackToken: 'ack-001',
      lastEvent: 'HANDLER_COMPLETED',
      summary: 'done',
      idempotencyKey: 'cb:001'
    }
    assert.equal(req.callbackStatus, 'callback-recorded')
  })

  test('RuntimeGovernanceReplayRequest 类型可被构造', () => {
    const req: RuntimeGovernanceReplayRequest = {
      ledgerKey: 'ledger:001',
      requestedFrom: 'TOB_WEB_RUNTIME',
      ticketCode: 'T-001',
      idempotencyKey: 'replay:001'
    }
    assert.equal(req.requestedFrom, 'TOB_WEB_RUNTIME')
  })

  test('RuntimeGovernanceCallbackStallDetail 类型可被构造', () => {
    const detail: RuntimeGovernanceCallbackStallDetail = {
      receiptCode: 'rcpt-001',
      app: 'admin-web',
      action: 'runtime-replay',
      riskLevel: 'medium',
      handlerName: 'test-handler',
      callbackStatus: 'awaiting-callback',
      replayable: true,
      scopeKey: 'scope-001',
      latestEventType: 'HANDLER_ACCEPTED',
      stalled: true,
      timeoutMs: 30000,
      elapsedMs: 60000,
      exceededMs: 30000,
      escalationAction: 'OPEN_MANUAL_REVIEW' as const,
      summary: 'stalled for 1 min'
    }
    assert.ok(detail)
    assert.equal(detail.stalled, true)
    assert.equal(detail.receiptCode, 'rcpt-001')
  })

  test('RuntimeGovernanceOperationsOverviewSummary 类型可被构造', () => {
    const summary: RuntimeGovernanceOperationsOverviewSummary = {
      backlog: 10,
      stalledCallbacks: 3,
      highRiskBacklog: 2,
      blockedActions: 1
    }
    assert.equal(summary.backlog, 10)
  })

  test('RuntimeGovernanceOperationsOverview 类型可被构造', () => {
    const overview: RuntimeGovernanceOperationsOverview = {
      generatedAt: new Date().toISOString(),
      appliedFilter: {} as RuntimeGovernanceOverviewFilter,
      summary: { backlog: 0, stalledCallbacks: 0, highRiskBacklog: 0, blockedActions: 0 },
      totalSummary: { backlog: 0, stalledCallbacks: 0, highRiskBacklog: 0, blockedActions: 0 },
      receipts: [] as RuntimeGovernanceReceipt[],
      stalledReceipts: [] as RuntimeGovernanceCallbackStallDetail[],
      batchSummary: {
        filteredReceipts: 0,
        replayableReceipts: 0,
        governanceAuditReceipts: 0,
        stalledReceipts: 0,
        blockedReceipts: 0,
        highRiskReceipts: 0
      }
    }
    assert.ok(overview)
    assert.equal(overview.batchSummary.filteredReceipts, 0)
  })

  test('RuntimeGovernanceRateLimitDecision 类型可被构造', () => {
    const decision: RuntimeGovernanceRateLimitDecision = {
      allowed: true,
      limit: 12,
      remaining: 10,
      retryAfterSeconds: 0,
      scopeKey: 'admin-web:action:t-001'
    }
    assert.equal(decision.allowed, true)
  })
})
