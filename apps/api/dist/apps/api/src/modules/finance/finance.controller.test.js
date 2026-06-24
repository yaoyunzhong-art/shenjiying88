"use strict";
/**
 * 🐜 自动: [finance] [A] controller spec 补全
 *
 * 覆盖 FinanceController 的完整路由:
 *   - Ledger：POST/GET ledgers, GET ledgers/:id
 *   - Account：POST/GET accounts, GET balance, freeze, close
 *   - Settlement：POST/GET settlements, GET detail, confirm, dispute
 *   - Invoice：POST/GET invoices, issue, cancel
 *   - Revenue：GET revenue/summary, revenue/daily
 *   - Transaction：POST transactions/revenue, transactions/refund
 *   - 路由元数据 + 边界异常
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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const finance_controller_1 = require("./finance.controller");
const finance_entity_1 = require("./finance.entity");
const finance_dto_1 = require("./finance.dto");
// ── 辅助工厂 ──
function tenantCtx(overrides) {
    return {
        tenantId: 'tenant-default',
        brandId: 'brand-default',
        storeId: 'store-default',
        marketCode: 'cn',
        ...overrides
    };
}
function makeMockService() {
    return {
        recordLedger: async (_ctx, dto) => ({
            id: 'ledger-mock-1',
            tenantId: _ctx.tenantId,
            type: dto.type,
            amount: dto.amount,
            balance: dto.type === finance_entity_1.LedgerType.Revenue ? dto.amount : -dto.amount,
            description: dto.description,
            orderId: dto.orderId,
            transactionId: dto.transactionId,
            category: dto.category,
            recordedAt: dto.recordedAt ?? new Date().toISOString(),
            createdAt: new Date().toISOString()
        }),
        listLedgers: () => [],
        getLedger: (id, ctx) => ({
            id,
            tenantId: ctx.tenantId,
            type: finance_entity_1.LedgerType.Revenue,
            amount: 100,
            balance: 100,
            description: 'mock',
            createdAt: new Date().toISOString(),
            recordedAt: new Date().toISOString()
        }),
        createAccount: async (_ctx, dto) => ({
            id: 'acct-mock-1',
            tenantId: _ctx.tenantId,
            storeId: dto.storeId ?? _ctx.storeId,
            name: dto.name,
            type: dto.type,
            balance: dto.initialBalance ?? 0,
            status: finance_entity_1.AccountStatus.Active,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }),
        listAccounts: () => [],
        getAccount: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            name: 'Mock Account',
            type: finance_entity_1.AccountType.Cash,
            balance: 5000,
            status: finance_entity_1.AccountStatus.Active,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }),
        getAccountBalance: (id, _ctx) => ({ id, name: 'Mock Account', balance: 5000, status: finance_entity_1.AccountStatus.Active }),
        freezeAccount: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            name: 'Frozen',
            type: finance_entity_1.AccountType.Bank,
            balance: 1000,
            status: finance_entity_1.AccountStatus.Frozen,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }),
        closeAccount: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            name: 'Closed',
            type: finance_entity_1.AccountType.Bank,
            balance: 0,
            status: finance_entity_1.AccountStatus.Closed,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }),
        createSettlement: async (_ctx, dto) => ({
            id: 'stl-mock-1',
            tenantId: _ctx.tenantId,
            storeId: dto.storeId ?? _ctx.storeId,
            startDate: dto.startDate,
            endDate: dto.endDate,
            totalRevenue: dto.totalRevenue ?? 1000,
            totalExpense: dto.totalExpense ?? 300,
            netProfit: (dto.totalRevenue ?? 1000) - (dto.totalExpense ?? 300),
            settlementStatus: finance_entity_1.SettlementStatus.Pending,
            createdAt: new Date().toISOString()
        }),
        listSettlements: () => [],
        getSettlement: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 5000,
            totalExpense: 2000,
            netProfit: 3000,
            settlementStatus: finance_entity_1.SettlementStatus.Confirmed,
            settledAt: '2026-07-01T00:00:00.000Z',
            createdAt: new Date().toISOString()
        }),
        getSettlementDetail: (id, _ctx) => ({
            settlement: {
                id,
                tenantId: _ctx.tenantId,
                startDate: '2026-06-01T00:00:00.000Z',
                endDate: '2026-06-30T23:59:59.999Z',
                totalRevenue: 5000,
                totalExpense: 2000,
                netProfit: 3000,
                settlementStatus: finance_entity_1.SettlementStatus.Pending,
                createdAt: new Date().toISOString()
            },
            ledgers: []
        }),
        confirmSettlement: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 5000,
            totalExpense: 2000,
            netProfit: 3000,
            settlementStatus: finance_entity_1.SettlementStatus.Confirmed,
            settledAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }),
        disputeSettlement: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 5000,
            totalExpense: 2000,
            netProfit: 3000,
            settlementStatus: finance_entity_1.SettlementStatus.Disputed,
            createdAt: new Date().toISOString()
        }),
        createInvoice: async (_ctx, dto) => ({
            id: 'inv-mock-1',
            tenantId: _ctx.tenantId,
            storeId: _ctx.storeId,
            orderId: dto.orderId,
            invoiceNo: `INV-${Date.now()}-0001`,
            amount: dto.amount,
            taxAmount: dto.taxAmount ?? 0,
            totalAmount: dto.amount + (dto.taxAmount ?? 0),
            type: dto.type,
            status: finance_entity_1.InvoiceStatus.Draft,
            buyerInfo: dto.buyerInfo,
            createdAt: new Date().toISOString()
        }),
        listInvoices: () => [],
        getInvoice: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            storeId: _ctx.storeId,
            orderId: 'order-1',
            invoiceNo: 'INV-001',
            amount: 100,
            taxAmount: 13,
            totalAmount: 113,
            type: finance_entity_1.InvoiceType.Vat,
            status: finance_entity_1.InvoiceStatus.Draft,
            buyerInfo: { name: 'Test' },
            createdAt: new Date().toISOString()
        }),
        issueInvoice: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            storeId: _ctx.storeId,
            invoiceNo: 'INV-001',
            amount: 100,
            taxAmount: 13,
            totalAmount: 113,
            type: finance_entity_1.InvoiceType.Vat,
            status: finance_entity_1.InvoiceStatus.Issued,
            issuedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }),
        cancelInvoice: (id, _ctx) => ({
            id,
            tenantId: _ctx.tenantId,
            storeId: _ctx.storeId,
            invoiceNo: 'INV-001',
            amount: 100,
            taxAmount: 13,
            totalAmount: 113,
            type: finance_entity_1.InvoiceType.Vat,
            status: finance_entity_1.InvoiceStatus.Cancelled,
            createdAt: new Date().toISOString()
        }),
        getRevenueSummary: (_ctx, query) => ({
            storeId: query?.storeId ?? _ctx.storeId,
            totalRevenue: 10000,
            totalExpense: 3000,
            totalRefund: 500,
            netRevenue: 6500,
            transactionCount: 42,
            periodStart: query?.startDate ?? '2026-06-01T00:00:00.000Z',
            periodEnd: query?.endDate ?? '2026-06-30T23:59:59.999Z'
        }),
        getDailyRevenue: (_ctx, query) => ({
            date: query.date,
            storeId: _ctx.storeId,
            revenue: 1500,
            expense: 300,
            refund: 100,
            netRevenue: 1100,
            transactionCount: 15
        }),
        recordTransactionRevenue: async (_ctx, params) => ({
            id: 'ledger-rev-1',
            tenantId: _ctx.tenantId,
            type: finance_entity_1.LedgerType.Revenue,
            amount: params.amount,
            balance: params.amount,
            description: params.description,
            orderId: params.orderId,
            transactionId: params.transactionId,
            category: params.category ?? 'transaction',
            recordedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        }),
        recordTransactionRefund: async (_ctx, params) => ({
            id: 'ledger-ref-1',
            tenantId: _ctx.tenantId,
            type: finance_entity_1.LedgerType.Refund,
            amount: params.amount,
            balance: -params.amount,
            description: params.description,
            orderId: params.orderId,
            transactionId: params.transactionId,
            category: 'refund',
            recordedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        })
    };
}
function makeController(serviceOverrides) {
    const base = makeMockService();
    return new finance_controller_1.FinanceController({ ...base, ...serviceOverrides });
}
const CTX = tenantCtx();
// ── 路由元数据检查 ──
(0, node_test_1.describe)('路由元数据验证', () => {
    (0, node_test_1.default)('controller path metadata is set to "finance"', () => {
        const path = Reflect.getMetadata('path', finance_controller_1.FinanceController);
        strict_1.default.equal(path, 'finance');
    });
});
// ── GET /finance/ledgers ──
(0, node_test_1.describe)('[finance] POST /finance/ledgers — 记账', () => {
    (0, node_test_1.default)('记录收入：类型为 Revenue, balance 正确', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 1000,
            description: '台球桌 3 小时'
        });
        const result = await ctrl.recordLedger(CTX, dto);
        strict_1.default.equal(result.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(result.amount, 1000);
        strict_1.default.equal(result.description, '台球桌 3 小时');
    });
    (0, node_test_1.default)('记录支出：Expense 类型', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Expense,
            amount: 200,
            description: '清洁用品采购'
        });
        const result = await ctrl.recordLedger(CTX, dto);
        strict_1.default.equal(result.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(result.amount, 200);
    });
    (0, node_test_1.default)('记录退款：Refund 类型带 orderId', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Refund,
            amount: 50,
            description: '客户退费',
            orderId: 'order-123'
        });
        const result = await ctrl.recordLedger(CTX, dto);
        strict_1.default.equal(result.type, finance_entity_1.LedgerType.Refund);
        strict_1.default.equal(result.orderId, 'order-123');
    });
    (0, node_test_1.default)('记录调账：Adjustment 类型带 category', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Adjustment,
            amount: 150,
            description: '月末调账',
            category: 'adjustment'
        });
        const result = await ctrl.recordLedger(CTX, dto);
        strict_1.default.equal(result.type, finance_entity_1.LedgerType.Adjustment);
        strict_1.default.equal(result.category, 'adjustment');
    });
});
// ── GET /finance/ledgers ──
(0, node_test_1.describe)('[finance] GET /finance/ledgers — 列表查询', () => {
    (0, node_test_1.default)('列出所有记账记录（默认空列表）', async () => {
        const ctrl = makeController();
        const result = ctrl.listLedgers(CTX);
        strict_1.default.ok(Array.isArray(result));
    });
    (0, node_test_1.default)('按类型过滤', async () => {
        let capturedType;
        const ctrl = makeController({
            listLedgers: (_ctx, query) => {
                capturedType = query?.type;
                return [];
            }
        });
        ctrl.listLedgers(CTX, { type: finance_entity_1.LedgerType.Revenue });
        strict_1.default.equal(capturedType, finance_entity_1.LedgerType.Revenue);
    });
});
// ── GET /finance/ledgers/:ledgerId ──
(0, node_test_1.describe)('[finance] GET /finance/ledgers/:ledgerId — 单条查询', () => {
    (0, node_test_1.default)('按 ID 获取记账记录', () => {
        const ctrl = makeController();
        const result = ctrl.getLedger('ledger-1', CTX);
        strict_1.default.equal(result.id, 'ledger-1');
        strict_1.default.equal(result.type, finance_entity_1.LedgerType.Revenue);
    });
    (0, node_test_1.default)('不存在的 ledgerId 抛出异常', () => {
        const ctrl = makeController({
            getLedger: () => { throw new Error('Ledger not-found not found'); }
        });
        strict_1.default.throws(() => ctrl.getLedger('not-found', CTX), /Ledger not-found not found/);
    });
});
// ── Account ──
(0, node_test_1.describe)('[finance] POST /finance/accounts — 创建账户', () => {
    (0, node_test_1.default)('创建现金账户', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateAccountDto(), {
            name: '门店现金',
            type: finance_entity_1.AccountType.Cash
        });
        const result = await ctrl.createAccount(CTX, dto);
        strict_1.default.equal(result.name, '门店现金');
        strict_1.default.equal(result.type, finance_entity_1.AccountType.Cash);
        strict_1.default.equal(result.status, finance_entity_1.AccountStatus.Active);
    });
    (0, node_test_1.default)('创建带初始余额的银行账户', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateAccountDto(), {
            name: '银行账户',
            type: finance_entity_1.AccountType.Bank,
            initialBalance: 10000
        });
        const result = await ctrl.createAccount(CTX, dto);
        strict_1.default.equal(result.balance, 10000);
    });
    (0, node_test_1.default)('创建带 storeId 账户', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateAccountDto(), {
            name: '门店专属',
            type: finance_entity_1.AccountType.Wechat,
            storeId: 'store-2'
        });
        const result = await ctrl.createAccount(CTX, dto);
        strict_1.default.equal(result.storeId, 'store-2');
    });
});
(0, node_test_1.describe)('[finance] GET /finance/accounts — 账户列表', () => {
    (0, node_test_1.default)('无店铺过滤时返回全部', () => {
        const ctrl = makeController();
        const result = ctrl.listAccounts(CTX);
        strict_1.default.ok(Array.isArray(result));
    });
    (0, node_test_1.default)('带 storeId 过滤', () => {
        let capturedStoreId;
        const ctrl = makeController({
            listAccounts: (_ctx, storeId) => {
                capturedStoreId = storeId;
                return [];
            }
        });
        ctrl.listAccounts(CTX, 'store-1');
        strict_1.default.equal(capturedStoreId, 'store-1');
    });
});
(0, node_test_1.describe)('[finance] GET /finance/accounts/:accountId — 账户详情', () => {
    (0, node_test_1.default)('获取账户详情', () => {
        const ctrl = makeController();
        const result = ctrl.getAccount('acct-1', CTX);
        strict_1.default.equal(result.id, 'acct-1');
        strict_1.default.equal(result.name, 'Mock Account');
    });
    (0, node_test_1.default)('不存在的账户抛出异常', () => {
        const ctrl = makeController({
            getAccount: () => { throw new Error('Account bad not found'); }
        });
        strict_1.default.throws(() => ctrl.getAccount('bad', CTX), /not found/);
    });
});
(0, node_test_1.describe)('[finance] GET /finance/accounts/:accountId/balance — 余额查询', () => {
    (0, node_test_1.default)('返回摘要字段', () => {
        const ctrl = makeController();
        const result = ctrl.getAccountBalance('acct-1', CTX);
        strict_1.default.equal(result.id, 'acct-1');
        strict_1.default.ok('balance' in result);
        strict_1.default.ok('status' in result);
    });
});
(0, node_test_1.describe)('[finance] POST /finance/accounts/:accountId/freeze — 冻结', () => {
    (0, node_test_1.default)('成功冻结变为 Frozen', () => {
        const ctrl = makeController();
        const result = ctrl.freezeAccount('acct-1', CTX);
        strict_1.default.equal(result.status, finance_entity_1.AccountStatus.Frozen);
    });
});
(0, node_test_1.describe)('[finance] POST /finance/accounts/:accountId/close — 关闭', () => {
    (0, node_test_1.default)('成功关闭变为 Closed', () => {
        const ctrl = makeController();
        const result = ctrl.closeAccount('acct-1', CTX);
        strict_1.default.equal(result.status, finance_entity_1.AccountStatus.Closed);
    });
});
// ── Settlement ──
(0, node_test_1.describe)('[finance] POST /finance/settlements — 创建结算', () => {
    (0, node_test_1.default)('创建结算（自动计算 revenue/expense）', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateSettlementDto(), {
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z'
        });
        const result = await ctrl.createSettlement(CTX, dto);
        strict_1.default.equal(result.startDate, '2026-06-01T00:00:00.000Z');
        strict_1.default.equal(result.settlementStatus, finance_entity_1.SettlementStatus.Pending);
    });
    (0, node_test_1.default)('创建带手动值的结算', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateSettlementDto(), {
            storeId: 'store-sz',
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 5000,
            totalExpense: 2000
        });
        const result = await ctrl.createSettlement(CTX, dto);
        strict_1.default.equal(result.storeId, 'store-sz');
        strict_1.default.equal(result.totalRevenue, 5000);
        strict_1.default.equal(result.totalExpense, 2000);
        strict_1.default.equal(result.netProfit, 3000);
    });
});
(0, node_test_1.describe)('[finance] GET /finance/settlements — 结算列表', () => {
    (0, node_test_1.default)('按状态过滤结算列表', () => {
        let capturedStatus;
        const ctrl = makeController({
            listSettlements: (_ctx, query) => {
                capturedStatus = query?.settlementStatus;
                return [];
            }
        });
        ctrl.listSettlements(CTX, { settlementStatus: finance_entity_1.SettlementStatus.Pending });
        strict_1.default.equal(capturedStatus, finance_entity_1.SettlementStatus.Pending);
    });
});
(0, node_test_1.describe)('[finance] GET /finance/settlements/:settlementId — 结算详情', () => {
    (0, node_test_1.default)('获取结算', () => {
        const ctrl = makeController();
        const result = ctrl.getSettlement('stl-1', CTX);
        strict_1.default.equal(result.id, 'stl-1');
        strict_1.default.equal(result.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
    });
    (0, node_test_1.default)('不存在的结算抛出异常', () => {
        const ctrl = makeController({
            getSettlement: () => { throw new Error('Settlement bad not found'); }
        });
        strict_1.default.throws(() => ctrl.getSettlement('bad', CTX), /not found/);
    });
});
(0, node_test_1.describe)('[finance] GET /finance/settlements/:settlementId/detail — 结算明细', () => {
    (0, node_test_1.default)('返回 settlement + ledgers', () => {
        const ctrl = makeController();
        const result = ctrl.getSettlementDetail('stl-1', CTX);
        strict_1.default.ok(result.settlement);
        strict_1.default.ok(Array.isArray(result.ledgers));
    });
});
(0, node_test_1.describe)('[finance] POST /finance/settlements/:settlementId/confirm — 确认结算', () => {
    (0, node_test_1.default)('Pending → Confirmed', () => {
        const ctrl = makeController();
        const result = ctrl.confirmSettlement('stl-1', CTX);
        strict_1.default.equal(result.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
    });
});
(0, node_test_1.describe)('[finance] POST /finance/settlements/:settlementId/dispute — 争议结算', () => {
    (0, node_test_1.default)('Pending → Disputed', () => {
        const ctrl = makeController();
        const result = ctrl.disputeSettlement('stl-1', CTX);
        strict_1.default.equal(result.settlementStatus, finance_entity_1.SettlementStatus.Disputed);
    });
});
// ── Invoice ──
(0, node_test_1.describe)('[finance] POST /finance/invoices — 创建发票', () => {
    (0, node_test_1.default)('创建普通发票 Draft', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateInvoiceDto(), {
            type: finance_entity_1.InvoiceType.Regular,
            amount: 500
        });
        const result = await ctrl.createInvoice(CTX, dto);
        strict_1.default.equal(result.type, finance_entity_1.InvoiceType.Regular);
        strict_1.default.equal(result.status, finance_entity_1.InvoiceStatus.Draft);
    });
    (0, node_test_1.default)('创建增值税发票含税', async () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.CreateInvoiceDto(), {
            type: finance_entity_1.InvoiceType.Vat,
            amount: 1000,
            taxAmount: 130,
            orderId: 'order-inv-1',
            buyerInfo: { name: '客户名' }
        });
        const result = await ctrl.createInvoice(CTX, dto);
        strict_1.default.equal(result.totalAmount, 1130);
        strict_1.default.equal(result.orderId, 'order-inv-1');
    });
});
(0, node_test_1.describe)('[finance] GET /finance/invoices — 发票列表', () => {
    (0, node_test_1.default)('按状态过滤', () => {
        let capturedStatus;
        const ctrl = makeController({
            listInvoices: (_ctx, query) => {
                capturedStatus = query?.status;
                return [];
            }
        });
        ctrl.listInvoices(CTX, { status: finance_entity_1.InvoiceStatus.Issued });
        strict_1.default.equal(capturedStatus, finance_entity_1.InvoiceStatus.Issued);
    });
});
(0, node_test_1.describe)('[finance] GET /finance/invoices/:invoiceId — 单张发票', () => {
    (0, node_test_1.default)('获取发票', () => {
        const ctrl = makeController();
        const result = ctrl.getInvoice('inv-1', CTX);
        strict_1.default.equal(result.id, 'inv-1');
    });
});
(0, node_test_1.describe)('[finance] POST /finance/invoices/:invoiceId/issue — 开票', () => {
    (0, node_test_1.default)('Draft → Issued', () => {
        const ctrl = makeController();
        const result = ctrl.issueInvoice('inv-1', CTX);
        strict_1.default.equal(result.status, finance_entity_1.InvoiceStatus.Issued);
        strict_1.default.ok(result.issuedAt);
    });
});
(0, node_test_1.describe)('[finance] POST /finance/invoices/:invoiceId/cancel — 作废发票', () => {
    (0, node_test_1.default)('→ Cancelled', () => {
        const ctrl = makeController();
        const result = ctrl.cancelInvoice('inv-1', CTX);
        strict_1.default.equal(result.status, finance_entity_1.InvoiceStatus.Cancelled);
    });
});
// ── Revenue ──
(0, node_test_1.describe)('[finance] GET /finance/revenue/summary — 营收汇总', () => {
    (0, node_test_1.default)('默认返回 30 天汇总', () => {
        const ctrl = makeController();
        const result = ctrl.getRevenueSummary(CTX);
        strict_1.default.equal(result.totalRevenue, 10000);
        strict_1.default.equal(result.netRevenue, 6500);
        strict_1.default.equal(result.transactionCount, 42);
    });
    (0, node_test_1.default)('按门店 + 时间范围过滤', () => {
        let capturedQuery;
        const ctrl = makeController({
            getRevenueSummary: (_ctx, query) => {
                capturedQuery = query;
                return { storeId: '', totalRevenue: 0, totalExpense: 0, totalRefund: 0, netRevenue: 0, transactionCount: 0, periodStart: '', periodEnd: '' };
            }
        });
        ctrl.getRevenueSummary(CTX, { storeId: 'store-bj', startDate: '2026-01-01T00:00:00.000Z' });
        strict_1.default.equal(capturedQuery?.storeId, 'store-bj');
    });
});
(0, node_test_1.describe)('[finance] GET /finance/revenue/daily — 日营收', () => {
    (0, node_test_1.default)('按日期查询日营收', () => {
        const ctrl = makeController();
        const dto = Object.assign(new finance_dto_1.DailyRevenueQueryDto(), { date: '2026-06-15' });
        const result = ctrl.getDailyRevenue(CTX, dto);
        strict_1.default.equal(result.date, '2026-06-15');
        strict_1.default.equal(result.revenue, 1500);
        strict_1.default.equal(result.netRevenue, 1100);
    });
});
// ── Transaction Integration ──
(0, node_test_1.describe)('[finance] POST /finance/transactions/revenue — 交易收入', () => {
    (0, node_test_1.default)('记录交易收入', async () => {
        const ctrl = makeController();
        const result = await ctrl.recordTransactionRevenue(CTX, {
            orderId: 'O-1',
            transactionId: 'T-1',
            amount: 500,
            description: '订单 O-1 收款'
        });
        strict_1.default.equal(result.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(result.amount, 500);
        strict_1.default.equal(result.orderId, 'O-1');
    });
});
(0, node_test_1.describe)('[finance] POST /finance/transactions/refund — 交易退款', () => {
    (0, node_test_1.default)('记录交易退款', async () => {
        const ctrl = makeController();
        const result = await ctrl.recordTransactionRefund(CTX, {
            orderId: 'O-1',
            transactionId: 'T-2',
            amount: 100,
            description: '部分退款'
        });
        strict_1.default.equal(result.type, finance_entity_1.LedgerType.Refund);
        strict_1.default.equal(result.amount, 100);
    });
});
// ── 异常与边界场景 ──
(0, node_test_1.describe)('异常与边界场景', () => {
    (0, node_test_1.default)('service 抛出异常向上传播到 controller', async () => {
        const ctrl = makeController({
            recordLedger: async () => { throw new Error('Database timeout'); }
        });
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 100,
            description: 'test'
        });
        await strict_1.default.rejects(ctrl.recordLedger(CTX, dto), /Database timeout/);
    });
    (0, node_test_1.default)('空 tenant 传递时仍能执行', async () => {
        const emptyCtx = {};
        const ctrl = makeController();
        const result = ctrl.getRevenueSummary(emptyCtx);
        strict_1.default.ok(typeof result.totalRevenue === 'number');
    });
    (0, node_test_1.default)('listLedgers 不带查询参数', () => {
        const ctrl = makeController();
        const result = ctrl.listLedgers(CTX, {});
        strict_1.default.ok(Array.isArray(result));
    });
    (0, node_test_1.default)('listInvoices 不带查询参数', () => {
        const ctrl = makeController();
        const result = ctrl.listInvoices(CTX, {});
        strict_1.default.ok(Array.isArray(result));
    });
    (0, node_test_1.default)('listAccounts 不带 storeId', () => {
        const ctrl = makeController();
        const result = ctrl.listAccounts(CTX);
        strict_1.default.ok(Array.isArray(result));
    });
});
//# sourceMappingURL=finance.controller.test.js.map