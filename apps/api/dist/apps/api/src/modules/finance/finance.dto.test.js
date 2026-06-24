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
const finance_dto_1 = require("./finance.dto");
// ── CreateLedgerDto ──
(0, node_test_1.describe)('CreateLedgerDto', () => {
    (0, node_test_1.default)('标准记账 DTO：必填 type + amount + description', () => {
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 100,
            description: '台球桌费'
        });
        strict_1.default.equal(dto.type, finance_entity_1.LedgerType.Revenue);
        strict_1.default.equal(dto.amount, 100);
        strict_1.default.equal(dto.description, '台球桌费');
    });
    (0, node_test_1.default)('支出记账 DTO', () => {
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Expense,
            amount: 50,
            description: '清洁用品采购'
        });
        strict_1.default.equal(dto.type, finance_entity_1.LedgerType.Expense);
        strict_1.default.equal(dto.amount, 50);
    });
    (0, node_test_1.default)('退款记账 DTO', () => {
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Refund,
            amount: 30,
            description: '客户退费'
        });
        strict_1.default.equal(dto.type, finance_entity_1.LedgerType.Refund);
    });
    (0, node_test_1.default)('调账记账 DTO', () => {
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Adjustment,
            amount: 200,
            description: '月末调账',
            category: 'adjustment'
        });
        strict_1.default.equal(dto.type, finance_entity_1.LedgerType.Adjustment);
        strict_1.default.equal(dto.category, 'adjustment');
    });
    (0, node_test_1.default)('带可选字段 orderId + transactionId', () => {
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 88,
            description: '订单收入',
            orderId: 'order-123',
            transactionId: 'txn-456'
        });
        strict_1.default.equal(dto.orderId, 'order-123');
        strict_1.default.equal(dto.transactionId, 'txn-456');
    });
    (0, node_test_1.default)('带 recordedAt 自定义记账日期', () => {
        const dto = Object.assign(new finance_dto_1.CreateLedgerDto(), {
            type: finance_entity_1.LedgerType.Revenue,
            amount: 200,
            description: '历史补录',
            recordedAt: '2026-06-01T10:00:00.000Z'
        });
        strict_1.default.equal(dto.recordedAt, '2026-06-01T10:00:00.000Z');
    });
});
// ── LedgerQueryDto ──
(0, node_test_1.describe)('LedgerQueryDto', () => {
    (0, node_test_1.default)('空查询 DTO', () => {
        const dto = Object.assign(new finance_dto_1.LedgerQueryDto(), {});
        strict_1.default.equal(dto.type, undefined);
        strict_1.default.equal(dto.limit, undefined);
    });
    (0, node_test_1.default)('按类型过滤', () => {
        const dto = Object.assign(new finance_dto_1.LedgerQueryDto(), {
            type: finance_entity_1.LedgerType.Revenue
        });
        strict_1.default.equal(dto.type, finance_entity_1.LedgerType.Revenue);
    });
    (0, node_test_1.default)('按门店过滤', () => {
        const dto = Object.assign(new finance_dto_1.LedgerQueryDto(), {
            storeId: 'store-1'
        });
        strict_1.default.equal(dto.storeId, 'store-1');
    });
    (0, node_test_1.default)('按时间范围 + 分页', () => {
        const dto = Object.assign(new finance_dto_1.LedgerQueryDto(), {
            recordedAfter: '2026-06-01T00:00:00.000Z',
            recordedBefore: '2026-06-30T23:59:59.999Z',
            limit: 20
        });
        strict_1.default.equal(dto.recordedAfter, '2026-06-01T00:00:00.000Z');
        strict_1.default.equal(dto.recordedBefore, '2026-06-30T23:59:59.999Z');
        strict_1.default.equal(dto.limit, 20);
    });
});
// ── CreateAccountDto ──
(0, node_test_1.describe)('CreateAccountDto', () => {
    (0, node_test_1.default)('标准创建账户 DTO', () => {
        const dto = Object.assign(new finance_dto_1.CreateAccountDto(), {
            name: '微信支付账户',
            type: finance_entity_1.AccountType.Wechat
        });
        strict_1.default.equal(dto.name, '微信支付账户');
        strict_1.default.equal(dto.type, finance_entity_1.AccountType.Wechat);
    });
    (0, node_test_1.default)('带初始余额', () => {
        const dto = Object.assign(new finance_dto_1.CreateAccountDto(), {
            name: '银行账户',
            type: finance_entity_1.AccountType.Bank,
            initialBalance: 10000
        });
        strict_1.default.equal(dto.initialBalance, 10000);
    });
    (0, node_test_1.default)('带门店 ID', () => {
        const dto = Object.assign(new finance_dto_1.CreateAccountDto(), {
            name: '门店现金账户',
            type: finance_entity_1.AccountType.Cash,
            storeId: 'store-2'
        });
        strict_1.default.equal(dto.storeId, 'store-2');
    });
    (0, node_test_1.default)('现金账户初始余额为 0', () => {
        const dto = Object.assign(new finance_dto_1.CreateAccountDto(), {
            name: '零钱账户',
            type: finance_entity_1.AccountType.Cash,
            initialBalance: 0
        });
        strict_1.default.equal(dto.initialBalance, 0);
    });
});
// ── CreateSettlementDto ──
(0, node_test_1.describe)('CreateSettlementDto', () => {
    (0, node_test_1.default)('标准结算 DTO：必填 startDate + endDate', () => {
        const dto = Object.assign(new finance_dto_1.CreateSettlementDto(), {
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z'
        });
        strict_1.default.equal(dto.startDate, '2026-06-01T00:00:00.000Z');
        strict_1.default.equal(dto.endDate, '2026-06-30T23:59:59.999Z');
    });
    (0, node_test_1.default)('手动指定 totalRevenue + totalExpense', () => {
        const dto = Object.assign(new finance_dto_1.CreateSettlementDto(), {
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z',
            totalRevenue: 5000,
            totalExpense: 2000
        });
        strict_1.default.equal(dto.totalRevenue, 5000);
        strict_1.default.equal(dto.totalExpense, 2000);
    });
    (0, node_test_1.default)('带门店 ID 的结算', () => {
        const dto = Object.assign(new finance_dto_1.CreateSettlementDto(), {
            storeId: 'store-3',
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z'
        });
        strict_1.default.equal(dto.storeId, 'store-3');
    });
});
// ── SettlementQueryDto ──
(0, node_test_1.describe)('SettlementQueryDto', () => {
    (0, node_test_1.default)('按状态过滤', () => {
        const dto = Object.assign(new finance_dto_1.SettlementQueryDto(), {
            settlementStatus: finance_entity_1.SettlementStatus.Pending
        });
        strict_1.default.equal(dto.settlementStatus, finance_entity_1.SettlementStatus.Pending);
    });
    (0, node_test_1.default)('按时间范围过滤', () => {
        const dto = Object.assign(new finance_dto_1.SettlementQueryDto(), {
            startAfter: '2026-06-01T00:00:00.000Z',
            endBefore: '2026-07-01T00:00:00.000Z',
            limit: 10
        });
        strict_1.default.equal(dto.startAfter, '2026-06-01T00:00:00.000Z');
        strict_1.default.equal(dto.endBefore, '2026-07-01T00:00:00.000Z');
        strict_1.default.equal(dto.limit, 10);
    });
});
// ── CreateInvoiceDto ──
(0, node_test_1.describe)('CreateInvoiceDto', () => {
    (0, node_test_1.default)('标准发票 DTO：必填 type + amount', () => {
        const dto = Object.assign(new finance_dto_1.CreateInvoiceDto(), {
            type: finance_entity_1.InvoiceType.Regular,
            amount: 500
        });
        strict_1.default.equal(dto.type, finance_entity_1.InvoiceType.Regular);
        strict_1.default.equal(dto.amount, 500);
    });
    (0, node_test_1.default)('增值税发票', () => {
        const dto = Object.assign(new finance_dto_1.CreateInvoiceDto(), {
            type: finance_entity_1.InvoiceType.Vat,
            amount: 1000,
            taxAmount: 130
        });
        strict_1.default.equal(dto.type, finance_entity_1.InvoiceType.Vat);
        strict_1.default.equal(dto.amount, 1000);
        strict_1.default.equal(dto.taxAmount, 130);
    });
    (0, node_test_1.default)('带 orderId + buyerInfo', () => {
        const dto = Object.assign(new finance_dto_1.CreateInvoiceDto(), {
            type: finance_entity_1.InvoiceType.Regular,
            amount: 300,
            orderId: 'order-abc',
            buyerInfo: { name: '张三', taxId: '91110000' }
        });
        strict_1.default.equal(dto.orderId, 'order-abc');
        strict_1.default.deepEqual(dto.buyerInfo, { name: '张三', taxId: '91110000' });
    });
    (0, node_test_1.default)('不含税金的发票', () => {
        const dto = Object.assign(new finance_dto_1.CreateInvoiceDto(), {
            type: finance_entity_1.InvoiceType.Regular,
            amount: 200
        });
        strict_1.default.equal(dto.taxAmount, undefined);
    });
});
// ── InvoiceQueryDto ──
(0, node_test_1.describe)('InvoiceQueryDto', () => {
    (0, node_test_1.default)('按类型过滤', () => {
        const dto = Object.assign(new finance_dto_1.InvoiceQueryDto(), {
            type: finance_entity_1.InvoiceType.Vat
        });
        strict_1.default.equal(dto.type, finance_entity_1.InvoiceType.Vat);
    });
    (0, node_test_1.default)('按状态 + 时间范围过滤', () => {
        const dto = Object.assign(new finance_dto_1.InvoiceQueryDto(), {
            status: finance_entity_1.InvoiceStatus.Issued,
            issuedAfter: '2026-06-01T00:00:00.000Z',
            limit: 50
        });
        strict_1.default.equal(dto.status, finance_entity_1.InvoiceStatus.Issued);
        strict_1.default.equal(dto.issuedAfter, '2026-06-01T00:00:00.000Z');
        strict_1.default.equal(dto.limit, 50);
    });
});
// ── RevenueSummaryQueryDto ──
(0, node_test_1.describe)('RevenueSummaryQueryDto', () => {
    (0, node_test_1.default)('空查询', () => {
        const dto = Object.assign(new finance_dto_1.RevenueSummaryQueryDto(), {});
        strict_1.default.equal(dto.storeId, undefined);
        strict_1.default.equal(dto.startDate, undefined);
    });
    (0, node_test_1.default)('按门店 + 时间范围查询', () => {
        const dto = Object.assign(new finance_dto_1.RevenueSummaryQueryDto(), {
            storeId: 'store-1',
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2026-06-30T23:59:59.999Z'
        });
        strict_1.default.equal(dto.storeId, 'store-1');
        strict_1.default.equal(dto.startDate, '2026-06-01T00:00:00.000Z');
    });
});
// ── DailyRevenueQueryDto ──
(0, node_test_1.describe)('DailyRevenueQueryDto', () => {
    (0, node_test_1.default)('必填 date', () => {
        const dto = Object.assign(new finance_dto_1.DailyRevenueQueryDto(), {
            date: '2026-06-23'
        });
        strict_1.default.equal(dto.date, '2026-06-23');
    });
    (0, node_test_1.default)('带门店 ID + date', () => {
        const dto = Object.assign(new finance_dto_1.DailyRevenueQueryDto(), {
            date: '2026-06-23',
            storeId: 'store-2'
        });
        strict_1.default.equal(dto.date, '2026-06-23');
        strict_1.default.equal(dto.storeId, 'store-2');
    });
});
//# sourceMappingURL=finance.dto.test.js.map