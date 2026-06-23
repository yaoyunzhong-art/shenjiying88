export enum ProductStatus {
  Active = 'active',
  Inactive = 'inactive',
  Discontinued = 'discontinued'
}

export enum StockRecordType {
  Inbound = 'inbound',
  Outbound = 'outbound',
  Return = 'return',
  Adjustment = 'adjustment'
}

export enum PurchaseOrderStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Confirmed = 'confirmed',
  Received = 'received',
  Cancelled = 'cancelled'
}

export interface PurchaseOrderItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Product {
  id: string
  tenantId: string
  brandId?: string
  storeId?: string
  name: string
  sku: string
  category?: string
  unit: string
  price: number
  cost: number
  minStock: number
  maxStock: number
  currentStock: number
  status: ProductStatus
  imageUrl?: string
  barcode?: string
  createdAt: string
  updatedAt: string
}

export interface StockRecord {
  id: string
  productId: string
  storeId?: string
  type: StockRecordType
  quantity: number
  beforeStock: number
  afterStock: number
  reason?: string
  operatorId?: string
  batchNo?: string
  createdAt: string
}

export interface Supplier {
  id: string
  tenantId: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  tenantId: string
  storeId?: string
  supplierId?: string
  status: PurchaseOrderStatus
  items: PurchaseOrderItem[]
  totalAmount: number
  orderedAt?: string
  receivedAt?: string
  createdAt: string
}

export interface StockAlert {
  product: Product
  currentStock: number
  minStock: number
  maxStock: number
  status: 'low' | 'overstock' | 'out_of_stock'
}
