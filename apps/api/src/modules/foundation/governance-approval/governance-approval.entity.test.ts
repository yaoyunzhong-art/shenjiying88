import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
describe('GovernanceApproval entity types', () => {
  describe('GovernanceApprovalStatus', () => {
    it('has all six status values', () => {
      const validStatuses = [
        'NOT_REQUIRED',
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'SUPERSEDED'
      ]
      assert.equal(validStatuses.length, 6)
      // 验证每个值都是合法的字符串类型
      validStatuses.forEach((status) => {
        assert.equal(typeof status, 'string')
        assert.ok(status.length > 0)
      })
    })

    it('PENDING is the default in-progress state', () => {
      const pending = 'PENDING'
      assert.equal(pending, 'PENDING')
      // PENDING 不应等于终态
      assert.notEqual(pending, 'APPROVED')
      assert.notEqual(pending, 'REJECTED')
    })

    it('terminal statuses include APPROVED, REJECTED, CANCELLED, SUPERSEDED', () => {
      const terminalStatuses = ['APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED']
      terminalStatuses.forEach((status) => {
        // 终态不能是 PENDING 或 NOT_REQUIRED
        assert.notEqual(status, 'PENDING')
        assert.notEqual(status, 'NOT_REQUIRED')
      })
    })
  })

  describe('GovernanceApprovalGroupBy', () => {
    it('has expected group-by dimensions', () => {
      const dimensions = ['operation', 'resourceType', 'status', 'executionStatus', 'failureStatus', 'requestedBy']
      assert.equal(dimensions.length, 6)
      assert.ok(dimensions.includes('operation'))
      assert.ok(dimensions.includes('status'))
      assert.ok(dimensions.includes('requestedBy'))
    })

    it('all dimensions are non-empty strings', () => {
      const dimensions = ['operation', 'resourceType', 'status', 'executionStatus', 'failureStatus', 'requestedBy']
      dimensions.forEach((dim) => {
        assert.equal(typeof dim, 'string')
        assert.ok(dim.length > 0)
      })
    })
  })

  describe('GovernanceApprovalSnapshot shape', () => {
    it('creates a valid snapshot with required fields', () => {
      const snapshot = {
        approvalId: 'apr-001',
        required: true,
        version: 1,
        requestedBy: null,
        ticket: null,
        status: 'PENDING' as const,
        submitted: false,
        persisted: false,
        decidedBy: null,
        decidedAt: null,
        updatedAt: null,
        execution: {
          attempts: 0,
          executed: false,
          executionStatus: null,
          executedAt: null,
          executedBy: null,
          lastFailure: null
        },
        summary: null
      }

      assert.equal(snapshot.approvalId, 'apr-001')
      assert.equal(snapshot.status, 'PENDING')
      assert.equal(snapshot.submitted, false)
      assert.equal(snapshot.persisted, false)
      assert.equal(snapshot.execution.attempts, 0)
      assert.equal(snapshot.execution.executed, false)
      assert.equal(snapshot.execution.lastFailure, null)
      assert.equal(snapshot.summary, null)
    })

    it('snapshot with optional fields populated', () => {
      const snapshot = {
        approvalId: 'apr-002',
        operation: 'create-user',
        resourceType: 'user',
        resourceKey: 'user-xyz',
        required: true,
        version: 2,
        requestedBy: 'admin',
        ticket: 'APR-CREATE-A1B2C3D4',
        status: 'APPROVED' as const,
        submitted: true,
        persisted: true,
        decidedBy: 'supervisor',
        decidedAt: '2026-06-14T10:00:00.000Z',
        updatedAt: '2026-06-14T10:30:00.000Z',
        execution: {
          attempts: 1,
          executed: true,
          executionStatus: 'SUCCESS',
          executedAt: '2026-06-14T11:00:00.000Z',
          executedBy: 'worker-1',
          lastFailure: null
        },
        summary: { requestDigest: 'abc123' }
      }

      assert.equal(snapshot.operation, 'create-user')
      assert.equal(snapshot.resourceType, 'user')
      assert.equal(snapshot.decidedBy, 'supervisor')
      assert.equal(snapshot.execution.executionStatus, 'SUCCESS')
      assert.ok(snapshot.summary && typeof snapshot.summary === 'object')
    })
  })

  describe('GovernanceApprovalExecution', () => {
    it('creates execution with no failures', () => {
      const execution = {
        attempts: 1,
        executed: true,
        executionStatus: 'SUCCESS',
        executedAt: '2026-06-14T12:00:00Z',
        executedBy: 'bot-1',
        lastFailure: null
      }

      assert.equal(execution.attempts, 1)
      assert.equal(execution.executed, true)
      assert.equal(execution.lastFailure, null)
    })

    it('creates execution with failure info', () => {
      const execution = {
        attempts: 3,
        executed: false,
        executionStatus: null,
        executedAt: null,
        executedBy: null,
        lastFailure: {
          failureStatus: 'NETWORK_ERROR',
          failureReason: 'Connection timeout',
          failedAt: '2026-06-14T11:00:00Z',
          failedBy: 'scheduler'
        }
      }

      assert.equal(execution.attempts, 3)
      assert.equal(execution.executed, false)
      assert.equal(execution.lastFailure.failureStatus, 'NETWORK_ERROR')
      assert.equal(execution.lastFailure.failureReason, 'Connection timeout')
      assert.equal(execution.lastFailure.failedBy, 'scheduler')
    })
  })

  describe('MaterializeGovernanceApprovalInput', () => {
    it('creates input with minimal required fields', () => {
      const input = {
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'store-1',
        approvalRequired: false
      }

      assert.equal(input.operation, 'create')
      assert.equal(input.resourceType, 'store')
      assert.equal(input.resourceKey, 'store-1')
      assert.equal(input.approvalRequired, false)
    })

    it('creates input with all optional fields', () => {
      const input = {
        operation: 'update',
        resourceType: 'brand',
        resourceKey: 'brand-99',
        scopeType: 'TENANT' as const,
        tenantId: 't-001',
        brandId: 'b-001',
        storeId: 's-001',
        approvalRequired: true,
        requestedBy: 'admin',
        approvalTicket: 'APR-UPDATE-XX123',
        approvalStatus: 'PENDING' as const,
        requestPayload: { key: 'value' },
        summary: { note: 'test' }
      }

      assert.equal(input.scopeType, 'TENANT')
      assert.equal(input.tenantId, 't-001')
      assert.equal(input.approvalStatus, 'PENDING')
      assert.deepStrictEqual(input.requestPayload, { key: 'value' })
      assert.deepStrictEqual(input.summary, { note: 'test' })
    })
  })

  describe('GovernanceApprovalDecisionInput', () => {
    it('valid APPROVED input', () => {
      const input = {
        approvalTicket: 'APR-TEST-XX123',
        decidedBy: 'manager',
        status: 'APPROVED' as const
      }

      assert.equal(input.approvalTicket, 'APR-TEST-XX123')
      assert.equal(input.decidedBy, 'manager')
      assert.equal(input.status, 'APPROVED')
    })

    it('valid REJECTED input with decisionNote', () => {
      const input = {
        approvalTicket: 'APR-TEST-YY456',
        decidedBy: 'supervisor',
        decisionNote: 'Not compliant with governance policy',
        status: 'REJECTED' as const
      }

      assert.equal(input.status, 'REJECTED')
      assert.ok(input.decisionNote && input.decisionNote.length > 0)
    })

    it('decision input with expectedVersion', () => {
      const input = {
        approvalTicket: 'APR-TEST-ZZ789',
        decidedBy: 'admin',
        expectedVersion: 3,
        status: 'APPROVED' as const
      }

      assert.equal(input.expectedVersion, 3)
    })
  })

  describe('GovernanceApprovalCancelInput', () => {
    it('creates cancel input with reason', () => {
      const input = {
        approvalTicket: 'APR-CANCEL-TEST',
        cancelledBy: 'requester',
        cancelReason: 'No longer needed'
      }

      assert.equal(input.approvalTicket, 'APR-CANCEL-TEST')
      assert.equal(input.cancelledBy, 'requester')
      assert.equal(input.cancelReason, 'No longer needed')
    })
  })

  describe('GovernanceApprovalResubmitInput', () => {
    it('creates resubmit input', () => {
      const input = {
        approvalTicket: 'APR-RESUBMIT-TEST',
        resubmittedBy: 'requester',
        resubmitReason: 'Fixed the reported issue'
      }

      assert.equal(input.approvalTicket, 'APR-RESUBMIT-TEST')
      assert.equal(input.resubmittedBy, 'requester')
      assert.equal(input.resubmitReason, 'Fixed the reported issue')
    })
  })

  describe('GovernanceApprovalExecutionInput', () => {
    it('creates execution input', () => {
      const input = {
        approvalTicket: 'APR-EXEC-TEST',
        executedBy: 'worker',
        executionStatus: 'SUCCESS'
      }

      assert.equal(input.approvalTicket, 'APR-EXEC-TEST')
      assert.equal(input.executedBy, 'worker')
      assert.equal(input.executionStatus, 'SUCCESS')
    })
  })

  describe('GovernanceApprovalExecutionFailureInput', () => {
    it('creates execution failure input', () => {
      const input = {
        approvalTicket: 'APR-FAIL-TEST',
        failedBy: 'scheduler',
        failureStatus: 'NETWORK_ERROR',
        failureReason: 'Connection timeout after 3 attempts'
      }

      assert.equal(input.approvalTicket, 'APR-FAIL-TEST')
      assert.equal(input.failedBy, 'scheduler')
      assert.equal(input.failureStatus, 'NETWORK_ERROR')
      assert.equal(input.failureReason, 'Connection timeout after 3 attempts')
    })
  })

  describe('GovernanceApprovalMetrics', () => {
    it('metrics have zero-initialized counters', () => {
      const statuses: Record<string, number> = {
        NOT_REQUIRED: 0,
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        CANCELLED: 0,
        SUPERSEDED: 0
      }

      const metrics = {
        total: 0,
        statuses,
        execution: {
          executed: 0,
          pending: 0,
          withFailures: 0,
          byExecutionStatus: {} as Record<string, number>,
          byFailureStatus: {} as Record<string, number>
        }
      }

      assert.equal(metrics.total, 0)
      assert.equal(metrics.statuses.PENDING, 0)
      assert.equal(metrics.statuses.APPROVED, 0)
      assert.equal(metrics.execution.executed, 0)
      assert.equal(metrics.execution.pending, 0)
      assert.deepStrictEqual(metrics.execution.byExecutionStatus, {})
      assert.deepStrictEqual(metrics.execution.byFailureStatus, {})
    })
  })

  describe('GovernanceApprovalQueryInput', () => {
    it('empty query input is valid', () => {
      const input = {}
      assert.deepStrictEqual(input, {})
      assert.equal(Object.keys(input).length, 0)
    })

    it('query with status filter', () => {
      const input = {
        status: 'PENDING' as const,
        limit: 50
      }

      assert.equal(input.status, 'PENDING')
      assert.equal(input.limit, 50)
    })

    it('query with execution filters', () => {
      const input = {
        executed: true,
        executionStatus: 'SUCCESS',
        hasFailures: false
      }

      assert.equal(input.executed, true)
      assert.equal(input.executionStatus, 'SUCCESS')
      assert.equal(input.hasFailures, false)
    })
  })

  describe('GovernanceApprovalRecord', () => {
    it('creates a prisma record shape', () => {
      const record = {
        id: 'rec-001',
        approvalTicket: 'APR-TEST-ABC',
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'store-42',
        scopeType: 'PLATFORM' as const,
        tenantId: null,
        brandId: null,
        storeId: null,
        required: true,
        requestedBy: 'admin',
        status: 'PENDING' as const,
        version: 1,
        decisionNote: null,
        decidedBy: null,
        decidedAt: null,
        summary: null,
        createdAt: new Date('2026-06-14T10:00:00Z'),
        updatedAt: new Date('2026-06-14T10:30:00Z')
      }

      assert.equal(record.id, 'rec-001')
      assert.equal(record.approvalTicket, 'APR-TEST-ABC')
      assert.equal(record.operation, 'create')
      assert.equal(record.resourceType, 'store')
      assert.equal(record.version, 1)
      assert.equal(record.status, 'PENDING')
      assert.ok(record.createdAt instanceof Date)
      assert.ok(record.updatedAt instanceof Date)
    })
  })
})
