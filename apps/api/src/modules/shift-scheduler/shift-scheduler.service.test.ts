import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [shift-scheduler] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ShiftSchedulerService } from './shift-scheduler.service'
import { ShiftType, ShiftStatus } from './shift-scheduler.entity'

describe('ShiftSchedulerService', () => {
  let service: ShiftSchedulerService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new ShiftSchedulerService()
  })

  afterEach(() => {
    service.resetShiftStoresForTests()
  })

  function createTestShift(overrides?: Partial<Parameters<ShiftSchedulerService['createShift']>[0]>) {
    return service.createShift({
      tenantId: TENANT,
      employeeId: 'EMP-001',
      employeeName: '张三',
      date: '2026-07-16',
      shiftType: ShiftType.Morning,
      startTime: '08:00',
      endTime: '16:00',
      location: '上海店',
      ...overrides,
    })
  }

  // ── CRUD ──

  describe('createShift', () => {
    it('should create a shift with SCHEDULED status', () => {
      const s = createTestShift()
      assert.equal(s.employeeId, 'EMP-001')
      assert.equal(s.employeeName, '张三')
      assert.equal(s.shiftType, ShiftType.Morning)
      assert.equal(s.status, ShiftStatus.Scheduled)
      assert.equal(s.tenantId, TENANT)
      assert.ok(s.id.startsWith('shift-'))
    })
  })

  describe('getShift', () => {
    it('should return shift by id', () => {
      const s = createTestShift()
      const found = service.getShift(s.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, s.id)
    })

    it('should return undefined for non-existent shift', () => {
      assert.equal(service.getShift('nonexistent', TENANT), undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const s = createTestShift()
      assert.equal(service.getShift(s.id, 'other-tenant'), undefined)
    })
  })

  describe('listShifts', () => {
    it('should list all shifts for tenant', () => {
      createTestShift({ employeeId: 'EMP-001' })
      createTestShift({ employeeId: 'EMP-002' })
      assert.equal(service.listShifts(TENANT).length, 2)
    })

    it('should filter by shiftType', () => {
      createTestShift({ shiftType: ShiftType.Morning })
      createTestShift({ shiftType: ShiftType.Night })

      const morning = service.listShifts(TENANT, { shiftType: ShiftType.Morning })
      assert.equal(morning.length, 1)
    })

    it('should filter by employeeId', () => {
      createTestShift({ employeeId: 'EMP-001' })
      createTestShift({ employeeId: 'EMP-002' })

      const emp1 = service.listShifts(TENANT, { employeeId: 'EMP-001' })
      assert.equal(emp1.length, 1)
    })

    it('should filter by date', () => {
      createTestShift({ date: '2026-07-16' })
      createTestShift({ date: '2026-07-17' })

      const d16 = service.listShifts(TENANT, { date: '2026-07-16' })
      assert.equal(d16.length, 1)
    })

    it('should filter by location', () => {
      createTestShift({ location: '上海店' })
      createTestShift({ location: '北京店' })

      const sh = service.listShifts(TENANT, { location: '上海店' })
      assert.equal(sh.length, 1)
    })
  })

  describe('updateShift', () => {
    it('should update shift fields', () => {
      const s = createTestShift()
      const updated = service.updateShift(s.id, TENANT, {
        shiftType: ShiftType.Afternoon,
        location: '北京店',
      })
      assert.equal(updated.shiftType, ShiftType.Afternoon)
      assert.equal(updated.location, '北京店')
    })

    it('should throw on non-existent shift', () => {
      assert.throws(() => {
        service.updateShift('nonexistent', TENANT, { location: 'test' })
      }, /Shift schedule not found/)
    })
  })

  describe('updateShiftStatus', () => {
    it('should update shift status', () => {
      const s = createTestShift()
      const updated = service.updateShiftStatus(s.id, ShiftStatus.CheckedIn, TENANT)
      assert.equal(updated.status, ShiftStatus.CheckedIn)
    })
  })

  // ── Weekly View ──

  describe('getWeeklyShifts', () => {
    it('should return shifts within date range', () => {
      createTestShift({ date: '2026-07-13', employeeId: 'EMP-001' })
      createTestShift({ date: '2026-07-14', employeeId: 'EMP-001' })
      createTestShift({ date: '2026-07-20', employeeId: 'EMP-001' }) // Outside range

      const weekly = service.getWeeklyShifts(TENANT, '2026-07-13', '2026-07-19')
      assert.equal(weekly.length, 2)
    })

    it('should sort by date', () => {
      createTestShift({ date: '2026-07-14', employeeId: 'EMP-001' })
      createTestShift({ date: '2026-07-13', employeeId: 'EMP-001' })

      const weekly = service.getWeeklyShifts(TENANT, '2026-07-13', '2026-07-14')
      assert.equal(weekly[0].date, '2026-07-13')
      assert.equal(weekly[1].date, '2026-07-14')
    })
  })

  describe('getEmployeeWeeklyShifts', () => {
    it('should return shifts for a specific employee', () => {
      createTestShift({ employeeId: 'EMP-001', date: '2026-07-13' })
      createTestShift({ employeeId: 'EMP-002', date: '2026-07-13' })
      createTestShift({ employeeId: 'EMP-001', date: '2026-07-14' })

      const emp1 = service.getEmployeeWeeklyShifts(TENANT, 'EMP-001', '2026-07-13', '2026-07-19')
      assert.equal(emp1.length, 2)
    })
  })

  // ── Seed ──

  describe('seedMockData', () => {
    it('should seed 30 shifts', () => {
      service.seedMockData(TENANT)
      const shifts = service.listShifts(TENANT)
      // 4 employees * 7 days + 2 full-day manager shifts = 30
      assert.equal(shifts.length, 30)

      // Should have various statuses
      const statuses = new Set(shifts.map((s) => s.status))
      assert.ok(statuses.has(ShiftStatus.Scheduled))
      assert.ok(statuses.has(ShiftStatus.CheckedIn))
      assert.ok(statuses.has(ShiftStatus.Absent))
      assert.ok(statuses.has(ShiftStatus.Swapped))
    })
  })
})
