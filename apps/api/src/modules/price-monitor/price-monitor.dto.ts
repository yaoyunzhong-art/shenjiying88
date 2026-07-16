import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { PriceCategory } from './price-monitor.entity'
import 'reflect-metadata'

// ═══════════════════════════════════════════════════════════════════════
// PriceQueryDto：价格查询参数
// ═══════════════════════════════════════════════════════════════════════

export class PriceQueryDto {
  @IsString()
  @IsOptional()
  storeId?: string

  @IsEnum(PriceCategory)
  @IsOptional()
  category?: PriceCategory

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number
}

// ═══════════════════════════════════════════════════════════════════════
// PriceItemDto：单条价格记录
// ═══════════════════════════════════════════════════════════════════════

export class PriceItemDto {
  @IsString()
  id!: string

  @IsString()
  storeId!: string

  @IsString()
  storeName!: string

  @IsString()
  itemName!: string

  @IsString()
  category!: string

  @IsNumber()
  price!: number

  @IsNumber()
  marketAvgPrice!: number

  @IsNumber()
  priceDiff!: number

  @IsNumber()
  diffPercent!: number

  @IsDateString()
  updatedAt!: string
}

// ═══════════════════════════════════════════════════════════════════════
// PriceSummaryDto：价格监控摘要
// ═══════════════════════════════════════════════════════════════════════

export class PriceSummaryDto {
  @IsNumber()
  totalItems!: number

  @IsNumber()
  avgPrice!: number

  @IsNumber()
  avgMarketPrice!: number

  @IsString()
  lowestPriceStore!: string

  @IsString()
  highestPriceStore!: string

  @IsNumber()
  avgDiffPercent!: number
}

// ═══════════════════════════════════════════════════════════════════════
// PriceListDto：价格列表响应
// ═══════════════════════════════════════════════════════════════════════

export class PriceListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceItemDto)
  items!: PriceItemDto[]

  @IsNumber()
  total!: number
}
