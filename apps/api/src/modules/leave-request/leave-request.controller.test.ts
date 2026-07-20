import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [leave-request] controller 测试
 *
 * 覆盖: CRUD + 审批流 + 统计 + mock种子
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LeaveRequestController } from './leave-request.controller'
import { LeaveRequestService } from './leave-request.service'
import { LeaveType, LeaveStatus } from './leave-request.entity'

describe('LeaveRequestController', () => {
  let controller: InstanceType<typeof LeaveRequestController>
  let service: InstanceType<typeof LeaveRequestService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new LeaveRequestService()
    controller = new LeaveRequestController(service)
  })

  afterEach(() => {
    service.resetLeaveStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be leave-requests', () => {
      const path = Reflect.getMetadata('path', LeaveRequestController)
      assert.equal(path, 'leave-requests')
    })

    it('createLeave should be POST /', () => {
      const method = Reflect.getMetadata('method', LeaveRequestController.prototype.createLeave)
      const path = Reflect.getMetadata('path', LeaveRequestController.prototype.createLeave)
      assert.equal(method, 1)
      assert.equal(path, '/')
    })

    it('listLeaves should be GET /', () => {
      const method = Reflect.getMetadata('method', LeaveRequestController.prototype.listLeaves)
      const path = Reflect.getMetadata('path', LeaveRequestController.prototype.listLeaves)
      assert.equal(method, 0)
      assert.equal(path, '/')
    })

    it('getLeave should be GET /:leaveId', () => {
      const method = Reflect.getMetadata('method', LeaveRequestController.prototype.getLeave)
      const path = Reflect.getMetadata('path', LeaveRequestController.prototype.getLeave)
      assert.equal(method, 0)
      assert.equal(path, ':leaveId')
    })

    it('approveLeave should be PATCH /:leaveId/approve', () => {
      const method = Reflect.getMetadata('method', LeaveRequestController.prototype.approveLeave)
      const path = Reflect.getMetadata('path', LeaveRequestController.prototype.approveLeave)
      assert.equal(method, 4)
      assert.equal(path, ':leaveId/approve')
    })

    it('cancelLeave should be PATCH /:leaveId/cancel', () => {
      const method = Reflect.getMetadata('method', LeaveRequestController.prototype.cancelLeave)
      const path = Reflect.getMetadata('path', LeaveRequestController.prototype.cancelLeave)
      assert.equal(method, 4)
      assert.equal(path, ':leaveId/cancel')
    })

    it('seedMockData should be POST /seed', () => {
      const method = Reflect.getMetadata('method', LeaveRequestController.prototype.seedMockData)
      const path = Reflect.getMetadata('path', LeaveRequestController.prototype.seedMockData)
      assert.equal(method, 1)
      assert.equal(path, 'seed')
    })
  })

  // ── Controller Logic ──

  describe('createLeave', () => {
    it('should create leave via controller', () => {
      const l = controller.createLeave(TENANT, {
        employeeId: 'EMP-001', employeeName: '张三', type: LeaveType.Annual,
        startDate: '2026-07-20', endDate: '2026-07-24', days: 5,
        reason: '旅行', approver: '李经理',
      })
      assert.equal(l.employeeId, 'EMP-001')
      assert.equal(l.status, LeaveStatus.Pending)
    })
  })

  describe('listLeaves', () => {
    it('should list leaves', () => {
      controller.createLeave(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', type: LeaveType.Annual,
        startDate: '2026-07-20', endDate: '2026-07-24', days: 5,
        reason: 'R', approver: 'M',
      })
      controller.createLeave(TENANT, {
        employeeId: 'EMP-002', employeeName: 'B', type: LeaveType.Sick,
        startDate: '2026-07-15', endDate: '2026-07-16', days: 2,
        reason: 'R', approver: 'M',
      })
      assert.equal(controller.listLeaves(TENANT, {}).length, 2)
    })
  })

  describe('getLeave', () => {
    it('should get leave by id', () => {
      const l = controller.createLeave(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', type: LeaveType.Annual,
        startDate: '2026-07-20', endDate: '2026-07-24', days: 5,
        reason: 'R', approver: 'M',
      })
      const found = controller.getLeave(TENANT, l.id)
      assert.equal(found.id, l.id)
    })

    it('should throw on non-existent leave', () => {
      assert.throws(() => {
        controller.getLeave(TENANT, 'nonexistent')
      }, /Leave request not found/)
    })
  })

  describe('approveLeave', () => {
    it('should approve a leave', () => {
      const l = controller.createLeave(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', type: LeaveType.Annual,
        startDate: '2026-07-20', endDate: '2026-07-24', days: 5,
        reason: 'R', approver: 'M',
      })
      const approved = controller.approveLeave(TENANT, l.id, {
        status: LeaveStatus.Approved,
      })
      assert.equal(approved.status, LeaveStatus.Approved)
    })
  })

  describe('cancelLeave', () => {
    it('should cancel a pending leave', () => {
      const l = controller.createLeave(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', type: LeaveType.Annual,
        startDate: '2026-07-20', endDate: '2026-07-24', days: 5,
        reason: 'R', approver: 'M',
      })
      const cancelled = controller.cancelLeave(TENANT, l.id)
      assert.equal(cancelled.status, LeaveStatus.Cancelled)
    })
  })

  describe('seedMockData', () => {
    it('should seed 21 leaves', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock leave request data seeded' })
      assert.equal(controller.listLeaves(TENANT, {}).length, 21)
    })
  })

  // ── Statistics ──

  describe('getStats', () => {
    it('should return empty stats when no leaves', () => {
      const stats = controller.getStats(TENANT)
      assert.equal(stats.total, 0)
      assert.equal(stats.totalDays, 0)
      assert.equal(stats.approvedDays, 0)
      assert.equal(stats.rejectionRate, 0)
      assert.deepStrictEqual(stats.monthlyTrend, [])
      assert.deepStrictEqual(stats.employeeStats, [])
    })

    it('should return correct stats after seeding', () => {
      controller.seedMockData(TENANT)
      const stats = controller.getStats(TENANT)

      // total
      assert.equal(stats.total, 21)

      // byStatus
      assert.ok(stats.byStatus[LeaveStatus.Pending] >= 1)
      assert.ok(stats.byStatus[LeaveStatus.Approved] >= 1)
      assert.ok(stats.byStatus[LeaveStatus.Rejected] >= 1)
      assert.ok(stats.byStatus[LeaveStatus.Cancelled] >= 1)

      // byType
      assert.ok(stats.byType[LeaveType.Annual] >= 1)
      assert.ok(stats.byType[LeaveType.Sick] >= 1)
      assert.ok(stats.byType[LeaveType.Personal] >= 1)
      assert.ok(stats.byType[LeaveType.Maternity] >= 1)
      assert.ok(stats.byType[LeaveType.Marriage] >= 1)
      assert.ok(stats.byType[LeaveType.Bereavement] >= 1)
      assert.ok(stats.byType[LeaveType.Other] >= 1)

      // totalDays > 0
      assert.ok(stats.totalDays > 0)
      assert.ok(stats.approvedDays > 0)

      // monthlyTrend
      assert.ok(stats.monthlyTrend.length >= 1)
      assert.ok(stats.monthlyTrend.every((m) => m.count > 0 && m.days > 0))

      // employeeStats
      assert.ok(stats.employeeStats.length >= 2)
      assert.ok(stats.employeeStats.every((e) => e.totalDays > 0))
    })

    it('should track rejection rate correctly', () => {
      service.resetLeaveStoresForTests()

      // 2 approved, 1 rejected = 33.3%
      const l1 = controller.createLeave(TENANT, {
        employeeId: 'E1', employeeName: 'A', type: LeaveType.Annual,
        startDate: '2026-07-01', endDate: '2026-07-02', days: 2,
        reason: 'R', approver: 'M',
      })
      const l2 = controller.createLeave(TENANT, {
        employeeId: 'E1', employeeName: 'A', type: LeaveType.Sick,
        startDate: '2026-07-03', endDate: '2026-07-03', days: 1,
        reason: 'R', approver: 'M',
      })
      const l3 = controller.createLeave(TENANT, {
        employeeId: 'E2', employeeName: 'B', type: LeaveType.Personal,
        startDate: '2026-07-05', endDate: '2026-07-05', days: 1,
        reason: 'R', approver: 'M',
      })

      controller.approveLeave(TENANT, l1.id, { status: LeaveStatus.Approved })
      controller.approveLeave(TENANT, l2.id, { status: LeaveStatus.Approved })
      controller.approveLeave(TENANT, l3.id, { status: LeaveStatus.Rejected, remark: '驳回' })

      const stats = controller.getStats(TENANT)
      assert.equal(stats.total, 3)
      assert.equal(stats.byStatus[LeaveStatus.Approved], 2)
      assert.equal(stats.byStatus[LeaveStatus.Rejected], 1)
      assert.equal(stats.rejectionRate, 1 / 3) // 33.3%
    })

    it('should return stats per tenant isolated', () => {
      const T2 = { tenantId: 'tenant-002' }

      controller.createLeave(TENANT, {
        employeeId: 'E1', employeeName: 'A', type: LeaveType.Annual,
        startDate: '2026-07-01', endDate: '2026-07-02', days: 2,
        reason: 'R', approver: 'M',
      })
      controller.createLeave(T2, {
        employeeId: 'E2', employeeName: 'B', type: LeaveType.Sick,
        startDate: '2026-08-01', endDate: '2026-08-03', days: 3,
        reason: 'R', approver: 'M',
      })

      const stats1 = controller.getStats(TENANT)
      const stats2 = controller.getStats(T2)

      assert.equal(stats1.total, 1)
      assert.equal(stats2.total, 1)
      assert.equal(stats1.totalDays, 2)
      assert.equal(stats2.totalDays, 3)
    })
  })
})
