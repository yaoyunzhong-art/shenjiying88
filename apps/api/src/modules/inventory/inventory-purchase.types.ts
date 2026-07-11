/**
 * inventory-purchase.types.ts — P-37 采购模块类型扩展
 */

import type {
  EnhancedPurchaseOrder,
  PurchaseOrderItem,
  PurchasePayment,
  PurchaseOrderNote,
  PurchaseOrderAttachment,
  PurchaseApprovalFlow,
  PurchaseReturn,
  PurchaseReturnItem,
  EnhancedSupplier,
  ProductUnit,
  ProductCategory,
  PurchaseOrderStatus,
  PurchasePaymentStatus,
  PurchaseReceiveStatus,
  PurchaseReturnReason,
  PurchaseReturnStatus
} from './inventory-purchase.entity'

// ─── 采购审批 ───────────────────────────────────────────

export interface PurchaseApprovalRequest {
  purchaseOrderId: string
  approverId: string
  approverName: string
  action: 'APPROVE' | 'REJECT'
  comment?: string
}

export interface PurchaseApprovalResult {
  success: boolean
  order: EnhancedPurchaseOrder
  approval: PurchaseApprovalFlow
}

// ─── 采购收货 ───────────────────────────────────────────

export interface PurchaseReceiveRequest {
  purchaseOrderId: string
  items: Array<{
    productId: string
    receivedQuantity: number
    damagedQuantity: number
  }>
  warehouseNote?: string
  operatorId?: string
}

export interface PurchaseReceiveResult {
  success: boolean
  order: EnhancedPurchaseOrder
  stockUpdated: boolean
}

// ─── 采购付款 ───────────────────────────────────────────

export interface PurchasePaymentRequest {
  purchaseOrderId: string
  amount: number
  paymentMethod: string
  transactionNo?: string
  remark?: string
  operatorId?: string
}

export interface PurchasePaymentResult {
  success: boolean
  order: EnhancedPurchaseOrder
  payment: PurchasePayment
}

// ─── 采购退货 ───────────────────────────────────────────

export interface PurchaseReturnRequest {
  purchaseOrderId: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    reason: PurchaseReturnReason
  }>
  reasonDetail?: string
  appliedBy?: string
}

export interface PurchaseReturnResult {
  success: boolean
  returnOrder: PurchaseReturn
  order: EnhancedPurchaseOrder
}

// ─── 采购统计 ───────────────────────────────────────────

export interface PurchaseStats {
  totalOrders: number
  totalAmount: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
  totalReturns: number
  returnAmount: number
  monthlyStats: Array<{
    month: string
    orderCount: number
    totalAmount: number
    totalReceived: number
  }>
  statusBreakdown: Array<{
    status: string
    count: number
    totalAmount: number
  }>
  topSuppliers: Array<{
    supplierId: string
    supplierName: string
    orderCount: number
    totalAmount: number
  }>
}

// ─── 采购预警 ───────────────────────────────────────────

export interface PurchaseAlert {
  type: 'OVERDUE' | 'NEAR_DEADLINE' | 'PENDING_APPROVAL'
  purchaseOrderId: string
  orderNo: string
  supplierName?: string
  message: string
  daysRemaining?: number
  createdAt: string
}

// ─── 重新导出实体类型 ───────────────────────────────────

export type {
  EnhancedPurchaseOrder,
  PurchaseOrderItem,
  PurchasePayment,
  PurchaseOrderNote,
  PurchaseOrderAttachment,
  PurchaseApprovalFlow,
  PurchaseReturn,
  PurchaseReturnItem,
  EnhancedSupplier,
  ProductUnit,
  ProductCategory,
  PurchaseOrderStatus,
  PurchasePaymentStatus,
  PurchaseReceiveStatus,
  PurchaseReturnReason,
  PurchaseReturnStatus
}

export {
  PurchaseOrderStatus as PurchaseOrderStatusEnum,
  PurchasePaymentStatus as PurchasePaymentStatusEnum,
  PurchaseReceiveStatus as PurchaseReceiveStatusEnum,
  PurchaseReturnReason as PurchaseReturnReasonEnum,
  PurchaseReturnStatus as PurchaseReturnStatusEnum
}
