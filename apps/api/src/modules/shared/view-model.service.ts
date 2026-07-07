import { Injectable, ForbiddenException } from '@nestjs/common'
import { AgentService } from '../agent/agent.service'
import { EventStoreService } from '../agent/event-store.service'
import { EventBufferService } from '../agent/event-buffer.service'
import { AuditService } from './audit.service'
import { assertTenantId, isCrossTenant } from './tenant-validator'
import type { AgentConfig, AgentSession, QualityEvaluation } from '../agent/agent.entity'
import type { BufferedEvent } from '../agent/event-buffer.service'

/**
 * Phase-34: ViewModelService - 统一跨表数据访问入口
 *
 * 三层防御的中间层:
 *   1. tenantId 必填校验 (assertTenantId)
 *   2. 跨租户检测 (isCrossTenant) + 审计 + 403
 *   3. 调用底层 service / EventStore / EventBuffer
 *
 * 所有 controller 路由必须通过此 service 读取数据, 禁止直接调 AgentService
 * 这样保证: 任何读操作都强制带 tenantId, 任何遗漏都会被审计
 */
@Injectable()
export class ViewModelService {
  constructor(
    private readonly agentService: AgentService,
    private readonly eventStore: EventStoreService,
    private readonly eventBuffer: EventBufferService,
    private readonly audit: AuditService
  ) {}

  // ── AgentConfig ──

  async getAgentConfig(id: string, tenantId: string): Promise<AgentConfig | null> {
    assertTenantId(tenantId)
    const config = this.agentService.getConfig(id)
    if (!config) return null
    if (isCrossTenant(config.tenantId, tenantId)) {
      await this.audit.logCrossTenantAttempt({
        actor: 'view-model-service',
        tenantId,
        resource: `agent_configs:${id}`,
        metadata: { actualTenant: config.tenantId }
      })
      throw new ForbiddenException({
        error: 'cross_tenant_access_denied',
        message: `AgentConfig ${id} belongs to a different tenant`
      })
    }
    return config
  }

  async listAgentConfigs(tenantId: string): Promise<AgentConfig[]> {
    assertTenantId(tenantId)
    return this.agentService.getConfigs(tenantId)
  }

  // ── AgentSession ──

  async getSession(id: string, tenantId: string): Promise<AgentSession | null> {
    assertTenantId(tenantId)
    const session = this.agentService.getSession(id)
    if (!session) return null
    if (isCrossTenant(session.tenantId, tenantId)) {
      await this.audit.logCrossTenantAttempt({
        actor: 'view-model-service',
        tenantId,
        resource: `agent_sessions:${id}`,
        metadata: { actualTenant: session.tenantId }
      })
      throw new ForbiddenException({
        error: 'cross_tenant_access_denied',
        message: `AgentSession ${id} belongs to a different tenant`
      })
    }
    return session
  }

  async listSessions(tenantId: string): Promise<AgentSession[]> {
    assertTenantId(tenantId)
    return this.agentService.getSessions(tenantId)
  }

  // ── Session Events (Phase-32/33) ──

  /**
   * 获取 session 事件历史 (Phase-33 EventStore 集成)
   */
  async getSessionHistory(sessionId: string, tenantId: string): Promise<BufferedEvent[]> {
    assertTenantId(tenantId)
    // 先校验 session 属于当前 tenant
    const session = await this.getSession(sessionId, tenantId)
    if (!session) return []
    return this.eventStore.getSessionHistory(sessionId, 1000, tenantId)
  }

  /**
   * 断连 replay (Phase-32 EventBuffer + Phase-33 EventStore 优先)
   */
  async replaySessionEvents(
    sessionId: string,
    lastEventId: number | string,
    tenantId: string
  ): Promise<{ events: BufferedEvent[]; lastValidId: number; found: boolean }> {
    assertTenantId(tenantId)
    // 先校验 session 属于当前 tenant
    const session = await this.getSession(sessionId, tenantId)
    if (!session) {
      throw new ForbiddenException({
        error: 'cross_tenant_access_denied',
        message: `Session ${sessionId} not accessible`
      })
    }
    return this.eventBuffer.replayAfterAsync(sessionId, lastEventId, tenantId)
  }

  // ── QualityEvaluation ──

  async getEvaluation(id: string, tenantId: string): Promise<QualityEvaluation | null> {
    assertTenantId(tenantId)
    const evals = this.agentService.getEvaluations(tenantId)
    return evals.find((e) => e.id === id) ?? null
  }

  async listEvaluations(tenantId: string): Promise<QualityEvaluation[]> {
    assertTenantId(tenantId)
    return this.agentService.getEvaluations(tenantId)
  }

  // ── Stats ──

  async getStats(tenantId: string) {
    assertTenantId(tenantId)
    return this.agentService.getStats(tenantId)
  }

  // ── Audit ──

  async getAuditLog(tenantId: string, since?: Date) {
    assertTenantId(tenantId)
    return this.audit.getAuditLog(tenantId, since)
  }
}