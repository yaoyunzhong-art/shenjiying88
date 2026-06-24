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

  async decideApproval(input: GovernanceApprovalDecisionInput): Promise<GovernanceApprovalSnapshot> {
    return decideGovernanceApproval(this.prisma, input)
  }

  async cancelApproval(input: GovernanceApprovalCancelInput): Promise<GovernanceApprovalSnapshot> {
    return cancelGovernanceApproval(this.prisma, input)
  }

  async resubmitApproval(input: GovernanceApprovalResubmitInput): Promise<ReturnType<typeof resubmitGovernanceApproval>> {
    return resubmitGovernanceApproval(this.prisma, input)
  }

  async markExecuted(input: GovernanceApprovalExecutionInput): Promise<GovernanceApprovalSnapshot> {
    return markGovernanceApprovalExecuted(this.prisma, input)
  }

  async markExecutionFailed(input: GovernanceApprovalExecutionFailureInput): Promise<GovernanceApprovalSnapshot> {
    return markGovernanceApprovalExecutionFailed(this.prisma, input)
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
