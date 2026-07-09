/**
 * shared.service.ts
 * 共享模块主 Service — 统一封装审计日志、租户校验、跨租户安全访问
 * 关联: shared.controller.ts, audit.service.ts, view-model.service.ts, tenant-validator.ts
 */

import { Injectable, Logger } from '@nestjs/common'
import { AuditService, type AuditAction } from './audit.service'
import { assertTenantId } from './tenant-validator'
import type { AuditLogEntry, SharedModuleHealth } from './shared.entity'

@Injectable()
export class SharedService {
  private readonly logger = new Logger(SharedService.name)
  private readonly startedAt = Date.now()
  private readonly version = '1.0.0'

  constructor(private readonly auditService: AuditService) {}

  /**
   * 获取共享模块健康状态
   */
  getHealth(): SharedModuleHealth {
    return {
      status: 'healthy',
      uptimeMs: Date.now() - this.startedAt,
      auditLogCount: this.auditService.size(),
      version: this.version,
    }
  }

  /**
   * 查询审计日志（按租户 + 可选时间/动作过滤）
   */
  async getAuditLog(
    tenantId: string,
    options?: { since?: string; action?: string; limit?: number },
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    assertTenantId(tenantId)
    const since = options?.since ? new Date(options.since) : undefined
    const entries = await this.auditService.getAuditLog(tenantId, since)

    let filtered: AuditLogEntry[] = entries
    if (options?.action) {
      filtered = entries.filter((e) => e.action === options.action)
    }
    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit)
    }

    return { entries: filtered, total: filtered.length }
  }

  /**
   * 获取全部审计日志（管理员/超级租户专用）
   */
  async getAllAuditLog(): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const all = await this.auditService.getAllAuditLog()
    return { entries: all, total: all.length }
  }

  /**
   * 按 ID 查询单条审计日志
   */
  async getAuditEntry(id: number): Promise<{ found: boolean; entry?: AuditLogEntry }> {
    const all = await this.auditService.getAllAuditLog()
    const entry = all.find((e) => e.id === id)
    if (!entry) {
      return { found: false }
    }
    return { found: true, entry }
  }

  /**
   * 校验租户 ID 是否合法
   */
  validateTenant(tenantId: string): { valid: boolean; error?: string } {
    try {
      assertTenantId(tenantId)
      return { valid: true }
    } catch {
      return { valid: false, error: 'invalid_tenant_id' }
    }
  }

  /**
   * 获取共享模块版本信息
   */
  getVersion(): { version: string; startedAt: string } {
    return {
      version: this.version,
      startedAt: new Date(this.startedAt).toISOString(),
    }
  }

  /**
   * 记录审计事件（供其他模块/服务使用）
   */
  async recordAuditEvent(params: {
    actor: string
    tenantId: string
    resource: string
    action?: AuditAction
    metadata?: Record<string, unknown>
  }): Promise<void> {
    return this.auditService.logCrossTenantAttempt({
      actor: params.actor,
      tenantId: params.tenantId,
      resource: params.resource,
      action: params.action ?? ('cross_tenant_access_attempt' as AuditAction),
      metadata: params.metadata,
    })
  }
}
