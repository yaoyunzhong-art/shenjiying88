import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
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
import {
  createSupplyOrderId,
  createSupplyVendorId,
  createInventoryItemId,
  createMaintenanceTaskId,
} from './logistics-management.entity'

// ── In-memory stores (骨架阶段,后续替换为 Prisma) ──

const supplyOrderStore = new Map<string, SupplyOrder>()
const supplyVendorStore = new Map<string, SupplyVendor>()
const inventoryItemStore = new Map<string, InventoryItem>()
const maintenanceTaskStore = new Map<string, MaintenanceTask>()

// ── 导入/导出给测试重置 ──

export function resetLogisticsMgtStoresForTests(): void {
  supplyOrderStore.clear()
  supplyVendorStore.clear()
  inventoryItemStore.clear()
  maintenanceTaskStore.clear()
}

export const _testonly = { supplyOrderStore, supplyVendorStore, inventoryItemStore, maintenanceTaskStore }

@Injectable()
export class LogisticsManagementService {
  private readonly logger = new Logger(LogisticsManagementService.name)

  // ═══════════════════════════════════════════
  //  SupplyOrder 采购订单
  // ═══════════════════════════════════════════

  createSupplyOrder(input: {
    tenantId: string
    storeId?: string
    orderNumber: string
    vendorId: string
    vendorName: string
    items: Array<{ inventoryItemId: string; itemName: string; unit: string; quantity: number; unitPrice: number }>
    expectedDeliveryDate?: string
    notes?: string
    createdBy: string
    createdByName?: string
  }): SupplyOrder {
    const items: SupplyOrderItem[] = input.items.map((i) => ({
      ...i,
      totalPrice: Math.round(i.quantity * i.unitPrice),
    }))
    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0)

    const now = new Date().toISOString()
    const order: SupplyOrder = {
      id: createSupplyOrderId(),
      tenantId: input.tenantId,
      storeId: input.storeId,
      orderNumber: input.orderNumber,
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      items,
      totalAmount,
      status: 'draft',
      expectedDeliveryDate: input.expectedDeliveryDate,
      notes: input.notes,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      createdAt: now,
      updatedAt: now,
    }
    supplyOrderStore.set(order.id, order)
    this.logger.debug(`Created supply order ${order.id}: ${order.orderNumber}`)
    return { ...order, items: [...order.items] }
  }

  getSupplyOrder(id: string, tenantId: string): SupplyOrder | undefined {
    const o = supplyOrderStore.get(id)
    if (!o || o.tenantId !== tenantId) return undefined
    return { ...o, items: [...o.items] }
  }

  listSupplyOrders(
    tenantId: string,
    filter?: { status?: SupplyOrderStatus; vendorId?: string },
  ): SupplyOrder[] {
    return Array.from(supplyOrderStore.values())
      .filter((o) => o.tenantId === tenantId)
      .filter((o) => (filter?.status ? o.status === filter.status : true))
      .filter((o) => (filter?.vendorId ? o.vendorId === filter.vendorId : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((o) => ({ ...o, items: [...o.items] }))
  }

  updateSupplyOrder(
    id: string,
    tenantId: string,
    patch: Partial<Pick<SupplyOrder, 'status' | 'expectedDeliveryDate' | 'actualDeliveryDate' | 'notes'>>,
  ): SupplyOrder {
    const o = supplyOrderStore.get(id)
    if (!o || o.tenantId !== tenantId) throw new Error(`SupplyOrder not found: ${id}`)
    const updated: SupplyOrder = {
      ...o,
      ...patch,
      items: [...o.items],
      updatedAt: new Date().toISOString(),
    }
    supplyOrderStore.set(id, updated)
    return { ...updated, items: [...updated.items] }
  }

  deleteSupplyOrder(id: string, tenantId: string): boolean {
    const o = supplyOrderStore.get(id)
    if (!o || o.tenantId !== tenantId) return false
    supplyOrderStore.delete(id)
    return true
  }

  // ═══════════════════════════════════════════
  //  SupplyVendor 供应商
  // ═══════════════════════════════════════════

  createSupplyVendor(input: {
    tenantId: string
    code: string
    name: string
    category: string
    grade: VendorGrade
    contacts: VendorContact[]
    address?: string
    mainProducts?: string[]
    cooperationYears?: number
    notes?: string
    createdBy: string
  }): SupplyVendor {
    const now = new Date().toISOString()
    const vendor: SupplyVendor = {
      id: createSupplyVendorId(),
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      category: input.category,
      status: 'active',
      grade: input.grade,
      contacts: input.contacts,
      address: input.address,
      mainProducts: input.mainProducts ?? [],
      cooperationYears: input.cooperationYears ?? 0,
      averageScore: 0,
      evaluationCount: 0,
      notes: input.notes,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    supplyVendorStore.set(vendor.id, vendor)
    this.logger.debug(`Created supply vendor ${vendor.id}: ${vendor.name}`)
    return { ...vendor, contacts: [...vendor.contacts], mainProducts: [...vendor.mainProducts] }
  }

  getSupplyVendor(id: string, tenantId: string): SupplyVendor | undefined {
    const v = supplyVendorStore.get(id)
    if (!v || v.tenantId !== tenantId) return undefined
    return { ...v, contacts: [...v.contacts], mainProducts: [...v.mainProducts] }
  }

  listSupplyVendors(tenantId: string, filter?: { status?: VendorStatus; category?: string }): SupplyVendor[] {
    return Array.from(supplyVendorStore.values())
      .filter((v) => v.tenantId === tenantId)
      .filter((v) => (filter?.status ? v.status === filter.status : true))
      .filter((v) => (filter?.category ? v.category === filter.category : true))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((v) => ({ ...v, contacts: [...v.contacts], mainProducts: [...v.mainProducts] }))
  }

  updateSupplyVendor(
    id: string,
    tenantId: string,
    patch: Partial<Pick<SupplyVendor, 'name' | 'status' | 'grade' | 'address' | 'mainProducts' | 'notes'>>,
  ): SupplyVendor {
    const v = supplyVendorStore.get(id)
    if (!v || v.tenantId !== tenantId) throw new Error(`SupplyVendor not found: ${id}`)
    const updated: SupplyVendor = {
      ...v,
      ...patch,
      contacts: [...v.contacts],
      mainProducts: patch.mainProducts ?? [...v.mainProducts],
      updatedAt: new Date().toISOString(),
    }
    supplyVendorStore.set(id, updated)
    return { ...updated, contacts: [...updated.contacts], mainProducts: [...updated.mainProducts] }
  }

  deleteSupplyVendor(id: string, tenantId: string): boolean {
    const v = supplyVendorStore.get(id)
    if (!v || v.tenantId !== tenantId) return false
    supplyVendorStore.delete(id)
    return true
  }

  // ═══════════════════════════════════════════
  //  InventoryItem 库存物品
  // ═══════════════════════════════════════════

  createInventoryItem(input: {
    tenantId: string
    storeId?: string
    itemCode: string
    name: string
    category: InventoryCategory
    specification?: string
    unit: string
    quantity: number
    minQuantity: number
    unitCost?: number
    warehouseCode?: string
    location?: string
    notes?: string
    createdBy: string
  }): InventoryItem {
    const now = new Date().toISOString()
    const item: InventoryItem = {
      id: createInventoryItemId(),
      tenantId: input.tenantId,
      storeId: input.storeId,
      itemCode: input.itemCode,
      name: input.name,
      category: input.category,
      specification: input.specification,
      unit: input.unit,
      quantity: input.quantity,
      minQuantity: input.minQuantity,
      unitCost: input.unitCost,
      warehouseCode: input.warehouseCode,
      location: input.location,
      notes: input.notes,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    inventoryItemStore.set(item.id, item)
    this.logger.debug(`Created inventory item ${item.id}: ${item.name}`)
    return { ...item }
  }

  getInventoryItem(id: string, tenantId: string): InventoryItem | undefined {
    const i = inventoryItemStore.get(id)
    if (!i || i.tenantId !== tenantId) return undefined
    return { ...i }
  }

  listInventoryItems(
    tenantId: string,
    filter?: { category?: InventoryCategory; storeId?: string; search?: string },
  ): InventoryItem[] {
    return Array.from(inventoryItemStore.values())
      .filter((i) => i.tenantId === tenantId)
      .filter((i) => (filter?.storeId ? i.storeId === filter.storeId : true))
      .filter((i) => (filter?.category ? i.category === filter.category : true))
      .filter((i) =>
        filter?.search
          ? i.name.toLowerCase().includes(filter.search.toLowerCase()) ||
            i.itemCode.toLowerCase().includes(filter.search.toLowerCase())
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((i) => ({ ...i }))
  }

  updateInventoryItem(
    id: string,
    tenantId: string,
    patch: Partial<Pick<InventoryItem, 'quantity' | 'minQuantity' | 'unitCost' | 'location' | 'notes'>>,
  ): InventoryItem {
    const i = inventoryItemStore.get(id)
    if (!i || i.tenantId !== tenantId) throw new Error(`InventoryItem not found: ${id}`)
    const updated: InventoryItem = {
      ...i,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    inventoryItemStore.set(id, updated)
    return { ...updated }
  }

  deleteInventoryItem(id: string, tenantId: string): boolean {
    const i = inventoryItemStore.get(id)
    if (!i || i.tenantId !== tenantId) return false
    inventoryItemStore.delete(id)
    return true
  }

  /** 库存盘点 — 设置新数量 */
  stocktake(id: string, tenantId: string, newQuantity: number, note?: string): InventoryItem {
    const i = inventoryItemStore.get(id)
    if (!i || i.tenantId !== tenantId) throw new Error(`InventoryItem not found: ${id}`)
    const updated: InventoryItem = {
      ...i,
      quantity: newQuantity,
      notes: note ?? i.notes,
      updatedAt: new Date().toISOString(),
    }
    inventoryItemStore.set(id, updated)
    return { ...updated }
  }

  /** 获取低库存物品列表 */
  getLowStockItems(tenantId: string, storeId?: string): InventoryItem[] {
    return Array.from(inventoryItemStore.values())
      .filter((i) => i.tenantId === tenantId)
      .filter((i) => (storeId ? i.storeId === storeId : true))
      .filter((i) => i.quantity <= i.minQuantity)
      .sort((a, b) => a.quantity - b.quantity)
      .map((i) => ({ ...i }))
  }

  // ═══════════════════════════════════════════
  //  MaintenanceTask 维护任务
  // ═══════════════════════════════════════════

  createMaintenanceTask(input: {
    tenantId: string
    storeId?: string
    equipmentName: string
    equipmentId?: string
    taskType: MaintenanceTaskType
    priority: MaintenanceTaskPriority
    description: string
    assigneeId?: string
    assigneeName?: string
    scheduledAt?: string
    reportedBy: string
    reportedByName?: string
  }): MaintenanceTask {
    const now = new Date().toISOString()
    const task: MaintenanceTask = {
      id: createMaintenanceTaskId(),
      tenantId: input.tenantId,
      storeId: input.storeId,
      equipmentName: input.equipmentName,
      equipmentId: input.equipmentId,
      taskType: input.taskType,
      priority: input.priority,
      status: 'pending',
      description: input.description,
      assigneeId: input.assigneeId,
      assigneeName: input.assigneeName,
      scheduledAt: input.scheduledAt,
      reportedBy: input.reportedBy,
      reportedByName: input.reportedByName,
      createdAt: now,
      updatedAt: now,
    }
    maintenanceTaskStore.set(task.id, task)
    this.logger.debug(`Created maintenance task ${task.id}: ${task.equipmentName}`)
    return { ...task }
  }

  getMaintenanceTask(id: string, tenantId: string): MaintenanceTask | undefined {
    const t = maintenanceTaskStore.get(id)
    if (!t || t.tenantId !== tenantId) return undefined
    return { ...t }
  }

  listMaintenanceTasks(
    tenantId: string,
    filter?: { status?: MaintenanceTaskStatus; taskType?: MaintenanceTaskType; storeId?: string },
  ): MaintenanceTask[] {
    return Array.from(maintenanceTaskStore.values())
      .filter((t) => t.tenantId === tenantId)
      .filter((t) => (filter?.status ? t.status === filter.status : true))
      .filter((t) => (filter?.taskType ? t.taskType === filter.taskType : true))
      .filter((t) => (filter?.storeId ? t.storeId === filter.storeId : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((t) => ({ ...t }))
  }

  updateMaintenanceTask(
    id: string,
    tenantId: string,
    patch: Partial<Pick<MaintenanceTask, 'status' | 'assigneeId' | 'assigneeName' | 'scheduledAt' | 'startedAt' | 'completedAt' | 'completionNote'>>,
  ): MaintenanceTask {
    const t = maintenanceTaskStore.get(id)
    if (!t || t.tenantId !== tenantId) throw new Error(`MaintenanceTask not found: ${id}`)
    const updated: MaintenanceTask = {
      ...t,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    maintenanceTaskStore.set(id, updated)
    return { ...updated }
  }

  deleteMaintenanceTask(id: string, tenantId: string): boolean {
    const t = maintenanceTaskStore.get(id)
    if (!t || t.tenantId !== tenantId) return false
    maintenanceTaskStore.delete(id)
    return true
  }

  /** 查询未完成且已到排期的维护任务 */
  getDueMaintenanceTasks(tenantId: string, now: string = new Date().toISOString()): MaintenanceTask[] {
    const nowDate = new Date(now)
    return Array.from(maintenanceTaskStore.values())
      .filter((t) => t.tenantId === tenantId)
      .filter((t) => t.status === 'pending' || t.status === 'assigned')
      .filter((t) => t.scheduledAt && new Date(t.scheduledAt) <= nowDate)
      .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
      .map((t) => ({ ...t }))
  }

  // ═══════════════════════════════════════════
  //  统计
  // ═══════════════════════════════════════════

  getMetrics(tenantId: string): LogisticsManagementMetrics {
    const orders = Array.from(supplyOrderStore.values()).filter((o) => o.tenantId === tenantId)
    const vendors = Array.from(supplyVendorStore.values()).filter((v) => v.tenantId === tenantId)
    const items = Array.from(inventoryItemStore.values()).filter((i) => i.tenantId === tenantId)
    const tasks = Array.from(maintenanceTaskStore.values()).filter((t) => t.tenantId === tenantId)

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'draft' || o.status === 'pending_approval').length,
      totalVendors: vendors.length,
      activeVendors: vendors.filter((v) => v.status === 'active').length,
      totalInventoryItems: items.length,
      lowStockItems: items.filter((i) => i.quantity <= i.minQuantity).length,
      totalMaintenanceTasks: tasks.length,
      pendingMaintenanceTasks: tasks.filter((t) => t.status === 'pending' || t.status === 'assigned').length,
    }
  }
}
