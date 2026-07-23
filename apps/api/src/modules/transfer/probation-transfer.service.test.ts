/**
 * probation-transfer.service.test.ts — 试用期转正 Service 单元测试
 *
 * 覆盖: createTransfer / getTransfer / listTransfers / approveTransfer / getStats
 *       seedMockData / resetTransferStoresForTests
 * 正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ProbationTransferService } from './probation-transfer.service'
import { ProbationStatus, ProbationDuration } from './probation-transfer.entity'

function makeTransferInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'tenant-1',
    employeeId: 'EMP-001',
    employeeName: '张三',
    department: '技术部',
    position: '前端开发工程师',
    probationDuration: ProbationDuration.ThreeMonths,
    probationStart: '2026-04-01',
    probationEnd: '2026-06-30',
    evaluation: '表现优异，符合岗位要求',
    approver: '李经理',
    ...overrides,
  }
}

describe('ProbationTransferService', () => {
  let service: ProbationTransferService

  beforeEach(() => {
    service = new ProbationTransferService()
    service.resetTransferStoresForTests()
  })

  // ═══════════════════════════════════════════════════════════════
  // createTransfer
  // ═══════════════════════════════════════════════════════════════

  describe('createTransfer', () => {
    it('正常创建转正申请，返回完整结构', () => {
      const t = service.createTransfer(makeTransferInput())

      expect(t.id).toMatch(/^transfer-/)
      expect(t.employeeId).toBe('EMP-001')
      expect(t.employeeName).toBe('张三')
      expect(t.department).toBe('技术部')
      expect(t.position).toBe('前端开发工程师')
      expect(t.status).toBe(ProbationStatus.Ongoing)
      expect(t.tenantId).toBe('tenant-1')
      expect(typeof t.createdAt).toBe('string')
      expect(typeof t.updatedAt).toBe('string')
    })

    it('新建转正申请状态为 Ongoing', () => {
      const t = service.createTransfer(makeTransferInput())
      expect(t.status).toBe(ProbationStatus.Ongoing)
    })

    it('不同租户创建各自的数据', () => {
      const t1 = service.createTransfer(makeTransferInput({ tenantId: 'tenant-1', employeeId: 'EMP-001' }))
      const t2 = service.createTransfer(makeTransferInput({ tenantId: 'tenant-2', employeeId: 'EMP-002' }))
      expect(t1.id).not.toBe(t2.id)
      expect(t1.tenantId).toBe('tenant-1')
      expect(t2.tenantId).toBe('tenant-2')
    })

    it('可以创建 1 个月试用期的转正', () => {
      const t = service.createTransfer(
        makeTransferInput({ probationDuration: ProbationDuration.OneMonth }),
      )
      expect(t.probationDuration).toBe(ProbationDuration.OneMonth)
    })

    it('可以创建 6 个月试用期的转正', () => {
      const t = service.createTransfer(
        makeTransferInput({ probationDuration: ProbationDuration.SixMonths }),
      )
      expect(t.probationDuration).toBe(ProbationDuration.SixMonths)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // getTransfer
  // ═══════════════════════════════════════════════════════════════

  describe('getTransfer', () => {
    it('根据 ID 查询到已创建的转正申请', () => {
      const created = service.createTransfer(makeTransferInput())
      const found = service.getTransfer(created.id, 'tenant-1')
      expect(found).toBeDefined()
      expect(found!.employeeName).toBe('张三')
    })

    it('不存在的 ID 返回 undefined', () => {
      const found = service.getTransfer('transfer-nonexistent', 'tenant-1')
      expect(found).toBeUndefined()
    })

    it('跨租户查询返回 undefined', () => {
      const created = service.createTransfer(makeTransferInput({ tenantId: 'tenant-1' }))
      const found = service.getTransfer(created.id, 'tenant-2')
      expect(found).toBeUndefined()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // listTransfers
  // ═══════════════════════════════════════════════════════════════

  describe('listTransfers', () => {
    it('返回租户下所有转正申请', () => {
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-001' }))
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-002' }))
      const list = service.listTransfers('tenant-1')
      expect(list.length).toBe(2)
    })

    it('没有数据时返回空数组', () => {
      expect(service.listTransfers('tenant-1')).toEqual([])
    })

    it('不同租户数据隔离', () => {
      service.createTransfer(makeTransferInput({ tenantId: 'tenant-1' }))
      service.createTransfer(makeTransferInput({ tenantId: 'tenant-2' }))
      expect(service.listTransfers('tenant-1').length).toBe(1)
      expect(service.listTransfers('tenant-2').length).toBe(1)
    })

    it('按状态过滤', () => {
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-001' }))
      const list = service.listTransfers('tenant-1', { status: ProbationStatus.Ongoing })
      expect(list.length).toBe(1)
      const completed = service.listTransfers('tenant-1', { status: ProbationStatus.Completed })
      expect(completed.length).toBe(0)
    })

    it('按部门过滤', () => {
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-001', department: '技术部' }))
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-002', department: '运营部' }))
      expect(service.listTransfers('tenant-1', { department: '技术部' }).length).toBe(1)
      expect(service.listTransfers('tenant-1', { department: '财务部' }).length).toBe(0)
    })

    it('按员工 ID 过滤', () => {
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-001' }))
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-002' }))
      expect(service.listTransfers('tenant-1', { employeeId: 'EMP-001' }).length).toBe(1)
    })

    it('按日期范围过滤', () => {
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-001', probationStart: '2026-04-01' }))
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-002', probationStart: '2026-06-01' }))
      expect(service.listTransfers('tenant-1', { fromDate: '2026-05-01' }).length).toBe(1)
      expect(service.listTransfers('tenant-1', { toDate: '2026-05-01' }).length).toBe(1)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // approveTransfer
  // ═══════════════════════════════════════════════════════════════

  describe('approveTransfer', () => {
    it('通过转正申请，状态变为 Completed', () => {
      const t = service.createTransfer(makeTransferInput())
      const approved = service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1', {
        performanceRating: 'A',
        approvalRemark: '表现优秀，正式录用',
      })
      expect(approved.status).toBe(ProbationStatus.Completed)
      expect(approved.performanceRating).toBe('A')
      expect(approved.approvalRemark).toBe('表现优秀，正式录用')
      expect(approved.transferDate).toBeDefined()
    })

    it('延长试用期，状态变为 Extended', () => {
      const t = service.createTransfer(makeTransferInput())
      const extended = service.approveTransfer(t.id, ProbationStatus.Extended, 'tenant-1', {
        approvalRemark: '延长试用期2个月',
      })
      expect(extended.status).toBe(ProbationStatus.Extended)
    })

    it('终止试用期，状态变为 Terminated', () => {
      const t = service.createTransfer(makeTransferInput())
      const terminated = service.approveTransfer(t.id, ProbationStatus.Terminated, 'tenant-1', {
        rejectReason: '试用期评估不合格',
      })
      expect(terminated.status).toBe(ProbationStatus.Terminated)
      expect(terminated.rejectReason).toBe('试用期评估不合格')
    })

    it('不存在的转正申请抛异常', () => {
      expect(() =>
        service.approveTransfer('transfer-nonexistent', ProbationStatus.Completed, 'tenant-1'),
      ).toThrow('Probation transfer not found')
    })

    it('跨租户审批抛异常', () => {
      const t = service.createTransfer(makeTransferInput({ tenantId: 'tenant-1' }))
      expect(() =>
        service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-2'),
      ).toThrow('Probation transfer not found')
    })

    it('对已完成的转正申请再次审批抛异常', () => {
      const t = service.createTransfer(makeTransferInput())
      service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1')
      expect(() =>
        service.approveTransfer(t.id, ProbationStatus.Extended, 'tenant-1'),
      ).toThrow('Cannot approve a transfer that is already COMPLETED')
    })

    it('对已终止的转正申请再次审批抛异常', () => {
      const t = service.createTransfer(makeTransferInput())
      service.approveTransfer(t.id, ProbationStatus.Terminated, 'tenant-1')
      expect(() =>
        service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1'),
      ).toThrow('Cannot approve a transfer that is already TERMINATED')
    })

    it('审批时可以携带 performanceRating', () => {
      const t = service.createTransfer(makeTransferInput())
      const approved = service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1', {
        performanceRating: 'B',
      })
      expect(approved.performanceRating).toBe('B')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // getStats
  // ═══════════════════════════════════════════════════════════════

  describe('getStats', () => {
    it('没有数据时返回全零统计', () => {
      const stats = service.getStats('tenant-1')
      expect(stats.total).toBe(0)
      expect(stats.byStatus[ProbationStatus.Ongoing]).toBe(0)
      expect(stats.byStatus[ProbationStatus.Completed]).toBe(0)
      expect(stats.byStatus[ProbationStatus.Extended]).toBe(0)
      expect(stats.byStatus[ProbationStatus.Terminated]).toBe(0)
      expect(stats.completedRate).toBe(0)
      expect(stats.extensionRate).toBe(0)
      expect(stats.terminationRate).toBe(0)
      expect(stats.averageDurationDays).toBe(0)
    })

    it('正确统计各状态数量', () => {
      // Create 5 Ongoing
      for (let i = 0; i < 5; i++) {
        service.createTransfer(makeTransferInput({ employeeId: `EMP-ONGOING-${i}` }))
      }
      // Create 3 Completed
      for (let i = 0; i < 3; i++) {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: `EMP-COMPLETE-${i}` }),
        )
        service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1')
      }
      // Create 1 Extended
      {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: 'EMP-EXTENDED' }),
        )
        service.approveTransfer(t.id, ProbationStatus.Extended, 'tenant-1')
      }
      // Create 1 Terminated
      {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: 'EMP-TERMINATED' }),
        )
        service.approveTransfer(t.id, ProbationStatus.Terminated, 'tenant-1')
      }

      const stats = service.getStats('tenant-1')
      expect(stats.total).toBe(10)
      expect(stats.byStatus[ProbationStatus.Ongoing]).toBe(5)
      expect(stats.byStatus[ProbationStatus.Completed]).toBe(3)
      expect(stats.byStatus[ProbationStatus.Extended]).toBe(1)
      expect(stats.byStatus[ProbationStatus.Terminated]).toBe(1)
    })

    it('正确计算完成率/延长率/终止率', () => {
      for (let i = 0; i < 5; i++) {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: `EMP-COMPLETE-${i}` }),
        )
        service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1')
      }
      for (let i = 0; i < 3; i++) {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: `EMP-EXTENDED-${i}` }),
        )
        service.approveTransfer(t.id, ProbationStatus.Extended, 'tenant-1')
      }
      for (let i = 0; i < 2; i++) {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: `EMP-TERMINATED-${i}` }),
        )
        service.approveTransfer(t.id, ProbationStatus.Terminated, 'tenant-1')
      }

      const stats = service.getStats('tenant-1')
      // decidedCount = 5+3+2 = 10
      expect(stats.completedRate).toBe(0.5)   // 5/10
      expect(stats.extensionRate).toBe(0.3)   // 3/10
      expect(stats.terminationRate).toBe(0.2) // 2/10
    })

    it('正确统计部门分布', () => {
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-001', department: '技术部' }))
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-002', department: '技术部' }))
      service.createTransfer(makeTransferInput({ employeeId: 'EMP-003', department: '运营部' }))

      const stats = service.getStats('tenant-1')
      expect(stats.byDepartment.length).toBe(2)
      const tech = stats.byDepartment.find((d) => d.department === '技术部')
      expect(tech!.count).toBe(2)
      const ops = stats.byDepartment.find((d) => d.department === '运营部')
      expect(ops!.count).toBe(1)
    })

    it('正确统计 performanceDistribution', () => {
      for (let i = 0; i < 3; i++) {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: `EMP-A-${i}` }),
        )
        service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1', {
          performanceRating: 'A',
        })
      }
      for (let i = 0; i < 2; i++) {
        const t = service.createTransfer(
          makeTransferInput({ employeeId: `EMP-B-${i}` }),
        )
        service.approveTransfer(t.id, ProbationStatus.Completed, 'tenant-1', {
          performanceRating: 'B',
        })
      }

      const stats = service.getStats('tenant-1')
      const ratingA = stats.performanceDistribution.find((r) => r.rating === 'A')
      const ratingB = stats.performanceDistribution.find((r) => r.rating === 'B')
      expect(ratingA!.count).toBe(3)
      expect(ratingB!.count).toBe(2)
    })

    it('不同租户统计隔离', () => {
      service.createTransfer(makeTransferInput({ tenantId: 'tenant-1', employeeId: 'EMP-001' }))
      service.createTransfer(makeTransferInput({ tenantId: 'tenant-2', employeeId: 'EMP-002' }))

      expect(service.getStats('tenant-1').total).toBe(1)
      expect(service.getStats('tenant-2').total).toBe(1)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // seedMockData
  // ═══════════════════════════════════════════════════════════════

  describe('seedMockData', () => {
    it('种子数据后能查询到 10 条记录', () => {
      service.seedMockData('tenant-1')
      const list = service.listTransfers('tenant-1')
      expect(list.length).toBe(10)
    })

    it('种子数据包含各种状态', () => {
      service.seedMockData('tenant-1')
      const stats = service.getStats('tenant-1')
      expect(stats.byStatus[ProbationStatus.Ongoing]).toBeGreaterThan(0)
      expect(stats.byStatus[ProbationStatus.Completed]).toBeGreaterThan(0)
      expect(stats.byStatus[ProbationStatus.Extended]).toBeGreaterThan(0)
      expect(stats.byStatus[ProbationStatus.Terminated]).toBeGreaterThan(0)
    })

    it('种子数据不同租户彼此独立', () => {
      service.seedMockData('tenant-1')
      expect(service.listTransfers('tenant-2').length).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // resetTransferStoresForTests
  // ═══════════════════════════════════════════════════════════════

  describe('resetTransferStoresForTests', () => {
    it('种子数据后重置，列表为空', () => {
      service.seedMockData('tenant-1')
      service.resetTransferStoresForTests()
      expect(service.listTransfers('tenant-1')).toEqual([])
      expect(service.listTransfers('tenant-2')).toEqual([])
    })
  })
})
