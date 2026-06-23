import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString
} from 'class-validator'
import 'reflect-metadata'
import {
  FoundationScopeType,
  NotificationChannelType
} from './notification.entity'

export class RegisterNotificationTemplateDto {
  @IsString()
  code!: string

  @IsEnum(NotificationChannelType)
  channel!: NotificationChannelType

  @IsEnum(FoundationScopeType)
  scopeType!: FoundationScopeType

  @IsString()
  @IsOptional()
  tenantId?: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string

  @IsString()
  @IsOptional()
  marketCode?: string

  @IsString()
  locale!: string

  @IsString()
  @IsOptional()
  titleTemplate?: string

  @IsString()
  bodyTemplate!: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[]

  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}

export class SendNotificationDto {
  @IsString()
  @IsOptional()
  templateCode?: string

  @IsEnum(NotificationChannelType)
  channel!: NotificationChannelType

  @IsEnum(FoundationScopeType)
  scopeType!: FoundationScopeType

  @IsString()
  recipient!: string

  @IsObject()
  payload!: Record<string, unknown>

  @IsString()
  @IsOptional()
  tenantId?: string

  @IsString()
  @IsOptional()
  brandId?: string

  @IsString()
  @IsOptional()
  storeId?: string

  @IsISO8601()
  @IsOptional()
  scheduledAt?: string
}

export class UpdateNotificationTemplateDto {
  @IsString()
  @IsOptional()
  titleTemplate?: string

  @IsString()
  @IsOptional()
  bodyTemplate?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[]

  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}
