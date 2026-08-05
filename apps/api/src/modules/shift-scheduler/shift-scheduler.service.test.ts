/**
 * shift-scheduler.service.spec.ts — 排班管理模块 Service 单元测试
 *
 * 覆盖: CRUD / 状态流转 / 周视图查询 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ShiftSchedulerService } from './shift-scheduler.service'
import { ShiftType, ShiftStatus } from './shift-scheduler.entity'

describe('ShiftSchedulerService — CRUD', () => {
  let svc: ShiftSchedulerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ShiftSchedulerService()
    svc.resetShiftStoresForTests()
  })

  it('createShift 创建排班成功', () => {
    const shift = svc.createShift({
      tenantId,
      employeeId: 'EMP-010',
      employeeName: '测试员工',
      date: '2026-07-30',
      shiftType: ShiftType.Morning,
      startTime: '08:00',
      endTime: '16:00',
      location: '深圳店',
    })
    expect(shift.id).toMatch(/^shift-/)
    expect(shift.employeeName).toBe('测试员工')
    expect(shift.shiftType).toBe(ShiftType.Morning)
    expect(shift.status).toBe(ShiftStatus.Scheduled)
  })

  it('getShift 返回正确的排班', () => {
    const created = svc.createShift({
      tenantId, employeeId: 'EMP-011', employeeName: '查询测试',
      date: '2026-07-30', shiftType: ShiftType.Afternoon,
      startTime: '13:00', endTime: '21:00', location: '北京店',
    })
    const found = svc.getShift(created.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.employeeName).toBe('查询测试')
  })

  it('getShift 返回 undefined 当排班不存在', () => {
    expect(svc.getShift('fake-id', tenantId)).toBeUndefined()
  })

  it('updateShift 更新排班信息', () => {
    const shift = svc.createShift({
      tenantId, employeeId: 'EMP-012', employeeName: '更新测试',
      date: '2026-07-30', shiftType: ShiftType.Morning,
      startTime: '08:00', endTime: '16:00', location: '广州店',
    })
    const updated = svc.updateShift(shift.id, tenantId, {
      shiftType: ShiftType.Night,
      startTime: '21:00',
      endTime: '06:00',
      remark: '换班',
    })
    expect(updated.shiftType).toBe(ShiftType.Night)
    expect(updated.remark).toBe('换班')
  })

  it('updateShift 不存在的排班抛 Error', () => {
    expect(() => svc.updateShift('fake-id', tenantId, { location: '新店' })).toThrow(/not found/)
  })

  it('updateShiftStatus 更新状态', () => {
    const shift = svc.createShift({
      tenantId, employeeId: 'EMP-013', employeeName: '状态测试',
      date: '2026-07-30', shiftType: ShiftType.Morning,
      startTime: '08:00', endTime: '16:00', location: '成都店',
    })
    const updated = svc.updateShiftStatus(shift.id, ShiftStatus.CheckedIn, tenantId)
    expect(updated.status).toBe(ShiftStatus.CheckedIn)
  })

  it('deleteShift 删除成功', () => {
    const shift = svc.createShift({
      tenantId, employeeId: 'EMP-014', employeeName: '删除测试',
      date: '2026-07-30', shiftType: ShiftType.FullDay,
      startTime: '08:00', endTime: '21:00', location: '上海店',
    })
    svc.deleteShift(shift.id, tenantId)
    expect(svc.getShift(shift.id, tenantId)).toBeUndefined()
  })

  it('deleteShift 不存在的排班抛 Error', () => {
    expect(() => svc.deleteShift('fake-id', tenantId)).toThrow(/not found/)
  })
})

describe('ShiftSchedulerService — 列表与筛选', () => {
  let svc: ShiftSchedulerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ShiftSchedulerService()
    svc.resetShiftStoresForTests()
    svc.seedMockData(tenantId)
  })

  it('listShifts 返回所有排班', () => {
    const shifts = svc.listShifts(tenantId)
    expect(shifts.length).toBeGreaterThan(0)
  })

  it('listShifts 按班次类型筛选', () => {
    const morning = svc.listShifts(tenantId, { shiftType: ShiftType.Morning })
    morning.forEach((s) => expect(s.shiftType).toBe(ShiftType.Morning))
  })

  it('listShifts 按员工筛选', () => {
    const emp = svc.listShifts(tenantId, { employeeId: 'EMP-001' })
    emp.forEach((s) => expect(s.employeeId).toBe('EMP-001'))
  })

  it('listShifts 按日期筛选', () => {
    const day = svc.listShifts(tenantId, { date: '2026-07-13' })
    day.forEach((s) => expect(s.date).toBe('2026-07-13'))
  })

  it('listShifts 按状态筛选', () => {
    const checkedIn = svc.listShifts(tenantId, { status: ShiftStatus.CheckedIn })
    checkedIn.forEach((s) => expect(s.status).toBe(ShiftStatus.CheckedIn))
  })

  it('listShifts 按位置筛选', () => {
    const loc = svc.listShifts(tenantId, { location: '上海店' })
    loc.forEach((s) => expect(s.location).toBe('上海店'))
  })
})

describe('ShiftSchedulerService — 周视图', () => {
  let svc: ShiftSchedulerService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ShiftSchedulerService()
    svc.resetShiftStoresForTests()
    svc.seedMockData(tenantId)
  })

  it('getWeeklyShifts 返回指定日期范围内的排班', () => {
    const weekly = svc.getWeeklyShifts(tenantId, '2026-07-13', '2026-07-19')
    expect(weekly.length).toBeGreaterThan(0)
    weekly.forEach((s) => {
      expect(s.date >= '2026-07-13').toBeTruthy()
      expect(s.date <= '2026-07-19').toBeTruthy()
    })
  })

  it('getEmployeeWeeklyShifts 按员工过滤周视图', () => {
    const empShifts = svc.getEmployeeWeeklyShifts(tenantId, 'EMP-001', '2026-07-13', '2026-07-19')
    empShifts.forEach((s) => expect(s.employeeId).toBe('EMP-001'))
  })
})
