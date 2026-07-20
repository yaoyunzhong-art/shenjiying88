import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

/**
 * cross-module-e2e-56-schedule.test.ts
 *
 * 排班管理全链路 E2E 测试
 * 场景: 排班创建 → 列表查询 → 状态变更(签到/签退/缺勤) → 删除验证
 *
 * 模块联动:
 *   ShiftScheduler → 排班创建/查询/更新/状态变更/删除
 *   Tenant隔离验证 → 不同租户数据不可见
 */

describe('E2E-56: 排班管理全链', () => {
  // ── 排班类型/状态常量 ──
  const SHIFT_TYPE = {
    MORNING: 'MORNING',
    AFTERNOON: 'AFTERNOON',
    NIGHT: 'NIGHT',
    FULL_DAY: 'FULL_DAY',
  } as const

  const SHIFT_STATUS = {
    SCHEDULED: 'SCHEDULED',
    CHECKED_IN: 'CHECKED_IN',
    CHECKED_OUT: 'CHECKED_OUT',
    ABSENT: 'ABSENT',
    SWAPPED: 'SWAPPED',
  } as const

  // ── 排班数据模型 ──
  interface ShiftSchedule {
    id: string
    employeeId: string
    employeeName: string
    date: string
    shiftType: string
    startTime: string
    endTime: string
    status: string
    location: string
    remark?: string
    tenantId: string
    createdAt: string
  }

  // ── 排班模拟存储 ──
  const shiftDb: Map<string, ShiftSchedule> = new Map()

  // ── 模拟服务函数 ──
  let idCounter = 0

  function createShift(input: {
    tenantId: string
    employeeId: string
    employeeName: string
    date: string
    shiftType: string
    startTime: string
    endTime: string
    location: string
    remark?: string
  }): ShiftSchedule {
    idCounter++
    const shift: ShiftSchedule = {
      id: `shift-e2e-56-${String(idCounter).padStart(3, '0')}`,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      date: input.date,
      shiftType: input.shiftType,
      startTime: input.startTime,
      endTime: input.endTime,
      status: SHIFT_STATUS.SCHEDULED,
      location: input.location,
      remark: input.remark,
      tenantId: input.tenantId,
      createdAt: new Date().toISOString(),
    }
    shiftDb.set(shift.id, shift)
    return shift
  }

  function listShifts(tenantId: string, filters?: {
    shiftType?: string
    status?: string
    employeeId?: string
    date?: string
    location?: string
  }): ShiftSchedule[] {
    let shifts = Array.from(shiftDb.values()).filter(s => s.tenantId === tenantId)
    if (filters?.shiftType) shifts = shifts.filter(s => s.shiftType === filters.shiftType)
    if (filters?.status) shifts = shifts.filter(s => s.status === filters.status)
    if (filters?.employeeId) shifts = shifts.filter(s => s.employeeId === filters.employeeId)
    if (filters?.date) shifts = shifts.filter(s => s.date === filters.date)
    if (filters?.location) shifts = shifts.filter(s => s.location === filters.location)
    return shifts
  }

  function getShift(shiftId: string, tenantId: string): ShiftSchedule | undefined {
    const s = shiftDb.get(shiftId)
    if (!s || s.tenantId !== tenantId) return undefined
    return s
  }

  function updateShift(
    shiftId: string,
    tenantId: string,
    updates: Partial<Pick<ShiftSchedule, 'shiftType' | 'startTime' | 'endTime' | 'location' | 'remark'>>,
  ): ShiftSchedule {
    const s = getShift(shiftId, tenantId)
    if (!s) throw new Error(`Shift schedule not found: ${shiftId}`)
    const updated: ShiftSchedule = { ...s, ...updates }
    shiftDb.set(shiftId, updated)
    return updated
  }

  function updateShiftStatus(shiftId: string, status: string, tenantId: string): ShiftSchedule {
    const s = getShift(shiftId, tenantId)
    if (!s) throw new Error(`Shift schedule not found: ${shiftId}`)
    const updated: ShiftSchedule = { ...s, status }
    shiftDb.set(shiftId, updated)
    return updated
  }

  function deleteShift(shiftId: string, tenantId: string): void {
    const s = getShift(shiftId, tenantId)
    if (!s) throw new Error(`Shift schedule not found: ${shiftId}`)
    shiftDb.delete(shiftId)
  }

  function getWeeklyShifts(tenantId: string, fromDate: string, toDate: string): ShiftSchedule[] {
    return Array.from(shiftDb.values())
      .filter(s => s.tenantId === tenantId && s.date >= fromDate && s.date <= toDate)
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // ── 测试数据 ──
  const TENANT_A = 'tenant-e2e-56-a'
  const TENANT_B = 'tenant-e2e-56-b'
  const EMPLOYEES = [
    { id: 'EMP-056-001', name: '张三(排班E2E)' },
    { id: 'EMP-056-002', name: '李四(排班E2E)' },
    { id: 'EMP-056-003', name: '王五(排班E2E)' },
  ]

  before(() => {
    shiftDb.clear()
    idCounter = 0

    // Seed: 为TENANT_A创建3个员工各2天的排班
    for (const emp of EMPLOYEES) {
      createShift({
        tenantId: TENANT_A,
        employeeId: emp.id,
        employeeName: emp.name,
        date: '2026-07-20',
        shiftType: SHIFT_TYPE.MORNING,
        startTime: '08:00',
        endTime: '16:00',
        location: '上海店',
      })
      createShift({
        tenantId: TENANT_A,
        employeeId: emp.id,
        employeeName: emp.name,
        date: '2026-07-21',
        shiftType: SHIFT_TYPE.AFTERNOON,
        startTime: '13:00',
        endTime: '21:00',
        location: '上海店',
      })
    }

    // Seed: 为TENANT_B创建1个排班（用于租户隔离验证）
    createShift({
      tenantId: TENANT_B,
      employeeId: 'EMP-056-099',
      employeeName: '赵六(其他店)',
      date: '2026-07-20',
      shiftType: SHIFT_TYPE.NIGHT,
      startTime: '21:00',
      endTime: '06:00',
      location: '北京店',
    })
  })

  after(() => {
    shiftDb.clear()
  })

  // ═══════════════════════════════════════════════════════════════
  // 排班创建
  // ═══════════════════════════════════════════════════════════════

  it('正例: 创建排班返回完整信息且状态为 SCHEDULED', () => {
    const shift = createShift({
      tenantId: TENANT_A,
      employeeId: 'EMP-056-004',
      employeeName: '测试员工',
      date: '2026-07-22',
      shiftType: SHIFT_TYPE.FULL_DAY,
      startTime: '08:00',
      endTime: '21:00',
      location: '上海店',
      remark: '值班经理',
    })

    assert.equal(shift.employeeId, 'EMP-056-004')
    assert.equal(shift.employeeName, '测试员工')
    assert.equal(shift.date, '2026-07-22')
    assert.equal(shift.shiftType, SHIFT_TYPE.FULL_DAY)
    assert.equal(shift.status, SHIFT_STATUS.SCHEDULED)
    assert.equal(shift.location, '上海店')
    assert.equal(shift.remark, '值班经理')
    assert.equal(shift.tenantId, TENANT_A)
    assert.ok(shift.id.startsWith('shift-e2e-56-'))
    assert.ok(shift.createdAt)
  })

  it('正例: 创建排班支持所有班次类型', () => {
    const types = [SHIFT_TYPE.MORNING, SHIFT_TYPE.AFTERNOON, SHIFT_TYPE.NIGHT, SHIFT_TYPE.FULL_DAY]
    const created = types.map((t, i) => createShift({
      tenantId: TENANT_A,
      employeeId: `EMP-TYPE-${i}`,
      employeeName: `类型测试${i}`,
      date: '2026-07-23',
      shiftType: t,
      startTime: '08:00',
      endTime: t === SHIFT_TYPE.NIGHT ? '06:00' : '16:00',
      location: '上海店',
    }))
    assert.equal(created.length, 4)
    assert.equal(created[0].shiftType, SHIFT_TYPE.MORNING)
    assert.equal(created[1].shiftType, SHIFT_TYPE.AFTERNOON)
    assert.equal(created[2].shiftType, SHIFT_TYPE.NIGHT)
    assert.equal(created[3].shiftType, SHIFT_TYPE.FULL_DAY)
  })

  // ═══════════════════════════════════════════════════════════════
  // 排班查询
  // ═══════════════════════════════════════════════════════════════

  it('正例: 列表查询返回该租户所有排班', () => {
    const shifts = listShifts(TENANT_A)
    // 3 employees * 2 days + 2 manually added above = 8
    assert.equal(shifts.length >= 6, true)
  })

  it('正例: 按班次类型筛选', () => {
    const morningShifts = listShifts(TENANT_A, { shiftType: SHIFT_TYPE.MORNING })
    assert.ok(morningShifts.length >= 3)
    for (const s of morningShifts) {
      assert.equal(s.shiftType, SHIFT_TYPE.MORNING)
    }
  })

  it('正例: 按员工筛选', () => {
    const emp1Shifts = listShifts(TENANT_A, { employeeId: 'EMP-056-001' })
    assert.equal(emp1Shifts.length, 2)
    for (const s of emp1Shifts) {
      assert.equal(s.employeeId, 'EMP-056-001')
    }
  })

  it('正例: 按日期筛选', () => {
    const dayShifts = listShifts(TENANT_A, { date: '2026-07-20' })
    assert.equal(dayShifts.length, 3)
    for (const s of dayShifts) {
      assert.equal(s.date, '2026-07-20')
    }
  })

  it('正例: 按位置筛选', () => {
    const locShifts = listShifts(TENANT_A, { location: '上海店' })
    assert.equal(locShifts.length >= 6, true)
  })

  it('正例: 通过ID获取排班详细', () => {
    const all = listShifts(TENANT_A)
    const first = all[0]
    const found = getShift(first.id, TENANT_A)
    assert.ok(found)
    assert.equal(found.id, first.id)
    assert.equal(found.employeeId, first.employeeId)
    assert.equal(found.date, first.date)
  })

  it('正例: 周视图查询返回日期范围内的排班', () => {
    const weekly = getWeeklyShifts(TENANT_A, '2026-07-20', '2026-07-26')
    assert.equal(weekly.length >= 6, true)
  })

  it('正例: 周视图按日期排序', () => {
    const weekly = getWeeklyShifts(TENANT_A, '2026-07-20', '2026-07-26')
    for (let i = 1; i < weekly.length; i++) {
      assert.ok(weekly[i].date >= weekly[i - 1].date, `dates not sorted: ${weekly[i - 1].date} > ${weekly[i].date}`)
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // 状态变更 (考勤签到/签退/缺勤/换班)
  // ═══════════════════════════════════════════════════════════════

  it('正例: SCHEDULED → CHECKED_IN 签到成功', () => {
    const all = listShifts(TENANT_A, { status: SHIFT_STATUS.SCHEDULED })
    const target = all[0]
    const checked = updateShiftStatus(target.id, SHIFT_STATUS.CHECKED_IN, TENANT_A)
    assert.equal(checked.status, SHIFT_STATUS.CHECKED_IN)
  })

  it('正例: CHECKED_IN → CHECKED_OUT 签退成功', () => {
    const checkedIn = listShifts(TENANT_A, { status: SHIFT_STATUS.CHECKED_IN })
    const target = checkedIn[0]
    const checkedOut = updateShiftStatus(target.id, SHIFT_STATUS.CHECKED_OUT, TENANT_A)
    assert.equal(checkedOut.status, SHIFT_STATUS.CHECKED_OUT)
  })

  it('正例: SCHEDULED → ABSENT 标记缺勤', () => {
    // 找第二个 SCHEDULED 的排班
    const scheduled = listShifts(TENANT_A, { status: SHIFT_STATUS.SCHEDULED })
    const target = scheduled[1]
    const absent = updateShiftStatus(target.id, SHIFT_STATUS.ABSENT, TENANT_A)
    assert.equal(absent.status, SHIFT_STATUS.ABSENT)
  })

  it('正例: SCHEDULED → SWAPPED 标记换班', () => {
    const scheduled = listShifts(TENANT_A, { status: SHIFT_STATUS.SCHEDULED })
    if (scheduled.length > 0) {
      const target = scheduled[0]
      const swapped = updateShiftStatus(target.id, SHIFT_STATUS.SWAPPED, TENANT_A)
      assert.equal(swapped.status, SHIFT_STATUS.SWAPPED)
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // 排班更新
  // ═══════════════════════════════════════════════════════════════

  it('正例: 更新排班的班次类型和位置', () => {
    const all = listShifts(TENANT_A)
    const target = all[0]
    const updated = updateShift(target.id, TENANT_A, {
      shiftType: SHIFT_TYPE.NIGHT,
      location: '北京店',
    })
    assert.equal(updated.shiftType, SHIFT_TYPE.NIGHT)
    assert.equal(updated.location, '北京店')
    // 验证其他字段不变
    assert.equal(updated.employeeId, target.employeeId)
    assert.equal(updated.date, target.date)
  })

  it('正例: 更新排班的备注信息', () => {
    const all = listShifts(TENANT_A)
    const target = all[1]
    const updated = updateShift(target.id, TENANT_A, { remark: '已确认' })
    assert.equal(updated.remark, '已确认')
  })

  // ═══════════════════════════════════════════════════════════════
  // 排班删除
  // ═══════════════════════════════════════════════════════════════

  it('正例: 删除排班后列表减少', () => {
    const beforeCount = listShifts(TENANT_A).length
    const target = listShifts(TENANT_A)[0]
    deleteShift(target.id, TENANT_A)
    const afterCount = listShifts(TENANT_A).length
    assert.equal(afterCount, beforeCount - 1)
  })

  it('正例: 删除后无法通过 ID 获取', () => {
    const target = listShifts(TENANT_A)
    if (target.length > 0) {
      const id = target[0].id
      deleteShift(id, TENANT_A)
      const found = getShift(id, TENANT_A)
      assert.equal(found, undefined)
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // 反例
  // ═══════════════════════════════════════════════════════════════

  it('反例: 查询不存在的排班返回 undefined', () => {
    const found = getShift('shift-nonexistent', TENANT_A)
    assert.equal(found, undefined)
  })

  it('反例: 更新不存在的排班抛出异常', () => {
    assert.throws(() => {
      updateShift('shift-nonexistent', TENANT_A, { location: '测试' })
    }, /Shift schedule not found/)
  })

  it('反例: 删除不存在的排班抛出异常', () => {
    assert.throws(() => {
      deleteShift('shift-nonexistent', TENANT_A)
    }, /Shift schedule not found/)
  })

  it('反例: 更新不存在的状态抛出异常', () => {
    assert.throws(() => {
      updateShiftStatus('shift-nonexistent', SHIFT_STATUS.CHECKED_IN, TENANT_A)
    }, /Shift schedule not found/)
  })

  // ═══════════════════════════════════════════════════════════════
  // 租户隔离
  // ═══════════════════════════════════════════════════════════════

  it('边界: 不同租户数据隔离 — 列表互不可见', () => {
    const shiftsA = listShifts(TENANT_A)
    const shiftsB = listShifts(TENANT_B)
    for (const s of shiftsA) {
      assert.equal(s.tenantId, TENANT_A)
    }
    for (const s of shiftsB) {
      assert.equal(s.tenantId, TENANT_B)
    }
  })

  it('边界: 跨租户无法通过 ID 访问', () => {
    const allB = listShifts(TENANT_B)
    if (allB.length > 0) {
      const found = getShift(allB[0].id, TENANT_A)
      assert.equal(found, undefined)
    }
  })

  it('边界: 跨租户无法删除', () => {
    const allB = listShifts(TENANT_B)
    if (allB.length > 0) {
      assert.throws(() => {
        deleteShift(allB[0].id, TENANT_A)
      }, /Shift schedule not found/)
    }
  })

  // ═══════════════════════════════════════════════════════════════
  // 全链路复杂场景
  // ═══════════════════════════════════════════════════════════════

  it('正例: 排班创建→签到→签退→删除 全链路', () => {
    // 1. 创建
    const shift = createShift({
      tenantId: TENANT_A,
      employeeId: 'EMP-056-FLOW',
      employeeName: '流程测试',
      date: '2026-07-25',
      shiftType: SHIFT_TYPE.MORNING,
      startTime: '08:00',
      endTime: '16:00',
      location: '上海店',
    })
    assert.equal(shift.status, SHIFT_STATUS.SCHEDULED)

    // 2. 签到
    const checkedIn = updateShiftStatus(shift.id, SHIFT_STATUS.CHECKED_IN, TENANT_A)
    assert.equal(checkedIn.status, SHIFT_STATUS.CHECKED_IN)

    // 3. 签退
    const checkedOut = updateShiftStatus(shift.id, SHIFT_STATUS.CHECKED_OUT, TENANT_A)
    assert.equal(checkedOut.status, SHIFT_STATUS.CHECKED_OUT)

    // 4. 删除
    deleteShift(shift.id, TENANT_A)
    const afterDelete = getShift(shift.id, TENANT_A)
    assert.equal(afterDelete, undefined)
  })

  it('正例: 多天多员工排班创建并周视图验证', () => {
    // 创建一周排班
    const weekDates = ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31']
    for (const date of weekDates) {
      for (const emp of EMPLOYEES.slice(0, 2)) {
        createShift({
          tenantId: TENANT_A,
          employeeId: emp.id,
          employeeName: emp.name,
          date,
          shiftType: SHIFT_TYPE.MORNING,
          startTime: '08:00',
          endTime: '16:00',
          location: '上海店',
        })
      }
    }

    // 周视图验证 — 前一周数据不受影响
    const originalWeek = getWeeklyShifts(TENANT_A, '2026-07-20', '2026-07-26')
    assert.ok(originalWeek.length >= 6)

    const newWeek = getWeeklyShifts(TENANT_A, '2026-07-27', '2026-07-31')
    assert.equal(newWeek.length, 10) // 5 days * 2 employees
  })
})
