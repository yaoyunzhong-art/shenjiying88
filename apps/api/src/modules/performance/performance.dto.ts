import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import type {
  CacheTier,
  EvictionPolicy,
  LoadPattern,
  MetricSource,
  ScalingAction,
  DeploymentStatus,
  QueryType,
  IndexType,
} from './performance.entity'

// ───── 缓存相关 ────────────────────────────────────────────────────

export class TierConfigDto {
  @IsInt()
  @Min(1024)
  maxBytes!: number

  @IsString()
  @IsEnum(['lru', 'lfu', 'fifo', 'ttl'] as EvictionPolicy[])
  evictionPolicy!: EvictionPolicy

  @IsInt()
  @Min(0)
  ttlMs!: number

  @IsOptional()
  @IsString()
  host?: string
}

export class MultiLevelConfigDto {
  @ValidateNested()
  @Type(() => TierConfigDto)
  l1!: TierConfigDto

  @ValidateNested()
  @Type(() => TierConfigDto)
  l2!: TierConfigDto

  @ValidateNested()
  @Type(() => TierConfigDto)
  l3!: TierConfigDto

  @IsBoolean()
  readThrough!: boolean

  @IsBoolean()
  writeThrough!: boolean

  @IsBoolean()
  prefetchEnabled!: boolean
}

export class SetCacheDto {
  @IsString()
  @IsNotEmpty()
  key!: string

  @IsNotEmpty()
  value!: unknown

  @IsOptional()
  @IsInt()
  @Min(0)
  ttlMs?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

export class MSetCacheDto {
  @ValidateNested({ each: true })
  @Type(() => SetCacheDto)
  @IsArray()
  @ArrayMinSize(1)
  entries!: SetCacheDto[]
}

export class MGetCacheDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  keys!: string[]
}

export class CacheTagDeleteDto {
  @IsString()
  @IsNotEmpty()
  tag!: string
}

export class CacheWarmDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  keys!: string[]
}

export class CacheFlushDto {
  @IsOptional()
  @IsString()
  @IsEnum(['l1', 'l2', 'l3'] as CacheTier[])
  tier?: CacheTier
}

// ───── 数据库优化相关 ──────────────────────────────────────────────

export class AnalyzeQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  query!: string
}

export class AnalyzeQueriesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  queries!: string[]
}

export class RecommendIndexesDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  queries!: string[]

  @IsNotEmpty()
  tableStats!: Record<string, { rowCount: number; columnCardinality: Record<string, number> }>
}

export class InitPoolDto {
  @IsInt()
  @Min(1)
  minConnections!: number

  @IsInt()
  @Min(1)
  maxConnections!: number

  @IsInt()
  @Min(0)
  acquireTimeout!: number

  @IsInt()
  @Min(0)
  idleTimeout!: number

  @IsInt()
  @Min(0)
  connectionTimeout!: number

  @IsInt()
  @Min(0)
  healthCheckInterval!: number
}

export class CacheResultDto {
  @IsString()
  @IsNotEmpty()
  key!: string

  @IsNotEmpty()
  result!: unknown

  @IsInt()
  @Min(0)
  ttlSeconds!: number
}

// ───── 压测相关 ────────────────────────────────────────────────────

export class LoadTestConfigDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsInt()
  @Min(1)
  vu!: number

  @IsInt()
  @Min(1)
  @Max(3600)
  duration!: number

  @IsString()
  @IsEnum(['constant', 'ramp', 'peak', 'stress', 'spike'] as LoadPattern[])
  pattern!: LoadPattern

  @IsOptional()
  @IsInt()
  @Min(1)
  targetRPS?: number

  @IsOptional()
  @IsArray()
  stages?: { duration: number; vu: number }[]
}

export class LoadTestEndpointDto {
  @IsString()
  @IsNotEmpty()
  url!: string

  @IsString()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  method!: 'GET' | 'POST' | 'PUT' | 'DELETE'

  @IsNumber()
  @Min(0)
  weight!: number
}

export class RunLoadTestDto {
  @ValidateNested()
  @Type(() => LoadTestConfigDto)
  config!: LoadTestConfigDto

  @ValidateNested({ each: true })
  @Type(() => LoadTestEndpointDto)
  @IsArray()
  @ArrayMinSize(1)
  endpoints!: LoadTestEndpointDto[]
}

export class RampTestDto {
  @ValidateNested()
  @Type(() => LoadTestConfigDto)
  config!: LoadTestConfigDto

  @IsArray()
  @ArrayMinSize(1)
  stages!: { duration: number; vu: number }[]
}

// ───── 弹性伸缩相关 ───────────────────────────────────────────────

export class CreateHPAPolicyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @IsString()
  @IsEnum(['cpu', 'memory', 'requests_per_second', 'latency', 'custom'] as MetricSource[])
  metric!: MetricSource

  @IsInt()
  @Min(0)
  targetValue!: number

  @IsInt()
  @Min(1)
  @Max(100)
  targetPercent!: number

  @IsInt()
  @Min(1)
  minReplicas!: number

  @IsInt()
  @Min(1)
  maxReplicas!: number

  @IsInt()
  @Min(0)
  stabilizationWindowSeconds!: number

  @IsInt()
  @Min(0)
  cooldownSeconds!: number

  @IsBoolean()
  enabled!: boolean
}

export class UpdateHPAPolicyDto {
  @IsOptional()
  @IsString()
  @IsEnum(['cpu', 'memory', 'requests_per_second', 'latency', 'custom'] as MetricSource[])
  metric?: MetricSource

  @IsOptional()
  @IsInt()
  @Min(0)
  targetValue?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetPercent?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  minReplicas?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  maxReplicas?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stabilizationWindowSeconds?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  cooldownSeconds?: number

  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

export class ScaleDeploymentDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsInt()
  @Min(0)
  targetReplicas!: number
}

export class AutoScaleDto {
  @IsString()
  @IsNotEmpty()
  name!: string
}

export class DeploymentRecommendReplicasDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsInt()
  @Min(1)
  windowMinutes?: number
}
