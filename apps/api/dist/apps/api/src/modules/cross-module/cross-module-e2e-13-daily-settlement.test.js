"use strict";
/**
 * E2E 跨模块 #13 — 日清结算: 1 天营业周期端到端
 *
 * 链路 (一个完整营业日):
 *   09:00  开班:  createAccount(现金) → 录入期初余额
 *   09:30 营业:  recordTransactionRevenue (订单 1)        +¥5000
 *   10:15 营业:  recordTransactionRevenue (订单 2)        +¥3000
 *   11:00 营业:  recordTransactionRevenue (订单 3)        +¥8000
 *   14:30 退款:  recordTransactionRefund (订单 2 部分退)   -¥1000
 *   16:00 营业:  recordTransactionRevenue (订单 4)        +¥12000
 *   17:30 报销:  recordLedger(type=Expense) 物业水电       -¥500
 *   20:00 关班:  createSettlement → confirmSettlement
 *   20:30 报表:  getSettlementDetail → listSettlements
 *
 * 验证:
 *   - 当日 ledger 总数 = 6 (4 收入 + 1 退款 + 1 支出)
 *   - 结算 totalRevenue = 28000, totalExpense = 500, netProfit = 27500
 *   - confirmSettlement 后 settlementStatus = CONFIRMED
 *   - 多日连续结算: 每天的 settlement 互不干扰
 *   - 对账异常: disputeSettlement 进入 DISPUTED 状态
 *   - 跨租户: tenant-A 日清不影响 tenant-B 数据
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
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-001',
        brandId: req.header('x-brand-id') ?? 'brand-001',
        storeId: req.header('x-store-id') ?? 'store-001',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
// ─── TestController ───
let TestController = class TestController {
    financeService;
    constructor(financeService) {
        this.financeService = financeService;
    }
    createAccount(req, body) {
        const tc = req.tenantContext;
        return this.financeService.createAccount(tc, body);
    }
    recordLedger(req, body) {
        const tc = req.tenantContext;
        return this.financeService.recordLedger(tc, body);
    }
    recordRevenue(req, body) {
        const tc = req.tenantContext;
        return this.financeService.recordTransactionRevenue(tc, body);
    }
    recordRefund(req, body) {
        const tc = req.tenantContext;
        return this.financeService.recordTransactionRefund(tc, body);
    }
    listLedgers(req) {
        const tc = req.tenantContext;
        return this.financeService.listLedgers(tc);
    }
    createSettlement(req, body) {
        const tc = req.tenantContext;
        return this.financeService.createSettlement(tc, body);
    }
    confirmSettlement(id, req) {
        const tc = req.tenantContext;
        return this.financeService.confirmSettlement(id, tc);
    }
    disputeSettlement(id, req) {
        const tc = req.tenantContext;
        return this.financeService.disputeSettlement(id, tc);
    }
    getSettlementDetail(id, req) {
        const tc = req.tenantContext;
        return this.financeService.getSettlementDetail(id, tc);
    }
    listSettlements(req) {
        const tc = req.tenantContext;
        return this.financeService.listSettlements(tc);
    }
};
__decorate([
    (0, common_1.Post)('finance/accounts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Post)('finance/ledgers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "recordLedger", null);
__decorate([
    (0, common_1.Post)('finance/revenue'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "recordRevenue", null);
__decorate([
    (0, common_1.Post)('finance/refund'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "recordRefund", null);
__decorate([
    (0, common_1.Get)('finance/ledgers'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "listLedgers", null);
__decorate([
    (0, common_1.Post)('finance/settlements'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "createSettlement", null);
__decorate([
    (0, common_1.Post)('finance/settlements/:id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "confirmSettlement", null);
__decorate([
    (0, common_1.Post)('finance/settlements/:id/dispute'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "disputeSettlement", null);
__decorate([
    (0, common_1.Get)('finance/settlements/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "getSettlementDetail", null);
__decorate([
    (0, common_1.Get)('finance/settlements'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestController.prototype, "listSettlements", null);
TestController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(finance_service_1.FinanceService)),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], TestController);
// ─── Build app ───
async function buildApp() {
    (0, finance_service_1.resetFinanceServiceTestState)();
    const financeService = new finance_service_1.FinanceService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestController],
        providers: [{ provide: finance_service_1.FinanceService, useValue: financeService }]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, financeService };
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
// ═══════════════════════════════════════════════════
// E2E: 完整 1 天营业周期 (开班 → 营业 → 关班 → 结算)
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-13: full business day cycle - open, transactions, close, settle', async () => {
    const { app } = await buildApp();
    try {
        // ── 09:00 开班: 创建现金账户 (期初余额 2000) ──
        const accRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/accounts')
            .set(TENANT_A)
            .send({ name: '门店-A 现金', type: finance_entity_1.AccountType.Cash, initialBalance: 2000 });
        strict_1.default.equal(accRes.statusCode, 201);
        strict_1.default.equal(accRes.body.data.balance, 2000);
        // ── 09:30 营业: 订单 1 +¥5000 ──
        // 注: settlement period 用运行时日期 (今日 ± 1 小时),覆盖 ledger.recordedAt
        const dayStart = new Date(Date.now() - 3600 * 1000).toISOString();
        const dayEnd = new Date(Date.now() + 3600 * 1000).toISOString();
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue')
            .set(TENANT_A)
            .send({
            orderId: 'ord-001',
            transactionId: 'txn-001',
            amount: 5000,
            description: '订单 ord-001 收款'
        });
        // ── 10:15 营业: 订单 2 +¥3000 ──
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue')
            .set(TENANT_A)
            .send({
            orderId: 'ord-002',
            transactionId: 'txn-002',
            amount: 3000,
            description: '订单 ord-002 收款'
        });
        // ── 11:00 营业: 订单 3 +¥8000 ──
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue')
            .set(TENANT_A)
            .send({
            orderId: 'ord-003',
            transactionId: 'txn-003',
            amount: 8000,
            description: '订单 ord-003 收款'
        });
        // ── 14:30 退款: 订单 2 部分退 ¥1000 ──
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/refund')
            .set(TENANT_A)
            .send({
            orderId: 'ord-002',
            transactionId: 'txn-002-refund',
            amount: 1000,
            description: '订单 ord-002 部分退款'
        });
        // ── 16:00 营业: 订单 4 +¥12000 ──
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue')
            .set(TENANT_A)
            .send({
            orderId: 'ord-004',
            transactionId: 'txn-004',
            amount: 12000,
            description: '订单 ord-004 收款'
        });
        // ── 17:30 报销: 物业水电 -¥500 ──
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers')
            .set(TENANT_A)
            .send({
            type: finance_entity_1.LedgerType.Expense,
            amount: 500,
            description: '门店 6 月物业水电费'
        });
        // 验证当日 ledger 总数 = 6
        const ledgersRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/ledgers')
            .set(TENANT_A);
        strict_1.default.equal(ledgersRes.body.data.length, 6);
        const revenueLedgers = ledgersRes.body.data.filter((l) => l.type === finance_entity_1.LedgerType.Revenue);
        const refundLedgers = ledgersRes.body.data.filter((l) => l.type === finance_entity_1.LedgerType.Refund);
        const expenseLedgers = ledgersRes.body.data.filter((l) => l.type === finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(revenueLedgers.length, 4);
        strict_1.default.equal(refundLedgers.length, 1);
        strict_1.default.equal(expenseLedgers.length, 1);
        // ── 20:00 关班: 创建当日结算 ──
        const settlementRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements')
            .set(TENANT_A)
            .send({ startDate: dayStart, endDate: dayEnd });
        strict_1.default.equal(settlementRes.statusCode, 201);
        strict_1.default.equal(settlementRes.body.data.totalRevenue, 28000); // 5000+3000+8000+12000
        strict_1.default.equal(settlementRes.body.data.totalExpense, 500);
        strict_1.default.equal(settlementRes.body.data.netProfit, 27500); // 28000-500
        strict_1.default.equal(settlementRes.body.data.settlementStatus, finance_entity_1.SettlementStatus.Pending);
        const settlementId = settlementRes.body.data.id;
        // ── 20:15 关账: 确认结算 ──
        const confirmRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/settlements/${settlementId}/confirm`)
            .set(TENANT_A);
        strict_1.default.equal(confirmRes.body.data.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
        strict_1.default.ok(confirmRes.body.data.settledAt);
        // ── 20:30 报表: 查询结算明细 ──
        const detailRes = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/finance/settlements/${settlementId}`)
            .set(TENANT_A);
        strict_1.default.equal(detailRes.body.data.settlement.totalRevenue, 28000);
        strict_1.default.equal(detailRes.body.data.ledgers.length, 6);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: 多日连续结算 (day-1, day-2 互不干扰)
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-13: multi-day settlements are isolated by date range', async () => {
    const { app } = await buildApp();
    try {
        // 注: ledger.recordedAt = new Date().toISOString() (实际运行时)
        // 所以 settlement period 用运行时日期而不是固定日期
        // Day A: 昨日
        const dayAStart = new Date(Date.now() - 24 * 3600 * 1000 - 3600 * 1000).toISOString();
        const dayAEnd = new Date(Date.now() - 24 * 3600 * 1000 + 3600 * 1000).toISOString();
        // Day B: 今日
        const dayBStart = new Date(Date.now() - 3600 * 1000).toISOString();
        const dayBEnd = new Date(Date.now() + 3600 * 1000).toISOString();
        // Day A 期间无业务 (模拟昨日日清已做)
        // Day B 期间: 1 收入 + 1 支出
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue').set(TENANT_A)
            .send({ orderId: 'dB-o1', transactionId: 'dB-t1', amount: 5000, description: 'D2 收入' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/ledgers').set(TENANT_A)
            .send({ type: finance_entity_1.LedgerType.Expense, amount: 800, description: 'D2 维修费' });
        const dBSettlement = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements').set(TENANT_A)
            .send({ startDate: dayBStart, endDate: dayBEnd });
        strict_1.default.equal(dBSettlement.body.data.totalRevenue, 5000);
        strict_1.default.equal(dBSettlement.body.data.totalExpense, 800);
        strict_1.default.equal(dBSettlement.body.data.netProfit, 4200);
        // 模拟昨天 (空) 结算
        const dASettlement = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements').set(TENANT_A)
            .send({ startDate: dayAStart, endDate: dayAEnd });
        strict_1.default.equal(dASettlement.body.data.totalRevenue, 0);
        strict_1.default.equal(dASettlement.body.data.totalExpense, 0);
        // 验证 listSettlements 包含两个
        const listRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/settlements').set(TENANT_A);
        strict_1.default.equal(listRes.body.data.length, 2);
        // 验证 Day A 的 settlement 不会因 Day B 数据被污染
        const dADetail = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/finance/settlements/${dASettlement.body.data.id}`).set(TENANT_A);
        strict_1.default.equal(dADetail.body.data.settlement.totalRevenue, 0);
        strict_1.default.equal(dADetail.body.data.ledgers.length, 0);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: 对账异常 (DISPUTED 流程)
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-13: disputed settlement workflow', async () => {
    const { app } = await buildApp();
    try {
        // 准备: 一笔异常的退款 (假设对账发现金额不对)
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue').set(TENANT_A)
            .send({ orderId: 'q-o1', transactionId: 'q-t1', amount: 5000, description: 'Q 收入' });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/refund').set(TENANT_A)
            .send({ orderId: 'q-o1', transactionId: 'q-r1', amount: 500, description: 'Q 退款' });
        // 创建结算 (今日 ± 1 小时窗口)
        const settlement = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements').set(TENANT_A)
            .send({
            startDate: new Date(Date.now() - 3600 * 1000).toISOString(),
            endDate: new Date(Date.now() + 3600 * 1000).toISOString()
        });
        const settlementId = settlement.body.data.id;
        strict_1.default.equal(settlement.body.data.settlementStatus, finance_entity_1.SettlementStatus.Pending);
        // 对账时发现异常,标记 disputed
        const disputeRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/settlements/${settlementId}/dispute`).set(TENANT_A);
        strict_1.default.equal(disputeRes.body.data.settlementStatus, finance_entity_1.SettlementStatus.Disputed);
        // Disputed 的结算不能再 confirm (重复对账)
        const confirmRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/settlements/${settlementId}/confirm`).set(TENANT_A);
        strict_1.default.ok(confirmRes.statusCode >= 400, `应返回错误,实际 ${confirmRes.statusCode}`);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: 跨租户日清隔离
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-13: cross-tenant day-end isolation', async () => {
    const { app } = await buildApp();
    try {
        // 今日 ± 1 小时窗口
        const todayStart = new Date(Date.now() - 3600 * 1000).toISOString();
        const todayEnd = new Date(Date.now() + 3600 * 1000).toISOString();
        // Tenant A: 当日 10000 收入
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue').set(TENANT_A)
            .send({ orderId: 'A-o1', transactionId: 'A-t1', amount: 10000, description: 'A 收入' });
        const aSettlement = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements').set(TENANT_A)
            .send({ startDate: todayStart, endDate: todayEnd });
        strict_1.default.equal(aSettlement.body.data.totalRevenue, 10000);
        // Tenant B: 当日 50000 收入
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/revenue').set(TENANT_B)
            .send({ orderId: 'B-o1', transactionId: 'B-t1', amount: 50000, description: 'B 收入' });
        const bSettlement = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements').set(TENANT_B)
            .send({ startDate: todayStart, endDate: todayEnd });
        strict_1.default.equal(bSettlement.body.data.totalRevenue, 50000);
        // Tenant A 的 listSettlements 只能看到 A 的 1 个 (totalRevenue=10000)
        const aList = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/settlements').set(TENANT_A);
        strict_1.default.equal(aList.body.data.length, 1);
        strict_1.default.equal(aList.body.data[0].totalRevenue, 10000);
        // Tenant B 的 listSettlements 只能看到 B 的 1 个 (totalRevenue=50000)
        const bList = await (0, supertest_1.default)(app.getHttpServer())
            .get('/finance/settlements').set(TENANT_B);
        strict_1.default.equal(bList.body.data.length, 1);
        strict_1.default.equal(bList.body.data[0].totalRevenue, 50000);
        // 跨租户读取 settlement (用 B 的 header 读 A 的 id) → 应 500/未找到
        const crossRes = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/finance/settlements/${aSettlement.body.data.id}`).set(TENANT_B);
        strict_1.default.ok(crossRes.statusCode >= 400, `应返回错误,实际 ${crossRes.statusCode}`);
    }
    finally {
        await app.close();
    }
});
// ═══════════════════════════════════════════════════
// E2E: 空日结算 (零交易日的结算仍可创建,total=0)
// ═══════════════════════════════════════════════════
(0, node_test_1.default)('e2e-13: empty day settlement - zero revenue/expense but valid', async () => {
    const { app } = await buildApp();
    try {
        // 不创建任何 ledger (今日 ± 1 小时窗口)
        const settlement = await (0, supertest_1.default)(app.getHttpServer())
            .post('/finance/settlements').set(TENANT_A)
            .send({
            startDate: new Date(Date.now() - 3600 * 1000).toISOString(),
            endDate: new Date(Date.now() + 3600 * 1000).toISOString()
        });
        strict_1.default.equal(settlement.statusCode, 201);
        strict_1.default.equal(settlement.body.data.totalRevenue, 0);
        strict_1.default.equal(settlement.body.data.totalExpense, 0);
        strict_1.default.equal(settlement.body.data.netProfit, 0);
        // 仍可 confirm
        const confirmRes = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/finance/settlements/${settlement.body.data.id}/confirm`).set(TENANT_A);
        strict_1.default.equal(confirmRes.body.data.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module-e2e-13-daily-settlement.test.js.map