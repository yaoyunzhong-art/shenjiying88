// gateway.dto.ts — Gateway API 网关 DTO 定义
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator'
import 'reflect-metadata'

export class AuthCheckDto {
  @IsString()
  @IsNotEmpty()
  apiKey!: string

  @IsString()
  @IsNotEmpty()
  path!: string

  @IsString()
  @IsNotEmpty()
  method!: string
}

export class RouteLookupDto {
  @IsString()
  @IsNotEmpty()
  path!: string

  @IsString()
  @IsNotEmpty()
  method!: string
}

export class QuotaSetDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string

  @IsString()
  @IsNotEmpty()
  endpoint!: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  refillRate?: number
}

export class QuotaQueryDto {
  @IsString()
  @IsNotEmpty()
  clientId!: string

  @IsOptional()
  @IsString()
  endpoint?: string
}

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  ownerId!: string

  @IsArray()
  @IsString({ each: true })
  scopes!: string[]
}

export class RevokeApiKeyDto {
  @IsString()
  @IsNotEmpty()
  keyId!: string
}

export class AnalyticsQueryDto {
  @IsOptional()
  @IsNumber()
  startTime?: number

  @IsOptional()
  @IsNumber()
  endTime?: number

  @IsOptional()
  @IsString()
  resolution?: '1m' | '5m' | '1h' | '1d'

  @IsOptional()
  @IsString()
  endpoint?: string

  @IsOptional()
  @IsString()
  clientId?: string
}
