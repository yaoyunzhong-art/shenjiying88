import type { RequestTenantContext } from '../tenant/tenant.types';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, StockInDto, StockOutDto, AdjustStockDto, StockRecordQueryDto, CreateSupplierDto, CreatePurchaseOrderDto, PurchaseOrderQueryDto } from './inventory.dto';
import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    createProduct(tenantContext: RequestTenantContext, body: CreateProductDto): import("./inventory.entity").Product;
    updateProduct(productId: string, tenantContext: RequestTenantContext, body: UpdateProductDto): import("./inventory.entity").Product;
    getProduct(productId: string, tenantContext: RequestTenantContext): import("./inventory.entity").Product;
    listProducts(tenantContext: RequestTenantContext, query?: ProductQueryDto): import("./inventory.entity").Product[];
    stockIn(tenantContext: RequestTenantContext, body: StockInDto): {
        product: import("./inventory.entity").Product;
        record: import("./inventory.entity").StockRecord;
    };
    stockOut(tenantContext: RequestTenantContext, body: StockOutDto): {
        product: import("./inventory.entity").Product;
        record: import("./inventory.entity").StockRecord;
    };
    adjustStock(tenantContext: RequestTenantContext, body: AdjustStockDto): {
        product: import("./inventory.entity").Product;
        record: import("./inventory.entity").StockRecord;
    };
    checkStock(productId: string, qty: string, tenantContext: RequestTenantContext): {
        productId: string;
        requiredQty: number;
        sufficient: boolean;
    };
    getLowStockProducts(tenantContext: RequestTenantContext, threshold?: string): import("./inventory.entity").StockAlert[];
    getStockRecords(tenantContext: RequestTenantContext, query?: StockRecordQueryDto): import("./inventory.entity").StockRecord[];
    createSupplier(tenantContext: RequestTenantContext, body: CreateSupplierDto): import("./inventory.entity").Supplier;
    listSuppliers(tenantContext: RequestTenantContext): import("./inventory.entity").Supplier[];
    createPurchaseOrder(tenantContext: RequestTenantContext, body: CreatePurchaseOrderDto): import("./inventory.entity").PurchaseOrder;
    confirmOrder(orderId: string, tenantContext: RequestTenantContext): import("./inventory.entity").PurchaseOrder;
    receiveOrder(orderId: string, tenantContext: RequestTenantContext): import("./inventory.entity").PurchaseOrder;
    listPurchaseOrders(tenantContext: RequestTenantContext, query?: PurchaseOrderQueryDto): import("./inventory.entity").PurchaseOrder[];
}
//# sourceMappingURL=inventory.controller.d.ts.map