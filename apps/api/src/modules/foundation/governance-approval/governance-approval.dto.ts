import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import 'reflect-metadata'

/**
 * 治理审批物化 DTO
 */
export class MaterializeGovernanceApprovalDto {
  @IsString()
  @IsNotEmpty()
  operation!: string

  @IsString()
  @IsNotEmpty()
  resourceType!: string

  @IsString()
  @IsNotEmpty()
  resourceKey!: string

  @IsString()
  @IsOptional()
  scopeType?: string

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
  requestedBy?: string

  @IsString()
  @IsOptional()
  approvalTicket?: string

  @IsString()
  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'SUPERSEDED'])
  approvalStatus?: string
}

/**
 * 审批查询 DTO
 */
export class GovernanceApprovalQueryDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number

  @IsString()
  @IsOptional()
  approvalTicket?: string

  @IsString()
  @IsOptional()
  operation?: string

  @IsString()
  @IsOptional()
  resourceType?: string

  @IsString()
  @IsOptional()
  resourceKey?: string

  @IsString()
  @IsOptional()
  requestedBy?: string

  @IsString()
  @IsOptional()
  decidedBy?: string

  @IsString()
  @IsOptional()
  status?: string

  @IsString()
  @IsOptional()
  tenantId?: string

  @IsString()
  @IsOptional()
  from?: string

  @IsString()
  @IsOptional()
  to?: string

  @IsString()
  @IsOptional()
  executionStatus?: string

  @IsString()
  @IsOptional()
  failureStatus?: string
}

/**
 * 审批决策 DTO
 */
export class GovernanceApprovalDecisionDto {
  @IsString()
  @IsNotEmpty()
  approvalTicket!: string

  @IsString()
  @IsNotEmpty()
  decidedBy!: string

  @IsString()
  @IsOptional()
  decisionNote?: string

  @IsNumber()
  @IsOptional()
  expectedVersion?: number

  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  @IsNotEmpty()
  status!: 'APPROVED' | 'REJECTED'
}

/**
 * 审批取消 DTO
 */
export class GovernanceApprovalCancelDto {
  @IsString()
  @IsNotEmpty()
  approvalTicket!: string

  @IsString()
  @IsNotEmpty()
  cancelledBy!: string

  @IsString()
  @IsOptional()
  cancelReason?: string

  @IsNumber()
  @IsOptional()
  expectedVersion?: number
}

/**
 * 审批重新提交 DTO
 */
export class GovernanceApprovalResubmitDto {
  @IsString()
  @IsNotEmpty()
  approvalTicket!: string

  @IsString()
  @IsNotEmpty()
  resubmittedBy!: string

  @IsString()
  @IsOptional()
  resubmitReason?: string

  @IsNumber()
  @IsOptional()
  expectedVersion?: number
}

/**
 * 审批执行 DTO
 */
export class GovernanceApprovalExecutionDto {
  @IsString()
  @IsNotEmpty()
  approvalTicket!: string

  @IsString()
  @IsNotEmpty()
  executedBy!: string

  @IsString()
  @IsNotEmpty()
  executionStatus!: string

  @IsNumber()
  @IsOptional()
  expectedVersion?: number
}

/**
 * 审批执行失败 DTO
 */
export class GovernanceApprovalExecutionFailureDto {
  @IsString()
  @IsNotEmpty()
  approvalTicket!: string

  @IsString()
  @IsNotEmpty()
  failedBy!: string

  @IsString()
  @IsNotEmpty()
  failureStatus!: string

  @IsString()
  @IsNotEmpty()
  failureReason!: string

  @IsNumber()
  @IsOptional()
  expectedVersion?: number
}
