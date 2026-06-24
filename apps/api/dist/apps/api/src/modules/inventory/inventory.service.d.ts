import type { RequestTenantContext } from '../tenant/tenant.types';
import { type Product, type StockRecord, type Supplier, type PurchaseOrder, type StockAlert } from './inventory.entity';
import type { CreateProductDto, UpdateProductDto, ProductQueryDto, StockInDto, StockOutDto, AdjustStockDto, StockRecordQueryDto, CreateSupplierDto, CreatePurchaseOrderDto, PurchaseOrderQueryDto } from './inventory.dto';
export declare function resetInventoryServiceTestState(): void;
export declare class InventoryService {
    createProduct(tenantContext: RequestTenantContext, input: CreateProductDto): Product;
    updateProduct(productId: string, tenantContext: RequestTenantContext, input: UpdateProductDto): Product;
    getProduct(productId: string, tenantContext: RequestTenantContext): Product;
    listProducts(tenantContext: RequestTenantContext, query?: ProductQueryDto): Product[];
    stockIn(tenantContext: RequestTenantContext, input: StockInDto): {
        product: Product;
        record: StockRecord;
    };
    stockOut(tenantContext: RequestTenantContext, input: StockOutDto): {
        product: Product;
        record: StockRecord;
    };
    adjustStock(tenantContext: RequestTenantContext, input: AdjustStockDto): {
        product: Product;
        record: StockRecord;
    };
    checkStock(productId: string, requiredQty: number, tenantContext: RequestTenantContext): boolean;
    getLowStockProducts(tenantContext: RequestTenantContext, threshold?: number): StockAlert[];
    getStockRecords(tenantContext: RequestTenantContext, query?: StockRecordQueryDto): StockRecord[];
    createSupplier(tenantContext: RequestTenantContext, input: CreateSupplierDto): Supplier;
    listSuppliers(tenantContext: RequestTenantContext): Supplier[];
    createPurchaseOrder(tenantContext: RequestTenantContext, input: CreatePurchaseOrderDto): PurchaseOrder;
    confirmOrder(orderId: string, tenantContext: RequestTenantContext): PurchaseOrder;
    receiveOrder(orderId: string, tenantContext: RequestTenantContext): PurchaseOrder;
    listPurchaseOrders(tenantContext: RequestTenantContext, query?: PurchaseOrderQueryDto): PurchaseOrder[];
    private requireProduct;
    private requirePurchaseOrder;
    private checkProductStock;
    private applyStockChange;
}
//# sourceMappingURL=inventory.service.d.ts.map