import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [leave-request] controller 测试
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
})
