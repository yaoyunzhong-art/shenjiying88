import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * 会员等级枚举
 */
export enum MemberLevel {
  Bronze = 'BRONZE',
  Silver = 'SILVER',
  Gold = 'GOLD',
  Platinum = 'PLATINUM',
  Diamond = 'DIAMOND'
}

/**
 * 会员状态枚举
 */
export enum MemberStatus {
  Active = 'ACTIVE',
  Frozen = 'FROZEN',
  Expired = 'EXPIRED',
  Blacklisted = 'BLACKLISTED'
}

/**
 * 会员实体核心属性
 */
export interface MemberProfile {
  /** 会员唯一标识 */
  memberId: string
  /** 绑定的用户账号 ID */
  userId?: string
  /** 租户上下文 */
  tenantContext: RequestTenantContext
  /** 登录手机号 */
  mobile?: string
  /** 会员昵称 */
  nickname: string
  /** 联系邮箱 */
  email?: string
  /** 联系地址 */
  address?: string
  /** 内部备注 */
  notes?: string
  /** 会员等级 */
  level: MemberLevel
  /** 会员状态 */
  status: MemberStatus
  /** 积分余额 */
  points: number
  /** 成长值 */
  growthValue?: number
  /** SVIP 状态 */
  svipStatus?: string
  /** 注册时间 */
  registeredAt: string
  /** 最后活跃时间 */
  lastActiveAt?: string
  /** 生命周期阶段 */
  lifecycleStage?: 'prospect' | 'newly-paid' | 'repeat-paid' | 'vip-active'
  /** 运营标签 */
  tags?: string[]
  /** 最近一次支付时间 */
  lastPaymentAt?: string
  /** 最近一次支付金额 */
  lastPaymentAmount?: number
  /** 最近一次支付订单 */
  lastPaymentOrderId?: string
  /** 最近一次支付渠道 */
  lastPaymentChannel?: string
  /** 数据来源 */
  source?: 'memory' | 'prisma'
  /** 是否来自持久化存储 */
  persisted?: boolean
}

export interface LytMemberSnapshot {
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
  source?: 'memory' | 'prisma'
}

export interface MemberOperationsAction {
  code:
    | 'complete-member-onboarding'
    | 'send-post-payment-welcome'
    | 'issue-bounce-back-coupon'
    | 'recommend-repeat-purchase-bundle'
    | 'invite-loyalty-challenge'
    | 'assign-vip-concierge'
    | 'push-new-arrival-preview'
    | 'deliver-channel-follow-up'
  label: string
  reason: string
  channel: 'coupon' | 'crm-task' | 'wechat' | 'app-push'
  priority: 'high' | 'medium' | 'low'
}

export interface MemberAutomationTrigger {
  code:
    | 'payment-success-journey'
    | 'newly-paid-bounce-back'
    | 'repeat-paid-retention'
    | 'vip-service-upgrade'
    | 'channel-retouch'
  status: 'ready' | 'watch'
  source: 'payment-success' | 'lifecycle' | 'tag'
  reason: string
}

export interface MemberOperationsProfile {
  memberId: string
  tenantContext: RequestTenantContext
  level: MemberLevel
  status: MemberStatus
  lifecycleStage: NonNullable<MemberProfile['lifecycleStage']> | 'prospect'
  audienceSegments: string[]
  recommendedActions: MemberOperationsAction[]
  automationTriggers: MemberAutomationTrigger[]
  lastPaymentAt?: string
  lastPaymentAmount?: number
  lastPaymentChannel?: string
  tags: string[]
  source?: 'memory' | 'prisma'
}

export interface MemberOperationsTask {
  taskId: string
  tenantContext: RequestTenantContext
  memberId: string
  actionCode: MemberOperationsAction['code']
  title: string
  reason: string
  channel: MemberOperationsAction['channel']
  priority: MemberOperationsAction['priority']
  status: 'queued' | 'dispatched' | 'completed'
  executionLane: 'campaign-execution' | 'member-crm' | 'promo-conversion'
  source: 'payment-success' | 'manual-refresh'
  sourceOrderId?: string
  sourcePaymentId?: string
  executionSummary?: string
  executionTargetId?: string
  executedAt?: string
  dedupeKey: string
  createdAt: string
  scheduledAt: string
}

export interface MemberOperationsExecutionReceipt {
  executionId: string
  tenantContext: RequestTenantContext
  memberId: string
  taskId: string
  actionCode: MemberOperationsAction['code']
  targetType: 'coupon-offer' | 'crm-follow-up'
  targetId: string
  status: 'completed'
  summary: string
  payload: Record<string, unknown>
  runtimeReceiptCode?: string
  runtimeState?: 'blocked' | 'challenge-issued' | 'submitted' | 'callback-recorded' | 'replay-scheduled'
  runtimeReplayable?: boolean
  executedAt: string
}

export interface MemberProfileMutationHistoryEntry {
  historyId: string
  tenantContext: RequestTenantContext
  memberId: string
  action:
    | 'profile-updated'
    | 'status-updated'
    | 'level-updated'
    | 'points-awarded'
    | 'points-rolled-back'
    | 'payment-activity-recorded'
    | 'approval.approved'
    | 'approval.rejected'
    | 'approval.cancelled'
    | 'approval.executed'
    | 'approval.execution-failed'
    | 'approval.resubmitted'
    | 'approval.superseded'
  summary: string
  sourceChannel: string
  operatorId: string
  payload?: Record<string, unknown>
  beforeValue?: Record<string, unknown>
  afterValue?: Record<string, unknown>
  createdAt: string
}

export interface MemberMutationApprovalResult {
  memberId: string
  applied: false
  approvalRequired: true
  approvalTicket: string | null
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED' | 'NOT_REQUIRED'
  operation: string
  summary: string
}

/**
 * 会员 bootstrap 响应
 */
export interface MemberBootstrap {
  tenantContext: RequestTenantContext
  capabilities: string[]
  phase: string
}

export interface MemberSession {
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

export interface MemberLoginResult {
  member: MemberProfile
  session: MemberSession
}

/**
 * 会员等级对应的最低积分阈值
 */
export const MEMBER_LEVEL_THRESHOLDS: Record<MemberLevel, number> = {
  [MemberLevel.Bronze]: 0,
  [MemberLevel.Silver]: 500,
  [MemberLevel.Gold]: 2000,
  [MemberLevel.Platinum]: 10000,
  [MemberLevel.Diamond]: 50000
}

/**
 * 根据积分计算会员等级
 */
export function computeMemberLevel(points: number): MemberLevel {
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond]) return MemberLevel.Diamond
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum]) return MemberLevel.Platinum
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold]) return MemberLevel.Gold
  if (points >= MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver]) return MemberLevel.Silver
  return MemberLevel.Bronze
}

/**
 * 判断会员是否可以升级
 */
export function canUpgrade(currentLevel: MemberLevel, points: number): boolean {
  const computed = computeMemberLevel(points)
  const levels = Object.values(MemberLevel)
  return levels.indexOf(computed) > levels.indexOf(currentLevel)
}

/**
 * 构造默认 member bootstrap
 */
export function makeMemberBootstrap(
  tenantContext: RequestTenantContext,
  overrides: Partial<Pick<MemberBootstrap, 'capabilities' | 'phase'>> = {}
): MemberBootstrap {
  return {
    tenantContext,
    capabilities: ['member-center', 'points', 'svip', 'blind-box'],
    phase: 'scaffold',
    ...overrides
  }
}
