import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min
} from 'class-validator'
import 'reflect-metadata'
import { PushPlatform, PushPriority } from './push.entity'

export class SendPushDto {
  @IsString()
  deviceToken!: string

  @IsEnum(PushPlatform)
  platform!: PushPlatform

  @IsString()
  alert!: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  badge?: number

  @IsString()
  @IsOptional()
  sound?: string

  @IsEnum(PushPriority)
  @IsOptional()
  priority?: PushPriority

  @IsObject()
  @IsOptional()
  extra?: Record<string, unknown>

  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  tenantId?: string
}

export class SchedulePushDto {
  @IsString()
  memberId!: string

  @IsString()
  tenantId!: string

  @IsString()
  content!: string

  @IsEnum(PushPlatform)
  platform!: PushPlatform

  @IsDateString()
  sendAt!: string
}

export class CancelScheduledPushDto {
  @IsString()
  pushId!: string
}

export class RegisterPushTemplateDto {
  @IsString()
  code!: string

  @IsEnum(PushPlatform)
  platform!: PushPlatform

  @IsString()
  tenantId!: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string

  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  body!: string

  @IsString()
  @IsOptional()
  sound?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  badge?: number

  @IsObject()
  @IsOptional()
  extra?: Record<string, unknown>

  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}

export class UpdatePushTemplateDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  body?: string

  @IsString()
  @IsOptional()
  sound?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  badge?: number

  @IsObject()
  @IsOptional()
  extra?: Record<string, unknown>

  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}

export class SendWSMessageDto {
  @IsString()
  clientId!: string

  @IsString()
  channel!: string

  data!: unknown
}

export class BroadcastMessageDto {
  @IsString()
  channel!: string

  data!: unknown
}

export class PushQueryDto {
  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  tenantId?: string

  @IsEnum(PushPlatform)
  @IsOptional()
  platform?: PushPlatform

  @IsDateString()
  @IsOptional()
  from?: string

  @IsDateString()
  @IsOptional()
  to?: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number
}
