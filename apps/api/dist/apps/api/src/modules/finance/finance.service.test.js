"use strict";
/**
 * 🐜 自动: [finance] [C] 合约 + service 测试
 *
 * 覆盖 FinanceService 的核心 API:
 *   - Ledger 记账 (revenue/expense/refund/adjustment) + balance 计算
 *   - Account 账户管理 (active/frozen/closed)
 *   - Settlement 结算 (Pending → Confirmed/Disputed)
 *   - Invoice 发票 (Draft → Issued/Cancelled)
 *   - Revenue Summary / Daily Revenue 汇总
 *   - 跨租户隔离
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
const finance_service_1 = require("./finance.service");
const finance_entity_1 = require("./finance.entity");
function makeService() {
    (0, finance_service_1.resetFinanceServiceTestState)();
    return new finance_service_1.FinanceService();
}
const CTX_A = { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn' };
const CTX_B = { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn' };
// ─── Ledger 合约 ───────────────────────────────────────
(0, node_test_1.describe)('[finance] 合约: Ledger 记账', () => {
    (0, node_test_1.default)('Revenue 类型增加 balance', async () => {
        const svc = makeService();
        const l = await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 1000,
            description: '订单收入'
        });
        strict_1.default.equal(l.balance, 1000);
    });
    (0, node_test_1.default)('Expense 类型减少 balance', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 1000, description: 'init' });
        const l = await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 300,
            description: '水电费'
        });
        strict_1.default.equal(l.balance, 700);
    });
    (0, node_test_1.default)('Refund 类型减少 balance', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 1000, description: 'init' });
        const l = await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Refund,
            amount: 200,
            description: '退款'
        });
        strict_1.default.equal(l.balance, 800);
    });
    (0, node_test_1.default)('Adjustment 类型增加 balance', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 1000, description: 'init' });
        const l = await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Adjustment,
            amount: 50,
            description: '调账'
        });
        strict_1.default.equal(l.balance, 1050);
    });
    (0, node_test_1.default)('recordTransactionRevenue 联动写 Ledger', async () => {
        const svc = makeService();
        const l = await svc.recordTransactionRevenue(CTX_A, {
            orderId: 'O-1',
            transactionId: 'T-1',
            amount: 500,
            description: '订单 O-1 收款'
        });
        strict_1.default.equal(l.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(l.orderId, 'O-1');
        strict_1.default.equal(l.category, 'transaction');
        strict_1.default.equal(l.balance, 500);
    });
    (0, node_test_1.default)('recordTransactionRefund 联动写 Ledger', async () => {
        const svc = makeService();
        await svc.recordTransactionRevenue(CTX_A, { orderId: 'O', transactionId: 'T', amount: 500, description: 'x' });
        const l = await svc.recordTransactionRefund(CTX_A, {
            orderId: 'O',
            transactionId: 'T-2',
            amount: 100,
            description: '部分退款'
        });
        strict_1.default.equal(l.type, finance_entity_1.LedgerType.Refund);
        strict_1.default.equal(l.balance, 400);
    });
    (0, node_test_1.default)('listLedgers 按 type 过滤', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 100, description: "test" });
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Expense, amount: 30, description: "test" });
        const revs = svc.listLedgers(CTX_A, { type: finance_entity_1.LedgerType.Revenue });
        strict_1.default.equal(revs.length, 1);
        strict_1.default.equal(revs[0].type, finance_entity_1.LedgerType.Revenue);
    });
    (0, node_test_1.default)('listLedgers limit 限制', async () => {
        const svc = makeService();
        for (let i = 0; i < 5; i++) {
            await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 10, description: "test" });
        }
        strict_1.default.equal(svc.listLedgers(CTX_A, { limit: 3 }).length, 3);
    });
    (0, node_test_1.default)('listLedgers 按日期范围', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 100,
            recordedAt: '2026-06-01T00:00:00Z',
            description: 'a'
        });
        await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 200,
            recordedAt: '2026-06-15T00:00:00Z',
            description: 'b'
        });
        const result = svc.listLedgers(CTX_A, {
            recordedAfter: '2026-06-10T00:00:00Z',
            recordedBefore: '2026-06-30T00:00:00Z'
        });
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].amount, 200);
    });
    (0, node_test_1.default)('getLedger 不存在 → throw', async () => {
        const svc = makeService();
        strict_1.default.throws(() => svc.getLedger('non-existent', CTX_A));
    });
});
// ─── Account 合约 ──────────────────────────────────────
(0, node_test_1.describe)('[finance] 合约: Account 账户', () => {
    (0, node_test_1.default)('createAccount → getAccount', async () => {
        const svc = makeService();
        const a = await svc.createAccount(CTX_A, {
            name: '现金账户',
            type: finance_entity_1.AccountType.Cash,
            initialBalance: 1000
        });
        strict_1.default.equal(a.balance, 1000);
        strict_1.default.equal(a.status, finance_entity_1.AccountStatus.Active);
        const fetched = svc.getAccount(a.id, CTX_A);
        strict_1.default.equal(fetched.id, a.id);
    });
    (0, node_test_1.default)('freezeAccount Active → Frozen', async () => {
        const svc = makeService();
        const a = await svc.createAccount(CTX_A, { name: 'X', type: finance_entity_1.AccountType.Cash });
        const frozen = svc.freezeAccount(a.id, CTX_A);
        strict_1.default.equal(frozen.status, finance_entity_1.AccountStatus.Frozen);
    });
    (0, node_test_1.default)('freezeAccount 非 Active 状态报错', async () => {
        const svc = makeService();
        const a = await svc.createAccount(CTX_A, { name: 'X', type: finance_entity_1.AccountType.Cash });
        svc.freezeAccount(a.id, CTX_A);
        strict_1.default.throws(() => svc.freezeAccount(a.id, CTX_A));
    });
    (0, node_test_1.default)('closeAccount → Closed, 重复 close 报错', async () => {
        const svc = makeService();
        const a = await svc.createAccount(CTX_A, { name: 'X', type: finance_entity_1.AccountType.Cash });
        const closed = svc.closeAccount(a.id, CTX_A);
        strict_1.default.equal(closed.status, finance_entity_1.AccountStatus.Closed);
        strict_1.default.throws(() => svc.closeAccount(a.id, CTX_A));
    });
    (0, node_test_1.default)('getAccountBalance 摘要字段', async () => {
        const svc = makeService();
        const a = await svc.createAccount(CTX_A, {
            name: '现金',
            type: finance_entity_1.AccountType.Cash,
            initialBalance: 500
        });
        const bal = svc.getAccountBalance(a.id, CTX_A);
        strict_1.default.equal(bal.balance, 500);
        strict_1.default.equal(bal.status, finance_entity_1.AccountStatus.Active);
        strict_1.default.equal(bal.name, '现金');
    });
});
// ─── Settlement 合约 ───────────────────────────────────
(0, node_test_1.describe)('[finance] 合约: Settlement 结算', () => {
    (0, node_test_1.default)('createSettlement 自动计算 revenue/expense', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 1000, description: "test" });
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Expense, amount: 300, description: "test" });
        const s = await svc.createSettlement(CTX_A, {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2030-01-01T00:00:00Z'
        });
        strict_1.default.equal(s.totalRevenue, 1000);
        strict_1.default.equal(s.totalExpense, 300);
        strict_1.default.equal(s.netProfit, 700);
        strict_1.default.equal(s.settlementStatus, finance_entity_1.SettlementStatus.Pending);
    });
    (0, node_test_1.default)('confirmSettlement Pending → Confirmed', async () => {
        const svc = makeService();
        const s = await svc.createSettlement(CTX_A, {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2030-01-01T00:00:00Z'
        });
        const c = svc.confirmSettlement(s.id, CTX_A);
        strict_1.default.equal(c.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
    });
    (0, node_test_1.default)('disputeSettlement Pending → Disputed', async () => {
        const svc = makeService();
        const s = await svc.createSettlement(CTX_A, {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2030-01-01T00:00:00Z'
        });
        const d = svc.disputeSettlement(s.id, CTX_A);
        strict_1.default.equal(d.settlementStatus, finance_entity_1.SettlementStatus.Disputed);
    });
    (0, node_test_1.default)('Confirmed 状态不能再次 confirm', async () => {
        const svc = makeService();
        const s = await svc.createSettlement(CTX_A, {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2030-01-01T00:00:00Z'
        });
        svc.confirmSettlement(s.id, CTX_A);
        strict_1.default.throws(() => svc.confirmSettlement(s.id, CTX_A));
    });
    (0, node_test_1.default)('getSettlementDetail 包含 ledgers', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 100, description: "test" });
        const s = await svc.createSettlement(CTX_A, {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2030-01-01T00:00:00Z'
        });
        const detail = svc.getSettlementDetail(s.id, CTX_A);
        strict_1.default.ok(detail.settlement);
        strict_1.default.ok(Array.isArray(detail.ledgers));
        strict_1.default.ok(detail.ledgers.length >= 1);
    });
});
// ─── Invoice 合约 ──────────────────────────────────────
(0, node_test_1.describe)('[finance] 合约: Invoice 发票', () => {
    (0, node_test_1.default)('createInvoice Draft + taxAmount 自动加总', async () => {
        const svc = makeService();
        const inv = await svc.createInvoice(CTX_A, {
            amount: 1000,
            taxAmount: 130,
            type: finance_entity_1.InvoiceType.Vat,
            orderId: 'O-1',
            buyerInfo: { name: '客户A', taxNo: '123' }
        });
        strict_1.default.equal(inv.totalAmount, 1130);
        strict_1.default.equal(inv.status, finance_entity_1.InvoiceStatus.Draft);
        strict_1.default.match(inv.invoiceNo, /^INV-/);
    });
    (0, node_test_1.default)('issueInvoice Draft → Issued', async () => {
        const svc = makeService();
        const inv = await svc.createInvoice(CTX_A, {
            amount: 100, type: finance_entity_1.InvoiceType.Regular, orderId: 'O-1'
        });
        const issued = svc.issueInvoice(inv.id, CTX_A);
        strict_1.default.equal(issued.status, finance_entity_1.InvoiceStatus.Issued);
        strict_1.default.ok(issued.issuedAt);
    });
    (0, node_test_1.default)('issueInvoice 非 Draft 报错', async () => {
        const svc = makeService();
        const inv = await svc.createInvoice(CTX_A, {
            amount: 100, type: finance_entity_1.InvoiceType.Regular, orderId: 'O-1'
        });
        svc.issueInvoice(inv.id, CTX_A);
        strict_1.default.throws(() => svc.issueInvoice(inv.id, CTX_A));
    });
    (0, node_test_1.default)('cancelInvoice → Cancelled', async () => {
        const svc = makeService();
        const inv = await svc.createInvoice(CTX_A, {
            amount: 100, type: finance_entity_1.InvoiceType.Regular, orderId: 'O-1'
        });
        const c = svc.cancelInvoice(inv.id, CTX_A);
        strict_1.default.equal(c.status, finance_entity_1.InvoiceStatus.Cancelled);
    });
    (0, node_test_1.default)('cancelInvoice 已取消报错', async () => {
        const svc = makeService();
        const inv = await svc.createInvoice(CTX_A, {
            amount: 100, type: finance_entity_1.InvoiceType.Regular, orderId: 'O-1'
        });
        svc.cancelInvoice(inv.id, CTX_A);
        strict_1.default.throws(() => svc.cancelInvoice(inv.id, CTX_A));
    });
});
// ─── Revenue Summary 合约 ──────────────────────────────
(0, node_test_1.describe)('[finance] 合约: 营收汇总', () => {
    (0, node_test_1.default)('getRevenueSummary 聚合 revenue/expense/refund', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 1000, description: "test" });
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Expense, amount: 300, description: "test" });
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Refund, amount: 50, description: "test" });
        const summary = svc.getRevenueSummary(CTX_A, {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2030-01-01T00:00:00Z'
        });
        strict_1.default.equal(summary.totalRevenue, 1000);
        strict_1.default.equal(summary.totalExpense, 300);
        strict_1.default.equal(summary.totalRefund, 50);
        strict_1.default.equal(summary.netRevenue, 650);
        strict_1.default.equal(summary.transactionCount, 3);
    });
    (0, node_test_1.default)('getDailyRevenue 按日期过滤', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 500,
            recordedAt: '2026-06-15T10:00:00Z',
            description: 'a'
        });
        await svc.recordLedger(CTX_A, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 300,
            recordedAt: '2026-06-16T10:00:00Z',
            description: 'b'
        });
        const daily = svc.getDailyRevenue(CTX_A, { date: '2026-06-15' });
        strict_1.default.equal(daily.revenue, 500);
        strict_1.default.equal(daily.transactionCount, 1);
    });
});
// ─── 跨租户隔离合约 ────────────────────────────────────
(0, node_test_1.describe)('[finance] 合约: 跨租户隔离', () => {
    (0, node_test_1.default)('tenant-B 看不到 tenant-A 的 ledger', async () => {
        const svc = makeService();
        await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 100, description: "test" });
        const all = svc.listLedgers(CTX_B);
        strict_1.default.equal(all.length, 0);
    });
    (0, node_test_1.default)('tenant-B 不能 getLedger tenant-A 的 entry', async () => {
        const svc = makeService();
        const l = await svc.recordLedger(CTX_A, { type: finance_entity_1.LedgerType.Revenue, amount: 100, description: "test" });
        strict_1.default.throws(() => svc.getLedger(l.id, CTX_B));
    });
    (0, node_test_1.default)('tenant-B 不能 getAccount tenant-A 的账户', async () => {
        const svc = makeService();
        const a = await svc.createAccount(CTX_A, { name: 'X', type: finance_entity_1.AccountType.Cash });
        strict_1.default.throws(() => svc.getAccount(a.id, CTX_B));
    });
    (0, node_test_1.default)('tenant-B 不能 confirmSettlement tenant-A 的结算', async () => {
        const svc = makeService();
        const s = await svc.createSettlement(CTX_A, {
            startDate: '2020-01-01T00:00:00Z',
            endDate: '2030-01-01T00:00:00Z'
        });
        strict_1.default.throws(() => svc.confirmSettlement(s.id, CTX_B));
    });
});
//# sourceMappingURL=finance.service.test.js.map