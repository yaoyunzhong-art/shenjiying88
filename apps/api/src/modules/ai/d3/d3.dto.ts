import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

// ─── Context & Period Enums ────────────────────────────────────

export enum RecommendContext {
  HOME = 'home',
  SEARCH = 'search',
  DETAIL = 'detail',
  CART = 'cart',
  CHECKOUT = 'checkout',
  PROFILE = 'profile',
}

export enum RecommendPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
}

export enum RecommendChannel {
  PUSH = 'push',
  PULL = 'pull',
  POPUP = 'popup',
}

export enum FilterRuleType {
  CATEGORY = 'category',
  PRICE_RANGE = 'price_range',
  BRAND = 'brand',
  TAG = 'tag',
  RATING = 'rating',
}

// ─── DTOs for Discovery ────────────────────────────────────────

export class GetRecommendationsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsOptional()
  @IsEnum(RecommendContext)
  context?: RecommendContext

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number
}

export class GetTrendingItemsDto {
  @IsString()
  @IsNotEmpty()
  type!: string

  @IsOptional()
  @IsEnum(RecommendPeriod)
  period?: RecommendPeriod
}

export class GetPersonalPicksDto {
  @IsString()
  @IsNotEmpty()
  userId!: string
}

// ─── DTOs for Decision ─────────────────────────────────────────

export class FilterRuleDto {
  @IsEnum(FilterRuleType)
  type!: FilterRuleType

  @IsString()
  @IsNotEmpty()
  value!: string
}

export class ApplyFiltersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  candidateIds!: string[]

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FilterRuleDto)
  rules!: FilterRuleDto[]
}

export class ScoreItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  itemIds!: string[]

  @IsString()
  @IsNotEmpty()
  userId!: string
}

export class GetExplanationDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string

  @IsNumber()
  @Min(0)
  score!: number
}

// ─── DTOs for Delivery ─────────────────────────────────────────

export class GetDeliveriesDto {
  @IsString()
  @IsNotEmpty()
  userId!: string
}

export class MarkDeliveredDto {
  @IsString()
  @IsNotEmpty()
  deliveryId!: string
}

export class GetChannelDto {
  @IsEnum(RecommendChannel)
  channel!: RecommendChannel
}
