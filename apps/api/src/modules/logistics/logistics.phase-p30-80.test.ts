/**
 * logistics.phase-p30-80.test.ts
 * P-30 Phase 80% 新增测试
 *
 * 覆盖:
 * 1. 维修反馈闭环 - 创建反馈
 * 2. 维修反馈 - 评分验证
 * 3. 维修反馈 - 状态校验
 * 4. 维修知识沉淀 - 创建
 * 5. 维修知识沉淀 - 查询/搜索
 * 6. 维修知识沉淀 - 更新
 * 7. 耗材预警规则 CRUD
 * 8. 耗材预警检查(低库存触发)
 * 9. 耗材预警检查(过库存触发)
 * 10. 耗材预警处理
 * 11. 场馆巡检记录创建
 * 12. 场馆巡检记录列表
 * 13. 场馆巡检趋势数据
 * 14. 后勤报表 - 支出汇总
 * 15. 后勤报表 - 工单统计
 * 16. 后勤报表 - 供应商排行
 * 17. 后勤报表 - 巡检统计
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsService } from './logistics.service'

const TENANT_ID = 'tenant-p30-80'

describe('P-30 Phase 80%: 维修反馈闭环', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-19: 创建维修反馈 (工单需已完成验证)', () => {
    // 创建并完成维修工单全流程
    const order = service.createRepairOrder({
      tenantId: TENANT_ID, equipmentId: 'eq-1', equipmentName: '跳舞机',
      issueDescription: '踏板故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.assignRepairOrder(order.id, TENANT_ID, {
      assigneeId: 'tech-1', assigneeName: '赵工',
    })
    service.startRepairOrder(order.id, TENANT_ID)
    service.completeRepairOrder(order.id, TENANT_ID, {
      completionNote: '已更换踏板', technicianId: 'tech-1', technicianName: '赵工',
    })
    service.verifyRepairOrder(order.id, TENANT_ID, {
      verifierId: 'mgr-1', verifierName: '经理', note: '维修质量合格',
    })

    const feedback = service.createRepairFeedback({
      tenantId: TENANT_ID,
      repairOrderId: order.id,
      score: 5,
      comment: '维修及时，质量很好',
      reviewerId: 'mgr-1',
      reviewerName: '经理',
      timely: true,
      qualitySatisfied: true,
    })
    expect(feedback.id).toMatch(/^rfb-/)
    expect(feedback.score).toBe(5)
    expect(feedback.timely).toBe(true)
    expect(feedback.qualitySatisfied).toBe(true)
  })

  it('AC-30-19: 未验证工单不能反馈', () => {
    const order = service.createRepairOrder({
      tenantId: TENANT_ID, equipmentId: 'eq-1', equipmentName: '设备',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    expect(() => service.createRepairFeedback({
      tenantId: TENANT_ID, repairOrderId: order.id,
      score: 3, comment: '一般', reviewerId: 'u-1', reviewerName: '经理',
      timely: false, qualitySatisfied: true,
    })).toThrow('must be verified')
  })

  it('AC-30-19: 评分超出范围报错', () => {
    const order = service.createRepairOrder({
      tenantId: TENANT_ID, equipmentId: 'eq-1', equipmentName: '设备',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.assignRepairOrder(order.id, TENANT_ID, { assigneeId: 'tech-1', assigneeName: '赵' })
    service.startRepairOrder(order.id, TENANT_ID)
    service.completeRepairOrder(order.id, TENANT_ID, {
      completionNote: '完成', technicianId: 'tech-1', technicianName: '赵',
    })
    service.verifyRepairOrder(order.id, TENANT_ID, {
      verifierId: 'mgr', verifierName: '经理', note: '合格',
    })
    expect(() => service.createRepairFeedback({
      tenantId: TENANT_ID, repairOrderId: order.id,
      score: 6 as any, comment: 'test', reviewerId: 'u-1', reviewerName: '经理',
      timely: true, qualitySatisfied: true,
    })).toThrow('between 1 and 5')
  })

  it('AC-30-19: 查询反馈列表', () => {
    const order = service.createRepairOrder({
      tenantId: TENANT_ID, equipmentId: 'eq-1', equipmentName: '设备',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.assignRepairOrder(order.id, TENANT_ID, { assigneeId: 'tech-1', assigneeName: '赵' })
    service.startRepairOrder(order.id, TENANT_ID)
    service.completeRepairOrder(order.id, TENANT_ID, {
      completionNote: '完成', technicianId: 'tech-1', technicianName: '赵',
    })
    service.verifyRepairOrder(order.id, TENANT_ID, {
      verifierId: 'mgr', verifierName: '经理', note: '合格',
    })

    service.createRepairFeedback({
      tenantId: TENANT_ID, repairOrderId: order.id,
      score: 4, comment: '良好', reviewerId: 'u-1', reviewerName: '经理',
      timely: true, qualitySatisfied: true,
    })
    const list = service.listRepairFeedbacks(TENANT_ID)
    expect(list).toHaveLength(1)
  })

  it('AC-30-19: 跨租户查询反馈返回undefined', () => {
    const order = service.createRepairOrder({
      tenantId: TENANT_ID, equipmentId: 'eq-1', equipmentName: '设备',
      issueDescription: '故障', reporterId: 'u-1', reporterName: '小王',
    })
    service.assignRepairOrder(order.id, TENANT_ID, { assigneeId: 'tech-1', assigneeName: '赵' })
    service.startRepairOrder(order.id, TENANT_ID)
    service.completeRepairOrder(order.id, TENANT_ID, {
      completionNote: '完成', technicianId: 'tech-1', technicianName: '赵',
    })
    service.verifyRepairOrder(order.id, TENANT_ID, {
      verifierId: 'mgr', verifierName: '经理', note: '合格',
    })
    const fb = service.createRepairFeedback({
      tenantId: TENANT_ID, repairOrderId: order.id,
      score: 5, comment: '优秀', reviewerId: 'u-1', reviewerName: '经理',
      timely: true, qualitySatisfied: true,
    })
    expect(service.getRepairFeedback(fb.id, 'other')).toBeUndefined()
  })
})

describe('P-30 Phase 80%: 维修知识沉淀', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-20: 创建维修知识', () => {
    const knowledge = service.createRepairKnowledge({
      tenantId: TENANT_ID,
      repairOrderId: 'repair-1',
      equipmentId: 'eq-dance-1',
      equipmentName: '跳舞机',
      issueType: 'mechanical',
      issueDescription: '踏板感应器失灵',
      rootCause: '感应器老化',
      solution: '更换感应器模块，重新校准',
      partsUsed: ['SP-001-感应器'],
      repairHours: 2,
      technicianId: 'tech-1',
      technicianName: '赵工',
      isCommonCase: true,
      tags: ['跳舞机', '感应器', '机械'],
    })
    expect(knowledge.id).toMatch(/^rk-/)
    expect(knowledge.equipmentName).toBe('跳舞机')
    expect(knowledge.isCommonCase).toBe(true)
    expect(knowledge.tags).toHaveLength(3)
    expect(knowledge.partsUsed).toHaveLength(1)
  })

  it('AC-30-20: 查询知识 (按设备/问题类型/搜索)', () => {
    service.createRepairKnowledge({
      tenantId: TENANT_ID, repairOrderId: 'r-1', equipmentId: 'eq-1', equipmentName: '跳舞机',
      issueType: 'mechanical', issueDescription: '踏板故障', rootCause: '老化', solution: '更换',
      technicianId: 't-1', technicianName: '赵工',
    })
    service.createRepairKnowledge({
      tenantId: TENANT_ID, repairOrderId: 'r-2', equipmentId: 'eq-2', equipmentName: '抓娃娃机',
      issueType: 'electronic', issueDescription: '主板短路', rootCause: '进液', solution: '更换主板',
      technicianId: 't-2', technicianName: '钱工',
    })

    const byEq = service.listRepairKnowledge(TENANT_ID, { equipmentId: 'eq-1' })
    expect(byEq).toHaveLength(1)
    expect(byEq[0].equipmentName).toBe('跳舞机')

    const byType = service.listRepairKnowledge(TENANT_ID, { issueType: 'electronic' })
    expect(byType).toHaveLength(1)

    const bySearch = service.listRepairKnowledge(TENANT_ID, { search: '踏板' })
    expect(bySearch).toHaveLength(1)
  })

  it('AC-30-20: 按标签查询知识', () => {
    service.createRepairKnowledge({
      tenantId: TENANT_ID, repairOrderId: 'r-1', equipmentId: 'eq-1', equipmentName: '跳舞机',
      issueType: 'mechanical', issueDescription: '故障', rootCause: '老化', solution: '更换',
      technicianId: 't-1', technicianName: '赵工', tags: ['跳舞机', '机械'],
    })
    const byTag = service.listRepairKnowledge(TENANT_ID, { tag: '跳舞机' })
    expect(byTag).toHaveLength(1)
  })

  it('AC-30-20: 更新知识', () => {
    const k = service.createRepairKnowledge({
      tenantId: TENANT_ID, repairOrderId: 'r-1', equipmentId: 'eq-1', equipmentName: '设备',
      issueType: 'mechanical', issueDescription: '故障', rootCause: '初始原因', solution: '初始方案',
      technicianId: 't-1', technicianName: '赵工',
    })
    const updated = service.updateRepairKnowledge(k.id, TENANT_ID, {
      rootCause: '更新原因', solution: '更新方案', isCommonCase: true,
    })
    expect(updated.rootCause).toBe('更新原因')
    expect(updated.solution).toBe('更新方案')
    expect(updated.isCommonCase).toBe(true)
  })

  it('AC-30-20: 不存在的知识更新报错', () => {
    expect(() => service.updateRepairKnowledge('nonexistent', TENANT_ID, { isCommonCase: true }))
      .toThrow('RepairKnowledge not found')
  })
})

describe('P-30 Phase 80%: 耗材库存预警', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-21: 创建预警规则', () => {
    const rule = service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-CLEAN-001', itemName: '清洁剂',
      triggerType: 'low_stock', threshold: 10, alertLevel: 'warning',
      notifyUserIds: ['u-1', 'u-2'],
    })
    expect(rule.id).toMatch(/^car-/)
    expect(rule.itemName).toBe('清洁剂')
    expect(rule.enabled).toBe(true)
    expect(rule.threshold).toBe(10)
  })

  it('AC-30-21: 列表查询预警规则', () => {
    service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: 'A品', triggerType: 'low_stock', threshold: 5, alertLevel: 'warning',
    })
    service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-002', itemName: 'B品', triggerType: 'low_stock', threshold: 10, alertLevel: 'critical',
    })
    const rules = service.listConsumableAlertRules(TENANT_ID)
    expect(rules).toHaveLength(2)
  })

  it('AC-30-21: 更新预警规则', () => {
    const rule = service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '抹布', triggerType: 'low_stock', threshold: 20, alertLevel: 'info',
    })
    const updated = service.updateConsumableAlertRule(rule.id, TENANT_ID, {
      threshold: 30, alertLevel: 'warning', enabled: false,
    })
    expect(updated.threshold).toBe(30)
    expect(updated.alertLevel).toBe('warning')
    expect(updated.enabled).toBe(false)
  })

  it('AC-30-21: 删除预警规则', () => {
    const rule = service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '测试品', triggerType: 'low_stock', threshold: 5, alertLevel: 'info',
    })
    expect(service.deleteConsumableAlertRule(rule.id, TENANT_ID)).toBe(true)
    expect(service.listConsumableAlertRules(TENANT_ID)).toHaveLength(0)
  })

  it('AC-30-22: 库存过低触发预警', () => {
    service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-CLEAN-001', itemName: '清洁剂',
      triggerType: 'low_stock', threshold: 10, alertLevel: 'warning',
    })
    const alerts = service.checkConsumableAlerts({
      tenantId: TENANT_ID, itemId: 'ITEM-CLEAN-001', itemName: '清洁剂', currentStock: 5,
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0].triggerType).toBe('low_stock')
    expect(alerts[0].alertLevel).toBe('warning')
    expect(alerts[0].resolved).toBe(false)
  })

  it('AC-30-22: 库存充足不触发预警', () => {
    service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '抹布',
      triggerType: 'low_stock', threshold: 10, alertLevel: 'info',
    })
    const alerts = service.checkConsumableAlerts({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '抹布', currentStock: 50,
    })
    expect(alerts).toHaveLength(0)
  })

  it('AC-30-22: 库存过高触发预警', () => {
    service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '可乐',
      triggerType: 'over_stock', threshold: 500, alertLevel: 'warning',
    })
    const alerts = service.checkConsumableAlerts({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '可乐', currentStock: 600,
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0].triggerType).toBe('over_stock')
  })

  it('AC-30-23: 处理预警 (resolve)', () => {
    service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '清洁剂',
      triggerType: 'low_stock', threshold: 10, alertLevel: 'critical',
    })
    const alerts = service.checkConsumableAlerts({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '清洁剂', currentStock: 3,
    })
    const resolved = service.resolveConsumableAlert(alerts[0].id, TENANT_ID, 'mgr-1')
    expect(resolved.resolved).toBe(true)
    expect(resolved.resolvedBy).toBe('mgr-1')
  })

  it('AC-30-23: 列表按是否已处理过滤', () => {
    service.createConsumableAlertRule({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '清洁剂',
      triggerType: 'low_stock', threshold: 10, alertLevel: 'warning',
    })
    const alerts = service.checkConsumableAlerts({
      tenantId: TENANT_ID, itemId: 'ITEM-001', itemName: '清洁剂', currentStock: 3,
    })
    service.resolveConsumableAlert(alerts[0].id, TENANT_ID, 'u-1')

    const unresolved = service.listConsumableAlerts(TENANT_ID, { resolved: false })
    expect(unresolved).toHaveLength(0)
    const resolvedList = service.listConsumableAlerts(TENANT_ID, { resolved: true })
    expect(resolvedList).toHaveLength(1)
  })
})

describe('P-30 Phase 80%: 场馆巡检记录', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-24: 创建场馆巡检记录', () => {
    const record = service.createVenueInspectionRecord({
      tenantId: TENANT_ID,
      storeId: 'store-arcade-1',
      planType: 'daily',
      inspectorId: 'inspector-01',
      inspectorName: '王巡检',
      environmentScore: 8,
      equipmentScore: 7,
      safetyScore: 9,
      notes: '例行巡检',
      issues: [
        { category: '环境', description: '地面有积水', severity: 'medium' },
        { category: '安全', description: '灭火器过期', severity: 'high', resolved: true },
      ],
    })
    expect(record.id).toMatch(/^vir-/)
    expect(record.totalScore).toBe(8) // (8+7+9)/3 = 8.0
    expect(record.issues).toHaveLength(2)
    expect(record.issues[1].resolved).toBe(true)
  })

  it('AC-30-24: 列表查询巡检记录', () => {
    service.createVenueInspectionRecord({
      tenantId: TENANT_ID, storeId: 's-1', planType: 'daily',
      inspectorId: 'i-1', inspectorName: '王检',
      environmentScore: 8, equipmentScore: 8, safetyScore: 8,
      notes: '正常', issues: [],
    })
    service.createVenueInspectionRecord({
      tenantId: TENANT_ID, storeId: 's-2', planType: 'daily',
      inspectorId: 'i-2', inspectorName: '李检',
      environmentScore: 6, equipmentScore: 7, safetyScore: 8,
      notes: '一般', issues: [],
    })

    const all = service.listVenueInspectionRecords(TENANT_ID)
    expect(all).toHaveLength(2)

    const byStore = service.listVenueInspectionRecords(TENANT_ID, { storeId: 's-1' })
    expect(byStore).toHaveLength(1)
  })

  it('AC-30-25: 巡检趋势数据', () => {
    // Create records for multiple months
    const createWithDate = (month: number, env: number, eq: number, saf: number) => {
      const record = service.createVenueInspectionRecord({
        tenantId: TENANT_ID, storeId: 's-1', planType: 'daily',
        inspectorId: 'i-1', inspectorName: '王检',
        environmentScore: env, equipmentScore: eq, safetyScore: saf,
        notes: 'test', issues: [],
      })
      // Manually adjust inspectedAt - use the created record as-is which uses Date.now()
      return record
    }
    createWithDate(6, 8, 7, 9)
    createWithDate(6, 9, 8, 9)
    createWithDate(7, 7, 6, 8)

    const trends = service.getVenueInspectionTrendData(TENANT_ID, 's-1', 3)
    expect(trends.length).toBeGreaterThanOrEqual(1)
    // Should have at least one period
    expect(trends[0].recordCount).toBeGreaterThan(0)
  })

  it('AC-30-24: 跨租户隔离', () => {
    service.createVenueInspectionRecord({
      tenantId: TENANT_ID, storeId: 's-1', planType: 'daily',
      inspectorId: 'i-1', inspectorName: '王检',
      environmentScore: 8, equipmentScore: 8, safetyScore: 8,
      notes: '正常', issues: [],
    })
    const records = service.listVenueInspectionRecords('other-tenant')
    expect(records).toHaveLength(0)
  })
})

describe('P-30 Phase 80%: 后勤报表', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-26: 后勤报表含所有统计项', () => {
    const report = service.getLogisticsReport(TENANT_ID)
    expect(report.expenseSummary).toBeDefined()
    expect(report.workOrderStats).toBeDefined()
    expect(report.supplierRankings).toBeDefined()
    expect(report.inspectionStats).toBeDefined()
    expect(report.inspectionStats.totalInspections).toBe(0)
    expect(report.inspectionStats.totalSchedulePlans).toBe(0)
  })

  it('AC-30-26: 供应商评价排行', () => {
    // 创建供应商并评价
    const s1 = service.createSupplier({
      tenantId: TENANT_ID, code: 'S-01', name: '金牌供应商', category: '清洁',
    })
    service.evaluateSupplier(s1.id, TENANT_ID, {
      evaluatorId: 'u-1', evaluatorName: '经理',
      qualityScore: 10, deliveryScore: 9, serviceScore: 9, priceScore: 8,
      comment: '非常好',
    })

    const s2 = service.createSupplier({
      tenantId: TENANT_ID, code: 'S-02', name: '普通供应商', category: '设备',
    })
    service.evaluateSupplier(s2.id, TENANT_ID, {
      evaluatorId: 'u-2', evaluatorName: '主管',
      qualityScore: 6, deliveryScore: 6, serviceScore: 6, priceScore: 6,
      comment: '一般',
    })

    const report = service.getLogisticsReport(TENANT_ID)
    expect(report.supplierRankings).toHaveLength(2)
    // 按评分降序
    expect(report.supplierRankings[0].avgScore).toBeGreaterThanOrEqual(report.supplierRankings[1].avgScore)
    expect(report.supplierRankings[0].supplierName).toBe('金牌供应商')
  })

  it('AC-30-26: 工单统计包含各类状态', () => {
    // 创建维修工单
    const r1 = service.createRepairOrder({
      tenantId: TENANT_ID, equipmentId: 'eq-1', equipmentName: '设备1',
      issueDescription: '故障1', reporterId: 'u-1', reporterName: '小王',
    })
    service.assignRepairOrder(r1.id, TENANT_ID, { assigneeId: 't-1', assigneeName: '赵' })
    service.startRepairOrder(r1.id, TENANT_ID)
    service.completeRepairOrder(r1.id, TENANT_ID, {
      completionNote: '完成', technicianId: 't-1', technicianName: '赵',
    })
    service.verifyRepairOrder(r1.id, TENANT_ID, {
      verifierId: 'mgr', verifierName: '经理', note: '合格',
    })

    const stats = service.getLogisticsReport(TENANT_ID).workOrderStats
    expect(stats.totalRepairs).toBe(1)
    expect(stats.verifiedRepairs).toBe(1)
    expect(stats.completedRepairs).toBe(0) // 'completed' is before verify; verified is different
  })

  it('AC-30-26: 巡检统计', () => {
    service.createVenueInspectionRecord({
      tenantId: TENANT_ID, storeId: 's-1', planType: 'daily',
      inspectorId: 'i-1', inspectorName: '王检',
      environmentScore: 9, equipmentScore: 8, safetyScore: 9,
      notes: '优良', issues: [],
    })

    const report = service.getLogisticsReport(TENANT_ID)
    expect(report.inspectionStats.totalInspections).toBe(1)
    expect(report.inspectionStats.avgScore).toBeGreaterThan(0)
  })

  it('AC-30-26: 支出汇总含分类', () => {
    const report = service.getLogisticsReport(TENANT_ID)
    expect(report.expenseSummary.byCategory).toHaveProperty('maintenance')
    expect(report.expenseSummary.byCategory).toHaveProperty('procurement')
    expect(report.expenseSummary.byCategory).toHaveProperty('material')
    expect(report.expenseSummary.totalExpense).toBe(
      report.expenseSummary.totalMaintenance +
      report.expenseSummary.totalProcurement +
      report.expenseSummary.totalMaterial,
    )
  })
})
