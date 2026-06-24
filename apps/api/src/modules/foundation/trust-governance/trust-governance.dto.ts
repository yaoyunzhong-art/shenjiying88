import { Transform, Type } from 'class-transformer'
import { IsArray, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator'

export class AuditRecordDto {
  @IsString()
  eventType!: string

  @IsObject()
  details!: Record<string, unknown>

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  actorId?: string

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  riskLevel?: 'low' | 'medium' | 'high'
}

export class AuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  action?: string

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsString()
  requestId?: string

  @IsOptional()
  @IsString()
  actorId?: string

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  riskLevel?: 'low' | 'medium' | 'high'

  @IsOptional()
  @IsString()
  from?: string

  @IsOptional()
  @IsString()
  to?: string
}

export class ApprovalTimelineQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}

export class ApprovalQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsString()
  operation?: string

  @IsOptional()
  @IsString()
  resourceType?: string

  @IsOptional()
  @IsString()
  resourceKey?: string

  @IsOptional()
  @IsString()
  requestedBy?: string

  @IsOptional()
  @IsString()
  decidedBy?: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  from?: string

  @IsOptional()
  @IsString()
  to?: string

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  executed?: boolean

  @IsOptional()
  @IsString()
  executionStatus?: string

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  hasFailures?: boolean

  @IsOptional()
  @IsString()
  failureStatus?: string

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsIn(['operation', 'resourceType', 'status', 'executionStatus', 'failureStatus', 'requestedBy'], { each: true })
  groupBy?: Array<'operation' | 'resourceType' | 'status' | 'executionStatus' | 'failureStatus' | 'requestedBy'>
}

export class ApprovalDecisionDto {
  @IsString()
  decidedBy!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion?: number

  @IsOptional()
  @IsString()
  decisionNote?: string
}

export class ApprovalLifecycleDto {
  @IsString()
  operatorId!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion?: number

  @IsOptional()
  @IsString()
  reason?: string
}

export class RateLimitCheckDto {
  @IsString()
  scopeKey!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  windowSeconds!: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  blockSeconds?: number
}

export class RateLimitPolicyQueryDto {
  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  integrationAppId?: string
}

export class UpsertRateLimitPolicyDto {
  @IsString()
  code!: string

  @IsIn(['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET', 'PORTAL', 'USER', 'DEVICE', 'INTEGRATION'])
  scopeType!: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET' | 'PORTAL' | 'USER' | 'DEVICE' | 'INTEGRATION'

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  brandId?: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @IsString()
  integrationAppId?: string

  @IsIn(['MINUTE', 'HOUR', 'DAY', 'MONTH'])
  period!: 'MINUTE' | 'HOUR' | 'DAY' | 'MONTH'

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit!: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  burstLimit?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensionKeys?: string[]

  @IsOptional()
  @IsString()
  algorithm?: string

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>

  @IsOptional()
  @IsString()
  requestedBy?: string

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'])
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

export class QuotaLedgerQueryDto {
  @IsOptional()
  @IsString()
  policyCode?: string

  @IsOptional()
  @IsString()
  subjectKey?: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}

export class ResetQuotaLedgerDto {
  @IsOptional()
  @IsString()
  policyCode?: string

  @IsOptional()
  @IsString()
  ledgerId?: string

  @IsOptional()
  @IsString()
  subjectKey?: string

  @IsOptional()
  @IsBoolean()
  resetAllActive?: boolean

  @IsOptional()
  @IsString()
  requestedBy?: string

  @IsOptional()
  @IsString()
  approvalTicket?: string

  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'])
  approvalStatus?: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
}

export class MaskPiiDto {
  @IsObject()
  payload!: Record<string, unknown>
}

export class AiReviewDto {
  @IsString()
  modelCode!: string

  @IsString()
  tenantId!: string

  @IsString()
  purpose!: string

  @IsOptional()
  @IsString()
  prompt?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimatedTokens?: number
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value === 'true') {
      return true
    }
    if (value === 'false') {
      return false
    }
  }

  return value
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return value
}
