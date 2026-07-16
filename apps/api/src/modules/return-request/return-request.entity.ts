// ── Return Request Enums ──

export enum ReturnType {
  QualityIssue = 'QUALITY_ISSUE',
  WrongItem = 'WRONG_ITEM',
  CustomerRemorse = 'CUSTOMER_REMORSE',
  Damage = 'DAMAGE',
}

export enum ReturnStatus {
  Pending = 'PENDING',
  Inspecting = 'INSPECTING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Refunded = 'REFUNDED',
}

// ── ReturnRequest ──

export interface ReturnRequest {
  id: string
  returnNo: string
  orderNo: string
  itemName: string
  quantity: number
  type: ReturnType
  reason: string
  status: ReturnStatus
  customerName: string
  amount: number
  images?: string[]
  remark?: string
  createdAt: string
  resolvedAt?: string
  tenantId: string
}
