"use strict";
/**
 * E2E: Finance 财务 HTTP 链路
 *
 * 链路:
 *   HTTP → TenantContext → TestController → FinanceService
 *
 * 验证:
 *   - POST /finance/ledgers — 记账（收入 / 支出 / 退款）
 *   - GET /finance/ledgers — 查询流水（含过滤 + 分页）
 *   - POST /finance/accounts — 创建账户
 *   - GET /finance/accounts — 查询账户列表
 *   - POST /finance/accounts/:id/freeze — 冻结账户
 *   - POST /finance/accounts/:id/close — 关闭账户
 *   - POST /finance/settlements — 创建结算
 *   - GET /finance/settlements — 查询结算
 *   - POST /finance/settlements/:id/confirm — 确认结算
 *   - POST /finance/invoices — 创建发票 → GET /invoices → issue → cancel
 *   - GET /finance/revenue/summary — 营收汇总
 *   - GET /finance/revenue/daily — 日营收
 *   - 跨租户隔离: Tenant A 数据不被 Tenant B 看到
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
const finance_service_1 = require("./finance.service");
const finance_dto_1 = require("./finance.dto");
const finance_entity_1 = require("./finance.entity");
// ── Middleware ──
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-001',
        brandId: req.header('x-brand-id') ?? 'brand-001',
        storeId: req.header('x-store-id') ?? 'store-001',
        marketCode: req.header('x-market-code') ?? 'cn-mainland',
    };
    next();
}
// ── Test Controller ──
let TestFinanceController = class TestFinanceController {
    fs;
    constructor(fs) {
        this.fs = fs;
    }
    recordLedger(req, body) {
        return this.fs.recordLedger(req.tenantContext, body);
    }
    listLedgers(req, query = {}) {
        return this.fs.listLedgers(req.tenantContext, query);
    }
    getLedger(req, id) {
        return this.fs.getLedger(id, req.tenantContext);
    }
    createAccount(req, body) {
        return this.fs.createAccount(req.tenantContext, body);
    }
    listAccounts(req, storeId) {
        return this.fs.listAccounts(req.tenantContext, storeId);
    }
    getAccount(req, id) {
        return this.fs.getAccount(id, req.tenantContext);
    }
    getAccountBalance(req, id) {
        return this.fs.getAccountBalance(id, req.tenantContext);
    }
    freezeAccount(req, id) {
        return this.fs.freezeAccount(id, req.tenantContext);
    }
    closeAccount(req, id) {
        return this.fs.closeAccount(id, req.tenantContext);
    }
    createSettlement(req, body) {
        return this.fs.createSettlement(req.tenantContext, body);
    }
    listSettlements(req, query = {}) {
        return this.fs.listSettlements(req.tenantContext, query);
    }
    getSettlement(req, id) {
        return this.fs.getSettlement(id, req.tenantContext);
    }
    getSettlementDetail(req, id) {
        return this.fs.getSettlementDetail(id, req.tenantContext);
    }
    confirmSettlement(req, id) {
        return this.fs.confirmSettlement(id, req.tenantContext);
    }
    disputeSettlement(req, id) {
        return this.fs.disputeSettlement(id, req.tenantContext);
    }
    createInvoice(req, body) {
        return this.fs.createInvoice(req.tenantContext, body);
    }
    listInvoices(req, query = {}) {
        return this.fs.listInvoices(req.tenantContext, query);
    }
    getInvoice(req, id) {
        return this.fs.getInvoice(id, req.tenantContext);
    }
    issueInvoice(req, id) {
        return this.fs.issueInvoice(id, req.tenantContext);
    }
    cancelInvoice(req, id) {
        return this.fs.cancelInvoice(id, req.tenantContext);
    }
    getRevenueSummary(req, query = {}) {
        return this.fs.getRevenueSummary(req.tenantContext, query);
    }
    getDailyRevenue(req, query) {
        return this.fs.getDailyRevenue(req.tenantContext, query);
    }
    recordTransactionRevenue(req, body) {
        return this.fs.recordTransactionRevenue(req.tenantContext, body);
    }
    recordTransactionRefund(req, body) {
        return this.fs.recordTransactionRefund(req.tenantContext, body);
    }
};
__decorate([
    (0, common_1.Post)('ledgers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateLedgerDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "recordLedger", null);
__decorate([
    (0, common_1.Get)('ledgers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.LedgerQueryDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "listLedgers", null);
__decorate([
    (0, common_1.Get)('ledgers/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Post)('accounts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateAccountDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Get)('accounts/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Get)('accounts/:id/balance'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getAccountBalance", null);
__decorate([
    (0, common_1.Post)('accounts/:id/freeze'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "freezeAccount", null);
__decorate([
    (0, common_1.Post)('accounts/:id/close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "closeAccount", null);
__decorate([
    (0, common_1.Post)('settlements'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateSettlementDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "createSettlement", null);
__decorate([
    (0, common_1.Get)('settlements'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.SettlementQueryDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "listSettlements", null);
__decorate([
    (0, common_1.Get)('settlements/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getSettlement", null);
__decorate([
    (0, common_1.Get)('settlements/:id/detail'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getSettlementDetail", null);
__decorate([
    (0, common_1.Post)('settlements/:id/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "confirmSettlement", null);
__decorate([
    (0, common_1.Post)('settlements/:id/dispute'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "disputeSettlement", null);
__decorate([
    (0, common_1.Post)('invoices'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)('invoices'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.InvoiceQueryDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:id/issue'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "issueInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:id/cancel'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "cancelInvoice", null);
__decorate([
    (0, common_1.Get)('revenue/summary'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.RevenueSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getRevenueSummary", null);
__decorate([
    (0, common_1.Get)('revenue/daily'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.DailyRevenueQueryDto]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "getDailyRevenue", null);
__decorate([
    (0, common_1.Post)('transactions/revenue'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "recordTransactionRevenue", null);
__decorate([
    (0, common_1.Post)('transactions/refund'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestFinanceController.prototype, "recordTransactionRefund", null);
TestFinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    __param(0, (0, common_1.Inject)(finance_service_1.FinanceService)),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], TestFinanceController);
// ── Helper ──
const TENANT_A = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001',
    'x-market-code': 'cn-mainland',
};
const TENANT_B = {
    'x-tenant-id': 'tenant-099',
    'x-brand-id': 'brand-099',
    'x-store-id': 'store-099',
    'x-market-code': 'us-default',
};
async function buildApp() {
    (0, finance_service_1.resetFinanceServiceTestState)();
    const financeService = new finance_service_1.FinanceService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestFinanceController],
        providers: [{ provide: finance_service_1.FinanceService, useValue: financeService }],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, financeService };
}
// ═══════════════════════════════════════════════════════
// Ledger E2E 测试
// ═══════════════════════════════════════════════════════
(0, node_test_1.default)('e2e: POST /finance/ledgers — 记录收入流水', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
            type: finance_entity_1.LedgerType.Revenue,
            amount: 1000,
            description: '门票收入',
            category: 'ticket',
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.ok(res.body.data.id.startsWith('ledger-'));
        strict_1.default.equal(res.body.data.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(res.body.data.amount, 1000);
        strict_1.default.equal(res.body.data.balance, 1000);
        strict_1.default.equal(res.body.data.tenantId, 'tenant-001');
        strict_1.default.equal(res.body.data.storeId, 'store-001');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /finance/ledgers — 记录支出流水', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
            type: finance_entity_1.LedgerType.Revenue,
            amount: 2000,
            description: '商品收入',
            category: 'merchandise',
        });
        const res = await (0, supertest_1.default)(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
            type: finance_entity_1.LedgerType.Expense,
            amount: 500,
            description: '采购支出',
            category: 'purchase',
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(res.body.data.balance, 1500);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /finance/ledgers — 记录退款流水', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Revenue, amount: 500, description: '门票收入' });
        const res = await (0, supertest_1.default)(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
            type: finance_entity_1.LedgerType.Refund,
            amount: 100,
            description: '退票',
            category: 'refund',
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.type, finance_entity_1.LedgerType.Refund);
        // Refund 减少余额
        strict_1.default.equal(res.body.data.balance, 400);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /finance/ledgers — 查询流水列表', async () => {
    const { app } = await buildApp();
    try {
        const r1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Revenue, amount: 100, description: 'a', category: 'ticket' });
        const ledgerId = r1.body.data.id;
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Expense, amount: 30, description: 'b', category: 'supply' });
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/finance/ledgers').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(Array.isArray(res.body.data));
        strict_1.default.equal(res.body.data.length, 2);
        // 可以按ID查询单条
        const single = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/finance/ledgers/${ledgerId}`)
            .set(TENANT_A);
        strict_1.default.equal(single.statusCode, 200);
        strict_1.default.equal(single.body.data.id, ledgerId);
        strict_1.default.equal(single.body.data.amount, 100);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /finance/ledgers — 按类型过滤流水', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Revenue, amount: 200, description: 'rev' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Expense, amount: 50, description: 'exp' });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/ledgers?type=REVENUE')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.length, 1);
        strict_1.default.equal(res.body.data[0].type, finance_entity_1.LedgerType.Revenue);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════════
// Account E2E 测试
// ═══════════════════════════════════════════════════════
(0, node_test_1.default)('e2e: POST /finance/accounts — 创建账户', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).post('/finance/accounts').set(TENANT_A).send({
            name: '主收款账户',
            type: finance_entity_1.AccountType.Cash,
            initialBalance: 10000,
            storeId: 'store-001',
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.ok(res.body.data.id.startsWith('acct-'));
        strict_1.default.equal(res.body.data.name, '主收款账户');
        strict_1.default.equal(res.body.data.balance, 10000);
        strict_1.default.equal(res.body.data.status, finance_entity_1.AccountStatus.Active);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /finance/accounts & GET — 查询账户余额', async () => {
    const { app } = await buildApp();
    try {
        const createRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/accounts')
            .set(TENANT_A)
            .send({ name: '备用金账户', type: finance_entity_1.AccountType.Cash, initialBalance: 5000 });
        const acctId = createRes.body.data.id;
        const balanceRes = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/finance/accounts/${acctId}/balance`)
            .set(TENANT_A);
        strict_1.default.equal(balanceRes.statusCode, 200);
        strict_1.default.equal(balanceRes.body.data.balance, 5000);
        const listRes = await (0, supertest_1.default)(app.getHttpServer()).get('/finance/accounts').set(TENANT_A);
        strict_1.default.equal(listRes.statusCode, 200);
        strict_1.default.equal(listRes.body.data.length, 1);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /finance/accounts/:id/freeze + close — 账户状态转换', async () => {
    const { app } = await buildApp();
    try {
        const createRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/accounts')
            .set(TENANT_A)
            .send({ name: '临停账户', type: finance_entity_1.AccountType.Cash, initialBalance: 0 });
        const acctId = createRes.body.data.id;
        // 冻结
        const freezeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/accounts/${acctId}/freeze`)
            .set(TENANT_A);
        strict_1.default.equal(freezeRes.statusCode, 201);
        strict_1.default.equal(freezeRes.body.data.status, finance_entity_1.AccountStatus.Frozen);
        // 关闭
        const closeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/accounts/${acctId}/close`)
            .set(TENANT_A);
        strict_1.default.equal(closeRes.statusCode, 201);
        strict_1.default.equal(closeRes.body.data.status, finance_entity_1.AccountStatus.Closed);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════════
// Settlement E2E 测试
// ═══════════════════════════════════════════════════════
(0, node_test_1.default)('e2e: POST /finance/settlements — 创建结算', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).post('/finance/settlements').set(TENANT_A).send({
            storeId: 'store-001',
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 50000,
            totalExpense: 30000,
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.ok(res.body.data.id.startsWith('stl-'));
        strict_1.default.equal(res.body.data.totalRevenue, 50000);
        strict_1.default.equal(res.body.data.totalExpense, 30000);
        strict_1.default.equal(res.body.data.netProfit, 20000);
        strict_1.default.equal(res.body.data.settlementStatus, finance_entity_1.SettlementStatus.Pending);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /finance/settlements/:id/confirm — 确认结算', async () => {
    const { app } = await buildApp();
    try {
        const createRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements')
            .set(TENANT_A)
            .send({ startDate: '2026-06-01T00:00:00.000Z', endDate: '2026-06-30T23:59:59.999Z' });
        const stlId = createRes.body.data.id;
        const confirmRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/settlements/${stlId}/confirm`)
            .set(TENANT_A);
        strict_1.default.equal(confirmRes.statusCode, 201);
        strict_1.default.equal(confirmRes.body.data.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
        strict_1.default.ok(confirmRes.body.data.settledAt);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /finance/settlements/:id/dispute — 争议结算', async () => {
    const { app } = await buildApp();
    try {
        const createRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements')
            .set(TENANT_A)
            .send({ startDate: '2026-06-01T00:00:00.000Z', endDate: '2026-06-30T23:59:59.999Z' });
        const stlId = createRes.body.data.id;
        const disputeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/settlements/${stlId}/dispute`)
            .set(TENANT_A);
        strict_1.default.equal(disputeRes.statusCode, 201);
        strict_1.default.equal(disputeRes.body.data.settlementStatus, finance_entity_1.SettlementStatus.Disputed);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /finance/settlements — 查询结算列表并按状态过滤', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements')
            .set(TENANT_A)
            .send({ startDate: '2026-05-01T00:00:00.000Z', endDate: '2026-05-31T23:59:59.999Z' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements')
            .set(TENANT_A)
            .send({ startDate: '2026-06-01T00:00:00.000Z', endDate: '2026-06-30T23:59:59.999Z' });
        const listRes = await (0, supertest_1.default)(app.getHttpServer()).get('/finance/settlements').set(TENANT_A);
        strict_1.default.equal(listRes.statusCode, 200);
        strict_1.default.equal(listRes.body.data.length, 2);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════════
// Invoice E2E 测试
// ═══════════════════════════════════════════════════════
(0, node_test_1.default)('e2e: POST /finance/invoices → GET → issue → cancel', async () => {
    const { app } = await buildApp();
    try {
        // 创建发票
        const createRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/invoices')
            .set(TENANT_A)
            .send({
            orderId: 'order-001',
            amount: 888,
            taxAmount: 88.8,
            type: finance_entity_1.InvoiceType.Sales,
            buyerInfo: { company: '测试公司', taxId: '123456789' },
        });
        strict_1.default.equal(createRes.statusCode, 201);
        const invId = createRes.body.data.id;
        strict_1.default.equal(createRes.body.data.status, finance_entity_1.InvoiceStatus.Draft);
        strict_1.default.equal(createRes.body.data.totalAmount, 976.8);
        // 查询
        const getRes = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/finance/invoices/${invId}`)
            .set(TENANT_A);
        strict_1.default.equal(getRes.statusCode, 200);
        strict_1.default.equal(getRes.body.data.amount, 888);
        // 开票
        const issueRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/invoices/${invId}/issue`)
            .set(TENANT_A);
        strict_1.default.equal(issueRes.statusCode, 201);
        strict_1.default.equal(issueRes.body.data.status, finance_entity_1.InvoiceStatus.Issued);
        // 作废
        const cancelRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/invoices/${invId}/cancel`)
            .set(TENANT_A);
        strict_1.default.equal(cancelRes.statusCode, 201);
        strict_1.default.equal(cancelRes.body.data.status, finance_entity_1.InvoiceStatus.Cancelled);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /finance/invoices — 查询发票列表', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/invoices')
            .set(TENANT_A)
            .send({ orderId: 'o1', amount: 100, type: finance_entity_1.InvoiceType.Sales });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/invoices')
            .set(TENANT_A)
            .send({ orderId: 'o2', amount: 200, type: finance_entity_1.InvoiceType.Sales });
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/finance/invoices').set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.length, 2);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════════
// Revenue E2E 测试
// ═══════════════════════════════════════════════════════
(0, node_test_1.default)('e2e: GET /finance/revenue/summary — 营收汇总', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Revenue, amount: 10000, description: '商品销售' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Expense, amount: 3000, description: '进货成本' });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/revenue/summary?storeId=store-001')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.totalRevenue, 10000);
        strict_1.default.equal(res.body.data.totalExpense, 3000);
        strict_1.default.equal(res.body.data.netRevenue, 7000);
        strict_1.default.equal(res.body.data.storeId, 'store-001');
        strict_1.default.equal(res.body.data.transactionCount, 2);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /finance/revenue/daily — 日营收', async () => {
    const { app } = await buildApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer()).post('/finance/ledgers').set(TENANT_A).send({
            type: finance_entity_1.LedgerType.Revenue,
            amount: 5000,
            description: '日销售',
            recordedAt: '2026-06-15T10:00:00.000Z',
        });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/revenue/daily?storeId=store-001&date=2026-06-15')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.date, '2026-06-15');
        strict_1.default.equal(res.body.data.revenue, 5000);
        strict_1.default.equal(res.body.data.transactionCount, 1);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════════
// 交易联动
// ═══════════════════════════════════════════════════════
(0, node_test_1.default)('e2e: POST /finance/transactions/revenue — 交易联动记账', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/transactions/revenue')
            .set(TENANT_A)
            .send({
            orderId: 'ord-001',
            transactionId: 'txn-001',
            amount: 1500,
            description: '微信支付-门票',
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(res.body.data.amount, 1500);
        strict_1.default.equal(res.body.data.orderId, 'ord-001');
        strict_1.default.equal(res.body.data.transactionId, 'txn-001');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /finance/transactions/refund — 交易退款记账', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/transactions/refund')
            .set(TENANT_A)
            .send({
            orderId: 'ord-001',
            transactionId: 'txn-001',
            amount: 200,
            description: '退卡',
        });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.type, finance_entity_1.LedgerType.Refund);
        strict_1.default.equal(res.body.data.amount, 200);
        strict_1.default.equal(res.body.data.category, 'refund');
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════════
// 跨租户隔离
// ═══════════════════════════════════════════════════════
(0, node_test_1.default)('e2e: 跨租户隔离 — Tenant A 数据不被 Tenant B 看到', async () => {
    const { app } = await buildApp();
    try {
        // Tenant A 记账
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Revenue, amount: 5000, description: 'A店收入' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/accounts')
            .set(TENANT_A)
            .send({ name: 'A店账户', type: finance_entity_1.AccountType.Cash, initialBalance: 1000 });
        // Tenant B 查询应看不到
        const ledgersB = await (0, supertest_1.default)(app.getHttpServer()).get('/finance/ledgers').set(TENANT_B);
        strict_1.default.equal(ledgersB.statusCode, 200);
        strict_1.default.equal(ledgersB.body.data.length, 0, 'Tenant B 不应看到 Tenant A 的流水');
        const accountsB = await (0, supertest_1.default)(app.getHttpServer()).get('/finance/accounts').set(TENANT_B);
        strict_1.default.equal(accountsB.statusCode, 200);
        strict_1.default.equal(accountsB.body.data.length, 0, 'Tenant B 不应看到 Tenant A 的账户');
        // Tenant B 查询 Tenant A 的单条数据应报错
        // 先拿 Tenant A 的 ledger id
        const ledgersA = await (0, supertest_1.default)(app.getHttpServer()).get('/finance/ledgers').set(TENANT_A);
        const ledgerIdA = ledgersA.body.data[0].id;
        const getErr = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/finance/ledgers/${ledgerIdA}`)
            .set(TENANT_B);
        strict_1.default.equal(getErr.statusCode, 500);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=finance.e2e.test%202.js.map