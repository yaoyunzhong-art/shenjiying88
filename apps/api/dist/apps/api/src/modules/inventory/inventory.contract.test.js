"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const inventory_contract_1 = require("./inventory.contract");
const inventory_entity_1 = require("./inventory.entity");
/* ------------------------------------------------------------------ */
/*  toProductContract                                                  */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toProductContract maps full product correctly', () => {
    const product = {
        id: 'prod-123',
        tenantId: 't-1',
        brandId: 'b-1',
        storeId: 's-1',
        name: 'Test Product',
        sku: 'TP-001',
        category: 'Electronics',
        unit: 'pcs',
        price: 99.99,
        cost: 50.0,
        minStock: 10,
        maxStock: 100,
        currentStock: 50,
        status: inventory_entity_1.ProductStatus.Active,
        imageUrl: 'https://example.com/img.jpg',
        barcode: '123456789',
        createdAt: '2026-06-23T08:00:00.000Z',
        updatedAt: '2026-06-23T08:30:00.000Z',
    };
    const contract = (0, inventory_contract_1.toProductContract)(product);
    strict_1.default.equal(contract.id, 'prod-123');
    strict_1.default.equal(contract.tenantId, 't-1');
    strict_1.default.equal(contract.name, 'Test Product');
    strict_1.default.equal(contract.sku, 'TP-001');
    strict_1.default.equal(contract.category, 'Electronics');
    strict_1.default.equal(contract.price, 99.99);
    strict_1.default.equal(contract.currentStock, 50);
    strict_1.default.equal(contract.status, inventory_entity_1.ProductStatus.Active);
    strict_1.default.equal(contract.createdAt, '2026-06-23T08:00:00.000Z');
});
(0, node_test_1.default)('toProductContract maps product with minimal fields', () => {
    const product = {
        id: 'prod-456',
        tenantId: 't-2',
        name: 'Minimal Product',
        sku: 'MP-001',
        unit: 'kg',
        price: 10,
        cost: 5,
        minStock: 1,
        maxStock: 50,
        currentStock: 25,
        status: inventory_entity_1.ProductStatus.Active,
        createdAt: '2026-06-23T08:00:00.000Z',
        updatedAt: '2026-06-23T08:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toProductContract)(product);
    strict_1.default.equal(contract.id, 'prod-456');
    strict_1.default.equal(contract.tenantId, 't-2');
    strict_1.default.equal(contract.brandId, undefined);
    strict_1.default.equal(contract.storeId, undefined);
    strict_1.default.equal(contract.category, undefined);
});
(0, node_test_1.default)('toProductContract maps discontinued status correctly', () => {
    const product = {
        id: 'prod-789',
        tenantId: 't-1',
        name: 'Discontinued Product',
        sku: 'DP-001',
        unit: 'box',
        price: 0,
        cost: 0,
        minStock: 0,
        maxStock: 0,
        currentStock: 0,
        status: inventory_entity_1.ProductStatus.Discontinued,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toProductContract)(product);
    strict_1.default.equal(contract.status, inventory_entity_1.ProductStatus.Discontinued);
    strict_1.default.equal(contract.currentStock, 0);
});
/* ------------------------------------------------------------------ */
/*  toStockRecordContract                                              */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toStockRecordContract maps inbound record correctly', () => {
    const record = {
        id: 'sr-001',
        productId: 'prod-123',
        storeId: 's-1',
        type: inventory_entity_1.StockRecordType.Inbound,
        quantity: 10,
        beforeStock: 40,
        afterStock: 50,
        reason: '进货补货',
        operatorId: 'op-1',
        batchNo: 'BATCH-001',
        createdAt: '2026-06-23T08:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toStockRecordContract)(record);
    strict_1.default.equal(contract.id, 'sr-001');
    strict_1.default.equal(contract.productId, 'prod-123');
    strict_1.default.equal(contract.type, inventory_entity_1.StockRecordType.Inbound);
    strict_1.default.equal(contract.quantity, 10);
    strict_1.default.equal(contract.beforeStock, 40);
    strict_1.default.equal(contract.afterStock, 50);
    strict_1.default.equal(contract.reason, '进货补货');
    strict_1.default.equal(contract.createdAt, '2026-06-23T08:00:00.000Z');
});
(0, node_test_1.default)('toStockRecordContract maps outbound record correctly', () => {
    const record = {
        id: 'sr-002',
        productId: 'prod-123',
        storeId: 's-1',
        type: inventory_entity_1.StockRecordType.Outbound,
        quantity: 5,
        beforeStock: 50,
        afterStock: 45,
        createdAt: '2026-06-23T09:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toStockRecordContract)(record);
    strict_1.default.equal(contract.type, inventory_entity_1.StockRecordType.Outbound);
    strict_1.default.equal(contract.quantity, 5);
    strict_1.default.equal(contract.reason, undefined);
});
(0, node_test_1.default)('toStockRecordContract maps adjustment record correctly', () => {
    const record = {
        id: 'sr-003',
        productId: 'prod-456',
        type: inventory_entity_1.StockRecordType.Adjustment,
        quantity: 10,
        beforeStock: 35,
        afterStock: 25,
        reason: '盘点调整',
        createdAt: '2026-06-23T10:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toStockRecordContract)(record);
    strict_1.default.equal(contract.type, inventory_entity_1.StockRecordType.Adjustment);
    strict_1.default.equal(contract.quantity, 10);
    strict_1.default.equal(contract.beforeStock, 35);
    strict_1.default.equal(contract.afterStock, 25);
});
(0, node_test_1.default)('toStockRecordContract maps return record correctly', () => {
    const record = {
        id: 'sr-004',
        productId: 'prod-789',
        type: inventory_entity_1.StockRecordType.Return,
        quantity: 2,
        beforeStock: 10,
        afterStock: 12,
        reason: '退货入库',
        createdAt: '2026-06-23T11:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toStockRecordContract)(record);
    strict_1.default.equal(contract.type, inventory_entity_1.StockRecordType.Return);
    strict_1.default.equal(contract.quantity, 2);
});
/* ------------------------------------------------------------------ */
/*  toSupplierContract                                                 */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toSupplierContract maps full supplier correctly', () => {
    const supplier = {
        id: 'supplier-001',
        tenantId: 't-1',
        name: 'Test Supplier Co.',
        contactName: '张三',
        phone: '13800138000',
        email: 'zhangsan@supplier.com',
        address: '北京市朝阳区',
        createdAt: '2026-01-01T00:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toSupplierContract)(supplier);
    strict_1.default.equal(contract.id, 'supplier-001');
    strict_1.default.equal(contract.name, 'Test Supplier Co.');
    strict_1.default.equal(contract.contactName, '张三');
    strict_1.default.equal(contract.phone, '13800138000');
    strict_1.default.equal(contract.email, 'zhangsan@supplier.com');
});
(0, node_test_1.default)('toSupplierContract maps minimal supplier correctly', () => {
    const supplier = {
        id: 'supplier-002',
        tenantId: 't-2',
        name: 'Minimal Supplier',
        createdAt: '2026-02-01T00:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toSupplierContract)(supplier);
    strict_1.default.equal(contract.name, 'Minimal Supplier');
    strict_1.default.equal(contract.contactName, undefined);
    strict_1.default.equal(contract.phone, undefined);
    strict_1.default.equal(contract.email, undefined);
});
/* ------------------------------------------------------------------ */
/*  toPurchaseOrderContract                                            */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toPurchaseOrderContract maps draft order correctly', () => {
    const order = {
        id: 'po-001',
        tenantId: 't-1',
        storeId: 's-1',
        supplierId: 'supplier-001',
        status: inventory_entity_1.PurchaseOrderStatus.Draft,
        items: [
            {
                productId: 'prod-1',
                productName: 'Item A',
                sku: 'A-001',
                quantity: 10,
                unitPrice: 50,
                totalPrice: 500,
            },
            {
                productId: 'prod-2',
                productName: 'Item B',
                sku: 'B-001',
                quantity: 5,
                unitPrice: 100,
                totalPrice: 500,
            },
        ],
        totalAmount: 1000,
        createdAt: '2026-06-23T08:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toPurchaseOrderContract)(order);
    strict_1.default.equal(contract.id, 'po-001');
    strict_1.default.equal(contract.status, inventory_entity_1.PurchaseOrderStatus.Draft);
    strict_1.default.equal(contract.itemCount, 2);
    strict_1.default.equal(contract.totalAmount, 1000);
    strict_1.default.equal(contract.receivedAt, undefined);
});
(0, node_test_1.default)('toPurchaseOrderContract maps received order with receivedAt', () => {
    const order = {
        id: 'po-002',
        tenantId: 't-1',
        storeId: 's-1',
        supplierId: 'supplier-001',
        status: inventory_entity_1.PurchaseOrderStatus.Received,
        items: [
            {
                productId: 'prod-1',
                productName: 'Item A',
                sku: 'A-001',
                quantity: 10,
                unitPrice: 50,
                totalPrice: 500,
            },
        ],
        totalAmount: 500,
        createdAt: '2026-06-22T08:00:00.000Z',
        receivedAt: '2026-06-23T08:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toPurchaseOrderContract)(order);
    strict_1.default.equal(contract.status, inventory_entity_1.PurchaseOrderStatus.Received);
    strict_1.default.equal(contract.itemCount, 1);
    strict_1.default.equal(contract.receivedAt, '2026-06-23T08:00:00.000Z');
});
(0, node_test_1.default)('toPurchaseOrderContract maps cancelled order', () => {
    const order = {
        id: 'po-003',
        tenantId: 't-1',
        status: inventory_entity_1.PurchaseOrderStatus.Cancelled,
        items: [],
        totalAmount: 0,
        createdAt: '2026-06-20T00:00:00.000Z',
    };
    const contract = (0, inventory_contract_1.toPurchaseOrderContract)(order);
    strict_1.default.equal(contract.status, inventory_entity_1.PurchaseOrderStatus.Cancelled);
    strict_1.default.equal(contract.itemCount, 0);
    strict_1.default.equal(contract.totalAmount, 0);
});
/* ------------------------------------------------------------------ */
/*  toStockAlertContract                                               */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toStockAlertContract maps low stock alert correctly', () => {
    const product = {
        id: 'prod-123',
        tenantId: 't-1',
        name: 'Low Stock Item',
        sku: 'LS-001',
        unit: 'pcs',
        price: 20,
        cost: 10,
        minStock: 10,
        maxStock: 100,
        currentStock: 3,
        status: inventory_entity_1.ProductStatus.Active,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z',
    };
    const alert = {
        product,
        currentStock: 3,
        minStock: 10,
        maxStock: 100,
        status: 'low',
    };
    const contract = (0, inventory_contract_1.toStockAlertContract)(alert);
    strict_1.default.equal(contract.productId, 'prod-123');
    strict_1.default.equal(contract.productName, 'Low Stock Item');
    strict_1.default.equal(contract.sku, 'LS-001');
    strict_1.default.equal(contract.currentStock, 3);
    strict_1.default.equal(contract.minStock, 10);
    strict_1.default.equal(contract.status, 'low');
});
(0, node_test_1.default)('toStockAlertContract maps out of stock alert correctly', () => {
    const product = {
        id: 'prod-456',
        tenantId: 't-1',
        name: 'Out of Stock Item',
        sku: 'OS-001',
        unit: 'pcs',
        price: 15,
        cost: 8,
        minStock: 5,
        maxStock: 50,
        currentStock: 0,
        status: inventory_entity_1.ProductStatus.Active,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z',
    };
    const alert = {
        product,
        currentStock: 0,
        minStock: 5,
        maxStock: 50,
        status: 'out_of_stock',
    };
    const contract = (0, inventory_contract_1.toStockAlertContract)(alert);
    strict_1.default.equal(contract.currentStock, 0);
    strict_1.default.equal(contract.status, 'out_of_stock');
});
(0, node_test_1.default)('toStockAlertContract maps overstock alert correctly', () => {
    const product = {
        id: 'prod-789',
        tenantId: 't-1',
        name: 'Overstock Item',
        sku: 'OS-002',
        unit: 'pcs',
        price: 30,
        cost: 15,
        minStock: 10,
        maxStock: 50,
        currentStock: 120,
        status: inventory_entity_1.ProductStatus.Active,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-06-23T00:00:00.000Z',
    };
    const alert = {
        product,
        currentStock: 120,
        minStock: 10,
        maxStock: 50,
        status: 'overstock',
    };
    const contract = (0, inventory_contract_1.toStockAlertContract)(alert);
    strict_1.default.equal(contract.currentStock, 120);
    strict_1.default.equal(contract.maxStock, 50);
    strict_1.default.equal(contract.status, 'overstock');
});
/* ------------------------------------------------------------------ */
/*  isStockSufficient                                                  */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('isStockSufficient returns true when stock >= required', () => {
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(50, 10), true);
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(10, 10), true);
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(100, 0), true);
});
(0, node_test_1.default)('isStockSufficient returns false when stock < required', () => {
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(5, 10), false);
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(0, 1), false);
});
(0, node_test_1.default)('isStockSufficient handles boundary values', () => {
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(0, 0), true);
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(1, 1), true);
    strict_1.default.equal((0, inventory_contract_1.isStockSufficient)(100, 101), false);
});
//# sourceMappingURL=inventory.contract.test.js.map