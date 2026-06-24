import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import 'reflect-metadata'
import {
  MaterializeGovernanceApprovalDto,
  GovernanceApprovalQueryDto,
  GovernanceApprovalDecisionDto,
  GovernanceApprovalCancelDto,
  GovernanceApprovalResubmitDto,
  GovernanceApprovalExecutionDto,
  GovernanceApprovalExecutionFailureDto
} from './governance-approval.dto'

describe('GovernanceApproval DTOs', () => {
  describe('MaterializeGovernanceApprovalDto', () => {
    test('validates minimal required fields', async () => {
      const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'store-1'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('validates with all optional fields', async () => {
      const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
        operation: 'update',
        resourceType: 'brand',
        resourceKey: 'brand-99',
        scopeType: 'TENANT',
        tenantId: 't-001',
        brandId: 'b-001',
        storeId: 's-001',
        requestedBy: 'admin',
        approvalTicket: 'APR-UPDATE-XX123',
        approvalStatus: 'PENDING'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('rejects missing operation', async () => {
      const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
        resourceType: 'store',
        resourceKey: 'store-1'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const opError = errors.find((e) => e.property === 'operation')
      assert.ok(opError, 'Expected validation error for operation')
    })

    test('rejects missing resourceType', async () => {
      const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
        operation: 'create',
        resourceKey: 'key-1'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const rtError = errors.find((e) => e.property === 'resourceType')
      assert.ok(rtError, 'Expected validation error for resourceType')
    })

    test('rejects missing resourceKey', async () => {
      const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
        operation: 'create',
        resourceType: 'store'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const rkError = errors.find((e) => e.property === 'resourceKey')
      assert.ok(rkError, 'Expected validation error for resourceKey')
    })

    test('rejects invalid approvalStatus', async () => {
      const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'store-1',
        approvalStatus: 'INVALID_STATUS' as any
      })

      const errors = await validate(dto)
      const statusError = errors.find((e) => e.property === 'approvalStatus')
      assert.ok(statusError, 'Expected validation error for invalid approvalStatus')
    })

    test('accepts valid approvalStatus values', async () => {
      const validStatuses = ['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED']
      for (const status of validStatuses) {
        const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
          operation: 'test',
          resourceType: 'test',
          resourceKey: 'k1',
          approvalStatus: status
        })

        const errors = await validate(dto)
        assert.equal(errors.length, 0, `Expected no errors for status: ${status}`)
      }
    })

    test('operation cannot be empty', async () => {
      const dto = plainToInstance(MaterializeGovernanceApprovalDto, {
        operation: '',
        resourceType: 'store',
        resourceKey: 'store-1'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('GovernanceApprovalQueryDto', () => {
    test('empty query dto is valid', async () => {
      const dto = plainToInstance(GovernanceApprovalQueryDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('validates with all query fields', async () => {
      const dto = plainToInstance(GovernanceApprovalQueryDto, {
        limit: 50,
        approvalTicket: 'APR-TEST',
        operation: 'create',
        resourceType: 'store',
        status: 'PENDING',
        tenantId: 't-001',
        from: '2026-01-01T00:00:00Z',
        to: '2026-06-14T00:00:00Z'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('rejects limit less than 1', async () => {
      const dto = plainToInstance(GovernanceApprovalQueryDto, { limit: 0 })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const limitError = errors.find((e) => e.property === 'limit')
      assert.ok(limitError, 'Expected validation error for limit < 1')
    })

    test('accepts limit 1', async () => {
      const dto = plainToInstance(GovernanceApprovalQueryDto, { limit: 1 })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('accepts limit 100', async () => {
      const dto = plainToInstance(GovernanceApprovalQueryDto, { limit: 100 })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('GovernanceApprovalDecisionDto', () => {
    test('validates APPROVED decision', async () => {
      const dto = plainToInstance(GovernanceApprovalDecisionDto, {
        approvalTicket: 'APR-DECIDE-TEST',
        decidedBy: 'manager',
        status: 'APPROVED'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('validates REJECTED decision with note', async () => {
      const dto = plainToInstance(GovernanceApprovalDecisionDto, {
        approvalTicket: 'APR-DECIDE-REJECT',
        decidedBy: 'supervisor',
        decisionNote: 'Non-compliant',
        status: 'REJECTED'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('rejects invalid status value', async () => {
      const dto = plainToInstance(GovernanceApprovalDecisionDto, {
        approvalTicket: 'APR-TEST',
        decidedBy: 'manager',
        status: 'PENDING' as any
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const statusError = errors.find((e) => e.property === 'status')
      assert.ok(statusError, 'Expected validation error for PENDING (not valid for decision)')
    })

    test('rejects missing approvalTicket', async () => {
      const dto = plainToInstance(GovernanceApprovalDecisionDto, {
        decidedBy: 'manager',
        status: 'APPROVED'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const ticketError = errors.find((e) => e.property === 'approvalTicket')
      assert.ok(ticketError)
    })

    test('rejects missing decidedBy', async () => {
      const dto = plainToInstance(GovernanceApprovalDecisionDto, {
        approvalTicket: 'APR-TEST',
        status: 'APPROVED'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const byError = errors.find((e) => e.property === 'decidedBy')
      assert.ok(byError)
    })

    test('rejects missing status', async () => {
      const dto = plainToInstance(GovernanceApprovalDecisionDto, {
        approvalTicket: 'APR-TEST',
        decidedBy: 'manager'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const statusError = errors.find((e) => e.property === 'status')
      assert.ok(statusError)
    })
  })

  describe('GovernanceApprovalCancelDto', () => {
    test('validates cancel input with reason', async () => {
      const dto = plainToInstance(GovernanceApprovalCancelDto, {
        approvalTicket: 'APR-CANCEL',
        cancelledBy: 'requester',
        cancelReason: 'No longer needed'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('validates cancel input without reason', async () => {
      const dto = plainToInstance(GovernanceApprovalCancelDto, {
        approvalTicket: 'APR-CANCEL',
        cancelledBy: 'requester'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('rejects missing approvalTicket', async () => {
      const dto = plainToInstance(GovernanceApprovalCancelDto, {
        cancelledBy: 'requester'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    test('rejects missing cancelledBy', async () => {
      const dto = plainToInstance(GovernanceApprovalCancelDto, {
        approvalTicket: 'APR-CANCEL'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('GovernanceApprovalResubmitDto', () => {
    test('validates resubmit input', async () => {
      const dto = plainToInstance(GovernanceApprovalResubmitDto, {
        approvalTicket: 'APR-RESUBMIT',
        resubmittedBy: 'requester',
        resubmitReason: 'Fixed issues'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('validates resubmit without reason', async () => {
      const dto = plainToInstance(GovernanceApprovalResubmitDto, {
        approvalTicket: 'APR-RESUBMIT',
        resubmittedBy: 'requester'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('rejects missing approvalTicket', async () => {
      const dto = plainToInstance(GovernanceApprovalResubmitDto, {
        resubmittedBy: 'requester'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('GovernanceApprovalExecutionDto', () => {
    test('validates execution input', async () => {
      const dto = plainToInstance(GovernanceApprovalExecutionDto, {
        approvalTicket: 'APR-EXEC',
        executedBy: 'worker',
        executionStatus: 'SUCCESS'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('validates execution with expectedVersion', async () => {
      const dto = plainToInstance(GovernanceApprovalExecutionDto, {
        approvalTicket: 'APR-EXEC',
        executedBy: 'worker',
        executionStatus: 'PARTIAL_SUCCESS',
        expectedVersion: 2
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('rejects missing executionStatus', async () => {
      const dto = plainToInstance(GovernanceApprovalExecutionDto, {
        approvalTicket: 'APR-EXEC',
        executedBy: 'worker'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    test('rejects missing executedBy', async () => {
      const dto = plainToInstance(GovernanceApprovalExecutionDto, {
        approvalTicket: 'APR-EXEC',
        executionStatus: 'SUCCESS'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('GovernanceApprovalExecutionFailureDto', () => {
    test('validates execution failure input', async () => {
      const dto = plainToInstance(GovernanceApprovalExecutionFailureDto, {
        approvalTicket: 'APR-FAIL',
        failedBy: 'scheduler',
        failureStatus: 'NETWORK_ERROR',
        failureReason: 'Connection timeout'
      })

      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('rejects missing failureReason', async () => {
      const dto = plainToInstance(GovernanceApprovalExecutionFailureDto, {
        approvalTicket: 'APR-FAIL',
        failedBy: 'scheduler',
        failureStatus: 'NETWORK_ERROR'
      })

      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      const reasonError = errors.find((e) => e.property === 'failureReason')
      assert.ok(reasonError)
    })
  })

  describe('DTO metadata (decorator usage)', () => {
    test('MaterializeGovernanceApprovalDto has correct fields', () => {
      const instance = plainToInstance(MaterializeGovernanceApprovalDto, {
        operation: 'create',
        resourceType: 'store',
        resourceKey: 'store-1'
      })

      assert.equal(instance.operation, 'create')
      assert.equal(instance.resourceType, 'store')
      assert.equal(instance.resourceKey, 'store-1')
    })

    test('GovernanceApprovalDecisionDto has correct fields', () => {
      const instance = plainToInstance(GovernanceApprovalDecisionDto, {
        approvalTicket: 'APR-TEST',
        decidedBy: 'manager',
        status: 'APPROVED'
      })

      assert.equal(instance.approvalTicket, 'APR-TEST')
      assert.equal(instance.decidedBy, 'manager')
      assert.equal(instance.status, 'APPROVED')
    })
  })
})
