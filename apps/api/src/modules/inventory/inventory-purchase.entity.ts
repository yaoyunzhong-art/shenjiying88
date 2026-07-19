/**
 * inventory-purchase.entity.ts — P-37 库存采购模块增强实体
 *
 * 扩展基础 inventory.entity.ts，增加采购单审批流、付款状态、收货追踪等。
 */

// ─── 采购单增强状态 ─────────────────────────────────────

export enum PurchaseOrderStatus {
  Draft = 'DRAFT',
  PendingApproval = 'PENDING_APPROVAL',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Ordered = 'ORDERED',
  PartiallyReceived = 'PARTIALLY_RECEIVED',
  Received = 'RECEIVED',
  Cancelled = 'CANCELLED'
}

export enum PurchasePaymentStatus {
  Unpaid = 'UNPAID',
  PartiallyPaid = 'PARTIALLY_PAID',
  Paid = 'PAID',
  Overdue = 'OVERDUE'
}

export enum PurchaseReceiveStatus {
  Pending = 'PENDING',
  Partial = 'PARTIAL',
  Complete = 'COMPLETE'
}

export enum PurchaseReturnReason {
  QualityIssue = 'QUALITY_ISSUE',
  WrongProduct = 'WRONG_PRODUCT',
  Damaged = 'DAMAGED',
  OverDelivery = 'OVER_DELIVERY',
  Other = 'OTHER'
}

export enum PurchaseReturnStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Shipped = 'SHIPPED',
  Rejected = 'REJECTED',
  Completed = 'COMPLETED'
}

// ─── 采购单增强类型 ─────────────────────────────────────

export interface PurchaseOrderItem {
  productId: string
  productName: string
  sku: string
  category?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  receivedQuantity: number
  returnQuantity: number
  damagedQuantity: number
}

export interface PurchasePayment {
  id: string
  purchaseOrderId: string
  amount: number
  paymentMethod: string
  paymentDate: string
  transactionNo?: string
  remark?: string
  operatorId?: string
  createdAt: string
}

export interface PurchaseOrderNote {
  id: string
  purchaseOrderId: string
  content: string
  authorId?: string
  authorName?: string
  createdAt: string
}

export interface PurchaseOrderAttachment {
  id: string
  purchaseOrderId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedBy?: string
  createdAt: string
}

export interface PurchaseApprovalFlow {
  id: string
  purchaseOrderId: string
  approverId: string
  approverName: string
  action: 'APPROVE' | 'REJECT' | 'PENDING'
  comment?: string
  decidedAt?: string
  createdAt: string
}

export interface PurchaseReturn {
  id: string
  purchaseOrderId: string
  returnOrderNo: string
  items: PurchaseReturnItem[]
  reason: PurchaseReturnReason
  totalAmount: number
  status: PurchaseReturnStatus
  reasonDetail?: string
  appliedBy?: string
  appliedAt: string
  approvedBy?: string
  approvedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseReturnItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  reason: PurchaseReturnReason
}

// ─── 采购单增强 ─────────────────────────────────────────

export interface EnhancedPurchaseOrder {
  id: string
  tenantId: string
  storeId?: string
  orderNo: string
  supplierId?: string
  supplierName?: string
  supplierContact?: string
  status: PurchaseOrderStatus
  items: PurchaseOrderItem[]
  totalAmount: number
  totalPaid: number
  paymentStatus: PurchasePaymentStatus
  receiveStatus: PurchaseReceiveStatus
  paymentPlan?: string
  expectedDeliveryAt?: string
  orderedAt?: string
  confirmedAt?: string
  receivedAt?: string
  cancelledAt?: string
  cancelReason?: string
  notes?: PurchaseOrderNote[]
  payments?: PurchasePayment[]
  approvals?: PurchaseApprovalFlow[]
  attachments?: PurchaseOrderAttachment[]
  returns?: PurchaseReturn[]
  createdBy?: string
  createdAt: string
  updatedAt: string
}

// ─── 供应商增强 ─────────────────────────────────────────

export interface EnhancedSupplier {
  id: string
  tenantId: string
  code: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  bankName?: string
  bankAccount?: string
  taxId?: string
  category?: string
  rating?: number
  status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED'
  totalOrders?: number
  totalAmount?: number
  lastOrderAt?: string
  createdAt: string
  updatedAt: string
}

// ─── 计量单位 ───────────────────────────────────────────

export interface ProductUnit {
  id: string
  tenantId: string
  name: string
  symbol: string
  baseUnit?: string
  conversionRate?: number
  createdAt: string
}

// ─── 产品分类 ───────────────────────────────────────────

export interface ProductCategory {
  id: string
  tenantId: string
  name: string
  parentId?: string
  sortOrder: number
  createdAt: string
}
