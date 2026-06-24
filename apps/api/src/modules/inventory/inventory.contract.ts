import type { Product, StockRecord, Supplier, PurchaseOrder, StockAlert } from './inventory.entity';

/**
 * Contract types for inventory module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** External contract for product (cross-module safe subset) */
export interface ProductContract {
  id: string;
  tenantId: string;
  brandId?: string;
  storeId?: string;
  name: string;
  sku: string;
  category?: string;
  unit: string;
  price: number;
  cost: number;
  minStock: number;
  maxStock: number;
  currentStock: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** External contract for stock record (cross-module safe subset) */
export interface StockRecordContract {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  reason?: string;
  createdAt: string;
}

/** External contract for supplier (cross-module safe subset) */
export interface SupplierContract {
  id: string;
  tenantId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

/** External contract for purchase order (cross-module safe subset) */
export interface PurchaseOrderContract {
  id: string;
  tenantId: string;
  storeId?: string;
  supplierId?: string;
  status: string;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
  receivedAt?: string;
}

/** External contract for stock alert (cross-module safe subset) */
export interface StockAlertContract {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: string;
}

/**
 * Convert internal Product to cross-module contract.
 */
export function toProductContract(product: Product): ProductContract {
  return {
    id: product.id,
    tenantId: product.tenantId,
    brandId: product.brandId,
    storeId: product.storeId,
    name: product.name,
    sku: product.sku,
    category: product.category,
    unit: product.unit,
    price: product.price,
    cost: product.cost,
    minStock: product.minStock,
    maxStock: product.maxStock,
    currentStock: product.currentStock,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * Convert internal StockRecord to cross-module contract.
 */
export function toStockRecordContract(record: StockRecord): StockRecordContract {
  return {
    id: record.id,
    productId: record.productId,
    type: record.type,
    quantity: record.quantity,
    beforeStock: record.beforeStock,
    afterStock: record.afterStock,
    reason: record.reason,
    createdAt: record.createdAt,
  };
}

/**
 * Convert internal Supplier to cross-module contract.
 */
export function toSupplierContract(supplier: Supplier): SupplierContract {
  return {
    id: supplier.id,
    tenantId: supplier.tenantId,
    name: supplier.name,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    createdAt: supplier.createdAt,
  };
}

/**
 * Convert internal PurchaseOrder to cross-module contract.
 */
export function toPurchaseOrderContract(order: PurchaseOrder): PurchaseOrderContract {
  return {
    id: order.id,
    tenantId: order.tenantId,
    storeId: order.storeId,
    supplierId: order.supplierId,
    status: order.status,
    itemCount: order.items.length,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    receivedAt: order.receivedAt,
  };
}

/**
 * Convert internal StockAlert to cross-module contract.
 */
export function toStockAlertContract(alert: StockAlert): StockAlertContract {
  return {
    productId: alert.product.id,
    productName: alert.product.name,
    sku: alert.product.sku,
    currentStock: alert.currentStock,
    minStock: alert.minStock,
    maxStock: alert.maxStock,
    status: alert.status,
  };
}

/**
 * Check if stock level is sufficient for a given quantity.
 */
export function isStockSufficient(currentStock: number, requiredQty: number): boolean {
  return currentStock >= requiredQty;
}
