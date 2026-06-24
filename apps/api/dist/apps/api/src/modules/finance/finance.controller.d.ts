import type { RequestTenantContext } from '../tenant/tenant.types';
import { CreateLedgerDto, LedgerQueryDto, CreateAccountDto, CreateSettlementDto, SettlementQueryDto, CreateInvoiceDto, InvoiceQueryDto, RevenueSummaryQueryDto, DailyRevenueQueryDto } from './finance.dto';
import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    recordLedger(tenantContext: RequestTenantContext, body: CreateLedgerDto): Promise<import("./finance.entity").Ledger>;
    listLedgers(tenantContext: RequestTenantContext, query?: LedgerQueryDto): import("./finance.entity").Ledger[];
    getLedger(ledgerId: string, tenantContext: RequestTenantContext): import("./finance.entity").Ledger;
    createAccount(tenantContext: RequestTenantContext, body: CreateAccountDto): Promise<import("./finance.entity").Account>;
    listAccounts(tenantContext: RequestTenantContext, storeId?: string): import("./finance.entity").Account[];
    getAccount(accountId: string, tenantContext: RequestTenantContext): import("./finance.entity").Account;
    getAccountBalance(accountId: string, tenantContext: RequestTenantContext): Pick<import("./finance.entity").Account, "status" | "id" | "name" | "balance">;
    freezeAccount(accountId: string, tenantContext: RequestTenantContext): import("./finance.entity").Account;
    closeAccount(accountId: string, tenantContext: RequestTenantContext): import("./finance.entity").Account;
    createSettlement(tenantContext: RequestTenantContext, body: CreateSettlementDto): Promise<import("./finance.entity").Settlement>;
    listSettlements(tenantContext: RequestTenantContext, query?: SettlementQueryDto): import("./finance.entity").Settlement[];
    getSettlement(settlementId: string, tenantContext: RequestTenantContext): import("./finance.entity").Settlement;
    getSettlementDetail(settlementId: string, tenantContext: RequestTenantContext): {
        settlement: import("./finance.entity").Settlement;
        ledgers: import("./finance.entity").Ledger[];
    };
    confirmSettlement(settlementId: string, tenantContext: RequestTenantContext): import("./finance.entity").Settlement;
    disputeSettlement(settlementId: string, tenantContext: RequestTenantContext): import("./finance.entity").Settlement;
    createInvoice(tenantContext: RequestTenantContext, body: CreateInvoiceDto): Promise<import("./finance.entity").Invoice>;
    listInvoices(tenantContext: RequestTenantContext, query?: InvoiceQueryDto): import("./finance.entity").Invoice[];
    getInvoice(invoiceId: string, tenantContext: RequestTenantContext): import("./finance.entity").Invoice;
    issueInvoice(invoiceId: string, tenantContext: RequestTenantContext): import("./finance.entity").Invoice;
    cancelInvoice(invoiceId: string, tenantContext: RequestTenantContext): import("./finance.entity").Invoice;
    getRevenueSummary(tenantContext: RequestTenantContext, query?: RevenueSummaryQueryDto): import("./finance.entity").RevenueSummary;
    getDailyRevenue(tenantContext: RequestTenantContext, query?: DailyRevenueQueryDto): import("./finance.entity").DailyRevenue;
    recordTransactionRevenue(tenantContext: RequestTenantContext, body: {
        orderId: string;
        transactionId: string;
        amount: number;
        description: string;
        category?: string;
    }): Promise<import("./finance.entity").Ledger>;
    recordTransactionRefund(tenantContext: RequestTenantContext, body: {
        orderId: string;
        transactionId: string;
        amount: number;
        description: string;
    }): Promise<import("./finance.entity").Ledger>;
}
//# sourceMappingURL=finance.controller.d.ts.map