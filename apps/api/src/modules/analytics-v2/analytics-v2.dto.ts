import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsObject
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import type { EventType, CohortPeriod } from './analytics-v2.entity'

export class EventContextDto {
  @IsOptional() @IsString() url?: string
  @IsOptional() @IsString() referrer?: string
  @IsOptional() @IsString() channel?: string
  @IsOptional() @IsString() page?: string
  @IsOptional() @IsString() component?: string
}

export class EventActionDto {
  @IsNotEmpty() @IsString() name!: string
  @IsOptional() @IsString() category?: string
  @IsOptional() @IsString() target?: string
}

export class CollectEventDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsString() eventId!: string
  @IsNotEmpty() @IsString()
  @IsEnum(['PAGEVIEW', 'CLICK', 'CONVERSION', 'PURCHASE', 'CUSTOM'])
  type!: EventType
  @IsNotEmpty() @IsString() who!: string
  @IsNotEmpty() @IsString() what!: string
  @IsOptional() @IsString() memberId?: string
  @IsOptional() @IsString() sessionId?: string
  @IsOptional() @ValidateNested() @Type(() => EventContextDto) where?: EventContextDto
  @IsOptional() @IsString() why?: string
  @IsOptional() @IsString() how?: string
  @IsOptional() @IsObject() properties?: Record<string, any>
  @IsOptional() @IsNumber() @Min(0) revenueCents?: number
  @IsOptional() @IsString() timestamp?: string
}

export class CollectBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollectEventDto)
  @MinLength(1)
  @MaxLength(1000)
  events!: CollectEventDto[]
}

export class ApplyCDCDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsString() tableName!: string
  @IsNotEmpty() @IsString() recordId!: string
  @IsNotEmpty() @IsEnum(['CREATED', 'UPDATED', 'DELETED']) eventType!: 'CREATED' | 'UPDATED' | 'DELETED'
  @IsNotEmpty() @IsString() eventId!: string
  @IsOptional() @IsNumber() watermark?: number
  @IsOptional() @IsObject() before?: Record<string, any>
  @IsOptional() @IsObject() after?: Record<string, any>
}

export class ReplayCDCDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsOptional() @IsString() tableName?: string
  @IsOptional() @IsNumber() @Min(0) fromWatermark?: number
  @IsOptional() @IsNumber() @Min(1) limit?: number
}

export class RegisterMemberDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsEnum(['WEEKLY', 'MONTHLY']) period!: CohortPeriod
  @IsNotEmpty() @IsString() memberId!: string
  @IsNotEmpty() @IsString() registrationDate!: string
}

export class TrackActivityDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsString() memberId!: string
  @IsNotEmpty() @IsEnum(['PAGEVIEW', 'CLICK', 'CONVERSION', 'PURCHASE', 'CUSTOM']) activityType!: EventType
  @IsOptional() @IsObject() properties?: Record<string, any>
}

export class CohortListQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsOptional() @IsString() @IsEnum(['WEEKLY', 'MONTHLY']) period?: CohortPeriod
}

export class CohortMatrixQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsEnum(['WEEKLY', 'MONTHLY']) period!: CohortPeriod
  @IsOptional() @IsString() periods?: string
}

export class FunnelStepDto {
  @IsNotEmpty() @IsString() name!: string
  @IsNotEmpty() @IsEnum(['PAGEVIEW', 'CLICK', 'CONVERSION', 'PURCHASE', 'CUSTOM']) eventType!: EventType
  @IsOptional() @IsObject() filter?: Record<string, any>
}

export class CreateFunnelDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsString() @MinLength(1) @MaxLength(200) name!: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => FunnelStepDto) @MinLength(1) @MaxLength(20) steps!: FunnelStepDto[]
  @IsOptional() @IsNumber() @Min(1) @Max(90) windowDays?: number
}

export class FunnelIdParamDto {
  @IsNotEmpty() @IsString() id!: string
}

export class GenerateRetentionDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsEnum(['WEEKLY', 'MONTHLY']) period!: CohortPeriod
}

export class RetentionHealthQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsNotEmpty() @IsEnum(['WEEKLY', 'MONTHLY']) period!: CohortPeriod
}

export class MetricsSummaryQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsOptional() @IsString() days?: string
}

export class LiveMetricsQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
}

export class HealthReportQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
}

export class RecentEventsQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsOptional() @IsString() limit?: string
}

export class TenantQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
}

export class TenantWithSinceQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsOptional() @IsString() since?: string
}

export class CDCQueryDto {
  @IsNotEmpty() @IsString() tenantId!: string
  @IsOptional() @IsString() since?: string
}
