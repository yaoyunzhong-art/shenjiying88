import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
  MinLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import type {
  VulnerabilitySeverity,
  VulnerabilityCategory,
  WAFRuleAction,
  WAFConditionType,
  WAFConditionOperator,
} from './security.entity'

// ── 扫描目标 DTO ──

export class ScanTargetDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  endpoint!: string

  @IsString()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  method!: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parameters?: Record<string, string>
}

// ── 扫描请求 DTO ──

export class ScanRequestDto {
  @ValidateNested()
  @Type(() => ScanTargetDto)
  @IsNotEmpty()
  target!: ScanTargetDto
}

// ── 批量扫描请求 DTO ──

export class BatchScanRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScanTargetDto)
  @IsNotEmpty()
  targets!: ScanTargetDto[]
}

// ── 敏感数据检测 DTO ──

export class SensitiveDataCheckDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string

  @IsNotEmpty()
  response!: Record<string, unknown>
}

// ── JWT 弱密钥检测 DTO ──

export class JWTWeakSecretCheckDto {
  @IsString()
  @IsNotEmpty()
  token!: string

  @IsArray()
  @IsString({ each: true })
  secrets!: string[]
}

// ── IDOR 检测 DTO ──

export class IDORCheckDto {
  @IsString()
  @IsNotEmpty()
  endpoint!: string

  @IsString()
  @IsNotEmpty()
  resourceId!: string

  @IsString()
  @IsNotEmpty()
  attackerId!: string
}

// ── WAF 规则条件 DTO ──

export class WAFRuleConditionDto {
  @IsString()
  @IsEnum(['ip', 'path', 'header', 'body', 'rate'])
  type!: WAFConditionType

  @IsString()
  @IsEnum(['equals', 'contains', 'regex', 'gt', 'lt'])
  operator!: WAFConditionOperator

  @IsString()
  @IsNotEmpty()
  value!: string
}

// ── 创建 WAF 规则 DTO ──

export class CreateWAFRuleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string

  @ValidateNested()
  @Type(() => WAFRuleConditionDto)
  @IsNotEmpty()
  condition!: WAFRuleConditionDto

  @IsString()
  @IsEnum(['allow', 'block', 'challenge', 'log'])
  action!: WAFRuleAction

  @IsNumber()
  @Min(0)
  @Max(10000)
  priority!: number

  @IsBoolean()
  enabled!: boolean
}

// ── 更新 WAF 规则 DTO ──

export class UpdateWAFRuleDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => WAFRuleConditionDto)
  condition?: WAFRuleConditionDto

  @IsOptional()
  @IsString()
  @IsEnum(['allow', 'block', 'challenge', 'log'])
  action?: WAFRuleAction

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  priority?: number

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// ── 请求评估 DTO ──

export class EvaluateRequestDto {
  @IsOptional()
  @IsString()
  ip?: string

  @IsOptional()
  @IsString()
  path?: string

  @IsOptional()
  @IsString()
  method?: string

  @IsOptional()
  headers?: Record<string, string>

  @IsOptional()
  @IsString()
  body?: string
}
