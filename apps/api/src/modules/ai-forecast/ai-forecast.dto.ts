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
  ArrayMinSize
} from 'class-validator'
import { Type } from 'class-transformer'

// ─── Forecast DTOs ───────────────────────────────────────────

/**
 * 销量预测查询 DTO
 */
export class ForecastQueryDto {
  @IsString()
  @IsNotEmpty()
  productId!: string

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  daysAhead!: number

  @IsOptional()
  @IsString()
  categoryId?: string
}

/**
 * 品类预测查询 DTO
 */
export class CategoryForecastQueryDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  daysAhead!: number
}

// ─── Inventory DTOs ──────────────────────────────────────────

/**
 * 最优库存计算 DTO
 */
export class OptimalStockQueryDto {
  @IsString()
  @IsNotEmpty()
  productId!: string

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(90)
  leadTime!: number

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  daysAhead!: number
}

/**
 * 补货建议查询 DTO
 */
export class ReorderQueryDto {
  @IsString()
  @IsNotEmpty()
  productId!: string
}

/**
 * 滞销品检测查询 DTO
 */
export class SlowMovingQueryDto {
  @IsString()
  @IsNotEmpty()
  productId!: string

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  thresholdDays?: number
}

// ─── Transfer DTOs ───────────────────────────────────────────

/**
 * 调拨建议查询 DTO
 */
export class TransferQueryDto {
  @IsString()
  @IsNotEmpty()
  fromStore!: string

  @IsString()
  @IsNotEmpty()
  toStore!: string

  @IsString()
  @IsNotEmpty()
  productId!: string
}

/**
 * 调拨收益计算 DTO
 */
export class TransferBenefitQueryDto {
  @IsString()
  @IsNotEmpty()
  fromStore!: string

  @IsString()
  @IsNotEmpty()
  toStore!: string

  @IsString()
  @IsNotEmpty()
  productId!: string
}

/**
 * 全局分配 DTO
 */
export class GlobalAllocationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreProductPairDto)
  @ArrayMinSize(1)
  products!: StoreProductPairDto[]
}

/**
 * 门店-产品配对 DTO
 */
export class StoreProductPairDto {
  @IsString()
  @IsNotEmpty()
  storeId!: string

  @IsString()
  @IsNotEmpty()
  productId!: string
}

/**
 * 促销调整 DTO
 */
export class PromotionAdjustDto {
  @IsString()
  @IsNotEmpty()
  productId!: string

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(365)
  daysAhead!: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionItemDto)
  promotions!: PromotionItemDto[]
}

/**
 * 促销项 DTO
 */
export class PromotionItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string

  @IsString()
  @IsEnum(['discount', 'bundled', 'gift'])
  type!: 'discount' | 'bundled' | 'gift'

  @IsString()
  @IsNotEmpty()
  startDate!: string

  @IsString()
  @IsNotEmpty()
  endDate!: string

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  boostPercent!: number
}
