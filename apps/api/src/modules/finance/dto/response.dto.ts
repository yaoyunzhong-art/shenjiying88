import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsObject, IsDateString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * response.dto.ts — P-38 财务对账模块响应 DTO
 *
 * 统一响应结构，确保 API 返回数据的类型安全和文档一致性。
 * Swagger 可以从这些 DTO 生成正确的响应 schema。
 */

// ─── 通用分页 ───────────────────────────────────────────

export class PaginationInfo {
  @IsNumber()
  @Min(0)
  declare total: number

  @IsNumber()
  @Min(0)
  declare limit: number

  @IsNumber()
  @Min(0)
  declare offset: number

  @IsNumber()
  @Min(0)
  declare returned: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  declare totalPages?: number
}

export class PaginatedResponse<T> {
  declare data: T[]

  @ValidateNested()
  @Type(() => PaginationInfo)
  declare pagination: PaginationInfo
}

// ─── 对账相关 ───────────────────────────────────────────

export class ReconciliationTransactionResponse {
  @IsString()
  declare id: string

  @IsString()
  declare tenantId: string

  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsString()
  declare channel: string

  @IsString()
  declare type: string

  @IsNumber()
  declare internalAmount: number

  @IsOptional()
  @IsNumber()
  declare externalAmount?: number

  @IsNumber()
  declare difference: number

  @IsOptional()
  @IsString()
  declare channelTransactionNo?: string

  @IsNumber()
  declare channelFee: number

  @IsNumber()
  declare netAmount: number

  @IsString()
  declare status: string

  @IsOptional()
  @IsString()
  declare memo?: string

  @IsOptional()
  @IsDateString()
  declare reconciledAt?: string

  @IsDateString()
  declare createdAt: string

  @IsDateString()
  declare updatedAt: string
}

export class ReconciliationBatchResponse {
  @IsString()
  declare id: string

  @IsString()
  declare tenantId: string

  @IsString()
  declare batchNo: string

  @IsString()
  declare channel: string

  @IsString()
  declare date: string

  @IsNumber()
  declare totalTransactions: number

  @IsNumber()
  declare matchedCount: number

  @IsNumber()
  declare mismatchedCount: number

  @IsNumber()
  declare unmatchedInternalCount: number

  @IsNumber()
  declare unmatchedExternalCount: number

  @IsNumber()
  declare totalDifference: number

  @IsNumber()
  declare totalFee: number

  @IsString()
  declare status: string

  @IsOptional()
  @IsDateString()
  declare completedAt?: string

  @IsDateString()
  declare createdAt: string
}

export class ReconciliationSummaryResponse {
  @IsString()
  declare batchId: string

  @IsString()
  declare batchNo: string

  @IsString()
  declare channel: string

  @IsString()
  declare date: string

  @IsNumber()
  declare totalCount: number

  @IsNumber()
  declare matchedCount: number

  @IsNumber()
  declare matchedRate: number

  @IsNumber()
  declare mismatchedCount: number

  @IsNumber()
  declare totalInternalAmount: number

  @IsNumber()
  declare totalExternalAmount: number

  @IsNumber()
  declare totalDifference: number

  @IsNumber()
  declare totalFee: number

  @IsString()
  declare status: string
}

// ─── 报表相关 ───────────────────────────────────────────

export class ReportResponse {
  @IsString()
  declare id: string

  @IsString()
  declare tenantId: string

  @IsOptional()
  @IsString()
  declare storeId?: string

  @IsString()
  declare title: string

  @IsString()
  declare reportType: string

  @IsString()
  declare periodStart: string

  @IsString()
  declare periodEnd: string

  @IsString()
  declare status: string

  @IsOptional()
  @IsObject()
  declare data?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  declare summary?: Record<string, unknown>

  @IsOptional()
  @IsDateString()
  declare generatedAt?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  declare exportFormats?: string[]

  @IsOptional()
  @IsString()
  declare errorMessage?: string

  @IsDateString()
  declare createdAt: string
}

export class ExportResponse {
  @IsString()
  declare id: string

  @IsString()
  declare reportId: string

  @IsString()
  declare format: string

  @IsOptional()
  @IsString()
  declare url?: string

  @IsOptional()
  @IsString()
  declare content?: string

  @IsDateString()
  declare generatedAt: string

  @IsDateString()
  declare expiresAt: string
}

// ─── 通用响应 ───────────────────────────────────────────

export class ApiResponse<T> {
  declare success: boolean

  declare data?: T

  @IsOptional()
  @IsString()
  declare message?: string

  @IsOptional()
  @IsNumber()
  declare statusCode?: number
}

export class BatchProgressResponse {
  @IsString()
  declare batchId: string

  @IsString()
  declare batchNo: string

  @IsString()
  declare channel: string

  @IsString()
  declare date: string

  @IsNumber()
  declare total: number

  @IsNumber()
  declare processed: number

  @IsNumber()
  declare progress: number

  @IsString()
  declare status: string

  @IsString()
  declare startedAt: string

  @IsOptional()
  @IsDateString()
  declare estimatedEndAt?: string
}
