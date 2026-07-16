import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [shift-scheduler] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ShiftSchedulerController } from './shift-scheduler.controller'
import { ShiftSchedulerService } from './shift-scheduler.service'
import { ShiftType, ShiftStatus } from './shift-scheduler.entity'

describe('ShiftSchedulerController', () => {
  let controller: InstanceType<typeof ShiftSchedulerController>
  let service: InstanceType<typeof ShiftSchedulerService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new ShiftSchedulerService()
    controller = new ShiftSchedulerController(service)
  })

  afterEach(() => {
    service.resetShiftStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be shift-schedules', () => {
      const path = Reflect.getMetadata('path', ShiftSchedulerController)
      assert.equal(path, 'shift-schedules')
    })

    it('createShift should be POST /', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.createShift)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.createShift)
      assert.equal(method, 1)
      assert.equal(path, '/')
    })

    it('listShifts should be GET /', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.listShifts)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.listShifts)
      assert.equal(method, 0)
      assert.equal(path, '/')
    })

    it('getShift should be GET /:shiftId', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.getShift)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.getShift)
      assert.equal(method, 0)
      assert.equal(path, ':shiftId')
    })

    it('updateShift should be PATCH /:shiftId', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.updateShift)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.updateShift)
      assert.equal(method, 4)
      assert.equal(path, ':shiftId')
    })

    it('updateShiftStatus should be PATCH /:shiftId/status', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.updateShiftStatus)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.updateShiftStatus)
      assert.equal(method, 4)
      assert.equal(path, ':shiftId/status')
    })

    it('getWeeklyShifts should be GET /analysis/weekly', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.getWeeklyShifts)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.getWeeklyShifts)
      assert.equal(method, 0)
      assert.equal(path, 'analysis/weekly')
    })

    it('getEmployeeWeeklyShifts should be GET /analysis/employee-weekly', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.getEmployeeWeeklyShifts)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.getEmployeeWeeklyShifts)
      assert.equal(method, 0)
      assert.equal(path, 'analysis/employee-weekly')
    })

    it('seedMockData should be POST /seed', () => {
      const method = Reflect.getMetadata('method', ShiftSchedulerController.prototype.seedMockData)
      const path = Reflect.getMetadata('path', ShiftSchedulerController.prototype.seedMockData)
      assert.equal(method, 1)
      assert.equal(path, 'seed')
    })
  })

  // ── Controller Logic ──

  describe('createShift', () => {
    it('should create shift via controller', () => {
      const s = controller.createShift(TENANT, {
        employeeId: 'EMP-001',
        employeeName: '张三',
        date: '2026-07-16',
        shiftType: ShiftType.Morning,
        startTime: '08:00',
        endTime: '16:00',
        location: '上海店',
      })
      assert.equal(s.employeeId, 'EMP-001')
      assert.equal(s.status, ShiftStatus.Scheduled)
    })
  })

  describe('listShifts', () => {
    it('should list shifts', () => {
      controller.createShift(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', date: '2026-07-16',
        shiftType: ShiftType.Morning, startTime: '08:00', endTime: '16:00', location: 'L1',
      })
      controller.createShift(TENANT, {
        employeeId: 'EMP-002', employeeName: 'B', date: '2026-07-16',
        shiftType: ShiftType.Night, startTime: '21:00', endTime: '06:00', location: 'L2',
      })
      assert.equal(controller.listShifts(TENANT, {}).length, 2)
    })
  })

  describe('getShift', () => {
    it('should get shift by id', () => {
      const s = controller.createShift(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', date: '2026-07-16',
        shiftType: ShiftType.Morning, startTime: '08:00', endTime: '16:00', location: 'L1',
      })
      const found = controller.getShift(TENANT, s.id)
      assert.equal(found.id, s.id)
    })

    it('should throw on non-existent shift', () => {
      assert.throws(() => {
        controller.getShift(TENANT, 'nonexistent')
      }, /Shift schedule not found/)
    })
  })

  describe('updateShift', () => {
    it('should update shift', () => {
      const s = controller.createShift(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', date: '2026-07-16',
        shiftType: ShiftType.Morning, startTime: '08:00', endTime: '16:00', location: 'L1',
      })
      const updated = controller.updateShift(TENANT, s.id, { location: '新地点' })
      assert.equal(updated.location, '新地点')
    })
  })

  describe('updateShiftStatus', () => {
    it('should update status', () => {
      const s = controller.createShift(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', date: '2026-07-16',
        shiftType: ShiftType.Morning, startTime: '08:00', endTime: '16:00', location: 'L1',
      })
      const updated = controller.updateShiftStatus(TENANT, s.id, { status: ShiftStatus.CheckedIn })
      assert.equal(updated.status, ShiftStatus.CheckedIn)
    })
  })

  describe('Weekly View', () => {
    it('should get weekly shifts', () => {
      controller.createShift(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', date: '2026-07-13',
        shiftType: ShiftType.Morning, startTime: '08:00', endTime: '16:00', location: 'L1',
      })
      controller.createShift(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', date: '2026-07-14',
        shiftType: ShiftType.Afternoon, startTime: '13:00', endTime: '21:00', location: 'L1',
      })
      const weekly = controller.getWeeklyShifts(TENANT, '2026-07-13', '2026-07-14')
      assert.equal(weekly.length, 2)
    })

    it('should get employee weekly shifts', () => {
      controller.createShift(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', date: '2026-07-13',
        shiftType: ShiftType.Morning, startTime: '08:00', endTime: '16:00', location: 'L1',
      })
      controller.createShift(TENANT, {
        employeeId: 'EMP-002', employeeName: 'B', date: '2026-07-13',
        shiftType: ShiftType.Morning, startTime: '08:00', endTime: '16:00', location: 'L2',
      })
      const emp1 = controller.getEmployeeWeeklyShifts(TENANT, 'EMP-001', '2026-07-13', '2026-07-19')
      assert.equal(emp1.length, 1)
    })
  })

  describe('seedMockData', () => {
    it('should seed 30 shifts', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock shift schedule data seeded' })
      assert.equal(controller.listShifts(TENANT, {}).length, 30)
    })
  })
})
