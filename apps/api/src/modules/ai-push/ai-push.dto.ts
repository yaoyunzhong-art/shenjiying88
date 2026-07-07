import {
  IsString,
  IsArray,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator'

const PUSH_CHANNELS = ['push', 'sms', 'email', 'wechat', 'app'] as const
const SEGMENT_TYPES = ['behavior', 'value', 'lifecycle'] as const
const EXPERIMENT_STATUSES = ['draft', 'running', 'completed', 'archived'] as const

/**
 * 创建推送任务 DTO
 */
export class CreatePushTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string

  @IsString()
  @IsIn(PUSH_CHANNELS)
  channel!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMemberIds?: string[]

  @IsOptional()
  @IsNumber()
  scheduledAt?: number
}

/**
 * 分群推送 DTO
 */
export class SegmentPushDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string

  @IsString()
  @IsIn(PUSH_CHANNELS)
  channel!: string

  @IsString()
  @IsIn(SEGMENT_TYPES)
  segmentType!: string

  @IsString()
  @MinLength(1)
  segmentId!: string

  @IsOptional()
  @IsNumber()
  scheduledAt?: number
}

/**
 * 创建实验 DTO
 */
export class CreateExperimentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsArray()
  variants!: {
    name: string
    weight: number
    config: Record<string, unknown>
  }[]

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  trafficSplit?: number
}

/**
 * 记录转化 DTO
 */
export class RecordConversionDto {
  @IsString()
  memberId!: string

  @IsString()
  experimentId!: string

  @IsString()
  variantName!: string

  @IsString()
  event!: string

  @IsOptional()
  @IsNumber()
  value?: number
}

/**
 * 查询推送历史 DTO
 */
export class PushHistoryQueryDto {
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  channel?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number
}

/**
 * 推送统计 DTO
 */
export class PushStatsDto {
  @IsOptional()
  @IsNumber()
  startTime?: number

  @IsOptional()
  @IsNumber()
  endTime?: number
}
