/**
 * logistics.service.test.ts — Logistics 服务单元深度测试
 *
 * 🐜 V17: thin-module-test-batch
 *
 * 覆盖:
 *   正例 × 10: 各业务路径完整闭环
 *   反例 × 5:  状态转换错误 / 参数缺失
 *   边界 × 2:  日期校验 / 空列表
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsService } from './logistics.service'

describe('LogisticsService (深度)', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  const T = { tenantId: 't-001', storeId: 'store-a' }

  // ── 正例 (10) ──────────────────────────────────────────────

  it('创建巡检任务 → 列出 → 按状态过滤', () => {
    service.createInspectionTask({
      ...T, equipmentId: 'e-1', equipmentName: '设备1',
      assigneeId: 'u-1', assigneeName: '王工', scheduledAt: '2026-07-15T10:00:00Z'
    })
    const all = service.listInspectionTasks(T.tenantId)
    expect(all).toHaveLength(1)
    const scheduled = service.listInspectionTasks(T.tenantId, { status: 'scheduled' })
    expect(scheduled).toHaveLength(1)
    const completed = service.listInspectionTasks(T.tenantId, { status: 'completed' })
    expect(completed).toHaveLength(0)
  })

  it('创建清洁排班 → 分配区域 → 签到 完整流程', () => {
    const schedule = service.createCleanSchedule({
      ...T, assigneeId: 'u-2', assigneeName: '李清洁',
      shiftName: '早班', shiftTime: '08:00-12:00', scheduledDate: '2026-07-15'
    })
    expect(schedule.status).toBe('scheduled')

    const assigned = service.assignCleanArea(schedule.id, T.tenantId, {
      areaCode: 'A01', areaName: '主厅'
    })
    expect(assigned.status).toBe('assigned')
    expect(assigned.areaCode).toBe('A01')

    const checkedIn = service.checkInCleanSchedule(schedule.id, T.tenantId, {
      cleanerId: 'u-2', cleanerName: '李清洁', note: '准时到岗'
    })
    expect(checkedIn.status).toBe('checked_in')
  })

  it('创建维修工单 → 指派 → 开始 → 完成 → 验收 完整闭环', () => {
    const order = service.createRepairOrder({
      ...T, equipmentId: 'e-2', equipmentName: '设备2',
      issueDescription: '屏幕闪烁', reporterId: 'u-1', reporterName: '王工'
    })
    expect(order.status).toBe('open')

    const assigned = service.assignRepairOrder(order.id, T.tenantId, {
      assigneeId: 'u-3', assigneeName: '赵维修'
    })
    expect(assigned.status).toBe('assigned')

    const started = service.startRepairOrder(order.id, T.tenantId)
    expect(started.status).toBe('in_progress')

    const completed = service.completeRepairOrder(order.id, T.tenantId, {
      completionNote: '已更换屏幕', technicianId: 'u-3', technicianName: '赵维修'
    })
    expect(completed.status).toBe('completed')

    const verified = service.verifyRepairOrder(order.id, T.tenantId, {
      verifierId: 'u-1', verifierName: '王工', note: '维修合格'
    })
    expect(verified.status).toBe('verified')
  })

  it('创建物资申请 → 审批 → 出库 完整流程', () => {
    const req = service.createMaterialRequest({
      ...T, requesterId: 'u-4', requesterName: '刘物资',
      purpose: '日常消耗品补充', department: '运营部',
      items: [{ itemId: 'item-1', itemName: '打印纸', category: '办公耗材', unit: '包', quantity: 10 }]
    })
    expect(req.status).toBe('pending_approval')

    const approved = service.approveMaterialRequest(req.id, T.tenantId, {
      approverId: 'u-5', approverName: '周经理', note: '同意采购'
    })
    expect(approved.status).toBe('approved')

    const outbound = service.outboundMaterialRequest(req.id, T.tenantId, {
      operatorId: 'u-6', operatorName: '仓储员'
    })
    expect(outbound.status).toBe('outbound')
  })

  it('sendInspectionReminder 应更新为 reminded', () => {
    const task = service.createInspectionTask({
      ...T, equipmentId: 'e-3', equipmentName: '设备3',
      assigneeId: 'u-1', assigneeName: '王工', scheduledAt: '2026-07-15T10:00:00Z'
    })
    const reminded = service.sendInspectionReminder(task.id, T.tenantId)
    expect(reminded.status).toBe('reminded')
    expect(reminded.reminderSentAt).toBeDefined()
  })

  it('sweepDueInspectionReminders 应扫描到期的任务', () => {
    service.createInspectionTask({
      ...T, equipmentId: 'e-4', equipmentName: '设备4',
      assigneeId: 'u-1', assigneeName: '王工', scheduledAt: '2026-01-01T00:00:00Z'
    })
    service.createInspectionTask({
      ...T, equipmentId: 'e-5', equipmentName: '设备5',
      assigneeId: 'u-2', assigneeName: '李工', scheduledAt: '2099-01-01T00:00:00Z'
    })
    const result = service.sweepDueInspectionReminders('2026-07-15T00:00:00Z')
    expect(result.scanned).toBe(1)
    expect(result.reminded).toBe(1)
  })

  it('getInspectionTask 返回正确任务副本', () => {
    const task = service.createInspectionTask({
      ...T, equipmentId: 'e-6', equipmentName: '设备6',
      assigneeId: 'u-1', assigneeName: '王工', scheduledAt: '2026-07-15T10:00:00Z'
    })
    const found = service.getInspectionTask(task.id, T.tenantId)
    expect(found).toBeDefined()
    expect(found!.equipmentName).toBe('设备6')
  })

  it('不同 tenant 数据隔离', () => {
    service.createInspectionTask({
      tenantId: 't-1', equipmentId: 'e-1', equipmentName: 'A',
      assigneeId: 'u-1', assigneeName: '王', scheduledAt: '2026-07-15T10:00:00Z'
    })
    service.createInspectionTask({
      tenantId: 't-2', equipmentId: 'e-2', equipmentName: 'B',
      assigneeId: 'u-2', assigneeName: '李', scheduledAt: '2026-07-15T10:00:00Z'
    })
    expect(service.listInspectionTasks('t-1')).toHaveLength(1)
    expect(service.listInspectionTasks('t-2')).toHaveLength(1)
  })

  it('物资申请多物品自动计算 totalQuantity', () => {
    const req = service.createMaterialRequest({
      ...T, requesterId: 'u-4', requesterName: '刘',
      purpose: '库存', department: '运营',
      items: [
        { itemId: 'a', itemName: 'A', category: 'cat', unit: '个', quantity: 3 },
        { itemId: 'b', itemName: 'B', category: 'cat', unit: '箱', quantity: 5 },
      ]
    })
    expect(req.totalQuantity).toBe(8)
  })

  // ── 反例 (5) ────────────────────────────────────────────────

  it('已完成的巡检任务不能再次完成', () => {
    const task = service.createInspectionTask({
      ...T, equipmentId: 'e-7', equipmentName: '设备7',
      assigneeId: 'u-1', assigneeName: '王工', scheduledAt: '2026-07-15T10:00:00Z'
    })
    service.recordInspectionResult(task.id, T.tenantId, {
      status: 'normal', note: '正常', inspectorId: 'u-1', inspectorName: '王工'
    })
    expect(() =>
      service.recordInspectionResult(task.id, T.tenantId, {
        status: 'fault', note: '重复', inspectorId: 'u-1', inspectorName: '王工'
      })
    ).toThrow('already completed')
  })

  it('维修工单不能从 open 跳到 completed', () => {
    const order = service.createRepairOrder({
      ...T, equipmentId: 'e-8', equipmentName: '设备8',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '王工'
    })
    expect(() =>
      service.completeRepairOrder(order.id, T.tenantId, {
        completionNote: '跳过', technicianId: 'u-3', technicianName: '赵'
      })
    ).toThrow('cannot complete from status open')
  })

  it('维修工单不能从 assigned 跳到 verified', () => {
    const order = service.createRepairOrder({
      ...T, equipmentId: 'e-9', equipmentName: '设备9',
      issueDescription: '异常', reporterId: 'u-1', reporterName: '王工'
    })
    service.assignRepairOrder(order.id, T.tenantId, {
      assigneeId: 'u-3', assigneeName: '赵'
    })
    expect(() =>
      service.verifyRepairOrder(order.id, T.tenantId, {
        verifierId: 'u-1', verifierName: '王工', note: '跳过'
      })
    ).toThrow('cannot verify from status assigned')
  })

  it('创建清洁排班缺少 shiftName 应报错', () => {
    expect(() =>
      service.createCleanSchedule({
        ...T, assigneeId: 'u-2', assigneeName: '李',
        shiftName: '', shiftTime: '08:00', scheduledDate: '2026-07-15'
      })
    ).toThrow('shiftName')
  })

  it('物资申请 items 为空应报错', () => {
    expect(() =>
      service.createMaterialRequest({
        ...T, requesterId: 'u-4', requesterName: '刘',
        purpose: '补充', items: []
      })
    ).toThrow('items are required')
  })

  // ── 边界 (2) ────────────────────────────────────────────────

  it('非法 scheduledAt 日期应报错', () => {
    expect(() =>
      service.createInspectionTask({
        ...T, equipmentId: 'e-10', equipmentName: '设备10',
        assigneeId: 'u-1', assigneeName: '王工', scheduledAt: 'invalid-date'
      })
    ).toThrow('valid datetime')
  })

  it('getInspectionTask 不存在的 id 返回 undefined', () => {
    const result = service.getInspectionTask('nonexistent-id', T.tenantId)
    expect(result).toBeUndefined()
  })
})
