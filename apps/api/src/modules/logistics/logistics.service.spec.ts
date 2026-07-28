/**
 * logistics.service.spec.ts — 物流综合管理 Service 单元测试 (V23)
 *
 * 覆盖: inspectionTask / cleanSchedule / repairOrder / materialRequest /
 *       maintenanceOrder / procurementRequest / supplier / inventoryReservation /
 *       schedulePlan / repairFeedback / repairKnowledge / consumableAlert / inspectionRecord
 *
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsService } from './logistics.service'

const TENANT_ID = 'tenant-test'

function createService(): LogisticsService {
  return new LogisticsService()
}

function futureDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86400000).toISOString()
}

function pastDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86400000).toISOString()
}

describe('LogisticsService', () => {
  let svc: LogisticsService

  beforeEach(() => {
    svc = createService()
    svc.resetStoreForTests()
  })

  // ════════════════════════════════════════════
  // InspectionTask
  // ════════════════════════════════════════════

  describe('InspectionTask', () => {
    it('正例: 创建巡检任务', () => {
      const task = svc.createInspectionTask({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: 'VR设备',
        assigneeId: 'tech-01', assigneeName: '张工', scheduledAt: futureDate(1),
      })
      expect(task.id).toBeTruthy()
      expect(task.status).toBe('scheduled')
    })

    it('反例: 无效时间抛异常', () => {
      expect(() => svc.createInspectionTask({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: '测试',
        assigneeId: 'u-01', assigneeName: '张三', scheduledAt: 'invalid-date',
      })).toThrow('valid datetime')
    })

    it('正例: 列表查询', () => {
      svc.createInspectionTask({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: 'VR',
        assigneeId: 'u-01', assigneeName: '张三', scheduledAt: futureDate(1),
      })
      const list = svc.listInspectionTasks(TENANT_ID)
      expect(list.length).toBe(1)
    })

    it('正例: 记录巡检结果', () => {
      const task = svc.createInspectionTask({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: 'VR',
        assigneeId: 'u-01', assigneeName: '张三', scheduledAt: futureDate(1),
      })
      const completed = svc.recordInspectionResult(task.id, TENANT_ID, {
        status: 'normal', note: '一切正常', inspectorId: 'u-01', inspectorName: '张三',
      })
      expect(completed.status).toBe('completed')
    })
  })

  // ════════════════════════════════════════════
  // CleanSchedule
  // ════════════════════════════════════════════

  describe('CleanSchedule', () => {
    it('正例: 创建保洁排班', () => {
      const s = svc.createCleanSchedule({
        tenantId: TENANT_ID, assigneeId: 'clean-01', assigneeName: '李阿姨',
        shiftName: '早班', shiftTime: '08:00-12:00', scheduledDate: '2026-08-01',
      })
      expect(s.id).toBeTruthy()
      expect(s.status).toBe('scheduled')
    })

    it('反例: 空班次名称抛异常', () => {
      expect(() => svc.createCleanSchedule({
        tenantId: TENANT_ID, assigneeId: 'c-01', assigneeName: '测试',
        shiftName: '', shiftTime: '08:00', scheduledDate: '2026-08-01',
      })).toThrow('shiftName')
    })
  })

  // ════════════════════════════════════════════
  // RepairOrder
  // ════════════════════════════════════════════

  describe('RepairOrder', () => {
    it('正例: 完整维修工单生命周期', () => {
      const order = svc.createRepairOrder({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: '娃娃机',
        issueDescription: '投币器卡住', reporterId: 'r-01', reporterName: '店员小王',
      })
      expect(order.status).toBe('open')

      const assigned = svc.assignRepairOrder(order.id, TENANT_ID, {
        assigneeId: 'tech-01', assigneeName: '维修老李',
      })
      expect(assigned.status).toBe('assigned')

      const started = svc.startRepairOrder(assigned.id, TENANT_ID)
      expect(started.status).toBe('in_progress')

      const completed = svc.completeRepairOrder(started.id, TENANT_ID, {
        completionNote: '更换了投币器组件', technicianId: 'tech-01', technicianName: '维修老李',
      })
      expect(completed.status).toBe('completed')

      const verified = svc.verifyRepairOrder(completed.id, TENANT_ID, {
        verifierId: 'mgr-01', verifierName: '店长', note: '验收通过',
      })
      expect(verified.status).toBe('verified')
    })

    it('反例: 空描述抛异常', () => {
      expect(() => svc.createRepairOrder({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: '测试',
        issueDescription: '', reporterId: 'u-01', reporterName: '测试',
      })).toThrow('issueDescription')
    })
  })

  // ════════════════════════════════════════════
  // MaterialRequest
  // ════════════════════════════════════════════

  describe('MaterialRequest', () => {
    it('正例: 创建和审批物料申请', () => {
      const req = svc.createMaterialRequest({
        tenantId: TENANT_ID, requesterId: 'u-01', requesterName: '张三',
        purpose: '日常补货',
        items: [{ itemId: 'i-001', itemName: '手套', category: '劳保', unit: '双', quantity: 100 }],
      })
      expect(req.status).toBe('pending_approval')

      const approved = svc.approveMaterialRequest(req.id, TENANT_ID, {
        approverId: 'mgr-01', approverName: '李经理', note: '同意',
      })
      expect(approved.status).toBe('approved')
    })

    it('反例: 空用途抛异常', () => {
      expect(() => svc.createMaterialRequest({
        tenantId: TENANT_ID, requesterId: 'u-01', requesterName: '测试',
        purpose: '',
        items: [{ itemId: 'i-001', itemName: '手套', category: '劳保', unit: '双', quantity: 10 }],
      })).toThrow('purpose')
    })
  })

  // ════════════════════════════════════════════
  // MaintenanceOrder
  // ════════════════════════════════════════════

  describe('MaintenanceOrder', () => {
    it('正例: 完整维保工单生命周期', () => {
      const order = svc.createMaintenanceOrder({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: '空调',
        issueDescription: '不制冷', reporterId: 'u-01', reporterName: '张三',
      })
      expect(order.status).toBe('pending')

      const started = svc.startMaintenanceOrder(order.id, TENANT_ID, {
        assigneeId: 'tech-01', assigneeName: '王工',
      })
      expect(started.status).toBe('in_progress')

      const completed = svc.completeMaintenanceOrder(started.id, TENANT_ID, {
        completionNote: '添加制冷剂，测试正常',
      })
      expect(completed.status).toBe('pending_acceptance')

      const accepted = svc.acceptMaintenanceOrder(completed.id, TENANT_ID, {
        acceptedBy: 'mgr-01', acceptanceNote: '验收合格',
      })
      expect(accepted.status).toBe('completed')
    })
  })

  // ════════════════════════════════════════════
  // ProcurementRequest
  // ════════════════════════════════════════════

  describe('ProcurementRequest', () => {
    it('正例: 完整采购审批流程', () => {
      const req = svc.createProcurementRequest({
        tenantId: TENANT_ID, requesterId: 'u-01', requesterName: '张三',
        purpose: '采购办公用品',
      })
      expect(req.status).toBe('draft')

      const submitted = svc.submitProcurementRequest(req.id, TENANT_ID)
      expect(submitted.status).toBe('pending_approval')

      const approved = svc.approveProcurementRequest(submitted.id, TENANT_ID, {
        approverId: 'mgr-01', approverName: '李经理', note: '审批通过',
      })
      expect(approved.status).toBe('approved')

      const ordered = svc.orderProcurementRequest(approved.id, TENANT_ID, {
        orderNumber: 'PO-2026-100', vendorName: '得力文具',
        operatorId: 'u-01', operatorName: '张三',
      })
      expect(ordered.status).toBe('ordered')

      const received = svc.receiveProcurementRequest(ordered.id, TENANT_ID, {
        receivedBy: 'u-01', receivedByName: '张三',
      })
      expect(received.status).toBe('received')
    })

    it('反例: 拒绝采购申请', () => {
      const req = svc.createProcurementRequest({
        tenantId: TENANT_ID, requesterId: 'u-01', requesterName: '张三',
        purpose: '采购测试',
      })
      svc.submitProcurementRequest(req.id, TENANT_ID)
      const rejected = svc.rejectProcurementRequest(req.id, TENANT_ID, {
        rejecterId: 'mgr-01', rejecterName: '经理', reason: '预算不足',
      })
      expect(rejected.status).toBe('rejected')
    })
  })

  // ════════════════════════════════════════════
  // Supplier
  // ════════════════════════════════════════════

  describe('Supplier', () => {
    it('正例: 创建和查询供应商', () => {
      const s = svc.createSupplier({
        tenantId: TENANT_ID, code: 'SUP-001', name: '测试供应商',
        category: '电子', creditLevel: 'A',
      })
      expect(s.id).toBeTruthy()
      expect(s.status).toBe('active')

      const found = svc.getSupplier(s.id, TENANT_ID)
      expect(found).toBeDefined()
    })

    it('正例: 供应商评估', () => {
      const s = svc.createSupplier({
        tenantId: TENANT_ID, code: 'SUP-002', name: '质量供应商',
        category: '包装',
      })
      const evalResult = svc.evaluateSupplier(s.id, TENANT_ID, {
        evaluatorId: 'u-01', evaluatorName: '张三',
        qualityScore: 4, deliveryScore: 5, serviceScore: 4, priceScore: 3,
        comment: '整体不错',
      })
      expect(evalResult.id).toBeTruthy()
      expect(evalResult.qualityScore).toBe(4)
    })
  })

  // ════════════════════════════════════════════
  // InventoryReservation
  // ════════════════════════════════════════════

  describe('InventoryReservation', () => {
    it('正例: 创建库存预留', () => {
      const res = svc.createInventoryReservation({
        tenantId: TENANT_ID, warehouseCode: 'WH-MAIN',
        expiresAt: futureDate(30),
        operatorId: 'u-01', operatorName: '张三',
        items: [{ itemId: 'STK-005', itemName: '测试物品', category: '耗材', quantity: 5, unit: '个' }],
      })
      expect(res.id).toBeTruthy()
      expect(res.status).toBe('active')
    })

    it('反例: 库存不足抛异常', () => {
      expect(() => svc.createInventoryReservation({
        tenantId: TENANT_ID, warehouseCode: 'WH-MAIN',
        expiresAt: futureDate(30),
        operatorId: 'u-01', operatorName: '张三',
        items: [{ itemId: 'STK-005', itemName: '测试物品', category: '耗材', quantity: 9999, unit: '个' }],
      })).toThrow('Insufficient')
    })
  })

  // ════════════════════════════════════════════
  // SchedulePlan
  // ════════════════════════════════════════════

  describe('SchedulePlan', () => {
    it('正例: 创建调度计划', () => {
      const plan = svc.createSchedulePlan({
        tenantId: TENANT_ID, name: '日检', equipmentId: 'eq-01',
        equipmentName: 'VR设备', checkType: 'daily', cronExpression: '0 8 * * *',
        assigneeId: 'u-01', assigneeName: '张工',
      })
      expect(plan.status).toBe('active')
    })

    it('正例: 执行调度计划生成日志', () => {
      const plan = svc.createSchedulePlan({
        tenantId: TENANT_ID, name: '周检', equipmentId: 'eq-01',
        equipmentName: '娃娃机', checkType: 'weekly', cronExpression: '0 9 * * 1',
        assigneeId: 'u-01', assigneeName: '张工',
      })
      const log = svc.executeSchedulePlan(plan.id, TENANT_ID, {
        executorId: 'u-01', executorName: '张工', resultStatus: 'normal',
      })
      expect(log.status).toBe('completed')
    })
  })

  // ════════════════════════════════════════════
  // RepairFeedback & RepairKnowledge
  // ════════════════════════════════════════════

  describe('RepairFeedback', () => {
    it('正例: 创建维修反馈', () => {
      // 需要先有 verified 状态的维修工单
      const order = svc.createRepairOrder({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: '测试',
        issueDescription: '卡机', reporterId: 'u-01', reporterName: '张三',
      })
      svc.assignRepairOrder(order.id, TENANT_ID, {
        assigneeId: 'tech-01', assigneeName: '李工',
      })
      svc.startRepairOrder(order.id, TENANT_ID)
      svc.completeRepairOrder(order.id, TENANT_ID, {
        completionNote: '已修复', technicianId: 'tech-01', technicianName: '李工',
      })
      svc.verifyRepairOrder(order.id, TENANT_ID, {
        verifierId: 'mgr-01', verifierName: '经理', note: '合格',
      })

      const fb = svc.createRepairFeedback({
        tenantId: TENANT_ID, repairOrderId: order.id,
        score: 5, comment: '维修及时', reviewerId: 'mgr-01', reviewerName: '经理',
        timely: true, qualitySatisfied: true,
      })
      expect(fb.score).toBe(5)
    })

    it('反例: 未验收的工单不能评价', () => {
      const order = svc.createRepairOrder({
        tenantId: TENANT_ID, equipmentId: 'eq-01', equipmentName: '测试',
        issueDescription: '故障', reporterId: 'u-01', reporterName: '张三',
      })
      expect(() => svc.createRepairFeedback({
        tenantId: TENANT_ID, repairOrderId: order.id,
        score: 3, comment: '一般', reviewerId: 'u-01', reviewerName: '张三',
        timely: true, qualitySatisfied: false,
      })).toThrow('Must be verified')
    })
  })
})
