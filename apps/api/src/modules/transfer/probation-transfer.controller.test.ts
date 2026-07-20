import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [probation-transfer] controller 测试
 *
 * 覆盖: CRUD + 审批流 + 统计 + mock种子
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ProbationTransferController } from './probation-transfer.controller'
import { ProbationTransferService } from './probation-transfer.service'
import { ProbationStatus, ProbationDuration } from './probation-transfer.entity'

describe('ProbationTransferController', () => {
  let controller: InstanceType<typeof ProbationTransferController>
  let service: InstanceType<typeof ProbationTransferService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new ProbationTransferService()
    controller = new ProbationTransferController(service)
  })

  afterEach(() => {
    service.resetTransferStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be probation-transfers', () => {
      const path = Reflect.getMetadata('path', ProbationTransferController)
      assert.equal(path, 'probation-transfers')
    })

    it('createTransfer should be POST /', () => {
      const method = Reflect.getMetadata('method', ProbationTransferController.prototype.createTransfer)
      const path = Reflect.getMetadata('path', ProbationTransferController.prototype.createTransfer)
      assert.equal(method, 1) // POST
      assert.equal(path, '/')
    })

    it('listTransfers should be GET /', () => {
      const method = Reflect.getMetadata('method', ProbationTransferController.prototype.listTransfers)
      const path = Reflect.getMetadata('path', ProbationTransferController.prototype.listTransfers)
      assert.equal(method, 0) // GET
      assert.equal(path, '/')
    })

    it('getTransfer should be GET /:transferId', () => {
      const method = Reflect.getMetadata('method', ProbationTransferController.prototype.getTransfer)
      const path = Reflect.getMetadata('path', ProbationTransferController.prototype.getTransfer)
      assert.equal(method, 0) // GET
      assert.equal(path, ':transferId')
    })

    it('approveTransfer should be PATCH /:transferId/approve', () => {
      const method = Reflect.getMetadata('method', ProbationTransferController.prototype.approveTransfer)
      const path = Reflect.getMetadata('path', ProbationTransferController.prototype.approveTransfer)
      assert.equal(method, 4) // PATCH
      assert.equal(path, ':transferId/approve')
    })

    it('getStats should be GET /stats', () => {
      const method = Reflect.getMetadata('method', ProbationTransferController.prototype.getStats)
      const path = Reflect.getMetadata('path', ProbationTransferController.prototype.getStats)
      assert.equal(method, 0) // GET
      assert.equal(path, 'stats')
    })

    it('seedMockData should be POST /seed', () => {
      const method = Reflect.getMetadata('method', ProbationTransferController.prototype.seedMockData)
      const path = Reflect.getMetadata('path', ProbationTransferController.prototype.seedMockData)
      assert.equal(method, 1) // POST
      assert.equal(path, 'seed')
    })
  })

  // ── Controller Logic ──

  describe('createTransfer', () => {
    it('should create a probation transfer via controller', () => {
      const t = controller.createTransfer(TENANT, {
        employeeId: 'EMP-001',
        employeeName: '张三',
        department: '运营部',
        position: '活动策划专员',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01',
        probationEnd: '2026-06-30',
        evaluation: '表现优异，团队协作良好',
        approver: '李经理',
      })
      assert.equal(t.employeeId, 'EMP-001')
      assert.equal(t.status, ProbationStatus.Ongoing)
      assert.equal(t.probationDuration, ProbationDuration.ThreeMonths)
    })
  })

  describe('listTransfers', () => {
    it('should list all transfers', () => {
      controller.createTransfer(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', department: '运营部', position: '专员',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      controller.createTransfer(TENANT, {
        employeeId: 'EMP-002', employeeName: 'B', department: '技术部', position: '工程师',
        probationDuration: ProbationDuration.TwoMonths,
        probationStart: '2026-05-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      assert.equal(controller.listTransfers(TENANT, {}).length, 2)
    })

    it('should filter by department', () => {
      controller.createTransfer(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', department: '运营部', position: '专员',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      controller.createTransfer(TENANT, {
        employeeId: 'EMP-002', employeeName: 'B', department: '技术部', position: '工程师',
        probationDuration: ProbationDuration.TwoMonths,
        probationStart: '2026-05-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      const result = controller.listTransfers(TENANT, { department: '运营部' })
      assert.equal(result.length, 1)
      assert.equal(result[0].employeeId, 'EMP-001')
    })
  })

  describe('getTransfer', () => {
    it('should get transfer by id', () => {
      const t = controller.createTransfer(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', department: 'D', position: 'P',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      const found = controller.getTransfer(TENANT, t.id)
      assert.equal(found.id, t.id)
    })

    it('should throw on non-existent transfer', () => {
      assert.throws(() => {
        controller.getTransfer(TENANT, 'nonexistent')
      }, /Probation transfer not found/)
    })
  })

  describe('approveTransfer', () => {
    it('should approve a transfer (Completed)', () => {
      const t = controller.createTransfer(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', department: 'D', position: 'P',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      const approved = controller.approveTransfer(TENANT, t.id, {
        status: ProbationStatus.Completed,
        performanceRating: 'A',
        approvalRemark: '正式录用',
      })
      assert.equal(approved.status, ProbationStatus.Completed)
      assert.equal(approved.performanceRating, 'A')
      assert.equal(approved.approvalRemark, '正式录用')
      assert.ok(approved.transferDate)
    })

    it('should reject/terminate a transfer', () => {
      const t = controller.createTransfer(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', department: 'D', position: 'P',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      const terminated = controller.approveTransfer(TENANT, t.id, {
        status: ProbationStatus.Terminated,
        rejectReason: '试用期评估不合格',
      })
      assert.equal(terminated.status, ProbationStatus.Terminated)
      assert.equal(terminated.rejectReason, '试用期评估不合格')
    })

    it('should extend a transfer', () => {
      const t = controller.createTransfer(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', department: 'D', position: 'P',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      const extended = controller.approveTransfer(TENANT, t.id, {
        status: ProbationStatus.Extended,
        performanceRating: 'C',
        approvalRemark: '延长试用期2个月',
      })
      assert.equal(extended.status, ProbationStatus.Extended)
      assert.equal(extended.approvalRemark, '延长试用期2个月')
    })
  })

  describe('seedMockData', () => {
    it('should seed 10 mock transfers', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock probation transfer data seeded' })
      assert.equal(controller.listTransfers(TENANT, {}).length, 10)
    })
  })

  // ── Statistics ──

  describe('getStats', () => {
    it('should return empty stats when no transfers', () => {
      const stats = controller.getStats(TENANT)
      assert.equal(stats.total, 0)
      assert.equal(stats.completedRate, 0)
      assert.equal(stats.extensionRate, 0)
      assert.equal(stats.terminationRate, 0)
      assert.equal(stats.averageDurationDays, 0)
      assert.deepStrictEqual(stats.monthlyTrend, [])
      assert.deepStrictEqual(stats.byDepartment, [])
      assert.deepStrictEqual(stats.performanceDistribution, [])
    })

    it('should return correct stats after seeding', () => {
      controller.seedMockData(TENANT)
      const stats = controller.getStats(TENANT)

      // total
      assert.equal(stats.total, 10)

      // byStatus
      assert.ok(stats.byStatus[ProbationStatus.Ongoing] >= 1)
      assert.ok(stats.byStatus[ProbationStatus.Completed] >= 1)
      assert.ok(stats.byStatus[ProbationStatus.Extended] >= 1)
      assert.ok(stats.byStatus[ProbationStatus.Terminated] >= 1)

      // byDepartment
      assert.ok(stats.byDepartment.length >= 1)
      assert.ok(stats.byDepartment.every((d) => d.count > 0))

      // rates
      assert.ok(stats.completedRate >= 0)
      assert.ok(stats.extensionRate >= 0)
      assert.ok(stats.terminationRate >= 0)

      // averageDurationDays
      assert.ok(stats.averageDurationDays >= 0)

      // monthlyTrend
      assert.ok(Array.isArray(stats.monthlyTrend))

      // performanceDistribution
      assert.ok(stats.performanceDistribution.length >= 1)
    })

    it('should return stats per tenant isolated', () => {
      const T2 = { tenantId: 'tenant-002' }

      controller.createTransfer(TENANT, {
        employeeId: 'E1', employeeName: 'A', department: '运营部', position: 'P',
        probationDuration: ProbationDuration.ThreeMonths,
        probationStart: '2026-04-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })
      controller.createTransfer(T2, {
        employeeId: 'E2', employeeName: 'B', department: '技术部', position: 'E',
        probationDuration: ProbationDuration.TwoMonths,
        probationStart: '2026-05-01', probationEnd: '2026-06-30',
        evaluation: 'E', approver: 'M',
      })

      const stats1 = controller.getStats(TENANT)
      const stats2 = controller.getStats(T2)

      assert.equal(stats1.total, 1)
      assert.equal(stats2.total, 1)
    })
  })
})
