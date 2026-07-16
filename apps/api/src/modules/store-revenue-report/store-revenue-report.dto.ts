import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ═══════════════════════════════════════════════════════════════════════
// Revenue Report Query
// ═══════════════════════════════════════════════════════════════════════

export class RevenueReportQueryDto {
  @IsString()
  @IsOptional()
  storeId?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsEnum(['daily', 'monthly', 'quarterly'])
  @IsOptional()
  reportType?: string
}

// ═══════════════════════════════════════════════════════════════════════
// Revenue Report DTO
// ═══════════════════════════════════════════════════════════════════════

export class RevenueReportDto {
  @IsString()
  id!: string

  @IsString()
  storeId!: string

  @IsString()
  storeName!: string

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsString()
  reportType!: string

  @IsNumber()
  totalRevenue!: number

  @IsNumber()
  totalExpense!: number

  @IsNumber()
  grossProfit!: number

  @IsNumber()
  netProfit!: number

  revenueBreakdown!: Record<string, number>

  expenseBreakdown!: Record<string, number>

  @IsOptional()
  previousRevenue?: number

  @IsOptional()
  previousExpense?: number

  @IsOptional()
  revenueGrowthRate?: number

  @IsOptional()
  expenseGrowthRate?: number

  @IsDateString()
  createdAt!: string
}

export class RevenueReportListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevenueReportDto)
  items!: RevenueReportDto[]

  @IsNumber()
  total!: number
}

// ═══════════════════════════════════════════════════════════════════════
// Create Revenue Report DTO
// ═══════════════════════════════════════════════════════════════════════

export class CreateRevenueReportDto {
  @IsString()
  storeId!: string

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsEnum(['daily', 'monthly', 'quarterly'])
  reportType!: string
}

// ═══════════════════════════════════════════════════════════════════════
// Revenue Summary DTO
// ═══════════════════════════════════════════════════════════════════════

export class RevenueSummaryDto {
  @IsString()
  storeId!: string

  @IsString()
  storeName!: string

  @IsNumber()
  totalRevenue!: number

  @IsNumber()
  totalExpense!: number

  @IsNumber()
  grossProfit!: number

  @IsNumber()
  netProfit!: number

  @IsOptional()
  revenueGrowthRate?: number

  @IsOptional()
  expenseGrowthRate?: number

  revenueBreakdown!: Record<string, number>

  expenseBreakdown!: Record<string, number>

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string
}
