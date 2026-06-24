"use strict";
/**
 * E2E 跨模块 #9 — 采购 → 入库 → 应付账款 全链路
 *
 * 链路:
 *   1. InventoryService.createProduct (登记商品)
 *   2. InventoryService.createPurchaseOrder (Draft)
 *   3. InventoryService.confirmOrder (Confirmed)
 *   4. InventoryService.receiveOrder (Received, 自动 stockIn)
 *   5. FinanceService.recordLedger(type=Expense, PO 号关联) → 应付账款
 *
 * 验证:
 *   - PO 状态机: Draft → Confirmed → Received
 *   - 采购入库数量准确增加 stock
 *   - 财务 Expense ledger 关联 PO id
 *   - 余额计算: Revenue 1000 - Expense 300 = 700
 *   - 跨租户隔离: Tenant B 看不到 Tenant A 库存 / ledger
 *   - 库存阈值: low_stock / out_of_stock 状态
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const finance_service_1 = require("../finance/finance.service");
const finance_entity_1 = require("../finance/finance.entity");
const inventory_service_1 = require("../inventory/inventory.service");
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-A',
        brandId: req.header('x-brand-id') ?? 'brand-A',
        storeId: req.header('x-store-id') ?? 'store-A',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
// ─── TestController ───
let TestController = class TestController {
    inventoryService;
    financeService;
    constructor(inventoryService, financeService) {
        this.inventoryService = inventoryService;
        this.financeService = financeService;
    }
    createProduct(req, body) {
        const tc = req.tenantContext;
        return this.inventoryService.createProduct(tc, body);
    }
    stockIn(req, body) {
        const tc = req.tenantContext;
        return this.inventoryService.stockIn(tc, body);
    }
    stockOut(req, body) {
        const tc = req.tenantContext;
        return this.inventoryService.stockOut(tc, body);
    }
    createPO(req, body) {
        const tc = req.tenantContext;
        return this.inventoryService.createPurchaseOrder(tc, body);
    }
    confirmPO(req, poId) {
        const tc = req.tenantContext;
        return this.inventoryService.confirmOrder(poId, tc);
    }
    receivePO(req, poId) {
        const tc = req.tenantContext;
        return this.inventoryService.receiveOrder(poId, tc);
    }
    async recordLedger(req, body) {
        const tc = req.tenantContext;
        return this.financeService.recordLedger(tc, body);
    }
    async recordRevenue(req, body) {
        const tc = req.tenantContext;
        return this.financeService.recordTransactionRevenue(tc, body);
    }
};
__decorate([
    (0, common_1.Post)('inventory/products'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Post)('inventory/stock-in'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "stockIn", null);
__decorate([
    (0, common_1.Post)('inventory/stock-out'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "stockOut", null);
__decorate([
    (0, common_1.Post)('inventory/purchase-orders'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createPO", null);
__decorate([
    (0, common_1.Post)('inventory/purchase-orders/:poId/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('poId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "confirmPO", null);
__decorate([
    (0, common_1.Post)('inventory/purchase-orders/:poId/receive'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('poId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "receivePO", null);
__decorate([
    (0, common_1.Post)('finance/ledgers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "recordLedger", null);
__decorate([
    (0, common_1.Post)('finance/revenue'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TestController.prototype, "recordRevenue", null);
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(inventory_service_1.InventoryService)),
    __param(1, (0, common_1.Inject)(finance_service_1.FinanceService)),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        finance_service_1.FinanceService])
], TestController);
// ─── 构建 app ───
async function buildApp() {
    (0, finance_service_1.resetFinanceServiceTestState)();
    (0, inventory_service_1.resetInventoryServiceTestState)();
    const inventoryService = new inventory_service_1.InventoryService();
    const financeService = new finance_service_1.FinanceService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestController],
        providers: [
            { provide: inventory_service_1.InventoryService, useValue: inventoryService },
            { provide: finance_service_1.FinanceService, useValue: financeService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, inventoryService, financeService };
}
const TENANT_A = {
    'x-tenant-id': 'tenant-A',
    'x-brand-id': 'brand-A',
    'x-store-id': 'store-A'
};
const TENANT_B = {
    'x-tenant-id': 'tenant-B',
    'x-brand-id': 'brand-B',
    'x-store-id': 'store-B'
};
function ctxA() {
    return { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn-mainland' };
}
function ctxB() {
    return { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn-mainland' };
}
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-9: full procurement → stock-in → payable ledger lifecycle', async () => {
    const { app } = await buildApp();
    try {
        // 1. 创建商品
        const productRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({
            sku: 'SKU-001',
            name: '矿泉水',
            unit: 'bottle',
            price: 5,
            currentStock: 50,
            minStock: 20
        });
        strict_1.default.equal(productRes.statusCode, 201);
        const productId = productRes.body.data.id;
        strict_1.default.equal(productRes.body.data.currentStock, 50);
        // 2. 创建采购单 (Draft)
        const poRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/purchase-orders')
            .set(TENANT_A)
            .send({
            orderNumber: 'PO-2026-001',
            supplierId: 'supplier-A',
            items: [{ productId, sku: 'SKU-001', productName: '矿泉水', quantity: 100, unitPrice: 3, totalPrice: 300 }],
            totalAmount: 300
        });
        strict_1.default.equal(poRes.statusCode, 201);
        strict_1.default.equal(poRes.body.data.status, 'draft');
        const poId = poRes.body.data.id;
        strict_1.default.equal(poRes.body.data.totalAmount, 300);
        // 3. 确认采购单
        const confirmRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/inventory/purchase-orders/${poId}/confirm`)
            .set(TENANT_A);
        strict_1.default.equal(confirmRes.statusCode, 201);
        strict_1.default.equal(confirmRes.body.data.status, 'confirmed');
        // 4. 入库 (自动 stockIn 100 瓶 → 库存 150)
        const receiveRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/inventory/purchase-orders/${poId}/receive`)
            .set(TENANT_A);
        strict_1.default.equal(receiveRes.statusCode, 201);
        strict_1.default.equal(receiveRes.body.data.status, 'received');
        // 5. 财务记账应付账款
        const payableRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({
            type: finance_entity_1.LedgerType.Expense,
            amount: 300,
            description: 'PO-2026-001 入库应付',
            orderId: poId,
            category: 'inventory_purchase'
        });
        strict_1.default.equal(payableRes.statusCode, 201);
        strict_1.default.equal(payableRes.body.data.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(payableRes.body.data.amount, 300);
        strict_1.default.equal(payableRes.body.data.orderId, poId);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: PO state machine - cannot receive Draft PO directly', async () => {
    const { app } = await buildApp();
    try {
        const pRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({ sku: 'S-2', name: 'X', unit: 'pcs', price: 10, currentStock: 0, minStock: 5 });
        const productId = pRes.body.data.id;
        const poRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/purchase-orders')
            .set(TENANT_A)
            .send({
            orderNumber: 'PO-2026-002',
            supplierId: 'supplier-A',
            items: [{ productId, sku: 'S-2', productName: 'X', quantity: 10, unitPrice: 5, totalPrice: 50 }],
            totalAmount: 50
        });
        const poId = poRes.body.data.id;
        const receiveRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/inventory/purchase-orders/${poId}/receive`)
            .set(TENANT_A);
        strict_1.default.equal(receiveRes.statusCode, 500, 'Draft 状态不能 receive');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: PO state machine - cannot confirm twice', async () => {
    const { app } = await buildApp();
    try {
        const pRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({ sku: 'S-3', name: 'Y', unit: 'pcs', price: 10, currentStock: 0, minStock: 5 });
        const productId = pRes.body.data.id;
        const poRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/purchase-orders')
            .set(TENANT_A)
            .send({
            orderNumber: 'PO-2026-003',
            supplierId: 'supplier-A',
            items: [{ productId, sku: 'S-3', productName: 'Y', quantity: 5, unitPrice: 5, totalPrice: 25 }],
            totalAmount: 25
        });
        const poId = poRes.body.data.id;
        const confirm1 = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/inventory/purchase-orders/${poId}/confirm`)
            .set(TENANT_A);
        strict_1.default.equal(confirm1.statusCode, 201);
        const confirm2 = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/inventory/purchase-orders/${poId}/confirm`)
            .set(TENANT_A);
        strict_1.default.equal(confirm2.statusCode, 500, 'confirmed 状态不能再 confirm');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: finance ledger balance: revenue 1000 - expense 300 = 700', async () => {
    const { app, financeService } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue')
            .set(TENANT_A)
            .send({
            orderId: 'sales-001',
            transactionId: 'txn-sales-001',
            amount: 1000,
            description: '订单销售'
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({
            type: finance_entity_1.LedgerType.Expense,
            amount: 300,
            description: '采购成本',
            orderId: 'PO-2026-001'
        });
        const ledgers = financeService.listLedgers(ctxA(), { limit: 10 });
        strict_1.default.equal(ledgers.length, 2);
        // 余额: 累计 running balance —— revenue 1000 → balance=1000, expense 300 → balance=700
        const revenue = ledgers.find((l) => l.type === finance_entity_1.LedgerType.Revenue);
        const expense = ledgers.find((l) => l.type === finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(revenue?.balance, 1000);
        strict_1.default.equal(expense?.balance, 700, 'expense 记账后累计余额 1000-300=700');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: cross-tenant isolation - Tenant B cannot see Tenant A inventory/ledger', async () => {
    const { app, inventoryService, financeService } = await buildApp();
    try {
        // Tenant A 创建商品 + ledger
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({ sku: 'A-1', name: 'A', unit: 'pcs', price: 10, currentStock: 100, minStock: 5 });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({
            type: finance_entity_1.LedgerType.Expense,
            amount: 500,
            description: 'Tenant A 采购'
        });
        // 直接 service 验证 Tenant B 看到 0
        const tenantAProducts = inventoryService.listProducts(ctxA(), {});
        const tenantBProducts = inventoryService.listProducts(ctxB(), {});
        strict_1.default.equal(tenantAProducts.length, 1);
        strict_1.default.equal(tenantBProducts.length, 0, 'Tenant B 不应看到 Tenant A 库存');
        const tenantALedgers = financeService.listLedgers(ctxA(), { limit: 10 });
        const tenantBLedgers = financeService.listLedgers(ctxB(), { limit: 10 });
        strict_1.default.equal(tenantALedgers.length, 1);
        strict_1.default.equal(tenantBLedgers.length, 0);
        // HTTP 层验证：Tenant B 创建商品不影响 Tenant A 计数
        const tenantBProduct = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_B)
            .send({ sku: 'B-1', name: 'B', unit: 'pcs', price: 20, currentStock: 50, minStock: 5 });
        strict_1.default.equal(tenantBProduct.statusCode, 201);
        const tenantAFinal = inventoryService.listProducts(ctxA(), {});
        const tenantBFinal = inventoryService.listProducts(ctxB(), {});
        strict_1.default.equal(tenantAFinal.length, 1, 'Tenant A 仍只有 1 个');
        strict_1.default.equal(tenantBFinal.length, 1, 'Tenant B 有 1 个');
        strict_1.default.notEqual(tenantAFinal[0].id, tenantBFinal[0].id, '两端产品 ID 不可重叠');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: low stock alert when stockOut brings stock below threshold', async () => {
    const { app, inventoryService } = await buildApp();
    try {
        const pRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({
            sku: 'SKU-low',
            name: '即将缺货',
            unit: 'pcs',
            price: 20,
            currentStock: 50,
            minStock: 30
        });
        const productId = pRes.body.data.id;
        // 出库 25 → 库存 25, 低于阈值 30
        const stockOutRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-out')
            .set(TENANT_A)
            .send({ productId, quantity: 25, reason: 'sales' });
        strict_1.default.equal(stockOutRes.statusCode, 201);
        strict_1.default.equal(stockOutRes.body.data.product.currentStock, 25);
        // 通过 getLowStockProducts 验证
        const alerts = inventoryService.getLowStockProducts(ctxA());
        const alert = alerts.find((a) => a.product.id === productId);
        strict_1.default.ok(alert, '应有库存预警');
        strict_1.default.equal(alert.status, 'low', '低于阈值 → low 状态');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: out-of-stock alert when stock reaches 0', async () => {
    const { app, inventoryService } = await buildApp();
    try {
        const pRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({
            sku: 'SKU-empty',
            name: '会卖光',
            unit: 'pcs',
            price: 10,
            currentStock: 30,
            minStock: 20
        });
        const productId = pRes.body.data.id;
        const stockOutRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-out')
            .set(TENANT_A)
            .send({ productId, quantity: 30, reason: 'sales' });
        strict_1.default.equal(stockOutRes.statusCode, 201);
        strict_1.default.equal(stockOutRes.body.data.product.currentStock, 0);
        // 通过 getLowStockProducts 验证
        const alerts = inventoryService.getLowStockProducts(ctxA());
        const alert = alerts.find((a) => a.product.id === productId);
        strict_1.default.ok(alert, '应有库存预警');
        strict_1.default.equal(alert.status, 'out_of_stock', '库存为 0 → out_of_stock');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: cannot stockOut more than current stock', async () => {
    const { app } = await buildApp();
    try {
        const pRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({
            sku: 'SKU-cap',
            name: '有限',
            unit: 'pcs',
            price: 10,
            currentStock: 5,
            minStock: 1
        });
        const productId = pRes.body.data.id;
        const stockOutRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-out')
            .set(TENANT_A)
            .send({ productId, quantity: 100, reason: 'overdraw' });
        strict_1.default.equal(stockOutRes.statusCode, 500, '库存不足应抛错');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: PO receive automatically updates product stock (50 + 100 = 150)', async () => {
    const { app, inventoryService } = await buildApp();
    try {
        const pRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({
            sku: 'SKU-auto',
            name: '自动入库测试',
            unit: 'pcs',
            price: 50,
            currentStock: 50,
            minStock: 5
        });
        const productId = pRes.body.data.id;
        const poRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/purchase-orders')
            .set(TENANT_A)
            .send({
            orderNumber: 'PO-AUTO-001',
            supplierId: 'supplier-A',
            items: [{ productId, sku: 'SKU-auto', productName: 'Auto', quantity: 100, unitPrice: 30, totalPrice: 3000 }],
            totalAmount: 3000
        });
        const poId = poRes.body.data.id;
        await (0, supertest_1.default)(app.getHttpServer()).post(`/inventory/purchase-orders/${poId}/confirm`).set(TENANT_A);
        await (0, supertest_1.default)(app.getHttpServer()).post(`/inventory/purchase-orders/${poId}/receive`).set(TENANT_A);
        const product = inventoryService.getProduct(productId, ctxA());
        strict_1.default.ok(product);
        strict_1.default.equal(product.currentStock, 150, '初始 50 + PO 100 = 150');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e-9: stock records history preserved across multiple operations', async () => {
    const { app, inventoryService } = await buildApp();
    try {
        const pRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/products')
            .set(TENANT_A)
            .send({
            sku: 'SKU-history',
            name: '历史',
            unit: 'pcs',
            price: 10,
            currentStock: 0,
            minStock: 5
        });
        const productId = pRes.body.data.id;
        // 多次 stockIn / stockOut
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-in')
            .set(TENANT_A)
            .send({ productId, quantity: 100, reason: 'initial' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-out')
            .set(TENANT_A)
            .send({ productId, quantity: 30, reason: 'sale1' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/inventory/stock-in')
            .set(TENANT_A)
            .send({ productId, quantity: 50, reason: 'restock' });
        const product = inventoryService.getProduct(productId, ctxA());
        strict_1.default.ok(product);
        strict_1.default.equal(product.currentStock, 120, '100 - 30 + 50 = 120');
        const records = inventoryService.getStockRecords(ctxA(), { productId });
        strict_1.default.equal(records.length, 3, '应有 3 条 stock record');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-9-inventory-finance.test.js.map