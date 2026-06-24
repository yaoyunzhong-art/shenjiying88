"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const inventory_entity_1 = require("./inventory.entity");
const inventory_service_1 = require("./inventory.service");
const tenantCtx = {
    tenantId: 'tenant-001',
    brandId: 'brand-001',
    storeId: 'store-001'
};
(0, node_test_1.describe)('InventoryService — Product CRUD', () => {
    (0, node_test_1.beforeEach)(() => (0, inventory_service_1.resetInventoryServiceTestState)());
    (0, node_test_1.default)('createProduct returns a product with generated id', () => {
        const svc = new inventory_service_1.InventoryService();
        const product = svc.createProduct(tenantCtx, {
            name: 'Bear Plush',
            sku: 'SKU-BP-001',
            unit: 'pcs',
            price: 99,
            cost: 50,
            minStock: 10,
            maxStock: 100,
            currentStock: 50
        });
        strict_1.default.ok(product.id.startsWith('prod-'));
        strict_1.default.equal(product.name, 'Bear Plush');
        strict_1.default.equal(product.status, inventory_entity_1.ProductStatus.Active);
        strict_1.default.equal(product.tenantId, 'tenant-001');
    });
    (0, node_test_1.default)('createProduct respects optional status', () => {
        const svc = new inventory_service_1.InventoryService();
        const product = svc.createProduct(tenantCtx, {
            name: 'Old Toy',
            sku: 'OT-1',
            unit: 'pcs',
            price: 10,
            cost: 3,
            minStock: 0,
            maxStock: 50,
            currentStock: 5,
            status: inventory_entity_1.ProductStatus.Discontinued
        });
        strict_1.default.equal(product.status, inventory_entity_1.ProductStatus.Discontinued);
    });
    (0, node_test_1.default)('getProduct returns the created product', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Ball', sku: 'B-1', unit: 'pcs',
            price: 20, cost: 10, minStock: 5, maxStock: 50, currentStock: 30
        });
        const fetched = svc.getProduct(p.id, tenantCtx);
        strict_1.default.equal(fetched.id, p.id);
        strict_1.default.equal(fetched.name, 'Ball');
    });
    (0, node_test_1.default)('getProduct throws for non-existent product', () => {
        const svc = new inventory_service_1.InventoryService();
        strict_1.default.throws(() => svc.getProduct('nonexistent', tenantCtx), /not found/);
    });
    (0, node_test_1.default)('getProduct throws for product from different tenant', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Isolated', sku: 'ISO-1', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 50
        });
        strict_1.default.throws(() => svc.getProduct(p.id, { tenantId: 'tenant-OTHER' }), /not found/);
    });
    (0, node_test_1.default)('updateProduct modifies allowed fields', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Old Name', sku: 'SKU-OLD', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 20
        });
        const updated = svc.updateProduct(p.id, tenantCtx, {
            name: 'New Name',
            price: 25
        });
        strict_1.default.equal(updated.name, 'New Name');
        strict_1.default.equal(updated.price, 25);
        strict_1.default.equal(updated.sku, 'SKU-OLD'); // unchanged
    });
    (0, node_test_1.default)('updateProduct throws for non-existent product', () => {
        const svc = new inventory_service_1.InventoryService();
        strict_1.default.throws(() => svc.updateProduct('nonexistent', tenantCtx, { name: 'X' }), /not found/);
    });
    (0, node_test_1.default)('listProducts returns all products for tenant', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createProduct(tenantCtx, {
            name: 'A', sku: 'A-1', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
        });
        svc.createProduct(tenantCtx, {
            name: 'B', sku: 'B-1', unit: 'pcs',
            price: 20, cost: 10, minStock: 0, maxStock: 100, currentStock: 20
        });
        const products = svc.listProducts(tenantCtx);
        strict_1.default.equal(products.length, 2);
    });
    (0, node_test_1.default)('listProducts filters by category', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createProduct(tenantCtx, {
            name: 'A', sku: 'A-1', category: 'toys', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
        });
        svc.createProduct(tenantCtx, {
            name: 'B', sku: 'B-1', category: 'food', unit: 'pcs',
            price: 20, cost: 10, minStock: 0, maxStock: 100, currentStock: 20
        });
        const toys = svc.listProducts(tenantCtx, { category: 'toys' });
        strict_1.default.equal(toys.length, 1);
        strict_1.default.equal(toys[0]?.name, 'A');
    });
    (0, node_test_1.default)('listProducts filters by keyword', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createProduct(tenantCtx, {
            name: 'Bear Plush', sku: 'SKU-BP', unit: 'pcs',
            price: 99, cost: 50, minStock: 10, maxStock: 100, currentStock: 50
        });
        svc.createProduct(tenantCtx, {
            name: 'Dinosaur', sku: 'SKU-DN', unit: 'pcs',
            price: 120, cost: 60, minStock: 5, maxStock: 80, currentStock: 30
        });
        const bear = svc.listProducts(tenantCtx, { keyword: 'bear' });
        strict_1.default.equal(bear.length, 1);
        strict_1.default.equal(bear[0]?.name, 'Bear Plush');
    });
    (0, node_test_1.default)('listProducts supports pagination', () => {
        const svc = new inventory_service_1.InventoryService();
        for (let i = 1; i <= 5; i++) {
            svc.createProduct(tenantCtx, {
                name: `Product ${i}`, sku: `SKU-${i}`, unit: 'pcs',
                price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
            });
        }
        const page1 = svc.listProducts(tenantCtx, { limit: 2, offset: 0 });
        strict_1.default.equal(page1.length, 2);
        const page2 = svc.listProducts(tenantCtx, { limit: 2, offset: 2 });
        strict_1.default.equal(page2.length, 2);
    });
    (0, node_test_1.default)('listProducts isolates tenants', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createProduct(tenantCtx, {
            name: 'TenantA', sku: 'TA-1', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 10
        });
        const bProducts = svc.listProducts({ tenantId: 'tenant-B' });
        strict_1.default.equal(bProducts.length, 0);
    });
});
(0, node_test_1.describe)('InventoryService — Stock Operations', () => {
    (0, node_test_1.beforeEach)(() => (0, inventory_service_1.resetInventoryServiceTestState)());
    (0, node_test_1.default)('stockIn increases product stock and creates record', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Plush', sku: 'P-1', unit: 'pcs',
            price: 50, cost: 25, minStock: 5, maxStock: 100, currentStock: 20
        });
        const { product, record } = svc.stockIn(tenantCtx, {
            productId: p.id, quantity: 30, reason: 'restock', batchNo: 'BATCH-001'
        });
        strict_1.default.equal(product.currentStock, 50);
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Inbound);
        strict_1.default.equal(record.beforeStock, 20);
        strict_1.default.equal(record.afterStock, 50);
        strict_1.default.equal(record.batchNo, 'BATCH-001');
    });
    (0, node_test_1.default)('stockOut decreases product stock when sufficient', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Plush', sku: 'P-2', unit: 'pcs',
            price: 50, cost: 25, minStock: 5, maxStock: 100, currentStock: 50
        });
        const { product, record } = svc.stockOut(tenantCtx, {
            productId: p.id, quantity: 15, reason: 'sold'
        });
        strict_1.default.equal(product.currentStock, 35);
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Outbound);
        strict_1.default.equal(record.reason, 'sold');
    });
    (0, node_test_1.default)('stockOut throws when insufficient stock', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Rare Item', sku: 'R-1', unit: 'pcs',
            price: 999, cost: 500, minStock: 1, maxStock: 10, currentStock: 3
        });
        strict_1.default.throws(() => svc.stockOut(tenantCtx, { productId: p.id, quantity: 10 }), /Insufficient stock/);
    });
    (0, node_test_1.default)('adjustStock sets exact quantity regardless of current', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Adjustable', sku: 'ADJ-1', unit: 'pcs',
            price: 100, cost: 50, minStock: 0, maxStock: 200, currentStock: 30
        });
        const { product, record } = svc.adjustStock(tenantCtx, {
            productId: p.id, newQuantity: 100, reason: 'inventory check'
        });
        strict_1.default.equal(product.currentStock, 100);
        strict_1.default.equal(record.type, inventory_entity_1.StockRecordType.Adjustment);
        strict_1.default.equal(record.quantity, 70);
        strict_1.default.equal(record.beforeStock, 30);
        strict_1.default.equal(record.afterStock, 100);
    });
    (0, node_test_1.default)('checkStock returns true when sufficient', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Check', sku: 'CK-1', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 30
        });
        const ok = svc.checkStock(p.id, 20, tenantCtx);
        strict_1.default.equal(ok, true);
    });
    (0, node_test_1.default)('checkStock throws when insufficient', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Check', sku: 'CK-2', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 5
        });
        strict_1.default.throws(() => svc.checkStock(p.id, 20, tenantCtx), /Insufficient stock/);
    });
    (0, node_test_1.default)('getLowStockProducts returns products below minStock', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createProduct(tenantCtx, {
            name: 'Low Stock', sku: 'LOW-1', unit: 'pcs',
            price: 10, cost: 5, minStock: 20, maxStock: 100, currentStock: 5
        });
        svc.createProduct(tenantCtx, {
            name: 'Out of Stock', sku: 'OOS-1', unit: 'pcs',
            price: 15, cost: 7, minStock: 10, maxStock: 50, currentStock: 0
        });
        svc.createProduct(tenantCtx, {
            name: 'Healthy', sku: 'OK-1', unit: 'pcs',
            price: 20, cost: 10, minStock: 5, maxStock: 100, currentStock: 80
        });
        const alerts = svc.getLowStockProducts(tenantCtx);
        strict_1.default.equal(alerts.length, 2);
        const lowAlert = alerts.find((a) => a.product.name === 'Low Stock');
        strict_1.default.equal(lowAlert.status, 'low');
        const oosAlert = alerts.find((a) => a.product.name === 'Out of Stock');
        strict_1.default.equal(oosAlert.status, 'out_of_stock');
    });
    (0, node_test_1.default)('getLowStockProducts accepts custom threshold', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createProduct(tenantCtx, {
            name: 'Custom', sku: 'CUST-1', unit: 'pcs',
            price: 50, cost: 25, minStock: 10, maxStock: 200, currentStock: 40
        });
        // 40 > default minStock (10), so not low by default
        const defaultAlerts = svc.getLowStockProducts(tenantCtx);
        strict_1.default.equal(defaultAlerts.length, 0);
        // But with threshold 50, it IS low
        const customAlerts = svc.getLowStockProducts(tenantCtx, 50);
        strict_1.default.equal(customAlerts.length, 1);
        strict_1.default.equal(customAlerts[0]?.status, 'low');
    });
    (0, node_test_1.default)('getStockRecords returns records filtered by productId and type', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Recorder', sku: 'REC-1', unit: 'pcs',
            price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 20
        });
        svc.stockIn(tenantCtx, { productId: p.id, quantity: 30, reason: 'restock' });
        svc.stockOut(tenantCtx, { productId: p.id, quantity: 10, reason: 'sold' });
        const allRecords = svc.getStockRecords(tenantCtx);
        strict_1.default.equal(allRecords.length, 2);
        const inboundRecords = svc.getStockRecords(tenantCtx, { type: inventory_entity_1.StockRecordType.Inbound });
        strict_1.default.equal(inboundRecords.length, 1);
        const outboundRecords = svc.getStockRecords(tenantCtx, { type: inventory_entity_1.StockRecordType.Outbound });
        strict_1.default.equal(outboundRecords.length, 1);
    });
});
(0, node_test_1.describe)('InventoryService — Supplier CRUD', () => {
    (0, node_test_1.beforeEach)(() => (0, inventory_service_1.resetInventoryServiceTestState)());
    (0, node_test_1.default)('createSupplier creates with generated id', () => {
        const svc = new inventory_service_1.InventoryService();
        const supplier = svc.createSupplier(tenantCtx, {
            name: 'Toy Factory',
            contactName: 'Zhang San',
            phone: '13800138000'
        });
        strict_1.default.ok(supplier.id.startsWith('supplier-'));
        strict_1.default.equal(supplier.name, 'Toy Factory');
        strict_1.default.equal(supplier.tenantId, 'tenant-001');
    });
    (0, node_test_1.default)('listSuppliers returns all for tenant', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createSupplier(tenantCtx, { name: 'Supplier A' });
        svc.createSupplier(tenantCtx, { name: 'Supplier B' });
        const suppliers = svc.listSuppliers(tenantCtx);
        strict_1.default.equal(suppliers.length, 2);
        const names = suppliers.map((s) => s.name).sort();
        strict_1.default.deepEqual(names, ['Supplier A', 'Supplier B']);
    });
    (0, node_test_1.default)('listSuppliers isolates tenants', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createSupplier(tenantCtx, { name: 'Only A' });
        const bSuppliers = svc.listSuppliers({ tenantId: 'tenant-B' });
        strict_1.default.equal(bSuppliers.length, 0);
    });
});
(0, node_test_1.describe)('InventoryService — Purchase Orders', () => {
    (0, node_test_1.beforeEach)(() => (0, inventory_service_1.resetInventoryServiceTestState)());
    (0, node_test_1.default)('createPurchaseOrder creates in Draft status', () => {
        const svc = new inventory_service_1.InventoryService();
        const order = svc.createPurchaseOrder(tenantCtx, {
            supplierId: 's-1',
            items: [{
                    productId: 'p-1', productName: 'Ball', sku: 'B-1',
                    quantity: 10, unitPrice: 15, totalPrice: 150
                }],
            totalAmount: 150
        });
        strict_1.default.ok(order.id.startsWith('po-'));
        strict_1.default.equal(order.status, inventory_entity_1.PurchaseOrderStatus.Draft);
        strict_1.default.equal(order.items.length, 1);
        strict_1.default.equal(order.items[0]?.quantity, 10);
    });
    (0, node_test_1.default)('confirmOrder transitions Draft to Confirmed', () => {
        const svc = new inventory_service_1.InventoryService();
        const order = svc.createPurchaseOrder(tenantCtx, {
            items: [{
                    productId: 'p-1', productName: 'Ball', sku: 'B-1',
                    quantity: 5, unitPrice: 10, totalPrice: 50
                }],
            totalAmount: 50
        });
        const confirmed = svc.confirmOrder(order.id, tenantCtx);
        strict_1.default.equal(confirmed.status, inventory_entity_1.PurchaseOrderStatus.Confirmed);
        strict_1.default.ok(confirmed.orderedAt);
    });
    (0, node_test_1.default)('confirmOrder rejects non-Draft/Submitted status', () => {
        const svc = new inventory_service_1.InventoryService();
        const order = svc.createPurchaseOrder(tenantCtx, {
            items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
            totalAmount: 1
        });
        svc.confirmOrder(order.id, tenantCtx);
        // Already confirmed
        strict_1.default.throws(() => svc.confirmOrder(order.id, tenantCtx), /cannot be confirmed/);
    });
    (0, node_test_1.default)('receiveOrder transitions Confirmed to Received and stocks-in items', () => {
        const svc = new inventory_service_1.InventoryService();
        const p = svc.createProduct(tenantCtx, {
            name: 'Ball', sku: 'B-1', unit: 'pcs',
            price: 15, cost: 8, minStock: 0, maxStock: 100, currentStock: 0
        });
        const order = svc.createPurchaseOrder(tenantCtx, {
            items: [{
                    productId: p.id, productName: 'Ball', sku: 'B-1',
                    quantity: 20, unitPrice: 8, totalPrice: 160
                }],
            totalAmount: 160
        });
        svc.confirmOrder(order.id, tenantCtx);
        const received = svc.receiveOrder(order.id, tenantCtx);
        strict_1.default.equal(received.status, inventory_entity_1.PurchaseOrderStatus.Received);
        strict_1.default.ok(received.receivedAt);
        // Product stock should have increased
        const updatedProduct = svc.getProduct(p.id, tenantCtx);
        strict_1.default.equal(updatedProduct.currentStock, 20);
    });
    (0, node_test_1.default)('receiveOrder rejects non-Confirmed status', () => {
        const svc = new inventory_service_1.InventoryService();
        const order = svc.createPurchaseOrder(tenantCtx, {
            items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
            totalAmount: 1
        });
        strict_1.default.throws(() => svc.receiveOrder(order.id, tenantCtx), /must be confirmed before receiving/);
    });
    (0, node_test_1.default)('listPurchaseOrders filters by status and supplier', () => {
        const svc = new inventory_service_1.InventoryService();
        const o1 = svc.createPurchaseOrder(tenantCtx, {
            supplierId: 's-A',
            items: [{ productId: 'p-1', productName: 'A', sku: 'A-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
            totalAmount: 1
        });
        svc.createPurchaseOrder(tenantCtx, {
            supplierId: 's-B',
            items: [{ productId: 'p-2', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
            totalAmount: 1
        });
        svc.confirmOrder(o1.id, tenantCtx);
        const draftOrders = svc.listPurchaseOrders(tenantCtx, { status: inventory_entity_1.PurchaseOrderStatus.Draft });
        strict_1.default.equal(draftOrders.length, 1);
        const confirmedOrders = svc.listPurchaseOrders(tenantCtx, { status: inventory_entity_1.PurchaseOrderStatus.Confirmed });
        strict_1.default.equal(confirmedOrders.length, 1);
        const supplierA = svc.listPurchaseOrders(tenantCtx, { supplierId: 's-A' });
        strict_1.default.equal(supplierA.length, 1);
    });
    (0, node_test_1.default)('listPurchaseOrders isolates tenants', () => {
        const svc = new inventory_service_1.InventoryService();
        svc.createPurchaseOrder(tenantCtx, {
            items: [{ productId: 'p-1', productName: 'A', sku: 'A-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
            totalAmount: 1
        });
        const bOrders = svc.listPurchaseOrders({ tenantId: 'tenant-B' });
        strict_1.default.equal(bOrders.length, 0);
    });
});
//# sourceMappingURL=inventory.service.test.js.map