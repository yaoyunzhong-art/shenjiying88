import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

/**
 * 用户偏好设置 DTO
 */
export class PreferencesDto {
  @IsArray()
  @IsString({ each: true })
  gameTypes!: string[]

  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange!: PriceRangeDto

  @IsString()
  @IsEnum(['daily', 'weekly', 'monthly', 'occasional'])
  visitFrequency!: 'daily' | 'weekly' | 'monthly' | 'occasional'

  @IsNumber()
  @Min(0)
  avgSpend!: number

  @IsString()
  @IsNotEmpty()
  favoriteTimeSlot!: string
}

/**
 * 价格区间 DTO
 */
export class PriceRangeDto {
  @IsNumber()
  @Min(0)
  min!: number

  @IsNumber()
  @Min(0)
  max!: number
}

/**
 * 用户画像 DTO
 */
export class UserProfileDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsString()
  @IsNotEmpty()
  tenantId!: string

  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences!: PreferencesDto

  @IsArray()
  @IsString({ each: true })
  behaviorTags!: string[]
}

/**
 * 更新用户画像 DTO（所有字段可选）
 */
export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  behaviorTags?: string[]
}

/**
 * 物品评分 DTO
 */
export class ItemScoreDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsString()
  @IsNotEmpty()
  itemId!: string

  @IsString()
  @IsEnum(['game', 'product', 'activity'])
  itemType!: 'game' | 'product' | 'activity'

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number

  @IsString()
  @IsEnum(['view', 'click', 'purchase', 'play'])
  interaction!: 'view' | 'click' | 'purchase' | 'play'

  @IsNumber()
  @Min(0)
  @Max(10)
  weight!: number
}

/**
 * 记录交互 DTO（简化版，rating/weight 自动计算）
 */
export class RecordInteractionDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsString()
  @IsNotEmpty()
  itemId!: string

  @IsString()
  @IsEnum(['game', 'product', 'activity'])
  itemType!: 'game' | 'product' | 'activity'

  @IsString()
  @IsEnum(['view', 'click', 'purchase', 'play'])
  interaction!: 'view' | 'click' | 'purchase' | 'play'
}

/**
 * 推荐查询 DTO
 */
export class RecommendationQueryDto {
  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  memberId?: string

  @IsOptional()
  @IsString()
  @IsEnum(['game', 'product', 'activity', 'coupon', 'svip'])
  type?: 'game' | 'product' | 'activity' | 'coupon' | 'svip'

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}

/**
 * 策略权重因子 DTO
 */
export class StrategyWeightDto {
  @IsString()
  @IsNotEmpty()
  factor!: string

  @IsNumber()
  @Min(0)
  @Max(1)
  weight!: number
}

/**
 * 创建推荐策略 DTO
 */
export class CreateStrategyDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @IsString()
  @IsEnum(['game', 'product', 'activity', 'coupon', 'svip'])
  targetType!: 'game' | 'product' | 'activity' | 'coupon' | 'svip'

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyWeightDto)
  @ArrayMinSize(1)
  weights!: StrategyWeightDto[]

  @IsOptional()
  @IsString()
  fallbackStrategy?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number
}

/**
 * 更新推荐策略 DTO（所有字段可选）
 */
export class UpdateStrategyDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @IsEnum(['game', 'product', 'activity', 'coupon', 'svip'])
  targetType?: 'game' | 'product' | 'activity' | 'coupon' | 'svip'

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrategyWeightDto)
  weights?: StrategyWeightDto[]

  @IsOptional()
  @IsString()
  fallbackStrategy?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number
}

/**
 * 生成推荐 DTO
 */
export class GenerateRecommendationsDto {
  @IsString()
  @IsNotEmpty()
  strategyId!: string

  @IsOptional()
  @IsString()
  memberId?: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  @IsEnum(['game', 'product', 'activity', 'coupon', 'svip'])
  type?: 'game' | 'product' | 'activity' | 'coupon' | 'svip'

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}

/**
 * 转化记录 DTO
 */
export class RecordConversionDto {
  @IsString()
  @IsNotEmpty()
  recommendationId!: string
}
