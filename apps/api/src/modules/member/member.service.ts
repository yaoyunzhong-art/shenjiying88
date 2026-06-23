import { randomBytes } from 'node:crypto'
import { Injectable, Optional } from '@nestjs/common'
import type { RuntimeGovernanceReceipt } from '@m5/types'
import { PrismaService } from '../../prisma/prisma.service'
import {
  materializeGovernanceApproval,
  type GovernanceApprovalSnapshot
} from '../foundation/governance-approval/governance-approval'
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service'
import type { RequestTenantContext } from '../tenant/tenant.types';
import {
  MemberLevel,
  MemberStatus,
  type MemberMutationApprovalResult,
  type MemberProfile,
  type MemberProfileMutationHistoryEntry,
  type MemberBootstrap,
  type MemberLoginResult,
  type MemberOperationsAction,
  type MemberOperationsExecutionReceipt,
  type MemberOperationsProfile,
  type MemberOperationsTask,
  type MemberAutomationTrigger,
  type LytMemberSnapshot,
  type MemberSession,
  computeMemberLevel,
  canUpgrade,
  MEMBER_LEVEL_THRESHOLDS,
  makeMemberBootstrap
} from './member.entity';

export type { MemberBootstrap } from './member.entity';
export { MemberLevel, MemberStatus, computeMemberLevel, canUpgrade, MEMBER_LEVEL_THRESHOLDS } from './member.entity';

/**
 * 内存会员存储（生产环境应替换为 Prisma/数据库）
 */
const memberStore = new Map<string, MemberProfile>();
const memberSessionStore = new Map<string, MemberSession>()
const lytMemberSnapshotStore = new Map<string, LytMemberSnapshot>()
const memberOperationsTaskStore = new Map<string, MemberOperationsTask>()
const memberOperationsExecutionStore = new Map<string, MemberOperationsExecutionReceipt>()
const memberMutationHistoryStore = new Map<string, MemberProfileMutationHistoryEntry[]>()

export function resetMemberServiceTestState() {
  memberStore.clear()
  memberSessionStore.clear()
  lytMemberSnapshotStore.clear()
  memberOperationsTaskStore.clear()
  memberOperationsExecutionStore.clear()
  memberMutationHistoryStore.clear()
}

@Injectable()
export class MemberService {
  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly runtimeGovernanceService?: RuntimeGovernanceService
  ) {}

  private getLytMemberSnapshotModel():
    | {
        findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
        findFirst?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
        findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
        upsert?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      }
    | undefined {
    const prisma = this.prisma as unknown as Record<string, unknown> | undefined
    const model = prisma?.lytMemberSnapshot
    if (!model || typeof model !== 'object') {
      return undefined
    }
    return model as {
      findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
      findFirst?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
      findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
      upsert?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    }
  }

  private getMemberOperationsTaskModel():
    | {
        findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
        findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
        create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
        update?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      }
    | undefined {
    const prisma = this.prisma as unknown as Record<string, unknown> | undefined
    const model = prisma?.memberOperationsTask
    if (!model || typeof model !== 'object') {
      return undefined
    }
    return model as {
      findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
      findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
      create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      update?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    }
  }

  private getMemberOperationsReceiptModel():
    | {
        findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
        findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
        create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
        update?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      }
    | undefined {
    const prisma = this.prisma as unknown as Record<string, unknown> | undefined
    const model = prisma?.memberOperationsExecutionReceipt
    if (!model || typeof model !== 'object') {
      return undefined
    }
    return model as {
      findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
      findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
      create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      update?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    }
  }

  private getAuditLogModel():
    | {
        create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
        findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
      }
    | undefined {
    const prisma = this.prisma as unknown as Record<string, unknown> | undefined
    const model = prisma?.auditLog
    if (!model || typeof model !== 'object') {
      return undefined
    }
    return model as {
      create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
    }
  }

  private getMemberProfileExtensionModel():
    | {
        findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
        upsert?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      }
    | undefined {
    const prisma = this.prisma as unknown as Record<string, unknown> | undefined
    const model = prisma?.memberProfileExtension
    if (!model || typeof model !== 'object') {
      return undefined
    }
    return model as {
      findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
      upsert?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    }
  }

  private getLytSnapshotCacheKey(tenantId: string, externalMemberId: string) {
    return `${tenantId}:${externalMemberId}`
  }

  private normalizeSnapshotString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const normalized = value.trim()
    return normalized.length ? normalized : undefined
  }

  private normalizeSnapshotNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim().length) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
    return fallback
  }

  private normalizeOptionalSnapshotBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
      return value
    }
    return undefined
  }

  private normalizeSnapshotDateString(value: unknown): string | undefined {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'string' && value.trim().length) {
      return value
    }
    return undefined
  }

  private parseMemberLevel(value: unknown): MemberLevel | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const normalized = value.trim().toUpperCase()
    return Object.values(MemberLevel).find((level) => level === normalized)
  }

  private parseMemberStatus(value: unknown): MemberStatus | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const normalized = value.trim().toUpperCase()
    return Object.values(MemberStatus).find((status) => status === normalized)
  }

  private levelRank(level: MemberLevel) {
    return Object.values(MemberLevel).indexOf(level)
  }

  private mapApprovalSnapshot(
    memberId: string,
    approval: GovernanceApprovalSnapshot,
    summary: string
  ): MemberMutationApprovalResult {
    return {
      memberId,
      applied: false,
      approvalRequired: true,
      approvalTicket: approval.ticket,
      approvalStatus: approval.status,
      operation: approval.operation ?? 'member.unknown',
      summary
    }
  }

  private async materializeMemberActionApproval(input: {
    memberId: string
    tenantContext: RequestTenantContext
    operation: string
    requestPayload: Record<string, unknown>
    summary: string
    approvalTicket?: string
  }): Promise<MemberMutationApprovalResult | null> {
    if (!this.prisma) {
      return null
    }
    const approval = await materializeGovernanceApproval(this.prisma, {
      operation: input.operation,
      resourceType: 'member-profile',
      resourceKey: input.memberId,
      approvalRequired: true,
      approvalTicket: input.approvalTicket,
      tenantId: input.tenantContext.tenantId,
      brandId: input.tenantContext.brandId,
      storeId: input.tenantContext.storeId,
      requestedBy: 'ops.admin-web',
      requestPayload: input.requestPayload,
      summary: {
        memberId: input.memberId,
        requestEndpoint: `/api/v1/members/persistent/${input.memberId}`,
        payloadSummary: input.summary,
        riskLevel: 'high'
      }
    })
    if (approval.status === 'APPROVED') {
      return null
    }
    return this.mapApprovalSnapshot(input.memberId, approval, input.summary)
  }

  private getMutationHistoryCacheKey(memberId: string, tenantId: string) {
    return `${tenantId}:${memberId}`
  }

  private buildMemberMutationSummary(
    action: MemberProfileMutationHistoryEntry['action'],
    payload: Record<string, unknown>
  ) {
    switch (action) {
      case 'profile-updated':
        return `基础资料已更新：昵称 ${String(payload.nickname ?? '—')}，手机号 ${String(payload.mobile ?? '—')}`
      case 'status-updated':
        return `会员状态已调整为 ${String(payload.status ?? 'UNKNOWN')}`
      case 'level-updated':
        return `会员等级已调整为 ${String(payload.level ?? 'UNKNOWN')}`
      case 'points-awarded':
        return `会员积分已增加 ${String(payload.points ?? 0)}`
      case 'points-rolled-back':
        return `会员积分已扣减 ${String(payload.points ?? 0)}`
      case 'payment-activity-recorded':
        return `已录入支付活动 ${String(payload.orderId ?? 'unknown-order')}，金额 ${String(payload.amount ?? 0)}`
      default:
        return `会员动作 ${action}`
    }
  }

  private async recordMemberMutationHistory(input: {
    memberId: string
    tenantContext: RequestTenantContext
    action: MemberProfileMutationHistoryEntry['action']
    payload?: Record<string, unknown>
    beforeValue?: Record<string, unknown>
    afterValue?: Record<string, unknown>
    sourceChannel?: string
    operatorId?: string
  }): Promise<MemberProfileMutationHistoryEntry> {
    const entry: MemberProfileMutationHistoryEntry = {
      historyId: `member-history-${randomBytes(6).toString('hex')}`,
      tenantContext: input.tenantContext,
      memberId: input.memberId,
      action: input.action,
      summary: this.buildMemberMutationSummary(input.action, input.payload ?? {}),
      sourceChannel: input.sourceChannel ?? 'member-admin',
      operatorId: input.operatorId ?? 'member-admin',
      payload: input.payload,
      beforeValue: input.beforeValue,
      afterValue: input.afterValue,
      createdAt: new Date().toISOString()
    }

    const auditLogModel = this.getAuditLogModel()
    if (auditLogModel?.create) {
      const persisted = await auditLogModel.create({
        data: {
          tenantId: input.tenantContext.tenantId,
          brandId: input.tenantContext.brandId,
          storeId: input.tenantContext.storeId,
          action: `member.profile.${input.action}`,
          operatorId: entry.operatorId,
          resourceType: 'member-profile',
          resourceId: input.memberId,
          sourceChannel: entry.sourceChannel,
          purpose: 'member-profile-mutation',
          payload: entry.payload,
          beforeValue: entry.beforeValue,
          afterValue: entry.afterValue,
          metadata: {
            summary: entry.summary
          }
        }
      })
      return {
        ...entry,
        historyId: String(persisted.id ?? entry.historyId),
        createdAt: this.normalizeSnapshotDateString(persisted.createdAt) ?? entry.createdAt
      }
    }

    const cacheKey = this.getMutationHistoryCacheKey(input.memberId, input.tenantContext.tenantId)
    const current = memberMutationHistoryStore.get(cacheKey) ?? []
    memberMutationHistoryStore.set(cacheKey, [entry, ...current].slice(0, 20))
    return entry
  }

  async listPersistentMutationHistory(
    memberId: string,
    tenantContext: RequestTenantContext
  ): Promise<MemberProfileMutationHistoryEntry[]> {
    const auditLogModel = this.getAuditLogModel()
    if (auditLogModel?.findMany) {
      const records = await auditLogModel.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          resourceType: 'member-profile',
          resourceId: memberId,
          purpose: {
            in: ['member-profile-mutation', 'member-approval-outcome']
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 24
      })
      return records.map((record) => {
        const rawAction = String(record.action)
        const action = rawAction.startsWith('member.profile.')
          ? (rawAction.replace('member.profile.', '') as MemberProfileMutationHistoryEntry['action'])
          : rawAction.startsWith('member.approval.')
            ? (`approval.${rawAction.replace('member.approval.', '')}` as MemberProfileMutationHistoryEntry['action'])
            : (rawAction as MemberProfileMutationHistoryEntry['action'])
        const metadata = (record.metadata as Record<string, unknown> | undefined) ?? {}
        const payload = (record.payload as Record<string, unknown> | undefined) ?? {}
        const summary =
          this.normalizeSnapshotString(metadata.summary) ??
          (action.startsWith('approval.')
            ? String(metadata.summary ?? this.buildApprovalOutcomeSummary(payload))
            : this.buildMemberMutationSummary(
                action as MemberProfileMutationHistoryEntry['action'],
                payload as Record<string, unknown>
              ))
        return {
          historyId: String(record.id),
          tenantContext,
          memberId,
          action,
          summary,
          sourceChannel: this.normalizeSnapshotString(record.sourceChannel) ?? 'member-admin',
          operatorId: this.normalizeSnapshotString(record.operatorId) ?? 'member-admin',
          payload: payload as Record<string, unknown>,
          beforeValue:
            record.beforeValue && typeof record.beforeValue === 'object'
              ? (record.beforeValue as Record<string, unknown>)
              : undefined,
          afterValue:
            record.afterValue && typeof record.afterValue === 'object'
              ? (record.afterValue as Record<string, unknown>)
              : undefined,
          createdAt: this.normalizeSnapshotDateString(record.createdAt) ?? new Date().toISOString()
        }
      })
    }

    return memberMutationHistoryStore.get(this.getMutationHistoryCacheKey(memberId, tenantContext.tenantId)) ?? []
  }

  private buildApprovalOutcomeSummary(payload: Record<string, unknown>): string {
    const op = String(payload.operation ?? 'member.action')
    const stage = String(payload.stage ?? 'DECIDED').toLowerCase()
    if (stage === 'approved') return `审批通过：${op}`
    if (stage === 'rejected') return `审批驳回：${op}`
    if (stage === 'cancelled') return `审批撤销：${op}`
    if (stage === 'executed') return `审批动作已执行：${op}`
    if (stage === 'execution_failed') return `审批动作执行失败：${op}`
    if (stage === 'resubmitted') return `审批重新提交：${op}`
    return `审批状态变化：${op}`
  }

  private toLytMemberSnapshot(input: {
    snapshotId: string
    tenantContext: RequestTenantContext
    memberProfileId?: string
    externalMemberId: string
    memberCode?: string
    mobile?: string
    nickname?: string
    levelCode?: string
    points: number
    growthValue: number
    status: string
    updatedAtFromSource: string
    rawVersion?: string
    rawPayload?: Record<string, unknown>
    source: 'memory' | 'prisma'
  }): LytMemberSnapshot {
    return {
      snapshotId: input.snapshotId,
      tenantContext: input.tenantContext,
      memberProfileId: input.memberProfileId,
      externalMemberId: input.externalMemberId,
      memberCode: input.memberCode,
      mobile: input.mobile,
      nickname: input.nickname,
      levelCode: input.levelCode,
      points: input.points,
      growthValue: input.growthValue,
      status: input.status,
      updatedAtFromSource: input.updatedAtFromSource,
      rawVersion: input.rawVersion,
      rawPayload: input.rawPayload ? { ...input.rawPayload } : undefined,
      source: input.source
    }
  }

  private toMemberProfile(input: {
    memberId: string
    tenantContext: RequestTenantContext
    nickname: string
    mobile?: string
    email?: string
    address?: string
    notes?: string
    userId?: string
    points: number
    growthValue?: number
    svipStatus?: string
    registeredAt: string
    lastActiveAt?: string
    lifecycleStage?: MemberProfile['lifecycleStage']
    tags?: string[]
    lastPaymentAt?: string
    lastPaymentAmount?: number
    lastPaymentOrderId?: string
    lastPaymentChannel?: string
    source: 'memory' | 'prisma'
    persisted: boolean
    status?: MemberStatus
  }): MemberProfile {
    return {
      memberId: input.memberId,
      userId: input.userId,
      tenantContext: input.tenantContext,
      mobile: input.mobile,
      nickname: input.nickname,
      email: input.email,
      address: input.address,
      notes: input.notes,
      level: computeMemberLevel(input.points),
      status: input.status ?? MemberStatus.Active,
      points: input.points,
      growthValue: input.growthValue ?? input.points,
      svipStatus: input.svipStatus ?? 'INACTIVE',
      registeredAt: input.registeredAt,
      lastActiveAt: input.lastActiveAt,
      lifecycleStage: input.lifecycleStage,
      tags: input.tags ? [...input.tags] : undefined,
      lastPaymentAt: input.lastPaymentAt,
      lastPaymentAmount: input.lastPaymentAmount,
      lastPaymentOrderId: input.lastPaymentOrderId,
      lastPaymentChannel: input.lastPaymentChannel,
      source: input.source,
      persisted: input.persisted
    }
  }

  private toMemberOperationsTask(input: {
    taskId: string
    tenantContext: RequestTenantContext
    memberId: string
    actionCode: MemberOperationsTask['actionCode']
    title: string
    reason: string
    channel: MemberOperationsTask['channel']
    priority: MemberOperationsTask['priority']
    status: MemberOperationsTask['status']
    executionLane: MemberOperationsTask['executionLane']
    source: MemberOperationsTask['source']
    sourceOrderId?: string
    sourcePaymentId?: string
    executionSummary?: string
    executionTargetId?: string
    executedAt?: string
    dedupeKey: string
    createdAt: string
    scheduledAt: string
  }): MemberOperationsTask {
    return {
      taskId: input.taskId,
      tenantContext: input.tenantContext,
      memberId: input.memberId,
      actionCode: input.actionCode,
      title: input.title,
      reason: input.reason,
      channel: input.channel,
      priority: input.priority,
      status: input.status,
      executionLane: input.executionLane,
      source: input.source,
      sourceOrderId: input.sourceOrderId,
      sourcePaymentId: input.sourcePaymentId,
      executionSummary: input.executionSummary,
      executionTargetId: input.executionTargetId,
      executedAt: input.executedAt,
      dedupeKey: input.dedupeKey,
      createdAt: input.createdAt,
      scheduledAt: input.scheduledAt
    }
  }

  private toMemberOperationsExecutionReceipt(input: {
    executionId: string
    tenantContext: RequestTenantContext
    memberId: string
    taskId: string
    actionCode: MemberOperationsExecutionReceipt['actionCode']
    targetType: MemberOperationsExecutionReceipt['targetType']
    targetId: string
    status: MemberOperationsExecutionReceipt['status']
    summary: string
    payload: Record<string, unknown>
    runtimeReceiptCode?: string
    runtimeState?: MemberOperationsExecutionReceipt['runtimeState']
    runtimeReplayable?: boolean
    executedAt: string
  }): MemberOperationsExecutionReceipt {
    return {
      executionId: input.executionId,
      tenantContext: input.tenantContext,
      memberId: input.memberId,
      taskId: input.taskId,
      actionCode: input.actionCode,
      targetType: input.targetType,
      targetId: input.targetId,
      status: input.status,
      summary: input.summary,
      payload: { ...input.payload },
      runtimeReceiptCode: input.runtimeReceiptCode,
      runtimeState: input.runtimeState,
      runtimeReplayable: input.runtimeReplayable,
      executedAt: input.executedAt
    }
  }

  private toMemberOperationsTaskFromRecord(record: Record<string, unknown>): MemberOperationsTask {
    return this.toMemberOperationsTask({
      taskId: String(record.taskId),
      tenantContext: {
        tenantId: String(record.tenantId),
        brandId: this.normalizeSnapshotString(record.brandId),
        storeId: this.normalizeSnapshotString(record.storeId),
        marketCode: this.normalizeSnapshotString(record.marketCode)
      },
      memberId: String(record.memberId),
      actionCode: String(record.actionCode) as MemberOperationsTask['actionCode'],
      title: String(record.title),
      reason: String(record.reason),
      channel: String(record.channel) as MemberOperationsTask['channel'],
      priority: String(record.priority) as MemberOperationsTask['priority'],
      status: String(record.status) as MemberOperationsTask['status'],
      executionLane: String(record.executionLane) as MemberOperationsTask['executionLane'],
      source: String(record.source) as MemberOperationsTask['source'],
      sourceOrderId: this.normalizeSnapshotString(record.sourceOrderId),
      sourcePaymentId: this.normalizeSnapshotString(record.sourcePaymentId),
      executionSummary: this.normalizeSnapshotString(record.executionSummary),
      executionTargetId: this.normalizeSnapshotString(record.executionTargetId),
      executedAt: this.normalizeSnapshotDateString(record.executedAt),
      dedupeKey: String(record.dedupeKey),
      createdAt: this.normalizeSnapshotDateString(record.createdAt) ?? new Date().toISOString(),
      scheduledAt: this.normalizeSnapshotDateString(record.scheduledAt) ?? new Date().toISOString()
    })
  }

  private toMemberOperationsReceiptFromRecord(record: Record<string, unknown>): MemberOperationsExecutionReceipt {
    return this.toMemberOperationsExecutionReceipt({
      executionId: String(record.executionId),
      tenantContext: {
        tenantId: String(record.tenantId),
        brandId: this.normalizeSnapshotString(record.brandId),
        storeId: this.normalizeSnapshotString(record.storeId),
        marketCode: this.normalizeSnapshotString(record.marketCode)
      },
      memberId: String(record.memberId),
      taskId: String(record.taskId),
      actionCode: String(record.actionCode) as MemberOperationsExecutionReceipt['actionCode'],
      targetType: String(record.targetType) as MemberOperationsExecutionReceipt['targetType'],
      targetId: String(record.targetId),
      status: String(record.status) as MemberOperationsExecutionReceipt['status'],
      summary: String(record.summary),
      payload:
        record.payload && typeof record.payload === 'object'
          ? (record.payload as Record<string, unknown>)
          : {},
      runtimeReceiptCode: this.normalizeSnapshotString(record.runtimeReceiptCode),
      runtimeState: this.normalizeSnapshotString(
        record.runtimeState
      ) as MemberOperationsExecutionReceipt['runtimeState'] | undefined,
      runtimeReplayable: this.normalizeOptionalSnapshotBoolean(record.runtimeReplayable),
      executedAt: this.normalizeSnapshotDateString(record.executedAt) ?? new Date().toISOString()
    })
  }

  private buildMemberOperationsTaskPersistenceData(task: MemberOperationsTask) {
    return {
      taskId: task.taskId,
      tenantId: task.tenantContext.tenantId,
      brandId: task.tenantContext.brandId,
      storeId: task.tenantContext.storeId,
      marketCode: task.tenantContext.marketCode,
      memberId: task.memberId,
      actionCode: task.actionCode,
      title: task.title,
      reason: task.reason,
      channel: task.channel,
      priority: task.priority,
      status: task.status,
      executionLane: task.executionLane,
      source: task.source,
      sourceOrderId: task.sourceOrderId,
      sourcePaymentId: task.sourcePaymentId,
      executionSummary: task.executionSummary,
      executionTargetId: task.executionTargetId,
      executedAt: task.executedAt ? new Date(task.executedAt) : null,
      dedupeKey: task.dedupeKey,
      createdAt: new Date(task.createdAt),
      scheduledAt: new Date(task.scheduledAt)
    }
  }

  private buildMemberOperationsReceiptPersistenceData(receipt: MemberOperationsExecutionReceipt) {
    return {
      executionId: receipt.executionId,
      tenantId: receipt.tenantContext.tenantId,
      brandId: receipt.tenantContext.brandId,
      storeId: receipt.tenantContext.storeId,
      marketCode: receipt.tenantContext.marketCode,
      memberId: receipt.memberId,
      taskId: receipt.taskId,
      actionCode: receipt.actionCode,
      targetType: receipt.targetType,
      targetId: receipt.targetId,
      status: receipt.status,
      summary: receipt.summary,
      payload: receipt.payload,
      runtimeReceiptCode: receipt.runtimeReceiptCode,
      runtimeState: receipt.runtimeState,
      runtimeReplayable: receipt.runtimeReplayable,
      executedAt: new Date(receipt.executedAt)
    }
  }

  private uniqueValues(values: Array<string | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
  }

  private buildOperationsSegments(profile: MemberProfile) {
    const lifecycleStage = profile.lifecycleStage ?? 'prospect'
    const normalizedChannel = profile.lastPaymentChannel
      ? this.sanitizeTagSegment(profile.lastPaymentChannel)
      : undefined

    return this.uniqueValues([
      `lifecycle-${lifecycleStage}`,
      `level-${profile.level.toLowerCase()}`,
      profile.persisted ? 'persisted-member' : 'memory-member',
      profile.lastPaymentAt ? 'recent-payer' : undefined,
      (profile.lastPaymentAmount ?? 0) >= 200 || profile.tags?.includes('high-value-buyer')
        ? 'high-value-buyer'
        : undefined,
      profile.level === MemberLevel.Gold ||
      profile.level === MemberLevel.Platinum ||
      profile.level === MemberLevel.Diamond
        ? 'vip-tier-member'
        : undefined,
      normalizedChannel ? `channel-${normalizedChannel}` : undefined,
      ...(profile.tags ?? []).map((tag) => `tag-${this.sanitizeTagSegment(tag)}`)
    ])
  }

  private buildOperationsActions(
    profile: MemberProfile,
    segments: string[]
  ): MemberOperationsAction[] {
    const actions: MemberOperationsAction[] = []
    const hasSegment = (segment: string) => segments.includes(segment)
    const pushAction = (action: MemberOperationsAction) => {
      if (!actions.some((entry) => entry.code === action.code)) {
        actions.push(action)
      }
    }

    if (!profile.lastPaymentAt) {
      pushAction({
        code: 'complete-member-onboarding',
        label: '补齐入会资料',
        reason: '当前会员尚未形成支付闭环，先完成资料采集与首购引导。',
        channel: 'app-push',
        priority: 'high'
      })
    }

    if (profile.lifecycleStage === 'newly-paid') {
      pushAction({
        code: 'send-post-payment-welcome',
        label: '发送首购欢迎触达',
        reason: '首单支付成功后，优先推送欢迎话术和会员权益说明。',
        channel: 'wechat',
        priority: 'high'
      })
      pushAction({
        code: 'issue-bounce-back-coupon',
        label: '发放回访券',
        reason: '趁首次支付热度仍在，尽快引导二次复购。',
        channel: 'coupon',
        priority: 'high'
      })
    }

    if (profile.lifecycleStage === 'repeat-paid') {
      pushAction({
        code: 'recommend-repeat-purchase-bundle',
        label: '推荐复购组合包',
        reason: '该会员已进入复购阶段，适合做关联品类或套餐推荐。',
        channel: 'app-push',
        priority: 'medium'
      })
      pushAction({
        code: 'invite-loyalty-challenge',
        label: '邀请参加成长挑战',
        reason: '通过连续消费挑战把复购行为沉淀成忠诚度。',
        channel: 'wechat',
        priority: 'medium'
      })
    }

    if (profile.lifecycleStage === 'vip-active') {
      pushAction({
        code: 'assign-vip-concierge',
        label: '分配 VIP 专属跟进',
        reason: '高等级会员已形成稳定价值，需要转为高触达人群运营。',
        channel: 'crm-task',
        priority: 'high'
      })
      pushAction({
        code: 'push-new-arrival-preview',
        label: '推送新品预览',
        reason: 'VIP 活跃会员更适合提前触达新品、限量款或门店专场。',
        channel: 'wechat',
        priority: 'medium'
      })
    }

    if (hasSegment('high-value-buyer')) {
      pushAction({
        code: 'issue-bounce-back-coupon',
        label: '发放高客单回访券',
        reason: '最近一单客单价较高，适合用高价值权益承接复购。',
        channel: 'coupon',
        priority: 'medium'
      })
    }

    if (
      hasSegment('channel-wechat-pay') ||
      hasSegment('channel-alipay') ||
      hasSegment('channel-card')
    ) {
      pushAction({
        code: 'deliver-channel-follow-up',
        label: '按支付渠道做二次触达',
        reason: '支付渠道已明确，可定向分发更匹配的会员权益或服务提醒。',
        channel: hasSegment('channel-wechat-pay') ? 'wechat' : 'app-push',
        priority: 'low'
      })
    }

    return actions.slice(0, 6)
  }

  private buildAutomationTriggers(
    profile: MemberProfile,
    segments: string[]
  ): MemberAutomationTrigger[] {
    const triggers: MemberAutomationTrigger[] = []
    const hasSegment = (segment: string) => segments.includes(segment)
    const pushTrigger = (trigger: MemberAutomationTrigger) => {
      if (!triggers.some((entry) => entry.code === trigger.code)) {
        triggers.push(trigger)
      }
    }

    if (profile.lastPaymentAt) {
      pushTrigger({
        code: 'payment-success-journey',
        status: 'ready',
        source: 'payment-success',
        reason: '最近一次支付成功已形成可触发的会员运营起点。'
      })
    }

    if (profile.lifecycleStage === 'newly-paid') {
      pushTrigger({
        code: 'newly-paid-bounce-back',
        status: 'ready',
        source: 'lifecycle',
        reason: '当前处于 newly-paid 阶段，应进入首购回访与二单转化旅程。'
      })
    }

    if (profile.lifecycleStage === 'repeat-paid') {
      pushTrigger({
        code: 'repeat-paid-retention',
        status: 'ready',
        source: 'lifecycle',
        reason: '当前已进入 repeat-paid 阶段，应触发复购维系与忠诚度动作。'
      })
    }

    if (profile.lifecycleStage === 'vip-active' || hasSegment('vip-tier-member')) {
      pushTrigger({
        code: 'vip-service-upgrade',
        status: 'ready',
        source: 'tag',
        reason: '会员等级和支付价值已达到 VIP 运营门槛。'
      })
    }

    if (
      hasSegment('channel-wechat-pay') ||
      hasSegment('channel-alipay') ||
      hasSegment('channel-card')
    ) {
      pushTrigger({
        code: 'channel-retouch',
        status: 'watch',
        source: 'tag',
        reason: '支付渠道标签可作为后续渠道化触达和归因观察依据。'
      })
    }

    return triggers.slice(0, 5)
  }

  private buildOperationsProfile(profile: MemberProfile): MemberOperationsProfile {
    const segments = this.buildOperationsSegments(profile)
    return {
      memberId: profile.memberId,
      tenantContext: profile.tenantContext,
      level: profile.level,
      status: profile.status,
      lifecycleStage: profile.lifecycleStage ?? 'prospect',
      audienceSegments: segments,
      recommendedActions: this.buildOperationsActions(profile, segments),
      automationTriggers: this.buildAutomationTriggers(profile, segments),
      lastPaymentAt: profile.lastPaymentAt,
      lastPaymentAmount: profile.lastPaymentAmount,
      lastPaymentChannel: profile.lastPaymentChannel,
      tags: [...(profile.tags ?? [])],
      source: profile.source
    }
  }

  private resolveExecutionLane(
    channel: MemberOperationsAction['channel']
  ): MemberOperationsTask['executionLane'] {
    if (channel === 'crm-task') {
      return 'member-crm'
    }
    if (channel === 'coupon') {
      return 'promo-conversion'
    }
    return 'campaign-execution'
  }

  private async findOperationsTaskByDedupeKey(dedupeKey: string): Promise<MemberOperationsTask | undefined> {
    const taskModel = this.getMemberOperationsTaskModel()
    if (!taskModel?.findUnique) {
      return memberOperationsTaskStore.get(dedupeKey)
    }

    const record = await taskModel.findUnique({
      where: {
        dedupeKey
      }
    })

    return record ? this.toMemberOperationsTaskFromRecord(record) : undefined
  }

  private async createOperationsTask(task: MemberOperationsTask): Promise<MemberOperationsTask> {
    const taskModel = this.getMemberOperationsTaskModel()
    if (!taskModel?.create) {
      memberOperationsTaskStore.set(task.dedupeKey, task)
      return task
    }

    const record = await taskModel.create({
      data: this.buildMemberOperationsTaskPersistenceData(task)
    })
    return this.toMemberOperationsTaskFromRecord(record)
  }

  private async updateOperationsTask(task: MemberOperationsTask): Promise<MemberOperationsTask> {
    const taskModel = this.getMemberOperationsTaskModel()
    if (!taskModel?.update) {
      memberOperationsTaskStore.set(task.dedupeKey, task)
      return task
    }

    const record = await taskModel.update({
      where: { taskId: task.taskId },
      data: this.buildMemberOperationsTaskPersistenceData(task)
    })
    return this.toMemberOperationsTaskFromRecord(record)
  }

  private async createOperationsReceipt(
    receipt: MemberOperationsExecutionReceipt
  ): Promise<MemberOperationsExecutionReceipt> {
    const receiptModel = this.getMemberOperationsReceiptModel()
    if (!receiptModel?.create) {
      memberOperationsExecutionStore.set(receipt.executionId, receipt)
      return receipt
    }

    const record = await receiptModel.create({
      data: this.buildMemberOperationsReceiptPersistenceData(receipt)
    })
    return this.toMemberOperationsReceiptFromRecord(record)
  }

  private async updateOperationsReceipt(
    receipt: MemberOperationsExecutionReceipt
  ): Promise<MemberOperationsExecutionReceipt> {
    const receiptModel = this.getMemberOperationsReceiptModel()
    if (!receiptModel?.update) {
      memberOperationsExecutionStore.set(receipt.executionId, receipt)
      return receipt
    }

    const record = await receiptModel.update({
      where: { executionId: receipt.executionId },
      data: this.buildMemberOperationsReceiptPersistenceData(receipt)
    })
    return this.toMemberOperationsReceiptFromRecord(record)
  }

  private async listOperationsTasksForMember(memberId: string, tenantId: string) {
    const taskModel = this.getMemberOperationsTaskModel()
    if (!taskModel?.findMany) {
      return Array.from(memberOperationsTaskStore.values())
        .filter((task) => task.memberId === memberId && task.tenantContext.tenantId === tenantId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    }

    const records = await taskModel.findMany({
      where: {
        tenantId,
        memberId
      },
      orderBy: [{ createdAt: 'desc' }]
    })

    return records.map((record) => this.toMemberOperationsTaskFromRecord(record))
  }

  private async listOperationsReceiptsForMember(memberId: string, tenantId: string) {
    const receiptModel = this.getMemberOperationsReceiptModel()
    if (!receiptModel?.findMany) {
      return Array.from(memberOperationsExecutionStore.values())
        .filter((receipt) => receipt.memberId === memberId && receipt.tenantContext.tenantId === tenantId)
        .sort((left, right) => Date.parse(right.executedAt) - Date.parse(left.executedAt))
    }

    const records = await receiptModel.findMany({
      where: {
        tenantId,
        memberId
      },
      orderBy: [{ executedAt: 'desc' }]
    })

    return records.map((record) => this.toMemberOperationsReceiptFromRecord(record))
  }

  private getExecutionRuntimeAction(task: MemberOperationsTask): 'coupon-claim' | 'booking-submit' {
    return task.executionLane === 'promo-conversion' ? 'coupon-claim' : 'booking-submit'
  }

  private buildExecutionRuntimePayload(
    task: MemberOperationsTask,
    receipt: MemberOperationsExecutionReceipt
  ) {
    return {
      memberId: task.memberId,
      taskId: task.taskId,
      actionCode: task.actionCode,
      executionLane: task.executionLane,
      targetType: receipt.targetType,
      targetId: receipt.targetId,
      sourceOrderId: task.sourceOrderId,
      sourcePaymentId: task.sourcePaymentId
    }
  }

  private async attachRuntimeExecutionTrace(
    task: MemberOperationsTask,
    receipt: MemberOperationsExecutionReceipt
  ): Promise<MemberOperationsExecutionReceipt> {
    if (!this.runtimeGovernanceService) {
      return receipt
    }

    const idempotencyPrefix = `member-operations:${task.taskId}:${receipt.executionId}`
    const submitted = await this.runtimeGovernanceService.submitAction({
      app: 'admin-web',
      action: this.getExecutionRuntimeAction(task),
      nextStep: 'PROCEED',
      riskLevel: task.priority === 'high' ? 'medium' : 'low',
      requestEndpoint: `/api/v1/members/persistent/${task.memberId}/operations-receipts/${receipt.executionId}/runtime`,
      payload: this.buildExecutionRuntimePayload(task, receipt),
      payloadSummary: `${task.actionCode} 已执行，目标 ${receipt.targetType}:${receipt.targetId}`,
      recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
      handlerName: 'member-operations-executor',
      idempotencyKey: `${idempotencyPrefix}:submit`,
      tenantId: task.tenantContext.tenantId,
      brandId: task.tenantContext.brandId,
      storeId: task.tenantContext.storeId,
      marketCode: task.tenantContext.marketCode,
      actorId: 'member-operations-executor'
    })
    const synced = await this.runtimeGovernanceService.syncAction(submitted.receiptCode, {
      handlerName: 'member-operations-executor',
      ticketCode: submitted.ticket.ticketCode,
      idempotencyKey: `${idempotencyPrefix}:sync`,
      tenantId: task.tenantContext.tenantId,
      actorId: 'member-operations-executor'
    })
    const callbacked = await this.runtimeGovernanceService.recordCallback(submitted.receiptCode, {
      callbackStatus: 'callback-recorded',
      ackToken: `member-ops-ack-${receipt.executionId}`,
      lastEvent: 'HANDLER_COMPLETED',
      summary: receipt.summary,
      idempotencyKey: `${idempotencyPrefix}:callback`,
      tenantId: task.tenantContext.tenantId,
      actorId: 'member-operations-executor'
    })

    const runtimeReceipt: RuntimeGovernanceReceipt =
      callbacked.state === 'callback-recorded' ? callbacked : synced

    const enrichedReceipt: MemberOperationsExecutionReceipt = {
      ...receipt,
      runtimeReceiptCode: runtimeReceipt.receiptCode,
      runtimeState: runtimeReceipt.state,
      runtimeReplayable: runtimeReceipt.ledger.replayable
    }
    return this.updateOperationsReceipt(enrichedReceipt)
  }

  private buildCouponOfferPayload(task: MemberOperationsTask, profile: MemberOperationsProfile) {
    const discountAmount =
      profile.level === MemberLevel.Diamond || profile.level === MemberLevel.Platinum ? 60 : 30
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const couponCode = `OPS-${task.memberId.slice(-4).toUpperCase()}-${randomBytes(3)
      .toString('hex')
      .toUpperCase()}`

    return {
      couponCode,
      campaignKey: task.actionCode,
      discountAmount,
      currency: 'CNY',
      expiresAt,
      memberTier: profile.level
    }
  }

  private buildCrmFollowUpPayload(task: MemberOperationsTask, profile: MemberOperationsProfile) {
    const ownerQueue =
      profile.level === MemberLevel.Diamond || profile.level === MemberLevel.Platinum
        ? 'vip-concierge'
        : 'member-success'

    return {
      queueId: ownerQueue,
      slaHours: profile.level === MemberLevel.Diamond ? 2 : 12,
      lifecycleStage: profile.lifecycleStage,
      preferredChannel: profile.lastPaymentChannel ?? task.channel
    }
  }

  private async executeOperationsTask(
    task: MemberOperationsTask,
    profile: MemberOperationsProfile
  ): Promise<MemberOperationsExecutionReceipt | undefined> {
    const executedAt = new Date().toISOString()

    if (task.executionLane === 'promo-conversion') {
      const payload = this.buildCouponOfferPayload(task, profile)
      const receipt: MemberOperationsExecutionReceipt = {
        executionId: `ops-exec-${randomBytes(6).toString('hex')}`,
        tenantContext: task.tenantContext,
        memberId: task.memberId,
        taskId: task.taskId,
        actionCode: task.actionCode,
        targetType: 'coupon-offer',
        targetId: String(payload.couponCode),
        status: 'completed',
        summary: `已向会员发放运营优惠券 ${String(payload.couponCode)}`,
        payload,
        executedAt
      }
      await this.createOperationsReceipt(receipt)
      await this.updateOperationsTask({
        ...task,
        status: 'completed',
        executionSummary: receipt.summary,
        executionTargetId: receipt.targetId,
        executedAt
      })
      return this.attachRuntimeExecutionTrace(task, receipt)
    }

    if (task.executionLane === 'member-crm') {
      const payload = this.buildCrmFollowUpPayload(task, profile)
      const followUpId = `crm-followup-${randomBytes(5).toString('hex')}`
      const receipt: MemberOperationsExecutionReceipt = {
        executionId: `ops-exec-${randomBytes(6).toString('hex')}`,
        tenantContext: task.tenantContext,
        memberId: task.memberId,
        taskId: task.taskId,
        actionCode: task.actionCode,
        targetType: 'crm-follow-up',
        targetId: followUpId,
        status: 'completed',
        summary: `已创建 CRM 跟进工单 ${followUpId}`,
        payload: {
          ...payload,
          followUpId
        },
        executedAt
      }
      await this.createOperationsReceipt(receipt)
      await this.updateOperationsTask({
        ...task,
        status: 'completed',
        executionSummary: receipt.summary,
        executionTargetId: receipt.targetId,
        executedAt
      })
      return this.attachRuntimeExecutionTrace(task, receipt)
    }

    await this.updateOperationsTask({
      ...task,
      status: 'dispatched'
    })
    return undefined
  }

  private hydratePersistentProfile(input: {
    memberProfile: {
      id: string
      tenantId: string
      userId?: string | null
      points: number
      growthValue: number
      svipStatus: string
      createdAt: Date
      updatedAt: Date
    }
    user?: { id: string; mobile: string } | null
    tenantContext: RequestTenantContext
    snapshot?: LytMemberSnapshot | null
    extension?: {
      email?: string | null
      address?: string | null
      notes?: string | null
    } | null
  }): MemberProfile {
    const cached = memberStore.get(input.memberProfile.id)
    const nickname =
      input.snapshot?.nickname ??
      cached?.nickname ??
      input.user?.mobile?.slice(-4)?.padStart(input.user.mobile.length, '*') ??
      input.memberProfile.id

    // extension 行的存在与否是字段来源的唯一信号：行存在则信任其归一化后的值
    // （即使是 undefined 也表示被显式清空，不能回退到内存缓存里旧的字符串）。
    const hasExtensionRow = Boolean(input.extension)
    const emailFromExtension = hasExtensionRow ? this.normalizeSnapshotString(input.extension?.email) : undefined
    const addressFromExtension = hasExtensionRow ? this.normalizeSnapshotString(input.extension?.address) : undefined
    const notesFromExtension = hasExtensionRow ? this.normalizeSnapshotString(input.extension?.notes) : undefined

    const profile = this.toMemberProfile({
      memberId: input.memberProfile.id,
      userId: input.user?.id ?? input.memberProfile.userId ?? undefined,
      tenantContext: {
        tenantId: input.memberProfile.tenantId,
        brandId: input.tenantContext.brandId,
        storeId: input.tenantContext.storeId,
        marketCode: input.tenantContext.marketCode
      },
      mobile: input.user?.mobile ?? input.snapshot?.mobile,
      nickname,
      email: hasExtensionRow ? emailFromExtension : cached?.email,
      address: hasExtensionRow ? addressFromExtension : cached?.address,
      notes: hasExtensionRow ? notesFromExtension : cached?.notes,
      points: input.memberProfile.points,
      growthValue: input.memberProfile.growthValue,
      svipStatus: input.memberProfile.svipStatus,
      registeredAt: input.memberProfile.createdAt.toISOString(),
      lastActiveAt: input.snapshot?.updatedAtFromSource ?? input.memberProfile.updatedAt.toISOString(),
      lifecycleStage: cached?.lifecycleStage,
      tags: cached?.tags,
      lastPaymentAt: cached?.lastPaymentAt,
      lastPaymentAmount: cached?.lastPaymentAmount,
      lastPaymentOrderId: cached?.lastPaymentOrderId,
      lastPaymentChannel: cached?.lastPaymentChannel,
      source: 'prisma',
      persisted: true,
      status: this.parseMemberStatus(input.snapshot?.status) ?? MemberStatus.Active
    })
    const levelOverride = this.parseMemberLevel(input.snapshot?.levelCode)
    if (levelOverride) {
      profile.level = levelOverride
    }
    memberStore.set(profile.memberId, profile)
    return profile
  }

  private async savePersistentSnapshotOverride(input: {
    profile: MemberProfile
    tenantContext: RequestTenantContext
    status?: MemberStatus
    level?: MemberLevel
    nickname?: string
    mobile?: string
  }): Promise<LytMemberSnapshot | undefined> {
    const snapshotModel = this.getLytMemberSnapshotModel()
    const existing = await this.findSnapshotByMemberProfileId(input.profile.memberId, input.tenantContext)
    const externalMemberId = existing?.externalMemberId ?? input.profile.memberId
    const updatedAtFromSource = new Date().toISOString()

    if (snapshotModel?.upsert) {
      const record = await snapshotModel.upsert({
        where: {
          tenantId_externalMemberId: {
            tenantId: input.tenantContext.tenantId,
            externalMemberId
          }
        },
        create: {
          tenantId: input.tenantContext.tenantId,
          brandId: input.tenantContext.brandId,
          storeId: input.tenantContext.storeId,
          memberProfileId: input.profile.memberId,
          externalMemberId,
          memberCode: existing?.memberCode,
          mobile: input.mobile ?? existing?.mobile ?? input.profile.mobile,
          nickname: input.nickname ?? existing?.nickname ?? input.profile.nickname,
          levelCode: input.level ?? existing?.levelCode,
          points: existing?.points ?? input.profile.points,
          growthValue: existing?.growthValue ?? input.profile.growthValue ?? input.profile.points,
          status: input.status ?? existing?.status ?? input.profile.status,
          updatedAtFromSource: new Date(updatedAtFromSource),
          rawVersion: existing?.rawVersion,
          rawPayload: existing?.rawPayload
        },
        update: {
          brandId: input.tenantContext.brandId,
          storeId: input.tenantContext.storeId,
          memberProfileId: input.profile.memberId,
          mobile: input.mobile ?? existing?.mobile ?? input.profile.mobile,
          nickname: input.nickname ?? existing?.nickname ?? input.profile.nickname,
          levelCode: input.level ?? existing?.levelCode,
          points: existing?.points ?? input.profile.points,
          growthValue: existing?.growthValue ?? input.profile.growthValue ?? input.profile.points,
          status: input.status ?? existing?.status ?? input.profile.status,
          updatedAtFromSource: new Date(updatedAtFromSource)
        }
      })
      return this.toLytMemberSnapshot({
        snapshotId: String(record.id),
        tenantContext: input.tenantContext,
        memberProfileId: input.profile.memberId,
        externalMemberId,
        memberCode: this.normalizeSnapshotString(record.memberCode),
        mobile: this.normalizeSnapshotString(record.mobile),
        nickname: this.normalizeSnapshotString(record.nickname),
        levelCode: this.normalizeSnapshotString(record.levelCode),
        points: this.normalizeSnapshotNumber(record.points, input.profile.points),
        growthValue: this.normalizeSnapshotNumber(record.growthValue, input.profile.growthValue ?? input.profile.points),
        status: this.normalizeSnapshotString(record.status) ?? input.profile.status,
        updatedAtFromSource,
        rawVersion: this.normalizeSnapshotString(record.rawVersion),
        rawPayload:
          record.rawPayload && typeof record.rawPayload === 'object'
            ? (record.rawPayload as Record<string, unknown>)
            : undefined,
        source: 'prisma'
      })
    }

    const snapshot = this.toLytMemberSnapshot({
      snapshotId: existing?.snapshotId ?? `lyt-member-snapshot-${Date.now()}`,
      tenantContext: input.tenantContext,
      memberProfileId: input.profile.memberId,
      externalMemberId,
      memberCode: existing?.memberCode,
      mobile: input.mobile ?? existing?.mobile ?? input.profile.mobile,
      nickname: input.nickname ?? existing?.nickname ?? input.profile.nickname,
      levelCode: input.level ?? existing?.levelCode,
      points: existing?.points ?? input.profile.points,
      growthValue: existing?.growthValue ?? input.profile.growthValue ?? input.profile.points,
      status: input.status ?? existing?.status ?? input.profile.status,
      updatedAtFromSource,
      rawVersion: existing?.rawVersion,
      rawPayload: existing?.rawPayload,
      source: 'memory'
    })
    lytMemberSnapshotStore.set(this.getLytSnapshotCacheKey(input.tenantContext.tenantId, externalMemberId), snapshot)
    return snapshot
  }

  private async findSnapshotByMemberProfileId(
    memberProfileId: string,
    tenantContext: RequestTenantContext
  ): Promise<LytMemberSnapshot | null> {
    const snapshotModel = this.getLytMemberSnapshotModel()
    if (!snapshotModel?.findFirst) {
      for (const snapshot of lytMemberSnapshotStore.values()) {
        if (
          snapshot.memberProfileId === memberProfileId &&
          snapshot.tenantContext.tenantId === tenantContext.tenantId
        ) {
          return snapshot
        }
      }
      return null
    }

    const record = await snapshotModel.findFirst({
      where: {
        tenantId: tenantContext.tenantId,
        memberProfileId
      },
      orderBy: [{ updatedAtFromSource: 'desc' }]
    })

    if (!record) {
      return null
    }

    return this.toLytMemberSnapshot({
      snapshotId: String(record.id),
      tenantContext: {
        tenantId: String(record.tenantId),
        brandId: this.normalizeSnapshotString(record.brandId),
        storeId: this.normalizeSnapshotString(record.storeId),
        marketCode: tenantContext.marketCode
      },
      memberProfileId: this.normalizeSnapshotString(record.memberProfileId),
      externalMemberId: String(record.externalMemberId),
      memberCode: this.normalizeSnapshotString(record.memberCode),
      mobile: this.normalizeSnapshotString(record.mobile),
      nickname: this.normalizeSnapshotString(record.nickname),
      levelCode: this.normalizeSnapshotString(record.levelCode),
      points: this.normalizeSnapshotNumber(record.points),
      growthValue: this.normalizeSnapshotNumber(record.growthValue),
      status: this.normalizeSnapshotString(record.status) ?? 'ACTIVE',
      updatedAtFromSource: record.updatedAtFromSource instanceof Date
        ? record.updatedAtFromSource.toISOString()
        : String(record.updatedAtFromSource),
      rawVersion: this.normalizeSnapshotString(record.rawVersion),
      rawPayload:
        record.rawPayload && typeof record.rawPayload === 'object'
          ? (record.rawPayload as Record<string, unknown>)
          : undefined,
      source: 'prisma'
    })
  }

  private async findMemberProfileExtension(memberProfileId: string) {
    const extensionModel = this.getMemberProfileExtensionModel()
    if (!extensionModel?.findUnique) {
      return null
    }
    const record = await extensionModel.findUnique({
      where: {
        memberProfileId
      }
    })
    if (!record) {
      return null
    }
    return {
      email: this.normalizeSnapshotString(record.email),
      address: this.normalizeSnapshotString(record.address),
      notes: this.normalizeSnapshotString(record.notes)
    }
  }

  private async saveMemberProfileExtension(input: {
    memberId: string
    tenantContext: RequestTenantContext
    email?: string
    address?: string
    notes?: string
  }) {
    const extensionModel = this.getMemberProfileExtensionModel()
    const normalized = {
      email: this.normalizeSnapshotString(input.email),
      address: this.normalizeSnapshotString(input.address),
      notes: this.normalizeSnapshotString(input.notes)
    }
    if (!extensionModel?.upsert) {
      return normalized
    }
    const record = await extensionModel.upsert({
      where: {
        memberProfileId: input.memberId
      },
      create: {
        tenantId: input.tenantContext.tenantId,
        memberProfileId: input.memberId,
        email: normalized.email,
        address: normalized.address,
        notes: normalized.notes
      },
      update: {
        email: normalized.email,
        address: normalized.address,
        notes: normalized.notes
      }
    })
    return {
      email: this.normalizeSnapshotString(record.email),
      address: this.normalizeSnapshotString(record.address),
      notes: this.normalizeSnapshotString(record.notes)
    }
  }

  /**
   * Returns member-scoped bootstrap diagnostics.
   *
   * Capabilities: member-center, points, svip, blind-box.
   * Phase: scaffold until member domain is fully extracted.
   */
  getBootstrap(tenantContext: RequestTenantContext): MemberBootstrap {
    return makeMemberBootstrap(tenantContext);
  }

  /**
   * 根据会员 ID 获取会员档案
   */
  getProfile(memberId: string): MemberProfile | undefined {
    return memberStore.get(memberId);
  }

  /**
   * 列出所有会员档案
   */
  listProfiles(): MemberProfile[] {
    return Array.from(memberStore.values());
  }

  /**
   * 注册新会员
   */
  register(input: {
    memberId: string
    tenantContext: RequestTenantContext
    nickname: string
  }): MemberProfile {
    if (memberStore.has(input.memberId)) {
      throw new Error(`Member ${input.memberId} already exists`)
    }

    const profile: MemberProfile = {
      memberId: input.memberId,
      userId: undefined,
      tenantContext: input.tenantContext,
      mobile: undefined,
      nickname: input.nickname,
      level: MemberLevel.Bronze,
      status: MemberStatus.Active,
      points: 0,
      growthValue: 0,
      svipStatus: 'INACTIVE',
      registeredAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      source: 'memory',
      persisted: false
    }

    memberStore.set(input.memberId, profile)
    return profile
  }

  /**
   * 为会员增加积分，自动重新计算等级
   */
  addPoints(memberId: string, points: number): MemberProfile {
    const profile = memberStore.get(memberId)
    if (!profile) {
      throw new Error(`Member ${memberId} not found`)
    }
    if (points <= 0) {
      throw new Error('Points to add must be positive')
    }

    profile.points += points
    profile.growthValue = (profile.growthValue ?? 0) + points
    const newLevel = computeMemberLevel(profile.points)
    profile.level = newLevel
    profile.lastActiveAt = new Date().toISOString()

    return profile
  }

  revokePoints(memberId: string, points: number): MemberProfile {
    const profile = memberStore.get(memberId)
    if (!profile) {
      throw new Error(`Member ${memberId} not found`)
    }
    if (points <= 0) {
      throw new Error('Points to revoke must be positive')
    }

    profile.points = Math.max(0, profile.points - points)
    profile.growthValue = Math.max(0, (profile.growthValue ?? 0) - points)
    profile.level = computeMemberLevel(profile.points)
    profile.lastActiveAt = new Date().toISOString()

    return profile
  }

  private sanitizeTagSegment(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  private mergeMemberTags(existing: string[] | undefined, additions: string[]) {
    const tags = new Set<string>(existing ?? [])
    for (const addition of additions) {
      const normalized = this.sanitizeTagSegment(addition)
      if (normalized) {
        tags.add(normalized)
      }
    }
    return Array.from(tags).slice(0, 12)
  }

  private deriveLifecycleStage(input: {
    hadPaymentBefore: boolean
    amount: number
    level: MemberLevel
  }): NonNullable<MemberProfile['lifecycleStage']> {
    if (input.level === MemberLevel.Gold || input.level === MemberLevel.Platinum || input.level === MemberLevel.Diamond) {
      return 'vip-active'
    }
    if (input.hadPaymentBefore || input.amount >= 200) {
      return 'repeat-paid'
    }
    return 'newly-paid'
  }

  async recordPaymentActivity(input: {
    memberId: string
    tenantContext: RequestTenantContext
    orderId: string
    amount: number
    paidAt?: string
    channel?: string
    source?: 'cashier' | 'lyt-snapshot'
  }): Promise<MemberProfile> {
    const paidAt = input.paidAt ?? new Date().toISOString()
    const profile = (await this.getPersistentProfile(input.memberId, input.tenantContext)) ?? this.getProfile(input.memberId)
    if (!profile) {
      throw new Error(`Member ${input.memberId} not found`)
    }
    if (profile.tenantContext.tenantId !== input.tenantContext.tenantId) {
      throw new Error(`Member ${input.memberId} does not belong to tenant ${input.tenantContext.tenantId}`)
    }

    const hadPaymentBefore = Boolean(profile.lastPaymentAt)
    const nextLevel = computeMemberLevel(profile.points)
    const lifecycleStage = this.deriveLifecycleStage({
      hadPaymentBefore,
      amount: input.amount,
      level: nextLevel
    })
    const tags = this.mergeMemberTags(profile.tags, [
      'paid-member',
      lifecycleStage,
      input.amount >= 200 ? 'high-value-buyer' : 'standard-buyer',
      input.channel ? `channel-${input.channel}` : '',
      input.source ? `source-${input.source}` : ''
    ])

    const beforeProfile = { ...profile }
    const enriched: MemberProfile = {
      ...profile,
      level: nextLevel,
      lifecycleStage,
      tags,
      lastActiveAt: paidAt,
      lastPaymentAt: paidAt,
      lastPaymentAmount: input.amount,
      lastPaymentOrderId: input.orderId,
      lastPaymentChannel: input.channel
    }
    memberStore.set(enriched.memberId, enriched)
    const operationsResult = await this.enqueueOperationsTasks({
      memberId: enriched.memberId,
      tenantContext: input.tenantContext,
      source: 'payment-success',
      sourceOrderId: input.orderId,
      sourcePaymentId: input.orderId
    })
    await this.recordMemberMutationHistory({
      memberId: enriched.memberId,
      tenantContext: input.tenantContext,
      action: 'payment-activity-recorded',
      payload: {
        orderId: input.orderId,
        amount: input.amount,
        paidAt,
        channel: input.channel,
        source: input.source,
        queuedTasks: operationsResult.queuedTasks.length,
        existingTasks: operationsResult.existingTasks.length,
        executedReceipts: operationsResult.executedReceipts.length
      },
      beforeValue: {
        lastPaymentAt: beforeProfile.lastPaymentAt,
        lastPaymentAmount: beforeProfile.lastPaymentAmount,
        lifecycleStage: beforeProfile.lifecycleStage
      },
      afterValue: {
        lastPaymentAt: enriched.lastPaymentAt,
        lastPaymentAmount: enriched.lastPaymentAmount,
        lifecycleStage: enriched.lifecycleStage
      }
    })
    return enriched
  }

  async awardPoints(
    memberId: string,
    points: number,
    tenantContext: RequestTenantContext,
    approvalTicket?: string
  ): Promise<MemberProfile | MemberMutationApprovalResult> {
    if (points <= 0) {
      throw new Error('Points to add must be positive')
    }

    if (!this.prisma) {
      return this.addPoints(memberId, points)
    }

    const persistentProfile = await this.prisma.memberProfile.findUnique({
      where: { id: memberId }
    })
    if (!persistentProfile) {
      return this.addPoints(memberId, points)
    }
    if (persistentProfile.tenantId !== tenantContext.tenantId) {
      throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
    }
    if (points >= 5000) {
      const approval = await this.materializeMemberActionApproval({
        memberId,
        tenantContext,
        operation: 'member.points.award',
        approvalTicket,
        requestPayload: {
          memberId,
          points,
          approvalTicket: approvalTicket ?? null
        },
        summary: `会员高额加分 ${points} 待审批`
      })
      if (approval) {
        return approval
      }
    }

    const updated = await this.prisma.memberProfile.update({
      where: { id: memberId },
      data: {
        points: { increment: points },
        growthValue: { increment: points }
      }
    })
    const user = updated.userId
      ? await this.prisma.user.findUnique({
          where: { id: updated.userId }
        })
      : null
    const snapshot = await this.findSnapshotByMemberProfileId(memberId, tenantContext)
    const extension = await this.findMemberProfileExtension(memberId)

    const hydrated = this.hydratePersistentProfile({
      memberProfile: updated,
      user,
      tenantContext,
      snapshot,
      extension
    })
    await this.recordMemberMutationHistory({
      memberId,
      tenantContext,
      action: 'points-awarded',
      payload: { points },
      beforeValue: {
        points: persistentProfile.points,
        growthValue: persistentProfile.growthValue
      },
      afterValue: {
        points: hydrated.points,
        growthValue: hydrated.growthValue,
        level: hydrated.level
      }
    })
    return hydrated
  }

  async rollbackPoints(
    memberId: string,
    points: number,
    tenantContext: RequestTenantContext,
    approvalTicket?: string
  ): Promise<MemberProfile | MemberMutationApprovalResult> {
    if (points <= 0) {
      throw new Error('Points to revoke must be positive')
    }

    if (!this.prisma) {
      return this.revokePoints(memberId, points)
    }

    const persistentProfile = await this.prisma.memberProfile.findUnique({
      where: { id: memberId }
    })
    if (!persistentProfile) {
      return this.revokePoints(memberId, points)
    }
    if (persistentProfile.tenantId !== tenantContext.tenantId) {
      throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
    }
    if (points >= 1000) {
      const approval = await this.materializeMemberActionApproval({
        memberId,
        tenantContext,
        operation: 'member.points.rollback',
        approvalTicket,
        requestPayload: {
          memberId,
          points,
          approvalTicket: approvalTicket ?? null
        },
        summary: `会员高风险扣分 ${points} 待审批`
      })
      if (approval) {
        return approval
      }
    }

    const updated = await this.prisma.memberProfile.update({
      where: { id: memberId },
      data: {
        points: Math.max(0, persistentProfile.points - points),
        growthValue: Math.max(0, persistentProfile.growthValue - points)
      }
    })
    const user = updated.userId
      ? await this.prisma.user.findUnique({
          where: { id: updated.userId }
        })
      : null
    const snapshot = await this.findSnapshotByMemberProfileId(memberId, tenantContext)
    const extension = await this.findMemberProfileExtension(memberId)

    const hydrated = this.hydratePersistentProfile({
      memberProfile: updated,
      user,
      tenantContext,
      snapshot,
      extension
    })
    await this.recordMemberMutationHistory({
      memberId,
      tenantContext,
      action: 'points-rolled-back',
      payload: { points },
      beforeValue: {
        points: persistentProfile.points,
        growthValue: persistentProfile.growthValue
      },
      afterValue: {
        points: hydrated.points,
        growthValue: hydrated.growthValue,
        level: hydrated.level
      }
    })
    return hydrated
  }

  async updatePersistentStatus(
    memberId: string,
    status: MemberStatus,
    tenantContext: RequestTenantContext,
    approvalTicket?: string
  ): Promise<MemberProfile | MemberMutationApprovalResult> {
    if (!this.prisma) {
      const profile = this.getProfile(memberId)
      if (!profile) {
        throw new Error(`Member ${memberId} not found`)
      }
      if (profile.tenantContext.tenantId !== tenantContext.tenantId) {
        throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
      }
      const previousStatus = profile.status
      profile.status = status
      profile.lastActiveAt = new Date().toISOString()
      memberStore.set(memberId, profile)
      await this.recordMemberMutationHistory({
        memberId,
        tenantContext,
        action: 'status-updated',
        payload: { status },
        beforeValue: { status: previousStatus },
        afterValue: { status }
      })
      return profile
    }

    const memberProfile = await this.prisma.memberProfile.findUnique({
      where: { id: memberId }
    })
    if (!memberProfile) {
      throw new Error(`Persistent member ${memberId} not found`)
    }
    if (memberProfile.tenantId !== tenantContext.tenantId) {
      throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
    }
    if (status === MemberStatus.Blacklisted) {
      const approval = await this.materializeMemberActionApproval({
        memberId,
        tenantContext,
        operation: 'member.status.update',
        approvalTicket,
        requestPayload: {
          memberId,
          status,
          approvalTicket: approvalTicket ?? null
        },
        summary: `会员拉黑操作待审批`
      })
      if (approval) {
        return approval
      }
    }
    const user = memberProfile.userId
      ? await this.prisma.user.findUnique({
          where: { id: memberProfile.userId }
        })
      : null
    const extension = await this.findMemberProfileExtension(memberId)
    const current = this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext,
      snapshot: await this.findSnapshotByMemberProfileId(memberId, tenantContext),
      extension
    })
    const snapshot = await this.savePersistentSnapshotOverride({
      profile: current,
      tenantContext,
      status
    })
    const hydrated = this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext,
      snapshot,
      extension
    })
    await this.recordMemberMutationHistory({
      memberId,
      tenantContext,
      action: 'status-updated',
      payload: { status },
      beforeValue: { status: current.status },
      afterValue: { status: hydrated.status }
    })
    return hydrated
  }

  async overridePersistentLevel(
    memberId: string,
    level: MemberLevel,
    tenantContext: RequestTenantContext,
    approvalTicket?: string
  ): Promise<MemberProfile | MemberMutationApprovalResult> {
    if (!this.prisma) {
      const profile = this.getProfile(memberId)
      if (!profile) {
        throw new Error(`Member ${memberId} not found`)
      }
      if (profile.tenantContext.tenantId !== tenantContext.tenantId) {
        throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
      }
      const previousLevel = profile.level
      profile.level = level
      profile.lastActiveAt = new Date().toISOString()
      memberStore.set(memberId, profile)
      await this.recordMemberMutationHistory({
        memberId,
        tenantContext,
        action: 'level-updated',
        payload: { level },
        beforeValue: { level: previousLevel },
        afterValue: { level }
      })
      return profile
    }

    const memberProfile = await this.prisma.memberProfile.findUnique({
      where: { id: memberId }
    })
    if (!memberProfile) {
      throw new Error(`Persistent member ${memberId} not found`)
    }
    if (memberProfile.tenantId !== tenantContext.tenantId) {
      throw new Error(`Member ${memberId} does not belong to tenant ${tenantContext.tenantId}`)
    }
    const user = memberProfile.userId
      ? await this.prisma.user.findUnique({
          where: { id: memberProfile.userId }
        })
      : null
    const extension = await this.findMemberProfileExtension(memberId)
    const current = this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext,
      snapshot: await this.findSnapshotByMemberProfileId(memberId, tenantContext),
      extension
    })
    if (this.levelRank(level) < this.levelRank(current.level)) {
      const approval = await this.materializeMemberActionApproval({
        memberId,
        tenantContext,
        operation: 'member.level.override',
        approvalTicket,
        requestPayload: {
          memberId,
          currentLevel: current.level,
          targetLevel: level,
          approvalTicket: approvalTicket ?? null
        },
        summary: `会员手工降级 ${current.level} -> ${level} 待审批`
      })
      if (approval) {
        return approval
      }
    }
    const snapshot = await this.savePersistentSnapshotOverride({
      profile: current,
      tenantContext,
      level
    })
    const hydrated = this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext,
      snapshot,
      extension
    })
    await this.recordMemberMutationHistory({
      memberId,
      tenantContext,
      action: 'level-updated',
      payload: { level },
      beforeValue: { level: current.level },
      afterValue: { level: hydrated.level }
    })
    return hydrated
  }

  /**
   * 检查会员是否可升级
   */
  checkUpgrade(memberId: string): {
    canUpgrade: boolean
    currentLevel: MemberLevel
    nextLevel: MemberLevel | null
    pointsNeeded: number
  } {
    const profile = memberStore.get(memberId)
    if (!profile) {
      throw new Error(`Member ${memberId} not found`)
    }

    const upgradeable = canUpgrade(profile.level, profile.points)
    const levels = Object.values(MemberLevel)
    const currentIdx = levels.indexOf(profile.level)
    const nextLevel = currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null
    const pointsNeeded = nextLevel
      ? MEMBER_LEVEL_THRESHOLDS[nextLevel] - profile.points
      : 0

    return {
      canUpgrade: upgradeable,
      currentLevel: profile.level,
      nextLevel: upgradeable ? nextLevel : null,
      pointsNeeded: upgradeable ? Math.max(0, pointsNeeded) : 0
    }
  }

  async registerPersistent(input: {
    tenantContext: RequestTenantContext
    mobile: string
    nickname: string
    initialPoints?: number
  }): Promise<MemberProfile> {
    if (!this.prisma) {
      return this.register({
        memberId: input.mobile,
        tenantContext: input.tenantContext,
        nickname: input.nickname
      })
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { mobile: input.mobile }
    })
    if (existingUser && existingUser.tenantId !== input.tenantContext.tenantId) {
      throw new Error(`Mobile ${input.mobile} already belongs to another tenant`)
    }

    const user =
      existingUser ??
      (await this.prisma.user.create({
        data: {
          tenantId: input.tenantContext.tenantId,
          mobile: input.mobile,
          role: 'MEMBER'
        }
      }))

    const existingProfile = await this.prisma.memberProfile.findFirst({
      where: {
        tenantId: input.tenantContext.tenantId,
        userId: user.id
      }
    })
    if (existingProfile) {
      const extension = await this.findMemberProfileExtension(existingProfile.id)
      const hydrated = this.hydratePersistentProfile({
        memberProfile: existingProfile,
        user,
        tenantContext: input.tenantContext,
        extension
      })
      memberStore.set(hydrated.memberId, { ...hydrated, nickname: input.nickname })
      return { ...hydrated, nickname: input.nickname }
    }

    const persisted = await this.prisma.memberProfile.create({
      data: {
        tenantId: input.tenantContext.tenantId,
        userId: user.id,
        points: input.initialPoints ?? 0,
        growthValue: input.initialPoints ?? 0,
        svipStatus: 'INACTIVE'
      }
    })

    const profile = this.toMemberProfile({
      memberId: persisted.id,
      userId: user.id,
      tenantContext: input.tenantContext,
      mobile: user.mobile,
      nickname: input.nickname,
      points: persisted.points,
      growthValue: persisted.growthValue,
      svipStatus: persisted.svipStatus,
      registeredAt: persisted.createdAt.toISOString(),
      lastActiveAt: persisted.updatedAt.toISOString(),
      source: 'prisma',
      persisted: true
    })
    memberStore.set(profile.memberId, profile)
    return profile
  }

  async getPersistentProfile(memberId: string, tenantContext: RequestTenantContext): Promise<MemberProfile | undefined> {
    if (!this.prisma) {
      return this.getProfile(memberId)
    }

    const memberProfile = await this.prisma.memberProfile.findUnique({
      where: { id: memberId }
    })
    if (!memberProfile || memberProfile.tenantId !== tenantContext.tenantId) {
      return undefined
    }

    const user = memberProfile.userId
      ? await this.prisma.user.findUnique({
          where: { id: memberProfile.userId }
        })
      : null
    const snapshot = await this.findSnapshotByMemberProfileId(memberProfile.id, tenantContext)
    const extension = await this.findMemberProfileExtension(memberProfile.id)

    return this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext,
      snapshot,
      extension
    })
  }

  async updatePersistentProfile(input: {
    memberId: string
    tenantContext: RequestTenantContext
    nickname: string
    mobile: string
    email?: string
    address?: string
    notes?: string
  }): Promise<MemberProfile> {
    const nickname = input.nickname.trim()
    const mobile = input.mobile.trim()
    const email = this.normalizeSnapshotString(input.email)
    const address = this.normalizeSnapshotString(input.address)
    const notes = this.normalizeSnapshotString(input.notes)
    if (!nickname) {
      throw new Error('Nickname is required')
    }
    if (!mobile) {
      throw new Error('Mobile is required')
    }

    if (!this.prisma) {
      const profile = this.getProfile(input.memberId)
      if (!profile) {
        throw new Error(`Member ${input.memberId} not found`)
      }
      if (profile.tenantContext.tenantId !== input.tenantContext.tenantId) {
        throw new Error(`Member ${input.memberId} does not belong to tenant ${input.tenantContext.tenantId}`)
      }
      const beforeValue = {
        nickname: profile.nickname,
        mobile: profile.mobile,
        email: profile.email,
        address: profile.address,
        notes: profile.notes
      }
      profile.nickname = nickname
      profile.mobile = mobile
      profile.email = email
      profile.address = address
      profile.notes = notes
      profile.lastActiveAt = new Date().toISOString()
      memberStore.set(input.memberId, profile)
      await this.recordMemberMutationHistory({
        memberId: input.memberId,
        tenantContext: input.tenantContext,
        action: 'profile-updated',
        payload: { nickname, mobile, email, address, notes },
        beforeValue,
        afterValue: {
          nickname: profile.nickname,
          mobile: profile.mobile,
          email: profile.email,
          address: profile.address,
          notes: profile.notes
        }
      })
      return profile
    }

    const memberProfile = await this.prisma.memberProfile.findUnique({
      where: { id: input.memberId }
    })
    if (!memberProfile) {
      throw new Error(`Persistent member ${input.memberId} not found`)
    }
    if (memberProfile.tenantId !== input.tenantContext.tenantId) {
      throw new Error(`Member ${input.memberId} does not belong to tenant ${input.tenantContext.tenantId}`)
    }

    let user = memberProfile.userId
      ? await this.prisma.user.findUnique({
          where: { id: memberProfile.userId }
        })
      : null
    const previousMobile = user?.mobile
    const currentSnapshot = await this.findSnapshotByMemberProfileId(input.memberId, input.tenantContext)
    const currentExtension = await this.findMemberProfileExtension(input.memberId)
    const beforeProfile = this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext: input.tenantContext,
      snapshot: currentSnapshot,
      extension: currentExtension
    })

    if (previousMobile !== mobile) {
      const existingUser = await this.prisma.user.findUnique({
        where: { mobile }
      })
      if (existingUser && existingUser.tenantId !== input.tenantContext.tenantId) {
        throw new Error(`Mobile ${mobile} already belongs to another tenant`)
      }
      if (existingUser) {
        user = existingUser
      } else if (user?.id && typeof this.prisma.user.update === 'function') {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { mobile }
        })
      } else {
        user = await this.prisma.user.create({
          data: {
            tenantId: input.tenantContext.tenantId,
            mobile,
            role: 'MEMBER'
          }
        })
      }
    }

    const updatedMemberProfile =
      user?.id !== memberProfile.userId
        ? await this.prisma.memberProfile.update({
            where: { id: input.memberId },
            data: {
              userId: user?.id ?? memberProfile.userId
            }
          })
        : memberProfile

    const snapshot = await this.savePersistentSnapshotOverride({
      profile: {
        ...beforeProfile,
        userId: user?.id ?? beforeProfile.userId,
        nickname,
        mobile
      },
      tenantContext: input.tenantContext,
      nickname,
      mobile
    })
    const extension = await this.saveMemberProfileExtension({
      memberId: input.memberId,
      tenantContext: input.tenantContext,
      email,
      address,
      notes
    })

    const hydrated = this.hydratePersistentProfile({
      memberProfile: updatedMemberProfile,
      user,
      tenantContext: input.tenantContext,
      snapshot,
      extension
    })
    await this.recordMemberMutationHistory({
      memberId: input.memberId,
      tenantContext: input.tenantContext,
      action: 'profile-updated',
      payload: { nickname, mobile, email, address, notes },
      beforeValue: {
        nickname: beforeProfile.nickname,
        mobile: beforeProfile.mobile,
        email: beforeProfile.email,
        address: beforeProfile.address,
        notes: beforeProfile.notes
      },
      afterValue: {
        nickname: hydrated.nickname,
        mobile: hydrated.mobile,
        email: hydrated.email,
        address: hydrated.address,
        notes: hydrated.notes
      }
    })
    memberStore.set(hydrated.memberId, hydrated)
    return hydrated
  }

  async getOperationsProfile(
    memberId: string,
    tenantContext: RequestTenantContext
  ): Promise<MemberOperationsProfile | undefined> {
    const profile =
      (await this.getPersistentProfile(memberId, tenantContext)) ?? this.getProfile(memberId)
    if (!profile) {
      return undefined
    }
    if (profile.tenantContext.tenantId !== tenantContext.tenantId) {
      return undefined
    }
    return this.buildOperationsProfile(profile)
  }

  async enqueueOperationsTasks(input: {
    memberId: string
    tenantContext: RequestTenantContext
    source: MemberOperationsTask['source']
    sourceOrderId?: string
    sourcePaymentId?: string
  }): Promise<{
    profile: MemberOperationsProfile
    queuedTasks: MemberOperationsTask[]
    existingTasks: MemberOperationsTask[]
    executedReceipts: MemberOperationsExecutionReceipt[]
  }> {
    const profile = await this.getOperationsProfile(input.memberId, input.tenantContext)
    if (!profile) {
      throw new Error(`Member operations profile ${input.memberId} not found`)
    }

    const now = new Date().toISOString()
    const queuedTasks: MemberOperationsTask[] = []
    const existingTasks: MemberOperationsTask[] = []
    const executedReceipts: MemberOperationsExecutionReceipt[] = []

    for (const action of profile.recommendedActions) {
      const dedupeKey = [
        input.tenantContext.tenantId,
        input.memberId,
        input.source,
        input.sourceOrderId ?? 'no-order',
        action.code
      ].join(':')

      const existing = await this.findOperationsTaskByDedupeKey(dedupeKey)
      if (existing) {
        existingTasks.push(existing)
        continue
      }

      const task: MemberOperationsTask = {
        taskId: `ops-task-${randomBytes(6).toString('hex')}`,
        tenantContext: input.tenantContext,
        memberId: input.memberId,
        actionCode: action.code,
        title: action.label,
        reason: action.reason,
        channel: action.channel,
        priority: action.priority,
        status: 'queued',
        executionLane: this.resolveExecutionLane(action.channel),
        source: input.source,
        sourceOrderId: input.sourceOrderId,
        sourcePaymentId: input.sourcePaymentId,
        dedupeKey,
        createdAt: now,
        scheduledAt: now
      }
      await this.createOperationsTask(task)
      const receipt = await this.executeOperationsTask(task, profile)
      const storedTask = (await this.findOperationsTaskByDedupeKey(dedupeKey)) ?? task
      queuedTasks.push(storedTask)
      if (receipt) {
        executedReceipts.push(receipt)
      }
    }

    return {
      profile,
      queuedTasks,
      existingTasks,
      executedReceipts
    }
  }

  async listOperationsTasks(
    memberId: string,
    tenantContext: RequestTenantContext
  ): Promise<MemberOperationsTask[]> {
    const profile =
      (await this.getPersistentProfile(memberId, tenantContext)) ?? this.getProfile(memberId)
    if (!profile || profile.tenantContext.tenantId !== tenantContext.tenantId) {
      return []
    }
    return this.listOperationsTasksForMember(memberId, tenantContext.tenantId)
  }

  async listOperationsReceipts(
    memberId: string,
    tenantContext: RequestTenantContext
  ): Promise<MemberOperationsExecutionReceipt[]> {
    const profile =
      (await this.getPersistentProfile(memberId, tenantContext)) ?? this.getProfile(memberId)
    if (!profile || profile.tenantContext.tenantId !== tenantContext.tenantId) {
      return []
    }
    return this.listOperationsReceiptsForMember(memberId, tenantContext.tenantId)
  }

  async getOperationsRuntimeReceipt(
    memberId: string,
    executionId: string,
    tenantContext: RequestTenantContext
  ) {
    const receipt = (await this.listOperationsReceiptsForMember(memberId, tenantContext.tenantId)).find(
      (entry) => entry.executionId === executionId
    )
    if (!receipt || !receipt.runtimeReceiptCode || !this.runtimeGovernanceService) {
      return undefined
    }
    return this.runtimeGovernanceService.getActionReceipt(receipt.runtimeReceiptCode)
  }

  async replayOperationsExecution(
    memberId: string,
    executionId: string,
    tenantContext: RequestTenantContext
  ) {
    const receipt = (await this.listOperationsReceiptsForMember(memberId, tenantContext.tenantId)).find(
      (entry) => entry.executionId === executionId
    )
    if (!receipt || !receipt.runtimeReceiptCode || !this.runtimeGovernanceService) {
      return undefined
    }

    const current = await this.runtimeGovernanceService.getActionReceipt(receipt.runtimeReceiptCode)
    return this.runtimeGovernanceService.replayAction(receipt.runtimeReceiptCode, {
      ledgerKey: current.ledger.ledgerKey,
      requestedFrom: 'ADMIN_WEB_RUNTIME',
      ticketCode: current.ticket.ticketCode,
      idempotencyKey: `member-operations:${executionId}:replay:${randomBytes(4).toString('hex')}`,
      tenantId: tenantContext.tenantId,
      actorId: 'member-operations-operator'
    })
  }

  async listPersistentProfiles(tenantContext: RequestTenantContext): Promise<MemberProfile[]> {
    if (!this.prisma) {
      return this.listProfiles()
    }

    const profiles = await this.prisma.memberProfile.findMany({
      where: { tenantId: tenantContext.tenantId },
      orderBy: [{ createdAt: 'desc' }],
      take: 100
    })

    const results: MemberProfile[] = []
    for (const memberProfile of profiles) {
      const user = memberProfile.userId
        ? await this.prisma.user.findUnique({
            where: { id: memberProfile.userId }
          })
        : null
      const snapshot = await this.findSnapshotByMemberProfileId(memberProfile.id, tenantContext)
      const extension = await this.findMemberProfileExtension(memberProfile.id)
      results.push(
        this.hydratePersistentProfile({
          memberProfile,
          user,
          tenantContext,
          snapshot,
          extension
        })
      )
    }
    return results
  }

  async getLytMemberSnapshot(
    externalMemberId: string,
    tenantContext: RequestTenantContext
  ): Promise<LytMemberSnapshot | undefined> {
    const snapshotModel = this.getLytMemberSnapshotModel()
    if (!snapshotModel?.findUnique) {
      return lytMemberSnapshotStore.get(this.getLytSnapshotCacheKey(tenantContext.tenantId, externalMemberId))
    }

    const record = await snapshotModel.findUnique({
      where: {
        tenantId_externalMemberId: {
          tenantId: tenantContext.tenantId,
          externalMemberId
        }
      }
    })

    if (!record) {
      return undefined
    }

    return this.toLytMemberSnapshot({
      snapshotId: String(record.id),
      tenantContext: {
        tenantId: String(record.tenantId),
        brandId: this.normalizeSnapshotString(record.brandId),
        storeId: this.normalizeSnapshotString(record.storeId),
        marketCode: tenantContext.marketCode
      },
      memberProfileId: this.normalizeSnapshotString(record.memberProfileId),
      externalMemberId: String(record.externalMemberId),
      memberCode: this.normalizeSnapshotString(record.memberCode),
      mobile: this.normalizeSnapshotString(record.mobile),
      nickname: this.normalizeSnapshotString(record.nickname),
      levelCode: this.normalizeSnapshotString(record.levelCode),
      points: this.normalizeSnapshotNumber(record.points),
      growthValue: this.normalizeSnapshotNumber(record.growthValue),
      status: this.normalizeSnapshotString(record.status) ?? 'ACTIVE',
      updatedAtFromSource:
        record.updatedAtFromSource instanceof Date
          ? record.updatedAtFromSource.toISOString()
          : String(record.updatedAtFromSource),
      rawVersion: this.normalizeSnapshotString(record.rawVersion),
      rawPayload:
        record.rawPayload && typeof record.rawPayload === 'object'
          ? (record.rawPayload as Record<string, unknown>)
          : undefined,
      source: 'prisma'
    })
  }

  async listLytMemberSnapshots(tenantContext: RequestTenantContext): Promise<LytMemberSnapshot[]> {
    const snapshotModel = this.getLytMemberSnapshotModel()
    if (!snapshotModel?.findMany) {
      return Array.from(lytMemberSnapshotStore.values()).filter(
        (item) => item.tenantContext.tenantId === tenantContext.tenantId
      )
    }

    const records = await snapshotModel.findMany({
      where: { tenantId: tenantContext.tenantId },
      orderBy: [{ updatedAtFromSource: 'desc' }],
      take: 100
    })

    return records.map((record) =>
      this.toLytMemberSnapshot({
        snapshotId: String(record.id),
        tenantContext: {
          tenantId: String(record.tenantId),
          brandId: this.normalizeSnapshotString(record.brandId),
          storeId: this.normalizeSnapshotString(record.storeId),
          marketCode: tenantContext.marketCode
        },
        memberProfileId: this.normalizeSnapshotString(record.memberProfileId),
        externalMemberId: String(record.externalMemberId),
        memberCode: this.normalizeSnapshotString(record.memberCode),
        mobile: this.normalizeSnapshotString(record.mobile),
        nickname: this.normalizeSnapshotString(record.nickname),
        levelCode: this.normalizeSnapshotString(record.levelCode),
        points: this.normalizeSnapshotNumber(record.points),
        growthValue: this.normalizeSnapshotNumber(record.growthValue),
        status: this.normalizeSnapshotString(record.status) ?? 'ACTIVE',
        updatedAtFromSource:
          record.updatedAtFromSource instanceof Date
            ? record.updatedAtFromSource.toISOString()
            : String(record.updatedAtFromSource),
        rawVersion: this.normalizeSnapshotString(record.rawVersion),
        rawPayload:
          record.rawPayload && typeof record.rawPayload === 'object'
            ? (record.rawPayload as Record<string, unknown>)
            : undefined,
        source: 'prisma'
      })
    )
  }

  async syncLytMemberSnapshot(input: {
    tenantContext: RequestTenantContext
    externalMemberId: string
    memberCode?: string
    mobile?: string
    nickname?: string
    levelCode?: string
    points?: number
    growthValue?: number
    status?: string
    updatedAt?: string
    rawVersion?: string
    rawPayload?: Record<string, unknown>
  }): Promise<{ snapshot: LytMemberSnapshot; profile: MemberProfile }> {
    const updatedAtFromSource = input.updatedAt ?? new Date().toISOString()
    const points = Math.max(0, this.normalizeSnapshotNumber(input.points))
    const growthValue = Math.max(0, this.normalizeSnapshotNumber(input.growthValue, points))
    const status = this.normalizeSnapshotString(input.status) ?? MemberStatus.Active
    const snapshotKey = this.getLytSnapshotCacheKey(input.tenantContext.tenantId, input.externalMemberId)

    if (!this.prisma) {
      const existing = memberStore.get(input.externalMemberId)
      const profile =
        existing ??
        this.register({
          memberId: input.externalMemberId,
          tenantContext: input.tenantContext,
          nickname: input.nickname ?? input.memberCode ?? input.externalMemberId
        })
      profile.mobile = input.mobile ?? profile.mobile
      profile.nickname = input.nickname ?? profile.nickname
      profile.points = points
      profile.growthValue = growthValue
      profile.status = status as MemberStatus
      profile.level = computeMemberLevel(points)
      profile.lastActiveAt = updatedAtFromSource
      profile.persisted = false
      profile.source = 'memory'
      memberStore.set(profile.memberId, profile)

      const snapshot = this.toLytMemberSnapshot({
        snapshotId: `lyt-member-snapshot-${Date.now()}`,
        tenantContext: input.tenantContext,
        memberProfileId: profile.memberId,
        externalMemberId: input.externalMemberId,
        memberCode: input.memberCode,
        mobile: input.mobile,
        nickname: input.nickname,
        levelCode: input.levelCode,
        points,
        growthValue,
        status,
        updatedAtFromSource,
        rawVersion: input.rawVersion,
        rawPayload: input.rawPayload,
        source: 'memory'
      })
      lytMemberSnapshotStore.set(snapshotKey, snapshot)
      return { snapshot, profile }
    }

    const snapshotModel = this.getLytMemberSnapshotModel()
    const existingSnapshot =
      (await this.getLytMemberSnapshot(input.externalMemberId, input.tenantContext)) ?? undefined
    const normalizedMobile = input.mobile
    const user = normalizedMobile
      ? await (async () => {
          const existingUser = await this.prisma!.user.findUnique({
            where: { mobile: normalizedMobile }
          })
          if (existingUser && existingUser.tenantId !== input.tenantContext.tenantId) {
            throw new Error(`Mobile ${normalizedMobile} already belongs to another tenant`)
          }
          if (existingUser) {
            return existingUser
          }
          return this.prisma!.user.create({
            data: {
              tenantId: input.tenantContext.tenantId,
              mobile: normalizedMobile,
              role: 'MEMBER'
            }
          })
        })()
      : null

    let memberProfile =
      existingSnapshot?.memberProfileId
        ? await this.prisma.memberProfile.findUnique({
            where: { id: existingSnapshot.memberProfileId }
          })
        : null

    if (!memberProfile && user) {
      memberProfile = await this.prisma.memberProfile.findFirst({
        where: {
          tenantId: input.tenantContext.tenantId,
          userId: user.id
        }
      })
    }

    if (!memberProfile) {
      memberProfile = await this.prisma.memberProfile.create({
        data: {
          tenantId: input.tenantContext.tenantId,
          userId: user?.id,
          points,
          growthValue,
          svipStatus: 'INACTIVE'
        }
      })
    } else {
      memberProfile = await this.prisma.memberProfile.update({
        where: { id: memberProfile.id },
        data: {
          userId: user?.id ?? memberProfile.userId,
          points,
          growthValue
        }
      })
    }

    let snapshot: LytMemberSnapshot
    if (snapshotModel?.upsert) {
      const record = await snapshotModel.upsert({
        where: {
          tenantId_externalMemberId: {
            tenantId: input.tenantContext.tenantId,
            externalMemberId: input.externalMemberId
          }
        },
        create: {
          tenantId: input.tenantContext.tenantId,
          brandId: input.tenantContext.brandId,
          storeId: input.tenantContext.storeId,
          memberProfileId: memberProfile.id,
          externalMemberId: input.externalMemberId,
          memberCode: input.memberCode,
          mobile: input.mobile,
          nickname: input.nickname,
          levelCode: input.levelCode,
          points,
          growthValue,
          status,
          updatedAtFromSource: new Date(updatedAtFromSource),
          rawVersion: input.rawVersion,
          rawPayload: input.rawPayload
        },
        update: {
          brandId: input.tenantContext.brandId,
          storeId: input.tenantContext.storeId,
          memberProfileId: memberProfile.id,
          memberCode: input.memberCode,
          mobile: input.mobile,
          nickname: input.nickname,
          levelCode: input.levelCode,
          points,
          growthValue,
          status,
          updatedAtFromSource: new Date(updatedAtFromSource),
          rawVersion: input.rawVersion,
          rawPayload: input.rawPayload
        }
      })
      snapshot = this.toLytMemberSnapshot({
        snapshotId: String(record.id),
        tenantContext: input.tenantContext,
        memberProfileId: memberProfile.id,
        externalMemberId: input.externalMemberId,
        memberCode: input.memberCode,
        mobile: input.mobile,
        nickname: input.nickname,
        levelCode: input.levelCode,
        points,
        growthValue,
        status,
        updatedAtFromSource,
        rawVersion: input.rawVersion,
        rawPayload: input.rawPayload,
        source: 'prisma'
      })
    } else {
      snapshot = this.toLytMemberSnapshot({
        snapshotId: existingSnapshot?.snapshotId ?? `lyt-member-snapshot-${Date.now()}`,
        tenantContext: input.tenantContext,
        memberProfileId: memberProfile.id,
        externalMemberId: input.externalMemberId,
        memberCode: input.memberCode,
        mobile: input.mobile,
        nickname: input.nickname,
        levelCode: input.levelCode,
        points,
        growthValue,
        status,
        updatedAtFromSource,
        rawVersion: input.rawVersion,
        rawPayload: input.rawPayload,
        source: 'memory'
      })
    }
    lytMemberSnapshotStore.set(snapshotKey, snapshot)

    const profile = this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext: input.tenantContext,
      snapshot
    })
    memberStore.set(profile.memberId, profile)

    return { snapshot, profile }
  }

  async login(input: { tenantContext: RequestTenantContext; mobile: string }): Promise<MemberLoginResult> {
    if (!this.prisma) {
      throw new Error('Persistent member login requires PrismaService')
    }

    const user = await this.prisma.user.findUnique({
      where: { mobile: input.mobile }
    })
    if (!user || user.tenantId !== input.tenantContext.tenantId) {
      throw new Error(`Member account for mobile ${input.mobile} not found`)
    }

    let memberProfile = await this.prisma.memberProfile.findFirst({
      where: {
        tenantId: input.tenantContext.tenantId,
        userId: user.id
      }
    })
    if (!memberProfile) {
      memberProfile = await this.prisma.memberProfile.create({
        data: {
          tenantId: input.tenantContext.tenantId,
          userId: user.id,
          points: 0,
          growthValue: 0,
          svipStatus: 'INACTIVE'
        }
      })
    }

    const member = this.hydratePersistentProfile({
      memberProfile,
      user,
      tenantContext: input.tenantContext
    })
    const issuedAt = new Date()
    const expiresAt = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    const session: MemberSession = {
      sessionToken: randomBytes(24).toString('hex'),
      memberId: member.memberId,
      userId: user.id,
      tenantId: input.tenantContext.tenantId,
      brandId: input.tenantContext.brandId,
      storeId: input.tenantContext.storeId,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      authenticated: true
    }
    memberSessionStore.set(session.sessionToken, session)

    return {
      member,
      session
    }
  }

  getSession(sessionToken: string): MemberSession | undefined {
    return memberSessionStore.get(sessionToken)
  }
}
