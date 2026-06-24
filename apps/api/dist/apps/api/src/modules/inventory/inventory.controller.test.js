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
const { InventoryController } = require('./inventory.controller');
const { InventoryService, resetInventoryServiceTestState } = require('./inventory.service');
function makeController(overrides = {}) {
    const service = {
        createProduct: overrides.createProduct ?? (() => ({ id: 'prod-1' })),
        updateProduct: overrides.updateProduct ?? (() => ({ id: 'prod-1' })),
        getProduct: overrides.getProduct ?? (() => ({ id: 'prod-1' })),
        listProducts: overrides.listProducts ?? (() => []),
        stockIn: overrides.stockIn ?? (() => ({ product: {}, record: {} })),
        stockOut: overrides.stockOut ?? (() => ({ product: {}, record: {} })),
        adjustStock: overrides.adjustStock ?? (() => ({ product: {}, record: {} })),
        checkStock: overrides.checkStock ?? (() => true),
        getLowStockProducts: overrides.getLowStockProducts ?? (() => []),
        getStockRecords: overrides.getStockRecords ?? (() => []),
        createSupplier: overrides.createSupplier ?? (() => ({ id: 's-1' })),
        listSuppliers: overrides.listSuppliers ?? (() => []),
        createPurchaseOrder: overrides.createPurchaseOrder ?? (() => ({ id: 'po-1' })),
        confirmOrder: overrides.confirmOrder ?? (() => ({ id: 'po-1', status: 'confirmed' })),
        receiveOrder: overrides.receiveOrder ?? (() => ({ id: 'po-1', status: 'received' })),
        listPurchaseOrders: overrides.listPurchaseOrders ?? (() => [])
    };
    return new InventoryController(service);
}
const tenantCtx = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1' };
(0, node_test_1.describe)('InventoryController — Route metadata', () => {
    (0, node_test_1.default)('controller path is inventory', () => {
        const path = Reflect.getMetadata('path', InventoryController);
        strict_1.default.equal(path, 'inventory');
    });
    (0, node_test_1.default)('createProduct POST products', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.createProduct);
        const path = Reflect.getMetadata('path', InventoryController.prototype.createProduct);
        strict_1.default.equal(method, 1); // 0=GET, 1=POST
        strict_1.default.equal(path, 'products');
    });
    (0, node_test_1.default)('updateProduct PUT products/:productId', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.updateProduct);
        const path = Reflect.getMetadata('path', InventoryController.prototype.updateProduct);
        strict_1.default.equal(method, 2); // 2=PUT
        strict_1.default.equal(path, 'products/:productId');
    });
    (0, node_test_1.default)('getProduct GET products/:productId', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.getProduct);
        const path = Reflect.getMetadata('path', InventoryController.prototype.getProduct);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'products/:productId');
    });
    (0, node_test_1.default)('listProducts GET products', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.listProducts);
        const path = Reflect.getMetadata('path', InventoryController.prototype.listProducts);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'products');
    });
    (0, node_test_1.default)('stockIn POST stock/in', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.stockIn);
        const path = Reflect.getMetadata('path', InventoryController.prototype.stockIn);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'stock/in');
    });
    (0, node_test_1.default)('stockOut POST stock/out', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.stockOut);
        const path = Reflect.getMetadata('path', InventoryController.prototype.stockOut);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'stock/out');
    });
    (0, node_test_1.default)('adjustStock POST stock/adjust', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.adjustStock);
        const path = Reflect.getMetadata('path', InventoryController.prototype.adjustStock);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'stock/adjust');
    });
    (0, node_test_1.default)('checkStock GET stock/check/:productId', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.checkStock);
        const path = Reflect.getMetadata('path', InventoryController.prototype.checkStock);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'stock/check/:productId');
    });
    (0, node_test_1.default)('getLowStockProducts GET stock/low-products', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.getLowStockProducts);
        const path = Reflect.getMetadata('path', InventoryController.prototype.getLowStockProducts);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'stock/low-products');
    });
    (0, node_test_1.default)('getStockRecords GET stock/records', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.getStockRecords);
        const path = Reflect.getMetadata('path', InventoryController.prototype.getStockRecords);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'stock/records');
    });
    (0, node_test_1.default)('createSupplier POST suppliers', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.createSupplier);
        const path = Reflect.getMetadata('path', InventoryController.prototype.createSupplier);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'suppliers');
    });
    (0, node_test_1.default)('listSuppliers GET suppliers', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.listSuppliers);
        const path = Reflect.getMetadata('path', InventoryController.prototype.listSuppliers);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'suppliers');
    });
    (0, node_test_1.default)('createPurchaseOrder POST purchase-orders', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.createPurchaseOrder);
        const path = Reflect.getMetadata('path', InventoryController.prototype.createPurchaseOrder);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'purchase-orders');
    });
    (0, node_test_1.default)('confirmOrder POST purchase-orders/:orderId/confirm', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.confirmOrder);
        const path = Reflect.getMetadata('path', InventoryController.prototype.confirmOrder);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'purchase-orders/:orderId/confirm');
    });
    (0, node_test_1.default)('receiveOrder POST purchase-orders/:orderId/receive', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.receiveOrder);
        const path = Reflect.getMetadata('path', InventoryController.prototype.receiveOrder);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'purchase-orders/:orderId/receive');
    });
    (0, node_test_1.default)('listPurchaseOrders GET purchase-orders', () => {
        const method = Reflect.getMetadata('method', InventoryController.prototype.listPurchaseOrders);
        const path = Reflect.getMetadata('path', InventoryController.prototype.listPurchaseOrders);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'purchase-orders');
    });
});
(0, node_test_1.describe)('InventoryController — Delegation', () => {
    (0, node_test_1.default)('createProduct delegates to service with tenant context and body', () => {
        let captured = null;
        const ctrl = makeController({
            createProduct: (ctx, body) => {
                captured = { ctx, body };
                return { id: 'prod-1' };
            }
        });
        const body = { name: 'Test', sku: 'T-1', unit: 'pcs', price: 10, cost: 5, minStock: 0, maxStock: 100, currentStock: 20 };
        const result = ctrl.createProduct(tenantCtx, body);
        strict_1.default.equal(result.id, 'prod-1');
        strict_1.default.equal(captured.ctx.tenantId, 't-1');
        strict_1.default.equal(captured.body.name, 'Test');
    });
    (0, node_test_1.default)('updateProduct delegates with productId param', () => {
        let captured = null;
        const ctrl = makeController({
            updateProduct: (id, ctx, body) => {
                captured = { id, ctx, body };
                return { id };
            }
        });
        const result = ctrl.updateProduct('prod-X', tenantCtx, { name: 'Updated' });
        strict_1.default.equal(result.id, 'prod-X');
        strict_1.default.equal(captured.id, 'prod-X');
    });
    (0, node_test_1.default)('getProduct delegates with productId', () => {
        const ctrl = makeController({
            getProduct: (id) => ({ id })
        });
        const result = ctrl.getProduct('prod-P', tenantCtx);
        strict_1.default.equal(result.id, 'prod-P');
    });
    (0, node_test_1.default)('listProducts delegates with query', () => {
        let captured = null;
        const ctrl = makeController({
            listProducts: (ctx, query) => {
                captured = { ctx, query };
                return [{ id: 'p-1' }];
            }
        });
        const query = { category: 'toys', limit: 10 };
        const result = ctrl.listProducts(tenantCtx, query);
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(captured.query.category, 'toys');
    });
    (0, node_test_1.default)('stockIn delegates with tenant context and body', () => {
        let captured = null;
        const ctrl = makeController({
            stockIn: (ctx, body) => {
                captured = { ctx, body };
                return { product: { id: body.productId }, record: {} };
            }
        });
        const result = ctrl.stockIn(tenantCtx, { productId: 'p-1', quantity: 5 });
        strict_1.default.equal(result.product.id, 'p-1');
        strict_1.default.equal(captured.body.quantity, 5);
    });
    (0, node_test_1.default)('stockOut delegates with tenant context and body', () => {
        const ctrl = makeController({
            stockOut: () => ({ product: { currentStock: 40 }, record: {} })
        });
        const result = ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 10 });
        strict_1.default.equal(result.product.currentStock, 40);
    });
    (0, node_test_1.default)('getLowStockProducts delegates with optional threshold', () => {
        let capturedThreshold = undefined;
        const ctrl = makeController({
            getLowStockProducts: (_ctx, threshold) => {
                capturedThreshold = threshold;
                return [];
            }
        });
        ctrl.getLowStockProducts(tenantCtx, undefined);
        strict_1.default.equal(capturedThreshold, undefined);
        ctrl.getLowStockProducts(tenantCtx, '30');
        strict_1.default.equal(capturedThreshold, 30);
    });
    (0, node_test_1.default)('checkStock delegates with productId and qty', () => {
        const ctrl = makeController({
            checkStock: (_id, qty) => qty <= 50
        });
        const result = ctrl.checkStock('p-1', '30', tenantCtx);
        strict_1.default.deepEqual(result, { productId: 'p-1', requiredQty: 30, sufficient: true });
        const result2 = ctrl.checkStock('p-1', '100', tenantCtx);
        strict_1.default.deepEqual(result2, { productId: 'p-1', requiredQty: 100, sufficient: false });
    });
    (0, node_test_1.default)('createSupplier delegates', () => {
        const ctrl = makeController({
            createSupplier: () => ({ id: 's-new', name: 'Acme' })
        });
        const result = ctrl.createSupplier(tenantCtx, { name: 'Acme' });
        strict_1.default.equal(result.id, 's-new');
    });
    (0, node_test_1.default)('listSuppliers delegates', () => {
        const ctrl = makeController({
            listSuppliers: () => [{ id: 's-1' }, { id: 's-2' }]
        });
        const result = ctrl.listSuppliers(tenantCtx);
        strict_1.default.equal(result.length, 2);
    });
    (0, node_test_1.default)('createPurchaseOrder delegates', () => {
        const ctrl = makeController({
            createPurchaseOrder: () => ({ id: 'po-new', status: 'draft' })
        });
        const result = ctrl.createPurchaseOrder(tenantCtx, {
            items: [{ productId: 'p-1', productName: 'B', sku: 'B-1', quantity: 1, unitPrice: 1, totalPrice: 1 }],
            totalAmount: 1
        });
        strict_1.default.equal(result.id, 'po-new');
    });
    (0, node_test_1.default)('confirmOrder delegates with orderId', () => {
        let capturedId = null;
        const ctrl = makeController({
            confirmOrder: (id) => { capturedId = id; return { id, status: 'confirmed' }; }
        });
        const result = ctrl.confirmOrder('po-abc', tenantCtx);
        strict_1.default.equal(result.status, 'confirmed');
        strict_1.default.equal(capturedId, 'po-abc');
    });
    (0, node_test_1.default)('receiveOrder delegates with orderId', () => {
        const ctrl = makeController({
            receiveOrder: (id) => ({ id, status: 'received' })
        });
        const result = ctrl.receiveOrder('po-xyz', tenantCtx);
        strict_1.default.equal(result.status, 'received');
    });
    (0, node_test_1.default)('listPurchaseOrders delegates with query', () => {
        let capturedQuery = null;
        const ctrl = makeController({
            listPurchaseOrders: (_ctx, query) => { capturedQuery = query; return []; }
        });
        ctrl.listPurchaseOrders(tenantCtx, { status: 'draft' });
        strict_1.default.equal(capturedQuery.status, 'draft');
    });
});
(0, node_test_1.describe)('InventoryController — Error propagation', () => {
    (0, node_test_1.default)('getProduct propagates service error', () => {
        const ctrl = makeController({
            getProduct: () => { throw new Error('Product not found'); }
        });
        strict_1.default.throws(() => ctrl.getProduct('bad-id', tenantCtx), /Product not found/);
    });
    (0, node_test_1.default)('stockOut propagates insufficient stock error', () => {
        const ctrl = makeController({
            stockOut: () => { throw new Error('Insufficient stock'); }
        });
        strict_1.default.throws(() => ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 999 }), /Insufficient stock/);
    });
    (0, node_test_1.default)('confirmOrder propagates invalid transition error', () => {
        const ctrl = makeController({
            confirmOrder: () => { throw new Error('cannot be confirmed'); }
        });
        strict_1.default.throws(() => ctrl.confirmOrder('po-bad', tenantCtx), /cannot be confirmed/);
    });
});
//# sourceMappingURL=inventory.controller.test.js.map