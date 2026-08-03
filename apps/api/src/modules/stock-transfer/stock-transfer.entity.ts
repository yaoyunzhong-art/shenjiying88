/**
 * 📦 库存调拨 - Entity (V1)
 *
 * 类型定义:
 * - TransferStatus / TransferType 枚举
 * - StockTransferItem / StockTransfer 核心接口
 * - TransferListQuery 查询
 * - CreateTransferDto / UpdateTransferDto 传输 DTO
 */

/** 调拨单状态 */
export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled' | 'rejected'

/** 调拨类型 */
export type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse' | 'warehouse_to_warehouse'

/** 调拨商品明细 */
export interface StockTransferItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unit: string
}

/** 调拨单 */
export interface StockTransfer {
  id: string
  tenantId: string
  transferNumber: string
  transferType: TransferType
  fromLocationId: string
  fromLocationName: string
  toLocationId: string
  toLocationName: string
  items: StockTransferItem[]
  status: TransferStatus
  notes?: string
  requestedById: string
  approvedById?: string
  receivedById?: string
  requestedAt: Date
  approvedAt?: Date
  shippedAt?: Date
  receivedAt?: Date
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}

/** 调拨单列表查询 */
export interface TransferListQuery {
  status?: TransferStatus
  tenantId?: string
  fromLocationId?: string
  toLocationId?: string
}

/** 创建调拨单 DTO */
export interface CreateTransferDto {
  tenantId: string
  transferType: TransferType
  fromLocationId: string
  fromLocationName: string
  toLocationId: string
  toLocationName: string
  items: StockTransferItem[]
  notes?: string
  requestedById: string
}

/** 更新调拨单 DTO (支持部分更新) */
export interface UpdateTransferDto {
  transferType?: TransferType
  fromLocationId?: string
  fromLocationName?: string
  toLocationId?: string
  toLocationName?: string
  items?: StockTransferItem[]
  notes?: string
}

/** 审批 DTO */
export interface ApproveDto {
  approvedById: string
}

/** 收货 DTO */
export interface ReceiveDto {
  receivedById: string
}

/** 调拨统计 */
export interface TransferStats {
  total: number
  byStatus: Record<TransferStatus, number>
  totalItems: number
}

// ─── 常量与标签 ───

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  pending: '待审批',
  approved: '已审批',
  in_transit: '运输中',
  received: '已收货',
  cancelled: '已取消',
  rejected: '已驳回',
}

export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店到门店',
  warehouse_to_store: '仓库到门店',
  store_to_warehouse: '门店到仓库',
  warehouse_to_warehouse: '仓库到仓库',
}

export const TRANSFER_STATES = [
  'pending',
  'approved',
  'in_transit',
  'received',
  'cancelled',
  'rejected',
] as const
