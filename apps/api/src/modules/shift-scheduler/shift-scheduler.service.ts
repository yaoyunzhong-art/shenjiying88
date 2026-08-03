import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  ShiftType,
  ShiftStatus,
  type ShiftSchedule,
} from './shift-scheduler.entity'

// ── In-memory store ──

const shiftStore = new Map<string, ShiftSchedule>()

@Injectable()
export class ShiftSchedulerService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  createShift(input: {
    tenantId: string
    employeeId: string
    employeeName: string
    date: string
    shiftType: ShiftType
    startTime: string
    endTime: string
    location: string
    remark?: string
  }): ShiftSchedule {
    const now = new Date().toISOString()
    const shift: ShiftSchedule = {
      id: `shift-${randomUUID()}`,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      date: input.date,
      shiftType: input.shiftType,
      startTime: input.startTime,
      endTime: input.endTime,
      status: ShiftStatus.Scheduled,
      location: input.location,
      remark: input.remark,
      tenantId: input.tenantId,
      createdAt: now,
    }
    shiftStore.set(shift.id, shift)
    return shift
  }

  getShift(shiftId: string, tenantId: string): ShiftSchedule | undefined {
    const s = shiftStore.get(shiftId)
    if (!s || s.tenantId !== tenantId) return undefined
    return s
  }

  listShifts(
    tenantId: string,
    filters?: {
      shiftType?: ShiftType
      status?: ShiftStatus
      employeeId?: string
      date?: string
      location?: string
    },
  ): ShiftSchedule[] {
    const all = Array.from(shiftStore.values())
    return all.filter((s) => {
      if (s.tenantId !== tenantId) return false
      if (filters?.shiftType && s.shiftType !== filters.shiftType) return false
      if (filters?.status && s.status !== filters.status) return false
      if (filters?.employeeId && s.employeeId !== filters.employeeId) return false
      if (filters?.date && s.date !== filters.date) return false
      if (filters?.location && s.location !== filters.location) return false
      return true
    })
  }

  updateShift(
    shiftId: string,
    tenantId: string,
    input: {
      shiftType?: ShiftType
      startTime?: string
      endTime?: string
      location?: string
      remark?: string
    },
  ): ShiftSchedule {
    const shift = this.getShift(shiftId, tenantId)
    if (!shift) {
      throw new Error(`Shift schedule not found: ${shiftId}`)
    }
    const updated: ShiftSchedule = {
      ...shift,
      shiftType: input.shiftType ?? shift.shiftType,
      startTime: input.startTime ?? shift.startTime,
      endTime: input.endTime ?? shift.endTime,
      location: input.location ?? shift.location,
      remark: input.remark !== undefined ? input.remark : shift.remark,
    }
    shiftStore.set(shiftId, updated)
    return updated
  }

  updateShiftStatus(
    shiftId: string,
    status: ShiftStatus,
    tenantId: string,
  ): ShiftSchedule {
    const shift = this.getShift(shiftId, tenantId)
    if (!shift) {
      throw new Error(`Shift schedule not found: ${shiftId}`)
    }
    const updated: ShiftSchedule = {
      ...shift,
      status,
    }
    shiftStore.set(shiftId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Weekly View
  // ═══════════════════════════════════════════════════════════════════

  getWeeklyShifts(tenantId: string, fromDate: string, toDate: string): ShiftSchedule[] {
    return Array.from(shiftStore.values()).filter((s) => {
      if (s.tenantId !== tenantId) return false
      return s.date >= fromDate && s.date <= toDate
    }).sort((a, b) => a.date.localeCompare(b.date))
  }

  getEmployeeWeeklyShifts(
    tenantId: string,
    employeeId: string,
    fromDate: string,
    toDate: string,
  ): ShiftSchedule[] {
    return this.getWeeklyShifts(tenantId, fromDate, toDate)
      .filter((s) => s.employeeId === employeeId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Data
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    // 5 employees, each with shifts across 7 days (Mon-Sun) for a week
    const employees = [
      { id: 'EMP-001', name: '张三' },
      { id: 'EMP-002', name: '李四' },
      { id: 'EMP-003', name: '王五' },
      { id: 'EMP-004', name: '赵六' },
      { id: 'EMP-005', name: '孙七' },
    ]

    // Generate shifts for a week starting from a known Monday
    const monday = new Date('2026-07-13T00:00:00.000Z')
    const locations = ['上海店', '北京店', '广州店', '成都店', '深圳店']

    // Shift templates: Morning(08-16), Afternoon(13-21), Night(21-06)
    const shiftTemplates: Array<{ type: ShiftType; start: string; end: string }> = [
      { type: ShiftType.Morning, start: '08:00', end: '16:00' },
      { type: ShiftType.Afternoon, start: '13:00', end: '21:00' },
      { type: ShiftType.Night, start: '21:00', end: '06:00' },
    ]

    for (let day = 0; day < 7; day++) {
      const date = new Date(monday.getTime() + day * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      // Each day, assign shifts to employees (2-3 per day)
      const dayEmployees = employees.slice(0, 4) // 4 employees per day
      for (let i = 0; i < dayEmployees.length; i++) {
        const emp = dayEmployees[i]
        const template = shiftTemplates[i % 3]
        const location = locations[i % locations.length]

        const shift = this.createShift({
          tenantId,
          employeeId: emp.id,
          employeeName: emp.name,
          date: dateStr,
          shiftType: template.type,
          startTime: template.start,
          endTime: template.end,
          location,
        })

        // Vary status for some shifts
        if (day < 3) {
          // Past shifts get various statuses
          if (emp.id === 'EMP-001') {
            shiftStore.set(shift.id, { ...shift, status: ShiftStatus.CheckedIn })
          } else if (emp.id === 'EMP-002') {
            shiftStore.set(shift.id, { ...shift, status: ShiftStatus.CheckedOut })
          } else if (emp.id === 'EMP-003' && day === 1) {
            shiftStore.set(shift.id, { ...shift, status: ShiftStatus.Absent })
          } else if (emp.id === 'EMP-004' && day === 2) {
            shiftStore.set(shift.id, { ...shift, status: ShiftStatus.Swapped })
          }
        }
      }
    }

    // Add 2 FullDay shifts for managers
    const managerDates = ['2026-07-14', '2026-07-16']
    for (const d of managerDates) {
      this.createShift({
        tenantId,
        employeeId: 'EMP-006',
        employeeName: '周八',
        date: d,
        shiftType: ShiftType.FullDay,
        startTime: '08:00',
        endTime: '21:00',
        location: '上海店',
        remark: '值班经理',
      })
    }
  }

  deleteShift(shiftId: string, tenantId: string): void {
    const shift = this.getShift(shiftId, tenantId)
    if (!shift) {
      throw new Error(`Shift schedule not found: ${shiftId}`)
    }
    shiftStore.delete(shiftId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetShiftStoresForTests(): void {
    shiftStore.clear()
  }
}
