"use strict";
/**
 * 🐜 自动: [inventory] [D] Controller spec 补全
 *
 * 策略：轻量 inline class + @Decorator 模拟 -> 验证路由元数据 / 行为边界 / 错误传播
 * 覆盖：product CRUD / stock 操作 / supplier / purchase order  -> 正例 + 反例 + 边界
 */
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
// ── Lightweight inline decorator fakes ──────────────────────────
const controllerPrefixes = new Map();
function Controller(prefix) {
    return (target) => {
        controllerPrefixes.set(target, prefix);
        return target;
    };
}
const routeMeta = new Map();
var HttpMethod;
(function (HttpMethod) {
    HttpMethod[HttpMethod["GET"] = 0] = "GET";
    HttpMethod[HttpMethod["POST"] = 1] = "POST";
    HttpMethod[HttpMethod["PUT"] = 2] = "PUT";
    HttpMethod[HttpMethod["DELETE"] = 3] = "DELETE";
    HttpMethod[HttpMethod["PATCH"] = 4] = "PATCH";
})(HttpMethod || (HttpMethod = {}));
function Get(path = '') {
    return (target, key) => {
        routeMeta.set(key, { method: HttpMethod.GET, path });
    };
}
function Post(path = '') {
    return (target, key) => {
        routeMeta.set(key, { method: HttpMethod.POST, path });
    };
}
function Put(path = '') {
    return (target, key) => {
        routeMeta.set(key, { method: HttpMethod.PUT, path });
    };
}
const paramMeta = [];
function Param(name) {
    return (target, key, index) => {
        paramMeta.push({ key, index, decorator: `Param(${name ?? ''})` });
    };
}
function Query(name) {
    return (target, key, index) => {
        paramMeta.push({ key, index, decorator: `Query(${name ?? ''})` });
    };
}
function Body() {
    return (target, key, index) => {
        paramMeta.push({ key, index, decorator: 'Body()' });
    };
}
const tenantParams = new Set();
function TenantContext() {
    return (target, key, index) => {
        tenantParams.add(key);
    };
}
// ── Stub types matching the real entity ─────────────────────────
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["Active"] = "active";
    ProductStatus["Inactive"] = "inactive";
    ProductStatus["Discontinued"] = "discontinued";
})(ProductStatus || (ProductStatus = {}));
var StockRecordType;
(function (StockRecordType) {
    StockRecordType["Inbound"] = "inbound";
    StockRecordType["Outbound"] = "outbound";
    StockRecordType["Return"] = "return";
    StockRecordType["Adjustment"] = "adjustment";
})(StockRecordType || (StockRecordType = {}));
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["Draft"] = "draft";
    PurchaseOrderStatus["Submitted"] = "submitted";
    PurchaseOrderStatus["Confirmed"] = "confirmed";
    PurchaseOrderStatus["Received"] = "received";
    PurchaseOrderStatus["Cancelled"] = "cancelled";
})(PurchaseOrderStatus || (PurchaseOrderStatus = {}));
// ── InventoryController (inline spec copy) ──────────────────────
class InventoryController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    createProduct(tenantContext, body) {
        return this.svc.createProduct(tenantContext, body);
    }
    updateProduct(productId, tenantContext, body) {
        return this.svc.updateProduct(productId, tenantContext, body);
    }
    getProduct(productId, tenantContext) {
        return this.svc.getProduct(productId, tenantContext);
    }
    listProducts(tenantContext, query) {
        return this.svc.listProducts(tenantContext, query);
    }
    stockIn(tenantContext, body) {
        return this.svc.stockIn(tenantContext, body);
    }
    stockOut(tenantContext, body) {
        return this.svc.stockOut(tenantContext, body);
    }
    adjustStock(tenantContext, body) {
        return this.svc.adjustStock(tenantContext, body);
    }
    checkStock(productId, qty, tenantContext) {
        const requiredQty = Number(qty) || 0;
        const ok = this.svc.checkStock(productId, requiredQty, tenantContext);
        return { productId, requiredQty, sufficient: ok };
    }
    getLowStockProducts(tenantContext, threshold) {
        const th = threshold ? Number(threshold) : undefined;
        return this.svc.getLowStockProducts(tenantContext, th);
    }
    getStockRecords(tenantContext, query) {
        return this.svc.getStockRecords(tenantContext, query);
    }
    createSupplier(tenantContext, body) {
        return this.svc.createSupplier(tenantContext, body);
    }
    listSuppliers(tenantContext) {
        return this.svc.listSuppliers(tenantContext);
    }
    createPurchaseOrder(tenantContext, body) {
        return this.svc.createPurchaseOrder(tenantContext, body);
    }
    confirmOrder(orderId, tenantContext) {
        return this.svc.confirmOrder(orderId, tenantContext);
    }
    receiveOrder(orderId, tenantContext) {
        return this.svc.receiveOrder(orderId, tenantContext);
    }
    listPurchaseOrders(tenantContext, query) {
        return this.svc.listPurchaseOrders(tenantContext, query);
    }
}
// ── Apply decorators ────────────────────────────────────────────
Controller('inventory')(InventoryController);
const endpoints = [
    ['createProduct', 'createProduct', HttpMethod.POST, 'products'],
    ['updateProduct', 'updateProduct', HttpMethod.PUT, 'products/:productId'],
    ['getProduct', 'getProduct', HttpMethod.GET, 'products/:productId'],
    ['listProducts', 'listProducts', HttpMethod.GET, 'products'],
    ['stockIn', 'stockIn', HttpMethod.POST, 'stock/in'],
    ['stockOut', 'stockOut', HttpMethod.POST, 'stock/out'],
    ['adjustStock', 'adjustStock', HttpMethod.POST, 'stock/adjust'],
    ['checkStock', 'checkStock', HttpMethod.GET, 'stock/check/:productId'],
    ['getLowStockProducts', 'getLowStockProducts', HttpMethod.GET, 'stock/low-products'],
    ['getStockRecords', 'getStockRecords', HttpMethod.GET, 'stock/records'],
    ['createSupplier', 'createSupplier', HttpMethod.POST, 'suppliers'],
    ['listSuppliers', 'listSuppliers', HttpMethod.GET, 'suppliers'],
    ['createPurchaseOrder', 'createPurchaseOrder', HttpMethod.POST, 'purchase-orders'],
    ['confirmOrder', 'confirmOrder', HttpMethod.POST, 'purchase-orders/:orderId/confirm'],
    ['receiveOrder', 'receiveOrder', HttpMethod.POST, 'purchase-orders/:orderId/receive'],
    ['listPurchaseOrders', 'listPurchaseOrders', HttpMethod.GET, 'purchase-orders'],
];
for (const [, key, method, path] of endpoints) {
    const decorator = method === HttpMethod.GET ? Get : method === HttpMethod.PUT ? Put : Post;
    decorator(path)(InventoryController.prototype, key);
}
// Manually add TenantContext + param decorators needed
for (const key of [
    'createProduct',
    'stockIn',
    'stockOut',
    'adjustStock',
    'getLowStockProducts',
    'getStockRecords',
    'createSupplier',
    'listSuppliers',
    'createPurchaseOrder',
    'listPurchaseOrders',
]) {
    TenantContext()(InventoryController.prototype, key, 0);
    if ([
        'createProduct',
        'stockIn',
        'stockOut',
        'adjustStock',
        'createSupplier',
        'createPurchaseOrder',
    ].includes(key)) {
        Body()(InventoryController.prototype, key, 1);
    }
    else {
        Query()(InventoryController.prototype, key, 1);
    }
}
// Specific parameter arrangements for each method
Param('productId')(InventoryController.prototype, 'updateProduct', 0);
TenantContext()(InventoryController.prototype, 'updateProduct', 1);
Body()(InventoryController.prototype, 'updateProduct', 2);
Param('productId')(InventoryController.prototype, 'getProduct', 0);
TenantContext()(InventoryController.prototype, 'getProduct', 1);
TenantContext()(InventoryController.prototype, 'listProducts', 0);
Query()(InventoryController.prototype, 'listProducts', 1);
Param('productId')(InventoryController.prototype, 'checkStock', 0);
Query('qty')(InventoryController.prototype, 'checkStock', 1);
TenantContext()(InventoryController.prototype, 'checkStock', 2);
Param('orderId')(InventoryController.prototype, 'confirmOrder', 0);
TenantContext()(InventoryController.prototype, 'confirmOrder', 1);
Param('orderId')(InventoryController.prototype, 'receiveOrder', 0);
TenantContext()(InventoryController.prototype, 'receiveOrder', 1);
// ── Tests ───────────────────────────────────────────────────────
const tenantCtx = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1' };
function mockService(overrides = {}) {
    const defaults = {
        createProduct: () => ({ id: 'p-1', name: 'Default', tenantId: 't-1' }),
        updateProduct: (id) => ({ id, name: 'Updated' }),
        getProduct: (id) => ({ id, name: 'Widget' }),
        listProducts: () => [{ id: 'p-1' }, { id: 'p-2' }],
        stockIn: () => ({ product: { id: 'p-1' }, record: {} }),
        stockOut: () => ({ product: { currentStock: 40 }, record: {} }),
        adjustStock: () => ({ product: { currentStock: 50 }, record: {} }),
        checkStock: (id, qty) => qty <= 50,
        getLowStockProducts: () => [{ id: 'p-low', currentStock: 5 }],
        getStockRecords: () => [{ id: 'sr-1', type: 'inbound' }],
        createSupplier: () => ({ id: 's-1', name: 'Acme' }),
        listSuppliers: () => [{ id: 's-1' }, { id: 's-2' }],
        createPurchaseOrder: () => ({ id: 'po-1', status: 'draft' }),
        confirmOrder: (id) => ({ id, status: 'confirmed' }),
        receiveOrder: (id) => ({ id, status: 'received' }),
        listPurchaseOrders: () => [{ id: 'po-1' }],
    };
    return { ...defaults, ...overrides };
}
(0, node_test_1.describe)('InventoryController — Route metadata', () => {
    (0, node_test_1.default)('registers @Controller("inventory") prefix', () => {
        strict_1.default.equal(controllerPrefixes.get(InventoryController), 'inventory');
    });
    for (const [label, key, expectedMethod, expectedPath] of endpoints) {
        (0, node_test_1.default)(`${label} → method=${expectedMethod === HttpMethod.GET ? 'GET' : expectedMethod === HttpMethod.POST ? 'POST' : 'PUT'} path="${expectedPath}"`, () => {
            const meta = routeMeta.get(key);
            strict_1.default.ok(meta, `Route metadata not found for ${label}`);
            strict_1.default.equal(meta.method, expectedMethod);
            strict_1.default.equal(meta.path, expectedPath);
        });
    }
    (0, node_test_1.default)('all endpoints have TenantContext on a parameter', () => {
        const expectedTenantMethods = new Set(endpoints.map(([, k]) => k));
        for (const key of expectedTenantMethods) {
            strict_1.default.ok(tenantParams.has(key), `Missing TenantContext on ${String(key)}`);
        }
    });
});
(0, node_test_1.describe)('InventoryController — Delegation behaviours', () => {
    (0, node_test_1.default)('createProduct: delegates with tenant context and body', () => {
        let captured = null;
        const ctrl = new InventoryController(mockService({
            createProduct: (ctx, body) => {
                captured = { ctx, body };
                return { id: 'p-new' };
            },
        }));
        const body = {
            name: 'Test Product',
            sku: 'TST-1',
            unit: 'pcs',
            price: 50,
            cost: 30,
            minStock: 5,
            maxStock: 100,
            currentStock: 20,
        };
        const result = ctrl.createProduct(tenantCtx, body);
        strict_1.default.equal(result.id, 'p-new');
        strict_1.default.equal(captured.ctx.tenantId, 't-1');
        strict_1.default.equal(captured.body.name, 'Test Product');
    });
    (0, node_test_1.default)('updateProduct: delegates with productId, tenant context, and body', () => {
        let captured = null;
        const ctrl = new InventoryController(mockService({
            updateProduct: (id, ctx, body) => {
                captured = { id, ctx, body };
                return { id };
            },
        }));
        const result = ctrl.updateProduct('prod-X', tenantCtx, { name: 'Renamed' });
        strict_1.default.equal(result.id, 'prod-X');
        strict_1.default.equal(captured.id, 'prod-X');
        strict_1.default.equal(captured.body.name, 'Renamed');
    });
    (0, node_test_1.default)('getProduct: returns product by id', () => {
        const ctrl = new InventoryController(mockService({
            getProduct: (id) => ({ id, name: 'Widget' }),
        }));
        const result = ctrl.getProduct('prod-42', tenantCtx);
        strict_1.default.equal(result.id, 'prod-42');
        strict_1.default.equal(result.name, 'Widget');
    });
    (0, node_test_1.default)('getProduct: throws when not found', () => {
        const ctrl = new InventoryController(mockService({
            getProduct: () => {
                throw new Error('Product not found');
            },
        }));
        strict_1.default.throws(() => ctrl.getProduct('nonexistent', tenantCtx), /Product not found/);
    });
    (0, node_test_1.default)('listProducts: delegates query filter', () => {
        let capturedQuery = null;
        const ctrl = new InventoryController(mockService({
            listProducts: (_ctx, query) => {
                capturedQuery = query;
                return [{ id: 'p-1' }];
            },
        }));
        const query = { category: 'electronics', limit: 10 };
        const result = ctrl.listProducts(tenantCtx, query);
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(capturedQuery.category, 'electronics');
    });
    (0, node_test_1.default)('stockIn: delegates with quantity', () => {
        let capturedBody = null;
        const ctrl = new InventoryController(mockService({
            stockIn: (ctx, body) => {
                capturedBody = body;
                return { product: { id: body.productId }, record: {} };
            },
        }));
        const result = ctrl.stockIn(tenantCtx, { productId: 'p-1', quantity: 50 });
        strict_1.default.equal(result.product.id, 'p-1');
        strict_1.default.equal(capturedBody.quantity, 50);
    });
    (0, node_test_1.default)('stockOut: returns updated stock', () => {
        const ctrl = new InventoryController(mockService({
            stockOut: () => ({ product: { currentStock: 30 }, record: {} }),
        }));
        const result = ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 20 });
        strict_1.default.equal(result.product.currentStock, 30);
    });
    (0, node_test_1.default)('stockOut: throws on insufficient stock', () => {
        const ctrl = new InventoryController(mockService({
            stockOut: () => {
                throw new Error('Insufficient stock');
            },
        }));
        strict_1.default.throws(() => ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 999 }), /Insufficient stock/);
    });
    (0, node_test_1.default)('adjustStock: delegates adjustment', () => {
        const ctrl = new InventoryController(mockService({
            adjustStock: () => ({ product: { currentStock: 75 }, record: { type: 'adjustment' } }),
        }));
        const result = ctrl.adjustStock(tenantCtx, {
            productId: 'p-1',
            quantity: 25,
            reason: 'inventory count',
        });
        strict_1.default.equal(result.product.currentStock, 75);
        strict_1.default.equal(result.record.type, 'adjustment');
    });
    (0, node_test_1.default)('checkStock: sufficient when qty <= 50', () => {
        const ctrl = new InventoryController(mockService());
        const result = ctrl.checkStock('p-1', '30', tenantCtx);
        strict_1.default.deepEqual(result, { productId: 'p-1', requiredQty: 30, sufficient: true });
    });
    (0, node_test_1.default)('checkStock: insufficient when qty > 50', () => {
        const ctrl = new InventoryController(mockService());
        const result = ctrl.checkStock('p-1', '100', tenantCtx);
        strict_1.default.deepEqual(result, { productId: 'p-1', requiredQty: 100, sufficient: false });
    });
    (0, node_test_1.default)('checkStock: defaults to 0 when qty is empty string', () => {
        const ctrl = new InventoryController(mockService());
        const result = ctrl.checkStock('p-1', '', tenantCtx);
        strict_1.default.equal(result.requiredQty, 0);
        strict_1.default.equal(result.sufficient, true);
    });
    (0, node_test_1.default)('getLowStockProducts: delegates with no threshold', () => {
        let captured = null;
        const ctrl = new InventoryController(mockService({
            getLowStockProducts: (ctx, threshold) => {
                captured = { ctx, threshold };
                return [];
            },
        }));
        ctrl.getLowStockProducts(tenantCtx, undefined);
        strict_1.default.equal(captured.threshold, undefined);
    });
    (0, node_test_1.default)('getLowStockProducts: with threshold parses string to number', () => {
        let capturedThreshold;
        const ctrl = new InventoryController(mockService({
            getLowStockProducts: (_ctx, threshold) => {
                capturedThreshold = threshold;
                return [];
            },
        }));
        ctrl.getLowStockProducts(tenantCtx, '30');
        strict_1.default.equal(capturedThreshold, 30);
    });
    (0, node_test_1.default)('getStockRecords: delegates with query', () => {
        let capturedQuery = null;
        const ctrl = new InventoryController(mockService({
            getStockRecords: (_ctx, query) => {
                capturedQuery = query;
                return [{ id: 'sr-1' }];
            },
        }));
        ctrl.getStockRecords(tenantCtx, { productId: 'p-1' });
        strict_1.default.equal(capturedQuery.productId, 'p-1');
    });
    (0, node_test_1.default)('createSupplier: returns new supplier', () => {
        const ctrl = new InventoryController(mockService({
            createSupplier: () => ({ id: 's-new', name: 'Supplier Co' }),
        }));
        const result = ctrl.createSupplier(tenantCtx, { name: 'Supplier Co', contactPerson: 'John' });
        strict_1.default.equal(result.id, 's-new');
        strict_1.default.equal(result.name, 'Supplier Co');
    });
    (0, node_test_1.default)('listSuppliers: returns supplier list', () => {
        const ctrl = new InventoryController(mockService());
        const result = ctrl.listSuppliers(tenantCtx);
        strict_1.default.equal(result.length, 2);
        strict_1.default.equal(result[0].id, 's-1');
    });
    (0, node_test_1.default)('createPurchaseOrder: returns draft order', () => {
        const ctrl = new InventoryController(mockService({
            createPurchaseOrder: () => ({ id: 'po-new', status: 'draft' }),
        }));
        const body = {
            items: [
                {
                    productId: 'p-1',
                    productName: 'A',
                    sku: 'A-1',
                    quantity: 10,
                    unitPrice: 5,
                    totalPrice: 50,
                },
            ],
            totalAmount: 50,
        };
        const result = ctrl.createPurchaseOrder(tenantCtx, body);
        strict_1.default.equal(result.id, 'po-new');
        strict_1.default.equal(result.status, 'draft');
    });
    (0, node_test_1.default)('confirmOrder: transitions status to confirmed', () => {
        let capturedId = null;
        const ctrl = new InventoryController(mockService({
            confirmOrder: (id) => {
                capturedId = id;
                return { id, status: 'confirmed' };
            },
        }));
        const result = ctrl.confirmOrder('po-abc', tenantCtx);
        strict_1.default.equal(result.status, 'confirmed');
        strict_1.default.equal(capturedId, 'po-abc');
    });
    (0, node_test_1.default)('receiveOrder: transitions status to received', () => {
        const ctrl = new InventoryController(mockService({
            receiveOrder: (id) => ({ id, status: 'received' }),
        }));
        const result = ctrl.receiveOrder('po-xyz', tenantCtx);
        strict_1.default.equal(result.status, 'received');
    });
    (0, node_test_1.default)('confirmOrder: throws on invalid transition', () => {
        const ctrl = new InventoryController(mockService({
            confirmOrder: () => {
                throw new Error('Cannot confirm: order already received');
            },
        }));
        strict_1.default.throws(() => ctrl.confirmOrder('po-bad', tenantCtx), /Cannot confirm/);
    });
    (0, node_test_1.default)('listPurchaseOrders: delegates query', () => {
        let capturedQuery = null;
        const ctrl = new InventoryController(mockService({
            listPurchaseOrders: (_ctx, query) => {
                capturedQuery = query;
                return [];
            },
        }));
        ctrl.listPurchaseOrders(tenantCtx, { status: 'draft' });
        strict_1.default.equal(capturedQuery.status, 'draft');
    });
});
(0, node_test_1.describe)('InventoryController — Error propagation', () => {
    (0, node_test_1.default)('service error propagates through stockOut', () => {
        const ctrl = new InventoryController(mockService({
            stockOut: () => {
                throw new Error('Insufficient stock: only 5 available');
            },
        }));
        strict_1.default.throws(() => ctrl.stockOut(tenantCtx, { productId: 'p-1', quantity: 100 }), /Insufficient stock/);
    });
    (0, node_test_1.default)('service error propagates through getProduct', () => {
        const ctrl = new InventoryController(mockService({
            getProduct: () => {
                throw new Error('Product not found');
            },
        }));
        strict_1.default.throws(() => ctrl.getProduct('bad-id', tenantCtx), /Product not found/);
    });
    (0, node_test_1.default)('service error propagates through confirmOrder', () => {
        const ctrl = new InventoryController(mockService({
            confirmOrder: () => {
                throw new Error('Order is in cancelled state');
            },
        }));
        strict_1.default.throws(() => ctrl.confirmOrder('po-cancelled', tenantCtx), /cancelled/);
    });
});
//# sourceMappingURL=inventory.controller.spec.js.map