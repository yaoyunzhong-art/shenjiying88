/**
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
  // SupplyOrder
  // ════════════════════════════════════════════

  describe('SupplyOrder', () => {
    it('正例: 创建采购订单', () => {
      const order = svc.createSupplyOrder({
        tenantId: TENANT_ID,
        orderNumber: 'SO-2026-001',
        vendorId: 'v-001',
        vendorName: '测试供应商',
        items: [{ inventoryItemId: 'ii-001', itemName: '螺丝', unit: '个', quantity: 1000, unitPrice: 0.5 }],
        createdBy: 'u-001', createdByName: '张三',
      })
      expect(order.id).toBeTruthy()
      expect(order.totalAmount).toBe(500)
      expect(order.status).toBe('draft')
    })

    it('正例: 列表和更新', () => {
      svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-001', vendorId: 'v-001', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 10, unitPrice: 1 }],
        createdBy: 'u-01', createdByName: '张三',
      })
      const list = svc.listSupplyOrders(TENANT_ID)
      expect(list.length).toBe(1)

      const updated = svc.updateSupplyOrder(list[0].id, TENANT_ID, { status: 'completed' })
      expect(updated.status).toBe('completed')
    })

    it('反例: 不存在的订单抛异常', () => {
      expect(() => svc.getSupplyOrder('nonexist', TENANT_ID)).toBeUndefined()
    })
  })

  // ════════════════════════════════════════════
  // SupplyVendor
  // ════════════════════════════════════════════

  describe('SupplyVendor', () => {
    it('正例: 创建供应商', () => {
      const v = svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-001', name: '优质供应商',
        category: '电子', grade: 'A',
        contacts: [{ name: '李四', phone: '13800138000', position: '经理' }],
        createdBy: 'u-01',
      })
      expect(v.id).toBeTruthy()
    })

    it('正例: 删除供应商', () => {
      const v = svc.createSupplyVendor({
        tenantId: TENANT_ID, code: 'SV-002', name: '待删除',
        category: '包装', grade: 'B', contacts: [],
        createdBy: 'u-01',
      })
      expect(svc.deleteSupplyVendor(v.id, TENANT_ID)).toBe(true)
      expect(svc.deleteSupplyVendor('nonexist', TENANT_ID)).toBe(false)
    })
  })

  // ════════════════════════════════════════════
  // InventoryItem
  // ════════════════════════════════════════════

  describe('InventoryItem', () => {
    it('正例: 创建库存物品', () => {
      const item = svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-001', name: 'A4纸',
        category: '办公耗材', unit: '箱', quantity: 50, minQuantity: 10,
        createdBy: 'u-01',
      })
      expect(item.id).toBeTruthy()
    })

    it('正例: 库存盘点', () => {
      const item = svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-002', name: '墨盒',
        category: '办公耗材', unit: '个', quantity: 20, minQuantity: 5,
        createdBy: 'u-01',
      })
      const updated = svc.stocktake(item.id, TENANT_ID, 15, '盘点后更新')
      expect(updated.quantity).toBe(15)
    })

    it('正例: 低库存筛选', () => {
      svc.createInventoryItem({
        tenantId: TENANT_ID, itemCode: 'IT-LOW', name: '低库存商品',
        category: '办公耗材', unit: '个', quantity: 3, minQuantity: 10,
        createdBy: 'u-01',
      })
      const low = svc.getLowStockItems(TENANT_ID)
      expect(low.length).toBe(1)
      expect(low[0].quantity).toBe(3)
    })
  })

  // ════════════════════════════════════════════
  // MaintenanceTask
  // ════════════════════════════════════════════

  describe('MaintenanceTask', () => {
    it('正例: 创建维护任务', () => {
      const task = svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '空调',
        taskType: 'repair', priority: 'high',
        description: '不制冷', reportedBy: 'u-01', reportedByName: '张三',
      })
      expect(task.status).toBe('pending')
    })

    it('正例: 查询到期维护任务', () => {
      const past = new Date(Date.now() - 86400000).toISOString()
      const future = new Date(Date.now() + 86400000).toISOString()

      svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '到期任务',
        taskType: 'inspection', priority: 'medium',
        description: '已到期', reportedBy: 'u-01',
        scheduledAt: past,
      })
      svc.createMaintenanceTask({
        tenantId: TENANT_ID, equipmentName: '未来任务',
        taskType: 'inspection', priority: 'low',
        description: '未到期', reportedBy: 'u-01',
        scheduledAt: future,
      })

      const due = svc.getDueMaintenanceTasks(TENANT_ID)
      expect(due.length).toBe(1)
      expect(due[0].equipmentName).toBe('到期任务')
    })
  })

  // ════════════════════════════════════════════
  // Metrics
  // ════════════════════════════════════════════

  describe('getMetrics', () => {
    it('正例: 返回空指标', () => {
      const metrics = svc.getMetrics(TENANT_ID)
      expect(metrics.totalOrders).toBe(0)
      expect(metrics.totalVendors).toBe(0)
      expect(metrics.totalInventoryItems).toBe(0)
    })

    it('正例: 创建数据后指标增长', () => {
      svc.createSupplyOrder({
        tenantId: TENANT_ID, orderNumber: 'SO-001', vendorId: 'v-001',
        vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 10, unitPrice: 1 }],
        createdBy: 'u-01',
      })
      const metrics = svc.getMetrics(TENANT_ID)
      expect(metrics.totalOrders).toBe(1)
    })
  })
})
