/**
 * shared.controller.ts - Phase-34
 * 用途: 共享模块 REST API (健康检查, 审计日志查询, 租户校验)
 * 关联: audit.service.ts, tenant-validator.ts, view-model.service.ts
 */

import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { AuditService } from './audit.service'
import { assertTenantId } from './tenant-validator'
import { AuditLogQueryDto, ValidateTenantDto } from './shared.dto'
import type { AuditLogEntryDto, SharedHealthDto } from './shared.dto'

@Controller('shared')
export class SharedController {
  private readonly startedAt = Date.now()
  private readonly version = '1.0.0'

  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /shared/health
   * 共享模块健康检查
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth(): SharedHealthDto {
    return {
      status: 'healthy',
      uptimeMs: Date.now() - this.startedAt,
      auditLogCount: this.auditService.size(),
      version: this.version,
    }
  }

  /**
   * GET /shared/audit
   * 查询审计日志 (按租户)
   */
  @Get('audit')
  async getAuditLog(@Query() query: AuditLogQueryDto) {
    assertTenantId(query.tenantId)
    const since = query.since ? new Date(query.since) : undefined
    const entries = await this.auditService.getAuditLog(query.tenantId, since)

    let filtered = entries
    if (query.action) {
      filtered = entries.filter((e) => e.action === query.action)
    }
    if (query.limit && query.limit > 0) {
      filtered = filtered.slice(0, query.limit)
    }

    const dtos: AuditLogEntryDto[] = filtered.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      actor: e.actor,
      tenantId: e.tenantId,
      resource: e.resource,
      action: e.action,
      metadata: e.metadata,
    }))

    return { entries: dtos, total: entries.length }
  }

  /**
   * GET /shared/audit/all
   * 查询全部审计日志 (管理员)
   */
  @Get('audit/all')
  async getAllAuditLog() {
    const all = await this.auditService.getAllAuditLog()
    const dtos: AuditLogEntryDto[] = all.map((e) => ({
      id: e.id,
      occurredAt: e.occurredAt,
      actor: e.actor,
      tenantId: e.tenantId,
      resource: e.resource,
      action: e.action,
      metadata: e.metadata,
    }))
    return { entries: dtos, total: all.length }
  }

  /**
   * GET /shared/audit/:id
   * 查询单条审计日志
   */
  @Get('audit/:id')
  async getAuditEntry(@Param('id') id: string) {
    const entryId = Number(id)
    const all = await this.auditService.getAllAuditLog()
    const entry = all.find((e) => e.id === entryId)
    if (!entry) {
      return { found: false, message: `Audit entry not found: ${id}` }
    }
    return { found: true, entry }
  }

  /**
   * POST /shared/validate-tenant
   * 租户 ID 校验
   */
  @Post('validate-tenant')
  @HttpCode(HttpStatus.OK)
  validateTenant(@Body() dto: ValidateTenantDto) {
    try {
      assertTenantId(dto.tenantId)
      return { valid: true, tenantId: dto.tenantId }
    } catch {
      return { valid: false, tenantId: dto.tenantId, error: 'invalid_tenant_id' }
    }
  }

  /**
   * GET /shared/version
   * 获取共享模块版本
   */
  @Get('version')
  getVersion() {
    return { version: this.version, startedAt: new Date(this.startedAt).toISOString() }
  }
}
