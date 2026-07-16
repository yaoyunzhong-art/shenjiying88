import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsNotEmpty } from 'class-validator'
import 'reflect-metadata'
import { CompetitorCategory } from './competitor-track.entity'

/** 竞品查询 DTO */
export class TrackQueryDto {
  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  @IsEnum(CompetitorCategory)
  category?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number

  @IsOptional()
  @IsNumber()
  @Max(10)
  maxPrice?: number
}

/** 竞品创建 DTO */
export class CreateCompetitorDto {
  @IsString()
  @IsNotEmpty()
  competitorName!: string

  @IsString()
  @IsNotEmpty()
  city!: string

  @IsString()
  @IsEnum(CompetitorCategory)
  category!: string

  @IsNumber()
  @Min(1)
  @Max(5)
  priceLevel!: number

  @IsNumber()
  @Min(0)
  @Max(5)
  rating!: number

  @IsNumber()
  @Min(0)
  visitorCount!: number

  @IsString()
  @IsNotEmpty()
  advantage!: string

  @IsString()
  @IsNotEmpty()
  weakness!: string
}

/** 竞品信息 DTO */
export interface CompetitorDto {
  id: string
  competitorName: string
  city: string
  category: string
  priceLevel: number
  rating: number
  visitorCount: number
  advantage: string
  weakness: string
  lastUpdated: string
}

/** 竞品汇总 DTO */
export interface TrackSummaryDto {
  totalCompetitors: number
  categoryDistribution: Record<string, number>
  cityDistribution: Record<string, number>
  avgRating: number
  avgPriceLevel: number
  topCompetitors: CompetitorDto[]
}

/** 竞品列表 DTO */
export interface CompetitorListDto {
  items: CompetitorDto[]
  total: number
  page: number
  pageSize: number
}
