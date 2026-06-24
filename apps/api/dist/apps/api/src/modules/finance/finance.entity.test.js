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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const finance_entity_1 = require("./finance.entity");
(0, node_test_1.describe)('finance.entity enums', () => {
    (0, node_test_1.default)('LedgerType 包含 Revenue / Expense / Refund / Adjustment', () => {
        strict_1.default.equal(finance_entity_1.LedgerType.Revenue, 'REVENUE');
        strict_1.default.equal(finance_entity_1.LedgerType.Expense, 'EXPENSE');
        strict_1.default.equal(finance_entity_1.LedgerType.Refund, 'REFUND');
        strict_1.default.equal(finance_entity_1.LedgerType.Adjustment, 'ADJUSTMENT');
    });
    (0, node_test_1.default)('AccountType 包含 Cash / Wechat / Alipay / Bank / Other', () => {
        strict_1.default.equal(finance_entity_1.AccountType.Cash, 'CASH');
        strict_1.default.equal(finance_entity_1.AccountType.Wechat, 'WECHAT');
        strict_1.default.equal(finance_entity_1.AccountType.Alipay, 'ALIPAY');
        strict_1.default.equal(finance_entity_1.AccountType.Bank, 'BANK');
        strict_1.default.equal(finance_entity_1.AccountType.Other, 'OTHER');
    });
    (0, node_test_1.default)('AccountStatus 包含 Active / Frozen / Closed', () => {
        strict_1.default.equal(finance_entity_1.AccountStatus.Active, 'ACTIVE');
        strict_1.default.equal(finance_entity_1.AccountStatus.Frozen, 'FROZEN');
        strict_1.default.equal(finance_entity_1.AccountStatus.Closed, 'CLOSED');
    });
    (0, node_test_1.default)('SettlementStatus 包含 Pending / Confirmed / Disputed', () => {
        strict_1.default.equal(finance_entity_1.SettlementStatus.Pending, 'PENDING');
        strict_1.default.equal(finance_entity_1.SettlementStatus.Confirmed, 'CONFIRMED');
        strict_1.default.equal(finance_entity_1.SettlementStatus.Disputed, 'DISPUTED');
    });
    (0, node_test_1.default)('InvoiceType 包含 Regular / Vat', () => {
        strict_1.default.equal(finance_entity_1.InvoiceType.Regular, 'REGULAR');
        strict_1.default.equal(finance_entity_1.InvoiceType.Vat, 'VAT');
    });
    (0, node_test_1.default)('InvoiceStatus 包含 Draft / Issued / Cancelled', () => {
        strict_1.default.equal(finance_entity_1.InvoiceStatus.Draft, 'DRAFT');
        strict_1.default.equal(finance_entity_1.InvoiceStatus.Issued, 'ISSUED');
        strict_1.default.equal(finance_entity_1.InvoiceStatus.Cancelled, 'CANCELLED');
    });
});
(0, node_test_1.describe)('finance.entity interfaces', () => {
    (0, node_test_1.default)('Ledger 接口包含所有必填字段', () => {
        const ledger = {
            id: 'ledger-1',
            tenantId: 'tenant-1',
            brandId: 'brand-1',
            storeId: 'store-1',
            type: finance_entity_1.LedgerType.Revenue,
            amount: 100,
            balance: 100,
            orderId: 'order-1',
            transactionId: 'txn-1',
            description: 'Test ledger',
            category: 'sales',
            recordedAt: '2026-06-23T12:00:00.000Z',
            createdAt: '2026-06-23T12:00:00.000Z'
        };
        strict_1.default.equal(ledger.id, 'ledger-1');
        strict_1.default.equal(ledger.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(ledger.amount, 100);
        strict_1.default.equal(ledger.balance, 100);
        strict_1.default.equal(ledger.description, 'Test ledger');
    });
    (0, node_test_1.default)('Account 接口包含所有必填字段', () => {
        const account = {
            id: 'acct-1',
            tenantId: 'tenant-1',
            storeId: 'store-1',
            name: 'WeChat Pay Account',
            type: finance_entity_1.AccountType.Wechat,
            balance: 5000,
            status: finance_entity_1.AccountStatus.Active,
            createdAt: '2026-06-23T12:00:00.000Z',
            updatedAt: '2026-06-23T12:00:00.000Z'
        };
        strict_1.default.equal(account.name, 'WeChat Pay Account');
        strict_1.default.equal(account.type, finance_entity_1.AccountType.Wechat);
        strict_1.default.equal(account.balance, 5000);
        strict_1.default.equal(account.status, finance_entity_1.AccountStatus.Active);
    });
    (0, node_test_1.default)('Account 已冻结状态', () => {
        const account = {
            id: 'acct-frozen',
            tenantId: 'tenant-1',
            name: 'Frozen Account',
            type: finance_entity_1.AccountType.Bank,
            balance: 1000,
            status: finance_entity_1.AccountStatus.Frozen,
            createdAt: '2026-06-23T00:00:00.000Z',
            updatedAt: '2026-06-23T12:00:00.000Z'
        };
        strict_1.default.equal(account.status, finance_entity_1.AccountStatus.Frozen);
    });
    (0, node_test_1.default)('Settlement 接口包含所有字段', () => {
        const settlement = {
            id: 'stl-1',
            tenantId: 'tenant-1',
            storeId: 'store-1',
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 10000,
            totalExpense: 3000,
            netProfit: 7000,
            settlementStatus: finance_entity_1.SettlementStatus.Pending,
            createdAt: '2026-06-30T23:59:59.999Z'
        };
        strict_1.default.equal(settlement.totalRevenue, 10000);
        strict_1.default.equal(settlement.totalExpense, 3000);
        strict_1.default.equal(settlement.netProfit, 7000);
        strict_1.default.equal(settlement.settlementStatus, finance_entity_1.SettlementStatus.Pending);
    });
    (0, node_test_1.default)('Settlement 已确认带 settledAt', () => {
        const settlement = {
            id: 'stl-confirmed',
            tenantId: 'tenant-1',
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 5000,
            totalExpense: 2000,
            netProfit: 3000,
            settlementStatus: finance_entity_1.SettlementStatus.Confirmed,
            settledAt: '2026-07-01T10:00:00.000Z',
            createdAt: '2026-06-30T23:59:59.999Z'
        };
        strict_1.default.equal(settlement.settlementStatus, finance_entity_1.SettlementStatus.Confirmed);
        strict_1.default.equal(settlement.settledAt, '2026-07-01T10:00:00.000Z');
    });
    (0, node_test_1.default)('Invoice 接口包含所有字段', () => {
        const invoice = {
            id: 'inv-1',
            tenantId: 'tenant-1',
            storeId: 'store-1',
            orderId: 'order-1',
            invoiceNo: 'INV-001',
            amount: 100,
            taxAmount: 13,
            totalAmount: 113,
            type: finance_entity_1.InvoiceType.Vat,
            status: finance_entity_1.InvoiceStatus.Draft,
            buyerInfo: { name: 'Test Co' },
            createdAt: '2026-06-23T12:00:00.000Z'
        };
        strict_1.default.equal(invoice.invoiceNo, 'INV-001');
        strict_1.default.equal(invoice.amount, 100);
        strict_1.default.equal(invoice.taxAmount, 13);
        strict_1.default.equal(invoice.totalAmount, 113);
        strict_1.default.equal(invoice.type, finance_entity_1.InvoiceType.Vat);
        strict_1.default.equal(invoice.status, finance_entity_1.InvoiceStatus.Draft);
        strict_1.default.deepEqual(invoice.buyerInfo, { name: 'Test Co' });
    });
    (0, node_test_1.default)('RevenueSummary 接口形状', () => {
        const summary = {
            storeId: 'store-1',
            totalRevenue: 10000,
            totalExpense: 3000,
            totalRefund: 500,
            netRevenue: 6500,
            transactionCount: 42,
            periodStart: '2026-06-01T00:00:00.000Z',
            periodEnd: '2026-06-30T23:59:59.999Z'
        };
        strict_1.default.equal(summary.totalRevenue, 10000);
        strict_1.default.equal(summary.totalRefund, 500);
        strict_1.default.equal(summary.netRevenue, 6500);
        strict_1.default.equal(summary.transactionCount, 42);
    });
    (0, node_test_1.default)('DailyRevenue 接口形状', () => {
        const daily = {
            date: '2026-06-23',
            storeId: 'store-1',
            revenue: 1500,
            expense: 300,
            refund: 100,
            netRevenue: 1100,
            transactionCount: 15
        };
        strict_1.default.equal(daily.date, '2026-06-23');
        strict_1.default.equal(daily.revenue, 1500);
        strict_1.default.equal(daily.expense, 300);
        strict_1.default.equal(daily.netRevenue, 1100);
    });
});
//# sourceMappingURL=finance.entity.test.js.map