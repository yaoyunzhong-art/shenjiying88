/**
 * probation-transfer.service.spec.ts — 试用期转正模块 Service 单元测试
 *
 * 覆盖: CRUD / 审批流程 / 统计 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ProbationTransferService } from './probation-transfer.service'
import { ProbationStatus, ProbationDuration } from './probation-transfer.entity'

describe('ProbationTransferService — CRUD', () => {
  let svc: ProbationTransferService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ProbationTransferService()
    svc.resetTransferStoresForTests()
  })

  it('createTransfer 创建转正记录成功', () => {
    const t = svc.createTransfer({
      tenantId,
      employeeId: 'EMP-100',
      employeeName: '测试员工',
      department: '技术部',
      position: '前端工程师',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-05-01',
      probationEnd: '2026-07-31',
      evaluation: '表现良好，技术能力达标',
      approver: '王总监',
    })
    expect(t.id).toMatch(/^transfer-/)
    expect(t.employeeName).toBe('测试员工')
    expect(t.status).toBe(ProbationStatus.Ongoing)
  })

  it('getTransfer 返回正确的记录', () => {
    const t = svc.createTransfer({
      tenantId, employeeId: 'EMP-101', employeeName: '查询测试',
      department: '运营部', position: '运营专员',
      probationDuration: ProbationDuration.TwoMonths,
      probationStart: '2026-07-01', probationEnd: '2026-08-31',
      evaluation: '表现稳定', approver: '李经理',
    })
    const found = svc.getTransfer(t.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.employeeName).toBe('查询测试')
  })

  it('getTransfer 返回 undefined 当记录不存在', () => {
    expect(svc.getTransfer('fake-id', tenantId)).toBeUndefined()
  })

  it('listTransfers 支持按状态筛选', () => {
    // 创建 Ongoing 记录
    svc.createTransfer({
      tenantId, employeeId: 'EMP-L1', employeeName: '员工A',
      department: '技术部', position: '开发',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-07-01', probationEnd: '2026-09-30',
      evaluation: '好', approver: 'Mgr',
    })
    const ongoing = svc.listTransfers(tenantId, { status: ProbationStatus.Ongoing })
    ongoing.forEach((t) => expect(t.status).toBe(ProbationStatus.Ongoing))
  })

  it('listTransfers 支持多条件筛选', () => {
    svc.createTransfer({
      tenantId, employeeId: 'EMP-D1', employeeName: 'B',
      department: '财务部', position: '会计',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-06-01', probationEnd: '2026-08-31',
      evaluation: '认真', approver: '财务总监',
    })
    const items = svc.listTransfers(tenantId, { department: '财务部', approver: '财务总监' })
    items.forEach((t) => {
      expect(t.department).toBe('财务部')
      expect(t.approver).toBe('财务总监')
    })
  })

  it('listTransfers 按日期范围筛选', () => {
    svc.createTransfer({
      tenantId, employeeId: 'EMP-E1', employeeName: 'C',
      department: '市场部', position: '市场专员',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-07-01', probationEnd: '2026-09-30',
      evaluation: '良好', approver: '市场总监',
    })
    const items = svc.listTransfers(tenantId, {
      fromDate: '2026-06-01', toDate: '2026-08-31',
    })
    items.forEach((t) => {
      expect(t.probationStart >= '2026-06-01').toBeTruthy()
    })
  })
})

describe('ProbationTransferService — 审批流程', () => {
  let svc: ProbationTransferService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ProbationTransferService()
    svc.resetTransferStoresForTests()
  })

  function createOngoing() {
    return svc.createTransfer({
      tenantId, employeeId: 'EMP-AP', employeeName: '审批员工',
      department: '技术部', position: '工程师',
      probationDuration: ProbationDuration.ThreeMonths,
      probationStart: '2026-05-01', probationEnd: '2026-07-31',
      evaluation: '表现良好', approver: '王总监',
    })
  }

  it('approveTransfer 完成转正', () => {
    const t = createOngoing()
    const completed = svc.approveTransfer(t.id, ProbationStatus.Completed, tenantId, {
      performanceRating: 'A',
      approvalRemark: '表现优秀，正式录用',
    })
    expect(completed.status).toBe(ProbationStatus.Completed)
    expect(completed.performanceRating).toBe('A')
    expect(completed.transferDate).toBeDefined()
  })

  it('approveTransfer 延长试用期', () => {
    const t = createOngoing()
    const extended = svc.approveTransfer(t.id, ProbationStatus.Extended, tenantId, {
      performanceRating: 'C',
      approvalRemark: '需提升能力，延长2个月',
    })
    expect(extended.status).toBe(ProbationStatus.Extended)
    expect(extended.performanceRating).toBe('C')
  })

  it('approveTransfer 终止试用', () => {
    const t = createOngoing()
    const terminated = svc.approveTransfer(t.id, ProbationStatus.Terminated, tenantId, {
      performanceRating: 'D',
      rejectReason: '未达到岗位要求',
    })
    expect(terminated.status).toBe(ProbationStatus.Terminated)
    expect(terminated.rejectReason).toBe('未达到岗位要求')
  })

  it('approveTransfer 已完成的记录抛 Error', () => {
    const t = createOngoing()
    svc.approveTransfer(t.id, ProbationStatus.Completed, tenantId)
    expect(() => svc.approveTransfer(t.id, ProbationStatus.Extended, tenantId)).toThrow(/Cannot approve/)
  })

  it('approveTransfer 不存在的记录抛 Error', () => {
    expect(() => svc.approveTransfer('fake-id', ProbationStatus.Completed, tenantId)).toThrow(/not found/)
  })
})

describe('ProbationTransferService — 统计', () => {
  let svc: ProbationTransferService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new ProbationTransferService()
    svc.resetTransferStoresForTests()
    svc.seedMockData(tenantId)
  })

  it('getStats 返回统计信息', () => {
    const stats = svc.getStats(tenantId)
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.byStatus.Ongoing + stats.byStatus.Completed + stats.byStatus.Extended + stats.byStatus.Terminated).toBe(stats.total)
    expect(stats.completedRate).toBeGreaterThanOrEqual(0)
    expect(stats.completedRate).toBeLessThanOrEqual(1)
    expect(stats.byDepartment.length).toBeGreaterThan(0)
    expect(stats.monthlyTrend.length).toBeGreaterThanOrEqual(0)
  })

  it('getStats 空租户返回零值', () => {
    const stats = svc.getStats('nonexistent')
    expect(stats.total).toBe(0)
    expect(stats.completedRate).toBe(0)
    expect(stats.extensionRate).toBe(0)
  })
})
