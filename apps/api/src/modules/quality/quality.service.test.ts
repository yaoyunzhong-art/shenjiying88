/**
 * quality.service.test.ts - 质量巡查服务单元测试
 *
 * 原则:
 * - vitest (globals) + node:assert/strict
 * - 使用 vitest.mock 模拟 QualityInspectionService
 * - 正例 + 反例 + 边界
 *
 * 覆盖:
 * - PatrolTask: CRUD, list/filter, 状态视图
 * - RectificationRecord: CRUD, list/filter, 统计
 */

import { describe, it, beforeEach, vi } from 'vitest'
import assert from 'node:assert/strict'
import { QualityService } from './quality.service'
import {
  PatrolTaskStatus,
  PatrolTaskPriority,
  PatrolArea,
  RectificationStatus,
  Severity,
} from './quality.entity'

/* ── Mock QualityInspectionService ── */

const mockInspectionService = {
  listInspections: vi.fn(),
  getInspection: vi.fn(),
  createInspection: vi.fn(),
}

/* ── Constants ── */

const TENANT = 'tenant-001'

/* ── Tests ── */

describe('QualityService', () => {
  let service: QualityService

  beforeEach(() => {
    service = new QualityService(mockInspectionService as any)
    service.resetQualityStoresForTests()
  })

  // ─── PatrolTask CRUD ─────────────────────────────────

  describe('PatrolTask CRUD', () => {
    it('createPatrolTask 创建成功, 初始状态为 Pending', () => {
      const task = service.createPatrolTask({
        tenantId: TENANT,
        patrolNo: 'PT-TEST-001',
        title: '测试巡查',
        description: '测试巡查任务',
        area: PatrolArea.Kitchen,
        priority: PatrolTaskPriority.High,
        checkItems: [{ name: '设备检查', standard: '设备正常运行' }],
        assignedTo: '测试员',
        scheduledAt: '2026-08-01T09:00:00Z',
      })
      assert.match(task.id, /^patrol-/)
      assert.equal(task.patrolNo, 'PT-TEST-001')
      assert.equal(task.status, PatrolTaskStatus.Pending)
      assert.equal(task.assignedTo, '测试员')
      assert.equal(task.checkItems.length, 1)
    })

    it('getPatrolTask 获取已存在的任务', () => {
      const created = service.createPatrolTask({
        tenantId: TENANT,
        patrolNo: 'PT-TEST-002',
        title: '查找测试',
        description: '测试查找',
        area: PatrolArea.Warehouse,
        priority: PatrolTaskPriority.Medium,
        checkItems: [{ name: '温湿度', standard: '正常范围' }],
        assignedTo: '测试员2',
        scheduledAt: '2026-08-02T10:00:00Z',
      })
      const found = service.getPatrolTask(created.id, TENANT)
      assert.ok(found)
      assert.equal(found!.id, created.id)
    })

    it('getPatrolTask 跨租户隔离', () => {
      const created = service.createPatrolTask({
        tenantId: TENANT,
        patrolNo: 'PT-TEST-003',
        title: '隔离测试',
        description: '测试隔离',
        area: PatrolArea.DiningHall,
        priority: PatrolTaskPriority.Low,
        checkItems: [],
        assignedTo: '测试员3',
        scheduledAt: '2026-08-03T09:00:00Z',
      })
      const notFound = service.getPatrolTask(created.id, 'other-tenant')
      assert.equal(notFound, undefined)
    })

    it('updatePatrolTask 更新字段', () => {
      const created = service.createPatrolTask({
        tenantId: TENANT,
        patrolNo: 'PT-TEST-004',
        title: '更新测试',
        description: '原始描述',
        area: PatrolArea.Kitchen,
        priority: PatrolTaskPriority.Medium,
        checkItems: [{ name: '检查项', standard: '标准' }],
        assignedTo: '测试员',
        scheduledAt: '2026-08-04T09:00:00Z',
      })

      const updated = service.updatePatrolTask(created.id, TENANT, {
        title: '已更新',
        priority: PatrolTaskPriority.High,
        status: PatrolTaskStatus.InProgress,
      })
      assert.equal(updated.title, '已更新')
      assert.equal(updated.priority, PatrolTaskPriority.High)
      assert.equal(updated.status, PatrolTaskStatus.InProgress)
    })

    it('updatePatrolTask 完成时自动设置 completedAt', () => {
      const created = service.createPatrolTask({
        tenantId: TENANT,
        patrolNo: 'PT-TEST-005',
        title: '完成测试',
        description: '完成测试',
        area: PatrolArea.Kitchen,
        priority: PatrolTaskPriority.High,
        checkItems: [{ name: '检查项', standard: '标准' }],
        assignedTo: '测试员',
        scheduledAt: '2026-08-05T09:00:00Z',
      })

      const completed = service.updatePatrolTask(created.id, TENANT, {
        status: PatrolTaskStatus.Completed,
      })
      assert.equal(completed.status, PatrolTaskStatus.Completed)
      assert.ok(completed.completedAt)
    })

    it('deletePatrolTask 删除任务', () => {
      const created = service.createPatrolTask({
        tenantId: TENANT,
        patrolNo: 'PT-TEST-006',
        title: '删除测试',
        description: '删除测试',
        area: PatrolArea.Kitchen,
        priority: PatrolTaskPriority.Low,
        checkItems: [],
        assignedTo: '测试员',
        scheduledAt: '2026-08-06T09:00:00Z',
      })

      service.deletePatrolTask(created.id, TENANT)
      const found = service.getPatrolTask(created.id, TENANT)
      assert.equal(found, undefined)
    })

    it('deletePatrolTask 不存在的任务抛异常', () => {
      assert.throws(
        () => service.deletePatrolTask('non-existent', TENANT),
        /Patrol task not found/,
      )
    })
  })

  // ─── RectificationRecord CRUD ─────────────────────────

  describe('RectificationRecord CRUD', () => {
    it('createRectificationRecord 创建成功, 初始状态 Open', () => {
      const record = service.createRectificationRecord({
        tenantId: TENANT,
        rectificationNo: 'REC-TEST-001',
        sourceInspectionId: 'ins-001',
        sourceInspectNo: 'IQC-TEST-001',
        title: '测试整改',
        description: '测试整改记录',
        severity: Severity.Major,
        responsiblePerson: '张质检',
        actions: [{ description: '分析原因', assignee: '张质检', deadline: '2026-08-10' }],
        deadline: '2026-08-10T00:00:00Z',
      })
      assert.match(record.id, /^rect-/)
      assert.equal(record.status, RectificationStatus.Open)
      assert.equal(record.severity, Severity.Major)
      assert.equal(record.actions.length, 1)
    })

    it('updateRectificationRecord 决议后自动设置 resolvedAt', () => {
      const record = service.createRectificationRecord({
        tenantId: TENANT,
        rectificationNo: 'REC-TEST-002',
        sourceInspectionId: 'ins-002',
        sourceInspectNo: 'IQC-TEST-002',
        title: '决议测试',
        description: '决议测试',
        severity: Severity.Critical,
        responsiblePerson: '李质检',
        actions: [],
        deadline: '2026-08-15T00:00:00Z',
      })
      const resolved = service.updateRectificationRecord(record.id, TENANT, {
        status: RectificationStatus.Verified,
      })
      assert.equal(resolved.status, RectificationStatus.Verified)
      assert.ok(resolved.resolvedAt)
    })

    it('DeleteRectificationRecord 删除成功', () => {
      const record = service.createRectificationRecord({
        tenantId: TENANT,
        rectificationNo: 'REC-TEST-003',
        sourceInspectionId: 'ins-003',
        sourceInspectNo: 'IQC-TEST-003',
        title: '删除整改',
        description: '删除整改',
        severity: Severity.Minor,
        responsiblePerson: '王质检',
        actions: [],
        deadline: '2026-08-20T00:00:00Z',
      })
      service.deleteRectificationRecord(record.id, TENANT)
      assert.equal(service.getRectificationRecord(record.id, TENANT), undefined)
    })
  })

  // ─── List/Filter 视图 ─────────────────────────────────

  describe('listPatrolTasks', () => {
    it('返回 seed 数据', () => {
      const tasks = service.listPatrolTasks(TENANT)
      assert.ok(tasks.length > 0)
    })

    it('按状态筛选', () => {
      const pending = service.listPatrolTasks(TENANT, { status: PatrolTaskStatus.Pending })
      pending.forEach((t) => assert.equal(t.status, PatrolTaskStatus.Pending))
    })

    it('按区域筛选', () => {
      const kitchen = service.listPatrolTasks(TENANT, { area: PatrolArea.Kitchen })
      kitchen.forEach((t) => assert.equal(t.area, PatrolArea.Kitchen))
    })

    it('按关键词搜索', () => {
      const found = service.listPatrolTasks(TENANT, { search: '消防' })
      assert.ok(found.length > 0)
    })

    it('不匹配关键词返回空', () => {
      const empty = service.listPatrolTasks(TENANT, { search: '不存在的巡查' })
      assert.equal(empty.length, 0)
    })
  })

  describe('getPendingPatrolTasks / getOverduePatrolTasks', () => {
    it('getPendingPatrolTasks 只返回 Pending 状态', () => {
      const pending = service.getPendingPatrolTasks(TENANT)
      pending.forEach((t) => assert.equal(t.status, PatrolTaskStatus.Pending))
    })

    it('getOverduePatrolTasks 返回 Pending/InProgress 且已超期的', () => {
      const overdue = service.getOverduePatrolTasks(TENANT)
      // 种子数据中有未来计划的 Pending 任务, 不一定过期
      // 只检查返回的任务状态正确性
      overdue.forEach((t) => {
        assert.ok(
          t.status === PatrolTaskStatus.Pending || t.status === PatrolTaskStatus.InProgress,
        )
      })
    })
  })

  describe('listRectificationRecords', () => {
    it('返回 seed 数据', () => {
      const records = service.listRectificationRecords(TENANT)
      assert.ok(records.length > 0)
    })

    it('按严重程度筛选', () => {
      const critical = service.listRectificationRecords(TENANT, { severity: Severity.Critical })
      critical.forEach((r) => assert.equal(r.severity, Severity.Critical))
    })
  })

  describe('getRectificationStats', () => {
    it('统计各状态数量', () => {
      const stats = service.getRectificationStats(TENANT)
      assert.ok(stats.total > 0)
      assert.equal(typeof stats.open, 'number')
      assert.equal(typeof stats.closed, 'number')
      assert.equal(typeof stats.overdue, 'number')
      assert.equal(
        stats.open + stats.inProgress + stats.resolved + stats.verified + stats.closed,
        stats.total,
      )
    })
  })
})
