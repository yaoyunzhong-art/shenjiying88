import { describe, it, expect, beforeEach } from 'vitest'
import { LogisticsManagementService, resetLogisticsMgtStoresForTests } from './logistics-management.service'

describe('LogisticsManagementService', () => {
  let service: LogisticsManagementService

  beforeEach(() => {
    resetLogisticsMgtStoresForTests()
    service = new LogisticsManagementService()
  })

  describe('SupplyOrder', () => {
    it('should create and retrieve a supply order', () => {
      const created = service.createSupplyOrder({
        tenantId: 't-1',
        orderNumber: 'PO-001',
        vendorId: 'v-1',
        vendorName: '供应商A',
        items: [{ inventoryItemId: 'i-1', itemName: '清洁剂', unit: '瓶', quantity: 10, unitPrice: 1500 }],
        createdBy: 'u-1',
        createdByName: '采购员',
      })

      expect(created.id).toMatch(/^so-/)
      expect(created.orderNumber).toBe('PO-001')
      expect(created.totalAmount).toBe(15000)

      const found = service.getSupplyOrder(created.id, 't-1')
      expect(found).toBeDefined()
      expect(found!.id).toBe(created.id)
    })

    it('should list supply orders with filter', () => {
      service.createSupplyOrder({
        tenantId: 't-1', orderNumber: 'PO-001', vendorId: 'v-1', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 100 }],
        createdBy: 'u-1',
      })
      service.createSupplyOrder({
        tenantId: 't-1', orderNumber: 'PO-002', vendorId: 'v-2', vendorName: 'V2',
        items: [{ inventoryItemId: 'i-2', itemName: 'B', unit: '个', quantity: 1, unitPrice: 200 }],
        createdBy: 'u-1',
      })

      const orders = service.listSupplyOrders('t-1', { vendorId: 'v-1' })
      expect(orders).toHaveLength(1)
    })

    it('should update a supply order status', () => {
      const created = service.createSupplyOrder({
        tenantId: 't-1', orderNumber: 'PO-001', vendorId: 'v-1', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 100 }],
        createdBy: 'u-1',
      })

      const updated = service.updateSupplyOrder(created.id, 't-1', { status: 'approved' })
      expect(updated.status).toBe('approved')
    })

    it('should delete a supply order', () => {
      const created = service.createSupplyOrder({
        tenantId: 't-1', orderNumber: 'PO-001', vendorId: 'v-1', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 100 }],
        createdBy: 'u-1',
      })

      const deleted = service.deleteSupplyOrder(created.id, 't-1')
      expect(deleted).toBe(true)

      const found = service.getSupplyOrder(created.id, 't-1')
      expect(found).toBeUndefined()
    })
  })

  describe('SupplyVendor', () => {
    it('should create and retrieve a vendor', () => {
      const created = service.createSupplyVendor({
        tenantId: 't-1',
        code: 'V001',
        name: '清洁用品供应商',
        category: 'cleaning',
        grade: 'A',
        contacts: [{ name: '王五', phone: '13900139000' }],
        createdBy: 'u-1',
      })

      expect(created.id).toMatch(/^sv-/)
      expect(created.code).toBe('V001')
      expect(created.status).toBe('active')

      const found = service.getSupplyVendor(created.id, 't-1')
      expect(found).toBeDefined()
    })
  })

  describe('InventoryItem', () => {
    it('should create and retrieve an inventory item', () => {
      const created = service.createInventoryItem({
        tenantId: 't-1',
        itemCode: 'ITEM-001',
        name: '清洁剂',
        category: 'consumable',
        unit: '瓶',
        quantity: 100,
        minQuantity: 20,
        createdBy: 'u-1',
      })

      expect(created.id).toMatch(/^inv-/)
      expect(created.name).toBe('清洁剂')
    })

    it('should perform stocktake', () => {
      const created = service.createInventoryItem({
        tenantId: 't-1',
        itemCode: 'ITEM-001', name: '清洁剂', category: 'consumable',
        unit: '瓶', quantity: 100, minQuantity: 20,
        createdBy: 'u-1',
      })

      const updated = service.stocktake(created.id, 't-1', 80, '月度盘点')
      expect(updated.quantity).toBe(80)
    })

    it('should detect low stock items', () => {
      service.createInventoryItem({
        tenantId: 't-1', itemCode: 'A', name: 'A', category: 'consumable',
        unit: '个', quantity: 5, minQuantity: 20, createdBy: 'u-1',
      })
      service.createInventoryItem({
        tenantId: 't-1', itemCode: 'B', name: 'B', category: 'consumable',
        unit: '个', quantity: 50, minQuantity: 20, createdBy: 'u-1',
      })

      const low = service.getLowStockItems('t-1')
      expect(low).toHaveLength(1)
    })
  })

  describe('MaintenanceTask', () => {
    it('should create and retrieve a maintenance task', () => {
      const created = service.createMaintenanceTask({
        tenantId: 't-1',
        equipmentName: '空调',
        taskType: 'preventive_maintenance',
        priority: 'medium',
        description: '清洗滤网',
        reportedBy: 'u-1',
        reportedByName: '店长',
      })

      expect(created.id).toMatch(/^mt-/)
      expect(created.status).toBe('pending')

      const found = service.getMaintenanceTask(created.id, 't-1')
      expect(found).toBeDefined()
    })

    it('should list maintenance tasks with filter', () => {
      service.createMaintenanceTask({
        tenantId: 't-1', equipmentName: '空调', taskType: 'preventive_maintenance',
        priority: 'medium', description: '清洗', reportedBy: 'u-1',
      })
      service.createMaintenanceTask({
        tenantId: 't-1', equipmentName: '冰柜', taskType: 'repair',
        priority: 'high', description: '维修', reportedBy: 'u-1',
      })

      const repairs = service.listMaintenanceTasks('t-1', { taskType: 'repair' })
      expect(repairs).toHaveLength(1)
    })
  })

  describe('Metrics', () => {
    it('should return correct metrics', () => {
      service.createSupplyOrder({
        tenantId: 't-1', orderNumber: 'PO-001', vendorId: 'v-1', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 100 }],
        createdBy: 'u-1',
      })
      service.createSupplyVendor({
        tenantId: 't-1', code: 'V001', name: '供应商', category: 'cleaning',
        grade: 'A', contacts: [{ name: '王五', phone: '13900139000' }],
        createdBy: 'u-1',
      })
      service.createInventoryItem({
        tenantId: 't-1', itemCode: 'A', name: 'A', category: 'consumable',
        unit: '个', quantity: 5, minQuantity: 20, createdBy: 'u-1',
      })
      service.createMaintenanceTask({
        tenantId: 't-1', equipmentName: '空调', taskType: 'preventive_maintenance',
        priority: 'medium', description: '清洗', reportedBy: 'u-1',
      })

      const metrics = service.getMetrics('t-1')
      expect(metrics.totalOrders).toBe(1)
      expect(metrics.totalVendors).toBe(1)
      expect(metrics.totalInventoryItems).toBe(1)
      expect(metrics.lowStockItems).toBe(1)
      expect(metrics.totalMaintenanceTasks).toBe(1)
    })
  })
})
