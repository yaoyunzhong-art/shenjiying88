// ── Supplier Manager Enums ──

export enum SupplierStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Suspended = 'SUSPENDED'
}

export enum SupplierRating {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

// ── Supplier ──

export interface Supplier {
  id: string
  name: string
  code: string
  contactPerson: string
  phone: string
  email: string
  address: string
  status: SupplierStatus
  rating: SupplierRating
  category: string
  remark?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}
