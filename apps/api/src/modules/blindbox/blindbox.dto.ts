import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  MinLength,
} from 'class-validator'
import { Type } from 'class-transformer'

// ─── Prize DTO ───────────────────────────────────────────────

/**
 * 盲盒奖品定义 DTO
 */
export class PrizeDto {
  @IsString()
  @IsNotEmpty()
  prizeId!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock!: number

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  weight!: number
}

// ─── Tier DTO ────────────────────────────────────────────────

/**
 * 盲盒层级定义 DTO
 */
export class TierDto {
  @IsString()
  @IsNotEmpty()
  tierId!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  probability!: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeDto)
  @ArrayMinSize(1)
  prizes!: PrizeDto[]
}

// ─── Create Plan DTO ─────────────────────────────────────────

/**
 * 创建盲盒计划 DTO
 */
export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TierDto)
  @ArrayMinSize(1)
  tiers!: TierDto[]

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  guaranteePityCount!: number
}

// ─── Draw DTO ────────────────────────────────────────────────

/**
 * 抽盲盒请求 DTO
 */
export class DrawBodyDto {
  @IsString()
  @IsNotEmpty()
  userId!: string
}

// ─── History Query DTO ───────────────────────────────────────

/**
 * 抽盒历史查询 DTO
 */
export class HistoryQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number
}

// ─── Response DTOs ───────────────────────────────────────────

/**
 * 抽取结果 DTO
 */
export class DrawResultDto {
  success!: boolean
  data?: unknown
  message?: string
}

/**
 * 概率公示结果 DTO
 */
export class ProbabilityResultDto {
  tiers!: { name: string; probability: number }[]
  sum!: number
}
