/**
 * 多系统对接 - DTO (V9 需求 3 · V10 Day 5 Phase 89)
 *
 * 使用 class-validator 做运行时入参校验
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsNumber,
  Min,
  Max,
  Matches,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

// ============ OAuth 认证 ============

export class AuthRequestDto {
  @IsString()
  @IsNotEmpty()
  client_id!: string

  @IsString()
  @IsNotEmpty()
  client_secret!: string

  @IsOptional()
  @IsString()
  scope?: string
}

export class VerifyTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  access_token!: string
}

// ============ 数据同步 ============

export class SyncPayloadDto<T = unknown> {
  @IsString()
  @IsNotEmpty()
  resourceType!: string

  @IsEnum(['create', 'update', 'delete'] as const)
  action!: 'create' | 'update' | 'delete'

  @IsNotEmpty()
  data!: T

  @IsString()
  @IsNotEmpty()
  businessKey!: string

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T/)
  timestamp!: string
}

export class SyncRequestDto {
  @ValidateNested()
  @Type(() => SyncPayloadDto)
  payload!: SyncPayloadDto
}

// ============ 指令下发 ============

export class CommandParamsDto {
  [key: string]: unknown
}

export class CommandPayloadDto {
  @IsString()
  @IsNotEmpty()
  commandType!: string

  @IsString()
  @IsNotEmpty()
  targetDeviceId!: string

  @IsObject()
  params!: Record<string, unknown>

  @IsEnum(['low', 'normal', 'high', 'urgent'] as const)
  priority!: 'low' | 'normal' | 'high' | 'urgent'

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(30000)
  expectedResponseMs?: number
}

export class CommandRequestDto {
  @ValidateNested()
  @Type(() => CommandPayloadDto)
  command!: CommandPayloadDto
}

// ============ 客户端查询 ============

export class ListClientsQueryDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

// ============ 错误响应 ============

export class ErrorResponseDto {
  @IsString()
  error!: string

  @IsString()
  errorDescription!: string
}

// ============ Token 响应 ============

export class TokenResponseDto {
  @IsString()
  accessToken!: string

  @IsEnum(['Bearer'] as const)
  tokenType!: 'Bearer'

  @IsNumber()
  @Min(1)
  expiresIn!: number

  @IsArray()
  @IsString({ each: true })
  scope!: string[]

  @IsString()
  jti!: string

  @IsString()
  issuedAt!: string
}

// ============ 指令执行记录响应 ============

export class CommandExecutionResponseDto {
  @IsString()
  id!: string

  @IsString()
  clientId!: string

  @IsString()
  commandType!: string

  @IsString()
  targetDeviceId!: string

  @IsObject()
  params!: Record<string, unknown>

  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority!: string

  @IsEnum(['pending', 'running', 'success', 'failed', 'timeout'])
  status!: string

  @IsOptional()
  @IsNumber()
  durationMs?: number

  @IsString()
  startedAt!: string

  @IsOptional()
  @IsString()
  completedAt?: string
}
