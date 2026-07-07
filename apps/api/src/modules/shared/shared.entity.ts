/**
 * shared.entity.ts - Phase-34
 * 用途: 共享模块实体定义 (审计日志, 租户校验状态, 跨租户访问事件)
 * 关联: audit.service.ts, tenant-validator.ts
 */

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
