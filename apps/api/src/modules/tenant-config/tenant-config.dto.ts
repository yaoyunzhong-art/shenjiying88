/**
 * 三级独立配置 - DTO (V9 需求 4 · V10 Day 6 Phase 90)
 *
 * 使用 class-validator 校验 (与其他模块保持一致)
 */

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator'
import { Type } from 'class-transformer'
import { decryptField } from '../ai-model-config/encryption.util'
import type { ConfigCategory, ConfigLevel, ConfigInstance } from './tenant-config.entity'

export class GetConfigDto {
  @IsOptional()
  @IsEnum(['pos', 'print', 'member', 'marketing', 'inventory', 'integration', 'ai', 'compliance', 'billing', 'branding'])
  category?: ConfigCategory

  @IsOptional()
  @IsEnum(['store', 'tenant', 'brand'])
  level?: ConfigLevel

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(100)
  keys?: string[]
}

export class SetConfigItemDto {
  @IsString()
  key!: string

  @IsString()
  value!: string

  @IsOptional()
  @IsBoolean()
  inherits?: boolean
}

export class SetConfigBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SetConfigItemDto)
  items!: SetConfigItemDto[]
}

export class RollbackConfigDto {
  @IsString()
  configId!: string

  @IsNumber()
  targetVersion!: number
}

/**
 * 响应模型 (脱敏后)
 */
export interface ConfigResponse {
  id: string
  key: string
  /** 已脱敏的值 (secret 显示为 sk-***-xxxx) */
  value: string
  category: ConfigCategory
  level: ConfigLevel
  ownerId: string
  inherits: boolean
  version: number
  updatedBy: string
  updatedAt: string
  isMasked?: boolean
}

export interface EffectiveConfigResponse {
  key: string
  value: string
  sourceLevel: ConfigLevel
  inherited: boolean
  isMasked?: boolean
}

/**
 * 把 ConfigInstance 转换为响应 (脱敏)
 */
export function maskConfigResponse(
  cfg: ConfigInstance,
  sensitivity: 'public' | 'internal' | 'restricted' | 'secret',
): ConfigResponse {
  const isSecret = sensitivity === 'secret' || sensitivity === 'restricted'
  let displayValue = cfg.value
  if (isSecret && cfg.value) {
    let plain = cfg.value
    if (cfg.encrypted) {
      try {
        plain = decryptField(cfg.value)
      } catch {
        plain = cfg.value
      }
    }
    displayValue = `***-${plain.slice(-4)}`
  }
  return {
    id: cfg.id,
    key: cfg.key,
    value: displayValue,
    category: cfg.category,
    level: cfg.level,
    ownerId: cfg.ownerId,
    inherits: cfg.inherits,
    version: cfg.version,
    updatedBy: cfg.updatedBy,
    updatedAt: cfg.updatedAt,
    isMasked: isSecret,
  }
}
