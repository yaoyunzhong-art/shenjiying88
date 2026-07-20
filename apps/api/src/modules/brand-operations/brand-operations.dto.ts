import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator'

// ── 资产类型枚举 ─────────────────────────────────────────────────────────────

export enum BrandAssetTypeEnum {
  LOGO = 'logo',
  BANNER = 'banner',
  VIDEO = 'video',
  COPY = 'copy',
}

// ── 活动状态枚举 ─────────────────────────────────────────────────────────────

export enum CampaignStatusEnum {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

// ── 创建资产 DTO ─────────────────────────────────────────────────────────────

export class CreateBrandAssetDto {
  @IsEnum(BrandAssetTypeEnum)
  type!: BrandAssetTypeEnum

  @IsString()
  @IsNotEmpty()
  url!: string

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
  @IsBoolean()
  active?: boolean

  @IsOptional()
  @IsString()
  mimeType?: string
}

// ── 更新资产 DTO ─────────────────────────────────────────────────────────────

export class UpdateBrandAssetDto {
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
  url?: string

  @IsOptional()
  @IsBoolean()
  active?: boolean
}

// ── 创建活动 DTO ─────────────────────────────────────────────────────────────

export class CreateBrandCampaignDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  storeIds!: string[]

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsOptional()
  @IsEnum(CampaignStatusEnum)
  status?: CampaignStatusEnum

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assets?: string[]

  @IsOptional()
  @IsString()
  coverImageUrl?: string

  @IsString()
  @IsNotEmpty()
  createdBy!: string
}

// ── 更新活动 DTO ─────────────────────────────────────────────────────────────

export class UpdateBrandCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeIds?: string[]

  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @IsEnum(CampaignStatusEnum)
  status?: CampaignStatusEnum

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assets?: string[]

  @IsOptional()
  @IsString()
  coverImageUrl?: string
}

// ── 查询活动 DTO ─────────────────────────────────────────────────────────────

export class QueryBrandCampaignDto {
  @IsOptional()
  @IsEnum(CampaignStatusEnum)
  status?: CampaignStatusEnum

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsDateString()
  startFrom?: string

  @IsOptional()
  @IsDateString()
  startTo?: string
}
