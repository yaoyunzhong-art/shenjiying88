import { ApprovalStatus, FoundationScopeType } from '@prisma/client'

/**
 * 治理审批状态枚举
 */
export type GovernanceApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUPERSEDED'

/**
 * 治理审批分组维度
 */
export type GovernanceApprovalGroupBy =
  | 'operation'
  | 'resourceType'
  | 'status'
  | 'executionStatus'
  | 'failureStatus'
  | 'requestedBy'

/**
 * 治理审批快照（统一查询/展示结构）
 */
export interface GovernanceApprovalSnapshot {
  approvalId: string | null
  operation?: string
  resourceType?: string
  resourceKey?: string
  required: boolean
  version: number | null
  requestedBy: string | null
  ticket: string | null
  status: GovernanceApprovalStatus
  submitted: boolean
  persisted: boolean
  decidedBy: string | null
  decidedAt: string | null
  updatedAt: string | null
  execution?: GovernanceApprovalExecution
  summary?: Record<string, unknown> | null
}

/**
 * 治理审批执行快照
 */
export interface GovernanceApprovalExecution {
  attempts: number
  executed: boolean
  executionStatus: string | null
  executedAt: string | null
  executedBy: string | null
  lastFailure: GovernanceApprovalExecutionFailure | null
}

/**
 * 治理审批执行失败信息
 */
export interface GovernanceApprovalExecutionFailure {
  failureStatus: string | null
  failureReason: string | null
  failedAt: string | null
  failedBy: string | null
}

/**
 * 审批物化输入
 */
export interface MaterializeGovernanceApprovalInput {
  operation: string
  resourceType: string
  resourceKey: string
  scopeType?: FoundationScopeType | keyof typeof FoundationScopeType
  tenantId?: string
  brandId?: string
  storeId?: string
  approvalRequired: boolean
  requestedBy?: string
  approvalTicket?: string
  approvalStatus?: GovernanceApprovalStatus
  requestPayload?: Record<string, unknown>
  summary?: Record<string, unknown>
}

/**
 * 审批查询输入
 */
export interface GovernanceApprovalQueryInput {
  limit?: number
  approvalTicket?: string
  operation?: string
  resourceType?: string
  resourceKey?: string
  requestedBy?: string
  decidedBy?: string
  status?: GovernanceApprovalStatus
  operationIn?: string[]
  resourceTypeIn?: string[]
  tenantId?: string
  from?: string
  to?: string
  executed?: boolean
  executionStatus?: string
  hasFailures?: boolean
  failureStatus?: string
  groupBy?: GovernanceApprovalGroupBy[]
}

/**
 * 审批决策输入
 */
export interface GovernanceApprovalDecisionInput {
  approvalTicket: string
  decidedBy: string
  decisionNote?: string
  summary?: Record<string, unknown>
  expectedVersion?: number
  status: 'APPROVED' | 'REJECTED'
}

/**
 * 审批取消输入
 */
export interface GovernanceApprovalCancelInput {
  approvalTicket: string
  cancelledBy: string
  cancelReason?: string
  expectedVersion?: number
}

/**
 * 审批重新提交输入
 */
export interface GovernanceApprovalResubmitInput {
  approvalTicket: string
  resubmittedBy: string
  resubmitReason?: string
  expectedVersion?: number
}

/**
 * 审批执行输入
 */
export interface GovernanceApprovalExecutionInput {
  approvalTicket: string
  executedBy: string
  executionStatus: string
  expectedVersion?: number
  summary?: Record<string, unknown>
}

/**
 * 审批执行失败输入
 */
export interface GovernanceApprovalExecutionFailureInput {
  approvalTicket: string
  failedBy: string
  failureStatus: string
  failureReason: string
  expectedVersion?: number
  summary?: Record<string, unknown>
}

/**
 * Prisma 存储的审批记录（内部类型）
 */
export interface GovernanceApprovalRecord {
  id: string
  approvalTicket: string | null
  operation: string
  resourceType: string
  resourceKey: string
  scopeType: FoundationScopeType
  tenantId: string | null
  brandId: string | null
  storeId: string | null
  required: boolean
  requestedBy: string | null
  status: ApprovalStatus
  version: number
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: Date | null
  summary: unknown
  createdAt: Date
  updatedAt: Date
}

/**
 * 审批统计指标
 */
export interface GovernanceApprovalMetrics {
  total: number
  statuses: Record<GovernanceApprovalStatus, number>
  execution: {
    executed: number
    pending: number
    withFailures: number
    byExecutionStatus: Record<string, number>
    byFailureStatus: Record<string, number>
  }
}

/**
 * 分组统计项
 */
export interface GovernanceApprovalGroupEntry {
  total: number
  statuses: Record<GovernanceApprovalStatus, number>
  execution: {
    executed: number
    pending: number
    withFailures: number
    byExecutionStatus: Record<string, number>
    byFailureStatus: Record<string, number>
  }
  dimensions: Record<string, string | null>
}
