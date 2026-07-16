import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [leave-request] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LeaveRequestService } from './leave-request.service'
import { LeaveType, LeaveStatus } from './leave-request.entity'

describe('LeaveRequestService', () => {
  let service: LeaveRequestService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new LeaveRequestService()
  })

  afterEach(() => {
    service.resetLeaveStoresForTests()
  })

  function createTestLeave(overrides?: Partial<Parameters<LeaveRequestService['createLeave']>[0]>) {
    return service.createLeave({
      tenantId: TENANT,
      employeeId: 'EMP-001',
      employeeName: '张三',
      type: LeaveType.Annual,
      startDate: '2026-07-20',
      endDate: '2026-07-24',
      days: 5,
      reason: '年假旅行',
      approver: '李经理',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createLeave', () => {
    it('should create a leave with PENDING status', () => {
      const l = createTestLeave()
      assert.equal(l.employeeId, 'EMP-001')
      assert.equal(l.employeeName, '张三')
      assert.equal(l.type, LeaveType.Annual)
      assert.equal(l.status, LeaveStatus.Pending)
      assert.equal(l.days, 5)
      assert.equal(l.tenantId, TENANT)
      assert.ok(l.id.startsWith('leave-'))
      assert.ok(l.createdAt)
    })
  })

  describe('getLeave', () => {
    it('should return leave by id', () => {
      const l = createTestLeave()
      const found = service.getLeave(l.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, l.id)
    })

    it('should return undefined for non-existent leave', () => {
      assert.equal(service.getLeave('nonexistent', TENANT), undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const l = createTestLeave()
      assert.equal(service.getLeave(l.id, 'other-tenant'), undefined)
    })
  })

  describe('listLeaves', () => {
    it('should list all leaves for tenant', () => {
      createTestLeave({ employeeId: 'EMP-001' })
      createTestLeave({ employeeId: 'EMP-002' })
      assert.equal(service.listLeaves(TENANT).length, 2)
    })

    it('should filter by type', () => {
      createTestLeave({ type: LeaveType.Annual })
      createTestLeave({ type: LeaveType.Sick })

      const sick = service.listLeaves(TENANT, { type: LeaveType.Sick })
      assert.equal(sick.length, 1)
    })

    it('should filter by employeeId', () => {
      createTestLeave({ employeeId: 'EMP-001' })
      createTestLeave({ employeeId: 'EMP-002' })

      const emp1 = service.listLeaves(TENANT, { employeeId: 'EMP-001' })
      assert.equal(emp1.length, 1)
    })

    it('should filter by status', () => {
      createTestLeave({ employeeId: 'EMP-001' })
      const l2 = createTestLeave({ employeeId: 'EMP-002' })
      service.approveLeave(l2.id, LeaveStatus.Approved, TENANT)

      const pending = service.listLeaves(TENANT, { status: LeaveStatus.Pending })
      assert.equal(pending.length, 1)
    })

    it('should filter by date range', () => {
      createTestLeave({ startDate: '2026-07-20', endDate: '2026-07-24' })
      createTestLeave({ startDate: '2026-08-01', endDate: '2026-08-05' })

      const july = service.listLeaves(TENANT, { fromDate: '2026-07-01', toDate: '2026-07-31' })
      assert.equal(july.length, 1)
    })
  })

  // ── Approval Flow ──

  describe('approveLeave', () => {
    it('should approve a pending leave', () => {
      const l = createTestLeave()
      const approved = service.approveLeave(l.id, LeaveStatus.Approved, TENANT)
      assert.equal(approved.status, LeaveStatus.Approved)
      assert.ok(approved.approvedAt)
    })

    it('should reject a pending leave', () => {
      const l = createTestLeave()
      const rejected = service.approveLeave(l.id, LeaveStatus.Rejected, TENANT, '人手不足')
      assert.equal(rejected.status, LeaveStatus.Rejected)
      assert.equal(rejected.remark, '人手不足')
      assert.ok(rejected.approvedAt)
    })

    it('should throw when approving non-pending leave', () => {
      const l = createTestLeave()
      service.approveLeave(l.id, LeaveStatus.Approved, TENANT)
      assert.throws(() => {
        service.approveLeave(l.id, LeaveStatus.Rejected, TENANT)
      }, /Cannot/)
    })

    it('should throw on non-existent leave', () => {
      assert.throws(() => {
        service.approveLeave('nonexistent', LeaveStatus.Approved, TENANT)
      }, /Leave request not found/)
    })
  })

  describe('cancelLeave', () => {
    it('should cancel a pending leave', () => {
      const l = createTestLeave()
      const cancelled = service.cancelLeave(l.id, TENANT)
      assert.equal(cancelled.status, LeaveStatus.Cancelled)
    })

    it('should throw when cancelling non-pending leave', () => {
      const l = createTestLeave()
      service.approveLeave(l.id, LeaveStatus.Approved, TENANT)
      assert.throws(() => {
        service.cancelLeave(l.id, TENANT)
      }, /Cannot cancel/)
    })
  })

  // ── Seed ──

  describe('seedMockData', () => {
    it('should seed 21 leaves with various statuses', () => {
      service.seedMockData(TENANT)
      const leaves = service.listLeaves(TENANT)
      assert.equal(leaves.length, 21)

      const statuses = new Set(leaves.map((l) => l.status))
      assert.ok(statuses.has(LeaveStatus.Pending))
      assert.ok(statuses.has(LeaveStatus.Approved))
      assert.ok(statuses.has(LeaveStatus.Rejected))
      assert.ok(statuses.has(LeaveStatus.Cancelled))
    })
  })
})
