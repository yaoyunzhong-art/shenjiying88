import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsObject,
  ArrayMinSize,
} from 'class-validator'

// ═══════════════════════════════════════════
// 品牌活动数据导出
// ═══════════════════════════════════════════

export enum ExportFormatEnum {
  CSV = 'csv',
  XLSX = 'xlsx',
}

export enum ExportScopeEnum {
  CAMPAIGNS = 'campaigns',
  ASSETS = 'assets',
  COLLABORATIONS = 'collaborations',
  TEMPLATES = 'templates',
  SYNCED_STORES = 'synced_stores',
}

export class CreateExportRecordDto {
  @IsEnum(ExportFormatEnum)
  format!: ExportFormatEnum

  @IsEnum(ExportScopeEnum)
  scope!: ExportScopeEnum

  @IsOptional()
  @IsObject()
  filters?: Record<string, string>

  @IsString()
  @IsNotEmpty()
  requestedBy!: string
}

export class QueryExportRecordDto {
  @IsOptional()
  @IsEnum(ExportScopeEnum)
  scope?: ExportScopeEnum

  @IsOptional()
  @IsEnum(ExportFormatEnum)
  format?: ExportFormatEnum
}

// ═══════════════════════════════════════════
// 联名合作合同管理
// ═══════════════════════════════════════════

export enum ContractStatusEnum {
  DRAFT = 'draft',
  SIGNED = 'signed',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

export class CreateCollaborationContractDto {
  @IsString()
  @IsNotEmpty()
  collaborationId!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  contractNumber!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  filePath?: string

  @IsOptional()
  @IsDateString()
  signedAt?: string

  @IsDateString()
  effectiveDate!: string

  @IsDateString()
  expiryDate!: string

  @IsOptional()
  @IsEnum(ContractStatusEnum)
  status?: ContractStatusEnum

  @IsNumber()
  @Min(0)
  amount!: number

  @IsOptional()
  @IsArray()
  parties?: Array<{ name: string; role: string }>

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  termsSummary?: string

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean
}

export class UpdateCollaborationContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  filePath?: string

  @IsOptional()
  @IsDateString()
  signedAt?: string

  @IsOptional()
  @IsDateString()
  effectiveDate?: string

  @IsOptional()
  @IsDateString()
  expiryDate?: string

  @IsOptional()
  @IsEnum(ContractStatusEnum)
  status?: ContractStatusEnum

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number

  @IsOptional()
  @IsArray()
  parties?: Array<{ name: string; role: string }>

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  termsSummary?: string

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean
}

export class QueryCollaborationContractDto {
  @IsOptional()
  @IsString()
  collaborationId?: string

  @IsOptional()
  @IsEnum(ContractStatusEnum)
  status?: ContractStatusEnum
}

// ═══════════════════════════════════════════
// 品牌活动A/B测试
// ═══════════════════════════════════════════

export enum ABTestStatusEnum {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateCampaignABTestDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string

  @IsArray()
  @ArrayMinSize(2)
  variants!: Array<{
    name: string
    description: string
    variantTitle?: string
    variantDescription?: string
    variantAssets?: string[]
    variantCoverImageUrl?: string
    storeIds: string[]
  }>
}

export class RecordVariantMetricsDto {
  @IsNumber()
  @Min(0)
  impressions!: number

  @IsNumber()
  @Min(0)
  clicks!: number

  @IsNumber()
  @Min(0)
  conversions!: number
}

export class DecideABTestWinnerDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string
}

// ═══════════════════════════════════════════
// 品牌运营日历查询
// ═══════════════════════════════════════════

export class QueryCalendarTimelineDto {
  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsOptional()
  @IsString()
  type?: string
}

// ═══════════════════════════════════════════
// 品牌资产回收站
// ═══════════════════════════════════════════

export enum RecycleBinEntityTypeEnum {
  ASSET = 'asset',
  CAMPAIGN = 'campaign',
  TEMPLATE = 'template',
  COLLABORATION = 'collaboration',
}

export class QueryRecycleBinDto {
  @IsOptional()
  @IsEnum(RecycleBinEntityTypeEnum)
  entityType?: RecycleBinEntityTypeEnum

  @IsOptional()
  @IsString()
  search?: string
}
