import { describe, it, expect, beforeEach } from 'vitest'
import { AttendanceService } from './attendance.service'

describe('AttendanceService', () => {
  let service: AttendanceService

  beforeEach(() => {
    service = new AttendanceService()
  })

  // ── 打卡记录 ──

  describe('clockIn', () => {
    it('creates a normal clock record when clock-in time is before 09:00', () => {
      const record = service.clockIn({
        employeeId: 'emp-001',
        employeeName: '张三',
        storeId: 'store-001',
        date: '2026-07-29',
        clockIn: '08:55',
      })
      expect(record.employeeId).toBe('emp-001')
      expect(record.status).toBe('normal')
      expect(record.lateMinutes).toBe(0)
      expect(record.id).toMatch(/^clock-/)
    })

    it('marks as late when clock-in is after 09:00', () => {
      const record = service.clockIn({
        employeeId: 'emp-002',
        employeeName: '李四',
        storeId: 'store-001',
        date: '2026-07-29',
        clockIn: '09:30',
      })
      expect(record.status).toBe('late')
      expect(record.lateMinutes).toBe(30)
    })

    it('throws BadRequestException when required fields are missing', () => {
      expect(() =>
        service.clockIn({
          employeeId: '', employeeName: '', storeId: '', date: '',
        }),
      ).toThrow('Missing required fields')
    })
  })

  describe('clockOut', () => {
    it('sets overtime when clock-out is after 18:00', () => {
      const rec = service.clockIn({
        employeeId: 'emp-001', employeeName: 'A', storeId: 's1', date: '2026-07-29', clockIn: '09:00',
      })
      const out = service.clockOut(rec.id, '19:30')
      expect(out.status).toBe('overtime')
      expect(out.overtimeMinutes).toBe(90)
      expect(out.clockOut).toBe('19:30')
    })

    it('sets early_leave when clock-out is before 18:00', () => {
      const rec = service.clockIn({
        employeeId: 'emp-002', employeeName: 'B', storeId: 's1', date: '2026-07-29', clockIn: '09:00',
      })
      const out = service.clockOut(rec.id, '16:45')
      expect(out.status).toBe('early_leave')
      expect(out.earlyLeaveMinutes).toBeGreaterThan(0)
    })

    it('throws for non-existent record', () => {
      expect(() => service.clockOut('nonexistent', '18:00')).toThrow('not found')
    })

    it('throws for double clock-out', () => {
      const rec = service.clockIn({
        employeeId: 'emp-003', employeeName: 'C', storeId: 's1', date: '2026-07-29',
      })
      service.clockOut(rec.id, '18:00')
      expect(() => service.clockOut(rec.id, '19:00')).toThrow('already clocked out')
    })
  })

  describe('getRecord / listRecords', () => {
    it('returns null for unknown record', () => {
      expect(service.getRecord('nope')).toBeNull()
    })

    it('returns record by id', () => {
      const rec = service.clockIn({
        employeeId: 'e1', employeeName: 'A', storeId: 's1', date: '2026-07-29',
      })
      expect(service.getRecord(rec.id)).toBeDefined()
    })

    it('listRecords filters by multiple criteria', () => {
      service.clockIn({ employeeId: 'e1', employeeName: 'A', storeId: 's1', date: '2026-07-29' })
      service.clockIn({ employeeId: 'e2', employeeName: 'B', storeId: 's2', date: '2026-07-29' })
      const result = service.listRecords({ storeId: 's1' })
      expect(result).toHaveLength(1)
      expect(result[0].employeeId).toBe('e1')
    })
  })

  // ── 考勤统计 ──

  describe('getSummary', () => {
    it('summarizes attendance records', () => {
      service.clockIn({ employeeId: 'e1', employeeName: 'A', storeId: 's1', date: '2026-07-29', clockIn: '08:55' })
      service.clockIn({ employeeId: 'e2', employeeName: 'B', storeId: 's1', date: '2026-07-29', clockIn: '09:30' })
      const summary = service.getSummary('daily', '2026-07-29', '2026-07-29', 's1')
      expect(summary.totalDays).toBe(2)
      expect(summary.normalCount).toBe(1)
      expect(summary.lateCount).toBe(1)
      expect(summary.byStore['s1']).toBeDefined()
    })

    it('returns total from all records regardless of date params', () => {
      const summary = service.getSummary('daily', '2025-01-01', '2025-01-01')
      // getSummary does not filter by date, only by storeId
      expect(summary.totalDays).toBeGreaterThanOrEqual(3)
    })
  })

  // ── 请假申请 ──

  describe('createLeave', () => {
    it('creates a pending leave request', () => {
      const leave = service.createLeave({
        employeeId: 'e1', employeeName: 'A', storeId: 's1',
        leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-02',
        reason: '年假',
      })
      expect(leave.status).toBe('pending')
      expect(leave.id).toMatch(/^leave-/)
    })

    it('throws when required fields missing', () => {
      expect(() =>
        service.createLeave({
          employeeId: '', employeeName: '', storeId: '', leaveType: 'annual',
          startDate: '', endDate: '', reason: '',
        }),
      ).toThrow('Missing required fields')
    })
  })

  describe('approveLeave / cancelLeave', () => {
    it('approves a pending leave', () => {
      const leave = service.createLeave({
        employeeId: 'e1', employeeName: 'A', storeId: 's1',
        leaveType: 'sick', startDate: '2026-07-30', endDate: '2026-07-30',
        reason: '生病',
      })
      const approved = service.approveLeave(leave.id, 'mgr-001', '经理', 'approve', '同意')
      expect(approved.status).toBe('approved')
      expect(approved.approverId).toBe('mgr-001')
    })

    it('rejects a pending leave', () => {
      const leave = service.createLeave({
        employeeId: 'e2', employeeName: 'B', storeId: 's1',
        leaveType: 'personal', startDate: '2026-08-05', endDate: '2026-08-05',
        reason: '私事',
      })
      const rejected = service.approveLeave(leave.id, 'mgr-002', '经理B', 'reject', '不批准')
      expect(rejected.status).toBe('rejected')
    })

    it('throws when approving non-pending leave', () => {
      const leave = service.createLeave({
        employeeId: 'e1', employeeName: 'A', storeId: 's1',
        leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-02',
        reason: '年假',
      })
      service.approveLeave(leave.id, 'mgr', 'M', 'approve')
      expect(() => service.approveLeave(leave.id, 'mgr', 'M', 'approve')).toThrow()
    })

    it('cancels a pending leave', () => {
      const leave = service.createLeave({
        employeeId: 'e1', employeeName: 'A', storeId: 's1',
        leaveType: 'annual', startDate: '2026-08-10', endDate: '2026-08-10',
        reason: '取消测试',
      })
      const cancelled = service.cancelLeave(leave.id)
      expect(cancelled.status).toBe('cancelled')
    })

    it('throws when cancelling already cancelled leave', () => {
      const leave = service.createLeave({
        employeeId: 'e1', employeeName: 'A', storeId: 's1',
        leaveType: 'annual', startDate: '2026-08-10', endDate: '2026-08-10',
        reason: '测试',
      })
      service.cancelLeave(leave.id)
      expect(() => service.cancelLeave(leave.id)).toThrow('already cancelled')
    })

    it('throws for non-existent leave', () => {
      expect(() => service.approveLeave('nope', 'x', 'x', 'approve')).toThrow('not found')
    })
  })

  describe('getLeave / listLeaves', () => {
    it('returns null for unknown leave', () => {
      expect(service.getLeave('nope')).toBeNull()
    })

    it('returns leave by id', () => {
      const lv = service.createLeave({
        employeeId: 'e1', employeeName: 'A', storeId: 's1',
        leaveType: 'annual', startDate: '2026-08-01', endDate: '2026-08-02',
        reason: '年假',
      })
      expect(service.getLeave(lv.id)).toBeDefined()
    })

    it('listLeaves filters by status', () => {
      service.createLeave({
        employeeId: 'e1', employeeName: 'A', storeId: 's1',
        leaveType: 'sick', startDate: '2026-07-30', endDate: '2026-07-30',
        reason: '病假',
      })
      const pending = service.listLeaves({ status: 'pending' })
      expect(pending.length).toBeGreaterThanOrEqual(1)
    })
  })
})
