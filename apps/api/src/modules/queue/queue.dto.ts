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
import { QueueType, QueueStatus } from './queue.entity'

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
}

export class CallNextDto {
  @IsString()
  resourceId!: string

  @IsString()
  @IsOptional()
  type?: QueueType
}
