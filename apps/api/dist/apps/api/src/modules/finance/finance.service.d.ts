import { PrismaService } from '../../prisma/prisma.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { CreateLedgerDto, LedgerQueryDto, CreateAccountDto, CreateSettlementDto, SettlementQueryDto, CreateInvoiceDto, InvoiceQueryDto, RevenueSummaryQueryDto, DailyRevenueQueryDto } from './finance.dto';
import { type Ledger, type Account, type Settlement, type Invoice, type RevenueSummary, type DailyRevenue } from './finance.entity';
export declare function resetFinanceServiceTestState(): void;
export declare class FinanceService {
    private readonly prisma?;
    constructor(prisma?: PrismaService | undefined);
    recordLedger(tenantContext: RequestTenantContext, input: CreateLedgerDto): Promise<Ledger>;
    listLedgers(tenantContext: RequestTenantContext, query?: LedgerQueryDto): Ledger[];
    getLedger(ledgerId: string, tenantContext: RequestTenantContext): Ledger;
    createAccount(tenantContext: RequestTenantContext, input: CreateAccountDto): Promise<Account>;
    getAccount(accountId: string, tenantContext: RequestTenantContext): Account;
    getAccountBalance(accountId: string, tenantContext: RequestTenantContext): Pick<Account, 'id' | 'name' | 'balance' | 'status'>;
    listAccounts(tenantContext: RequestTenantContext, storeId?: string): Account[];
    freezeAccount(accountId: string, tenantContext: RequestTenantContext): Account;
    closeAccount(accountId: string, tenantContext: RequestTenantContext): Account;
    createSettlement(tenantContext: RequestTenantContext, input: CreateSettlementDto): Promise<Settlement>;
    confirmSettlement(settlementId: string, tenantContext: RequestTenantContext): Settlement;
    disputeSettlement(settlementId: string, tenantContext: RequestTenantContext): Settlement;
    getSettlement(settlementId: string, tenantContext: RequestTenantContext): Settlement;
    getSettlementDetail(settlementId: string, tenantContext: RequestTenantContext): {
        settlement: Settlement;
        ledgers: Ledger[];
    };
    listSettlements(tenantContext: RequestTenantContext, query?: SettlementQueryDto): Settlement[];
    createInvoice(tenantContext: RequestTenantContext, input: CreateInvoiceDto): Promise<Invoice>;
    issueInvoice(invoiceId: string, tenantContext: RequestTenantContext): Invoice;
    cancelInvoice(invoiceId: string, tenantContext: RequestTenantContext): Invoice;
    getInvoice(invoiceId: string, tenantContext: RequestTenantContext): Invoice;
    listInvoices(tenantContext: RequestTenantContext, query?: InvoiceQueryDto): Invoice[];
    getRevenueSummary(tenantContext: RequestTenantContext, query?: RevenueSummaryQueryDto): RevenueSummary;
    getDailyRevenue(tenantContext: RequestTenantContext, query: DailyRevenueQueryDto): DailyRevenue;
    recordTransactionRevenue(tenantContext: RequestTenantContext, params: {
        orderId: string;
        transactionId: string;
        amount: number;
        description: string;
        category?: string;
    }): Promise<Ledger>;
    recordTransactionRefund(tenantContext: RequestTenantContext, params: {
        orderId: string;
        transactionId: string;
        amount: number;
        description: string;
    }): Promise<Ledger>;
    private getDefaultStartDate;
}
//# sourceMappingURL=finance.service.d.ts.map