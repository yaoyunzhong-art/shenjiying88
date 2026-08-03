/**
 * logistics.phase60.test.ts
 * P-30 Phase 60% 新增测试
 *
 * 覆盖:
 * 1. 供应商管理 CRUD
 * 2. 供应商联系人
 * 3. 供应商合同管理
 * 4. 供应商评价
 * 5. 供应商评价平均分计算
 * 6. 供应商统计
 * 7. 库存预留 - 创建/查询/取消/完成
 * 8. 库存可用量检查
 * 9. 设备巡检定时调度 (SchedulePlan) CRUD
 * 10. 调度计划执行与日志
 * 11. 定时调度 sweep
 * 12. 定时调度 nextRun 计算
 * 13. 定时调度统计
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsService } from './logistics.service'

const TENANT_ID = 'tenant-p30-60'

describe('P-30 Phase 60%: 供应商管理', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-07: 创建供应商 (默认活跃)', () => {
    const s = service.createSupplier({
      tenantId: TENANT_ID, code: 'SUPP-001', name: '清洁用品供应商', category: '清洁耗材',
      mainProducts: ['清洁剂', '抹布', '手套'],
    })
    expect(s.id).toMatch(/^supp-/)
    expect(s.name).toBe('清洁用品供应商')
    expect(s.status).toBe('active')
    expect(s.creditLevel).toBe('B')
    expect(s.mainProducts).toHaveLength(3)
    expect(s.averageScore).toBe(0)
  })

  it('AC-30-07: 创建供应商 (指定信用等级)', () => {
    const s = service.createSupplier({
      tenantId: TENANT_ID, code: 'SUPP-002', name: '设备维保供应商', category: '设备维保',
      creditLevel: 'A', status: 'active', cooperationYears: 5,
    })
    expect(s.creditLevel).toBe('A')
    expect(s.cooperationYears).toBe(5)
  })

  it('AC-30-07: 查询供应商', () => {
    const created = service.createSupplier({
      tenantId: TENANT_ID, code: 'SUPP-003', name: '测试供应商', category: '测试',
    })
    const found = service.getSupplier(created.id, TENANT_ID)
    expect(found).toBeDefined()
    expect(found!.name).toBe('测试供应商')
  })

  it('AC-30-07: 查询跨租户供应商返回undefined', () => {
    const created = service.createSupplier({
      tenantId: TENANT_ID, code: 'SUPP-004', name: '租户A供应商', category: '测试',
    })
    expect(service.getSupplier(created.id, 'other-tenant')).toBeUndefined()
  })

  it('AC-30-07: 列表查询 - 全部', () => {
    service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '供应商A', category: '清洁' })
    service.createSupplier({ tenantId: TENANT_ID, code: 'S2', name: '供应商B', category: '设备' })
    const all = service.listSuppliers(TENANT_ID)
    expect(all).toHaveLength(2)
  })

  it('AC-30-07: 列表查询 - 按状态筛选', () => {
    service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '活跃供应商', category: '清洁', status: 'active' })
    service.createSupplier({ tenantId: TENANT_ID, code: 'S2', name: '下架供应商', category: '清洁', status: 'inactive' })
    const active = service.listSuppliers(TENANT_ID, { status: 'active' })
    expect(active).toHaveLength(1)
  })

  it('AC-30-07: 列表查询 - 搜索', () => {
    service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '清洁之星', category: '清洁' })
    service.createSupplier({ tenantId: TENANT_ID, code: 'S2', name: '设备达康', category: '设备' })
    const search = service.listSuppliers(TENANT_ID, { search: '清洁' })
    expect(search).toHaveLength(1)
  })

  it('AC-30-07: 更新供应商', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '原名', category: '测试' })
    const updated = service.updateSupplier(s.id, TENANT_ID, { name: '新名称', creditLevel: 'A' })
    expect(updated.name).toBe('新名称')
    expect(updated.creditLevel).toBe('A')
  })

  it('AC-30-07: 删除供应商', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '待删除', category: '测试' })
    expect(service.deleteSupplier(s.id, TENANT_ID)).toBe(true)
    expect(service.getSupplier(s.id, TENANT_ID)).toBeUndefined()
  })

  it('AC-30-07: 删除不存在的供应商返回false', () => {
    expect(service.deleteSupplier('nonexistent', TENANT_ID)).toBe(false)
  })

  it('AC-30-08: 添加供应商联系人', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '有联系人的供应商', category: '测试' })
    const updated = service.addSupplierContact(s.id, TENANT_ID, {
      name: '张三', phone: '13800138000', email: 'zhangsan@example.com', position: '销售经理',
    })
    expect(updated.contacts).toHaveLength(1)
    expect(updated.contacts[0].name).toBe('张三')
    expect(updated.contacts[0].email).toBe('zhangsan@example.com')
  })

  it('AC-30-09: 添加供应商合同', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '有合同的供应商', category: '测试' })
    const contract = service.addSupplierContract(s.id, TENANT_ID, {
      type: 'annual', contractNumber: 'CT-2026-001',
      startDate: '2026-01-01', endDate: '2026-12-31',
      amount: 12000000, autoRenew: true,
    })
    expect(contract.id).toMatch(/^scont-/)
    expect(contract.type).toBe('annual')
    expect(contract.amount).toBe(12000000)
  })

  it('AC-30-09: 查询供应商合同列表', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '有合同的供应商', category: '测试' })
    service.addSupplierContract(s.id, TENANT_ID, { type: 'annual', contractNumber: 'CT-001', startDate: '2026-01-01', endDate: '2026-12-31', amount: 1000000 })
    service.addSupplierContract(s.id, TENANT_ID, { type: 'annual', contractNumber: 'CT-002', startDate: '2027-01-01', endDate: '2027-12-31', amount: 2000000 })
    const contracts = service.listSupplierContracts(s.id, TENANT_ID)
    expect(contracts).toHaveLength(2)
  })

  it('AC-30-10: 供应商评价 - 计算平均分', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '待评价供应商', category: '测试' })
    service.evaluateSupplier(s.id, TENANT_ID, {
      evaluatorId: 'u-1', evaluatorName: '运营经理',
      qualityScore: 8, deliveryScore: 7, serviceScore: 9, priceScore: 6,
      comment: '质量不错，价格略高',
    })
    const updated = service.getSupplier(s.id, TENANT_ID)
    expect(updated!.evaluationCount).toBe(1)
    // Average = (8+7+9+6) / 4 = 7.5
    expect(updated!.averageScore).toBe(7.5)
  })

  it('AC-30-10: 供应商评价 - 多次评价取平均', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '多次评价供应商', category: '测试' })
    service.evaluateSupplier(s.id, TENANT_ID, {
      evaluatorId: 'u-1', evaluatorName: '经理A',
      qualityScore: 10, deliveryScore: 10, serviceScore: 10, priceScore: 10,
      comment: '完美',
    })
    service.evaluateSupplier(s.id, TENANT_ID, {
      evaluatorId: 'u-2', evaluatorName: '经理B',
      qualityScore: 6, deliveryScore: 6, serviceScore: 6, priceScore: 6,
      comment: '一般',
    })
    const updated = service.getSupplier(s.id, TENANT_ID)
    expect(updated!.evaluationCount).toBe(2)
    // Average = (40 + 24) / 8 = 8.0
    expect(updated!.averageScore).toBe(8)
  })

  it('AC-30-10: 查询供应商评价列表', () => {
    const s = service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: '多次评价供应商', category: '测试' })
    service.evaluateSupplier(s.id, TENANT_ID, {
      evaluatorId: 'u-1', evaluatorName: '经理A',
      qualityScore: 9, deliveryScore: 8, serviceScore: 8, priceScore: 7,
      comment: '不错',
    })
    const evals = service.listSupplierEvaluations(s.id, TENANT_ID)
    expect(evals).toHaveLength(1)
    expect(evals[0].comment).toBe('不错')
  })

  it('AC-30-11: 供应商统计', () => {
    service.createSupplier({ tenantId: TENANT_ID, code: 'S1', name: 'A级供应商', category: '清洁', creditLevel: 'A', status: 'active' })
    service.createSupplier({ tenantId: TENANT_ID, code: 'S2', name: 'B级供应商', category: '设备', creditLevel: 'B', status: 'active' })
    service.createSupplier({ tenantId: TENANT_ID, code: 'S3', name: 'C级供应商', category: '清洁', creditLevel: 'C', status: 'inactive' })
    const metrics = service.getSupplierMetrics(TENANT_ID)
    expect(metrics.total).toBe(3)
    expect(metrics.active).toBe(2)
    expect(metrics.byCreditLevel.A).toBe(1)
    expect(metrics.byCreditLevel.B).toBe(1)
    expect(metrics.byCreditLevel.C).toBe(1)
    expect(metrics.byCategory.清洁).toBe(2)
    expect(metrics.byCategory.设备).toBe(1)
  })
})

describe('P-30 Phase 60%: 库存预留', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-12: 检查库存可用量 - 充足', () => {
    const checks = service.checkInventoryAvailability(TENANT_ID, [
      { itemId: 'STK-005', itemName: 'VR清洁套装', quantity: 2 },
    ])
    expect(checks).toHaveLength(1)
    expect(checks[0].sufficient).toBe(true)
    expect(checks[0].availableQuantity).toBe(50)
  })

  it('AC-30-12: 检查库存可用量 - 不足', () => {
    const checks = service.checkInventoryAvailability(TENANT_ID, [
      { itemId: 'STK-005', itemName: 'VR清洁套装', quantity: 100 },
    ])
    expect(checks).toHaveLength(1)
    expect(checks[0].sufficient).toBe(false)
    expect(checks[0].availableQuantity).toBe(50)
  })

  it('AC-30-13: 创建库存预留', () => {
    const res = service.createInventoryReservation({
      tenantId: TENANT_ID, warehouseCode: 'WH-CLEAN',
      expiresAt: '2026-12-31T00:00:00Z',
      operatorId: 'op-1', operatorName: '仓管员',
      items: [{ itemId: 'STK-005', itemName: 'VR清洁套装', category: '耗材', quantity: 2, unit: '套' }],
    })
    expect(res.id).toMatch(/^res-/)
    expect(res.status).toBe('active')
    expect(res.reservationCode).toBeTruthy()
    expect(res.items).toHaveLength(1)
  })

  it('AC-30-13: 库存预留 - 库存不足时抛出异常', () => {
    expect(() => service.createInventoryReservation({
      tenantId: TENANT_ID, warehouseCode: 'WH-MAIN',
      expiresAt: '2026-12-31T00:00:00Z',
      operatorId: 'op-1', operatorName: '仓管员',
      items: [{ itemId: 'STK-005', itemName: 'VR清洁套装', category: '耗材', quantity: 999, unit: '套' }],
    })).toThrow('Insufficient inventory')
  })

  it('AC-30-13: 查询库存预留', () => {
    const res = service.createInventoryReservation({
      tenantId: TENANT_ID, warehouseCode: 'WH-CLEAN',
      expiresAt: '2026-12-31T00:00:00Z',
      operatorId: 'op-1', operatorName: '仓管员',
      items: [{ itemId: 'STK-005', itemName: 'VR清洁套装', category: '耗材', quantity: 2, unit: '套' }],
    })
    const found = service.getInventoryReservation(res.id, TENANT_ID)
    expect(found).toBeDefined()
    expect(found!.id).toBe(res.id)
  })

  it('AC-30-13: 取消库存预留', () => {
    const res = service.createInventoryReservation({
      tenantId: TENANT_ID, warehouseCode: 'WH-CLEAN',
      expiresAt: '2026-12-31T00:00:00Z',
      operatorId: 'op-1', operatorName: '仓管员',
      items: [{ itemId: 'STK-005', itemName: 'VR清洁套装', category: '耗材', quantity: 2, unit: '套' }],
    })
    const cancelled = service.cancelInventoryReservation(res.id, TENANT_ID)
    expect(cancelled.status).toBe('cancelled')
  })

  it('AC-30-13: 完成库存预留', () => {
    const res = service.createInventoryReservation({
      tenantId: TENANT_ID, warehouseCode: 'WH-CLEAN',
      expiresAt: '2026-12-31T00:00:00Z',
      operatorId: 'op-1', operatorName: '仓管员',
      items: [{ itemId: 'STK-005', itemName: 'VR清洁套装', category: '耗材', quantity: 2, unit: '套' }],
    })
    const fulfilled = service.fulfillInventoryReservation(res.id, TENANT_ID)
    expect(fulfilled.status).toBe('fulfilled')
  })

  it('AC-30-13: 列表查询库存预留', () => {
    service.createInventoryReservation({
      tenantId: TENANT_ID, warehouseCode: 'WH-CLEAN',
      expiresAt: '2026-12-31T00:00:00Z', operatorId: 'op-1', operatorName: '仓管员',
      items: [{ itemId: 'STK-005', itemName: 'VR清洁套装', category: '耗材', quantity: 2, unit: '套' }],
    })
    service.createInventoryReservation({
      tenantId: TENANT_ID, warehouseCode: 'WH-MAIN',
      expiresAt: '2026-12-31T00:00:00Z', operatorId: 'op-1', operatorName: '仓管员',
      items: [{ itemId: 'STK-008', itemName: '抹布', category: '耗材', quantity: 10, unit: '条' }],
    })
    const all = service.listInventoryReservations(TENANT_ID)
    expect(all).toHaveLength(2)
    const whFilter = service.listInventoryReservations(TENANT_ID, { warehouseCode: 'WH-CLEAN' })
    expect(whFilter).toHaveLength(1)
  })
})

describe('P-30 Phase 60%: 设备巡检定时调度', () => {
  let service: LogisticsService

  beforeEach(() => {
    service = new LogisticsService()
    service.resetStoreForTests()
  })

  it('AC-30-14: 创建定时调度计划', () => {
    const plan = service.createSchedulePlan({
      tenantId: TENANT_ID, name: '跳舞机每日巡检',
      equipmentId: 'equip-dance-1', equipmentName: '跳舞机',
      checkType: 'daily', cronExpression: '0 9 * * *',
      assigneeId: 'inspector-01', assigneeName: '王工',
    })
    expect(plan.id).toMatch(/^splan-/)
    expect(plan.name).toBe('跳舞机每日巡检')
    expect(plan.status).toBe('active')
  })

  it('AC-30-14: 查询调度计划', () => {
    const plan = service.createSchedulePlan({
      tenantId: TENANT_ID, name: '测试计划', equipmentId: 'eq-1', equipmentName: '设备1',
      checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工',
    })
    const found = service.getSchedulePlan(plan.id, TENANT_ID)
    expect(found).toBeDefined()
  })

  it('AC-30-14: 列表查询调度计划', () => {
    service.createSchedulePlan({ tenantId: TENANT_ID, name: '计划A', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    service.createSchedulePlan({ tenantId: TENANT_ID, name: '计划B', equipmentId: 'eq-2', equipmentName: '设备2', checkType: 'weekly', cronExpression: '0 9 * * 1', assigneeId: 'u-1', assigneeName: '王工' })
    const all = service.listSchedulePlans(TENANT_ID)
    expect(all).toHaveLength(2)
  })

  it('AC-30-14: 更新调度计划', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '原名称', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    const updated = service.updateSchedulePlan(plan.id, TENANT_ID, { name: '新名称', status: 'paused' })
    expect(updated.name).toBe('新名称')
    expect(updated.status).toBe('paused')
  })

  it('AC-30-14: 删除调度计划', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '待删除', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    expect(service.deleteSchedulePlan(plan.id, TENANT_ID)).toBe(true)
  })

  it('AC-30-15: 执行调度计划生成检查日志', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '巡检计划', equipmentId: 'eq-1', equipmentName: '跳舞机', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    const log = service.executeSchedulePlan(plan.id, TENANT_ID, {
      executorId: 'u-1', executorName: '王工',
      resultStatus: 'normal', resultNote: '设备运行正常',
    })
    expect(log.id).toMatch(/^slog-/)
    expect(log.status).toBe('completed')
    expect(log.resultStatus).toBe('normal')
    expect(log.resultNote).toBe('设备运行正常')
  })

  it('AC-30-15: 执行调度计划后 lastRunAt 更新', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '巡检', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    service.executeSchedulePlan(plan.id, TENANT_ID, { executorId: 'u-1', executorName: '王工', resultStatus: 'normal' })
    const updated = service.getSchedulePlan(plan.id, TENANT_ID)
    expect(updated!.lastRunAt).toBeTruthy()
  })

  it('AC-30-15: 查询调度计划执行日志', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '巡检', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    service.executeSchedulePlan(plan.id, TENANT_ID, { executorId: 'u-1', executorName: '王工', resultStatus: 'normal' })
    const logs = service.listScheduleTaskLogs(plan.id, TENANT_ID)
    expect(logs).toHaveLength(1)
  })

  it('AC-30-16: 计算下次执行时间 - 日报配置', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '每日巡检', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    const result = service.computeNextRun(plan.id, TENANT_ID, '2026-07-20T08:00:00.000Z')
    expect(result.nextRunAt).toBeDefined()
    // Daily: +1 day
    expect(new Date(result.nextRunAt!).getUTCDate()).toBe(21)
  })

  it('AC-30-16: 计算下次执行时间 - 周报配置', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '每周巡检', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'weekly', cronExpression: '0 9 * * 1', assigneeId: 'u-1', assigneeName: '王工' })
    const result = service.computeNextRun(plan.id, TENANT_ID, '2026-07-20T08:00:00.000Z')
    // Weekly: +7 days
    expect(new Date(result.nextRunAt!).getUTCDate()).toBe(27)
  })

  it('AC-30-17: sweep到期调度计划', () => {
    const plan = service.createSchedulePlan({ tenantId: TENANT_ID, name: '已到期计划', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    // Set nextRunAt to past
    service.updateSchedulePlan(plan.id, TENANT_ID, { nextRunAt: '2026-07-01T09:00:00.000Z' })
    const result = service.sweepDueSchedules('2026-07-20T10:00:00.000Z')
    expect(result.scanned).toBeGreaterThanOrEqual(1)
    expect(result.triggered).toBeGreaterThanOrEqual(1)
  })

  it('AC-30-18: 调度计划统计', () => {
    service.createSchedulePlan({ tenantId: TENANT_ID, name: '计划A', equipmentId: 'eq-1', equipmentName: '设备1', checkType: 'daily', cronExpression: '0 9 * * *', assigneeId: 'u-1', assigneeName: '王工' })
    service.createSchedulePlan({ tenantId: TENANT_ID, name: '计划B', equipmentId: 'eq-2', equipmentName: '设备2', checkType: 'weekly', cronExpression: '0 9 * * 1', assigneeId: 'u-1', assigneeName: '王工' })
    const metrics = service.getSchedulePlanMetrics(TENANT_ID)
    expect(metrics.total).toBe(2)
    expect(metrics.active).toBe(2)
  })
})
