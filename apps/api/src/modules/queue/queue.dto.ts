import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  MaxLength
} from 'class-validator'
import 'reflect-metadata'
import {
  QueueChannel,
  QueueSource,
  QueueType,
  QueueStatus
} from './queue.entity'

export class CreateQueueDto {
  @IsEnum(QueueType)
  type!: QueueType

  @IsString()
  userId!: string

  @IsString()
  @MinLength(1)
  userName!: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsInt()
  @Min(1)
  @Max(99)
  partySize!: number

  @IsString()
  @IsOptional()
  resourceId?: string

  @IsString()
  @IsOptional()
  resourceName?: string

  @IsString()
  @IsOptional()
  remark?: string

  /** WP-12A: 排队来源 */
  @IsEnum(QueueSource)
  @IsOptional()
  source?: QueueSource

  /** WP-12A: 排队渠道 */
  @IsEnum(QueueChannel)
  @IsOptional()
  channel?: QueueChannel
}

export class UpdateQueueDto {
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  partySize?: number

  @IsString()
  @IsOptional()
  phone?: string

  @IsString()
  @IsOptional()
  resourceName?: string

  @IsString()
  @IsOptional()
  remark?: string
}

export class QueueQueryDto {
  @IsEnum(QueueType)
  @IsOptional()
  type?: QueueType

  @IsEnum(QueueStatus)
  @IsOptional()
  status?: QueueStatus

  @IsString()
  @IsOptional()
  resourceId?: string

  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  userId?: string

  @IsString()
  @IsOptional()
  queueNumber?: string

  @IsEnum(QueueSource)
  @IsOptional()
  source?: QueueSource

  @IsEnum(QueueChannel)
  @IsOptional()
  channel?: QueueChannel

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number

  @IsInt()
  @Min(0)
  @IsOptional()
  page?: number

  @IsString()
  @IsOptional()
  sortBy?: string

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc'
}

export class JoinQueueDto {
  @IsEnum(QueueType)
  queueType!: QueueType

  @IsString()
  @MinLength(1)
  memberId!: string

  @IsString()
  @IsOptional()
  memberName?: string

  @IsString()
  @IsOptional()
  resourceId?: string

  @IsString()
  @IsOptional()
  resourceName?: string

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  priority?: number

  @IsString()
  @IsOptional()
  remark?: string

  /** WP-12A: 排队来源 */
  @IsEnum(QueueSource)
  @IsOptional()
  source?: QueueSource

  /** WP-12A: 排队渠道 */
  @IsEnum(QueueChannel)
  @IsOptional()
  channel?: QueueChannel
}

/**
 * WP-12A: 渠道排队 DTO（微信/App/Kiosk）
 */
export class JoinByChannelDto {
  @IsEnum(QueueType)
  queueType!: QueueType

  @IsString()
  @MinLength(1)
  memberId!: string

  @IsString()
  @IsOptional()
  memberName?: string

  @IsString()
  @IsOptional()
  resourceId?: string

  @IsString()
  @IsOptional()
  resourceName?: string

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  priority?: number

  @IsString()
  @IsOptional()
  remark?: string
}

export class TransferEntryDto {
  @IsEnum(QueueSource)
  targetSource!: QueueSource
}

export class CallNextDto {
  @IsString()
  resourceId!: string

  @IsString()
  @IsOptional()
  type?: QueueType
}
