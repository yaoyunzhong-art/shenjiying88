import { describe, it, expect } from 'vitest'
import type {
  SupplyOrder,
  SupplyOrderStatus,
  SupplyOrderItem,
  SupplyVendor,
  VendorStatus,
  VendorGrade,
  VendorContact,
  InventoryItem,
  InventoryCategory,
  MaintenanceTask,
  MaintenanceTaskType,
  MaintenanceTaskPriority,
  MaintenanceTaskStatus,
  LogisticsManagementMetrics,
} from './logistics-management.entity'

describe('SupplyOrder Entity', () => {
  it('should create a minimal SupplyOrder', () => {
    const order: SupplyOrder = {
      id: 'so-1',
      tenantId: 't-1',
      orderNumber: 'PO-2026-0001',
      vendorId: 'v-1',
      vendorName: '供应商A',
      items: [
        { inventoryItemId: 'i-1', itemName: '清洁剂', unit: '瓶', quantity: 100, unitPrice: 1500, totalPrice: 150000 },
      ],
      totalAmount: 150000,
      status: 'draft',
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(order.orderNumber).toBe('PO-2026-0001')
    expect(order.items).toHaveLength(1)
    expect(order.totalAmount).toBe(150000)
    expect(order.status).toBe('draft')
  })

  it('should support all supply order statuses', () => {
    const statuses: SupplyOrderStatus[] = ['draft', 'pending_approval', 'approved', 'ordered', 'partial_received', 'received', 'cancelled']
    expect(statuses).toHaveLength(7)
  })

  it('should create a SupplyOrder with approval and receive records', () => {
    const order: SupplyOrder = {
      id: 'so-2',
      tenantId: 't-1',
      orderNumber: 'PO-2026-0002',
      vendorId: 'v-1',
      vendorName: '供应商B',
      items: [
        { inventoryItemId: 'i-2', itemName: '灯泡', unit: '个', quantity: 50, unitPrice: 2000, totalPrice: 100000 },
      ],
      totalAmount: 100000,
      status: 'received',
      expectedDeliveryDate: '2026-07-20',
      actualDeliveryDate: '2026-07-19',
      approval: { approverId: 'u-2', approverName: '管理员', note: '同意', approvedAt: '2026-07-18T00:00:00Z' },
      receiveRecord: { receivedBy: 'u-3', receivedByName: '仓管', receivedAt: '2026-07-19T00:00:00Z', note: '完好' },
      notes: '紧急采购',
      createdBy: 'u-1',
      createdByName: '采购员',
      createdAt: '2026-07-17T00:00:00Z',
      updatedAt: '2026-07-19T00:00:00Z',
    }
    expect(order.approval!.approverName).toBe('管理员')
    expect(order.receiveRecord!.receivedByName).toBe('仓管')
    expect(order.notes).toBe('紧急采购')
  })
})

describe('SupplyVendor Entity', () => {
  it('should create a SupplyVendor', () => {
    const vendor: SupplyVendor = {
      id: 'sv-1',
      tenantId: 't-1',
      code: 'V001',
      name: '清洁用品供应商',
      category: 'cleaning',
      status: 'active',
      grade: 'A',
      contacts: [{ name: '王五', phone: '13900139000', email: 'wangwu@example.com', position: '销售经理' }],
      mainProducts: ['清洁剂', '消毒液'],
      cooperationYears: 3,
      averageScore: 9.2,
      evaluationCount: 5,
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(vendor.code).toBe('V001')
    expect(vendor.grade).toBe('A')
    expect(vendor.contacts).toHaveLength(1)
    expect(vendor.mainProducts).toContain('清洁剂')
  })

  it('should support all vendor statuses and grades', () => {
    const statuses: VendorStatus[] = ['active', 'inactive', 'suspended']
    const grades: VendorGrade[] = ['A', 'B', 'C', 'D']
    expect(statuses).toHaveLength(3)
    expect(grades).toHaveLength(4)
  })
})

describe('InventoryItem Entity', () => {
  it('should create an InventoryItem', () => {
    const item: InventoryItem = {
      id: 'inv-1',
      tenantId: 't-1',
      itemCode: 'ITEM-001',
      name: '清洁剂',
      category: 'consumable',
      unit: '瓶',
      quantity: 200,
      minQuantity: 50,
      unitCost: 1500,
      warehouseCode: 'WH-1',
      location: 'A-01-01',
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(item.name).toBe('清洁剂')
    expect(item.quantity).toBe(200)
    expect(item.minQuantity).toBe(50)
    expect(item.warehouseCode).toBe('WH-1')
  })

  it('should support all inventory categories', () => {
    const categories: InventoryCategory[] = ['consumable', 'spare_part', 'tool', 'equipment', 'cleaning_supply', 'office_supply', 'other']
    expect(categories).toHaveLength(7)
  })

  it('should create a low-stock item', () => {
    const item: InventoryItem = {
      id: 'inv-2',
      tenantId: 't-1',
      itemCode: 'ITEM-002',
      name: '灯泡',
      category: 'spare_part',
      unit: '个',
      quantity: 5,
      minQuantity: 20,
      createdBy: 'u-1',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(item.quantity).toBeLessThan(item.minQuantity)
  })
})

describe('MaintenanceTask Entity', () => {
  it('should create a MaintenanceTask', () => {
    const task: MaintenanceTask = {
      id: 'mt-1',
      tenantId: 't-1',
      equipmentName: '空调',
      taskType: 'preventive_maintenance',
      priority: 'medium',
      status: 'pending',
      description: '清洗空调滤网',
      reportedBy: 'u-1',
      reportedByName: '店长',
      createdAt: '2026-07-24T00:00:00Z',
      updatedAt: '2026-07-24T00:00:00Z',
    }
    expect(task.equipmentName).toBe('空调')
    expect(task.taskType).toBe('preventive_maintenance')
    expect(task.status).toBe('pending')
  })

  it('should support all task types, priorities, and statuses', () => {
    const types: MaintenanceTaskType[] = ['routine_inspection', 'repair', 'preventive_maintenance', 'emergency_repair', 'cleaning']
    const priorities: MaintenanceTaskPriority[] = ['low', 'medium', 'high', 'critical']
    const statuses: MaintenanceTaskStatus[] = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']
    expect(types).toHaveLength(5)
    expect(priorities).toHaveLength(4)
    expect(statuses).toHaveLength(5)
  })

  it('should create a completed task', () => {
    const task: MaintenanceTask = {
      id: 'mt-2',
      tenantId: 't-1',
      equipmentName: '冰柜',
      taskType: 'repair',
      priority: 'high',
      status: 'completed',
      description: '冰柜不制冷',
      assigneeId: 'tech-1',
      assigneeName: '维修师傅',
      scheduledAt: '2026-07-22T10:00:00Z',
      startedAt: '2026-07-22T10:30:00Z',
      completedAt: '2026-07-22T11:00:00Z',
      completionNote: '更换压缩机',
      reportedBy: 'u-1',
      reportedByName: '店长',
      createdAt: '2026-07-21T00:00:00Z',
      updatedAt: '2026-07-22T11:00:00Z',
    }
    expect(task.assigneeName).toBe('维修师傅')
    expect(task.completionNote).toBe('更换压缩机')
    expect(task.status).toBe('completed')
  })
})

describe('LogisticsManagementMetrics', () => {
  it('should create metrics', () => {
    const metrics: LogisticsManagementMetrics = {
      totalOrders: 10,
      pendingOrders: 3,
      totalVendors: 5,
      activeVendors: 4,
      totalInventoryItems: 50,
      lowStockItems: 2,
      totalMaintenanceTasks: 8,
      pendingMaintenanceTasks: 3,
    }
    expect(metrics.totalOrders).toBe(10)
    expect(metrics.lowStockItems).toBe(2)
    expect(metrics.pendingMaintenanceTasks).toBe(3)
  })
})
