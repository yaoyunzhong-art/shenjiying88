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
export declare function toProductContract(product: Product): ProductContract;
/**
 * Convert internal StockRecord to cross-module contract.
 */
export declare function toStockRecordContract(record: StockRecord): StockRecordContract;
/**
 * Convert internal Supplier to cross-module contract.
 */
export declare function toSupplierContract(supplier: Supplier): SupplierContract;
/**
 * Convert internal PurchaseOrder to cross-module contract.
 */
export declare function toPurchaseOrderContract(order: PurchaseOrder): PurchaseOrderContract;
/**
 * Convert internal StockAlert to cross-module contract.
 */
export declare function toStockAlertContract(alert: StockAlert): StockAlertContract;
/**
 * Check if stock level is sufficient for a given quantity.
 */
export declare function isStockSufficient(currentStock: number, requiredQty: number): boolean;
//# sourceMappingURL=inventory.contract.d.ts.map