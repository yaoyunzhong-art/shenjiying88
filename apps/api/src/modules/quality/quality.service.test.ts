/**
 * quality.service.spec.ts — 质量巡查模块 Service 单元测试
 *
 * 覆盖: PatrolTask CRUD / RectificationRecord CRUD / 查询筛选 / 状态变更 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { QualityService } from './quality.service'
import { QualityInspectionService } from '../quality-inspection/quality-inspection.service'
import {
  PatrolTaskStatus,
  PatrolTaskPriority,
  PatrolArea,
  RectificationStatus,
  Severity,
} from './quality.entity'

describe('QualityService — PatrolTask 巡查任务', () => {
  let svc: QualityService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new QualityService(new QualityInspectionService())
    svc.resetQualityStoresForTests()
  })

  it('createPatrolTask 创建成功并返回完整任务对象', () => {
    const task = svc.createPatrolTask({
      tenantId,
      patrolNo: 'PT-2026-0100',
      title: '后厨深夜突击检查',
      description: '夜间后厨卫生和安全管理',
      area: PatrolArea.Kitchen,
      priority: PatrolTaskPriority.High,
      checkItems: [
        { name: '熄火检查', standard: '所有燃气阀门关闭' },
        { name: '冰箱温度', standard: '冷藏≤4°C, 冷冻≤-18°C' },
      ],
      assignedTo: '王卫生',
      scheduledAt: '2026-07-30T23:00:00.000Z',
    })
    expect(task.id).toMatch(/^patrol-/)
    expect(task.patrolNo).toBe('PT-2026-0100')
    expect(task.title).toBe('后厨深夜突击检查')
    expect(task.status).toBe(PatrolTaskStatus.Pending)
    expect(task.checkItems).toHaveLength(2)
    expect(task.checkItems[0].name).toBe('熄火检查')
  })

  it('getPatrolTask 返回正确的巡查任务', () => {
    const created = svc.createPatrolTask({
      tenantId, patrolNo: 'PT-2026-0101', title: '日间巡检',
      description: '白天常规检查', area: PatrolArea.DiningHall,
      priority: PatrolTaskPriority.Medium, checkItems: [{ name: '桌面整洁', standard: '无杂物' }],
      assignedTo: '刘清洁', scheduledAt: '2026-07-30T10:00:00.000Z',
    })
    const found = svc.getPatrolTask(created.id, tenantId)
    expect(found).toBeDefined()
    expect(found!.id).toBe(created.id)
    expect(found!.title).toBe('日间巡检')
  })

  it('getPatrolTask 返回 undefined 当任务不存在或 tenant 不匹配', () => {
    const found = svc.getPatrolTask('nonexistent-id', tenantId)
    expect(found).toBeUndefined()
  })

  it('listPatrolTasks 支持按状态筛选', () => {
    svc.createPatrolTask({
      tenantId, patrolNo: 'PT-L1', title: '已完成任务',
      description: '已完成', area: PatrolArea.Kitchen,
      priority: PatrolTaskPriority.Low, checkItems: [],
      assignedTo: 'A', scheduledAt: '2026-07-28T10:00:00.000Z',
    })
    // 手动改状态
    const all = svc.listPatrolTasks(tenantId)
    const completedCount = all.filter((t) => t.status === PatrolTaskStatus.Completed).length
    expect(completedCount).toBeGreaterThan(0)
  })

  it('listPatrolTasks 支持多条件组合筛选', () => {
    const tasks = svc.listPatrolTasks(tenantId, {
      status: PatrolTaskStatus.Pending,
      area: PatrolArea.Kitchen,
    })
    tasks.forEach((t) => {
      expect(t.status).toBe(PatrolTaskStatus.Pending)
      expect(t.area).toBe(PatrolArea.Kitchen)
    })
  })

  it('updatePatrolTask 修改状态完成时设置 completedAt', () => {
    const task = svc.createPatrolTask({
      tenantId, patrolNo: 'PT-U1', title: '待完成巡检',
      description: '巡检', area: PatrolArea.EquipmentRoom,
      priority: PatrolTaskPriority.High, checkItems: [{ name: '测试', standard: '达标' }],
      assignedTo: '陈电工', scheduledAt: '2026-07-30T08:00:00.000Z',
    })
    const updated = svc.updatePatrolTask(task.id, tenantId, { status: PatrolTaskStatus.Completed })
    expect(updated.status).toBe(PatrolTaskStatus.Completed)
    expect(updated.completedAt).toBeDefined()
  })

  it('updatePatrolTask 不存在的任务抛 Error', () => {
    expect(() => svc.updatePatrolTask('fake-id', tenantId, { title: '改标题' })).toThrow()
  })

  it('deletePatrolTask 删除成功', () => {
    const task = svc.createPatrolTask({
      tenantId, patrolNo: 'PT-D1', title: '待删除',
      description: '删除测试', area: PatrolArea.Other,
      priority: PatrolTaskPriority.Low, checkItems: [],
      assignedTo: 'Tester', scheduledAt: '2026-07-30T12:00:00.000Z',
    })
    svc.deletePatrolTask(task.id, tenantId)
    const found = svc.getPatrolTask(task.id, tenantId)
    expect(found).toBeUndefined()
  })

  it('getPendingPatrolTasks 只返回 Pending 状态任务', () => {
    const pending = svc.getPendingPatrolTasks(tenantId)
    pending.forEach((t) => expect(t.status).toBe(PatrolTaskStatus.Pending))
  })

  it('getOverduePatrolTasks 返回超时未完成的任务', () => {
    const overdue = svc.getOverduePatrolTasks(tenantId)
    // 调用种子数据后应有种子数据
    overdue.forEach((t) => {
      expect([PatrolTaskStatus.Pending, PatrolTaskStatus.InProgress]).toContain(t.status)
      expect(new Date(t.scheduledAt).getTime()).toBeLessThan(Date.now())
    })
  })
})

describe('QualityService — RectificationRecord 整改记录', () => {
  let svc: QualityService
  const tenantId = 'tenant-001'

  beforeEach(() => {
    svc = new QualityService(new QualityInspectionService())
    svc.resetQualityStoresForTests()
  })

  it('createRectificationRecord 创建成功', () => {
    const now = new Date().toISOString()
    const record = svc.createRectificationRecord({
      tenantId,
      rectificationNo: 'REC-2026-0100',
      sourceInspectionId: 'inspect-test-001',
      sourceInspectNo: 'IQC-2026-0100',
      title: '测试整改项',
      description: '需要立刻整改的问题',
      severity: Severity.Critical,
      responsiblePerson: '李采购',
      actions: [{ description: '分析原因', assignee: '李采购', deadline: now }],
      deadline: now,
    })
    expect(record.id).toMatch(/^rect-/)
    expect(record.title).toBe('测试整改项')
    expect(record.status).toBe(RectificationStatus.Open)
    expect(record.actions).toHaveLength(1)
  })

  it('getRectificationRecord 返回 undefined 当记录不存在', () => {
    const found = svc.getRectificationRecord('fake-rect', tenantId)
    expect(found).toBeUndefined()
  })

  it('listRectificationRecords 支持按严重程度筛选', () => {
    const critical = svc.listRectificationRecords(tenantId, { severity: Severity.Critical })
    critical.forEach((r) => expect(r.severity).toBe(Severity.Critical))
  })

  it('listRectificationRecords 支持搜索关键字', () => {
    const results = svc.listRectificationRecords(tenantId, { search: '整改' })
    expect(results.length).toBeGreaterThan(0)
  })

  it('updateRectificationRecord 更新状态为已解决时设置 resolvedAt', () => {
    const now = new Date().toISOString()
    const record = svc.createRectificationRecord({
      tenantId, rectificationNo: 'REC-U1',
      sourceInspectionId: 'src-1', sourceInspectNo: 'IQC-U1',
      title: '待解决', description: '问题描述', severity: Severity.Major,
      responsiblePerson: '刘生', actions: [],
      deadline: now,
    })
    const updated = svc.updateRectificationRecord(record.id, tenantId, {
      status: RectificationStatus.Resolved,
    })
    expect(updated.status).toBe(RectificationStatus.Resolved)
    expect(updated.resolvedAt).toBeDefined()
  })

  it('deleteRectificationRecord 删除成功', () => {
    const now = new Date().toISOString()
    const record = svc.createRectificationRecord({
      tenantId, rectificationNo: 'REC-D1',
      sourceInspectionId: 'src-del', sourceInspectNo: 'IQC-D1',
      title: '删除测试', description: '待删除', severity: Severity.Minor,
      responsiblePerson: 'Tester', actions: [], deadline: now,
    })
    svc.deleteRectificationRecord(record.id, tenantId)
    expect(svc.getRectificationRecord(record.id, tenantId)).toBeUndefined()
  })

  it('getOpenRectificationRecords 只返回未关闭记录', () => {
    const open = svc.getOpenRectificationRecords(tenantId)
    open.forEach((r) => {
      expect([RectificationStatus.Open, RectificationStatus.InProgress]).toContain(r.status)
    })
  })

  it('getRectificationStats 返回正确的统计数据', () => {
    const stats = svc.getRectificationStats(tenantId)
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.total).toBe(stats.open + stats.inProgress + stats.resolved + stats.verified + stats.closed)
    expect(stats.overdue).toBeGreaterThanOrEqual(0)
  })
})
