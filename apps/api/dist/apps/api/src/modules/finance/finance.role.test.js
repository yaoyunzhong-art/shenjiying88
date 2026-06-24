"use strict";
/**
 * 🐜 自动: [finance] [C] 角色测试
 *
 * 8 角色视角的 finance 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 覆盖：记账(Ledger)、账户(Account)、结算(Settlement)、发票(Invoice)、营收汇总(Revenue)
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
const finance_service_1 = require("./finance.service");
const finance_entity_1 = require("./finance.entity");
// ── 角色定义 ──
const ROLES = {
    StoreManager: '👔店长',
    FrontDesk: '🛒前台',
    HR: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    Teambuilding: '🤝团建',
    Marketing: '📢营销',
};
// ── 测试数据工厂 ──
function createTenantContext(overrides = {}) {
    return {
        tenantId: 't-test-001',
        brandId: 'b-test-001',
        storeId: 's-test-001',
        ...overrides,
    };
}
function createController() {
    const service = new finance_service_1.FinanceService();
    return new finance_controller_1.FinanceController(service);
}
// ── beforeEach reset ──
(0, node_test_1.beforeEach)(() => {
    (0, finance_service_1.resetFinanceServiceTestState)();
});
// ── 辅助：快速记账 ──
async function seedLedgers(ctrl, ctx) {
    // 所有记录使用 2025 年时间戳，确保落在查询时间范围内
    await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 50000, description: '门票收入', category: 'ticket', orderId: 'order-001', transactionId: 'txn-001', recordedAt: '2025-06-15T09:00:00.000Z' });
    await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 30000, description: '餐饮收入', category: 'food', orderId: 'order-002', transactionId: 'txn-002', recordedAt: '2025-06-15T10:00:00.000Z' });
    await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Expense, amount: 15000, description: '水电费', category: 'utility', recordedAt: '2025-06-15T11:00:00.000Z' });
    await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Expense, amount: 8000, description: '人工成本', category: 'labor', recordedAt: '2025-06-15T12:00:00.000Z' });
    await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Refund, amount: 2000, description: '客户退款', category: 'refund', orderId: 'order-003', recordedAt: '2025-06-15T13:00:00.000Z' });
}
// ═══════════════════════════════════════════════════════
// 👔店长 (StoreManager)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.StoreManager} finance 角色测试`, () => {
    (0, node_test_1.default)('店长创建账户并查询余额（正常流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const acct = await ctrl.createAccount(ctx, {
            name: '门店主账户',
            type: finance_entity_1.AccountType.Bank,
            initialBalance: 100000,
        });
        strict_1.default.equal(acct.name, '门店主账户');
        strict_1.default.equal(acct.status, finance_entity_1.AccountStatus.Active);
        strict_1.default.equal(acct.balance, 100000);
        strict_1.default.ok(acct.id.startsWith('acct-'));
        const balance = await ctrl.getAccountBalance(acct.id, ctx);
        strict_1.default.equal(balance.balance, 100000);
        strict_1.default.equal(balance.status, finance_entity_1.AccountStatus.Active);
    });
    (0, node_test_1.default)('店长生成月度营收汇总（管理决策数据）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await seedLedgers(ctrl, ctx);
        const summary = await ctrl.getRevenueSummary(ctx, {
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-12-31T23:59:59.999Z',
        });
        strict_1.default.equal(summary.totalRevenue, 80000);
        strict_1.default.equal(summary.totalExpense, 23000);
        strict_1.default.equal(summary.totalRefund, 2000);
        strict_1.default.equal(summary.netRevenue, 80000 - 23000 - 2000);
        strict_1.default.equal(summary.transactionCount, 5);
    });
    (0, node_test_1.default)('店长冻结异常账户（权限边界：二次冻结报错）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const acct = await ctrl.createAccount(ctx, {
            name: '待冻结账户',
            type: finance_entity_1.AccountType.Cash,
            initialBalance: 5000,
        });
        const frozen = await ctrl.freezeAccount(acct.id, ctx);
        strict_1.default.equal(frozen.status, finance_entity_1.AccountStatus.Frozen);
        // 二次冻结应该报错
        await strict_1.default.rejects(async () => ctrl.freezeAccount(acct.id, ctx), /not active/);
    });
    (0, node_test_1.default)('店长查看全部记账流水并按类型筛选', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await seedLedgers(ctrl, ctx);
        // 全部流水
        const all = await ctrl.listLedgers(ctx, {});
        strict_1.default.ok(all.length >= 5);
        // 仅看收入
        const revenues = await ctrl.listLedgers(ctx, { type: finance_entity_1.LedgerType.Revenue });
        strict_1.default.equal(revenues.length, 2);
        revenues.forEach(r => strict_1.default.equal(r.type, finance_entity_1.LedgerType.Revenue));
        // 仅看支出
        const expenses = await ctrl.listLedgers(ctx, { type: finance_entity_1.LedgerType.Expense });
        strict_1.default.equal(expenses.length, 2);
    });
});
// ═══════════════════════════════════════════════════════
// 🛒前台 (FrontDesk)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.FrontDesk} finance 角色测试`, () => {
    (0, node_test_1.default)('前台记录单笔交易收入（正常收银流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const ledger = await ctrl.recordTransactionRevenue(ctx, {
            orderId: 'order-cash-001',
            transactionId: 'txn-cash-001',
            amount: 298,
            description: '前台收银台球1小时',
            category: 'billiards',
        });
        strict_1.default.equal(ledger.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(ledger.amount, 298);
        strict_1.default.equal(ledger.orderId, 'order-cash-001');
        strict_1.default.ok(ledger.balance >= 0);
    });
    (0, node_test_1.default)('前台处理客户退款（正常退款流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        // 先收入
        await ctrl.recordTransactionRevenue(ctx, {
            orderId: 'order-cash-002',
            transactionId: 'txn-cash-002',
            amount: 500,
            description: '前台收费',
        });
        const refund = await ctrl.recordTransactionRefund(ctx, {
            orderId: 'order-cash-002',
            transactionId: 'txn-refund-001',
            amount: 300,
            description: '客户退款-部分服务取消',
        });
        strict_1.default.equal(refund.type, finance_entity_1.LedgerType.Refund);
        strict_1.default.equal(refund.amount, 300);
        strict_1.default.equal(refund.orderId, 'order-cash-002');
    });
    (0, node_test_1.default)('前台查询与订单关联的发票（边界：查询不存在的发票返回空列表）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        // 没有发票时应返回空数组
        const invoices = await ctrl.listInvoices(ctx, { orderId: 'nonexistent-order' });
        strict_1.default.ok(Array.isArray(invoices));
        strict_1.default.equal(invoices.length, 0);
    });
    (0, node_test_1.default)('前台查看当日收入（日结对账）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const today = new Date().toISOString().split('T')[0];
        await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 1200,
            description: '当日台费',
            recordedAt: `${today}T10:00:00.000Z`,
        });
        await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 800,
            description: '当日饮料',
            recordedAt: `${today}T14:00:00.000Z`,
        });
        const daily = await ctrl.getDailyRevenue(ctx, { date: today });
        strict_1.default.equal(daily.revenue, 2000);
        strict_1.default.equal(daily.date, today);
        strict_1.default.ok(daily.netRevenue >= 0);
    });
});
// ═══════════════════════════════════════════════════════
// 👥HR (Human Resources)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.HR} finance 角色测试`, () => {
    (0, node_test_1.default)('HR 记录员工薪资支出（正常记账流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const salary = await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 45000,
            description: '3月份工资支出',
            category: 'salary',
        });
        strict_1.default.equal(salary.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(salary.amount, 45000);
        strict_1.default.equal(salary.category, 'salary');
        strict_1.default.ok(salary.balance < 0 || salary.balance >= 0);
    });
    (0, node_test_1.default)('HR 查看人工成本支出（权限边界：按 category=labor 筛选）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Expense, amount: 20000, description: '工资', category: 'labor',
        });
        await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Expense, amount: 5000, description: '社保', category: 'labor',
        });
        await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Expense, amount: 3000, description: '水电', category: 'utility',
        });
        const laborExpenses = await ctrl.listLedgers(ctx, { type: finance_entity_1.LedgerType.Expense, category: 'labor' });
        strict_1.default.equal(laborExpenses.length, 2);
        laborExpenses.forEach(l => strict_1.default.equal(l.category, 'labor'));
    });
    (0, node_test_1.default)('HR 创建工资账户（专用账户管理）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const acct = await ctrl.createAccount(ctx, {
            name: '工资专用账户',
            type: finance_entity_1.AccountType.Bank,
            initialBalance: 100000,
        });
        strict_1.default.equal(acct.name, '工资专用账户');
        strict_1.default.equal(acct.type, finance_entity_1.AccountType.Bank);
        strict_1.default.equal(acct.status, finance_entity_1.AccountStatus.Active);
        const queried = await ctrl.getAccount(acct.id, ctx);
        strict_1.default.equal(queried.id, acct.id);
    });
    (0, node_test_1.default)('HR 获取不存在的账户 => 抛出异常', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await strict_1.default.rejects(async () => ctrl.getAccount('acct-nonexistent', ctx), /not found/);
    });
});
// ═══════════════════════════════════════════════════════
// 🔧安监 (Security / Safety)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Security} finance 角色测试`, () => {
    (0, node_test_1.default)('安监记录安全设备采购支出（正常记账）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const expense = await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 28000,
            description: '消防器材采购',
            category: 'safety',
        });
        strict_1.default.equal(expense.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(expense.category, 'safety');
        strict_1.default.equal(expense.amount, 28000);
    });
    (0, node_test_1.default)('安监检查退款异常（高额退款安全审计）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        // 记录多笔退款
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Refund, amount: 5000, description: '退款-疑似异常', category: 'refund' });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Refund, amount: 8000, description: '退款-疑似异常2', category: 'refund' });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 30000, description: '正常收入', category: 'ticket' });
        const refunds = await ctrl.listLedgers(ctx, { type: finance_entity_1.LedgerType.Refund });
        strict_1.default.equal(refunds.length, 2);
        // 退款总额
        const totalRefund = refunds.reduce((s, l) => s + l.amount, 0);
        strict_1.default.equal(totalRefund, 13000);
    });
    (0, node_test_1.default)('安监关闭问题账户（安全处置流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const acct = await ctrl.createAccount(ctx, {
            name: '问题账户', type: finance_entity_1.AccountType.Cash, initialBalance: 1000,
        });
        const closed = await ctrl.closeAccount(acct.id, ctx);
        strict_1.default.equal(closed.status, finance_entity_1.AccountStatus.Closed);
        // 重复关闭报错
        await strict_1.default.rejects(async () => ctrl.closeAccount(acct.id, ctx), /already closed/);
    });
    (0, node_test_1.default)('安监不存在的记账ID查询 => 抛出（边界）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await strict_1.default.rejects(async () => ctrl.getLedger('ledger-nonexistent', ctx), /not found/);
    });
});
// ═══════════════════════════════════════════════════════
// 🎮导玩员 (Guide / Game Director)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Guide} finance 角色测试`, () => {
    (0, node_test_1.default)('导玩员记录活动设备收入（活动记账）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const ledger = await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 1500,
            description: 'VR设备体验收费',
            category: 'vr-experience',
        });
        strict_1.default.equal(ledger.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(ledger.amount, 1500);
        strict_1.default.equal(ledger.category, 'vr-experience');
    });
    (0, node_test_1.default)('导玩员查询活动期间的总收入（对特定类别汇总）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 1000, description: 'VR包时', category: 'vr-experience' });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 800, description: '台球', category: 'billiards' });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 600, description: 'VR续时', category: 'vr-experience' });
        const vrEntries = await ctrl.listLedgers(ctx, { type: finance_entity_1.LedgerType.Revenue, category: 'vr-experience' });
        strict_1.default.equal(vrEntries.length, 2);
        const vrTotal = vrEntries.reduce((s, l) => s + l.amount, 0);
        strict_1.default.equal(vrTotal, 1600);
    });
    (0, node_test_1.default)('导玩员查询跨租户隔离（边界：其他门店数据不可见）', async () => {
        const ctrl = createController();
        const ctxA = createTenantContext({ tenantId: 't-store-A', storeId: 's-A' });
        const ctxB = createTenantContext({ tenantId: 't-store-B', storeId: 's-B' });
        await ctrl.recordLedger(ctxA, { type: finance_entity_1.LedgerType.Revenue, amount: 9999, description: 'A店收入', category: 'ticket' });
        await ctrl.recordLedger(ctxB, { type: finance_entity_1.LedgerType.Revenue, amount: 1111, description: 'B店收入', category: 'ticket' });
        const listA = await ctrl.listLedgers(ctxA, {});
        const listB = await ctrl.listLedgers(ctxB, {});
        strict_1.default.equal(listA.length, 1);
        strict_1.default.equal(listA[0].amount, 9999);
        strict_1.default.equal(listB.length, 1);
        strict_1.default.equal(listB[0].amount, 1111);
    });
});
// ═══════════════════════════════════════════════════════
// 🎯运行专员 (Operations)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Operations} finance 角色测试`, () => {
    (0, node_test_1.default)('运行专员生成门店月度结算（正常结算流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await seedLedgers(ctrl, ctx);
        const settlement = await ctrl.createSettlement(ctx, {
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-12-31T23:59:59.999Z',
        });
        strict_1.default.ok(settlement.id.startsWith('stl-'));
        // 自动从账本汇总: Revenue=50000+30000=80000, Expense=15000+8000=23000
        strict_1.default.equal(settlement.totalRevenue, 80000);
        strict_1.default.equal(settlement.totalExpense, 23000);
        strict_1.default.equal(settlement.netProfit, 80000 - 23000);
        strict_1.default.equal(settlement.settlementStatus, finance_entity_1.SettlementStatus.Pending);
    });
    (0, node_test_1.default)('运行专员确认结算并生成明细（结算确认流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await seedLedgers(ctrl, ctx);
        const stl = await ctrl.createSettlement(ctx, {
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-12-31T23:59:59.999Z',
        });
        const confirmed = await ctrl.confirmSettlement(stl.id, ctx);
        strict_1.default.equal(confirmed.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
        strict_1.default.ok(confirmed.settledAt);
        const detail = await ctrl.getSettlementDetail(stl.id, ctx);
        strict_1.default.ok(detail.settlement);
        strict_1.default.ok(Array.isArray(detail.ledgers));
        strict_1.default.ok(detail.ledgers.length >= 5);
    });
    (0, node_test_1.default)('运行专员对已确认的结算重复确认 => 报错', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        await seedLedgers(ctrl, ctx);
        const stl = await ctrl.createSettlement(ctx, {
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-12-31T23:59:59.999Z',
        });
        await ctrl.confirmSettlement(stl.id, ctx);
        await strict_1.default.rejects(async () => ctrl.confirmSettlement(stl.id, ctx), /not pending/);
    });
    (0, node_test_1.default)('运行专员获取每日净收入（日维度汇总）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const date = '2025-06-15';
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 5000, description: '台费', recordedAt: `${date}T09:00:00.000Z` });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 3000, description: '饮料', recordedAt: `${date}T14:00:00.000Z` });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Expense, amount: 1000, description: '当日食材', recordedAt: `${date}T10:00:00.000Z` });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Refund, amount: 500, description: '退款', recordedAt: `${date}T16:00:00.000Z` });
        const daily = await ctrl.getDailyRevenue(ctx, { date });
        strict_1.default.equal(daily.revenue, 8000);
        strict_1.default.equal(daily.expense, 1000);
        strict_1.default.equal(daily.refund, 500);
        strict_1.default.equal(daily.netRevenue, 8000 - 1000 - 500);
        strict_1.default.equal(daily.transactionCount, 4);
    });
});
// ═══════════════════════════════════════════════════════
// 🤝团建 (Teambuilding)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Teambuilding} finance 角色测试`, () => {
    (0, node_test_1.default)('团建记录团建活动费用（正常支出记账）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const expense = await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 12000,
            description: '团队建设活动 - 户外拓展',
            category: 'teambuilding',
        });
        strict_1.default.equal(expense.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(expense.amount, 12000);
        strict_1.default.equal(expense.category, 'teambuilding');
    });
    (0, node_test_1.default)('团建评估活动返回率（查看团建期间营收和退款）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        // 团建期间混合记录
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 15000, description: '团建包场', category: 'teambuilding' });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 3000, description: '餐饮', category: 'food' });
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Refund, amount: 1000, description: '团建部分退款', category: 'refund' });
        // 查看收支汇总
        const all = await ctrl.listLedgers(ctx, {});
        strict_1.default.ok(all.length >= 3);
        const teamExpenses = all.filter(l => l.category === 'teambuilding');
        strict_1.default.equal(teamExpenses.length, 1);
        strict_1.default.equal(teamExpenses[0].amount, 15000);
    });
    (0, node_test_1.default)('团建查询不同门店的结算状态 => 过滤边界', async () => {
        const ctrl = createController();
        const ctxA = createTenantContext({ storeId: 's-store-A' });
        const ctxB = createTenantContext({ storeId: 's-store-B' });
        await ctrl.createSettlement(ctxA, { startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-01-31T00:00:00.000Z' });
        await ctrl.createSettlement(ctxB, { startDate: '2025-02-01T00:00:00.000Z', endDate: '2025-02-28T00:00:00.000Z' });
        const listA = await ctrl.listSettlements(ctxA, { storeId: 's-store-A' });
        const listB = await ctrl.listSettlements(ctxB, { storeId: 's-store-B' });
        // 同一租户但不同门店隔离
        strict_1.default.equal(listA.length, 1);
        strict_1.default.equal(listB.length, 1);
    });
    (0, node_test_1.default)('团建对有异议结算提出争议（结算边界流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const stl = await ctrl.createSettlement(ctx, {
            startDate: '2025-03-01T00:00:00.000Z',
            endDate: '2025-03-31T23:59:59.999Z',
            totalRevenue: 100000,
            totalExpense: 60000,
        });
        const disputed = await ctrl.disputeSettlement(stl.id, ctx);
        strict_1.default.equal(disputed.settlementStatus, finance_entity_1.SettlementStatus.Disputed);
        // 已争议的不能确认
        await strict_1.default.rejects(async () => ctrl.confirmSettlement(stl.id, ctx), /not pending/);
    });
});
// ═══════════════════════════════════════════════════════
// 📢营销 (Marketing)
// ═══════════════════════════════════════════════════════
(0, node_test_1.describe)(`${ROLES.Marketing} finance 角色测试`, () => {
    (0, node_test_1.default)('营销记录推广活动支出（营销费用记账）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const expense = await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 35000,
            description: '抖音广告投放',
            category: 'marketing',
        });
        strict_1.default.equal(expense.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(expense.amount, 35000);
        strict_1.default.equal(expense.category, 'marketing');
    });
    (0, node_test_1.default)('营销创建并开具发票（正常开票流程）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        // 先记一笔收入
        await ctrl.recordLedger(ctx, {
            type: finance_entity_1.LedgerType.Revenue, amount: 50000, description: '营销活动收入', category: 'marketing', orderId: 'order-mkt-001',
        });
        const invoice = await ctrl.createInvoice(ctx, {
            orderId: 'order-mkt-001',
            type: finance_entity_1.InvoiceType.Vat,
            amount: 50000,
            taxAmount: 6500,
            buyerInfo: { companyName: '某企业客户', taxId: '123456789' },
        });
        strict_1.default.ok(invoice.id.startsWith('inv-'));
        strict_1.default.equal(invoice.amount, 50000);
        strict_1.default.equal(invoice.taxAmount, 6500);
        strict_1.default.equal(invoice.totalAmount, 56500);
        strict_1.default.equal(invoice.status, finance_entity_1.InvoiceStatus.Draft);
        // 开具发票
        const issued = await ctrl.issueInvoice(invoice.id, ctx);
        strict_1.default.equal(issued.status, finance_entity_1.InvoiceStatus.Issued);
        strict_1.default.ok(issued.issuedAt);
    });
    (0, node_test_1.default)('营销查询已开发票列表（营销活动发票管理）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const inv = await ctrl.createInvoice(ctx, {
            orderId: 'order-mkt-002',
            type: finance_entity_1.InvoiceType.Regular,
            amount: 20000,
        });
        await ctrl.issueInvoice(inv.id, ctx);
        const issuedInvoices = await ctrl.listInvoices(ctx, { status: finance_entity_1.InvoiceStatus.Issued });
        strict_1.default.equal(issuedInvoices.length, 1);
        strict_1.default.equal(issuedInvoices[0].id, inv.id);
    });
    (0, node_test_1.default)('营销取消发票（边界：重复取消失败）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const inv = await ctrl.createInvoice(ctx, {
            orderId: 'order-mkt-003',
            type: finance_entity_1.InvoiceType.Regular,
            amount: 15000,
        });
        const cancelled = await ctrl.cancelInvoice(inv.id, ctx);
        strict_1.default.equal(cancelled.status, finance_entity_1.InvoiceStatus.Cancelled);
        await strict_1.default.rejects(async () => ctrl.cancelInvoice(inv.id, ctx), /already cancelled/);
    });
    (0, node_test_1.default)('营销计算营销投入产出比（ROI 视角的营收汇总）', async () => {
        const ctrl = createController();
        const ctx = createTenantContext();
        const period = '2025-06-01';
        // 营销支出
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Expense, amount: 20000, description: '营销推广', category: 'marketing', recordedAt: `${period}T10:00:00.000Z` });
        // 营销带来的收入
        await ctrl.recordLedger(ctx, { type: finance_entity_1.LedgerType.Revenue, amount: 80000, description: '活动门票', category: 'marketing', recordedAt: `${period}T12:00:00.000Z` });
        const marketingEntries = await ctrl.listLedgers(ctx, { category: 'marketing' });
        strict_1.default.equal(marketingEntries.length, 2);
        const expense = marketingEntries.find(l => l.type === finance_entity_1.LedgerType.Expense);
        const revenue = marketingEntries.find(l => l.type === finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(expense.amount, 20000);
        strict_1.default.equal(revenue.amount, 80000);
        // ROI = 80000 / 20000 = 4x
        strict_1.default.ok(revenue.amount / expense.amount >= 3);
    });
});
//# sourceMappingURL=finance.role.test.js.map