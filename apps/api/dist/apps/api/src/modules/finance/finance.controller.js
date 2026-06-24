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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const finance_dto_1 = require("./finance.dto");
const finance_service_1 = require("./finance.service");
let FinanceController = class FinanceController {
    financeService;
    constructor(financeService) {
        this.financeService = financeService;
    }
    // ── Ledger ──
    recordLedger(tenantContext, body) {
        return this.financeService.recordLedger(tenantContext, body);
    }
    listLedgers(tenantContext, query = {}) {
        return this.financeService.listLedgers(tenantContext, query);
    }
    getLedger(ledgerId, tenantContext) {
        return this.financeService.getLedger(ledgerId, tenantContext);
    }
    // ── Account ──
    createAccount(tenantContext, body) {
        return this.financeService.createAccount(tenantContext, body);
    }
    listAccounts(tenantContext, storeId) {
        return this.financeService.listAccounts(tenantContext, storeId);
    }
    getAccount(accountId, tenantContext) {
        return this.financeService.getAccount(accountId, tenantContext);
    }
    getAccountBalance(accountId, tenantContext) {
        return this.financeService.getAccountBalance(accountId, tenantContext);
    }
    freezeAccount(accountId, tenantContext) {
        return this.financeService.freezeAccount(accountId, tenantContext);
    }
    closeAccount(accountId, tenantContext) {
        return this.financeService.closeAccount(accountId, tenantContext);
    }
    // ── Settlement ──
    createSettlement(tenantContext, body) {
        return this.financeService.createSettlement(tenantContext, body);
    }
    listSettlements(tenantContext, query = {}) {
        return this.financeService.listSettlements(tenantContext, query);
    }
    getSettlement(settlementId, tenantContext) {
        return this.financeService.getSettlement(settlementId, tenantContext);
    }
    getSettlementDetail(settlementId, tenantContext) {
        return this.financeService.getSettlementDetail(settlementId, tenantContext);
    }
    confirmSettlement(settlementId, tenantContext) {
        return this.financeService.confirmSettlement(settlementId, tenantContext);
    }
    disputeSettlement(settlementId, tenantContext) {
        return this.financeService.disputeSettlement(settlementId, tenantContext);
    }
    // ── Invoice ──
    createInvoice(tenantContext, body) {
        return this.financeService.createInvoice(tenantContext, body);
    }
    listInvoices(tenantContext, query = {}) {
        return this.financeService.listInvoices(tenantContext, query);
    }
    getInvoice(invoiceId, tenantContext) {
        return this.financeService.getInvoice(invoiceId, tenantContext);
    }
    issueInvoice(invoiceId, tenantContext) {
        return this.financeService.issueInvoice(invoiceId, tenantContext);
    }
    cancelInvoice(invoiceId, tenantContext) {
        return this.financeService.cancelInvoice(invoiceId, tenantContext);
    }
    // ── Revenue Summary ──
    getRevenueSummary(tenantContext, query = {}) {
        return this.financeService.getRevenueSummary(tenantContext, query);
    }
    getDailyRevenue(tenantContext, query = {}) {
        return this.financeService.getDailyRevenue(tenantContext, query);
    }
    // ── Transaction Integration ──
    recordTransactionRevenue(tenantContext, body) {
        return this.financeService.recordTransactionRevenue(tenantContext, body);
    }
    recordTransactionRefund(tenantContext, body) {
        return this.financeService.recordTransactionRefund(tenantContext, body);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Post)('ledgers'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateLedgerDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "recordLedger", null);
__decorate([
    (0, common_1.Get)('ledgers'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.LedgerQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "listLedgers", null);
__decorate([
    (0, common_1.Get)('ledgers/:ledgerId'),
    __param(0, (0, common_1.Param)('ledgerId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Post)('accounts'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateAccountDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Get)('accounts/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getAccount", null);
__decorate([
    (0, common_1.Get)('accounts/:accountId/balance'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getAccountBalance", null);
__decorate([
    (0, common_1.Post)('accounts/:accountId/freeze'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "freezeAccount", null);
__decorate([
    (0, common_1.Post)('accounts/:accountId/close'),
    __param(0, (0, common_1.Param)('accountId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "closeAccount", null);
__decorate([
    (0, common_1.Post)('settlements'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateSettlementDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createSettlement", null);
__decorate([
    (0, common_1.Get)('settlements'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.SettlementQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "listSettlements", null);
__decorate([
    (0, common_1.Get)('settlements/:settlementId'),
    __param(0, (0, common_1.Param)('settlementId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getSettlement", null);
__decorate([
    (0, common_1.Get)('settlements/:settlementId/detail'),
    __param(0, (0, common_1.Param)('settlementId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getSettlementDetail", null);
__decorate([
    (0, common_1.Post)('settlements/:settlementId/confirm'),
    __param(0, (0, common_1.Param)('settlementId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "confirmSettlement", null);
__decorate([
    (0, common_1.Post)('settlements/:settlementId/dispute'),
    __param(0, (0, common_1.Param)('settlementId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "disputeSettlement", null);
__decorate([
    (0, common_1.Post)('invoices'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.CreateInvoiceDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)('invoices'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.InvoiceQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:invoiceId'),
    __param(0, (0, common_1.Param)('invoiceId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:invoiceId/issue'),
    __param(0, (0, common_1.Param)('invoiceId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "issueInvoice", null);
__decorate([
    (0, common_1.Post)('invoices/:invoiceId/cancel'),
    __param(0, (0, common_1.Param)('invoiceId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "cancelInvoice", null);
__decorate([
    (0, common_1.Get)('revenue/summary'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.RevenueSummaryQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getRevenueSummary", null);
__decorate([
    (0, common_1.Get)('revenue/daily'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dto_1.DailyRevenueQueryDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getDailyRevenue", null);
__decorate([
    (0, common_1.Post)('transactions/revenue'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "recordTransactionRevenue", null);
__decorate([
    (0, common_1.Post)('transactions/refund'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "recordTransactionRefund", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map