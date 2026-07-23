
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
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
  @IsNotEmpty()
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

// ═══════════════════════════════════════════════════════════════════
// WP-13B: C端便捷化 DTOs (BS-0164~BS-0167)
// ═══════════════════════════════════════════════════════════════════

export class UpdatePushPreferenceDto {
  @IsBoolean()
  @IsOptional()
  dndEnabled?: boolean

  @IsString()
  @IsOptional()
  dndStartTime?: string

  @IsString()
  @IsOptional()
  dndEndTime?: string

  @IsObject()
  @IsOptional()
  priorityEnabled?: Record<string, boolean>

  @IsBoolean()
  @IsOptional()
  marketingPushEnabled?: boolean

  @IsString()
  @IsOptional()
  preferredChannel?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fallbackChannels?: string[]
}

export class SetDndHoursDto {
  @IsBoolean()
  enabled!: boolean

  @IsString()
  startTime!: string

  @IsString()
  endTime!: string
}

export class SetPreferredChannelDto {
  @IsString()
  preferredChannel!: string

  @IsArray()
  @IsString({ each: true })
  fallbackChannels!: string[]
}

// ═══════════════════════════════════════════════════════════════════
// WP-13B: 效果回传 DTOs (BS-0185~BS-0188)
// ═══════════════════════════════════════════════════════════════════

export class RecordPushEventDto {
  @IsString()
  pushRecordId!: string

  @IsString()
  eventType!: string

  @IsString()
  memberId!: string

  @IsString()
  tenantId!: string

  @IsString()
  channel!: string

  @IsString()
  priority!: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}

export class PushHistoryQueryDto {
  @IsString()
  @IsOptional()
  memberId?: string

  @IsString()
  @IsOptional()
  tenantId?: string

  @IsString()
  @IsOptional()
  channel?: string

  @IsString()
  @IsOptional()
  priority?: string

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

export class DashboardQueryDto {
  @IsString()
  @IsOptional()
  startDate?: string

  @IsString()
  @IsOptional()
  endDate?: string
}
