"use strict";
/**
 * 🐜 自动: [inventory] E2E 基础测试
 *
 * E2E 链路: HTTP → InventoryController → InventoryService → Product/Stock/Supplier/PurchaseOrder
 *
 * 覆盖:
 *   - Product CRUD: 创建 / 详情 / 列表 / 关键词搜索
 *   - 库存操作: stockIn / stockOut / adjustStock / 库存检查
 *   - 库存预警: 低库存 / 缺货
 *   - 库存记录: 出入库记录查询
 *   - 供应商: 创建 / 列表
 *   - 采购订单: 创建 / 确认 / 收货 (自动入库)
 *   - 跨租户隔离
 *   - 错误处理 (404/400)
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const inventory_service_1 = require("./inventory.service");
const inventory_service_2 = require("./inventory.service");
const inventory_entity_1 = require("./inventory.entity");
function attachTenantContext(req, _res, next) {
    ;
    req.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-001',
        brandId: req.header('x-brand-id') ?? 'brand-001',
        storeId: req.header('x-store-id') ?? 'store-001',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
// ========== 测试 Controller ==========
let TestInventoryController = class TestInventoryController {
    service;
    constructor(service) {
        this.service = service;
    }
    createProduct(req, body) {
        return this.service.createProduct(req.tenantContext, body);
    }
    listProducts(req, query) {
        return this.service.listProducts(req.tenantContext, query);
    }
    getProduct(req, productId) {
        return this.service.getProduct(productId, req.tenantContext);
    }
    updateProduct(req, productId, body) {
        return this.service.updateProduct(productId, req.tenantContext, body);
    }
    stockIn(req, body) {
        return this.service.stockIn(req.tenantContext, body);
    }
    stockOut(req, body) {
        return this.service.stockOut(req.tenantContext, body);
    }
    adjustStock(req, body) {
        return this.service.adjustStock(req.tenantContext, body);
    }
    getStockRecords(req, query) {
        return this.service.getStockRecords(req.tenantContext, query);
    }
    getStockAlerts(req, threshold) {
        return this.service.getLowStockProducts(req.tenantContext, threshold ? Number(threshold) : undefined);
    }
    createSupplier(req, body) {
        return this.service.createSupplier(req.tenantContext, body);
    }
    listSuppliers(req) {
        return this.service.listSuppliers(req.tenantContext);
    }
    createPurchaseOrder(req, body) {
        return this.service.createPurchaseOrder(req.tenantContext, body);
    }
    listPurchaseOrders(req, query) {
        return this.service.listPurchaseOrders(req.tenantContext, query);
    }
    confirmOrder(req, orderId) {
        return this.service.confirmOrder(orderId, req.tenantContext);
    }
    receiveOrder(req, orderId) {
        return this.service.receiveOrder(orderId, req.tenantContext);
    }
};
__decorate([
    (0, common_1.Post)('products'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('products/:productId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Put)('products/:productId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Post)('stock-in'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "stockIn", null);
__decorate([
    (0, common_1.Post)('stock-out'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "stockOut", null);
__decorate([
    (0, common_1.Post)('stock-adjust'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)('stock-records'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "getStockRecords", null);
__decorate([
    (0, common_1.Get)('stock-alerts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "getStockAlerts", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "listSuppliers", null);
__decorate([
    (0, common_1.Post)('purchase-orders'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Get)('purchase-orders'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "listPurchaseOrders", null);
__decorate([
    (0, common_1.Put)('purchase-orders/:orderId/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "confirmOrder", null);
__decorate([
    (0, common_1.Put)('purchase-orders/:orderId/receive'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestInventoryController.prototype, "receiveOrder", null);
TestInventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    __param(0, (0, common_1.Inject)(inventory_service_1.InventoryService)),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], TestInventoryController);
// ========== 构建 app ==========
async function buildApp() {
    (0, inventory_service_2.resetInventoryServiceTestState)();
    const service = new inventory_service_1.InventoryService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestInventoryController],
        providers: [{ provide: inventory_service_1.InventoryService, useValue: service }]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, service };
}
const TENANT_HEADERS = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
const TENANT_B_HEADERS = {
    'x-tenant-id': 'tenant-002',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
async function createProduct(app, overrides = {}, headers = TENANT_HEADERS) {
    return (0, supertest_1.default)(app.getHttpServer())
        .post('/inventory/products')
        .set(headers)
        .send({
        name: '矿泉水',
        sku: 'SKU-001',
        category: '饮料',
        unit: '瓶',
        price: 3,
        cost: 1,
        minStock: 10,
        maxStock: 100,
        currentStock: 50,
        ...overrides
    });
}
// ========== E2E: Product CRUD ==========
(0, node_test_1.describe)('E2E: Product CRUD', () => {
    (0, node_test_1.default)('POST → GET :id → PUT → GET 完整生命周期', async () => {
        const { app } = await buildApp();
        try {
            const createRes = await createProduct(app);
            strict_1.default.equal(createRes.statusCode, 201);
            const productId = createRes.body.data.id;
            strict_1.default.ok(productId.startsWith('prod-'));
            const getRes = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/inventory/products/${productId}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(getRes.statusCode, 200);
            strict_1.default.equal(getRes.body.data.id, productId);
            strict_1.default.equal(getRes.body.data.name, '矿泉水');
            const updateRes = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/inventory/products/${productId}`)
                .set(TENANT_HEADERS)
                .send({ price: 5, name: '矿泉水-改' });
            strict_1.default.equal(updateRes.statusCode, 200);
            strict_1.default.equal(updateRes.body.data.price, 5);
            strict_1.default.equal(updateRes.body.data.name, '矿泉水-改');
            // currentStock 不能通过 updateProduct 改 (库存完整性约束),只能 stockIn/Out/Adjust
            strict_1.default.equal(updateRes.body.data.currentStock, 50);
            const getAfterRes = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/inventory/products/${productId}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(getAfterRes.body.data.price, 5);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /inventory/products 列表 + category 过滤', async () => {
        const { app } = await buildApp();
        try {
            await createProduct(app, { name: '可乐', sku: 'C-1', category: '饮料' });
            await createProduct(app, { name: '薯片', sku: 'S-1', category: '零食' });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/products?category=饮料')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            for (const p of res.body.data)
                strict_1.default.equal(p.category, '饮料');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /inventory/products?keyword= 关键词搜索', async () => {
        const { app } = await buildApp();
        try {
            await createProduct(app, { name: '可口可乐', sku: 'COKE-001' });
            await createProduct(app, { name: '百事可乐', sku: 'PEPSI-001' });
            await createProduct(app, { name: '薯片', sku: 'CHIPS-001' });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/products?keyword=可乐')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.length, 2);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /inventory/products/:id 不存在返回 500', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/products/non-existent-prod')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 库存操作 ==========
(0, node_test_1.describe)('E2E: 库存操作', () => {
    (0, node_test_1.default)('stockIn + stockOut + adjustStock 完整链路', async () => {
        const { app } = await buildApp();
        try {
            const create = await createProduct(app, { currentStock: 50 });
            const productId = create.body.data.id;
            // 入库 20 → 70
            const inRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/stock-in')
                .set(TENANT_HEADERS)
                .send({ productId, quantity: 20, reason: '采购入库' });
            strict_1.default.equal(inRes.statusCode, 201);
            strict_1.default.equal(inRes.body.data.product.currentStock, 70);
            strict_1.default.equal(inRes.body.data.record.afterStock, 70);
            // 出库 10 → 60
            const outRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/stock-out')
                .set(TENANT_HEADERS)
                .send({ productId, quantity: 10, reason: '销售出库' });
            strict_1.default.equal(outRes.statusCode, 201);
            strict_1.default.equal(outRes.body.data.product.currentStock, 60);
            // 调整到 100 → +40
            const adjustRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/stock-adjust')
                .set(TENANT_HEADERS)
                .send({ productId, newQuantity: 100, reason: '盘点调整' });
            strict_1.default.equal(adjustRes.statusCode, 201);
            strict_1.default.equal(adjustRes.body.data.product.currentStock, 100);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('stockOut 超量 → 500', async () => {
        const { app } = await buildApp();
        try {
            const create = await createProduct(app, { currentStock: 5 });
            const productId = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/stock-out')
                .set(TENANT_HEADERS)
                .send({ productId, quantity: 10 });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /inventory/stock-records 按 type 过滤', async () => {
        const { app } = await buildApp();
        try {
            const create = await createProduct(app, { currentStock: 50 });
            const productId = create.body.data.id;
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/stock-in')
                .set(TENANT_HEADERS)
                .send({ productId, quantity: 10 });
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/stock-out')
                .set(TENANT_HEADERS)
                .send({ productId, quantity: 5 });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/stock-records')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.length >= 2);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 库存预警 ==========
(0, node_test_1.describe)('E2E: 库存预警', () => {
    (0, node_test_1.default)('低库存预警: currentStock <= minStock', async () => {
        const { app } = await buildApp();
        try {
            await createProduct(app, {
                name: '低库存商品',
                sku: 'LOW-001',
                currentStock: 5,
                minStock: 10
            });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/stock-alerts')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            const lowStockAlert = res.body.data.find((a) => a.product.sku === 'LOW-001');
            strict_1.default.ok(lowStockAlert);
            strict_1.default.equal(lowStockAlert.status, 'low');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('缺货预警: currentStock = 0 → out_of_stock', async () => {
        const { app } = await buildApp();
        try {
            await createProduct(app, {
                name: '缺货商品',
                sku: 'OOS-001',
                currentStock: 0,
                minStock: 5
            });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/stock-alerts')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            const alert = res.body.data.find((a) => a.product.sku === 'OOS-001');
            strict_1.default.ok(alert);
            strict_1.default.equal(alert.status, 'out_of_stock');
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 供应商 & 采购订单 ==========
(0, node_test_1.describe)('E2E: 供应商和采购订单', () => {
    (0, node_test_1.default)('POST supplier → GET 列表 + 创建 PO', async () => {
        const { app } = await buildApp();
        try {
            // 1. 创建供应商
            const supplierRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/suppliers')
                .set(TENANT_HEADERS)
                .send({ name: '可口可乐公司', contactName: '张三', phone: '13800000000' });
            strict_1.default.equal(supplierRes.statusCode, 201);
            const supplierId = supplierRes.body.data.id;
            // 2. 创建产品
            const product = await createProduct(app, { currentStock: 10 });
            // 3. 创建采购订单
            const poRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/purchase-orders')
                .set(TENANT_HEADERS)
                .send({
                supplierId,
                totalAmount: 100,
                items: [
                    {
                        productId: product.body.data.id,
                        productName: product.body.data.name,
                        sku: product.body.data.sku,
                        quantity: 100,
                        unitPrice: 1,
                        totalPrice: 100
                    }
                ]
            });
            strict_1.default.equal(poRes.statusCode, 201);
            strict_1.default.equal(poRes.body.data.status, inventory_entity_1.PurchaseOrderStatus.Draft);
            // 4. 列表
            const listRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/purchase-orders')
                .set(TENANT_HEADERS);
            strict_1.default.equal(listRes.body.data.length, 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PO 状态机: Draft → Confirmed → Received (自动入库)', async () => {
        const { app } = await buildApp();
        try {
            // 创建供应商 + 产品
            const supplier = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/suppliers')
                .set(TENANT_HEADERS)
                .send({ name: '供应商A' });
            const supplierId = supplier.body.data.id;
            const product = await createProduct(app, { currentStock: 10 });
            // 创建 PO
            const po = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/purchase-orders')
                .set(TENANT_HEADERS)
                .send({
                supplierId,
                totalAmount: 200,
                items: [
                    {
                        productId: product.body.data.id,
                        productName: product.body.data.name,
                        sku: product.body.data.sku,
                        quantity: 50,
                        unitPrice: 4,
                        totalPrice: 200
                    }
                ]
            });
            const orderId = po.body.data.id;
            // 确认
            const confirmRes = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/inventory/purchase-orders/${orderId}/confirm`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(confirmRes.statusCode, 200);
            strict_1.default.equal(confirmRes.body.data.status, inventory_entity_1.PurchaseOrderStatus.Confirmed);
            // 收货 (自动入库 +50)
            const receiveRes = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/inventory/purchase-orders/${orderId}/receive`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(receiveRes.statusCode, 200);
            strict_1.default.equal(receiveRes.body.data.status, inventory_entity_1.PurchaseOrderStatus.Received);
            // 验证库存自动 +50
            const productAfter = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/inventory/products/${product.body.data.id}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(productAfter.body.data.currentStock, 60); // 10 + 50
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('Draft 状态不可直接 receive', async () => {
        const { app } = await buildApp();
        try {
            const supplier = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/suppliers')
                .set(TENANT_HEADERS)
                .send({ name: '供应商X' });
            const product = await createProduct(app);
            const po = await (0, supertest_1.default)(app.getHttpServer())
                .post('/inventory/purchase-orders')
                .set(TENANT_HEADERS)
                .send({
                supplierId: supplier.body.data.id,
                totalAmount: 50,
                items: [
                    {
                        productId: product.body.data.id,
                        productName: 'x',
                        sku: 'x',
                        quantity: 10,
                        unitPrice: 5,
                        totalPrice: 50
                    }
                ]
            });
            // 跳过 confirm,直接 receive
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/inventory/purchase-orders/${po.body.data.id}/receive`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 跨租户隔离 ==========
(0, node_test_1.describe)('E2E: 跨租户隔离', () => {
    (0, node_test_1.default)('tenant-B 看不到 tenant-A 的产品', async () => {
        const { app } = await buildApp();
        try {
            const create = await createProduct(app, {}, TENANT_HEADERS);
            const productId = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/inventory/products/${productId}`)
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 列表只返回自己的产品', async () => {
        const { app } = await buildApp();
        try {
            await createProduct(app, { name: 'A-Product', sku: 'A-1' }, TENANT_HEADERS);
            await createProduct(app, { name: 'B-Product', sku: 'B-1' }, TENANT_B_HEADERS);
            const aRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/products')
                .set(TENANT_HEADERS);
            const bRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/inventory/products')
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(aRes.body.data.length, 1);
            strict_1.default.equal(bRes.body.data.length, 1);
            strict_1.default.equal(aRes.body.data[0].name, 'A-Product');
            strict_1.default.equal(bRes.body.data[0].name, 'B-Product');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 无法修改 tenant-A 的产品', async () => {
        const { app } = await buildApp();
        try {
            const create = await createProduct(app, {}, TENANT_HEADERS);
            const productId = create.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put(`/inventory/products/${productId}`)
                .set(TENANT_B_HEADERS)
                .send({ price: 999 });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=inventory.e2e.test.js.map