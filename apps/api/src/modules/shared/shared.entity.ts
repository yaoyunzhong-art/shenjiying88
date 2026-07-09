/**
 * shared.entity.ts - Phase-34
 * 用途: 共享模块实体定义 (审计日志, 租户校验状态, 跨租户访问事件)
 * 关联: audit.service.ts, tenant-validator.ts
 */

// ============ 跨模块合约补全 ============

/** 分页结果合约实体 (跨模块安全子集) */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** API 响应合约实体 (跨模块安全子集) */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
  timestamp: string
}

/** 排序方向 (跨模块合约) */
export type SortDirection = 'asc' | 'desc'

// ============ 原始定义 ============

/**
 * 审计操作类型
 */
export type AuditAction =
  | 'cross_tenant_access_attempt'
  | 'missing_tenant_id'
  | 'invalid_tenant'
  | 'rls_policy_violation'
  | 'config_read'
  | 'config_write'
  | 'session_read'
  | 'evaluation_read'

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  id: number
  occurredAt: string
  actor: string
  tenantId: string
  resource: string
  action: AuditAction
  metadata?: Record<string, unknown>
}

/**
 * 租户校验结果
 */
export interface TenantValidationResult {
  valid: boolean
  tenantId: string
  error?: string
}

/**
 * 共享模块健康状态
 */
export interface SharedModuleHealth {
  status: 'healthy' | 'degraded'
  uptimeMs: number
  auditLogCount: number
  version: string
}

/**
 * 跨租户访问事件 (对外暴露)
 */
export interface CrossTenantEvent {
  id: number
  occurredAt: string
  actor: string
  tenantId: string
  resource: string
  action: AuditAction
  metadata?: Record<string, unknown>
}
