/**
 * Phase-37 T167: InventoryItem + InventoryReservation 实体定义
 *
 * 反模式库 v4 命中:
 *  - optimistic-lock-pattern: version 字段 (DR-36 决策 3)
 *  - cross-tenant-data-leak: 强制 tenantId
 *
 * 设计:
 *  - InventoryItem: SKU 维度库存 (一个 SKU 一行)
 *  - InventoryReservation: 订单级预留 (PENDING/CONFIRMED/RELEASED/EXPIRED)
 *  - 状态机: availableQty = totalQty - reservedQty (实时一致性)
 */

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED'

export interface InventoryItem {
  id: string
  tenantId: string
  sku: string
  name: string
  unit: string  // 件/箱/kg
  totalQty: number       // 物理总库存
  reservedQty: number    // 已预留 (PENDING)
  availableQty: number   // 可用 (totalQty - reservedQty, 实时一致)
  lowStockThreshold: number
  unitPriceCents: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  version: number        // 乐观锁 (DR-36 决策 3)
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface InventoryReservation {
  id: string
  tenantId: string
  itemId: string
  orderId: string
  qty: number
  status: ReservationStatus
  expiresAt: string      // ISO 8601 (默认 600s 后过期)
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  releasedAt?: string
  expiredAt?: string
  /** 反模式 v4 审计追踪: ringbuffer LRU 20 */
  history?: ReservationHistoryEntry[]
}

export interface ReservationHistoryEntry {
  from: ReservationStatus | null
  to: ReservationStatus
  at: string
  reason: string
  actor?: string
}

/**
 * 出入库审计日志
 */
export interface InventoryAuditEntry {
  id?: string
  itemId: string
  tenantId: string
  type: 'CREATE' | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUST' | 'RESERVE' | 'RELEASE' | 'CONFIRM' | 'CONFIRM_RESERVATION' | 'RELEASE_RESERVATION' | 'SOFT_DELETE' | 'EXPIRE'
  qty?: number
  beforeQty: number
  afterQty: number
  reason: string
  performedBy: string
  actor?: string
  relatedId?: string
  detail?: string
  at: string
}

/**
 * 库存操作输入
 */
export interface CreateInventoryItemInput {
  tenantId: string
  sku: string
  name: string
  unit?: string
  totalQty: number
  lowStockThreshold?: number
  unitPriceCents: number
  metadata?: Record<string, any>
  performedBy?: string
}

export interface StockMovementInput {
  itemId: string
  tenantId: string
  qty: number
  reason: string
  performedBy: string
}

export interface ReserveInput {
  itemId: string
  tenantId: string
  orderId: string
  qty: number
  ttlSeconds?: number   // 默认 600 (10 分钟)
}