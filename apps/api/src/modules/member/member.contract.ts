import type { RequestTenantContext } from '../tenant/tenant.types'
import type {
  MemberLevel,
  MemberProfile,
  MemberStatus,
  MemberBootstrap,
  MemberSession,
  MemberLoginResult,
  MemberOperationsProfile,
  MemberOperationsTask,
  MemberOperationsExecutionReceipt,
  MemberOperationsAction,
  MemberAutomationTrigger,
  LytMemberSnapshot,
  MemberProfileMutationHistoryEntry,
  MemberMutationApprovalResult
} from './member.entity'

// ── Contract interfaces ──

export interface MemberProfileContract {
  memberId: string
  tenantContext: RequestTenantContext
  mobile?: string
  nickname: string
  email?: string
  address?: string
  notes?: string
  level: MemberLevel
  status: MemberStatus
  points: number
  growthValue?: number
  svipStatus?: string
  registeredAt: string
  lastActiveAt?: string
  lifecycleStage?: string
  tags?: string[]
  lastPaymentAt?: string
  lastPaymentAmount?: number
  lastPaymentOrderId?: string
  lastPaymentChannel?: string
  source?: string
  persisted?: boolean
}

export interface MemberBootstrapContract {
  tenantContext: RequestTenantContext
  capabilities: string[]
  phase: string
}

export interface MemberSessionContract {
  sessionToken: string
  memberId: string
  userId: string
  tenantId: string
  brandId?: string
  storeId?: string
  issuedAt: string
  expiresAt: string
  authenticated: boolean
}

export interface MemberLoginResultContract {
  member: MemberProfileContract
  session: MemberSessionContract
}

export interface MemberOperationsProfileContract {
  memberId: string
  tenantContext: RequestTenantContext
  level: MemberLevel
  status: MemberStatus
  lifecycleStage: string
  audienceSegments: string[]
  recommendedActions: MemberOperationsActionContract[]
  automationTriggers: MemberAutomationTriggerContract[]
  lastPaymentAt?: string
  lastPaymentAmount?: number
  lastPaymentChannel?: string
  tags: string[]
  source?: string
}

export interface MemberOperationsActionContract {
  code: string
  label: string
  reason: string
  channel: string
  priority: string
}

export interface MemberAutomationTriggerContract {
  code: string
  status: string
  source: string
  reason: string
}

export interface MemberOperationsTaskContract {
  taskId: string
  tenantContext: RequestTenantContext
  memberId: string
  actionCode: string
  title: string
  reason: string
  channel: string
  priority: string
  status: string
  executionLane: string
  source: string
  sourceOrderId?: string
  sourcePaymentId?: string
  executionSummary?: string
  executionTargetId?: string
  executedAt?: string
  dedupeKey: string
  createdAt: string
  scheduledAt: string
}

export interface MemberOperationsExecutionReceiptContract {
  executionId: string
  tenantContext: RequestTenantContext
  memberId: string
  taskId: string
  actionCode: string
  targetType: string
  targetId: string
  status: string
  summary: string
  payload: Record<string, unknown>
  runtimeReceiptCode?: string
  runtimeState?: string
  runtimeReplayable?: boolean
  executedAt: string
}

export interface MemberProfileMutationHistoryContract {
  historyId: string
  tenantContext: RequestTenantContext
  memberId: string
  action: string
  summary: string
  sourceChannel: string
  operatorId: string
  payload?: Record<string, unknown>
  beforeValue?: Record<string, unknown>
  afterValue?: Record<string, unknown>
  createdAt: string
}

export interface MemberMutationApprovalResultContract {
  memberId: string
  applied: boolean
  approvalRequired: boolean
  approvalTicket: string | null
  approvalStatus: string
  operation: string
  summary: string
}

export interface LytMemberSnapshotContract {
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
  source?: string
}

// ── Conversion functions ──

export function toMemberProfileContract(profile: MemberProfile): MemberProfileContract {
  return {
    memberId: profile.memberId,
    tenantContext: profile.tenantContext,
    mobile: profile.mobile,
    nickname: profile.nickname,
    email: profile.email,
    address: profile.address,
    notes: profile.notes,
    level: profile.level,
    status: profile.status,
    points: profile.points,
    growthValue: profile.growthValue,
    svipStatus: profile.svipStatus,
    registeredAt: profile.registeredAt,
    lastActiveAt: profile.lastActiveAt,
    lifecycleStage: profile.lifecycleStage,
    tags: profile.tags ? [...profile.tags] : undefined,
    lastPaymentAt: profile.lastPaymentAt,
    lastPaymentAmount: profile.lastPaymentAmount,
    lastPaymentOrderId: profile.lastPaymentOrderId,
    lastPaymentChannel: profile.lastPaymentChannel,
    source: profile.source,
    persisted: profile.persisted
  }
}

export function toMemberBootstrapContract(bootstrap: MemberBootstrap): MemberBootstrapContract {
  return {
    tenantContext: bootstrap.tenantContext,
    capabilities: [...bootstrap.capabilities],
    phase: bootstrap.phase
  }
}

export function toMemberSessionContract(session: MemberSession): MemberSessionContract {
  return {
    sessionToken: session.sessionToken,
    memberId: session.memberId,
    userId: session.userId,
    tenantId: session.tenantId,
    brandId: session.brandId,
    storeId: session.storeId,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    authenticated: session.authenticated
  }
}

export function toMemberLoginResultContract(result: MemberLoginResult): MemberLoginResultContract {
  return {
    member: toMemberProfileContract(result.member),
    session: toMemberSessionContract(result.session)
  }
}

export function toMemberOperationsProfileContract(
  profile: MemberOperationsProfile
): MemberOperationsProfileContract {
  return {
    memberId: profile.memberId,
    tenantContext: profile.tenantContext,
    level: profile.level,
    status: profile.status,
    lifecycleStage: profile.lifecycleStage,
    audienceSegments: [...profile.audienceSegments],
    recommendedActions: profile.recommendedActions.map(toMemberOperationsActionContract),
    automationTriggers: profile.automationTriggers.map(toMemberAutomationTriggerContract),
    lastPaymentAt: profile.lastPaymentAt,
    lastPaymentAmount: profile.lastPaymentAmount,
    lastPaymentChannel: profile.lastPaymentChannel,
    tags: [...profile.tags],
    source: profile.source
  }
}

export function toMemberOperationsActionContract(
  action: MemberOperationsAction
): MemberOperationsActionContract {
  return {
    code: action.code,
    label: action.label,
    reason: action.reason,
    channel: action.channel,
    priority: action.priority
  }
}

export function toMemberAutomationTriggerContract(
  trigger: MemberAutomationTrigger
): MemberAutomationTriggerContract {
  return {
    code: trigger.code,
    status: trigger.status,
    source: trigger.source,
    reason: trigger.reason
  }
}

export function toMemberOperationsTaskContract(
  task: MemberOperationsTask
): MemberOperationsTaskContract {
  return {
    taskId: task.taskId,
    tenantContext: task.tenantContext,
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
    executedAt: task.executedAt,
    dedupeKey: task.dedupeKey,
    createdAt: task.createdAt,
    scheduledAt: task.scheduledAt
  }
}

export function toMemberOperationsExecutionReceiptContract(
  receipt: MemberOperationsExecutionReceipt
): MemberOperationsExecutionReceiptContract {
  return {
    executionId: receipt.executionId,
    tenantContext: receipt.tenantContext,
    memberId: receipt.memberId,
    taskId: receipt.taskId,
    actionCode: receipt.actionCode,
    targetType: receipt.targetType,
    targetId: receipt.targetId,
    status: receipt.status,
    summary: receipt.summary,
    payload: { ...receipt.payload },
    runtimeReceiptCode: receipt.runtimeReceiptCode,
    runtimeState: receipt.runtimeState,
    runtimeReplayable: receipt.runtimeReplayable,
    executedAt: receipt.executedAt
  }
}

export function toMemberProfileMutationHistoryContract(
  entry: MemberProfileMutationHistoryEntry
): MemberProfileMutationHistoryContract {
  return {
    historyId: entry.historyId,
    tenantContext: entry.tenantContext,
    memberId: entry.memberId,
    action: entry.action,
    summary: entry.summary,
    sourceChannel: entry.sourceChannel,
    operatorId: entry.operatorId,
    payload: entry.payload ? { ...entry.payload } : undefined,
    beforeValue: entry.beforeValue ? { ...entry.beforeValue } : undefined,
    afterValue: entry.afterValue ? { ...entry.afterValue } : undefined,
    createdAt: entry.createdAt
  }
}

export function toMemberMutationApprovalResultContract(
  result: MemberMutationApprovalResult
): MemberMutationApprovalResultContract {
  return {
    memberId: result.memberId,
    applied: result.applied,
    approvalRequired: result.approvalRequired,
    approvalTicket: result.approvalTicket,
    approvalStatus: result.approvalStatus,
    operation: result.operation,
    summary: result.summary
  }
}

export function toLytMemberSnapshotContract(
  snapshot: LytMemberSnapshot
): LytMemberSnapshotContract {
  return {
    snapshotId: snapshot.snapshotId,
    tenantContext: snapshot.tenantContext,
    memberProfileId: snapshot.memberProfileId,
    externalMemberId: snapshot.externalMemberId,
    memberCode: snapshot.memberCode,
    mobile: snapshot.mobile,
    nickname: snapshot.nickname,
    levelCode: snapshot.levelCode,
    points: snapshot.points,
    growthValue: snapshot.growthValue,
    status: snapshot.status,
    updatedAtFromSource: snapshot.updatedAtFromSource,
    rawVersion: snapshot.rawVersion,
    rawPayload: snapshot.rawPayload ? { ...snapshot.rawPayload } : undefined,
    source: snapshot.source
  }
}
