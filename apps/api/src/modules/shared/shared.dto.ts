/**
 * shared.dto.ts - Phase-34
 * 用途: 共享模块 DTO (审计日志查询, 健康状态)
 * 关联: shared.controller.ts, shared.entity.ts
 */

/**
 * 审计日志查询 DTO
 */
export class AuditLogQueryDto {
  /** 租户 ID */
  tenantId!: string
  /** 起始时间 (ISO-8601) */
  since?: string
  /** 最大条数 */
  limit?: number
  /** 操作类型过滤 */
  action?: string
}

/**
 * 审计日志条目 DTO
 */
export class AuditLogEntryDto {
  id!: number
  occurredAt!: string
  actor!: string
  tenantId!: string
  resource!: string
  action!: string
  metadata?: Record<string, unknown>
}

/**
 * 审计日志响应 DTO
 */
export class AuditLogResponseDto {
  entries!: AuditLogEntryDto[]
  total!: number
}

/**
 * 共享模块健康状态 DTO
 */
export class SharedHealthDto {
  status!: 'healthy' | 'degraded'
  uptimeMs!: number
  auditLogCount!: number
  version!: string
}

/**
 * 租户校验请求 DTO
 */
export class ValidateTenantDto {
  tenantId!: string
}
