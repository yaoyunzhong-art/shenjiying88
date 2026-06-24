"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
exports.resetFinanceServiceTestState = resetFinanceServiceTestState;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const finance_entity_1 = require("./finance.entity");
const ledgerStore = new Map();
const accountStore = new Map();
const settlementStore = new Map();
const invoiceStore = new Map();
function resetFinanceServiceTestState() {
    ledgerStore.clear();
    accountStore.clear();
    settlementStore.clear();
    invoiceStore.clear();
}
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ═══════════════════════════════════════════════════
    // 记账 (Ledger)
    // ═══════════════════════════════════════════════════
    async recordLedger(tenantContext, input) {
        const now = new Date().toISOString();
        const tenantEntries = Array.from(ledgerStore.values())
            .filter((l) => l.tenantId === tenantContext.tenantId);
        const currentBalance = tenantEntries.reduce((sum, l) => {
            if (l.type === finance_entity_1.LedgerType.Revenue || l.type === finance_entity_1.LedgerType.Adjustment) {
                return sum + l.amount;
            }
            return sum - l.amount;
        }, 0);
        const balance = input.type === finance_entity_1.LedgerType.Revenue || input.type === finance_entity_1.LedgerType.Adjustment
            ? currentBalance + input.amount
            : currentBalance - input.amount;
        const ledger = {
            id: `ledger-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: tenantContext.tenantId,
            brandId: tenantContext.brandId,
            storeId: tenantContext.storeId,
            type: input.type,
            amount: input.amount,
            balance,
            orderId: input.orderId,
            transactionId: input.transactionId,
            description: input.description,
            category: input.category,
            recordedAt: input.recordedAt ?? now,
            createdAt: now
        };
        ledgerStore.set(ledger.id, ledger);
        return ledger;
    }
    listLedgers(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const ledgers = Array.from(ledgerStore.values())
            .filter((l) => l.tenantId === tenantContext.tenantId)
            .filter((l) => !query?.type || l.type === query.type)
            .filter((l) => !query?.storeId || l.storeId === query.storeId)
            .filter((l) => !query?.orderId || l.orderId === query.orderId)
            .filter((l) => !query?.transactionId || l.transactionId === query.transactionId)
            .filter((l) => !query?.category || l.category === query.category)
            .filter((l) => !query?.recordedAfter || l.recordedAt >= query.recordedAfter)
            .filter((l) => !query?.recordedBefore || l.recordedAt <= query.recordedBefore)
            .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
        return typeof limit === 'number' ? ledgers.slice(0, limit) : ledgers;
    }
    getLedger(ledgerId, tenantContext) {
        const ledger = ledgerStore.get(ledgerId);
        if (!ledger || ledger.tenantId !== tenantContext.tenantId) {
            throw new Error(`Ledger ${ledgerId} not found`);
        }
        return ledger;
    }
    // ═══════════════════════════════════════════════════
    // 账户管理 (Account)
    // ═══════════════════════════════════════════════════
    async createAccount(tenantContext, input) {
        const now = new Date().toISOString();
        const account = {
            id: `acct-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: tenantContext.tenantId,
            storeId: input.storeId ?? tenantContext.storeId,
            name: input.name,
            type: input.type,
            balance: input.initialBalance ?? 0,
            status: finance_entity_1.AccountStatus.Active,
            createdAt: now,
            updatedAt: now
        };
        accountStore.set(account.id, account);
        return account;
    }
    getAccount(accountId, tenantContext) {
        const account = accountStore.get(accountId);
        if (!account || account.tenantId !== tenantContext.tenantId) {
            throw new Error(`Account ${accountId} not found`);
        }
        return account;
    }
    getAccountBalance(accountId, tenantContext) {
        const account = this.getAccount(accountId, tenantContext);
        return {
            id: account.id,
            name: account.name,
            balance: account.balance,
            status: account.status
        };
    }
    listAccounts(tenantContext, storeId) {
        return Array.from(accountStore.values())
            .filter((a) => a.tenantId === tenantContext.tenantId)
            .filter((a) => !storeId || a.storeId === storeId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    freezeAccount(accountId, tenantContext) {
        const account = this.getAccount(accountId, tenantContext);
        if (account.status !== finance_entity_1.AccountStatus.Active) {
            throw new Error(`Account ${accountId} is not active`);
        }
        account.status = finance_entity_1.AccountStatus.Frozen;
        account.updatedAt = new Date().toISOString();
        return account;
    }
    closeAccount(accountId, tenantContext) {
        const account = this.getAccount(accountId, tenantContext);
        if (account.status === finance_entity_1.AccountStatus.Closed) {
            throw new Error(`Account ${accountId} is already closed`);
        }
        account.status = finance_entity_1.AccountStatus.Closed;
        account.updatedAt = new Date().toISOString();
        return account;
    }
    // ═══════════════════════════════════════════════════
    // 结算 (Settlement)
    // ═══════════════════════════════════════════════════
    async createSettlement(tenantContext, input) {
        const now = new Date().toISOString();
        const storeId = input.storeId ?? tenantContext.storeId;
        // Auto-calculate from ledgers if not provided
        const ledgers = Array.from(ledgerStore.values())
            .filter((l) => l.tenantId === tenantContext.tenantId)
            .filter((l) => !storeId || l.storeId === storeId)
            .filter((l) => l.recordedAt >= input.startDate && l.recordedAt <= input.endDate);
        const totalRevenue = input.totalRevenue ?? ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Revenue)
            .reduce((sum, l) => sum + l.amount, 0);
        const totalExpense = input.totalExpense ?? ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Expense)
            .reduce((sum, l) => sum + l.amount, 0);
        const netProfit = totalRevenue - totalExpense;
        const settlement = {
            id: `stl-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: tenantContext.tenantId,
            storeId,
            startDate: input.startDate,
            endDate: input.endDate,
            totalRevenue,
            totalExpense,
            netProfit,
            settlementStatus: finance_entity_1.SettlementStatus.Pending,
            createdAt: now
        };
        settlementStore.set(settlement.id, settlement);
        return settlement;
    }
    confirmSettlement(settlementId, tenantContext) {
        const settlement = this.getSettlement(settlementId, tenantContext);
        if (settlement.settlementStatus !== finance_entity_1.SettlementStatus.Pending) {
            throw new Error(`Settlement ${settlementId} is not pending confirmation`);
        }
        settlement.settlementStatus = finance_entity_1.SettlementStatus.Confirmed;
        settlement.settledAt = new Date().toISOString();
        return settlement;
    }
    disputeSettlement(settlementId, tenantContext) {
        const settlement = this.getSettlement(settlementId, tenantContext);
        if (settlement.settlementStatus !== finance_entity_1.SettlementStatus.Pending) {
            throw new Error(`Settlement ${settlementId} is not pending`);
        }
        settlement.settlementStatus = finance_entity_1.SettlementStatus.Disputed;
        return settlement;
    }
    getSettlement(settlementId, tenantContext) {
        const settlement = settlementStore.get(settlementId);
        if (!settlement || settlement.tenantId !== tenantContext.tenantId) {
            throw new Error(`Settlement ${settlementId} not found`);
        }
        return settlement;
    }
    getSettlementDetail(settlementId, tenantContext) {
        const settlement = this.getSettlement(settlementId, tenantContext);
        const ledgers = this.listLedgers(tenantContext, {
            storeId: settlement.storeId,
            recordedAfter: settlement.startDate,
            recordedBefore: settlement.endDate
        });
        return { settlement, ledgers };
    }
    listSettlements(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const settlements = Array.from(settlementStore.values())
            .filter((s) => s.tenantId === tenantContext.tenantId)
            .filter((s) => !query?.storeId || s.storeId === query.storeId)
            .filter((s) => !query?.settlementStatus || s.settlementStatus === query.settlementStatus)
            .filter((s) => !query?.startAfter || s.startDate >= query.startAfter)
            .filter((s) => !query?.endBefore || s.endDate <= query.endBefore)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return typeof limit === 'number' ? settlements.slice(0, limit) : settlements;
    }
    // ═══════════════════════════════════════════════════
    // 发票 (Invoice)
    // ═══════════════════════════════════════════════════
    async createInvoice(tenantContext, input) {
        const now = new Date().toISOString();
        const taxAmount = input.taxAmount ?? 0;
        const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        const invoice = {
            id: `inv-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: tenantContext.tenantId,
            storeId: tenantContext.storeId,
            orderId: input.orderId,
            invoiceNo,
            amount: input.amount,
            taxAmount,
            totalAmount: input.amount + taxAmount,
            type: input.type,
            status: finance_entity_1.InvoiceStatus.Draft,
            buyerInfo: input.buyerInfo,
            createdAt: now
        };
        invoiceStore.set(invoice.id, invoice);
        return invoice;
    }
    issueInvoice(invoiceId, tenantContext) {
        const invoice = this.getInvoice(invoiceId, tenantContext);
        if (invoice.status !== finance_entity_1.InvoiceStatus.Draft) {
            throw new Error(`Invoice ${invoiceId} is not in draft status`);
        }
        invoice.status = finance_entity_1.InvoiceStatus.Issued;
        invoice.issuedAt = new Date().toISOString();
        return invoice;
    }
    cancelInvoice(invoiceId, tenantContext) {
        const invoice = this.getInvoice(invoiceId, tenantContext);
        if (invoice.status === finance_entity_1.InvoiceStatus.Cancelled) {
            throw new Error(`Invoice ${invoiceId} is already cancelled`);
        }
        invoice.status = finance_entity_1.InvoiceStatus.Cancelled;
        return invoice;
    }
    getInvoice(invoiceId, tenantContext) {
        const invoice = invoiceStore.get(invoiceId);
        if (!invoice || invoice.tenantId !== tenantContext.tenantId) {
            throw new Error(`Invoice ${invoiceId} not found`);
        }
        return invoice;
    }
    listInvoices(tenantContext, query) {
        const limit = query?.limit && query.limit > 0 ? query.limit : undefined;
        const invoices = Array.from(invoiceStore.values())
            .filter((i) => i.tenantId === tenantContext.tenantId)
            .filter((i) => !query?.storeId || i.storeId === query.storeId)
            .filter((i) => !query?.orderId || i.orderId === query.orderId)
            .filter((i) => !query?.type || i.type === query.type)
            .filter((i) => !query?.status || i.status === query.status)
            .filter((i) => !query?.issuedAfter || (i.issuedAt && i.issuedAt >= query.issuedAfter))
            .filter((i) => !query?.issuedBefore || (i.issuedAt && i.issuedAt <= query.issuedBefore))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return typeof limit === 'number' ? invoices.slice(0, limit) : invoices;
    }
    // ═══════════════════════════════════════════════════
    // 财务汇总 (Revenue Summary)
    // ═══════════════════════════════════════════════════
    getRevenueSummary(tenantContext, query) {
        const storeId = query?.storeId ?? tenantContext.storeId;
        const startDate = query?.startDate ?? this.getDefaultStartDate();
        const endDate = query?.endDate ?? new Date().toISOString();
        const ledgers = Array.from(ledgerStore.values())
            .filter((l) => l.tenantId === tenantContext.tenantId)
            .filter((l) => !storeId || l.storeId === storeId)
            .filter((l) => l.recordedAt >= startDate && l.recordedAt <= endDate);
        const totalRevenue = ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Revenue)
            .reduce((sum, l) => sum + l.amount, 0);
        const totalExpense = ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Expense)
            .reduce((sum, l) => sum + l.amount, 0);
        const totalRefund = ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Refund)
            .reduce((sum, l) => sum + l.amount, 0);
        return {
            storeId,
            totalRevenue,
            totalExpense,
            totalRefund,
            netRevenue: totalRevenue - totalExpense - totalRefund,
            transactionCount: ledgers.length,
            periodStart: startDate,
            periodEnd: endDate
        };
    }
    getDailyRevenue(tenantContext, query) {
        const storeId = query.storeId ?? tenantContext.storeId;
        const date = query.date;
        const dayStart = `${date}T00:00:00.000Z`;
        const dayEnd = `${date}T23:59:59.999Z`;
        const ledgers = Array.from(ledgerStore.values())
            .filter((l) => l.tenantId === tenantContext.tenantId)
            .filter((l) => !storeId || l.storeId === storeId)
            .filter((l) => l.recordedAt >= dayStart && l.recordedAt <= dayEnd);
        const revenue = ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Revenue)
            .reduce((sum, l) => sum + l.amount, 0);
        const expense = ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Expense)
            .reduce((sum, l) => sum + l.amount, 0);
        const refund = ledgers
            .filter((l) => l.type === finance_entity_1.LedgerType.Refund)
            .reduce((sum, l) => sum + l.amount, 0);
        return {
            date,
            storeId,
            revenue,
            expense,
            refund,
            netRevenue: revenue - expense - refund,
            transactionCount: ledgers.length
        };
    }
    // ═══════════════════════════════════════════════════
    // 交易联动：每笔交易自动记录应收流水
    // ═══════════════════════════════════════════════════
    async recordTransactionRevenue(tenantContext, params) {
        return this.recordLedger(tenantContext, {
            type: finance_entity_1.LedgerType.Revenue,
            amount: params.amount,
            description: params.description,
            orderId: params.orderId,
            transactionId: params.transactionId,
            category: params.category ?? 'transaction'
        });
    }
    async recordTransactionRefund(tenantContext, params) {
        return this.recordLedger(tenantContext, {
            type: finance_entity_1.LedgerType.Refund,
            amount: params.amount,
            description: params.description,
            orderId: params.orderId,
            transactionId: params.transactionId,
            category: 'refund'
        });
    }
    // ═══════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════
    getDefaultStartDate() {
        const d = new Date();
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map