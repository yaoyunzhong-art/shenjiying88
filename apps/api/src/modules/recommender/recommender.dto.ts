import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

/**
 * 推荐查询 DTO
 */
export class RecommendQueryDto {
  @IsString()
  @IsNotEmpty()
  championId!: string

  @IsArray()
  @IsString({ each: true })
  currentFiles!: string[]

  @IsOptional()
  @IsString()
  branch?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number
}

/**
 * 推荐反馈 DTO
 */
export class RecommendFeedbackDto {
  @IsString()
  @IsNotEmpty()
  championId!: string

  @IsString()
  @IsNotEmpty()
  chunkId!: string

  @IsString()
  @IsEnum(['adopted', 'dismissed', 'read'])
  action!: 'adopted' | 'dismissed' | 'read'
}

/**
 * 推荐统计查询 DTO
 */
export class RecommendStatsQueryDto {
  @IsOptional()
  @IsString()
  championId?: string

  @IsOptional()
  @IsString()
  module?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number
}
