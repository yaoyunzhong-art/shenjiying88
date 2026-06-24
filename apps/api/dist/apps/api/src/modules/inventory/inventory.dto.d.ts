import { ProductStatus, StockRecordType, PurchaseOrderStatus } from './inventory.entity';
export declare class CreateProductDto {
    name: string;
    sku: string;
    category?: string;
    unit: string;
    price: number;
    cost: number;
    minStock: number;
    maxStock: number;
    currentStock: number;
    status?: ProductStatus;
    imageUrl?: string;
    barcode?: string;
}
export declare class UpdateProductDto {
    name?: string;
    sku?: string;
    category?: string;
    unit?: string;
    price?: number;
    cost?: number;
    minStock?: number;
    maxStock?: number;
    status?: ProductStatus;
    imageUrl?: string;
    barcode?: string;
}
export declare class ProductQueryDto {
    category?: string;
    status?: string;
    keyword?: string;
    limit?: number;
    offset?: number;
}
export declare class StockInDto {
    productId: string;
    quantity: number;
    reason?: string;
    batchNo?: string;
}
export declare class StockOutDto {
    productId: string;
    quantity: number;
    reason?: string;
}
export declare class AdjustStockDto {
    productId: string;
    newQuantity: number;
    reason: string;
}
export declare class StockRecordQueryDto {
    productId?: string;
    type?: StockRecordType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
}
export declare class CreateSupplierDto {
    name: string;
    contactName?: string;
    phone?: string;
    email?: string;
    address?: string;
}
export declare class CreatePurchaseOrderItemDto {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
export declare class CreatePurchaseOrderDto {
    storeId?: string;
    supplierId?: string;
    items: CreatePurchaseOrderItemDto[];
    totalAmount: number;
}
export declare class PurchaseOrderQueryDto {
    status?: PurchaseOrderStatus;
    supplierId?: string;
    storeId?: string;
    limit?: number;
    offset?: number;
}
//# sourceMappingURL=inventory.dto.d.ts.map