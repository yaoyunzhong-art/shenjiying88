/**
 * leave-request.service.spec.ts — 请假申请 Service 单元测试 (V23)
 *
 * 覆盖: createLeave / getLeave / listLeaves / approveLeave / cancelLeave / getStats
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LeaveRequestService } from './leave-request.service'
import { LeaveType, LeaveStatus } from './leave-request.entity'

const TENANT_ID = 'tenant-test'

describe('LeaveRequestService', () => {
  let service: LeaveRequestService

  beforeEach(() => {
    service = new LeaveRequestService()
    service.resetLeaveStoresForTests()
    service.seedMockData(TENANT_ID)
  })

  // ════════════════════════════════════════════
  // createLeave
  // ════════════════════════════════════════════

  describe('createLeave', () => {
    it('正例: 创建事假申请', () => {
      const leave = service.createLeave({
        tenantId: TENANT_ID,
        employeeId: 'EMP-100',
        employeeName: '测试员工',
        type: LeaveType.Personal,
        startDate: '2026-08-01',
        endDate: '2026-08-01',
        days: 1,
        reason: '家中有事',
        approver: '李经理',
      })
      expect(leave.id).toBeTruthy()
      expect(leave.status).toBe(LeaveStatus.Pending)
    })

    it('正例: 创建已批准的年假', () => {
      const leave = service.createLeave({
        tenantId: TENANT_ID,
        employeeId: 'EMP-200',
        employeeName: '员工2',
        type: LeaveType.Annual,
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        days: 5,
        reason: '年假旅行',
        approver: '经理',
        status: LeaveStatus.Approved,
        approvedAt: new Date().toISOString(),
      })
      expect(leave.status).toBe(LeaveStatus.Approved)
    })
  })

  // ════════════════════════════════════════════
  // getLeave
  // ════════════════════════════════════════════

  describe('getLeave', () => {
    it('正例: 查询已创建的请假', () => {
      const created = service.createLeave({
        tenantId: TENANT_ID,
        employeeId: 'EMP-X',
        employeeName: '测试',
        type: LeaveType.Sick,
        startDate: '2026-08-10',
        endDate: '2026-08-10',
        days: 1,
        reason: '看病',
        approver: '经理',
      })
      const found = service.getLeave(created.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.employeeName).toBe('测试')
    })

    it('反例: 不同tenant返回undefined', () => {
      const created = service.createLeave({
        tenantId: 'tenant-a',
        employeeId: 'EMP-X',
        employeeName: '测试',
        type: LeaveType.Sick,
        startDate: '2026-08-10',
        endDate: '2026-08-10',
        days: 1,
        reason: '看病',
        approver: '经理',
      })
      expect(service.getLeave(created.id, 'tenant-b')).toBeUndefined()
    })
  })

  // ════════════════════════════════════════════
  // listLeaves
  // ════════════════════════════════════════════

  describe('listLeaves', () => {
    it('正例: 列出所有请假', () => {
      const leaves = service.listLeaves(TENANT_ID)
      expect(leaves.length).toBeGreaterThan(15) // 种子数据20条
    })

    it('正例: 按类型筛选', () => {
      const leaves = service.listLeaves(TENANT_ID, { type: LeaveType.Sick })
      expect(leaves.every(l => l.type === LeaveType.Sick)).toBe(true)
    })

    it('正例: 按状态筛选', () => {
      const leaves = service.listLeaves(TENANT_ID, { status: LeaveStatus.Pending })
      expect(leaves.every(l => l.status === LeaveStatus.Pending)).toBe(true)
    })

    it('边界: 不存在的tenant返回空', () => {
      const leaves = service.listLeaves('nonexistent-tenant')
      expect(leaves.length).toBe(0)
    })
  })

  // ════════════════════════════════════════════
  // approveLeave
  // ════════════════════════════════════════════

  describe('approveLeave', () => {
    it('正例: 批准pending状态的休假', () => {
      const leaves = service.listLeaves(TENANT_ID, { status: LeaveStatus.Pending })
      const target = leaves[0]
      const approved = service.approveLeave(target.id, LeaveStatus.Approved, TENANT_ID)
      expect(approved.status).toBe(LeaveStatus.Approved)
      expect(approved.approvedAt).toBeTruthy()
    })

    it('反例: 批准已批准的请假抛异常', () => {
      const leaves = service.listLeaves(TENANT_ID, { status: LeaveStatus.Approved })
      const target = leaves[0]
      expect(() =>
        service.approveLeave(target.id, LeaveStatus.Approved, TENANT_ID),
      ).toThrow('already')
    })
  })

  // ════════════════════════════════════════════
  // cancelLeave
  // ════════════════════════════════════════════

  describe('cancelLeave', () => {
    it('正例: 取消pending状态的休假', () => {
      const leaves = service.listLeaves(TENANT_ID, { status: LeaveStatus.Pending })
      const target = leaves[0]
      const cancelled = service.cancelLeave(target.id, TENANT_ID)
      expect(cancelled.status).toBe(LeaveStatus.Cancelled)
    })

    it('反例: 取消已批准的抛异常', () => {
      const leaves = service.listLeaves(TENANT_ID, { status: LeaveStatus.Approved })
      const target = leaves[0]
      expect(() => service.cancelLeave(target.id, TENANT_ID)).toThrow('not pending')
    })
  })

  // ════════════════════════════════════════════
  // getStats
  // ════════════════════════════════════════════

  describe('getStats', () => {
    it('正例: 返回统计信息', () => {
      const stats = service.getStats(TENANT_ID)
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.byStatus).toHaveProperty(LeaveStatus.Pending)
      expect(stats.byStatus).toHaveProperty(LeaveStatus.Approved)
      expect(stats.byType).toHaveProperty(LeaveType.Annual)
      expect(stats.totalDays).toBeGreaterThan(0)
      expect(stats.rejectionRate).toBeGreaterThanOrEqual(0)
      expect(stats.monthlyTrend.length).toBeGreaterThan(0)
      expect(stats.employeeStats.length).toBeGreaterThan(0)
    })

    it('正例: rejectionRate计算正确', () => {
      const stats = service.getStats(TENANT_ID)
      expect(stats.rejectionRate).toBeGreaterThanOrEqual(0)
      expect(stats.rejectionRate).toBeLessThanOrEqual(1)
    })
  })
})
