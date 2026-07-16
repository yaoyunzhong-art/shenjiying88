// ── Procurement Order Enums ──

export enum ProcurementStatus {
  Draft = 'DRAFT',
  PendingApproval = 'PENDING_APPROVAL',
  Approved = 'APPROVED',
  Shipped = 'SHIPPED',
  Partial = 'PARTIAL',
  Received = 'RECEIVED',
  Cancelled = 'CANCELLED'
}

// ── ProcurementItem ──

export interface ProcurementItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  receivedQuantity: number
}

// ── ProcurementOrder ──

export interface ProcurementOrder {
  id: string
  orderNo: string
  supplierId: string
  supplierName: string
  status: ProcurementStatus
  totalAmount: number
  items: ProcurementItem[]
  remark?: string
  orderedAt: string
  expectedAt: string
  receivedAt?: string
  tenantId: string
  createdAt: string
}
