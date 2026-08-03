import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator'

// ═══════════════════════════════════════════
// 品牌活动定时调度
// ═══════════════════════════════════════════

export enum ScheduleActionEnum {
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
}

export enum SettlementStatusEnum {
  PENDING = 'pending',
  SETTLED = 'settled',
  DISPUTED = 'disputed',
}

export class CreateCampaignScheduleDto {
  @IsString()
  @IsNotEmpty()
  campaignId!: string

  @IsEnum(ScheduleActionEnum)
  action!: ScheduleActionEnum

  @IsDateString()
  scheduledAt!: string
}

export class CancelCampaignScheduleDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string
}

// ═══════════════════════════════════════════
// 联名收入分成
// ═══════════════════════════════════════════

export class CreateRevenueShareRecordDto {
  @IsString()
  @IsNotEmpty()
  collaborationId!: string

  @IsDateString()
  periodStart!: string

  @IsDateString()
  periodEnd!: string

  @IsNumber()
  @Min(0)
  totalRevenue!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  shareRate!: number

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}

export class SettleRevenueShareDto {
  @IsString()
  @IsNotEmpty()
  settledBy!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}

export class QueryRevenueShareDto {
  @IsOptional()
  @IsEnum(SettlementStatusEnum)
  status?: SettlementStatusEnum

  @IsOptional()
  @IsString()
  collaborationId?: string

  @IsOptional()
  @IsDateString()
  periodFrom?: string

  @IsOptional()
  @IsDateString()
  periodTo?: string
}

// ═══════════════════════════════════════════
// 资产分类
// ═══════════════════════════════════════════

export class CreateAssetCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsNumber()
  sortOrder?: number
}

export class UpdateAssetCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsNumber()
  sortOrder?: number
}

// ═══════════════════════════════════════════
// 资产标签
// ═══════════════════════════════════════════

export class CreateAssetTagDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name!: string

  @IsOptional()
  @IsString()
  color?: string
}
