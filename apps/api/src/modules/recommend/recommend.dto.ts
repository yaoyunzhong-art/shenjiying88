import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import type { StrategyType, RecommendationRequest, Candidate, RecommendationResult } from './recommend.entity'

/**
 * Phase-40 T170: Recommend DTO
 *
 * 推荐模块数据传输对象:
 *  - RecommendRequestDto: 推荐请求
 *  - TrackViewDto: 浏览追踪
 *  - TrackPurchaseDto: 购买追踪
 *  - UpdatePreferencesDto: 偏好更新
 *  - CacheInvalidateDto: 缓存失效
 *  - RecommendResponseDto: 推荐响应
 */

export class RecommendRequestDto implements Partial<RecommendationRequest> {
  @IsString()
  tenantId!: string

  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  contextItemId?: string

  @IsArray()
  @IsEnum(['item-cf', 'user-cf', 'popular', 'recently-viewed', 'personalized'], { each: true })
  @IsOptional()
  strategies?: StrategyType[]

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number

  @IsBoolean()
  @IsOptional()
  excludePurchased?: boolean

  @IsBoolean()
  @IsOptional()
  excludeOutOfStock?: boolean

  @IsBoolean()
  @IsOptional()
  diversify?: boolean
}

export class TrackViewDto {
  @IsString()
  tenantId!: string

  @IsString()
  memberId!: string

  @IsString()
  itemId!: string

  @IsInt()
  @Min(0)
  @IsOptional()
  durationMs?: number
}

export class TrackPurchaseDto {
  @IsString()
  tenantId!: string

  @IsString()
  memberId!: string

  @IsString()
  itemId!: string

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number

  @IsInt()
  @Min(0)
  @IsOptional()
  amountCents?: number

  @IsString()
  category!: string
}

export class UpdatePreferencesDto {
  @IsString()
  tenantId!: string

  @IsString()
  memberId!: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  favoriteCategories?: string[]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  favoriteTags?: string[]
}

export class CacheInvalidateDto {
  @IsString()
  tenantId!: string
}

export class CandidateDto implements Candidate {
  @IsString()
  itemId!: string

  score!: number

  @IsString()
  reasoning!: string

  @IsString()
  strategy!: StrategyType

  metadata?: Record<string, any>
}

export class RecommendResponseDto {
  request!: RecommendRequestDto
  candidates!: CandidateDto[]
  fallbackUsed?: string

  metadata!: {
    strategiesApplied: string[]
    totalCandidates: number
    filteredOut: number
    executionMs: number
    cached: boolean
    generatedAt: string
  }
}
