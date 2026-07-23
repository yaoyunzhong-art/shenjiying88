/**
 * terminal.dto.ts — 排队终端 DTO
 *
 * WP-12B BS-0161~BS-0163 终端心跳/2FA/离线检测 DTO
 */

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { TerminalType } from './terminal.entity'

// ── BS-0161 终端心跳 ──

export class TerminalHeartbeatDto {
  @IsInt()
  @Min(0)
  @Max(30000)
  latencyMs!: number
}

// ── BS-0161 终端注册 ──

export class RegisterTerminalDto {
  @IsString()
  @MinLength(1)
  terminalId!: string

  @IsEnum(TerminalType)
  type!: TerminalType

  @IsString()
  @MinLength(1)
  name!: string
}

// ── BS-0162 终端绑定 ──

export class BindTerminalDto {
  @IsString()
  @MinLength(1)
  terminalId!: string

  @IsString()
  @MinLength(1)
  storeId!: string

  @IsString()
  @MinLength(1)
  operatorId!: string

  @IsString()
  @MinLength(1)
  @IsOptional()
  operatorName?: string
}

export class UnbindTerminalDto {
  @IsString()
  @MinLength(1)
  terminalId!: string
}

// ── BS-0163 离线配置 ──

export class OfflineConfigDto {
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  offlineThresholdMinutes?: number
}

// ── BS-0163 手动恢复 ──

export class RecoverTerminalDto {
  @IsString()
  @MinLength(1)
  terminalId!: string
}
