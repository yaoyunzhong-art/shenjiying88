import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { LogisticsManagementController } from './logistics-management.controller'
import { LogisticsManagementService, resetLogisticsMgtStoresForTests } from './logistics-management.service'

describe('LogisticsManagementController', () => {
  let controller: LogisticsManagementController
  let service: LogisticsManagementService

  beforeEach(() => {
    resetLogisticsMgtStoresForTests()
    service = new LogisticsManagementService()
    controller = new LogisticsManagementController(service)
  })

  describe('POST /logistics-management/supply-orders (createSupplyOrder)', () => {
    it('正例: 创建采购订单成功', () => {
      const result = controller.createSupplyOrder({
        orderNumber: 'PO-001',
        vendorId: 'v-1',
        vendorName: '供应商A',
        items: [{ inventoryItemId: 'i-1', itemName: '清洁剂', unit: '瓶', quantity: 10, unitPrice: 1500 }],
      } as any)
      expect(result.id).toMatch(/^so-/)
      expect(result.orderNumber).toBe('PO-001')
    })
  })

  describe('GET /logistics-management/supply-orders (listSupplyOrders)', () => {
    it('正例: 列出所有采购订单', () => {
      controller.createSupplyOrder({
        orderNumber: 'PO-001', vendorId: 'v-1', vendorName: 'V1',
        items: [{ inventoryItemId: 'i-1', itemName: 'A', unit: '个', quantity: 1, unitPrice: 100 }],
      } as any)
      controller.createSupplyOrder({
        orderNumber: 'PO-002', vendorId: 'v-2', vendorName: 'V2',
        items: [{ inventoryItemId: 'i-2', itemName: 'B', unit: '个', quantity: 1, unitPrice: 200 }],
      } as any)

      const orders = controller.listSupplyOrders({} as any)
      expect(orders).toHaveLength(2)
    })
  })

  describe('POST /logistics-management/inventory-items (createInventoryItem)', () => {
    it('正例: 创建库存物品成功', () => {
      const result = controller.createInventoryItem({
        itemCode: 'ITEM-001', name: '清洁剂', category: 'consumable' as any,
        unit: '瓶', quantity: 100, minQuantity: 20,
      } as any)
      expect(result.id).toMatch(/^inv-/)
      expect(result.name).toBe('清洁剂')
    })
  })

  describe('POST /logistics-management/maintenance-tasks (createMaintenanceTask)', () => {
    it('正例: 创建维护任务成功', () => {
      const result = controller.createMaintenanceTask({
        equipmentName: '空调', taskType: 'preventive_maintenance' as any,
        priority: 'medium' as any, description: '清洗滤网',
      } as any)
      expect(result.id).toMatch(/^mt-/)
      expect(result.status).toBe('pending')
    })
  })

  describe('GET /logistics-management/metrics (getMetrics)', () => {
    it('正例: 获取统计指标', () => {
      const metrics = controller.getMetrics()
      expect(metrics.totalOrders).toBe(0)
      expect(metrics.totalVendors).toBe(0)
    })
  })

  describe('POST /logistics-management/supply-vendors (createSupplyVendor)', () => {
    it('正例: 创建供应商成功', () => {
      const result = controller.createSupplyVendor({
        code: 'V001', name: '供应商A', category: 'cleaning', grade: 'A' as any,
        contacts: [{ name: '王五', phone: '13900139000' }],
      } as any)
      expect(result.id).toMatch(/^sv-/)
      expect(result.name).toBe('供应商A')
    })
  })

  describe('POST /logistics-management/inventory-items/:id/stocktake', () => {
    it('正例: 库存盘点成功', () => {
      const created = controller.createInventoryItem({
        itemCode: 'ITEM-001', name: '清洁剂', category: 'consumable' as any,
        unit: '瓶', quantity: 100, minQuantity: 20,
      } as any)

      const updated = controller.stocktake(created.id, { quantity: 80, note: '盘点调整' } as any)
      expect(updated.quantity).toBe(80)
    })
  })
})
