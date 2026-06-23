import { IsEnum, IsOptional, IsString } from 'class-validator'
import 'reflect-metadata'
import { AnalyticsScope } from './analytics.entity'

export class GetOperationSnapshotDto {
  @IsEnum(AnalyticsScope)
  @IsOptional()
  scope?: AnalyticsScope

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string
}

export class GetDiagnosticsDto {
  @IsEnum(AnalyticsScope)
  @IsOptional()
  scope?: AnalyticsScope

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string
}

export class GetRecommendationsDto {
  @IsEnum(AnalyticsScope)
  @IsOptional()
  scope?: AnalyticsScope

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string
}
