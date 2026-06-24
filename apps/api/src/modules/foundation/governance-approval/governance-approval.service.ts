import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import {
  cancelGovernanceApproval,
  decideGovernanceApproval,
  getGovernanceApprovalByTicket,
  GovernanceApprovalCancelInput,
  GovernanceApprovalDecisionInput,
  GovernanceApprovalExecutionFailureInput,
  GovernanceApprovalExecutionInput,
  GovernanceApprovalQueryInput,
  GovernanceApprovalResubmitInput,
  GovernanceApprovalSnapshot,
  listGovernanceApprovals,
  markGovernanceApprovalExecuted,
  markGovernanceApprovalExecutionFailed,
  MaterializeGovernanceApprovalInput,
  materializeGovernanceApproval,
  resubmitGovernanceApproval,
  summarizeGovernanceApprovals
} from './governance-approval'

// --------------- 审批结果事件钩子 ---------------
export interface GovernanceApprovalOutcomeEvent {
  resourceType: string
  resourceKey: string
  tenantId?: string
  brandId?: string
  storeId?: string
  stage: string
  previousStatus?: string | null
  decisionNote?: string | null
  failureReason?: string | null
  approval: GovernanceApprovalSnapshot
}

export type GovernanceApprovalOutcomeHook = (
  event: GovernanceApprovalOutcomeEvent
) => Promise<void> | void

@Injectable()
export class GovernanceApprovalService implements OnModuleDestroy {
  constructor(private readonly prisma: PrismaService) {}

  async listApprovals(query: GovernanceApprovalQueryInput): Promise<GovernanceApprovalSnapshot[]> {
    return listGovernanceApprovals(this.prisma, query)
  }

  async summarizeApprovals(query: GovernanceApprovalQueryInput): Promise<ReturnType<typeof summarizeGovernanceApprovals>> {
    return summarizeGovernanceApprovals(this.prisma, query)
  }

  async getApproval(ticket: string): Promise<GovernanceApprovalSnapshot> {
    return getGovernanceApprovalByTicket(this.prisma, ticket)
  }

  async materializeApproval(input: MaterializeGovernanceApprovalInput): Promise<GovernanceApprovalSnapshot> {
    return materializeGovernanceApproval(this.prisma, input)
  }

  // 从原始数据库记录获取层级上下文
  private async getApprovalScope(
    approvalTicket: string
  ): Promise<{ tenantId?: string; brandId?: string; storeId?: string }> {
    try {
      const record = await (this.prisma as any).governanceApproval?.findUnique({
        where: { approvalTicket }
      })
      if (record && typeof record === 'object') {
        return {
          tenantId: (record as any).tenantId ?? undefined,
          brandId: (record as any).brandId ?? undefined,
          storeId: (record as any).storeId ?? undefined
        }
      }
    } catch {
      // 不回退
    }
    return {}
  }

  async decideApproval(input: GovernanceApprovalDecisionInput): Promise<GovernanceApprovalSnapshot> {
    // 获取当前状态（emit 需要 previousStatus）
    const before = await getGovernanceApprovalByTicket(this.prisma, input.approvalTicket)
    const scope = await this.getApprovalScope(input.approvalTicket)
    const result = await decideGovernanceApproval(this.prisma, input)
    await this.emitOutcomeEvent({
      resourceType: before.resourceType ?? 'unknown',
      resourceKey: before.resourceKey ?? 'unknown',
      ...scope,
      stage: input.status,
      previousStatus: before.status,
      decisionNote: input.decisionNote ?? null,
      approval: result
    })
    return result
  }

  async cancelApproval(input: GovernanceApprovalCancelInput): Promise<GovernanceApprovalSnapshot> {
    const before = await getGovernanceApprovalByTicket(this.prisma, input.approvalTicket)
    const scope = await this.getApprovalScope(input.approvalTicket)
    const result = await cancelGovernanceApproval(this.prisma, input)
    await this.emitOutcomeEvent({
      resourceType: before.resourceType ?? 'unknown',
      resourceKey: before.resourceKey ?? 'unknown',
      ...scope,
      stage: 'CANCELLED',
      previousStatus: before.status,
      decisionNote: input.cancelReason ?? null,
      approval: result
    })
    return result
  }

  async resubmitApproval(input: GovernanceApprovalResubmitInput): Promise<ReturnType<typeof resubmitGovernanceApproval>> {
    const before = await getGovernanceApprovalByTicket(this.prisma, input.approvalTicket)
    const scope = await this.getApprovalScope(input.approvalTicket)
    const result = await resubmitGovernanceApproval(this.prisma, input)
    // 发出 SUPERSEDED 事件（原票据被替代）
    await this.emitOutcomeEvent({
      resourceType: before.resourceType ?? 'unknown',
      resourceKey: before.resourceKey ?? 'unknown',
      ...scope,
      stage: 'SUPERSEDED',
      previousStatus: before.status,
      decisionNote: input.resubmitReason ?? null,
      approval: {
        ...before,
        ticket: input.approvalTicket,
        status: 'SUPERSEDED'
      }
    })
    return result
  }

  async markExecuted(input: GovernanceApprovalExecutionInput): Promise<GovernanceApprovalSnapshot> {
    const before = await getGovernanceApprovalByTicket(this.prisma, input.approvalTicket)
    const scope = await this.getApprovalScope(input.approvalTicket)
    const result = await markGovernanceApprovalExecuted(this.prisma, input)
    await this.emitOutcomeEvent({
      resourceType: before.resourceType ?? 'unknown',
      resourceKey: before.resourceKey ?? 'unknown',
      ...scope,
      stage: 'EXECUTED',
      previousStatus: before.status,
      approval: result
    })
    return result
  }

  async markExecutionFailed(input: GovernanceApprovalExecutionFailureInput): Promise<GovernanceApprovalSnapshot> {
    const before = await getGovernanceApprovalByTicket(this.prisma, input.approvalTicket)
    const scope = await this.getApprovalScope(input.approvalTicket)
    const result = await markGovernanceApprovalExecutionFailed(this.prisma, input)
    await this.emitOutcomeEvent({
      resourceType: before.resourceType ?? 'unknown',
      resourceKey: before.resourceKey ?? 'unknown',
      ...scope,
      stage: 'EXECUTION_FAILED',
      previousStatus: before.status,
      decisionNote: null,
      failureReason: input.failureReason ?? null,
      approval: result
    })
    return result
  }

  // --------------- outcome 钩子管理 ---------------

  private readonly outcomeHooks = new Map<string, GovernanceApprovalOutcomeHook[]>()

  /**
   * 注册 outcome 钩子，返回断开函数
   */
  registerApprovalOutcomeHook(
    resourceType: string,
    hook: GovernanceApprovalOutcomeHook
  ): () => void {
    const hooks = this.outcomeHooks.get(resourceType) ?? []
    hooks.push(hook)
    this.outcomeHooks.set(resourceType, hooks)
    return () => {
      const list = this.outcomeHooks.get(resourceType)
      if (list) {
        const idx = list.indexOf(hook)
        if (idx >= 0) list.splice(idx, 1)
      }
    }
  }

  /**
   * 触发 outcome 钩子（在审批决策/执行完成后由调用方调用）
   */
  async emitOutcomeEvent(event: GovernanceApprovalOutcomeEvent): Promise<void> {
    const hooks = this.outcomeHooks.get(event.resourceType) ?? []
    const globalHooks = this.outcomeHooks.get('*') ?? []
    await Promise.all([...hooks, ...globalHooks].map((h) => h(event)))
  }

  onModuleDestroy(): void {
    this.outcomeHooks.clear()
  }
}
