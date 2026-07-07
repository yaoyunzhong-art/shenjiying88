// auto-rollback.dto.ts - Phase-19 T27
// 用途: 自动回滚 DTO 定义
import { IsString, IsNumber, IsOptional, IsArray, IsEnum, Min, Max, IsBoolean, ValidateNested, IsNotEmpty, IsNumberString } from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'
import type { RollbackStatus, RollbackSeverity, SnapshotKind } from './auto-rollback.entity'

export class TriggerRollbackRequestDto {
  @IsString()
  @IsNotEmpty()
  reason!: string

  @IsString()
  @IsEnum(['WARNING', 'CRITICAL'])
  severity!: RollbackSeverity

  @IsString()
  @IsNotEmpty()
  metricKey!: string

  @IsNumber()
  anomalyValue!: number

  @IsNumber()
  baselineValue!: number

  @IsOptional()
  @IsString()
  @IsEnum(['DB', 'REDIS', 'CONFIG', 'FULL'])
  snapshotKind?: SnapshotKind

  @IsOptional()
  @IsString()
  trigger?: string
}

export class ConfirmRollbackRequestDto {
  @IsString()
  @IsNotEmpty()
  id!: string
}

export class CancelRollbackRequestDto {
  @IsString()
  @IsNotEmpty()
  id!: string

  @IsOptional()
  @IsString()
  reason?: string
}

export class ListRecordsQueryDto {
  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  metricKey?: string
}

export class ConfigureRequestDto {
  @IsOptional()
  @IsBoolean()
  criticalRequiresConfirm?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(300000)
  confirmationDelayMs?: number

  @IsOptional()
  @IsNumber()
  @Min(10000)
  @Max(1800000)
  autoTimeoutMs?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxConcurrent?: number

  @IsOptional()
  @IsNumber()
  @Min(3600000)
  @Max(2592000000)
  snapshotRetentionMs?: number
}

export class RollbackRecordDto {
  @IsString()
  id!: string

  @IsString()
  reason!: string

  @IsString()
  severity!: RollbackSeverity

  @IsString()
  metricKey!: string

  @IsNumber()
  anomalyValue!: number

  @IsNumber()
  baselineValue!: number

  @IsString()
  status!: RollbackStatus

  @IsOptional()
  @IsString()
  snapshotId?: string

  @IsBoolean()
  requiresConfirmation!: boolean

  @IsNumber()
  confirmationDelayMs!: number

  @IsArray()
  history!: Array<{ status: RollbackStatus; timestamp: string; note?: string }>

  @IsString()
  createdAt!: string

  @IsOptional()
  @IsString()
  completedAt?: string
}

export class SnapshotDto {
  @IsString()
  id!: string

  @IsString()
  kind!: SnapshotKind

  @IsNumber()
  size!: number

  @IsString()
  createdAt!: string

  @IsString()
  trigger!: string
}

export class EngineStatusDto {
  @IsString()
  engineName!: string

  @IsNumber()
  activeRecords!: number

  @IsString()
  status!: 'ACTIVE' | 'DEGRADED' | 'STOPPED'

  @IsOptional()
  @IsString()
  lastEvaluationAt?: string
}

/** DTO 转换 helper */
export function toRollbackRecordDto(record: {
  id: string
  reason: string
  severity: RollbackSeverity
  metricKey: string
  anomalyValue: number
  baselineValue: number
  status: RollbackStatus
  snapshotId?: string
  requiresConfirmation: boolean
  confirmationDelayMs: number
  history: Array<{ status: RollbackStatus; timestamp: string; note?: string }>
  createdAt: string
  completedAt?: string
}): RollbackRecordDto {
  return { ...record }
}

export function toSnapshotDto(snapshot: {
  id: string
  kind: SnapshotKind
  size: number
  createdAt: string
  trigger: string
}): SnapshotDto {
  return {
    id: snapshot.id,
    kind: snapshot.kind,
    size: snapshot.size,
    createdAt: snapshot.createdAt,
    trigger: snapshot.trigger,
  }
}

export function toEngineStatusDto(status: {
  engineName: string
  activeRecords: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  lastEvaluationAt?: string
}): EngineStatusDto {
  return { ...status }
}
