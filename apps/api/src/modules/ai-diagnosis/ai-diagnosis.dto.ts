import { IsArray, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator'
import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity'

// ── 创建诊断请求 ──

export class CreateDiagnosisDto {
  @IsString()
  @MinLength(1)
  engineId!: string

  @IsString()
  @MinLength(1)
  scenarioId!: string

  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  requestedBy!: string

  @IsOptional()
  @IsString()
  promptSummary?: string

  @IsOptional()
  inputSnapshot?: Record<string, unknown>
}

// ── 批量诊断请求 ──

export class CreateDiagnosisBatchDto {
  @IsString()
  @MinLength(1)
  engineId!: string

  @IsArray()
  @IsString({ each: true })
  scenarioIds!: string[]

  @IsString()
  @MinLength(1)
  tenantId!: string

  @IsString()
  @MinLength(1)
  triggeredBy!: string
}

// ── 诊断状态更新 ──

export class UpdateDiagnosisDto {
  @IsOptional()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'])
  status?: DiagnosisEntity['status']

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  riskLevel?: DiagnosisEntity['riskLevel']

  @IsOptional()
  @IsString()
  recommendation?: string
}

// ── 诊断查询过滤 ──

export class DiagnosisQueryDto {
  @IsOptional()
  @IsString()
  engineId?: string

  @IsOptional()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'])
  status?: DiagnosisEntity['status']

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  riskLevel?: DiagnosisEntity['riskLevel']

  @IsOptional()
  @IsString()
  tenantId?: string
}

// ── 响应类型 ──

export interface DiagnosisResponse {
  diagnosis: DiagnosisEntity
}

export interface DiagnosisListResponse {
  diagnoses: DiagnosisEntity[]
  total: number
}

export interface DiagnosisBatchResponse {
  batch: DiagnosisBatch
}

export interface DiagnosisRiskReportResponse {
  generatedAt: string
  totalEvaluated: number
  riskDistribution: { low: number; medium: number; high: number; critical: number }
  topRecommendations: Array<{ diagnosisId: string; riskLevel: string; recommendation: string }>
  averageEvaluationDurationMs: number
}
