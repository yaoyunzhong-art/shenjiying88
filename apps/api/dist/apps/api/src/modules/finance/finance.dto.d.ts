import { LedgerType, AccountType, SettlementStatus, InvoiceType, InvoiceStatus } from './finance.entity';
export declare class CreateLedgerDto {
    type: LedgerType;
    amount: number;
    description: string;
    orderId?: string;
    transactionId?: string;
    category?: string;
    recordedAt?: string;
}
export declare class LedgerQueryDto {
    type?: LedgerType;
    storeId?: string;
    orderId?: string;
    transactionId?: string;
    category?: string;
    recordedAfter?: string;
    recordedBefore?: string;
    limit?: number;
}
export declare class CreateAccountDto {
    name: string;
    type: AccountType;
    initialBalance?: number;
    storeId?: string;
}
export declare class AccountBalanceDto {
    accountId: string;
    amount: number;
}
export declare class CreateSettlementDto {
    storeId?: string;
    startDate: string;
    endDate: string;
    totalRevenue?: number;
    totalExpense?: number;
}
export declare class SettlementQueryDto {
    storeId?: string;
    settlementStatus?: SettlementStatus;
    startAfter?: string;
    endBefore?: string;
    limit?: number;
}
export declare class CreateInvoiceDto {
    orderId?: string;
    type: InvoiceType;
    amount: number;
    taxAmount?: number;
    buyerInfo?: Record<string, unknown>;
}
export declare class InvoiceQueryDto {
    storeId?: string;
    orderId?: string;
    type?: InvoiceType;
    status?: InvoiceStatus;
    issuedAfter?: string;
    issuedBefore?: string;
    limit?: number;
}
export declare class RevenueSummaryQueryDto {
    storeId?: string;
    startDate?: string;
    endDate?: string;
}
export declare class DailyRevenueQueryDto {
    storeId?: string;
    date: string;
}
//# sourceMappingURL=finance.dto.d.ts.map