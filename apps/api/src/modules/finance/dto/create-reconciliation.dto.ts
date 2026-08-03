import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsDateString, Min, ValidateNested, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

export enum ReconciliationChannel {
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  BANK = 'BANK',
  CASH = 'CASH',
  CARD = 'CARD'
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  MISMATCHED = 'MISMATCHED',
  UNMATCHED_INTERNAL = 'UNMATCHED_INTERNAL',
  UNMATCHED_EXTERNAL = 'UNMATCHED_EXTERNAL'
}

// ─── 对账批次 ───────────────────────────────────────────

export class CreateReconciliationBatchDto {
  @IsEnum(ReconciliationChannel)
  declare channel: ReconciliationChannel

  @IsString()
  declare date: string

  @IsOptional()
  @IsString()
  declare storeId?: string
}

export class ReconciliationBatchQueryDto {
  @IsOptional()
  @IsEnum(ReconciliationChannel)
  declare channel?: ReconciliationChannel

  @IsOptional()
  @IsString()
  declare date?: string

  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  declare status?: ReconciliationStatus

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  declare limit?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  declare offset?: number
}

// ─── 对账交易 ───────────────────────────────────────────

export class CreateReconciliationTransactionDto {
  @IsEnum(ReconciliationChannel)
  declare channel: ReconciliationChannel

  @IsOptional()
  @IsString()
  declare internalTransactionId?: string

  @IsOptional()
  @IsString()
  declare externalTransactionId?: string

  @IsOptional()
  @IsString()
  declare channelTransactionNo?: string

  @IsString()
  declare type: 'PAYMENT' | 'REFUND' | 'SETTLEMENT'

  @IsNumber()
  @Min(0)
  declare internalAmount: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare externalAmount?: number

  @IsNumber()
  declare channelFee: number

  @IsOptional()
  @IsString()
  declare memo?: string
}

export class UpdateReconciliationTransactionDto {
  @IsOptional()
  @IsString()
  declare externalTransactionId?: string

  @IsOptional()
  @IsString()
  declare channelTransactionNo?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare externalAmount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare channelFee?: number

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  declare status?: ReconciliationStatus

  @IsOptional()
  @IsString()
  declare memo?: string
}

export class ReconciliationTransactionQueryDto {
  @IsOptional()
  @IsEnum(ReconciliationChannel)
  declare channel?: ReconciliationChannel

  @IsOptional()
  @IsString()
  declare batchId?: string

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  declare status?: ReconciliationStatus

  @IsOptional()
  @IsString()
  declare type?: string

  @IsOptional()
  @IsDateString()
  declare dateFrom?: string

  @IsOptional()
  @IsDateString()
  declare dateTo?: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  declare limit?: number

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  declare offset?: number
}

// ─── 手动匹配 ───────────────────────────────────────────

export class ManualMatchDto {
  @IsString()
  declare transactionId: string

  @IsString()
  declare externalTransactionId: string

  @IsOptional()
  @IsString()
  declare channelTransactionNo?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  declare externalAmount?: number

  @IsOptional()
  @IsString()
  declare memo?: string
}

// ─── 手动调账 ───────────────────────────────────────────

export class ManualAdjustmentDto {
  @IsString()
  declare transactionId: string

  @IsNumber()
  declare difference: number

  @IsString()
  declare reason: string
}

// ─── 对账统计 ───────────────────────────────────────────

export class ReconciliationStatsQueryDto {
  @IsOptional()
  @IsEnum(ReconciliationChannel)
  declare channel?: ReconciliationChannel

  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsDateString()
  declare dateFrom?: string

  @IsOptional()
  @IsDateString()
  declare dateTo?: string
}

// ─── 对账历史查询 ───────────────────────────────────────────

export class ReconciliationQueryDto {
  @IsOptional()
  @IsDateString()
  declare dateFrom?: string

  @IsOptional()
  @IsDateString()
  declare dateTo?: string

  @IsOptional()
  @IsEnum(ReconciliationChannel)
  declare channel?: ReconciliationChannel

  @IsOptional()
  @IsEnum(ReconciliationStatus)
  declare status?: ReconciliationStatus

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  declare limit?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  declare offset?: number
}
