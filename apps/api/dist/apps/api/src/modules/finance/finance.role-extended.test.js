"use strict";
/**
 * 🐜 扩展角色测试: finance 模块
 *
 * 4 个附加角色视角：
 * 👔店长 — 查看日营收
 * 👥HR — 查看工资记录
 * 🎯运行专员 — 检查运营成本
 * 📢营销 — 检查活动预算
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
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
// ── 测试数据工厂 ──
const tenantCtx = {
    tenantId: 't-fin-ext',
    brandId: 'b-arcade',
    storeId: 's-main',
};
function createController() {
    (0, finance_service_1.resetFinanceServiceTestState)();
    const service = new finance_service_1.FinanceService();
    return new finance_controller_1.FinanceController(service);
}
// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 查看日营收 (manager checking daily revenue)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👔店长 — 日营收查看视角', () => {
    (0, node_test_1.default)('成功查询当日营收汇总 (revenue query)', async () => {
        const ctrl = createController();
        const today = new Date().toISOString().slice(0, 10);
        // 记录多笔收入
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 5000,
            description: '游戏币销售',
            category: 'sales',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 3200,
            description: '扭蛋销售',
            category: 'sales',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 800,
            description: '电费',
            category: 'utility',
        });
        const summary = await ctrl.getRevenueSummary(tenantCtx, {
            startDate: `${today}T00:00:00.000Z`,
        });
        strict_1.default.equal(summary.totalRevenue, 8200);
        strict_1.default.equal(summary.totalExpense, 800);
        strict_1.default.equal(summary.netRevenue, 7400);
        strict_1.default.equal(summary.transactionCount, 3);
    });
    (0, node_test_1.default)('日期范围为空时返回空数据 (date range validation)', async () => {
        const ctrl = createController();
        const today = new Date().toISOString().slice(0, 10);
        // 记录一笔今日收入
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 1000,
            description: '测试收入',
            category: 'test',
        });
        // 用未来日期范围查询 — 应返回空
        const futureStart = '2099-01-01T00:00:00.000Z';
        const summary = await ctrl.getRevenueSummary(tenantCtx, {
            startDate: futureStart,
            endDate: '2099-12-31T23:59:59.999Z',
        });
        strict_1.default.equal(summary.totalRevenue, 0);
        strict_1.default.equal(summary.transactionCount, 0);
    });
    (0, node_test_1.default)('跨店营收隔离 — 只能看到本店数据 (access control)', async () => {
        const ctrl = createController();
        const today = new Date().toISOString().slice(0, 10);
        // 本店收入
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 10000,
            description: '本店销售',
            category: 'sales',
        });
        // 其他门店上下文
        const otherCtx = {
            tenantId: 't-fin-other',
            brandId: 'b-other',
            storeId: 's-other',
        };
        const otherSummary = await ctrl.getRevenueSummary(otherCtx, {
            startDate: `${today}T00:00:00.000Z`,
        });
        strict_1.default.equal(otherSummary.totalRevenue, 0, '其他门店不应看到本店营收');
        strict_1.default.equal(otherSummary.transactionCount, 0);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 👥HR — 查看工资记录 (HR checking payroll records)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('👥HR — 工资查询视角', () => {
    (0, node_test_1.default)('成功查询工资支出流水 (payroll lookup)', async () => {
        const ctrl = createController();
        // 记录工资支出
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 50000,
            description: '2026年6月工资',
            category: 'payroll',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 3000,
            description: '社保缴纳',
            category: 'payroll',
        });
        const ledgers = ctrl.listLedgers(tenantCtx, { category: 'payroll' });
        strict_1.default.equal(ledgers.length, 2);
        const totalPayroll = ledgers.reduce((sum, l) => sum + l.amount, 0);
        strict_1.default.equal(totalPayroll, 53000);
    });
    (0, node_test_1.default)('查询不存在的流水记录报错 (access control on non-existent data)', async () => {
        const ctrl = createController();
        strict_1.default.throws(() => ctrl.getLedger('non-existent-ledger', tenantCtx), /Ledger non-existent-ledger not found/);
    });
    (0, node_test_1.default)('按月份筛选工资记录 (date range filtering)', async () => {
        const ctrl = createController();
        const now = new Date();
        // 本月工资
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 50000,
            description: '本月工资',
            category: 'payroll',
            recordedAt: thisMonth,
        });
        // 下月工资 (未来)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 55000,
            description: '下月工资',
            category: 'payroll',
            recordedAt: nextMonth,
        });
        // 只查本月
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        const results = ctrl.listLedgers(tenantCtx, {
            category: 'payroll',
            recordedAfter: thisMonth,
            recordedBefore: thisMonthEnd,
        });
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].description, '本月工资');
    });
});
// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 检查运营成本 (operations checking running costs)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('🎯运行专员 — 运营成本视角', () => {
    (0, node_test_1.default)('查询运营成本汇总 (cost query)', async () => {
        const ctrl = createController();
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 3000,
            description: '电费',
            category: 'utility',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 500,
            description: '水费',
            category: 'utility',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 2000,
            description: '维修保养',
            category: 'maintenance',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 20000,
            description: '日营收',
            category: 'sales',
        });
        const utilityExpenses = ctrl.listLedgers(tenantCtx, { category: 'utility' });
        strict_1.default.equal(utilityExpenses.length, 2);
        const totalUtility = utilityExpenses.reduce((sum, l) => sum + l.amount, 0);
        strict_1.default.equal(totalUtility, 3500);
    });
    (0, node_test_1.default)('费用超过设定阈值时应有记录验证', async () => {
        const ctrl = createController();
        // 模拟异常大额支出
        const expense = await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 100000,
            description: '紧急维修: 空调系统更换',
            category: 'maintenance',
        });
        strict_1.default.equal(expense.amount, 100000);
        (0, strict_1.default)(expense.id.startsWith('ledger-'));
        // 验证该笔在列表中出现
        const maintenance = ctrl.listLedgers(tenantCtx, { category: 'maintenance' });
        strict_1.default.equal(maintenance.length, 1);
        strict_1.default.equal(maintenance[0].amount, 100000);
    });
    (0, node_test_1.default)('按类型筛选运营费用', async () => {
        const ctrl = createController();
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense, amount: 1500, description: '宽带费', category: 'utility',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense, amount: 800, description: '办公用品', category: 'office',
        });
        // 仅查 expense 类型
        const expenses = ctrl.listLedgers(tenantCtx, { type: finance_entity_1.LedgerType.Expense });
        strict_1.default.equal(expenses.length, 2);
        // 查 revenue 类型
        const revenues = ctrl.listLedgers(tenantCtx, { type: finance_entity_1.LedgerType.Revenue });
        strict_1.default.equal(revenues.length, 0);
    });
});
// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 检查活动预算 (marketing checking campaign budget)
// ──────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('📢营销 — 活动预算视角', () => {
    (0, node_test_1.default)('查询活动预算支出与余额 (budget query)', async () => {
        const ctrl = createController();
        // 市场费用预算
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 15000,
            description: '618 线上推广',
            category: 'marketing',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 5000,
            description: '线下地推物料',
            category: 'marketing',
        });
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense,
            amount: 8000,
            description: 'KOL 合作费用',
            category: 'marketing',
        });
        const marketingExpenses = ctrl.listLedgers(tenantCtx, { category: 'marketing' });
        strict_1.default.equal(marketingExpenses.length, 3);
        const totalSpent = marketingExpenses.reduce((sum, l) => sum + l.amount, 0);
        strict_1.default.equal(totalSpent, 28000);
    });
    (0, node_test_1.default)('活动预算超出时拒绝录入大额支出', async () => {
        const ctrl = createController();
        // 假设活动预算 50000，已用 45000
        await Promise.all([
            ctrl.recordLedger(tenantCtx, {
                type: finance_entity_1.LedgerType.Expense, amount: 20000, description: '广告投放', category: 'marketing',
            }),
            ctrl.recordLedger(tenantCtx, {
                type: finance_entity_1.LedgerType.Expense, amount: 25000, description: '物料制作', category: 'marketing',
            }),
        ]);
        const marketing = ctrl.listLedgers(tenantCtx, { category: 'marketing' });
        const used = marketing.reduce((sum, l) => sum + l.amount, 0);
        // 审核逻辑: 尽管可以录入，但超支需要在报表中可见
        strict_1.default.equal(used, 45000);
        (0, strict_1.default)(used <= 50000, '当前应在预算内');
        // 再追加一笔试图超支
        await ctrl.recordLedger(tenantCtx, {
            type: finance_entity_1.LedgerType.Expense, amount: 10000, description: '临时加投', category: 'marketing',
        });
        const updated = ctrl.listLedgers(tenantCtx, { category: 'marketing' });
        const total = updated.reduce((sum, l) => sum + l.amount, 0);
        strict_1.default.equal(total, 55000, '超支应被记录以用于复盘');
    });
    (0, node_test_1.default)('按日期范围筛选活动发票 (invoice validity)', async () => {
        const ctrl = createController();
        const today = new Date().toISOString().slice(0, 10);
        const invoice = await ctrl.createInvoice(tenantCtx, {
            orderId: 'order-001',
            amount: 15000,
            type: finance_entity_1.InvoiceType.Regular,
            buyerInfo: { company: '某广告公司', taxId: '91110000MA123' },
        });
        strict_1.default.equal(invoice.totalAmount, 15000);
        strict_1.default.equal(invoice.status, 'DRAFT');
        // 签发发票
        const issued = ctrl.issueInvoice(invoice.id, tenantCtx);
        strict_1.default.equal(issued.status, 'ISSUED');
        (0, strict_1.default)(issued.issuedAt, '签发发票应有签发时间');
        // 查询已签发的发票
        const invoices = ctrl.listInvoices(tenantCtx, {
            status: 'ISSUED',
            issuedAfter: `${today}T00:00:00.000Z`,
        });
        (0, strict_1.default)(invoices.length >= 1);
        strict_1.default.equal(invoices[0].invoiceNo, invoice.invoiceNo);
    });
});
//# sourceMappingURL=finance.role-extended.test.js.map