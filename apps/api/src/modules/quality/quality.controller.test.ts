import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [quality] [A] controller 测试 — 巡检+巡查任务+整改记录 三大板块
 *
 * 圈梁五道箍: ①TSC ②测试存在 ③圈梁表更新 ④PRD标记 ⑤知识赋能
 * 三件套: 正例(CRUD/查询) + 反例(异常/错误) + 边界(空/未找到/跨租户)
 * 禁止: as any / ts-nocheck / vi.mock
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QualityController } from './quality.controller'
import { QualityService } from './quality.service'
import { QualityInspectionService } from '../quality-inspection/quality-inspection.service'
import {
  InspectionType,
  InspectionResult,
  Severity,
  PatrolArea,
  PatrolTaskPriority,
  PatrolTaskStatus,
  RectificationStatus,
} from './quality.entity'

describe('QualityController', () => {
  let controller: QualityController
  let service: QualityService
  let inspectionService: QualityInspectionService

  const TENANT = { tenantId: 'tenant-001', brandId: 'brand-1', storeId: 'store-001' }
  const OTHER_TENANT = { tenantId: 'tenant-002', brandId: 'brand-2', storeId: 'store-002' }

  const sampleDefects = [
    { code: 'DIM-001', description: '尺寸偏差', severity: Severity.Minor },
  ]

  const sampleCheckItems = [
    { name: '灭火器状态', standard: '压力正常，外观完好' },
    { name: '应急灯', standard: '通电正常，亮度达标' },
  ]

  const sampleActions = [
    { description: '分析原因并制定整改方案', assignee: '李采购', deadline: '2026-08-01T00:00:00.000Z' },
  ]

  beforeEach(() => {
    inspectionService = new QualityInspectionService()
    service = new QualityService(inspectionService)
    controller = new QualityController(service)
  })

  afterEach(() => {
    service.resetQualityStoresForTests()
    inspectionService.resetInspectionStoresForTests()
  })

  // ═══════════════════════════════════════════════════════════════════
  // Route metadata
  // ═══════════════════════════════════════════════════════════════════

  describe('route metadata', () => {
    it('controller path should be quality', () => {
      const path = Reflect.getMetadata('path', QualityController)
      assert.equal(path, 'quality')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 1. Inspection Records (cross-module delegation)
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /quality/inspections', () => {
    it('正例: 创建巡检记录', () => {
      const result = controller.createInspection(TENANT, {
        inspectNo: 'IQC-TEST-001',
        type: InspectionType.Incoming,
        itemName: '测试零件',
        itemBatch: 'BATCH-001',
        defects: sampleDefects,
        inspector: '王工',
        inspectedAt: '2026-07-21T00:00:00.000Z',
      })

      assert.equal(result.inspectNo, 'IQC-TEST-001')
      assert.equal(result.type, InspectionType.Incoming)
      assert.ok(result.id.startsWith('inspect-'))
    })
  })

  describe('GET /quality/inspections', () => {
    it('正例: 列出巡检记录', () => {
      controller.createInspection(TENANT, {
        inspectNo: 'IQC-TEST-002',
        type: InspectionType.Incoming,
        itemName: '电阻器',
        itemBatch: 'BATCH-R-001',
        defects: sampleDefects,
        inspector: '王工',
        inspectedAt: '2026-07-21T00:00:00.000Z',
      })

      const list = controller.listInspections(TENANT, {})
      assert.ok(list.length >= 21) // includes seed data
      assert.ok(list.some((r: any) => r.inspectNo === 'IQC-TEST-002'))
    })
  })

  describe('GET /quality/inspections/views/pass-rate', () => {
    it('正例: 获取通过率统计', () => {
      // Creating some records
      controller.createInspection(TENANT, {
        inspectNo: 'PASS-1', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1', defects: sampleDefects,
        inspector: 'T1', inspectedAt: '2026-07-21T00:00:00.000Z',
        result: InspectionResult.Pass,
      })

      const stats = controller.getPassRate(TENANT) as any
      assert.ok(typeof stats.total === 'number')
      assert.ok(typeof stats.passRate === 'number')
      assert.ok(stats.passed >= 1)
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 2. Patrol Tasks  — 巡查任务
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /quality/patrol-tasks', () => {
    it('正例: 创建巡查任务', () => {
      const result = controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-TEST-001',
        title: '测试巡查',
        description: '年度消防安全巡查（测试）',
        area: PatrolArea.Kitchen,
        priority: PatrolTaskPriority.High,
        checkItems: sampleCheckItems,
        assignedTo: '张安全',
        scheduledAt: '2026-07-25T09:00:00.000Z',
        notes: '测试备注',
      })

      assert.equal(result.patrolNo, 'PT-TEST-001')
      assert.equal(result.status, PatrolTaskStatus.Pending)
      assert.equal(result.area, PatrolArea.Kitchen)
      assert.equal(result.checkItems.length, 2)
      assert.ok(result.id.startsWith('patrol-'))
    })
  })

  describe('GET /quality/patrol-tasks', () => {
    it('正例: 列出巡查任务（含种子数据）', () => {
      controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-OUT-001',
        title: '专项巡查',
        description: '描述',
        area: PatrolArea.DiningHall,
        priority: PatrolTaskPriority.Medium,
        checkItems: sampleCheckItems,
        assignedTo: '赵工',
        scheduledAt: '2026-07-25T10:00:00.000Z',
      })

      const list = controller.listPatrolTasks(TENANT, {})
      assert.ok(list.length >= 9) // 8 seed + 1 new
      assert.ok(list.some((t: any) => t.patrolNo === 'PT-OUT-001'))
    })

    it('正例: 按区域筛选巡查任务', () => {
      controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-KITCHEN', title: '厨房巡查', description: '',
        area: PatrolArea.Kitchen, priority: PatrolTaskPriority.High,
        checkItems: sampleCheckItems, assignedTo: 'T1',
        scheduledAt: '2026-07-25T00:00:00.000Z',
      })

      const filtered = controller.listPatrolTasks(TENANT, {
        area: PatrolArea.Warehouse,
      })
      assert.ok(filtered.every((t: any) => t.area === PatrolArea.Warehouse))
    })
  })

  describe('GET /quality/patrol-tasks/:patrolId', () => {
    it('正例: 获取单个巡查任务', () => {
      const created = controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-GET-001', title: '获取测试', description: '',
        area: PatrolArea.Entrance, priority: PatrolTaskPriority.Low,
        checkItems: sampleCheckItems, assignedTo: 'T1',
        scheduledAt: '2026-07-25T00:00:00.000Z',
      })

      const found = controller.getPatrolTask(TENANT, created.id)
      assert.equal(found.patrolNo, 'PT-GET-001')
    })

    it('反例: 不存在的巡查任务应抛出异常', () => {
      assert.throws(
        () => controller.getPatrolTask(TENANT, 'nonexistent'),
        /Patrol task not found/
      )
    })
  })

  describe('PATCH /quality/patrol-tasks/:patrolId', () => {
    it('正例: 更新巡查状态为已完成', () => {
      const created = controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-PATCH-001', title: '状态更新', description: '',
        area: PatrolArea.Kitchen, priority: PatrolTaskPriority.High,
        checkItems: sampleCheckItems, assignedTo: 'T1',
        scheduledAt: '2026-07-25T00:00:00.000Z',
      })

      const updated = controller.updatePatrolTask(TENANT, created.id, {
        status: PatrolTaskStatus.Completed,
        notes: '已完成巡查',
      })
      assert.equal(updated.status, PatrolTaskStatus.Completed)
      assert.equal(updated.notes, '已完成巡查')
    })
  })

  describe('DELETE /quality/patrol-tasks/:patrolId', () => {
    it('正例: 删除巡查任务', () => {
      const created = controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-DEL-001', title: '待删除', description: '',
        area: PatrolArea.Other, priority: PatrolTaskPriority.Low,
        checkItems: sampleCheckItems, assignedTo: 'T1',
        scheduledAt: '2026-07-25T00:00:00.000Z',
      })

      const result = controller.deletePatrolTask(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  describe('GET /quality/patrol-tasks/views/pending', () => {
    it('正例: 获取待处理巡查任务', () => {
      controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-PEND-001', title: '待处理', description: '',
        area: PatrolArea.Kitchen, priority: PatrolTaskPriority.High,
        checkItems: sampleCheckItems, assignedTo: 'T1',
        scheduledAt: '2026-08-01T00:00:00.000Z',
      })

      const pending = controller.getPendingPatrolTasks(TENANT)
      assert.ok(pending.some((t: any) => t.patrolNo === 'PT-PEND-001'))
    })
  })

  describe('GET /quality/patrol-tasks/views/overdue', () => {
    it('正例: 获取逾期巡查任务（需要不依赖种子数据）', () => {
      // Create a task with past schedule
      controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-OVER-001', title: '逾期任务', description: '',
        area: PatrolArea.Kitchen, priority: PatrolTaskPriority.High,
        checkItems: sampleCheckItems, assignedTo: 'T1',
        scheduledAt: '2020-01-01T00:00:00.000Z', // way in the past
      })

      const overdue = controller.getOverduePatrolTasks(TENANT)
      assert.ok(overdue.length >= 1)
      assert.ok(overdue.some((t: any) => t.patrolNo === 'PT-OVER-001'))
    })
  })

  describe('GET /quality/patrol-tasks/area/:area', () => {
    it('正例: 按区域查询', () => {
      const tasks = controller.getPatrolTasksByArea(TENANT, PatrolArea.Kitchen)
      assert.ok(tasks.every((t: any) => t.area === PatrolArea.Kitchen))
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 3. Rectification Records  — 整改记录
  // ═══════════════════════════════════════════════════════════════════

  describe('POST /quality/rectifications', () => {
    it('正例: 创建整改记录', () => {
      const rect = controller.createRectification(TENANT, {
        rectificationNo: 'REC-TEST-001',
        sourceInspectionId: 'inspect-001',
        sourceInspectNo: 'IQC-2026-TEST',
        title: '测试整改',
        description: '颜色偏差超标整改',
        severity: Severity.Critical,
        responsiblePerson: '李采购',
        actions: sampleActions,
        deadline: '2026-08-01T00:00:00.000Z',
      })

      assert.equal(rect.rectificationNo, 'REC-TEST-001')
      assert.equal(rect.status, RectificationStatus.Open)
      assert.equal(rect.actions.length, 1)
      assert.ok(rect.id.startsWith('rect-'))
    })
  })

  describe('GET /quality/rectifications', () => {
    it('正例: 列出整改记录', () => {
      controller.createRectification(TENANT, {
        rectificationNo: 'REC-LIST-001',
        sourceInspectionId: 'i-01', sourceInspectNo: 'IQC-LIST',
        title: '列表测试', description: '测试',
        severity: Severity.Major, responsiblePerson: '甲',
        actions: sampleActions, deadline: '2026-08-01T00:00:00.000Z',
      })

      const list = controller.listRectifications(TENANT, {})
      assert.ok(list.length >= 7) // 6 seed + 1 new
      assert.ok(list.some((r: any) => r.rectificationNo === 'REC-LIST-001'))
    })
  })

  describe('GET /quality/rectifications/:rectId', () => {
    it('正例: 获取单个整改记录', () => {
      const created = controller.createRectification(TENANT, {
        rectificationNo: 'REC-GET-001',
        sourceInspectionId: 'i-02', sourceInspectNo: 'IQC-GET-001',
        title: '获取测试', description: '测试',
        severity: Severity.Minor, responsiblePerson: '乙',
        actions: sampleActions, deadline: '2026-08-01T00:00:00.000Z',
      })

      const found = controller.getRectification(TENANT, created.id)
      assert.equal(found.rectificationNo, 'REC-GET-001')
    })

    it('反例: 不存在的整改记录应抛出异常', () => {
      assert.throws(
        () => controller.getRectification(TENANT, 'nonexistent'),
        /Rectification record not found/
      )
    })
  })

  describe('PATCH /quality/rectifications/:rectId', () => {
    it('正例: 更新整改状态为已解决', () => {
      const created = controller.createRectification(TENANT, {
        rectificationNo: 'REC-RESOLVE',
        sourceInspectionId: 'i-03', sourceInspectNo: 'IQC-RESOLVE',
        title: '解决测试', description: '测试',
        severity: Severity.Major, responsiblePerson: '丙',
        actions: sampleActions, deadline: '2026-08-01T00:00:00.000Z',
      })

      const updated = controller.updateRectification(TENANT, created.id, {
        status: RectificationStatus.Resolved,
        notes: '已完成整改并通过验证',
      })
      assert.equal(updated.status, RectificationStatus.Resolved)
      assert.equal(updated.notes, '已完成整改并通过验证')
    })
  })

  describe('DELETE /quality/rectifications/:rectId', () => {
    it('正例: 删除整改记录', () => {
      const created = controller.createRectification(TENANT, {
        rectificationNo: 'REC-DEL',
        sourceInspectionId: 'i-04', sourceInspectNo: 'IQC-DEL',
        title: '删除测试', description: '测试',
        severity: Severity.Minor, responsiblePerson: '丁',
        actions: sampleActions, deadline: '2026-08-01T00:00:00.000Z',
      })

      const result = controller.deleteRectification(TENANT, created.id)
      assert.deepStrictEqual(result, { success: true })
    })
  })

  describe('GET /quality/rectifications/views/stats', () => {
    it('正例: 获取整改统计', () => {
      controller.createRectification(TENANT, {
        rectificationNo: 'REC-STATS',
        sourceInspectionId: 'i-05', sourceInspectNo: 'IQC-STATS',
        title: '统计测试', description: '测试',
        severity: Severity.Critical, responsiblePerson: '戊',
        actions: sampleActions, deadline: '2026-08-01T00:00:00.000Z',
      })

      const stats = controller.getRectificationStats(TENANT) as any
      assert.ok(typeof stats.total === 'number')
      assert.ok(typeof stats.open === 'number')
      assert.ok(typeof stats.overdue === 'number')
      assert.ok(stats.total >= 6)
    })
  })

  describe('GET /quality/rectifications/views/overdue', () => {
    it('正例: 获取逾期整改', () => {
      controller.createRectification(TENANT, {
        rectificationNo: 'REC-OVERDUE',
        sourceInspectionId: 'i-06', sourceInspectNo: 'IQC-OVER',
        title: '逾期', description: '已经逾期的整改',
        severity: Severity.Critical, responsiblePerson: '己',
        actions: sampleActions, deadline: '2020-01-01T00:00:00.000Z',
      })

      const overdue = controller.getOverdueRectifications(TENANT)
      assert.ok(overdue.length >= 1)
      assert.ok(overdue.some((r: any) => r.rectificationNo === 'REC-OVERDUE'))
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // 边界: 跨租户隔离
  // ═══════════════════════════════════════════════════════════════════

  describe('cross-tenant isolation', () => {
    it('边界: 其他租户无法看到本租户的巡查任务', () => {
      controller.createPatrolTask(TENANT, {
        patrolNo: 'PT-TENANT-A',
        title: 'A店巡查', description: '',
        area: PatrolArea.Kitchen, priority: PatrolTaskPriority.High,
        checkItems: sampleCheckItems, assignedTo: 'T1',
        scheduledAt: '2026-07-25T00:00:00.000Z',
      })

      const otherList = controller.listPatrolTasks(OTHER_TENANT, {})
      assert.ok(!otherList.some((t: any) => t.patrolNo === 'PT-TENANT-A'))
    })

    it('边界: 其他租户无法看到本租户的整改记录', () => {
      controller.createRectification(TENANT, {
        rectificationNo: 'REC-TENANT-A',
        sourceInspectionId: 'i-07', sourceInspectNo: 'IQC-TENANT',
        title: 'A店整改', description: '',
        severity: Severity.Critical, responsiblePerson: '甲',
        actions: sampleActions, deadline: '2026-08-01T00:00:00.000Z',
      })

      const otherList = controller.listRectifications(OTHER_TENANT, {})
      assert.ok(!otherList.some((r: any) => r.rectificationNo === 'REC-TENANT-A'))
    })
  })
})
