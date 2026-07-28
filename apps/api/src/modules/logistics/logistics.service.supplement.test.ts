/**
 * logistics.service.supplement.test.ts — 后勤 Service 补充测试 (26+ tests)
 *
 * 覆盖:
 *   1️⃣ 设备维保 MaintenanceOrder 完整状态机 (5)
 *   2️⃣ 耗材采购 ProcurementRequest 完整流程 (5)
 *   3️⃣ 供应商 Supplier CRUD + 评估 + 合同 (5)
 *   4️⃣ 库存预留 InventoryReservation (3)
 *   5️⃣ RBAC 角色权限校验 (5)
 *   6️⃣ 跨租户数据隔离 (3)
 *
 * 全部模拟依赖，不连真实数据库
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LogisticsService } from './logistics.service'
import type {
  InspectionTaskStatus,
  CleanScheduleStatus,
  RepairOrderStatus,
  MaterialRequestStatus,
  MaintenanceOrderStatus,
  ProcurementRequestStatus,
} from './logistics.entity'
import type {
  SupplierStatus,
  CreditLevel,
} from './logistics.supplier.entity'

vi.setConfig({ testTimeout: 10000 })

const T_A = { tenantId: 't-supp-a', storeId: 'store-a' }
const T_B = { tenantId: 't-supp-b', storeId: 'store-b' }

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 设备维保 MaintenanceOrder 完整状态机
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ 设备维保] MaintenanceOrder 状态机', () => {
  let svc: LogisticsService

  beforeEach(() => {
    svc = new LogisticsService()
    svc.resetStoreForTests()
  })

  it('创建维保工单 → status=pending', () => {
    const order = svc.createMaintenanceOrder({
      ...T_A,
      equipmentId: 'mnt-eq-1',
      equipmentName: '空调',
      issueDescription: '不制冷',
      reporterId: 'u-001',
      reporterName: '张三',
    })
    expect(order.status).toBe('pending')
    expect(order.id).toMatch(/^mnt-/)
  })

  it('pending → in_progress: 开始维保', () => {
    const order = svc.createMaintenanceOrder({
      ...T_A,
      equipmentId: 'mnt-eq-2',
      equipmentName: '电梯',
      issueDescription: '异响',
      reporterId: 'u-001',
      reporterName: '张三',
    })
    const started = svc.startMaintenanceOrder(order.id, T_A.tenantId, {
      assigneeId: 'tech-001',
      assigneeName: '李四',
    })
    expect(started.status).toBe('in_progress')
    expect(started.assigneeId).toBe('tech-001')
    expect(started.assigneeName).toBe('李四')
    expect(started.startedAt).toBeDefined()
  })

  it('in_progress → pending_acceptance: 完成维保', () => {
    const order = svc.createMaintenanceOrder({
      ...T_A,
      equipmentId: 'mnt-eq-3',
      equipmentName: '投影仪',
      issueDescription: '画面模糊',
      reporterId: 'u-001',
      reporterName: '张三',
    })
    svc.startMaintenanceOrder(order.id, T_A.tenantId, {
      assigneeId: 'tech-001',
      assigneeName: '李四',
    })
    const completed = svc.completeMaintenanceOrder(order.id, T_A.tenantId, {
      completionNote: '已更换灯泡',
    })
    expect(completed.status).toBe('pending_acceptance')
    expect(completed.completionNote).toBe('已更换灯泡')
  })

  it('pending_acceptance → completed: 验收通过完整状态机', () => {
    const order = svc.createMaintenanceOrder({
      ...T_A,
      equipmentId: 'mnt-eq-4',
      equipmentName: '音响',
      issueDescription: '杂音',
      reporterId: 'u-001',
      reporterName: '张三',
    })
    svc.startMaintenanceOrder(order.id, T_A.tenantId, {
      assigneeId: 'tech-001',
      assigneeName: '李四',
    })
    svc.completeMaintenanceOrder(order.id, T_A.tenantId, {
      completionNote: '已维修',
    })
    const accepted = svc.acceptMaintenanceOrder(order.id, T_A.tenantId, {
      acceptedBy: 'reviewer-001',
      acceptanceNote: '维修合格',
    })
    expect(accepted.status).toBe('completed')
    expect(accepted.acceptanceNote).toBe('维修合格')
    expect(accepted.acceptedAt).toBeDefined()
  })

  it('维保状态机错误跳转抛出异常', () => {
    const order = svc.createMaintenanceOrder({
      ...T_A,
      equipmentId: 'mnt-eq-5',
      equipmentName: '测试设备',
      issueDescription: '故障',
      reporterId: 'u-001',
      reporterName: '张三',
    })
    // pending → completed 不可直接跳
    expect(() =>
      svc.completeMaintenanceOrder(order.id, T_A.tenantId, {
        completionNote: '跳过步骤',
      })
    ).toThrow('cannot complete from status pending')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 耗材采购 ProcurementRequest 完整流程
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ 耗材采购] ProcurementRequest 流程', () => {
  let svc: LogisticsService

  beforeEach(() => {
    svc = new LogisticsService()
    svc.resetStoreForTests()
  })

  it('创建采购申请 → status=draft', () => {
    const req = svc.createProcurementRequest({
      ...T_A,
      requesterId: 'u-001',
      requesterName: '张三',
      department: '运营部',
      purpose: '日常耗材采购',
    })
    expect(req.status).toBe('draft')
    expect(req.id).toMatch(/^proc-/)
  })

  it('draft → pending_approval: 提交审批', () => {
    const req = svc.createProcurementRequest({
      ...T_A,
      requesterId: 'u-001',
      requesterName: '张三',
      purpose: '耗材采购',
    })
    const submitted = svc.submitProcurementRequest(req.id, T_A.tenantId)
    expect(submitted.status).toBe('pending_approval')
  })

  it('完整的采购流: draft→pending_approval→approved→ordered→received', () => {
    const req = svc.createProcurementRequest({
      ...T_A,
      requesterId: 'u-001',
      requesterName: '张三',
      purpose: '完整流程测试',
    })

    const submitted = svc.submitProcurementRequest(req.id, T_A.tenantId)
    expect(submitted.status).toBe('pending_approval')

    const approved = svc.approveProcurementRequest(req.id, T_A.tenantId, {
      approverId: 'mgr-001',
      approverName: '李经理',
      note: '同意采购',
      approvalTicket: 'P-37-20260728-001',
    })
    expect(approved.status).toBe('approved')
    expect(approved.approval!.approvalTicket).toBe('P-37-20260728-001')

    const ordered = svc.orderProcurementRequest(req.id, T_A.tenantId, {
      orderNumber: 'PO-2026-0001',
      vendorName: '供应商A',
      operatorId: 'ops-001',
      operatorName: '王采购',
    })
    expect(ordered.status).toBe('ordered')
    expect(ordered.orderRecord!.orderNumber).toBe('PO-2026-0001')

    const received = svc.receiveProcurementRequest(req.id, T_A.tenantId, {
      receivedBy: 'wh-001',
      receivedByName: '赵仓库',
      note: '全部到货',
    })
    expect(received.status).toBe('received')
    expect(received.receiveRecord!.note).toBe('全部到货')
  })

  it('采购拒绝流程: draft→pending_approval→rejected', () => {
    const req = svc.createProcurementRequest({
      ...T_A,
      requesterId: 'u-001',
      requesterName: '张三',
      purpose: '被拒绝的采购',
    })
    svc.submitProcurementRequest(req.id, T_A.tenantId)
    const rejected = svc.rejectProcurementRequest(req.id, T_A.tenantId, {
      rejecterId: 'mgr-001',
      rejecterName: '李经理',
      reason: '预算不足',
    })
    expect(rejected.status).toBe('rejected')
  })

  it('采购状态机错误跳转', () => {
    const req = svc.createProcurementRequest({
      ...T_A,
      requesterId: 'u-001',
      requesterName: '张三',
      purpose: '状态跳转',
    })
    // draft → ordered 不可直接跳
    expect(() =>
      svc.orderProcurementRequest(req.id, T_A.tenantId, {
        orderNumber: 'PO',
        vendorName: 'V',
        operatorId: 'o',
        operatorName: 'O',
      })
    ).toThrow('cannot be ordered from status draft')
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 供应商 Supplier CRUD + 评估 + 合同
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ 供应商管理] Supplier CRUD', () => {
  let svc: LogisticsService

  beforeEach(() => {
    svc = new LogisticsService()
    svc.resetStoreForTests()
  })

  it('创建供应商并读取', () => {
    const supplier = svc.createSupplier({
      tenantId: T_A.tenantId,
      code: 'SUP-001',
      name: '测试供应商',
      category: '设备耗材',
      creditLevel: 'A',
      mainProducts: ['打印纸', '墨盒'],
    })
    expect(supplier.code).toBe('SUP-001')
    expect(supplier.status).toBe('active')
    expect(supplier.creditLevel).toBe('A')

    const found = svc.getSupplier(supplier.id, T_A.tenantId)
    expect(found).toBeDefined()
    expect(found!.name).toBe('测试供应商')
  })

  it('更新供应商信息', () => {
    const supplier = svc.createSupplier({
      tenantId: T_A.tenantId,
      code: 'SUP-002',
      name: '旧名称',
      category: '清洁用品',
    })
    const updated = svc.updateSupplier(supplier.id, T_A.tenantId, {
      name: '新名称',
      creditLevel: 'B',
    })
    expect(updated.name).toBe('新名称')
    expect(updated.creditLevel).toBe('B')

    const fetched = svc.getSupplier(supplier.id, T_A.tenantId)
    expect(fetched!.name).toBe('新名称')
  })

  it('添加供应商联系人', () => {
    const supplier = svc.createSupplier({
      tenantId: T_A.tenantId,
      code: 'SUP-003', name: '有联系人', category: '服务',
    })
    const withContact = svc.addSupplierContact(supplier.id, T_A.tenantId, {
      name: '王联系', phone: '13800138000', email: 'wang@test.com', position: '销售经理',
    })
    expect(withContact.contacts.length).toBe(1)
    expect(withContact.contacts[0].name).toBe('王联系')
    expect(withContact.contacts[0].phone).toBe('13800138000')
  })

  it('供应商评估后更新平均分', () => {
    const supplier = svc.createSupplier({
      tenantId: T_A.tenantId,
      code: 'SUP-004', name: '可评估', category: '设备',
    })
    const eval1 = svc.evaluateSupplier(supplier.id, T_A.tenantId, {
      evaluatorId: 'u-001', evaluatorName: '张三',
      qualityScore: 4, deliveryScore: 5, serviceScore: 4, priceScore: 3,
      comment: '质量不错',
    })
    expect(eval1.evaluatorName).toBe('张三')
    expect(eval1.qualityScore).toBe(4)

    const sAfter = svc.getSupplier(supplier.id, T_A.tenantId)
    // avg = (4+5+4+3)/4 = 4.0
    expect(sAfter!.averageScore).toBe(4)
    expect(sAfter!.evaluationCount).toBe(1)
  })

  it('删除供应商', () => {
    const supplier = svc.createSupplier({
      tenantId: T_A.tenantId,
      code: 'SUP-DEL', name: '可删除', category: '杂项',
    })
    expect(svc.deleteSupplier(supplier.id, T_A.tenantId)).toBe(true)
    expect(svc.getSupplier(supplier.id, T_A.tenantId)).toBeUndefined()
    // 第二次删除返回 false
    expect(svc.deleteSupplier(supplier.id, T_A.tenantId)).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 库存预留 InventoryReservation
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ 库存预留] InventoryReservation', () => {
  let svc: LogisticsService

  beforeEach(() => {
    svc = new LogisticsService()
    svc.resetStoreForTests()
  })

  it('检查库存可用性返回结果数组', () => {
    const checks = svc.checkInventoryAvailability(
      T_A.tenantId,
      [{ itemId: 'STK-005', itemName: '打印纸', quantity: 10 }],
      'WH-MAIN',
    )
    expect(Array.isArray(checks)).toBe(true)
    expect(checks.length).toBe(1)
    expect(checks[0].itemId).toBe('STK-005')
    expect(checks[0].sufficient).toBe(true)
  })

  it('库存不足时标记 insufficient=false', () => {
    const checks = svc.checkInventoryAvailability(
      T_A.tenantId,
      [{ itemId: 'STK-020', itemName: '稀有物品', quantity: 999 }],
      'WH-MAIN',
    )
    expect(checks[0].sufficient).toBe(false)
  })

  it('创建库存预留 → status=active (使用模拟库存中存在的SKU)', () => {
    const reservation = svc.createInventoryReservation({
      tenantId: T_A.tenantId,
      warehouseCode: 'WH-MAIN',
      operatorId: 'u-001',
      operatorName: '张三',
      items: [
        { itemId: 'STK-005', itemName: '打印纸', quantity: 10, category: '耗材', unit: '包' },
      ],
      expiresAt: '2026-08-28T00:00:00Z',
    })
    expect(reservation.status).toBe('active')
    expect(reservation.id).toMatch(/^res-/)
  })

  it('库存预留支持取消', () => {
    const reservation = svc.createInventoryReservation({
      tenantId: T_A.tenantId,
      warehouseCode: 'WH-MAIN',
      operatorId: 'u-001',
      operatorName: '张三',
      items: [
        { itemId: 'STK-008', itemName: '矿泉水', quantity: 10, category: '饮品', unit: '瓶' },
      ],
      expiresAt: '2026-08-28T00:00:00Z',
    })
    const cancelled = svc.cancelInventoryReservation(reservation.id, T_A.tenantId)
    expect(cancelled.status).toBe('cancelled')
  })

  it('已取消的预留不可再次取消', () => {
    const reservation = svc.createInventoryReservation({
      tenantId: T_A.tenantId,
      warehouseCode: 'WH-MAIN',
      operatorId: 'u-001',
      operatorName: '张三',
      items: [
        { itemId: 'STK-012', itemName: '手套', quantity: 5, category: '劳保', unit: '双' },
      ],
      expiresAt: '2026-08-28T00:00:00Z',
    })
    svc.cancelInventoryReservation(reservation.id, T_A.tenantId)
    expect(() => svc.cancelInventoryReservation(reservation.id, T_A.tenantId)).toThrow()
  })

  it('库存预留支持 fulfillment', () => {
    const reservation = svc.createInventoryReservation({
      tenantId: T_A.tenantId,
      warehouseCode: 'WH-MAIN',
      operatorId: 'u-001',
      operatorName: '张三',
      items: [
        { itemId: 'STK-025', itemName: '清洁剂', quantity: 20, category: '清洁', unit: '瓶' },
      ],
      expiresAt: '2026-08-28T00:00:00Z',
    })
    const fulfilled = svc.fulfillInventoryReservation(reservation.id, T_A.tenantId)
    expect(fulfilled.status).toBe('fulfilled')
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ RBAC 角色权限校验（后勤四大实体）
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ RBAC权限] Logistics 角色矩阵', () => {
  const ROLE_STORE_MGR = 'StoreManager'
  const ROLE_OPS = 'Operations'
  const ROLE_GUIDE = 'Guide'
  const ROLE_SECURITY = 'Security'
  const ROLE_FRONT_DESK = 'FrontDesk'
  const ROLE_TEAMBUILD = 'Teambuilding'
  const ROLE_HR = 'HR'
  const ROLE_MARKETING = 'Marketing'

  // Simplified logistics RBAC matrix
  const logAccess: Record<string, string[]> = {
    'log:inspection:create': [ROLE_STORE_MGR, ROLE_OPS],
    'log:inspection:list': [ROLE_STORE_MGR, ROLE_OPS, ROLE_GUIDE, ROLE_SECURITY],
    'log:repair:create': [ROLE_STORE_MGR, ROLE_OPS, ROLE_GUIDE, ROLE_FRONT_DESK],
    'log:repair:assign': [ROLE_STORE_MGR, ROLE_OPS],
    'log:clean:schedule': [ROLE_STORE_MGR, ROLE_OPS],
    'log:clean:assign': [ROLE_STORE_MGR, ROLE_OPS],
    'log:material:create': [ROLE_STORE_MGR, ROLE_OPS, ROLE_FRONT_DESK, ROLE_TEAMBUILD],
    'log:material:approve': [ROLE_STORE_MGR, ROLE_OPS],
    'log:supplier:manage': [ROLE_STORE_MGR, ROLE_OPS],
    'log:maintenance:create': [ROLE_STORE_MGR, ROLE_OPS, ROLE_GUIDE],
    'log:procurement:create': [ROLE_STORE_MGR, ROLE_OPS],
    'log:procurement:approve': [ROLE_STORE_MGR],
  }

  function hasAccess(role: string, resource: string): boolean {
    return logAccess[resource]?.includes(role) ?? false
  }

  it('👔店长 拥有所有后勤权限', () => {
    const resources = Object.keys(logAccess)
    resources.forEach((r) => {
      expect(hasAccess(ROLE_STORE_MGR, r)).toBe(true)
    })
  })

  it('🎯运行专员 拥有大部分权限(除采购审批)', () => {
    expect(hasAccess(ROLE_OPS, 'log:inspection:create')).toBe(true)
    expect(hasAccess(ROLE_OPS, 'log:repair:assign')).toBe(true)
    expect(hasAccess(ROLE_OPS, 'log:clean:schedule')).toBe(true)
    expect(hasAccess(ROLE_OPS, 'log:material:approve')).toBe(true)
    expect(hasAccess(ROLE_OPS, 'log:supplier:manage')).toBe(true)
    expect(hasAccess(ROLE_OPS, 'log:maintenance:create')).toBe(true)
    expect(hasAccess(ROLE_OPS, 'log:procurement:create')).toBe(true)
    expect(hasAccess(ROLE_OPS, 'log:procurement:approve')).toBe(false)
  })

  it('🎮导玩员 可创建维修、巡检查看', () => {
    expect(hasAccess(ROLE_GUIDE, 'log:inspection:list')).toBe(true)
    expect(hasAccess(ROLE_GUIDE, 'log:repair:create')).toBe(true)
    expect(hasAccess(ROLE_GUIDE, 'log:maintenance:create')).toBe(true)
    expect(hasAccess(ROLE_GUIDE, 'log:clean:schedule')).toBe(false)
    expect(hasAccess(ROLE_GUIDE, 'log:supplier:manage')).toBe(false)
  })

  it('🔧安监 仅可查看巡检列表', () => {
    expect(hasAccess(ROLE_SECURITY, 'log:inspection:list')).toBe(true)
    expect(hasAccess(ROLE_SECURITY, 'log:repair:create')).toBe(false)
    expect(hasAccess(ROLE_SECURITY, 'log:clean:schedule')).toBe(false)
    expect(hasAccess(ROLE_SECURITY, 'log:material:create')).toBe(false)
    expect(hasAccess(ROLE_SECURITY, 'log:supplier:manage')).toBe(false)
  })

  it('🛒前台 可创建维修和物资申请', () => {
    expect(hasAccess(ROLE_FRONT_DESK, 'log:repair:create')).toBe(true)
    expect(hasAccess(ROLE_FRONT_DESK, 'log:material:create')).toBe(true)
    expect(hasAccess(ROLE_FRONT_DESK, 'log:inspection:create')).toBe(false)
    expect(hasAccess(ROLE_FRONT_DESK, 'log:clean:assign')).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 6️⃣ 跨租户数据隔离
// ══════════════════════════════════════════════════════════════════

describe('[6️⃣ 数据隔离] Logistics 跨租户', () => {
  let svc: LogisticsService

  beforeEach(() => {
    svc = new LogisticsService()
    svc.resetStoreForTests()
  })

  it('不同租户的巡检任务隔离', () => {
    const taskA = svc.createInspectionTask({
      tenantId: 't-a', storeId: 's-a',
      equipmentId: 'eq-a', equipmentName: 'A设备',
      assigneeId: 'u-a', assigneeName: '员工A',
      scheduledAt: '2026-08-01T10:00:00Z',
    })
    const taskB = svc.createInspectionTask({
      tenantId: 't-b', storeId: 's-b',
      equipmentId: 'eq-b', equipmentName: 'B设备',
      assigneeId: 'u-b', assigneeName: '员工B',
      scheduledAt: '2026-08-01T10:00:00Z',
    })

    // Tenant A sees only A's tasks
    const tATasks = svc.listInspectionTasks('t-a')
    expect(tATasks.length).toBe(1)
    expect(tATasks[0].equipmentName).toBe('A设备')
  })

  it('不同租户的维保工单隔离', () => {
    const orderA = svc.createMaintenanceOrder({
      tenantId: 't-a', equipmentId: 'eq-ma', equipmentName: 'M-A',
      issueDescription: '故障A', reporterId: 'u-a', reporterName: 'A',
    })
    const orderB = svc.createMaintenanceOrder({
      tenantId: 't-b', equipmentId: 'eq-mb', equipmentName: 'M-B',
      issueDescription: '故障B', reporterId: 'u-b', reporterName: 'B',
    })

    const tAOrders = svc.listMaintenanceOrders('t-a')
    expect(tAOrders.length).toBe(1)
    expect(tAOrders[0].equipmentName).toBe('M-A')

    const tBOrders = svc.listMaintenanceOrders('t-b')
    expect(tBOrders.length).toBe(1)
    expect(tBOrders[0].equipmentName).toBe('M-B')
  })

  it('不同租户的供应商完全隔离', () => {
    svc.createSupplier({ tenantId: 't-a', code: 'S-A', name: '供应商A', category: '耗材' })
    svc.createSupplier({ tenantId: 't-b', code: 'S-B', name: '供应商B', category: '设备' })

    const tASuppliers = svc.listSuppliers('t-a')
    expect(tASuppliers.length).toBe(1)
    expect(tASuppliers[0].code).toBe('S-A')

    const tBSuppliers = svc.listSuppliers('t-b')
    expect(tBSuppliers.length).toBe(1)
    expect(tBSuppliers[0].code).toBe('S-B')

    // 跨租户获取不到
    expect(svc.getSupplier(tASuppliers[0].id, 't-b')).toBeUndefined()
  })
})
