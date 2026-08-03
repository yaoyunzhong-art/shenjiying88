import {
  IsArray,
  IsDefined,
  IsNumber,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { CollabStatus } from './collab.entity'

/**
 * 创建联名项目 DTO
 */
export class CreateCollabProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsString()
  @MinLength(1)
  brandId!: string

  @IsString()
  @IsOptional()
  @MaxLength(128)
  brandName?: string

  @IsISO8601()
  startDate!: string

  @IsISO8601()
  endDate!: string

  @IsNumber()
  @Min(0)
  @Max(100)
  revenueShareRate!: number

  @IsNumber()
  @Min(0)
  budget!: number

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string
}

/**
 * 更新联名项目 DTO（所有字段可选）
 */
export class UpdateCollabProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @IsOptional()
  name?: string

  @IsString()
  @MinLength(1)
  @IsOptional()
  brandId?: string

  @IsString()
  @MaxLength(128)
  @IsOptional()
  brandName?: string

  @IsISO8601()
  @IsOptional()
  startDate?: string

  @IsISO8601()
  @IsOptional()
  endDate?: string

  @IsEnum(CollabStatus)
  @IsOptional()
  status?: CollabStatus

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  revenueShareRate?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string
}

/**
 * 联名项目查询过滤 DTO
 */
export class CollabProjectFilterDto {
  @IsEnum(CollabStatus)
  @IsOptional()
  status?: CollabStatus

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  name?: string
}
