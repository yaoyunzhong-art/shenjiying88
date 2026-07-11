import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

export enum ReportType {
  PROFIT_LOSS = 'PROFIT_LOSS',
  BALANCE_SHEET = 'BALANCE_SHEET',
  CASH_FLOW = 'CASH_FLOW',
  REVENUE_ANALYSIS = 'REVENUE_ANALYSIS',
  EXPENSE_ANALYSIS = 'EXPENSE_ANALYSIS',
  RECONCILIATION = 'RECONCILIATION'
}

export enum ExportFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF'
}

// ─── 报表创建 ───────────────────────────────────────────

export class CreateReportDto {
  @IsString()
  declare title: string

  @IsEnum(ReportType)
  declare reportType: ReportType

  @IsDateString()
  declare periodStart: string

  @IsDateString()
  declare periodEnd: string

  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsArray()
  @IsEnum(ExportFormat, { each: true })
  declare exportFormats?: ExportFormat[]
}

export class ReportQueryDto {
  @IsOptional()
  @IsEnum(ReportType)
  declare reportType?: ReportType

  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsString()
  declare status?: string

  @IsOptional()
  @IsDateString()
  declare periodStart?: string

  @IsOptional()
  @IsDateString()
  declare periodEnd?: string

  @IsOptional()
  @Type(() => Number)
  declare limit?: number

  @IsOptional()
  @Type(() => Number)
  declare offset?: number
}

// ─── 导出请求 ───────────────────────────────────────────

export class ExportReportDto {
  @IsEnum(ExportFormat)
  declare format: ExportFormat

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare columns?: string[]

  @IsOptional()
  @IsObject()
  declare filters?: Record<string, unknown>
}

// ─── 筛选条件 ───────────────────────────────────────────

export class FilterReportDto {
  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsOptional()
  @IsString()
  declare category?: string

  @IsOptional()
  @IsDateString()
  declare startDate?: string

  @IsOptional()
  @IsDateString()
  declare endDate?: string
}
