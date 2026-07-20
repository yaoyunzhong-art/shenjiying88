/**
 * logistics.inventory.entity.ts
 * P-30 后勤库存预留接口
 *
 * 后勤耗材预留库存接口，对接库存系统
 */

export type ReservationStatus = 'active' | 'fulfilled' | 'cancelled' | 'expired'

export interface InventoryReservationItem {
  itemId: string
  itemName: string
  category: string
  quantity: number
  unit: string
}

export interface InventoryReservation {
  id: string
  tenantId: string
  /** 关联的申领ID（MaterialRequest.id） */
  materialRequestId?: string
  /** 关联的采购ID（ProcurementRequest.id） */
  procurementRequestId?: string
  /** 预留编号 */
  reservationCode: string
  status: ReservationStatus
  items: InventoryReservationItem[]
  /** 预留仓库编码 */
  warehouseCode: string
  /** 预留到期时间 */
  expiresAt: string
  operatorId: string
  operatorName: string
  /** 备注 */
  note?: string
  createdAt: string
  updatedAt: string
}

export interface InventoryCheckResult {
  itemId: string
  itemName: string
  requestedQuantity: number
  availableQuantity: number
  sufficient: boolean
  warehouseCode: string
}
