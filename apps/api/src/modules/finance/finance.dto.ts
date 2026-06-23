import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsObject, Min, Max, ValidateNested, IsArray } from 'class-validator'
import { Type } from 'class-transformer'
import {
  LedgerType,
  AccountType,
  AccountStatus,
  SettlementStatus,
  InvoiceType,
  InvoiceStatus
} from './finance.entity'

// ── Ledger ──

export class CreateLedgerDto {
  @IsEnum(LedgerType)
  declare type: LedgerType

  @IsNumber()
  @Min(0)
  declare amount: number

  @IsString()
  declare description: string

  @IsOptional()
  @IsString()
  declare orderId?: string

  @IsOptional()
  @IsString()
  declare transactionId?: string

  @IsOptional()
  @IsString()
  declare category?: string

  @IsOptional()
  @IsDateString()
  declare recordedAt?: string
}

export class LedgerQueryDto {
  @IsOptional()
  @IsEnum(LedgerType)
  declare type?: LedgerType

  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsString()
  declare orderId?: string

  @IsOptional()
  @IsString()
  declare transactionId?: string

  @IsOptional()
  @IsString()
  declare category?: string

  @IsOptional()
  @IsDateString()
  declare recordedAfter?: string

  @IsOptional()
  @IsDateString()
  declare recordedBefore?: string

  @IsOptional()
  @IsNumber()
  declare limit?: number
}

// ── Account ──

export class CreateAccountDto {
  @IsString()
  declare name: string

  @IsEnum(AccountType)
  declare type: AccountType

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare initialBalance?: number

  @IsOptional()
  @IsString()
  declare storeId?: string
}

export class AccountBalanceDto {
  @IsString()
  declare accountId: string

  @IsNumber()
  @Min(0)
  declare amount: number
}

// ── Settlement ──

export class CreateSettlementDto {
  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsDateString()
  declare startDate: string

  @IsDateString()
  declare endDate: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare totalRevenue?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare totalExpense?: number
}

export class SettlementQueryDto {
  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsEnum(SettlementStatus)
  declare settlementStatus?: SettlementStatus

  @IsOptional()
  @IsDateString()
  declare startAfter?: string

  @IsOptional()
  @IsDateString()
  declare endBefore?: string

  @IsOptional()
  @IsNumber()
  declare limit?: number
}

// ── Invoice ──

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  declare orderId?: string

  @IsEnum(InvoiceType)
  declare type: InvoiceType

  @IsNumber()
  @Min(0)
  declare amount: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare taxAmount?: number

  @IsOptional()
  @IsObject()
  declare buyerInfo?: Record<string, unknown>
}

export class InvoiceQueryDto {
  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsString()
  declare orderId?: string

  @IsOptional()
  @IsEnum(InvoiceType)
  declare type?: InvoiceType

  @IsOptional()
  @IsEnum(InvoiceStatus)
  declare status?: InvoiceStatus

  @IsOptional()
  @IsDateString()
  declare issuedAfter?: string

  @IsOptional()
  @IsDateString()
  declare issuedBefore?: string

  @IsOptional()
  @IsNumber()
  declare limit?: number
}

// ── Revenue Summary ──

export class RevenueSummaryQueryDto {
  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsDateString()
  declare startDate?: string

  @IsOptional()
  @IsDateString()
  declare endDate?: string
}

export class DailyRevenueQueryDto {
  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsDateString()
  declare date: string
}
