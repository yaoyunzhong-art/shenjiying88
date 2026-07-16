import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { RankPeriod, RankMetric } from './store-rank.entity'
import 'reflect-metadata'

// ═══════════════════════════════════════════════════════════════════════
// RankQueryDto：排行查询参数
// ═══════════════════════════════════════════════════════════════════════

export class RankQueryDto {
  @IsEnum(RankMetric)
  @IsOptional()
  sortBy?: RankMetric

  @IsEnum(RankPeriod)
  @IsOptional()
  period?: RankPeriod

  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number
}

// ═══════════════════════════════════════════════════════════════════════
// StoreRankDto：单条门店排行
// ═══════════════════════════════════════════════════════════════════════

export class StoreRankDto {
  @IsString()
  storeId!: string

  @IsString()
  storeName!: string

  @IsNumber()
  rank!: number

  @IsNumber()
  prevRank!: number

  @IsNumber()
  revenue!: number

  @IsNumber()
  growth!: number

  @IsNumber()
  satisfaction!: number

  @IsNumber()
  efficiency!: number

  @IsNumber()
  memberCount!: number

  @IsNumber()
  deviceCount!: number
}

// ═══════════════════════════════════════════════════════════════════════
// RankSummaryDto：排行摘要
// ═══════════════════════════════════════════════════════════════════════

export class RankSummaryDto {
  @IsNumber()
  totalStores!: number

  @IsNumber()
  avgRevenue!: number

  @IsString()
  topStore!: string

  @IsNumber()
  improvedStores!: number

  @IsNumber()
  declinedStores!: number
}

// ═══════════════════════════════════════════════════════════════════════
// StoreRankListDto：排行列表
// ═══════════════════════════════════════════════════════════════════════

export class StoreRankListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreRankDto)
  items!: StoreRankDto[]

  @IsNumber()
  total!: number
}
