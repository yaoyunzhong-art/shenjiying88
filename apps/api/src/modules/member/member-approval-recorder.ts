import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type {
  GovernanceApprovalOutcomeEvent,
  GovernanceApprovalOutcomeHook,
  GovernanceApprovalService
} from '../foundation/governance-approval/governance-approval.service'
import { PrismaService } from '../../prisma/prisma.service'

const RESOURCE_TYPE = 'member-profile'

/**
 * 会员审批结果回写器：把 governance approval service 的 outcome 事件
 * 落进 member-profile 专属 AuditLog，作为真实持久化的审批历史主链。
 *
 * 由 MemberModule 在 onModuleInit 时挂到 governance approval service 的钩子表，
 * 不在业务调用方手动触发，避免漏写。
 */
@Injectable()
export class MemberApprovalOutcomeRecorder implements OnModuleInit, OnModuleDestroy {
  private disconnect?: () => void

  constructor(
    private readonly prisma: PrismaService,
    private readonly governanceApprovalService: GovernanceApprovalService
  ) {}

  onModuleInit(): void {
    this.disconnect = this.governanceApprovalService.registerApprovalOutcomeHook(
      RESOURCE_TYPE,
      (event) => this.recordOutcome(event)
    )
  }

  onModuleDestroy(): void {
    this.disconnect?.()
    this.disconnect = undefined
  }

  /**
   * 暴露成方法以便单测和外部调用能直接验证，不依赖钩子触发链。
   */
  async recordOutcome(event: GovernanceApprovalOutcomeEvent): Promise<void> {
    if (event.resourceType !== RESOURCE_TYPE) {
      return
    }
    const auditLogModel = this.getAuditLogModel()
    if (!auditLogModel?.create) {
      return
    }
    const tenantId = event.tenantId ?? ''
    if (!tenantId) {
      return
    }
    const action = `member.approval.${event.stage.toLowerCase()}`
    const summary = this.buildOutcomeSummary(event)
    await auditLogModel.create({
      data: {
        tenantId,
        brandId: event.brandId ?? null,
        storeId: event.storeId ?? null,
        action,
        operatorId: this.resolveOperatorId(event),
        resourceType: RESOURCE_TYPE,
        resourceId: event.resourceKey,
        sourceChannel: 'governance-approval',
        purpose: 'member-approval-outcome',
        payload: this.buildPayload(event),
        beforeValue: this.buildBeforeValue(event),
        afterValue: this.buildAfterValue(event),
        metadata: {
          summary,
          stage: event.stage,
          previousStatus: event.previousStatus ?? null
        }
      }
    })
  }

  private getAuditLogModel(): { create?: (input: { data: Record<string, unknown> }) => Promise<unknown> } | null {
    const candidate = (this.prisma as unknown as {
      auditLog?: { create?: (input: { data: Record<string, unknown> }) => Promise<unknown> }
    }).auditLog
    if (candidate?.create) {
      return candidate
    }
    const fallback = (this.prisma as unknown as {
      auditlog?: { create?: (input: { data: Record<string, unknown> }) => Promise<unknown> }
    }).auditlog
    return fallback ?? null
  }

  private buildOutcomeSummary(event: GovernanceApprovalOutcomeEvent): string {
    const op = String(event.approval.operation ?? 'member.action')
    switch (event.stage) {
      case 'APPROVED':
        return `审批通过：${op}`
      case 'REJECTED':
        return `审批驳回：${op}`
      case 'CANCELLED':
        return `审批撤销：${op}`
      case 'EXECUTED':
        return `审批动作已执行：${op}`
      case 'EXECUTION_FAILED':
        return `审批动作执行失败：${op}`
      case 'RESUBMITTED':
        return `审批重新提交：${op}`
      case 'SUPERSEDED':
        return `审批已被替代：${op}`
      default:
        return `审批状态变化：${op}`
    }
  }

  private resolveOperatorId(event: GovernanceApprovalOutcomeEvent): string {
    if (event.stage === 'APPROVED' || event.stage === 'REJECTED') {
      return event.approval.decidedBy ?? event.approval.requestedBy ?? 'governance-approval'
    }
    if (event.stage === 'CANCELLED') {
      return event.approval.decidedBy ?? 'governance-approval'
    }
    if (event.stage === 'EXECUTED' || event.stage === 'EXECUTION_FAILED') {
      return event.approval.requestedBy ?? 'governance-approval'
    }
    return event.approval.requestedBy ?? 'governance-approval'
  }

  private buildPayload(event: GovernanceApprovalOutcomeEvent): Record<string, unknown> {
    return {
      stage: event.stage,
      approvalTicket: event.approval.ticket ?? null,
      approvalStatus: event.approval.status,
      operation: event.approval.operation,
      resourceKey: event.resourceKey,
      decisionNote: event.decisionNote ?? null,
      failureReason: event.failureReason ?? null,
      previousStatus: event.previousStatus ?? null,
      requestedBy: event.approval.requestedBy ?? null,
      summary: event.approval.summary ?? null
    }
  }

  private buildBeforeValue(event: GovernanceApprovalOutcomeEvent): Record<string, unknown> | undefined {
    if (!event.previousStatus) {
      return undefined
    }
    return {
      approvalStatus: event.previousStatus
    }
  }

  private buildAfterValue(event: GovernanceApprovalOutcomeEvent): Record<string, unknown> {
    return {
      approvalStatus: event.approval.status,
      stage: event.stage
    }
  }
}

export const MEMBER_APPROVAL_OUTCOME_RESOURCE_TYPE = RESOURCE_TYPE
export type MemberApprovalOutcomeHook = GovernanceApprovalOutcomeHook