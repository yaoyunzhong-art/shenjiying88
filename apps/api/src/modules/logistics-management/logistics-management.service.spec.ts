/**
 * 圈梁五道箍
 * logistics-management.service.spec.ts — 物流管理(供应侧) Service 单元测试 (V23)
 *
 * 覆盖: SupplyOrder / SupplyVendor / InventoryItem / MaintenanceTask / Metrics
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsManagementService, resetLogisticsMgtStoresForTests } from './logistics-management.service'

const TENANT_ID = 'tenant-test'

describe('LogisticsManagementService', () => {
  let svc: LogisticsManagementService

  beforeEach(() => {
    resetLogisticsMgtStoresForTests()
    svc = new LogisticsManagementService()
  })

  // ════════════════════════════════════════════
  // SupplyOrder 采购订单
  // ════════════════════════════════════════════

  describe('SupplyOrder', () => {
    it('正例: 创建采购订单并计算总金额', () => {
      const order = svc.createSupplyOrder({
        tenantId: TENANT_ID,
        orderNumber: 'SO-2026-001',
        vendorId: 'v-001',
        vendorName: '测试供应商',
        items: [
          { inventoryItemId: 'ii-001', itemName: '螺丝', unit: '个', quantity: 1000, unitPrice: 0.5 },
        ],
        createdBy: 'u-001', createdByName: '张三',
      })
      expect(order.id).toMatch(/^so-/)
      expect(order.totalAmount).toBe(500)
      expect(order.status).toBe('draft')
    })

    it('正例: 多条目订单金额求和', () => {
      const order = svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-MULTI', vendorId: 'v-001', vendorName: 'V1',
        items: [
          { inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 10, unitPrice: 5 },
          { inventoryItemId: 'i-2', itemName: 'B', unit: '箱', quantity: 2, unitPrice: 100 },
        ],
        createdBy: 'u-01',
      })
      expect(order.totalAmount).toBe(250) // 10*5 + 2*100
      expect(order.items).toHaveLength(2)
    })

    it('正例: 列表查询和更新状态', () => {
      svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-001', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 10, unitPrice: 1 }],
        createdBy: 'u-01', createdByName: '张三',
      })
      const list = svc.listSupplyOrders(TENANT_ID)
      expect(list).toHaveLength(1)

      const updated = svc.updateSupplyOrder(list[0].id, TENANT_ID, { status: 'completed' })
      expect(updated.status).toBe('completed')
    })

    it('正例: 按供应商筛选订单', () => {
      svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-V1', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 10 }],
        createdBy: 'u-01',
      })
      svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-V2', vendorId: 'v-002', vendorName: 'V2',
        items: [{ inventoryItemId: 'i-2', itemName: 'B', unit: '个', quantity: 1, unitPrice: 20 }],
        createdBy: 'u-01',
      })
      const filtered = svc.listSupplyOrders(TENANT_ID, { vendorId: 'v-001' })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].orderNumber).toBe('SO-V1')
    })

    it('正例: 按状态筛选订单', () => {
      svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-DRAFT', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 10 }],
        createdBy: 'u-01',
      })
      const o = svc.listSupplyOrders(TENANT_ID)[0]
      svc.updateSupplyOrder(o.id, TENANT_ID, { status: 'ordered' })
      const drafts = svc.listSupplyOrders(TENANT_ID, { status: 'draft' })
      expect(drafts).toHaveLength(0)
      const ordered = svc.listSupplyOrders(TENANT_ID, { status: 'ordered' })
      expect(ordered).toHaveLength(1)
    })

    it('正例: 获取单笔订单', () => {
      const created = svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-GET', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 10 }],
        createdBy: 'u-01',
      })
      const found = svc.getSupplyOrder(created.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.orderNumber).toBe('SO-GET')
    })

    it('反例: 不存在的订单返回 undefined', () => {
      expect(svc.getSupplyOrder('nonexist', TENANT_ID)).toBeUndefined()
    })

    it('反例: 获取其他租户的订单返回 undefined', () => {
      const created = svc.createSupplyOrder({
        tenantId: 'other-tenant', orderNumber: 'SO-OTHER', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 10 }],
        createdBy: 'u-01',
      })
      expect(svc.getSupplyOrder(created.id, TENANT_ID)).toBeUndefined()
    })

    it('正例: 删除订单', () => {
      const created = svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-DEL', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 10 }],
        createdBy: 'u-01',
      })
      expect(svc.deleteSupplyOrder(created.id, TENANT_ID)).toBe(true)
      expect(svc.getSupplyOrder(created.id, TENANT_ID)).toBeUndefined()
    })

    it('反例: 删除不存在的订单返回 false', () => {
      expect(svc.deleteSupplyOrder('nonexist', TENANT_ID)).toBe(false)
    })

    it('反例: 更新不存在的订单抛出异常', () => {
      expect(() => svc.updateSupplyOrder('nonexist', TENANT_ID, { status: 'approved' }))
        .toThrow('SupplyOrder not found')
    })
  })

  // ════════════════════════════════════════════
  // SupplyVendor 供应商
  // ════════════════════════════════════════════

  describe('SupplyVendor', () => {
    it('正例: 创建供应商返回完整信息', () => {
      const v = svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-001', name: '优质供应商',
        category: '电子', grade: 'A',
        contacts: [{ name: '李四', phone: '13800138000', position: '经理' }],
        createdBy: 'u-01',
      })
      expect(v.id).toMatch(/^sv-/)
      expect(v.status).toBe('active')
      expect(v.grade).toBe('A')
    })

    it('正例: 获取供应商', () => {
      const created = svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-GET', name: '获取测试',
        category: '包装', grade: 'B', contacts: [],
        createdBy: 'u-01',
      })
      const found = svc.getSupplyVendor(created.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.name).toBe('获取测试')
    })

    it('反例: 获取不存在的供应商返回 undefined', () => {
      expect(svc.getSupplyVendor('nonexist', TENANT_ID)).toBeUndefined()
    })

    it('正例: 按分类筛选供应商', () => {
      svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-CAT1', name: '电子供应商',
        category: '电子', grade: 'A', contacts: [], createdBy: 'u-01',
      })
      svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-CAT2', name: '包装供应商',
        category: '包装', grade: 'B', contacts: [], createdBy: 'u-01',
      })
      const electronics = svc.listSupplyVendors(TENANT_ID, { category: '电子' })
      expect(electronics).toHaveLength(1)
    })

    it('正例: 按状态筛选供应商', () => {
      const v = svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-STATUS', name: '待禁用',
        category: '办公', grade: 'C', contacts: [], createdBy: 'u-01',
      })
      svc.updateSupplyVendor(v.id, TENANT_ID, { status: 'inactive' })
      const active = svc.listSupplyVendors(TENANT_ID, { status: 'active' })
      expect(active).toHaveLength(0)
      const inactive = svc.listSupplyVendors(TENANT_ID, { status: 'inactive' })
      expect(inactive).toHaveLength(1)
    })

    it('正例: 更新供应商信息', () => {
      const v = svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-UPD', name: '待更新',
        category: '电子', grade: 'B', contacts: [], createdBy: 'u-01',
      })
      const updated = svc.updateSupplyVendor(v.id, TENANT_ID, { name: '已更新', grade: 'A' })
      expect(updated.name).toBe('已更新')
      expect(updated.grade).toBe('A')
    })

    it('反例: 更新不存在的供应商抛出异常', () => {
      expect(() => svc.updateSupplyVendor('nonexist', TENANT_ID, { name: 'X' }))
        .toThrow('SupplyVendor not found')
    })

    it('正例: 删除供应商', () => {
      const v = svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-DEL', name: '待删除',
        category: '包装', grade: 'B', contacts: [], createdBy: 'u-01',
      })
      expect(svc.deleteSupplyVendor(v.id, TENANT_ID)).toBe(true)
      expect(svc.getSupplyVendor(v.id, TENANT_ID)).toBeUndefined()
    })

    it('反例: 删除不存在的供应商返回 false', () => {
      expect(svc.deleteSupplyVendor('nonexist', TENANT_ID)).toBe(false)
    })
  })

  // ════════════════════════════════════════════
  // InventoryItem 库存物品
  // ════════════════════════════════════════════

  describe('InventoryItem', () => {
    it('正例: 创建库存物品', () => {
      const item = svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-001', name: 'A4纸',
        category: 'office_supply', unit: '箱', quantity: 50, minQuantity: 10,
        createdBy: 'u-01',
      })
      expect(item.id).toMatch(/^inv-/)
    })

    it('正例: 获取库存物品', () => {
      const created = svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-GET', name: '获取测试',
        category: 'consumable', unit: '个', quantity: 100, minQuantity: 20,
        createdBy: 'u-01',
      })
      const found = svc.getInventoryItem(created.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.itemCode).toBe('IT-GET')
    })

    it('反例: 获取不存在物品返回 undefined', () => {
      expect(svc.getInventoryItem('nonexist', TENANT_ID)).toBeUndefined()
    })

    it('正例: 按分类筛选库存', () => {
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-C1', name: '螺丝刀',
        category: 'tool', unit: '把', quantity: 10, minQuantity: 2, createdBy: 'u-01',
      })
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-C2', name: '洗洁精',
        category: 'cleaning_supply', unit: '瓶', quantity: 20, minQuantity: 5, createdBy: 'u-01',
      })
      const tools = svc.listInventoryItems(TENANT_ID, { category: 'tool' })
      expect(tools).toHaveLength(1)
    })

    it('正例: 按名称/编码搜索库存', () => {
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-SRCH', name: '搜索测试品',
        category: 'consumable', unit: '个', quantity: 10, minQuantity: 2, createdBy: 'u-01',
      })
      const byName = svc.listInventoryItems(TENANT_ID, { search: '搜索' })
      expect(byName).toHaveLength(1)
      const byCode = svc.listInventoryItems(TENANT_ID, { search: 'SRCH' })
      expect(byCode).toHaveLength(1)
      const noMatch = svc.listInventoryItems(TENANT_ID, { search: '不存在' })
      expect(noMatch).toHaveLength(0)
    })

    it('正例: 更新库存物品', () => {
      const item = svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-UPD', name: '可更新',
        category: 'spare_part', unit: '个', quantity: 30, minQuantity: 10,
        createdBy: 'u-01',
      })
      const updated = svc.updateInventoryItem(item.id, TENANT_ID, { quantity: 25, location: 'A1-03' })
      expect(updated.quantity).toBe(25)
      expect(updated.location).toBe('A1-03')
    })

    it('反例: 更新不存在的物品抛出异常', () => {
      expect(() => svc.updateInventoryItem('nonexist', TENANT_ID, { quantity: 10 }))
        .toThrow('InventoryItem not found')
    })

    it('正例: 删除库存物品', () => {
      const item = svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-DEL', name: '待删除',
        category: 'other', unit: '个', quantity: 5, minQuantity: 1, createdBy: 'u-01',
      })
      expect(svc.deleteInventoryItem(item.id, TENANT_ID)).toBe(true)
      expect(svc.getInventoryItem(item.id, TENANT_ID)).toBeUndefined()
    })

    it('反例: 删除不存在的物品返回 false', () => {
      expect(svc.deleteInventoryItem('nonexist', TENANT_ID)).toBe(false)
    })

    it('正例: 库存盘点更新数量', () => {
      const item = svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-STK', name: '盘点品',
        category: 'consumable', unit: '个', quantity: 20, minQuantity: 5,
        createdBy: 'u-01',
      })
      const updated = svc.stocktake(item.id, TENANT_ID, 15, '盘点后更新')
      expect(updated.quantity).toBe(15)
    })

    it('反例: 盘点不存在的物品抛出异常', () => {
      expect(() => svc.stocktake('nonexist', TENANT_ID, 10))
        .toThrow('InventoryItem not found')
    })

    it('正例: 低库存筛选（<=安全库存）', () => {
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-LOW', name: '低库存商品',
        category: 'office_supply', unit: '个', quantity: 3, minQuantity: 10,
        createdBy: 'u-01',
      })
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-OK', name: '充足商品',
        category: 'office_supply', unit: '个', quantity: 50, minQuantity: 10,
        createdBy: 'u-01',
      })
      const low = svc.getLowStockItems(TENANT_ID)
      expect(low).toHaveLength(1)
      expect(low[0].quantity).toBe(3)
    })
  })

  // ════════════════════════════════════════════
  // MaintenanceTask 维护任务
  // ════════════════════════════════════════════

  describe('MaintenanceTask', () => {
    it('正例: 创建维护任务', () => {
      const task = svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '空调',
        taskType: 'repair', priority: 'high',
        description: '不制冷', reportedBy: 'u-01', reportedByName: '张三',
      })
      expect(task.id).toMatch(/^mt-/)
      expect(task.status).toBe('pending')
    })

    it('正例: 获取维护任务', () => {
      const created = svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '冰箱',
        taskType: 'repair', priority: 'medium',
        description: '不制冷', reportedBy: 'u-01',
      })
      const found = svc.getMaintenanceTask(created.id, TENANT_ID)
      expect(found).toBeDefined()
      expect(found!.equipmentName).toBe('冰箱')
    })

    it('反例: 获取不存在的任务返回 undefined', () => {
      expect(svc.getMaintenanceTask('nonexist', TENANT_ID)).toBeUndefined()
    })

    it('正例: 按状态筛选维护任务', () => {
      const task = svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '打印机',
        taskType: 'repair', priority: 'low',
        description: '卡纸', reportedBy: 'u-01',
      })
      svc.updateMaintenanceTask(task.id, TENANT_ID, { status: 'in_progress' })
      const pending = svc.listMaintenanceTasks(TENANT_ID, { status: 'pending' })
      expect(pending).toHaveLength(0)
      const inProgress = svc.listMaintenanceTasks(TENANT_ID, { status: 'in_progress' })
      expect(inProgress).toHaveLength(1)
    })

    it('正例: 按任务类型筛选', () => {
      svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '巡检',
        taskType: 'routine_inspection', priority: 'medium',
        description: '日常巡检', reportedBy: 'u-01',
      })
      svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '急修',
        taskType: 'emergency_repair', priority: 'critical',
        description: '漏水', reportedBy: 'u-01',
      })
      const repairs = svc.listMaintenanceTasks(TENANT_ID, { taskType: 'emergency_repair' })
      expect(repairs).toHaveLength(1)
    })

    it('正例: 更新维护任务状态', () => {
      const task = svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '可完成',
        taskType: 'repair', priority: 'high',
        description: '需修复', reportedBy: 'u-01',
      })
      const updated = svc.updateMaintenanceTask(task.id, TENANT_ID, {
        status: 'completed', completedAt: new Date().toISOString(),
        completionNote: '已完成修复',
      })
      expect(updated.status).toBe('completed')
      expect(updated.completionNote).toBe('已完成修复')
    })

    it('反例: 更新不存在的任务抛出异常', () => {
      expect(() => svc.updateMaintenanceTask('nonexist', TENANT_ID, { status: 'completed' }))
        .toThrow('MaintenanceTask not found')
    })

    it('正例: 删除维护任务', () => {
      const task = svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '旧设备',
        taskType: 'cleaning', priority: 'low',
        description: '可删除', reportedBy: 'u-01',
      })
      expect(svc.deleteMaintenanceTask(task.id, TENANT_ID)).toBe(true)
      expect(svc.getMaintenanceTask(task.id, TENANT_ID)).toBeUndefined()
    })

    it('反例: 删除不存在的任务返回 false', () => {
      expect(svc.deleteMaintenanceTask('nonexist', TENANT_ID)).toBe(false)
    })

    it('正例: 查询到期维护任务', () => {
      const past = new Date(Date.now() - 86400000).toISOString()
      const future = new Date(Date.now() + 86400000).toISOString()

      svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '到期任务',
        taskType: 'routine_inspection', priority: 'medium',
        description: '已到期', reportedBy: 'u-01',
        scheduledAt: past,
      })
      svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '未来任务',
        taskType: 'routine_inspection', priority: 'low',
        description: '未到期', reportedBy: 'u-01',
        scheduledAt: future,
      })

      const due = svc.getDueMaintenanceTasks(TENANT_ID)
      expect(due).toHaveLength(1)
      expect(due[0].equipmentName).toBe('到期任务')
    })

    it('边界: 已完成的到期任务不计入', () => {
      const past = new Date(Date.now() - 86400000).toISOString()
      const task = svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '已完成到期',
        taskType: 'repair', priority: 'high',
        description: '已修好', reportedBy: 'u-01',
        scheduledAt: past,
      })
      svc.updateMaintenanceTask(task.id, TENANT_ID, { status: 'completed' })
      const due = svc.getDueMaintenanceTasks(TENANT_ID)
      expect(due).toHaveLength(0)
    })
  })

  // ════════════════════════════════════════════
  // Metrics 统计
  // ════════════════════════════════════════════

  describe('getMetrics', () => {
    it('正例: 空数据返回全部零值', () => {
      const metrics = svc.getMetrics(TENANT_ID)
      expect(metrics.totalOrders).toBe(0)
      expect(metrics.totalVendors).toBe(0)
      expect(metrics.totalInventoryItems).toBe(0)
      expect(metrics.totalMaintenanceTasks).toBe(0)
      expect(metrics.pendingOrders).toBe(0)
      expect(metrics.activeVendors).toBe(0)
      expect(metrics.lowStockItems).toBe(0)
      expect(metrics.pendingMaintenanceTasks).toBe(0)
    })

    it('正例: 创建混合数据后指标正确', () => {
      // 采购订单
      svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-M1', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 10 }],
        createdBy: 'u-01',
      })
      // 供应商
      svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-M1', name: '指标供应商',
        category: '电子', grade: 'A', contacts: [], createdBy: 'u-01',
      })
      // 库存物品（含低库存）
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-LOW-M', name: '低库存',
        category: 'consumable', unit: '个', quantity: 3, minQuantity: 10,
        createdBy: 'u-01',
      })
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-OK-M', name: '充足',
        category: 'consumable', unit: '个', quantity: 50, minQuantity: 10,
        createdBy: 'u-01',
      })
      // 维护任务
      svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '空调',
        taskType: 'repair', priority: 'high',
        description: '维修', reportedBy: 'u-01',
      })

      const metrics = svc.getMetrics(TENANT_ID)
      expect(metrics.totalOrders).toBe(1)
      expect(metrics.totalVendors).toBe(1)
      expect(metrics.totalInventoryItems).toBe(2)
      expect(metrics.lowStockItems).toBe(1)
      expect(metrics.totalMaintenanceTasks).toBe(1)
      expect(metrics.pendingMaintenanceTasks).toBe(1)
    })
  })
})
