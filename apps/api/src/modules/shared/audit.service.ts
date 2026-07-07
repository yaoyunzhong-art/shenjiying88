import { Injectable, Logger } from '@nestjs/common'

/**
 * Phase-34: 审计服务
 *
 * 用途: 记录跨租户访问尝试 / 缺失 tenantId / 异常访问模式
 *
 * 设计:
 * - 当前为 in-memory 实现 (Phase-34 in-memory RLS 模式)
 * - 生产环境应替换为 Postgres audit_log 表写入
 * - 异步 fire-and-forget, 不阻塞主流程
 * - 写入失败仅 warn, 不抛异常
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

export interface AuditEntry {
  id: number
  occurredAt: string
  actor: string
  tenantId: string
  resource: string
  action: AuditAction
  metadata?: Record<string, unknown>
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)
  private logs: AuditEntry[] = []
  private nextId = 1

  /**
   * 记录跨租户访问尝试
   */
  async logCrossTenantAttempt(params: {
    actor: string
    tenantId: string
    resource: string
    action?: AuditAction
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      this.logs.push({
        id: this.nextId++,
        occurredAt: new Date().toISOString(),
        actor: params.actor,
        tenantId: params.tenantId,
        resource: params.resource,
        action: params.action ?? 'cross_tenant_access_attempt',
        metadata: params.metadata
      })
    } catch (err) {
      this.logger.warn(`audit log write failed: ${err}`)
      // 不抛异常 — fire-and-forget
    }
  }

  /**
   * 查询审计日志
   */
  async getAuditLog(tenantId: string, since?: Date): Promise<AuditEntry[]> {
    const sinceTime = since?.getTime() ?? 0
    return this.logs.filter((l) => l.tenantId === tenantId && new Date(l.occurredAt).getTime() >= sinceTime)
  }

  /**
   * 获取全部日志 (无租户过滤, 供 super-admin 用 — Phase-44)
   */
  async getAllAuditLog(): Promise<AuditEntry[]> {
    return [...this.logs]
  }

  /** 获取日志条数 (供测试) */
  size(): number {
    return this.logs.length
  }

  /** 清空 (供测试) */
  clear(): void {
    this.logs = []
    this.nextId = 1
  }
}