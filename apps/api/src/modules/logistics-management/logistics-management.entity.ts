/**
 * logistics-management.entity.ts
 * P-30 后勤管理 — 实体定义
 *
 * SupplyOrder: 采购订单
 * SupplyVendor: 供应商
 * InventoryItem: 库存物品
 * MaintenanceTask: 维护任务
 */

import { randomUUID } from 'node:crypto'

// ── ID 生成器 ───────────────────────────────────────────────────────────────

export function createSupplyOrderId(): string {
  return `so-${randomUUID()}`
}

export function createSupplyVendorId(): string {
  return `sv-${randomUUID()}`
}

export function createInventoryItemId(): string {
  return `inv-${randomUUID()}`
}

export function createMaintenanceTaskId(): string {
  return `mt-${randomUUID()}`
}

// ── 采购订单状态 ────────────────────────────────────────────────────────────

export type SupplyOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partial_received' | 'received' | 'cancelled'

export interface SupplyOrderItem {
  inventoryItemId: string
  itemName: string
  unit: string
  quantity: number
  unitPrice: number // 分
  totalPrice: number // 分
}

export interface SupplyOrderApproval {
  approverId: string
  approverName: string
  note: string
  approvedAt: string
}

export interface SupplyOrderReceiveRecord {
  receivedBy: string
  receivedByName: string
  receivedAt: string
  note?: string
}

export interface SupplyOrder {
  id: string
  tenantId: string
  storeId?: string
  /** 订单编号 */
  orderNumber: string
  /** 供应商ID */
  vendorId: string
  vendorName: string
  items: SupplyOrderItem[]
  /** 总金额（分） */
  totalAmount: number
  status: SupplyOrderStatus
  /** 期望到货日期 */
  expectedDeliveryDate?: string
  /** 实际到货日期 */
  actualDeliveryDate?: string
  approval?: SupplyOrderApproval
  receiveRecord?: SupplyOrderReceiveRecord
  notes?: string
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

// ── 供应商 ──────────────────────────────────────────────────────────────────

export type VendorStatus = 'active' | 'inactive' | 'suspended'
export type VendorGrade = 'A' | 'B' | 'C' | 'D'

export interface VendorContact {
  name: string
  phone: string
  email?: string
  position?: string
}

export interface SupplyVendor {
  id: string
  tenantId: string
  /** 供应商编码 */
  code: string
  /** 供应商名称 */
  name: string
  /** 主营品类 */
  category: string
  status: VendorStatus
  grade: VendorGrade
  contacts: VendorContact[]
  address?: string
  /** 主营产品 */
  mainProducts: string[]
  /** 合作年限 */
  cooperationYears: number
  /** 平均评分 (1-10) */
  averageScore: number
  /** 评估次数 */
  evaluationCount: number
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 库存物品 ────────────────────────────────────────────────────────────────

export type InventoryCategory = 'consumable' | 'spare_part' | 'tool' | 'equipment' | 'cleaning_supply' | 'office_supply' | 'other'

export interface InventoryItem {
  id: string
  tenantId: string
  storeId?: string
  /** 物品编码 */
  itemCode: string
  /** 物品名称 */
  name: string
  category: InventoryCategory
  /** 规格型号 */
  specification?: string
  unit: string
  /** 当前库存数量 */
  quantity: number
  /** 安全库存下限 */
  minQuantity: number
  /** 单位成本（分） */
  unitCost?: number
  /** 仓库编码 */
  warehouseCode?: string
  /** 库位 */
  location?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 维护任务 ────────────────────────────────────────────────────────────────

export type MaintenanceTaskType = 'routine_inspection' | 'repair' | 'preventive_maintenance' | 'emergency_repair' | 'cleaning'
export type MaintenanceTaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type MaintenanceTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export interface MaintenanceTask {
  id: string
  tenantId: string
  storeId?: string
  /** 设备/设施名称 */
  equipmentName: string
  /** 设备ID */
  equipmentId?: string
  taskType: MaintenanceTaskType
  priority: MaintenanceTaskPriority
  status: MaintenanceTaskStatus
  /** 任务描述 */
  description: string
  /** 负责人ID */
  assigneeId?: string
  assigneeName?: string
  /** 计划执行时间 */
  scheduledAt?: string
  /** 实际开始时间 */
  startedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 完成备注 */
  completionNote?: string
  /** 创建人 */
  reportedBy: string
  reportedByName?: string
  createdAt: string
  updatedAt: string
}

// ── 后勤管理统计 ───────────────────────────────────────────────────────────

export interface LogisticsManagementMetrics {
  totalOrders: number
  pendingOrders: number
  totalVendors: number
  activeVendors: number
  totalInventoryItems: number
  lowStockItems: number
  totalMaintenanceTasks: number
  pendingMaintenanceTasks: number
}
